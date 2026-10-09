/**
 * ando · Gemelo Digital — Exportación ARCO real
 * ===============================================
 *
 * Genera un archivo de exportación completo con TODOS los datos del usuario:
 *  - Perfil y consentimientos (con timestamps)
 *  - Eventos crudos disponibles, con paginación
 *  - Correcciones de actividad
 *  - Predicciones
 *
 * Archivo de acceso a los registros disponibles; no certifica cumplimiento normativo.
 */

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eventosUnicos } from "@services/metricas";
import { fetchPreferencias } from "@services/preferencias";
import { fetchMetas } from "@services/metas";
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
  registrosLocales?: Record<string, unknown>;
  consentimientos: unknown[];
  eventos: unknown[];
  correcciones: unknown[];
  predicciones: unknown[];
  preferencias?: unknown;
  metas?: unknown;
  planPersonal?: Record<string, unknown>;
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
  const { data, error } = await supabase
    .from(TABLES.perfiles)
    .select("*")
    .eq(OWNER_COL, userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Record<string, unknown>) ?? {};
}

async function leerTabla(userId: string, tabla: string): Promise<unknown[]> {
  const rows: unknown[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase!.from(tabla).select("*").eq(OWNER_COL, userId).order(tabla === TABLES.perfiles ? OWNER_COL : "id").range(offset, offset + 999);
    if (error) throw error;
    rows.push(...(data ?? [])); if ((data?.length ?? 0) < 1000) break;
  } return rows;
}
async function fetchConsentimientosCompletos(userId: string): Promise<unknown[]> {
  if (isRemote()) return leerTabla(userId, TABLES.consentimientos);
  const local = await lget<Record<string, unknown>>(`consents:${userId}`, {});
  return Object.entries(local).map(([categoria, otorgado]) => ({ categoria, otorgado, fuente: "local" }));
}
async function fetchEventosCompletos(userId: string): Promise<EventoRow[]> {
  const local = [...await lget<EventoRow[]>(`events:${userId}`, []), ...await lget<EventoRow[]>(`pending:${userId}`, [])];
  const remote = isRemote() ? await leerTabla(userId, TABLES.eventosCrudos) as EventoRow[] : [];
  return eventosUnicos([...local, ...remote]).sort((a, b) => a.inicio_en.localeCompare(b.inicio_en));
}
async function fetchCorreccionesCompletas(userId: string): Promise<unknown[]> {
  const local = await lget<unknown[]>(`correcciones:${userId}`, []);
  return isRemote() ? [...local, ...await leerTabla(userId, TABLES.correccionesActividad)] : local;
}
async function fetchPrediccionesCompletas(userId: string): Promise<unknown[]> {
  return isRemote() ? leerTabla(userId, TABLES.predicciones) : [];
}
async function exportarRegistrosLocales(id: string) {
  const keys = (await AsyncStorage.getAllKeys()).filter(k => (k.startsWith("ando:local:") && (k.endsWith(`:${id}`) || k.startsWith(`ando:local:planes:${id}:`))) || [`ando-metas-${id}`, `ando-logros-${id}`, `ando-suscripcion-${id}`, `ando-notif-historial:${id}`].includes(k));
  const values = await AsyncStorage.multiGet(keys);
  return Object.fromEntries(values.map(([key, value]) => [key, value ? JSON.parse(value) : null]));
}
async function exportarPlanPersonal(id: string) {
  const keys = (await AsyncStorage.getAllKeys()).filter(k => k === `ando:local:cambio:${id}` || k === `ando:local:cambios:archivo:${id}` || k.startsWith(`ando:local:planes:${id}:`));
  const values = await AsyncStorage.multiGet(keys);
  return Object.fromEntries(values.map(([key, value]) => [key.replace("ando:local:", ""), value ? JSON.parse(value) : null]));
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
    registrosLocales: await exportarRegistrosLocales(userId),
    preferencias: await fetchPreferencias(userId),
    metas: await fetchMetas(userId),
    planPersonal: await exportarPlanPersonal(userId),
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
    if (Platform.OS === "web") {
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = nombreArchivo; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000); onProgress?.({ paso: "Descarga preparada", progresoPct: 100 }); return true;
    }
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
    throw e;
  }
}

/** Borrado remoto solo mediante una función autenticada; un signOut no elimina Auth. */
export async function eliminarTodosLosDatos(userId: string): Promise<void> {
  let deletedRemote = false;
  if (isRemote() && supabase) {
    const { data, error } = await supabase.functions.invoke("delete-account", { body: {} });
    if (error || data?.deleted !== true) throw new Error("No se confirmó la eliminación. La función delete-account debe estar desplegada y configurada.");
    deletedRemote = true;
  }
  try {
  await import("@services/backgroundCapture").then(m => m.cancelarTareaSegundoPlano());
  await import("@services/notificaciones").then(m => m.cancelarTodasLasNotificaciones());
  const keys = await AsyncStorage.getAllKeys();
  const owned = keys.filter(k => (k.startsWith("ando:local:") && (k.endsWith(`:${userId}`) || k.startsWith(`ando:local:planes:${userId}:`))) ||
    [`ando-metas-${userId}`, `ando-logros-${userId}`, `ando-suscripcion-${userId}`, `ando-notif-historial:${userId}`, `ando-recordatorio:${userId}`].includes(k));
  await AsyncStorage.multiRemove([...owned, "ando-query-cache"]);
  } catch (error) {
    if (deletedRemote) throw new Error("La cuenta se eliminó en el servidor, pero la limpieza local falló. Cierra la sesión y elimina los datos de esta app en el dispositivo.");
    throw error;
  }
}
