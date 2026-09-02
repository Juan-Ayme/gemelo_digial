import { Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { MotiView } from "moti";
import { ArrowRight } from "lucide-react-native";

import { Button } from "@components/ui/Button";
import { AuthLayout } from "@components/ui/AuthLayout";
import { GemeloAvatar } from "@components/gemelo/Avatar";
import { useAuthStore } from "@stores/authStore";
import { colors } from "@theme/colors";

export default function Welcome() {
  const router = useRouter();
  const enterDemo = useAuthStore((s) => s.enterDemo);

  return (
    <AuthLayout starCount={48}>
      <View className="flex-1 items-center justify-center px-6">
        <MotiView
          from={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 700 }}
        >
          <GemeloAvatar size={200} />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 300 }}
          className="items-center mt-10"
        >
          <Text
            className="text-on-background text-center"
            style={{
              fontFamily: "SpaceGrotesk_700Bold",
              fontSize: 44,
              letterSpacing: -1.2,
              lineHeight: 48,
            }}
          >
            ando
          </Text>
          <Text
            className="text-on-surface-variant text-center mt-3 px-4"
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              lineHeight: 24,
            }}
          >
            Tu rutina. Tu gemelo. Tus datos.
          </Text>
        </MotiView>
      </View>

      {/* CTA al pie */}
      <MotiView
        from={{ opacity: 0, translateY: 24 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500, delay: 800 }}
        className="px-6 pb-8 gap-3"
      >
        <Button
          label="Crear mi gemelo digital"
          trailingIcon={<ArrowRight size={18} color={colors.onPrimary} />}
          className="bg-primary-container active:bg-primary-fixed"
          labelClassName="text-on-primary"
          onPress={() => router.push("/(auth)/register")}
        />
        <Button
          label="Ya tengo cuenta"
          variant="ghost"
          className="border border-outline-variant/40"
          labelClassName="text-on-surface"
          onPress={() => router.push("/(auth)/login")}
        />
        <Link href="/(tabs)" asChild onPress={() => enterDemo()}>
          <Text
            className="text-on-surface-variant text-center mt-1"
            style={{ fontFamily: "Inter_500Medium", fontSize: 14 }}
          >
            Explorar demo sin registro
          </Text>
        </Link>
      </MotiView>
    </AuthLayout>
  );
}
