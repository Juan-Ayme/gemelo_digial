import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { Crown, Sparkles, Lock, ArrowRight, ShieldCheck } from "lucide-react-native";
import { useEsPro } from "@hooks/useSuscripcion";
import { colors } from "@theme/colors";

export type ProGateProps = {
  children?: React.ReactNode;
  titulo?: string;
  descripcion?: string;
  beneficios?: string[];
  mode?: "card" | "blur" | "banner";
  compact?: boolean;
};

/**
 * Insignia visual compacta para botones o etiquetas exclusivas Pro.
 */
export function ProBadge({ label = "PRO" }: { label?: string }) {
  return (
    <View className="flex-row items-center gap-1 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full">
      <Crown size={10} color="#fbbf24" />
      <Text className="text-[10px] font-bold text-amber-300 tracking-wider">
        {label}
      </Text>
    </View>
  );
}

/**
 * Componente contenedor que protege secciones y vistas exclusivas de ando Pro.
 * Si el usuario es Pro, renderiza children directamente.
 * Si no es Pro, presenta una barrera visual premium invitando a activar Pro o Data Rewards.
 */
export function ProGate({
  children,
  titulo = "Función ando Pro",
  descripcion = "Explora el historial ampliado en una prueba de ando Pro. El plan de pago aún está en validación.",
  beneficios,
  mode = "card",
  compact = false,
}: ProGateProps) {
  const esPro = useEsPro();
  const router = useRouter();

  if (esPro) {
    return <>{children}</>;
  }

  const handleIrASuscripcion = () => {
    router.push("/(tabs)/suscripcion" as any);
  };

  if (mode === "banner") {
    return (
      <View className="gap-3">
        {children}
        <MotiView
          from={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 300 }}
          className="rounded-2xl p-4 bg-gradient-to-r from-amber-500/10 to-brand-500/10 border border-amber-400/30 flex-row items-center justify-between gap-3"
        >
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Crown size={14} color="#fbbf24" />
              <Text className="text-amber-300 font-bold text-xs uppercase tracking-wider">
                Conoce la prueba
              </Text>
            </View>
            <Text className="text-white text-xs leading-4">{descripcion}</Text>
          </View>
          <Pressable
            onPress={handleIrASuscripcion}
            className="bg-amber-400 px-3.5 py-2 rounded-xl flex-row items-center gap-1 active:opacity-80"
          >
            <Text className="text-surface-900 font-bold text-xs">Ver Pro</Text>
            <ArrowRight size={12} color="#0e1224" />
          </Pressable>
        </MotiView>
      </View>
    );
  }

  return (
    <View className="relative overflow-hidden rounded-3xl my-2">
      {/* Contenido en fondo bloqueado / difuminado */}
      {children ? (
        <View pointerEvents="none" className="opacity-15 select-none" aria-hidden>
          {children}
        </View>
      ) : null}

      {/* Tarjeta de bloqueo superpuesta con diseño glassmorphism */}
      <View
        className={`${
          children ? "absolute inset-0" : ""
        } items-center justify-center p-5 bg-surface-800/90 border border-amber-400/30 rounded-3xl`}
      >
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 350 }}
          className="items-center text-center max-w-sm w-full"
        >
          {/* Badge superior */}
          <View className="flex-row items-center gap-1.5 bg-amber-500/20 border border-amber-400/40 px-3 py-1 rounded-full mb-3">
            <Crown size={14} color="#fbbf24" />
            <Text className="text-amber-300 font-bold text-xs uppercase tracking-widest">
              ando Pro · en prueba
            </Text>
          </View>

          <Text className="text-white font-bold text-lg text-center mb-1">
            {titulo}
          </Text>

          <Text className="text-ink-300 text-xs text-center leading-5 mb-4">
            {descripcion}
          </Text>

          {/* Beneficios opcionales */}
          {beneficios && beneficios.length > 0 && !compact ? (
            <View className="w-full gap-2 mb-4 bg-white/5 p-3 rounded-2xl border border-white/10">
              {beneficios.map((b, i) => (
                <View key={i} className="flex-row items-center gap-2">
                  <ShieldCheck size={14} color={colors.accent.mint} />
                  <Text className="text-white/80 text-xs">{b}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Botón de acción */}
          <Pressable
            onPress={handleIrASuscripcion}
            className="w-full py-3.5 px-6 rounded-2xl flex-row items-center justify-center gap-2 active:opacity-85 shadow-lg shadow-amber-500/20"
            style={{ backgroundColor: "#fbbf24" }}
          >
            <Sparkles size={16} color="#022c22" />
            <Text className="text-ink-950 font-bold text-sm">
              Actualizar a ando Pro
            </Text>
            <ArrowRight size={14} color="#022c22" />
          </Pressable>

          {/* Nota alternativa: Data Rewards */}
          <Text className="text-[11px] text-ink-400 text-center mt-3">
            O activa <Text className="text-brand-300 font-semibold">Data Rewards</Text> aportando datos anónimos para la mejora del modelo.
          </Text>
        </MotiView>
      </View>
    </View>
  );
}
