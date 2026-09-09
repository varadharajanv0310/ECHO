import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

/**
 * Test configuration.
 *
 * jsdom rather than a browser because everything under test is either pure or
 * DOM-level; the WebGL scenes are verified against a real browser separately,
 * which is the only way to test a shader honestly.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      include: [
        "src/utils/**",
        "src/hooks/**",
        "src/services/**",
        "src/store/**",
        "src/scene/sky-data.ts",
      ],
      // audio.ts is a Web Audio graph: every branch it has is a decision about
      // a node that jsdom does not implement, so covering it would mean
      // asserting that mocks were called. tuning.ts is a constants table.
      exclude: ["**/*.test.*", "src/constants/**", "src/services/audio.ts"],
      // A floor, not a target. It exists so that deleting a test is a visible
      // decision rather than a silent one.
      thresholds: {
        statements: 60,
        branches: 60,
        functions: 60,
        lines: 60,
      },
    },
  },
});
