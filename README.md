# ando · Gemelo Digital

Aplicativo móvil del proyecto **"Desarrollo de un gemelo digital personal basado en Random Forest y Big Data para la predicción de actividades cotidianas de estudiantes universitarios"** — La Pontificia, Ayacucho, 2026.

Stack: React Native · Expo SDK 57 · TypeScript · Expo Router · NativeWind v4 · **TanStack Query** (caché offline) · Zustand · Zod · React Hook Form · Reanimated 4 · Moti · Supabase.

## Estructura

```
gemelo-digital/
├── app/                 # Expo Router (pantallas)
│   ├── _layout.tsx      # Root layout (fonts, safe area, gesture handler)
│   ├── index.tsx        # Redirige según sesión
│   ├── (auth)/          # Welcome, login, register
│   └── (tabs)/          # Hoy, Rutina, Gemelo, Perfil
├── src/
│   ├── components/      # UI (Screen, Card, Button, Chip, TextInput, Switch, Avatar)
│   ├── hooks/           # TanStack Query (useProfile, useConsents, useGemelo)
│   ├── services/        # acceso a datos (Supabase + fallback local) y derivaciones
│   ├── lib/             # supabase, queryClient, secureStorage, cn
│   ├── stores/          # zustand (solo sesión: authStore)
│   ├── schemas/         # zod (auth, consent, event)
│   ├── theme/           # colores JS y gradientes
│   └── constants/       # configuración
├── supabase/
│   └── schema.sql       # esquema canónico (perfiles, consentimientos, eventos_crudos + RLS)
├── global.css           # directivas Tailwind
├── tailwind.config.js   # paleta brand/ink/accent
├── babel.config.js      # nativewind + reanimated (worklets)
└── metro.config.js      # withNativeWind
```

## Primeros pasos

1. Copia `.env.example` a `.env` y coloca las claves publicables de Supabase:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
   Sin claves, la app arranca en modo demo (sin backend).

2. Instala dependencias (ya hecho al preparar el entorno):
   ```
   npm install --legacy-peer-deps
   ```

3. Ejecuta un development build (recomendado para APIs nativas):
   ```
   npm run android
   ```
   O usa Expo Go con:
   ```
   npm start
   ```

## Comandos

| Comando             | Descripción                            |
|---------------------|----------------------------------------|
| `npm start`         | Arranca Metro (Expo Dev Tools)         |
| `npm run android`   | Compila y despliega en Android         |
| `npm run ios`       | Compila y despliega en iOS (mac)       |
| `npm run web`       | Modo web (para revisar UI rápido)      |
| `npm run typecheck` | Verifica TypeScript sin emitir         |

## Base de datos

El esquema mínimo que la app usa hoy está en [`supabase/schema.sql`](supabase/schema.sql):
ejecútalo en el SQL Editor de tu proyecto Supabase. Crea `perfiles`, `consentimientos`
y `eventos_crudos` con Row Level Security por titular y un trigger que crea el perfil
al registrarse. La columna de titularidad es `titular_id` (si tu esquema usa otro nombre,
cámbialo en `supabase/schema.sql` **y** en `src/services/schema.ts`).

El esquema completo del proyecto de investigación (`ando_schema.sql`) además define:

- perfiles, consentimientos, dispositivos, fuentes_datos
- eventos_crudos con `evento_uuid` idempotente
- caracteristicas_actividad (ventanas para PySpark / Random Forest)
- versiones_modelo, predicciones, lineas_base, variaciones_rutina
- correcciones_actividad, solicitudes_derechos, registros_auditoria
- Row Level Security en todas las tablas del titular

Los tipos Zod en `src/schemas` se mantienen alineados con los enumerados del SQL (`tipo_procedencia`, `estado_fuente`, `nivel_variacion`, etc.).

## Notas de arquitectura

- **Capa de datos con TanStack Query.** Los hooks en `src/hooks` (`useProfile`, `useConsents`, `useGemelo`, `useRutina`) leen/escriben vía `src/services`, que hablan con Supabase o, en modo demo, con un almacén local (AsyncStorage). La caché se **persiste offline** (`PersistQueryClientProvider`), así que los datos siguen tras cerrar la app. `authStore` (Zustand) queda solo para la sesión.
- **Consentimiento persistido.** Cada switch del perfil hace un `upsert` a `consentimientos` (con actualización optimista); ya no es solo estado en memoria.
- **"Simular captura" es real.** Inserta un `evento_crudo` y el gemelo/rutina se recalculan desde los eventos del día (pasos, minutos activos, zona, predicción por heurística). El modelo Random Forest sigue siendo trabajo futuro del pipeline.
- **Privacidad primero.** No se guardan coordenadas exactas: la ubicación se convierte en `zone_id` antes de enviarse.
- **Consentimiento granular.** Cada categoría (`actividad`, `pasos`, `sueno`, `zona_general`, `wearable`, `fisiologia`, `ambiente`, `notificaciones`, `investigacion`) se activa por separado.
- **Modo demo.** Si Supabase no está configurado, `authStore.enterDemo()` permite explorar la UI sin backend.
- **Reanimated 4.** Requiere el plugin `react-native-worklets/plugin` en `babel.config.js` (no el antiguo `react-native-reanimated/plugin`).
- **NativeWind v4.** El punto de entrada `global.css` se importa desde `app/_layout.tsx`.
- **Expo Router tipado.** `experiments.typedRoutes` en `app.json` activa autocompletado de rutas.

## Próximos pasos técnicos

1. Integrar Activity Recognition API mediante un módulo nativo (Expo Modules API).
2. Añadir Health Connect (`react-native-health-connect`) tras development build.
3. Implementar cola local cifrada para eventos y sincronizar por lote a Supabase.
4. Definir Edge Functions para validar lotes y coordinar el pipeline PySpark.
5. Publicar la primera versión del modelo Random Forest en `versiones_modelo`.
