import { z } from "zod";
import * as Crypto from "expo-crypto";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { lget, lset } from "@services/localDb";
import { fechaLocal } from "@services/metricas";
import { fetchConsents } from "@services/consent";
import { solicitarPermisosNotificacion } from "@services/notificaciones";

export const textoPersonalSchema = z.string().trim().min(3, "Escribe al menos 3 caracteres.").max(100, "Usa hasta 100 caracteres.");
export const horaPlanSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Usa una hora como 08:30.");
export type CambioPersonal = { id: string; texto: string; inicio: string; realizados: string[] };
export type PlanPersonal = { id: string; texto: string; hora: string; realizado: boolean; recordatorioId?: string };
// Cambios y planes son elecciones manuales del titular, no recomendaciones médicas.
export const fetchCambio = (id: string) => lget<CambioPersonal | null>(`cambio:${id}`, null);
export async function guardarCambio(id: string, texto: string) {
  const validado = textoPersonalSchema.parse(texto);
  const current = await fetchCambio(id);
  if (current) await lset(`cambios:archivo:${id}`, [...await lget<CambioPersonal[]>(`cambios:archivo:${id}`, []), current]);
  const cambio: CambioPersonal = { id: Crypto.randomUUID(), texto: validado, inicio: fechaLocal(new Date()), realizados: [] };
  await lset(`cambio:${id}`, cambio); return cambio;
}
export async function marcarCambio(id: string) {
  const cambio = await fetchCambio(id); if (!cambio) throw new Error("Primero elige un pequeño cambio.");
  const hoy = fechaLocal(new Date());
  const next = { ...cambio, realizados: cambio.realizados.includes(hoy) ? cambio.realizados.filter(d => d !== hoy) : [...cambio.realizados, hoy] };
  await lset(`cambio:${id}`, next); return next;
}
export function fechaManana() { const d = new Date(); d.setDate(d.getDate() + 1); return fechaLocal(d); }
export const fetchPlanes = (id: string, dia: string) => lget<PlanPersonal[]>(`planes:${id}:${dia}`, []);
export async function agregarPlan(id: string, dia: string, texto: string, hora: string) {
  const plans = await fetchPlanes(id, dia);
  if (plans.length >= 8) throw new Error("Para un día sencillo, usa hasta 8 momentos.");
  const plan: PlanPersonal = { id: Crypto.randomUUID(), texto: textoPersonalSchema.parse(texto), hora: horaPlanSchema.parse(hora), realizado: false };
  await lset(`planes:${id}:${dia}`, [...plans, plan].sort((a, b) => a.hora.localeCompare(b.hora)));
}
export async function actualizarPlan(id: string, dia: string, planId: string, action: "borrar" | "marcar" | "recordar" | "cancelar") {
  const plans = await fetchPlanes(id, dia); const plan = plans.find(p => p.id === planId);
  if (!plan) throw new Error("Ese momento ya no está en el plan.");
  if (action === "recordar") {
    if (plan.recordatorioId) return;
    if (Platform.OS === "web") throw new Error("Los recordatorios se programan desde la app del teléfono.");
    const consents = await fetchConsents(id);
    if (!consents.notificaciones) throw new Error("Activa el consentimiento de notificaciones en Perfil.");
    const date = new Date(`${dia}T${plan.hora}:00`);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) throw new Error("Elige una hora futura.");
    if (!(await solicitarPermisosNotificacion()).concedido) throw new Error("El teléfono no autorizó las notificaciones.");
    // Contenido discreto en la pantalla bloqueada; el texto personal queda en la app.
    const notificationId = await Notifications.scheduleNotificationAsync({ content: { title: "Tu momento en ando", body: "Tienes un momento preparado para hoy. Abre tu plan.", data: { userId: id, dia, planId } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date } });
    try { await lset(`planes:${id}:${dia}`, plans.map(p => p.id === planId ? { ...p, recordatorioId: notificationId } : p)); }
    catch (error) { await Notifications.cancelScheduledNotificationAsync(notificationId); throw error; }
    return;
  }
  if (plan.recordatorioId) await Notifications.cancelScheduledNotificationAsync(plan.recordatorioId);
  await lset(`planes:${id}:${dia}`, action === "borrar" ? plans.filter(p => p.id !== planId) : plans.map(p => p.id === planId ? { ...p, realizado: action === "marcar" ? !p.realizado : p.realizado, recordatorioId: undefined } : p));
}

/** Cancela recordatorios de la cuenta y actualiza el estado del plan al salir/revocar. */
export async function cancelarRecordatoriosPlanes(id: string) {
  const storage = (await import("@react-native-async-storage/async-storage")).default;
  const keys = (await storage.getAllKeys()).filter(k => k.startsWith(`ando:local:planes:${id}:`));
  for (const key of keys) {
    const dia = key.slice(`ando:local:planes:${id}:`.length); const planes = await fetchPlanes(id, dia);
    for (const p of planes) if (p.recordatorioId) await Notifications.cancelScheduledNotificationAsync(p.recordatorioId);
    await lset(`planes:${id}:${dia}`, planes.map(p => ({ ...p, recordatorioId: undefined })));
  }
}
