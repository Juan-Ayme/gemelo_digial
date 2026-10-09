/**
 * ando · Gemelo Digital — Hook de alertas de salud
 *
 * Deriva las AlertaSalud desde los eventos de hoy y el snapshot del gemelo.
 * Usa un selector de TanStack Query: cero fetches extra, cero estado manual.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { qk } from "@lib/queryClient";
import { useAuthStore } from "@stores/authStore";
import { fetchEventsToday } from "@services/gemelo";
import { generarAlertas } from "@services/alertas";
import { useMetas } from "@hooks/useMetas";
import { useGemelo } from "@hooks/useGemelo";
import type { EventoRow } from "@services/types";

/** Extrae el bpm promedio del día de los eventos crudos. */
function bpmDeEventos(eventos: EventoRow[]): number | null {
  const muestras = eventos
    .filter((e) => e.tipo_evento === "ritmo_cardiaco" && typeof e.valor_numerico === "number")
    .map((e) => e.valor_numerico as number);
  if (!muestras.length) return null;
  return Math.round(muestras.reduce((a, b) => a + b, 0) / muestras.length);
}

/** Calcula cuántos minutos consecutivos lleva el usuario sin moverse. */
function minSedentariosConsecutivos(eventos: EventoRow[]): number {
  const sorted = [...eventos].sort((a, b) => b.inicio_en.localeCompare(a.inicio_en));
  let mins = 0;
  for (const e of sorted) {
    const act = e.valor_texto ?? "";
    if (act === "permanencia" || act === "descanso") {
      const dur =
        e.fin_en
          ? (new Date(e.fin_en).getTime() - new Date(e.inicio_en).getTime()) / 60000
          : (e.datos_minimos?.["minutos"] as number | undefined) ?? 0;
      mins += Math.max(0, dur);
    } else {
      break; // actividad distinta rompe la racha
    }
  }
  return Math.round(mins);
}

export function useAlertas() {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { data: gemelo } = useGemelo();
  const { data: metas } = useMetas();

  const eventosQuery = useQuery({
    queryKey: userId ? qk.events(userId) : ["events", "anon"],
    enabled: !!userId,
    queryFn: () => fetchEventsToday(userId!),
  });

  const alertas = useMemo(() => {
    if (!gemelo || !eventosQuery.data) return [];
    const eventos = eventosQuery.data;
    const bpm = bpmDeEventos(eventos);
    const minSed = minSedentariosConsecutivos(eventos);
    return generarAlertas(gemelo, bpm, minSed, metas);
  }, [gemelo, eventosQuery.data, metas]);

  return {
    alertas,
    isLoading: !gemelo || eventosQuery.isLoading,
  };
}
