import { supabase } from "@lib/supabase";
import { isRemote } from "@services/mode";
import { TABLES, OWNER_COL } from "@services/schema";
import { lget, lset } from "@services/localDb";
import { insertEventos } from "@services/gemelo";
import { nuevoEvento } from "@services/eventoFactory";
import type { ActividadPredicha, EventoRow } from "@services/types";

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

  // 1. Guardar en local SIEMPRE (offline-first garantizado)
  try {
    const list = await lget<CorreccionRegistro[]>(`correcciones:${userId}`, []);
    list.push(registro);
    await lset(`correcciones:${userId}`, list);
  } catch (err) {
    console.warn("Aviso al guardar corrección localmente:", err);
  }

  // 2. Sincronizar con Supabase si está disponible
  if (isRemote() && supabase) {
    try {
      const { error } = await supabase
        .from(TABLES.correccionesActividad)
        .insert({
          [OWNER_COL]: userId,
          actividad_original: params.actividadOriginal,
          actividad_corregida: params.actividadCorregida,
          confirmada: params.confirmada,
          motivo: registro.motivo,
          created_at: now,
        });
      if (error) {
        console.warn("Aviso al guardar en correcciones_actividad (Supabase):", error.message);
      }
    } catch (err) {
      console.warn("Error de red/esquema en correcciones_actividad:", err);
    }
  }

  // 3. Generar un evento verificado por el usuario ("entrada_manual")
  const esPaso =
    params.actividadCorregida === "desplazamiento" ||
    params.actividadCorregida === "actividad_fisica";

  const eventoVerificado = nuevoEvento({
    procedencia: "entrada_manual",
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

  try {
    await insertEventos(userId, [eventoVerificado]);
  } catch (err) {
    console.warn("Aviso al insertar evento verificado en Supabase, guardando local:", err);
    try {
      const list = await lget<EventoRow[]>(`events:${userId}`, []);
      list.push(eventoVerificado);
      await lset(`events:${userId}`, list);
    } catch {
      // Ignorar fallback secundario
    }
  }
}

/**
 * Obtiene la última corrección realizada en las últimas 2 horas para evitar
 * pedir validación repetida si el usuario ya confirmó recientemente.
 */
export async function fetchUltimaCorreccion(
  userId: string,
): Promise<CorreccionRegistro | null> {
  const limite = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  // 1. Verificar primero en almacén local
  try {
    const list = await lget<CorreccionRegistro[]>(`correcciones:${userId}`, []);
    const recientes = list.filter((c) => c.created_at >= limite);
    if (recientes.length > 0) {
      return recientes[recientes.length - 1];
    }
  } catch {
    // Si falla local, intentar Supabase
  }

  if (!isRemote() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(TABLES.correccionesActividad)
      .select("*")
      .eq(OWNER_COL, userId)
      .gte("created_at", limite)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as CorreccionRegistro;
  } catch {
    return null;
  }
}
