/**
 * ando · Gemelo Digital — Metas Personales
 * =========================================
 *
 * Gestiona las metas diarias del usuario: pasos, minutos activos, horas de sueño.
 * Persiste en AsyncStorage (funciona en modo demo y remoto).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export type MetasConfig = {
  pasos: number;
  minutosActivos: number;
  horasSueno: number;
};

const DEFAULT_METAS: MetasConfig = {
  pasos: 8_000,
  minutosActivos: 30,
  horasSueno: 7,
};

const KEY = (userId: string) => `ando-metas-${userId}`;

export async function fetchMetas(userId: string): Promise<MetasConfig> {
  try {
    const raw = await AsyncStorage.getItem(KEY(userId));
    if (!raw) return DEFAULT_METAS;
    return { ...DEFAULT_METAS, ...(JSON.parse(raw) as Partial<MetasConfig>) };
  } catch {
    return DEFAULT_METAS;
  }
}

export async function saveMetas(userId: string, metas: MetasConfig): Promise<void> {
  if (![metas.pasos, metas.minutosActivos, metas.horasSueno].every(n => Number.isFinite(n) && n > 0)) throw new Error("Las metas deben ser mayores que cero.");
  await AsyncStorage.setItem(KEY(userId), JSON.stringify(metas));
}

export type ProgresoMetas = {
  pasos: { actual: number; meta: number; pct: number; logrado: boolean };
  minutosActivos: { actual: number; meta: number; pct: number; logrado: boolean };
  horasSueno: { actual: number; meta: number; pct: number; logrado: boolean };
};

export function calcularProgreso(
  metas: MetasConfig,
  snapshot: { pasosHoy: number; minutosActivos: number; minutosDescanso: number; minutosSueno?: number },
): ProgresoMetas {
  const horasSuenoActual = (snapshot.minutosSueno ?? 0) / 60;
  return {
    pasos: {
      actual: snapshot.pasosHoy,
      meta: metas.pasos,
      pct: Math.min(100, Math.round((snapshot.pasosHoy / metas.pasos) * 100)),
      logrado: snapshot.pasosHoy >= metas.pasos,
    },
    minutosActivos: {
      actual: snapshot.minutosActivos,
      meta: metas.minutosActivos,
      pct: Math.min(
        100,
        Math.round((snapshot.minutosActivos / metas.minutosActivos) * 100),
      ),
      logrado: snapshot.minutosActivos >= metas.minutosActivos,
    },
    horasSueno: {
      actual: horasSuenoActual,
      meta: metas.horasSueno,
      pct: Math.min(100, Math.round((horasSuenoActual / metas.horasSueno) * 100)),
      logrado: horasSuenoActual >= metas.horasSueno,
    },
  };
}
