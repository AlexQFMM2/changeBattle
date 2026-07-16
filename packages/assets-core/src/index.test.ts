import assert from "node:assert/strict";
import {
  assetsTool,
  createAssetsTool,
  defaultAssetCoreConfig,
  joinAssetBaseUrl,
  normalizeAssetPath,
  resolveAssetEntryPath,
} from "./index.js";

assert.equal(normalizeAssetPath("/ui/logo.png"), "ui/logo.png");
assert.equal(normalizeAssetPath("pokemon\\sprites\\pikachu.png"), "pokemon/sprites/pikachu.png");
assert.throws(() => normalizeAssetPath("https://example.com/logo.png"), /relative/);
assert.throws(() => normalizeAssetPath("//example.com/logo.png"), /relative/);
assert.throws(() => normalizeAssetPath("../secret.png"), /unsafe/);
assert.throws(() => normalizeAssetPath("ui//logo.png"), /unsafe/);
assert.throws(() => normalizeAssetPath("ui/logo.png?v=1"), /query/);

assert.equal(joinAssetBaseUrl("https://assets.example.com/beta/", "/ui/logo.png"), "https://assets.example.com/beta/ui/logo.png");

assert.equal(resolveAssetEntryPath("app.logo"), "ui/logo.png");
assert.equal(resolveAssetEntryPath("aboutIcon/coin.png"), "aboutIcon/coin.png");
assert.throws(() => resolveAssetEntryPath("missing.logo"), /Unknown asset key/);
assert.equal(resolveAssetEntryPath("raw/path.png", {allowRawPath: true}), "raw/path.png");

assert.equal(assetsTool("app.logo", {baseUrl: "https://cdn.example.com/beta"}), "https://cdn.example.com/beta/ui/logo.png");
assert.equal(assetsTool("aboutIcon/coin.png"), "https://assets.65h26i.top/beta/aboutIcon/coin.png");
assert.equal(assetsTool("showdown/sprites/ani/pikachu.gif"), "https://assets.65h26i.top/beta/showdown/sprites/ani/pikachu.gif");
assert.equal(assetsTool("test.env-example"), "https://assets.65h26i.top/beta/test/env-example.txt");
assert.equal(assetsTool("ui/raw.png", {baseUrl: "https://cdn.example.com/beta", allowRawPath: true}), "https://cdn.example.com/beta/ui/raw.png");

const localAssetsTool = createAssetsTool({
  ...defaultAssetCoreConfig,
  defaultProvider: "local",
});
assert.equal(localAssetsTool("ui.placeholder"), "/assets/ui/placeholder.png");

console.info("assets-core tests passed");
