import "react-native-url-polyfill/auto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

import { config, isSupabaseConfigured } from "@constants/config";
import { secureStorageAdapter } from "@lib/secureStorage";

/**
 * Cliente Supabase configurado con almacenamiento seguro para tokens.
 * Si aún no se han cargado las claves (EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY),
 * exporta null para que la app funcione en modo demo sin backend.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(config.supabase.url, config.supabase.anonKey, {
      auth: {
        storage: secureStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Refresca el token cuando la app vuelve al frente (patrón oficial Supabase RN).
if (supabase) {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
