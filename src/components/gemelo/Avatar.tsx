/**
 * GemeloAvatar — Avatar de polígonos animado
 * ============================================
 *
 * Figura humana articulada construida con Views posicionados absolutamente.
 * Cada articulación es un Animated.View de tamaño cero que actúa como pivote:
 * al rotar un pivote de 0×0, la rotación ocurre exactamente en ese punto
 * (el centro de un View de área cero coincide con su posición).
 *
 * Poses disponibles — una por cada ActividadPredicha:
 *   permanencia     · desplazamiento · trabajo  · estudio
 *   descanso        · actividad_fisica          · ocio
 *
 * Animaciones:
 *   - Cambio de actividad → withTiming 550 ms (suave entre poses)
 *   - Caminando / Ejercicio → withRepeat+withSequence (loop de movimiento)
 *   - Respiración → withRepeat suave siempre activo
 */

import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { PREFERENCIAS_DEFAULT, type Preferencias } from "@services/preferencias";
import type { ActividadPredicha } from "@services/types";
import { colors } from "@theme/colors";
import { useAvatarMotion } from "@components/gemelo/useAvatarMotion";
import { AvatarPersonaje } from "@components/gemelo/AvatarPersonaje";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PoseDef = {
  /** Ángulos en grados. 0 = vertical hacia abajo. + = horario. */
  lArm: number; rArm: number;
  lForearm: number; rForearm: number;
  lThigh: number; rThigh: number;
  lShin: number; rShin: number;
  torso: number;
  /** Rotación de todo el cuerpo (90 = acostado). */
  body: number;
  /** Si true, el avatar alterna entre frame A y frame B en loop. */
  loop?: {
    lArm: number; rArm: number;
    lThigh: number; rThigh: number;
    ms: number;
  };
};

// ─── Dimensiones del canvas (en px nativos) ───────────────────────────────────

const CW = 120;  // canvas width
const CH = 200;  // canvas height
const CX = CW / 2; // centro horizontal

const HEAD_R = 13;
const HEAD_CY = 17;

const TORSO_TOP = HEAD_CY + HEAD_R + 7; // 37
const TORSO_W = 20;
const TORSO_H = 42;

const SH_Y = TORSO_TOP + 5;   // shoulder Y
const SH_L = CX - TORSO_W / 2 - 3; // shoulder left  X = 47
const SH_R = CX + TORSO_W / 2 + 3; // shoulder right X = 73
const HIP_Y = TORSO_TOP + TORSO_H - 3; // 76
const HIP_L = CX - 6;  // 54
const HIP_R = CX + 6;  // 66

const ARM_W = 7; const ARM_H = 26;
const FA_W  = 6; const FA_H  = 21;
const TH_W  = 9; const TH_H  = 30;
const SN_W  = 7; const SN_H  = 26;

// ─── Poses ────────────────────────────────────────────────────────────────────

const POSES: Record<string, PoseDef> = {
  permanencia: {
    lArm: 8, rArm: -8,
    lForearm: 12, rForearm: -12,
    lThigh: 4, rThigh: -4,
    lShin: 6, rShin: -6,
    torso: 0, body: 0,
  },
  desplazamiento: {
    lArm: -32, rArm: 32,
    lForearm: 18, rForearm: -18,
    lThigh: -28, rThigh: 28,
    lShin: 18, rShin: 12,
    torso: 4, body: 0,
    loop: { lArm: 32, rArm: -32, lThigh: 28, rThigh: -28, ms: 440 },
  },
  trabajo: {
    lArm: -78, rArm: 78,
    lForearm: 88, rForearm: -88,
    lThigh: 84, rThigh: 84,
    lShin: -82, rShin: -82,
    torso: 0, body: 0,
  },
  estudio: {
    lArm: -50, rArm: 62,
    lForearm: 72, rForearm: -28,
    lThigh: 80, rThigh: 80,
    lShin: -76, rShin: -76,
    torso: 10, body: 0,
  },
  descanso: {
    lArm: 18, rArm: -18,
    lForearm: 8, rForearm: -8,
    lThigh: 8, rThigh: -8,
    lShin: 6, rShin: -6,
    torso: 0, body: 90,
  },
  actividad_fisica: {
    lArm: -138, rArm: 138,
    lForearm: -15, rForearm: 15,
    lThigh: -44, rThigh: 44,
    lShin: 32, rShin: 32,
    torso: 0, body: 0,
    loop: { lArm: -88, rArm: 88, lThigh: -18, rThigh: 18, ms: 290 },
  },
  ocio: {
    lArm: -125, rArm: 22,
    lForearm: 55, rForearm: 18,
    lThigh: 52, rThigh: 38,
    lShin: -42, rShin: -26,
    torso: -14, body: 0,
  },
};

// ─── Color de acento por actividad ───────────────────────────────────────────

const ACCENT: Record<string, string> = {
  desplazamiento:   colors.accent.amber,
  trabajo:          colors.brandCyan,
  estudio:          colors.violet,
  descanso:         "#38bdf8",
  actividad_fisica: colors.accent.mint,
  ocio:             colors.accent.coral,
  permanencia:      colors.textMuted,
};

const EASE_SMOOTH = { duration: 560, easing: Easing.inOut(Easing.quad) } as const;
const EASE_LOOP   = Easing.inOut(Easing.sin);

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  actividad?: ActividadPredicha | null;
  /** Tamaño en px del cuadrado contenedor. Default 200. */
  size?: number;
  className?: string;
  preferencias?: Preferencias;
};

// ─── Componente ──────────────────────────────────────────────────────────────

export function GemeloAvatar({ preferencias = PREFERENCIAS_DEFAULT, ...props }: Props) {
  return preferencias.aspecto === "neutral"
    ? <AvatarOriginal {...props} preferencias={preferencias} />
    : <AvatarPersonaje actividad={props.actividad} size={props.size ?? 200} preferencias={preferencias} />;
}

function AvatarOriginal({ actividad = null, size = 200, preferencias = PREFERENCIAS_DEFAULT }: Props) {
  const animar = useAvatarMotion();
  // El aspecto original conserva su figura luminosa; los cambios son opcionales.
  const BODY_COLOR = colors.originalAvatar;
  const key   = actividad ?? "permanencia";
  const pose  = POSES[key] ?? POSES.permanencia;
  const color = preferencias.color === "violeta" ? colors.violet : preferencias.color === "azul" ? colors.brandCyan : ACCENT[key] ?? colors.brandCyan;
  const sc    = size / CH; // factor de escala

  // ── Shared values por articulación ────────────────────────────────────────

  const lArm    = useSharedValue(pose.lArm);
  const rArm    = useSharedValue(pose.rArm);
  const lFA     = useSharedValue(pose.lForearm);
  const rFA     = useSharedValue(pose.rForearm);
  const lThigh  = useSharedValue(pose.lThigh);
  const rThigh  = useSharedValue(pose.rThigh);
  const lShin   = useSharedValue(pose.lShin);
  const rShin   = useSharedValue(pose.rShin);
  const torso   = useSharedValue(pose.torso);
  const body    = useSharedValue(pose.body);
  const breathe = useSharedValue(0);

  // ── Efecto: cambia pose cuando cambia la actividad ────────────────────────

  useEffect(() => {
    const articulaciones = [lArm, rArm, lFA, rFA, lThigh, rThigh, lShin, rShin, torso, body, breathe];
    const parar = () => articulaciones.forEach(value => cancelAnimation(value));
    parar();
    if (!animar) {
      lArm.value = pose.lArm; rArm.value = pose.rArm;
      lFA.value = pose.lForearm; rFA.value = pose.rForearm;
      lThigh.value = pose.lThigh; rThigh.value = pose.rThigh;
      lShin.value = pose.lShin; rShin.value = pose.rShin;
      torso.value = pose.torso; body.value = pose.body; breathe.value = 0;
      return parar;
    }

    // Articulaciones estáticas (siempre con timing)
    torso.value  = withTiming(pose.torso,    EASE_SMOOTH);
    body.value   = withTiming(pose.body,     EASE_SMOOTH);
    lFA.value    = withTiming(pose.lForearm, EASE_SMOOTH);
    rFA.value    = withTiming(pose.rForearm, EASE_SMOOTH);
    lShin.value  = withTiming(pose.lShin,    EASE_SMOOTH);
    rShin.value  = withTiming(pose.rShin,    EASE_SMOOTH);

    if (pose.loop) {
      const ms = pose.loop.ms;
      const anim = (from: number, to: number) =>
        withRepeat(
          withSequence(
            withTiming(from, { duration: ms, easing: EASE_LOOP }),
            withTiming(to,   { duration: ms, easing: EASE_LOOP }),
          ),
          -1,
          false,
        );
      lArm.value   = anim(pose.lArm,        pose.loop.lArm);
      rArm.value   = anim(pose.rArm,        pose.loop.rArm);
      lThigh.value = anim(pose.lThigh,      pose.loop.lThigh);
      rThigh.value = anim(pose.rThigh,      pose.loop.rThigh);
    } else {
      lArm.value   = withTiming(pose.lArm,   EASE_SMOOTH);
      rArm.value   = withTiming(pose.rArm,   EASE_SMOOTH);
      lThigh.value = withTiming(pose.lThigh, EASE_SMOOTH);
      rThigh.value = withTiming(pose.rThigh, EASE_SMOOTH);
    }

    // Respiración perpetua
    breathe.value = withRepeat(
      withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return parar;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, animar]);

  // ── Estilos animados ───────────────────────────────────────────────────────

  const bodyStyle   = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${body.value}deg` },
      { scale: 1 + breathe.value * 0.018 },
    ],
  }));
  const haloStyle   = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breathe.value * 0.08 }],
    opacity: 0.12 + breathe.value * 0.08,
  }));
  const torsoStyle  = useAnimatedStyle(() => ({
    transform: [{ rotate: `${torso.value}deg` }],
  }));
  const lArmStyle   = useAnimatedStyle(() => ({
    transform: [{ rotate: `${lArm.value}deg` }],
  }));
  const rArmStyle   = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rArm.value}deg` }],
  }));
  const lFAStyle    = useAnimatedStyle(() => ({
    transform: [{ rotate: `${lFA.value}deg` }],
  }));
  const rFAStyle    = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rFA.value}deg` }],
  }));
  const lThighStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${lThigh.value}deg` }],
  }));
  const rThighStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rThigh.value}deg` }],
  }));
  const lShinStyle  = useAnimatedStyle(() => ({
    transform: [{ rotate: `${lShin.value}deg` }],
  }));
  const rShinStyle  = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rShin.value}deg` }],
  }));

  // ── Helpers inline ────────────────────────────────────────────────────────

  /**
   * Pivote de tamaño cero. Un Animated.View de 0×0 rota alrededor de su
   * propia posición (el centro de un rect vacío = el punto mismo).
   */
  const pivot = (
    x: number,
    y: number,
    animStyle: object,
    children: React.ReactNode,
  ) => (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: y * sc,
          left: x * sc,
          width: 0,
          height: 0,
        },
        animStyle,
      ]}
    >
      {children}
    </Animated.View>
  );

  /**
   * Segmento de cuerpo: rectángulo redondeado centrado en el pivote,
   * que se extiende hacia abajo desde él.
   */
  const seg = (w: number, h: number, extraStyle?: object) => (
    <View
      style={[
        {
          position: "absolute",
          width: w * sc,
          height: h * sc,
          marginLeft: -(w / 2) * sc,
          backgroundColor: BODY_COLOR,
          borderRadius: (w / 2) * sc,
        },
        extraStyle,
      ]}
    />
  );

  const containerSz = size;

  return (
    <View
      style={{
        width: containerSz,
        height: containerSz,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Halo de fondo con respiración orgánica */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: containerSz * 0.72,
            height: containerSz * 0.72,
            borderRadius: containerSz,
            backgroundColor: color,
          },
          haloStyle,
        ]}
      />

      {/* Cuerpo articulado */}
      <Animated.View
        style={[
          {
            width: CW * sc,
            height: CH * sc,
            position: "relative",
          },
          bodyStyle,
        ]}
      >
        {/* ── Cabeza ── */}
        <View
          style={{
            position: "absolute",
            top: (HEAD_CY - HEAD_R) * sc,
            left: (CX - HEAD_R) * sc,
            width: HEAD_R * 2 * sc,
            height: HEAD_R * 2 * sc,
            borderRadius: HEAD_R * sc,
            backgroundColor: BODY_COLOR,
            shadowColor: color,
            shadowOpacity: 0.95,
            shadowRadius: 9 * sc,
            shadowOffset: { width: 0, height: 0 },
            elevation: 10,
          }}
        />

        {/* ── Cuello ── */}
        <View
          style={{
            position: "absolute",
            top: (HEAD_CY + HEAD_R) * sc,
            left: (CX - 3) * sc,
            width: 6 * sc,
            height: 7 * sc,
            backgroundColor: BODY_COLOR,
            borderRadius: 3 * sc,
          }}
        />

        {/* ── Pierna izquierda (detrás del torso → zIndex bajo) ── */}
        {pivot(HIP_L, HIP_Y, lThighStyle, (
          <>
            {seg(TH_W, TH_H)}
            {pivot(0, TH_H, lShinStyle, seg(SN_W, SN_H))}
          </>
        ))}

        {/* ── Pierna derecha ── */}
        {pivot(HIP_R, HIP_Y, rThighStyle, (
          <>
            {seg(TH_W, TH_H)}
            {pivot(0, TH_H, rShinStyle, seg(SN_W, SN_H))}
          </>
        ))}

        {/* ── Brazo izquierdo (detrás del torso) ── */}
        {pivot(SH_L, SH_Y, lArmStyle, (
          <>
            {seg(ARM_W, ARM_H)}
            {pivot(0, ARM_H, lFAStyle, seg(FA_W, FA_H))}
          </>
        ))}

        {/* ── Brazo derecho ── */}
        {pivot(SH_R, SH_Y, rArmStyle, (
          <>
            {seg(ARM_W, ARM_H)}
            {pivot(0, ARM_H, rFAStyle, seg(FA_W, FA_H))}
          </>
        ))}

        {/* ── Torso (encima de las articulaciones) ── */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: TORSO_TOP * sc,
              left: (CX - TORSO_W / 2) * sc,
              width: TORSO_W * sc,
              height: TORSO_H * sc,
              backgroundColor: BODY_COLOR,
              borderRadius: (TORSO_W / 3) * sc,
              shadowColor: color,
              shadowOpacity: 0.55,
              shadowRadius: 7 * sc,
              shadowOffset: { width: 0, height: 0 },
            },
            torsoStyle,
          ]}
        />
      </Animated.View>
    </View>
  );
}
