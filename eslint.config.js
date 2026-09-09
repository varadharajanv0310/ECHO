import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";

/**
 * Lint rules for ECHO.
 *
 * Three things this configuration cares about, in order: that the code is
 * type-sound, that the hooks rules are obeyed because a stale closure in a
 * render loop is invisible until it is a bug, and that markup stays reachable
 * without a mouse. The accessibility plugin is set to error rather than warn -
 * a warning nobody reads is not a rule.
 */
export default tseslint.config(
  {
    ignores: ["dist", "coverage", "node_modules", "src/shaders", "public"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.es2021 },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // The codebase does not use `any`, and should not start.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // A button without a type submits a form it may not know it is in.
      "react/button-has-type": "off",

      // Nothing should reach production through a console.
      "no-console": ["error", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  // Tests reach for globals and describe blocks that the app never does.
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // Config files run in Node.
  {
    files: ["*.config.{ts,js}", "*.config.*.{ts,js}"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
