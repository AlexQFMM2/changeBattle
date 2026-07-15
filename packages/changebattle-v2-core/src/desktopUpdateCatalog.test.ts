import assert from "node:assert/strict";
import {
  compareDesktopUpdateFileManifestsV4,
  desktopUpdateObjectPathForShaV4,
  desktopUpdateObjectUrlForFileV4,
  isDesktopUpdateIncrementalManagedPathV4,
  isDesktopUpdateProtectedManagedPathV4,
  parseChangeBattleDesktopUpdateManifestV4,
  parseDesktopUpdateFileManifestV4,
  type DesktopUpdateFileManifestV4,
} from "./desktopUpdateCatalog.js";

const shaA = "a".repeat(64);
const shaB = "b".repeat(64);
const shaC = "c".repeat(64);

function manifest(files: DesktopUpdateFileManifestV4["files"]): DesktopUpdateFileManifestV4 {
  return {
    manifestVersion: 2,
    version: "0.1.20",
    files,
  };
}

const local = manifest([
  {path: "apps/desktop/out/main.js", sha256: shaA, size: 10},
  {path: "assets/title/intro.mp4", sha256: shaA, size: 20},
  {path: "vendor/showdown-client/js/battle.js", sha256: shaB, size: 30},
  {path: "ChangeBattle V2.exe", sha256: shaA, size: 40},
]);

const remote = manifest([
  {path: "apps/desktop/out/main.js", sha256: shaB, size: 11},
  {path: "assets/title/intro.mp4", sha256: shaA, size: 20},
  {path: "package.json", sha256: shaC, size: 12},
]);

const diff = compareDesktopUpdateFileManifestsV4(local, remote);
assert.deepEqual(
  diff.changedFiles.map(file => file.path),
  ["apps/desktop/out/main.js", "package.json"],
);
assert.deepEqual(
  diff.deletedFiles.map(file => file.path),
  ["vendor/showdown-client/js/battle.js"],
);
assert.equal(diff.totalSize, 23);

assert.equal(isDesktopUpdateIncrementalManagedPathV4("package.json"), true);
assert.equal(isDesktopUpdateIncrementalManagedPathV4("ChangeBattle V2.exe"), false);
assert.equal(isDesktopUpdateProtectedManagedPathV4("ChangeBattle V2.exe"), true);
assert.equal(isDesktopUpdateProtectedManagedPathV4("ChangeBattle-V2-Desk.launcher.env"), true);

assert.equal(desktopUpdateObjectPathForShaV4(shaA), `aa/${shaA}`);
assert.equal(desktopUpdateObjectPathForShaV4("not-a-sha"), "");
assert.equal(desktopUpdateObjectUrlForFileV4("https://example.test/objects", {path: "package.json", sha256: shaB, size: 1}), `https://example.test/objects/bb/${shaB}`);

assert.ok(parseChangeBattleDesktopUpdateManifestV4({
  manifestVersion: 2,
  channel: "beta",
  version: "0.1.20",
  fileManifestUrl: "https://example.test/manifests/current.json",
  objectBaseUrl: "https://example.test/objects/",
}));
assert.ok(parseChangeBattleDesktopUpdateManifestV4({
  manifestVersion: 1,
  channel: "beta",
  version: "0.1.19",
  fileManifestUrl: "https://example.test/manifests/v0.1.19/files.json",
  incrementalBaseUrl: "https://example.test/files/v0.1.19/",
}));
assert.ok(parseDesktopUpdateFileManifestV4({
  manifestVersion: 1,
  version: "0.1.19",
  files: [{path: "ChangeBattle V2.exe", sha256: shaA, size: 1}],
}));

console.info("desktopUpdateCatalog tests passed");
