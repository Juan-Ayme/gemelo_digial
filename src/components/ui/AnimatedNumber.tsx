import { useEffect, useRef, useState } from "react";
import { Text, type TextProps } from "react-native";

type Props = Omit<TextProps, "children"> & {
  value: number;
  /** Duración de la cuenta, en ms. */
  duration?: number;
  /** Formateo final (p. ej. separador de miles o sufijos). */
  format?: (n: number) => string;
};

/**
 * Número que "cobra vida": cuenta desde el valor anterior hasta el nuevo.
 * Pequeño detalle que hace que los datos se sientan vivos y no estáticos.
 */
export function AnimatedNumber({ value, duration = 900, format, ...props }: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    const inicio = Date.now();
    let raf = 0;

    const tick = () => {
      const t = Math.min(1, (Date.now() - inicio) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <Text {...props}>{format ? format(display) : String(display)}</Text>;
}
