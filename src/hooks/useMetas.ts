import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@stores/authStore";
import { fetchMetas, saveMetas, calcularProgreso } from "@services/metas";
import { useGemelo } from "@hooks/useGemelo";
import type { MetasConfig } from "@services/metas";

import { qk } from "@lib/queryClient";

export function useMetas() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: userId ? qk.metas(userId) : ["metas-anon"],
    enabled: !!userId,
    queryFn: () => fetchMetas(userId!),
    staleTime: 1000 * 60 * 60, // 1 h
  });
}

export function useSaveMetas() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useMutation({
    mutationFn: (metas: MetasConfig) => saveMetas(userId!, metas),
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: qk.metas(userId) });
    },
  });
}

export function useProgresoMetas() {
  const { data: metas } = useMetas();
  const { data: gemelo } = useGemelo();
  if (!metas || !gemelo) return { data: null };
  return {
    disponibles: { pasos: gemelo.fuentes.some(f => f.codigo === "steps" && f.disponible), minutosActivos: !!gemelo.tieneDuracionActividad, horasSueno: gemelo.fuentes.some(f => f.codigo === "sleep" && f.disponible) },
    data: calcularProgreso(metas, {
      pasosHoy: gemelo.pasosHoy,
      minutosActivos: gemelo.minutosActivos,
      minutosDescanso: gemelo.minutosDescanso,
      minutosSueno: gemelo.minutosSueno,
    }),
  };
}
