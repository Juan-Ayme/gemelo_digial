import type { DiaResumen } from "@services/historial";
export function compararSemanas(actual: DiaResumen[], anterior: DiaResumen[]) {
  const days = actual.filter(d => d.tienePasos), previous = anterior.filter(d => d.tienePasos);
  const diasRegistrados = actual.filter(d => d.totalEventos > 0).length;
  if (!days.length) return { diasRegistrados, titulo: "Tu historia aún se está formando", detalle: "Todavía no hay lecturas de pasos en estos días. Puedes empezar con un registro y elegir un pequeño cambio sin esperar más datos." };
  const media = Math.round(days.reduce((a, d) => a + d.pasosHoy, 0) / days.length);
  const base = previous.length ? previous.reduce((a, d) => a + d.pasosHoy, 0) / previous.length : 0;
  const detalleBase = `Promedio de ${media.toLocaleString("es-PE")} pasos en ${days.length} días con lecturas.`;
  if (days.length < 3 || previous.length < 3 || base <= 0) return { diasRegistrados, titulo: "Cada registro ayuda a entender tu semana", detalle: `${detalleBase} Necesitamos al menos tres días con lecturas en cada periodo para comparar semanas.` };
  const delta = Math.round((media - base) / base * 100);
  return { diasRegistrados, titulo: Math.abs(delta) <= 5 ? "Tus registros muestran un ritmo parecido" : delta > 0 ? "Tus días registrados muestran más pasos" : "Tus días registrados muestran menos pasos",
    detalle: `${detalleBase} ${Math.abs(delta)}% ${delta >= 0 ? "más" : "menos"} que el promedio de los ${previous.length} días con lecturas de la semana anterior. La cobertura puede variar; esto no equivale a toda tu actividad ni a una evaluación de salud.` };
}
