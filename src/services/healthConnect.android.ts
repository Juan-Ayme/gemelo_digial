import Constants from "expo-constants";

import { lget, lset } from "@services/localDb";
import { nuevoEvento } from "@services/eventoFactory";
import type { ConsentMap, EventoRow } from "@services/types";

/**
 * Lectura real de Health Connect (Android + development build): pasos, sueño y
 * frecuencia cardiaca de hoy, según el consentimiento del titular.
 *
 * IMPORTANTE: Expo Go NO incluye este módulo nativo. Por eso:
 *   1) detectamos Expo Go y salimos sin tocar nada;
 *   2) la librería se importa de forma DIFERIDA (dynamic import) dentro de un
 *      try/catch, para que su ausencia nunca rompa el arranque de la app.
 */

const enExpoGo = Constants.appOwnership === "expo";

function rangoDeHoy() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return {
    operator: "between" as const,
    startTime: start.toISOString(),
    endTime: new Date().toISOString(),
  };
}

export async function leerHealthConnect(
  userId: string,
  consents: ConsentMap,
): Promise<EventoRow[]> {
  const quierePasos = consents.pasos;
  const quiereSueno = consents.sueno;
  const quiereRitmo = consents.fisiologia || consents.wearable;
  if (enExpoGo) return []; // en Expo Go no hay módulos nativos
  if (!quierePasos && !quiereSueno && !quiereRitmo) return [];

  try {
    const {
      aggregateRecord,
      getSdkStatus,
      initialize,
      readRecords,
      requestPermission,
      SdkAvailabilityStatus,
    } = await import("react-native-health-connect");

    const status = await getSdkStatus();
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return [];
    if (!(await initialize())) return [];

    const permisos: { accessType: "read"; recordType: any }[] = [];
    if (quierePasos) permisos.push({ accessType: "read", recordType: "Steps" });
    if (quiereSueno) permisos.push({ accessType: "read", recordType: "SleepSession" });
    if (quiereRitmo) permisos.push({ accessType: "read", recordType: "HeartRate" });
    await requestPermission(permisos);

    const rango = rangoDeHoy();
    const eventos: EventoRow[] = [];

    // Pasos como incremento desde la última lectura (buildGemelo suma pasos).
    if (quierePasos) {
      try {
        const agg: any = await aggregateRecord({ recordType: "Steps", timeRangeFilter: rango });
        const total = Number(agg?.COUNT_TOTAL ?? 0);
        const today = rango.startTime.slice(0, 10);
        const key = `pasos_hc_last:${userId}`;
        const prev = await lget<{ date: string; total: number }>(key, { date: "", total: 0 });
        const base = prev.date === today ? prev.total : 0;
        await lset(key, { date: today, total });
        eventos.push(
          nuevoEvento({
            procedencia: "health_connect",
            tipo_evento: "pasos",
            unidad: "pasos",
            valor_numerico: Math.max(0, total - base),
            datos_minimos: { fuente: "health_connect" },
          }),
        );
      } catch {
        /* tipo no disponible */
      }
    }

    // Sueño de hoy (minutos totales).
    if (quiereSueno) {
      try {
        const res: any = await readRecords("SleepSession", { timeRangeFilter: rango });
        const records: any[] = res?.records ?? res ?? [];
        let minutos = 0;
        for (const r of records) {
          if (r?.startTime && r?.endTime) {
            minutos += (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000;
          }
        }
        if (minutos > 0) {
          eventos.push(
            nuevoEvento({
              procedencia: "health_connect",
              tipo_evento: "sueno",
              unidad: "min",
              valor_numerico: Math.round(minutos),
              datos_minimos: { fuente: "health_connect" },
            }),
          );
        }
      } catch {
        /* tipo no disponible */
      }
    }

    // Frecuencia cardiaca (promedio de las muestras de hoy).
    if (quiereRitmo) {
      try {
        const res: any = await readRecords("HeartRate", { timeRangeFilter: rango });
        const records: any[] = res?.records ?? res ?? [];
        const bpms: number[] = [];
        for (const r of records) {
          for (const s of r?.samples ?? []) {
            if (typeof s?.beatsPerMinute === "number") bpms.push(s.beatsPerMinute);
          }
        }
        if (bpms.length) {
          const avg = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);
          eventos.push(
            nuevoEvento({
              procedencia: "health_connect",
              tipo_evento: "ritmo_cardiaco",
              unidad: "bpm",
              valor_numerico: avg,
              confianza: 90,
              calidad: 90,
              datos_minimos: { fuente: "health_connect", muestras: bpms.length },
            }),
          );
        }
      } catch {
        /* tipo no disponible */
      }
    }

    return eventos;
  } catch {
    // Módulo no disponible (p. ej. Expo Go) o error de lectura: se omite.
    return [];
  }
}
