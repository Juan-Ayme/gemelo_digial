"""
Lógica compartida del pipeline PySpark del gemelo digital: ingeniería de
features, entrenamiento del Random Forest y escritura de resultados en Supabase.

Sin efectos secundarios al importar (no crea SparkSession ni lee env aquí), para
que lo usen tanto `gemelo_pipeline.py` (datos reales) como `bootstrap_sintetico.py`.
"""

import json
import math
import time

from pyspark.sql import SparkSession, functions as F, Window
from pyspark.ml import Pipeline
from pyspark.ml.feature import StringIndexer, VectorAssembler
from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml.evaluation import MulticlassClassificationEvaluator
from pyspark.ml.functions import vector_to_array

SPARK_PACKAGES = "org.postgresql:postgresql:42.7.4"

# Features del modelo (deben coincidir con lo que produce la app en eventos).
FEATURES = [
    "hora_seno",
    "hora_coseno",
    "dia_semana",
    "actividad_actual_idx",
    "actividad_anterior_idx",
    "zona_idx",
    "pasos_ventana",
]


def crear_spark(app: str = "ando-gemelo"):
    return (
        SparkSession.builder.appName(app)
        .config("spark.jars.packages", SPARK_PACKAGES)
        .getOrCreate()
    )


JDBC_DRIVER = "org.postgresql.Driver"


def _url(url: str) -> str:
    """Garantiza stringtype=unspecified (necesario para escribir columnas jsonb)."""
    if "stringtype=" not in url:
        url = url + ("&" if "?" in url else "?") + "stringtype=unspecified"
    return url


def leer_jdbc(spark, url: str, tabla: str):
    return (
        spark.read.format("jdbc")
        .option("url", _url(url))
        .option("driver", JDBC_DRIVER)
        .option("dbtable", f"public.{tabla}")
        .load()
    )


def escribir_jdbc(df, url: str, tabla: str, mode: str = "append"):
    (
        df.write.format("jdbc")
        .option("url", _url(url))
        .option("driver", JDBC_DRIVER)
        .option("dbtable", f"public.{tabla}")
        .mode(mode)
        .save()
    )


def construir_features(eventos):
    """eventos: usuario_id, valor_texto, unidad, valor_numerico, zona_general, inicio_en, fin_en."""
    pasos = (
        eventos.filter(F.col("unidad") == "pasos")
        .withColumn("h", F.date_trunc("hour", "inicio_en"))
        .groupBy("usuario_id", "h")
        .agg(F.sum("valor_numerico").alias("pasos_ventana"))
    )
    act = eventos.filter(F.col("valor_texto").isNotNull() & F.col("inicio_en").isNotNull())
    w = Window.partitionBy("usuario_id").orderBy("inicio_en")
    return (
        act.withColumn("actividad_actual", F.col("valor_texto"))
        .withColumn("actividad_anterior", F.coalesce(F.lag("valor_texto").over(w), F.lit("ninguna")))
        .withColumn("etiqueta_siguiente", F.lead("valor_texto").over(w))
        .withColumn("ventana_inicio", F.col("inicio_en"))
        .withColumn(
            "ventana_fin",
            F.when(
                F.col("fin_en").isNotNull() & (F.col("fin_en") > F.col("inicio_en")),
                F.col("fin_en"),
            ).otherwise(F.expr("inicio_en + interval 30 minutes")),
        )
        .withColumn("hora_dec", F.hour("inicio_en") + F.minute("inicio_en") / 60.0)
        .withColumn("hora_seno", F.sin(F.col("hora_dec") / 24.0 * 2 * math.pi))
        .withColumn("hora_coseno", F.cos(F.col("hora_dec") / 24.0 * 2 * math.pi))
        .withColumn("dia_semana", F.dayofweek("inicio_en") - 1)
        .withColumn("h", F.date_trunc("hour", "inicio_en"))
        .join(pasos, ["usuario_id", "h"], "left")
        .withColumn("pasos_ventana", F.coalesce("pasos_ventana", F.lit(0)).cast("double"))
        .drop("h", "hora_dec")
    )


def entrenar_rf(feat, num_trees: int = 100, seed: int = 42):
    """Entrena el RF para predecir etiqueta_siguiente. Devuelve (modelo, métricas)."""
    train = feat.filter(F.col("etiqueta_siguiente").isNotNull())
    n = train.count()
    stages = [
        StringIndexer(inputCol="actividad_actual", outputCol="actividad_actual_idx", handleInvalid="keep"),
        StringIndexer(inputCol="actividad_anterior", outputCol="actividad_anterior_idx", handleInvalid="keep"),
        StringIndexer(inputCol="zona_general", outputCol="zona_idx", handleInvalid="keep"),
        StringIndexer(inputCol="etiqueta_siguiente", outputCol="label", handleInvalid="keep"),
        VectorAssembler(inputCols=FEATURES, outputCol="features", handleInvalid="keep"),
        RandomForestClassifier(featuresCol="features", labelCol="label", numTrees=num_trees, seed=seed),
    ]
    tr, te = train.randomSplit([0.8, 0.2], seed=seed)
    model = Pipeline(stages=stages).fit(tr)
    pred = model.transform(te)
    f1 = MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction", metricName="f1").evaluate(pred)
    acc = MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction", metricName="accuracy").evaluate(pred)
    rf = model.stages[-1]
    importancias = dict(zip(FEATURES, [round(float(x), 4) for x in rf.featureImportances.toArray()]))
    metrics = {"n_train": int(n), "accuracy": round(acc, 4), "f1": round(f1, 4), "importancias": importancias}
    return model, metrics


def registrar_modelo(spark, url: str, metrics: dict, num_trees: int, seed: int, etiqueta: str = "rf") -> tuple:
    """Inserta una fila en versiones_modelo (sin FK a usuario). Devuelve (version, id)."""
    version = f"{etiqueta}-{time.strftime('%Y%m%d-%H%M%S')}"
    fila = spark.createDataFrame(
        [(
            version, "Random Forest", "validado", seed,
            json.dumps({"numTrees": num_trees, "seed": seed}),
            json.dumps(FEATURES),
            json.dumps(metrics),
        )],
        ["version", "algoritmo", "estado", "semilla", "hiperparametros", "variables", "metricas"],
    )
    escribir_jdbc(fila, url, "versiones_modelo")
    modelo_id = leer_jdbc(spark, url, "versiones_modelo").filter(F.col("version") == version).select("id").first()["id"]
    return version, modelo_id


def escribir_caracteristicas(url: str, feat):
    """Solo válido con usuario_id reales (FK a perfiles)."""
    caracteristicas = (
        feat.select(
            "usuario_id", "ventana_inicio", "ventana_fin", "hora_seno", "hora_coseno",
            F.col("dia_semana").cast("short").alias("dia_semana"),
            "actividad_actual", "actividad_anterior",
            F.col("pasos_ventana").cast("int").alias("pasos_ventana"),
            "zona_general", "etiqueta_siguiente",
        )
        .filter(F.col("ventana_fin") > F.col("ventana_inicio"))
    )
    escribir_jdbc(caracteristicas, url, "caracteristicas_actividad")


def resolver_estado_prediccion(spark, url: str, preferido: str = "vigente") -> str:
    """
    Detecta los valores permitidos en el enum PostgreSQL `estado_prediccion`.
    Si 'preferido' no es válido, intenta añadirlo (vía ALTER TYPE) o selecciona
    el mejor valor activo disponible (ej. 'activa', 'valida', 'active').
    """
    valores = []
    query = (
        "(SELECT e.enumlabel "
        "FROM pg_catalog.pg_enum e "
        "JOIN pg_catalog.pg_type t ON e.enumtypid = t.oid "
        "WHERE t.typname = 'estado_prediccion' "
        "ORDER BY e.enumsortorder) AS enum_vals"
    )
    try:
        df = (
            spark.read.format("jdbc")
            .option("url", _url(url))
            .option("driver", JDBC_DRIVER)
            .option("dbtable", query)
            .load()
        )
        valores = [row["enumlabel"] for row in df.collect()]
        if valores:
            print(f"Valores existentes en enum 'estado_prediccion': {valores}")
    except Exception as err:
        print(f"Aviso al consultar enum 'estado_prediccion': {err}")

    if preferido not in valores:
        try:
            jvm = spark._jvm
            conn = jvm.java.sql.DriverManager.getConnection(_url(url))
            conn.setAutoCommit(True)
            stmt = conn.createStatement()
            try:
                stmt.execute(f"ALTER TYPE public.estado_prediccion ADD VALUE IF NOT EXISTS '{preferido}'")
            except Exception:
                stmt.execute(f"ALTER TYPE estado_prediccion ADD VALUE IF NOT EXISTS '{preferido}'")
            stmt.close()
            conn.close()
            print(f"Se añadió '{preferido}' al enum 'estado_prediccion' en PostgreSQL.")
            return preferido
        except Exception as err:
            print(f"Aviso al intentar añadir '{preferido}' al enum: {err}")

    if preferido in valores:
        return preferido

    sinonimos = ["vigente", "activa", "activo", "valida", "valido", "active", "current"]
    for s in sinonimos:
        if s in valores:
            print(f"Usando valor compatible '{s}' para estado_prediccion.")
            return s

    if valores:
        print(f"Usando primer valor disponible '{valores[0]}' para estado_prediccion.")
        return valores[0]

    return preferido


def escribir_predicciones(url: str, model, feat, modelo_id, pred_estado: str = "vigente"):
    """Última ventana de cada usuario -> próxima actividad. usuario_id deben ser reales."""
    estado_final = resolver_estado_prediccion(feat.sparkSession, url, pred_estado)
    labels = model.stages[3].labels
    map_expr = F.array(*[F.lit(x) for x in labels])
    ult = feat.withColumn(
        "rn", F.row_number().over(Window.partitionBy("usuario_id").orderBy(F.desc("inicio_en")))
    ).filter(F.col("rn") == 1)
    pred = (
        model.transform(ult)
        .withColumn("actividad_predicha", map_expr.getItem(F.col("prediction").cast("int")))
        .withColumn("probabilidad", F.array_max(vector_to_array(F.col("probability"))).cast("double"))
        .select(
            "usuario_id",
            F.lit(modelo_id).alias("modelo_id"),
            "actividad_predicha",
            "probabilidad",
            F.lit(30).alias("horizonte_minutos"),
            F.lit(estado_final).alias("estado"),
            F.lit(json.dumps(FEATURES)).alias("variables_relevantes"),
            F.lit("Predicción del Random Forest (PySpark).").alias("explicacion"),
        )
    )
    escribir_jdbc(pred, url, "predicciones")
    return pred
