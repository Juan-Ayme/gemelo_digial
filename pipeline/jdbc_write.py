"""Escritura parametrizada usando el driver JDBC que Spark ya carga."""

import datetime as dt
import re
from contextlib import contextmanager


def identificador(nombre):
    if not re.fullmatch(r"[a-z_][a-z_0-9]*", nombre):
        raise ValueError("Identificador SQL no permitido")
    return '"' + nombre + '"'


@contextmanager
def transaccion(spark, url):
    conn = spark._jvm.java.sql.DriverManager.getConnection(url)
    try:
        conn.setAutoCommit(False)
        yield conn
        conn.commit()
    except BaseException:
        conn.rollback()
        raise
    finally:
        conn.close()


def enlazar(stmt, valores, jvm):
    for i, valor in enumerate(valores, 1):
        if valor is None:
            stmt.setObject(i, None)
        elif isinstance(valor, bool):
            stmt.setBoolean(i, valor)
        elif isinstance(valor, int):
            stmt.setLong(i, valor)
        elif isinstance(valor, float):
            stmt.setDouble(i, valor)
        elif isinstance(valor, dt.datetime):
            # Los TimestampType de Spark llegan como datetime sin zona.
            stmt.setTimestamp(i, jvm.java.sql.Timestamp.valueOf(str(valor)))
        else:
            stmt.setString(i, str(valor))


def sql_insert(tabla, columnas, claves=()):
    nombres = ','.join(identificador(c) for c in columnas)
    sql = f'INSERT INTO public.{identificador(tabla)} ({nombres}) VALUES ('
    sql += ','.join('?' for _ in columnas) + ')'
    if claves:
        conflicto = ','.join(identificador(c) for c in claves)
        cambios = ','.join(
            f'{identificador(c)}=EXCLUDED.{identificador(c)}'
            for c in columnas if c not in claves
        )
        sql += f' ON CONFLICT ({conflicto}) DO UPDATE SET {cambios}'
    return sql


def escribir_filas(conn, jvm, tabla, columnas, filas, claves=(), lote=500):
    """Flujo acotado en memoria; la transacción la controla quien llama."""
    stmt = conn.prepareStatement(sql_insert(tabla, columnas, claves))
    try:
        pendientes = 0
        for fila in filas:
            enlazar(stmt, fila, jvm)
            stmt.addBatch()
            pendientes += 1
            if pendientes == lote:
                stmt.executeBatch()
                stmt.clearBatch()
                pendientes = 0
        if pendientes:
            stmt.executeBatch()
    finally:
        stmt.close()
