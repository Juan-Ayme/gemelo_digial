import { Text, View } from "react-native";
import { MotiView } from "moti";
import {
  Activity,
  BarChart3,
  Flame,
  Footprints,
  Moon,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react-native";

import { PageHeader } from "@components/ui/PageHeader";
import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { useMetas } from "@hooks/useMetas";
import { compararSemanas } from "@services/resumenSemanal";
import type { MetasConfig } from "@services/metas";
import type { DiaResumen, SemanaResumen } from "@services/historial";
import { useSemanaResumen, useHistorial } from "@hooks/useHistorial";
import { useGemelo } from "@hooks/useGemelo";
import { useLogros, useEvaluarLogros } from "@hooks/useLogros";
import { ACTIVIDAD_LABELS } from "@services/types";
import type { GemeloSnapshot, ActividadPredicha } from "@services/types";
import { colors } from "@theme/colors";
import { useEffect } from "react";

const ACT_COLOR: Record<string, string> = {
  desplazamiento: "#f59e0b",
  trabajo: "#2dd4bf",
  estudio: "#8b5cf6",
  actividad_fisica: "#10b981",
  descanso: "#6288FF",
  ocio: "#fb7185",
  permanencia: "#64748b",
};

function InsightCard({
  icon: Icon,
  iconColor,
  titulo,
  descripcion,
  tipo,
  delay,
}: {
  icon: any;
  iconColor: string;
  titulo: string;
  descripcion: string;
  tipo: "positivo" | "neutro" | "negativo";
  delay: number;
}) {
  const border =
    tipo === "positivo"
      ? "border-emerald-500/30"
      : tipo === "negativo"
      ? "border-rose-500/30"
      : "border-white/10";
  const bg =
    tipo === "positivo"
      ? "bg-emerald-500/8"
      : tipo === "negativo"
      ? "bg-rose-500/8"
      : "bg-white/4";

  return (
    <MotiView
      from={{ opacity: 0, translateX: -12 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: "timing", duration: 350, delay }}
      className={`rounded-2xl p-4 border ${border} ${bg} flex-row gap-3 items-start`}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mt-0.5"
        style={{ backgroundColor: `${iconColor}18` }}
      >
        <Icon size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold text-sm">{titulo}</Text>
        <Text className="text-ink-300 text-xs mt-1 leading-4">{descripcion}</Text>
      </View>
      {tipo === "positivo" ? (
        <TrendingUp size={16} color={colors.accent.mint} />
      ) : tipo === "negativo" ? (
        <TrendingDown size={16} color={colors.accent.coral} />
      ) : null}
    </MotiView>
  );
}

function generarInsights(
  semana: SemanaResumen,
  gemelo: GemeloSnapshot | undefined,
  actividadesFrecuentes: [string, number][],
  historial: DiaResumen[],
  metas: MetasConfig | undefined,
) {
  const insights: Array<{ icon: any; iconColor: string; titulo: string; descripcion: string; tipo: "positivo" | "neutro" | "negativo" }> = [];
  const pasosRegistrados = historial.filter(d => d.tienePasos).length;
  const actividadRegistrada = historial.filter(d => d.tieneDuracionActividad).length;
  // Comparamos con elecciones personales, sin interpretar días sin lecturas como inactividad.
  if (pasosRegistrados) {
    const logrado = !!metas && semana.promediopasos >= metas.pasos;
    insights.push({ icon: logrado ? Trophy : Footprints, iconColor: logrado ? colors.accent.mint : colors.brandCyan,
      titulo: logrado ? "Tu promedio alcanza tu meta de pasos" : "Tus pasos de esta semana",
      descripcion: `${semana.promediopasos.toLocaleString("es-PE")} pasos por día con lecturas · ${pasosRegistrados} días registrados.${metas ? ` Tu meta personal: ${metas.pasos.toLocaleString("es-PE")}.` : ""}`,
      tipo: logrado ? "positivo" : "neutro" });
  }
  if (actividadRegistrada) {
    const logrado = !!metas && semana.promedioMinActivos >= metas.minutosActivos;
    insights.push({ icon: Activity, iconColor: colors.accent.mint,
      titulo: logrado ? "Tu promedio alcanza tu meta de movimiento" : "Movimiento con duración registrada",
      descripcion: `${semana.promedioMinActivos} min por día con intervalos · ${actividadRegistrada} días con duración disponible.${metas ? ` Tu meta personal: ${metas.minutosActivos} min.` : ""}`,
      tipo: logrado ? "positivo" : "neutro" });
  }
  if (semana.rachaActual >= 2) insights.push({ icon: Flame, iconColor: colors.accent.amber,
    titulo: `Racha registrada: ${semana.rachaActual} días`, descripcion: "Días consecutivos con al menos 3.000 pasos registrados. Cada registro suma a tu historia.", tipo: "positivo" });
  if (gemelo?.fuentes.some(f => f.codigo === "sleep" && f.disponible)) {
    const horas = (gemelo.minutosSueno ?? 0) / 60;
    insights.push({ icon: Moon, iconColor: colors.violet, titulo: "Tu registro de sueño de hoy",
      descripcion: `${horas.toFixed(1)} h registradas.${metas ? ` Tu referencia personal: ${metas.horasSueno} h.` : ""} Una lectura puede cubrir solo parte de la noche.`, tipo: "neutro" });
  }
  if (actividadesFrecuentes[0]) {
    const [actKey, count] = actividadesFrecuentes[0];
    insights.push({ icon: BarChart3, iconColor: colors.violet,
      titulo: `Actividad más registrada: ${ACTIVIDAD_LABELS[actKey as ActividadPredicha] ?? actKey}`,
      descripcion: `Fue la actividad con más observaciones en ${count} días. Los registros no representan todo el tiempo del día.`, tipo: "neutro" });
  }
  return insights;
}

export default function Insights() {
  const { data: historial = [] } = useHistorial(7);
  const { data: periodos = [] } = useHistorial(15);
  const { data: metas } = useMetas();
  // Dos semanas completas; hoy no se compara con un día ya terminado.
  const comparacion = compararSemanas(periodos.slice(7, 14), periodos.slice(0, 7));
  const { data: semana } = useSemanaResumen(7);
  const { data: gemelo } = useGemelo();
  const { data: logros = [] } = useLogros();
  const { evaluar } = useEvaluarLogros();

  useEffect(() => {
    evaluar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historial.length]);

  // Calcular distribución de actividades dominantes
  const actFreq: Record<string, number> = {};
  for (const d of historial) {
    if (d.actividadDominante) {
      actFreq[d.actividadDominante] = (actFreq[d.actividadDominante] ?? 0) + 1;
    }
  }
  const actsSorted = Object.entries(actFreq).sort((a, b) => b[1] - a[1]);
  const totalDias = actsSorted.reduce((s, [, c]) => s + c, 0);

  const insights = semana
    ? generarInsights(semana, gemelo, actsSorted, historial, metas)
    : [];

  const logrosDesbloqueados = logros.filter((l) => l.desbloqueado);

  const insightsVisibles = insights;

  return (
    <Screen scroll>
      <PageHeader title="Mi semana" subtitle="Un resumen de tus días registrados." />

      <View className="flex-row gap-2 mt-4 flex-wrap items-center">
        <Chip label="Esta semana" tone="brand" leadingIcon={<Sparkles size={12} color={colors.brandCyan} />} />
        <Chip label={`${logrosDesbloqueados.length} logros`} tone="violet" leadingIcon={<Trophy size={12} color={colors.violet} />} />
        <Chip label="Resumen semanal" tone="neutral" />
      </View>

      {/* ── Distribución de actividades ── */}
      {actsSorted.length > 0 && (
        <Card glass className="mt-5">
          <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold mb-3">
            ¿Qué actividades registraste?
          </Text>
          <View className="gap-2.5">
            {actsSorted.map(([act, count], i) => {
              const pct = totalDias > 0 ? (count / totalDias) * 100 : 0;
              const color = ACT_COLOR[act] ?? "#64748b";
              return (
                <MotiView
                  key={act}
                  from={{ opacity: 0, translateX: -8 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: i * 60, type: "timing", duration: 300 }}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-white text-xs font-medium">
                      {ACTIVIDAD_LABELS[act as ActividadPredicha] ?? act}
                    </Text>
                    <Text className="text-ink-400 text-xs">{count} día{count > 1 ? "s" : ""}</Text>
                  </View>
                  <View className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <MotiView
                      from={{ width: "0%" }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 60 + 100, type: "timing", duration: 400 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </View>
                </MotiView>
              );
            })}
          </View>
        </Card>
      )}

      {/* ── Resumen numérico ── */}
      {semana && (
        <View className="flex-row gap-3 mt-4">
          {[
            { label: "Promedio pasos", value: historial.some(d => d.tienePasos) ? semana.promediopasos.toLocaleString("es-PE") : "—", icon: Footprints, color: colors.brandCyan },
            { label: "Min activos", value: historial.some(d => d.tieneDuracionActividad) ? `${semana.promedioMinActivos}` : "—", icon: Activity, color: colors.accent.mint },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="flex-1">
              <Icon size={16} color={color} />
              <Text className="text-2xl font-bold text-white mt-2">{value}</Text>
              <Text className="text-[10px] text-ink-400 uppercase tracking-wide mt-0.5">{label}/día</Text>
            </Card>
          ))}
        </View>
      )}

      {/* ── Insights automáticos ── */}
      <View className="mt-4 gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Zap size={16} color={colors.accent.amber} />
            <Text className="text-white font-semibold text-base">Observaciones del gemelo</Text>
          </View>
          <Text className="text-[11px] text-ink-400">{historial.filter(d => d.totalEventos > 0).length} días con registros</Text>
        </View>

        {insightsVisibles.map((ins, i) => (
          <InsightCard key={ins.titulo} {...ins} delay={i * 80} />
        ))}

        {insights.length === 0 && (
          <Card>
            <Text className="text-ink-300 text-sm">
              Registra tu primer momento para ver aquí el resumen de tu semana.
            </Text>
          </Card>
        )}
      </View>

      <Card glass className="mt-4">
        <View className="flex-row items-center gap-2"><BarChart3 size={16} color={colors.brandCyan} /><Text className="text-white font-semibold">Tu semana, comparada</Text></View>
        <Text className="text-white text-sm font-semibold mt-3">{comparacion.titulo}</Text>
        <Text className="text-ink-300 text-xs mt-2 leading-5">{comparacion.detalle}</Text>
      </Card>

      {/* ── Logros recientes ── */}
      {logrosDesbloqueados.length > 0 && (
        <Card className="mt-4 mb-2">
          <View className="flex-row items-center gap-2 mb-3">
            <Trophy size={16} color={colors.accent.amber} />
            <Text className="text-white font-semibold text-base">Logros desbloqueados</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {logrosDesbloqueados.map((l, i) => (
              <MotiView
                key={l.id}
                from={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 60, type: "spring" }}
                className="bg-white/8 border border-white/10 rounded-2xl px-3 py-2 items-center"
              >
                <View className="w-8 h-8 rounded-xl items-center justify-center bg-amber-500/15 mb-1">
                  <Trophy size={16} color={colors.accent.amber} />
                </View>
                <Text className="text-[10px] text-white/80 font-semibold text-center">{l.titulo}</Text>
              </MotiView>
            ))}
          </View>
        </Card>
      )}
    </Screen>
  );
}
