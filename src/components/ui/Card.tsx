import { View, type ViewProps } from "react-native";
import { MotiView } from "moti";

import { cn } from "@lib/cn";

type Props = ViewProps & {
  animated?: boolean;
  delay?: number;
  /** Mantiene la API previa; todas las tarjetas ya son de vidrio. */
  glass?: boolean;
  /** Tarjeta destacada (héroe): vidrio más luminoso y borde con más presencia. */
  hero?: boolean;
};

/**
 * Tarjeta de vidrio esmerilado sobre el cielo del `Screen`. La transparencia
 * deja ver el degradado y las partículas: es lo que da sensación de profundidad.
 */
export function Card({
  children,
  className,
  animated = true,
  delay = 0,
  hero = false,
  glass: _glass,
  ...rest
}: Props) {
  const base = hero
    ? "bg-white/[0.10] border border-white/20"
    : "bg-white/[0.06] border border-white/10";

  const content = (
    <View className={cn("rounded-3xl p-5", base, className)} {...rest}>
      {children}
    </View>
  );

  if (!animated) return content;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14, scale: 0.98 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: "timing", duration: 420, delay }}
    >
      {content}
    </MotiView>
  );
}
