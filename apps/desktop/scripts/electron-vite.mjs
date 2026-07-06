#!/usr/bin/env node
import {execFileSync, spawn} from "node:child_process";
import {readdir, readFile, readlink, stat} from "node:fs/promises";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import {build as viteBuild} from "vite";
import {resolveConfig} from "electron-vite";

const command = process.argv[2] || "dev";
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const root = process.cwd();
const workspaceRoot = path.resolve(root, "../..");
const rendererHost = "127.0.0.1";
const rendererPort = 5181;
const rendererUrl = `http://${rendererHost}:${rendererPort}/`;
const desktopVersion = readPackageVersion(path.join(workspaceRoot, "package.json")) || readPackageVersion(path.join(root, "package.json")) || "0.0.0";
const releaseChannel = process.env.CHANGEBATTLE_RELEASE_CHANNEL || "stable";

const env = {...process.env};
env.VITE_CHANGEBATTLE_DESKTOP_VERSION = env.VITE_CHANGEBATTLE_DESKTOP_VERSION || desktopVersion;
env.VITE_CHANGEBATTLE_RELEASE_CHANNEL = env.VITE_CHANGEBATTLE_RELEASE_CHANNEL || releaseChannel;
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

function readPackageVersion(packageJsonPath) {
  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, "utf8")).version || "";
  } catch {
    return "";
  }
}

async function runFastDev() {
  await stopStaleDesktopDevProcesses();
  await ensureMainAndPreloadBuild();

  const rendererProcess = spawn(pnpm, [
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
    CHANGEBATTLE_DESKTOP_VERSION: desktopVersion,
    CHANGEBATTLE_RELEASE_CHANNEL: releaseChannel,
    CHANGEBATTLE_PROJECT_ROOT: workspaceRoot,
    CHANGEBATTLE_SHOWDOWN_CLIENT_VENDOR_ROOT: path.resolve(workspaceRoot, "packages/showdown-battle-core/vendor/showdown-client/js"),
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

  rendererProcess.on("exit", code => {
    if (code && !electronProcess.killed) {
      console.warn(`[changebattle-v2:desktop] renderer dev server exited with code ${code}; boot page will keep waiting if no server is available.`);
    }
  });
}

async function stopStaleDesktopDevProcesses() {
  if (process.platform !== "linux") return;

  const candidates = new Set();
  const processes = await readLinuxProcesses();
  const protectedPids = readAncestorPids(process.pid, processes);
  protectedPids.add(process.pid);
  for (const processInfo of processes.values()) {
    if (protectedPids.has(processInfo.pid)) continue;
    if (isProjectDesktopDevProcess(processInfo)) candidates.add(processInfo.pid);
  }

  for (const pid of readListeningPortPids(rendererPort)) {
    if (protectedPids.has(pid)) continue;
    const processInfo = processes.get(pid) || await readLinuxProcess(pid);
    if (processInfo && isProjectOwnedProcess(processInfo)) candidates.add(pid);
  }

  if (!candidates.size) return;
  console.info(`[changebattle-v2:desktop] stopping stale desktop dev process(es): ${[...candidates].sort((a, b) => a - b).join(" ")}`);
  const processTree = readProcessTree(processes);
  for (const pid of [...candidates].sort((a, b) => b - a)) {
    killProcessTree(pid, processTree, "SIGTERM", protectedPids);
  }
  await delay(400);
  if (await isTcpPortOpen(rendererPort)) {
    console.warn(`[changebattle-v2:desktop] renderer port ${rendererPort} is still occupied after SIGTERM; force stopping stale desktop dev process(es).`);
    for (const pid of [...candidates].sort((a, b) => b - a)) {
      killProcessTree(pid, processTree, "SIGKILL", protectedPids);
    }
    await delay(200);
  }
  if (await isTcpPortOpen(rendererPort)) {
    console.warn(`[changebattle-v2:desktop] renderer port ${rendererPort} is still occupied after cleanup; startup may fail if another project owns it.`);
  }
}

async function readLinuxProcesses() {
  const processes = new Map();
  const entries = await readdir("/proc");
  await Promise.all(entries.map(async entry => {
    if (!/^\d+$/.test(entry)) return;
    const processInfo = await readLinuxProcess(Number(entry));
    if (processInfo) processes.set(processInfo.pid, processInfo);
  }));
  return processes;
}

async function readLinuxProcess(pid) {
  try {
    const [cmdline, cwd, statText] = await Promise.all([
      readFile(`/proc/${pid}/cmdline`, "utf8"),
      readlink(`/proc/${pid}/cwd`).catch(() => ""),
      readFile(`/proc/${pid}/stat`, "utf8").catch(() => ""),
    ]);
    const cmd = cmdline.split("\0").filter(Boolean).join(" ");
    const ppid = Number(statText.match(/^\d+ \(.+\) \S+ (\d+)/)?.[1] || 0);
    return {pid, ppid, cmd, cwd};
  } catch {
    return null;
  }
}

function readProcessTree(processes) {
  const tree = new Map();
  for (const processInfo of processes.values()) {
    if (!tree.has(processInfo.ppid)) tree.set(processInfo.ppid, []);
    tree.get(processInfo.ppid).push(processInfo.pid);
  }
  return tree;
}

function readAncestorPids(pid, processes) {
  const ancestors = new Set();
  let current = processes.get(pid);
  while (current?.ppid && !ancestors.has(current.ppid)) {
    ancestors.add(current.ppid);
    current = processes.get(current.ppid);
  }
  return ancestors;
}

function isProjectDesktopDevProcess(processInfo) {
  const mainEntry = path.join(root, "out/main/main.js");
  return (
    processInfo.cwd.startsWith(root) && processInfo.cmd.includes("scripts/electron-vite.mjs") && processInfo.cmd.includes("dev")
  ) || (
    processInfo.cwd.startsWith(root) && processInfo.cmd.includes("vite") && processInfo.cmd.includes("--port") && processInfo.cmd.includes(String(rendererPort))
  ) || (
    processInfo.cmd.includes(mainEntry)
  );
}

function isProjectOwnedProcess(processInfo) {
  return processInfo.cwd.startsWith(root) || processInfo.cmd.includes(root);
}

function readListeningPortPids(port) {
  try {
    const output = execFileSync("ss", ["-ltnp"], {encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]});
    const pids = new Set();
    for (const line of output.split("\n")) {
      if (!line.includes(`:${port}`)) continue;
      for (const match of line.matchAll(/pid=(\d+)/g)) {
        pids.add(Number(match[1]));
      }
    }
    return pids;
  } catch {
    return new Set();
  }
}

function killProcessTree(pid, processTree, signal, protectedPids) {
  if (protectedPids.has(pid)) return;
  for (const childPid of processTree.get(pid) || []) {
    killProcessTree(childPid, processTree, signal, protectedPids);
  }
  try {
    process.kill(pid, signal);
  } catch {
    // Process already exited.
  }
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
    path.resolve(root, "../../apps/api/src"),
    path.resolve(root, "../../packages/changebattle-v2-core/src"),
    path.resolve(root, "../../packages/showdown-battle-core/src"),
    path.resolve(root, "../../packages/showdown-dex-core/src"),
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

function isTcpPortOpen(port) {
  return new Promise(resolve => {
    const socket = net.createConnection({host: rendererHost, port});
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function forwardExit(child) {
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
  });
}
