"""
ando · Gemelo Digital — Pipeline PySpark + Random Forest (DATOS REALES)
=======================================================================

Lee `eventos_crudos` de Supabase (todos los usuarios; el rol postgres omite RLS),
construye ventanas de features, entrena un Random Forest (Spark MLlib) para
predecir la próxima actividad, evalúa y (WRITE_BACK=1) escribe
caracteristicas_actividad + versiones_modelo + predicciones de vuelta.

NO corre en el teléfono: Spark necesita Python + JVM. Ver pipeline/README.md.
Conexión por SUPABASE_DB_URL (cadena JDBC de Postgres, NUNCA la subas al repo).
La lógica de features/entrenamiento vive en common.py (compartida con el bootstrap).
"""

import os

import common as C
from pyspark.sql import functions as F

JDBC_URL = os.environ.get("SUPABASE_DB_URL")
WRITE_BACK = os.environ.get("WRITE_BACK", "0") == "1"
PRED_ESTADO = os.environ.get("PRED_ESTADO", "vigente")
NUM_TREES = int(os.environ.get("NUM_TREES", "100"))
SEED = 42

if not JDBC_URL:
    raise SystemExit("Falta SUPABASE_DB_URL. Ver pipeline/README.md.")

spark = C.crear_spark("ando-gemelo-rf")

ev = C.leer_jdbc(spark, JDBC_URL, "eventos_crudos").select(
    "usuario_id", "valor_texto", "unidad", "valor_numerico", "zona_general", "inicio_en", "fin_en"
)
feat = C.construir_features(ev)
print("Ventanas de actividad:", feat.count())

# Con muy pocos datos reales el RF no es entrenable; salimos en verde (el modelo
# de arranque lo cubre bootstrap_sintetico.py).
n_train = feat.filter(F.col("etiqueta_siguiente").isNotNull()).count()
if n_train < 10:
    print(f"Solo {n_train} ventanas reales con etiqueta; omito el entrenamiento con datos reales.")
    print("El modelo de arranque lo genera bootstrap_sintetico.py.")
    spark.stop()
    raise SystemExit(0)

model, metrics = C.entrenar_rf(feat, NUM_TREES, SEED)
print("Métricas:", metrics)
if metrics["n_train"] < 20:
    print("AVISO: pocos datos reales. Corre primero bootstrap_sintetico.py para un modelo de arranque.")

if not WRITE_BACK:
    print("(Solo evaluación. Exporta WRITE_BACK=1 para escribir en Supabase.)")
    spark.stop()
    raise SystemExit(0)

# Resuelve el enum antes de abrir la transacción de publicación.
estado = C.resolver_estado_prediccion(spark, JDBC_URL, PRED_ESTADO)
try:
    # Modelo, ventanas y predicciones se confirman juntos: no quedan publicaciones parciales.
    with C.J.transaccion(spark, C._url(JDBC_URL)) as conn:
        C.escribir_caracteristicas(JDBC_URL, feat, conn=conn)
        version, modelo_id = C.registrar_modelo(spark, JDBC_URL, metrics, NUM_TREES, SEED, etiqueta="rf", conn=conn)
        C.escribir_predicciones(JDBC_URL, model, feat, modelo_id, PRED_ESTADO, conn=conn, estado_resuelto=estado)
finally:
    spark.stop()
print(f"Escrito: modelo {version} (id={modelo_id}) + caracteristicas_actividad + predicciones.")
