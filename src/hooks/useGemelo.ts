import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { AppState } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@lib/queryClient";
import { useAuthStore } from "@stores/authStore";
import { buildGemelo, buildRutina, fetchEventsToday, fetchPrediccionRF, insertEventoSimulado } from "@services/gemelo";
import { capturarYGuardar, solicitarPermisosSensores } from "@services/sensors";
import { leerEventosDesde, estadoSincronizacion, sincronizarEventos } from "@services/eventStore";
import { fechaLocal } from "@services/metricas";
import { estadoTareaSegundoPlano } from "@services/backgroundCapture";
import type { ConsentMap } from "@services/types";

// La fecha forma parte de la clave: al cruzar medianoche no reutilizamos ayer.
function useDia() {
  const [dia, setDia] = useState(fechaLocal(new Date()));
  useEffect(() => {
    const actualizar = () => setDia(fechaLocal(new Date()));
    const timer = setInterval(actualizar, 60000);
    const state = AppState.addEventListener("change", value => { if (value === "active") actualizar(); });
    return () => { clearInterval(timer); state.remove(); };
  }, []);
  return dia;
}
function useEventosHoy() {
  const id = useAuthStore(s => s.user?.id ?? ""); const dia = useDia();
  return useQuery({ queryKey: [...qk.events(id), dia], enabled: !!id, queryFn: () => fetchEventsToday(id), refetchInterval: 60000 });
}
export function useGemelo() {
  const id = useAuthStore(s => s.user?.id ?? "");
  const events = useEventosHoy();
  const history = useQuery({ queryKey: qk.eventHistory(id), enabled: !!id, queryFn: () => { const d = new Date(); d.setDate(d.getDate() - 30); return leerEventosDesde(id, d); } });
  const rf = useQuery({ queryKey: qk.prediccion(id), enabled: !!id, queryFn: () => fetchPrediccionRF(id), staleTime: 60000, refetchInterval: 60000 });
  const refetch = async () => {
    const [result] = await Promise.all([events.refetch(), history.refetch(), rf.refetch()]);
    return result;
  };
  const snapshot = events.data ? buildGemelo(events.data, history.data ?? []) : undefined;
  const prediction = rf.data?.prediccion;
  const vigente = prediction && Date.now() - Date.parse(prediction.generadaEn) <= prediction.horizonteMin * 60000;
  return { data: snapshot ? { ...snapshot, prediccion: vigente ? prediction : snapshot.prediccion, fuentePrediccion: vigente ? "rf" as const : snapshot.fuentePrediccion } : undefined,
    isLoading: events.isLoading, isFetching: events.isFetching, error: events.error, refetch };
}

/** Recuperar lecturas al volver a una pantalla o al reabrir la app en el teléfono. */
export function useActualizarLecturasAlVolver() {
  const id = useAuthStore(s => s.user?.id ?? "");
  const qc = useQueryClient();
  useFocusEffect(useCallback(() => {
    if (!id) return;
    const actualizar = () => {
      qc.invalidateQueries({ queryKey: qk.events(id) });
      qc.invalidateQueries({ queryKey: qk.eventHistory(id) });
      qc.invalidateQueries({ queryKey: qk.prediccion(id) });
      qc.invalidateQueries({ queryKey: qk.historialPrefix(id) });
      qc.invalidateQueries({ queryKey: qk.sync(id) });
      qc.invalidateQueries({ queryKey: qk.background(id) });
      qc.invalidateQueries({ queryKey: qk.impacto(id) });
    };
    actualizar();
    const subscription = AppState.addEventListener("change", state => { if (state === "active") actualizar(); });
    return () => subscription.remove();
  }, [id, qc]));
}
export function useRutina() { const query = useEventosHoy(); return { ...query, data: query.data ? buildRutina(query.data) : undefined }; }
function useRefrescar() {
  const qc = useQueryClient(); const id = useAuthStore(s => s.user?.id ?? "");
  return () => { qc.invalidateQueries({ queryKey: qk.events(id) }); qc.invalidateQueries({ queryKey: qk.eventHistory(id) }); qc.invalidateQueries({ queryKey: qk.historialPrefix(id) }); qc.invalidateQueries({ queryKey: qk.sync(id) }); qc.invalidateQueries({ queryKey: qk.impacto(id) }); };
}
export function useSimularCaptura() {
  const id = useAuthStore(s => s.user?.id ?? ""); const refresh = useRefrescar();
  return useMutation({ mutationFn: () => insertEventoSimulado(id), onSuccess: refresh });
}
export function useCapturarSensores() {
  const id = useAuthStore(s => s.user?.id ?? ""); const refresh = useRefrescar();
  return useMutation({ mutationFn: async (consents: ConsentMap) => { await solicitarPermisosSensores(consents); const n = await capturarYGuardar(id, consents); if (!n) throw new Error("sin-sensores"); return n; }, onSuccess: refresh });
}
export function useEstadoCaptura() {
  const id = useAuthStore(s => s.user?.id ?? "");
  const sync = useQuery({ queryKey: qk.sync(id), enabled: !!id, queryFn: () => estadoSincronizacion(id), refetchInterval: 15000 });
  const bg = useQuery({ queryKey: qk.background(id), enabled: !!id, queryFn: estadoTareaSegundoPlano, refetchInterval: 30000 });
  const refresh = useRefrescar();
  const retry = useMutation({ mutationFn: () => sincronizarEventos(id), onSuccess: refresh });
  return { sync, bg, retry };
}
