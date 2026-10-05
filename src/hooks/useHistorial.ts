import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@stores/authStore";
import { fetchHistorial, calcularSemana } from "@services/historial";
import type { DiaResumen, SemanaResumen } from "@services/historial";

const qkHistorial = (userId: string) => ["historial", userId] as const;

export function useHistorial(dias: number = 7) {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useQuery({
    queryKey: userId ? [...qkHistorial(userId), dias] : ["historial-anon"],
    enabled: !!userId,
    queryFn: () => fetchHistorial(userId!, dias),
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

export function useSemanaResumen(dias: number = 7) {
  const { data: historial, ...rest } = useHistorial(dias);
  return {
    data: historial ? calcularSemana(historial) : undefined,
    ...rest,
  };
}
