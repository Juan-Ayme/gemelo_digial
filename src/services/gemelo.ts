import { nuevoEvento } from "@services/eventoFactory";
import { guardarEventos, leerEventosDesde } from "@services/eventStore";
import { diaDelEvento, fechaLocal, resumirEventos } from "@services/metricas";

import { supabase } from "@lib/supabase";
import { isRemote } from "@services/mode";
import { TABLES, OWNER_COL } from "@services/schema";
import { lget, lset } from "@services/localDb";
import {
  ACTIVIDAD_LABELS,
  type ActividadPredicha,
  type EventoRow,
  type FuenteEstado,
  type GemeloSnapshot,
  type Prediccion,
  type RutinaBloque,
} from "@services/types";
import { extraerFeatures, predecirPorReglas } from "@services/rfModel";
import { calcularVariacionRutina } from "@services/lineaBase";

// Fuente de la predicción vigente
export type FuentePrediccion = "rf" | "reglas" | "rf_local" | "heuristica";

const ACTIVIDADES: ActividadPredicha[] = [
  "desplazamiento",
  "trabajo",
  "estudio",
  "descanso",
  "actividad_fisica",
  "ocio",
  "permanencia",
];
const ZONAS = ["Hogar", "Trabajo", "Tránsito", "Zona común"];

// --- Lectura / escritura ---------------------------------------------------

function inicioDeHoy(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function fetchEventsToday(userId: string): Promise<EventoRow[]> {
  const desde = inicioDeHoy();
  const list = await leerEventosDesde(userId, desde);
  return list.filter(e => diaDelEvento(e) === fechaLocal(desde));
}

/** Genera un evento sintético coherente (mientras no hay APIs nativas). */
export function generarEventoSimulado(): EventoRow {
  const now = new Date();
  const minutos = 10 + Math.round(Math.random() * 40);
  const inicio = new Date(now.getTime() - minutos * 60000);
  const actividad = ACTIVIDADES[Math.floor(Math.random() * ACTIVIDADES.length)];
  const esPaso = actividad === "desplazamiento" || actividad === "actividad_fisica";

  return nuevoEvento({
    procedencia: "sistema",
    tipo_evento: "ventana_actividad",
    inicio_en: inicio.toISOString(),
    fin_en: now.toISOString(),
    valor_numerico: esPaso ? 80 + Math.round(Math.random() * 240) : null,
    valor_texto: actividad,
    unidad: esPaso ? "pasos" : null,
    confianza: 60 + Math.round(Math.random() * 39),
    zona_general: ZONAS[Math.floor(Math.random() * ZONAS.length)],
    medido_directamente: false,
    disponibilidad: true,
    calidad: 60 + Math.round(Math.random() * 39),
    version_consentimiento: "v1.0",
    datos_minimos: { minutos, simulado: true },
  });
}

export async function insertEventoSimulado(userId: string): Promise<void> {
  if (isRemote()) throw new Error("Los ejemplos solo están disponibles en modo demo.");
  await insertEventos(userId, [generarEventoSimulado()]);
}

/** Inserta uno o varios eventos (real desde sensores, o simulados). */
export async function insertEventos(userId: string, eventos: EventoRow[]): Promise<void> {
  if (!eventos.length) return;
  await guardarEventos(userId, eventos);
  // Los contadores se confirman solo después de persistir los eventos localmente.
  for (const e of eventos) {
    const key = e.datos_minimos.contador_clave;
    const total = e.datos_minimos.contador_total;
    const date = e.datos_minimos.contador_fecha;
    if (typeof key === "string" && typeof total === "number" && typeof date === "string") {
      await lset(key, { date, total });
    }
  }
}

// --- Derivaciones puras (selectors de TanStack Query) ----------------------

export function buildGemelo(events: EventoRow[], history: EventoRow[] = []): GemeloSnapshot {
  const sorted = [...events].filter(e => e.disponibilidad).sort((a, b) => a.inicio_en.localeCompare(b.inicio_en));

  const metrics = resumirEventos(sorted);
  const { pasosHoy, minutosActivos, minutosDescanso, minutosSueno } = metrics;

  const last = sorted[sorted.length - 1];
  const confs = sorted
    .map((e) => e.confianza)
    .filter((c): c is number => typeof c === "number");
  const calidadProm = confs.length
    ? Math.round(confs.reduce((a, b) => a + b, 0) / confs.length)
    : 0;

  const hayActividad = sorted.some((e) => e.tipo_evento === "ventana_actividad");
  const hayPasos = metrics.tienePasos;
  const hayZona = sorted.some((e) => Boolean(e.zona_general));
  const haySueno = sorted.some((e) => e.tipo_evento === "sueno");
  const hayRitmo = sorted.some((e) => e.tipo_evento === "ritmo_cardiaco");
  const fuentes: FuenteEstado[] = [
    { codigo: "activity", nombre: "Actividad", disponible: hayActividad, calidad: hayActividad ? calidadProm : 0 },
    { codigo: "steps", nombre: "Pasos", disponible: hayPasos, calidad: hayPasos ? calidadProm : 0 },
    { codigo: "zone", nombre: "Zona general", disponible: hayZona, calidad: hayZona ? calidadProm : 0 },
    { codigo: "sleep", nombre: "Sueño", disponible: haySueno, calidad: haySueno ? calidadProm : 0 },
    { codigo: "wearable", nombre: "Wearable / ritmo", disponible: hayRitmo, calidad: hayRitmo ? 90 : 0 },
  ];

  const lastWithZone = [...sorted].reverse().find((e) => Boolean(e.zona_general));
  const actEvents = sorted.filter((e) => e.tipo_evento === "ventana_actividad" && Boolean(e.valor_texto));
  const lastAct = actEvents[actEvents.length - 1]?.valor_texto ?? null;
  const prevAct = actEvents[actEvents.length - 2]?.valor_texto ?? null;

  // Estimación por reglas generales; el modelo entrenado se consulta aparte.
  const feat = extraerFeatures({
    actividadActual: lastAct,
    actividadAnterior: prevAct,
    pasosVentana: Math.round(sorted.filter(e => e.unidad === "pasos" && !e.datos_minimos.calibracion_humana && Date.parse(e.inicio_en) >= Date.now() - 30 * 60000).reduce((a, e) => a + Math.max(0, e.valor_numerico ?? 0), 0)),
    zonaGeneral: lastWithZone?.zona_general,
  });

  const lastActivity = actEvents[actEvents.length - 1];
  const recentActivity = lastActivity && Date.now() - Date.parse(lastActivity.inicio_en) <= 30 * 60000 && Date.parse(lastActivity.inicio_en) <= Date.now();
  const predRFLocal = recentActivity ? predecirPorReglas(feat) : null;
  const analisis = calcularVariacionRutina(sorted, new Date(), history);

  return {
    pasosHoy: Math.round(pasosHoy),
    minutosActivos: Math.round(minutosActivos),
    minutosDescanso: Math.round(minutosDescanso),
    minutosSueno,
    tieneDuracionActividad: metrics.tieneDuracionActividad,
    ultimaLectura: last?.inicio_en ?? null,
    ultimaActividadEn: lastActivity?.inicio_en ?? null,
    zonaActual: lastWithZone?.zona_general ?? "—",
    ultimaActividad: (lastAct as ActividadPredicha) ?? null,
    prediccion: predRFLocal,
    variacion: analisis.nivel,
    fuentes,
    totalEventos: metrics.totalEventos,
    fuentePrediccion: "reglas",
    analisisVariacion: analisis,
  };
}

export function buildRutina(events: EventoRow[]): RutinaBloque[] {
  // Solo procesar eventos que corresponden a ventanas de actividad
  const activityEvents = events.filter((e) => {
    if (!e.disponibilidad) return false;
    if (e.tipo_evento === "ventana_actividad") return true;
    if (e.valor_texto && e.tipo_evento !== "pasos" && e.tipo_evento !== "sueno" && e.tipo_evento !== "ritmo_cardiaco") {
      return true;
    }
    return false;
  });

  const sorted = [...activityEvents].sort((a, b) => a.inicio_en.localeCompare(b.inicio_en));
  if (!sorted.length) return [];

  const intensidadDe = (act: string): number => {
    switch (act) {
      case "actividad_fisica": return 0.9;
      case "desplazamiento":   return 0.7;
      case "trabajo":          return 0.55;
      case "estudio":          return 0.5;
      case "ocio":             return 0.4;
      case "permanencia":      return 0.3;
      case "descanso":         return 0.25;
      default:                 return 0.4;
    }
  };

  const formatHora = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const formatZona = (z: string | null | undefined): string => {
    if (!z) return "Sin zona";
    return z.startsWith("Zona") ? z : `Zona ${z}`;
  };

  // Agrupamiento inteligente (clustering) de ventanas consecutivas con la misma actividad
  type Cluster = {
    actividad: ActividadPredicha;
    inicio: string;
    fin: string;
    zona: string | null;
    confianzas: number[];
    count: number;
  };

  const clusters: Cluster[] = [];

  for (const ev of sorted) {
    const act = (ev.valor_texto as ActividadPredicha) ?? "permanencia";
    const lastCluster = clusters[clusters.length - 1];

    const evInicio = new Date(ev.inicio_en).getTime();
    const lastFin = lastCluster ? new Date(lastCluster.fin).getTime() : 0;
    const timeDiffMin = lastCluster ? (evInicio - lastFin) / 60000 : 999;

    if (lastCluster && lastCluster.actividad === act && timeDiffMin <= 0 && new Date(ev.fin_en ?? ev.inicio_en).getTime() > new Date(ev.inicio_en).getTime()) {
      lastCluster.fin = new Date(Math.max(Date.parse(lastCluster.fin), Date.parse(ev.fin_en ?? ev.inicio_en))).toISOString();
      if (ev.zona_general && !lastCluster.zona) {
        lastCluster.zona = ev.zona_general;
      }
      if (typeof ev.confianza === "number") {
        lastCluster.confianzas.push(ev.confianza);
      }
      lastCluster.count += 1;
    } else {
      clusters.push({
        actividad: act,
        inicio: ev.inicio_en,
        fin: ev.fin_en ?? ev.inicio_en,
        zona: ev.zona_general ?? null,
        confianzas: typeof ev.confianza === "number" ? [ev.confianza] : [],
        count: 1,
      });
    }
  }

  return clusters.map((c) => {
    const horaInicio = formatHora(c.inicio);
    const horaFin = formatHora(c.fin);
    const duracionMin = Math.max(
      0,
      Math.round((new Date(c.fin).getTime() - new Date(c.inicio).getTime()) / 60000)
    );

    const horaLabel = horaInicio === horaFin ? horaInicio : `${horaInicio} – ${horaFin}`;
    const avgConf = c.confianzas.length
      ? Math.round(c.confianzas.reduce((a, b) => a + b, 0) / c.confianzas.length)
      : null;

    const zonaStr = formatZona(c.zona);
    const confStr = avgConf !== null ? ` · ${avgConf}%` : "";
    const durStr = duracionMin > 1 ? ` · ${duracionMin} min` : (c.count > 1 ? ` · ${c.count} ventanas` : "");

    return {
      hora: horaLabel,
      horaInicio,
      horaFin: horaInicio !== horaFin ? horaFin : undefined,
      duracionMin,
      actividad: ACTIVIDAD_LABELS[c.actividad] ?? c.actividad,
      tipoActividad: c.actividad,
      detalle: `${zonaStr}${confStr}${durStr}`,
      zona: c.zona,
      confianza: avgConf,
      intensidad: intensidadDe(c.actividad),
      cantidadVentanas: c.count,
    };
  });
}

// --- Predicción del pipeline Random Forest -----------------------------------

const ACTIVIDADES_VALIDAS = new Set<string>([
  "desplazamiento", "trabajo", "estudio", "descanso",
  "actividad_fisica", "ocio", "permanencia",
]);

/**
 * Lee la predicción más reciente con estado "vigente" desde la tabla
 * `predicciones` de Supabase (escrita por el pipeline PySpark).
 *
 * Devuelve `null` si:
 *  - la app está en modo demo (sin Supabase),
 *  - el pipeline aún no escribió ninguna predicción para el usuario,
 *  - la fila contiene un valor de actividad desconocido.
 *
 * En cualquier caso de `null`, `useGemelo` cae automáticamente a la
 * estimación por reglas generales del teléfono.
 */
export async function fetchPrediccionRF(
  userId: string,
): Promise<{ prediccion: Prediccion; fuente: "rf" } | null> {
  if (!isRemote()) return null;

  const { data, error } = await supabase!
    .from(TABLES.predicciones)
    .select(
      "actividad_predicha, probabilidad, horizonte_minutos, variables_relevantes, explicacion, generada_en, estado",
    )
    .eq(OWNER_COL, userId)
    .order("generada_en", { ascending: false })
    .limit(1)
    .maybeSingle(); // null cuando 0 filas, nunca lanza PGRST116

  if (error || !data) return null;
  const estadoRow = String(data.estado ?? "");
  if (estadoRow === "expirada" || estadoRow === "descartada" || estadoRow === "inactiva") return null;

  const age = Date.now() - Date.parse(data.generada_en ?? "");
  const horizon = Number(data.horizonte_minutos);
  if (!Number.isFinite(age) || age < -60000 || !Number.isFinite(horizon) || horizon <= 0 || age > horizon * 60000) return null;
  const probability = Number(data.probabilidad);
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) return null;
  const actividad = data.actividad_predicha as string;
  if (!ACTIVIDADES_VALIDAS.has(actividad)) return null;

  let variablesRelevantes: string[] = [];
  try {
    const raw = data.variables_relevantes;
    variablesRelevantes = Array.isArray(raw) ? raw : JSON.parse(raw ?? "[]");
  } catch {
    variablesRelevantes = [];
  }

  return {
    fuente: "rf",
    prediccion: {
      actividad: actividad as ActividadPredicha,
      probabilidad: Number(data.probabilidad ?? 0),
      horizonteMin: Number(data.horizonte_minutos ?? 30),
      variablesRelevantes,
      explicacion: data.explicacion ?? "Predicción del modelo Random Forest.",
      generadaEn: data.generada_en ?? new Date().toISOString(),
    },
  };
}
