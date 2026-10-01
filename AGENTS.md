# ando · Gemelo Digital — Guía para el Agente de IA

> **REGLA OBLIGATORIA**: Antes de escribir cualquier código, lee la documentación
> exacta de la versión instalada en <https://docs.expo.dev/versions/v57.0.0/>.
> El SDK instalado es **Expo SDK 57** (`expo ~57.0.20`).

---

## 1. Identidad del proyecto

| Campo | Valor |
|---|---|
| Nombre de la app | **ando** |
| Nombre del paquete | `pe.edu.lapontificia.ando` |
| Slug Expo | `gemelo-digital` |
| Versión | 1.0.0 |
| Propósito | Gemelo digital personal basado en sensores y Random Forest para predecir actividades cotidianas. Proyecto de investigación académica, Ayacucho 2026. |

---

## 2. Stack técnico completo

| Capa | Librería / versión |
|---|---|
| Framework | **Expo SDK 57** (`expo ~57.0.20`) — Nueva Arquitectura habilitada (`newArchEnabled: true`) |
| Navegación | **Expo Router v3** (`expo-router ~57.0.19`) — rutas con tipado (`experiments.typedRoutes`) |
| UI / estilos | **NativeWind v4** + **Tailwind CSS v3** — preset `nativewind/preset`, punto de entrada `global.css` importado desde `app/_layout.tsx` |
| Animaciones | **Reanimated 4** (`react-native-reanimated 4.5.1`) + **Moti** (`^0.30.0`) |
| Fetching / caché | **TanStack Query v5** (`@tanstack/react-query ^5.102.8`) con persistencia offline vía `AsyncStorage` (`@tanstack/query-async-storage-persister`) |
| Estado global | **Zustand v5** (`zustand ^5.0.15`) — solo para sesión (`authStore`) |
| Validación | **Zod v4** (`zod ^4.4.3`) |
| Formularios | **React Hook Form v7** + `@hookform/resolvers` |
| Backend | **Supabase** (`@supabase/supabase-js ^2.112.4`) — puede ser `null` (modo demo) |
| Tokens seguros | `expo-secure-store` + adaptador personalizado en `src/lib/secureStorage.ts` |
| Iconos | **Lucide React Native** (`lucide-react-native ^1.34.0`) |
| Fuentes | **Inter** (400/500/600/700) + **Space Grotesk** (600/700) vía `@expo-google-fonts` |
| Sensores | `expo-sensors` (acelerómetro + podómetro iOS), `expo-location` (zona general), `expo-battery` |
| Salud Android | `react-native-health-connect ^4.1.3` — **SOLO en development build**, no en Expo Go |
| Notificaciones | `expo-notifications ~57.0.17` |
| TypeScript | `~6.0.3` |
| React | `19.2.3` |
| React Native | `0.86.3` |

---

## 3. Estructura de directorios

```
gemelo-digital/
├── app/                        # Expo Router (pantallas)
│   ├── _layout.tsx             # Root layout: fonts, PersistQueryClientProvider, GestureHandler
│   ├── index.tsx               # Redirige: sesión → (tabs), sin sesión → (auth)/welcome
│   ├── (auth)/
│   │   ├── welcome.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (tabs)/
│       ├── _layout.tsx         # Tab bar
│       ├── index.tsx           # Pantalla "Hoy" (captura de sensores)
│       ├── rutina.tsx          # Pantalla "Rutina"
│       ├── gemelo.tsx          # Pantalla "Gemelo"
│       └── perfil.tsx          # Pantalla "Perfil" (consentimientos)
├── src/
│   ├── components/
│   │   ├── gemelo/             # Avatar.tsx, ConfianzaRing.tsx, Stars.tsx
│   │   └── ui/                 # AnimatedNumber, AuthLayout, Brand, Button, Card, Chip, Screen, Switch, TextInput
│   ├── hooks/                  # useProfile.ts, useConsents.ts, useGemelo.ts
│   ├── services/               # Lógica de datos
│   │   ├── types.ts            # Tipos compartidos: EventoRow, GemeloSnapshot, etc.
│   │   ├── gemelo.ts           # fetchEventsToday, insertEventos, buildGemelo, buildRutina
│   │   ├── sensors.ts          # capturarSensoresReales (acelerómetro, GPS, podómetro iOS)
│   │   ├── healthConnect.android.ts  # leerHealthConnect (pasos/sueño/ritmo — dev build)
│   │   ├── healthConnect.ts    # stub para iOS/web
│   │   ├── consent.ts          # fetchConsents, upsertConsent
│   │   ├── profile.ts          # fetchProfile, upsertProfile
│   │   ├── eventoFactory.ts    # nuevoEvento() — fábrica de EventoRow
│   │   ├── localDb.ts          # lget/lset (AsyncStorage para modo demo)
│   │   ├── mode.ts             # isRemote() — ¿hay Supabase configurado?
│   │   └── schema.ts           # TABLES / OWNER_COL — nombres de tablas Supabase
│   ├── lib/
│   │   ├── supabase.ts         # Cliente Supabase (null si no configurado)
│   │   ├── queryClient.ts      # QueryClient + asyncStoragePersister + qk (query keys)
│   │   ├── secureStorage.ts    # Adaptador expo-secure-store para Supabase Auth
│   │   ├── authErrors.ts       # traducirErrorAuth()
│   │   └── cn.ts               # clsx + tailwind-merge
│   ├── stores/
│   │   └── authStore.ts        # useAuthStore (session, signIn, signUp, signOut, enterDemo)
│   ├── schemas/
│   │   ├── auth.ts             # loginSchema, registerSchema
│   │   ├── consent.ts          # categoriaConsentimiento, CATALOGO_CONSENTIMIENTOS
│   │   └── event.ts            # eventoCrudoSchema
│   ├── theme/                  # colores JS y gradientes (alineados con tailwind.config.js)
│   └── constants/              # config.ts (vars de entorno), otras constantes
├── supabase/
│   └── schema.sql              # RLS, trigger de perfil, GRANTs — NO crea tablas
├── assets/                     # Íconos, splash, favicon
├── global.css                  # Directivas Tailwind (@tailwind base/components/utilities)
├── tailwind.config.js          # Paleta brand/ink/accent/surface/on/primary/secondary/tertiary
├── babel.config.js             # babel-preset-expo + nativewind/babel + react-native-worklets/plugin
├── metro.config.js             # withNativeWind
├── app.json                    # Configuración Expo / EAS
├── eas.json                    # Perfiles de build (development, preview, production)
└── tsconfig.json               # paths aliases (@lib, @services, @components, @schemas, @hooks, @stores, @theme, @constants)
```

---

## 4. Aliases de TypeScript (paths)

Usa siempre los aliases — nunca rutas relativas largas:

| Alias | Resuelve a |
|---|---|
| `@lib/*` | `src/lib/*` |
| `@services/*` | `src/services/*` |
| `@components/*` | `src/components/*` |
| `@schemas/*` | `src/schemas/*` |
| `@hooks/*` | `src/hooks/*` |
| `@stores/*` | `src/stores/*` |
| `@theme/*` | `src/theme/*` |
| `@constants/*` | `src/constants/*` |

---

## 5. Base de datos Supabase

### Esquema (`ando_schema`) — tablas principales

| Tabla | Clave titular | Notas |
|---|---|---|
| `perfiles` | `usuario_id` (PK, FK → `auth.users`) | Creada automáticamente por el trigger `on_auth_user_created` |
| `consentimientos` | `usuario_id` | Historial inmutable; estado actual = fila más reciente por `categoria` |
| `dispositivos` | `usuario_id` | |
| `fuentes_datos` | `usuario_id` | |
| `eventos_crudos` | `usuario_id` | `evento_uuid` idempotente; columna del titular es `OWNER_COL = "usuario_id"` |
| `caracteristicas_actividad` | `usuario_id` | Ventanas para PySpark / Random Forest |
| `predicciones` | `usuario_id` | |
| `lineas_base` | `usuario_id` | |
| `variaciones_rutina` | `usuario_id` | |
| `correcciones_actividad` | `usuario_id` | |
| `solicitudes_derechos` | `usuario_id` | |
| `versiones_modelo` | — | Global, solo lectura para autenticados |
| `registros_auditoria` | — | Solo `service_role`, sin acceso desde la app |

- **RLS activo en todas las tablas del titular** con política `titular_rw`.
- `supabase/schema.sql` activa RLS, concede GRANTs y crea el trigger. Ejecutar en Supabase SQL Editor (es idempotente).

### Constantes de servicio

```ts
// src/services/schema.ts
TABLES.eventosCrudos  // nombre de tabla
OWNER_COL             // "usuario_id"
```

---

## 6. Patrones de datos establecidos

### TanStack Query (fuente de verdad de UI)

- **Los hooks en `src/hooks/` son el punto de entrada para todas las lecturas de UI.**
- Query keys centralizadas en `qk` (de `src/lib/queryClient.ts`):
  ```ts
  qk.profile(userId)   // ["profile", userId]
  qk.consents(userId)  // ["consents", userId]
  qk.events(userId)    // ["events", userId]
  ```
- Caché: `staleTime = 1 min`, `gcTime = 24 h`, persiste en AsyncStorage (`ando-query-cache`).
- Al `SIGNED_OUT`, `queryClient.clear()` descarta todo para evitar filtración entre cuentas.

### Modo demo / offline

- Si `EXPO_PUBLIC_SUPABASE_URL` no está configurado, `supabase` es `null`.
- `isRemote()` en `src/services/mode.ts` verifica si hay conexión con Supabase.
- Cuando `!isRemote()`, los servicios usan `lget/lset` (AsyncStorage vía `src/services/localDb.ts`).
- `authStore.enterDemo(alias?)` entra en modo demo sin backend.

### Consentimientos granulares

Categorías definidas en `src/schemas/consent.ts`:
`actividad | pasos | sueno | zona_general | wearable | fisiologia | ambiente | notificaciones | investigacion`

- Cada cambio inserta una fila en `consentimientos` (historial inmutable).
- El estado actual es la fila más reciente por categoría.
- Los servicios de sensores leen `ConsentMap` antes de capturar cualquier dato.

---

## 7. Sensores y captura de datos

### Flujo de captura (`capturarSensoresReales` en `src/services/sensors.ts`)

1. **Acelerómetro** (`expo-sensors`) → clasifica `desplazamiento` / `permanencia` — Android + iOS.
2. **GPS** (`expo-location`) → zona opaca tipo `Zona-XY4Z` (hash de celda ~1 km, **nunca coordenadas exactas**) — Android + iOS.
3. **Podómetro** (`expo-sensors` / `Pedometer`) → **solo iOS**.
4. **Health Connect** (`react-native-health-connect`) → pasos, sueño, frecuencia cardiaca — **solo Android + development build**.

### Health Connect (trampas importantes)

- **No disponible en Expo Go** (`Constants.appOwnership === "expo"` → retorna `[]`).
- Se importa con `dynamic import` dentro de `try/catch` para no romper el arranque.
- Requiere development build: `eas build --profile development --platform android` o `npx expo run:android`.
- Permisos en `app.json`: `android.permission.health.READ_STEPS`, `READ_SLEEP`, `READ_HEART_RATE`.
- El SDK Android mínimo es 26 (`minSdkVersion: 26`), target/compile: 36.

### Evento crudo — estructura `EventoRow`

```ts
type EventoRow = {
  evento_uuid: string;        // UUID idempotente (expo-crypto)
  procedencia: string;        // "sistema" | "health_connect" | "manual"
  tipo_evento: string;        // "ventana_actividad" | "pasos" | "sueno" | "ritmo_cardiaco" | "ubicacion"
  inicio_en: string;          // ISO 8601
  fin_en: string | null;
  valor_numerico: number | null;
  valor_texto: string | null; // ActividadPredicha cuando tipo_evento = "ventana_actividad"
  unidad: string | null;      // "pasos" | "min" | "bpm"
  confianza: number | null;   // 0-100
  zona_general: string | null;// "Zona-XXXX" (nunca lat/lng)
  medido_directamente: boolean;
  disponibilidad: boolean;
  calidad: number | null;
  version_consentimiento: string;
  datos_minimos: Record<string, unknown>;
};
```

Usa siempre `nuevoEvento()` de `src/services/eventoFactory.ts` para crear eventos.

---

## 8. Autenticación — `authStore` (Zustand)

```ts
useAuthStore()        // session, user, loading, initialized, demoMode
useIsAuthenticated()  // true si session || demoMode
```

- `init()`: recupera sesión de `expo-secure-store`, suscribe a `onAuthStateChange`.
- `signIn/signUp`: traducen errores de Supabase a español con `traducirErrorAuth()`.
- `signOut()`: limpia sesión + `queryClient.clear()`.
- `enterDemo(alias?)`: modo sin backend, `user.id = "demo-user"`.

---

## 9. Estilos — NativeWind v4 + Tailwind

### Paleta de colores del tema

| Token | Uso |
|---|---|
| `surface-*` | Fondos (dark: `#0e1224` base) |
| `on-surface` | Texto principal (`#dee1fb`) |
| `primary` / `primary-container` | Cian claro (`#cdf7ff` / `#39e7ff`) |
| `secondary` / `secondary-container` | Violeta (`#cfbdff` / `#5614c8`) |
| `tertiary` / `tertiary-container` | Verde menta (`#b9ffd5` / `#39efa2`) |
| `accent-mint` | `#39efa2` |
| `accent-coral` | `#ffb4ab` |
| `brand-*` | Escala de azul-cian (alias de compatibilidad) |
| `ink-*` | Escala de grises azulados |

### Tipografía

| Clase Tailwind | Fuente |
|---|---|
| `font-sans` | Inter Regular 400 |
| `font-medium` | Inter Medium 500 |
| `font-semibold` | Inter SemiBold 600 |
| `font-bold` | Inter Bold 700 |
| `font-display` | Space Grotesk SemiBold 600 |
| `font-display-bold` | Space Grotesk Bold 700 |

### Reglas NativeWind v4

- `global.css` se importa **una sola vez** en `app/_layout.tsx`.
- `darkMode: "class"` en `tailwind.config.js` (para evitar el warning de NativeWind).
- El helper `cn()` está en `src/lib/cn.ts` (clsx + tailwind-merge).

---

## 10. Babel y Metro — configuración crítica

### `babel.config.js`

```js
plugins: ["react-native-worklets/plugin"]
// ⚠️ NO usar "react-native-reanimated/plugin" — Reanimated 4 cambió al plugin de worklets
```

### `metro.config.js`

```js
// withNativeWind wrapping — necesario para que NativeWind compile el CSS
```

---

## 11. Tipos de actividad predicha

```ts
type ActividadPredicha =
  | "desplazamiento" | "trabajo" | "estudio" | "descanso"
  | "actividad_fisica" | "ocio" | "permanencia";
```

Etiquetas en español en `ACTIVIDAD_LABELS` dentro de `src/services/types.ts`.

---

## 12. Reglas para el agente

1. **Lee la doc de Expo SDK 57** antes de usar cualquier API de Expo: <https://docs.expo.dev/versions/v57.0.0/>
2. **Usa los aliases de TypeScript** (`@lib/`, `@services/`, etc.) — nunca rutas relativas largas.
3. **Nunca guardes coordenadas GPS** — convierte siempre a `zona_general` con `zonaDeCoords()`.
4. **Usa `nuevoEvento()`** para crear `EventoRow` — nunca construyas el objeto a mano.
5. **No importes `react-native-health-connect` estáticamente** — usa `dynamic import` dentro de `try/catch`.
6. **Verifica consentimiento** antes de leer cualquier sensor.
7. **Usa `isRemote()`** para bifurcar entre Supabase y modo local.
8. **Usa `qk.*`** para las query keys de TanStack Query — nunca strings literales sueltos.
9. **Reanimated 4**: el plugin es `react-native-worklets/plugin`, no el antiguo `react-native-reanimated/plugin`.
10. **NativeWind v4**: importar `global.css` solo desde el root layout.
11. **Supabase puede ser `null`** (`supabase!` solo cuando `isRemote()` es `true`).
12. **`OWNER_COL = "usuario_id"`** en todas las queries a tablas del titular — no uses otros nombres de columna.
13. **El modelo Random Forest es trabajo futuro** (pipeline Python/PySpark) — la predicción actual es heurística de frecuencia en `heuristicPrediccion()`.
14. **Android SDK mínimo: 26**. No uses APIs de Android por debajo de ese nivel.

---

## 13. Comandos de desarrollo

```bash
npm start                    # Metro / Expo Dev Tools
npm run android              # Development build local (necesita Android Studio)
npm run ios                  # Development build local (macOS + Xcode)
npm run web                  # Preview rápido de UI en web
npm run typecheck            # tsc --noEmit (sin emitir)

# Build en la nube (recomendado para Health Connect)
eas build --profile development --platform android
npx expo start --dev-client  # Arrancar contra el dev build instalado
```

---

## 14. Variables de entorno

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

Sin estas variables, la app arranca en **modo demo** (sin backend, datos locales en AsyncStorage).

---

## 15. Próximos pasos técnicos (contexto de tareas futuras)

1. Reemplazar la heurística de acelerómetro por **Activity Recognition API** (módulo nativo vía Expo Modules API).
2. Implementar **cola local cifrada** para eventos y sincronización en lotes a Supabase.
3. Crear **Edge Functions** en Supabase para validar lotes y coordinar el pipeline PySpark.
4. Publicar la primera versión del **modelo Random Forest** en `versiones_modelo`.
