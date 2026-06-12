import type {BattleBackgroundView, BattleRulePreset, BattleSetting, CurrentRunData, GeneratedTeam, LocalSave, PlannedBattleData, PokemonSet, RentalPokemon, TrainerNpcType, TrainerNpcView} from "@changebattle/shared";
import {DEFAULT_BATTLE_SETTING, SHOWDOWN_ID_POOL, normalizeBattleSetting} from "@changebattle/shared";
import type {RuntimeDataProvider} from "./data-provider.js";
import {parseCsvLine} from "./profile-settings.js";
import type {RuntimeGenerationProfile, RuntimeSpeciesTier} from "./starter-candidates.js";

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export type PlannedBattleRoute = {
  type: "normal" | "gym" | "champion" | "elite4";
  stage: string;
  route: string;
  pool: Array<{type: TrainerNpcType; tier?: string}>;
};

export type RuntimeBossTeamPoolRow = {
  pool_id: string;
  battle_rule_preset: BattleRulePreset;
  trainer_id: string;
  team_index: number;
  slot: number;
  species_id: string;
  species?: string;
  species_tier?: RuntimeSpeciesTier;
  generation_profile: RuntimeGenerationProfile;
};

export type RuntimeTeamPoolSelection = {
  teamIndex: number;
  rows: RuntimeBossTeamPoolRow[];
  speciesIds: string[];
  profiles: RuntimeGenerationProfile[];
};

export type PlannedBattleService = {
  deriveSeed(base: number, salt: number): number;
  generateRentalCandidates(
    seed: number,
    format: string,
    count: number,
    options: {
      profiles?: RuntimeGenerationProfile[];
      speciesTiers?: RuntimeSpeciesTier[];
      speciesIds?: string[];
      purpose?: "starter" | "normal" | "boss" | "rescue";
      battleSetting?: BattleSetting;
      speciesUsageCounts?: Record<string, number>;
    },
  ): Promise<GeneratedTeam>;
};

export const VILLAIN_INTRUSION_EXCLUDED_NAMES = ["坂木", "giovanni"] as const;
export const RAINBOW_ROCKET_UNLOCK_NAMES = ["赤焰松", "水梧桐", "赤日", "魁奇思", "弗拉达利", "露莎米奈"] as const;
export const RAINBOW_ROCKET_FINAL_NAME = "坂木";
export const VILLAIN_INTRUSION_CHANCE = 0.1;
export const RAINBOW_ROCKET_CHANCE = 0.1;

export type SpecialPlannedBattleOptions = {
  run: CurrentRunData;
  battleNo: number;
  service: PlannedBattleService;
  npcCatalog: TrainerNpcView[];
  rainbowRocketTeamPools: RuntimeBossTeamPoolRow[];
  battleBackgroundForRun(run: CurrentRunData, trainer: TrainerNpcView, battleNo: number): BattleBackgroundView;
  uuid(): string;
};

export function parseTeamPoolRows(raw: string, defaultProfile: RuntimeGenerationProfile): RuntimeBossTeamPoolRow[] {
  if (!raw.trim()) return [];
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0] || "");
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(header.map((key, index) => [key, values[index] || ""])) as Record<string, string>;
    return {
      pool_id: row.pool_id,
      battle_rule_preset: (["none", "gen7", "gen8", "gen9"].includes(row.battle_rule_preset) ? row.battle_rule_preset : "none") as BattleRulePreset,
      trainer_id: row.trainer_id,
      team_index: Number(row.team_index || 0),
      slot: Number(row.slot || 0),
      species_id: row.species_id,
      species: row.species || undefined,
      species_tier: Number(row.species_tier || 0) as RuntimeSpeciesTier || undefined,
      generation_profile: (row.generation_profile || defaultProfile) as RuntimeGenerationProfile,
    };
  }).filter(row => row.pool_id && row.species_id && row.team_index && row.slot);
}

export async function loadRuntimeTeamPools(data: RuntimeDataProvider, runtimePath: string, defaultProfile: RuntimeGenerationProfile): Promise<RuntimeBossTeamPoolRow[]> {
  const raw = await data.readText(runtimePath).catch(() => "");
  return parseTeamPoolRows(raw, defaultProfile);
}

export function routeBossForBattle(setStreak: number, battleNo: number): PlannedBattleRoute {
  if (battleNo === 3) {
    if (setStreak <= 0) return {type: "gym", stage: "tier1", route: "battle3:gym:tier1", pool: [{type: "gym", tier: "tier1"}]};
    if (setStreak === 1) return {type: "gym", stage: "tier2", route: "battle3:gym:tier2", pool: [{type: "gym", tier: "tier2"}]};
    return {type: "gym", stage: "tier3_or_elite4", route: "battle3:gym-tier3-or-elite4", pool: [{type: "gym", tier: "tier3"}, {type: "elite4", tier: "elite4"}]};
  }
  if (battleNo === 7) {
    if (setStreak <= 0) return {type: "gym", stage: "tier2", route: "battle7:gym:tier2", pool: [{type: "gym", tier: "tier2"}]};
    if (setStreak === 1) return {type: "gym", stage: "tier3_or_elite4", route: "battle7:gym-tier3-or-elite4", pool: [{type: "gym", tier: "tier3"}, {type: "elite4", tier: "elite4"}]};
    return {type: "champion", stage: "champion", route: "battle7:champion", pool: [{type: "champion", tier: "champion"}]};
  }
  return {type: "normal", stage: "normal", route: "normal", pool: [{type: "normal"}]};
}

export function routeForRunBattle(save: LocalSave, run: CurrentRunData, battleNo: number, defaultBattles: number): PlannedBattleRoute {
  if (run.named_champion_id && battleNo === Number(run.battles || defaultBattles)) {
    return {type: "champion", stage: "champion", route: "named:champion", pool: [{type: "champion", tier: "champion"}]};
  }
  return routeBossForBattle(Number(save.stats?.set_win_streak || 0), battleNo);
}

export function normalEnemyProfilesForBattle(setStreak: number, battleNo: number): RuntimeGenerationProfile[] {
  const nextBoss = routeBossForBattle(setStreak, battleNo < 3 ? 3 : 7);
  if (nextBoss.type === "champion" || nextBoss.stage.includes("tier3")) return ["tier3", "tier3", "tier4"];
  if (nextBoss.stage === "tier2") return ["tier2", "tier2", "tier3"];
  return ["tier1", "tier1", "tier2"];
}

export function normalEnemySpeciesTiersForBattle(setStreak: number, battleNo: number): RuntimeSpeciesTier[] {
  const nextBoss = routeBossForBattle(setStreak, battleNo < 3 ? 3 : 7);
  if (nextBoss.type === "champion" || nextBoss.stage.includes("tier3")) return [4, 5, 5];
  if (nextBoss.stage === "tier2") return [4, 4, 5];
  return [3, 4, 4];
}

export function profilesForRoute(route: PlannedBattleRoute): RuntimeGenerationProfile[] {
  if (route.type === "champion") return ["champion", "champion", "champion"];
  if (route.type === "elite4" || route.stage.includes("tier3")) return ["tier3", "tier4", "tier4"];
  if (route.stage === "tier2") return ["tier2", "tier3", "tier3"];
  if (route.stage === "tier1") return ["tier1", "tier2", "tier2"];
  return ["tier1", "tier1", "tier2"];
}

export function simpleHash(...values: Array<string | number>): number {
  let hash = 2166136261;
  for (const value of values.join(":")) {
    hash ^= value.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function pickStable<T>(values: T[], ...salt: Array<string | number>): T | undefined {
  if (!values.length) return undefined;
  return values[simpleHash(...salt) % values.length];
}

export function villainTrainerPool(npcCatalog: TrainerNpcView[], excludedNames: readonly string[] = VILLAIN_INTRUSION_EXCLUDED_NAMES): TrainerNpcView[] {
  const excluded = new Set(excludedNames.map(value => trainerLookupId(value)));
  return npcCatalog.filter(entry => {
    if (entry.type !== "villain" || !entry.front_asset) return false;
    return !excluded.has(trainerLookupId(entry.name_zh)) && !excluded.has(trainerLookupId(entry.name_en || entry.id));
  });
}

export function villainTrainerByName(npcCatalog: TrainerNpcView[], name: string): TrainerNpcView | undefined {
  const nameId = trainerLookupId(name);
  return npcCatalog.find(entry => entry.type === "villain" && (
    entry.name_zh === name ||
    trainerLookupId(entry.name_en || "") === nameId ||
    trainerLookupId(entry.id).includes(nameId)
  ));
}

export function rainbowRocketUnlocked(save: LocalSave, npcCatalog: TrainerNpcView[], names: readonly string[] = RAINBOW_ROCKET_UNLOCK_NAMES): boolean {
  const bossDex = save.boss_dex || {};
  return names.every(name => {
    const trainer = villainTrainerByName(npcCatalog, name);
    return trainer && Number(bossDex[trainer.id]?.wins || 0) > 0;
  });
}

export function rainbowRocketRollHits(seed: number, chance = RAINBOW_ROCKET_CHANCE): boolean {
  return simpleHash(seed || 0, "rainbow_rocket") % 1000 < chance * 1000;
}

export function villainIntrusionRollHits(run: CurrentRunData, battleNo: number, chance = VILLAIN_INTRUSION_CHANCE): boolean {
  return simpleHash(run.seed || 0, battleNo, Number(run.wins || 0), "villain_intrusion") % 1000 < chance * 1000;
}

export function chooseTrainerForRoute(npcCatalog: TrainerNpcView[], route: PlannedBattleRoute, run: CurrentRunData, battleNo: number): TrainerNpcView {
  const pool = route.type === "normal"
    ? npcCatalog.filter(entry => entry.type === "normal" && entry.front_asset)
    : npcCatalog.filter(entry => entry.front_asset && route.pool.some(pool => entry.type === pool.type && (!pool.tier || entry.tier === pool.tier)));
  const fallback = npcCatalog.find(entry => entry.type === "normal" && entry.front_asset) || {id: "normal:default", type: "normal" as const, name_zh: "路人训练师"};
  const forcedId = run.forced_trainer_ids?.[String(battleNo)];
  const forced = forcedId ? pool.find(entry => entry.id === forcedId) : undefined;
  const namedChampion = route.type === "champion" && run.named_champion_id ? pool.find(entry => entry.id === run.named_champion_id) : undefined;
  const selected = forced || namedChampion || pickStable(pool, run.seed || 0, battleNo, route.route) || fallback;
  const teamPool = selected.team_pool_ids?.length ? pickStable(selected.team_pool_ids, run.seed || 0, battleNo, selected.id, forcedId || "") : undefined;
  return {...selected, team_pool_id: teamPool};
}

export function rerouteTrainerForRoute(npcCatalog: TrainerNpcView[], route: PlannedBattleRoute, run: CurrentRunData, battleNo: number): TrainerNpcView {
  const pool = route.type === "normal"
    ? npcCatalog.filter(entry => entry.type === "normal" && entry.front_asset)
    : npcCatalog.filter(entry => entry.front_asset && route.pool.some(pool => entry.type === pool.type && (!pool.tier || entry.tier === pool.tier)));
  if (pool.length <= 1) throw new Error("当前路线没有其他同等级对手。");
  const current = chooseTrainerForRoute(npcCatalog, route, run, battleNo);
  const history = new Set((run.reroute_history?.[String(battleNo)] || []).filter(Boolean));
  history.add(current.id);
  const freshCandidates = pool.filter(entry => entry.id !== current.id && !history.has(entry.id));
  const candidates = freshCandidates.length ? freshCandidates : pool.filter(entry => entry.id !== current.id);
  const picked = pickStable(candidates, run.seed || 0, battleNo, route.route, Number(run.reroute_used || 0) + 1, history.size);
  if (!picked) throw new Error("当前路线没有可替换的对手。");
  const teamPool = picked.team_pool_ids?.length
    ? pickStable(picked.team_pool_ids, run.seed || 0, battleNo, picked.id, "reroute", Number(run.reroute_used || 0) + 1)
    : undefined;
  return {...picked, team_pool_id: teamPool};
}

export function pickTeamPoolSelection(sourceRows: RuntimeBossTeamPoolRow[], trainer: TrainerNpcView, run: CurrentRunData, battleNo: number, saltLabel: string, count = 3): RuntimeTeamPoolSelection | null {
  const poolId = trainer.team_pool_id || trainer.team_pool_ids?.[0];
  if (!poolId) return null;
  const preset = normalizeBattleSetting(run.battle_setting || DEFAULT_BATTLE_SETTING).battle_rule_preset;
  const allPoolRows = sourceRows.filter(row => row.pool_id === poolId);
  const trainerRows = allPoolRows.filter(row => row.trainer_id === trainer.id);
  const poolRows = trainerRows.length ? trainerRows : allPoolRows;
  const presetRows = poolRows.filter(row => row.battle_rule_preset === preset);
  const fallbackRows = presetRows.length ? presetRows : poolRows.filter(row => row.battle_rule_preset === "none");
  if (!fallbackRows.length) return null;
  const selectedPreset = presetRows.length ? preset : "none";
  const teamIndexes = [...new Set(fallbackRows.map(row => row.team_index))].sort((a, b) => a - b);
  const teamIndex = pickStable(teamIndexes, run.seed || 0, battleNo, trainer.id, poolId, selectedPreset, saltLabel) || teamIndexes[0];
  const selected = fallbackRows.filter(row => row.team_index === teamIndex).sort((a, b) => a.slot - b.slot).slice(0, count);
  if (selected.length < count) return null;
  return {teamIndex, rows: selected, speciesIds: selected.map(row => row.species_id), profiles: selected.map(row => row.generation_profile)};
}

function normalizeSpeciesUsageCounts(counts?: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(counts || {}).map(([id, count]) => [toId(id), Math.max(0, Math.floor(Number(count || 0)))]).filter(([id]) => Boolean(id)));
}

function recordGeneratedSpeciesUsage(counts: Record<string, number>, display: RentalPokemon[]): void {
  for (const pokemon of display) {
    const key = toId(pokemon.species_id || pokemon.species || pokemon.name);
    if (!key) continue;
    counts[key] = Math.max(0, Number(counts[key] || 0)) + 1;
  }
}

export async function buildPlannedBattle(options: {
  save: LocalSave;
  run: CurrentRunData;
  battleNo: number;
  service: PlannedBattleService;
  npcCatalog: TrainerNpcView[];
  bossTeamPools: RuntimeBossTeamPoolRow[];
  defaultBattles: number;
  battleBackgroundForRun(run: CurrentRunData, trainer: TrainerNpcView, battleNo: number): BattleBackgroundView;
  uuid(): string;
  speciesUsageCounts?: Record<string, number>;
}): Promise<PlannedBattleData> {
  const {save, run, battleNo, service, npcCatalog, bossTeamPools, defaultBattles} = options;
  const route = routeForRunBattle(save, run, battleNo, defaultBattles);
  const enemyTrainer = chooseTrainerForRoute(npcCatalog, route, run, battleNo);
  const routeSalt = route.type === "normal" ? 100 : route.type === "champion" ? 700 : route.stage.includes("tier3") ? 603 : route.stage === "tier2" ? 602 : 601;
  const bossTeam = route.type === "normal" ? null : pickTeamPoolSelection(bossTeamPools, enemyTrainer, run, battleNo, "boss");
  const profiles = bossTeam?.profiles || (route.type === "normal" ? normalEnemyProfilesForBattle(Number(save.stats?.set_win_streak || 0), battleNo) : profilesForRoute(route));
  const speciesTiers = route.type === "normal" ? normalEnemySpeciesTiersForBattle(Number(save.stats?.set_win_streak || 0), battleNo) : undefined;
  const enemyGenerated = await service.generateRentalCandidates(service.deriveSeed(Number(run.seed), routeSalt + battleNo), "gen9randombattle", profiles.length, {
    profiles,
    speciesTiers,
    speciesIds: bossTeam?.speciesIds,
    purpose: route.type === "normal" ? "normal" : "boss",
    battleSetting: run.battle_setting,
    speciesUsageCounts: options.speciesUsageCounts || save.stats?.pokemon_usage_counts,
  });
  const enemyRaw = enemyGenerated.team.slice(0, 3);
  const enemyDisplay = enemyGenerated.display.slice(0, 3);
  if (options.speciesUsageCounts) recordGeneratedSpeciesUsage(options.speciesUsageCounts, enemyDisplay);
  ensureTeamRunMemberIds(enemyRaw, enemyDisplay, options.uuid);
  assignEnemyShowdownIds(enemyRaw, enemyDisplay);
  return {
    battle_no: battleNo,
    route_type: route.type,
    route_stage: route.stage,
    route_route: route.route,
    generation_stage: profiles.join("|"),
    enemy_team_pool_id: enemyTrainer.team_pool_id,
    enemy_trainer: enemyTrainer,
    enemy_raw: enemyRaw,
    enemy_display: enemyDisplay,
    battle_background: options.battleBackgroundForRun({...run, boss_route: route.route}, enemyTrainer, battleNo),
  };
}

export async function buildPlannedBattles(options: Omit<Parameters<typeof buildPlannedBattle>[0], "battleNo">): Promise<PlannedBattleData[]> {
  const total = Math.max(1, Number(options.run.battles || options.defaultBattles));
  const planned: PlannedBattleData[] = [];
  const speciesUsageCounts = normalizeSpeciesUsageCounts(options.speciesUsageCounts || options.save.stats?.pokemon_usage_counts);
  for (let battleNo = 1; battleNo <= total; battleNo += 1) planned.push(await buildPlannedBattle({...options, battleNo, speciesUsageCounts}));
  return planned;
}

export async function buildVillainIntrusionPlannedBattle(options: SpecialPlannedBattleOptions & {
  trainerOverride?: TrainerNpcView;
}): Promise<PlannedBattleData> {
  const {run, battleNo, service, npcCatalog, rainbowRocketTeamPools} = options;
  const pool = villainTrainerPool(npcCatalog);
  if (!pool.length) throw new Error("缺少可用的反派头目数据。");
  const selectedTrainer = options.trainerOverride || pickStable(pool, run.seed || 0, battleNo, Number(run.wins || 0), "villain_intrusion") || pool[0];
  const teamPoolId = selectedTrainer.team_pool_ids?.length
    ? pickStable(selectedTrainer.team_pool_ids, run.seed || 0, battleNo, selectedTrainer.id, "villain_intrusion")
    : selectedTrainer.team_pool_id;
  const enemyTrainer = {...selectedTrainer, team_pool_id: teamPoolId};
  const team = pickTeamPoolSelection(rainbowRocketTeamPools, enemyTrainer, run, battleNo, "villain_intrusion", 3);
  if (!team) throw new Error(`反派头目 ${enemyTrainer.name_zh} 缺少可用的 3 只队伍预设。`);
  const enemyGenerated = await service.generateRentalCandidates(service.deriveSeed(Number(run.seed), 0x7600 + battleNo), "gen9randombattle", 3, {
    profiles: team.profiles,
    speciesIds: team.speciesIds,
    purpose: "boss",
    battleSetting: run.battle_setting,
  });
  const enemyRaw = enemyGenerated.team.slice(0, 3);
  const enemyDisplay = enemyGenerated.display.slice(0, 3);
  ensureTeamRunMemberIds(enemyRaw, enemyDisplay, options.uuid);
  assignEnemyShowdownIds(enemyRaw, enemyDisplay);
  return {
    battle_no: battleNo,
    route_type: "normal",
    route_stage: "villain_intrusion",
    route_route: "event:villain_intrusion",
    generation_stage: team.profiles.join("|"),
    special_event: "villain_intrusion",
    enemy_team_pool_id: enemyTrainer.team_pool_id,
    enemy_trainer: enemyTrainer,
    enemy_raw: enemyRaw,
    enemy_display: enemyDisplay,
    battle_background: options.battleBackgroundForRun({...run, boss_route: "event:villain_intrusion"}, enemyTrainer, battleNo),
  };
}

export async function buildRainbowRocketPlannedBattle(options: SpecialPlannedBattleOptions & {
  trainer: TrainerNpcView;
}): Promise<PlannedBattleData> {
  const {run, battleNo, service, rainbowRocketTeamPools, trainer} = options;
  const teamPoolId = trainer.team_pool_ids?.length
    ? pickStable(trainer.team_pool_ids, run.seed || 0, battleNo, trainer.id, "rainbow_rocket")
    : trainer.team_pool_id;
  const enemyTrainer = {...trainer, team_pool_id: teamPoolId};
  const team = pickTeamPoolSelection(rainbowRocketTeamPools, enemyTrainer, run, battleNo, "rainbow_rocket", 4);
  if (!team) throw new Error(`彩虹火箭队 ${enemyTrainer.name_zh} 缺少可用的 4 只队伍预设。`);
  const generated = await service.generateRentalCandidates(service.deriveSeed(Number(run.seed), 0x8800 + battleNo), "gen9randombattle", 4, {
    profiles: team.profiles,
    speciesIds: team.speciesIds,
    purpose: "boss",
    battleSetting: run.battle_setting,
  });
  const enemyRaw = generated.team.slice(0, 4);
  const enemyDisplay = generated.display.slice(0, 4);
  ensureTeamRunMemberIds(enemyRaw, enemyDisplay, options.uuid);
  assignEnemyShowdownIds(enemyRaw, enemyDisplay);
  return {
    battle_no: battleNo,
    route_type: "normal",
    route_stage: "rainbow_rocket",
    route_route: "event:rainbow_rocket",
    generation_stage: team.profiles.join("|"),
    special_event: "rainbow_rocket",
    enemy_team_pool_id: enemyTrainer.team_pool_id,
    enemy_trainer: enemyTrainer,
    enemy_raw: enemyRaw,
    enemy_display: enemyDisplay,
    battle_background: options.battleBackgroundForRun({...run, boss_route: "event:rainbow_rocket"}, enemyTrainer, battleNo),
  };
}

export async function buildRainbowRocketPlannedBattles(options: Omit<SpecialPlannedBattleOptions, "battleNo"> & {
  unlockNames?: readonly string[];
  finalName?: string;
}): Promise<PlannedBattleData[]> {
  const unlockNames = options.unlockNames || RAINBOW_ROCKET_UNLOCK_NAMES;
  const finalName = options.finalName || RAINBOW_ROCKET_FINAL_NAME;
  const finalTrainer = villainTrainerByName(options.npcCatalog, finalName);
  if (!finalTrainer) throw new Error(`缺少彩虹火箭队最终 Boss ${finalName}。`);
  const firstSix = unlockNames
    .map(name => villainTrainerByName(options.npcCatalog, name))
    .filter((entry): entry is TrainerNpcView => Boolean(entry));
  if (firstSix.length < unlockNames.length) throw new Error("彩虹火箭队 6 名头目资料不完整。");
  const ordered = shuffleByRng(firstSix, seededRng(Number(options.run.seed || 1), 0x7799));
  const trainers = [...ordered, finalTrainer];
  const battles: PlannedBattleData[] = [];
  for (let index = 0; index < trainers.length; index += 1) {
    battles.push(await buildRainbowRocketPlannedBattle({...options, battleNo: index + 1, trainer: trainers[index]}));
  }
  return battles;
}

function ensureTeamRunMemberIds(team: PokemonSet[] = [], display: RentalPokemon[] = [], uuid: () => string): void {
  const length = Math.max(team.length, display.length);
  for (let index = 0; index < length; index += 1) {
    const raw = team[index] as PokemonSet | undefined;
    const shown = display[index] as RentalPokemon | undefined;
    const id = runMemberId(raw) || runMemberId(shown) || `rpm_${uuid()}`;
    if (raw) raw.run_member_id = id;
    if (shown) shown.run_member_id = id;
  }
}

function assignEnemyShowdownIds(team: PokemonSet[] = [], display: RentalPokemon[] = []): void {
  const used = new Set<string>();
  const queue = [...SHOWDOWN_ID_POOL];
  const length = Math.max(team.length, display.length);
  for (let index = 0; index < length; index += 1) {
    const id = nextPoolId(queue, used);
    used.add(id);
    if (team[index]) {
      team[index].showdown_id = id;
      team[index].pokeball = id;
    }
    if (display[index]) display[index].showdown_id = id;
  }
}

function nextPoolId(queue: string[], used: Set<string>): string {
  while (queue.length) {
    const id = queue.shift();
    if (id && !used.has(id)) return id;
  }
  const fallback = SHOWDOWN_ID_POOL.find(id => !used.has(id));
  if (!fallback) throw new Error("Showdown ID 池已耗尽。");
  return fallback;
}

function runMemberId(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const id = (value as {run_member_id?: unknown}).run_member_id;
  return typeof id === "string" && id.trim() ? id : "";
}

function trainerLookupId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "");
}

function seededRng(seed: number, salt = 0): () => number {
  let state = (Number(seed || 1) ^ salt ^ 0x9e3779b9) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function shuffleByRng<T>(values: T[], rng: () => number): T[] {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}
