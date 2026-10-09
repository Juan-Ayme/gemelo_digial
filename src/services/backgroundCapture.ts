import { Platform } from "react-native";
import * as TaskManager from "expo-task-manager";
import Constants from "expo-constants";
import { lget, lset } from "@services/localDb";
import type { ConsentMap } from "@services/types";

export const TAREA_CAPTURA = "ando-captura-sensores";
const enExpoGo = Constants.appOwnership === "expo";
const soportable = Platform.OS !== "web" && !enExpoGo;
type Contexto = { userId: string; consents: ConsentMap };
if (soportable && !TaskManager.isTaskDefined(TAREA_CAPTURA)) {
  TaskManager.defineTask(TAREA_CAPTURA, async () => {
    const bg = await import("expo-background-task");
    try {
      const context = await lget<Contexto | null>("bg:contexto", null);
      if (!context || context.userId === "demo-user") return bg.BackgroundTaskResult.Success;
      const { supabase } = await import("@lib/supabase");
      const { data, error } = supabase ? await supabase.auth.getUser() : { data: null, error: true };
      if (error || data?.user?.id !== context.userId) return bg.BackgroundTaskResult.Success;
      const { capturarYGuardar } = await import("@services/sensors");
      await capturarYGuardar(context.userId, context.consents);
      await lset(`bg:last:${context.userId}`, new Date().toISOString());
      return bg.BackgroundTaskResult.Success;
    } catch { return bg.BackgroundTaskResult.Failed; }
  });
}
export async function actualizarContextoBg(userId: string, consents: ConsentMap): Promise<void> {
  // Un único registro evita mezclar el usuario anterior con permisos de otro.
  if (userId === "demo-user" || ![consents.actividad, consents.pasos, consents.sueno, consents.zona_general, consents.fisiologia, consents.wearable].some(Boolean)) {
    await cancelarTareaSegundoPlano(); return;
  }
  await lset("bg:contexto", { userId, consents });
  await registrarTareaSegundoPlano();
}
export async function registrarTareaSegundoPlano(): Promise<void> {
  if (!soportable || !await lget<Contexto | null>("bg:contexto", null)) return;
  const bg = await import("expo-background-task");
  if (await bg.getStatusAsync() !== bg.BackgroundTaskStatus.Available) return;
  if (!await TaskManager.isTaskRegisteredAsync(TAREA_CAPTURA)) await bg.registerTaskAsync(TAREA_CAPTURA, { minimumInterval: 15 });
}
export async function cancelarTareaSegundoPlano(): Promise<void> {
  // Inhabilitar el contexto es lo primero, incluso si el sistema no deja cancelar.
  await lset("bg:contexto", null); await lset("bg:userId", null); await lset("bg:consents", null);
  if (!soportable) return;
  try { if (await TaskManager.isTaskRegisteredAsync(TAREA_CAPTURA)) { const bg = await import("expo-background-task"); await bg.unregisterTaskAsync(TAREA_CAPTURA); } } catch { /* El contexto vacío impide nuevas lecturas. */ }
}
export async function estadoTareaSegundoPlano() {
  let registrada = false, soportada = false;
  if (soportable) try { const bg = await import("expo-background-task"); soportada = await bg.getStatusAsync() === bg.BackgroundTaskStatus.Available; registrada = await TaskManager.isTaskRegisteredAsync(TAREA_CAPTURA); } catch { /* Build sin módulo. */ }
  return { registrada, soportada, plataforma: Platform.OS, enExpoGo };
}
