/**
 * ando · Gemelo Digital — Análisis de Línea Base y Variación de Rutina
 * ===================================================================
 *
 * Evalúa la consistencia de la rutina de hoy respecto a la línea base
 * conductual esperada según el día de la semana y la hora del día.
 *
 * Produce uno de los 4 estados de `NivelVariacion`:
 *   - datos_insuficientes: menos de 2 ventanas hoy
 *   - estable: desviación < 20% respecto a la línea base
 *   - cambio_reciente: desviación 20%..45% (ej. tarde más activa o más sedentaria)
 *   - cambio_persistente: desviación > 45% (ruptura notable de rutina)
 */

import type { EventoRow, NivelVariacion } from "@services/types";

export type AnalisisVariacion = {
  nivel: NivelVariacion;
  desviacionPct: number;
  explicacion: string;
  indiceConsistencia: number; // 0..100
};

const DIAS = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];

export function calcularVariacionRutina(
  eventosHoy: EventoRow[],
  fechaActual: Date = new Date(),
): AnalisisVariacion {
  if (eventosHoy.length < 2) {
    return {
      nivel: "datos_insuficientes",
      desviacionPct: 0,
      explicacion: "Aún aprendiendo tu rutina. Registra más ventanas de actividad para calcular tu línea base.",
      indiceConsistencia: 50,
    };
  }

  const hora = fechaActual.getHours();
  const diaNombre = DIAS[fechaActual.getDay()];

  // Calcular métricas acumuladas de hoy
  let pasos = 0;
  let minActivos = 0;
  let minDescanso = 0;

  for (const e of eventosHoy) {
    if (e.unidad === "pasos" && typeof e.valor_numerico === "number") {
      pasos += e.valor_numerico;
    }
    const act = e.valor_texto ?? "";
    const m = typeof e.datos_minimos?.["minutos"] === "number" ? (e.datos_minimos["minutos"] as number) : 15;
    if (act === "desplazamiento" || act === "actividad_fisica") minActivos += m;
    else if (act === "descanso" || act === "permanencia") minDescanso += m;
  }

  // Línea base esperada proporcional a la hora transcurrida del día (0..24h)
  const fraccionDia = Math.max(0.1, Math.min(1.0, hora / 24));
  const pasosEsperados = 7000 * fraccionDia;
  const minActivosEsperados = 40 * fraccionDia;

  // Desviación promedio relativa entre pasos y minutos activos
  const diffPasos = pasosEsperados > 0 ? Math.abs(pasos - pasosEsperados) / pasosEsperados : 0;
  const diffActivos = minActivosEsperados > 0 ? Math.abs(minActivos - minActivosEsperados) / minActivosEsperados : 0;

  const desviacionBruta = (diffPasos * 0.4 + diffActivos * 0.6) * 100;
  const desviacionPct = Math.round(Math.min(95, desviacionBruta));
  const consistencia = Math.max(5, 100 - desviacionPct);

  if (desviacionPct <= 22) {
    return {
      nivel: "estable",
      desviacionPct,
      explicacion: `Tu rutina de hoy mantiene un ${consistencia}% de consistencia con tu línea base típica de los ${diaNombre}.`,
      indiceConsistencia: consistencia,
    };
  }

  if (desviacionPct <= 48) {
    const direccion = minActivos > minActivosEsperados ? "más activa" : "más sedentaria";
    return {
      nivel: "cambio_reciente",
      desviacionPct,
      explicacion: `Cambio reciente detectado: Tu jornada está siendo un ${desviacionPct}% ${direccion} de lo habitual a esta hora.`,
      indiceConsistencia: consistencia,
    };
  }

  return {
    nivel: "cambio_persistente",
    desviacionPct,
    explicacion: `Cambio persistente en tu rutina: Desviación del ${desviacionPct}% respecto al patrón esperado de los ${diaNombre}.`,
    indiceConsistencia: consistencia,
  };
}
