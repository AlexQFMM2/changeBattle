import type {
  BattleRecordEntry,
  LocalSave,
  SaveBattleRecordsTable,
  SaveBattleSettingTable,
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
import {DEFAULT_AUDIO_SETTINGS, DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";
import type {RuntimeSaveStore} from "./environment.js";

const SAVE_VERSION = 1 as const;
const SPLIT_SAVE_VERSION = 2 as const;
const BP_SCALE = 1;
const DEFAULT_SLOT_ID = "slot-001";

const TABLE_FILES = {
  user: "user.json",
  talents: "talents.json",
  starterUpgrades: "starter_upgrades.json",
  battleSetting: "battle_setting.json",
  bossDex: "boss_dex.json",
  pokemonRecords: "pokemon_records.json",
  runCheckpoint: "run_checkpoint.json",
  battleRecords: "battle_records.json",
} as const;

type SaveTableName = keyof typeof TABLE_FILES;

export type RuntimeSaveFileStorage = {
  readText(path: string): Promise<string>;
  writeText(path: string, text: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  delete(path: string): Promise<void>;
};

export function normalizeTrainerProfile(profile?: TrainerProfile): TrainerProfile {
  return {
    name: profile?.name?.trim() || "训练师",
    gender: normalizeGender(profile?.gender),
    player_npc_id: profile?.player_npc_id,
    front_asset: profile?.front_asset,
    front_gif_asset: profile?.front_gif_asset,
    back_asset: profile?.back_asset,
    avatar_asset: profile?.avatar_asset,
  };
}

export function createInitialSave(trainer: TrainerProfile, now = new Date()): LocalSave {
  const timestamp = now.toISOString();
  return {
    version: SAVE_VERSION,
    bp_scale: BP_SCALE,
    trainer: normalizeTrainerProfile(trainer),
    stats: {
      battle_points: 50,
      battles: 0,
      wins: 0,
      losses: 0,
      pokemon_usage_counts: {},
      win_rate: 0,
      set_win_streak: 0,
      best_set_win_streak: 0,
      rank_status: "未开放",
    },
    audio_settings: DEFAULT_AUDIO_SETTINGS,
    talent_unlocks: [],
    talent_equipped: [],
    named_champion_id: null,
    star_chart: {nodes: {root_trainer_star: 1}},
    starter_upgrades: {
      item_quality: {battle: 1, recovery: 1, berry: 1, tm: 1},
      item_quantity: {battle: 2, recovery: 2, berry: 2, tm: 2},
      pokemon_reroll: 0,
      pokemon_inspect: 0,
      pokemon_single_reroll: 0,
    },
    battle_setting: normalizeBattleSetting(DEFAULT_BATTLE_SETTING),
    current_run: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export class SplitJsonSaveStore implements RuntimeSaveStore {
  private readonly slotDir: string;
  private memorySave: LocalSave | null = null;

  constructor(
    private readonly storage: RuntimeSaveFileStorage,
    private readonly root = "saves",
    private readonly slotId = DEFAULT_SLOT_ID,
  ) {
    this.slotDir = `${this.root}/${this.slotId}`;
  }

  async load(): Promise<LocalSave | null> {
    if (this.memorySave) return cloneSave(this.memorySave);
    if (!(await this.storage.exists(this.manifestPath()))) return null;
    const save = await this.loadSplitSave();
    this.memorySave = cloneSave(save);
    return save;
  }

  async createNew(trainer: TrainerProfile): Promise<LocalSave> {
    const save = createInitialSave(trainer);
    await this.writeSplitSave(save, {allowInBattleCheckpoint: true});
    this.memorySave = cloneSave(save);
    return cloneSave(save);
  }

  async updateTrainer(trainer: TrainerProfile): Promise<LocalSave> {
    const save = (await this.load()) || await this.createNew(trainer);
    const normalized = normalizeTrainerProfile(trainer);
    const next: LocalSave = {
      ...save,
      trainer: {
        name: normalized.name || save.trainer.name || "训练师",
        gender: normalized.gender,
        player_npc_id: normalized.player_npc_id || save.trainer.player_npc_id,
        front_asset: normalized.front_asset || save.trainer.front_asset,
        front_gif_asset: normalized.front_gif_asset || save.trainer.front_gif_asset,
        back_asset: normalized.back_asset || save.trainer.back_asset,
        avatar_asset: normalized.avatar_asset || save.trainer.avatar_asset,
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
    await this.storage.delete(this.slotDir).catch(() => undefined);
  }

  private async loadSplitSave(): Promise<LocalSave> {
    const manifest = JSON.parse(await this.storage.readText(this.manifestPath())) as SaveManifest;
    if (manifest.version !== SPLIT_SAVE_VERSION) {
      throw new Error(`不支持的存档版本: ${manifest.version}`);
    }
    const user = await this.readTable<SaveUserTable>("user");
    const talents = await this.readTable<SaveTalentTable>("talents", {version: 1, talent_unlocks: [], talent_equipped: [], named_champion_id: null, star_chart: {nodes: {root_trainer_star: 1}}});
    const starterUpgrades = await this.readTable<SaveStarterUpgradesTable>("starterUpgrades", {version: 1});
    const battleSetting = await this.readTable<SaveBattleSettingTable>("battleSetting", {version: 1, battle_setting: normalizeBattleSetting(DEFAULT_BATTLE_SETTING)});
    const bossDex = await this.readTable<SaveBossDexTable>("bossDex", {version: 1, boss_dex: {}});
    const runCheckpoint = await this.readTable<SaveRunCheckpointTable>("runCheckpoint", {version: 1, current_run: null});
    return {
      version: SAVE_VERSION,
      bp_scale: user.bp_scale ?? BP_SCALE,
      trainer: user.trainer,
      stats: user.stats,
      audio_settings: user.audio_settings || DEFAULT_AUDIO_SETTINGS,
      talent_unlocks: talents.talent_unlocks || [],
      talent_equipped: talents.talent_equipped || [],
      star_chart: talents.star_chart,
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
    await this.storage.mkdir(this.slotDir);
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
    await this.writeJson(this.manifestPath(), manifest);
    await this.writeTable<SaveUserTable>("user", {
      version: 1,
      bp_scale: save.bp_scale ?? BP_SCALE,
      trainer: save.trainer,
      stats: save.stats,
      audio_settings: save.audio_settings,
      run_memory: save.run_memory,
      created_at: save.created_at,
      updated_at: save.updated_at,
    });
    await this.writeTable<SaveTalentTable>("talents", {
      version: 1,
      talent_unlocks: save.talent_unlocks || [],
      talent_equipped: save.talent_equipped || [],
      named_champion_id: save.named_champion_id || null,
      star_chart: save.star_chart,
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
    if (!(await this.storage.exists(this.tablePath("pokemonRecords")))) {
      await this.writeTable<SavePokemonRecordsTable>("pokemonRecords", {version: 1, records: {}});
    }
    if (!(await this.storage.exists(this.tablePath("battleRecords")))) {
      await this.writeTable<SaveBattleRecordsTable>("battleRecords", {version: 1, records: []});
    }
    if (shouldWriteRunCheckpoint) {
      await this.writeTable<SaveRunCheckpointTable>("runCheckpoint", {version: 1, current_run: currentRun});
    }
  }

  private manifestPath(): string {
    return `${this.slotDir}/manifest.json`;
  }

  private tablePath(name: SaveTableName): string {
    return `${this.slotDir}/${TABLE_FILES[name]}`;
  }

  private async readTable<T>(name: SaveTableName, fallback?: T): Promise<T> {
    const filePath = this.tablePath(name);
    if (!(await this.storage.exists(filePath))) {
      if (fallback !== undefined) return clone(fallback);
      throw new Error(`缺少存档表: ${name}`);
    }
    return JSON.parse(await this.storage.readText(filePath)) as T;
  }

  private async writeTable<T>(name: SaveTableName, value: T): Promise<void> {
    await this.writeJson(this.tablePath(name), value);
  }

  private async writeJson(path: string, value: unknown): Promise<void> {
    await this.storage.writeText(path, `${JSON.stringify(value, null, 2)}\n`);
  }
}

function normalizeGender(value: TrainerGender | undefined): TrainerGender {
  return value === "male" || value === "female" || value === "other" ? value : "other";
}

function cloneSave(save: LocalSave): LocalSave {
  return clone(save);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
