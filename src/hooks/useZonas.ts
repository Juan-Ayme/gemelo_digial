import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@lib/queryClient";
import { useAuthStore } from "@stores/authStore";
import { fetchAliasZonas, guardarAliasZona, type ZonasAliasMap } from "@services/zonas";

export function useAliasZonas() {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useQuery({
    queryKey: userId ? qk.zonas(userId) : ["zonas", "anon"],
    enabled: !!userId,
    queryFn: () => fetchAliasZonas(userId!),
    staleTime: 1000 * 60 * 10, // 10 min
  });
}

export function useGuardarAliasZona() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: ({ codigoZona, alias }: { codigoZona: string; alias: string }) => {
      if (!userId) throw new Error("Sin usuario autenticado");
      return guardarAliasZona(userId, codigoZona, alias);
    },
    onSuccess: (nuevoMapa) => {
      if (userId) {
        qc.setQueryData(qk.zonas(userId), nuevoMapa);
        qc.invalidateQueries({ queryKey: qk.events(userId) });
      }
    },
  });
}
