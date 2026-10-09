import { useEffect } from "react";
import { View } from "react-native";
import Svg, { Ellipse, Path, Rect } from "react-native-svg";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { AvatarCabeza } from "@components/gemelo/AvatarCabeza";
import { useAvatarMotion } from "@components/gemelo/useAvatarMotion";
import { ACTIVIDAD_LABELS, type ActividadPredicha } from "@services/types";
import type { Preferencias } from "@services/preferencias";
import { colors } from "@theme/colors";

// Cada pieza gira en su articulación, no en el centro de una imagen completa.
const POSES: Record<ActividadPredicha, { arms: [number, number]; elbows: [number, number]; legs: [number, number]; knees: [number, number]; lean: number; loop?: number }> = {
  permanencia: { arms: [10, -10], elbows: [-8, 8], legs: [3, -3], knees: [0, 0], lean: 0 },
  desplazamiento: { arms: [22, -22], elbows: [-12, 12], legs: [-18, 18], knees: [10, 5], lean: 2, loop: 650 },
  trabajo: { arms: [-30, -25], elbows: [-55, -60], legs: [-80, -80], knees: [80, 80], lean: 0 },
  estudio: { arms: [-25, -32], elbows: [-55, -50], legs: [-80, -80], knees: [80, 80], lean: 4 },
  descanso: { arms: [8, -8], elbows: [0, 0], legs: [2, -2], knees: [0, 0], lean: 90 },
  actividad_fisica: { arms: [125, -125], elbows: [-18, 18], legs: [18, -18], knees: [15, 15], lean: 0, loop: 820 },
  ocio: { arms: [-65, -8], elbows: [-45, 8], legs: [4, -4], knees: [0, 0], lean: -3 },
};

function useJoint(initial: number) {
  const value = useSharedValue(initial);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${value.value}deg` }] }));
  return { value, style };
}

export function AvatarPersonaje({ actividad = "permanencia", preferencias, size }: {
  actividad?: ActividadPredicha | null; preferencias: Preferencias; size: number;
}) {
  const motion = useAvatarMotion();
  const key = actividad && Object.prototype.hasOwnProperty.call(POSES, actividad) ? actividad : "permanencia";
  const pose = POSES[key];
  const cat = preferencias.aspecto === "mascota";
  const sc = size / 208;
  const shirt = colors.avatar.ropa[preferencias.color];
  const skin = colors.avatar.piel[preferencias.piel];
  const la = useJoint(pose.arms[0]), ra = useJoint(pose.arms[1]);
  const le = useJoint(pose.elbows[0]), re = useJoint(pose.elbows[1]);
  const ll = useJoint(pose.legs[0]), rl = useJoint(pose.legs[1]);
  const lk = useJoint(pose.knees[0]), rk = useJoint(pose.knees[1]);
  const tail = useJoint(0);
  const lean = useSharedValue(pose.lean), breath = useSharedValue(0);

  useEffect(() => {
    const joints = [la, ra, le, re, ll, rl, lk, rk, tail];
    const stop = () => { joints.forEach(j => cancelAnimation(j.value)); cancelAnimation(lean); cancelAnimation(breath); };
    stop();
    const values = [...pose.arms, ...pose.elbows, ...pose.legs, ...pose.knees, 0];
    joints.forEach((joint, i) => { joint.value.value = motion ? withTiming(values[i], { duration: 450 }) : values[i]; });
    lean.value = motion ? withTiming(pose.lean, { duration: 450 }) : pose.lean;
    breath.value = 0;
    if (!motion) return stop;
    const swing = (a: number, b: number, ms: number) => withRepeat(withSequence(
      withTiming(a, { duration: ms, easing: Easing.inOut(Easing.sin) }),
      withTiming(b, { duration: ms, easing: Easing.inOut(Easing.sin) }),
    ), -1, false);
    if (pose.loop) {
      const exercise = key === "actividad_fisica";
      la.value.value = swing(pose.arms[0], exercise ? 100 : -22, pose.loop);
      ra.value.value = swing(pose.arms[1], exercise ? -100 : 22, pose.loop);
      ll.value.value = swing(pose.legs[0], exercise ? 5 : 18, pose.loop);
      rl.value.value = swing(pose.legs[1], exercise ? -5 : -18, pose.loop);
    }
    tail.value.value = swing(-8, 12, 1700);
    breath.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
    return stop;
  // Los shared values conservan su identidad; la pose depende únicamente de key.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, motion]);

  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${lean.value}deg` }, { translateY: -breath.value * 1.5 * sc }] }));
  const seated = key === "trabajo" || key === "estudio";
  const pivot = (x: number, y: number, style: object, children: React.ReactNode) => <Animated.View
    style={[{ position: "absolute", left: x * sc, top: y * sc, width: 0, height: 0 }, style]}>{children}</Animated.View>;
  const limb = (w: number, h: number, fill: string) => <View style={{ position: "absolute", left: -w * sc / 2 }}>
    <Svg width={w * sc} height={h * sc} viewBox={`0 0 ${w} ${h}`}><Rect width={w} height={h} rx={w / 2} fill={fill} /></Svg>
  </View>;
  const shoe = <View style={{ position: "absolute", left: -7 * sc, top: 23 * sc }}>
    <Svg width={20 * sc} height={11 * sc} viewBox="0 0 20 11"><Path d="M1 3Q1 0 5 0H9Q10 4 16 4Q20 4 20 8V10H1Z" fill={colors.avatar.zapatos} /></Svg>
  </View>;

  return <View accessible accessibilityLabel={`${cat ? "Mascota" : "Personaje"}, postura de ${ACTIVIDAD_LABELS[key]}`} style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
    <Svg width={size} height={size} style={{ position: "absolute" }} viewBox="0 0 208 208">
      <Ellipse cx="104" cy="108" rx="74" ry="78" fill={shirt} opacity="0.06" />
      <Ellipse cx="104" cy="189" rx="47" ry="6" fill={colors.avatar.suelo} opacity="0.6" />
    </Svg>
    <Animated.View style={[{ width: 160 * sc, height: 208 * sc }, bodyStyle]}>
      {cat ? <>
        {pivot(111, 110, tail.style, <Svg width={61 * sc} height={62 * sc} viewBox="0 0 61 62">
          <Path d="M0 10Q34 43 42 19Q47 7 38 5" stroke={colors.avatar.mascota} strokeWidth="11" fill="none" strokeLinecap="round" />
        </Svg>)}
        <Svg width={160 * sc} height={208 * sc} viewBox="0 0 160 208" style={{ position: "absolute" }}>
          <Rect x="51" y="80" width="58" height="72" rx="29" fill={colors.avatar.mascota} />
          <Ellipse cx="80" cy="124" rx="20" ry="23" fill={colors.originalAvatar} />
          <Path d="M55 85Q80 98 105 85" stroke={shirt} strokeWidth="7" fill="none" />
          <Ellipse cx="80" cy="96" rx="5" ry="6" fill={colors.accent.amber} />
        </Svg>
        {pivot(60, 142, ll.style, limb(17, 27, colors.avatar.mascota))}
        {pivot(100, 142, rl.style, limb(17, 27, colors.avatar.mascota))}
        {pivot(51, 95, la.style, limb(14, 31, colors.avatar.mascota))}
        {pivot(109, 95, ra.style, limb(14, 31, colors.avatar.mascota))}
        <View style={{ position: "absolute", left: 40 * sc, top: 17 * sc }}><AvatarCabeza preferencias={preferencias} size={80 * sc} dormido={key === "descanso"} /></View>
      </> : <>
        {seated && <Svg width={160 * sc} height={208 * sc} style={{ position: "absolute" }} viewBox="0 0 160 208">
          <Path d="M55 103V133H98M60 134V171" stroke={colors.avatar.mesa} strokeWidth="5" strokeLinecap="round" fill="none" />
          <Rect x="104" y="105" width="50" height="6" rx="3" fill={colors.avatar.mesa} />
          <Rect x="143" y="110" width="5" height="60" rx="2" fill={colors.avatar.mesa} />
          {key === "estudio" ? <Path d="M111 102L129 98L148 101V105H111Z" fill={colors.avatar.zapatos} /> : <Path d="M115 84H141L147 104H111Z" fill={colors.avatar.pantalon} />}
        </Svg>}
        {pivot(70, 117, ll.style, <>{limb(12, 30, colors.avatar.pantalon)}{pivot(0, 28, lk.style, <>{limb(10, 28, colors.avatar.pantalon)}{shoe}</>)}</>)}
        {pivot(90, 117, rl.style, <>{limb(12, 30, colors.avatar.pantalon)}{pivot(0, 28, rk.style, <>{limb(10, 28, colors.avatar.pantalon)}{shoe}</>)}</>)}
        <Svg width={160 * sc} height={208 * sc} style={{ position: "absolute" }} viewBox="0 0 160 208">
          <Path d="M60 78Q64 71 72 71H88Q96 71 100 78L102 119Q80 126 58 119Z" fill={shirt} />
          <Path d="M71 73Q80 82 89 73" stroke={colors.white} strokeOpacity="0.35" strokeWidth="2" fill="none" />
          <Path d="M94 81L96 113" stroke={colors.avatar.cara} strokeOpacity="0.12" strokeWidth="3" strokeLinecap="round" />
        </Svg>
        {pivot(59, 80, la.style, <>{limb(11, 24, shirt)}{pivot(0, 22, le.style, <>{limb(9, 24, skin)}</>)}</>)}
        {pivot(101, 80, ra.style, <>{limb(11, 24, shirt)}{pivot(0, 22, re.style, <>{limb(9, 24, skin)}</>)}</>)}
        <View style={{ position: "absolute", left: 44 * sc, top: 3 * sc }}><AvatarCabeza preferencias={preferencias} size={72 * sc} dormido={key === "descanso"} /></View>
      </>}
    </Animated.View>
  </View>;
}
