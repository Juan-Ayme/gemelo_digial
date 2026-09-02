import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Almacén local mínimo (JSON sobre AsyncStorage) usado en modo demo / offline.
 * No es sensible: los tokens de sesión siguen yendo a expo-secure-store.
 */
const PREFIX = "ando:local:";

export async function lget<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function lset<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Silencioso: la persistencia local es "best effort".
  }
}
