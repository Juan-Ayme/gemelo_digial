/**
 * Traduce los mensajes crudos de Supabase Auth a español legible para el
 * persona usuaria. Cuando el mensaje no coincide, devuelve el original recortado.
 */
const DICT: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "Correo o contraseña incorrectos."],
  [/email not confirmed/i, "Debes confirmar tu correo antes de iniciar sesión."],
  [/user already registered/i, "Ya existe una cuenta con ese correo."],
  [/email rate limit exceeded/i, "Demasiados intentos. Vuelve a intentarlo en unos minutos."],
  [/password should be at least/i, "La contraseña debe tener al menos 6 caracteres."],
  [/network request failed/i, "Sin conexión. Verifica tu red e inténtalo de nuevo."],
  [/failed to fetch/i, "No pudimos contactar el servidor. Verifica tu conexión."],
  [/invalid api key/i, "Configuración inválida. Revisa tu archivo .env con las claves de Supabase."],
  [/anonymous sign-ins are disabled/i, "El acceso anónimo está deshabilitado en Supabase."],
];

export function traducirErrorAuth(raw: string | undefined | null): string {
  if (!raw) return "Ocurrió un error inesperado. Intenta de nuevo.";
  for (const [pattern, es] of DICT) {
    if (pattern.test(raw)) return es;
  }
  return raw.length > 140 ? `${raw.slice(0, 137)}…` : raw;
}
