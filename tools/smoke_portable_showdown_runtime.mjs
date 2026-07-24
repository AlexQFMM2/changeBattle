#!/usr/bin/env node
import {createRequire} from "node:module";
import path from "node:path";
import {pathToFileURL} from "node:url";

const portableRoot = path.resolve(process.argv[2] || "");
if (!process.argv[2]) throw new Error("Usage: node tools/smoke_portable_showdown_runtime.mjs <portable-root>");

const simPath = path.join(portableRoot, "vendor", "pokemon-showdown", "sim", "index.js");
const requireFromPortable = createRequire(pathToFileURL(path.join(portableRoot, "portable-runtime-smoke.cjs")));
const showdown = requireFromPortable(simPath);
if (typeof showdown.BattleStream !== "function" || typeof showdown.getPlayerStreams !== "function") {
  throw new Error("Portable Showdown runtime does not expose BattleStream/getPlayerStreams.");
}
if (typeof showdown.PRNG !== "function") throw new Error("Portable Showdown runtime does not expose PRNG.");

const random = new showdown.PRNG([1, 2, 3, 4]).random();
if (!Number.isFinite(random)) throw new Error("Portable Showdown PRNG failed to initialize ts-chacha20.");
const stream = new showdown.BattleStream({keepAlive: false});
showdown.getPlayerStreams(stream);
stream.destroy?.();

console.info(`[portable-showdown-runtime-smoke] ok: ${simPath}`);
