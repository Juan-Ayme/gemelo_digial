import { useEffect } from "react";
import { View } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { cn } from "@lib/cn";

type Props = {
  size?: number;
  className?: string;
};

/**
 * Avatar del gemelo digital — silueta abstracta con efecto glassmórfico,
 * "cabeza" y "torso" difuminados que respiran, y punto focal cian.
 */
export function GemeloAvatar({ size = 200, className }: Props) {
  const breathe = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    glow.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [breathe, glow]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breathe.value * 0.05 }],
    shadowOpacity: 0.3 + glow.value * 0.4,
    shadowRadius: 30 + glow.value * 30,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + glow.value * 0.4,
    transform: [{ scale: 1 + glow.value * 0.35 }],
  }));

  const headSize = size * 0.5;
  const torsoWidth = size * 0.66;
  const torsoHeight = size * 0.42;
  const dotSize = size * 0.08;

  return (
    <View
      className={cn("items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1,
            borderColor: "rgba(59,73,76,0.4)",
            backgroundColor: "rgba(26,31,49,0.35)",
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#39E7FF",
            shadowOffset: { width: 0, height: 0 },
          },
          containerStyle,
        ]}
      >
        <BlurView
          intensity={30}
          tint="dark"
          style={{ ...StyleSheetAbsoluteFill }}
        />

        {/* Cabeza (círculo superior) */}
        <View
          style={{
            position: "absolute",
            top: size * 0.08,
            width: headSize,
            height: headSize,
            borderRadius: headSize / 2,
            backgroundColor: "rgba(57,231,255,0.20)",
          }}
        />

        {/* Torso (elipse inferior) */}
        <View
          style={{
            position: "absolute",
            bottom: size * 0.08,
            width: torsoWidth,
            height: torsoHeight,
            borderTopLeftRadius: torsoWidth,
            borderTopRightRadius: torsoWidth,
            borderBottomLeftRadius: torsoWidth / 2,
            borderBottomRightRadius: torsoWidth / 2,
            backgroundColor: "rgba(207,189,255,0.20)",
          }}
        />

        {/* Difuminados con blur para simular partículas ensambladas */}
        <View
          style={{
            position: "absolute",
            top: size * 0.1,
            width: headSize * 0.85,
            height: headSize * 0.85,
            borderRadius: headSize,
            backgroundColor: "rgba(57,231,255,0.35)",
            opacity: 0.6,
          }}
        />

        {/* Punto focal central */}
        <Animated.View
          style={[
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: "#1bdaf2",
              shadowColor: "#39E7FF",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 20,
              elevation: 12,
            },
            dotStyle,
          ]}
        />
      </Animated.View>
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  position: "absolute" as const,
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};
