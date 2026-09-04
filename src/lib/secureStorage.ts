import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isNative = Platform.OS === "ios" || Platform.OS === "android";

/**
 * Almacén compatible con la interfaz de Supabase Auth.
 * En móvil usa expo-secure-store (Keychain / Keystore); en web cae a AsyncStorage.
 *
 * expo-secure-store limita cada valor a ~2048 bytes (Android). La sesión de
 * Supabase (access_token + refresh_token + user) puede superarlo, así que los
 * valores grandes se parten en trozos y se reensamblan al leer. Un valor
 * troceado guarda en la clave base un marcador `__ando_chunks__:N` y los trozos
 * en `${clave}.0..N-1`.
 */
const CHUNK_LIMIT = 1500; // margen seguro bajo 2048 bytes incluso con multibyte
const CHUNK_MARK = "__ando_chunks__:";

async function clearChunks(key: string): Promise<void> {
  const head = await SecureStore.getItemAsync(key);
  if (head && head.startsWith(CHUNK_MARK)) {
    const count = parseInt(head.slice(CHUNK_MARK.length), 10) || 0;
    for (let i = 0; i < count; i++) await SecureStore.deleteItemAsync(`${key}.${i}`);
  }
}

async function getNative(key: string): Promise<string | null> {
  const head = await SecureStore.getItemAsync(key);
  if (head == null) return null;
  if (!head.startsWith(CHUNK_MARK)) return head;
  const count = parseInt(head.slice(CHUNK_MARK.length), 10);
  if (!Number.isFinite(count) || count <= 0) return null;
  let out = "";
  for (let i = 0; i < count; i++) {
    const part = await SecureStore.getItemAsync(`${key}.${i}`);
    if (part == null) return null; // trozo perdido: lo tratamos como ausente
    out += part;
  }
  return out;
}

async function setNative(key: string, value: string): Promise<void> {
  await clearChunks(key); // limpia trozos de un valor anterior
  if (value.length <= CHUNK_LIMIT) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  const count = Math.ceil(value.length / CHUNK_LIMIT);
  for (let i = 0; i < count; i++) {
    await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK_LIMIT, (i + 1) * CHUNK_LIMIT));
  }
  await SecureStore.setItemAsync(key, `${CHUNK_MARK}${count}`);
}

async function removeNative(key: string): Promise<void> {
  await clearChunks(key);
  await SecureStore.deleteItemAsync(key);
}

export const secureStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      return isNative ? await getNative(key) : await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isNative) await setNative(key, value);
      else await AsyncStorage.setItem(key, value);
    } catch {
      // No persistir es preferible a romper el flujo de auth.
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (isNative) await removeNative(key);
      else await AsyncStorage.removeItem(key);
    } catch {
      // noop
    }
  },
};
