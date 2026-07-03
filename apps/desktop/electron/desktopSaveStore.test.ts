import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {DesktopSaveStoreV2} from "./desktopSaveStore.js";
import type {FormalGameRunV4, TrainingRunGameV4, UserProfileV2} from "@changebattle-v2/api";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "changebattle-v2-save-store-"));

try {
  await testRoundTripAndEncryption();
  await testTamperDetection();
  await testLegacyProfileMigration();
  await testDeleteAll();
  console.info("[desktopSaveStore.test] ok");
} finally {
  await rm(tempRoot, {recursive: true, force: true});
}

async function testRoundTripAndEncryption() {
  const userData = path.join(tempRoot, "round-trip");
  const store = new DesktopSaveStoreV2(userData);
  const profile = sampleProfile("训练师密文检查");
  const trainingRun = {id: "training-secret-run", kind: "training"} as unknown as TrainingRunGameV4;
  const formalRun = {id: "formal-secret-run", kind: "formal"} as unknown as FormalGameRunV4;

  await store.saveUserProfile(profile);
  await store.saveTrainingRun(trainingRun);
  await store.saveFormalGameRun(formalRun);

  assert.deepEqual(await store.loadUserProfile(), profile);
  assert.deepEqual(await store.loadTrainingRun(), trainingRun);
  assert.deepEqual(await store.loadFormalGameRun(), formalRun);

  const profileDat = await readFile(path.join(store.path(), "profile.dat"), "utf8");
  const trainingDat = await readFile(path.join(store.path(), "training_run.dat"), "utf8");
  const formalDat = await readFile(path.join(store.path(), "formal_run.dat"), "utf8");
  assert.equal(profileDat.includes(profile.name), false);
  assert.equal(trainingDat.includes("training-secret-run"), false);
  assert.equal(formalDat.includes("formal-secret-run"), false);
}

async function testTamperDetection() {
  const userData = path.join(tempRoot, "tamper");
  const store = new DesktopSaveStoreV2(userData);
  await store.saveUserProfile(sampleProfile("篡改检查"));
  const profileDatPath = path.join(store.path(), "profile.dat");
  const envelope = JSON.parse(await readFile(profileDatPath, "utf8")) as {data: string};
  envelope.data = `${envelope.data.slice(0, -2)}xx`;
  await writeFile(profileDatPath, JSON.stringify(envelope), "utf8");
  await assert.rejects(() => store.loadUserProfile(), /损坏或被修改/);
}

async function testLegacyProfileMigration() {
  const userData = path.join(tempRoot, "legacy");
  const legacyPath = path.join(userData, "profile", "user-profile.json");
  const legacyProfile = sampleProfile("旧资料");
  await writeFileWithParents(legacyPath, JSON.stringify(legacyProfile, null, 2));
  const store = new DesktopSaveStoreV2(userData);

  assert.deepEqual(await store.loadUserProfile(), legacyProfile);
  assert.deepEqual(await store.loadUserProfile(), legacyProfile);
  await readFile(path.join(userData, "profile", "user-profile.legacy.json"), "utf8");
  await readFile(path.join(store.path(), "profile.dat"), "utf8");
}

async function testDeleteAll() {
  const userData = path.join(tempRoot, "delete");
  const store = new DesktopSaveStoreV2(userData);
  await store.saveUserProfile(sampleProfile("删除检查"));
  await store.saveTrainingRun({id: "delete-training"} as unknown as TrainingRunGameV4);
  await store.saveFormalGameRun({id: "delete-formal"} as unknown as FormalGameRunV4);
  await store.deleteAll();
  assert.equal(await store.loadUserProfile(), null);
  assert.equal(await store.loadTrainingRun(), null);
  assert.equal(await store.loadFormalGameRun(), null);
}

async function writeFileWithParents(filePath: string, text: string) {
  await mkdir(path.dirname(filePath), {recursive: true});
  await writeFile(filePath, text, {encoding: "utf8", flag: "w"});
}

function sampleProfile(name: string): UserProfileV2 {
  return {
    version: 1,
    id: "profile-1",
    name,
    trainerId: "rosa",
    avatarAsset: "npc/avatars/6-asset-a73f3e71.webp",
    frontAsset: "npc/player-front/rosa-spr-b2w2-rosa-b1af3eb8.png",
    backAsset: "npc/player-back/rosa-b2w2-rosa-back-405f562e.png",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    battlePreference: {
      allowedGenerations: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      ruleSet: "gen9",
      enabledBattleSystems: ["terastal"],
      legendaryBattle: false,
      battleBagEnabled: true,
    },
    battlePoints: 0,
    starChart: {nodes: {root_trainer_star: 1}},
  };
}
