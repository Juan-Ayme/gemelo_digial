import { Text, View } from "react-native";
import { MotiView } from "moti";
import {
  Activity,
  BookOpen,
  Flame,
  Footprints,
  HeartPulse,
  Moon,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react-native";

import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { useSemanaResumen, useHistorial } from "@hooks/useHistorial";
import { useGemelo } from "@hooks/useGemelo";
import { useLogros, useEvaluarLogros } from "@hooks/useLogros";
import { ACTIVIDAD_LABELS } from "@services/types";
import type { ActividadPredicha } from "@services/types";
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
  emoji,
  titulo,
  descripcion,
  tipo,
  delay,
}: {
  emoji: string;
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
      <Text className="text-2xl">{emoji}</Text>
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
  semana: { promediopasos: number; promedioMinActivos: number; rachaActual: number; mejorDia: string | null },
  gemelo: { pasosHoy: number; minutosActivos: number; minutosDescanso: number } | undefined,
  actividadesFrecuentes: [string, number][],
) {
  const insights: Array<{
    emoji: string;
    titulo: string;
    descripcion: string;
    tipo: "positivo" | "neutro" | "negativo";
  }> = [];

  // Pasos
  if (semana.promediopasos >= 8_000) {
    insights.push({
      emoji: "🏆",
      titulo: "Meta de pasos superada",
      descripcion: `Promedio de ${semana.promediopasos.toLocaleString("es-PE")} pasos/día esta semana. ¡Por encima del objetivo de 8.000!`,
      tipo: "positivo",
    });
  } else if (semana.promediopasos >= 5_000) {
    insights.push({
      emoji: "👣",
      titulo: "Cerca de tu meta de pasos",
      descripcion: `Promedias ${semana.promediopasos.toLocaleString("es-PE")} pasos/día. Faltan ${(8_000 - semana.promediopasos).toLocaleString("es-PE")} para alcanzar el objetivo.`,
      tipo: "neutro",
    });
  } else {
    insights.push({
      emoji: "⚠️",
      titulo: "Pocos pasos esta semana",
      descripcion: `Solo ${semana.promediopasos.toLocaleString("es-PE")} pasos/día de promedio. Intenta caminar un poco más cada mañana.`,
      tipo: "negativo",
    });
  }

  // Actividad
  if (semana.promedioMinActivos >= 30) {
    insights.push({
      emoji: "💪",
      titulo: "Activo dentro del estándar OMS",
      descripcion: `${semana.promedioMinActivos} min activos/día. La OMS recomienda ≥ 30 min diarios.`,
      tipo: "positivo",
    });
  } else {
    insights.push({
      emoji: "🛋️",
      titulo: "Sedentarismo por encima del ideal",
      descripcion: `Solo ${semana.promedioMinActivos} min activos/día. Añadir 15 min de caminata puede marcar la diferencia.`,
      tipo: "negativo",
    });
  }

  // Racha
  if (semana.rachaActual >= 5) {
    insights.push({
      emoji: "🔥",
      titulo: `¡Racha de ${semana.rachaActual} días!`,
      descripcion: "Llevas varios días consecutivos moviéndote. Mantén el ritmo.",
      tipo: "positivo",
    });
  } else if (semana.rachaActual >= 2) {
    insights.push({
      emoji: "⚡",
      titulo: `Racha de ${semana.rachaActual} días`,
      descripcion: "Vas bien. ¡Unos días más y tendrás una racha notable!",
      tipo: "neutro",
    });
  }

  // Sueño
  const horasSueno = (gemelo?.minutosDescanso ?? 0) / 60;
  if (horasSueno >= 7 && horasSueno <= 9) {
    insights.push({
      emoji: "😴",
      titulo: "Buen descanso registrado",
      descripcion: `${horasSueno.toFixed(1)} h de sueño · Dentro del rango ideal (7–9 h).`,
      tipo: "positivo",
    });
  } else if (horasSueno > 0 && horasSueno < 6) {
    insights.push({
      emoji: "😵",
      titulo: "Poco descanso detectado",
      descripcion: `${horasSueno.toFixed(1)} h de sueño · Por debajo del mínimo recomendado.`,
      tipo: "negativo",
    });
  }

  // Actividad dominante
  if (actividadesFrecuentes[0]) {
    const [actKey, count] = actividadesFrecuentes[0];
    insights.push({
      emoji: "📊",
      titulo: `Tu actividad dominante: ${ACTIVIDAD_LABELS[actKey as ActividadPredicha] ?? actKey}`,
      descripcion: `Apareció ${count} veces esta semana como actividad principal del día.`,
      tipo: "neutro",
    });
  }

  return insights;
}

export default function Insights() {
  const { data: historial = [] } = useHistorial(7);
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
    ? generarInsights(semana, gemelo, actsSorted)
    : [];

  const logrosDesbloqueados = logros.filter((l) => l.desbloqueado);

  return (
    <Screen scroll>
      <View className="gap-1">
        <Text className="text-3xl font-bold text-white">Insights</Text>
        <Text className="text-base text-ink-300">
          Tendencias y patrones de los últimos 7 días.
        </Text>
      </View>

      <View className="flex-row gap-2 mt-4 flex-wrap">
        <Chip label="Esta semana" tone="brand" leadingIcon={<Sparkles size={12} color={colors.brandCyan} />} />
        <Chip label={`${logrosDesbloqueados.length} logros`} tone="violet" leadingIcon={<Trophy size={12} color={colors.violet} />} />
      </View>

      {/* ── Distribución de actividades ── */}
      {actsSorted.length > 0 && (
        <Card glass className="mt-5">
          <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold mb-3">
            ¿Cómo pasaste tu semana?
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
            { label: "Promedio pasos", value: semana.promediopasos.toLocaleString("es-PE"), icon: Footprints, color: colors.brandCyan },
            { label: "Min activos", value: `${semana.promedioMinActivos}`, icon: Activity, color: colors.accent.mint },
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
        <View className="flex-row items-center gap-2">
          <Zap size={16} color={colors.accent.amber} />
          <Text className="text-white font-semibold text-base">Observaciones del gemelo</Text>
        </View>
        {insights.map((ins, i) => (
          <InsightCard key={ins.titulo} {...ins} delay={i * 80} />
        ))}
        {insights.length === 0 && (
          <Card>
            <Text className="text-ink-300 text-sm">
              Registra más actividad para que tu gemelo genere observaciones personalizadas.
            </Text>
          </Card>
        )}
      </View>

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
                <Text className="text-2xl">{l.emoji}</Text>
                <Text className="text-[10px] text-white/80 font-semibold mt-1 text-center">{l.titulo}</Text>
              </MotiView>
            ))}
          </View>
        </Card>
      )}
    </Screen>
  );
}
