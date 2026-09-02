import { z } from "zod";

/**
 * Categorías definidas en la tabla public.consentimientos del esquema Supabase.
 */
export const categoriaConsentimiento = z.enum([
  "actividad",
  "pasos",
  "sueno",
  "zona_general",
  "wearable",
  "fisiologia",
  "ambiente",
  "investigacion",
  "notificaciones",
]);

export type CategoriaConsentimiento = z.infer<typeof categoriaConsentimiento>;

export const consentimientoSchema = z.object({
  categoria: categoriaConsentimiento,
  finalidad: z.string().min(5, "Describe la finalidad brevemente."),
  otorgado: z.boolean(),
  version_documento: z.string().default("v1.0"),
});

export type ConsentimientoInput = z.infer<typeof consentimientoSchema>;

export const CATALOGO_CONSENTIMIENTOS: {
  categoria: CategoriaConsentimiento;
  titulo: string;
  finalidad: string;
  ejemplo: string;
  requerido: boolean;
}[] = [
  {
    categoria: "actividad",
    titulo: "Actividad y transiciones",
    finalidad:
      "Detectar caminata, permanencia, bicicleta o vehículo para construir tu rutina.",
    ejemplo: "Usa Activity Recognition de Android con baja batería.",
    requerido: true,
  },
  {
    categoria: "pasos",
    titulo: "Pasos y distancia",
    finalidad: "Estimar carga de actividad diaria mediante Health Connect.",
    ejemplo: "Suma diaria y por franja horaria, nunca ubicación exacta.",
    requerido: false,
  },
  {
    categoria: "sueno",
    titulo: "Intervalos de sueño",
    finalidad:
      "Estimar descanso para ajustar predicciones de la mañana. No es diagnóstico clínico.",
    ejemplo: "Segmentos de Sleep API u Health Connect.",
    requerido: false,
  },
  {
    categoria: "zona_general",
    titulo: "Zona general",
    finalidad:
      "Identificar zonas frecuentes (hogar, campus, tránsito) sin conservar coordenadas exactas.",
    ejemplo: "La ubicación se convierte en un identificador de zona.",
    requerido: false,
  },
  {
    categoria: "wearable",
    titulo: "Wearables (reloj o pulsera)",
    finalidad: "Complementar señales autorizadas de actividad y descanso.",
    ejemplo: "Solo se leen los tipos que decidas.",
    requerido: false,
  },
  {
    categoria: "fisiologia",
    titulo: "Fisiología opcional",
    finalidad:
      "Frecuencia cardiaca u otros indicadores solo si tu dispositivo los provee y lo autorizas.",
    ejemplo: "Nunca se usa como diagnóstico ni tratamiento.",
    requerido: false,
  },
  {
    categoria: "ambiente",
    titulo: "Contexto ambiental",
    finalidad: "Nivel de luz o ruido agregado; nunca grabaciones.",
    ejemplo: "Ayuda a explicar cambios de rutina en la app.",
    requerido: false,
  },
  {
    categoria: "notificaciones",
    titulo: "Notificaciones",
    finalidad: "Enviarte alertas cuando exista una nueva predicción o variación.",
    ejemplo: "Puedes desactivarlas cuando quieras.",
    requerido: false,
  },
  {
    categoria: "investigacion",
    titulo: "Uso académico",
    finalidad:
      "Datos seudonimizados para evaluar el prototipo del gemelo digital.",
    ejemplo: "Sin datos identificables, revocable en cualquier momento.",
    requerido: false,
  },
];
