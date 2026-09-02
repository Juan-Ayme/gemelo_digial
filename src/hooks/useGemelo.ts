import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@lib/queryClient";
import { useAuthStore } from "@stores/authStore";
import {
  buildGemelo,
  buildRutina,
  fetchEventsToday,
  insertEventoSimulado,
} from "@services/gemelo";
import type { EventoRow, GemeloSnapshot, RutinaBloque } from "@services/types";

function useEventosHoy<T>(select: (events: EventoRow[]) => T) {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useQuery({
    queryKey: userId ? qk.events(userId) : ["events", "anon"],
    enabled: !!userId,
    queryFn: () => fetchEventsToday(userId!),
    select,
  });
}

/** Snapshot del gemelo derivado de los eventos de hoy. */
export const useGemelo = () => useEventosHoy<GemeloSnapshot>(buildGemelo);

/** Bloques de rutina (timeline) derivados de los eventos de hoy. */
export const useRutina = () => useEventosHoy<RutinaBloque[]>(buildRutina);

/** Inserta una ventana simulada y refresca el gemelo/rutina. */
export function useSimularCaptura() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: () => insertEventoSimulado(userId!),
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: qk.events(userId) });
    },
  });
}
