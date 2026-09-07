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
  plugins: [react(), tailwindcss(), glsl({ compress: false })],
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
  build: { target: "es2022", assetsInlineLimit: 0 },
});
