import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, View, type ScrollViewProps, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cn } from "@lib/cn";
import { Stars } from "@components/gemelo/Stars";
import { cosmic } from "@theme/colors";

type Props = ViewProps & {
  scroll?: boolean;
  padded?: boolean;
  /** Partículas de fondo. `false` las desactiva. */
  stars?: number | false;
  scrollProps?: ScrollViewProps;
  edges?: readonly ("top" | "bottom" | "left" | "right")[];
  /** Deja hueco para la barra de pestañas flotante. */
  tabBarSpace?: boolean;
};

/**
 * Lienzo inmersivo de la app: cielo profundo con degradado + partículas vivas.
 * Todas las pantallas comparten este fondo para que la experiencia se sienta
 * continua (nada de saltos entre pantallas claras y oscuras).
 */
export function Screen({
  children,
  className,
  scroll = false,
  padded = true,
  stars = 26,
  scrollProps,
  edges = ["top", "left", "right"],
  tabBarSpace = true,
  ...rest
}: Props) {
  const padding = padded ? "px-5 pt-4" : "";
  const bottom = tabBarSpace ? "pb-36" : "pb-10";

  return (
    <View className="flex-1" style={{ backgroundColor: cosmic.bg[0] }}>
      <StatusBar style="light" />
      <LinearGradient
        colors={cosmic.bg}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        className="absolute inset-0"
      />
      {stars === false ? null : <Stars count={stars} />}

      <SafeAreaView className="flex-1" edges={edges}>
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName={cn(padding, bottom)}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            {...scrollProps}
          >
            <View className={cn(className)} {...rest}>
              {children}
            </View>
          </ScrollView>
        ) : (
          <View className={cn("flex-1", padding, bottom, className)} {...rest}>
            {children}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
