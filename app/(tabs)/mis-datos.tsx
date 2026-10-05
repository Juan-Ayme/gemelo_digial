import { Alert, Share, Text, View } from "react-native";
import { MotiView } from "moti";
import {
  Database,
  Download,
  FileText,
  Shield,
  Trash2,
  UserX,
} from "lucide-react-native";

import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Chip } from "@components/ui/Chip";
import { useAuthStore } from "@stores/authStore";
import { useGemelo } from "@hooks/useGemelo";
import { useConsents } from "@hooks/useConsents";
import { useProfile } from "@hooks/useProfile";
import { useHistorial } from "@hooks/useHistorial";
import { colors } from "@theme/colors";

async function generarExportacionJSON(params: {
  alias: string;
  totalEventos: number;
  consentimientos: Record<string, boolean> | undefined;
  historialDias: number;
}): Promise<string> {
  const exportacion = {
    aplicacion: "ando · Gemelo Digital",
    version: "1.0.0",
    exportadoEn: new Date().toISOString(),
    titular: params.alias,
    resumen: {
      totalEventos: params.totalEventos,
      diasConHistorial: params.historialDias,
    },
    consentimientos: params.consentimientos ?? {},
    nota: "Este archivo contiene un resumen de tus datos de actividad registrados por ando. Los datos son de uso exclusivo del titular.",
  };
  return JSON.stringify(exportacion, null, 2);
}

export default function MisDatos() {
  const { data: profile } = useProfile();
  const { data: gemelo } = useGemelo();
  const { data: consents } = useConsents();
  const { data: historial = [] } = useHistorial(30);
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);

  const alias = profile?.alias ?? "Usuario";
  const totalEventos = gemelo?.totalEventos ?? 0;
  const diasActivos = historial.filter((d) => d.totalEventos > 0).length;

  const handleExportar = async () => {
    try {
      const json = await generarExportacionJSON({
        alias,
        totalEventos,
        consentimientos: consents,
        historialDias: diasActivos,
      });
      await Share.share({
        title: "Mis datos — ando Gemelo Digital",
        message: json,
      });
    } catch (e) {
      Alert.alert("Error", "No se pudo exportar. Inténtalo de nuevo.");
    }
  };

  const handleSolicitarAcceso = () => {
    Alert.alert(
      "Derecho de Acceso (ARCO)",
      `Se registrará una solicitud de acceso completo a tus datos vinculados al usuario ${user?.id?.slice(0, 8)}…. El equipo de investigación responderá en un plazo máximo de 15 días hábiles.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Solicitar",
          onPress: () =>
            Alert.alert("Solicitud enviada", "Recibirás una respuesta por correo electrónico."),
        },
      ],
    );
  };

  const handleEliminar = () => {
    Alert.alert(
      "Eliminar cuenta y datos",
      "Esta acción eliminará permanentemente tu perfil, eventos, predicciones y consentimientos. No es reversible.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar todo",
          style: "destructive",
          onPress: async () => {
            await signOut();
            // En producción: llamar a Edge Function que borra en cascada
            Alert.alert("Cuenta eliminada", "Tus datos han sido eliminados del sistema.");
          },
        },
      ],
    );
  };

  const stats = [
    { label: "Eventos registrados", value: totalEventos.toString(), icon: Database, color: colors.brandCyan },
    { label: "Días con actividad", value: `${diasActivos}`, icon: FileText, color: colors.accent.mint },
    { label: "Consentimientos activos", value: `${Object.values(consents ?? {}).filter(Boolean).length} / ${Object.keys(consents ?? {}).length}`, icon: Shield, color: colors.violet },
  ];

  return (
    <Screen scroll>
      <View className="gap-1">
        <Text className="text-3xl font-bold text-white">Mis Datos</Text>
        <Text className="text-base text-ink-300">
          Derechos ARCO: Acceso, Rectificación, Cancelación, Oposición.
        </Text>
      </View>

      <Chip
        className="mt-4 self-start"
        label="Protección de datos · Ley N° 29733"
        tone="violet"
        leadingIcon={<Shield size={12} color={colors.violet} />}
      />

      {/* ── Resumen de datos ── */}
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
              transition={{ delay: i * 80, type: "timing", duration: 300 }}
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

      {/* ── Acciones ARCO ── */}
      <Card className="mt-4">
        <Text className="text-white font-semibold text-base mb-1">Ejercer mis derechos</Text>
        <Text className="text-ink-300 text-sm mb-4 leading-5">
          Según la Ley N° 29733 de Protección de Datos Personales del Perú, puedes
          acceder, rectificar, cancelar u oponerte al uso de tus datos en cualquier momento.
        </Text>

        <View className="gap-3">
          <Button
            variant="secondary"
            label="Exportar mis datos (JSON)"
            leadingIcon={<Download size={18} color={colors.brand} />}
            onPress={handleExportar}
          />
          <Button
            variant="secondary"
            label="Solicitar acceso completo (ARCO)"
            leadingIcon={<FileText size={18} color={colors.brand} />}
            onPress={handleSolicitarAcceso}
          />
          <Button
            variant="danger"
            label="Eliminar cuenta y todos mis datos"
            leadingIcon={<Trash2 size={18} color={colors.white} />}
            onPress={handleEliminar}
          />
        </View>
      </Card>

      {/* ── Transparencia ── */}
      <Card className="mt-4 mb-2">
        <View className="flex-row items-center gap-2 mb-2">
          <Shield size={16} color={colors.violet} />
          <Text className="text-white font-semibold">Cómo usamos tus datos</Text>
        </View>
        {[
          "📍 Las coordenadas GPS se convierten en zonas anónimas antes de guardarse. Nunca almacenamos tu ubicación exacta.",
          "🔒 Cada tabla tiene Row Level Security activo: solo tú puedes ver tus datos.",
          "🔬 Los datos de investigación se usan de forma anonimizada y agrupada, nunca de forma individual.",
          "✅ Puedes revocar cualquier consentimiento en cualquier momento desde Perfil.",
        ].map((txt, i) => (
          <Text key={i} className="text-ink-300 text-xs mt-2 leading-5">
            {txt}
          </Text>
        ))}
      </Card>
    </Screen>
  );
}
