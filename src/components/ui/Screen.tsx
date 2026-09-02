import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, View, type ScrollViewProps, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cn } from "@lib/cn";
import { gradients } from "@theme/colors";

type Props = ViewProps & {
  scroll?: boolean;
  padded?: boolean;
  variant?: "plain" | "night" | "soft";
  scrollProps?: ScrollViewProps;
  edges?: readonly ("top" | "bottom" | "left" | "right")[];
};

const backgroundClass = {
  plain: "bg-ink-50 dark:bg-ink-950",
  night: "bg-brand-950",
  soft: "bg-brand-50 dark:bg-ink-950",
};

export function Screen({
  children,
  className,
  scroll = false,
  padded = true,
  variant = "plain",
  scrollProps,
  edges = ["top", "left", "right"],
  ...rest
}: Props) {
  const paddingClass = padded ? "px-5 pt-4 pb-8" : "";
  const useGradient = variant === "night";

  const inner = (
    <View className={cn("flex-1", paddingClass, className)} {...rest}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className={cn("flex-1", backgroundClass[variant])} edges={edges}>
      <StatusBar style={variant === "night" ? "light" : "auto"} />
      {useGradient && (
        <LinearGradient
          colors={gradients.night}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
      )}
      {scroll ? (
        <ScrollView
          contentContainerClassName={cn(paddingClass)}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          <View className={cn(className)} {...rest}>
            {children}
          </View>
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}
