/**
 * ando · Gemelo Digital — Servicio de Historial
 * ===============================================
 *
 * Recupera eventos agrupados por día para la vista de historial semanal/mensual.
 * Calcula métricas diarias: pasos, minutos activos, descanso, actividad dominante.
 */

import { diaDelEvento, fechaLocal, resumirEventos } from "@services/metricas";
import { leerEventosDesde } from "@services/eventStore";
import type { EventoRow, ActividadPredicha } from "@services/types";

export type DiaResumen = {
  fecha: string; // "YYYY-MM-DD"
  label: string; // "Lun 2"
  pasosHoy: number;
  minutosActivos: number;
  minutosDescanso: number;
  minutosSueno?: number;
  tienePasos?: boolean;
  tieneSueno?: boolean;
  tieneDuracionActividad?: boolean;
  actividadDominante: ActividadPredicha | null;
  totalEventos: number;
  confianzaPromedio: number; // 0–100
};

export type SemanaResumen = {
  dias: DiaResumen[];
  promediopasos: number;
  promedioMinActivos: number;
  mejorDia: string | null;
  rachaActual: number; // días consecutivos con ≥ 3.000 pasos
};

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export async function fetchHistorial(userId: string, dias: number = 7): Promise<DiaResumen[]> {
  const hoy = new Date();
  const desde = new Date(hoy); desde.setDate(desde.getDate() - dias + 1); desde.setHours(0, 0, 0, 0);
  const rows = await leerEventosDesde(userId, desde);
  return Array.from({ length: dias }, (_, i) => {
    const date = new Date(desde); date.setDate(date.getDate() + i);
    const fecha = fechaLocal(date);
    const events = rows.filter(e => diaDelEvento(e) === fecha);
    const metrics = resumirEventos(events);
    const votes: Record<string, number> = {};
    for (const e of events) if (e.tipo_evento === "ventana_actividad" && e.valor_texto) votes[e.valor_texto] = (votes[e.valor_texto] ?? 0) + 1;
    return {
      fecha, label: `${DIAS_CORTOS[date.getDay()]} ${date.getDate()}`, ...metrics,
      actividadDominante: (Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] as ActividadPredicha) ?? null,
    };
  });
}

/** Calcula resumen semanal a partir de los días. */
export function calcularSemana(dias: DiaResumen[]): SemanaResumen {
  const totales = dias.filter((d) => d.tienePasos);
  const activos = dias.filter(d => d.tieneDuracionActividad);
  const promediopasos =
    totales.length > 0
      ? Math.round(totales.reduce((a, d) => a + d.pasosHoy, 0) / totales.length)
      : 0;
  const promedioMinActivos =
    activos.length > 0
      ? Math.round(activos.reduce((a, d) => a + d.minutosActivos, 0) / activos.length)
      : 0;

  const mejorDia =
    totales.reduce<DiaResumen | null>(
      (best, d) => (!best || d.pasosHoy > best.pasosHoy ? d : best),
      null,
    )?.label ?? null;

  // Racha: días consecutivos (desde hoy hacia atrás) con ≥ 3.000 pasos
  let racha = 0;
  for (let i = dias.length - 1; i >= 0; i--) {
    if (dias[i].pasosHoy >= 3_000) racha++;
    else break;
  }

  return { dias, promediopasos, promedioMinActivos, mejorDia, rachaActual: racha };
}
