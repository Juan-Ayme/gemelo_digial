import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@stores/authStore";
import { fetchSuscripcion, activarPro } from "@services/suscripcion";

import { qk } from "@lib/queryClient";

export function useSuscripcion() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: userId ? qk.suscripcion(userId) : ["sub-anon"],
    enabled: !!userId,
    queryFn: () => fetchSuscripcion(userId!),
    staleTime: 60000,
    refetchInterval: 60000,
  });
}

export function useActivarPro() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useMutation({
    mutationFn: () => activarPro(userId!),
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: qk.suscripcion(userId) });
    },
  });
}

export function useEsPro() {
  const { data } = useSuscripcion();
  return data?.tier === "pro" || data?.tier === "investigador";
}
