import {spawnSync} from "node:child_process";
import {existsSync} from "node:fs";
import {join} from "node:path";
import process from "node:process";

const root = process.cwd();

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {stdio: "inherit", shell: process.platform === "win32", ...options});
  if (result.status !== 0) process.exit(result.status || 1);
}

run("pnpm", ["run", "build"]);
run("pnpm", ["run", "sync"]);

const androidDir = join(root, "android");
const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
if (!existsSync(join(androidDir, process.platform === "win32" ? "gradlew.bat" : "gradlew"))) {
  throw new Error("Android project is missing. Run `pnpm --filter @changebattle/mobile exec cap add android` first.");
}

run(gradlew, ["assembleDebug"], {cwd: androidDir});
