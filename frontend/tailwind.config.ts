import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        "14": "repeat(14, minmax(0, 1fr))",
      },
      colors: {
        background: "var(--background)",
        border: "var(--border)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        surface: "var(--surface)",
      },
      boxShadow: {
        panel: "var(--shadow-lg)",
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "monospace"],
        sans: ["var(--font-geist-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
