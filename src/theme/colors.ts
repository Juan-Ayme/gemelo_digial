/**
 * Tokens de color usados desde JS (no desde clases Tailwind): tintes de iconos,
 * indicadores, barra de pestañas, etc. La paleta de *utilidades* (clases
 * `bg-brand-500`, `text-ink-900`…) vive en `tailwind.config.js`; aquí van solo
 * los valores que el código TypeScript necesita pasar como props de color.
 *
 * Regla de mantenibilidad: NO escribas hex sueltos en los componentes. Si
 * necesitas un color desde JS, añádelo aquí y refiérelo como `colors.xxx`.
 */
export const colors = {
  sheet: "#101b17",
  scrim: "rgba(0,0,0,0.6)",
  originalAvatar: "#d1fae5",
  avatar: {
    piel: { clara: "#edc3a3", media: "#ca936c", oscura: "#80573f" },
    ropa: { menta: "#55c89a", violeta: "#af93e8", azul: "#73bce0" },
    pelo: "#293a32", peloLuz: "#516052", pantalon: "#25483b", zapatos: "#e5eedc", suelo: "#214832",
    cara: "#172c22", mascota: "#9fe0b8", interiorOreja: "#e2afab", mesa: "#547e63", cama: "#cbdac5", manta: "#4c9d75",
  },
  brand: "#10b981",
  brandCyan: "#2dd4bf",
  violet: "#8b5cf6",
  onPrimary: "#022c22",
  textMuted: "#64748b",
  fieldIcon: "#9ec3b7",
  inkPlaceholder: "#475569",
  ringTrack: "rgba(255,255,255,0.12)",
  switchOff: "rgba(255,255,255,0.18)",
  white: "#ffffff",
  tabBar: { light: "#ffffff", dark: "#081310" },
  accent: {
    amber: "#f59e0b",
    violet: "#8b5cf6",
    mint: "#10b981",
    mintDeep: "#059669",
    coral: "#fb7185",
  },
} as const;

/**
 * Tema Bio-Tech Esmeralda: lienzo obsidiana orgánico con luminiscencia bio-esmeralda y teal.
 */
export const cosmic = {
  /** Degradado de fondo (obsidiana orgánica profunda). */
  bg: ["#030807", "#081310", "#0e201b"] as const,
  /** Degradado de acento para superficies destacadas (esmeralda a bio-teal). */
  aurora: ["#059669", "#10b981", "#2dd4bf"] as const,
  glow: "#10b981",
  glowSoft: "rgba(16, 185, 129, 0.35)",
  violet: "#8b5cf6",
} as const;

/** Degradado oscuro compartido por las pantallas de autenticación. */
export const authGradient = ["#030807", "#081310", "#0c1a16"] as const;

export const gradients = {
  night: ["#064e3b", "#047857", "#10b981"] as const,
  dawn: ["#059669", "#2dd4bf", "#a3e635"] as const,
  soft: ["#ecfdf5", "#d1fae5"] as const,
};
