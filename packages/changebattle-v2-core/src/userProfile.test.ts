import assert from "node:assert/strict";
import {
  assertUserProfileAssetFieldsV4,
  invalidUserProfileAssetFieldsV4,
  isCanonicalAssetPathV4,
  normalizeUserProfileV2,
  type UserProfileTrainerDefaultsV2,
} from "./userProfile.js";

const trainer: UserProfileTrainerDefaultsV2 = {
  id: "red",
  avatarAsset: "npc/avatars/6-asset-a73f3e71.webp",
  frontAsset: "npc/player-front/red-red-c813612f.gif",
  backAsset: "npc/player-back/red-red-back.png",
};

assert.equal(isCanonicalAssetPathV4("npc/avatars/6-asset-a73f3e71.webp"), true);
assert.equal(isCanonicalAssetPathV4("assets/npc/avatars/6-asset-a73f3e71.webp"), false);
assert.equal(isCanonicalAssetPathV4("changebattle-asset://beta/npc/avatars/6-asset-a73f3e71.webp"), false);
assert.equal(isCanonicalAssetPathV4("https://assets.65h26i.top/beta/npc/avatars/6-asset-a73f3e71.webp"), false);
assert.equal(isCanonicalAssetPathV4("https://assets.65h26i.top/beta/changebattle-asset://beta/npc/avatars/6-asset-a73f3e71.webp"), false);
assert.equal(isCanonicalAssetPathV4("../npc/avatars/6-asset-a73f3e71.webp"), false);
assert.equal(isCanonicalAssetPathV4("npc/avatars/6-asset-a73f3e71.webp?v=1"), false);

const profile = normalizeUserProfileV2({name: "Alex"}, trainer, "2026-01-01T00:00:00.000Z");
assert.deepEqual(invalidUserProfileAssetFieldsV4(profile), []);
assert.doesNotThrow(() => assertUserProfileAssetFieldsV4(profile));

const badProfile = normalizeUserProfileV2({
  name: "Alex",
  avatarAsset: "changebattle-asset://beta/npc/avatars/6-asset-a73f3e71.webp",
  frontAsset: "npc/player-front/red-red-c813612f.gif",
}, trainer, "2026-01-01T00:00:00.000Z");
assert.equal(badProfile.avatarAsset, "changebattle-asset://beta/npc/avatars/6-asset-a73f3e71.webp");
assert.deepEqual(invalidUserProfileAssetFieldsV4(badProfile), ["avatarAsset"]);
assert.throws(() => assertUserProfileAssetFieldsV4(badProfile), /头像资源设置无效/);

console.info("[userProfile.test] ok");
