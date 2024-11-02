import js from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import nodePlugin from "eslint-plugin-n";

export default [
  js.configs.recommended,
  ...nodePlugin.configs["flat/mixed-esm-and-cjs"],
  {
    name: "Jest tests",
    files: ["test/**/*.test.mjs"],
    languageOptions: {
      globals: {
        expect: "readonly",
        test: "readonly",
        describe: "readonly",
      },
    },
  },
  eslintPluginPrettierRecommended,
];
