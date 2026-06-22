/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        // Base palette
        void: "#05070F",
        deep: "#0A0F1E",
        surface: "#111827",
        border: "#1F2937",
        muted: "#374151",

        // Text scale
        primary: "#F9FAFB",
        secondary: "#9CA3AF",
        tertiary: "#4B5563",

        // Vertical accents
        finance: { DEFAULT: "#6366F1", dim: "#6366F120", glow: "#6366F140" },
        health: { DEFAULT: "#10B981", dim: "#10B98120", glow: "#10B98140" },
        education: { DEFAULT: "#F59E0B", dim: "#F59E0B20", glow: "#F59E0B40" },
        athena: "#8B5CF6",

        // Legacy aliases (kept so existing pages compile)
        bg: "#0A0F1E",
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        heading: ['Syne', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.3s ease forwards",
        "pulse-slow": "pulseSlow 3s ease-in-out infinite",
        "cursor-blink": "blink 1s step-end infinite",
        "slide-up": "slideUp .5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "thinking": "thinking 1.4s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        blink: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0" } },
        pulseSlow: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
        slideUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        thinking: { "0%, 80%, 100%": { transform: "scale(0.7)", opacity: "0.4" }, "40%": { transform: "scale(1)", opacity: "1" } },
      },
      boxShadow: {
        "glow-finance":   "0 0 24px 0 #6366F130",
        "glow-health":    "0 0 24px 0 #10B98130",
        "glow-education": "0 0 24px 0 #F59E0B30",
        "card":           "0 1px 3px 0 rgba(0,0,0,0.4), 0 1px 2px -1px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};
