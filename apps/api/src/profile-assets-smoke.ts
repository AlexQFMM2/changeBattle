import assert from "node:assert/strict";
import {
  createChangeBattleV2Api,
  isCanonicalAssetPathV4,
  type UserProfileStorageAdapter,
  type UserProfileV2,
} from "./index.js";

let storedProfile: UserProfileV2 | null = null;
const adapter: UserProfileStorageAdapter = {
  async loadUserProfile() {
    return storedProfile;
  },
  async saveUserProfile(profile) {
    storedProfile = profile;
    return profile;
  },
  async deleteUserProfile() {
    storedProfile = null;
  },
};

const api = createChangeBattleV2Api({
  userProfileAdapter: adapter,
  resourcePrefix: "changebattle-asset://beta/showdown/",
});

const catalog = api.getTrainerCatalog();
const trainer = catalog.trainers[0]!;
assert.equal(isCanonicalAssetPathV4(trainer.avatarAsset), true);
assert.equal(isCanonicalAssetPathV4(trainer.frontAsset), true);
assert.equal(trainer.avatarAsset.startsWith("changebattle-asset:"), false);
assert.equal(trainer.avatarAsset.startsWith("https:"), false);

const profile = await api.createUserProfile({name: "Alex", trainerId: trainer.id, avatarAsset: trainer.avatarAsset});
assert.equal(isCanonicalAssetPathV4(profile.avatarAsset), true);
assert.equal(profile.avatarAsset.startsWith("changebattle-asset:"), false);
assert.equal(profile.avatarAsset.startsWith("https:"), false);

const updated = await api.updateUserProfile(profile, {name: "AlexQFMM", trainerId: trainer.id, avatarAsset: trainer.avatarAsset});
assert.equal(isCanonicalAssetPathV4(updated.avatarAsset), true);
assert.equal(updated.avatarAsset, trainer.avatarAsset);

await assert.rejects(
  () => api.updateUserProfile(updated, {avatarAsset: "changebattle-asset://beta/npc/avatars/6-asset-a73f3e71.webp"}),
  /头像资源设置无效/,
);

console.info("[profile-assets-smoke] ok");
