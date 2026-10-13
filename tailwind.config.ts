import type { Config } from "tailwindcss";

const c = (v: string) => `rgb(var(--${v}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        fond: c("fond"),
        surface: c("surface"),
        encre: c("encre"),
        doux: c("doux"),
        trait: c("trait"),
        accent: { DEFAULT: c("accent"), hover: c("accent-hover"), texte: c("accent-texte") },
        succes: c("succes"),
        alerte: c("alerte"),
        erreur: c("erreur"),
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      borderRadius: { DEFAULT: "6px", md: "8px" },
      transitionDuration: { DEFAULT: "180ms" },
      keyframes: {
        pulse2: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".45" } },
        entree: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        squelette: "pulse2 1.6s ease-in-out infinite",
        entree: "entree 220ms ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
