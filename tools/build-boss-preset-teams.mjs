import {spawnSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const tscBin = path.join(repoRoot, "node_modules", "typescript", "bin", "tsc");

run("node", [tscBin, "-p", path.join(repoRoot, "packages", "showdown-dex-core", "tsconfig.test.json")]);
run("node", [tscBin, "-p", path.join(repoRoot, "apps", "api", "tsconfig.test.json")]);
run("node", [path.join(repoRoot, "apps", "api", "dist-test", "build-boss-preset-teams.js")]);

function run(command, args) {
  const result = spawnSync(command, args, {cwd: repoRoot, stdio: "inherit", env: process.env});
  if (result.status !== 0) process.exit(result.status ?? 1);
}
