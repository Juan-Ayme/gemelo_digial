import { useEffect, useState } from "react";
import {
  Dimensions,
  Pressable,
  Text,
  View,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import {
  Activity,
  Bell,
  Brain,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Database,
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

const { width } = Dimensions.get("window");

// ─── Datos de cada slide ──────────────────────────────────────────────────────

const SLIDES = [
  {
    id: "bienvenida",
    gradiente: ["#030807", "#061813", "#0c1a16"] as const,
    acento: colors.brandCyan,
    icono: Sparkles,
    titulo: "Tu Gemelo Digital",
    subtitulo: "Un compañero para entender tus días",
    descripcion:
      "Observa los momentos que decidas registrar, conoce tu semana y elige un pequeño cambio a tu ritmo.",
    extra: null,
  },
  {
    id: "como-funciona",
    gradiente: ["#030807", "#081622", "#07121b"] as const,
    acento: colors.brandCyan,
    icono: Brain,
    titulo: "De tus datos a tu día",
    subtitulo: "Empieza con un registro sencillo",
    descripcion:
      "Las reglas generales del teléfono ofrecen estimaciones. Una predicción del modelo en la nube solo aparece cuando está disponible y vigente.",
    extra: [
      { icon: Activity, text: "Acelerómetro + Sensores del dispositivo" },
      { icon: Heart, text: "Frecuencia cardíaca y descanso" },
      { icon: Zap, text: "Sin lecturas inventadas cuando faltan datos" },
    ],
  },
  {
    id: "privacidad",
    gradiente: ["#030807", "#061812", "#04140e"] as const,
    acento: colors.accent.mint,
    icono: Shield,
    titulo: "Privacidad por diseño",
    subtitulo: "Tus datos son exclusivamente tuyos",
    descripcion:
      "Nunca almacenamos tu ubicación exacta. El GPS se transforma en códigos de zona anónimos. El acceso de las cuentas se controla con RLS. Los registros locales se guardan en el teléfono.",
    extra: [
      { icon: MapPin, text: "Zonas opacas, nunca coordenadas GPS" },
      { icon: Lock, text: "Seguridad RLS: solo tú lees tus datos" },
      { icon: Database, text: "Exportación completa en cualquier momento" },
    ],
  },
  {
    id: "calibracion",
    gradiente: ["#030807", "#0a1916", "#061310"] as const,
    acento: colors.brand,
    icono: Cpu,
    titulo: "Un cambio que tú eliges",
    subtitulo: "Algo pequeño que te ayude",
    descripcion:
      "Elige un pequeño cambio y marca cuándo lo haces. Prepara mañana con los horarios que te sirvan, sin exigir un día perfecto.",
    extra: [
      { icon: UserCheck, text: "Colaboración voluntaria y revocable" },
      { icon: Shield, text: "Protección bajo Ley N° 29733" },
      { icon: Cpu, text: "Planes elegidos por ti" },
    ],
  },
  {
    id: "notificaciones",
    gradiente: ["#030807", "#121d19", "#061410"] as const,
    acento: colors.brandCyan,
    icono: Bell,
    titulo: "Recordatorios a tu medida",
    subtitulo: "Información relevante en el momento justo",
    descripcion:
      "Puedes programar un recordatorio para un momento de tu plan. Necesita tu consentimiento y los permisos del teléfono.",
    extra: null,
    accionLabel: "Elegir permisos de notificación",
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
              borderWidth: 1.5,
              borderColor: `${acento}35`,
              shadowColor: acento,
              shadowOpacity: 0.45,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 0 },
            }}
          >
            <Icon size={46} color={acento} strokeWidth={2.2} />
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
                className="w-full py-4 rounded-2xl items-center border flex-row justify-center gap-2"
                style={{ backgroundColor: `${acento}18`, borderColor: `${acento}40` }}
              >
                <Bell size={18} color={acento} />
                <Text className="font-bold text-base" style={{ color: acento }}>
                  Activar notificaciones
                </Text>
              </Pressable>
            ) : (
              <View className="w-full py-4 rounded-2xl items-center bg-emerald-500/10 border border-emerald-400/30 flex-row justify-center gap-2">
                <CheckCircle2 size={18} color={colors.accent.mint} />
                <Text className="text-emerald-300 font-bold text-base">Notificaciones activadas</Text>
              </View>
            )}
            <Text className="text-ink-500 text-xs text-center mt-3">
              También puedes omitir esto y configurarlas luego en Perfil
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
    <View className="flex-1 bg-surface-lowest">
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
          <Text className="font-bold text-lg text-ink-950">
            {esUltimo ? "Comenzar" : "Siguiente"}
          </Text>
          {esUltimo ? (
            <Sparkles size={20} color="#022c22" />
          ) : (
            <ChevronRight size={20} color="#022c22" />
          )}
        </Pressable>
      </View>
    </View>
  );
}
