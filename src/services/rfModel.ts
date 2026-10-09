/** Respaldo por reglas generales; no es un modelo entrenado ni una probabilidad calibrada. */
import { ACTIVIDAD_LABELS, type ActividadPredicha, type Prediccion } from "@services/types";

export type FeatureVector = {
  horaDecimal: number;
  horaSeno: number;
  horaCoseno: number;
  diaSemana: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  actividadActual: string;
  actividadAnterior: string;
  pasosVentana: number;
  zonaGeneral: string;
};

export type TreeImportance = {
  hora_del_dia: number;
  actividad_actual: number;
  pasos_ventana: number;
  zona_general: number;
};

/**
 * Extrae el vector de features a partir de la fecha y los últimos eventos registrados.
 */
export function extraerFeatures(params: {
  fecha?: Date;
  actividadActual?: string | null;
  actividadAnterior?: string | null;
  pasosVentana?: number;
  zonaGeneral?: string | null;
}): FeatureVector {
  const d = params.fecha ?? new Date();
  const horaDec = d.getHours() + d.getMinutes() / 60;
  const rad = (horaDec / 24) * 2 * Math.PI;

  return {
    horaDecimal: horaDec,
    horaSeno: Math.sin(rad),
    horaCoseno: Math.cos(rad),
    diaSemana: d.getDay(),
    actividadActual: params.actividadActual ?? "permanencia",
    actividadAnterior: params.actividadAnterior ?? "ninguna",
    pasosVentana: params.pasosVentana ?? 0,
    zonaGeneral: params.zonaGeneral ?? "Zona-Comun",
  };
}

// ─── Conjunto de reglas generales ──────────────────────────

type DecisionTree = (f: FeatureVector) => {
  pred: ActividadPredicha;
  pesoFeature: keyof TreeImportance;
};

const BOSQUE_ARBOLES: DecisionTree[] = [
  // Árbol 1: Patrón circadiano nocturno
  (f) => {
    if (f.horaDecimal >= 23 || f.horaDecimal < 6) {
      return { pred: "descanso", pesoFeature: "hora_del_dia" };
    }
    if (f.pasosVentana > 350) {
      return { pred: "desplazamiento", pesoFeature: "pasos_ventana" };
    }
    return { pred: "permanencia", pesoFeature: "actividad_actual" };
  },

  // Árbol 2: Horario de mañana y transiciones
  (f) => {
    if (f.horaDecimal >= 6 && f.horaDecimal < 9) {
      if (f.pasosVentana > 250) {
        return { pred: "desplazamiento", pesoFeature: "pasos_ventana" };
      }
      return { pred: "ocio", pesoFeature: "hora_del_dia" };
    }
    if (f.horaDecimal >= 9 && f.horaDecimal < 13) {
      if (f.diaSemana >= 1 && f.diaSemana <= 5) {
        return { pred: f.actividadActual === "estudio" ? "estudio" : "trabajo", pesoFeature: "hora_del_dia" };
      }
      return { pred: "ocio", pesoFeature: "actividad_actual" };
    }
    return { pred: "permanencia", pesoFeature: "hora_del_dia" };
  },

  // Árbol 3: Tarde y estudio/trabajo
  (f) => {
    if (f.horaDecimal >= 14 && f.horaDecimal < 18) {
      if (f.pasosVentana > 400) {
        return { pred: "desplazamiento", pesoFeature: "pasos_ventana" };
      }
      if (f.diaSemana >= 1 && f.diaSemana <= 5) {
        return { pred: "estudio", pesoFeature: "hora_del_dia" };
      }
      return { pred: "ocio", pesoFeature: "actividad_actual" };
    }
    return { pred: "permanencia", pesoFeature: "hora_del_dia" };
  },

  // Árbol 4: Tarde-noche y ejercicio / deporte
  (f) => {
    if (f.horaDecimal >= 18 && f.horaDecimal < 21) {
      if (f.pasosVentana >= 600 || f.actividadActual === "actividad_fisica") {
        return { pred: "actividad_fisica", pesoFeature: "pasos_ventana" };
      }
      if (f.pasosVentana >= 200) {
        return { pred: "desplazamiento", pesoFeature: "pasos_ventana" };
      }
      return { pred: "ocio", pesoFeature: "hora_del_dia" };
    }
    return { pred: "permanencia", pesoFeature: "actividad_actual" };
  },

  // Árbol 5: Inercia de desplazamiento
  (f) => {
    if (f.actividadActual === "desplazamiento") {
      if (f.pasosVentana > 200) {
        return { pred: "desplazamiento", pesoFeature: "actividad_actual" };
      }
      return { pred: "permanencia", pesoFeature: "pasos_ventana" };
    }
    return { pred: "permanencia", pesoFeature: "actividad_actual" };
  },

  // Árbol 6: Inercia de trabajo/estudio en horario laboral
  (f) => {
    if (f.actividadActual === "trabajo" || f.actividadActual === "estudio") {
      if (f.horaDecimal >= 9 && f.horaDecimal < 19) {
        return { pred: f.actividadActual as ActividadPredicha, pesoFeature: "actividad_actual" };
      }
      return { pred: "ocio", pesoFeature: "hora_del_dia" };
    }
    return { pred: "permanencia", pesoFeature: "hora_del_dia" };
  },

  // Árbol 7: Zona habitual y contexto
  (f) => {
    const z = f.zonaGeneral.toLowerCase();
    if (z.includes("campus") || z.includes("universidad") || z.includes("facultad") || z.includes("aula")) {
      return { pred: "estudio", pesoFeature: "zona_general" };
    }
    if (z.includes("oficina") || z.includes("trabajo")) {
      return { pred: "trabajo", pesoFeature: "zona_general" };
    }
    if (z.includes("gym") || z.includes("gimnasio") || z.includes("parque")) {
      return { pred: "actividad_fisica", pesoFeature: "zona_general" };
    }
    if (f.horaDecimal >= 22 || f.horaDecimal < 7) {
      return { pred: "descanso", pesoFeature: "hora_del_dia" };
    }
    return { pred: "permanencia", pesoFeature: "zona_general" };
  },

  // Árbol 8: Cadencia alta sostenida
  (f) => {
    if (f.pasosVentana > 800) {
      return { pred: "actividad_fisica", pesoFeature: "pasos_ventana" };
    }
    if (f.pasosVentana > 250) {
      return { pred: "desplazamiento", pesoFeature: "pasos_ventana" };
    }
    return { pred: "permanencia", pesoFeature: "pasos_ventana" };
  },

  // Árbol 9: Noche previa a dormir
  (f) => {
    if (f.horaDecimal >= 21 && f.horaDecimal < 23) {
      if (f.pasosVentana < 80) {
        return { pred: "descanso", pesoFeature: "hora_del_dia" };
      }
      return { pred: "ocio", pesoFeature: "actividad_actual" };
    }
    return { pred: "permanencia", pesoFeature: "hora_del_dia" };
  },

  // Árbol 10: Fin de semana vs semana laboral
  (f) => {
    if (f.diaSemana === 0 || f.diaSemana === 6) { // Fin de semana
      if (f.horaDecimal >= 10 && f.horaDecimal < 22) {
        return { pred: f.pasosVentana > 300 ? "desplazamiento" : "ocio", pesoFeature: "actividad_actual" };
      }
    }
    return { pred: "permanencia", pesoFeature: "hora_del_dia" };
  },
];

/**
 * Evalúa reglas escritas a mano; el porcentaje de votos no es precisión del modelo.
 */
export function predecirPorReglas(
  features: FeatureVector,
): Prediccion & { importancias: TreeImportance } {
  const votos: Record<string, number> = {};
  const pesoFeatures: Record<keyof TreeImportance, number> = {
    hora_del_dia: 0,
    actividad_actual: 0,
    pasos_ventana: 0,
    zona_general: 0,
  };

  const totalArboles = BOSQUE_ARBOLES.length;

  for (const arbol of BOSQUE_ARBOLES) {
    const res = arbol(features);
    votos[res.pred] = (votos[res.pred] ?? 0) + 1;
    pesoFeatures[res.pesoFeature] += 1;
  }

  // Ordenar por mayoría de votos
  const ganador = (Object.entries(votos).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0] ?? "permanencia") as ActividadPredicha;

  const countGanador = votos[ganador] ?? 1;
  const probabilidad = countGanador / totalArboles;

  // Normalizar importancias a porcentajes enteros
  const sumPesos = Object.values(pesoFeatures).reduce((a, b) => a + b, 0) || 1;
  const importancias: TreeImportance = {
    hora_del_dia: Math.round((pesoFeatures.hora_del_dia / sumPesos) * 100),
    actividad_actual: Math.round((pesoFeatures.actividad_actual / sumPesos) * 100),
    pasos_ventana: Math.round((pesoFeatures.pasos_ventana / sumPesos) * 100),
    zona_general: Math.round((pesoFeatures.zona_general / sumPesos) * 100),
  };

  const explicacion = `Estimación orientativa por reglas generales: hora ${Math.floor(features.horaDecimal)} y movimiento registrado. No representa todavía tu patrón personal.`;

  return {
    actividad: ganador,
    probabilidad,
    horizonteMin: 30,
    variablesRelevantes: ["hora_del_dia", "actividad_actual", "pasos_ventana", "zona_general"],
    explicacion,
    generadaEn: new Date().toISOString(),
    importancias,
    estimacionLocal: true,
  };
}
