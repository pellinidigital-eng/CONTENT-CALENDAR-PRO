import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      boxShadow: {
        soft: "0 18px 60px rgba(15, 23, 42, 0.10)"
      },
      colors: {
        ink: "#111827",
        muted: "#64748b",
        line: "#e5e7eb",
        mist: "#f7f8fb",
        aura: "#14b8a6",
        ember: "#ff6b4a",
        grape: "#7c3aed",
        gold: "#d6a94a",
        brand: {
          blue: "#2563eb",
          violet: "#7c3aed",
          black: "#111111"
        }
      }
    }
  },
  plugins: []
};

export default config;
