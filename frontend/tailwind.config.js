/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        // Paper-on-ink palette — warmer dark than pure blue-black
        ink:     "#070608",   // page
        paper:   "#0F0D10",   // slight warm offset
        surface: "#161318",
        border:  "#231F25",
        muted:   "#2E2932",

        primary:   "#F4EFE7",   // warm off-white "paper"
        secondary: "#9C95A0",
        tertiary:  "#5D5560",
        quiet:     "#3A3640",

        // Per-domain hues — pulled toward editorial, not corporate
        finance:   { DEFAULT: "#6B5BFF", dim: "#6B5BFF18", glow: "#6B5BFF40" }, // electric ink
        health:    { DEFAULT: "#2BCD8A", dim: "#2BCD8A18", glow: "#2BCD8A40" }, // herbarium green
        education: { DEFAULT: "#E5A14B", dim: "#E5A14B18", glow: "#E5A14B40" }, // foxed-paper amber

        // Legacy aliases for older files
        void: "#070608",
        deep: "#070608",
        bg: "#070608",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        sans:    ["'Inter Tight'", "Inter", "system-ui", "sans-serif"],
        mono:    ['"JetBrains Mono"', "monospace"],
        heading: ["Fraunces", "serif"], // legacy
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
        "glow-finance":   "0 0 28px 0 #6B5BFF30",
        "glow-health":    "0 0 28px 0 #2BCD8A30",
        "glow-education": "0 0 28px 0 #E5A14B30",
        "card":           "0 1px 2px 0 rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
