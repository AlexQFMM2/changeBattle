import type {
  BattleServiceRequestV4,
  BattleServiceSidePokemonV4,
  BattleServiceSnapshotV4,
  ShowdownPlayerIdV4,
} from "./types.js";

export type BattleAiRoleTagKindV4 =
  | "weather-setter"
  | "weather-abuser"
  | "terrain-setter"
  | "terrain-abuser"
  | "speed-control"
  | "trick-room-setter"
  | "pivot"
  | "wall"
  | "physical-attacker"
  | "special-attacker"
  | "mixed-attacker"
  | "setup-sweeper"
  | "revenge-killer"
  | "hazard-setter"
  | "hazard-remover"
  | "status-spreader"
  | "priority-user";

export type BattleAiRoleTagSubtypeV4 = "rain" | "sun" | "sand" | "snow" | "electric" | "grassy" | "psychic" | "misty";

export type BattleAiTeamArchetypeV4 =
  | "balanced"
  | "rain"
  | "sun"
  | "sand"
  | "snow"
  | "trick-room"
  | "tailwind"
  | "terrain"
  | "hazard-stack"
  | "poison-stall"
  | "setup-offense";

export type BattleAiRoleTagV4 = {
  kind: BattleAiRoleTagKindV4;
  subtype?: BattleAiRoleTagSubtypeV4;
  confidence: number;
  reasons: string[];
};

export type BattleAiPokemonRoleSummaryV4 = {
  ident: string;
  rowIndex: number;
  active: boolean;
  fainted: boolean;
  hpRatio: number;
  tags: BattleAiRoleTagV4[];
  primaryRoles: string[];
};

export type BattleAiTeamRoleAnalysisV4 = {
  pokemon: Record<string, BattleAiPokemonRoleSummaryV4>;
  team: {
    archetypes: BattleAiTeamArchetypeV4[];
    setters: string[];
    abusers: string[];
    pivots: string[];
    defensiveCore: string[];
    winConditions: string[];
  };
};

export type BattleAiTeamRoleAnalysisInputV4 = {
  playerId: ShowdownPlayerIdV4;
  request?: BattleServiceRequestV4;
  snapshot: BattleServiceSnapshotV4;
};

const WEATHER_SETTER_ABILITIES: Record<string, BattleAiRoleTagSubtypeV4> = {
  drizzle: "rain",
  drought: "sun",
  sandstream: "sand",
  snowwarning: "snow",
};

const WEATHER_ABUSER_ABILITIES: Record<string, BattleAiRoleTagSubtypeV4> = {
  swiftswim: "rain",
  chlorophyll: "sun",
  sandrush: "sand",
  slushrush: "snow",
};

const TERRAIN_SETTER_ABILITIES: Record<string, BattleAiRoleTagSubtypeV4> = {
  electricsurge: "electric",
  grassysurge: "grassy",
  psychicsurge: "psychic",
  mistysurge: "misty",
};

const TERRAIN_ABUSER_ABILITIES: Record<string, BattleAiRoleTagSubtypeV4> = {
  surgesurfer: "electric",
};

const WEATHER_SETTER_MOVES: Record<string, BattleAiRoleTagSubtypeV4> = {
  raindance: "rain",
  sunnyday: "sun",
  sandstorm: "sand",
  snowscape: "snow",
  hail: "snow",
};

const TERRAIN_SETTER_MOVES: Record<string, BattleAiRoleTagSubtypeV4> = {
  electricterrain: "electric",
  grassyterrain: "grassy",
  psychicterrain: "psychic",
  mistyterrain: "misty",
};

const TERRAIN_ABUSER_MOVES: Record<string, BattleAiRoleTagSubtypeV4> = {
  risingvoltage: "electric",
  grassyglide: "grassy",
  expandingforce: "psychic",
};

const PIVOT_MOVES = new Set(["uturn", "voltswitch", "flipturn", "partingshot", "teleport", "chillyreception"]);
const HAZARD_SETTER_MOVES = new Set(["stealthrock", "spikes", "toxicspikes", "stickyweb"]);
const HAZARD_REMOVER_MOVES = new Set(["defog", "rapidspin", "mortalspin", "tidyup"]);
const SETUP_MOVES = new Set(["swordsdance", "nastyplot", "dragondance", "calmmind", "bulkup", "quiverdance", "shellsmash", "agility"]);
const RECOVERY_MOVES = new Set(["recover", "roost", "slackoff", "moonlight", "synthesis", "softboiled", "morningsun", "wish", "protect", "leechseed"]);
const STATUS_MOVES = new Set(["thunderwave", "willowisp", "toxic", "spore", "sleeppowder", "stunspore", "glare", "yawn"]);
const PRIORITY_MOVES = new Set(["aquajet", "extremespeed", "suckerpunch", "iceshard", "machpunch", "bulletpunch", "shadowsneak", "quickattack", "vacuumwave"]);
const SPEED_CONTROL_MOVES = new Set(["tailwind", "icywind", "electroweb", "stringshot", "bulldoze"]);
const TRICK_ROOM_MOVES = new Set(["trickroom"]);

export function analyzeBattleAiTeamRolesV4(input: BattleAiTeamRoleAnalysisInputV4): BattleAiTeamRoleAnalysisV4 {
  const rows = sideRowsForPlayer(input);
  const pokemon: Record<string, BattleAiPokemonRoleSummaryV4> = {};
  rows.forEach((row, rowIndex) => {
    const ident = row.ident || `${input.playerId}:slot-${rowIndex + 1}`;
    const moves = moveIdsForRow(input.request, row, rowIndex);
    const ability = normalizeId(row.ability || row.baseAbility || "");
    const tags = tagsForPokemon(row, ability, moves);
    pokemon[ident] = {
      ident,
      rowIndex,
      active: Boolean(row.active),
      fainted: Boolean(row.fainted || row.condition.includes("fnt")),
      hpRatio: hpRatioFromCondition(row.condition),
      tags,
      primaryRoles: primaryRoles(tags),
    };
  });
  return {pokemon, team: summarizeTeam(pokemon)};
}

function tagsForPokemon(row: BattleServiceSidePokemonV4, ability: string, moves: string[]): BattleAiRoleTagV4[] {
  const tags: BattleAiRoleTagV4[] = [];
  const add = (kind: BattleAiRoleTagKindV4, confidence: number, reasons: string[], subtype?: BattleAiRoleTagSubtypeV4) => {
    tags.push({kind, subtype, confidence, reasons});
  };
  if (WEATHER_SETTER_ABILITIES[ability]) add("weather-setter", 0.95, [`ability:${ability}`], WEATHER_SETTER_ABILITIES[ability]);
  if (WEATHER_ABUSER_ABILITIES[ability]) add("weather-abuser", 0.9, [`ability:${ability}`], WEATHER_ABUSER_ABILITIES[ability]);
  if (TERRAIN_SETTER_ABILITIES[ability]) add("terrain-setter", 0.9, [`ability:${ability}`], TERRAIN_SETTER_ABILITIES[ability]);
  if (TERRAIN_ABUSER_ABILITIES[ability]) add("terrain-abuser", 0.85, [`ability:${ability}`], TERRAIN_ABUSER_ABILITIES[ability]);
  if (["regenerator", "intimidate"].includes(ability)) add("pivot", 0.75, [`ability:${ability}`]);

  for (const move of moves) {
    if (WEATHER_SETTER_MOVES[move]) add("weather-setter", 0.75, [`move:${move}`], WEATHER_SETTER_MOVES[move]);
    if (TERRAIN_SETTER_MOVES[move]) add("terrain-setter", 0.75, [`move:${move}`], TERRAIN_SETTER_MOVES[move]);
    if (TERRAIN_ABUSER_MOVES[move]) add("terrain-abuser", 0.7, [`move:${move}`], TERRAIN_ABUSER_MOVES[move]);
    if (SPEED_CONTROL_MOVES.has(move)) add("speed-control", move === "tailwind" ? 0.9 : 0.7, [`move:${move}`]);
    if (TRICK_ROOM_MOVES.has(move)) add("trick-room-setter", 0.9, [`move:${move}`]);
    if (PIVOT_MOVES.has(move)) add("pivot", 0.8, [`move:${move}`]);
    if (HAZARD_SETTER_MOVES.has(move)) add("hazard-setter", 0.85, [`move:${move}`]);
    if (HAZARD_REMOVER_MOVES.has(move)) add("hazard-remover", 0.85, [`move:${move}`]);
    if (SETUP_MOVES.has(move)) add("setup-sweeper", 0.8, [`move:${move}`]);
    if (RECOVERY_MOVES.has(move)) add("wall", 0.75, [`move:${move}`]);
    if (STATUS_MOVES.has(move)) add("status-spreader", 0.8, [`move:${move}`]);
    if (PRIORITY_MOVES.has(move)) add("priority-user", 0.75, [`move:${move}`]);
  }

  const stats = row.stats || {};
  const atk = Number(stats.atk || 0);
  const spa = Number(stats.spa || 0);
  const spe = Number(stats.spe || 0);
  const hp = Number(stats.hp || 0);
  const def = Number(stats.def || 0);
  const spd = Number(stats.spd || 0);
  if (atk >= 115 || atk >= spa + 25) add("physical-attacker", 0.65, ["stats:atk"]);
  if (spa >= 115 || spa >= atk + 25) add("special-attacker", 0.65, ["stats:spa"]);
  if (atk >= 100 && spa >= 100 && Math.abs(atk - spa) <= 25) add("mixed-attacker", 0.55, ["stats:atk+spa"]);
  if (spe >= 110) add("revenge-killer", 0.6, ["stats:spe"]);
  if (hp >= 150 || def >= 120 || spd >= 120) add("wall", 0.55, ["stats:bulk"]);
  return mergeTags(tags);
}

function summarizeTeam(pokemon: Record<string, BattleAiPokemonRoleSummaryV4>): BattleAiTeamRoleAnalysisV4["team"] {
  const entries = Object.values(pokemon);
  const byTag = (kind: BattleAiRoleTagKindV4) => entries.filter(entry => entry.tags.some(tag => tag.kind === kind)).map(entry => entry.ident);
  const setters = byTag("weather-setter");
  const abusers = byTag("weather-abuser");
  const archetypes = new Set<BattleAiTeamArchetypeV4>();
  for (const setter of entries.flatMap(entry => entry.tags.filter(tag => tag.kind === "weather-setter"))) {
    if (entries.some(entry => entry.tags.some(tag => tag.kind === "weather-abuser" && tag.subtype === setter.subtype))) {
      if (isWeatherArchetype(setter.subtype)) archetypes.add(setter.subtype);
    }
  }
  const terrainSetters = byTag("terrain-setter");
  const terrainAbusers = byTag("terrain-abuser");
  const hazardSetters = byTag("hazard-setter");
  const walls = byTag("wall");
  const setupSweepers = byTag("setup-sweeper");
  const attackers = entries.filter(entry => entry.tags.some(tag => ["physical-attacker", "special-attacker", "mixed-attacker", "revenge-killer", "priority-user"].includes(tag.kind)));
  const tailwindSetters = entries.filter(entry => entry.tags.some(tag => tag.kind === "speed-control" && tag.reasons.some(reason => reason === "move:tailwind")));
  const trickRoomSetters = byTag("trick-room-setter");
  const toxicSignals = entries.filter(entry => entry.tags.some(tag => tag.reasons.some(reason => reason === "move:toxic" || reason === "move:toxicspikes")));
  const stallSupportSignals = entries.filter(entry => entry.tags.some(tag => tag.reasons.some(reason => reason === "move:protect" || reason === "move:leechseed")));

  if (terrainSetters.length && (terrainAbusers.length || attackers.length >= 2)) archetypes.add("terrain");
  if (tailwindSetters.length && attackers.length >= 2) archetypes.add("tailwind");
  if (trickRoomSetters.length && entries.some(entry => entry.tags.some(tag => tag.kind === "wall" || tag.kind === "special-attacker" || tag.kind === "physical-attacker"))) archetypes.add("trick-room");
  if (hazardSetters.length >= 2 || totalReasonCount(entries, "hazard-setter") >= 2) archetypes.add("hazard-stack");
  if (toxicSignals.length && (walls.length >= 1 || stallSupportSignals.length >= 1)) archetypes.add("poison-stall");
  if (setupSweepers.length >= 1 && attackers.length >= 2) archetypes.add("setup-offense");
  if (!archetypes.size) archetypes.add("balanced");

  return {
    archetypes: [...archetypes],
    setters,
    abusers,
    pivots: byTag("pivot"),
    defensiveCore: byTag("wall"),
    winConditions: entries.filter(entry => entry.tags.some(tag => ["weather-abuser", "setup-sweeper", "revenge-killer"].includes(tag.kind))).map(entry => entry.ident),
  };
}

function totalReasonCount(entries: BattleAiPokemonRoleSummaryV4[], kind: BattleAiRoleTagKindV4): number {
  return entries.reduce((sum, entry) => sum + entry.tags
    .filter(tag => tag.kind === kind)
    .reduce((tagSum, tag) => tagSum + tag.reasons.length, 0), 0);
}

function isWeatherArchetype(subtype: BattleAiRoleTagSubtypeV4 | undefined): subtype is "rain" | "sun" | "sand" | "snow" {
  return subtype === "rain" || subtype === "sun" || subtype === "sand" || subtype === "snow";
}

function sideRowsForPlayer(input: BattleAiTeamRoleAnalysisInputV4): BattleServiceSidePokemonV4[] {
  if (input.request?.side?.pokemon?.length) return input.request.side.pokemon;
  return input.snapshot.debug.latestSidePokemon?.[input.playerId] || [];
}

function moveIdsForRow(request: BattleServiceRequestV4 | undefined, row: BattleServiceSidePokemonV4, rowIndex: number): string[] {
  const rowMoves = (row.moves || []).map(normalizeId);
  if (rowMoves.length) return rowMoves;
  if (row.active) {
    const activeRows = request?.side?.pokemon || [];
    const activeIndex = activeRows.filter((entry, index) => index < rowIndex && entry.active).length;
    const activeMoves = request?.active?.[activeIndex]?.moves || [];
    return activeMoves.map(move => normalizeId(move.id || move.move || ""));
  }
  return [];
}

function mergeTags(tags: BattleAiRoleTagV4[]): BattleAiRoleTagV4[] {
  const merged = new Map<string, BattleAiRoleTagV4>();
  for (const tag of tags) {
    const key = `${tag.kind}:${tag.subtype || ""}`;
    const existing = merged.get(key);
    if (!existing || tag.confidence > existing.confidence) {
      merged.set(key, {...tag});
    } else {
      existing.reasons = [...new Set([...existing.reasons, ...tag.reasons])];
    }
  }
  return [...merged.values()].sort((a, b) => b.confidence - a.confidence);
}

function primaryRoles(tags: BattleAiRoleTagV4[]): string[] {
  return tags.filter(tag => tag.confidence >= 0.7).map(tag => tag.subtype ? `${tag.kind}:${tag.subtype}` : tag.kind);
}

function hpRatioFromCondition(condition: string): number {
  const match = /^(\d+)\/(\d+)/.exec(condition.trim());
  const hp = match ? Number(match[1]) : Number.NaN;
  const maxHp = match ? Number(match[2]) : Number.NaN;
  if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0) return condition.includes("fnt") ? 0 : 1;
  return Math.max(0, Math.min(1, hp / maxHp));
}

function normalizeId(value: string): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
