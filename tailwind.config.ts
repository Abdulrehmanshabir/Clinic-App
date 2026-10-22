import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Luxury Aesthetic Warm Palette (Virtusskin / Clinic Luxury Aesthetic)
        warm: {
          50: "#FAF7F2",   // Cream Light (Header/Card BG highlights)
          100: "#F4EFE6",  // Soft Alabaster Linen
          200: "#E9DFD1",  // Subtle Biscuit Border
          300: "#D8C5AD",  // Warm Sand Accent
          400: "#C4A482",  // Silk Tan
          500: "#A8835A",  // Signature Muted Gold / Bronze
          600: "#8C6843",  // Deep Bronze
          700: "#6B4E31",  // Espresso Bark
          800: "#4A3522",  // Dark Coffee Roast
          900: "#2B1E14",  // Rich Truffle
          950: "#1A120B",  // Deep Noir Velvet
        },
        sand: {
          50: "#FCFAF6",
          100: "#F7F3EB",
          200: "#EFE6D8",
          300: "#DECDB6",
          400: "#C8AE8E",
          500: "#B08F6B",
        },
      },
      fontFamily: {
        serif: ['"Times New Roman"', "Times", "Baskerville", "Georgia", "serif"],
        sans: ['"Times New Roman"', "Times", "Baskerville", "Georgia", "serif"],
        mono: ['"Times New Roman"', "Times", "Baskerville", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
