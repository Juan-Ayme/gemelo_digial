import { Tabs } from "expo-router";
import { Activity, CalendarDays, Sparkles, UserCircle } from "lucide-react-native";
import { Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";

import { colors } from "@theme/colors";

export default function TabsLayout() {
  return (
    <Tabs
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
          bottom: Platform.OS === "ios" ? 28 : 18,
          height: 66,
          borderRadius: 26,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
          backgroundColor: "transparent",
          elevation: 0,
          paddingTop: 9,
          paddingBottom: 9,
          shadowColor: colors.brandCyan,
          shadowOpacity: 0.22,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
        },
        tabBarBackground: () => (
          <BlurView
            tint="dark"
            intensity={40}
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: 26, overflow: "hidden", backgroundColor: "rgba(10,14,32,0.55)" },
            ]}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hoy",
          tabBarIcon: ({ color, size }) => <Activity size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rutina"
        options={{
          title: "Rutina",
          tabBarIcon: ({ color, size }) => <CalendarDays size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="gemelo"
        options={{
          title: "Gemelo",
          tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <UserCircle size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
