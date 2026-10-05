import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MotiView } from "moti";
import {
  Activity,
  Armchair,
  Briefcase,
  Calendar,
  Coffee,
  Crown,
  Dumbbell,
  Flame,
  Footprints,
  GraduationCap,
  Moon,
  TrendingUp,
  Trophy,
} from "lucide-react-native";

import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { ProGate, ProBadge } from "@components/ui/ProGate";
import { useHistorial, useSemanaResumen } from "@hooks/useHistorial";
import { useEsPro } from "@hooks/useSuscripcion";
import type { DiaResumen } from "@services/historial";
import type { ActividadPredicha } from "@services/types";
import { colors } from "@theme/colors";

const ACT_COLOR: Record<string, string> = {
  desplazamiento: "#f59e0b",
  trabajo: "#2dd4bf",
  estudio: "#8b5cf6",
  actividad_fisica: "#10b981",
  descanso: "#6288FF",
  ocio: "#fb7185",
  permanencia: "#64748b",
};

const ACT_ICON: Record<string, any> = {
  desplazamiento: Footprints,
  trabajo: Briefcase,
  estudio: GraduationCap,
  actividad_fisica: Dumbbell,
  descanso: Moon,
  ocio: Coffee,
  permanencia: Armchair,
};

const ACT_LABEL: Record<string, string> = {
  desplazamiento: "Desplazamiento",
  trabajo: "Trabajo",
  estudio: "Estudio",
  actividad_fisica: "Act. Física",
  descanso: "Descanso",
  ocio: "Ocio",
  permanencia: "Permanencia",
};

function BarraDia({ dia, maxPasos, isSelected, onPress }: {
  dia: DiaResumen;
  maxPasos: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  const pct = maxPasos > 0 ? (dia.pasosHoy / maxPasos) : 0;
  const actColor = dia.actividadDominante ? ACT_COLOR[dia.actividadDominante] : colors.textMuted;
  const metaAlcanzada = dia.pasosHoy >= 8_000;

  return (
    <Pressable onPress={onPress} className="flex-1 items-center gap-1.5">
      {/* Barra vertical */}
      <View className="w-full h-28 justify-end rounded-lg overflow-hidden bg-white/5">
        <MotiView
          from={{ height: "0%" }}
          animate={{ height: `${Math.max(4, pct * 100)}%` }}
          transition={{ type: "timing", duration: 500 }}
          style={{ backgroundColor: isSelected ? actColor : `${actColor}88` }}
          className="w-full rounded-lg"
        />
      </View>

      {/* Indicador de meta */}
      {metaAlcanzada && (
        <View className="w-1.5 h-1.5 rounded-full bg-accent-mint" />
      )}

      {/* Label día */}
      <Text
        className={`text-[10px] font-semibold ${isSelected ? "text-white" : "text-ink-400"}`}
      >
        {dia.label}
      </Text>

      {/* Pasos */}
      {isSelected && (
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/10 rounded-md px-1.5 py-0.5"
        >
          <Text className="text-[9px] text-white font-bold">
            {dia.pasosHoy.toLocaleString("es-PE")}
          </Text>
        </MotiView>
      )}
    </Pressable>
  );
}

export default function Historial() {
  const [periodo, setPeriodo] = useState<7 | 14 | 30>(7);
  const [diaSeleccionado, setDiaSeleccionado] = useState<DiaResumen | null>(null);
  const esPro = useEsPro();
  const { data: historial = [], isLoading } = useHistorial(periodo);
  const { data: semana } = useSemanaResumen(periodo);

  const maxPasos = Math.max(...historial.map((d) => d.pasosHoy), 1);
  const diaActivo = diaSeleccionado ?? historial[historial.length - 1] ?? null;

  const contenido = (
    <>
      {/* ── Gráfico de barras ── */}
      <Card glass className="mt-5">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold">
            Pasos por día
          </Text>
          <View className="flex-row items-center gap-1">
            <View className="w-1.5 h-1.5 rounded-full bg-accent-mint" />
            <Text className="text-[10px] text-ink-400">Meta 8k</Text>
          </View>
        </View>

        <ScrollView
          horizontal={periodo > 7}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View
            className="flex-row gap-1.5 items-end"
            style={{ minWidth: periodo > 7 ? periodo * 28 : undefined, flex: periodo <= 7 ? 1 : undefined }}
          >
            {historial.map((dia) => (
              <BarraDia
                key={dia.fecha}
                dia={dia}
                maxPasos={maxPasos}
                isSelected={diaActivo?.fecha === dia.fecha}
                onPress={() => setDiaSeleccionado(dia)}
              />
            ))}
          </View>
        </ScrollView>
      </Card>

      {/* ── Resumen del día seleccionado ── */}
      {diaActivo && (
        <MotiView
          key={diaActivo.fecha}
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 280 }}
        >
          <Card glass className="mt-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <Calendar size={16} color={colors.brandCyan} />
                <Text className="text-white font-semibold">{diaActivo.label}</Text>
              </View>
              {diaActivo.actividadDominante && (
                <Chip
                  label={ACT_LABEL[diaActivo.actividadDominante] ?? diaActivo.actividadDominante}
                  tone="brand"
                />
              )}
            </View>

            <View className="flex-row flex-wrap gap-3">
              {[
                { label: "Pasos", value: diaActivo.pasosHoy.toLocaleString("es-PE"), icon: Footprints, color: colors.brandCyan },
                { label: "Min. activos", value: `${diaActivo.minutosActivos} min`, icon: Activity, color: colors.accent.mint },
                { label: "Descanso", value: `${Math.round(diaActivo.minutosDescanso / 60)} h`, icon: Moon, color: colors.accent.violet },
                { label: "Eventos", value: `${diaActivo.totalEventos}`, icon: Calendar, color: colors.accent.amber },
              ].map(({ label, value, icon: Icon, color }) => (
                <View key={label} className="bg-white/5 rounded-xl p-3 flex-1 min-w-[100px] border border-white/5">
                  <Icon size={14} color={color} />
                  <Text className="text-white font-bold text-lg mt-1">{value}</Text>
                  <Text className="text-[10px] text-ink-400 uppercase tracking-wide">{label}</Text>
                </View>
              ))}
            </View>

            {/* Barra de confianza */}
            <View className="mt-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-[10px] text-ink-400 uppercase tracking-wide">Confianza del gemelo</Text>
                <Text className="text-[10px] text-brand-300 font-semibold">{diaActivo.confianzaPromedio}%</Text>
              </View>
              <View className="h-1 bg-white/10 rounded-full overflow-hidden">
                <MotiView
                  from={{ width: "0%" }}
                  animate={{ width: `${diaActivo.confianzaPromedio}%` }}
                  transition={{ type: "timing", duration: 400 }}
                  className="h-full bg-brand-400 rounded-full"
                />
              </View>
            </View>
          </Card>
        </MotiView>
      )}

      {/* ── Estadísticas de la semana ── */}
      {semana && (
        <Card className="mt-4">
          <View className="flex-row items-center gap-2 mb-4">
            <TrendingUp size={18} color={colors.brandCyan} />
            <Text className="text-white font-semibold text-base">Resumen del periodo</Text>
          </View>

          <View className="gap-3">
            {[
              {
                label: "Promedio de pasos",
                value: semana.promediopasos.toLocaleString("es-PE"),
                sub: "por día",
                icon: Footprints,
                color: colors.brandCyan,
              },
              {
                label: "Promedio activo",
                value: `${semana.promedioMinActivos} min`,
                sub: "por día",
                icon: Activity,
                color: colors.accent.mint,
              },
              {
                label: "Mejor día",
                value: semana.mejorDia ?? "—",
                sub: "más pasos",
                icon: Trophy,
                color: colors.accent.amber,
              },
              {
                label: "Racha actual",
                value: `${semana.rachaActual} días`,
                sub: "con ≥ 3k pasos",
                icon: Flame,
                color: colors.accent.coral,
              },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <View key={label} className="flex-row items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: `${color}18` }}>
                  <Icon size={18} color={color} />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">{value}</Text>
                  <Text className="text-[11px] text-ink-400">{label} · {sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>
      )}
    </>
  );

  return (
    <Screen scroll>
      <View className="gap-1">
        <Text className="text-3xl font-bold text-white">Historial</Text>
        <Text className="text-base text-ink-300">
          Tu evolución en el tiempo, día a día.
        </Text>
      </View>

      {/* Selector de periodo */}
      <View className="flex-row gap-2 mt-4">
        {([7, 14, 30] as const).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPeriodo(p)}
            className={`flex-1 py-2 rounded-xl items-center border ${
              periodo === p
                ? "bg-brand-500/20 border-brand-400"
                : "bg-white/5 border-white/10"
            }`}
          >
            <View className="flex-row items-center justify-center gap-1">
              <Text
                className={`text-xs font-semibold ${
                  periodo === p ? "text-brand-300" : "text-ink-300"
                }`}
              >
                {p} días
              </Text>
              {p > 7 && !esPro && <Crown size={10} color="#fbbf24" />}
            </View>
          </Pressable>
        ))}
      </View>

      {periodo > 7 && !esPro ? (
        <ProGate
          titulo={`Historial extendido de ${periodo} días`}
          descripcion="Accede a la evolución completa de tu Gemelo Digital por semanas o meses, detecta estacionalidades y compara tendencias de actividad."
          beneficios={[
            `Visualización completa de ${periodo} días consecutivos`,
            "Detección de patrones y estacionalidades en tu rutina",
            "Exportación histórica extendida para investigación",
          ]}
        >
          {contenido}
        </ProGate>
      ) : (
        contenido
      )}
    </Screen>
  );
}
