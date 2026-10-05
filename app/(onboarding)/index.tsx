import { useEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  Text,
  View,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { MotiView, AnimatePresence } from "moti";
import {
  Activity,
  ArrowRight,
  Bell,
  Brain,
  ChevronRight,
  Database,
  FlaskConical,
  Heart,
  Lock,
  MapPin,
  Shield,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { marcarOnboardingCompletado } from "@services/onboarding";
import { solicitarPermisosNotificacion } from "@services/notificaciones";
import { colors } from "@theme/colors";

const { width, height } = Dimensions.get("window");

// ─── Datos de cada slide ──────────────────────────────────────────────────────

const SLIDES = [
  {
    id: "bienvenida",
    gradiente: ["#0e1224", "#0d2136", "#062f2e"] as const,
    acento: colors.brandCyan,
    icono: Sparkles,
    emoji: "✨",
    titulo: "Tu Gemelo Digital",
    subtitulo: "Una copia inteligente de ti",
    descripcion:
      "ando aprende de tus sensores —pasos, movimiento, zonas y hábitos— para construir un modelo personalizado de tu vida cotidiana.",
    extra: null,
  },
  {
    id: "como-funciona",
    gradiente: ["#0e1224", "#1a0e2e", "#0e1224"] as const,
    acento: colors.violet,
    icono: Brain,
    emoji: "🧠",
    titulo: "Random Forest en tu bolsillo",
    subtitulo: "IA que corre en tu teléfono",
    descripcion:
      "Un algoritmo de aprendizaje automático analiza tus patrones de actividad para predecir qué harás a continuación y detectar variaciones en tu rutina.",
    extra: [
      { icon: Activity, text: "Acelerómetro + GPS" },
      { icon: Heart, text: "Frecuencia cardíaca" },
      { icon: Zap, text: "Predicción < 2ms" },
    ],
  },
  {
    id: "privacidad",
    gradiente: ["#0e1224", "#0e1f12", "#0e1224"] as const,
    acento: colors.accent.mint,
    icono: Shield,
    emoji: "🔒",
    titulo: "Privacidad por diseño",
    subtitulo: "Tus datos son solo tuyos",
    descripcion:
      "Nunca almacenamos tu ubicación exacta. Las coordenadas GPS se transforman en zonas anónimas. Solo tú accedes a tus datos mediante Row Level Security.",
    extra: [
      { icon: MapPin, text: "Zonas anónimas, no coordenadas" },
      { icon: Lock, text: "RLS: solo tú puedes leer tus datos" },
      { icon: Database, text: "Exportación completa en cualquier momento" },
    ],
  },
  {
    id: "investigacion",
    gradiente: ["#0e1224", "#1a1204", "#0e1224"] as const,
    acento: colors.accent.amber,
    icono: FlaskConical,
    emoji: "🔬",
    titulo: "Proyecto académico UNSCH",
    subtitulo: "Ciencia con propósito, Ayacucho 2026",
    descripcion:
      "Si participas en la investigación, tus datos anonimizados contribuyen a estudios sobre actividad humana y gemelos digitales. Siempre con tu consentimiento explícito.",
    extra: [
      { icon: UserCheck, text: "Participación voluntaria" },
      { icon: Shield, text: "Ley N° 29733 — Datos Personales Perú" },
      { icon: FlaskConical, text: "Resultados publicados abiertamente" },
    ],
  },
  {
    id: "notificaciones",
    gradiente: ["#0e1224", "#1f0e14", "#0e1224"] as const,
    acento: colors.accent.coral,
    icono: Bell,
    emoji: "🔔",
    titulo: "Alertas que cuidan tu salud",
    subtitulo: "Solo lo que importa, cuando importa",
    descripcion:
      "ando puede avisarte cuando detecta sedentarismo prolongado, frecuencia cardíaca fuera del rango, o cuando alcanzas tu meta del día.",
    extra: null,
    accionLabel: "Activar notificaciones (recomendado)",
    esUltimoConAccion: true,
  },
] as const;

// ─── Componente de slide ──────────────────────────────────────────────────────

function Slide({
  slide,
  activo,
  onActivarNotif,
  notifActivadas,
}: {
  slide: (typeof SLIDES)[number];
  activo: boolean;
  onActivarNotif: () => void;
  notifActivadas: boolean;
}) {
  const Icon = slide.icono;
  const acento = slide.acento;

  return (
    <MotiView
      animate={{ opacity: activo ? 1 : 0, scale: activo ? 1 : 0.96 }}
      transition={{ type: "timing", duration: 350 }}
      style={{ width, position: "absolute", left: 0, top: 0, bottom: 0 }}
      pointerEvents={activo ? "auto" : "none"}
    >
      <View className="flex-1 items-center justify-center px-8">
        {/* Ícono principal con halo */}
        <MotiView
          from={{ scale: 0.6, opacity: 0 }}
          animate={activo ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
          transition={{ type: "spring", delay: activo ? 100 : 0 }}
          className="items-center justify-center mb-8"
        >
          <View
            className="w-28 h-28 rounded-[40px] items-center justify-center"
            style={{
              backgroundColor: `${acento}18`,
              borderWidth: 1,
              borderColor: `${acento}30`,
              shadowColor: acento,
              shadowOpacity: 0.4,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Text style={{ fontSize: 52 }}>{slide.emoji}</Text>
          </View>
        </MotiView>

        {/* Texto */}
        <MotiView
          from={{ translateY: 16, opacity: 0 }}
          animate={activo ? { translateY: 0, opacity: 1 } : { translateY: 16, opacity: 0 }}
          transition={{ type: "timing", duration: 380, delay: activo ? 180 : 0 }}
        >
          <Text
            className="text-3xl font-bold text-center text-white"
            style={{ fontFamily: "SpaceGrotesk_700Bold" }}
          >
            {slide.titulo}
          </Text>
          <Text className="text-center mt-1 font-semibold" style={{ color: acento }}>
            {slide.subtitulo}
          </Text>
          <Text className="text-center text-ink-300 mt-4 text-base leading-6">
            {slide.descripcion}
          </Text>
        </MotiView>

        {/* Features */}
        {slide.extra && (
          <MotiView
            from={{ translateY: 12, opacity: 0 }}
            animate={activo ? { translateY: 0, opacity: 1 } : { translateY: 12, opacity: 0 }}
            transition={{ type: "timing", duration: 380, delay: activo ? 280 : 0 }}
            className="mt-6 w-full gap-3"
          >
            {(slide.extra as readonly { icon: any; text: string }[]).map(({ icon: FIcon, text }) => (
              <View
                key={text}
                className="flex-row items-center gap-3 bg-white/6 rounded-2xl px-4 py-3 border border-white/8"
              >
                <View
                  className="w-8 h-8 rounded-xl items-center justify-center"
                  style={{ backgroundColor: `${acento}18` }}
                >
                  <FIcon size={16} color={acento} />
                </View>
                <Text className="text-white text-sm font-medium">{text}</Text>
              </View>
            ))}
          </MotiView>
        )}

        {/* Acción de notificaciones */}
        {"esUltimoConAccion" in slide && slide.esUltimoConAccion && (
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={activo ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", delay: activo ? 300 : 0 }}
            className="mt-8 w-full"
          >
            {!notifActivadas ? (
              <Pressable
                onPress={onActivarNotif}
                className="w-full py-4 rounded-2xl items-center border"
                style={{ backgroundColor: `${acento}18`, borderColor: `${acento}40` }}
              >
                <Text className="font-bold text-base" style={{ color: acento }}>
                  🔔 Activar notificaciones
                </Text>
                <Text className="text-ink-400 text-xs mt-1">
                  Puedes cambiar esto en cualquier momento
                </Text>
              </Pressable>
            ) : (
              <View className="w-full py-4 rounded-2xl items-center bg-emerald-500/10 border border-emerald-400/30">
                <Text className="text-emerald-300 font-bold text-base">✅ Notificaciones activadas</Text>
              </View>
            )}
            <Text className="text-ink-500 text-xs text-center mt-3">
              También puedes omitir esto y activarlas luego en Perfil
            </Text>
          </MotiView>
        )}
      </View>
    </MotiView>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter();
  const [slideActual, setSlideActual] = useState(0);
  const [notifActivadas, setNotifActivadas] = useState(false);
  const [cargando, setCargando] = useState(false);

  const esUltimo = slideActual === SLIDES.length - 1;

  const handleSiguiente = async () => {
    if (esUltimo) {
      setCargando(true);
      await marcarOnboardingCompletado();
      router.replace("/(auth)/welcome" as any);
    } else {
      setSlideActual((prev) => prev + 1);
    }
  };

  const handleSaltar = async () => {
    await marcarOnboardingCompletado();
    router.replace("/(auth)/welcome" as any);
  };

  const handleActivarNotif = async () => {
    const { concedido } = await solicitarPermisosNotificacion();
    setNotifActivadas(concedido);
  };

  const slide = SLIDES[slideActual];

  return (
    <View className="flex-1 bg-surface-900">
      <StatusBar barStyle="light-content" />

      {/* Gradiente de fondo dinámico */}
      <LinearGradient
        colors={[...slide.gradiente]}
        style={{ position: "absolute", inset: 0 }}
      />

      {/* Botón saltar */}
      {!esUltimo && (
        <Pressable
          onPress={handleSaltar}
          className="absolute top-14 right-6 z-10 px-4 py-2 rounded-full bg-white/10"
        >
          <Text className="text-ink-300 text-sm font-medium">Omitir</Text>
        </Pressable>
      )}

      {/* Slides */}
      <View className="flex-1" style={{ paddingTop: 60 }}>
        {SLIDES.map((s, i) => (
          <Slide
            key={s.id}
            slide={s}
            activo={i === slideActual}
            onActivarNotif={handleActivarNotif}
            notifActivadas={notifActivadas}
          />
        ))}
      </View>

      {/* ── Pie de página ── */}
      <View className="pb-12 px-8">
        {/* Indicadores de posición */}
        <View className="flex-row justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <MotiView
              key={i}
              animate={{
                width: i === slideActual ? 24 : 6,
                opacity: i === slideActual ? 1 : 0.35,
              }}
              transition={{ type: "timing", duration: 250 }}
              className="h-1.5 rounded-full"
              style={{ backgroundColor: slide.acento }}
            />
          ))}
        </View>

        {/* Botón de avance */}
        <Pressable
          onPress={handleSiguiente}
          disabled={cargando}
          className="w-full py-4 rounded-2xl flex-row items-center justify-center gap-2 active:opacity-80"
          style={{ backgroundColor: slide.acento }}
        >
          <Text className="font-bold text-lg text-surface-900">
            {esUltimo ? "Comenzar" : "Siguiente"}
          </Text>
          {esUltimo ? (
            <Sparkles size={20} color="#0e1224" />
          ) : (
            <ChevronRight size={20} color="#0e1224" />
          )}
        </Pressable>
      </View>
    </View>
  );
}
