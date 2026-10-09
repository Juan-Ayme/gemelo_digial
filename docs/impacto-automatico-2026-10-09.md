# Mi impacto automático - 9 de octubre de 2026

La tarjeta de Hoy conserva el tema esmeralda. Se retira el formulario de kilómetros, la confirmación de viajes y el botón Añadir caminata. Las lecturas de pasos autorizadas generan la distancia aproximada y una comparación de emisiones con un auto a gasolina. No se afirma que todos esos pasos hayan sustituido viajes.

## Cálculo

- Distancia estimada: pasos × 0,70 m / 1.000. La longitud es un supuesto fijo explícito, no una medición ni un valor personalizado.
- Comparación: distancia × (400 / 1,609344) g CO₂/km. Fuente: [EPA](https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle), promedio estadounidense de emisiones de escape; no factor peruano ni huella de ciclo de vida.
- Hoy y últimos siete días se recalculan desde los eventos, sin acumular otra vez al abrir la pantalla.
- Se excluyen lecturas no disponibles, futuras, negativas/no finitas, correcciones manuales y actividad del acelerómetro. El modo demo identifica los ejemplos.
- Se deduplican UUID y se prefiere el máximo contador del día para evitar sumar fuentes e intervalos solapados. Ausencia de lectura es distinta de una lectura real de cero pasos.

## Actualización

Al abrir Hoy, volver a la app y cada 60 segundos mientras Hoy está activa, se consultan los pasos autorizados: podómetro en iOS o Health Connect en Android. La actualización no solicita permisos del sistema ni lee GPS, acelerómetro, sueño o frecuencia cardiaca. Respeta el consentimiento vigente y cancela el guardado si se revoca el permiso, se cancela la consulta o cambia la cuenta.

La tarea de segundo plano existente conserva las lecturas cuando el sistema permite ejecutarla. Android necesita Health Connect con datos y una compilación compatible, no Expo Go. iOS usa el histórico del podómetro. No se promete seguimiento continuo ni que el sensor diferencie caminar de correr. Si faltan lecturas, se muestra Esperando una lectura de pasos; si falta consentimiento, un acceso a Perfil.

Los registros manuales de la versión anterior no se eliminan: permanecen disponibles en la exportación local, pero no se incluyen en la comparación automática. No se genera un segundo registro de CO₂ ni se cambia el backend.

Documentación de SDK consultada antes de programar: [Expo SDK 57, Pedometer](https://docs.expo.dev/versions/v57.0.0/sdk/pedometer/).

La comprobación visual y de sensores en el teléfono queda a cargo de la usuaria, como indicó. Se añaden pruebas de cálculo, exclusión de lecturas inválidas, deduplicación, fecha/cobertura, permisos, cancelación, persistencia y fallos de disco.

Validación realizada: `npm run typecheck` aprobada, 24 comprobaciones de `npm run test:regressions` aprobadas y `git diff --check` sin errores. No se ejecutó verificación visual ni lectura de sensores en un teléfono real.
