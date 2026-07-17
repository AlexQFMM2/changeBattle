import {existsSync} from "node:fs";
import {join} from "node:path";
import {spawn} from "node:child_process";

const task = process.argv[2] ?? "assembleDebug";
const androidDir = join(process.cwd(), "android");
const wrapper = process.platform === "win32" ? "gradlew.bat" : "gradlew";
const wrapperPath = join(androidDir, wrapper);

if (!existsSync(wrapperPath)) {
  console.error(`[mobile] Missing Android Gradle wrapper: ${wrapperPath}`);
  console.error("[mobile] Run `pnpm --filter @changebattle-v2/mobile cap:add:android` first.");
  process.exit(1);
}

const child = spawn(wrapperPath, [task], {
  cwd: androidDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", code => {
  process.exit(code ?? 1);
});
