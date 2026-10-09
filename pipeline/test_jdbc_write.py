"""Regresiones sin credenciales ni conexión a Supabase."""

import unittest
import sqlite3
from unittest.mock import Mock

import jdbc_write as J


class JdbcWriteTests(unittest.TestCase):
    def test_repetir_ventana_actualiza_sin_duplicar(self):
        # SQLite también admite ON CONFLICT; comprueba la semántica sin Supabase.
        with sqlite3.connect(":memory:") as db:
            db.execute("ATTACH DATABASE ':memory:' AS public")
            db.execute("CREATE TABLE public.caracteristicas_actividad (usuario_id TEXT, ventana_inicio TEXT, ventana_fin TEXT, etiqueta_siguiente TEXT, UNIQUE(usuario_id, ventana_inicio, ventana_fin))")
            sql = J.sql_insert("caracteristicas_actividad",
                               ["usuario_id", "ventana_inicio", "ventana_fin", "etiqueta_siguiente"],
                               ["usuario_id", "ventana_inicio", "ventana_fin"])
            db.execute(sql, ("usuario", "inicio", "fin", None))
            db.execute(sql, ("usuario", "inicio", "fin", "descanso"))
            db.execute(sql, ("usuario", "inicio", "fin", "descanso"))
            filas = db.execute("SELECT etiqueta_siguiente FROM public.caracteristicas_actividad").fetchall()
            self.assertEqual(filas, [("descanso",)])

    def test_upsert_conserva_clave_y_actualiza_etiqueta(self):
        sql = J.sql_insert("caracteristicas_actividad",
                           ["usuario_id", "ventana_inicio", "ventana_fin", "etiqueta_siguiente"],
                           ["usuario_id", "ventana_inicio", "ventana_fin"])
        self.assertIn('ON CONFLICT ("usuario_id","ventana_inicio","ventana_fin")', sql)
        self.assertTrue(sql.endswith('DO UPDATE SET "etiqueta_siguiente"=EXCLUDED."etiqueta_siguiente"'))
        self.assertEqual(sql.count('?'), 4)

    def test_identificadores_rechazan_sql(self):
        with self.assertRaises(ValueError):
            J.sql_insert("tabla; DROP TABLE perfiles", ["id"])

    def test_transaccion_confirma_y_cierra(self):
        spark = Mock()
        conn = spark._jvm.java.sql.DriverManager.getConnection.return_value
        with J.transaccion(spark, "jdbc:prueba") as actual:
            self.assertIs(actual, conn)
        conn.setAutoCommit.assert_called_once_with(False)
        conn.commit.assert_called_once()
        conn.rollback.assert_not_called()
        conn.close.assert_called_once()

    def test_fallo_publicacion_revierte_y_cierra(self):
        spark = Mock()
        conn = spark._jvm.java.sql.DriverManager.getConnection.return_value
        with self.assertRaisesRegex(RuntimeError, "predicciones"):
            with J.transaccion(spark, "jdbc:prueba"):
                raise RuntimeError("fallaron predicciones")
        conn.commit.assert_not_called()
        conn.rollback.assert_called_once()
        conn.close.assert_called_once()

    def test_fallo_commit_revierte(self):
        spark = Mock()
        conn = spark._jvm.java.sql.DriverManager.getConnection.return_value
        conn.commit.side_effect = RuntimeError("commit")
        with self.assertRaises(RuntimeError):
            with J.transaccion(spark, "jdbc:prueba"):
                pass
        conn.rollback.assert_called_once()
        conn.close.assert_called_once()

    def test_lotes_y_valores_parametrizados(self):
        conn, jvm = Mock(), Mock()
        stmt = conn.prepareStatement.return_value
        J.escribir_filas(conn, jvm, "tabla", ["id", "valor"],
                         [(1, "O'Hara"), (2, None), (3, 0.5)], lote=2)
        self.assertEqual(stmt.executeBatch.call_count, 2)
        self.assertEqual(stmt.addBatch.call_count, 3)
        stmt.setString.assert_called_once_with(2, "O'Hara")
        stmt.setObject.assert_called_once_with(2, None)
        stmt.setDouble.assert_called_once_with(2, 0.5)
        stmt.close.assert_called_once()
        conn.commit.assert_not_called()

    def test_fallo_lote_cierra_statement_y_propaga(self):
        conn = Mock()
        stmt = conn.prepareStatement.return_value
        stmt.executeBatch.side_effect = RuntimeError("base")
        with self.assertRaises(RuntimeError):
            J.escribir_filas(conn, Mock(), "tabla", ["id"], [(1,)])
        stmt.close.assert_called_once()


if __name__ == "__main__":
    unittest.main()
