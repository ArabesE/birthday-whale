// @ts-check
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/**"] },
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        THREE: "readonly",
        anime: "readonly",
        confetti: "readonly",
      },
      ecmaVersion: 2023,
      sourceType: "module",
    },
    rules: {
      // Keep rules light to avoid behavioral changes; mostly formatting handled by Prettier
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-constant-binary-expression": "error",
    },
  },
];
