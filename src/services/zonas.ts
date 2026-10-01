import { lget, lset } from "@services/localDb";

export type ZonasAliasMap = Record<string, string>;

/**
 * Recupera el mapa de alias de zonas del usuario desde almacenamiento seguro local.
 * Ejemplo: { "Zona-A42B": "Campus Universitario", "Zona-C18E": "Mi Casa" }
 */
export async function fetchAliasZonas(userId: string): Promise<ZonasAliasMap> {
  return lget<ZonasAliasMap>(`zonas:alias:${userId}`, {});
}

/**
 * Asigna o actualiza un alias personalizado para una celda de zona contextual.
 */
export async function guardarAliasZona(
  userId: string,
  codigoZona: string,
  alias: string,
): Promise<ZonasAliasMap> {
  const map = await fetchAliasZonas(userId);
  if (alias.trim()) {
    map[codigoZona] = alias.trim();
  } else {
    delete map[codigoZona];
  }
  await lset(`zonas:alias:${userId}`, map);
  return map;
}

/**
 * Traduce un código opaco de zona (ej. "Zona-9F12") a su nombre amigable si el usuario lo configuró.
 */
export function formatearNombreZona(
  codigoZona?: string | null,
  aliasMap?: ZonasAliasMap | null,
): string {
  if (!codigoZona || codigoZona === "—") return "—";
  if (!aliasMap) return codigoZona;

  const alias = aliasMap[codigoZona];
  return alias ? `${alias} (${codigoZona})` : codigoZona;
}

/**
 * Devuelve únicamente el nombre corto del alias o el código de zona.
 */
export function nombreCortoZona(
  codigoZona?: string | null,
  aliasMap?: ZonasAliasMap | null,
): string {
  if (!codigoZona || codigoZona === "—") return "—";
  if (!aliasMap) return codigoZona;
  return aliasMap[codigoZona] ?? codigoZona;
}
