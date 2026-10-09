import { Pressable, Text, View } from "react-native";

/** Opciones mutuamente excluyentes dentro de un único control, como en iOS. */
export function SegmentedControl<T extends string | number>({ value, options, onChange, label, disabled = false }: {
  value: T; options: readonly { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (value: T) => void; label: string; disabled?: boolean;
}) {
  return <View accessibilityLabel={label} className="flex-row p-1 rounded-2xl bg-white/5 border border-white/5 gap-1">
    {options.map(option => <Pressable key={option.value} accessibilityRole="button"
      accessibilityLabel={option.label} accessibilityState={{ selected: option.value === value, disabled }}
      disabled={disabled} onPress={() => onChange(option.value)}
      className={`flex-1 flex-row items-center justify-center gap-1 px-2 py-2 rounded-xl ${option.value === value ? "bg-white/15" : "active:bg-white/5"}`}
      style={{ minHeight: 44 }}>
      <Text numberOfLines={1} className={`text-sm font-semibold shrink ${option.value === value ? "text-white" : "text-ink-300"}`}>{option.label}</Text>
      {option.icon}
    </Pressable>)}
  </View>;
}
