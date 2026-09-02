import { Text, View } from "react-native";
import { MotiView } from "moti";
import { CircleDot } from "lucide-react-native";

import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { GemeloAvatar } from "@components/gemelo/Avatar";
import { useGemelo } from "@hooks/useGemelo";
import type { NivelVariacion } from "@services/types";
import { colors } from "@theme/colors";

const VARIACION_LABEL: Record<NivelVariacion, string> = {
  estable: "Rutina estable",
  cambio_reciente: "Cambio reciente",
  cambio_persistente: "Cambio persistente",
  datos_insuficientes: "Aún aprendiendo",
};

export default function GemeloTab() {
  const { data: gemelo } = useGemelo();
  const fuentes = gemelo?.fuentes ?? [];
  const prediccion = gemelo?.prediccion ?? null;
  const variacion: NivelVariacion = gemelo?.variacion ?? "datos_insuficientes";
  const confianza = Math.round((prediccion?.probabilidad ?? 0) * 100);

  return (
    <Screen variant="night" scroll>
      <View className="items-center pt-4">
        <Chip label="Estado del gemelo" tone="brand" />
        <GemeloAvatar size={260} />
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200, type: "timing", duration: 400 }}
          className="items-center mt-2"
        >
          <Text className="text-white text-2xl font-bold">{VARIACION_LABEL[variacion]}</Text>
          <Text className="text-brand-100/80 text-sm mt-1">
            {prediccion
              ? `Última predicción con ${confianza}% de confianza`
              : "Registra actividad para calcular tu primera predicción"}
          </Text>
        </MotiView>
      </View>

      <Card glass className="mt-8">
        <Text className="text-white/70 text-xs uppercase tracking-widest">
          Fuentes activas
        </Text>
        <View className="gap-3 mt-3">
          {fuentes.map((f) => (
            <View key={f.codigo} className="flex-row items-center gap-3">
              <CircleDot
                size={14}
                color={f.disponible ? colors.accent.mint : colors.accent.coral}
              />
              <View className="flex-1">
                <Text className="text-white font-semibold">{f.nombre}</Text>
                <Text className="text-white/60 text-xs">
                  {f.disponible ? `Calidad ${f.calidad}%` : "Sin datos disponibles"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      <Card glass className="mt-4">
        <Text className="text-white/70 text-xs uppercase tracking-widest">
          Variables influyentes
        </Text>
        <View className="flex-row flex-wrap gap-2 mt-3">
          {(prediccion?.variablesRelevantes ?? []).map((v) => (
            <View key={v} className="bg-white/10 border border-white/20 rounded-full px-3 py-1">
              <Text className="text-white text-xs font-semibold">{v}</Text>
            </View>
          ))}
          {!prediccion ? (
            <Text className="text-white/50 text-xs">
              Se mostrarán cuando haya suficientes ventanas.
            </Text>
          ) : null}
        </View>
        <Text className="text-white/70 text-xs mt-3">
          Por ahora la predicción usa una heurística de frecuencia sobre ventanas
          temporales. El modelo Random Forest se publicará con el pipeline de datos.
          La importancia de una variable no implica causalidad.
        </Text>
      </Card>
    </Screen>
  );
}
