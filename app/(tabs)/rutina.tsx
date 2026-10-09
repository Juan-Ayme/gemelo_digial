import { Text, View } from "react-native";
import { MotiView } from "moti";
import {
  Activity,
  Armchair,
  Briefcase,
  Clock,
  Coffee,
  Dumbbell,
  Footprints,
  GraduationCap,
  Layers,
  MapPin,
  Moon,
  Sparkles,
} from "lucide-react-native";

import { PageHeader } from "@components/ui/PageHeader";
import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { useRutina, useGemelo } from "@hooks/useGemelo";
import { useAliasZonas } from "@hooks/useZonas";
import { nombreCortoZona } from "@services/zonas";
import type { ActividadPredicha } from "@services/types";
import { colors } from "@theme/colors";

function getActividadConfig(act?: ActividadPredicha | string) {
  switch (act) {
    case "actividad_fisica":
      return {
        Icon: Dumbbell,
        color: colors.accent.mint,
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        barColor: "bg-emerald-400",
        dotColor: "#39efa2",
      };
    case "desplazamiento":
      return {
        Icon: Footprints,
        color: colors.accent.amber,
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        barColor: "bg-amber-400",
        dotColor: "#f59e0b",
      };
    case "trabajo":
      return {
        Icon: Briefcase,
        color: colors.brandCyan,
        bg: "bg-cyan-500/10",
        border: "border-cyan-500/30",
        barColor: "bg-cyan-400",
        dotColor: "#39e7ff",
      };
    case "estudio":
      return {
        Icon: GraduationCap,
        color: colors.violet,
        bg: "bg-violet-500/10",
        border: "border-violet-500/30",
        barColor: "bg-violet-400",
        dotColor: "#cfbdff",
      };
    case "descanso":
      return {
        Icon: Moon,
        color: "#6288FF",
        bg: "bg-blue-500/10",
        border: "border-blue-500/30",
        barColor: "bg-blue-400",
        dotColor: "#6288FF",
      };
    case "ocio":
      return {
        Icon: Coffee,
        color: colors.accent.coral,
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        barColor: "bg-rose-400",
        dotColor: "#ffb4ab",
      };
    case "permanencia":
    default:
      return {
        Icon: Armchair,
        color: "#94a3b8",
        bg: "bg-slate-500/10",
        border: "border-slate-500/30",
        barColor: "bg-slate-400",
        dotColor: "#94a3b8",
      };
  }
}

export default function Rutina() {
  const { data: bloques = [] } = useRutina();
  const { data: gemelo } = useGemelo();
  const { data: aliasZonas } = useAliasZonas();
  const hayBloques = bloques.length > 0;
  const esRF = gemelo?.fuentePrediccion === "rf" || gemelo?.fuentePrediccion === "rf_local";

  // Total de ventanas individuales procesadas dentro de los bloques
  const totalVentanas = bloques.reduce((acc, b) => acc + (b.cantidadVentanas ?? 1), 0);

  return (
    <Screen scroll>
      <PageHeader title="Mi día" subtitle="Los momentos que registraste hoy." />

      <View className="flex-row gap-2 mt-4 flex-wrap">
        <Chip
          label={hayBloques ? "Con registros" : "Sin datos"}
          tone={hayBloques ? "mint" : "neutral"}
          leadingIcon={
            hayBloques ? (
              <Activity size={12} color={colors.accent.mint} />
            ) : undefined
          }
        />
        <Chip
          label={`${bloques.length} ${bloques.length === 1 ? "momento" : "momentos"}`}
          tone="brand"
          leadingIcon={<Layers size={12} color={colors.brandCyan} />}
        />
        <Chip
          label="Registro de hoy"
          tone="violet"
          leadingIcon={<Sparkles size={12} color={colors.violet} />}
        />
      </View>

      {hayBloques ? (
        <View className="mt-6">
          {bloques.map((bloque, i) => {
            const cfg = getActividadConfig(bloque.tipoActividad);
            const Icon = cfg.Icon;
            const esUltimo = i === bloques.length - 1;

            return (
              <MotiView
                key={`${bloque.hora}-${i}`}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 320, delay: i * 70 }}
                className="flex-row items-stretch"
              >
                {/* ── Columna de tiempo y línea conectora ── */}
                <View className="w-16 items-end pr-3 pt-1">
                  <Text className="text-xs font-semibold text-white/90">
                    {bloque.horaInicio ?? bloque.hora}
                  </Text>
                  {bloque.horaFin && bloque.horaFin !== bloque.horaInicio ? (
                    <Text className="text-[10px] text-ink-400 mt-0.5">
                      {bloque.horaFin}
                    </Text>
                  ) : null}
                </View>

                {/* ── Eje vertical de la línea de tiempo ── */}
                <View className="items-center mr-3">
                  <View
                    className="w-3 h-3 rounded-full mt-1.5 border-2 border-surface-900"
                    style={{ backgroundColor: cfg.dotColor }}
                  />
                  {!esUltimo && (
                    <View className="w-0.5 flex-1 bg-white/10 my-1" />
                  )}
                </View>

                {/* ── Tarjeta del bloque de actividad ── */}
                <View className="flex-1 mb-3">
                  <Card glass className="p-3.5 border border-white/10">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2 flex-1">
                        <View className={`w-8 h-8 rounded-xl items-center justify-center ${cfg.bg} border ${cfg.border}`}>
                          <Icon size={16} color={cfg.color} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-white">
                            {bloque.actividad}
                          </Text>
                        </View>
                      </View>

                      {/* Pill de duración o ventanas */}
                      {(bloque.duracionMin && bloque.duracionMin > 1) ? (
                        <View className="flex-row items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                          <Clock size={10} color={colors.textMuted} />
                          <Text className="text-[11px] text-ink-200 font-medium">
                            {bloque.duracionMin} min
                          </Text>
                        </View>
                      ) : (bloque.cantidadVentanas && bloque.cantidadVentanas > 1) ? (
                        <View className="flex-row items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
                          <Layers size={10} color={colors.textMuted} />
                          <Text className="text-[11px] text-ink-200 font-medium">
                            {bloque.cantidadVentanas} vent.
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Metadatos: Zona y Confianza */}
                    <View className="flex-row items-center gap-3 mt-2 flex-wrap">
                      <View className="flex-row items-center gap-1">
                        <MapPin size={11} color={colors.accent.mint} />
                        <Text className="text-xs text-ink-300">
                          {bloque.zona ? nombreCortoZona(bloque.zona, aliasZonas) : "Sin zona detectada"}
                        </Text>
                      </View>

                      {bloque.confianza != null ? (
                        <View className="flex-row items-center gap-1 bg-white/5 rounded-md px-1.5 py-0.5">
                          <Sparkles size={10} color={colors.brandCyan} />
                          <Text className="text-[11px] text-brand-200">
                            {bloque.confianza}% puntuación de registro
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Barra sutil de intensidad */}
                    <View className="h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                      <MotiView
                        from={{ width: "0%" }}
                        animate={{ width: `${Math.round(bloque.intensidad * 100)}%` }}
                        transition={{ type: "timing", duration: 450, delay: i * 50 + 150 }}
                        className={`h-full ${cfg.barColor}`}
                      />
                    </View>
                  </Card>
                </View>
              </MotiView>
            );
          })}
        </View>
      ) : (
        <Card className="mt-6" delay={100}>
          <Text className="text-base font-semibold text-white">
            Todavía no hay ventanas hoy
          </Text>
          <Text className="text-sm text-ink-300 mt-1 leading-5">
            Registra un momento desde "Hoy" con los sensores autorizados.
            La captura de fondo depende de los permisos y de tu dispositivo.
          </Text>
        </Card>
      )}

      <Card className="mt-2" delay={hayBloques ? 400 : 200}>
        <Text className="text-xs uppercase tracking-widest text-ink-400">
          Observación descriptiva
        </Text>
        <Text className="text-base text-ink-100 mt-2 leading-6">
          {hayBloques
            ? "Aquí se muestran los momentos registrados. Solo se unen intervalos contiguos; los huecos sin medición no se consideran actividad."
            : "Cuando tengas varias ventanas registradas verás aquí observaciones analíticas sobre tu rutina."}
        </Text>
        <Text className="text-xs text-ink-300 mt-3 leading-4">
          Una lectura puntual muestra un momento, no toda tu jornada. Este registro no evalúa tu salud.
        </Text>
      </Card>
    </Screen>
  );
}
