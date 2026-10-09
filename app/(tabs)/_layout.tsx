import { Tabs } from "expo-router";
import { Activity, CalendarDays, Sparkles, UserCircle } from "lucide-react-native";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@theme/colors";
import { TAB_BAR_HEIGHT, tabBarBottom } from "@theme/layout";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandCyan,
        tabBarInactiveTintColor: "rgba(255,255,255,0.45)",
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
          marginTop: -2,
        },
        // Barra flotante de vidrio sobre el cielo cósmico.
        tabBarStyle: {
          position: "absolute",
          left: 18,
          right: 18,
          bottom: tabBarBottom(Platform.OS, insets.bottom),
          height: TAB_BAR_HEIGHT,
          borderRadius: 26,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
          backgroundColor: "transparent",
          elevation: 0,
          paddingTop: 9,
          paddingBottom: 9,
          shadowColor: colors.brand,
          shadowOpacity: 0.28,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
        },
        tabBarBackground: () => (
          <BlurView
            tint="dark"
            intensity={40}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: 26, overflow: "hidden", backgroundColor: "rgba(8,19,16,0.65)" },
            ]}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hoy",
          tabBarIcon: ({ color, size, focused }) => <View className={focused ? "rounded-xl px-3 py-1 bg-white/10" : "px-3 py-1"}><Activity size={size} color={color} strokeWidth={focused ? 2.4 : 1.8} /></View>,
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: "Historial",
          tabBarIcon: ({ color, size, focused }) => <View className={focused ? "rounded-xl px-3 py-1 bg-white/10" : "px-3 py-1"}><CalendarDays size={size} color={color} strokeWidth={focused ? 2.4 : 1.8} /></View>,
        }}
      />
      <Tabs.Screen
        name="gemelo"
        options={{
          title: "Gemelo",
          tabBarIcon: ({ color, size, focused }) => <View className={focused ? "rounded-xl px-3 py-1 bg-white/10" : "px-3 py-1"}><Sparkles size={size} color={color} strokeWidth={focused ? 2.4 : 1.8} /></View>,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size, focused }) => <View className={focused ? "rounded-xl px-3 py-1 bg-white/10" : "px-3 py-1"}><UserCircle size={size} color={color} strokeWidth={focused ? 2.4 : 1.8} /></View>,
        }}
      />

      {/* ── Pantallas sin pestaña (accesibles desde Perfil) ── */}
      <Tabs.Screen name="mi-cambio" options={{ href: null }} />
      <Tabs.Screen name="mi-manana" options={{ href: null }} />
      <Tabs.Screen name="rutina"         options={{ href: null }} />
      <Tabs.Screen name="metas"          options={{ href: null }} />
      <Tabs.Screen name="insights"       options={{ href: null }} />
      <Tabs.Screen name="logros"         options={{ href: null }} />
      <Tabs.Screen name="mis-datos"      options={{ href: null }} />
      <Tabs.Screen name="suscripcion"    options={{ href: null }} />
      <Tabs.Screen name="notificaciones" options={{ href: null }} />
    </Tabs>
  );
}
