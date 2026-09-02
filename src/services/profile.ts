import { supabase } from "@lib/supabase";
import { isRemote } from "@services/mode";
import { TABLES } from "@services/schema";
import { lget, lset } from "@services/localDb";
import type { Profile } from "@services/types";

/**
 * Lee el perfil del titular. Si aún no existe fila en `perfiles` (p. ej. justo
 * tras confirmar el correo), la crea a partir de los metadatos de auth.
 */
export async function fetchProfile(
  userId: string,
  meta: { alias?: string; email?: string | null },
): Promise<Profile> {
  const fallback: Profile = {
    id: userId,
    alias: meta.alias?.trim() || "Estudiante",
    email: meta.email ?? null,
  };

  if (!isRemote()) {
    const stored = await lget<Profile | null>(`profile:${userId}`, null);
    if (stored) return stored;
    await lset(`profile:${userId}`, fallback);
    return fallback;
  }

  const { data, error } = await supabase!
    .from(TABLES.perfiles)
    .select("id, alias, email")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as Profile;

  // Auto-reparación: crea el perfil si el trigger de la BD no lo hizo.
  const { error: upsertError } = await supabase!.from(TABLES.perfiles).upsert(fallback);
  if (upsertError) throw upsertError;
  return fallback;
}

export async function updateAlias(userId: string, alias: string): Promise<Profile> {
  const clean = alias.trim() || "Estudiante";

  if (!isRemote()) {
    const stored = await lget<Profile | null>(`profile:${userId}`, null);
    const next: Profile = { id: userId, alias: clean, email: stored?.email ?? null };
    await lset(`profile:${userId}`, next);
    return next;
  }

  const { data, error } = await supabase!
    .from(TABLES.perfiles)
    .update({ alias: clean })
    .eq("id", userId)
    .select("id, alias, email")
    .single();
  if (error) throw error;
  return data as Profile;
}
