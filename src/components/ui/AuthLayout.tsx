import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { Stars } from "@components/gemelo/Stars";
import { authGradient } from "@theme/colors";

/**
 * Andamiaje visual compartido por welcome / login / register: fondo oscuro con
 * degradado, partículas animadas, status bar clara y safe area. Cada pantalla
 * solo aporta su contenido (formulario, CTA, etc.).
 */
export function AuthLayout({
  children,
  starCount = 30,
}: {
  children: React.ReactNode;
  starCount?: number;
}) {
  return (
    <View className="flex-1 bg-surface-lowest">
      <StatusBar style="light" />
      <LinearGradient
        colors={authGradient}
        style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}
      />
      <Stars count={starCount} />
      <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
        {children}
      </SafeAreaView>
    </View>
  );
}
