/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          bg: "#0A0C10",        // Deep Background
          surface: "#131722",   // Surface
          card: "#1A1F2B",      // Card
          green: "#22C55E",     // Primary Bid Green
          gold: "#E6C15A",      // Royal Gold
          goldSoft: "#F6E6B4",  // Soft Gold
          goldGlow: "#FFB703",  // Warm Glow
          red: "#FF4D4F",       // Outbid Alert
          text: "#F3F4F6",      // Main Text
          muted: "#9AA4AF",     // Muted Text
          border: "#2A3242",    // Border
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        display: ["var(--font-display)", "Outfit", "sans-serif"],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(230, 193, 90, 0.15)',
        'gold-glow-lg': '0 0 25px rgba(230, 193, 90, 0.25)',
        'green-glow': '0 0 15px rgba(34, 197, 94, 0.2)',
        'red-glow': '0 0 15px rgba(255, 77, 79, 0.2)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(26, 31, 43, 0.7) 0%, rgba(19, 23, 34, 0.8) 100%)',
        'gold-gradient': 'linear-gradient(90deg, #E6C15A 0%, #F6E6B4 50%, #FFB703 100%)',
      }
    },
  },
  plugins: [],
};
