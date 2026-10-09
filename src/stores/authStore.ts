import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@lib/supabase";
import { queryClient } from "@lib/queryClient";
import { traducirErrorAuth } from "@lib/authErrors";
import type { LoginInput, RegisterInput } from "@schemas/auth";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  initialized: boolean;
  demoMode: boolean;
  init: () => Promise<void>;
  signIn: (input: LoginInput) => Promise<{ error?: string }>;
  signUp: (input: RegisterInput) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  enterDemo: (alias?: string) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  loading: false,
  initialized: false,
  demoMode: false,

  async init() {
    if (get().initialized) return;
    if (!supabase) {
      set({ initialized: true });
      return;
    }
    set({ loading: true });
    const { data } = await supabase.auth.getSession();
    supabase.auth.onAuthStateChange((event, session) => {
      set({ session, user: session?.user ?? null, demoMode: false });
      // Al cerrar sesión (o expirar el token) descartamos datos cacheados
      // para que no se filtren entre cuentas.
      if (event === "SIGNED_OUT") { queryClient.clear(); import("@services/backgroundCapture").then(m => m.cancelarTareaSegundoPlano()).catch(() => {}); }
    });
    set({
      session: data.session,
      user: data.session?.user ?? null,
      loading: false,
      initialized: true,
    });
  },

  async signIn({ email, password }) {
    if (!supabase) {
      get().enterDemo();
      return {};
    }
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    return error ? { error: traducirErrorAuth(error.message) } : {};
  },

  async signUp({ email, password, alias }) {
    if (!supabase) {
      get().enterDemo(alias);
      return {};
    }
    set({ loading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { alias } },
    });
    set({ loading: false });
    return error ? { error: traducirErrorAuth(error.message) } : {};
  },

  async signOut() {
    const id = get().user?.id;
    if (id) await import("@services/planPersonal").then(m => m.cancelarRecordatoriosPlanes(id));
    await import("@services/backgroundCapture").then(m => m.cancelarTareaSegundoPlano());
    await import("@services/notificaciones").then(m => m.cancelarTodasLasNotificaciones());
    if (supabase && !get().demoMode) { const { error } = await supabase.auth.signOut(); if (error) throw error; }
    set({ session: null, user: null, demoMode: false });
    queryClient.clear();
    // Cancela la tarea de segundo plano al cerrar sesión
    import("@services/backgroundCapture")
      .then(({ cancelarTareaSegundoPlano }) => cancelarTareaSegundoPlano())
      .catch(() => {});
  },

  enterDemo(alias = "Usuario") {
    const demoUser = {
      id: "demo-user",
      email: "demo@ando.local",
      user_metadata: { alias },
    } as unknown as User;
    set({
      demoMode: true,
      session: null,
      user: demoUser,
      initialized: true,
    });
    queryClient.clear();
    import("@services/backgroundCapture").then(m => m.cancelarTareaSegundoPlano()).catch(() => {});
  },
}));

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => Boolean(s.session) || s.demoMode);
}
