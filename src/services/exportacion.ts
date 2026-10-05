/**
 * ando · Gemelo Digital — Exportación ARCO real
 * ===============================================
 *
 * Genera un archivo de exportación completo con TODOS los datos del usuario:
 *  - Perfil y consentimientos (con timestamps)
 *  - Eventos crudos (últimos 90 días)
 *  - Correcciones de actividad
 *  - Predicciones
 *
 * Cumple Ley N° 29733 (Perú) y principios GDPR sobre portabilidad de datos.
 */

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { isRemote } from "@services/mode";
import { supabase } from "@lib/supabase";
import { lget } from "@services/localDb";
import { TABLES, OWNER_COL } from "@services/schema";
import type { EventoRow } from "@services/types";

export type ExportacionCompleta = {
  meta: {
    aplicacion: string;
    version: string;
    exportadoEn: string;
    formatoVersion: string;
    titular: string;
    userId: string;
  };
  perfil: Record<string, unknown>;
  consentimientos: unknown[];
  eventos: unknown[];
  correcciones: unknown[];
  predicciones: unknown[];
  resumen: {
    totalEventos: number;
    totalConsentimientos: number;
    totalCorrecciones: number;
    primerEvento: string | null;
    ultimoEvento: string | null;
  };
};

export type ProgresoExportacion = {
  paso: string;
  progresoPct: number;
};

type ProgressCallback = (p: ProgresoExportacion) => void;

// ─── Obtención de datos ───────────────────────────────────────────────────────

async function fetchPerfilCompleto(userId: string): Promise<Record<string, unknown>> {
  if (!isRemote() || !supabase) {
    return { usuario_id: userId, alias: "Usuario (demo)", modo: "local" };
  }
  const { data } = await supabase
    .from(TABLES.perfiles)
    .select("*")
    .eq(OWNER_COL, userId)
    .maybeSingle();
  return (data as Record<string, unknown>) ?? {};
}

async function fetchConsentimientosCompletos(userId: string): Promise<unknown[]> {
  if (!isRemote() || !supabase) {
    const local = await lget<Record<string, unknown>>(`consents:${userId}`, {});
    return Object.entries(local).map(([categoria, otorgado]) => ({
      categoria,
      otorgado,
      fuente: "local",
    }));
  }
  const { data } = await supabase
    .from(TABLES.consentimientos)
    .select("*")
    .eq(OWNER_COL, userId)
    .order("creado_en", { ascending: false });
  return data ?? [];
}

async function fetchEventosCompletos(userId: string): Promise<EventoRow[]> {
  // Últimos 90 días
  const desde = new Date();
  desde.setDate(desde.getDate() - 90);

  if (!isRemote() || !supabase) {
    const local = await lget<EventoRow[]>(`events:${userId}`, []);
    return local;
  }
  const { data, error } = await supabase
    .from(TABLES.eventosCrudos)
    .select("*")
    .eq(OWNER_COL, userId)
    .gte("inicio_en", desde.toISOString())
    .order("inicio_en", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventoRow[];
}

async function fetchCorreccionesCompletas(userId: string): Promise<unknown[]> {
  if (!isRemote() || !supabase) {
    const local = await lget<unknown[]>(`correcciones:${userId}`, []);
    return local;
  }
  const { data } = await supabase
    .from(TABLES.correccionesActividad)
    .select("*")
    .eq(OWNER_COL, userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

async function fetchPrediccionesCompletas(userId: string): Promise<unknown[]> {
  if (!isRemote() || !supabase) return [];
  const { data } = await supabase
    .from(TABLES.predicciones)
    .select("*")
    .eq(OWNER_COL, userId)
    .order("generada_en", { ascending: false })
    .limit(100);
  return data ?? [];
}

// ─── Exportación ──────────────────────────────────────────────────────────────

export async function generarExportacionCompleta(
  userId: string,
  alias: string,
  onProgress?: ProgressCallback,
): Promise<ExportacionCompleta> {
  onProgress?.({ paso: "Cargando perfil…", progresoPct: 5 });
  const perfil = await fetchPerfilCompleto(userId);

  onProgress?.({ paso: "Cargando consentimientos…", progresoPct: 20 });
  const consentimientos = await fetchConsentimientosCompletos(userId);

  onProgress?.({ paso: "Cargando eventos (puede tardar)…", progresoPct: 40 });
  const eventos = await fetchEventosCompletos(userId);

  onProgress?.({ paso: "Cargando correcciones…", progresoPct: 65 });
  const correcciones = await fetchCorreccionesCompletas(userId);

  onProgress?.({ paso: "Cargando predicciones…", progresoPct: 80 });
  const predicciones = await fetchPrediccionesCompletas(userId);

  onProgress?.({ paso: "Generando archivo…", progresoPct: 90 });

  const primerEvento =
    eventos.length > 0 ? (eventos[0] as EventoRow).inicio_en : null;
  const ultimoEvento =
    eventos.length > 0 ? (eventos[eventos.length - 1] as EventoRow).inicio_en : null;

  return {
    meta: {
      aplicacion: "ando · Gemelo Digital",
      version: "1.0.0",
      exportadoEn: new Date().toISOString(),
      formatoVersion: "2.0",
      titular: alias,
      userId,
    },
    perfil,
    consentimientos,
    eventos,
    correcciones,
    predicciones,
    resumen: {
      totalEventos: eventos.length,
      totalConsentimientos: consentimientos.length,
      totalCorrecciones: correcciones.length,
      primerEvento,
      ultimoEvento,
    },
  };
}

/**
 * Genera el JSON y lo comparte vía el diálogo nativo del SO.
 * Retorna true si se pudo compartir, false si hay error.
 */
export async function exportarYCompartir(
  exportacion: ExportacionCompleta,
  onProgress?: ProgressCallback,
): Promise<boolean> {
  try {
    onProgress?.({ paso: "Escribiendo archivo…", progresoPct: 92 });
    const json = JSON.stringify(exportacion, null, 2);
    const fecha = new Date().toISOString().split("T")[0];
    const nombreArchivo = `ando-datos-${fecha}.json`;
    const rutaArchivo = `${FileSystem.documentDirectory}${nombreArchivo}`;

    await FileSystem.writeAsStringAsync(rutaArchivo, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    onProgress?.({ paso: "Abriendo compartir…", progresoPct: 98 });
    const puedeCompartir = await Sharing.isAvailableAsync();
    if (!puedeCompartir) return false;

    await Sharing.shareAsync(rutaArchivo, {
      mimeType: "application/json",
      dialogTitle: "Exportar mis datos — ando Gemelo Digital",
      UTI: "public.json",
    });

    onProgress?.({ paso: "¡Listo!", progresoPct: 100 });
    return true;
  } catch (e) {
    console.warn("Error al exportar datos:", e);
    return false;
  }
}

// ─── Eliminación real de cuenta ───────────────────────────────────────────────

/**
 * Elimina todos los datos del usuario de Supabase en cascada.
 * Usa el cliente anon (respeta RLS): elimina solo los datos del titular.
 *
 * Orden de borrado (respeta FK constraints):
 *  correcciones → eventos → consentimientos → predicciones → perfil
 *  La cuenta de auth la cierra signOut() del authStore.
 */
export async function eliminarTodosLosDatos(userId: string): Promise<void> {
  if (!isRemote() || !supabase) {
    // Modo demo: limpiar AsyncStorage
    const claves = [
      `events:${userId}`,
      `consents:${userId}`,
      `correcciones:${userId}`,
      `bg:userId`,
      `bg:consents`,
      `ando-metas-${userId}`,
      `ando-logros-${userId}`,
      `ando-suscripcion-${userId}`,
      `ando-notif-historial:${userId}`,
    ];
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    await AsyncStorage.multiRemove(claves);
    return;
  }

  // 1. Correcciones de actividad
  await supabase
    .from(TABLES.correccionesActividad)
    .delete()
    .eq(OWNER_COL, userId);

  // 2. Eventos crudos
  await supabase
    .from(TABLES.eventosCrudos)
    .delete()
    .eq(OWNER_COL, userId);

  // 3. Consentimientos
  await supabase
    .from(TABLES.consentimientos)
    .delete()
    .eq(OWNER_COL, userId);

  // 4. Predicciones
  await supabase
    .from(TABLES.predicciones)
    .delete()
    .eq(OWNER_COL, userId);

  // 5. Perfil (última porque otras tablas lo referencian)
  await supabase
    .from(TABLES.perfiles)
    .delete()
    .eq(OWNER_COL, userId);

  // 6. Limpiar caché local
  const claves = [
    `ando-metas-${userId}`,
    `ando-logros-${userId}`,
    `ando-suscripcion-${userId}`,
    `ando-notif-historial:${userId}`,
    `bg:userId`,
    `bg:consents`,
  ];
  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  await AsyncStorage.multiRemove(claves);
}
