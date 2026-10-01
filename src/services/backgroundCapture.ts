/**
 * ando · Gemelo Digital — Captura de sensores en segundo plano
 * ============================================================
 *
 * Registra una tarea periódica con expo-background-task (+ expo-task-manager)
 * que captura sensores (acelerómetro, GPS, podómetro iOS, Health Connect
 * Android) sin que el usuario abra la app.
 *
 * Restricciones del sistema operativo (no controlables desde la app):
 *   - Android: el SO dispara la tarea aprox. cada 15 min si hay batería.
 *   - iOS:     el SO decide cuándo (puede ser cada 1-3 h); no hay garantía
 *              de intervalo exacto.
 *
 * Compatibilidad de builds:
 *   - npx expo run:android --variant debug    (funciona)
 *   - npx expo run:android --variant release  (funciona, firma con debug.keystore)
 *   - eas build --profile development         (funciona)
 *   - Expo Go                                 (se detecta y se desactiva sin error)
 *
 * IMPORTANTE:
 *   - Sin ciclos de dependencias: gemelo, sensors y localDb se importan
 *     dinámicamente dentro de la ejecución de la tarea.
 *   - Migrado de expo-background-fetch a expo-background-task con fallback
 *     automático para compatibilidad total.
 */

import { Platform } from "react-native";
import * as TaskManager from "expo-task-manager";
import Constants from "expo-constants";
import type { ConsentMap } from "@services/types";

// ─── Constantes ─────────────────────────────────────────────────────────────

export const TAREA_CAPTURA = "ando-captura-sensores";

/** Intervalo mínimo en minutos para expo-background-task */
const INTERVALO_MIN_MINUTOS = 15;
/** Intervalo mínimo en segundos para fallback con expo-background-fetch */
const INTERVALO_MIN_SEGUNDOS = 15 * 60;

/**
 * Detecta Expo Go: en Expo Go, Constants.appOwnership === "expo".
 * En development builds y release builds, appOwnership es undefined o "standalone".
 * La tarea SOLO se activa fuera de Expo Go.
 */
const enExpoGo = Constants.appOwnership === "expo";

// ─── Definición de la tarea (debe ejecutarse antes de cualquier render) ──────

/**
 * TaskManager.defineTask DEBE llamarse en el módulo raíz del bundle, antes
 * de que React monte cualquier componente.
 *
 * Usa importaciones dinámicas para no causar require cycles en el arranque.
 */
if (!enExpoGo) {
  TaskManager.defineTask(TAREA_CAPTURA, async () => {
    try {
      // Lee userId y consentimientos desde AsyncStorage (sin React ni Zustand).
      // actualizarContextoBg() los persiste cada vez que cambian.
      const { lget } = await import("@services/localDb");
      const userId = await lget<string | null>("bg:userId", null);
      const consents = await lget<ConsentMap | null>("bg:consents", null);

      if (!userId || !consents) {
        // 1 = Success / NoData en BackgroundTaskResult y BackgroundFetchResult
        return 1;
      }

      const { capturarSensoresReales } = await import("@services/sensors");
      const eventos = await capturarSensoresReales(userId, consents);

      if (!eventos.length) {
        return 1;
      }

      const { insertEventos } = await import("@services/gemelo");
      await insertEventos(userId, eventos);
      return 1;
    } catch {
      // 2 = Failed en BackgroundTaskResult
      return 2;
    }
  });
}

// ─── API pública ─────────────────────────────────────────────────────────────

/**
 * Persiste el userId y los consentimientos en AsyncStorage para que la tarea
 * de fondo los pueda leer sin React ni Zustand.
 *
 * Llama esto:
 *   - Al iniciar sesión (desde authStore.init / onAuthStateChange)
 *   - Al cambiar cualquier consentimiento (desde useConsents)
 */
export async function actualizarContextoBg(
  userId: string,
  consents: ConsentMap,
): Promise<void> {
  const { lset } = await import("@services/localDb");
  await lset("bg:userId", userId);
  await lset("bg:consents", consents);
}

/**
 * Registra la tarea periódica en el SO.
 *
 * Usa expo-background-task como primera opción (recomendado Expo SDK 57),
 * con fallback a expo-background-fetch si la compilación nativa previa aún no
 * incluye el nuevo módulo.
 */
export async function registrarTareaSegundoPlano(): Promise<void> {
  if (enExpoGo) {
    if (__DEV__) {
      console.log("[BG] Expo Go: captura en segundo plano deshabilitada.");
    }
    return;
  }

  const yaRegistrada = await TaskManager.isTaskRegisteredAsync(TAREA_CAPTURA);
  if (yaRegistrada) return;

  // 1. Intento primario: expo-background-task
  try {
    const BackgroundTask = await import("expo-background-task");
    const estado = await BackgroundTask.getStatusAsync().catch(() => null);

    if (estado === BackgroundTask.BackgroundTaskStatus.Restricted) {
      if (__DEV__) {
        console.warn("[BG] BackgroundTask restringido por el SO.");
      }
      return;
    }

    await BackgroundTask.registerTaskAsync(TAREA_CAPTURA, {
      minimumInterval: INTERVALO_MIN_MINUTOS,
    });

    if (__DEV__) {
      console.log("[BG] Tarea registrada con expo-background-task:", TAREA_CAPTURA);
    }
    return;
  } catch {
    // Si expo-background-task nativo no está disponible aún, intentar fallback
  }

  // 2. Fallback: expo-background-fetch
  try {
    const BackgroundFetch = await import("expo-background-fetch");
    const estado = await BackgroundFetch.getStatusAsync().catch(() => null);

    if (
      estado === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      estado === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }

    await BackgroundFetch.registerTaskAsync(TAREA_CAPTURA, {
      minimumInterval: INTERVALO_MIN_SEGUNDOS,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    if (__DEV__) {
      console.log("[BG] Tarea registrada con expo-background-fetch (fallback):", TAREA_CAPTURA);
    }
  } catch (err) {
    if (__DEV__) {
      console.warn("[BG] No se pudo registrar la tarea en segundo plano:", err);
    }
  }
}

/**
 * Cancela la tarea periódica.
 * Llamar al cerrar sesión o revocar todos los consentimientos.
 */
export async function cancelarTareaSegundoPlano(): Promise<void> {
  if (enExpoGo) return;
  try {
    const yaRegistrada = await TaskManager.isTaskRegisteredAsync(TAREA_CAPTURA);
    if (!yaRegistrada) return;

    try {
      const BackgroundTask = await import("expo-background-task");
      await BackgroundTask.unregisterTaskAsync(TAREA_CAPTURA);
      return;
    } catch {
      const BackgroundFetch = await import("expo-background-fetch");
      await BackgroundFetch.unregisterTaskAsync(TAREA_CAPTURA);
    }
  } catch {
    /* silencioso */
  }
}

/**
 * Estado de la tarea para mostrar en la UI (pantalla Perfil).
 * No lanza errores: siempre retorna un objeto seguro.
 */
export async function estadoTareaSegundoPlano(): Promise<{
  registrada: boolean;
  soportada: boolean;
  plataforma: string;
  enExpoGo: boolean;
}> {
  if (enExpoGo) {
    return { registrada: false, soportada: false, plataforma: "expo-go", enExpoGo: true };
  }
  try {
    const registrada = await TaskManager.isTaskRegisteredAsync(TAREA_CAPTURA);
    let soportada = true;

    try {
      const BackgroundTask = await import("expo-background-task");
      const estado = await BackgroundTask.getStatusAsync();
      soportada = estado === BackgroundTask.BackgroundTaskStatus.Available;
    } catch {
      try {
        const BackgroundFetch = await import("expo-background-fetch");
        const estado = await BackgroundFetch.getStatusAsync();
        soportada =
          estado !== BackgroundFetch.BackgroundFetchStatus.Restricted &&
          estado !== BackgroundFetch.BackgroundFetchStatus.Denied;
      } catch {
        soportada = false;
      }
    }

    return { registrada, soportada, plataforma: Platform.OS, enExpoGo: false };
  } catch {
    return { registrada: false, soportada: false, plataforma: Platform.OS, enExpoGo: false };
  }
}
