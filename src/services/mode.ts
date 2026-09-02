import { supabase } from "@lib/supabase";
import { useAuthStore } from "@stores/authStore";

/**
 * ¿Debemos hablar con Supabase? Solo si el cliente existe (hay .env con claves)
 * y el usuario NO está en modo demo. En caso contrario los servicios usan un
 * almacén local (AsyncStorage) para que la app funcione igual sin backend.
 */
export function isRemote(): boolean {
  return Boolean(supabase) && !useAuthStore.getState().demoMode;
}
