import { Text, View } from "react-native";
import { MotiView } from "moti";

import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { useRutina } from "@hooks/useGemelo";

export default function Rutina() {
  const { data: bloques = [] } = useRutina();
  const hayBloques = bloques.length > 0;

  return (
    <Screen scroll>
      <View className="gap-1">
        <Text className="text-3xl font-bold text-white">Rutina de hoy</Text>
        <Text className="text-base text-ink-300">
          Línea base construida a partir de tus ventanas de actividad.
        </Text>
      </View>

      <View className="flex-row gap-2 mt-4 flex-wrap">
        <Chip label={hayBloques ? "En seguimiento" : "Sin datos"} tone={hayBloques ? "mint" : "neutral"} />
        <Chip label={`${bloques.length} ventanas`} tone="brand" />
        <Chip label="v1.0 modelo" tone="violet" />
      </View>

      {hayBloques ? (
        <Card className="mt-6" delay={100}>
          {bloques.map((bloque, i) => (
            <MotiView
              key={`${bloque.hora}-${i}`}
              from={{ opacity: 0, translateX: -12 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: "timing", duration: 280, delay: i * 60 }}
              className="flex-row items-center gap-3 py-3"
            >
              <View className="w-14">
                <Text className="text-sm font-semibold text-white">
                  {bloque.hora}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-white">
                  {bloque.actividad}
                </Text>
                <Text className="text-xs text-ink-300 mt-0.5">
                  {bloque.detalle}
                </Text>
                <View className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                  <MotiView
                    from={{ width: "0%" }}
                    animate={{ width: `${Math.round(bloque.intensidad * 100)}%` }}
                    transition={{ type: "timing", duration: 500, delay: i * 60 + 200 }}
                    className="h-full bg-brand-500"
                  />
                </View>
              </View>
            </MotiView>
          ))}
        </Card>
      ) : (
        <Card className="mt-6" delay={100}>
          <Text className="text-base font-semibold text-white">
            Todavía no hay ventanas hoy
          </Text>
          <Text className="text-sm text-ink-300 mt-1">
            Ve a la pestaña "Hoy" y registra una ventana simulada para empezar a
            construir tu línea base.
          </Text>
        </Card>
      )}

      <Card className="mt-4" delay={hayBloques ? 500 : 200}>
        <Text className="text-xs uppercase tracking-widest text-ink-400">
          Observación descriptiva
        </Text>
        <Text className="text-base text-ink-100 mt-2 leading-6">
          {hayBloques
            ? "Tu rutina se mantiene dentro de tu línea base personal. No se ha detectado ninguna variación persistente."
            : "Cuando tengas varias ventanas registradas verás aquí observaciones sobre tu rutina."}
        </Text>
        <Text className="text-xs text-ink-300 mt-3">
          Los patrones no son diagnóstico médico. Pueden explicarse por horarios,
          viajes u otros factores que los sensores no conocen.
        </Text>
      </Card>
    </Screen>
  );
}
