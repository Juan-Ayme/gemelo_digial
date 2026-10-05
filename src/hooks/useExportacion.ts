import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@stores/authStore";
import { useProfile } from "@hooks/useProfile";
import {
  generarExportacionCompleta,
  exportarYCompartir,
  eliminarTodosLosDatos,
  type ProgresoExportacion,
} from "@services/exportacion";

export function useExportarDatos(onProgress?: (p: ProgresoExportacion) => void) {
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const { data: profile } = useProfile();
  const alias = profile?.alias ?? "Usuario";

  return useMutation({
    mutationFn: async () => {
      const exportacion = await generarExportacionCompleta(userId, alias, onProgress);
      return exportarYCompartir(exportacion, onProgress);
    },
  });
}

export function useEliminarCuenta() {
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const signOut = useAuthStore((s) => s.signOut);

  return useMutation({
    mutationFn: async () => {
      await eliminarTodosLosDatos(userId);
      await signOut();
    },
  });
}
