import { Alert, Text, View } from "react-native";
import { MotiView } from "moti";
import {
  Check,
  ChevronRight,
  Coins,
  Crown,
  FlaskConical,
  Gift,
  BookOpen,
  Coffee,
  Star,
  Zap,
} from "lucide-react-native";

import { PageHeader } from "@components/ui/PageHeader";
import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Chip } from "@components/ui/Chip";
import { useSuscripcion, useActivarPro, useEsPro } from "@hooks/useSuscripcion";
import { PLANES } from "@services/suscripcion";
import { useAuthStore } from "@stores/authStore";
import { colors } from "@theme/colors";

function FeatureRow({ texto, incluido }: { texto: string; incluido: boolean }) {
  return (
    <View className="flex-row items-start gap-3 py-1.5">
      <View
        className={`w-5 h-5 rounded-full items-center justify-center mt-0.5 ${
          incluido ? "bg-accent-mint/20" : "bg-white/5"
        }`}
      >
        {incluido ? (
          <Check size={11} color={colors.accent.mint} />
        ) : (
          <Text className="text-ink-400 text-xs">—</Text>
        )}
      </View>
      <Text className={`flex-1 text-sm leading-5 ${incluido ? "text-white/90" : "text-ink-500 line-through"}`}>
        {texto}
      </Text>
    </View>
  );
}

export default function Suscripcion() {
  const { data: sub } = useSuscripcion();
  const activarPro = useActivarPro();
  const esPro = useEsPro();
  const demoMode = useAuthStore(state => state.demoMode);
  const permitePrueba = __DEV__ || demoMode;

  const handleActivarPro = () => {
    Alert.alert(
      "Probar ando Pro",
      "Activa una prueba local de siete días en este dispositivo. No se realiza ningún cobro; los pagos aún no están disponibles.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Iniciar prueba de 7 días",
          onPress: () =>
            activarPro.mutate(undefined, {
              onSuccess: () => Alert.alert("Prueba activada", "Puedes explorar el historial ampliado durante siete días."),
              onError: () => Alert.alert("No se pudo activar", "Intenta nuevamente."),
            }),
        },
      ],
    );
  };

  return (
    <Screen scroll>
      <PageHeader title="Planes" subtitle="Conoce las opciones de ando." />

      {/* Estado actual */}
      {esPro && (
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" }}
          className="mt-4 bg-accent-mint/10 border border-accent-mint/30 rounded-2xl p-4 flex-row items-center gap-3"
        >
          <Crown size={24} color={colors.accent.mint} />
          <View className="flex-1">
            <Text className="text-white font-bold">Prueba de ando Pro activa</Text>
            <Text className="text-accent-mint text-xs mt-0.5">
              {sub?.expiraEn
                ? `Válido hasta ${new Date(sub.expiraEn).toLocaleDateString("es-PE")}`
                : "Plan activo"}
            </Text>
          </View>
          <Chip label="PRO" tone="mint" />
        </MotiView>
      )}

      {/* ── Plan Free ── */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 80, type: "timing", duration: 360 }}
      >
        <Card className={`mt-5 ${!esPro ? "border border-brand-400/40" : ""}`}>
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-white font-bold text-lg">{PLANES.free.nombre}</Text>
              <Text className="text-2xl font-bold mt-0.5" style={{ color: colors.textMuted }}>
                {PLANES.free.precio}
              </Text>
            </View>
            {!esPro && <Chip label="Tu plan actual" tone="brand" />}
          </View>

          {PLANES.free.beneficios.map((b) => (
            <FeatureRow key={b} texto={b} incluido={true} />
          ))}
          {PLANES.free.limitaciones.map((b) => (
            <FeatureRow key={b} texto={b} incluido={false} />
          ))}
        </Card>
      </MotiView>

      {/* ── Plan Pro ── */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 160, type: "timing", duration: 360 }}
      >
        <View className="mt-4 rounded-2xl overflow-hidden border border-accent-mint/40">
          {/* Header degradado */}
          <View className="bg-gradient-to-r from-emerald-900/60 to-teal-900/60 p-4 border-b border-accent-mint/20">
            <View className="flex-row items-center justify-between">
              <View>
                <View className="flex-row items-center gap-2">
                  <Crown size={18} color={colors.accent.mint} />
                  <Text className="text-white font-bold text-lg">{PLANES.pro.nombre}</Text>
                </View>
                <Text className="text-2xl font-bold text-white mt-1">{PLANES.pro.precio}</Text>
                <Text className="text-accent-mint text-xs mt-0.5">o {PLANES.pro.precioAnual}</Text>
              </View>
              <Chip label="En prueba" tone="mint" leadingIcon={<Star size={10} color={colors.accent.mint} />} />
            </View>
          </View>

          <View className="bg-white/4 p-4">
            {PLANES.pro.beneficios.map((b) => (
              <FeatureRow key={b} texto={b} incluido={true} />
            ))}

            <View className="mt-4">
              {!esPro ? (
                <Button
                  variant="primary"
                  label={permitePrueba ? "Probar 7 días · sin cobro" : "Próximamente"}
                  disabled={!permitePrueba}
                  loading={activarPro.isPending}
                  leadingIcon={<Zap size={18} color={colors.onPrimary} />}
                  onPress={handleActivarPro}
                />
              ) : (
                <View className="bg-accent-mint/10 rounded-xl p-3 items-center">
                  <Check size={20} color={colors.accent.mint} />
                  <Text className="text-accent-mint font-semibold mt-1">Prueba activa</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </MotiView>

      {/* ── Plan Investigación ── */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 240, type: "timing", duration: 360 }}
      >
        <Card className="mt-4 border border-violet-500/30">
          <View className="flex-row items-center gap-2 mb-3">
            <FlaskConical size={18} color={colors.violet} />
            <Text className="text-white font-bold text-base">{PLANES.investigador.nombre}</Text>
          </View>
          <Text className="text-ink-300 text-sm mb-3 leading-5">
            Propuesta para quienes quieran probar funciones y compartir su experiencia.
            Las condiciones y los beneficios del programa todavía están por definir.
          </Text>
          {PLANES.investigador.beneficios.map((b) => (
            <FeatureRow key={b} texto={b} incluido={true} />
          ))}
          <View className="mt-3">
            <Button
              variant="secondary"
              label="Conocer la propuesta"
              leadingIcon={<ChevronRight size={18} color={colors.brand} />}
              onPress={() =>
                Alert.alert(
                  "Programa colaborador",
                  "La propuesta está en preparación. Compartir comentarios y autorizar datos para investigación serán decisiones independientes y opcionales.",
                )
              }
            />
          </View>
        </Card>
      </MotiView>

      {/* ── Data Rewards ── */}
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 320, type: "timing", duration: 360 }}
      >
        <Card glass className="mt-4 mb-2">
          <View className="flex-row items-center gap-2 mb-2">
            <Coins size={18} color={colors.accent.amber} />
            <Text className="text-white font-bold text-base">Data Rewards</Text>
            <Chip label="Próximamente" tone="neutral" />
          </View>
          <Text className="text-ink-300 text-sm leading-5">
            Estamos explorando beneficios para colaboradores. Aún no hay créditos ni
            canjes disponibles. Cualquier participación será opcional, con condiciones
            claras y un consentimiento separado. Algunas ideas por validar:
          </Text>
          {[
            { texto: "Periodos de acceso a ando Pro", icon: Gift },
            { texto: "Acceso a resultados del proyecto", icon: BookOpen },
            { texto: "Beneficios con aliados por confirmar", icon: Coffee },
          ].map(({ texto, icon: Icon }) => (
            <View key={texto} className="flex-row items-center gap-2 mt-2 ml-2">
              <Icon size={14} color={colors.accent.amber} />
              <Text className="text-ink-200 text-xs flex-1">{texto}</Text>
            </View>
          ))}

          {permitePrueba && sub && sub.datosAportados > 0 && (
            <View className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <Text className="text-amber-300 font-semibold text-sm">
                Contador de prueba: {sub.datosAportados} registros
              </Text>
              <Text className="text-amber-400/70 text-xs mt-0.5">
                {sub.creditos} créditos de demostración · sin valor de canje
              </Text>
            </View>
          )}
        </Card>
      </MotiView>
    </Screen>
  );
}
