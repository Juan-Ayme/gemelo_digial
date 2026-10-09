import { diaDelEvento, fechaLocal, resumirEventos } from "@services/metricas";
import type { EventoRow, NivelVariacion } from "@services/types";
export type AnalisisVariacion = { nivel: NivelVariacion; desviacionPct: number; explicacion: string; indiceConsistencia: number };
/** Compara registros a la misma hora con dias previos del titular. No usa metas generales. */
export function calcularVariacionRutina(events: EventoRow[], now = new Date(), history: EventoRow[] = []): AnalisisVariacion {
  const insufficient: AnalisisVariacion = { nivel: "datos_insuficientes", desviacionPct: 0, indiceConsistencia: 0,
    explicacion: "Necesitamos al menos tres dias previos con registros comparables. Una lectura aislada no describe tu rutina." };
  const current = resumirEventos(events), today = fechaLocal(now);
  const clock = now.getHours() * 60 + now.getMinutes();
  const previous: Record<string, EventoRow[]> = {};
  for (const e of history) {
    const day = diaDelEvento(e), d = new Date(e.inicio_en);
    if (day >= today || d.getHours() * 60 + d.getMinutes() > clock) continue;
    (previous[day] ??= []).push(e);
  }
  const comparable = Object.values(previous).map(resumirEventos).filter(m =>
    (current.tienePasos && m.tienePasos) || (current.tieneDuracionActividad && m.tieneDuracionActividad));
  if (comparable.length < 3) return insufficient;
  const differences: number[] = [];
  const compare = (available: "tienePasos" | "tieneDuracionActividad", value: "pasosHoy" | "minutosActivos") => {
    if (!current[available]) return;
    const days = comparable.filter(d => d[available]);
    if (days.length < 3) return;
    const avg = days.reduce((a, d) => a + d[value], 0) / days.length;
    if (avg > 0) differences.push(Math.abs(current[value] - avg) / avg);
  };
  compare("tienePasos", "pasosHoy"); compare("tieneDuracionActividad", "minutosActivos");
  if (!differences.length) return insufficient;
  const pct = Math.min(100, Math.round(differences.reduce((a, d) => a + d, 0) / differences.length * 100));
  // Un dia distinto no demuestra un cambio persistente.
  return { nivel: pct <= 22 ? "estable" : "cambio_reciente", desviacionPct: pct, indiceConsistencia: 100 - pct,
    explicacion: `Los registros disponibles difieren un ${pct}% de tus dias previos a esta hora. Se compararon ${comparable.length} dias; los periodos sin registro no se consideran actividad.` };
}
