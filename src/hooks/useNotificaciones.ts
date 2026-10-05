import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuthStore } from "@stores/authStore";
import { useConsents } from "@hooks/useConsents";
import { useAlertas } from "@hooks/useAlertas";
import {
  solicitarPermisosNotificacion,
  estadoPermisos,
  enviarNotificacionesDeAlertas,
  programarRecordatorioSedentarismo,
  cancelarTodasLasNotificaciones,
  fetchHistorialNotificaciones,
  type PermisosNotificacion,
} from "@services/notificaciones";

const qkPermisos = () => ["notif-permisos"] as const;
const qkHistorial = (uid: string) => ["notif-historial", uid] as const;

/** Estado de permisos de notificaciones del SO. */
export function usePermisosNotificacion() {
  return useQuery<PermisosNotificacion>({
    queryKey: qkPermisos(),
    queryFn: estadoPermisos,
    staleTime: 1000 * 60 * 5,
  });
}

/** Solicita permisos al usuario y actualiza el estado. */
export function useSolicitarPermisosNotificacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: solicitarPermisosNotificacion,
    onSuccess: () => qc.invalidateQueries({ queryKey: qkPermisos() }),
  });
}

/** Historial de las últimas notificaciones enviadas (7 días). */
export function useHistorialNotificaciones() {
  const userId = useAuthStore((s) => s.user?.id ?? "anon");
  return useQuery({
    queryKey: qkHistorial(userId),
    queryFn: () => fetchHistorialNotificaciones(userId),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Efecto principal: evalúa alertas activas y dispara push si corresponde.
 * Llama esto SOLO una vez desde el root layout o la pantalla "Hoy".
 */
export function useNotificacionesAutomaticas() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { data: consents } = useConsents();
  const { alertas } = useAlertas();

  useEffect(() => {
    if (!userId || !consents?.notificaciones || alertas.length === 0) return;
    // Fire-and-forget: no bloquea el render
    enviarNotificacionesDeAlertas(userId, alertas, consents.notificaciones).catch(
      () => {},
    );
  }, [userId, alertas, consents?.notificaciones]);
}

/** Programa el recordatorio recurrente de sedentarismo (90 min). */
export function useProgramarRecordatorio() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { data: consents } = useConsents();

  return useMutation({
    mutationFn: () =>
      programarRecordatorioSedentarismo(userId!, consents?.notificaciones ?? false),
  });
}

export function useCancelarNotificaciones() {
  return useMutation({ mutationFn: cancelarTodasLasNotificaciones });
}
