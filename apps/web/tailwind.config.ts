import { type Config } from "tailwindcss";

const config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        card: "8px",
      },
      boxShadow: {
        rail: "0 24px 80px rgb(18 24 20 / 0.12)",
        panel: "0 12px 32px rgb(18 24 20 / 0.08)",
      },
      colors: {
        ink: "#111714",
        paper: "#f7f8f3",
        "paper-strong": "#ffffff",
        line: "#d9dfd6",
        signal: "#087c74",
        coral: "#d95f43",
        brass: "#c59628",
        graphite: "#2d342f",
      },
      fontFamily: {
        body: ["Aptos", "Segoe UI Variable", "Segoe UI", "Helvetica Neue", "sans-serif"],
        display: ["Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
