import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MotiView } from "moti";
import {
  Activity,
  Armchair,
  Briefcase,
  CircleDot,
  Clock,
  Coffee,
  Compass,
  Dumbbell,
  Footprints,
  GraduationCap,
  HeartPulse,
  Moon,
  Radio,
  Sparkles,
} from "lucide-react-native";

import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { GemeloAvatar } from "@components/gemelo/Avatar";
import { useGemelo } from "@hooks/useGemelo";
import {
  ACTIVIDAD_LABELS,
  type ActividadPredicha,
  type NivelVariacion,
} from "@services/types";
import { colors } from "@theme/colors";

const VARIACION_LABEL: Record<NivelVariacion, string> = {
  estable: "Rutina estable",
  cambio_reciente: "Cambio reciente",
  cambio_persistente: "Cambio persistente",
  datos_insuficientes: "Aún aprendiendo",
};

const POSES_DISPONIBLES: { id: ActividadPredicha; label: string; icon: any }[] = [
  { id: "permanencia", label: "Reposo", icon: Armchair },
  { id: "desplazamiento", label: "Caminar", icon: Footprints },
  { id: "trabajo", label: "Trabajo", icon: Briefcase },
  { id: "estudio", label: "Estudio", icon: GraduationCap },
  { id: "actividad_fisica", label: "Ejercicio", icon: Dumbbell },
  { id: "descanso", label: "Descanso", icon: Moon },
  { id: "ocio", label: "Ocio", icon: Coffee },
];

const VARIABLE_INFO: Record<
  string,
  { label: string; desc: string; peso: number; icon: any }
> = {
  hora_del_dia: {
    label: "Momento del día",
    desc: "Patrón circadiano y hábitos horarios",
    peso: 35,
    icon: Clock,
  },
  actividad_actual: {
    label: "Actividad previa",
    desc: "Inercia conductual y transiciones",
    peso: 30,
    icon: Activity,
  },
  zona_general: {
    label: "Zona contextual",
    desc: "Frecuencia en celda espacial",
    peso: 20,
    icon: Compass,
  },
  pasos_ventana: {
    label: "Ritmo de pasos",
    desc: "Cadencia e intensidad motriz",
    peso: 15,
    icon: Footprints,
  },
};

function getFuenteIcon(codigo: string) {
  switch (codigo) {
    case "activity":
      return Activity;
    case "steps":
      return Footprints;
    case "zone":
      return Compass;
    case "sleep":
      return Moon;
    case "wearable":
      return HeartPulse;
    default:
      return CircleDot;
  }
}

export default function GemeloTab() {
  const { data: gemelo } = useGemelo();
  const [posePreview, setPosePreview] = useState<ActividadPredicha | null>(null);

  const fuentes = gemelo?.fuentes ?? [];
  const prediccion = gemelo?.prediccion ?? null;
  const variacion: NivelVariacion = gemelo?.variacion ?? "datos_insuficientes";
  const confianza = Math.round((prediccion?.probabilidad ?? 0) * 100);
  const esRF = gemelo?.fuentePrediccion === "rf";

  // Actividad mostrada en el avatar: o la que el usuario está probando, o la real
  const actividadActiva = posePreview ?? gemelo?.ultimaActividad ?? "permanencia";

  return (
    <Screen scroll>
      {/* ── Encabezado & Avatar Poligonal Articulado ── */}
      <View className="items-center pt-2">
        <Chip
          label="Gemelo Digital Articulado"
          tone="brand"
          leadingIcon={<Sparkles size={12} color={colors.brandCyan} />}
        />

        {/* Avatar interactivo */}
        <View className="my-2">
          <GemeloAvatar size={250} actividad={actividadActiva} />
        </View>

        {/* Selector de gestos / poses para ver el gemelo en acción */}
        <View className="w-full mt-1 mb-2">
          <Text className="text-[11px] text-ink-400 text-center uppercase tracking-widest mb-2">
            Probar posturas del gemelo
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 8, gap: 6 }}
          >
            <Pressable
              onPress={() => setPosePreview(null)}
              className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1.5 ${
                posePreview === null
                  ? "bg-brand-500/20 border-brand-400"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <Radio
                size={12}
                color={posePreview === null ? colors.brandCyan : colors.textMuted}
              />
              <Text
                className={`text-xs font-semibold ${
                  posePreview === null ? "text-brand-300" : "text-ink-300"
                }`}
              >
                En vivo ({ACTIVIDAD_LABELS[gemelo?.ultimaActividad ?? "permanencia"] ?? "Reposo"})
              </Text>
            </Pressable>

            {POSES_DISPONIBLES.map((p) => {
              const activa = posePreview === p.id;
              const Icon = p.icon;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPosePreview(p.id)}
                  className={`px-3 py-1.5 rounded-full border flex-row items-center gap-1.5 ${
                    activa
                      ? "bg-brand-500/20 border-brand-400"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <Icon
                    size={12}
                    color={activa ? colors.brandCyan : colors.textMuted}
                  />
                  <Text
                    className={`text-xs font-medium ${
                      activa ? "text-brand-200 font-semibold" : "text-ink-300"
                    }`}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Estado y Confianza */}
        <MotiView
          from={{ opacity: 0, translateY: 6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 150, type: "timing", duration: 350 }}
          className="items-center mt-3"
        >
          <Text className="text-white text-2xl font-bold">
            {VARIACION_LABEL[variacion]}
          </Text>
          <Text className="text-ink-300 text-sm mt-1 text-center">
            {prediccion
              ? `Última predicción calculada con ${confianza}% de confianza`
              : "Registra ventanas para generar tu primera predicción"}
          </Text>
          {prediccion ? (
            <View className="flex-row items-center gap-1.5 mt-2 bg-white/10 border border-white/10 rounded-full px-3 py-1">
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: esRF ? colors.accent.mint : colors.brandCyan }}
              />
              <Text
                className="text-xs font-semibold"
                style={{ color: esRF ? colors.accent.mint : colors.brandCyan }}
              >
                {esRF ? "Modelo Random Forest v1.0" : "Modelo Heurístico Adaptativo"}
              </Text>
            </View>
          ) : null}
        </MotiView>
      </View>

      {/* ── Variables Influyentes (Explainable AI / XAI) ── */}
      <Card glass className="mt-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold">
            Variables influyentes en la predicción
          </Text>
          <Chip label="XAI" tone="violet" />
        </View>

        <Text className="text-xs text-ink-300 mt-1 mb-3">
          Factores que mayor peso aportaron al resultado del modelo predictivo:
        </Text>

        <View className="gap-3">
          {(prediccion?.variablesRelevantes ?? [
            "hora_del_dia",
            "actividad_actual",
            "zona_general",
            "pasos_ventana",
          ]).map((vKey) => {
            const v = VARIABLE_INFO[vKey] ?? {
              label: vKey,
              desc: "Factor predictivo",
              peso: 25,
              icon: Sparkles,
            };
            const Icon = v.icon;

            return (
              <View key={vKey} className="bg-white/5 rounded-xl p-3 border border-white/5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Icon size={15} color={colors.brandCyan} />
                    <Text className="text-white font-semibold text-sm">
                      {v.label}
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-brand-300">
                    {v.peso}% peso
                  </Text>
                </View>
                <Text className="text-[11px] text-ink-300 mt-1">
                  {v.desc}
                </Text>
                {/* Barra de importancia relativa */}
                <View className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <View
                    className="h-full bg-brand-400 rounded-full"
                    style={{ width: `${v.peso * 2.2}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <Text className="text-ink-400 text-xs mt-3 leading-4">
          {esRF
            ? "Predicción calculada por Random Forest con pesos derivados de los árboles de decisión en Supabase."
            : "Actualmente se ponderan por frecuencia circadiana temporal. El modelo Random Forest se activará en el pipeline PySpark."}
        </Text>
      </Card>

      {/* ── Fuentes Activas de Datos ── */}
      <Card glass className="mt-4 mb-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold">
            Fuentes de sensores activas
          </Text>
          <Text className="text-xs text-ink-400">
            {fuentes.filter((f) => f.disponible).length} de {fuentes.length} disponibles
          </Text>
        </View>

        <View className="gap-3 mt-3">
          {fuentes.map((f) => {
            const Icon = getFuenteIcon(f.codigo);
            return (
              <View
                key={f.codigo}
                className="flex-row items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5"
              >
                <View
                  className={`w-7 h-7 rounded-lg items-center justify-center ${
                    f.disponible ? "bg-emerald-500/10" : "bg-white/5"
                  }`}
                >
                  <Icon
                    size={15}
                    color={f.disponible ? colors.accent.mint : colors.textMuted}
                  />
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white font-medium text-sm">
                      {f.nombre}
                    </Text>
                    <Text
                      className="text-xs font-semibold"
                      style={{
                        color: f.disponible ? colors.accent.mint : colors.textMuted,
                      }}
                    >
                      {f.disponible ? `${f.calidad}% calidad` : "Sin datos"}
                    </Text>
                  </View>

                  {/* Barra de calidad */}
                  <View className="h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${f.disponible ? f.calidad : 0}%`,
                        backgroundColor: f.disponible
                          ? colors.accent.mint
                          : "transparent",
                      }}
                    />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}
