import assert from "node:assert/strict";
import path from "node:path";
import {rendererAssetFilePath} from "./rendererAssetResolver.js";

const rendererRoot = path.join("D:", "portable", "ChangeBattle-V2-Desk-portable-v0.1.0", "apps", "desktop", "out", "renderer");

assert.equal(
  rendererAssetFilePath("file:///showdown/sprites/ani/entei.gif", rendererRoot),
  path.join(rendererRoot, "showdown", "sprites", "ani", "entei.gif"),
);

assert.equal(
  rendererAssetFilePath("file:///npc/avatars/6-asset-a73f3e71.webp", rendererRoot),
  path.join(rendererRoot, "npc", "avatars", "6-asset-a73f3e71.webp"),
);

assert.equal(
  rendererAssetFilePath("file:///ui/button-gold.png", rendererRoot),
  path.join(rendererRoot, "ui", "button-gold.png"),
);

assert.equal(
  rendererAssetFilePath("file:///D:/portable/ChangeBattle-V2-Desk-portable-v0.1.0/apps/desktop/out/renderer/index.html", rendererRoot),
  null,
);

console.info("[rendererAssetResolver.test] ok");
