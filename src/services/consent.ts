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

  // La tabla es un historial (append-only). El estado actual de cada categoría
  // es la fila más reciente: leemos en orden ascendente y dejamos que las
  // últimas sobrescriban.
  const { data, error } = await supabase!
    .from(TABLES.consentimientos)
    .select("categoria, otorgado, creado_en")
    .eq(OWNER_COL, userId)
    .order("creado_en", { ascending: true });
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

  // Nueva fila de historial por cada cambio (no upsert): así queda la
  // trazabilidad de cuándo se otorgó/revocó cada categoría.
  const now = new Date().toISOString();
  const { error } = await supabase!.from(TABLES.consentimientos).insert({
    [OWNER_COL]: userId,
    categoria,
    otorgado,
    finalidad,
    version_documento: version,
    otorgado_en: otorgado ? now : null,
    revocado_en: otorgado ? null : now,
  });
  if (error) throw error;
}
