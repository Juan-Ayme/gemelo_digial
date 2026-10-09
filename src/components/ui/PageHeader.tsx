import { Text, View } from "react-native";

/** Encabezado uniforme: título grande, descripción y una acción secundaria. */
export function PageHeader({ title, subtitle, accessory }: {
  title: string; subtitle?: string; accessory?: React.ReactNode;
}) {
  return <View className="flex-row items-start gap-3 mb-1">
    <View className="flex-1">
      <Text accessibilityRole="header" className="text-white font-bold" style={{ fontSize: 34, letterSpacing: -0.8 }}>{title}</Text>
      {subtitle && <Text className="text-ink-300 text-sm mt-2 leading-5">{subtitle}</Text>}
    </View>
    {accessory && <View className="pt-2 shrink-0">{accessory}</View>}
  </View>;
}
