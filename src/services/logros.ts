/**
 * ando · Gemelo Digital — Servicio de Logros (Gamificación)
 * ===========================================================
 *
 * Define y evalúa badges desbloqueables basados en el comportamiento del usuario.
 * Persiste en AsyncStorage para funcionar en modo demo y remoto.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DiaResumen } from "@services/historial";
import { isRemote } from "@services/mode";
import { supabase } from "@lib/supabase";
import { TABLES, OWNER_COL } from "@services/schema";

export type LogroId =
  | "primer_captura"
  | "racha_3_dias"
  | "racha_7_dias"
  | "meta_pasos_1"
  | "meta_pasos_7"
  | "caminador"
  | "atleta"
  | "madrugador"
  | "buen_dormidor"
  | "explorador"
  | "consistente"
  | "investigador";

export type Logro = {
  id: LogroId;
  titulo: string;
  descripcion: string;
  emoji: string;
  categoria: "actividad" | "constancia" | "salud" | "investigacion";
  desbloqueado: boolean;
  fechaDesbloqueo?: string;
};

const CATALOGO: Omit<Logro, "desbloqueado" | "fechaDesbloqueo">[] = [
  {
    id: "primer_captura",
    titulo: "Primer paso",
    descripcion: "Registraste tu primera captura de sensores",
    emoji: "🚀",
    categoria: "actividad",
  },
  {
    id: "racha_3_dias",
    titulo: "3 días seguidos",
    descripcion: "Registraste actividad 3 días consecutivos",
    emoji: "🔥",
    categoria: "constancia",
  },
  {
    id: "racha_7_dias",
    titulo: "Semana completa",
    descripcion: "7 días consecutivos de actividad registrada",
    emoji: "⭐",
    categoria: "constancia",
  },
  {
    id: "meta_pasos_1",
    titulo: "Meta alcanzada",
    descripcion: "Cumpliste tu meta de pasos por primera vez",
    emoji: "🎯",
    categoria: "actividad",
  },
  {
    id: "meta_pasos_7",
    titulo: "Caminante dedicado",
    descripcion: "Cumpliste la meta de pasos 7 días",
    emoji: "👟",
    categoria: "actividad",
  },
  {
    id: "caminador",
    titulo: "Caminador",
    descripcion: "Acumulaste más de 10,000 pasos en un día",
    emoji: "🚶",
    categoria: "actividad",
  },
  {
    id: "atleta",
    titulo: "Atleta",
    descripcion: "Más de 60 minutos activos en un solo día",
    emoji: "🏃",
    categoria: "actividad",
  },
  {
    id: "madrugador",
    titulo: "Madrugador",
    descripcion: "Registraste actividad antes de las 7am",
    emoji: "🌅",
    categoria: "salud",
  },
  {
    id: "buen_dormidor",
    titulo: "Buen dormidor",
    descripcion: "Registraste una sesión de sueño de entre 7 y 9 horas",
    emoji: "😴",
    categoria: "salud",
  },
  {
    id: "explorador",
    titulo: "Explorador",
    descripcion: "Visitaste 3 zonas distintas en un día",
    emoji: "🗺️",
    categoria: "actividad",
  },
  {
    id: "consistente",
    titulo: "Rutina estable",
    descripcion: "Tu gemelo marcó 'estable' 5 días seguidos",
    emoji: "🧘",
    categoria: "constancia",
  },
  {
    id: "investigador",
    titulo: "Pionero del modelo",
    descripcion: "Activaste la contribución para calibrar el modelo",
    emoji: "🔬",
    categoria: "investigacion",
  },
];

const KEY = (userId: string) => `ando-logros-${userId}`;

export async function fetchLogros(userId: string): Promise<Logro[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY(userId));
    const desbloqueados: Record<string, string> = raw ? JSON.parse(raw) : {};

    // Sincronización con Supabase si está disponible
    if (isRemote()) {
      try {
        const { data, error } = await supabase!
          .from(TABLES.logrosUsuario)
          .select("logro_id, desbloqueado_en")
          .eq(OWNER_COL, userId);

        if (!error && Array.isArray(data)) {
          let cambio = false;

          // 1. Incorporar remotos a local
          for (const row of data) {
            if (!desbloqueados[row.logro_id]) {
              desbloqueados[row.logro_id] = row.desbloqueado_en;
              cambio = true;
            }
          }

          // 2. Subir a Supabase los logros que estaban solo en local (desbloqueados offline)
          const idsRemotos = new Set(data.map((r: { logro_id: string }) => r.logro_id));
          const pendientesDeSubir = Object.entries(desbloqueados).filter(
            ([id]) => !idsRemotos.has(id),
          );

          if (pendientesDeSubir.length > 0) {
            const filas = pendientesDeSubir.map(([logroId, fecha]) => ({
              usuario_id: userId,
              logro_id: logroId,
              desbloqueado_en: fecha,
            }));
            await supabase!.from(TABLES.logrosUsuario).upsert(filas);
          }

          if (cambio) {
            await AsyncStorage.setItem(KEY(userId), JSON.stringify(desbloqueados));
          }
        }
      } catch (err) {
        console.warn("Error al sincronizar logros con Supabase:", err);
      }
    }

    return CATALOGO.map((l) => ({
      ...l,
      desbloqueado: !!desbloqueados[l.id],
      fechaDesbloqueo: desbloqueados[l.id],
    }));
  } catch {
    return CATALOGO.map((l) => ({ ...l, desbloqueado: false }));
  }
}

export async function desbloquearLogro(userId: string, id: LogroId): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY(userId));
  const desbloqueados: Record<string, string> = raw ? JSON.parse(raw) : {};
  if (!desbloqueados[id]) {
    const fecha = new Date().toISOString();
    desbloqueados[id] = fecha;
    await AsyncStorage.setItem(KEY(userId), JSON.stringify(desbloqueados));

    // Persistir en Supabase en segundo plano si está conectado
    if (isRemote()) {
      try {
        await supabase!.from(TABLES.logrosUsuario).upsert({
          usuario_id: userId,
          logro_id: id,
          desbloqueado_en: fecha,
        });
      } catch (err) {
        console.warn(`No se pudo persistir logro ${id} en Supabase:`, err);
      }
    }
  }
}

/** Evalúa qué logros hay que desbloquear según el historial. */
export function evaluarLogros(
  historial: DiaResumen[],
  totalEventos: number,
  tieneConsentInvestigacion: boolean,
  metaPasos = 8000,
): LogroId[] {
  const nuevos: LogroId[] = [];

  if (totalEventos >= 1) nuevos.push("primer_captura");

  // Racha de días con actividad (≥ 1 evento)
  let racha = 0;
  for (let i = historial.length - 1; i >= 0; i--) {
    if (historial[i].totalEventos > 0) racha++;
    else break;
  }
  if (racha >= 3) nuevos.push("racha_3_dias");
  if (racha >= 7) nuevos.push("racha_7_dias");

  // Metas de pasos
  const diasConMeta = historial.filter((d) => d.tienePasos && d.pasosHoy >= metaPasos).length;
  if (diasConMeta >= 1) nuevos.push("meta_pasos_1");
  if (diasConMeta >= 7) nuevos.push("meta_pasos_7");

  // Records personales
  if (historial.some((d) => d.pasosHoy >= 10_000)) nuevos.push("caminador");
  if (historial.some((d) => d.minutosActivos >= 60)) nuevos.push("atleta");
  if (historial.some((d) => d.tieneSueno && (d.minutosSueno ?? 0) >= 420 && (d.minutosSueno ?? 0) <= 540))
    nuevos.push("buen_dormidor");

  if (tieneConsentInvestigacion) nuevos.push("investigador");

  return nuevos;
}
