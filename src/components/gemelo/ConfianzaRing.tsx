import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { colors } from "@theme/colors";

type Props = {
  probabilidad: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
};

export function ConfianzaRing({
  probabilidad,
  size = 96,
  strokeWidth = 8,
  color = colors.brand,
}: Props) {
  const clamped = Math.max(0, Math.min(1, probabilidad));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  const label = `${Math.round(clamped * 100)}%`;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.ringTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View className="absolute items-center">
        <Text className="text-2xl font-bold text-ink-900 dark:text-ink-50">{label}</Text>
        <Text className="text-[10px] font-medium uppercase tracking-widest text-ink-500 dark:text-ink-300">
          confianza
        </Text>
      </View>
    </View>
  );
}
