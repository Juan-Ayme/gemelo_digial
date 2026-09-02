import "../global.css";

import { useEffect } from "react";
import { Slot, SplashScreen } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";

import { useAuthStore } from "@stores/authStore";
import { asyncStoragePersister, queryClient } from "@lib/queryClient";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const initAuth = useAuthStore((s) => s.init);
  const authReady = useAuthStore((s) => s.initialized);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    initAuth().catch(() => {});
  }, [initAuth]);

  useEffect(() => {
    if (fontsLoaded && authReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, authReady]);

  if (!fontsLoaded || !authReady) return null;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24,
      }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Slot />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}
