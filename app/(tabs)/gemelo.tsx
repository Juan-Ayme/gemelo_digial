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
import { useAliasZonas } from "@hooks/useZonas";
import { nombreCortoZona } from "@services/zonas";
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
    desc: "Tu rutina y horarios habituales",
    peso: 35,
    icon: Clock,
  },
  actividad_actual: {
    label: "Actividad previa",
    desc: "La continuidad de lo que venías haciendo",
    peso: 30,
    icon: Activity,
  },
  zona_general: {
    label: "Entorno habitual",
    desc: "Tu espacio frecuente con total privacidad",
    peso: 20,
    icon: Compass,
  },
  pasos_ventana: {
    label: "Movimiento y pasos",
    desc: "Nivel de desplazamiento y actividad reciente",
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
  const { data: aliasZonas } = useAliasZonas();
  const [posePreview, setPosePreview] = useState<ActividadPredicha | null>(null);

  const fuentes = gemelo?.fuentes ?? [];
  const prediccion = gemelo?.prediccion ?? null;
  const variacion: NivelVariacion = gemelo?.variacion ?? "datos_insuficientes";
  const confianza = Math.round((prediccion?.probabilidad ?? 0) * 100);
  const esRF = gemelo?.fuentePrediccion === "rf" || gemelo?.fuentePrediccion === "rf_local";
  const modeloNombre =
    gemelo?.fuentePrediccion === "rf"
      ? "Sincronizado en la nube"
      : "Gemelo activo · Privado";

  // Actividad mostrada en el avatar: o la que el usuario está probando, o la real
  const actividadActiva = posePreview ?? gemelo?.ultimaActividad ?? "permanencia";

  return (
    <Screen scroll>
      {/* ── Encabezado & Avatar Poligonal Articulado ── */}
      <View className="items-center pt-2">
        <Chip
          label="Tu Gemelo Digital"
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
          {gemelo?.analisisVariacion ? (
            <Text className="text-emerald-300 text-xs mt-1 text-center font-medium px-4">
              {gemelo.analisisVariacion.explicacion}
            </Text>
          ) : null}
          <Text className="text-ink-300 text-sm mt-1 text-center">
            {prediccion
              ? `Estimación con ${confianza}% de coincidencia con tus hábitos`
              : "Registra momentos para sincronizar tu gemelo"}
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
                {modeloNombre}
              </Text>
            </View>
          ) : null}
        </MotiView>
      </View>

      {/* ── Factores clave en tus hábitos ── */}
      <Card glass className="mt-6">
        <View className="flex-row items-center justify-between">
          <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold">
            ¿En qué se fija tu gemelo?
          </Text>
          <Chip label="Hábitos" tone="brand" />
        </View>

        <Text className="text-xs text-ink-300 mt-1 mb-3">
          Señales cotidianas que determinan tu próxima actividad:
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
            const peso = prediccion?.importancias?.[vKey] ?? v.peso;
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
                    {peso}% de peso
                  </Text>
                </View>
                <Text className="text-[11px] text-ink-300 mt-1">
                  {v.desc}
                </Text>
                {/* Barra de relevancia */}
                <View className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <View
                    className="h-full bg-brand-400 rounded-full"
                    style={{ width: `${Math.min(100, peso * 2.2)}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <Text className="text-ink-400 text-xs mt-3 leading-4">
          Tu gemelo procesa estos datos de forma privada directamente en tu teléfono.
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
                      {f.codigo === "zone" && gemelo?.zonaActual && gemelo.zonaActual !== "—"
                        ? `Zona (${nombreCortoZona(gemelo.zonaActual, aliasZonas)})`
                        : f.nombre}
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
