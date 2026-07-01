import {resolve} from "node:path";
import {defineConfig, externalizeDepsPlugin} from "electron-vite";
import react from "@vitejs/plugin-react";

const bundledWorkspaceDeps = [
  "@changebattle-v2/api",
  "@changebattle-v2/core",
  "@changebattle-v2/showdown-battle-core",
  "@changebattle-v2/showdown-dex-core",
];

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({exclude: bundledWorkspaceDeps})],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, "electron/main.ts"),
          formalComputeWorker: resolve(__dirname, "electron/formalComputeWorker.ts"),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin({exclude: bundledWorkspaceDeps})],
    build: {
      rollupOptions: {
        input: resolve(__dirname, "electron/preload.ts"),
        output: {
          format: "cjs",
          entryFileNames: "preload.cjs",
        },
      },
    },
  },
  renderer: {
    root: __dirname,
    base: "./",
    publicDir: resolve(__dirname, "../../assets"),
    plugins: [react()],
    build: {
      outDir: "out/renderer",
      emptyOutDir: true,
      rollupOptions: {
        input: resolve(__dirname, "index.html"),
      },
    },
  },
});
