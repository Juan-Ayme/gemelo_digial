import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isNative = Platform.OS === "ios" || Platform.OS === "android";

/**
 * Almacén compatible con la interfaz de Supabase Auth.
 * En dispositivos móviles usa expo-secure-store (Keychain / Keystore).
 * En web cae en AsyncStorage (localStorage) para no bloquear el desarrollo.
 */
export const secureStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (isNative) {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return null;
      }
    }
    return AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (isNative) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (isNative) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};
