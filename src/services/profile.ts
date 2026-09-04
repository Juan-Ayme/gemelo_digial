import { supabase } from "@lib/supabase";
import { isRemote } from "@services/mode";
import { TABLES, OWNER_COL } from "@services/schema";
import { lget, lset } from "@services/localDb";
import type { Profile } from "@services/types";

/** perfiles.alias tiene CHECK de longitud 2..60; normalizamos para respetarlo. */
function normalizeAlias(alias?: string | null): string {
  const a = (alias ?? "").trim();
  if (a.length < 2) return "Estudiante";
  return a.length > 60 ? a.slice(0, 60) : a;
}

/**
 * Lee el perfil del titular. Si aún no existe fila en `perfiles`, la crea a
 * partir del alias de auth (red de seguridad; normalmente lo crea el trigger).
 */
export async function fetchProfile(
  userId: string,
  meta: { alias?: string },
): Promise<Profile> {
  const fallback: Profile = { usuario_id: userId, alias: normalizeAlias(meta.alias) };

  if (!isRemote()) {
    const stored = await lget<Profile | null>(`profile:${userId}`, null);
    if (stored) return stored;
    await lset(`profile:${userId}`, fallback);
    return fallback;
  }

  const { data, error } = await supabase!
    .from(TABLES.perfiles)
    .select("usuario_id, alias")
    .eq(OWNER_COL, userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return { usuario_id: data.usuario_id, alias: data.alias ?? fallback.alias };

  const { error: upsertError } = await supabase!.from(TABLES.perfiles).upsert(fallback);
  if (upsertError) throw upsertError;
  return fallback;
}

export async function updateAlias(userId: string, alias: string): Promise<Profile> {
  const clean = normalizeAlias(alias);

  if (!isRemote()) {
    const next: Profile = { usuario_id: userId, alias: clean };
    await lset(`profile:${userId}`, next);
    return next;
  }

  const { data, error } = await supabase!
    .from(TABLES.perfiles)
    .update({ alias: clean })
    .eq(OWNER_COL, userId)
    .select("usuario_id, alias")
    .single();
  if (error) throw error;
  return { usuario_id: data.usuario_id, alias: data.alias };
}
