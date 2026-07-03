const config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/ui/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/auth/**/*.{js,ts,jsx,tsx,mdx}",
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
      boxShadow: {
        panel: "0 18px 50px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
