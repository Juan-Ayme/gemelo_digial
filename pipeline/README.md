# Pipeline PySpark + Random Forest — ando · Gemelo Digital

Procesa los `eventos_crudos` que la app guarda en Supabase (de **todos** los
usuarios), construye ventanas de features y entrena un **Random Forest**
(Spark MLlib) para predecir la próxima actividad. Opcionalmente escribe los
resultados en `caracteristicas_actividad`, `versiones_modelo` y `predicciones`.

> **No corre en el teléfono.** Spark necesita Python + JVM. La app captura y
> muestra; este pipeline (Big Data) corre en la nube o tu PC. Es la arquitectura
> correcta: el modelo se entrena centralizando los datos de todos los usuarios.

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

## Después de correrlo

Cuando el pipeline escriba `predicciones`, el siguiente paso es que la app **lea
esa tabla** y muestre la predicción real del Random Forest en lugar de la
heurística. Dilo y lo cableo en la app.
