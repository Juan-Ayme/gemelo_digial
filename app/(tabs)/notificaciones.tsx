import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { MotiView } from "moti";
import {
  Bell,
  BellOff,
  Check,
  Clock,
  Heart,
  Info,
  ShieldAlert,
  Timer,
  Trash2,
} from "lucide-react-native";

import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { Switch } from "@components/ui/Switch";
import { Chip } from "@components/ui/Chip";
import {
  usePermisosNotificacion,
  useSolicitarPermisosNotificacion,
  useHistorialNotificaciones,
  useProgramarRecordatorio,
  useCancelarNotificaciones,
} from "@hooks/useNotificaciones";
import { useSetConsent, useConsents } from "@hooks/useConsents";
import { colors } from "@theme/colors";

const TIPO_CONFIG = {
  peligro: { color: colors.accent.coral, icon: ShieldAlert, label: "Alerta de salud" },
  advertencia: { color: colors.accent.amber, icon: Bell, label: "Advertencia" },
  info: { color: colors.brandCyan, icon: Info, label: "Información" },
  sedentarismo: { color: colors.violet, icon: Timer, label: "Recordatorio" },
  ok: { color: colors.accent.mint, icon: Check, label: "OK" },
};

export default function Notificaciones() {
  const { data: permisos } = usePermisosNotificacion();
  const { data: historial = [] } = useHistorialNotificaciones();
  const { data: consents } = useConsents();
  const solicitarPermisos = useSolicitarPermisosNotificacion();
  const programarRecordatorio = useProgramarRecordatorio();
  const cancelarNotif = useCancelarNotificaciones();
  const setConsent = useSetConsent();
  const [recordatorioActivo, setRecordatorioActivo] = useState(false);

  const notificacionesActivas = consents?.notificaciones ?? false;

  const handleToggleNotificaciones = async (valor: boolean) => {
    if (valor && !permisos?.concedido) {
      const res = await solicitarPermisos.mutateAsync();
      if (!res.concedido) {
        Alert.alert(
          "Permiso denegado",
          "Para activar notificaciones, ve a Ajustes del sistema → ando → Notificaciones.",
        );
        return;
      }
    }
    setConsent.mutate({
      categoria: "notificaciones",
      otorgado: valor,
      finalidad: "Alertas de salud y recordatorios de actividad",
    });
    if (!valor) {
      cancelarNotif.mutate();
      setRecordatorioActivo(false);
    }
  };

  const handleToggleRecordatorio = (valor: boolean) => {
    setRecordatorioActivo(valor);
    if (valor) {
      programarRecordatorio.mutate(undefined, {
        onError: () => Alert.alert("Error", "No se pudo programar el recordatorio."),
      });
    } else {
      cancelarNotif.mutate();
    }
  };

  return (
    <Screen scroll>
      <View className="gap-1">
        <Text className="text-3xl font-bold text-white">Notificaciones</Text>
        <Text className="text-base text-ink-300">
          Alertas de salud y recordatorios de actividad.
        </Text>
      </View>

      {/* ── Banner de estado de permisos ── */}
      {!permisos?.concedido && (
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 300 }}
          className="mt-4 bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 flex-row items-start gap-3"
        >
          <BellOff size={20} color={colors.accent.amber} className="mt-0.5" />
          <View className="flex-1">
            <Text className="text-amber-200 font-semibold">
              Notificaciones sin permiso
            </Text>
            <Text className="text-amber-300/70 text-xs mt-1 leading-4">
              ando no puede enviarte alertas de salud. Activa el permiso para
              recibir avisos cuando tu actividad baje del umbral.
            </Text>
            <Button
              variant="secondary"
              label="Conceder permiso"
              className="mt-3"
              loading={solicitarPermisos.isPending}
              onPress={() => solicitarPermisos.mutate()}
            />
          </View>
        </MotiView>
      )}

      {/* ── Configuración principal ── */}
      <Card glass className="mt-5">
        <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold mb-3">
          Configuración
        </Text>

        <View className="gap-0">
          <Switch
            value={notificacionesActivas}
            onValueChange={handleToggleNotificaciones}
            icon={<Bell size={16} color={notificacionesActivas ? colors.brandCyan : colors.textMuted} />}
            label="Alertas de salud"
            description="Notificaciones cuando se detecta riesgo cardiovascular, sedentarismo prolongado o recuperación."
          />

          <View className="h-px bg-white/8 my-2" />

          <Switch
            value={recordatorioActivo && notificacionesActivas}
            onValueChange={handleToggleRecordatorio}
            disabled={!notificacionesActivas}
            icon={<Timer size={16} color={recordatorioActivo ? colors.violet : colors.textMuted} />}
            label="Recordatorio de movimiento"
            description="Te avisa cada 90 minutos si llevas mucho tiempo sin actividad."
          />
        </View>
      </Card>

      {/* ── Tipos de alertas que envía ando ── */}
      <Card className="mt-4">
        <Text className="text-white font-semibold text-base mb-3">
          ¿Qué notificaciones envía ando?
        </Text>
        {[
          {
            icon: ShieldAlert,
            color: colors.accent.coral,
            titulo: "🔴 Alerta de salud crítica",
            desc: "Frecuencia cardíaca fuera del rango normal o sedentarismo > 2 horas.",
          },
          {
            icon: Bell,
            color: colors.accent.amber,
            titulo: "🟡 Advertencia de actividad",
            desc: "Menos de 5,000 pasos a las 6pm o racha de inactividad prolongada.",
          },
          {
            icon: Timer,
            color: colors.violet,
            titulo: "⏰ Recordatorio de movimiento",
            desc: "Cada 90 minutos si llevas rato quieto. Solo si lo activas.",
          },
          {
            icon: Heart,
            color: colors.accent.mint,
            titulo: "✅ Confirmación positiva",
            desc: "Cuando alcanzas tu meta diaria de pasos. Máximo 1 al día.",
          },
        ].map(({ icon: Icon, color, titulo, desc }) => (
          <View key={titulo} className="flex-row items-start gap-3 py-2.5 border-b border-white/6">
            <View className="w-8 h-8 rounded-xl items-center justify-center mt-0.5" style={{ backgroundColor: `${color}15` }}>
              <Icon size={16} color={color} />
            </View>
            <View className="flex-1">
              <Text className="text-white text-sm font-medium">{titulo}</Text>
              <Text className="text-ink-400 text-xs mt-0.5 leading-4">{desc}</Text>
            </View>
          </View>
        ))}

        <Text className="text-ink-400 text-xs mt-3 text-center">
          Máximo {4} notificaciones por día para no molestarte.
        </Text>
      </Card>

      {/* ── Historial ── */}
      <Card className="mt-4 mb-2">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Clock size={16} color={colors.brandCyan} />
            <Text className="text-white font-semibold text-base">Últimas notificaciones</Text>
          </View>
          {historial.length > 0 && (
            <Chip label={`${historial.length}`} tone="brand" />
          )}
        </View>

        {historial.length === 0 ? (
          <View className="items-center py-6">
            <BellOff size={32} color={colors.textMuted} />
            <Text className="text-ink-400 text-sm mt-3 text-center">
              No se han enviado notificaciones todavía.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {historial.slice(0, 10).map((n, i) => {
              const tipo = (n.alertaId?.includes("sedentarismo")
                ? "sedentarismo"
                : "info") as keyof typeof TIPO_CONFIG;
              const cfg = TIPO_CONFIG[tipo] ?? TIPO_CONFIG.info;
              const Icon = cfg.icon;
              return (
                <MotiView
                  key={n.id}
                  from={{ opacity: 0, translateX: -6 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: i * 40, type: "timing", duration: 250 }}
                  className="flex-row items-start gap-3 bg-white/4 rounded-xl p-3 border border-white/5"
                >
                  <Icon size={14} color={cfg.color} />
                  <View className="flex-1">
                    <Text className="text-white text-xs font-semibold">{n.titulo}</Text>
                    <Text className="text-ink-400 text-[11px] mt-0.5 leading-4">{n.cuerpo}</Text>
                    <Text className="text-ink-500 text-[10px] mt-1">
                      {new Date(n.fecha).toLocaleString("es-PE", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </MotiView>
              );
            })}
          </View>
        )}
      </Card>
    </Screen>
  );
}
