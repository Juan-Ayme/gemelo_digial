import { Redirect } from "expo-router";

import { useIsAuthenticated } from "@stores/authStore";

export default function Index() {
  const authed = useIsAuthenticated();
  return authed ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/welcome" />;
}
