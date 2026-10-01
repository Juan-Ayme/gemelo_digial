/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class", // evita que NativeWind lance "dark mode is type 'media'"
  theme: {
    extend: {
      colors: {
        // Paleta Bio-Tech Esmeralda (Obsidiana orgánica, Esmeralda y Bio-Teal)
        surface: {
          DEFAULT: "#081310",
          dim: "#050d0b",
          bright: "#1f3830",
          lowest: "#030807",
          low: "#0c1a16",
          container: "#11221d",
          high: "#182c26",
          highest: "#223b33",
          variant: "#223b33",
        },
        on: {
          surface: "#e2f7f0",
          "surface-variant": "#9ec3b7",
          background: "#e2f7f0",
          primary: "#022c22",
          "primary-container": "#064e3b",
          secondary: "#042f2e",
          "secondary-container": "#99f6e4",
        },
        outline: {
          DEFAULT: "#52796f",
          variant: "#2d4a43",
        },
        primary: {
          DEFAULT: "#10b981",
          container: "#059669",
          fixed: "#6ee7b7",
          "fixed-dim": "#34d399",
        },
        secondary: {
          DEFAULT: "#2dd4bf",
          container: "#0d9488",
          fixed: "#5eead4",
          "fixed-dim": "#14b8a6",
        },
        tertiary: {
          DEFAULT: "#a3e635",
          container: "#65a30d",
          fixed: "#bef264",
          "fixed-dim": "#84cc16",
        },
        error: {
          DEFAULT: "#fb7185",
          container: "#9f1239",
        },
        // Escala de marca (Esmeralda biomédico)
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        ink: {
          50: "#f0fdf4",
          100: "#e2e8f0",
          200: "#cbd5e1",
          300: "#94a3b8",
          400: "#64748b",
          500: "#475569",
          600: "#334155",
          700: "#1e293b",
          800: "#172321",
          900: "#0f1816",
          950: "#080f0e",
        },
        accent: {
          mint: "#10b981",
          coral: "#fb7185",
          amber: "#f59e0b",
          violet: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["Inter_400Regular"],
        medium: ["Inter_500Medium"],
        semibold: ["Inter_600SemiBold"],
        bold: ["Inter_700Bold"],
        display: ["SpaceGrotesk_600SemiBold"],
        "display-bold": ["SpaceGrotesk_700Bold"],
      },
      borderRadius: {
        xl: "16px",
        "2xl": "22px",
        "3xl": "28px",
      },
    },
  },
  plugins: [],
};
