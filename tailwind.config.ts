import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brown: {
          50: "#F8F4F0",
          100: "#E8D5C4",
          200: "#D4B5A0",
          300: "#C89F8A",
          400: "#B8896F",
          500: "#A87354",
          600: "#8B5E3C",
          700: "#6E4A2D",
          800: "#52361F",
          900: "#3A2612",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "Times", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;

