import { z } from "zod";

export const tipoProcedencia = z.enum([
  "telefono",
  "wearable",
  "health_connect",
  "sensor_externo",
  "entrada_manual",
  "sistema",
]);

export const estadoFuente = z.enum([
  "activa",
  "sin_permiso",
  "desconectada",
  "vacia",
  "baja_calidad",
  "pausada",
]);

export const eventoCrudoSchema = z.object({
  evento_uuid: z.string().uuid(),
  procedencia: tipoProcedencia,
  tipo_evento: z.string().min(1),
  inicio_en: z.string().datetime(),
  fin_en: z.string().datetime().nullable().optional(),
  valor_numerico: z.number().finite().nullable().optional(),
  valor_texto: z.string().nullable().optional(),
  unidad: z.string().nullable().optional(),
  confianza: z.number().min(0).max(100).nullable().optional(),
  precision_m: z.number().min(0).nullable().optional(),
  zona_general: z.string().nullable().optional(),
  medido_directamente: z.boolean().default(true),
  disponibilidad: z.boolean().default(true),
  calidad: z.number().min(0).max(100).nullable().optional(),
  version_consentimiento: z.string().default("v1.0"),
  datos_minimos: z.record(z.string(), z.unknown()).default({}),
});

export type EventoCrudoInput = z.infer<typeof eventoCrudoSchema>;
export type TipoProcedencia = z.infer<typeof tipoProcedencia>;
export type EstadoFuente = z.infer<typeof estadoFuente>;
