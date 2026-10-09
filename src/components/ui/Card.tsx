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
 * La vista animada es también el contenedor de layout. Una envoltura adicional
 * dejaría flex-1 en el hijo y colapsaría su altura dentro de las filas de métricas.
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

  const cardClassName = cn("rounded-3xl p-5", base, className);
  if (!animated) {
    return <View className={cardClassName} {...rest}>{children}</View>;
  }

  return (
    <MotiView
      className={cardClassName}
      {...rest}
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 280, delay }}
    >
      {children}
    </MotiView>
  );
}
