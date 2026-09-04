import { Platform } from "react-native";
import * as Crypto from "expo-crypto";
import * as Location from "expo-location";
import { Accelerometer, Pedometer } from "expo-sensors";

import { lget, lset } from "@services/localDb";
import type { ActividadPredicha, ConsentMap, EventoRow } from "@services/types";

/**
 * Captura de sensores REALES del teléfono con lo que ofrece Expo SDK 57
 * (funciona en Expo Go y en development build):
 *   - Movimiento (acelerómetro) → actividad "desplazamiento" / "permanencia"
 *   - Ubicación (expo-location) → zona general (NUNCA coordenadas exactas)
 *   - Pasos (podómetro) → solo iOS; Android requiere Health Connect (dev build)
 *
 * Cada lectura se gobierna por el consentimiento del titular y se guarda como
 * `evento_crudo` real (procedencia "telefono", medido_directamente=true).
 */

/** Convierte coordenadas en un id de zona opaco (~celda de 1 km). Sin lat/lng. */
function zonaDeCoords(lat: number, lng: number): string {
  const cell = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  let h = 0;
  for (let i = 0; i < cell.length; i++) h = (h * 31 + cell.charCodeAt(i)) | 0;
  return `Zona-${Math.abs(h).toString(36).slice(0, 4).toUpperCase()}`;
}

function nuevoEvento(part: Partial<EventoRow>): EventoRow {
  const now = new Date().toISOString();
  return {
    evento_uuid: Crypto.randomUUID(),
    procedencia: "telefono",
    tipo_evento: "ventana_actividad",
    inicio_en: now,
    fin_en: now,
    valor_numerico: null,
    valor_texto: null,
    unidad: null,
    confianza: null,
    zona_general: null,
    medido_directamente: true,
    disponibilidad: true,
    calidad: null,
    version_consentimiento: "v1.0",
    datos_minimos: { fuente: "sensores" },
    ...part,
  };
}

async function leerZona(): Promise<string | null> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    return zonaDeCoords(pos.coords.latitude, pos.coords.longitude);
  } catch {
    return null;
  }
}

/** Muestrea el acelerómetro ~1.5 s y clasifica movimiento vs quietud. */
async function muestreaActividad(
  ms = 1500,
): Promise<{ actividad: ActividadPredicha; confianza: number }> {
  return new Promise((resolve) => {
    const mags: number[] = [];
    let sub: { remove: () => void } | null = null;

    const finish = () => {
      try {
        sub?.remove();
      } catch {
        /* noop */
      }
      if (mags.length < 3) return resolve({ actividad: "permanencia", confianza: 50 });
      const mean = mags.reduce((a, b) => a + b, 0) / mags.length;
      const std = Math.sqrt(mags.reduce((a, b) => a + (b - mean) ** 2, 0) / mags.length);
      const moving = std > 0.08; // en g: quieto ≈ 0; caminar sube la varianza
      resolve({
        actividad: moving ? "desplazamiento" : "permanencia",
        confianza: Math.max(50, Math.min(99, Math.round(55 + std * 300))),
      });
    };

    try {
      Accelerometer.setUpdateInterval(100);
      sub = Accelerometer.addListener(({ x, y, z }) => {
        mags.push(Math.sqrt(x * x + y * y + z * z));
      });
    } catch {
      return resolve({ actividad: "permanencia", confianza: 50 });
    }
    setTimeout(finish, ms);
  });
}

/** Pasos del día como incremento desde la última lectura (iOS). */
async function leerPasosIncremento(userId: string): Promise<number | null> {
  if (Platform.OS !== "ios") return null; // Android: requiere Health Connect (dev build)
  try {
    if (!(await Pedometer.isAvailableAsync())) return null;
    const perm = await Pedometer.requestPermissionsAsync();
    if (!perm.granted) return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { steps } = await Pedometer.getStepCountAsync(start, new Date());
    const today = start.toISOString().slice(0, 10);
    const key = `pasos_last:${userId}`;
    const prev = await lget<{ date: string; total: number }>(key, { date: "", total: 0 });
    const base = prev.date === today ? prev.total : 0;
    await lset(key, { date: today, total: steps });
    return Math.max(0, steps - base);
  } catch {
    return null;
  }
}

export async function capturarSensoresReales(
  userId: string,
  consents: ConsentMap,
): Promise<EventoRow[]> {
  const zona = consents.zona_general ? await leerZona() : null;
  const eventos: EventoRow[] = [];

  if (consents.actividad) {
    const { actividad, confianza } = await muestreaActividad();
    eventos.push(
      nuevoEvento({
        tipo_evento: "ventana_actividad",
        valor_texto: actividad,
        zona_general: zona,
        confianza,
        calidad: confianza,
      }),
    );
  }

  if (consents.pasos) {
    const pasos = await leerPasosIncremento(userId);
    if (pasos != null) {
      eventos.push(
        nuevoEvento({
          tipo_evento: "pasos",
          unidad: "pasos",
          valor_numerico: pasos,
          zona_general: zona,
          datos_minimos: { fuente: "podometro" },
        }),
      );
    }
  }

  // Si solo consintió la zona, igualmente registramos una lectura de ubicación.
  if (!eventos.length && zona) {
    eventos.push(nuevoEvento({ tipo_evento: "ubicacion", valor_texto: "permanencia", zona_general: zona }));
  }

  return eventos;
}
