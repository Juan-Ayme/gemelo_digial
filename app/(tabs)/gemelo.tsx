import { useState } from "react";
import { Pressable, Text, View } from "react-native";
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
  Pencil,
  Radio,
  Sparkles,
} from "lucide-react-native";

import { useRouter } from "expo-router";
import { PageHeader } from "@components/ui/PageHeader";
import { Button } from "@components/ui/Button";
import { BottomSheet } from "@components/ui/BottomSheet";
import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { PersonalizarGemelo } from "@components/gemelo/PersonalizarGemelo";
import { usePreferencias } from "@hooks/usePreferencias";
import { GemeloAvatar } from "@components/gemelo/Avatar";
import { useGemelo, useActualizarLecturasAlVolver } from "@hooks/useGemelo";
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
  { label: string; desc: string; icon: any }
> = {
  hora_del_dia: {
    label: "Momento del día",
    desc: "El momento de la consulta",
    icon: Clock,
  },
  actividad_actual: {
    label: "Actividad previa",
    desc: "La continuidad de lo que venías haciendo",
    icon: Activity,
  },
  zona_general: {
    label: "Entorno habitual",
    desc: "Tu espacio frecuente con total privacidad",
    icon: Compass,
  },
  pasos_ventana: {
    label: "Movimiento y pasos",
    desc: "Nivel de desplazamiento y actividad reciente",
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
  useActualizarLecturasAlVolver();
  const router = useRouter();
  const [posturas, setPosturas] = useState(false);
  const [detalles, setDetalles] = useState(false);
  const { data: gemelo, isLoading } = useGemelo();
  const { data: aliasZonas } = useAliasZonas();
  const { data: preferencias } = usePreferencias();
  const [personalizar, setPersonalizar] = useState(false);
  const [posePreview, setPosePreview] = useState<ActividadPredicha | null>(null);

  const fuentes = gemelo?.fuentes ?? [];
  const prediccion = gemelo?.prediccion ?? null;
  const variacion: NivelVariacion = gemelo?.variacion ?? "datos_insuficientes";
  const confianza = Math.round((prediccion?.probabilidad ?? 0) * 100);
  const esRF = gemelo?.fuentePrediccion === "rf";
  const modeloNombre =
    gemelo?.fuentePrediccion === "rf"
      ? "Sincronizado en la nube"
      : "Reglas generales";

  // Actividad mostrada en el avatar: o la que el usuario está probando, o la real
  const actividadActiva = posePreview ?? gemelo?.ultimaActividad ?? "permanencia";

  return (
    <Screen scroll>
      <PageHeader title="Mi gemelo" subtitle="Tu compañero para entender tus días."
        accessory={<Pressable accessibilityRole="button" accessibilityLabel="Personalizar mi gemelo" onPress={() => setPersonalizar(true)} className="rounded-full bg-white/10 items-center justify-center" style={{ width: 44, height: 44 }}>
          <Pencil size={19} color={colors.brandCyan} />
        </Pressable>} />
      <Card hero className="mt-5">
        <View className="items-center">
          <GemeloAvatar size={232} actividad={actividadActiva} preferencias={preferencias} />
          <Chip label={posePreview ? "Vista previa" : gemelo?.ultimaActividad ? ACTIVIDAD_LABELS[gemelo.ultimaActividad] : "Aún sin registros"} tone="mint" />
        </View>
        <View className="flex-row gap-3 mt-4">
          <View className="flex-1"><Button size="sm" variant="secondary" label={posturas ? "Cerrar movimientos" : "Probar movimientos"} onPress={() => { setPosturas(v => !v); setPosePreview(null); }} /></View>
          <View className="flex-1"><Button size="sm" variant="ghost" label="Ver mi día" onPress={() => router.push("/(tabs)/rutina")} /></View>
        </View>

        {/* Selector de gestos / poses para ver el gemelo en acción */}
        {posturas && <View className="w-full mt-4 mb-2">
          <Text className="text-[11px] text-ink-400 text-center uppercase tracking-widest mb-2">
            Probar posturas del gemelo
          </Text>
          <View className="flex-row flex-wrap justify-center gap-2">
            <Pressable
              onPress={() => setPosePreview(null)}
              accessibilityRole="button" accessibilityState={{ selected: posePreview === null }}
              className={`px-3 py-3 rounded-2xl border flex-row items-center gap-1.5 ${
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
                Último registro ({gemelo?.ultimaActividad ? ACTIVIDAD_LABELS[gemelo.ultimaActividad] : "Sin datos"})
              </Text>
            </Pressable>

            {POSES_DISPONIBLES.map((p) => {
              const activa = posePreview === p.id;
              const Icon = p.icon;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPosePreview(p.id)}
                  accessibilityRole="button" accessibilityState={{ selected: activa }}
                  className={`px-3 py-3 rounded-2xl border flex-row items-center gap-1.5 ${
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
          </View>
          {posePreview && <Text className="text-ink-400 text-xs text-center mt-3">Vista previa · esta postura no modifica tus registros.</Text>}
        </View>}

        {/* Estado y Confianza */}
        <MotiView
          from={{ opacity: 0, translateY: 6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 150, type: "timing", duration: 350 }}
          className="items-center mt-3"
        >
          <Text className="text-white text-2xl font-bold">
            {isLoading ? "Preparando tu gemelo…" : VARIACION_LABEL[variacion]}
          </Text>
          {gemelo?.analisisVariacion ? (
            <Text className="text-emerald-300 text-xs mt-1 text-center font-medium px-4">
              {gemelo.analisisVariacion.explicacion}
            </Text>
          ) : null}
          <Text className="text-ink-300 text-sm mt-1 text-center">
            {prediccion
              ? esRF ? `Puntuación del modelo: ${confianza}%` : "Estimación orientativa por reglas generales"
              : "Registra un momento para empezar"}
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
      </Card>
      <BottomSheet visible={personalizar} onClose={() => setPersonalizar(false)} title="Tu gemelo, a tu manera">
        <PersonalizarGemelo />
      </BottomSheet>
      <View className="mt-4"><Button variant="ghost" label={detalles ? "Ocultar cómo funciona" : "¿Cómo funciona mi gemelo?"} onPress={() => setDetalles(v => !v)} /></View>

      {/* ── Factores clave en tus hábitos ── */}
      {detalles && <Card glass className="mt-4">
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold flex-1">
            ¿En qué se fija tu gemelo?
          </Text>
          <Chip label="Hábitos" tone="brand" />
        </View>

        <Text className="text-xs text-ink-300 mt-1 mb-3">
          Señales disponibles para orientar la estimación:
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
              icon: Sparkles,
            };
            const peso = esRF ? prediccion?.importancias?.[vKey] : undefined;
            const Icon = v.icon;

            return (
              <View key={vKey} className="bg-white/5 rounded-xl p-3 border border-white/5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center gap-2 pr-2">
                    <Icon size={15} color={colors.brandCyan} />
                    <Text className="text-white font-semibold text-sm flex-1">
                      {v.label}
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-brand-300">
                    {peso == null ? "Señal" : `${Math.round(peso)}% de peso`}
                  </Text>
                </View>
                <Text className="text-[11px] text-ink-300 mt-1">
                  {v.desc}
                </Text>
                {/* Barra de relevancia */}
                {peso != null && <View className="h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <View
                    className="h-full bg-brand-400 rounded-full"
                    style={{ width: `${Math.max(0, Math.min(100, peso))}%` }}
                  />
                </View>}
              </View>
            );
          })}
        </View>

        <Text className="text-ink-400 text-xs mt-3 leading-4">
          Tú eliges qué sensores autorizar desde Perfil. Se utiliza zona general, sin guardar coordenadas exactas.
        </Text>
      </Card>}

      {/* ── Fuentes Activas de Datos ── */}
      <Card glass className="mt-4 mb-6">
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold flex-1">
            Tus datos disponibles
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
                    <Text className="text-white font-medium text-sm flex-1 pr-2">
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
