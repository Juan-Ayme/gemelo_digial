/**
 * ando · Gemelo Digital — Servicio de Suscripción (ando Pro)
 * ============================================================
 *
 * Gestiona el estado de suscripción del usuario.
 * En esta fase, usa un flag en AsyncStorage (listo para integrar RevenueCat).
 * 
 * MODELO DE PAGO A USUARIOS (Data Rewards):
 * =========================================
 * Los usuarios Pro que activan el consentimiento "investigacion" pueden
 * recibir créditos por sus datos. Esto está diseñado para el modelo B2B
 * donde la institución paga la licencia y los usuarios reciben beneficios.
 */

import { useAuthStore } from "@stores/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PlanTier = "free" | "pro" | "investigador";

export type Suscripcion = {
  tier: PlanTier;
  activaDesde?: string;
  expiraEn?: string;
  creditos: number; // Créditos por datos aportados (Data Rewards)
  datosAportados: number; // Número de eventos aportados a investigación
};

const KEY = (userId: string) => `ando-suscripcion-${userId}`;

const DEFAULT_SUB: Suscripcion = {
  tier: "free",
  creditos: 0,
  datosAportados: 0,
};

export async function fetchSuscripcion(userId: string): Promise<Suscripcion> {
  try {
    const raw = await AsyncStorage.getItem(KEY(userId));
    if (!raw) return DEFAULT_SUB;
    const sub = { ...DEFAULT_SUB, ...(JSON.parse(raw) as Partial<Suscripcion>) };
    if (!sub.expiraEn || !Number.isFinite(Date.parse(sub.expiraEn)) || Date.parse(sub.expiraEn) <= Date.now() || (!__DEV__ && !useAuthStore.getState().demoMode)) return { ...sub, tier: "free" };
    return sub;
  } catch {
    return DEFAULT_SUB;
  }
}

export async function activarPro(userId: string): Promise<void> {
  if (!__DEV__ && !useAuthStore.getState().demoMode) throw new Error("El plan comercial aún no está disponible.");
  const sub = await fetchSuscripcion(userId);
  const ahora = new Date();
  const expira = new Date(ahora);
  expira.setDate(expira.getDate() + 7);
  await AsyncStorage.setItem(
    KEY(userId),
    JSON.stringify({
      ...sub,
      tier: "pro" as PlanTier,
      activaDesde: ahora.toISOString(),
      expiraEn: expira.toISOString(),
    } satisfies Suscripcion),
  );
}

export async function agregarCreditos(userId: string, cantidad: number): Promise<void> {
  const sub = await fetchSuscripcion(userId);
  await AsyncStorage.setItem(
    KEY(userId),
    JSON.stringify({
      ...sub,
      creditos: sub.creditos + cantidad,
      datosAportados: sub.datosAportados + 1,
    } satisfies Suscripcion),
  );
}

export const PLANES = {
  free: {
    nombre: "ando Free",
    precio: "Gratis",
    color: "#64748b",
    beneficios: [
      "Historial de siete días",
      "Gemelo personalizable y resumen semanal",
      "Mi pequeño cambio y plan para mañana",
      "Exportación JSON",
      "Estimaciones por reglas generales",
      "Consentimientos granulares",
      "Modo demo sin registro",
    ],
    limitaciones: ["El historial ampliado está en prueba"] ,
  },
  pro: {
    nombre: "ando Pro",
    precio: "S/ 9.90 / mes · propuesto",
    precioAnual: "S/ 99 / año · propuesto",
    color: "#10b981",
    beneficios: [
      "Historial de 30 días",
      "Insights semanales con tendencias",
      "Metas personalizadas",
      "Seguimiento ampliado en pruebas",
      "Exportación de datos (JSON)",
      "Acceso al historial ampliado",
      "Sistema de logros y rachas",
    ],
    limitaciones: [],
  },
  investigador: {
    nombre: "ando Colaborador",
    precio: "Activo para colaboradores",
    color: "#8b5cf6",
    beneficios: [
      "Todo de ando Pro",
      "Programa colaborador por validar",
      "Acceso anticipado a nuevas funciones",
      "Insignia de colaborador pionero",
    ],
    limitaciones: ["Requiere consentimiento de mejora continua"],
  },
} as const;

/** ¿Es una función exclusiva de Pro? */
export function esExclusivoPro(feature: string): boolean {
  const featuresLibres = ["hoy", "gemelo", "rutina", "perfil", "demo"];
  return !featuresLibres.includes(feature);
}
