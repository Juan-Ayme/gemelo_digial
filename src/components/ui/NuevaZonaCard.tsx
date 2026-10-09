import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import {
  Briefcase,
  Check,
  ChevronRight,
  Coffee,
  Dumbbell,
  Edit3,
  GraduationCap,
  Home,
  MapPin,
  Sparkles,
  X,
} from "lucide-react-native";
import { Card } from "@components/ui/Card";
import { useGuardarAliasZona } from "@hooks/useZonas";
import { colors } from "@theme/colors";

const SUGERENCIAS = [
  { label: "Casa", icon: Home },
  { label: "Trabajo", icon: Briefcase },
  { label: "Estudio", icon: GraduationCap },
  { label: "Gimnasio", icon: Dumbbell },
  { label: "Cafetería", icon: Coffee },
];

type Props = {
  codigoZona: string;
  onDescartar?: () => void;
};

export function NuevaZonaCard({ codigoZona, onDescartar }: Props) {
  const guardar = useGuardarAliasZona();
  const [personalizado, setPersonalizado] = useState(false);
  const [textoCustom, setTextoCustom] = useState("");
  const [guardadoConExito, setGuardadoConExito] = useState<string | null>(null);

  const handleSeleccionar = (alias: string) => {
    guardar.mutate(
      { codigoZona, alias },
      {
        onSuccess: () => {
          setGuardadoConExito(alias);
          setTimeout(() => {
            onDescartar?.();
          }, 1400);
        },
      },
    );
  };

  const handleGuardarCustom = () => {
    if (!textoCustom.trim()) return;
    handleSeleccionar(textoCustom.trim());
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: -8, scale: 0.98 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      exit={{ opacity: 0, translateY: -8 }}
      transition={{ type: "timing", duration: 300 }}
    >
      <Card className="mt-3 border-emerald-500/30 bg-emerald-950/20">
        <AnimatePresence>
          {guardadoConExito ? (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-3 items-center justify-center gap-1.5"
            >
              <View className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/40 items-center justify-center">
                <Check size={18} color={colors.accent.mint} />
              </View>
              <Text className="text-white font-bold text-sm">
                ¡Zona identificada como {guardadoConExito}!
              </Text>
              <Text className="text-ink-400 text-xs text-center">
                Tu Gemelo Digital aprenderá a reconocerla en tu rutina cotidiana.
              </Text>
            </MotiView>
          ) : (
            <View>
              {/* Cabecera de la tarjeta contextual */}
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                  <View className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 items-center justify-center">
                    <MapPin size={16} color={colors.accent.mint} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-white font-bold text-sm">
                        Nueva zona detectada
                      </Text>
                      <View className="bg-emerald-500/20 border border-emerald-400/30 px-1.5 py-0.5 rounded-md">
                        <Text className="text-[10px] font-mono text-emerald-300">
                          {codigoZona}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs text-ink-300 mt-0.5 leading-4">
                      ¿Qué lugar es este? Ayuda a tu Gemelo a predecir mejor tu rutina.
                    </Text>
                  </View>
                </View>

                {onDescartar && (
                  <Pressable
                    onPress={onDescartar}
                    hitSlop={8}
                    className="w-6 h-6 rounded-full bg-white/5 items-center justify-center active:opacity-60"
                  >
                    <X size={13} color="#94a3b8" />
                  </Pressable>
                )}
              </View>

              {/* Sugerencias de 1 toque */}
              {!personalizado ? (
                <View className="mt-3.5">
                  <View className="flex-row flex-wrap gap-1.5">
                    {SUGERENCIAS.map((sug) => {
                      const SIcon = sug.icon;
                      return (
                        <Pressable
                          key={sug.label}
                          onPress={() => handleSeleccionar(sug.label)}
                          disabled={guardar.isPending}
                          className="flex-row items-center gap-1.5 bg-white/8 hover:bg-white/15 border border-white/12 px-3 py-1.5 rounded-full active:opacity-75"
                        >
                          <SIcon size={12} color={colors.brandCyan} />
                          <Text className="text-xs text-white/90 font-medium">
                            {sug.label}
                          </Text>
                        </Pressable>
                      );
                    })}

                    <Pressable
                      onPress={() => setPersonalizado(true)}
                      className="flex-row items-center gap-1 bg-brand-500/15 border border-brand-400/30 px-3 py-1.5 rounded-full active:opacity-75"
                    >
                      <Edit3 size={11} color={colors.brandCyan} />
                      <Text className="text-xs text-brand-300 font-medium">
                        Otro nombre…
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                /* Entrada personalizada */
                <View className="mt-3.5 gap-2">
                  <View className="flex-row items-center gap-2">
                    <TextInput
                      value={textoCustom}
                      onChangeText={setTextoCustom}
                      placeholder="Ej. Casa de mis padres, Estudio..."
                      placeholderTextColor="#64748b"
                      autoFocus
                      className="flex-1 bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs text-white"
                      onSubmitEditing={handleGuardarCustom}
                    />
                    <Pressable
                      onPress={handleGuardarCustom}
                      disabled={!textoCustom.trim() || guardar.isPending}
                      className="bg-brand-500 px-3.5 py-2.5 rounded-xl flex-row items-center gap-1 active:opacity-80 disabled:opacity-40"
                    >
                      <Check size={14} color="#022c22" />
                      <Text className="text-xs font-bold text-ink-950">
                        Guardar
                      </Text>
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={() => setPersonalizado(false)}
                    className="self-start py-0.5"
                  >
                    <Text className="text-[11px] text-ink-400">
                      ← Volver a sugerencias rápidas
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </AnimatePresence>
      </Card>
    </MotiView>
  );
}
