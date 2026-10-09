import { diaDelEvento, eventosUnicos, fechaLocal } from "@services/metricas";
import type { EventoRow } from "@services/types";

/** Comparación de escape, no CO₂ evitado comprobado ni huella de ciclo de vida.
 * EPA: 400 g/milla para un auto promedio a gasolina estadounidense.
 */
export const REFERENCIA_CO2 = {
  gramosPorKm: 400 / 1.609344,
  version: "epa-gasolina-400g-milla-v1",
  url: "https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle",
} as const;

// Supuesto fijo y explícito; los pasos no miden distancia ni sustitución de un auto.
export const METROS_POR_PASO_ESTIMADOS = 0.7;
export type ImpactoPasos = {
  tieneDatos: boolean;
  pasos: number;
  distanciaKm: number;
  gramosCO2Auto: number;
};

export function impactoDePasos(pasos: number | null): ImpactoPasos {
  const tieneDatos = pasos !== null && Number.isFinite(pasos) && pasos >= 0;
  const cantidad = tieneDatos ? Math.round(pasos!) : 0;
  const distanciaKm = cantidad * METROS_POR_PASO_ESTIMADOS / 1000;
  return { tieneDatos, pasos: cantidad, distanciaKm, gramosCO2Auto: distanciaKm * REFERENCIA_CO2.gramosPorKm };
}

/** Recalcular desde lecturas persistidas: nunca sumar otra vez al abrir la pantalla.
 * Los registros manuales antiguos siguen en almacenamiento/exportación, pero no se
 * mezclan con pasos automáticos. El movimiento del acelerómetro tampoco se vuelve km.
 */
export function resumirImpactoAutomatico(input: EventoRow[], now = new Date(), incluirDemo = false) {
  const hoy = fechaLocal(now);
  const inicio = new Date(now);
  inicio.setDate(inicio.getDate() - 6);
  const desde = fechaLocal(inicio);
  const eventos = eventosUnicos(input).filter(e => {
    const valor = e.valor_numerico;
    const contador = e.datos_minimos.contador_total;
    const lecturaReal = e.tipo_evento === "pasos" && e.medido_directamente && e.procedencia !== "manual" && !e.datos_minimos.simulado;
    const ejemplo = incluirDemo && e.datos_minimos.simulado === true;
    return e.disponibilidad && e.unidad === "pasos" && (lecturaReal || ejemplo)
      && !e.datos_minimos.calibracion_humana
      && typeof valor === "number" && Number.isFinite(valor) && valor >= 0
      && (contador === undefined || (typeof contador === "number" && Number.isFinite(contador) && contador >= 0))
      && Number.isFinite(Date.parse(e.inicio_en)) && Date.parse(e.inicio_en) <= now.getTime()
      && diaDelEvento(e) >= desde && diaDelEvento(e) <= hoy;
  });
  const dias = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(inicio);
    date.setDate(inicio.getDate() + i);
    const fecha = fechaLocal(date);
    const lecturas = eventos.filter(e => diaDelEvento(e) === fecha);
    const acumulados = lecturas.filter(e => typeof e.datos_minimos.contador_total === "number");
    // El contador del día puede incluir intervalos y fuentes que se solapan.
    const pasos = !lecturas.length ? null : acumulados.length
      ? Math.max(...acumulados.map(e => e.datos_minimos.contador_total as number))
      : lecturas.reduce((sum, e) => sum + e.valor_numerico!, 0);
    return { fecha, ...impactoDePasos(pasos) };
  });
  const disponibles = dias.filter(d => d.tieneDatos);
  const ultimo = eventos.filter(e => diaDelEvento(e) === hoy).sort((a, b) => Date.parse(b.inicio_en) - Date.parse(a.inicio_en))[0];
  return {
    hoy: dias[6],
    sieteDias: { ...impactoDePasos(disponibles.length ? disponibles.reduce((s, d) => s + d.pasos, 0) : null), diasConDatos: disponibles.length },
    ultimaLectura: ultimo?.inicio_en ?? null,
  };
}

export function formatoCO2(gramos: number) {
  const kilos = gramos >= 1000;
  return `${(kilos ? gramos / 1000 : gramos).toLocaleString("es-PE", { maximumFractionDigits: kilos ? 2 : 0 })} ${kilos ? "kg" : "g"}`;
}

