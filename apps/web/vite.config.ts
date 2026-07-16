import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 6000,
  },
  plugins: [react()],
  publicDir: false,
});
