import { Text, View } from "react-native";

import { cn } from "@lib/cn";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE = {
  sm: 22,
  md: 32,
  lg: 44,
} as const;

export function Brand({ size = "md", className }: Props) {
  return (
    <View className={cn("flex-row items-center", className)}>
      <View
        style={{
          width: SIZE[size] * 0.55,
          height: SIZE[size] * 0.55,
          borderRadius: SIZE[size],
          marginRight: SIZE[size] * 0.28,
          backgroundColor: "#39E7FF",
          shadowColor: "#39E7FF",
          shadowOpacity: 0.7,
          shadowRadius: SIZE[size] * 0.45,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        }}
      />
      <Text
        className="text-on-background"
        style={{
          fontFamily: "SpaceGrotesk_700Bold",
          fontSize: SIZE[size],
          letterSpacing: -1,
        }}
      >
        ando
      </Text>
    </View>
  );
}
