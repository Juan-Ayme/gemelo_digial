import { Text, View, ScrollView } from "react-native";
import { MotiView } from "moti";
import { Lock, Star, Trophy } from "lucide-react-native";

import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { useLogros, useEvaluarLogros } from "@hooks/useLogros";
import { colors } from "@theme/colors";
import { useEffect } from "react";

const CATEGORIA_LABEL = {
  actividad: "Actividad",
  constancia: "Constancia",
  salud: "Salud",
  investigacion: "Investigación",
} as const;

const CATEGORIA_COLOR = {
  actividad: colors.brandCyan,
  constancia: colors.accent.amber,
  salud: colors.accent.mint,
  investigacion: colors.violet,
};

export default function Logros() {
  const { data: logros = [] } = useLogros();
  const { evaluar } = useEvaluarLogros();

  useEffect(() => {
    evaluar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const desbloqueados = logros.filter((l) => l.desbloqueado);
  const bloqueados = logros.filter((l) => !l.desbloqueado);
  const pct = logros.length > 0 ? Math.round((desbloqueados.length / logros.length) * 100) : 0;

  const categorias = ["actividad", "constancia", "salud", "investigacion"] as const;

  return (
    <Screen scroll>
      <View className="gap-1">
        <Text className="text-3xl font-bold text-white">Logros</Text>
        <Text className="text-base text-ink-300">
          Hitos que reflejan tu progreso y constancia.
        </Text>
      </View>

      {/* Progreso global */}
      <Card glass className="mt-5">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <Trophy size={18} color={colors.accent.amber} />
            <Text className="text-white font-semibold">Progreso total</Text>
          </View>
          <Text className="text-brand-300 font-bold text-lg">{desbloqueados.length} / {logros.length}</Text>
        </View>
        <View className="h-2 bg-white/10 rounded-full overflow-hidden">
          <MotiView
            from={{ width: "0%" }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "timing", duration: 600 }}
            className="h-full rounded-full bg-brand-400"
          />
        </View>
        <Text className="text-ink-400 text-xs mt-2">{pct}% completado</Text>
      </Card>

      {/* Logros por categoría */}
      {categorias.map((cat) => {
        const catLogros = logros.filter((l) => l.categoria === cat);
        if (catLogros.length === 0) return null;
        const color = CATEGORIA_COLOR[cat];

        return (
          <View key={cat} className="mt-5">
            <View className="flex-row items-center gap-2 mb-3 px-1">
              <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold">
                {CATEGORIA_LABEL[cat]}
              </Text>
            </View>

            <View className="gap-3">
              {catLogros.map((logro, i) => (
                <MotiView
                  key={logro.id}
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: i * 80, type: "timing", duration: 320 }}
                  className={`rounded-2xl p-4 border flex-row gap-4 items-center ${
                    logro.desbloqueado
                      ? "bg-white/6 border-white/12"
                      : "bg-white/2 border-white/5 opacity-50"
                  }`}
                >
                  {/* Emoji / Lock */}
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: logro.desbloqueado ? `${color}18` : "rgba(255,255,255,0.04)" }}
                  >
                    {logro.desbloqueado ? (
                      <Text className="text-2xl">{logro.emoji}</Text>
                    ) : (
                      <Lock size={20} color="rgba(255,255,255,0.2)" />
                    )}
                  </View>

                  {/* Info */}
                  <View className="flex-1">
                    <Text
                      className={`font-semibold text-sm ${
                        logro.desbloqueado ? "text-white" : "text-ink-400"
                      }`}
                    >
                      {logro.titulo}
                    </Text>
                    <Text className="text-ink-400 text-xs mt-0.5 leading-4">
                      {logro.descripcion}
                    </Text>
                    {logro.desbloqueado && logro.fechaDesbloqueo && (
                      <Text className="text-[10px] mt-1" style={{ color }}>
                        Obtenido el{" "}
                        {new Date(logro.fechaDesbloqueo).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </Text>
                    )}
                  </View>

                  {/* Badge */}
                  {logro.desbloqueado && (
                    <Star size={16} color={colors.accent.amber} fill={colors.accent.amber} />
                  )}
                </MotiView>
              ))}
            </View>
          </View>
        );
      })}

      {bloqueados.length > 0 && (
        <Text className="text-center text-xs text-ink-400 mt-6 mb-2">
          {bloqueados.length} logros por desbloquear — ¡sigue usando ando!
        </Text>
      )}
    </Screen>
  );
}
