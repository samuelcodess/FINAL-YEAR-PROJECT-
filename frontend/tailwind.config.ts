import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        mist: "#e2e8f0",
        brand: {
          50: "#effdf6",
          100: "#d8f8e7",
          500: "#1f8f6a",
          600: "#177556",
          700: "#135d46"
        }
      },
      boxShadow: {
        soft: "0 20px 45px rgba(15, 23, 42, 0.12)"
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui"],
        body: ["'Inter'", "ui-sans-serif", "system-ui"]
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(31, 143, 106, 0.18), transparent 28%), radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 30%), linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)"
      }
    }
  },
  plugins: []
} satisfies Config;
