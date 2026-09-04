import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@lib/queryClient";
import { useAuthStore } from "@stores/authStore";
import {
  buildGemelo,
  buildRutina,
  fetchEventsToday,
  insertEventos,
  insertEventoSimulado,
} from "@services/gemelo";
import { capturarSensoresReales } from "@services/sensors";
import type { ConsentMap, EventoRow, GemeloSnapshot, RutinaBloque } from "@services/types";

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

/** Lee los sensores reales autorizados, los guarda y refresca el gemelo/rutina. */
export function useCapturarSensores() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useMutation({
    mutationFn: async (consents: ConsentMap) => {
      const eventos = await capturarSensoresReales(userId!, consents);
      if (!eventos.length) throw new Error("sin-sensores");
      await insertEventos(userId!, eventos);
      return eventos.length;
    },
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: qk.events(userId) });
    },
  });
}
