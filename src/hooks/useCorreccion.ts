import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@lib/queryClient";
import { useAuthStore } from "@stores/authStore";
import {
  fetchUltimaCorreccion,
  registrarCorreccionActividad,
} from "@services/correccion";
import type { ActividadPredicha } from "@services/types";

export function useUltimaCorreccion() {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useQuery({
    queryKey: userId ? qk.correcciones(userId) : ["correcciones", "anon"],
    enabled: !!userId,
    queryFn: () => fetchUltimaCorreccion(userId!),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useRegistrarCorreccion() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: (params: {
      actividadOriginal: ActividadPredicha;
      actividadCorregida: ActividadPredicha;
      confirmada: boolean;
      zonaActual?: string;
    }) => {
      if (!userId) throw new Error("Sin usuario autenticado");
      return registrarCorreccionActividad(userId, params);
    },
    onSuccess: () => {
      if (userId) {
        qc.invalidateQueries({ queryKey: qk.events(userId) });
        qc.invalidateQueries({ queryKey: qk.eventHistory(userId) });
        qc.invalidateQueries({ queryKey: qk.historialPrefix(userId) });
        qc.invalidateQueries({ queryKey: qk.sync(userId) });
        qc.invalidateQueries({ queryKey: qk.correcciones(userId) });
      }
    },
  });
}
