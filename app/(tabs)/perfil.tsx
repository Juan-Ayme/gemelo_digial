import { Alert, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Activity,
  Bell,
  Download,
  Footprints,
  GraduationCap,
  HeartPulse,
  LogOut,
  MapPin,
  Moon,
  Shield,
  Trash2,
  Watch,
  Waves,
} from "lucide-react-native";

import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Switch } from "@components/ui/Switch";
import { Chip } from "@components/ui/Chip";
import { GestorZonasCard } from "@components/ui/GestorZonasCard";
import { CATALOGO_CONSENTIMIENTOS } from "@schemas/consent";
import { useConsents, useSetConsent } from "@hooks/useConsents";
import { useProfile } from "@hooks/useProfile";
import { useGemelo } from "@hooks/useGemelo";
import { useAuthStore } from "@stores/authStore";
import { config } from "@constants/config";
import { colors } from "@theme/colors";

function getConsentIcon(categoria: string) {
  switch (categoria) {
    case "actividad":
      return Activity;
    case "pasos":
      return Footprints;
    case "sueno":
      return Moon;
    case "zona_general":
      return MapPin;
    case "wearable":
      return Watch;
    case "fisiologia":
      return HeartPulse;
    case "ambiente":
      return Waves;
    case "notificaciones":
      return Bell;
    case "investigacion":
    default:
      return GraduationCap;
  }
}

export default function Perfil() {
  const router = useRouter();
  const { data: consents } = useConsents();
  const setConsent = useSetConsent();
  const signOut = useAuthStore((s) => s.signOut);
  const { data: profile } = useProfile();
  const { data: gemelo } = useGemelo();
  const alias = profile?.alias ?? "Usuario";

  return (
    <Screen scroll>
      <View>
        <Text className="text-3xl font-bold text-white">Perfil</Text>
        <Text className="text-base text-ink-300 mt-1">
          {alias} · {config.app.institution}
        </Text>
      </View>

      <Card className="mt-6">
        <View className="flex-row items-center gap-3">
          <Shield size={20} color={colors.brand} />
          <Text className="text-lg font-semibold text-white">
            Consentimientos granulares
          </Text>
        </View>
        <Text className="text-sm text-ink-300 mt-1">
          Activa solo lo que quieras. Puedes revocar cuando desees.
        </Text>
        <Chip
          className="mt-3"
          label={`Documento ${config.app.consentVersion}`}
          tone="violet"
          leadingIcon={<Shield size={12} color={colors.violet} />}
        />
        <View className="mt-3">
          {CATALOGO_CONSENTIMIENTOS.map((item) => {
            const Icon = getConsentIcon(item.categoria);
            const isGranted = consents?.[item.categoria] ?? false;
            return (
              <View
                key={item.categoria}
                className="border-t border-white/10 py-3"
              >
                <Switch
                  value={isGranted}
                  onValueChange={(v) =>
                    setConsent.mutate({
                      categoria: item.categoria,
                      otorgado: v,
                      finalidad: item.finalidad,
                    })
                  }
                  icon={
                    <Icon
                      size={15}
                      color={isGranted ? colors.brandCyan : colors.textMuted}
                    />
                  }
                  label={item.titulo}
                  description={item.finalidad}
                />
                <Text className="text-xs text-ink-400 mt-1 ml-[60px]">
                  {item.ejemplo}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* ── Gestor de Zonas Contextuales ── */}
      <GestorZonasCard
        zonasDetectadas={[gemelo?.zonaActual].filter(Boolean) as string[]}
        delay={100}
      />

      <Card className="mt-4">
        <Text className="text-lg font-semibold text-white">
          Tus datos
        </Text>
        <Text className="text-sm text-ink-300 mt-1">
          Los derechos ARCO se atienden desde aquí.
        </Text>
        <View className="mt-3 gap-2">
          <Button
            variant="secondary"
            label="Exportar mis datos"
            leadingIcon={<Download size={18} color={colors.brand} />}
            onPress={() =>
              Alert.alert(
                "Exportar",
                "Se generará un archivo con tus consentimientos, eventos y predicciones.",
              )
            }
          />
          <Button
            variant="danger"
            label="Eliminar cuenta y datos"
            leadingIcon={<Trash2 size={18} color={colors.white} />}
            onPress={() =>
              Alert.alert(
                "Eliminar cuenta",
                "Esta acción eliminará eventos, características y predicciones vinculadas a tu cuenta.",
              )
            }
          />
        </View>
      </Card>

      <Button
        className="mt-6"
        variant="ghost"
        label="Cerrar sesión"
        leadingIcon={<LogOut size={18} color={colors.brand} />}
        onPress={async () => {
          await signOut();
          router.replace("/(auth)/welcome");
        }}
      />
    </Screen>
  );
}
