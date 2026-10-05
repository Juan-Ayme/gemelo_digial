/**
 * ando · Gemelo Digital — Servicio de Historial
 * ===============================================
 *
 * Recupera eventos agrupados por día para la vista de historial semanal/mensual.
 * Calcula métricas diarias: pasos, minutos activos, descanso, actividad dominante.
 */

import { isRemote } from "@services/mode";
import { lget } from "@services/localDb";
import { supabase } from "@lib/supabase";
import { TABLES, OWNER_COL } from "@services/schema";
import type { EventoRow, ActividadPredicha } from "@services/types";

export type DiaResumen = {
  fecha: string; // "YYYY-MM-DD"
  label: string; // "Lun 2"
  pasosHoy: number;
  minutosActivos: number;
  minutosDescanso: number;
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

function fechaISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

function labelDia(d: Date): string {
  return `${DIAS_CORTOS[d.getDay()]} ${d.getDate()}`;
}

function procesarEventosDia(eventos: EventoRow[]): Omit<DiaResumen, "fecha" | "label"> {
  let pasos = 0;
  let minActivos = 0;
  let minDescanso = 0;
  const votos: Record<string, number> = {};
  let sumaConfianza = 0;
  let countConfianza = 0;

  for (const e of eventos) {
    if (e.unidad === "pasos" && typeof e.valor_numerico === "number") {
      pasos += e.valor_numerico;
    }
    const act = e.valor_texto ?? "";
    const m =
      typeof e.datos_minimos?.["minutos"] === "number"
        ? (e.datos_minimos["minutos"] as number)
        : 15;
    if (act === "desplazamiento" || act === "actividad_fisica") minActivos += m;
    else if (act === "descanso") minDescanso += m;
    if (act) votos[act] = (votos[act] ?? 0) + 1;
    if (e.confianza != null) {
      sumaConfianza += e.confianza;
      countConfianza++;
    }
  }

  const actividadDominante =
    (Object.entries(votos).sort((a, b) => b[1] - a[1])[0]?.[0] as ActividadPredicha) ?? null;

  return {
    pasosHoy: pasos,
    minutosActivos: minActivos,
    minutosDescanso: minDescanso,
    actividadDominante,
    totalEventos: eventos.length,
    confianzaPromedio:
      countConfianza > 0 ? Math.round((sumaConfianza / countConfianza) * 100) : 0,
  };
}

/** Recupera el resumen de los últimos `dias` días para el usuario dado. */
export async function fetchHistorial(
  userId: string,
  dias: number = 7,
): Promise<DiaResumen[]> {
  const hoy = new Date();
  const fechas: Date[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    fechas.push(d);
  }

  if (!isRemote()) {
    // Modo demo: construir datos ficticios pero consistentes
    return fechas.map((d, idx) => {
      const seed = d.getDay() + idx;
      const pasos = 2_000 + seed * 800 + Math.round(Math.sin(idx) * 500);
      const acts: ActividadPredicha[] = [
        "trabajo", "estudio", "desplazamiento", "ocio", "actividad_fisica",
      ];
      return {
        fecha: fechaISO(d),
        label: labelDia(d),
        pasosHoy: pasos,
        minutosActivos: 15 + seed * 5,
        minutosDescanso: 420 + seed * 10,
        actividadDominante: acts[seed % acts.length],
        totalEventos: 3 + (seed % 6),
        confianzaPromedio: 60 + (seed % 30),
      };
    });
  }

  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - dias);
  desde.setHours(0, 0, 0, 0);

  const { data, error } = await supabase!
    .from(TABLES.eventosCrudos)
    .select("*")
    .eq(OWNER_COL, userId)
    .gte("inicio_en", desde.toISOString())
    .order("inicio_en", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as EventoRow[];

  // Agrupar por fecha "YYYY-MM-DD"
  const porFecha: Record<string, EventoRow[]> = {};
  for (const e of rows) {
    const f = e.inicio_en.split("T")[0];
    if (!porFecha[f]) porFecha[f] = [];
    porFecha[f].push(e);
  }

  return fechas.map((d) => {
    const f = fechaISO(d);
    const eventos = porFecha[f] ?? [];
    return {
      fecha: f,
      label: labelDia(d),
      ...procesarEventosDia(eventos),
    };
  });
}

/** Calcula resumen semanal a partir de los días. */
export function calcularSemana(dias: DiaResumen[]): SemanaResumen {
  const totales = dias.filter((d) => d.totalEventos > 0);
  const promediopasos =
    totales.length > 0
      ? Math.round(totales.reduce((a, d) => a + d.pasosHoy, 0) / totales.length)
      : 0;
  const promedioMinActivos =
    totales.length > 0
      ? Math.round(totales.reduce((a, d) => a + d.minutosActivos, 0) / totales.length)
      : 0;

  const mejorDia =
    dias.reduce<DiaResumen | null>(
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
