import {resolve} from "node:path";
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = resolve(__dirname, "../..");

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  define: {
    "import.meta.env.VITE_CHANGEBATTLE_MANUAL_MOUNT": JSON.stringify("1"),
    "import.meta.env.VITE_CHANGEBATTLE_MOBILE": JSON.stringify("1"),
  },
  resolve: {
    alias: {
      "@changebattle/shared": resolve(projectRoot, "packages/shared/src"),
    },
  },
  server: {
    fs: {
      allow: [projectRoot],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
    },
  },
});
