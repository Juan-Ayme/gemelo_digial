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

/** Mensajes sobre registros disponibles. No diagnostican ni asumen reposo por el pulso diario. */
export function generarAlertas(snapshot: GemeloSnapshot, bpmActual: number | null = null, _minSedentarios = 0, metas = { pasos: 8000, minutosActivos: 30, horasSueno: 7 }): AlertaSalud[] {
  if (!snapshot.totalEventos) return [];
  const result: AlertaSalud[] = [];
  const add = (id: string, categoria: CategoriaAlerta, titulo: string, detalle: string, progreso: number | null = null, tipo: TipoAlerta = "info") => result.push({ id, categoria, titulo, detalle, progreso, tipo, badge: "Tu registro", descartable: true, usaPrediccion: false });
  if (snapshot.fuentes.some(f => f.codigo === "steps" && f.disponible)) {
    const pct = Math.min(100, Math.round(snapshot.pasosHoy / metas.pasos * 100));
    add("pasos-progreso", "pasos", snapshot.pasosHoy >= metas.pasos ? "Alcanzaste tu objetivo de pasos" : "Tu objetivo sigue abierto", `${snapshot.pasosHoy.toLocaleString("es-PE")} pasos registrados de tu meta de ${metas.pasos.toLocaleString("es-PE")}. Puedes continuar a tu ritmo.`, pct, pct >= 100 ? "ok" : "info");
  }
  if (snapshot.tieneDuracionActividad) add("actividad-registro", "actividad", "Tus minutos registrados", `${snapshot.minutosActivos} minutos activos en intervalos medidos. Los periodos sin registro no se cuentan.`, Math.min(100, Math.round(snapshot.minutosActivos / metas.minutosActivos * 100)));
  if (snapshot.fuentes.some(f => f.codigo === "sleep" && f.disponible)) add("sueno-registro", "sueno", "Tu sueño registrado", `${((snapshot.minutosSueno ?? 0) / 60).toFixed(1)} horas según la fuente conectada. Una pausa durante el día no se considera sueño.`);
  if (bpmActual && Number.isFinite(bpmActual)) add("pulso-registro", "cardiaco", "Lectura de la fuente conectada", `${bpmActual} bpm en las lecturas disponibles. El promedio diario no determina tu pulso en reposo ni permite evaluar tu salud.`);
  return result;
}
