import Constants from "expo-constants";

type Extra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const config = {
  supabase: {
    url:
      extra.supabaseUrl ??
      process.env.EXPO_PUBLIC_SUPABASE_URL ??
      "",
    anonKey:
      extra.supabaseAnonKey ??
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
      "",
  },
  app: {
    name: "ando",
    projectName: "Gemelo Digital",
    institution: "La Pontificia - Ayacucho",
    consentVersion: "v1.0",
    defaultTimezone: "America/Lima",
  },
} as const;

export const isSupabaseConfigured = Boolean(
  config.supabase.url && config.supabase.anonKey,
);
