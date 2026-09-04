"""
Clasificador de actividad — dataset público UCI HAR + Random Forest (Spark MLlib)
=================================================================================

Resuelve el OTRO sub-problema: reconocer la actividad ACTUAL a partir de señales
del acelerómetro/giroscopio (WALKING, WALKING_UPSTAIRS, WALKING_DOWNSTAIRS,
SITTING, STANDING, LAYING). Es la base para, a futuro, reemplazar la heurística
del acelerómetro de la app por un clasificador entrenado con datos reales.

Dataset: "Human Activity Recognition Using Smartphones" (UCI ML Repository).
Descárgalo y descomprímelo una vez; apunta HAR_DIR a la carpeta 'UCI HAR Dataset'.
Ver pipeline/README.md.
"""

import os

import pandas as pd
from pyspark.sql import SparkSession
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml.evaluation import MulticlassClassificationEvaluator

HAR_DIR = os.environ.get("HAR_DIR", "UCI HAR Dataset")
NUM_TREES = int(os.environ.get("NUM_TREES", "100"))
SEED = 42

ACTIVIDADES = {
    0: "WALKING", 1: "WALKING_UPSTAIRS", 2: "WALKING_DOWNSTAIRS",
    3: "SITTING", 4: "STANDING", 5: "LAYING",
}


def carga(split: str) -> pd.DataFrame:
    x = pd.read_csv(f"{HAR_DIR}/{split}/X_{split}.txt", sep=r"\s+", header=None)
    y = pd.read_csv(f"{HAR_DIR}/{split}/y_{split}.txt", sep=r"\s+", header=None)
    x.columns = [f"f{i}" for i in range(x.shape[1])]
    x["label"] = (y[0] - 1).astype("int")  # etiquetas 1..6 -> 0..5
    return x


spark = SparkSession.builder.appName("ando-har").getOrCreate()

tr = spark.createDataFrame(carga("train"))
te = spark.createDataFrame(carga("test"))
feat_cols = [c for c in tr.columns if c.startswith("f")]

asm = VectorAssembler(inputCols=feat_cols, outputCol="features")
rf = RandomForestClassifier(featuresCol="features", labelCol="label", numTrees=NUM_TREES, seed=SEED)
model = rf.fit(asm.transform(tr))
pred = model.transform(asm.transform(te))

acc = MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction", metricName="accuracy").evaluate(pred)
f1 = MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction", metricName="f1").evaluate(pred)
print(f"\n=== UCI HAR — Random Forest ===")
print(f"Accuracy: {acc:.3f}   F1: {f1:.3f}")
print("Clases:", ACTIVIDADES)

spark.stop()
