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
    return { ...DEFAULT_SUB, ...(JSON.parse(raw) as Partial<Suscripcion>) };
  } catch {
    return DEFAULT_SUB;
  }
}

export async function activarPro(userId: string): Promise<void> {
  const sub = await fetchSuscripcion(userId);
  const ahora = new Date();
  const expira = new Date(ahora);
  expira.setFullYear(expira.getFullYear() + 1);
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
      "Historial de hoy",
      "Predicción básica (Random Forest)",
      "Consentimientos granulares",
      "Modo demo sin registro",
    ],
    limitaciones: ["Historial solo 1 día", "Sin alertas combinadas avanzadas", "Sin exportación de datos"],
  },
  pro: {
    nombre: "ando Pro",
    precio: "S/ 9.90 / mes",
    precioAnual: "S/ 99 / año",
    color: "#10b981",
    beneficios: [
      "Historial de 30 días",
      "Insights semanales con tendencias",
      "Metas personalizadas",
      "Alertas combinadas avanzadas",
      "Exportación de datos (PDF / CSV)",
      "Gemelo con RF en la nube (más preciso)",
      "Sistema de logros y rachas",
    ],
    limitaciones: [],
  },
  investigador: {
    nombre: "ando Investigación",
    precio: "Gratis (participantes)",
    color: "#8b5cf6",
    beneficios: [
      "Todo de ando Pro",
      "Créditos por datos aportados",
      "Acceso anticipado a nuevas funciones",
      "Certificado de participación académica",
    ],
    limitaciones: ["Requiere consentimiento de investigación"],
  },
} as const;

/** ¿Es una función exclusiva de Pro? */
export function esExclusivoPro(feature: string): boolean {
  const featuresLibres = ["hoy", "gemelo", "rutina", "perfil", "demo"];
  return !featuresLibres.includes(feature);
}
