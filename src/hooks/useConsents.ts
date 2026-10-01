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

  return useQuery({
    queryKey: userId ? qk.consents(userId) : ["consents", "anon"],
    enabled: !!userId,
    queryFn: () => fetchConsents(userId!),
    placeholderData: { ...DEFAULT_CONSENTS } as ConsentMap,
  });
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
    // Actualización optimista: el switch responde al instante.
    onMutate: async (v) => {
      if (!userId) return { prev: undefined };
      await qc.cancelQueries({ queryKey: qk.consents(userId) });
      const prev = qc.getQueryData<ConsentMap>(qk.consents(userId));
      const siguiente: ConsentMap = {
        ...(prev ?? DEFAULT_CONSENTS),
        [v.categoria]: v.otorgado,
      };
      qc.setQueryData<ConsentMap>(qk.consents(userId), siguiente);
      // Sincroniza los consentimientos con AsyncStorage para la tarea BG
      actualizarContextoBg(userId, siguiente).catch(() => {});
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (userId && ctx?.prev) qc.setQueryData(qk.consents(userId), ctx.prev);
    },
    onSettled: () => {
      if (userId) qc.invalidateQueries({ queryKey: qk.consents(userId) });
    },
  });
}
