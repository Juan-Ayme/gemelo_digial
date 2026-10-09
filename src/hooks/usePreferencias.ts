import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@lib/queryClient";
import { useAuthStore } from "@stores/authStore";
import { fetchPreferencias, savePreferencias, type Preferencias } from "@services/preferencias";

export function usePreferencias() {
  const id = useAuthStore(s => s.user?.id ?? "");
  return useQuery({ queryKey: qk.preferencias(id), enabled: !!id, queryFn: () => fetchPreferencias(id) });
}
export function useSavePreferencias() {
  const id = useAuthStore(s => s.user?.id ?? "");
  const qc = useQueryClient();
  return useMutation({ mutationFn: (value: Partial<Preferencias>) => savePreferencias(id, value),
    onSuccess: data => { qc.setQueryData(qk.preferencias(id), data); } });
}
