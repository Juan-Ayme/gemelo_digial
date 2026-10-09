import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { colors } from "@theme/colors";
import type { Preferencias } from "@services/preferencias";

/** Retrato vectorial compartido por el personaje y el selector de apariencias. */
export function AvatarCabeza({ preferencias, size = 72, dormido = false }: { preferencias: Preferencias; size?: number; dormido?: boolean }) {
  const { aspecto, piel } = preferencias;
  const skin = colors.avatar.piel[piel];
  const ink = colors.avatar.cara;
  if (aspecto === "neutral") return <Svg width={size} height={size * 84 / 72} viewBox="0 0 72 84">
    <Circle cx="36" cy="34" r="21" fill={colors.originalAvatar} /><Rect x="31" y="56" width="10" height="14" rx="5" fill={colors.originalAvatar} />
    <Path d="M15 82V76Q15 66 25 66H47Q57 66 57 76V82" fill={colors.originalAvatar} />
  </Svg>;
  if (aspecto === "mascota") return <Svg width={size} height={size * 84 / 72} viewBox="0 0 72 84">
    <Path d="M12 30L11 7Q12 2 17 6L30 20M42 20L57 6Q62 2 62 8L60 32" fill={colors.avatar.mascota} />
    <Path d="M16 23L16 10L26 22M47 22L57 10L56 24" fill={colors.avatar.interiorOreja} />
    <Rect x="9" y="18" width="54" height="47" rx="23" fill={colors.avatar.mascota} />
    <Path d="M29 20L33 29M36 19V29M43 20L40 29" stroke={colors.avatar.ropa.menta} strokeWidth="3" strokeLinecap="round" />
    {dormido ? <Path d="M20 39Q25 43 29 39M43 39Q47 43 52 39" stroke={ink} strokeWidth="2.4" fill="none" strokeLinecap="round" /> : <>
      <Ellipse cx="25" cy="39" rx="3.6" ry="4.5" fill={ink} /><Ellipse cx="47" cy="39" rx="3.6" ry="4.5" fill={ink} />
      <Circle cx="26" cy="38" r="1.1" fill={colors.white} /><Circle cx="48" cy="38" r="1.1" fill={colors.white} />
    </>}
    <Ellipse cx="36" cy="52" rx="13" ry="8" fill={colors.originalAvatar} />
    <Path d="M32 48Q36 46 40 48L36 52Z" fill={colors.avatar.interiorOreja} />
    <Path d="M36 52Q33 57 30 53M36 52Q39 57 42 53M20 49L7 46M20 54L7 56M52 49L65 46M52 54L65 56" stroke={ink} strokeWidth="1.4" strokeLinecap="round" fill="none" />
  </Svg>;
  return <Svg width={size} height={size * 84 / 72} viewBox="0 0 72 84">
    {aspecto === "mujer" && <Path d="M10 38Q4 4 35 4Q66 3 63 40L67 75Q56 83 47 69H23Q14 82 6 74Z" fill={colors.avatar.pelo} />}
    <Rect x="29" y="57" width="14" height="18" rx="6" fill={skin} />
    <Ellipse cx="14" cy="38" rx="5" ry="7" fill={skin} /><Ellipse cx="58" cy="38" rx="5" ry="7" fill={skin} />
    <Rect x="14" y="13" width="44" height="50" rx="21" fill={skin} />
    <Path d="M49 19Q63 44 48 59Q58 53 58 35V24Z" fill={ink} opacity="0.1" />
    {aspecto === "mujer" ? <>
      <Path d="M12 35Q8 4 37 6Q63 4 60 35Q48 30 38 16Q29 28 12 35Z" fill={colors.avatar.pelo} />
      <Path d="M15 25Q17 13 30 11" stroke={colors.avatar.peloLuz} strokeWidth="3" strokeLinecap="round" fill="none" />
    </> : <>
      <Path d="M14 31Q5 9 20 9Q24 2 35 7Q45 1 49 9Q67 8 58 31L52 21Q34 24 20 19Z" fill={colors.avatar.pelo} />
      <Path d="M21 15Q33 10 46 14" stroke={colors.avatar.peloLuz} strokeWidth="3" strokeLinecap="round" fill="none" />
    </>}
    <Path d="M23 34Q27 32 31 34M42 34Q46 32 50 34" stroke={ink} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    {dormido ? <Path d="M24 40Q27 43 30 40M43 40Q46 43 49 40" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" /> : <>
      <Circle cx="27" cy="40" r="2.5" fill={ink} /><Circle cx="46" cy="40" r="2.5" fill={ink} />
      <Circle cx="27.7" cy="39.4" r="0.7" fill={colors.white} /><Circle cx="46.7" cy="39.4" r="0.7" fill={colors.white} />
    </>}
    <Path d="M36 42L34 47Q36 49 38 47" stroke={ink} strokeOpacity="0.22" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <Path d="M29 53Q36 58 43 53" stroke={ink} strokeWidth="1.8" fill="none" strokeLinecap="round" />
  </Svg>;
}
