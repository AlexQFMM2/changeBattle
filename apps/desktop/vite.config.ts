import {resolve} from "node:path";
import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";

export default defineConfig({
  plugins: [react()],
  publicDir: resolve(__dirname, "../../assets"),
  build: {
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
    },
  },
  optimizeDeps: {
    entries: [resolve(__dirname, "index.html")],
  },
  server: {
    host: "127.0.0.1",
    port: 5181,
    strictPort: true,
    watch: {
      ignored: ["**/out/**"],
    },
  },
});
