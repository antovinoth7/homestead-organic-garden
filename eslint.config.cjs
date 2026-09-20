const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const rnPlugin = require("eslint-plugin-react-native");
const prettier = require("eslint-config-prettier");

module.exports = defineConfig([
  ...expoConfig,
  {
    ignores: [
      "node_modules/**",
      "android/**",
      "ios/**",
      ".expo/**",
      "assets/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "UI/**",
      "eslint.config.cjs",
      "app.config.js",
      "metro.config.js",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react-native": rnPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
      "prefer-const": "warn",
      "no-case-declarations": "warn",
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
      "react-native/no-color-literals": "error",
      "react-native/no-inline-styles": "error",
      "react-native/no-raw-text": ["error", { skip: ["Text"] }],

      // eslint-config-expo 57 pulls in eslint-plugin-react-hooks v7, whose new
      // React-Compiler-era rules flag 214 pre-existing call sites across the app.
      // None of them are SDK 57 regressions, and triaging them is a separate piece
      // of work -- demoted to warnings so the lint gate keeps signalling real
      // breakage. Expected baseline: 0 errors, 215 warnings (these 214 plus one
      // pre-existing exhaustive-deps warning in CalendarScreen.tsx).
      // See docs/IMPLEMENTATION_ROADMAP.md section 9, Post-Upgrade Backlog,
      // before re-raising any of these to "error".
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/globals": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    // Node CLI scripts (codemap, deps check) — CommonJS, no return-type annotations
    files: ["scripts/**/*.js"],
    languageOptions: {
      globals: {
        require: "readonly",
        module: "readonly",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  prettier,
]);
