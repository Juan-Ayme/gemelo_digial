/**
 * ando · Gemelo Digital — Alertas de salud
 * =========================================
 *
 * Función pura que combina dos fuentes:
 *   1. GemeloSnapshot  → datos crudos del día (pasos, sueño, bpm, minutos activos)
 *   2. Prediccion (RF) → qué actividad anticipa el gemelo a continuación
 *
 * Resultado: lista de AlertaSalud ordenada por prioridad.
 *
 * Reglas de diseño:
 *   - Sin efectos secundarios: no llama a APIs ni modifica estado.
 *   - Informativa, nunca diagnóstica ("puede indicar", no "tienes").
 *   - Los umbrales siguen recomendaciones OMS / AHA públicas.
 *   - Las alertas médicas (bpm) siempre sugieren consultar un médico.
 */

import type { GemeloSnapshot, ActividadPredicha } from "@services/types";

// ─── Tipos públicos ──────────────────────────────────────────────────────────

export type TipoAlerta = "advertencia" | "info" | "ok" | "peligro";

export type CategoriaAlerta =
  | "pasos"
  | "actividad"
  | "sueno"
  | "cardiaco"
  | "sedentarismo"
  | "combinada";

export type AlertaSalud = {
  id: string;
  tipo: TipoAlerta;
  categoria: CategoriaAlerta;
  titulo: string;
  detalle: string;
  /** 0-100: porcentaje de progreso para la barra visual (null = sin barra). */
  progreso: number | null;
  /** Texto del badge de categoría. */
  badge: string;
  /** Si true, el usuario puede descartar la alerta con un tap. */
  descartable: boolean;
  /**
   * true cuando la alerta combina datos del sensor CON la predicción del RF.
   * Permite mostrarlo en la UI ("Combinada con gemelo").
   */
  usaPrediccion: boolean;
};

// ─── Umbrales (OMS / AHA) ────────────────────────────────────────────────────

const UMBRALES = {
  pasos: {
    meta: 8_000,
    minimo: 3_000,
  },
  actividad: {
    minutosMinOMS: 30,
  },
  sueno: {
    minOMS: 7 * 60,   // 420 min = 7 h
    maxOMS: 9 * 60,   // 540 min = 9 h
    critico: 5 * 60,  // 300 min = 5 h
  },
  cardiaco: {
    altoReposo: 100,  // bpm
    bajoReposo: 50,   // bpm
  },
  sedentarismo: {
    maxMinSinMoverse: 90, // minutos consecutivos de "permanencia"
  },
} as const;

// ─── Actividades que implican movimiento ─────────────────────────────────────

const ACTIVAS = new Set<ActividadPredicha>([
  "desplazamiento",
  "actividad_fisica",
]);

const INACTIVAS = new Set<ActividadPredicha>([
  "descanso",
  "permanencia",
]);

// ─── Lógica principal ────────────────────────────────────────────────────────

/**
 * Genera las alertas de salud del día a partir del snapshot del gemelo.
 * Se puede llamar directamente desde un selector de TanStack Query.
 *
 * @param snapshot  GemeloSnapshot devuelto por buildGemelo()
 * @param bpmActual Frecuencia cardíaca promedio de hoy (EventoRow tipo "ritmo_cardiaco")
 * @param minSedentarios Minutos consecutivos en "permanencia" (calculado externamente)
 */
export function generarAlertas(
  snapshot: GemeloSnapshot,
  bpmActual: number | null = null,
  minSedentarios: number = 0,
): AlertaSalud[] {
  const alertas: AlertaSalud[] = [];
  const pred = snapshot.prediccion;
  const actividadSiguiente = pred?.actividad ?? null;
  const enBreve = (pred?.horizonteMin ?? 999) <= 30;

  // ── 1. PASOS ────────────────────────────────────────────────────────────────

  const pasos = snapshot.pasosHoy;
  const progresoPasos = Math.min(100, Math.round((pasos / UMBRALES.pasos.meta) * 100));

  if (pasos >= UMBRALES.pasos.meta) {
    alertas.push({
      id: "pasos-ok",
      tipo: "ok",
      categoria: "pasos",
      titulo: "¡Meta de pasos alcanzada!",
      detalle: `${pasos.toLocaleString("es-PE")} pasos · objetivo ${UMBRALES.pasos.meta.toLocaleString("es-PE")} completado`,
      progreso: 100,
      badge: "Pasos",
      descartable: false,
      usaPrediccion: false,
    });
  } else if (pasos < UMBRALES.pasos.minimo) {
    // Alerta combinada: si el gemelo anticipa inactividad, es urgente moverse AHORA
    const proximoInactivo =
      actividadSiguiente !== null && INACTIVAS.has(actividadSiguiente) && enBreve;

    alertas.push({
      id: "pasos-bajo",
      tipo: proximoInactivo ? "peligro" : "advertencia",
      categoria: proximoInactivo ? "combinada" : "pasos",
      titulo: proximoInactivo
        ? "Pocos pasos y tu gemelo anticipa reposo"
        : "Llevas pocos pasos hoy",
      detalle: proximoInactivo
        ? `Solo ${pasos.toLocaleString("es-PE")} pasos · Tu gemelo prevé "${pred?.actividad}" en ~${pred?.horizonteMin} min. Muévete antes de que llegue.`
        : `${pasos.toLocaleString("es-PE")} / ${UMBRALES.pasos.meta.toLocaleString("es-PE")} · ${progresoPasos}% completado`,
      progreso: progresoPasos,
      badge: proximoInactivo ? "Combinada" : "Pasos",
      descartable: false,
      usaPrediccion: proximoInactivo,
    });
  } else {
    // Entre mínimo y meta: alerta suave
    alertas.push({
      id: "pasos-progreso",
      tipo: "info",
      categoria: "pasos",
      titulo: "Vas bien, sigue moviéndote",
      detalle: `${pasos.toLocaleString("es-PE")} / ${UMBRALES.pasos.meta.toLocaleString("es-PE")} · faltan ${(UMBRALES.pasos.meta - pasos).toLocaleString("es-PE")} pasos`,
      progreso: progresoPasos,
      badge: "Pasos",
      descartable: true,
      usaPrediccion: false,
    });
  }

  // ── 2. ACTIVIDAD (minutos activos OMS) ──────────────────────────────────────

  if (snapshot.minutosActivos < UMBRALES.actividad.minutosMinOMS) {
    const proximoActivo =
      actividadSiguiente !== null && ACTIVAS.has(actividadSiguiente) && enBreve;

    alertas.push({
      id: "actividad-baja",
      tipo: proximoActivo ? "info" : "advertencia",
      categoria: proximoActivo ? "combinada" : "actividad",
      titulo: proximoActivo
        ? "Tu gemelo anticipa actividad física próxima"
        : "Pocos minutos activos hoy",
      detalle: proximoActivo
        ? `${snapshot.minutosActivos} min activos · Se espera "${pred?.actividad}" en ~${pred?.horizonteMin} min. Estira antes.`
        : `${snapshot.minutosActivos} min · La OMS recomienda al menos ${UMBRALES.actividad.minutosMinOMS} min de actividad diaria`,
      progreso: Math.min(100, Math.round((snapshot.minutosActivos / UMBRALES.actividad.minutosMinOMS) * 100)),
      badge: proximoActivo ? "Combinada" : "Actividad",
      descartable: false,
      usaPrediccion: proximoActivo,
    });
  }

  // ── 3. SUEÑO ────────────────────────────────────────────────────────────────

  const minSueno = snapshot.minutosDescanso;

  if (minSueno > 0) {
    const horasSueno = (minSueno / 60).toFixed(1);

    if (minSueno < UMBRALES.sueno.critico) {
      // Combinada: si además viene trabajo/estudio, es prioritario alertar
      const proximoExigente =
        actividadSiguiente === "trabajo" ||
        actividadSiguiente === "estudio";

      alertas.push({
        id: "sueno-critico",
        tipo: "peligro",
        categoria: proximoExigente ? "combinada" : "sueno",
        titulo: proximoExigente
          ? `Dormiste poco y viene ${pred?.actividad}`
          : "Sueño muy corto",
        detalle: proximoExigente
          ? `${horasSueno} h de sueño · Tu gemelo anticipa "${pred?.actividad}". Tómate una pausa activa antes.`
          : `${horasSueno} h · Menos de 5 h puede afectar seriamente la concentración y el sistema inmune`,
        progreso: Math.round((minSueno / UMBRALES.sueno.minOMS) * 100),
        badge: proximoExigente ? "Combinada" : "Sueño",
        descartable: false,
        usaPrediccion: proximoExigente,
      });
    } else if (minSueno < UMBRALES.sueno.minOMS) {
      alertas.push({
        id: "sueno-bajo",
        tipo: "advertencia",
        categoria: "sueno",
        titulo: "Sueño por debajo del objetivo",
        detalle: `${horasSueno} h · La OMS recomienda 7-9 h para adultos`,
        progreso: Math.round((minSueno / UMBRALES.sueno.minOMS) * 100),
        badge: "Sueño",
        descartable: false,
        usaPrediccion: false,
      });
    } else if (minSueno > UMBRALES.sueno.maxOMS) {
      alertas.push({
        id: "sueno-exceso",
        tipo: "info",
        categoria: "sueno",
        titulo: "Sueño prolongado",
        detalle: `${horasSueno} h · Más de 9 h puede indicar fatiga acumulada`,
        progreso: null,
        badge: "Sueño",
        descartable: true,
        usaPrediccion: false,
      });
    } else {
      alertas.push({
        id: "sueno-ok",
        tipo: "ok",
        categoria: "sueno",
        titulo: "Buen descanso anoche",
        detalle: `${horasSueno} h · Dentro del rango recomendado`,
        progreso: null,
        badge: "Sueño",
        descartable: false,
        usaPrediccion: false,
      });
    }
  }

  // ── 4. FRECUENCIA CARDÍACA ───────────────────────────────────────────────────

  if (bpmActual !== null && bpmActual > 0) {
    if (bpmActual > UMBRALES.cardiaco.altoReposo) {
      // Combinada crítica: viene actividad física con bpm ya elevado
      const proximoFisico =
        actividadSiguiente === "actividad_fisica" && enBreve;

      alertas.push({
        id: "bpm-alto",
        tipo: "peligro",
        categoria: proximoFisico ? "combinada" : "cardiaco",
        titulo: proximoFisico
          ? "Ritmo elevado antes de actividad física"
          : "Frecuencia cardíaca elevada en reposo",
        detalle: proximoFisico
          ? `${bpmActual} bpm · Tu gemelo anticipa "${pred?.actividad}". Hidratate y consulta un médico si persiste.`
          : `${bpmActual} bpm · Por encima de 100 bpm en reposo. Si persiste, consulta un médico.`,
        progreso: null,
        badge: proximoFisico ? "Combinada" : "Cardíaco",
        descartable: false,
        usaPrediccion: proximoFisico,
      });
    } else if (bpmActual < UMBRALES.cardiaco.bajoReposo) {
      alertas.push({
        id: "bpm-bajo",
        tipo: "advertencia",
        categoria: "cardiaco",
        titulo: "Frecuencia cardíaca baja",
        detalle: `${bpmActual} bpm · Normal en atletas. Fuera de ese contexto, consulta un médico.`,
        progreso: null,
        badge: "Cardíaco",
        descartable: false,
        usaPrediccion: false,
      });
    } else {
      alertas.push({
        id: "bpm-ok",
        tipo: "ok",
        categoria: "cardiaco",
        titulo: "Frecuencia cardíaca normal",
        detalle: `${bpmActual} bpm · Rango saludable en reposo`,
        progreso: null,
        badge: "Fisiología",
        descartable: false,
        usaPrediccion: false,
      });
    }
  }

  // ── 5. SEDENTARISMO PROLONGADO ───────────────────────────────────────────────

  if (minSedentarios >= UMBRALES.sedentarismo.maxMinSinMoverse) {
    const proximoSigue =
      actividadSiguiente !== null && INACTIVAS.has(actividadSiguiente) && enBreve;

    alertas.push({
      id: "sedentarismo",
      tipo: proximoSigue ? "peligro" : "advertencia",
      categoria: proximoSigue ? "combinada" : "sedentarismo",
      titulo: proximoSigue
        ? "Llevas mucho tiempo quieto y el gemelo anticipa más reposo"
        : `Sin moverte hace ${minSedentarios} min`,
      detalle: proximoSigue
        ? `${minSedentarios} min sin moverte · Se espera "${pred?.actividad}" después. Levántate ahora.`
        : "Levántate unos minutos. El movimiento frecuente mejora la energía y la circulación.",
      progreso: null,
      badge: proximoSigue ? "Combinada" : "Consejo",
      descartable: true,
      usaPrediccion: proximoSigue,
    });
  }

  // ── Ordenar: peligro → advertencia → info → ok ──────────────────────────────

  const prioridad: Record<TipoAlerta, number> = {
    peligro: 0,
    advertencia: 1,
    info: 2,
    ok: 3,
  };

  return alertas.sort((a, b) => prioridad[a.tipo] - prioridad[b.tipo]);
}
