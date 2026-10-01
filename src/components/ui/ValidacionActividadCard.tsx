import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { MotiView } from "moti";
import {
  Armchair,
  Briefcase,
  Check,
  CheckCircle2,
  Coffee,
  Dumbbell,
  Footprints,
  GraduationCap,
  Moon,
  Sparkles,
  X,
} from "lucide-react-native";

import { Card } from "@components/ui/Card";
import { Chip } from "@components/ui/Chip";
import { useRegistrarCorreccion, useUltimaCorreccion } from "@hooks/useCorreccion";
import { ACTIVIDAD_LABELS, type ActividadPredicha, type Prediccion } from "@services/types";
import { colors } from "@theme/colors";

const OPCIONES_ACTIVIDAD: { id: ActividadPredicha; label: string; icon: any }[] = [
  { id: "trabajo", label: "Trabajo", icon: Briefcase },
  { id: "estudio", label: "Estudio", icon: GraduationCap },
  { id: "actividad_fisica", label: "Ejercicio", icon: Dumbbell },
  { id: "descanso", label: "Descanso", icon: Moon },
  { id: "desplazamiento", label: "Caminar", icon: Footprints },
  { id: "ocio", label: "Ocio", icon: Coffee },
  { id: "permanencia", label: "Reposo", icon: Armchair },
];

type Props = {
  prediccion: Prediccion | null;
  zonaActual?: string;
  delay?: number;
};

export function ValidacionActividadCard({ prediccion, zonaActual, delay = 100 }: Props) {
  const { data: ultimaCorreccion } = useUltimaCorreccion();
  const registrar = useRegistrarCorreccion();

  const [mostrandoSelector, setMostrandoSelector] = useState(false);
  const [descartado, setDescartado] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  if (!prediccion || descartado) return null;

  // Si ya confirmó en las últimas 2 horas, mostramos estado discreto o nada
  if (ultimaCorreccion && !mensajeExito) {
    const haceMinutos = Math.round(
      (Date.now() - new Date(ultimaCorreccion.created_at).getTime()) / 60000,
    );
    if (haceMinutos < 90) return null;
  }

  const actividadNombre =
    ACTIVIDAD_LABELS[prediccion.actividad] ?? prediccion.actividad;

  const handleConfirmar = () => {
    if (procesando) return;
    setProcesando(true);
    setMensajeExito("¡Confirmado! Tu gemelo aprende de tu momento actual.");

    registrar.mutate(
      {
        actividadOriginal: prediccion.actividad,
        actividadCorregida: prediccion.actividad,
        confirmada: true,
        zonaActual,
      },
      {
        onSettled: () => {
          setTimeout(() => setDescartado(true), 2000);
        },
      },
    );
  };

  const handleCorregir = (nuevaActividad: ActividadPredicha) => {
    if (procesando) return;
    setProcesando(true);
    setMensajeExito(
      `Actualizado a "${ACTIVIDAD_LABELS[nuevaActividad]}". Tu gemelo afinará su próxima estimación.`,
    );

    registrar.mutate(
      {
        actividadOriginal: prediccion.actividad,
        actividadCorregida: nuevaActividad,
        confirmada: false,
        zonaActual,
      },
      {
        onSettled: () => {
          setTimeout(() => setDescartado(true), 2000);
        },
      },
    );
  };

  return (
    <Card glass className="mt-4 border border-brand-500/30 p-4" delay={delay}>
      {mensajeExito ? (
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 250 }}
          className="flex-row items-center gap-2.5 py-1"
        >
          <View className="w-7 h-7 rounded-full bg-emerald-500/20 items-center justify-center">
            <CheckCircle2 size={16} color={colors.accent.mint} />
          </View>
          <Text className="text-sm font-medium text-emerald-200 flex-1">
            {mensajeExito}
          </Text>
        </MotiView>
      ) : (
        <View>
          {/* Cabecera */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-6 h-6 rounded-lg bg-brand-500/20 items-center justify-center">
                <Sparkles size={13} color={colors.brandCyan} />
              </View>
              <Text className="text-xs uppercase tracking-widest font-semibold text-brand-300">
                Sintonía del gemelo
              </Text>
            </View>
            <Pressable
              onPress={() => setDescartado(true)}
              hitSlop={8}
              className="p-1 rounded-full bg-white/5"
            >
              <X size={13} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Pregunta principal */}
          <Text className="text-white font-bold text-base mt-2">
            ¿Es correcto tu estado?
          </Text>
          <Text className="text-xs text-ink-300 mt-0.5 leading-4">
            Tu gemelo estima que estás en{" "}
            <Text className="text-brand-200 font-semibold">{actividadNombre}</Text>. ¿Coincide con tu actividad actual?
          </Text>

          {/* Botones de acción rápida */}
          {!mostrandoSelector ? (
            <View className="flex-row gap-2 mt-3.5">
              <Pressable
                onPress={handleConfirmar}
                disabled={procesando}
                className="flex-1 bg-brand-500/20 border border-brand-400/40 rounded-xl py-2 px-3 flex-row items-center justify-center gap-1.5 active:bg-brand-500/30"
              >
                <Check size={14} color={colors.brandCyan} />
                <Text className="text-xs font-semibold text-brand-200">
                  Sí, es correcto
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMostrandoSelector(true)}
                disabled={procesando}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 flex-row items-center justify-center gap-1.5 active:bg-white/10"
              >
                <Text className="text-xs font-medium text-ink-200">
                  No, estoy en otra
                </Text>
              </Pressable>
            </View>
          ) : (
            <MotiView
              from={{ opacity: 0, translateY: 6 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 220 }}
              className="mt-3"
            >
              <Text className="text-[11px] text-ink-400 uppercase tracking-wider mb-2 font-medium">
                Selecciona tu actividad real:
              </Text>
              <View className="flex-row flex-wrap gap-1.5">
                {OPCIONES_ACTIVIDAD.map((opc) => {
                  const Icon = opc.icon;
                  return (
                    <Pressable
                      key={opc.id}
                      onPress={() => handleCorregir(opc.id)}
                      disabled={registrar.isPending}
                      className="flex-row items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 active:bg-brand-500/20 active:border-brand-400"
                    >
                      <Icon size={12} color={colors.brandCyan} />
                      <Text className="text-xs font-medium text-ink-100">
                        {opc.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </MotiView>
          )}
        </View>
      )}
    </Card>
  );
}
