import * as Crypto from "expo-crypto";

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

  if (!isRemote()) {
    const list = await lget<EventoRow[]>(`events:${userId}`, []);
    return list.filter((e) => new Date(e.inicio_en) >= desde);
  }

  const { data, error } = await supabase!
    .from(TABLES.eventosCrudos)
    .select("*")
    .eq(OWNER_COL, userId)
    .gte("inicio_en", desde.toISOString())
    .order("inicio_en", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventoRow[];
}

/** Genera un evento sintético coherente (mientras no hay APIs nativas). */
export function generarEventoSimulado(): EventoRow {
  const now = new Date();
  const minutos = 10 + Math.round(Math.random() * 40);
  const inicio = new Date(now.getTime() - minutos * 60000);
  const actividad = ACTIVIDADES[Math.floor(Math.random() * ACTIVIDADES.length)];
  const esPaso = actividad === "desplazamiento" || actividad === "actividad_fisica";

  return {
    evento_uuid: Crypto.randomUUID(),
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
  };
}

export async function insertEventoSimulado(userId: string): Promise<void> {
  await insertEventos(userId, [generarEventoSimulado()]);
}

/** Inserta uno o varios eventos (real desde sensores, o simulados). */
export async function insertEventos(userId: string, eventos: EventoRow[]): Promise<void> {
  if (!eventos.length) return;

  if (!isRemote()) {
    const list = await lget<EventoRow[]>(`events:${userId}`, []);
    list.push(...eventos);
    await lset(`events:${userId}`, list);
    return;
  }

  const rows = eventos.map((ev) => ({ [OWNER_COL]: userId, ...ev }));
  const { error } = await supabase!.from(TABLES.eventosCrudos).insert(rows);
  if (error) throw error;
}

// --- Derivaciones puras (selectors de TanStack Query) ----------------------

function duracionMin(e: EventoRow): number {
  if (e.fin_en) {
    return Math.max(0, (new Date(e.fin_en).getTime() - new Date(e.inicio_en).getTime()) / 60000);
  }
  const m = e.datos_minimos?.["minutos"];
  return typeof m === "number" ? m : 0;
}

/**
 * Predicción por heurística de frecuencia sobre las ventanas de hoy.
 * NO es el modelo Random Forest (eso es trabajo futuro del pipeline); sirve
 * para que la UI muestre algo coherente con los datos reales del titular.
 */
function heuristicPrediccion(events: EventoRow[]): Prediccion | null {
  const acts = events.map((e) => e.valor_texto).filter((a): a is string => Boolean(a));
  if (acts.length < 2) return null;

  const freq: Record<string, number> = {};
  for (const a of acts) freq[a] = (freq[a] ?? 0) + 1;
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0] as ActividadPredicha;
  const probabilidad = Math.min(0.95, 0.5 + (freq[top] / acts.length) * 0.5);

  return {
    actividad: top,
    probabilidad,
    horizonteMin: 30,
    variablesRelevantes: ["hora_del_dia", "actividad_actual", "zona_general", "pasos_ventana"],
    explicacion: `Según tus ventanas de hoy, "${ACTIVIDAD_LABELS[top] ?? top}" es tu actividad más frecuente. Heurística base; el modelo Random Forest llegará con más datos.`,
    generadaEn: new Date().toISOString(),
  };
}

export function buildGemelo(events: EventoRow[]): GemeloSnapshot {
  const sorted = [...events].sort((a, b) => a.inicio_en.localeCompare(b.inicio_en));

  const activo = new Set<string>(["desplazamiento", "actividad_fisica"]);
  const descanso = new Set<string>(["descanso", "permanencia"]);

  let pasosHoy = 0;
  let minutosActivos = 0;
  let minutosDescanso = 0;
  for (const e of sorted) {
    if (e.unidad === "pasos" && typeof e.valor_numerico === "number") pasosHoy += e.valor_numerico;
    if (e.tipo_evento === "sueno" && typeof e.valor_numerico === "number") minutosDescanso += e.valor_numerico;
    const act = e.valor_texto ?? "";
    if (activo.has(act)) minutosActivos += duracionMin(e);
    else if (descanso.has(act)) minutosDescanso += duracionMin(e);
  }

  const last = sorted[sorted.length - 1];
  const confs = sorted
    .map((e) => e.confianza)
    .filter((c): c is number => typeof c === "number");
  const calidadProm = confs.length
    ? Math.round(confs.reduce((a, b) => a + b, 0) / confs.length)
    : 0;

  const hayActividad = sorted.some((e) => Boolean(e.valor_texto));
  const hayPasos = sorted.some((e) => e.unidad === "pasos");
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

  return {
    pasosHoy: Math.round(pasosHoy),
    minutosActivos: Math.round(minutosActivos),
    minutosDescanso: Math.round(minutosDescanso),
    zonaActual: last?.zona_general ?? "—",
    ultimaActividad: (last?.valor_texto as ActividadPredicha) ?? null,
    prediccion: heuristicPrediccion(sorted),
    variacion: sorted.length < 3 ? "datos_insuficientes" : "estable",
    fuentes,
    totalEventos: sorted.length,
  };
}

export function buildRutina(events: EventoRow[]): RutinaBloque[] {
  const sorted = [...events].sort((a, b) => a.inicio_en.localeCompare(b.inicio_en));

  const intensidadDe = (act: string): number => {
    switch (act) {
      case "actividad_fisica":
        return 0.9;
      case "desplazamiento":
        return 0.7;
      case "trabajo":
        return 0.55;
      case "estudio":
        return 0.5;
      case "ocio":
        return 0.4;
      case "permanencia":
        return 0.3;
      case "descanso":
        return 0.25;
      default:
        return 0.4;
    }
  };

  return sorted.map((e) => {
    const d = new Date(e.inicio_en);
    const hora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const act = (e.valor_texto as ActividadPredicha) ?? "permanencia";
    const zona = e.zona_general ? `Zona ${e.zona_general}` : "Sin zona";
    const conf = typeof e.confianza === "number" ? ` · ${e.confianza}%` : "";
    return {
      hora,
      actividad: ACTIVIDAD_LABELS[act] ?? act,
      detalle: `${zona}${conf}`,
      intensidad: intensidadDe(act),
    };
  });
}
