/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#2463eb",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
        "background-light": "#f8fafc",
        "background-dark": "#111621",
        "border-subtle": "#e2e8f0",
        "temp-hot": "#ef4444",
        "temp-warm": "#f59e0b",
        "temp-cold": "#3b82f6",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
}
