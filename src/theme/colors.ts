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
  onPrimary: "#00363d",
  textMuted: "#7d85a3",
  fieldIcon: "#bac9cc",
  inkPlaceholder: "#5b6382",
  ringTrack: "#dbe6ff",
  switchOff: "#d5d8e6",
  white: "#ffffff",
  tabBar: { light: "#ffffff", dark: "#12141c" },
  accent: {
    amber: "#f59e0b",
    violet: "#a78bfa",
    mint: "#4ade80",
    mintDeep: "#059669",
    coral: "#fb7185",
  },
} as const;

/** Degradado oscuro compartido por las pantallas de autenticación. */
export const authGradient = ["#070B1D", "#0e1224", "#161b2d"] as const;

export const gradients = {
  night: ["#161B4D", "#232E82", "#2B41EA"] as const,
  dawn: ["#3F60F6", "#A78BFA", "#FB7185"] as const,
  soft: ["#EEF4FF", "#DBE6FF"] as const,
};
