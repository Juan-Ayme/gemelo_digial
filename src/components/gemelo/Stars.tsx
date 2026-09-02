import { useEffect, useMemo } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type StarSpec = {
  size: number;
  x: number; // 0..1 (porcentaje de ancho)
  y: number; // 0..1 (porcentaje de alto)
  delay: number;
  duration: number;
  color: string;
};

const PALETTE = ["#39E7FF", "#cfbdff"];

/**
 * Genera partículas pseudo-aleatorias pero deterministas para no re-crear el
 * layout en cada render. Cada partícula respira y flota suavemente.
 */
export function Stars({ count = 42 }: { count?: number }) {
  const stars = useMemo<StarSpec[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const seed = (i + 1) * 9301 + 49297;
      const r = (n: number) => ((Math.sin(n) + 1) / 2) % 1;
      return {
        size: 1 + r(seed) * 3,
        x: r(seed * 1.7),
        y: r(seed * 2.3),
        delay: r(seed * 3.1) * 4000,
        duration: 3000 + r(seed * 4.5) * 5000,
        color: PALETTE[i % PALETTE.length],
      };
    });
  }, [count]);

  return (
    <View pointerEvents="none" className="absolute inset-0">
      {stars.map((star, i) => (
        <Star key={i} spec={star} />
      ))}
    </View>
  );
}

function Star({ spec }: { spec: StarSpec }) {
  const opacity = useSharedValue(0.1);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(0.9, {
          duration: spec.duration / 2,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true,
      ),
    );
    scale.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(1.6, {
          duration: spec.duration / 2,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true,
      ),
    );
    translateY.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(-14, { duration: spec.duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
    translateX.value = withDelay(
      spec.delay,
      withRepeat(
        withTiming(8, { duration: spec.duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      ),
    );
  }, [opacity, scale, translateY, translateX, spec.delay, spec.duration]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: `${spec.x * 100}%`,
          top: `${spec.y * 100}%`,
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          backgroundColor: spec.color,
        },
        style,
      ]}
    />
  );
}
