import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Cliente TanStack Query de la app. Configuración pensada para móvil:
 * caché relativamente larga (se persiste en disco) y reintentos moderados.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min "fresco" antes de re-fetch en background
      gcTime: 1000 * 60 * 60 * 24, // 24 h en memoria/persistencia
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 1 },
  },
});

/**
 * Persistencia offline de la caché en AsyncStorage: los datos siguen
 * disponibles tras cerrar y reabrir la app (elección del usuario).
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "ando-query-cache",
  throttleTime: 1000,
});

/** Claves de query centralizadas para evitar strings sueltos. */
export const qk = {
  impacto: (userId: string) => ["impacto", userId] as const,
  eventHistory: (userId: string) => ["event-history", userId] as const,
  preferencias: (userId: string) => ["preferencias", userId] as const,
  cambios: (userId: string) => ["cambios", userId] as const,
  planes: (userId: string, dia: string) => ["planes", userId, dia] as const,
  sync: (userId: string) => ["sync", userId] as const,
  background: (userId: string) => ["background", userId] as const,
  profile:      (userId: string) => ["profile", userId] as const,
  consents:     (userId: string) => ["consents", userId] as const,
  events:       (userId: string) => ["events", userId] as const,
  prediccion:   (userId: string) => ["prediccion-rf", userId] as const,
  zonas:        (userId: string) => ["zonas", userId] as const,
  correcciones: (userId: string) => ["correcciones", userId] as const,
  historialPrefix: (userId: string) => ["historial", userId] as const,
  historial:    (userId: string, dias: number) => ["historial", userId, dias] as const,
  metas:        (userId: string) => ["metas", userId] as const,
  logros:       (userId: string) => ["logros", userId] as const,
  suscripcion:  (userId: string) => ["suscripcion", userId] as const,
};
