import { useEffect, useState } from "react";
import { Redirect } from "expo-router";

import { useIsAuthenticated } from "@stores/authStore";
import { verificarOnboardingCompletado } from "@services/onboarding";

export default function Index() {
  const authed = useIsAuthenticated();
  const [onboardingListo, setOnboardingListo] = useState<boolean | null>(null);

  useEffect(() => {
    verificarOnboardingCompletado().then(setOnboardingListo);
  }, []);

  // Espera hasta saber el estado del onboarding
  if (onboardingListo === null) return null;

  // Primera vez: mostrar onboarding
  if (!onboardingListo) {
    return <Redirect href={"/(onboarding)" as any} />;
  }

  // Ya vio el onboarding: ruta normal según sesión
  return authed ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/welcome" />;
}
