import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@lib/queryClient";
import { useAuthStore } from "@stores/authStore";
import {
  buildGemelo,
  buildRutina,
  fetchEventsToday,
  fetchPrediccionRF,
  insertEventos,
  insertEventoSimulado,
} from "@services/gemelo";
import { capturarSensoresReales } from "@services/sensors";
import type {
  ConsentMap,
  EventoRow,
  GemeloSnapshot,
  RutinaBloque,
} from "@services/types";
import type { FuentePrediccion } from "@services/gemelo";

// ─── Eventos de hoy (base para todas las derivaciones) ─────────────────────

function useEventosHoy<T>(select: (events: EventoRow[]) => T) {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useQuery({
    queryKey: userId ? qk.events(userId) : ["events", "anon"],
    enabled: !!userId,
    queryFn: () => fetchEventsToday(userId!),
    select,
  });
}

// ─── Predicción del pipeline RF (tabla predicciones de Supabase) ────────────

function usePrediccionRF() {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  return useQuery({
    queryKey: userId ? qk.prediccion(userId) : ["prediccion-rf", "anon"],
    enabled: !!userId,
    queryFn: () => fetchPrediccionRF(userId!),
    // El pipeline corre 1 vez/día: 30 min "fresco" evita requests innecesarios
    // pero permite actualizar la predicción durante el día si el pipeline reescribió.
    staleTime: 1000 * 60 * 30,
  });
}

// ─── Hook principal ─────────────────────────────────────────────────────────

/**
 * Snapshot del gemelo digital con predicción de la mejor fuente disponible:
 *   1. Predicción del Random Forest (pipeline PySpark → tabla `predicciones`)
 *   2. Heurística de frecuencia local (fallback cuando no hay RF)
 *
 * `fuentePrediccion` indica cuál de las dos se está usando.
 */
export function useGemelo(): {
  data: (GemeloSnapshot & { fuentePrediccion: FuentePrediccion }) | undefined;
  isLoading: boolean;
} {
  const eventosQuery = useEventosHoy<GemeloSnapshot>(buildGemelo);
  const rfQuery = usePrediccionRF();

  const snapshot = eventosQuery.data;
  const rfResult = rfQuery.data;

  const data = snapshot
    ? {
        ...snapshot,
        // RF tiene prioridad; heurística es el fallback silencioso
        prediccion: rfResult?.prediccion ?? snapshot.prediccion,
        fuentePrediccion: (rfResult?.fuente ?? snapshot.fuentePrediccion ?? "rf_local") as FuentePrediccion,
      }
    : undefined;

  return {
    data,
    isLoading: eventosQuery.isLoading || rfQuery.isLoading,
  };
}

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
