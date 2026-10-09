// La clave administrativa solo existe en el entorno de Supabase, nunca en Expo.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return response({ error: "Método no permitido" }, 405);
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return response({ error: "Sesión requerida" }, 401);
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return response({ error: "Servicio no configurado" }, 503);
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  // El titular proviene del JWT validado; se ignora cualquier id enviado en el body.
  const { data, error } = await admin.auth.getUser(authorization.slice(7));
  if (error || !data.user) return response({ error: "Sesión inválida" }, 401);
  // Las relaciones del titular deben tener ON DELETE CASCADE: ver la migración.
  const deleted = await admin.auth.admin.deleteUser(data.user.id);
  if (deleted.error) return response({ error: "No se eliminó la cuenta. Comprueba las relaciones de la base de datos." }, 409);
  return response({ deleted: true });
});
