import { useState } from "react";
import { useRouter } from "expo-router";
import { Alert, Pressable, RefreshControl, Text, View } from "react-native";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Compass,
  ChevronRight,
  Footprints,
  HeartPulse,
  MoonStar,
  Radio,
  Sparkles,
  Timer,
} from "lucide-react-native";

import { PageHeader } from "@components/ui/PageHeader";
import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { Button } from "@components/ui/Button";
import { AnimatedNumber } from "@components/ui/AnimatedNumber";
import { AlertaSaludCard } from "@components/ui/AlertaSaludCard";
import { ValidacionActividadCard } from "@components/ui/ValidacionActividadCard";
import { NuevaZonaCard } from "@components/ui/NuevaZonaCard";
import { MiImpactoCard } from "@components/ui/MiImpactoCard";
import { ConfianzaRing } from "@components/gemelo/ConfianzaRing";
import { useProfile } from "@hooks/useProfile";
import { useConsents } from "@hooks/useConsents";
import { useGemelo, useSimularCaptura, useCapturarSensores, useEstadoCaptura, useActualizarLecturasAlVolver } from "@hooks/useGemelo";
import { useAlertas } from "@hooks/useAlertas";
import { useAliasZonas } from "@hooks/useZonas";
import { nombreCortoZona } from "@services/zonas";
import { ACTIVIDAD_LABELS } from "@services/types";
import { useAuthStore } from "@stores/authStore";
import { colors } from "@theme/colors";

export default function Hoy() {
  const router = useRouter();
  useActualizarLecturasAlVolver();
  const demoMode = useAuthStore(s => s.demoMode);
  const { sync, bg, retry } = useEstadoCaptura();
  const { data: profile } = useProfile();
  const { data: gemelo, isLoading, error, refetch } = useGemelo();
  const [actualizando, setActualizando] = useState(false);
  const actualizar = async () => {
    setActualizando(true);
    try { await Promise.allSettled([refetch(), sync.refetch(), bg.refetch()]); }
    finally { setActualizando(false); }
  };
  const { data: consents, isLoading: cargandoPermisos } = useConsents();
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
  const algunConsent = !!consents && [consents.actividad, consents.pasos, consents.sueno, consents.zona_general, consents.fisiologia, consents.wearable].some(Boolean);
  const esRF = gemelo?.fuentePrediccion === "rf";
  const ultimaHora = gemelo?.ultimaLectura ? format(new Date(gemelo.ultimaLectura), "HH:mm") : null;
  const disponible = (codigo: string) => gemelo?.fuentes.some(f => f.codigo === codigo && f.disponible);
  // La confirmación se refiere al último registro, nunca a una actividad futura.
  const lecturaReciente = gemelo?.ultimaActividadEn && Date.now() - Date.parse(gemelo.ultimaActividadEn) <= 90 * 60000;
  const actividadParaConfirmar = lecturaReciente && gemelo?.ultimaActividad ? {
    actividad: gemelo.ultimaActividad, probabilidad: 0, horizonteMin: 0,
    variablesRelevantes: [], explicacion: "Última actividad registrada", generadaEn: gemelo.ultimaActividadEn!,
  } : null;

  const registrarMomento = () => {
    if (!consents) {
      Alert.alert("No pudimos leer tus permisos", "Intenta actualizar el resumen antes de registrar un momento.");
      return;
    }
    if (!algunConsent) {
      Alert.alert("Elige tus permisos", "Autoriza los sensores que quieras desde Perfil → Permisos y privacidad.", [
        { text: "Ahora no", style: "cancel" }, { text: "Ir a Perfil", onPress: () => router.push("/(tabs)/perfil") },
      ]);
      return;
    }
    capturar.mutate(consents);
  };

  return (
    <Screen scroll scrollProps={{ refreshControl: <RefreshControl refreshing={actualizando} onRefresh={actualizar} tintColor={colors.brandCyan} colors={[colors.brandCyan]} /> }}>
      <Text className="text-xs text-ink-300 mb-2">{hoy.charAt(0).toUpperCase() + hoy.slice(1)}</Text>
      <PageHeader title={`Hola, ${alias}`} accessory={<Chip label={demoMode ? "Demo" : isLoading ? "Cargando" : "Hoy"} tone="mint" leadingIcon={<Sparkles size={12} color={colors.accent.mint} />} />} />

      {error && (
        <Card className="mt-5 border-amber-400/30" animated={false}>
          <Text className="text-white font-semibold">No pudimos actualizar tu resumen</Text>
          <Text className="text-ink-300 text-sm mt-2">{gemelo ? "Estos son los últimos datos disponibles. Puedes intentar actualizar otra vez." : "Intenta actualizar para recuperar tus registros."}</Text>
          <View className="mt-3"><Button size="sm" variant="secondary" label="Reintentar" loading={actualizando} onPress={actualizar} /></View>
        </Card>
      )}

      {prediccion ? (
        <Card hero className="mt-6" delay={80}>
          <View className="flex-row items-center gap-4">
            {esRF ? <ConfianzaRing probabilidad={prediccion.probabilidad} /> : (
              <View className="rounded-full bg-brand-500/10 items-center justify-center" style={{ width: 108, height: 108, borderWidth: 9, borderColor: colors.brandCyan + "55", shadowColor: colors.brandCyan, shadowOpacity: 0.6, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } }}>
                <Sparkles size={32} color={colors.brandCyan} />
              </View>
            )}
            <View className="flex-1">
              <Text className="text-[11px] uppercase tracking-widest text-ink-300">
                Lo que podrías hacer después
              </Text>
              <Text className="text-2xl font-bold text-white mt-1">
                {ACTIVIDAD_LABELS[prediccion.actividad] ?? prediccion.actividad}
              </Text>
              <Text className="text-sm text-ink-300 mt-1">
                En los próximos {prediccion.horizonteMin} min
              </Text>
            </View>
          </View>
          <View className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-3">
            <Text className="text-sm text-ink-100 leading-5">{esRF ? prediccion.explicacion : "Una orientación a partir de la hora y tus registros recientes. Todavía no representa tus hábitos personales."}</Text>
          </View>
        </Card>
      ) : (
        <Card hero className="mt-6" delay={80}>
          <Text className="text-lg font-semibold text-white">{isLoading ? "Preparando tu resumen…" : sinDatos ? "Tu gemelo está despertando" : "Tu día ya tiene historia"}</Text>
          <Text className="text-sm text-ink-300 mt-1 leading-5">
            {isLoading ? "Estamos recuperando tus registros. Tus métricas aparecerán aquí." : sinDatos ? "Registra tu primer momento para empezar a conocer tu día." : "Tus datos están abajo. Captura un momento nuevo para obtener una orientación reciente."}
          </Text>
        </Card>
      )}

      <View className="mt-4"><Button label="Registrar un momento" loading={capturar.isPending} disabled={cargandoPermisos} onPress={registrarMomento} /></View>

      <View className="mt-6 flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">Hoy, de un vistazo</Text>
          <Text className="text-ink-400 text-xs mt-1">{isLoading ? "Cargando registros…" : ultimaHora ? `Último registro · ${ultimaHora}` : "Todavía no hay registros de hoy"}</Text>
        </View>
        <Button fullWidth={false} size="sm" variant="ghost" label="Actualizar" loading={actualizando} onPress={actualizar} />
      </View>
      <View className="mt-4 flex-row gap-3">
        <StatTile icon={<Footprints size={18} color={colors.brandCyan} />} label="Pasos" value={disponible("steps") ? gemelo?.pasosHoy ?? 0 : "—"} hint={disponible("steps") ? "Ver historial" : "Sin lectura de pasos"} loading={isLoading} onPress={() => router.push("/(tabs)/historial")} delay={140} />
        <StatTile icon={<Timer size={18} color={colors.accent.amber} />} label="Min. activos" value={gemelo?.tieneDuracionActividad ? gemelo.minutosActivos : "—"} hint={gemelo?.tieneDuracionActividad ? "Ver rutina" : "Sin duración registrada"} loading={isLoading} onPress={() => router.push("/(tabs)/rutina")} delay={180} />
      </View>
      <View className="mt-3 flex-row gap-3">
        <StatTile icon={<MoonStar size={18} color={colors.accent.violet} />} label="Sueño" value={disponible("sleep") ? `${((gemelo?.minutosSueno ?? 0) / 60).toFixed(1)} h` : "—"} hint={disponible("sleep") ? "Ver mis metas" : "Sin registro de sueño"} loading={isLoading} onPress={() => router.push("/(tabs)/metas")} delay={220} />
        <StatTile icon={<Compass size={18} color={colors.accent.mint} />} label="Zona" value={nombreCortoZona(gemelo?.zonaActual, aliasZonas)} hint={disponible("zone") ? "Ver Perfil" : "Sin zona registrada"} loading={isLoading} onPress={() => router.push("/(tabs)/perfil")} delay={260} />
      </View>

      <MiImpactoCard />

      {/* ── Calibración / Feedback de actividad (Ground Truth) ── */}
      <ValidacionActividadCard
        prediccion={actividadParaConfirmar}
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


      {/* ── Alertas de salud ────────────────────────────────────────── */}
      {alertasVisibles.length > 0 && (
        <View className="mt-6">
          <View className="flex-row items-center gap-2 mb-3">
            <HeartPulse size={18} color={colors.accent.coral} />
            <Text className="text-white font-semibold text-base">Observaciones de hoy</Text>
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
        <View className="flex-row items-start gap-3">
          <View className="flex-1 flex-row items-start gap-2.5">
            <View className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 items-center justify-center">
              <Radio size={16} color={colors.brandCyan} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-white">Tus sensores</Text>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: bg.data?.registrada ? colors.accent.mint : colors.textMuted }} />
                <Text className="text-xs text-accent-mint font-medium flex-1">{bg.isLoading ? "Consultando…" : bg.isError ? "Estado sin confirmar" : bg.data?.registrada ? "Captura programada" : "Captura manual"}</Text>
              </View>
            </View>
          </View>
          <Chip className="shrink-0" label={bg.isLoading || bg.isError ? "…" : bg.data?.registrada ? "Programado" : "Manual"} tone={bg.data?.registrada ? "mint" : "neutral"} />
        </View>

        <Text className="text-xs text-ink-300 mt-3 leading-5">
          {bg.data?.registrada ? "Tu teléfono decide cuándo registrar en segundo plano. También puedes capturar un momento ahora." : "Captura un momento con los sensores que autorizaste. Los datos disponibles dependen de tu dispositivo."}
        </Text>

        <View className="flex-row gap-2 mt-4">
          <View className="flex-1">
            <Button
              size="sm"
              variant="secondary"
              label="Registrar otro momento"
              loading={capturar.isPending}
              disabled={cargandoPermisos}
              onPress={registrarMomento}
            />
          </View>
          {demoMode && <View className="flex-1">
            <Button
              size="sm"
              variant="ghost"
              label={sinDatos ? "Dato de prueba" : "Añadir demo"}
              loading={simular.isPending}
              onPress={() => simular.mutate()}
            />
          </View>}
        </View>

        {(sync.data?.pendientes ?? 0) > 0 && (
          <View className="mt-3 gap-2">
            <Text className="text-xs text-ink-300">{sync.data!.pendientes} registros guardados en el teléfono, pendientes de sincronizar.</Text>
            <Button size="sm" variant="ghost" label="Reintentar sincronización" loading={retry.isPending} onPress={() => retry.mutate()} />
            {retry.isError && <Text className="text-xs text-error">No se pudo sincronizar. Tus registros siguen guardados.</Text>}
            {!retry.isError && sync.data?.error && <Text className="text-xs text-ink-300">{sync.data.error}</Text>}
          </View>
        )}

        {capturar.isError ? (
          <Text className="text-xs text-error mt-2">
            {(capturar.error as Error)?.message === "sin-sensores"
              ? "No hay sensores disponibles o autorizados. Revisa los permisos del sistema y tus consentimientos."
              : "No se pudo completar la captura. Intenta nuevamente."}
          </Text>
        ) : null}
      </Card>
      <View className="mt-4 flex-row gap-3">
        <View className="flex-1"><Button variant="secondary" size="sm" label="Mi cambio" onPress={() => router.push("/(tabs)/mi-cambio")} /></View>
        <View className="flex-1"><Button variant="secondary" size="sm" label="Mi mañana" onPress={() => router.push("/(tabs)/mi-manana")} /></View>
      </View>
    </Screen>
  );
}

function StatTile({ icon, label, value, hint, loading, onPress, delay }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint: string;
  loading: boolean;
  onPress: () => void;
  delay?: number;
}) {
  const isStringLong = typeof value === "string" && value.length > 6;
  return (
    <Card className="flex-1 p-4" style={{ minWidth: 0, minHeight: 148 }} delay={delay}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${loading ? "cargando" : value}. ${hint}`} onPress={onPress} hitSlop={12}>
        <View className="flex-row items-center justify-between">
          {icon}<ChevronRight size={14} color={colors.textMuted} />
        </View>
        <Text className="text-[11px] uppercase tracking-widest text-ink-300 mt-3">{label}</Text>
        {!loading && typeof value === "number" ? (
          <AnimatedNumber value={value} format={(n) => n.toLocaleString("es-PE")} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}
            className="text-2xl font-bold text-white mt-1" style={{ fontVariant: ["tabular-nums"] }} />
        ) : (
          <Text numberOfLines={1} className={`${isStringLong ? "text-lg" : "text-2xl"} font-bold text-white mt-1`}>{loading ? "—" : value}</Text>
        )}
        <Text className="text-[11px] text-ink-400 mt-2 leading-4">{loading ? "Cargando…" : hint}</Text>
      </Pressable>
    </Card>
  );
}
