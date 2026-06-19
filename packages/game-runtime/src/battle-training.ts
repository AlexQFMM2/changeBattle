import type {
  BattleBackgroundView,
  BattleSetting,
  BattleTrainingConfig,
  BattleTrainingPokemonConfig,
  CurrentRunData,
  LocalSave,
  PlayerPokemonState,
  PokemonSet,
  RentalPokemon,
  StatId,
  TrainerNpcView,
} from "@changebattle/shared";
import {DEFAULT_BATTLE_SETTING, SHOWDOWN_ID_POOL, normalizeBattleSetting} from "@changebattle/shared";
import type {RuntimeBattleSessionOptions} from "./battle-flow.js";
import {normalizePlayerState} from "./rest-flow.js";

export type TrainingSide = "player" | "enemy";
export type TrainingEditorTab = "base" | "moves" | "stats";
export type BattleTrainingLegalityIssueType = "move" | "ability";

export type BattleTrainingLegalityIssue = {
  type: BattleTrainingLegalityIssueType;
  slot?: number;
  value: string;
  label: string;
  message: string;
};

export type BattleTrainingLegalitySummary = {
  legal: boolean;
  issues: BattleTrainingLegalityIssue[];
};

export type BattleTrainingDexProfile = {
  speciesId?: string;
  abilities?: string[];
  moves?: string[];
};

export type BattleTrainingRunOptions = {
  save?: LocalSave | null;
  config: BattleTrainingConfig;
  playerDisplay: RentalPokemon[];
  enemyDisplay: RentalPokemon[];
  playerTrainer?: TrainerNpcView;
  enemyTrainer?: TrainerNpcView;
  battleBackground?: BattleBackgroundView;
};

export type BattleTrainingSessionBuild = {
  config: BattleTrainingConfig;
  run: CurrentRunData;
  options: RuntimeBattleSessionOptions<undefined>;
};

export type StatRecord = Record<StatId, number>;

export const TRAINING_MAX_TEAM_SIZE = 6;
export const TRAINING_STAT_IDS: StatId[] = ["hp", "atk", "def", "spa", "spd", "spe"];
export const TRAINING_STAT_LABELS: Record<StatId, string> = {hp: "HP", atk: "攻击", def: "防御", spa: "特攻", spd: "特防", spe: "速度"};
export const TRAINING_TERA_TYPES = ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"];
export const TRAINING_BATTLE_BACKGROUND: BattleBackgroundView = {id: "training-field", name: "训练场", src: "assets/battle-backgrounds/mountain-route.png"};

const TRAINING_ZH: Record<string, string> = {
  Golem: "隆隆岩",
  Raticate: "拉达",
  Pikachu: "皮卡丘",
  Eevee: "伊布",
  Charizard: "喷火龙",
  Blastoise: "水箭龟",
  Venusaur: "妙蛙花",
  Snorlax: "卡比兽",
  Gengar: "耿鬼",
  Dragonite: "快龙",
  Sturdy: "结实",
  "Run Away": "逃跑",
  Static: "静电",
  Blaze: "猛火",
  Torrent: "激流",
  Overgrow: "茂盛",
  "Thick Fat": "厚脂肪",
  Levitate: "飘浮",
  "Inner Focus": "精神力",
  Tackle: "撞击",
  "Rock Throw": "落石",
  "Defense Curl": "变圆",
  "Mud-Slap": "掷泥",
  "Giga Impact": "终极冲击",
  "Quick Attack": "电光一闪",
  "Tail Whip": "摇尾巴",
  Surf: "冲浪",
  Flamethrower: "喷射火焰",
  Thunderbolt: "十万伏特",
  Protect: "守住",
  "Sunny Day": "大晴天",
  "Solar Beam": "日光束",
  "Body Slam": "泰山压顶",
  "Shadow Ball": "暗影球",
  "Extreme Speed": "神速",
};

export function trainingDisplayName(value: string | undefined): string {
  if (!value) return "";
  return TRAINING_ZH[value] || value;
}

export function trainingStats(value: number): StatRecord {
  return Object.fromEntries(TRAINING_STAT_IDS.map(stat => [stat, value])) as StatRecord;
}

export function trainingPokemon(species: string, ability: string, moves: string[], item = ""): BattleTrainingPokemonConfig {
  return {
    species,
    speciesLabel: trainingDisplayName(species),
    name: trainingDisplayName(species),
    level: 50,
    gender: "M",
    ability,
    abilityLabel: trainingDisplayName(ability),
    item,
    itemLabel: trainingDisplayName(item),
    nature: "Serious",
    teraType: "",
    moves,
    moveLabels: moves.map(trainingDisplayName),
    ivs: trainingStats(31),
    evs: trainingStats(0),
  };
}

export function defaultTrainingConfig(now = Date.now()): BattleTrainingConfig {
  const player = trainingPokemon("Golem", "Sturdy", ["Tackle"]);
  const enemy = trainingPokemon("Raticate", "Run Away", ["Giga Impact"]);
  return {
    seed: now % 100000,
    battleSetting: {...DEFAULT_BATTLE_SETTING},
    player,
    enemy,
    playerTeam: [player],
    enemyTeam: [enemy],
  };
}

export function normalizeTrainingTeam(config: BattleTrainingConfig, side: TrainingSide): BattleTrainingPokemonConfig[] {
  const team = side === "player" ? config.playerTeam : config.enemyTeam;
  const legacy = side === "player" ? config.player : config.enemy;
  const fallback = side === "player" ? trainingPokemon("Golem", "Sturdy", ["Tackle"]) : trainingPokemon("Raticate", "Run Away", ["Giga Impact"]);
  const source = Array.isArray(team) && team.length ? team : legacy ? [legacy] : [fallback];
  return source.slice(0, TRAINING_MAX_TEAM_SIZE).map(pokemon => normalizeTrainingPokemon(pokemon, fallback));
}

export function configWithTeams(config: BattleTrainingConfig, playerTeam: BattleTrainingPokemonConfig[], enemyTeam: BattleTrainingPokemonConfig[]): BattleTrainingConfig {
  const normalizedPlayer = playerTeam.slice(0, TRAINING_MAX_TEAM_SIZE).map(pokemon => normalizeTrainingPokemon(pokemon));
  const normalizedEnemy = enemyTeam.slice(0, TRAINING_MAX_TEAM_SIZE).map(pokemon => normalizeTrainingPokemon(pokemon));
  return {
    ...config,
    playerTeam: normalizedPlayer,
    enemyTeam: normalizedEnemy,
    player: normalizedPlayer[0],
    enemy: normalizedEnemy[0],
  };
}

export function normalizeTrainingConfig(config: BattleTrainingConfig): BattleTrainingConfig {
  const defaults = defaultTrainingConfig();
  return configWithTeams(
    {...defaults, ...config, playerTeam: undefined, enemyTeam: undefined, battleSetting: normalizeBattleSetting({...DEFAULT_BATTLE_SETTING, ...(config.battleSetting || {})})},
    normalizeTrainingTeam(config, "player"),
    normalizeTrainingTeam(config, "enemy"),
  );
}

export function normalizeTrainingPokemon(pokemon: BattleTrainingPokemonConfig, fallback = trainingPokemon("Pikachu", "Static", ["Tackle"])): BattleTrainingPokemonConfig {
  const moves = [...(pokemon.moves || [])].slice(0, 4);
  while (moves.length < 4) moves.push("");
  return {
    species: pokemon.species || fallback.species,
    speciesLabel: pokemon.speciesLabel || trainingDisplayName(pokemon.species || fallback.species),
    name: pokemon.name ?? pokemon.speciesLabel ?? pokemon.species ?? fallback.name,
    level: clampNumber(pokemon.level, 1, 100, fallback.level),
    gender: pokemon.gender ?? "",
    ability: pokemon.ability || fallback.ability,
    abilityLabel: pokemon.abilityLabel || trainingDisplayName(pokemon.ability || fallback.ability),
    item: pokemon.item || "",
    itemLabel: pokemon.itemLabel || trainingDisplayName(pokemon.item || ""),
    nature: pokemon.nature || "Serious",
    teraType: pokemon.teraType || "",
    moves,
    moveLabels: normalizeMoveLabels(pokemon.moveLabels, moves),
    ivs: normalizeStatRecord(pokemon.ivs, 31, 31),
    evs: normalizeStatRecord(pokemon.evs, 0, 255),
  };
}

export function trainingTeamSets(config: BattleTrainingConfig, side: TrainingSide): PokemonSet[] {
  const fallbackSpecies = side === "player" ? "Golem" : "Raticate";
  return normalizeTrainingTeam(config, side).map(pokemon => trainingPokemonSet(pokemon, fallbackSpecies));
}

export function trainingPokemonSet(config: BattleTrainingPokemonConfig, fallbackSpecies: string): PokemonSet {
  const species = String(config.species || fallbackSpecies).trim() || fallbackSpecies;
  const moves = (config.moves || []).map(move => String(move || "").trim()).filter(Boolean).slice(0, 4);
  return {
    name: String(config.name || species).trim() || species,
    species,
    gender: config.gender && config.gender !== "N" ? config.gender : undefined,
    ability: String(config.ability || "No Ability").trim() || "No Ability",
    item: String(config.item || "").trim(),
    moves: moves.length ? moves : ["Tackle"],
    nature: String(config.nature || "Serious").trim() || "Serious",
    level: clampNumber(config.level, 1, 100, 50),
    evs: normalizeStatRecord(config.evs, 0, 255),
    ivs: normalizeStatRecord(config.ivs, 31, 31),
    teraType: String(config.teraType || "").trim() || undefined,
  };
}

export function buildTrainingRun(options: BattleTrainingRunOptions): CurrentRunData {
  const config = normalizeTrainingConfig(options.config);
  const setting = normalizeBattleSetting({...DEFAULT_BATTLE_SETTING, ...(config.battleSetting || {})});
  const run = {
    seed: trainingSeed(config),
    status: "in_battle",
    battle_no: 1,
    next_battle: 1,
    battles: 1,
    wins: 0,
    player_team: trainingTeamSets(config, "player"),
    player_display: options.playerDisplay,
    enemy_raw: trainingTeamSets(config, "enemy"),
    enemy_display: options.enemyDisplay,
    player_trainer: options.playerTrainer || trainingPlayerTrainer(options.save || null),
    enemy_trainer: options.enemyTrainer || {id: "normal:training", type: "normal", name_zh: "训练场对手"},
    battle_setting: setting,
    battle_background: options.battleBackground || TRAINING_BATTLE_BACKGROUND,
    talents: [{id: "intel_god_eye", name: "洞察之眼", category: "训练场", desc: "训练场默认显示克制与图鉴入口。", level: 3, max_level: 3, cost: 0, effects: []}],
    bag_items: {},
    coins: 0,
    bp: 0,
  } as unknown as CurrentRunData;
  run.player_state = normalizePlayerState(run);
  assignTrainingPlayerShowdownIds(run.player_team || [], run.player_display || [], run.player_state || []);
  assignTrainingEnemyShowdownIds(run.enemy_raw || [], run.enemy_display || []);
  return run;
}

export function buildTrainingBattleSession(options: BattleTrainingRunOptions): BattleTrainingSessionBuild {
  const config = normalizeTrainingConfig(options.config);
  const run = buildTrainingRun({...options, config});
  return {
    config,
    run,
    options: buildTrainingBattleSessionOptions(run, config),
  };
}

export function buildTrainingBattleSessionOptions(run: CurrentRunData, config: BattleTrainingConfig): RuntimeBattleSessionOptions<undefined> {
  return {
    playerTeam: run.player_team,
    enemyTeam: run.enemy_raw || [],
    playerDisplay: run.player_display,
    enemyDisplay: run.enemy_display || [],
    playerState: run.player_state,
    seed: [trainingSeed(config), 23, 37, 53],
    battleSetting: normalizeBattleSetting({...DEFAULT_BATTLE_SETTING, ...(config.battleSetting || {})}),
  };
}

export function trainingSeed(config: BattleTrainingConfig): number {
  return Math.max(1, Math.floor(Number(config.seed || Date.now())));
}

export function trainingPlayerTrainer(save: LocalSave | null): TrainerNpcView {
  if (save?.trainer) return {id: "player:training", type: "player", name_zh: save.trainer.name || "训练师", name_en: save.trainer.name};
  return {id: "player:training", type: "player", name_zh: "训练场玩家"};
}

export function assignTrainingEnemyShowdownIds(team: PokemonSet[] = [], display: RentalPokemon[] = []): void {
  const used = new Set<string>();
  const queue = [...SHOWDOWN_ID_POOL];
  const length = Math.max(team.length, display.length);
  for (let index = 0; index < length; index += 1) {
    const id = nextShowdownId(queue, used);
    used.add(id);
    writePokemonShowdownId(team[index], display[index], undefined, id);
  }
}

export function assignTrainingPlayerShowdownIds(team: PokemonSet[] = [], display: RentalPokemon[] = [], states: PlayerPokemonState[] = []): void {
  const used = new Set<string>();
  const queue = [...SHOWDOWN_ID_POOL];
  const length = Math.max(team.length, display.length, states.length);
  for (let index = 0; index < length; index += 1) {
    let id = toId(team[index]?.showdown_id || display[index]?.showdown_id || states[index]?.showdown_id || team[index]?.pokeball);
    if (!id || used.has(id)) id = nextShowdownId(queue, used);
    used.add(id);
    writePokemonShowdownId(team[index], display[index], states[index], id);
  }
}

export function checkTrainingPokemonLegality(pokemon: BattleTrainingPokemonConfig, profile?: BattleTrainingDexProfile | null): BattleTrainingLegalitySummary {
  if (!profile) return {legal: true, issues: []};
  const issues: BattleTrainingLegalityIssue[] = [];
  const abilityIds = new Set((profile.abilities || []).map(toId).filter(Boolean));
  const moveIds = new Set((profile.moves || []).map(toId).filter(Boolean));
  const abilityId = toId(pokemon.ability);
  if (abilityId && abilityIds.size && !abilityIds.has(abilityId)) {
    issues.push({type: "ability", value: pokemon.ability, label: pokemon.abilityLabel || pokemon.ability, message: "特性不在该物种图鉴特性中，可使用但属于非法配置。"});
  }
  (pokemon.moves || []).forEach((move, index) => {
    const moveId = toId(move);
    if (!moveId || !moveIds.size || moveIds.has(moveId)) return;
    issues.push({type: "move", slot: index, value: move, label: pokemon.moveLabels?.[index] || move, message: "技能不在该物种图鉴技能池中，可使用但属于非法配置。"});
  });
  return {legal: issues.length === 0, issues};
}

function writePokemonShowdownId(raw: PokemonSet | undefined, display: RentalPokemon | undefined, state: PlayerPokemonState | undefined, id: string): void {
  if (raw) {
    raw.showdown_id = id;
    raw.pokeball = id;
  }
  if (display) display.showdown_id = id;
  if (state) state.showdown_id = id;
}

function nextShowdownId(queue: string[], used: Set<string>): string {
  while (queue.length) {
    const candidate = toId(queue.shift());
    if (candidate && !used.has(candidate)) return candidate;
  }
  let index = 1;
  while (used.has(`cb${index}`)) index += 1;
  return `cb${index}`;
}

function normalizeStatRecord(values: BattleTrainingPokemonConfig["ivs"] | BattleTrainingPokemonConfig["evs"] | undefined, fallback: number, max: number): StatRecord {
  return Object.fromEntries(TRAINING_STAT_IDS.map(stat => [stat, clampNumber(values?.[stat], 0, max, fallback)])) as StatRecord;
}

function normalizeMoveLabels(labels: string[] | undefined, moves: string[]): string[] {
  return moves.map((move, index) => labels?.[index] || trainingDisplayName(move));
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = Math.floor(Number(value));
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
