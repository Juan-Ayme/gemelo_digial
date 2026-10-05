/**
 * ando · Gemelo Digital — Servicio de Notificaciones Push
 * ========================================================
 *
 * Gestiona permisos y programación de notificaciones locales.
 * Conecta con el motor de alertas existente (alertas.ts) para convertir
 * AlertaSalud en notificaciones push reales.
 *
 * Reglas:
 *  - Nunca envía spam: máximo 3 notificaciones por día.
 *  - Las notificaciones de "peligro" se envían inmediatamente.
 *  - Las de "advertencia" se agrupan en bloques horarios.
 *  - Requiere consentimiento `notificaciones` activo.
 */

import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AlertaSalud } from "@services/alertas";

// ─── Configuración del handler global ────────────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PermisosNotificacion = {
  concedido: boolean;
  podeSolicitar: boolean;
};

export type NotificacionProgramada = {
  id: string;
  titulo: string;
  cuerpo: string;
  fecha: string; // ISO
  alertaId: string;
};

const KEY_HISTORIAL = "ando-notif-historial";
const KEY_ENVIADAS_HOY = "ando-notif-enviadas-hoy";
const MAX_POR_DIA = 4;

// ─── Permisos ─────────────────────────────────────────────────────────────────

export async function solicitarPermisosNotificacion(): Promise<PermisosNotificacion> {
  const { status: estadoActual } = await Notifications.getPermissionsAsync();

  if (estadoActual === "granted") {
    return { concedido: true, podeSolicitar: false };
  }

  if (estadoActual === "undetermined") {
    const { status } = await Notifications.requestPermissionsAsync();
    return { concedido: status === "granted", podeSolicitar: false };
  }

  return { concedido: false, podeSolicitar: false };
}

export async function estadoPermisos(): Promise<PermisosNotificacion> {
  const { status } = await Notifications.getPermissionsAsync();
  return {
    concedido: status === "granted",
    podeSolicitar: status === "undetermined",
  };
}

// ─── Historial de notificaciones ──────────────────────────────────────────────

export async function fetchHistorialNotificaciones(
  userId: string,
): Promise<NotificacionProgramada[]> {
  try {
    const raw = await AsyncStorage.getItem(`${KEY_HISTORIAL}:${userId}`);
    if (!raw) return [];
    const lista: NotificacionProgramada[] = JSON.parse(raw);
    // Devolver solo las de los últimos 7 días
    const limite = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    return lista.filter((n) => n.fecha >= limite);
  } catch {
    return [];
  }
}

async function guardarEnHistorial(
  userId: string,
  notif: NotificacionProgramada,
): Promise<void> {
  const lista = await fetchHistorialNotificaciones(userId);
  lista.unshift(notif);
  // Mantener máximo 50 entradas
  await AsyncStorage.setItem(
    `${KEY_HISTORIAL}:${userId}`,
    JSON.stringify(lista.slice(0, 50)),
  );
}

// ─── Control de spam (máx. por día) ──────────────────────────────────────────

async function contarEnviadasHoy(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY_ENVIADAS_HOY);
    if (!raw) return 0;
    const { fecha, count }: { fecha: string; count: number } = JSON.parse(raw);
    const hoy = new Date().toISOString().split("T")[0];
    if (fecha !== hoy) return 0;
    return count;
  } catch {
    return 0;
  }
}

async function incrementarContador(): Promise<void> {
  const hoy = new Date().toISOString().split("T")[0];
  const count = (await contarEnviadasHoy()) + 1;
  await AsyncStorage.setItem(KEY_ENVIADAS_HOY, JSON.stringify({ fecha: hoy, count }));
}

// ─── Envío de notificaciones ──────────────────────────────────────────────────

const EMOJI_TIPO: Record<AlertaSalud["tipo"], string> = {
  peligro: "🔴",
  advertencia: "🟡",
  info: "💡",
  ok: "✅",
};

/**
 * Evalúa las alertas activas y envía notificaciones push para las más urgentes.
 * Llama esto desde el hook de alertas o desde la tarea de segundo plano.
 */
export async function enviarNotificacionesDeAlertas(
  userId: string,
  alertas: AlertaSalud[],
  consentimientoActivo: boolean,
): Promise<void> {
  if (!consentimientoActivo) return;

  const permisos = await estadoPermisos();
  if (!permisos.concedido) return;

  const enviadas = await contarEnviadasHoy();
  if (enviadas >= MAX_POR_DIA) return;

  // Priorizar: peligro primero, luego advertencia. Excluir las "ok" e "info".
  const urgentes = alertas.filter(
    (a) => a.tipo === "peligro" || a.tipo === "advertencia",
  );

  let enviadas_ = enviadas;
  for (const alerta of urgentes) {
    if (enviadas_ >= MAX_POR_DIA) break;

    const emoji = EMOJI_TIPO[alerta.tipo];
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${emoji} ${alerta.titulo}`,
        body: alerta.detalle,
        data: { alertaId: alerta.id, tipo: alerta.tipo },
        badge: 1,
      },
      trigger: null, // inmediato
    });

    const registro: NotificacionProgramada = {
      id: notifId,
      titulo: alerta.titulo,
      cuerpo: alerta.detalle,
      fecha: new Date().toISOString(),
      alertaId: alerta.id,
    };
    await guardarEnHistorial(userId, registro);
    await incrementarContador();
    enviadas_++;
  }
}

/**
 * Programa una notificación recordatorio de sedentarismo (cada 90 min).
 */
export async function programarRecordatorioSedentarismo(
  userId: string,
  consentimientoActivo: boolean,
): Promise<void> {
  if (!consentimientoActivo) return;
  const permisos = await estadoPermisos();
  if (!permisos.concedido) return;

  // Cancelar recordatorio previo antes de reprogramar
  await Notifications.cancelAllScheduledNotificationsAsync();

  const notifId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "⏰ Tiempo de moverse",
      body: "Llevas un buen rato quieto. Una caminata corta mejora tu energía y circulación.",
      data: { tipo: "sedentarismo" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 90 * 60,
      repeats: true,
    },
  });

  await guardarEnHistorial(userId, {
    id: notifId,
    titulo: "Recordatorio de movimiento",
    cuerpo: "Cada 90 minutos",
    fecha: new Date().toISOString(),
    alertaId: "sedentarismo-recurrente",
  });
}

export async function cancelarTodasLasNotificaciones(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.setBadgeCountAsync(0);
}
