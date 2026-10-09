import { Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { MotiView } from "moti";
import { ArrowRight, Sparkles } from "lucide-react-native";

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
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          className="mb-6 flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-500/15 border border-brand-400/30"
        >
          <Sparkles size={13} color={colors.brandCyan} />
          <Text
            className="text-brand-300 font-semibold tracking-wider uppercase"
            style={{ fontSize: 11, letterSpacing: 1.2 }}
          >
            Gemelo Personal Privado
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 700 }}
        >
          <GemeloAvatar size={210} />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 300 }}
          className="items-center mt-8"
        >
          <Text
            className="text-on-background text-center"
            style={{
              fontFamily: "SpaceGrotesk_700Bold",
              fontSize: 46,
              letterSpacing: -1.2,
              lineHeight: 50,
            }}
          >
            ando
          </Text>
          <Text
            className="text-on-surface-variant text-center mt-3 px-6"
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 16,
              lineHeight: 24,
            }}
          >
            Tu rutina diaria. Tu gemelo digital.{"\n"}Tus datos bajo tu control.
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
          variant="primary"
          onPress={() => router.push("/(auth)/register")}
        />
        <Button
          label="Ya tengo cuenta"
          variant="ghost"
          className="border border-outline-variant/50 bg-surface-container/30"
          labelClassName="text-on-surface"
          onPress={() => router.push("/(auth)/login")}
        />
        <Link href="/(tabs)" asChild onPress={() => enterDemo()}>
          <Text
            className="text-secondary text-center mt-1 py-1"
            style={{ fontFamily: "Inter_500Medium", fontSize: 14 }}
          >
            Explorar demo sin registro
          </Text>
        </Link>
      </MotiView>
    </AuthLayout>
  );
}
