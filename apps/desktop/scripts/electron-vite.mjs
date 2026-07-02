#!/usr/bin/env node
import {spawn} from "node:child_process";
import {readdir, stat} from "node:fs/promises";
import path from "node:path";
import {build as viteBuild} from "vite";
import {resolveConfig} from "electron-vite";

const command = process.argv[2] || "dev";
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const root = process.cwd();
const rendererHost = "127.0.0.1";
const rendererPort = 5181;
const rendererUrl = `http://${rendererHost}:${rendererPort}/`;

const env = {...process.env};
delete env.ELECTRON_RUN_AS_NODE;
delete env.ELECTRON_NO_ATTACH_CONSOLE;

if (command !== "dev") {
  const args = ["exec", "electron-vite", command, ...process.argv.slice(3)];
  const child = spawn(pnpm, args, {
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });
  forwardExit(child);
} else {
  await runFastDev();
}

async function runFastDev() {
  await ensureMainAndPreloadBuild();

  const rendererAlreadyRunning = await urlReady(rendererUrl);
  const rendererProcess = rendererAlreadyRunning ? null : spawn(pnpm, [
    "exec",
    "vite",
    "--host",
    rendererHost,
    "--port",
    String(rendererPort),
    "--strictPort",
  ], {
    cwd: root,
    stdio: ["ignore", "inherit", "inherit"],
    env,
    shell: process.platform === "win32",
  });

  const electronEnv = {
    ...env,
    ELECTRON_BOOT_RENDERER_URL: rendererUrl,
    ELECTRON_BOOT_HTML: path.join(root, "boot.html"),
  };
  const electronArgs = [
    "exec",
    "electron",
    ...(process.platform === "linux" ? ["--no-sandbox"] : []),
    path.join(root, "out/main/main.js"),
  ];
  const electronProcess = spawn(pnpm, electronArgs, {
    cwd: root,
    stdio: ["ignore", "inherit", "inherit"],
    env: electronEnv,
    shell: process.platform === "win32",
  });

  electronProcess.on("exit", (code, signal) => {
    if (rendererProcess) rendererProcess.kill();
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });

  rendererProcess?.on("exit", code => {
    if (code && !electronProcess.killed) {
      console.warn(`[changebattle-v2:desktop] renderer dev server exited with code ${code}; boot page will keep waiting if no server is available.`);
    }
  });
}

async function ensureMainAndPreloadBuild() {
  if (!await mainAndPreloadNeedBuild()) return;
  console.info("[changebattle-v2:desktop] building Electron main/preload before fast dev startup...");
  process.env.NODE_ENV_ELECTRON_VITE = "development";
  const resolved = await resolveConfig({root, mode: "development"}, "serve", "development");
  const mainConfig = resolved.config?.main;
  const preloadConfig = resolved.config?.preload;
  if (mainConfig) await viteBuild({...mainConfig, build: {...mainConfig.build, watch: null}});
  if (preloadConfig) await viteBuild({...preloadConfig, build: {...preloadConfig.build, watch: null}});
}

async function mainAndPreloadNeedBuild() {
  const outputs = [
    path.join(root, "out/main/main.js"),
    path.join(root, "out/main/formalComputeWorker.js"),
    path.join(root, "out/preload/preload.cjs"),
  ];
  const outputTimes = await Promise.all(outputs.map(mtimeMsOrZero));
  const oldestOutput = Math.min(...outputTimes);
  if (!oldestOutput) return true;

  const inputs = [
    path.join(root, "electron"),
    path.join(root, "electron.vite.config.ts"),
  ];
  const inputTimes = await Promise.all(inputs.map(latestMtimeMs));
  return Math.max(...inputTimes) > oldestOutput;
}

async function latestMtimeMs(filePath) {
  const info = await stat(filePath);
  if (!info.isDirectory()) return info.mtimeMs;
  const children = await readdir(filePath);
  const childTimes = await Promise.all(children.map(child => latestMtimeMs(path.join(filePath, child))));
  return Math.max(info.mtimeMs, ...childTimes);
}

async function mtimeMsOrZero(filePath) {
  try {
    return (await stat(filePath)).mtimeMs;
  } catch {
    return 0;
  }
}

async function urlReady(url) {
  try {
    const response = await fetch(url, {method: "GET"});
    await response.body?.cancel();
    return response.ok;
  } catch {
    return false;
  }
}

function forwardExit(child) {
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
}
