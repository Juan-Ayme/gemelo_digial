import { Platform } from "react-native";
import * as Location from "expo-location";
import { Accelerometer, Pedometer } from "expo-sensors";

import { lget } from "@services/localDb";
import { fechaLocal } from "@services/metricas";
import { nuevoEvento, uuidDeLectura } from "@services/eventoFactory";
import { leerHealthConnect, solicitarPermisosHealthConnect } from "@services/healthConnect";
import type { ActividadPredicha, ConsentMap, EventoRow } from "@services/types";

/**
 * Captura de sensores REALES del teléfono:
 *   - Movimiento (acelerómetro) → actividad "desplazamiento" / "permanencia"  [Android + iOS]
 *   - Ubicación (expo-location) → zona general (NUNCA coordenadas exactas)     [Android + iOS]
 *   - Pasos (podómetro) → solo iOS
 *   - Pasos (Android), sueño y frecuencia cardiaca → vía Health Connect        [Android + dev build]
 *
 * Cada lectura se gobierna por el consentimiento del titular y se guarda como
 * `evento_crudo` real.
 */

/** Convierte coordenadas en un id de zona opaco (~celda de 1 km). Sin lat/lng. */
function zonaDeCoords(lat: number, lng: number): string {
  const cell = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  let h = 0;
  for (let i = 0; i < cell.length; i++) h = (h * 31 + cell.charCodeAt(i)) | 0;
  return `Zona-${Math.abs(h).toString(36).slice(0, 4).toUpperCase()}`;
}

async function leerZona(): Promise<string | null> {
  try {
    const perm = await Location.getForegroundPermissionsAsync();
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
): Promise<{ actividad: ActividadPredicha; confianza: number } | null> {
  return new Promise((resolve) => {
    const mags: number[] = [];
    let sub: { remove: () => void } | null = null;

    const finish = () => {
      try {
        sub?.remove();
      } catch {
        /* noop */
      }
      if (mags.length < 3) return resolve(null);
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
      return resolve(null);
    }
    setTimeout(finish, ms);
  });
}

/** Pasos del día como incremento desde la última lectura (podómetro iOS). */
async function leerPasosIncremento(userId: string): Promise<{ pasos: number; total: number; date: string; key: string } | null> {
  if (Platform.OS !== "ios") return null; // Android: los pasos llegan por Health Connect
  try {
    if (!(await Pedometer.isAvailableAsync())) return null;
    const perm = await Pedometer.getPermissionsAsync();
    if (!perm.granted) return null;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { steps } = await Pedometer.getStepCountAsync(start, new Date());
    if (!Number.isFinite(steps) || steps < 0) return null;
    const today = fechaLocal(start);
    const key = `pasos_last:${userId}`;
    const prev = await lget<{ date: string; total: number }>(key, { date: "", total: 0 });
    const base = prev.date === today ? prev.total : 0;
    return { pasos: Math.max(0, steps - base), total: steps, date: today, key };
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

  if (consents.actividad && await Accelerometer.isAvailableAsync()) {
    const sample = await muestreaActividad();
    if (sample) { const { actividad, confianza } = sample;
    eventos.push(
      nuevoEvento({
        tipo_evento: "ventana_actividad",
        valor_texto: actividad,
        zona_general: zona,
        confianza,
        calidad: confianza,
        medido_directamente: false,
        datos_minimos: { fuente: "acelerometro" },
      }),
    );
  }

  }

  if (consents.pasos) {
    const pasos = await leerPasosIncremento(userId);
    if (pasos != null) {
      eventos.push(
        nuevoEvento({
          evento_uuid: await uuidDeLectura(`${userId}:podometro:${pasos.date}:${pasos.total}`),
          tipo_evento: "pasos",
          unidad: "pasos",
          valor_numerico: pasos.pasos,
          zona_general: zona,
          datos_minimos: { fuente: "podometro", contador_total: pasos.total, contador_fecha: pasos.date, contador_clave: pasos.key },
        }),
      );
    }
  }

  // Health Connect (Android + development build): pasos, sueño y ritmo cardiaco.
  const hc = await leerHealthConnect(userId, consents);
  eventos.push(...hc);

  // Si solo consintió la zona, igualmente registramos una lectura de ubicación.
  if (!eventos.length && zona) {
    eventos.push(
      nuevoEvento({
        tipo_evento: "ubicacion",
        valor_texto: "permanencia",
        zona_general: zona,
        datos_minimos: { fuente: "gps" },
      }),
    );
  }

  return eventos;
}

/** Se invoca desde una acción visible; nunca desde la tarea del sistema. */
export async function solicitarPermisosSensores(consents: ConsentMap) {
  if (consents.zona_general) await Location.requestForegroundPermissionsAsync();
  if (consents.actividad) await Accelerometer.requestPermissionsAsync();
  if (consents.pasos && Platform.OS === "ios") await Pedometer.requestPermissionsAsync();
  await solicitarPermisosHealthConnect(consents);
}
// Serializa lectura y guardado juntos: dos capturas no consumen el mismo contador.
let capture: Promise<unknown> = Promise.resolve();
export function capturarYGuardar(id: string, consents: ConsentMap, vigente?: () => boolean): Promise<number> {
  const result = capture.catch(() => {}).then(async () => {
    if (vigente && !vigente()) return 0;
    const events = await capturarSensoresReales(id, consents);
    if (vigente && !vigente()) return 0;
    if (events.length) { const { insertEventos } = await import("@services/gemelo"); await insertEventos(id, events); }
    return events.length;
  }); capture = result; return result;
}

/** Actualización silenciosa: solo pasos autorizados, sin pedir permisos del sistema. */
export function capturarPasosAutomaticos(id: string, consents: ConsentMap, vigente?: () => boolean) {
  if (!consents.pasos) return Promise.resolve(0);
  return capturarYGuardar(id, {
    ...consents, actividad: false, zona_general: false, sueno: false,
    fisiologia: false, wearable: false, ambiente: false,
  }, vigente);
}
