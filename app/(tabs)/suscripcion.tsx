import { Alert, Linking, Pressable, Text, View } from "react-native";
import { MotiView } from "moti";
import {
  Check,
  ChevronRight,
  Coins,
  Crown,
  Database,
  FlaskConical,
  Sparkles,
  Star,
  Zap,
} from "lucide-react-native";

import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Chip } from "@components/ui/Chip";
import { useSuscripcion, useActivarPro, useEsPro } from "@hooks/useSuscripcion";
import { PLANES } from "@services/suscripcion";
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

  const handleActivarPro = () => {
    Alert.alert(
      "Activar ando Pro",
      "En la versión de producción, esto abrirá el flujo de pago con la tienda de apps (App Store / Play Store). Por ahora se activa directamente para pruebas.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Activar Pro (prueba)",
          onPress: () =>
            activarPro.mutate(undefined, {
              onSuccess: () => Alert.alert("¡Bienvenido a ando Pro!", "Tu plan Pro está activo."),
            }),
        },
      ],
    );
  };

  return (
    <Screen scroll>
      <View className="gap-1">
        <Text className="text-3xl font-bold text-white">Plan y Suscripción</Text>
        <Text className="text-base text-ink-300">
          Elige el plan que mejor se adapta a ti.
        </Text>
      </View>

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
            <Text className="text-white font-bold">ando Pro activo</Text>
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
              <Chip label="Recomendado" tone="mint" leadingIcon={<Star size={10} color={colors.accent.mint} />} />
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
                  label="Activar ando Pro"
                  loading={activarPro.isPending}
                  leadingIcon={<Zap size={18} color={colors.onPrimary} />}
                  onPress={handleActivarPro}
                />
              ) : (
                <View className="bg-accent-mint/10 rounded-xl p-3 items-center">
                  <Check size={20} color={colors.accent.mint} />
                  <Text className="text-accent-mint font-semibold mt-1">Plan activo</Text>
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
            Si eres participante del proyecto de investigación académica de la UNSCH, 
            recibes todos los beneficios Pro de forma gratuita más compensaciones por 
            tus datos aportados.
          </Text>
          {PLANES.investigador.beneficios.map((b) => (
            <FeatureRow key={b} texto={b} incluido={true} />
          ))}
          <View className="mt-3">
            <Button
              variant="secondary"
              label="Más información del estudio"
              leadingIcon={<ChevronRight size={18} color={colors.brand} />}
              onPress={() =>
                Alert.alert(
                  "Proyecto de Investigación",
                  "Contacta a tu investigador principal o escribe a: investigacion@ando.pe",
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
            ¿Deberían pagarte por tus datos? Sí. Cuando activas el consentimiento
            &quot;Investigación&quot;, tus datos anonimizados contribuyen a estudios académicos
            y modelos de IA. En la próxima versión, recibirás créditos canjeables por:
          </Text>
          {[
            "🎁 Meses de ando Pro gratis",
            "📚 Acceso a publicaciones del estudio",
            "☕ Canjes en comercios locales asociados",
          ].map((item) => (
            <Text key={item} className="text-ink-200 text-xs mt-2 ml-2">
              {item}
            </Text>
          ))}

          {sub && sub.datosAportados > 0 && (
            <View className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <Text className="text-amber-300 font-semibold text-sm">
                Has aportado {sub.datosAportados} evento{sub.datosAportados > 1 ? "s" : ""} a la investigación
              </Text>
              <Text className="text-amber-400/70 text-xs mt-0.5">
                {sub.creditos} créditos acumulados (en implementación)
              </Text>
            </View>
          )}
        </Card>
      </MotiView>
    </Screen>
  );
}
