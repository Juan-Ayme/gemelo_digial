import { supabase } from "@lib/supabase";
import { isRemote } from "@services/mode";
import { TABLES, OWNER_COL } from "@services/schema";
import { lget, lset } from "@services/localDb";
import type { ConsentMap } from "@services/types";
import type { CategoriaConsentimiento } from "@schemas/consent";

export const DEFAULT_CONSENTS: ConsentMap = {
  actividad: false,
  pasos: false,
  sueno: false,
  zona_general: false,
  wearable: false,
  fisiologia: false,
  ambiente: false,
  investigacion: false,
  notificaciones: false,
};

export async function fetchConsents(userId: string): Promise<ConsentMap> {
  if (!isRemote()) {
    return lget<ConsentMap>(`consents:${userId}`, { ...DEFAULT_CONSENTS });
  }

  const { data, error } = await supabase!
    .from(TABLES.consentimientos)
    .select("categoria, otorgado")
    .eq(OWNER_COL, userId);
  if (error) throw error;

  const map: ConsentMap = { ...DEFAULT_CONSENTS };
  for (const row of (data ?? []) as { categoria: CategoriaConsentimiento; otorgado: boolean }[]) {
    if (row.categoria in map) map[row.categoria] = Boolean(row.otorgado);
  }
  return map;
}

export async function setConsent(params: {
  userId: string;
  categoria: CategoriaConsentimiento;
  otorgado: boolean;
  finalidad: string;
  version: string;
}): Promise<void> {
  const { userId, categoria, otorgado, finalidad, version } = params;

  if (!isRemote()) {
    const map = await lget<ConsentMap>(`consents:${userId}`, { ...DEFAULT_CONSENTS });
    map[categoria] = otorgado;
    await lset(`consents:${userId}`, map);
    return;
  }

  const { error } = await supabase!.from(TABLES.consentimientos).upsert(
    {
      [OWNER_COL]: userId,
      categoria,
      otorgado,
      finalidad,
      version_documento: version,
    },
    { onConflict: `${OWNER_COL},categoria` },
  );
  if (error) throw error;
}
