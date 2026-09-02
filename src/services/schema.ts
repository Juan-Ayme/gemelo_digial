/**
 * Nombres de tablas y columna de titularidad en Supabase.
 *
 * IMPORTANTE: si tu esquema real (ando_schema.sql) usa otro nombre para la
 * columna que apunta a auth.users, cámbialo AQUÍ en un solo sitio.
 * El esquema canónico que espera la app está en `supabase/schema.sql`.
 */
export const TABLES = {
  perfiles: "perfiles",
  consentimientos: "consentimientos",
  eventosCrudos: "eventos_crudos",
} as const;

/** Columna FK al titular (auth.users.id) en las tablas con RLS. */
export const OWNER_COL = "titular_id";
