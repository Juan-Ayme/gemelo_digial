"""
Clasificador de actividad con DATASET REAL — UCI HAR + Random Forest (Spark MLlib)
==================================================================================

Dataset REAL (no sintético): "Human Activity Recognition Using Smartphones"
(UCI ML Repository, dataset 240). 30 personas reales llevando un smartphone en la
cintura; acelerómetro + giroscopio; 6 actividades: WALKING, WALKING_UPSTAIRS,
WALKING_DOWNSTAIRS, SITTING, STANDING, LAYING. 10.299 muestras, 561 features.

El script DESCARGA el dataset automáticamente si no existe (no hay que bajar nada
a mano), entrena un Random Forest y muestra accuracy, F1 y matriz de confusión.

Uso (Colab o PC con Java):
    pip install pyspark pandas
    python pipeline/har_clasificador.py
"""

import os
import urllib.request
import zipfile

import pandas as pd
from pyspark.sql import SparkSession
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.classification import RandomForestClassifier
from pyspark.ml.evaluation import MulticlassClassificationEvaluator

HAR_DIR = os.environ.get("HAR_DIR", "UCI HAR Dataset")
URL = "https://d396qusza40orc.cloudfront.net/getdata/projectfiles/UCI%20HAR%20Dataset.zip"
NUM_TREES = int(os.environ.get("NUM_TREES", "100"))
SEED = 42

ACTIVIDADES = {
    0: "WALKING", 1: "WALKING_UPSTAIRS", 2: "WALKING_DOWNSTAIRS",
    3: "SITTING", 4: "STANDING", 5: "LAYING",
}


def asegurar_dataset():
    """Descarga y descomprime el dataset real si no está presente."""
    if os.path.isdir(HAR_DIR):
        print(f"Dataset ya presente en '{HAR_DIR}'.")
        return
    zip_path = "UCI_HAR_Dataset.zip"
    print(f"Descargando dataset REAL UCI HAR (~58 MB) desde:\n  {URL}")
    try:
        urllib.request.urlretrieve(URL, zip_path)
        with zipfile.ZipFile(zip_path) as z:
            z.extractall(".")  # crea la carpeta 'UCI HAR Dataset/'
        print(f"Dataset listo en '{HAR_DIR}'.")
    except Exception as e:
        raise SystemExit(
            f"No se pudo descargar automáticamente ({e}).\n"
            "Descárgalo a mano de https://archive.ics.uci.edu/dataset/240/ , "
            "descomprime y apunta HAR_DIR a la carpeta 'UCI HAR Dataset'."
        )


def carga(split: str) -> pd.DataFrame:
    x = pd.read_csv(f"{HAR_DIR}/{split}/X_{split}.txt", sep=r"\s+", header=None)
    y = pd.read_csv(f"{HAR_DIR}/{split}/y_{split}.txt", sep=r"\s+", header=None)
    x.columns = [f"f{i}" for i in range(x.shape[1])]
    x["label"] = (y[0] - 1).astype("int")  # etiquetas 1..6 -> 0..5
    return x


asegurar_dataset()

spark = SparkSession.builder.appName("ando-har").getOrCreate()

tr = spark.createDataFrame(carga("train"))
te = spark.createDataFrame(carga("test"))
feat_cols = [c for c in tr.columns if c.startswith("f")]
print(f"Train: {tr.count()} muestras | Test: {te.count()} muestras | Features: {len(feat_cols)}")

asm = VectorAssembler(inputCols=feat_cols, outputCol="features")
rf = RandomForestClassifier(featuresCol="features", labelCol="label", numTrees=NUM_TREES, seed=SEED)
model = rf.fit(asm.transform(tr))
pred = model.transform(asm.transform(te))


def metrica(nombre):
    return MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction", metricName=nombre).evaluate(pred)


print("\n=== UCI HAR — Random Forest (dataset REAL) ===")
print(f"Accuracy : {metrica('accuracy'):.3f}")
print(f"F1       : {metrica('f1'):.3f}")
print(f"Precision: {metrica('weightedPrecision'):.3f}")
print(f"Recall   : {metrica('weightedRecall'):.3f}")

# Matriz de confusión con nombres de actividad (para la exposición).
cm = pred.select("label", "prediction").toPandas()
cm["real"] = cm["label"].map(ACTIVIDADES)
cm["predicho"] = cm["prediction"].astype(int).map(ACTIVIDADES)
print("\nMatriz de confusión (filas = real, columnas = predicho):")
print(pd.crosstab(cm["real"], cm["predicho"]))

spark.stop()
