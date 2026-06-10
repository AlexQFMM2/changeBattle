#!/usr/bin/env node
import {mkdtempSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {spawn} from "node:child_process";

const desktopRoot = path.resolve(new URL("..", import.meta.url).pathname);
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const port = process.env.CHANGEBATTLE_E2E_REMOTE_DEBUGGING_PORT || "9222";
const userDataDir = process.env.CHANGEBATTLE_E2E_USER_DATA_DIR || mkdtempSync(path.join(tmpdir(), "changebattle-e2e-user-"));
const logDir = process.env.CHANGEBATTLE_LOG_DIR || path.join(userDataDir, "logs");

const env = {
  ...process.env,
  CHANGEBATTLE_E2E: "1",
  CHANGEBATTLE_E2E_USER_DATA_DIR: userDataDir,
  CHANGEBATTLE_E2E_REMOTE_DEBUGGING_PORT: port,
  CHANGEBATTLE_LOG_DIR: logDir,
  CHANGEBATTLE_PROJECT_ROOT: path.resolve(desktopRoot, "../.."),
};
delete env.ELECTRON_RUN_AS_NODE;
delete env.ELECTRON_NO_ATTACH_CONSOLE;

console.log(`[changebattle-e2e] userData=${userDataDir}`);
console.log(`[changebattle-e2e] remoteDebugging=http://127.0.0.1:${port}`);

const child = spawn(pnpm, ["exec", "electron-vite", "dev", "--noSandbox"], {
  cwd: desktopRoot,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
