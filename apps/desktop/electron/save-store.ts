import {mkdir, readFile, writeFile} from "node:fs/promises";
import {existsSync} from "node:fs";
import path from "node:path";
import type {LocalSave, TrainerGender, TrainerProfile} from "@changebattle/shared";

const SAVE_VERSION = 1 as const;
const BP_SCALE = 1;

export class SaveStore {
  private readonly savePath: string;

  constructor(userDataPath: string) {
    this.savePath = path.join(userDataPath, "save.json");
  }

  path(): string {
    return this.savePath;
  }

  async load(): Promise<LocalSave | null> {
    if (!existsSync(this.savePath)) return null;
    const raw = await readFile(this.savePath, "utf8");
    const parsed = JSON.parse(raw) as LocalSave;
    if (parsed.version !== SAVE_VERSION) {
      throw new Error(`不支持的存档版本: ${parsed.version}`);
    }
    return parsed;
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
        item_quantity: {battle: 0, recovery: 0, berry: 0, tm: 0},
        pokemon_reroll: 0,
        pokemon_inspect: 0,
        pokemon_single_reroll: 0,
      },
      current_run: null,
      created_at: now,
      updated_at: now,
    };
    await this.write(save);
    return save;
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
    await this.write(next);
    return next;
  }

  async save(save: LocalSave): Promise<LocalSave> {
    const next = {...save, updated_at: new Date().toISOString()};
    await this.write(next);
    return next;
  }

  private async write(save: LocalSave): Promise<void> {
    await mkdir(path.dirname(this.savePath), {recursive: true});
    await writeFile(this.savePath, JSON.stringify(save, null, 2) + "\n", "utf8");
  }
}

function normalizeGender(gender?: string): TrainerGender {
  if (gender === "male" || gender === "female" || gender === "other") return gender;
  return "other";
}
