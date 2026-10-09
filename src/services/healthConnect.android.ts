import * as Crypto from "expo-crypto";
import Constants from "expo-constants";

import { lget } from "@services/localDb";
import { fechaLocal } from "@services/metricas";
import { nuevoEvento, uuidDeLectura } from "@services/eventoFactory";
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
      SdkAvailabilityStatus,
    } = await import("react-native-health-connect");

    const status = await getSdkStatus();
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return [];
    if (!(await initialize())) return [];

    const { getGrantedPermissions } = await import("react-native-health-connect");
    const granted = await getGrantedPermissions();
    const canRead = (type: string) => granted.some(p => p.accessType === "read" && p.recordType === type);

    const rango = rangoDeHoy();
    const eventos: EventoRow[] = [];

    // Pasos como incremento desde la última lectura (buildGemelo suma pasos).
    if (quierePasos && canRead("Steps")) {
      try {
        const agg: any = await aggregateRecord({ recordType: "Steps", timeRangeFilter: rango });
        const total = agg?.COUNT_TOTAL == null ? NaN : Number(agg.COUNT_TOTAL);
        if (!Number.isFinite(total) || total < 0) throw new Error("Sin lectura válida de pasos");
        const today = fechaLocal(rango.startTime);
        const key = `pasos_hc_last:${userId}`;
        const prev = await lget<{ date: string; total: number }>(key, { date: "", total: 0 });
        const base = prev.date === today ? prev.total : 0;

        eventos.push(
          nuevoEvento({
            evento_uuid: await uuidDeLectura(`${userId}:health_connect:${today}:${total}`),
            procedencia: "health_connect",
            tipo_evento: "pasos",
            unidad: "pasos",
            valor_numerico: Math.max(0, total - base),
            datos_minimos: { fuente: "health_connect", contador_total: total, contador_fecha: today, contador_clave: key },
          }),
        );
      } catch {
        /* tipo no disponible */
      }
    }

    // Sueño de hoy (minutos totales).
    if (quiereSueno && canRead("SleepSession")) {
      try {
        const res: any = await readRecords("SleepSession", { timeRangeFilter: { ...rango, startTime: new Date(Date.parse(rango.startTime) - 24 * 60 * 60000).toISOString() } });
        const records: any[] = res?.records ?? res ?? [];
        for (const r of records) {
          if (!r?.startTime || !r?.endTime) continue;
          const minutos = (Date.parse(r.endTime) - Date.parse(r.startTime)) / 60000;
          if (minutos <= 0) continue;
          const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${userId}:sleep:${r.id ?? r.startTime}:${r.endTime}`);
          const uuid = `${digest.slice(0,8)}-${digest.slice(8,12)}-4${digest.slice(13,16)}-8${digest.slice(17,20)}-${digest.slice(20,32)}`;
          eventos.push(nuevoEvento({
            evento_uuid: uuid, procedencia: "health_connect", tipo_evento: "sueno", unidad: "min",
            inicio_en: r.startTime, fin_en: r.endTime, valor_numerico: Math.round(minutos),
            datos_minimos: { fuente: "health_connect", sesion_sueno: true },
          }));
        }
      } catch {
        /* tipo no disponible */
      }
    }

    // Frecuencia cardiaca (promedio de las muestras de hoy).
    if (quiereRitmo && canRead("HeartRate")) {
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

export async function solicitarPermisosHealthConnect(consents: ConsentMap) {
  if (enExpoGo) return;
  try {
    const hc = await import("react-native-health-connect");
    if (await hc.getSdkStatus() !== hc.SdkAvailabilityStatus.SDK_AVAILABLE || !await hc.initialize()) return;
    const permisos: Parameters<typeof hc.requestPermission>[0] = [];
    if (consents.pasos) permisos.push({ accessType: "read", recordType: "Steps" });
    if (consents.sueno) permisos.push({ accessType: "read", recordType: "SleepSession" });
    if (consents.fisiologia || consents.wearable) permisos.push({ accessType: "read", recordType: "HeartRate" });
    if (permisos.length) await hc.requestPermission(permisos);
  } catch { /* En builds sin Health Connect, los otros sensores siguen disponibles. */ }
}
