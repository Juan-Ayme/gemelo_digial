import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@lib/queryClient";
import { config } from "@constants/config";
import { useAuthStore } from "@stores/authStore";
import { DEFAULT_CONSENTS, fetchConsents, setConsent } from "@services/consent";
import { actualizarContextoBg } from "@services/backgroundCapture";
import type { ConsentMap } from "@services/types";
import type { CategoriaConsentimiento } from "@schemas/consent";

export function useConsents() {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const query = useQuery({
    queryKey: userId ? qk.consents(userId) : ["consents", "anon"],
    enabled: !!userId,
    queryFn: () => fetchConsents(userId!),
    placeholderData: { ...DEFAULT_CONSENTS } as ConsentMap,
  });
  useEffect(() => {
    if (!userId || !query.data || query.isPlaceholderData || query.isError) return;
    actualizarContextoBg(userId, query.data).catch(() => {});
  }, [userId, query.data, query.isPlaceholderData, query.isError]);
  return query;
}

type SetConsentVars = {
  categoria: CategoriaConsentimiento;
  otorgado: boolean;
  finalidad: string;
};

export function useSetConsent() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: (v: SetConsentVars) =>
      setConsent({
        userId: userId!,
        categoria: v.categoria,
        otorgado: v.otorgado,
        finalidad: v.finalidad,
        version: config.app.consentVersion,
      }),
    onMutate: async v => {
      if (userId && v.categoria === "notificaciones" && !v.otorgado) {
        await import("@services/planPersonal").then(m => m.cancelarRecordatoriosPlanes(userId));
        await import("@services/notificaciones").then(m => m.cancelarTodasLasNotificaciones());
      }
      await import("@services/backgroundCapture").then(m => m.cancelarTareaSegundoPlano());
    },
    onSuccess: async () => {
      if (!userId) return;
      const consents = await fetchConsents(userId);
      qc.setQueryData(qk.consents(userId), consents);
      await actualizarContextoBg(userId, consents);
    },
    onSettled: () => {
      if (userId) qc.invalidateQueries({ queryKey: qk.consents(userId) });
    },
  });
}
