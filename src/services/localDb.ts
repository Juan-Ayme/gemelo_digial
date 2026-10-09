import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Almacén local mínimo (JSON sobre AsyncStorage) usado en modo demo / offline.
 * Contiene registros personales sin cifrado adicional; los tokens usan expo-secure-store.
 */
const PREFIX = "ando:local:";

export async function lget<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(PREFIX + key);
  // Ausencia es distinta de fallo de lectura: un fallo no debe sobrescribir datos previos.
  return raw === null ? fallback : JSON.parse(raw) as T;
}

export async function lset<T>(key: string, value: T): Promise<void> {
  // Un guardado fallido debe llegar a la UI; nunca anunciar éxito si el disco falló.
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
}
