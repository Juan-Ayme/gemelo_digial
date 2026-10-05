import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "ando-onboarding-completado";

export async function verificarOnboardingCompletado(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEY);
    return val === "1";
  } catch {
    return false;
  }
}

export async function marcarOnboardingCompletado(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, "1");
  } catch {}
}

export async function resetearOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
