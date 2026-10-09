import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  FileText,
  FileWarning,
  Lock,
  MapPin,
  Shield,
  Trash2,
  UserX,
} from "lucide-react-native";

import { PageHeader } from "@components/ui/PageHeader";
import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Chip } from "@components/ui/Chip";
import { useAuthStore } from "@stores/authStore";
import { useGemelo } from "@hooks/useGemelo";
import { useConsents } from "@hooks/useConsents";
import { useProfile } from "@hooks/useProfile";
import { useHistorial } from "@hooks/useHistorial";
import { useExportarDatos, useEliminarCuenta } from "@hooks/useExportacion";
import { colors } from "@theme/colors";
import type { ProgresoExportacion } from "@services/exportacion";

function BarraProgreso({ pct, label }: { pct: number; label: string }) {
  return (
    <View className="mt-3">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-ink-300 text-xs">{label}</Text>
        <Text className="text-brand-300 text-xs font-semibold">{pct}%</Text>
      </View>
      <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <MotiView
          animate={{ width: `${pct}%` }}
          transition={{ type: "timing", duration: 300 }}
          className="h-full rounded-full bg-brand-400"
        />
      </View>
    </View>
  );
}

export default function MisDatos() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: gemelo } = useGemelo();
  const { data: consents } = useConsents();
  const { data: historial = [] } = useHistorial(30);
  const user = useAuthStore((s) => s.user);

  const [progreso, setProgreso] = useState<ProgresoExportacion | null>(null);

  const exportar = useExportarDatos((p) => setProgreso(p));
  const eliminar = useEliminarCuenta();

  const alias = profile?.alias ?? "Usuario";
  const totalEventos = gemelo?.totalEventos ?? 0;
  const diasActivos = historial.filter((d) => d.totalEventos > 0).length;
  const consentimientosActivos = Object.values(consents ?? {}).filter(Boolean).length;
  const totalConsentimientos = Object.keys(consents ?? {}).length;

  const handleExportar = () => {
    setProgreso({ paso: "Iniciando…", progresoPct: 0 });
    exportar.mutate(undefined, {
      onSuccess: (ok) => {
        if (!ok) {
          Alert.alert("Sin soporte", "Tu dispositivo no soporta compartir archivos.");
        }
        setTimeout(() => setProgreso(null), 1500);
      },
      onError: () => {
        Alert.alert("Error", "No se pudo generar la exportación. Intenta de nuevo.");
        setProgreso(null);
      },
    });
  };

  const handleSolicitarAcceso = handleExportar;

  const handleEliminar = () => {
    Alert.alert(
      "Eliminar cuenta",
      "Esta acción eliminará PERMANENTEMENTE:\n\n• Tu perfil\n• Todos tus eventos y sensores\n• Historial de consentimientos\n• Predicciones del gemelo\n\nNo es reversible.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Entiendo, eliminar todo",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmación final",
              `¿Seguro que quieres eliminar la cuenta de ${alias}? Esta es tu última oportunidad de cancelar.`,
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Sí, eliminar mi cuenta",
                  style: "destructive",
                  onPress: () => {
                    eliminar.mutate(undefined, {
                      onSuccess: () => {
                        router.replace("/(auth)/welcome" as any);
                      },
                      onError: (error) => {
                        Alert.alert(
                          "Resultado de la eliminación",
                          error.message,
                        );
                      },
                    });
                  },
                },
              ],
            );
          },
        },
      ],
    );
  };

  const stats = [
    {
      label: "Eventos registrados",
      value: totalEventos.toLocaleString("es-PE"),
      icon: Database,
      color: colors.brandCyan,
    },
    {
      label: "Días con actividad",
      value: `${diasActivos}`,
      icon: FileText,
      color: colors.accent.mint,
    },
    {
      label: "Consentimientos activos",
      value: `${consentimientosActivos} / ${totalConsentimientos}`,
      icon: Shield,
      color: colors.violet,
    },
  ];

  return (
    <Screen scroll>
      <PageHeader title="Mis datos" subtitle="Consulta y gestiona tus datos personales." />

      <View className="flex-row flex-wrap gap-2 mt-4">
        <Chip
          label="Ley N° 29733 Perú"
          tone="violet"
          leadingIcon={<Shield size={12} color={colors.violet} />}
        />
        <Chip label="ARCO" tone="brand" />
      </View>

      {/* ── Resumen ── */}
      <Card glass className="mt-5">
        <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold mb-3">
          Tus datos en ando
        </Text>
        <View className="gap-3">
          {stats.map(({ label, value, icon: Icon, color }, i) => (
            <MotiView
              key={label}
              from={{ opacity: 0, translateX: -8 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ delay: i * 70, type: "timing", duration: 280 }}
              className="flex-row items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5"
            >
              <View
                className="w-9 h-9 rounded-xl items-center justify-center"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon size={18} color={color} />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">{value}</Text>
                <Text className="text-ink-400 text-xs">{label}</Text>
              </View>
            </MotiView>
          ))}
        </View>
      </Card>

      {/* ── Exportación real ── */}
      <Card className="mt-4">
        <View className="flex-row items-center gap-2 mb-1">
          <Download size={18} color={colors.brandCyan} />
          <Text className="text-white font-semibold text-base">Exportar mis datos</Text>
        </View>
        <Text className="text-ink-300 text-sm mb-4 leading-5">
          Genera un archivo JSON con{" "}
          <Text className="text-white font-semibold">todos</Text> tus datos: perfil,
          eventos disponibles, consentimientos, correcciones, predicciones,
          apariencia, metas y tu plan personal. Puedes compartirlo por correo, Drive o cualquier app.
        </Text>

        {/* Barra de progreso */}
        {progreso && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4"
          >
            <BarraProgreso pct={progreso.progresoPct} label={progreso.paso} />
          </MotiView>
        )}

        <Button
          variant="secondary"
          label={exportar.isPending ? "Preparando exportación…" : "Descargar mis datos (JSON)"}
          loading={exportar.isPending}
          leadingIcon={<Download size={18} color={colors.brand} />}
          onPress={handleExportar}
        />

        <Text className="text-[10px] text-ink-500 mt-2 text-center">
          Incluye {totalEventos} eventos · {diasActivos} días de actividad
        </Text>
      </Card>

      {/* ── Derechos ARCO ── */}
      <Card className="mt-4">
        <View className="flex-row items-center gap-2 mb-3">
          <FileText size={18} color={colors.violet} />
          <Text className="text-white font-semibold text-base">Ejercer derechos ARCO</Text>
        </View>
        <Text className="text-ink-300 text-sm mb-4 leading-5">
          Acceso · Rectificación · Cancelación · Oposición.{"\n"}
          Derechos reconocidos por la Ley N° 29733 de Protección de Datos Personales del Perú.
        </Text>
        <Button
          variant="secondary"
          label="Obtener copia de mis registros"
          leadingIcon={<FileWarning size={18} color={colors.brand} />}
          onPress={handleSolicitarAcceso}
        />
      </Card>

      {/* ── Transparencia ── */}
      <Card className="mt-4">
        <View className="flex-row items-center gap-2 mb-2">
          <Shield size={16} color={colors.violet} />
          <Text className="text-white font-semibold">Cómo usamos tus datos</Text>
        </View>
        {[
          { icon: MapPin, color: colors.accent.mint, txt: "Las coordenadas GPS se convierten en zonas anónimas antes de guardarse. Nunca almacenamos tu ubicación exacta." },
          { icon: Lock, color: colors.brandCyan, txt: "RLS activo: solo tú accedes a tus datos. Los roles administrativos del servidor tienen permisos distintos." },
          { icon: Cpu, color: colors.violet, txt: "Las estimaciones locales usan reglas generales. Participar en investigación requiere un consentimiento separado." },
          { icon: CheckCircle2, color: colors.accent.mint, txt: "Puedes revocar cualquier consentimiento en cualquier momento desde la sección Perfil → Consentimientos." },
        ].map(({ icon: TIcon, color, txt }, i) => (
          <View key={i} className="flex-row items-start gap-2.5 mt-2.5">
            <View className="w-5 h-5 rounded-md items-center justify-center mt-0.5" style={{ backgroundColor: `${color}18` }}>
              <TIcon size={12} color={color} />
            </View>
            <Text className="flex-1 text-ink-300 text-xs leading-5">
              {txt}
            </Text>
          </View>
        ))}
      </Card>

      {/* ── Zona de peligro ── */}
      <Card className="mt-4 mb-2 border border-rose-500/25">
        <View className="flex-row items-center gap-2 mb-2">
          <AlertTriangle size={18} color={colors.accent.coral} />
          <Text className="text-rose-300 font-semibold text-base">Zona de peligro</Text>
        </View>
        <Text className="text-ink-300 text-sm mb-4 leading-5">
          Eliminar tu cuenta borra{" "}
          <Text className="text-white font-semibold">todos</Text> tus datos de los
          servidores de forma permanente e irreversible.
          {"\n\n"}Esta acción no puede deshacerse. Exporta tus datos primero si deseas conservarlos.
        </Text>

        {eliminar.isPending && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3"
          >
            <Text className="text-rose-300 text-sm text-center font-semibold">
              Eliminando datos… por favor espera.
            </Text>
          </MotiView>
        )}

        <Button
          variant="danger"
          label="Eliminar cuenta y todos mis datos"
          loading={eliminar.isPending}
          leadingIcon={<Trash2 size={18} color="#fff" />}
          onPress={handleEliminar}
        />
        <Text className="text-rose-400/60 text-[10px] mt-2 text-center">
          ID de usuario: {user?.id?.slice(0, 12)}…
        </Text>
      </Card>
    </Screen>
  );
}
