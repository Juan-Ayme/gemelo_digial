import { useState } from "react";
import {
  Alert,
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
  Check,
  CircleCheck,
  Eye,
  EyeOff,
  Lock,
  Sparkles,
  TriangleAlert,
  User,
} from "lucide-react-native";

import { Button } from "@components/ui/Button";
import { TextInput } from "@components/ui/TextInput";
import { Brand } from "@components/ui/Brand";
import { AuthLayout } from "@components/ui/AuthLayout";
import { registerSchema, type RegisterInput } from "@schemas/auth";
import { useAuthStore } from "@stores/authStore";
import { config, isSupabaseConfigured } from "@constants/config";
import { colors } from "@theme/colors";

export default function Register() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      alias: "",
      email: "",
      password: "",
      confirmPassword: "",
      aceptaTerminos: false,
    },
  });

  const passwordValue = watch("password") ?? "";
  const strength = calcularFortaleza(passwordValue);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    setSuccess(null);
    setLoading(true);
    const { error } = await signUp(values);
    setLoading(false);
    if (error) {
      setServerError(error);
      return;
    }
    // Éxito: si Supabase requiere confirmación por correo, mostramos aviso.
    if (isSupabaseConfigured) {
      setSuccess(
        "Cuenta creada. Revisa tu correo para confirmar antes de iniciar sesión.",
      );
      Alert.alert(
        "Cuenta creada",
        "Revisa tu bandeja de entrada para confirmar el correo. Después inicia sesión.",
        [
          {
            text: "Ir a iniciar sesión",
            onPress: () => router.replace("/(auth)/login"),
          },
        ],
      );
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
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
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
              <View className="flex-row items-center gap-2 mb-3">
                <View className="w-8 h-8 rounded-full bg-primary-container/20 items-center justify-center">
                  <Sparkles size={16} color={colors.brandCyan} />
                </View>
                <Text
                  className="text-primary-container"
                  style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 1.4 }}
                >
                  CREA TU GEMELO
                </Text>
              </View>
              <Text
                className="text-on-background"
                style={{
                  fontFamily: "SpaceGrotesk_700Bold",
                  fontSize: 30,
                  letterSpacing: -0.8,
                  lineHeight: 34,
                }}
              >
                Elige un alias.{"\n"}No necesitamos tu nombre real.
              </Text>
              <Text
                className="text-on-surface-variant mt-3"
                style={{ fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 }}
              >
                {config.app.name} construye tu rutina desde señales que tú autorizas,
                bajo la Ley N.º 29733 y su Reglamento.
              </Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 450, delay: 120 }}
              className="mt-8 gap-4"
            >
              <Controller
                control={control}
                name="alias"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    label="Alias"
                    placeholder="Ej. Luna91"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.alias?.message}
                    leadingIcon={<User size={18} color={colors.fieldIcon} />}
                  />
                )}
              />
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    label="Correo"
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
                  <View className="gap-2">
                    <TextInput
                      label="Contraseña"
                      placeholder="Mínimo 8 caracteres"
                      secureTextEntry={!showPass}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.password?.message}
                      leadingIcon={<Lock size={18} color={colors.fieldIcon} />}
                      trailingIcon={
                        <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={12}>
                          {showPass ? (
                            <EyeOff size={18} color={colors.fieldIcon} />
                          ) : (
                            <Eye size={18} color={colors.fieldIcon} />
                          )}
                        </Pressable>
                      }
                    />
                    {value ? <BarraFortaleza fuerza={strength} /> : null}
                  </View>
                )}
              />
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    label="Confirmar contraseña"
                    placeholder="Repite tu contraseña"
                    secureTextEntry={!showConfirm}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                    leadingIcon={<Lock size={18} color={colors.fieldIcon} />}
                    trailingIcon={
                      <Pressable onPress={() => setShowConfirm((v) => !v)} hitSlop={12}>
                        {showConfirm ? (
                          <EyeOff size={18} color={colors.fieldIcon} />
                        ) : (
                          <Eye size={18} color={colors.fieldIcon} />
                        )}
                      </Pressable>
                    }
                  />
                )}
              />

              <Controller
                control={control}
                name="aceptaTerminos"
                render={({ field: { value, onChange } }) => (
                  <View>
                    <Pressable
                      onPress={() => onChange(!value)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: value }}
                      className="flex-row items-start gap-3"
                    >
                      <View
                        className={`w-6 h-6 rounded-lg items-center justify-center border ${
                          value
                            ? "bg-primary-container border-primary-container"
                            : "border-outline-variant/50 bg-surface-container/40"
                        }`}
                      >
                        {value ? <Check size={14} color={colors.onPrimary} /> : null}
                      </View>
                      <View className="flex-1">
                        <Text
                          className="text-on-surface"
                          style={{ fontFamily: "Inter_500Medium", fontSize: 14, lineHeight: 20 }}
                        >
                          Acepto el aviso de privacidad
                        </Text>
                        <Text
                          className="text-on-surface-variant mt-0.5"
                          style={{ fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18 }}
                        >
                          Consentimiento revocable en cualquier momento. Ley N.º 29733
                          y su Reglamento (D. S. 016-2024-JUS).
                        </Text>
                      </View>
                    </Pressable>
                    {errors.aceptaTerminos?.message ? (
                      <Text
                        className="text-error mt-2"
                        style={{ fontFamily: "Inter_500Medium", fontSize: 12 }}
                      >
                        {errors.aceptaTerminos.message}
                      </Text>
                    ) : null}
                  </View>
                )}
              />

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

              {success ? (
                <MotiView
                  from={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "timing", duration: 200 }}
                  className="flex-row items-start gap-2 rounded-2xl border border-tertiary/40 bg-tertiary-container/20 p-3"
                >
                  <CircleCheck size={16} color="#39efa2" />
                  <Text
                    className="flex-1 text-tertiary"
                    style={{ fontFamily: "Inter_500Medium", fontSize: 13 }}
                  >
                    {success}
                  </Text>
                </MotiView>
              ) : null}

              <Button
                label="Crear gemelo digital"
                loading={loading}
                trailingIcon={<ArrowRight size={18} color={colors.onPrimary} />}
                className="bg-primary-container active:bg-primary-fixed mt-1"
                labelClassName="text-on-primary"
                onPress={onSubmit}
              />

              {!isSupabaseConfigured ? (
                <View className="rounded-2xl border border-outline-variant/30 bg-surface-container/40 p-3">
                  <Text
                    className="text-on-surface-variant"
                    style={{ fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 18 }}
                  >
                    Sin Supabase configurado (falta .env). El registro
                    activará el modo demo sin crear cuenta real.
                  </Text>
                </View>
              ) : null}
            </MotiView>

            <View className="mt-10 items-center">
              <Text
                className="text-on-surface-variant"
                style={{ fontFamily: "Inter_400Regular", fontSize: 13 }}
              >
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/(auth)/login"
                  className="text-primary-container"
                  style={{ fontFamily: "Inter_600SemiBold" }}
                >
                  Iniciar sesión
                </Link>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
    </AuthLayout>
  );
}

function calcularFortaleza(password: string): 0 | 1 | 2 | 3 | 4 {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

function BarraFortaleza({ fuerza }: { fuerza: 0 | 1 | 2 | 3 | 4 }) {
  const colores = ["#5b6382", "#ffb4ab", "#f59e0b", "#39E7FF", "#39efa2"];
  const etiquetas = ["Muy débil", "Débil", "Aceptable", "Buena", "Excelente"];
  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1 h-1.5 rounded-full bg-surface-container overflow-hidden">
        <MotiView
          from={{ width: "0%" }}
          animate={{ width: `${(fuerza / 4) * 100}%` as any }}
          transition={{ type: "timing", duration: 260 }}
          style={{ height: "100%", backgroundColor: colores[fuerza] }}
        />
      </View>
      <Text
        style={{
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          color: colores[fuerza],
          minWidth: 68,
          textAlign: "right",
        }}
      >
        {etiquetas[fuerza]}
      </Text>
    </View>
  );
}
