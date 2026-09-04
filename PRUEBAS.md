# Guía de prueba completa — ando · Gemelo Digital

Runbook para probar **todo** de punta a punta: login real (Supabase), datos
(perfil, consentimientos, eventos), sensores del teléfono y Health Connect.

Hay **dos niveles de prueba**:
- **A) Expo Go** (rápido, sin build): login, datos, y sensores de teléfono
  (movimiento, zona, pasos en iOS).
- **B) Development build** (para Health Connect): pasos en Android, sueño y
  frecuencia cardiaca.

---

## 0. Preparación (una sola vez)

1. **`.env`** en la raíz (ya lo tienes) con:
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```
2. **Base de datos.** En Supabase → **SQL Editor** → pega y ejecuta todo
   [`supabase/schema.sql`](supabase/schema.sql). Activa RLS, permisos y el
   trigger de perfil. *(Sin esto verás el error `42501`.)*
3. **Confirmación por correo** (opcional para probar rápido): Supabase →
   Authentication → Sign In / Email → puedes **desactivar** "Confirm email"
   mientras pruebas.

---

## A) Prueba en Expo Go (login + datos + sensores de teléfono)

```bash
npm install --legacy-peer-deps   # si no lo has hecho
npx expo start -c
```
Abre en **Expo Go** (escanea el QR con tu teléfono).

### Checklist
- [ ] **Registro:** Welcome → "Crear mi gemelo digital" → alias + correo +
      contraseña. Si "Confirm email" está ON, confirma por correo.
- [ ] **Login:** inicia sesión. Debe entrar a las tabs (Hoy).
- [ ] **Perfil → consentimientos:** activa *actividad*, *pasos* y *zona*. Cada
      switch debe guardarse (persistencia real en `consentimientos`).
- [ ] **Cerrar sesión y volver a entrar:** los consentimientos siguen activados
      (vinieron de Supabase, no de memoria).
- [ ] **Hoy → "Conectar y capturar sensores":** acepta los permisos de
      ubicación/movimiento. Debe registrar actividad + zona reales.
- [ ] **Hoy:** el tile de **Zona** y **Min. activos/Pasos** reflejan lo capturado;
      aparece una **predicción** tras 2+ capturas.
- [ ] **Rutina:** aparecen las ventanas capturadas en la línea de tiempo.
- [ ] **Gemelo:** "Fuentes activas" muestra Actividad/Zona (y Pasos en iOS) en
      verde.
- [ ] **Modo demo** (sin backend): en Welcome, "Explorar demo sin registro" →
      todo funciona con datos locales.

> En **iOS** los pasos son reales (podómetro). En **Android**, los pasos llegan
> por Health Connect → ve a la parte B.

---

## B) Development build (Health Connect: pasos Android, sueño, ritmo)

Health Connect **no funciona en Expo Go**. Necesitas un *development build*.

### Requisitos
- Teléfono **Android** con la app **Health Connect** instalada (nativa en
  Android 14+; en versiones anteriores instálala desde Play Store) y **con
  datos** (pasos/sueño/ritmo) de alguna app o wearable.
- Una cuenta de **Expo** (gratis) para el build en la nube, *o* Android Studio
  para el build local.

### Opción 1 — Build en la nube (recomendada)
```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android
```
La primera vez, EAS te pedirá crear el proyecto y añadirá `extra.eas.projectId`
a `app.json` automáticamente. Al terminar, **descarga e instala el APK** en tu
teléfono. Luego:
```bash
npx expo start --dev-client
```

### Opción 2 — Build local (necesita Android Studio + SDK)
```bash
npx expo run:android
```

### Checklist (en el development build)
- [ ] Repite el login y activa consentimientos *pasos*, *sueño* y *fisiología*
      en Perfil.
- [ ] **Hoy → "Conectar y capturar sensores":** ahora aparece el diálogo de
      permisos de **Health Connect**. Acéptalos.
- [ ] **Gemelo → Fuentes activas:** además de Actividad/Zona, se ponen en verde
      **Pasos**, **Sueño** y **Wearable/ritmo**.
- [ ] **Hoy:** los **Pasos** (Android) y el **Descanso** (incluye sueño) reflejan
      los datos de Health Connect.
- [ ] Los eventos quedan en Supabase (`eventos_crudos`, `procedencia = 'health_connect'`).

---

## Verificar los datos en Supabase (opcional)

En **SQL Editor** (como admin) para ver que todo se guardó:
```sql
select tipo_evento, procedencia, valor_numerico, unidad, zona_general, inicio_en
from public.eventos_crudos
order by inicio_en desc
limit 20;

select categoria, otorgado, otorgado_en, revocado_en
from public.consentimientos
order by creado_en desc;
```

---

## Problemas comunes

| Síntoma | Causa / solución |
|---|---|
| `permission denied` / `42501` al guardar | No corriste `supabase/schema.sql`. Ejecútalo. |
| No guarda nada y estás logueado | Revisa que el trigger creó tu fila en `perfiles` (parte del `schema.sql`). |
| "No hay sensores disponibles o autorizados" | Activa consentimientos en Perfil y acepta los permisos del sistema. |
| Pasos siempre 0 en Android (Expo Go) | Es lo esperado: Android usa Health Connect → parte B. |
| Health Connect no devuelve nada | Instala la app Health Connect y asegúrate de que tenga datos; acepta permisos. |
| El `.env` no toma efecto | Reinicia Metro limpiando caché: `npx expo start -c`. |
