import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@lib/queryClient";
import { useAuthStore } from "@stores/authStore";
import { useConsents } from "@hooks/useConsents";
import { fetchConsents } from "@services/consent";
import { capturarPasosAutomaticos } from "@services/sensors";
import { leerEventosDesde } from "@services/eventStore";
import { fechaLocal } from "@services/metricas";
import { resumirImpactoAutomatico } from "@services/impacto";
import type { ConsentMap } from "@services/types";

/** Solo pasos ya autorizados: no abre permisos, formulario, GPS ni otros sensores. */
export function useImpacto() {
  const id = useAuthStore(s => s.user?.id ?? "");
  const demo = useAuthStore(s => s.demoMode);
  const consents = useConsents();
  const qc = useQueryClient();
  const [dia, setDia] = useState(() => fechaLocal(new Date()));
  const [visible, setVisible] = useState(false);
  const [activo, setActivo] = useState(AppState.currentState !== "background" && AppState.currentState !== "inactive");
  const listo = !consents.isPlaceholderData && !consents.isError && !!consents.data;
  const autorizado = listo && consents.data!.pasos;
  const habilitado = !!id && visible && activo && listo && (autorizado || demo);
  const key = [...qk.impacto(id), "automatico", dia, demo] as const;

  useEffect(() => {
    const timer = setInterval(() => setDia(fechaLocal(new Date())), 60000);
    const subscription = AppState.addEventListener("change", state => {
      setActivo(state === "active");
      if (state === "active") {
        setDia(fechaLocal(new Date()));
        void qc.invalidateQueries({ queryKey: qk.impacto(id) });
      }
    });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [id, qc]);
  useFocusEffect(useCallback(() => {
    setVisible(true); setDia(fechaLocal(new Date()));
    if (id) void qc.invalidateQueries({ queryKey: qk.impacto(id) });
    return () => setVisible(false);
  }, [id, qc]));
  useEffect(() => {
    if (!habilitado) void qc.cancelQueries({ queryKey: [...qk.impacto(id), "automatico"] });
  }, [habilitado, id, qc]);

  const query = useQuery({
    queryKey: key, enabled: habilitado, refetchInterval: 60000, refetchIntervalInBackground: false,
    queryFn: async ({ signal }) => {
      const vigente = () => !signal.aborted && useAuthStore.getState().user?.id === id;
      if (!vigente()) throw new Error("Consulta cancelada.");
      // El permiso vigente evita capturar después de una revocación en Perfil.
      if (autorizado) {
        const permisos = await fetchConsents(id);
        if (!vigente()) throw new Error("Consulta cancelada.");
        if (!permisos.pasos) {
          qc.setQueryData(qk.consents(id), permisos);
          return [];
        }
        const permitir = () => vigente() && qc.getQueryData<ConsentMap>(qk.consents(id))?.pasos === true;
        const n = await capturarPasosAutomaticos(id, permisos, permitir);
        if (!vigente()) throw new Error("Consulta cancelada.");
        if (n) {
          void qc.invalidateQueries({ queryKey: qk.events(id) });
          void qc.invalidateQueries({ queryKey: qk.eventHistory(id) });
          void qc.invalidateQueries({ queryKey: qk.historialPrefix(id) });
          void qc.invalidateQueries({ queryKey: qk.sync(id) });
        }
      }
      const desde = new Date(); desde.setDate(desde.getDate() - 6); desde.setHours(0, 0, 0, 0);
      const rows = await leerEventosDesde(id, desde);
      if (!vigente()) throw new Error("Consulta cancelada.");
      return rows;
    },
  });
  const resumen = resumirImpactoAutomatico(listo && (autorizado || demo) ? query.data ?? [] : [], new Date(), demo);
  return { query, resumen, demo, autorizado, cargandoPermisos: consents.isPlaceholderData, errorPermisos: consents.isError };
}

