import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@stores/authStore";
import { fetchSuscripcion, activarPro } from "@services/suscripcion";

const qkSub = (userId: string) => ["suscripcion", userId] as const;

export function useSuscripcion() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: userId ? qkSub(userId) : ["sub-anon"],
    enabled: !!userId,
    queryFn: () => fetchSuscripcion(userId!),
    staleTime: 1000 * 60 * 60,
  });
}

export function useActivarPro() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useMutation({
    mutationFn: () => activarPro(userId!),
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: qkSub(userId) });
    },
  });
}

export function useEsPro() {
  const { data } = useSuscripcion();
  return data?.tier === "pro" || data?.tier === "investigador";
}
