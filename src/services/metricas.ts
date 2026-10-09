import type { EventoRow } from "@services/types";

/** Las fechas de la rutina pertenecen al día local del teléfono, no al día UTC. */
export function fechaLocal(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function diaDelEvento(e: EventoRow): string {
  return fechaLocal(e.tipo_evento === "sueno" && e.fin_en ? e.fin_en : e.inicio_en);
}

export function eventosUnicos(events: EventoRow[]): EventoRow[] {
  return [...new Map(events.map(e => [e.evento_uuid, e])).values()];
}

function intervalosMin(events: EventoRow[]): number {
  const intervals = events.map(e => [Date.parse(e.inicio_en), Date.parse(e.fin_en ?? e.inicio_en)])
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a)
    .sort((a, b) => a[0] - b[0]);
  let minutes = 0, end = -Infinity;
  for (const [a, b] of intervals) { minutes += Math.max(0, b - Math.max(a, end)) / 60000; end = Math.max(end, b); }
  return minutes;
}

/** Una observación puntual no demuestra 15 minutos de actividad ni una noche de sueño. */
export function resumirEventos(input: EventoRow[]) {
  const events = eventosUnicos(input).filter(e => e.disponibilidad);
  const activity = events.filter(e => e.tipo_evento === "ventana_actividad");
  const sleep = events.filter(e => e.tipo_evento === "sueno");
  const sessions = sleep.filter(e => e.datos_minimos.sesion_sueno === true);
  // Lecturas antiguas de HC eran totales acumulados del día: no se suman entre sí.
  const minutosSueno = sessions.length ? intervalosMin(sessions)
    : Math.max(0, ...sleep.map(e => e.valor_numerico ?? 0));
  const active = activity.filter(e => ["desplazamiento", "actividad_fisica"].includes(e.valor_texto ?? ""));
  const rest = activity.filter(e => e.valor_texto === "descanso");
  const pasos = events.filter(e => e.unidad === "pasos" && e.valor_numerico !== null && !e.datos_minimos.calibracion_humana);
  const acumulados = pasos.filter(e => typeof e.datos_minimos.contador_total === "number");
  const independientes = pasos.filter(e => typeof e.datos_minimos.contador_total !== "number");
  // Pasos acumulados del día: el máximo evita duplicar reintentos y fuentes solapadas.
  const pasosHoy = Math.max(0, ...acumulados.map(e => Number(e.datos_minimos.contador_total)))
    + independientes.reduce((sum, e) => sum + Math.max(0, e.valor_numerico ?? 0), 0);
  const confs = activity.map(e => e.confianza).filter((c): c is number => c !== null);
  return {
    pasosHoy: Math.round(pasosHoy),
    minutosActivos: Math.round(intervalosMin(active)),
    minutosDescanso: Math.round(intervalosMin(rest)),
    minutosSueno: Math.round(minutosSueno),
    tienePasos: pasos.length > 0,
    tieneSueno: sleep.length > 0,
    tieneDuracionActividad: activity.some(e => Date.parse(e.fin_en ?? e.inicio_en) > Date.parse(e.inicio_en)),
    totalEventos: events.length,
    confianzaPromedio: confs.length ? Math.round(confs.reduce((a, b) => a + b, 0) / confs.length) : 0,
  };
}
