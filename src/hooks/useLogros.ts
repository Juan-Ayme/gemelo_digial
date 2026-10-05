import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@stores/authStore";
import { qk } from "@lib/queryClient";
import {
  fetchLogros,
  desbloquearLogro,
  evaluarLogros,
  type LogroId,
} from "@services/logros";
import { useHistorial } from "@hooks/useHistorial";
import { useConsents } from "@hooks/useConsents";
import { useGemelo } from "@hooks/useGemelo";

export function useLogros() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useQuery({
    queryKey: userId ? qk.logros(userId) : ["logros-anon"],
    enabled: !!userId,
    queryFn: () => fetchLogros(userId!),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDesbloquearLogro() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  return useMutation({
    mutationFn: (id: LogroId) => desbloquearLogro(userId!, id),
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: qk.logros(userId) });
    },
  });
}

/** Evalúa y desbloquea automáticamente los logros ganados. */
export function useEvaluarLogros() {
  const { data: historial } = useHistorial(7);
  const { data: consents } = useConsents();
  const { data: gemelo } = useGemelo();
  const desbloquear = useDesbloquearLogro();

  const evaluar = () => {
    if (!historial) return;
    const nuevos = evaluarLogros(
      historial,
      gemelo?.totalEventos ?? 0,
      consents?.investigacion ?? false,
    );
    for (const id of nuevos) {
      desbloquear.mutate(id);
    }
  };

  return { evaluar };
}
