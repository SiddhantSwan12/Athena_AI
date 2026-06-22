/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0F1E",
        surface: "rgba(255,255,255,0.03)",
        finance: "#6366F1",
        health: "#10B981",
        education: "#F59E0B",
        athena: "#8B5CF6",
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        "blink": "blink 1s steps(1) infinite",
        "thinking": "thinking 1.4s ease-in-out infinite",
        "fade-in": "fadeIn .4s ease-out both",
        "slide-up": "slideUp .5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
      },
      keyframes: {
        blink: { "50%": { opacity: 0 } },
        thinking: {
          "0%, 80%, 100%": { transform: "scale(0.7)", opacity: 0.4 },
          "40%": { transform: "scale(1)", opacity: 1 },
        },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        pulseSoft: { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.55 } },
      },
    },
  },
  plugins: [],
};
