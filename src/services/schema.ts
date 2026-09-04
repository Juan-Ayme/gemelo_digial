/**
 * Nombres de tablas y columna de titularidad en Supabase.
 *
 * Alineado con el esquema real del proyecto (ando_schema): la columna del
 * titular es `usuario_id` y en `perfiles` es además la PK (FK a auth.users).
 * La configuración de RLS/permisos está en `supabase/schema.sql`.
 */
export const TABLES = {
  perfiles: "perfiles",
  consentimientos: "consentimientos",
  eventosCrudos: "eventos_crudos",
} as const;

/** Columna FK al titular (auth.users.id) presente en todas las tablas con RLS. */
export const OWNER_COL = "usuario_id";
