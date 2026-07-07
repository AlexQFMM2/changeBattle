import assert from "node:assert/strict";
import {mkdir, mkdtemp, readFile, rm, writeFile} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {DesktopSaveStoreV2} from "./desktopSaveStore.js";
import type {FormalGameRunV4, PlayerVaultV4, TrainingRunGameV4, UserProfileV2} from "@changebattle-v2/api";

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "changebattle-v2-save-store-"));

try {
  await testRoundTripAndEncryption();
  await testTamperDetection();
  await testBrokenManifestDoesNotBlockSave();
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
  await store.savePlayerVault(samplePlayerVault());
  await store.saveTrainingRun(trainingRun);
  await store.saveFormalGameRun(formalRun);

  assert.deepEqual(await store.loadUserProfile(), profile);
  assert.deepEqual(await store.loadPlayerVault(), samplePlayerVault());
  assert.deepEqual(await store.loadTrainingRun(), trainingRun);
  assert.deepEqual(await store.loadFormalGameRun(), formalRun);

  const profileDat = await readFile(path.join(store.path(), "profile.dat"), "utf8");
  const playerItemDat = await readFile(path.join(store.path(), "player_item.dat"), "utf8");
  const playerPokemonDat = await readFile(path.join(store.path(), "player_pokemon.dat"), "utf8");
  const trainingDat = await readFile(path.join(store.path(), "training_run.dat"), "utf8");
  const formalDat = await readFile(path.join(store.path(), "formal_run.dat"), "utf8");
  assert.equal(profileDat.includes(profile.name), false);
  assert.equal(playerItemDat.includes("potion"), false);
  assert.equal(playerPokemonDat.includes("pikachu"), false);
  assert.equal(trainingDat.includes("training-secret-run"), false);
  assert.equal(formalDat.includes("formal-secret-run"), false);
  const manifest = JSON.parse(await readFile(path.join(store.path(), "manifest.json"), "utf8")) as {tables: Record<string, unknown>};
  assert.ok(manifest.tables.playerItem);
  assert.ok(manifest.tables.playerPokemon);
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

  const vaultStore = new DesktopSaveStoreV2(path.join(tempRoot, "tamper-vault"));
  await vaultStore.savePlayerVault(samplePlayerVault());
  const playerItemPath = path.join(vaultStore.path(), "player_item.dat");
  const playerItemEnvelope = JSON.parse(await readFile(playerItemPath, "utf8")) as {data: string};
  playerItemEnvelope.data = `${playerItemEnvelope.data.slice(0, -2)}xx`;
  await writeFile(playerItemPath, JSON.stringify(playerItemEnvelope), "utf8");
  await assert.rejects(() => vaultStore.loadPlayerVault(), /损坏或被修改/);
}

async function testBrokenManifestDoesNotBlockSave() {
  const userData = path.join(tempRoot, "broken-manifest");
  const store = new DesktopSaveStoreV2(userData);
  await store.saveUserProfile(sampleProfile("初始资料"));
  await writeFile(path.join(store.path(), "manifest.json"), '{"version":1}\n{"broken":true}\n', "utf8");

  const nextProfile = sampleProfile("重建资料");
  await store.saveUserProfile(nextProfile);

  assert.deepEqual(await store.loadUserProfile(), nextProfile);
  const manifest = JSON.parse(await readFile(path.join(store.path(), "manifest.json"), "utf8")) as {display_name: string};
  assert.equal(manifest.display_name, nextProfile.name);
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
  await store.savePlayerVault(samplePlayerVault());
  await store.saveTrainingRun({id: "delete-training"} as unknown as TrainingRunGameV4);
  await store.saveFormalGameRun({id: "delete-formal"} as unknown as FormalGameRunV4);
  await store.deleteAll();
  assert.equal(await store.loadUserProfile(), null);
  assert.equal(await store.loadPlayerVault(), null);
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
      competitionMode: "standard",
      legendaryBattle: false,
      battleBagEnabled: true,
    },
    battlePoints: 0,
    starChart: {nodes: {root_trainer_star: 1}},
    trainerVault: {
      version: 1,
      bag: {maxSize: 80, items: [], battleBagEnabled: false},
      pokemonBox: [],
    },
  };
}

function samplePlayerVault(): PlayerVaultV4 {
  return {
    version: 1,
    itemStoragePageCount: 2,
    pokemonStoragePageCount: 2,
    items: [
      {itemId: "potion", quantity: 3},
      {itemId: "leftovers", quantity: 1},
    ],
    pokemon: [
      {
        playerPokemonId: "player-pokemon-1",
        speciesId: "pikachu",
        gender: "F",
        nature: "Jolly",
        abilityId: "static",
        evs: {hp: 0, atk: 252, def: 0, spa: 0, spd: 4, spe: 252},
        ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
        moves: [{moveId: "thunderbolt", remainingPp: 15, maxPp: 15}],
        friendship: 120,
        shiny: true,
        metAt: "2026-07-04T00:00:00.000Z",
        honors: ["first-partner"],
      },
    ],
  };
}
