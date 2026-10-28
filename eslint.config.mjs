import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextVitals,
  {
    ignores: ["legacy/**", ".next/**", "dist/**", "node_modules/**", "design-ref/**", "ui_v2/**", "telas/**", ".claude/**"],
  },
];

export default eslintConfig;
