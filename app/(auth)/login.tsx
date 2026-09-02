import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MotiView } from "moti";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Eye,
  EyeOff,
  Lock,
  TriangleAlert,
} from "lucide-react-native";

import { Button } from "@components/ui/Button";
import { TextInput } from "@components/ui/TextInput";
import { Brand } from "@components/ui/Brand";
import { AuthLayout } from "@components/ui/AuthLayout";
import { loginSchema, type LoginInput } from "@schemas/auth";
import { useAuthStore } from "@stores/authStore";
import { isSupabaseConfigured } from "@constants/config";
import { colors } from "@theme/colors";

export default function Login() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const enterDemo = useAuthStore((s) => s.enterDemo);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setLoading(true);
    const { error } = await signIn(values);
    setLoading(false);
    if (error) {
      setServerError(error);
      return;
    }
    router.replace("/(tabs)");
  });

  return (
    <AuthLayout>
      <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Barra superior con back */}
            <View className="flex-row items-center justify-between pt-2 pb-6">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full border border-outline-variant/40 items-center justify-center bg-surface-container/40"
                accessibilityRole="button"
                accessibilityLabel="Volver"
              >
                <ArrowLeft size={18} color="#dee1fb" />
              </Pressable>
              <Brand size="sm" />
              <View className="w-10" />
            </View>

            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 400 }}
            >
              <Text
                className="text-on-background"
                style={{
                  fontFamily: "SpaceGrotesk_700Bold",
                  fontSize: 32,
                  letterSpacing: -0.8,
                  lineHeight: 36,
                }}
              >
                Bienvenida/o
              </Text>
              <Text
                className="text-on-surface-variant mt-2"
                style={{ fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 22 }}
              >
                Ingresa a tu gemelo digital para continuar aprendiendo tu rutina.
              </Text>
            </MotiView>

            {/* Formulario */}
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 450, delay: 120 }}
              className="mt-8 gap-4"
            >
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    label="Correo institucional"
                    placeholder="tu.correo@lapontificia.edu.pe"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    leadingIcon={<AtSign size={18} color={colors.fieldIcon} />}
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    label="Contraseña"
                    placeholder="Al menos 8 caracteres"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    leadingIcon={<Lock size={18} color={colors.fieldIcon} />}
                    trailingIcon={
                      <Pressable
                        onPress={() => setShowPassword((v) => !v)}
                        hitSlop={12}
                        accessibilityRole="button"
                        accessibilityLabel={
                          showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} color={colors.fieldIcon} />
                        ) : (
                          <Eye size={18} color={colors.fieldIcon} />
                        )}
                      </Pressable>
                    }
                  />
                )}
              />

              <Pressable
                onPress={() =>
                  setServerError(
                    "La recuperación de contraseña estará disponible en la siguiente versión.",
                  )
                }
                className="self-end"
              >
                <Text
                  className="text-primary-container"
                  style={{ fontFamily: "Inter_500Medium", fontSize: 13 }}
                >
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>

              {serverError ? (
                <MotiView
                  from={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "timing", duration: 200 }}
                  className="flex-row items-start gap-2 rounded-2xl border border-error/40 bg-error-container/30 p-3"
                >
                  <TriangleAlert size={16} color="#ffb4ab" />
                  <Text
                    className="flex-1 text-error"
                    style={{ fontFamily: "Inter_500Medium", fontSize: 13 }}
                  >
                    {serverError}
                  </Text>
                </MotiView>
              ) : null}

              <Button
                label="Ingresar"
                loading={loading}
                trailingIcon={<ArrowRight size={18} color={colors.onPrimary} />}
                className="bg-primary-container active:bg-primary-fixed mt-2"
                labelClassName="text-on-primary"
                onPress={onSubmit}
              />

              {!isSupabaseConfigured ? (
                <View className="rounded-2xl border border-outline-variant/30 bg-surface-container/40 p-3 mt-2">
                  <Text
                    className="text-on-surface-variant"
                    style={{ fontFamily: "Inter_500Medium", fontSize: 12 }}
                  >
                    Aún no has configurado Supabase (falta tu .env). Puedes
                    explorar la interfaz en modo demo.
                  </Text>
                </View>
              ) : null}

              <Button
                label="Continuar en modo demo"
                variant="ghost"
                labelClassName="text-on-surface"
                onPress={() => {
                  enterDemo();
                  router.replace("/(tabs)");
                }}
              />
            </MotiView>

            <View className="mt-10 items-center">
              <Text
                className="text-on-surface-variant"
                style={{ fontFamily: "Inter_400Regular", fontSize: 13 }}
              >
                ¿Aún no tienes cuenta?{" "}
                <Link
                  href="/(auth)/register"
                  className="text-primary-container"
                  style={{ fontFamily: "Inter_600SemiBold" }}
                >
                  Crear una
                </Link>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
    </AuthLayout>
  );
}
