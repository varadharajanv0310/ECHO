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
      reporter: ["text", "json-summary"],
      include: ["src/lib/**", "src/store/**", "src/scene/sky-data.ts"],
      exclude: ["**/*.test.*", "src/lib/tuning.ts"],
    },
  },
});
