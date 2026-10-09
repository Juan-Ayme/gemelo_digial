import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@stores/authStore";
import { qk } from "@lib/queryClient";
import { fetchCambio, guardarCambio, marcarCambio, fetchPlanes, agregarPlan, actualizarPlan } from "@services/planPersonal";

export function useCambioPersonal() {
  const id = useAuthStore(s => s.user?.id ?? ""), qc = useQueryClient();
  const query = useQuery({ queryKey: qk.cambios(id), enabled: !!id, queryFn: () => fetchCambio(id) });
  const save = useMutation({ mutationFn: (texto: string) => guardarCambio(id, texto), onSuccess: data => qc.setQueryData(qk.cambios(id), data) });
  const mark = useMutation({ mutationFn: () => marcarCambio(id), onSuccess: data => qc.setQueryData(qk.cambios(id), data) });
  return { query, save, mark };
}
export function usePlanPersonal(dia: string) {
  const id = useAuthStore(s => s.user?.id ?? ""), qc = useQueryClient();
  const query = useQuery({ queryKey: qk.planes(id, dia), enabled: !!id, queryFn: () => fetchPlanes(id, dia) });
  const refresh = () => { qc.invalidateQueries({ queryKey: qk.planes(id, dia) }); };
  const add = useMutation({ mutationFn: (v: { texto: string; hora: string }) => agregarPlan(id, dia, v.texto, v.hora), onSuccess: refresh });
  const update = useMutation({ mutationFn: (v: { planId: string; action: "borrar" | "marcar" | "recordar" | "cancelar" }) => actualizarPlan(id, dia, v.planId, v.action), onSuccess: refresh });
  return { query, add, update };
}
