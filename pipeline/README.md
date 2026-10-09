# Pipeline PySpark + Random Forest — ando · Gemelo Digital

Procesa los `eventos_crudos` que la app guarda en Supabase (de **todos** los
usuarios), construye ventanas de features y entrena un **Random Forest**
(Spark MLlib) para predecir la próxima actividad. Opcionalmente escribe los
resultados en `caracteristicas_actividad`, `versiones_modelo` y `predicciones`.

> **No corre en el teléfono.** Spark necesita Python + JVM. La app captura y
> muestra; este pipeline (Big Data) corre en la nube o tu PC. Es la arquitectura
> correcta: el modelo se entrena centralizando los datos de todos los usuarios.

## Los tres scripts

| Script | Qué hace | Necesita |
|---|---|---|
| `bootstrap_sintetico.py` | **Arranque en frío**: entrena el RF de "próxima actividad" con rutinas cotidianas **generadas**. Da un modelo funcionando YA. | Nada (o Supabase para registrarlo) |
| `gemelo_pipeline.py` | Igual pero con tus **datos reales** de `eventos_crudos`. Escribe caracteristicas + modelo + predicciones. | `SUPABASE_DB_URL` |
| `har_clasificador.py` | Clasificador de actividad desde sensores con el **dataset público UCI HAR**. Otro sub-problema (reconocer la actividad actual). | dataset UCI HAR |

`common.py` contiene la lógica compartida de features y entrenamiento (los dos
primeros la usan, así el bootstrap y el modelo real son idénticos en features).

Arranque rápido (Colab): `!pip install -r pipeline/requirements.txt` y luego
`!python pipeline/bootstrap_sintetico.py` — verás las métricas del modelo de
arranque sin tocar nada más.

## Conexión a Supabase (importante)

El pipeline usa la **cadena de Postgres** (rol `postgres`, que omite RLS y ve a
todos los usuarios), **no** la anon key. Consíguela en Supabase →
**Project Settings → Database → Connection string**. Ármala en formato JDBC:

```
jdbc:postgresql://<HOST>:5432/postgres?user=postgres&password=<TU_PASSWORD>&sslmode=require&stringtype=unspecified
```

⚠️ **Es un secreto** (contraseña de tu base). NO la subas al repo ni la pegues
en el chat. Se pasa por la variable de entorno `SUPABASE_DB_URL`.

## Opción A — Google Colab (recomendado, sin instalar nada)

1. Crea un notebook nuevo en https://colab.research.google.com
2. Instala PySpark (Colab ya trae Java):
   ```python
   !pip -q install pyspark==3.5.3
   ```
3. Sube `gemelo_pipeline.py` (menú Files → Upload) o pega su contenido.
4. Configura la conexión y ejecuta **solo evaluación** (lectura, seguro):
   ```python
   import os
   os.environ["SUPABASE_DB_URL"] = "jdbc:postgresql://...&stringtype=unspecified"
   !python gemelo_pipeline.py
   ```
   Verás Accuracy, F1 e importancia de variables.
5. Cuando estés conforme, **escribe los resultados** en Supabase:
   ```python
   os.environ["WRITE_BACK"] = "1"
   !python gemelo_pipeline.py
   ```

## Opción B — Local (tu PC)

Requiere **Java 17+** y Python. Luego:
```bash
pip install -r pipeline/requirements.txt
export SUPABASE_DB_URL="jdbc:postgresql://...&stringtype=unspecified"   # PowerShell: $env:SUPABASE_DB_URL="..."
python pipeline/gemelo_pipeline.py            # solo evalúa
WRITE_BACK=1 python pipeline/gemelo_pipeline.py   # además escribe en Supabase
```

## Variables de entorno

| Variable | Def. | Para qué |
|---|---|---|
| `SUPABASE_DB_URL` | — | Cadena JDBC de Postgres (obligatoria) |
| `WRITE_BACK` | `0` | `1` escribe en `caracteristicas_actividad`, `versiones_modelo`, `predicciones` |
| `NUM_TREES` | `100` | Nº de árboles del Random Forest |
| `PRED_ESTADO` | `vigente` | Valor del enum `estado_prediccion`. Si falla, mira los válidos: `SELECT enum_range(NULL::estado_prediccion);` |

## Requisitos de datos

Necesita eventos reales: primero **captura en la app** (Perfil → consentimientos
→ Hoy → *Conectar y capturar sensores*) unas cuantas veces. Con pocas ventanas el
modelo será poco fiable (el script te avisa).

## Opción C — Automático en la nube (GitHub Actions)

Para que corra **solo** en un horario, sin tu PC ni Colab, ya está el workflow
[`.github/workflows/pipeline.yml`](../.github/workflows/pipeline.yml):

1. Sube el repo a GitHub y en el repo → **Settings → Secrets and variables →
   Actions → New repository secret** crea `SUPABASE_DB_URL` con tu cadena JDBC.
2. Ese workflow corre a diario (cron 06:00 UTC) y también con el botón **Run
   workflow** (pestaña *Actions*). Entrena y escribe `predicciones` (WRITE_BACK=1).

El secreto queda cifrado en GitHub; nunca se guarda en el código.

## Modelo de arranque (bootstrap sintético)

Para tener modelo **antes** de acumular datos reales:
```bash
python pipeline/bootstrap_sintetico.py                    # solo entrena y muestra métricas
WRITE_BACK=1 SUPABASE_DB_URL="jdbc:..." python pipeline/bootstrap_sintetico.py   # registra el modelo
```
Con `REAL_USER_ID=<tu-uuid>` además escribe una predicción para tu usuario real
usando ese modelo (útil para ver la predicción del RF en la app con pocos datos
propios). El `uuid` es tu `usuario_id` (auth.users.id de tu cuenta).

## Clasificador de actividad — DATASET REAL (UCI HAR)

Dataset real de 30 personas con smartphone (UCI ML Repository, dataset 240). El
script lo **descarga solo** (no hay que bajar nada a mano):
```bash
pip install pyspark pandas
python pipeline/har_clasificador.py
```
Imprime accuracy, F1, precision/recall y una **matriz de confusión** del Random
Forest sobre las 6 actividades reales (WALKING, SITTING, STANDING, LAYING, ...).
Ideal para exponer con datos reales.

## Después de correrlo

### Ejecuciones repetidas y publicación (corrección 2026-10-09)

El pipeline real guarda las ventanas mediante `ON CONFLICT
(usuario_id, ventana_inicio, ventana_fin) DO UPDATE`. Así se pueden recalcular
el historial y las etiquetas sin duplicar las ventanas existentes. Los duplicados
dentro del lote se reducen a una fila por clave con desempate estable.

Las características, el registro del modelo y sus predicciones se escriben en
una misma transacción JDBC: si falla una escritura, se revierte toda esa
publicación. No se borran tablas ni se elimina la restricción de unicidad.
El bootstrap conserva su flujo independiente; el control de concurrencia del
workflow evita publicaciones simultáneas entre ejecuciones de GitHub Actions.

Pruebas locales sin Supabase: `python -m unittest discover -s pipeline -p
"test_*.py"`. Estas pruebas verifican consultas parametrizadas, lotes, cierre de
recursos y commit/rollback con dobles JDBC; la integración Spark/PostgreSQL debe
confirmarse ejecutando el workflow actualizado.

Cuando el pipeline escriba `predicciones`, el siguiente paso es que la app **lea
esa tabla** y muestre la predicción real del Random Forest en lugar de la
heurística. Dilo y lo cableo en la app.
