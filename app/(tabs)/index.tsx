import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ActivitySquare,
  Compass,
  Footprints,
  HeartPulse,
  MoonStar,
  Radio,
  Sparkles,
  Timer,
} from "lucide-react-native";

import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { Button } from "@components/ui/Button";
import { AnimatedNumber } from "@components/ui/AnimatedNumber";
import { AlertaSaludCard } from "@components/ui/AlertaSaludCard";
import { ValidacionActividadCard } from "@components/ui/ValidacionActividadCard";
import { NuevaZonaCard } from "@components/ui/NuevaZonaCard";
import { ConfianzaRing } from "@components/gemelo/ConfianzaRing";
import { useProfile } from "@hooks/useProfile";
import { useConsents } from "@hooks/useConsents";
import { useGemelo, useSimularCaptura, useCapturarSensores } from "@hooks/useGemelo";
import { useAlertas } from "@hooks/useAlertas";
import { useAliasZonas } from "@hooks/useZonas";
import { nombreCortoZona } from "@services/zonas";
import { ACTIVIDAD_LABELS } from "@services/types";
import { colors } from "@theme/colors";

export default function Hoy() {
  const { data: profile } = useProfile();
  const { data: gemelo } = useGemelo();
  const { data: consents } = useConsents();
  const { data: aliasZonas } = useAliasZonas();
  const simular = useSimularCaptura();
  const capturar = useCapturarSensores();
  const { alertas } = useAlertas();

  // IDs de alertas descartadas por el usuario en esta sesión
  const [descartadas, setDescartadas] = useState<Set<string>>(new Set());
  const [zonaDescartada, setZonaDescartada] = useState<string | null>(null);
  const alertasVisibles = alertas.filter((a) => !descartadas.has(a.id));

  const zonaActual = gemelo?.zonaActual;
  const zonaSinAlias =
    zonaActual &&
    zonaActual !== "—" &&
    !aliasZonas?.[zonaActual] &&
    zonaDescartada !== zonaActual
      ? zonaActual
      : null;

  const alias = profile?.alias ?? "Usuario";
  const hoy = format(new Date(), "EEEE d 'de' MMMM", { locale: es });
  const prediccion = gemelo?.prediccion ?? null;
  const sinDatos = (gemelo?.totalEventos ?? 0) === 0;
  const algunConsent = consents ? Object.values(consents).some(Boolean) : false;

  return (
    <Screen scroll>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xs uppercase tracking-[3px]" style={{ color: colors.brandCyan }}>
            {hoy}
          </Text>
          <Text className="text-3xl font-bold text-white mt-1">Hola, {alias}</Text>
        </View>
        <Chip
          label="Gemelo activo"
          tone="mint"
          leadingIcon={<Sparkles size={12} color={colors.accent.mint} />}
        />
      </View>

      {prediccion ? (
        <Card hero className="mt-6" delay={80}>
          <View className="flex-row items-center gap-4">
            <ConfianzaRing probabilidad={prediccion.probabilidad} />
            <View className="flex-1">
              <Text className="text-[11px] uppercase tracking-widest text-ink-300">
                Próxima actividad probable
              </Text>
              <Text className="text-2xl font-bold text-white mt-1">
                {ACTIVIDAD_LABELS[prediccion.actividad] ?? prediccion.actividad}
              </Text>
              <Text className="text-sm text-ink-300 mt-1">
                Próximos {prediccion.horizonteMin} min · En tiempo real
              </Text>
            </View>
          </View>
          <View className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-3">
            <Text className="text-sm text-ink-100 leading-5">{prediccion.explicacion}</Text>
          </View>
        </Card>
      ) : (
        <Card hero className="mt-6" delay={80}>
          <Text className="text-lg font-semibold text-white">Tu gemelo está despertando</Text>
          <Text className="text-sm text-ink-300 mt-1 leading-5">
            Registra un par de ventanas de actividad y empezaré a anticipar tu próxima
            actividad.
          </Text>
        </Card>
      )}

      {/* ── Calibración / Feedback de actividad (Ground Truth) ── */}
      <ValidacionActividadCard
        prediccion={prediccion}
        zonaActual={gemelo?.zonaActual}
        delay={120}
      />

      {/* ── Sugerencia contextual para etiquetar nueva zona detectada ── */}
      {zonaSinAlias && (
        <NuevaZonaCard
          codigoZona={zonaSinAlias}
          onDescartar={() => setZonaDescartada(zonaSinAlias)}
        />
      )}

      <View className="mt-4 flex-row gap-3">
        <StatTile icon={<Footprints size={18} color={colors.brandCyan} />} label="Pasos" value={gemelo?.pasosHoy ?? 0} delay={140} />
        <StatTile icon={<Timer size={18} color={colors.accent.amber} />} label="Min. activos" value={gemelo?.minutosActivos ?? 0} delay={180} />
      </View>
      <View className="mt-3 flex-row gap-3">
        <StatTile icon={<MoonStar size={18} color={colors.accent.violet} />} label="Descanso" value={`${Math.round((gemelo?.minutosDescanso ?? 0) / 60)} h`} delay={220} />
        <StatTile icon={<Compass size={18} color={colors.accent.mint} />} label="Zona" value={nombreCortoZona(gemelo?.zonaActual, aliasZonas)} delay={260} />
      </View>

      {/* ── Alertas de salud ────────────────────────────────────────── */}
      {alertasVisibles.length > 0 && (
        <View className="mt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <HeartPulse size={18} color={colors.accent.coral} />
            <Text className="text-white font-semibold text-base">Alertas de salud</Text>
            <View className="ml-auto bg-white/10 rounded-full px-2 py-0.5">
              <Text className="text-xs text-ink-300 font-semibold">
                {alertasVisibles.length}
              </Text>
            </View>
          </View>
          <View className="gap-3">
            {alertasVisibles.map((alerta, i) => (
              <AlertaSaludCard
                key={alerta.id}
                alerta={alerta}
                delay={i * 60}
                onDescartar={(id) =>
                  setDescartadas((prev) => new Set([...prev, id]))
                }
              />
            ))}
          </View>
        </View>
      )}

      <Card glass className="mt-6" delay={300}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <View className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 items-center justify-center">
              <Radio size={16} color={colors.brandCyan} />
            </View>
            <View>
              <Text className="text-base font-semibold text-white">Monitoreo de sensores</Text>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <View className="w-2 h-2 rounded-full bg-accent-mint" />
                <Text className="text-xs text-accent-mint font-medium">Captura pasiva activa</Text>
              </View>
            </View>
          </View>
          <Chip label="En segundo plano" tone="mint" />
        </View>

        <Text className="text-xs text-ink-300 mt-3 leading-5">
          Tus sensores registran movimiento, zona general y pasos periódicamente de forma automática. No necesitas mantener la pantalla encendida ni pulsar botones manuales.
        </Text>

        <View className="flex-row gap-2 mt-4">
          <View className="flex-1">
            <Button
              size="sm"
              variant="secondary"
              label="Sincronizar ahora"
              loading={capturar.isPending}
              onPress={() => {
                if (!algunConsent) {
                  Alert.alert(
                    "Sin permisos",
                    "Activa al menos un consentimiento en Perfil (actividad, pasos o zona) para leer tus sensores.",
                  );
                  return;
                }
                capturar.mutate(consents!);
              }}
            />
          </View>
          <View className="flex-1">
            <Button
              size="sm"
              variant="ghost"
              label={sinDatos ? "Dato de prueba" : "Añadir demo"}
              loading={simular.isPending}
              onPress={() => simular.mutate()}
            />
          </View>
        </View>

        {capturar.isError ? (
          <Text className="text-xs text-error mt-2">
            {(capturar.error as Error)?.message === "sin-sensores"
              ? "No hay sensores disponibles o autorizados. Revisa los permisos del sistema y tus consentimientos."
              : "No se pudo guardar la captura. Revisa tu conexión o el esquema de Supabase."}
          </Text>
        ) : null}
      </Card>
    </Screen>
  );
}

function StatTile({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  delay?: number;
}) {
  const isStringLong = typeof value === "string" && value.length > 6;
  return (
    <Card className="flex-1" delay={delay}>
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-[11px] uppercase tracking-widest text-ink-300">{label}</Text>
      </View>
      {typeof value === "number" ? (
        <AnimatedNumber
          value={value}
          format={(n) => n.toLocaleString("es-PE")}
          className="text-2xl font-bold text-white mt-2"
        />
      ) : (
        <Text
          numberOfLines={1}
          className={`${isStringLong ? "text-lg" : "text-2xl"} font-bold text-white mt-2`}
        >
          {value}
        </Text>
      )}
    </Card>
  );
}
