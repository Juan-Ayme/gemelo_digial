import { Text, View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";

import { colors } from "@theme/colors";

type Props = {
  probabilidad: number;
  size?: number;
  strokeWidth?: number;
};

/**
 * Anillo de confianza con degradado cian→violeta y glow. Fondo translúcido para
 * integrarse en el vidrio de la tarjeta.
 */
export function ConfianzaRing({ probabilidad, size = 108, strokeWidth = 9 }: Props) {
  const clamped = Math.max(0, Math.min(1, probabilidad));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);
  const label = `${Math.round(clamped * 100)}%`;

  return (
    <View
      style={{
        width: size,
        height: size,
        shadowColor: colors.brandCyan,
        shadowOpacity: 0.6,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 0 },
      }}
      className="items-center justify-center"
    >
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.brandCyan} />
            <Stop offset="1" stopColor={colors.violet} />
          </LinearGradient>
        </Defs>
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
          stroke="url(#ringGrad)"
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
        <Text className="text-2xl font-bold text-white">{label}</Text>
        <Text className="text-[10px] font-medium uppercase tracking-widest text-ink-300">
          confianza
        </Text>
      </View>
    </View>
  );
}
