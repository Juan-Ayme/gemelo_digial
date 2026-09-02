import { View, type ViewProps } from "react-native";
import { MotiView } from "moti";

import { cn } from "@lib/cn";

type Props = ViewProps & {
  animated?: boolean;
  delay?: number;
  glass?: boolean;
};

export function Card({
  children,
  className,
  animated = true,
  delay = 0,
  glass = false,
  ...rest
}: Props) {
  const base = glass
    ? "bg-white/10 border border-white/20 backdrop-blur-lg"
    : "bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800";

  const content = (
    <View className={cn("rounded-3xl p-5", base, className)} {...rest}>
      {children}
    </View>
  );

  if (!animated) return content;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 380, delay }}
    >
      {content}
    </MotiView>
  );
}
