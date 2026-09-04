import type { CategoriaConsentimiento } from "@schemas/consent";

export type Profile = {
  usuario_id: string;
  alias: string;
};

export type ConsentMap = Record<CategoriaConsentimiento, boolean>;

export type ActividadPredicha =
  | "desplazamiento"
  | "clase"
  | "estudio"
  | "descanso"
  | "actividad_fisica"
  | "permanencia";

export type NivelVariacion =
  | "estable"
  | "cambio_reciente"
  | "cambio_persistente"
  | "datos_insuficientes";

/** Fila de eventos_crudos, alineada con `eventoCrudoSchema` (Zod). */
export type EventoRow = {
  evento_uuid: string;
  procedencia: string;
  tipo_evento: string;
  inicio_en: string;
  fin_en: string | null;
  valor_numerico: number | null;
  valor_texto: string | null;
  unidad: string | null;
  confianza: number | null;
  zona_general: string | null;
  medido_directamente: boolean;
  disponibilidad: boolean;
  calidad: number | null;
  version_consentimiento: string;
  datos_minimos: Record<string, unknown>;
};

export type FuenteEstado = {
  codigo: string;
  nombre: string;
  disponible: boolean;
  calidad: number;
};

export type Prediccion = {
  actividad: ActividadPredicha;
  probabilidad: number;
  horizonteMin: number;
  variablesRelevantes: string[];
  explicacion: string;
  generadaEn: string;
};

export type GemeloSnapshot = {
  pasosHoy: number;
  minutosActivos: number;
  minutosDescanso: number;
  zonaActual: string;
  ultimaActividad: ActividadPredicha | null;
  prediccion: Prediccion | null;
  variacion: NivelVariacion;
  fuentes: FuenteEstado[];
  totalEventos: number;
};

export type RutinaBloque = {
  hora: string;
  actividad: string;
  detalle: string;
  intensidad: number; // 0..1
};

export const ACTIVIDAD_LABELS: Record<ActividadPredicha, string> = {
  desplazamiento: "Desplazamiento",
  clase: "Clase",
  estudio: "Estudio",
  descanso: "Descanso",
  actividad_fisica: "Actividad física",
  permanencia: "Permanencia",
};
