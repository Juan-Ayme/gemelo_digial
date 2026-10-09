import type { CategoriaConsentimiento } from "@schemas/consent";

export type Profile = {
  usuario_id: string;
  alias: string;
};

export type ConsentMap = Record<CategoriaConsentimiento, boolean>;

export type ActividadPredicha =
  | "desplazamiento"
  | "trabajo"
  | "estudio"
  | "descanso"
  | "actividad_fisica"
  | "ocio"
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
  importancias?: Record<string, number>;
  estimacionLocal?: boolean;
};

export type GemeloSnapshot = {
  pasosHoy: number;
  minutosActivos: number;
  minutosDescanso: number;
  minutosSueno?: number;
  ultimaLectura?: string | null;
  ultimaActividadEn?: string | null;
  tieneDuracionActividad?: boolean;
  zonaActual: string;
  ultimaActividad: ActividadPredicha | null;
  prediccion: Prediccion | null;
  variacion: NivelVariacion;
  fuentes: FuenteEstado[];
  totalEventos: number;
  fuentePrediccion?: "rf" | "reglas" | "rf_local" | "heuristica";
  analisisVariacion?: {
    nivel: NivelVariacion;
    desviacionPct: number;
    explicacion: string;
    indiceConsistencia: number;
  };
};

export type RutinaBloque = {
  hora: string;
  horaInicio?: string;
  horaFin?: string;
  duracionMin?: number;
  actividad: string;
  tipoActividad?: ActividadPredicha;
  detalle: string;
  zona?: string | null;
  confianza?: number | null;
  intensidad: number; // 0..1
  cantidadVentanas?: number;
};

export const ACTIVIDAD_LABELS: Record<ActividadPredicha, string> = {
  desplazamiento: "Desplazamiento",
  trabajo: "Trabajo",
  estudio: "Estudio",
  descanso: "Descanso",
  actividad_fisica: "Actividad física",
  ocio: "Ocio",
  permanencia: "Permanencia",
};
