import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, ScrollView, Text, View, type ScrollViewProps, type ViewProps } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@lib/cn";
import { Stars } from "@components/gemelo/Stars";
import { colors, cosmic } from "@theme/colors";
import { screenBottomSpace } from "@theme/layout";

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
  stars = 12,
  scrollProps,
  edges = ["top", "left", "right"],
  tabBarSpace = true,
  ...rest
}: Props) {
  const padding = padded ? "px-5 pt-4" : "";
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const detail = ["/mi-cambio", "/mi-manana", "/rutina", "/metas", "/insights", "/logros", "/mis-datos", "/suscripcion", "/notificaciones"].includes(pathname);
  const paddingBottom = tabBarSpace ? screenBottomSpace(Platform.OS, insets.bottom) : 40;

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
        {detail && <View className="px-3">
          <Pressable accessibilityRole="button" accessibilityLabel="Volver a la pantalla anterior"
            onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
            className="self-start flex-row items-center py-2 pr-3" style={{ minHeight: 44 }}>
            <ChevronLeft size={25} color={colors.brandCyan} /><Text className="text-brand-300 text-base">Volver</Text>
          </Pressable>
        </View>}
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName={padding}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            showsVerticalScrollIndicator={false}
            {...scrollProps}
            contentContainerStyle={[{ paddingBottom }, scrollProps?.contentContainerStyle]}
          >
            <View className={cn(className)} {...rest}>
              {children}
            </View>
          </ScrollView>
        ) : (
          <View className={cn("flex-1", padding, className)} {...rest} style={[{ paddingBottom }, rest.style]}>
            {children}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
