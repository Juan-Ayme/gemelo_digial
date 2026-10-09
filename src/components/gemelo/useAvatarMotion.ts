import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, AppState } from "react-native";
import { useFocusEffect } from "expo-router";

/** Evita gastar batería fuera de la pantalla y respeta Reducir movimiento. */
export function useAvatarMotion() {
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(AppState.currentState === "active");
  const [reduced, setReduced] = useState(true);
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false); }, []));
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value); }).catch(() => {});
    const accessibility = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    const state = AppState.addEventListener("change", value => setActive(value === "active"));
    return () => { mounted = false; accessibility.remove(); state.remove(); };
  }, []);
  return focused && active && !reduced;
}
