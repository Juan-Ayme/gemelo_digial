import "../global.css";
import "@services/backgroundCapture"; // define la tarea ANTES de cualquier componente

import { useEffect } from "react";
import { LogBox } from "react-native";
import { Slot, SplashScreen } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { StyleSheet as NWStyleSheet } from "nativewind";
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
import { registrarTareaSegundoPlano } from "@services/backgroundCapture";
import { useNotificacionesAutomaticas } from "@hooks/useNotificaciones";

// En web, NativeWind lanza "dark mode is type 'media'" si algo intenta fijar el
// esquema. Fijamos el flag a 'class' para evitarlo. La app usa colores claros
// explícitos (no clases dark:), así que no cambia nada visual.
try {
  (NWStyleSheet as unknown as { setFlag?: (k: string, v: string) => void }).setFlag?.(
    "darkMode",
    "class",
  );
} catch {
  /* no-op en nativo */
}

SplashScreen.preventAutoHideAsync().catch(() => {});

// Avisos inofensivos de dependencias nativas/upstream (Expo SDK 57 / React 19 Fabric)
// que no afectan el funcionamiento de la app. Los silenciamos de LogBox y de la
// consola de Metro para mantener el entorno de desarrollo limpio.
const AVISOS_IGNORADOS = [
  "SafeAreaView has been deprecated",
  "expo-background-fetch: This library is deprecated",
  "Can't perform a React state update on a component that hasn't mounted yet",
];
LogBox.ignoreLogs(AVISOS_IGNORADOS);

const _consoleWarn = console.warn.bind(console);
console.warn = (...args: Parameters<typeof console.warn>) => {
  if (
    typeof args[0] === "string" &&
    AVISOS_IGNORADOS.some((aviso) => args[0].includes(aviso))
  ) {
    return;
  }
  _consoleWarn(...args);
};

const _consoleError = console.error.bind(console);
console.error = (...args: Parameters<typeof console.error>) => {
  if (
    typeof args[0] === "string" &&
    AVISOS_IGNORADOS.some((aviso) => args[0].includes(aviso))
  ) {
    return;
  }
  _consoleError(...args);
};

function AppInner() {
  useNotificacionesAutomaticas();
  return <Slot />;
}

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

  // Registrar captura en segundo plano cuando la sesión esté lista
  useEffect(() => {
    if (!authReady) return;
    registrarTareaSegundoPlano().catch(() => {});
  }, [authReady]);

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
          <AppInner />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}
