import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import glsl from "vite-plugin-glsl";
import { fileURLToPath, URL } from "node:url";

// GitHub Pages serves this repo from /ECHO/. Local dev and any root-domain
// host (Vercel, Netlify) stay at /.
const base = process.env.GITHUB_PAGES ? "/ECHO/" : "/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), glsl()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    // react-three-fiber renders through its own reconciler. If Vite hands it a
    // pre-bundled React while the app holds the source copy, hooks blow up with
    // "more than one copy of React". Dedupe pins one instance of each.
    dedupe: ["react", "react-dom", "three"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "three", "@react-three/fiber"],
  },
  build: {
    target: "es2022",
    assetsInlineLimit: 0,
    // three is by far the largest dependency and it never changes between
    // deploys, so it gets its own chunk with its own cache lifetime. React is
    // split for the same reason. Everything else stays with the app, and the
    // six panels split themselves through dynamic import in ui/Panels.tsx.
    rollupOptions: {
      output: {
        // Rolldown, which Vite 8 builds with, takes the function form only.
        // Returning undefined means "no opinion, put it where you would have".
        manualChunks(id: string): string | undefined {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("three") || id.includes("@react-three")) return "three";
          if (id.includes("react") || id.includes("scheduler")) return "react";
          return undefined;
        },
      },
    },
    // The scene is the payload; a warning at the default 500kB is noise that
    // trains you to ignore the one that matters.
    chunkSizeWarningLimit: 900,
  },
});
