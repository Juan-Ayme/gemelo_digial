import * as Crypto from "expo-crypto";

import type { EventoRow } from "@services/types";

/**
 * Crea un `evento_crudo` con valores por defecto sensatos. Cada captador
 * (sensores del teléfono, Health Connect, simulador) solo rellena lo suyo.
 */
export function nuevoEvento(part: Partial<EventoRow>): EventoRow {
  const now = new Date().toISOString();
  return {
    evento_uuid: Crypto.randomUUID(),
    procedencia: "telefono",
    tipo_evento: "ventana_actividad",
    inicio_en: now,
    fin_en: now,
    valor_numerico: null,
    valor_texto: null,
    unidad: null,
    confianza: null,
    zona_general: null,
    medido_directamente: true,
    disponibilidad: true,
    calidad: null,
    version_consentimiento: "v1.0",
    datos_minimos: {},
    ...part,
  };
}
