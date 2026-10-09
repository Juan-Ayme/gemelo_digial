import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Activity,
  Bell,
  BarChart3,
  ChevronRight,
  Coins,
  Crown,
  Cpu,
  Database,
  Download,
  Footprints,
  HeartPulse,
  History,
  LogOut,
  MapPin,
  Moon,
  Shield,
  Target,
  Trash2,
  Trophy,
  Watch,
  Waves,
} from "lucide-react-native";
import { MotiView } from "moti";

import { PageHeader } from "@components/ui/PageHeader";
import { AvatarCabeza } from "@components/gemelo/AvatarCabeza";
import { usePreferencias } from "@hooks/usePreferencias";
import { PREFERENCIAS_DEFAULT } from "@services/preferencias";
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
import { useSuscripcion, useEsPro } from "@hooks/useSuscripcion";
import { config } from "@constants/config";
import { colors } from "@theme/colors";

function getConsentIcon(categoria: string) {
  switch (categoria) {
    case "actividad":    return Activity;
    case "pasos":        return Footprints;
    case "sueno":        return Moon;
    case "zona_general": return MapPin;
    case "wearable":     return Watch;
    case "fisiologia":   return HeartPulse;
    case "ambiente":     return Waves;
    case "notificaciones": return Bell;
    case "investigacion":
    default:             return Cpu;
  }
}

function NavRow({
  icon: Icon,
  label,
  sub,
  color,
  onPress,
  badge,
  delay,
  last = false,
}: {
  icon: any;
  label: string;
  sub?: string;
  color: string;
  onPress: () => void;
  badge?: string;
  delay?: number;
  last?: boolean;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -6 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ delay: delay ?? 0, type: "timing", duration: 280 }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button" accessibilityLabel={label}
        className="flex-row items-center gap-3 py-4 active:opacity-70"
        style={{ minHeight: 60 }}
      >
        <View
          className="w-9 h-9 rounded-lg items-center justify-center"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon size={18} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-white font-medium text-base">{label}</Text>
          {sub && <Text className="text-ink-400 text-xs mt-0.5">{sub}</Text>}
        </View>
        {badge && <Chip label={badge} tone="mint" />}
        <ChevronRight size={16} color={colors.textMuted} />
      </Pressable>
      {!last && <View className="h-px bg-white/10 ml-12" />}
    </MotiView>
  );
}

export default function Perfil() {
  const router = useRouter();
  const { data: consents } = useConsents();
  const setConsent = useSetConsent();
  const signOut = useAuthStore((s) => s.signOut);
  const { data: preferencias } = usePreferencias();
  const { data: profile } = useProfile();
  const { data: gemelo } = useGemelo();
  const { data: sub } = useSuscripcion();
  const esPro = useEsPro();
  const alias = profile?.alias ?? "Usuario";

  return (
    <Screen scroll>
      <PageHeader title="Perfil" subtitle="Tu espacio personal." />
      <Card className="mt-5" animated={false}>
        <Pressable accessibilityRole="button" accessibilityLabel="Ver y personalizar mi gemelo" onPress={() => router.push("/(tabs)/gemelo")} className="flex-row items-center gap-4">
          <View className="w-16 h-16 items-center justify-center rounded-2xl bg-white/5"><AvatarCabeza preferencias={preferencias ?? PREFERENCIAS_DEFAULT} size={48} /></View>
          <View className="flex-1"><Text className="text-white text-xl font-semibold">{alias}</Text><Text className="text-ink-300 text-sm mt-1">Mi gemelo y su apariencia</Text></View>
          <ChevronRight size={18} color={colors.textMuted} />
        </Pressable>
      </Card>

      {/* Plan actual */}
      {esPro ? (
        <MotiView
          from={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", delay: 50 }}
          className="mt-4 flex-row items-center gap-3 bg-accent-mint/10 border border-accent-mint/25 rounded-2xl p-3"
        >
          <Crown size={20} color={colors.accent.mint} />
          <Text className="text-accent-mint font-semibold text-sm flex-1">
            ando Pro de prueba
          </Text>
          <Chip label="PRO" tone="mint" />
        </MotiView>
      ) : (
        <Pressable
          onPress={() => router.push("/(tabs)/suscripcion" as any)}
          className="mt-4 flex-row items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 active:opacity-70"
        >
          <Crown size={20} color={colors.accent.amber} />
          <View className="flex-1">
            <Text className="text-white font-semibold text-sm">Conocer ando Pro</Text>
            <Text className="text-ink-400 text-xs">Conoce la propuesta del plan ampliado</Text>
          </View>
          <ChevronRight size={16} color={colors.textMuted} />
        </Pressable>
      )}

      {/* ── Secciones de la app ── */}
      <Card className="mt-5">
        <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold mb-2">
          Tu día
        </Text>
        <NavRow icon={Target} label="Mi pequeño cambio" sub="Una elección a tu ritmo" color={colors.accent.mint} onPress={() => router.push("/(tabs)/mi-cambio")} />
        <NavRow icon={Activity} label="Mi mañana" sub="Plan y recordatorios elegidos por ti" color={colors.brandCyan} onPress={() => router.push("/(tabs)/mi-manana")} />
        <NavRow icon={Target}     label="Mis Metas" sub="Pasos, actividad, sueño" color={colors.accent.mint}  onPress={() => router.push("/(tabs)/metas" as any)}       delay={80} />
        <NavRow last icon={Activity}   label="Rutina de hoy"  sub="Momentos que registraste hoy"  color={colors.violet}       onPress={() => router.push("/(tabs)/rutina" as any)}         delay={140} />
      </Card>
      <Card className="mt-4">
        <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold mb-2">Tu progreso</Text>
        <NavRow icon={History}    label="Historial" sub="Semana, 14 y 30 días"   color={colors.brandCyan}     onPress={() => router.push("/(tabs)/historial" as any)}   delay={60} />
        <NavRow icon={BarChart3}  label="Mi semana"  sub="Tendencias semanales"    color={colors.accent.amber} onPress={() => router.push("/(tabs)/insights" as any)}    delay={100} />
        <NavRow icon={Trophy}     label="Logros"    sub="Tus avances registrados"    color={colors.accent.coral} onPress={() => router.push("/(tabs)/logros" as any)}      delay={120} />
        <NavRow last icon={Bell}       label="Notificaciones" sub="Alertas y recordatorios"    color={colors.accent.coral} onPress={() => router.push("/(tabs)/notificaciones" as any)} delay={155} />
      </Card>

      {setConsent.isError && <Text className="text-error text-sm mt-3">No se pudo guardar el consentimiento. La captura de fondo se pausó por seguridad; intenta nuevamente.</Text>}
      {/* ── Plan y datos ── */}
      <Card className="mt-4">
        <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold mb-2">
          Plan y datos
        </Text>
        <NavRow icon={Crown}    label="Plan y Suscripción" sub={esPro ? "ando Pro de prueba" : "Plan gratuito"} color={colors.accent.amber} onPress={() => router.push("/(tabs)/suscripcion" as any)} delay={160} />
        <NavRow last={!(sub && sub.datosAportados > 0)} icon={Database} label="Mis Datos"          sub="Exportar y derechos ARCO"                   color={colors.violet}       onPress={() => router.push("/(tabs)/mis-datos" as any)}   delay={180} />
        {sub && sub.datosAportados > 0 && (
          <NavRow last icon={Coins} label="Data Rewards" sub={`${sub.datosAportados} eventos aportados`} color={colors.accent.amber} onPress={() => router.push("/(tabs)/suscripcion" as any)} delay={200} />
        )}
      </Card>

      {/* ── Permisos y privacidad ── */}
      <Card className="mt-4">
        <View className="flex-row items-center gap-3 mb-2">
          <Shield size={20} color={colors.brand} />
          <Text className="text-lg font-semibold text-white flex-1">
            Permisos y privacidad
          </Text>
        </View>
        <Text className="text-sm text-ink-300 mb-1">
          Elige qué datos quieres registrar. Puedes cambiar tus permisos cuando quieras.
        </Text>
        <Chip
          className="mb-3"
          label={`Documento ${config.app.consentVersion}`}
          tone="violet"
          leadingIcon={<Shield size={12} color={colors.violet} />}
        />
        <View>
          {CATALOGO_CONSENTIMIENTOS.map((item) => {
            const Icon = getConsentIcon(item.categoria);
            const isGranted = consents?.[item.categoria] ?? false;
            return (
              <View key={item.categoria} className="border-t border-white/10 py-3">
                <Switch
                  disabled={setConsent.isPending}
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

      {/* ── Gestor de Zonas ── */}
      <GestorZonasCard
        zonasDetectadas={[gemelo?.zonaActual].filter(Boolean) as string[]}
        delay={100}
      />

      {/* ── Cerrar sesión ── */}
      <Button
        className="mt-6"
        variant="ghost"
        label="Cerrar sesión"
        leadingIcon={<LogOut size={18} color={colors.brand} />}
        onPress={async () => {
          try { await signOut(); router.replace("/(auth)/welcome"); }
          catch { Alert.alert("No se pudo cerrar la sesión", "Comprueba la conexión y vuelve a intentarlo."); }
        }}
      />
    </Screen>
  );
}
