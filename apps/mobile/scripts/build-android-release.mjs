import {copyFileSync, existsSync, mkdirSync, readFileSync} from "node:fs";
import {join, resolve} from "node:path";
import {spawnSync} from "node:child_process";
import process from "node:process";

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = process.env.CHANGEBATTLE_MOBILE_VERSION || packageJson.version || "0.0.0";

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

run(gradlew, ["assembleRelease"], {cwd: androidDir});

const apkPath = join(androidDir, "app", "build", "outputs", "apk", "release", "app-release.apk");
if (!existsSync(apkPath)) {
  throw new Error(`Release APK was not generated at ${apkPath}`);
}

const releaseDir = resolve(root, "..", "..", "release");
mkdirSync(releaseDir, {recursive: true});
const outputPath = join(releaseDir, `ChangeBattle-Mobile-v${version}.apk`);
copyFileSync(apkPath, outputPath);
console.log(`Release APK copied to ${outputPath}`);
