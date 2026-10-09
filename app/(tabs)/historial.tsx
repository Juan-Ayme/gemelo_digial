import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
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

import { PageHeader } from "@components/ui/PageHeader";
import { SegmentedControl } from "@components/ui/SegmentedControl";
import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { ProGate, ProBadge } from "@components/ui/ProGate";
import { Button } from "@components/ui/Button";
import { useActualizarLecturasAlVolver } from "@hooks/useGemelo";
import { useHistorial, useSemanaResumen } from "@hooks/useHistorial";
import { useMetas } from "@hooks/useMetas";
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

function BarraDia({ dia, maxPasos, metaPasos, isSelected, onPress }: {
  dia: DiaResumen;
  maxPasos: number;
  metaPasos: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  const pct = maxPasos > 0 ? (dia.pasosHoy / maxPasos) : 0;
  const actColor = dia.actividadDominante ? ACT_COLOR[dia.actividadDominante] : colors.textMuted;
  const metaAlcanzada = dia.tienePasos && dia.pasosHoy >= metaPasos;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: isSelected }} accessibilityLabel={`${dia.label}: ${dia.tienePasos ? dia.pasosHoy + " pasos" : "sin lectura de pasos"}`} className="flex-1 items-center gap-1.5">
      {/* Barra vertical */}
      <View className="w-full h-28 justify-end rounded-lg overflow-hidden bg-white/5">
        <MotiView
          from={{ height: "0%" }}
          animate={{ height: `${dia.tienePasos ? pct * 100 : 0}%` }}
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
            {dia.tienePasos ? dia.pasosHoy.toLocaleString("es-PE") : "—"}
          </Text>
        </MotiView>
      )}
    </Pressable>
  );
}

export default function Historial() {
  useActualizarLecturasAlVolver();
  const [actualizando, setActualizando] = useState(false);
  const [periodo, setPeriodo] = useState<7 | 14 | 30>(7);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const esPro = useEsPro();
  const { data: metas } = useMetas();
  const { data: historial = [], isLoading, error, refetch } = useHistorial(periodo);
  const { data: semana } = useSemanaResumen(periodo);

  const maxPasos = Math.max(...historial.map((d) => d.pasosHoy), 1);
  const diaActivo = historial.find(d => d.fecha === diaSeleccionado) ?? historial[historial.length - 1] ?? null;
  const actualizar = async () => { setActualizando(true); try { await refetch(); } finally { setActualizando(false); } };

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
            <Text className="text-[10px] text-ink-400">Meta {metas?.pasos.toLocaleString("es-PE") ?? "8,000"}</Text>
          </View>
        </View>

        <Text className="text-xs text-ink-400 mb-3">Toca un día para ver sus registros. Una barra vacía indica que no hay lectura.</Text>
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
                metaPasos={metas?.pasos ?? 8000}
                isSelected={diaActivo?.fecha === dia.fecha}
                onPress={() => setDiaSeleccionado(dia.fecha)}
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
                { label: "Pasos", value: diaActivo.tienePasos ? diaActivo.pasosHoy.toLocaleString("es-PE") : "—", icon: Footprints, color: colors.brandCyan },
                { label: "Min. activos", value: diaActivo.tieneDuracionActividad ? `${diaActivo.minutosActivos} min` : "—", icon: Activity, color: colors.accent.mint },
                { label: "Sueño", value: diaActivo.tieneSueno ? `${((diaActivo.minutosSueno ?? 0) / 60).toFixed(1)} h` : "—", icon: Moon, color: colors.accent.violet },
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
                <Text className="text-[10px] text-ink-400 uppercase tracking-wide flex-1 pr-2">Puntuación media de los registros</Text>
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
                value: historial.some(d => d.tienePasos) ? semana.promediopasos.toLocaleString("es-PE") : "—",
                sub: historial.some(d => d.tienePasos) ? "por día con lecturas" : "sin lecturas de pasos",
                icon: Footprints,
                color: colors.brandCyan,
              },
              {
                label: "Promedio activo",
                value: historial.some(d => d.tieneDuracionActividad) ? `${semana.promedioMinActivos} min` : "—",
                sub: historial.some(d => d.tieneDuracionActividad) ? "por día con duración registrada" : "sin duración registrada",
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
                value: `${semana.rachaActual} ${semana.rachaActual === 1 ? "día" : "días"}`,
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
    <Screen scroll scrollProps={{ refreshControl: <RefreshControl refreshing={actualizando} onRefresh={actualizar} tintColor={colors.brandCyan} colors={[colors.brandCyan]} /> }}>
      <PageHeader title="Historial" subtitle="Tus días registrados, en un solo lugar." />

      {error && <Card className="mt-4 border-amber-400/30" animated={false}>
        <Text className="text-white font-semibold">No pudimos actualizar el historial</Text>
        <Text className="text-ink-300 text-sm mt-2">{historial.length ? "Mostramos el último historial disponible." : "Intenta nuevamente para recuperar tus registros."}</Text>
        <View className="mt-3"><Button size="sm" variant="secondary" label="Reintentar" loading={actualizando} onPress={actualizar} /></View>
      </Card>}
      {isLoading && <Text className="text-ink-300 text-sm mt-4">Cargando tus días…</Text>}

      <View className="mt-5">
        <SegmentedControl value={periodo} label="Periodo del historial" onChange={p => { setPeriodo(p); setDiaSeleccionado(null); }} options={[
          { value: 7 as const, label: "7 días" },
          { value: 14 as const, label: "14 días", icon: !esPro ? <Crown size={12} color={colors.accent.amber} /> : undefined },
          { value: 30 as const, label: "30 días", icon: !esPro ? <Crown size={12} color={colors.accent.amber} /> : undefined },
        ]} />
      </View>

      {periodo > 7 && !esPro ? (
        <ProGate
          titulo={`Historial extendido de ${periodo} días`}
          descripcion="Accede a la evolución completa de tu Gemelo Digital por semanas o meses, detecta estacionalidades y compara tendencias de actividad."
          beneficios={[
            `Visualización completa de ${periodo} días consecutivos`,
            "Detección de patrones y estacionalidades en tu rutina",
            "Exportación histórica extendida y análisis avanzado",
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
