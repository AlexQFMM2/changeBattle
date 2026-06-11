import type {
  AudioSettings,
  BattleSetting,
  LocalSave,
  SaveBattleRecordsTable,
  TrainerCatalogState,
  TrainerGender,
  TrainerNpcType,
  TrainerNpcView,
  TrainerProfile,
} from "@changebattle/shared";
import {DEFAULT_AUDIO_SETTINGS, DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";
import type {RuntimeDataProvider} from "./data-provider.js";
import type {RuntimeSaveStore} from "./environment.js";

const NPC_TRAINERS_PATH = "data/npc_trainers.csv";
const MIN_ALLOWED_GENERATIONS = 3;

export type ProfileSettingsRuntimeEnv = {
  data: RuntimeDataProvider;
  saves: RuntimeSaveStore;
  now(): Date;
};

export type ProfileSettingsRuntimeApi = {
  loadSave(): Promise<LocalSave | null>;
  createNewSave(trainer: TrainerProfile): Promise<LocalSave>;
  deleteSave(): Promise<void>;
  updateTrainer(trainer: TrainerProfile): Promise<LocalSave>;
  battleRecords(): Promise<SaveBattleRecordsTable>;
  getBattleSetting(): Promise<{setting: BattleSetting; save?: LocalSave | null}>;
  updateBattleSetting(setting: Partial<BattleSetting>): Promise<{setting: BattleSetting; save?: LocalSave | null}>;
  getAudioSettings(): Promise<{settings: AudioSettings; save?: LocalSave | null}>;
  updateAudioSettings(settings: Partial<AudioSettings>): Promise<{settings: AudioSettings; save?: LocalSave | null}>;
  trainerCatalog(): Promise<TrainerCatalogState>;
};

export type TrainerProfileTools = {
  npcCatalog: TrainerNpcView[];
  trainerCatalogState(): TrainerCatalogState;
  defaultPlayerTrainer(): TrainerNpcView;
  defaultAvatarAssetFor(player: TrainerNpcView): string | undefined;
  trainerFromProfile(profile: TrainerProfile): TrainerNpcView;
  normalizeTrainerProfile(profile?: TrainerProfile): TrainerProfile;
};

export function createProfileSettingsRuntime(
  env: ProfileSettingsRuntimeEnv,
  options: {
    trainerTools?: TrainerProfileTools;
    trainerCatalog?: TrainerNpcView[];
    initialTransientAudioSettings?: AudioSettings;
    normalizeSave?: (save: LocalSave) => LocalSave;
  } = {},
): ProfileSettingsRuntimeApi {
  const trainerTools = options.trainerTools || createTrainerProfileTools(options.trainerCatalog || []);
  let transientAudioSettings = normalizeAudioSettings(options.initialTransientAudioSettings);
  const normalizeSave = options.normalizeSave || ((save: LocalSave) => save);

  const loadSave = async () => {
    const save = await env.saves.load();
    return save ? normalizeSave(save) : null;
  };

  return {
    loadSave,
    createNewSave: trainer => env.saves.createNew(trainerTools.normalizeTrainerProfile(trainer)),
    deleteSave: () => env.saves.delete(),
    updateTrainer: trainer => env.saves.updateTrainer(trainerTools.normalizeTrainerProfile(trainer)),
    battleRecords: () => env.saves.battleRecords(),
    getBattleSetting: async () => {
      const save = await loadSave();
      if (!save) throw new Error("请先创建或读取存档。");
      return {setting: normalizeBattleSetting(save.battle_setting), save};
    },
    updateBattleSetting: async setting => {
      const save = await loadSave();
      if (!save) throw new Error("请先创建或读取存档。");
      const mergedSetting = {...normalizeBattleSetting(save.battle_setting || DEFAULT_BATTLE_SETTING), ...setting};
      const rawGenerations = Array.from(new Set((mergedSetting.allowed_generations || [])
        .map(value => Math.floor(Number(value)))
        .filter(value => value >= 1 && value <= 9)));
      if (rawGenerations.length < MIN_ALLOWED_GENERATIONS) throw new Error("地区专爱至少需要选择 3 个地区。");
      save.battle_setting = normalizeBattleSetting(mergedSetting);
      const next = normalizeSave(await env.saves.save(save));
      return {setting: normalizeBattleSetting(next.battle_setting), save: next};
    },
    getAudioSettings: async () => {
      const save = await loadSave();
      if (!save) return {settings: transientAudioSettings, save: null};
      return {settings: normalizeAudioSettings(save.audio_settings), save};
    },
    updateAudioSettings: async settings => {
      const nextSettings = normalizeAudioSettings({...transientAudioSettings, ...settings});
      const save = await loadSave();
      if (!save) {
        transientAudioSettings = nextSettings;
        return {settings: transientAudioSettings, save: null};
      }
      save.audio_settings = nextSettings;
      const next = normalizeSave(await env.saves.save(save));
      transientAudioSettings = nextSettings;
      return {settings: normalizeAudioSettings(next.audio_settings), save: next};
    },
    trainerCatalog: async () => trainerTools.trainerCatalogState(),
  };
}

export async function loadTrainerNpcCatalog(data: RuntimeDataProvider): Promise<TrainerNpcView[]> {
  if (!(await data.exists(NPC_TRAINERS_PATH))) return [];
  return parseTrainerNpcCatalog(await data.readText(NPC_TRAINERS_PATH));
}

export function loadTrainerNpcCatalogSync(data: RuntimeDataProvider): TrainerNpcView[] {
  if (!data.readTextSync) return [];
  const text = data.readTextSync(NPC_TRAINERS_PATH);
  return text ? parseTrainerNpcCatalog(text) : [];
}

export function parseTrainerNpcCatalog(text: string): TrainerNpcView[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0] || "");
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(header.map((key, index) => [key, values[index] || ""]));
    return normalizeNpcRow(row);
  }).filter((entry): entry is TrainerNpcView => Boolean(entry));
}

export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        cell += "\"";
        index += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
}

export function normalizeNpcRow(row: Record<string, string>): TrainerNpcView | null {
  if (row.enabled === "0") return null;
  const type = row.type as TrainerNpcType;
  if (!["player", "normal", "gym", "elite4", "champion", "villain", "avatar"].includes(type)) return null;
  return {
    id: row.id,
    type,
    region: row.region || undefined,
    role: row.role || undefined,
    tier: row.tier || undefined,
    name_zh: row.name_zh || row.name_en || row.id,
    name_en: row.name_en || undefined,
    front_asset: row.front_asset || undefined,
    front_gif_asset: row.front_gif_asset || undefined,
    back_asset: row.back_asset || undefined,
    avatar_asset: row.avatar_asset || undefined,
    team_pool_ids: row.team_pool_ids ? row.team_pool_ids.split("|").filter(Boolean) : [],
    notes: row.notes || undefined,
  };
}

export function createTrainerProfileTools(npcCatalog: TrainerNpcView[]): TrainerProfileTools {
  const trainerCatalogState = (): TrainerCatalogState => ({
    players: npcCatalog.filter(entry => entry.type === "player" && entry.front_asset && entry.back_asset),
    avatars: npcCatalog.filter(entry => entry.type === "avatar" && entry.avatar_asset),
    champions: npcCatalog.filter(entry => entry.type === "champion" && entry.front_asset),
  });

  const defaultPlayerTrainer = (): TrainerNpcView => {
    const catalog = trainerCatalogState();
    return catalog.players[0] || {id: "player:default", type: "player", name_zh: "训练师"};
  };

  const defaultAvatarAssetFor = (player: TrainerNpcView): string | undefined => player.avatar_asset || trainerCatalogState().avatars[0]?.avatar_asset;

  const normalizeTrainerProfile = (profile?: TrainerProfile): TrainerProfile => {
    const fallback = defaultPlayerTrainer();
    const player = npcCatalog.find(entry => entry.type === "player" && entry.id === profile?.player_npc_id) || fallback;
    return {
      name: profile?.name?.trim() || "训练师",
      gender: normalizeGender(profile?.gender),
      player_npc_id: player.id,
      front_asset: player.front_asset,
      front_gif_asset: player.front_gif_asset,
      back_asset: player.back_asset,
      avatar_asset: profile?.avatar_asset || player.avatar_asset || defaultAvatarAssetFor(player),
    };
  };

  return {
    npcCatalog,
    trainerCatalogState,
    defaultPlayerTrainer,
    defaultAvatarAssetFor,
    trainerFromProfile(profile) {
      const configured = npcCatalog.find(entry => entry.type === "player" && entry.id === profile.player_npc_id);
      const fallback = defaultPlayerTrainer();
      const player = configured || fallback;
      return {
        ...player,
        name_zh: profile.name?.trim() || player.name_zh || "训练师",
        avatar_asset: profile.avatar_asset || player.avatar_asset || defaultAvatarAssetFor(player),
      };
    },
    normalizeTrainerProfile,
  };
}

export function normalizeAudioSettings(input?: Partial<AudioSettings> | null): AudioSettings {
  const volume = Number(input?.bgm_volume ?? DEFAULT_AUDIO_SETTINGS.bgm_volume);
  return {
    bgm_enabled: input?.bgm_enabled !== false,
    bgm_volume: Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : DEFAULT_AUDIO_SETTINGS.bgm_volume)),
  };
}

function normalizeGender(value: TrainerGender | undefined): TrainerGender {
  return value === "male" || value === "female" || value === "other" ? value : "other";
}
