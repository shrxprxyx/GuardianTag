/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0A0A0A",
        surface: "#151515",
        "surface-alt": "#1C1C1C",
        border: "#262626",
        primary: {
          DEFAULT: "#2DD4BF",
          light: "#5EEAD4",
          dark: "#0F766E",
        },
        safe: {
          DEFAULT: "#22C55E",
          light: "#4ADE80",
          dark: "#15803D",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FBBF24",
          dark: "#B45309",
        },
        emergency: {
          DEFAULT: "#F87171",
          light: "#FCA5A5",
          dark: "#B91C1C",
        },
        muted: "#9CA3AF",
      },
    },
  },
  plugins: [],
};
