import { Pressable, Text, View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { AvatarCabeza } from "@components/gemelo/AvatarCabeza";
import { usePreferencias, useSavePreferencias } from "@hooks/usePreferencias";
import type { AspectoGemelo, Preferencias } from "@services/preferencias";
import { colors } from "@theme/colors";

const APARIENCIAS: { value: AspectoGemelo; label: string }[] = [
  { value: "neutral", label: "Original" }, { value: "mujer", label: "Mujer" },
  { value: "varon", label: "Varón" }, { value: "mascota", label: "Mascota" },
];

export function PersonalizarGemelo() {
  const { data, isLoading, error } = usePreferencias();
  const guardar = useSavePreferencias();
  if (!data) return <Text className="text-ink-300">{isLoading ? "Cargando tu apariencia…" : error ? "No pudimos leer tu elección. Cierra el panel e intenta nuevamente." : "Elige tu apariencia al iniciar sesión."}</Text>;
  function swatches<K extends "piel" | "color">(key: K, items: { value: Preferencias[K]; label: string; color: string }[]) {
    return <View className="flex-row gap-2 mt-3">{items.map(item => <Pressable key={item.value} accessibilityRole="button"
      accessibilityLabel={item.label} accessibilityState={{ selected: data![key] === item.value, disabled: guardar.isPending }}
      disabled={guardar.isPending} onPress={() => guardar.mutate({ [key]: item.value })}
      className={`flex-1 rounded-2xl px-2 py-3 items-center border ${data![key] === item.value ? "border-brand-400 bg-brand-500/10" : "border-white/10 bg-white/5"}`}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: item.color, borderWidth: 2, borderColor: data![key] === item.value ? colors.white : colors.ringTrack }} />
      <Text className="text-white text-xs mt-2">{item.label}</Text>
    </Pressable>)}</View>;
  }
  return <View>
    <Text className="text-ink-300 text-sm leading-5">Elige quién te acompaña. La apariencia no cambia tus registros.</Text>
    <Text className="text-white font-semibold mt-5 mb-3">Tu personaje</Text>
    <View className="gap-3">{[APARIENCIAS.slice(0, 2), APARIENCIAS.slice(2)].map((row, index) => <View key={index} className="flex-row gap-3">
      {row.map(option => <Pressable key={option.value} accessibilityRole="button" accessibilityLabel={option.label}
        accessibilityState={{ selected: data.aspecto === option.value, disabled: guardar.isPending }} disabled={guardar.isPending}
        onPress={() => guardar.mutate({ aspecto: option.value })}
        className={`flex-1 rounded-2xl border p-3 items-center ${data.aspecto === option.value ? "border-brand-400 bg-brand-500/10" : "border-white/10 bg-white/5"}`}>
        <AvatarCabeza preferencias={{ ...data, aspecto: option.value }} size={56} />
        <View className="flex-row items-center gap-2 mt-1"><Text className="text-white text-sm font-semibold">{option.label}</Text>
          {data.aspecto === option.value && <CheckCircle2 size={15} color={colors.brandCyan} />}</View>
      </Pressable>)}
    </View>)}</View>
    {(data.aspecto === "mujer" || data.aspecto === "varon") && <>
      <Text className="text-white font-semibold mt-5">Tono de piel</Text>
      {swatches("piel", [
        { value: "clara", label: "Claro", color: colors.avatar.piel.clara },
        { value: "media", label: "Medio", color: colors.avatar.piel.media },
        { value: "oscura", label: "Oscuro", color: colors.avatar.piel.oscura },
      ])}
    </>}
    <Text className="text-white font-semibold mt-5">Color favorito</Text>
    {swatches("color", [
      { value: "menta", label: "Menta", color: colors.avatar.ropa.menta },
      { value: "violeta", label: "Violeta", color: colors.avatar.ropa.violeta },
      { value: "azul", label: "Azul", color: colors.avatar.ropa.azul },
    ])}
    <Text accessibilityLiveRegion="polite" className="text-ink-400 text-xs mt-5 leading-5">{guardar.isPending ? "Guardando tu elección…" : "Los cambios se guardan automáticamente en este dispositivo. Puedes cambiar de personaje cuando quieras."}</Text>
    {guardar.isError && <Text className="text-error text-sm mt-3">No se pudo guardar. Vuelve a elegir la opción para reintentar.</Text>}
  </View>;
}
