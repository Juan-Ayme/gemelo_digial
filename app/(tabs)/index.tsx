import { Alert, Text, View } from "react-native";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ActivitySquare,
  Compass,
  Footprints,
  MoonStar,
  Sparkles,
  Timer,
} from "lucide-react-native";

import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { Button } from "@components/ui/Button";
import { AnimatedNumber } from "@components/ui/AnimatedNumber";
import { ConfianzaRing } from "@components/gemelo/ConfianzaRing";
import { useProfile } from "@hooks/useProfile";
import { useConsents } from "@hooks/useConsents";
import { useGemelo, useSimularCaptura, useCapturarSensores } from "@hooks/useGemelo";
import { ACTIVIDAD_LABELS } from "@services/types";
import { colors } from "@theme/colors";

export default function Hoy() {
  const { data: profile } = useProfile();
  const { data: gemelo } = useGemelo();
  const { data: consents } = useConsents();
  const simular = useSimularCaptura();
  const capturar = useCapturarSensores();

  const alias = profile?.alias ?? "Estudiante";
  const hoy = format(new Date(), "EEEE d 'de' MMMM", { locale: es });
  const prediccion = gemelo?.prediccion ?? null;
  const sinDatos = (gemelo?.totalEventos ?? 0) === 0;
  const algunConsent = consents ? Object.values(consents).some(Boolean) : false;

  return (
    <Screen scroll>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xs uppercase tracking-[3px]" style={{ color: colors.brandCyan }}>
            {hoy}
          </Text>
          <Text className="text-3xl font-bold text-white mt-1">Hola, {alias}</Text>
        </View>
        <Chip
          label="Gemelo activo"
          tone="mint"
          leadingIcon={<Sparkles size={12} color={colors.accent.mint} />}
        />
      </View>

      {prediccion ? (
        <Card hero className="mt-6" delay={80}>
          <View className="flex-row items-center gap-4">
            <ConfianzaRing probabilidad={prediccion.probabilidad} />
            <View className="flex-1">
              <Text className="text-[11px] uppercase tracking-widest text-ink-300">
                Próxima actividad probable
              </Text>
              <Text className="text-2xl font-bold text-white mt-1">
                {ACTIVIDAD_LABELS[prediccion.actividad] ?? prediccion.actividad}
              </Text>
              <Text className="text-sm text-ink-300 mt-1">
                Horizonte {prediccion.horizonteMin} min · {prediccion.variablesRelevantes.length} variables
              </Text>
            </View>
          </View>
          <View className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-3">
            <Text className="text-sm text-ink-100 leading-5">{prediccion.explicacion}</Text>
          </View>
        </Card>
      ) : (
        <Card hero className="mt-6" delay={80}>
          <Text className="text-lg font-semibold text-white">Tu gemelo está despertando</Text>
          <Text className="text-sm text-ink-300 mt-1 leading-5">
            Registra un par de ventanas de actividad y empezaré a anticipar tu próxima
            actividad.
          </Text>
        </Card>
      )}

      <View className="mt-4 flex-row gap-3">
        <StatTile icon={<Footprints size={18} color={colors.brandCyan} />} label="Pasos" value={gemelo?.pasosHoy ?? 0} delay={140} />
        <StatTile icon={<Timer size={18} color={colors.accent.amber} />} label="Min. activos" value={gemelo?.minutosActivos ?? 0} delay={180} />
      </View>
      <View className="mt-3 flex-row gap-3">
        <StatTile icon={<MoonStar size={18} color={colors.accent.violet} />} label="Descanso" value={`${Math.round((gemelo?.minutosDescanso ?? 0) / 60)} h`} delay={220} />
        <StatTile icon={<Compass size={18} color={colors.accent.mint} />} label="Zona" value={gemelo?.zonaActual ?? "—"} delay={260} />
      </View>

      <Card className="mt-6" delay={320}>
        <View className="flex-row items-center gap-3">
          <ActivitySquare size={20} color={colors.brandCyan} />
          <Text className="text-lg font-semibold text-white">Sensores del teléfono</Text>
        </View>
        <Text className="text-sm text-ink-300 mt-2 leading-5">
          Lee tu actividad (movimiento), zona general y pasos según los permisos que hayas
          activado en Perfil. Sueño y wearables requieren un development build (Health Connect).
        </Text>
        <Button
          className="mt-4"
          size="sm"
          label="Conectar y capturar sensores"
          loading={capturar.isPending}
          onPress={() => {
            if (!algunConsent) {
              Alert.alert(
                "Sin permisos",
                "Activa al menos un consentimiento en Perfil (actividad, pasos o zona) para leer tus sensores.",
              );
              return;
            }
            capturar.mutate(consents!);
          }}
        />
        {capturar.isError ? (
          <Text className="text-xs text-error mt-2">
            {(capturar.error as Error)?.message === "sin-sensores"
              ? "No hay sensores disponibles o autorizados. Revisa los permisos del sistema y tus consentimientos."
              : "No se pudo guardar la captura. Revisa tu conexión o el esquema de Supabase."}
          </Text>
        ) : null}
        <Button
          className="mt-2"
          size="sm"
          variant="ghost"
          label={sinDatos ? "Generar dato de prueba (demo)" : "Añadir dato demo"}
          loading={simular.isPending}
          onPress={() => simular.mutate()}
        />
      </Card>
    </Screen>
  );
}

function StatTile({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  delay?: number;
}) {
  return (
    <Card className="flex-1" delay={delay}>
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-[11px] uppercase tracking-widest text-ink-300">{label}</Text>
      </View>
      {typeof value === "number" ? (
        <AnimatedNumber
          value={value}
          format={(n) => n.toLocaleString("es-PE")}
          className="text-2xl font-bold text-white mt-2"
        />
      ) : (
        <Text className="text-2xl font-bold text-white mt-2">{value}</Text>
      )}
    </Card>
  );
}
