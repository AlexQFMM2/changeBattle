import {resolve} from "node:path";
import {defineConfig, externalizeDepsPlugin} from "electron-vite";
import react from "@vitejs/plugin-react";
import pkg from "../../package.json";

const projectRoot = resolve(__dirname, "../..");

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({exclude: ["@changebattle/game-runtime", "@changebattle/game-service", "@changebattle/shared"]})],
    resolve: {
      alias: {
        "@changebattle/shared": resolve(projectRoot, "packages/shared/src"),
        "@changebattle/game-service": resolve(projectRoot, "packages/game-service/src"),
        "@changebattle/game-runtime": resolve(projectRoot, "packages/game-runtime/src"),
      },
    },
    build: {
      rollupOptions: {
        input: resolve(__dirname, "electron/main.ts"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin({exclude: ["@changebattle/shared"]})],
    resolve: {
      alias: {
        "@changebattle/shared": resolve(projectRoot, "packages/shared/src"),
      },
    },
    build: {
      rollupOptions: {
        input: resolve(__dirname, "electron/preload.ts"),
      },
    },
  },
  renderer: {
    root: __dirname,
    plugins: [react()],
    define: {
      "import.meta.env.VITE_CHANGEBATTLE_VERSION": JSON.stringify(pkg.version),
    },
    resolve: {
      alias: {
        "@changebattle/shared": resolve(projectRoot, "packages/shared/src"),
      },
    },
    build: {
      outDir: "out/renderer",
      emptyOutDir: true,
      rollupOptions: {
        input: resolve(__dirname, "index.html"),
      },
    },
  },
});
