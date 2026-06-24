/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        // All base colors driven by CSS variables so light/dark toggle works
        ink:     "rgb(var(--c-void) / <alpha-value>)",
        paper:   "rgb(var(--c-paper) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        border:  "rgb(var(--c-border) / <alpha-value>)",
        muted:   "rgb(var(--c-muted) / <alpha-value>)",

        primary:   "rgb(var(--c-primary) / <alpha-value>)",
        secondary: "rgb(var(--c-secondary) / <alpha-value>)",
        tertiary:  "rgb(var(--c-tertiary) / <alpha-value>)",
        quiet:     "rgb(var(--c-quiet) / <alpha-value>)",

        // Legacy aliases
        void: "rgb(var(--c-void) / <alpha-value>)",
        deep: "rgb(var(--c-void) / <alpha-value>)",
        bg:   "rgb(var(--c-void) / <alpha-value>)",

        // Per-domain accent hues — fixed, never theme-toggled
        finance:     { DEFAULT: "#6B5BFF", dim: "#6B5BFF18", glow: "#6B5BFF40" },
        health:      { DEFAULT: "#2BCD8A", dim: "#2BCD8A18", glow: "#2BCD8A40" },
        education:   { DEFAULT: "#E5A14B", dim: "#E5A14B18", glow: "#E5A14B40" },
        technology:  { DEFAULT: "#00D2FF", dim: "#00D2FF18", glow: "#00D2FF40" },
        geopolitics: { DEFAULT: "#FF5353", dim: "#FF535318", glow: "#FF535340" },
        law:         { DEFAULT: "#B4916C", dim: "#B4916C18", glow: "#B4916C40" },
        environment: { DEFAULT: "#15B77F", dim: "#15B77F18", glow: "#15B77F40" },
        business:    { DEFAULT: "#3B82F6", dim: "#3B82F618", glow: "#3B82F640" },
        sports:      { DEFAULT: "#FF7E40", dim: "#FF7E4018", glow: "#FF7E4040" },
        entertainment: { DEFAULT: "#EC4899", dim: "#EC489918", glow: "#EC489940" },
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans:    ["'Inter Tight'", "Inter", "system-ui", "sans-serif"],
        mono:    ['"JetBrains Mono"', "monospace"],
        heading: ["Fraunces", "serif"],
      },
      animation: {
        "fade-up":    "fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in":    "fadeIn 0.3s ease forwards",
        "pulse-slow": "pulseSlow 3s ease-in-out infinite",
        "blink":      "blink 1.1s steps(1) infinite",
        "marquee":    "marquee 50s linear infinite",
        "scan":       "scan 8s linear infinite",
        "slide-up":   "slideUp .5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "thinking":   "thinking 1.4s ease-in-out infinite",
      },
      keyframes: {
        fadeUp:    { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn:    { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        blink:     { "0%, 50%": { opacity: "1" }, "50.01%, 100%": { opacity: "0" } },
        pulseSlow: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.45" } },
        marquee:   { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        scan:      { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(100%)" } },
        slideUp:   { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        thinking:  { "0%, 80%, 100%": { transform: "scale(0.7)", opacity: "0.4" }, "40%": { transform: "scale(1)", opacity: "1" } },
      },
      boxShadow: {
        "glow-finance":      "0 0 28px 0 #6B5BFF30",
        "glow-health":       "0 0 28px 0 #2BCD8A30",
        "glow-education":    "0 0 28px 0 #E5A14B30",
        "glow-technology":   "0 0 28px 0 #00D2FF30",
        "glow-geopolitics":  "0 0 28px 0 #FF535330",
        "glow-law":          "0 0 28px 0 #B4916C30",
        "glow-environment":  "0 0 28px 0 #15B77F30",
        "glow-business":     "0 0 28px 0 #3B82F630",
        "glow-sports":       "0 0 28px 0 #FF7E4030",
        "glow-entertainment":"0 0 28px 0 #EC489930",
        "card":              "0 1px 2px 0 rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
