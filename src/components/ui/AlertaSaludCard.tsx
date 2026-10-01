/**
 * ando · Gemelo Digital — Componente AlertaSalud
 *
 * Tarjeta de alerta de salud que sigue el sistema de diseño de la app:
 * glassmorphism, borde de acento lateral y animación Moti de entrada.
 */

import { Text, View, Pressable } from "react-native";
import { MotiView } from "moti";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  Footprints,
  Heart,
  Info,
  Lightbulb,
  Moon,
  ShieldAlert,
  Zap,
} from "lucide-react-native";

import { Chip } from "@components/ui/Chip";
import { cn } from "@lib/cn";
import { colors } from "@theme/colors";
import type { AlertaSalud, TipoAlerta, CategoriaAlerta } from "@services/alertas";

// ─── Tokens de color por tipo de alerta ──────────────────────────────────────

const bordeTipo: Record<TipoAlerta, string> = {
  peligro:     "border-l-rose-400",
  advertencia: "border-l-amber-400",
  info:        "border-l-sky-400",
  ok:          "border-l-emerald-400",
};

const iconColorTipo: Record<TipoAlerta, string> = {
  peligro:     colors.accent.coral,
  advertencia: colors.accent.amber,
  info:        colors.brandCyan,
  ok:          colors.accent.mint,
};

const chipTone: Record<TipoAlerta, "coral" | "amber" | "brand" | "mint"> = {
  peligro:     "coral",
  advertencia: "amber",
  info:        "brand",
  ok:          "mint",
};

const barraColor: Record<TipoAlerta, string> = {
  peligro:     "bg-rose-400",
  advertencia: "bg-amber-400",
  info:        "bg-sky-400",
  ok:          "bg-emerald-400",
};

// ─── Ícono por categoría ──────────────────────────────────────────────────────

function IconoAlerta({
  categoria,
  tipo,
  size = 20,
}: {
  categoria: CategoriaAlerta;
  tipo: TipoAlerta;
  size?: number;
}) {
  const color = iconColorTipo[tipo];
  switch (categoria) {
    case "pasos":        return <Footprints size={size} color={color} />;
    case "actividad":    return <Activity   size={size} color={color} />;
    case "sueno":        return <Moon       size={size} color={color} />;
    case "cardiaco":     return <Heart      size={size} color={color} />;
    case "sedentarismo": return <Clock      size={size} color={color} />;
    case "combinada":    return <Zap        size={size} color={color} />;
    default:             return <Info       size={size} color={color} />;
  }
}

function IconoEstado({ tipo, size = 14 }: { tipo: TipoAlerta; size?: number }) {
  const color = iconColorTipo[tipo];
  switch (tipo) {
    case "peligro":     return <ShieldAlert   size={size} color={color} />;
    case "advertencia": return <AlertTriangle size={size} color={color} />;
    case "ok":          return <CheckCircle2  size={size} color={color} />;
    default:            return <Info          size={size} color={color} />;
  }
}

function IconoBadge({
  categoria,
  tipo,
  size = 11,
}: {
  categoria: CategoriaAlerta;
  tipo: TipoAlerta;
  size?: number;
}) {
  const color = iconColorTipo[tipo];
  if (categoria === "combinada") {
    return <Zap size={size} color={color} />;
  }
  switch (tipo) {
    case "ok":          return <CheckCircle2  size={size} color={color} />;
    case "peligro":     return <ShieldAlert   size={size} color={color} />;
    case "advertencia": return <AlertTriangle size={size} color={color} />;
    case "info":
    default:            return <Lightbulb     size={size} color={color} />;
  }
}

// ─── Barra de progreso ────────────────────────────────────────────────────────

function BarraProgreso({
  progreso,
  tipo,
}: {
  progreso: number;
  tipo: TipoAlerta;
}) {
  return (
    <View className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
      <MotiView
        from={{ width: "0%" }}
        animate={{ width: `${Math.min(100, progreso)}%` }}
        transition={{ type: "timing", duration: 600, delay: 200 }}
        className={cn("h-full rounded-full", barraColor[tipo])}
      />
    </View>
  );
}

// ─── Tarjeta principal ────────────────────────────────────────────────────────

type Props = {
  alerta: AlertaSalud;
  delay?: number;
  onDescartar?: (id: string) => void;
};

export function AlertaSaludCard({ alerta, delay = 0, onDescartar }: Props) {
  const {
    id, tipo, categoria, titulo, detalle,
    progreso, badge, descartable, usaPrediccion,
  } = alerta;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 380, delay }}
    >
      <View
        className={cn(
          "rounded-2xl bg-white/[0.05] border border-white/10",
          "border-l-4 p-4",
          bordeTipo[tipo],
        )}
      >
        {/* Cabecera */}
        <View className="flex-row items-start gap-3">
          {/* Ícono de categoría */}
          <View className="mt-0.5">
            <IconoAlerta categoria={categoria} tipo={tipo} />
          </View>

          {/* Contenido */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2 flex-wrap">
              <Text className="text-white font-semibold text-base flex-1">
                {titulo}
              </Text>
              <IconoEstado tipo={tipo} />
            </View>

            <Text className="text-ink-300 text-sm mt-1 leading-5">
              {detalle}
            </Text>

            {/* Barra de progreso */}
            {progreso !== null && (
              <BarraProgreso progreso={progreso} tipo={tipo} />
            )}

            {/* Footer: badge + botón descartar */}
            <View className="flex-row items-center justify-between mt-3 flex-wrap gap-2">
              <View className="flex-row items-center gap-2">
                <Chip
                  label={badge}
                  tone={chipTone[tipo]}
                  leadingIcon={<IconoBadge categoria={categoria} tipo={tipo} />}
                />
                {usaPrediccion && (
                  <Chip
                    label="Gemelo"
                    tone="violet"
                    leadingIcon={<Brain size={11} color={colors.violet} />}
                  />
                )}
              </View>

              {descartable && onDescartar && (
                <Pressable
                  onPress={() => onDescartar(id)}
                  hitSlop={8}
                >
                  <Text className="text-xs text-ink-400 font-medium">
                    Descartar
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    </MotiView>
  );
}
