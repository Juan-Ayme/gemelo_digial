/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Paleta "ando" (Material 3 dark, tono cian / violeta)
        surface: {
          DEFAULT: "#0e1224",
          dim: "#0e1224",
          bright: "#34384c",
          lowest: "#090d1f",
          low: "#161b2d",
          container: "#1a1f31",
          high: "#25293c",
          highest: "#303448",
          variant: "#303448",
        },
        on: {
          surface: "#dee1fb",
          "surface-variant": "#bac9cc",
          background: "#dee1fb",
          primary: "#00363d",
          "primary-container": "#006470",
          secondary: "#3a0093",
          "secondary-container": "#c2acff",
        },
        outline: {
          DEFAULT: "#859396",
          variant: "#3b494c",
        },
        primary: {
          DEFAULT: "#cdf7ff",
          container: "#39e7ff",
          fixed: "#9bf0ff",
          "fixed-dim": "#1bdaf2",
        },
        secondary: {
          DEFAULT: "#cfbdff",
          container: "#5614c8",
          fixed: "#e9ddff",
          "fixed-dim": "#cfbdff",
        },
        tertiary: {
          DEFAULT: "#b9ffd5",
          container: "#39efa2",
          fixed: "#50ffb0",
          "fixed-dim": "#1fe296",
        },
        error: {
          DEFAULT: "#ffb4ab",
          container: "#93000a",
        },
        // Alias de compatibilidad usados en la app original
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#bfd2ff",
          300: "#94b3ff",
          400: "#6288ff",
          500: "#39e7ff",
          600: "#1bdaf2",
          700: "#006470",
          800: "#004f58",
          900: "#00363d",
          950: "#001f24",
        },
        ink: {
          50: "#f6f7fb",
          100: "#eceef5",
          200: "#d5d8e6",
          300: "#adb3ca",
          400: "#7d85a3",
          500: "#5b6382",
          600: "#464d69",
          700: "#393f55",
          800: "#2f3446",
          900: "#20232f",
          950: "#12141c",
        },
        accent: {
          mint: "#39efa2",
          coral: "#ffb4ab",
          amber: "#f59e0b",
          violet: "#cfbdff",
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
