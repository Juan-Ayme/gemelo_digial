import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { MotiView } from "moti";
import {
  CheckCircle2,
  Footprints,
  Moon,
  Pencil,
  Timer,
  Trophy,
} from "lucide-react-native";

import { Screen } from "@components/ui/Screen";
import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { Button } from "@components/ui/Button";
import { ProGate, ProBadge } from "@components/ui/ProGate";
import { useMetas, useSaveMetas, useProgresoMetas } from "@hooks/useMetas";
import { useEsPro } from "@hooks/useSuscripcion";
import { useRouter } from "expo-router";
import { colors } from "@theme/colors";
import type { MetasConfig } from "@services/metas";

type MetaKey = keyof MetasConfig;

const META_CONFIG: Record<
  MetaKey,
  { label: string; unidad: string; icon: any; color: string; min: number; max: number; paso: number }
> = {
  pasos: {
    label: "Meta diaria de pasos",
    unidad: "pasos",
    icon: Footprints,
    color: colors.brandCyan,
    min: 2_000,
    max: 20_000,
    paso: 500,
  },
  minutosActivos: {
    label: "Minutos activos",
    unidad: "min",
    icon: Timer,
    color: colors.accent.mint,
    min: 10,
    max: 120,
    paso: 5,
  },
  horasSueno: {
    label: "Horas de sueño",
    unidad: "h",
    icon: Moon,
    color: colors.accent.violet,
    min: 4,
    max: 12,
    paso: 0.5,
  },
};

function MetaSlider({
  metaKey,
  value,
  onChange,
  isPro,
  onRequirePro,
}: {
  metaKey: MetaKey;
  value: number;
  onChange: (v: number) => void;
  isPro: boolean;
  onRequirePro?: () => void;
}) {
  const cfg = META_CONFIG[metaKey];
  const Icon = cfg.icon;
  const pct = ((value - cfg.min) / (cfg.max - cfg.min)) * 100;
  const esBloqueado = !isPro && metaKey !== "pasos";

  const handleMinus = () => {
    if (esBloqueado) {
      onRequirePro?.();
      return;
    }
    onChange(Math.max(cfg.min, value - cfg.paso));
  };

  const handlePlus = () => {
    if (esBloqueado) {
      onRequirePro?.();
      return;
    }
    onChange(Math.min(cfg.max, value + cfg.paso));
  };

  return (
    <View className="bg-white/5 rounded-2xl p-4 border border-white/8">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View
            className="w-8 h-8 rounded-xl items-center justify-center"
            style={{ backgroundColor: `${cfg.color}18` }}
          >
            <Icon size={16} color={cfg.color} />
          </View>
          <Text className="text-white font-semibold text-sm">{cfg.label}</Text>
          {esBloqueado && <ProBadge label="PRO" />}
        </View>
        <View className="flex-row items-center gap-1 bg-white/10 rounded-full px-3 py-1">
          <Text className="text-white font-bold text-base">
            {cfg.unidad === "pasos"
              ? value.toLocaleString("es-PE")
              : value}
          </Text>
          <Text className="text-ink-400 text-xs">{cfg.unidad}</Text>
        </View>
      </View>

      {/* Barra interactiva con botones +/- */}
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={handleMinus}
          className="w-9 h-9 rounded-full bg-white/10 items-center justify-center border border-white/15 active:opacity-70"
        >
          <Text className="text-white font-bold text-lg">−</Text>
        </Pressable>

        <View className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
          <MotiView
            animate={{ width: `${pct}%` }}
            transition={{ type: "timing", duration: 200 }}
            className="h-full rounded-full"
            style={{ backgroundColor: cfg.color }}
          />
        </View>

        <Pressable
          onPress={handlePlus}
          className="w-9 h-9 rounded-full bg-white/10 items-center justify-center border border-white/15 active:opacity-70"
        >
          <Text className="text-white font-bold text-lg">+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ProgresoRing({
  pct,
  logrado,
  color,
  icon: Icon,
  label,
  actual,
  meta,
  unidad,
  delay,
}: {
  pct: number;
  logrado: boolean;
  color: string;
  icon: any;
  label: string;
  actual: number | string;
  meta: number;
  unidad: string;
  delay: number;
}) {
  const size = 80;
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: "timing", duration: 350 }}
      className="flex-1 items-center gap-2"
    >
      <View className="relative items-center justify-center" style={{ width: size, height: size }}>
        {/* SVG simulado con View circular */}
        <View
          className="absolute rounded-full border-4"
          style={{ width: size, height: size, borderColor: `${color}20` }}
        />
        {/* Progreso — usamos un overlay gradiente */}
        <View
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            borderWidth: 4,
            borderColor: logrado ? color : `${color}60`,
            borderLeftColor: "transparent",
            borderBottomColor: pct > 50 ? (logrado ? color : `${color}60`) : "transparent",
            transform: [{ rotate: `${(pct / 100) * 360 - 90}deg` }],
          }}
        />
        <View className="items-center">
          {logrado ? (
            <CheckCircle2 size={22} color={color} />
          ) : (
            <Icon size={18} color={color} />
          )}
          <Text className="text-white text-xs font-bold mt-0.5">{pct}%</Text>
        </View>
      </View>

      <Text className="text-[11px] text-white/80 font-semibold text-center">{label}</Text>
      <Text className="text-[10px] text-ink-400 text-center">
        {typeof actual === "number" && unidad === "pasos"
          ? (actual as number).toLocaleString("es-PE")
          : actual}
        {" "}/{" "}
        {unidad === "pasos" ? meta.toLocaleString("es-PE") : meta} {unidad}
      </Text>
    </MotiView>
  );
}

export default function Metas() {
  const { data: metas } = useMetas();
  const { data: progreso } = useProgresoMetas();
  const saveMetas = useSaveMetas();
  const esPro = useEsPro();
  const router = useRouter();

  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState<MetasConfig | null>(null);

  const metasActuales = draft ?? metas ?? { pasos: 8_000, minutosActivos: 30, horasSueno: 7 };

  const handleRequirePro = () => {
    Alert.alert(
      "Meta exclusiva ando Pro",
      "La calibración personalizada de minutos activos y horas de sueño está disponible en ando Pro.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Ver ando Pro",
          onPress: () => router.push("/(tabs)/suscripcion" as any),
        },
      ],
    );
  };

  const guardar = () => {
    saveMetas.mutate(metasActuales, {
      onSuccess: () => {
        setEditando(false);
        setDraft(null);
      },
    });
  };

  return (
    <Screen scroll>
      <View className="gap-1">
        <Text className="text-3xl font-bold text-white">Mis Metas</Text>
        <Text className="text-base text-ink-300">
          Define tus objetivos diarios de bienestar.
        </Text>
      </View>

      <View className="flex-row gap-2 mt-4 flex-wrap items-center">
        <Chip label="Personal" tone="brand" leadingIcon={<Trophy size={12} color={colors.brandCyan} />} />
        {esPro ? (
          <Chip label="ando Pro" tone="mint" />
        ) : (
          <ProBadge label="FREE · METAS BÁSICAS" />
        )}
      </View>

      {/* ── Anillos de progreso del día ── */}
      {progreso && (
        <Card glass className="mt-5">
          <Text className="text-white/80 text-xs uppercase tracking-widest font-semibold mb-4">
            Progreso de hoy
          </Text>
          <View className="flex-row gap-2">
            <ProgresoRing
              pct={progreso.pasos.pct}
              logrado={progreso.pasos.logrado}
              color={colors.brandCyan}
              icon={Footprints}
              label="Pasos"
              actual={progreso.pasos.actual}
              meta={progreso.pasos.meta}
              unidad="pasos"
              delay={0}
            />
            <ProgresoRing
              pct={progreso.minutosActivos.pct}
              logrado={progreso.minutosActivos.logrado}
              color={colors.accent.mint}
              icon={Timer}
              label="Min. activos"
              actual={progreso.minutosActivos.actual}
              meta={progreso.minutosActivos.meta}
              unidad="min"
              delay={100}
            />
            <ProgresoRing
              pct={progreso.horasSueno.pct}
              logrado={progreso.horasSueno.logrado}
              color={colors.accent.violet}
              icon={Moon}
              label="Sueño"
              actual={parseFloat(progreso.horasSueno.actual.toFixed(1))}
              meta={progreso.horasSueno.meta}
              unidad="h"
              delay={200}
            />
          </View>

          {/* Mensaje motivacional */}
          {progreso.pasos.logrado && progreso.minutosActivos.logrado && (
            <MotiView
              from={{ opacity: 0, translateY: 4 }}
              animate={{ opacity: 1, translateY: 0 }}
              className="mt-4 bg-accent-mint/10 border border-accent-mint/20 rounded-xl p-3"
            >
              <Text className="text-accent-mint font-semibold text-sm text-center">
                🎉 ¡Metas del día completadas! Excelente trabajo.
              </Text>
            </MotiView>
          )}
        </Card>
      )}

      {/* ── Editor de metas ── */}
      <Card className="mt-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white font-semibold text-base">Configurar metas</Text>
          {!editando ? (
            <Pressable
              onPress={() => {
                setDraft(metasActuales);
                setEditando(true);
              }}
              className="flex-row items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5"
            >
              <Pencil size={12} color={colors.brandCyan} />
              <Text className="text-xs text-brand-300 font-semibold">Editar</Text>
            </Pressable>
          ) : null}
        </View>

        <View className="gap-3">
          {(Object.keys(META_CONFIG) as MetaKey[]).map((k) => (
            <MetaSlider
              key={k}
              metaKey={k}
              value={metasActuales[k]}
              isPro={esPro}
              onRequirePro={handleRequirePro}
              onChange={
                editando
                  ? (v) => setDraft((prev) => ({ ...(prev ?? metasActuales), [k]: v }))
                  : () => {}
              }
            />
          ))}
        </View>

        {!esPro && (
          <View className="mt-4">
            <ProGate
              mode="banner"
              descripcion="Calibra tus minutos activos y objetivos de sueño a tu ritmo con ando Pro."
            />
          </View>
        )}

        {editando && (
          <View className="flex-row gap-3 mt-4">
            <View className="flex-1">
              <Button
                variant="secondary"
                label="Guardar metas"
                loading={saveMetas.isPending}
                onPress={guardar}
              />
            </View>
            <View className="flex-1">
              <Button
                variant="ghost"
                label="Cancelar"
                onPress={() => {
                  setEditando(false);
                  setDraft(null);
                }}
              />
            </View>
          </View>
        )}
      </Card>

      <Text className="text-xs text-ink-400 text-center mt-4 leading-5">
        Los objetivos siguen recomendaciones de la OMS y la American Heart Association.
        No constituyen un diagnóstico médico.
      </Text>
    </Screen>
  );
}
