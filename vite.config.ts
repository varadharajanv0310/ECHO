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
  },
  build: { target: "es2022", assetsInlineLimit: 0 },
});
