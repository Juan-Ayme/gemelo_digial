import { supabase } from "@lib/supabase";
import { isRemote } from "@services/mode";
import { TABLES, OWNER_COL } from "@services/schema";
import { lget, lset } from "@services/localDb";
import { insertEventos } from "@services/gemelo";
import { nuevoEvento } from "@services/eventoFactory";
import type { ActividadPredicha } from "@services/types";

export type CorreccionRegistro = {
  id?: string;
  usuario_id: string;
  actividad_original: ActividadPredicha;
  actividad_corregida: ActividadPredicha;
  confirmada: boolean;
  motivo?: string;
  created_at: string;
};

/**
 * Guarda una validación o corrección humana de actividad.
 * 1. Registra la corrección en `correcciones_actividad` para el re-entrenamiento del RF.
 * 2. Inserta un EventoRow verificado (confianza=100%, calidad=100%, procedencia="manual")
 *    para que el gemelo y la rutina reflejen la realidad de inmediato.
 */
export async function registrarCorreccionActividad(
  userId: string,
  params: {
    actividadOriginal: ActividadPredicha;
    actividadCorregida: ActividadPredicha;
    confirmada: boolean;
    motivo?: string;
    zonaActual?: string;
  },
): Promise<void> {
  const now = new Date().toISOString();
  const registro: CorreccionRegistro = {
    usuario_id: userId,
    actividad_original: params.actividadOriginal,
    actividad_corregida: params.actividadCorregida,
    confirmada: params.confirmada,
    motivo: params.motivo ?? (params.confirmada ? "confirmacion_acierto" : "correccion_usuario"),
    created_at: now,
  };

  // 1. Guardar en tabla de correcciones
  if (!isRemote()) {
    const list = await lget<CorreccionRegistro[]>(`correcciones:${userId}`, []);
    list.push(registro);
    await lset(`correcciones:${userId}`, list);
  } else {
    const { error } = await supabase!
      .from(TABLES.correccionesActividad)
      .insert({
        [OWNER_COL]: userId,
        actividad_original: params.actividadOriginal,
        actividad_corregida: params.actividadCorregida,
        created_at: now,
      });
    if (error) {
      console.warn("Aviso al guardar en correcciones_actividad:", error.message);
    }
  }

  // 2. Generar un evento verificado por el usuario
  const esPaso =
    params.actividadCorregida === "desplazamiento" ||
    params.actividadCorregida === "actividad_fisica";

  const eventoVerificado = nuevoEvento({
    procedencia: "manual",
    tipo_evento: "ventana_actividad",
    valor_texto: params.actividadCorregida,
    valor_numerico: esPaso ? 120 : null,
    unidad: esPaso ? "pasos" : null,
    confianza: 100,
    calidad: 100,
    medido_directamente: true,
    zona_general: params.zonaActual ?? null,
    datos_minimos: {
      calibracion_humana: true,
      confirmada: params.confirmada,
      prediccion_previa: params.actividadOriginal,
    },
  });

  await insertEventos(userId, [eventoVerificado]);
}

/**
 * Obtiene la última corrección realizada en las últimas 2 horas para evitar
 * pedir validación repetida si el usuario ya confirmó recientemente.
 */
export async function fetchUltimaCorreccion(
  userId: string,
): Promise<CorreccionRegistro | null> {
  const limite = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  if (!isRemote()) {
    const list = await lget<CorreccionRegistro[]>(`correcciones:${userId}`, []);
    const recientes = list.filter((c) => c.created_at >= limite);
    return recientes[recientes.length - 1] ?? null;
  }

  const { data, error } = await supabase!
    .from(TABLES.correccionesActividad)
    .select("*")
    .eq(OWNER_COL, userId)
    .gte("created_at", limite)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as CorreccionRegistro;
}
