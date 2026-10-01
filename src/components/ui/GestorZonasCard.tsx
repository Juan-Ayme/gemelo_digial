import { useState } from "react";
import { Pressable, Text, TextInput as RNTextInput, View } from "react-native";
import { MotiView } from "moti";
import { Check, Edit3, MapPin, Plus, Sparkles } from "lucide-react-native";

import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { useAliasZonas, useGuardarAliasZona } from "@hooks/useZonas";
import { colors } from "@theme/colors";

const SUGERENCIAS = ["Mi Casa", "Campus Universitario", "Oficina / Trabajo", "Gimnasio", "Biblioteca"];

type Props = {
  zonasDetectadas?: string[];
  delay?: number;
};

export function GestorZonasCard({ zonasDetectadas = [], delay = 150 }: Props) {
  const { data: aliasMap = {} } = useAliasZonas();
  const guardar = useGuardarAliasZona();

  // Zonas únicas detectadas sin "—"
  const codigos = Array.from(new Set(zonasDetectadas.filter((z) => z && z !== "—")));

  const [editandoZona, setEditandoZona] = useState<string | null>(null);
  const [textoAlias, setTextoAlias] = useState("");

  const iniciarEdicion = (zona: string) => {
    setEditandoZona(zona);
    setTextoAlias(aliasMap[zona] ?? "");
  };

  const guardarEdicion = (zona: string, nuevoAlias: string) => {
    guardar.mutate({ codigoZona: zona, alias: nuevoAlias });
    setEditandoZona(null);
    setTextoAlias("");
  };

  return (
    <Card className="mt-4" delay={delay}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5">
          <View className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
            <MapPin size={16} color={colors.accent.mint} />
          </View>
          <View>
            <Text className="text-lg font-semibold text-white">Zonas contextuales</Text>
            <Text className="text-xs text-ink-300">
              Etiqueta tus lugares habituales para mejorar la precisión
            </Text>
          </View>
        </View>
        <Chip label="Privado" tone="mint" />
      </View>

      <Text className="text-xs text-ink-400 mt-2.5 leading-5">
        Por privacidad, el GPS solo almacena celdas aproximadas (~1 km). Aquí puedes darles un nombre amigable que el Random Forest usará para predecir mejor.
      </Text>

      <View className="mt-3.5 gap-2.5">
        {codigos.length === 0 ? (
          <View className="rounded-xl bg-white/5 border border-white/5 p-3 items-center">
            <Text className="text-xs text-ink-400 text-center">
              Aún no se han detectado zonas hoy. Sincroniza sensores en la pestaña "Hoy".
            </Text>
          </View>
        ) : (
          codigos.map((zona) => {
            const alias = aliasMap[zona];
            const esEditando = editandoZona === zona;

            return (
              <View
                key={zona}
                className="rounded-xl bg-white/5 border border-white/10 p-3"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2 flex-1">
                    <MapPin size={14} color={alias ? colors.accent.mint : colors.brandCyan} />
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-white">
                        {alias ? alias : "Zona sin etiquetar"}
                      </Text>
                      <Text className="text-[11px] text-ink-400 font-mono">
                        {zona}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => (esEditando ? setEditandoZona(null) : iniciarEdicion(zona))}
                    hitSlop={8}
                    className="p-1.5 rounded-lg bg-white/10 flex-row items-center gap-1"
                  >
                    <Edit3 size={12} color={colors.brandCyan} />
                    <Text className="text-xs text-brand-300 font-medium">
                      {alias ? "Cambiar" : "Etiquetar"}
                    </Text>
                  </Pressable>
                </View>

                {esEditando ? (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ type: "timing", duration: 200 }}
                    className="mt-3 pt-3 border-t border-white/10"
                  >
                    <View className="flex-row gap-2">
                      <RNTextInput
                        value={textoAlias}
                        onChangeText={setTextoAlias}
                        placeholder="Ej. Mi Casa, Campus, etc."
                        placeholderTextColor={colors.inkPlaceholder}
                        className="flex-1 bg-surface-900 border border-brand-400/40 rounded-xl px-3 py-2 text-white text-xs"
                      />
                      <Pressable
                        onPress={() => guardarEdicion(zona, textoAlias)}
                        disabled={guardar.isPending}
                        className="bg-brand-500 rounded-xl px-3 py-2 flex-row items-center justify-center gap-1 active:bg-brand-600"
                      >
                        <Check size={14} color="#0e1224" />
                        <Text className="text-xs font-bold text-surface-950">Guardar</Text>
                      </Pressable>
                    </View>

                    {/* Sugerencias rápidas */}
                    <View className="flex-row flex-wrap gap-1.5 mt-2">
                      {SUGERENCIAS.map((sug) => (
                        <Pressable
                          key={sug}
                          onPress={() => guardarEdicion(zona, sug)}
                          className="bg-white/5 border border-white/10 rounded-md px-2 py-1"
                        >
                          <Text className="text-[10px] text-brand-200">{sug}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </MotiView>
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </Card>
  );
}
