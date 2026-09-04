"""
ando · Gemelo Digital — Pipeline PySpark + Random Forest
========================================================

Big Data del proyecto: lee `eventos_crudos` de Supabase (TODOS los usuarios,
el rol postgres omite RLS), construye ventanas de features, entrena un
**Random Forest** (Spark MLlib) para predecir la PRÓXIMA actividad, evalúa, y
(opcional) escribe de vuelta en `caracteristicas_actividad`, `versiones_modelo`
y `predicciones`.

NO corre en el teléfono: Spark necesita Python + JVM. Se ejecuta en Google
Colab, tu PC o Databricks. Ver pipeline/README.md.

Conexión: usa la CADENA DE POSTGRES de Supabase (Settings > Database), NO la
anon key. Ponla en la variable de entorno SUPABASE_DB_URL y NUNCA la subas al
repositorio. Formato JDBC:
  jdbc:postgresql://HOST:5432/postgres?user=postgres&password=TU_PASS&sslmode=require&stringtype=unspecified
"""

import os
import math
import time

from pyspark.sql import SparkSession, functions as F, Window
from pyspark.ml import Pipeline
from pyspark.ml.feature import StringIndexer, VectorAssembler
from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml.evaluation import MulticlassClassificationEvaluator
from pyspark.ml.functions import vector_to_array

JDBC_URL = os.environ.get("SUPABASE_DB_URL")
WRITE_BACK = os.environ.get("WRITE_BACK", "0") == "1"  # 1 = escribe resultados en Supabase
PRED_ESTADO = os.environ.get("PRED_ESTADO", "vigente")  # ajusta al enum estado_prediccion real
NUM_TREES = int(os.environ.get("NUM_TREES", "100"))
SEED = 42

if not JDBC_URL:
    raise SystemExit(
        "Falta SUPABASE_DB_URL. Exporta la cadena JDBC de Postgres de Supabase "
        "(Settings > Database). Ver pipeline/README.md."
    )

FEATURES = [
    "hora_seno",
    "hora_coseno",
    "dia_semana",
    "actividad_actual_idx",
    "actividad_anterior_idx",
    "zona_idx",
    "pasos_ventana",
]

spark = (
    SparkSession.builder.appName("ando-gemelo-rf")
    .config("spark.jars.packages", "org.postgresql:postgresql:42.7.4")
    .getOrCreate()
)


def read_tabla(nombre: str):
    return (
        spark.read.format("jdbc")
        .option("url", JDBC_URL)
        .option("dbtable", f"public.{nombre}")
        .load()
    )


def write_tabla(df, nombre: str, mode: str = "append"):
    (
        df.write.format("jdbc")
        .option("url", JDBC_URL)
        .option("dbtable", f"public.{nombre}")
        .mode(mode)
        .save()
    )


# ---------------------------------------------------------------------------
# 1) Leer eventos y separar actividades vs pasos
# ---------------------------------------------------------------------------
ev = read_tabla("eventos_crudos").select(
    "usuario_id", "tipo_evento", "valor_texto", "valor_numerico", "unidad",
    "zona_general", "inicio_en", "fin_en",
)

# Pasos agregados por (usuario, hora) para usarlos como feature de la ventana.
pasos = (
    ev.filter(F.col("unidad") == "pasos")
    .withColumn("h", F.date_trunc("hour", "inicio_en"))
    .groupBy("usuario_id", "h")
    .agg(F.sum("valor_numerico").alias("pasos_ventana"))
)

# Ventanas de actividad: eventos con una actividad etiquetada.
act = ev.filter(F.col("valor_texto").isNotNull())

w = Window.partitionBy("usuario_id").orderBy("inicio_en")
feat = (
    act.withColumn("actividad_actual", F.col("valor_texto"))
    .withColumn("actividad_anterior", F.lag("valor_texto").over(w))
    .withColumn("etiqueta_siguiente", F.lead("valor_texto").over(w))  # <- LABEL
    .withColumn("ventana_inicio", F.col("inicio_en"))
    .withColumn("ventana_fin", F.coalesce("fin_en", "inicio_en"))
    .withColumn("hora_dec", F.hour("inicio_en") + F.minute("inicio_en") / 60.0)
    .withColumn("hora_seno", F.sin(F.col("hora_dec") / 24.0 * 2 * math.pi))
    .withColumn("hora_coseno", F.cos(F.col("hora_dec") / 24.0 * 2 * math.pi))
    .withColumn("dia_semana", F.dayofweek("inicio_en") - 1)  # 0..6
    .withColumn("h", F.date_trunc("hour", "inicio_en"))
    .join(pasos, ["usuario_id", "h"], "left")
    .withColumn("pasos_ventana", F.coalesce("pasos_ventana", F.lit(0)).cast("double"))
    .drop("h", "hora_dec")
)

n_total = feat.count()
print(f"Ventanas de actividad: {n_total}")

# ---------------------------------------------------------------------------
# 2) Entrenar Random Forest (predecir etiqueta_siguiente)
# ---------------------------------------------------------------------------
train_df = feat.filter(F.col("etiqueta_siguiente").isNotNull())
n_train = train_df.count()
print(f"Filas con etiqueta (para entrenar): {n_train}")
if n_train < 20:
    print("AVISO: hay muy pocos datos; el modelo será poco fiable. Captura más ventanas.")

stages = [
    StringIndexer(inputCol="actividad_actual", outputCol="actividad_actual_idx", handleInvalid="keep"),
    StringIndexer(inputCol="actividad_anterior", outputCol="actividad_anterior_idx", handleInvalid="keep"),
    StringIndexer(inputCol="zona_general", outputCol="zona_idx", handleInvalid="keep"),
    StringIndexer(inputCol="etiqueta_siguiente", outputCol="label", handleInvalid="keep"),
    VectorAssembler(inputCols=FEATURES, outputCol="features", handleInvalid="keep"),
    RandomForestClassifier(featuresCol="features", labelCol="label", numTrees=NUM_TREES, seed=SEED),
]
pipe = Pipeline(stages=stages)

tr, te = train_df.randomSplit([0.8, 0.2], seed=SEED)
model = pipe.fit(tr)
pred = model.transform(te)

f1 = MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction", metricName="f1").evaluate(pred)
acc = MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction", metricName="accuracy").evaluate(pred)
rf_model = model.stages[-1]
importancias = dict(zip(FEATURES, [round(float(x), 4) for x in rf_model.featureImportances.toArray()]))
print(f"\n=== Random Forest ===\nAccuracy: {acc:.3f}   F1: {f1:.3f}")
print("Importancia de variables:", importancias)

if not WRITE_BACK:
    print("\n(Solo evaluación. Exporta WRITE_BACK=1 para escribir en Supabase.)")
    spark.stop()
    raise SystemExit(0)

# ---------------------------------------------------------------------------
# 3) Escribir resultados en Supabase
# ---------------------------------------------------------------------------
version = f"rf-{time.strftime('%Y%m%d-%H%M%S')}"

# 3a) caracteristicas_actividad (features calculadas)
caracteristicas = feat.select(
    "usuario_id", "ventana_inicio", "ventana_fin",
    "hora_seno", "hora_coseno",
    F.col("dia_semana").cast("short").alias("dia_semana"),
    "actividad_actual", "actividad_anterior",
    F.col("pasos_ventana").cast("int").alias("pasos_ventana"),
    "zona_general", "etiqueta_siguiente",
)
write_tabla(caracteristicas, "caracteristicas_actividad")
print(f"Escritas {caracteristicas.count()} filas en caracteristicas_actividad")

# 3b) versiones_modelo (una fila con métricas). jsonb via stringtype=unspecified.
import json as _json
modelo_row = spark.createDataFrame(
    [(
        version, "Random Forest", "validado", SEED,
        _json.dumps({"numTrees": NUM_TREES, "seed": SEED}),
        _json.dumps(FEATURES),
        _json.dumps({"accuracy": round(acc, 4), "f1": round(f1, 4), "importancias": importancias}),
    )],
    ["version", "algoritmo", "estado", "semilla", "hiperparametros", "variables", "metricas"],
)
write_tabla(modelo_row, "versiones_modelo")
modelo_id = read_tabla("versiones_modelo").filter(F.col("version") == version).select("id").first()["id"]
print(f"Modelo registrado: {version} (id={modelo_id})")

# 3c) predicciones: última ventana de cada usuario -> próxima actividad probable.
ult = feat.withColumn(
    "rn", F.row_number().over(Window.partitionBy("usuario_id").orderBy(F.desc("inicio_en")))
).filter(F.col("rn") == 1)
prob_next = model.transform(ult)
# La clase predicha (índice) se mapea de vuelta a texto con el StringIndexer del label.
labels = model.stages[3].labels  # indexer de etiqueta_siguiente
map_expr = F.array(*[F.lit(x) for x in labels])
predicciones = (
    prob_next
    .withColumn("actividad_predicha", map_expr.getItem(F.col("prediction").cast("int")))
    .withColumn("probabilidad", F.array_max(vector_to_array(F.col("probability"))).cast("double"))
    .select(
        "usuario_id",
        F.lit(modelo_id).alias("modelo_id"),
        "actividad_predicha",
        "probabilidad",
        F.lit(30).alias("horizonte_minutos"),
        F.lit(PRED_ESTADO).alias("estado"),
        F.lit(_json.dumps(FEATURES)).alias("variables_relevantes"),
        F.lit("Predicción del modelo Random Forest entrenado con PySpark.").alias("explicacion"),
    )
)
write_tabla(predicciones, "predicciones")
print(f"Escritas {predicciones.count()} predicciones (estado='{PRED_ESTADO}').")
print("\nSi falla por el enum 'estado', mira valores válidos con:")
print("  SELECT enum_range(NULL::estado_prediccion);  -- y ajusta PRED_ESTADO")

spark.stop()
