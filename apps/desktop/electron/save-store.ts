import {copyFile, mkdir, readFile, rm, unlink, writeFile} from "node:fs/promises";
import {existsSync} from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import {gunzipSync, gzipSync} from "node:zlib";
import type {
  BattleRecordEntry,
  LocalSave,
  SaveBattleSettingTable,
  SaveBattleRecordsTable,
  SaveBossDexTable,
  SaveManifest,
  SavePokemonRecordsTable,
  SaveRunCheckpointTable,
  SaveStarterUpgradesTable,
  SaveTalentTable,
  SaveUserTable,
  TrainerGender,
  TrainerProfile,
} from "@changebattle/shared";
import {DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";

const SAVE_VERSION = 1 as const;
const SPLIT_SAVE_VERSION = 2 as const;
const BP_SCALE = 1;
const DEFAULT_SLOT_ID = "slot-001";
const APP_SAVE_SECRET = "changebattle-local-save-v1";
const TABLE_FILES = {
  user: "user.dat",
  talents: "talents.dat",
  starterUpgrades: "starter_upgrades.dat",
  battleSetting: "battle_setting.dat",
  bossDex: "boss_dex.dat",
  pokemonRecords: "pokemon_records.dat",
  runCheckpoint: "run_checkpoint.dat",
  battleRecords: "battle_records.dat",
} as const;

type SaveTableName = keyof typeof TABLE_FILES;
type SaveEnvelope = {
  v: 1;
  alg: "AES-256-GCM";
  kdf: "scrypt";
  salt: string;
  iv: string;
  tag: string;
  data: string;
};

export class SaveStore {
  private readonly legacySavePath: string;
  private readonly savesRoot: string;
  private readonly slotId: string;
  private readonly slotDir: string;
  private memorySave: LocalSave | null = null;

  constructor(userDataPath: string, slotId = DEFAULT_SLOT_ID) {
    this.legacySavePath = path.join(userDataPath, "save.json");
    this.savesRoot = path.join(userDataPath, "saves");
    this.slotId = slotId;
    this.slotDir = path.join(this.savesRoot, this.slotId);
  }

  path(): string {
    return this.slotDir;
  }

  async load(): Promise<LocalSave | null> {
    if (this.memorySave) return cloneSave(this.memorySave);
    if (existsSync(this.manifestPath())) {
      const save = await this.loadSplitSave();
      this.memorySave = cloneSave(save);
      return save;
    }
    if (existsSync(this.legacySavePath)) {
      const save = await this.migrateLegacySave();
      this.memorySave = cloneSave(save);
      return save;
    }
    return null;
  }

  async createNew(trainer: TrainerProfile): Promise<LocalSave> {
    const now = new Date().toISOString();
    const save: LocalSave = {
      version: SAVE_VERSION,
      bp_scale: BP_SCALE,
      trainer: {
        name: trainer.name.trim() || "训练师",
        gender: normalizeGender(trainer.gender),
        player_npc_id: trainer.player_npc_id,
        front_asset: trainer.front_asset,
        front_gif_asset: trainer.front_gif_asset,
        back_asset: trainer.back_asset,
        avatar_asset: trainer.avatar_asset,
      },
      stats: {
        battle_points: 50,
        battles: 0,
        wins: 0,
        losses: 0,
        win_rate: 0,
        set_win_streak: 0,
        best_set_win_streak: 0,
        rank_status: "未开放",
      },
      talent_unlocks: [],
      talent_equipped: [],
      named_champion_id: null,
      starter_upgrades: {
        item_quality: {battle: 1, recovery: 1, berry: 1, tm: 1},
        item_quantity: {battle: 2, recovery: 2, berry: 2, tm: 2},
        pokemon_reroll: 0,
        pokemon_inspect: 0,
        pokemon_single_reroll: 0,
      },
      battle_setting: normalizeBattleSetting(DEFAULT_BATTLE_SETTING),
      current_run: null,
      created_at: now,
      updated_at: now,
    };
    await this.writeSplitSave(save, {allowInBattleCheckpoint: true});
    this.memorySave = cloneSave(save);
    return cloneSave(save);
  }

  async updateTrainer(trainer: TrainerProfile): Promise<LocalSave> {
    const save = (await this.load()) || await this.createNew(trainer);
    const next: LocalSave = {
      ...save,
      trainer: {
        name: trainer.name.trim() || save.trainer.name || "训练师",
        gender: normalizeGender(trainer.gender),
        player_npc_id: trainer.player_npc_id || save.trainer.player_npc_id,
        front_asset: trainer.front_asset || save.trainer.front_asset,
        front_gif_asset: trainer.front_gif_asset || save.trainer.front_gif_asset,
        back_asset: trainer.back_asset || save.trainer.back_asset,
        avatar_asset: trainer.avatar_asset || save.trainer.avatar_asset,
      },
      updated_at: new Date().toISOString(),
    };
    await this.writeSplitSave(next);
    this.memorySave = cloneSave(next);
    return cloneSave(next);
  }

  async save(save: LocalSave): Promise<LocalSave> {
    const next = {...save, updated_at: new Date().toISOString()};
    await this.writeSplitSave(next);
    this.memorySave = cloneSave(next);
    return cloneSave(next);
  }

  async appendBattleRecord(record: BattleRecordEntry): Promise<void> {
    const table = await this.readTable<SaveBattleRecordsTable>("battleRecords", {version: 1, records: []});
    table.records.push(record);
    await this.writeTable("battleRecords", table);
  }

  async battleRecords(): Promise<SaveBattleRecordsTable> {
    return this.readTable<SaveBattleRecordsTable>("battleRecords", {version: 1, records: []});
  }

  async delete(): Promise<void> {
    this.memorySave = null;
    if (existsSync(this.slotDir)) await rm(this.slotDir, {recursive: true, force: true});
    if (existsSync(this.legacySavePath)) await unlink(this.legacySavePath);
  }

  private async migrateLegacySave(): Promise<LocalSave> {
    const raw = await readFile(this.legacySavePath, "utf8");
    const parsed = JSON.parse(raw) as LocalSave;
    if (parsed.version !== SAVE_VERSION) {
      throw new Error(`不支持的存档版本: ${parsed.version}`);
    }
    await this.writeSplitSave(parsed, {allowInBattleCheckpoint: true});
    const backupPath = path.join(path.dirname(this.legacySavePath), "save.legacy.json");
    if (!existsSync(backupPath)) await copyFile(this.legacySavePath, backupPath);
    this.memorySave = cloneSave(parsed);
    return cloneSave(parsed);
  }

  private async loadSplitSave(): Promise<LocalSave> {
    const manifest = JSON.parse(await readFile(this.manifestPath(), "utf8")) as SaveManifest;
    if (manifest.version !== SPLIT_SAVE_VERSION) {
      throw new Error(`不支持的存档版本: ${manifest.version}`);
    }
    const user = await this.readTable<SaveUserTable>("user");
    const talents = await this.readTable<SaveTalentTable>("talents", {version: 1, talent_unlocks: [], talent_equipped: [], named_champion_id: null});
    const starterUpgrades = await this.readTable<SaveStarterUpgradesTable>("starterUpgrades", {version: 1});
    const battleSetting = await this.readTable<SaveBattleSettingTable>("battleSetting", {version: 1, battle_setting: normalizeBattleSetting(DEFAULT_BATTLE_SETTING)});
    const bossDex = await this.readTable<SaveBossDexTable>("bossDex", {version: 1, boss_dex: {}});
    const runCheckpoint = await this.readTable<SaveRunCheckpointTable>("runCheckpoint", {version: 1, current_run: null});
    return {
      version: SAVE_VERSION,
      bp_scale: user.bp_scale ?? BP_SCALE,
      trainer: user.trainer,
      stats: user.stats,
      talent_unlocks: talents.talent_unlocks || [],
      talent_equipped: talents.talent_equipped || [],
      named_champion_id: talents.named_champion_id || null,
      starter_upgrades: starterUpgrades.starter_upgrades,
      battle_setting: normalizeBattleSetting(battleSetting.battle_setting),
      boss_dex: bossDex.boss_dex || {},
      run_memory: user.run_memory,
      current_run: runCheckpoint.current_run || null,
      created_at: user.created_at || manifest.created_at,
      updated_at: user.updated_at || manifest.updated_at,
    };
  }

  private async writeSplitSave(save: LocalSave, options: {allowInBattleCheckpoint?: boolean} = {}): Promise<void> {
    await mkdir(this.slotDir, {recursive: true});
    const currentRun = save.current_run || null;
    const shouldWriteRunCheckpoint = !currentRun || currentRun.status !== "in_battle" || Boolean(options.allowInBattleCheckpoint);
    const manifest: SaveManifest = {
      version: SPLIT_SAVE_VERSION,
      slot_id: this.slotId,
      display_name: save.trainer?.name || "训练师",
      created_at: save.created_at,
      updated_at: save.updated_at,
      recent_status: shouldWriteRunCheckpoint ? (currentRun?.status || "idle") : "in_battle",
    };
    await writeFile(this.manifestPath(), JSON.stringify(manifest, null, 2) + "\n", "utf8");
    await this.writeTable<SaveUserTable>("user", {
      version: 1,
      bp_scale: save.bp_scale ?? BP_SCALE,
      trainer: save.trainer,
      stats: save.stats,
      run_memory: save.run_memory,
      created_at: save.created_at,
      updated_at: save.updated_at,
    });
    await this.writeTable<SaveTalentTable>("talents", {
      version: 1,
      talent_unlocks: save.talent_unlocks || [],
      talent_equipped: save.talent_equipped || [],
      named_champion_id: save.named_champion_id || null,
    });
    await this.writeTable<SaveStarterUpgradesTable>("starterUpgrades", {
      version: 1,
      starter_upgrades: save.starter_upgrades,
    });
    await this.writeTable<SaveBattleSettingTable>("battleSetting", {
      version: 1,
      battle_setting: normalizeBattleSetting(save.battle_setting),
    });
    await this.writeTable<SaveBossDexTable>("bossDex", {
      version: 1,
      boss_dex: save.boss_dex || {},
    });
    if (!existsSync(this.tablePath("pokemonRecords"))) {
      await this.writeTable<SavePokemonRecordsTable>("pokemonRecords", {version: 1, records: {}});
    }
    if (!existsSync(this.tablePath("battleRecords"))) {
      await this.writeTable<SaveBattleRecordsTable>("battleRecords", {version: 1, records: []});
    }
    if (shouldWriteRunCheckpoint) {
      await this.writeTable<SaveRunCheckpointTable>("runCheckpoint", {
        version: 1,
        current_run: currentRun,
      });
    }
  }

  private async readTable<T>(name: SaveTableName, fallback?: T): Promise<T> {
    const filePath = this.tablePath(name);
    if (!existsSync(filePath)) {
      if (fallback !== undefined) return fallback;
      throw new Error(`缺少存档表: ${TABLE_FILES[name]}`);
    }
    try {
      const envelope = JSON.parse(await readFile(filePath, "utf8")) as SaveEnvelope;
      const payload = decryptTable(envelope, this.slotId, name);
      return JSON.parse(payload) as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`存档表 ${TABLE_FILES[name]} 损坏或被修改：${message}`);
    }
  }

  private async writeTable<T>(name: SaveTableName, value: T): Promise<void> {
    await mkdir(this.slotDir, {recursive: true});
    const envelope = encryptTable(JSON.stringify(value), this.slotId, name);
    await writeFile(this.tablePath(name), JSON.stringify(envelope) + "\n", "utf8");
  }

  private manifestPath(): string {
    return path.join(this.slotDir, "manifest.json");
  }

  private tablePath(name: SaveTableName): string {
    return path.join(this.slotDir, TABLE_FILES[name]);
  }
}

function encryptTable(payload: string, slotId: string, tableName: string): SaveEnvelope {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(slotId, tableName, salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(`${slotId}:${tableName}`, "utf8"));
  const compressed = gzipSync(Buffer.from(payload, "utf8"));
  const encrypted = Buffer.concat([cipher.update(compressed), cipher.final()]);
  return {
    v: 1,
    alg: "AES-256-GCM",
    kdf: "scrypt",
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: encrypted.toString("base64"),
  };
}

function decryptTable(envelope: SaveEnvelope, slotId: string, tableName: string): string {
  if (envelope.v !== 1 || envelope.alg !== "AES-256-GCM" || envelope.kdf !== "scrypt") {
    throw new Error("加密格式不受支持");
  }
  const salt = Buffer.from(envelope.salt, "base64");
  const iv = Buffer.from(envelope.iv, "base64");
  const tag = Buffer.from(envelope.tag, "base64");
  const encrypted = Buffer.from(envelope.data, "base64");
  const key = deriveKey(slotId, tableName, salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(Buffer.from(`${slotId}:${tableName}`, "utf8"));
  decipher.setAuthTag(tag);
  const compressed = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return gunzipSync(compressed).toString("utf8");
}

function deriveKey(slotId: string, tableName: string, salt: Buffer): Buffer {
  return crypto.scryptSync(`${APP_SAVE_SECRET}:${slotId}:${tableName}`, salt, 32);
}

function cloneSave(save: LocalSave): LocalSave {
  return JSON.parse(JSON.stringify(save)) as LocalSave;
}

function normalizeGender(gender?: string): TrainerGender {
  if (gender === "male" || gender === "female" || gender === "other") return gender;
  return "other";
}
