"""
Bootstrap sintético — Random Forest de arranque en frío
=======================================================

Entrena el modelo de "próxima actividad" con rutinas cotidianas GENERADAS
(no reales), para tener un modelo funcionando ANTES de acumular datos propios.
Usa exactamente las mismas features que el pipeline real (common.py), así el
modelo encaja con lo que la app produce.

Modos:
- Sin nada: entrena y muestra métricas (no necesita Supabase).
- WRITE_BACK=1 + SUPABASE_DB_URL: registra el modelo en `versiones_modelo`
  (NO escribe caracteristicas/predicciones sintéticas: sus usuarios son ficticios
  y romperían la FK a perfiles).
- REAL_USER_ID=<uuid>: aplica el modelo a los eventos REALES de ese usuario y
  escribe UNA predicción para él (la app puede mostrar una predicción del RF
  aunque tenga pocos datos propios).
"""

import datetime as dt
import os
import random

import common as C
from pyspark.sql import functions as F, types as T

WRITE_BACK = os.environ.get("WRITE_BACK", "0") == "1"
JDBC_URL = os.environ.get("SUPABASE_DB_URL")
REAL_USER_ID = os.environ.get("REAL_USER_ID")
PRED_ESTADO = os.environ.get("PRED_ESTADO", "vigente")
NUM_TREES = int(os.environ.get("NUM_TREES", "150"))
N_USUARIOS = int(os.environ.get("N_USUARIOS", "40"))
N_DIAS = int(os.environ.get("N_DIAS", "21"))
SEED = 42
random.seed(SEED)


def genera_dia(uid: str, fecha: dt.date):
    """Secuencia realista de un día: pares (evento_actividad, evento_pasos)."""
    filas = []
    finde = fecha.weekday() >= 5
    if finde:
        plan = [(8, "permanencia", "Hogar"), (10, "ocio", "Hogar"),
                (12, "actividad_fisica", "Tránsito"), (15, "estudio", "Hogar"),
                (17, "ocio", "Zona común"), (19, "descanso", "Hogar")]
    else:
        plan = [(7, "permanencia", "Hogar"), (8, "desplazamiento", "Tránsito"),
                (9, "trabajo", "Trabajo"), (12, "descanso", "Trabajo"),
                (14, "trabajo", "Trabajo"), (17, "actividad_fisica", "Zona común"),
                (18, "desplazamiento", "Tránsito"), (19, "estudio", "Hogar"),
                (21, "ocio", "Hogar")]
    for hora, act, zona in plan:
        if random.random() < 0.15:  # ruido: a veces se salta un bloque
            continue
        h = max(0, min(23, hora + random.randint(-1, 1)))
        inicio = dt.datetime(fecha.year, fecha.month, fecha.day, h, random.randint(0, 59))
        fin = inicio + dt.timedelta(minutes=random.randint(20, 90))
        pasos = {"desplazamiento": random.randint(200, 600),
                 "actividad_fisica": random.randint(300, 900)}.get(act, random.randint(0, 60))
        filas.append((uid, "ventana_actividad", act, None, None, zona, inicio, fin))
        filas.append((uid, "pasos", None, float(pasos), "pasos", zona, inicio, fin))
    return filas


filas = []
base = dt.date.today() - dt.timedelta(days=N_DIAS)
for u in range(N_USUARIOS):
    uid = f"synthetic-{u:03d}"
    for d in range(N_DIAS):
        filas += genera_dia(uid, base + dt.timedelta(days=d))

schema = T.StructType([
    T.StructField("usuario_id", T.StringType()),
    T.StructField("tipo_evento", T.StringType()),
    T.StructField("valor_texto", T.StringType()),
    T.StructField("valor_numerico", T.DoubleType()),
    T.StructField("unidad", T.StringType()),
    T.StructField("zona_general", T.StringType()),
    T.StructField("inicio_en", T.TimestampType()),
    T.StructField("fin_en", T.TimestampType()),
])

spark = C.crear_spark("ando-bootstrap")
eventos = spark.createDataFrame(filas, schema)
print(f"Eventos sintéticos: {eventos.count()}  ({N_USUARIOS} usuarios x {N_DIAS} días)")

feat = C.construir_features(eventos)
model, metrics = C.entrenar_rf(feat, NUM_TREES, SEED)
print("Métricas (bootstrap sintético):", metrics)

if not (WRITE_BACK and JDBC_URL):
    print("(Solo entrenamiento local. Exporta WRITE_BACK=1 y SUPABASE_DB_URL para registrar el modelo.)")
    spark.stop()
    raise SystemExit(0)

version, modelo_id = C.registrar_modelo(
    spark, JDBC_URL, {**metrics, "origen": "bootstrap_sintetico"}, NUM_TREES, SEED, etiqueta="rf-bootstrap"
)
print(f"Modelo de arranque registrado en versiones_modelo: {version} (id={modelo_id})")

# Opcional: usar el modelo para predecir sobre los eventos REALES de un usuario.
if REAL_USER_ID:
    ev_real = C.leer_jdbc(spark, JDBC_URL, "eventos_crudos").select(
        "usuario_id", "valor_texto", "unidad", "valor_numerico", "zona_general", "inicio_en", "fin_en"
    ).filter(F.col("usuario_id") == REAL_USER_ID)
    feat_real = C.construir_features(ev_real)
    if feat_real.limit(1).count() > 0:
        C.escribir_predicciones(JDBC_URL, model, feat_real, modelo_id, PRED_ESTADO)
        print(f"Predicción escrita para el usuario real {REAL_USER_ID}.")
    else:
        print(f"El usuario {REAL_USER_ID} aún no tiene eventos; captura algo en la app primero.")

spark.stop()
