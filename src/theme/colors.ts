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
  brand: "#3f60f6",
  brandCyan: "#39e7ff",
  violet: "#a78bfa",
  onPrimary: "#00363d",
  textMuted: "#7d85a3",
  fieldIcon: "#bac9cc",
  inkPlaceholder: "#5b6382",
  ringTrack: "rgba(255,255,255,0.14)",
  switchOff: "rgba(255,255,255,0.18)",
  white: "#ffffff",
  tabBar: { light: "#ffffff", dark: "#12141c" },
  accent: {
    amber: "#f59e0b",
    violet: "#a78bfa",
    mint: "#4ade80",
    mintDeep: "#34d399",
    coral: "#fb7185",
  },
} as const;

/**
 * Tema "cósmico": la app entera vive sobre un cielo profundo. Estos tokens
 * definen el fondo vivo, el vidrio esmerilado y los brillos de acento.
 */
export const cosmic = {
  /** Degradado de fondo (espacio profundo). */
  bg: ["#05070F", "#0A0E20", "#141A3A"] as const,
  /** Degradado de acento para superficies destacadas. */
  aurora: ["#3F60F6", "#7C5CFF", "#39E7FF"] as const,
  glow: "#39E7FF",
  glowSoft: "rgba(57,231,255,0.35)",
  violet: "#A78BFA",
} as const;

/** Degradado oscuro compartido por las pantallas de autenticación. */
export const authGradient = ["#070B1D", "#0e1224", "#161b2d"] as const;

export const gradients = {
  night: ["#161B4D", "#232E82", "#2B41EA"] as const,
  dawn: ["#3F60F6", "#A78BFA", "#FB7185"] as const,
  soft: ["#EEF4FF", "#DBE6FF"] as const,
};
