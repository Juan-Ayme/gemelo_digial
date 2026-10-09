import { supabase } from "@lib/supabase";
import { TABLES, OWNER_COL } from "@services/schema";
import { isRemote } from "@services/mode";
import { lget, lset } from "@services/localDb";
import { eventosUnicos } from "@services/metricas";
import type { EventoRow } from "@services/types";

const locks = new Map<string, Promise<unknown>>();
async function serial<T>(id: string, work: () => Promise<T>): Promise<T> {
  const previous = locks.get(id) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(work);
  locks.set(id, next);
  try { return await next; } finally { if (locks.get(id) === next) locks.delete(id); }
}

type EstadoSync = { pendientes: number; ultimaSincronizacion: string | null; error: string | null };
export async function estadoSincronizacion(id: string): Promise<EstadoSync> {
  const pending = await lget<EventoRow[]>(`pending:${id}`, []);
  const last = await lget<string | null>(`sync:last:${id}`, null);
  const error = await lget<string | null>(`sync:error:${id}`, null);
  return { pendientes: pending.length, ultimaSincronizacion: last, error };
}

async function flush(id: string) {
  if (!isRemote() || id === "demo-user") return;
  const pending = await lget<EventoRow[]>(`pending:${id}`, []);
  if (!pending.length) return;
  // UUID estable + restricción UNIQUE: reintentar después de una desconexión no duplica datos.
  for (let i = 0; i < pending.length; i += 100) {
    const batch = pending.slice(i, i + 100);
    const { error } = await supabase!.from(TABLES.eventosCrudos).upsert(
      batch.map(e => ({ ...e, [OWNER_COL]: id })), { onConflict: "evento_uuid", ignoreDuplicates: true },
    );
    if (error) { await lset(`sync:error:${id}`, "Guardado en el teléfono. Sincronización pendiente."); return; }
    const done = new Set(batch.map(e => e.evento_uuid));
    const current = await lget<EventoRow[]>(`pending:${id}`, []);
    await lset(`pending:${id}`, current.filter(e => !done.has(e.evento_uuid)));
  }
  await lset(`sync:last:${id}`, new Date().toISOString());
  await lset(`sync:error:${id}`, null);
}

export const sincronizarEventos = (id: string) => serial(id, async () => {
  const pending = await lget<EventoRow[]>(`pending:${id}`, []);
  if (pending.length) await lset(`events:${id}`, eventosUnicos([...await lget<EventoRow[]>(`events:${id}`, []), ...pending]));
  await flush(id);
});
export async function guardarEventos(id: string, events: EventoRow[]): Promise<void> {
  if (!id) throw new Error("Inicia sesión para guardar una actividad.");
  await serial(id, async () => {
    // La cola se escribe antes del caché: una interrupción no pierde el reintento.
    if (isRemote() && id !== "demo-user") {
      const pending = await lget<EventoRow[]>(`pending:${id}`, []);
      await lset(`pending:${id}`, eventosUnicos([...pending, ...events]));
    }
    const local = await lget<EventoRow[]>(`events:${id}`, []);
    await lset(`events:${id}`, eventosUnicos([...local, ...events]));
    if (isRemote() && id !== "demo-user") try { await flush(id); } catch { await lset(`sync:error:${id}`, "Sin conexión. Tus registros siguen en el teléfono."); }

  });
}

export async function leerEventosDesde(id: string, desde: Date): Promise<EventoRow[]> {
  let local = eventosUnicos([...(await lget<EventoRow[]>(`events:${id}`, [])), ...(await lget<EventoRow[]>(`pending:${id}`, []))]);
  if (isRemote() && id !== "demo-user") {
    try {
      await sincronizarEventos(id);
      const remote: EventoRow[] = [];
      // Se incluye la noche anterior porque una sesión de sueño puede cruzar medianoche.
      const start = new Date(desde.getTime() - 24 * 60 * 60000).toISOString();
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await supabase!.from(TABLES.eventosCrudos).select("*")
          .eq(OWNER_COL, id).gte("inicio_en", start).order("inicio_en", { ascending: true }).range(offset, offset + 999);
        if (error) throw error;
        remote.push(...(data ?? []) as EventoRow[]);
        if ((data?.length ?? 0) < 1000) break;
      }
      local = await serial(id, async () => {
        const current = eventosUnicos([...(await lget<EventoRow[]>(`events:${id}`, [])), ...local]);
        const merged = eventosUnicos([...current, ...remote]);
        await lset(`events:${id}`, merged);
        return merged;
      });
      await lset(`sync:error:${id}`, null);
    } catch (error) {
      if (!local.length) throw error;
      await lset(`sync:error:${id}`, "Mostrando registros guardados. Revisa la conexión.");
    }
  }
  return local.filter(e => Date.parse(e.fin_en ?? e.inicio_en) >= desde.getTime());
}
