import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const v1DataDir = path.join(repoRoot, "changeBattle", "data");
const outFile = path.join(repoRoot, "changeBattleV2", "packages", "showdown-dex-core", "src", "data", "trainers.ts");

const TRAINER_TYPE_MAP = {
  normal: "normal",
  gym: "gym",
  elite4: "elite4",
  champion: "champion",
  villain: "villain",
  player: "player",
  avatar: "avatar",
};

const BOSS_TYPES = new Set(["gym", "elite4", "champion", "villain"]);
const FALLBACK_SPECIES = [
  "dragonite", "gyarados", "garchomp", "metagross", "tyranitar", "lucario",
  "gardevoir", "milotic", "arcanine", "snorlax", "lapras", "crobat",
  "roserade", "weavile", "magnezone", "togekiss", "hydreigon", "volcarona",
];
const ARCHETYPE_BY_KEYWORD = [
  ["rain", ["water", "rain", "水", "雨", "小霞", "米可利", "露璃娜", "milotic", "gyarados", "ludicolo", "kingdra", "lapras", "blastoise", "swampert"]],
  ["sun", ["fire", "sun", "火", "晴", "夏伯", "亚莎", "charizard", "torkoal", "ninetales", "volcarona", "arcanine", "blaziken", "infernape"]],
  ["sand", ["rock", "ground", "steel", "岩", "石", "地面", "钢", "小刚", "瓢太", "大吾", "tyranitar", "hippowdon", "garchomp", "excadrill", "metagross", "aggron", "steelix"]],
  ["snow", ["ice", "snow", "冰", "雪", "柳伯", "哈奇库", "古鲁夏", "abomasnow", "froslass", "glaceon", "mamoswine", "weavile", "aurorus"]],
  ["trick-room", ["psychic", "ghost", "超能", "幽灵", "娜姿", "松叶", "芙蓉", "嘉德丽雅", "阿塞萝拉", "gardevoir", "hatterene", "bronzong", "cofagrigus", "spiritomb", "slowbro"]],
  ["terrain", ["electric", "grass", "fairy", "电", "草", "妖精", "马志士", "电次", "莉佳", "玛俐", "raichu", "luxray", "magnezone", "venusaur", "roserade", "gardevoir"]],
  ["hazard-stack", ["bug", "poison", "虫", "毒", "阿桔", "阿杏", "阿柳", "霍米加", "glimmora", "toxapex", "forretress", "skarmory", "ferrothorn", "roserade"]],
  ["poison-stall", ["poison", "stall", "毒", "阿桔", "阿杏", "霍米加", "toxapex", "muk", "weezing", "crobat", "dragalge", "clodsire"]],
  ["tailwind", ["flying", "飞行", "阿速", "娜琪", "风露", "卡希丽", "pidgeot", "talonflame", "skarmory", "crobat", "noivern", "hawlucha"]],
  ["setup-offense", ["dragon", "fighting", "dark", "龙", "格斗", "恶", "阿渡", "艾莉丝", "奇巴纳", "彩虹火箭队", "坂木", "dragonite", "haxorus", "hydreigon", "salamence", "lucario", "machamp", "garchomp"]],
];

function readText(fileName) {
  return fs.readFileSync(path.join(v1DataDir, fileName), "utf8");
}

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === "\"" && next === "\"") {
        field += "\"";
        i += 1;
      } else if (char === "\"") {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }
    if (char === "\"") {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [headers = [], ...body] = rows.filter(current => current.some(value => value !== ""));
  return body.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function publicNpcPath(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return `/${text.replace(/^assets\/npc\//, "npc/").replace(/^\/+/, "")}`;
}

function splitList(value) {
  return String(value || "").split(/[|;]/).map(item => item.trim()).filter(Boolean);
}

function trainerRows() {
  return parseCsv(readText("npc_trainers.csv"))
    .filter(row => row.enabled !== "0")
    .map(row => ({
      id: row.id,
      trainerType: TRAINER_TYPE_MAP[row.type] || "normal",
      sourceType: row.type,
      region: row.region,
      role: row.role,
      sourceTier: row.tier,
      nameZh: row.name_zh,
      name: row.name_en || row.name_zh,
      frontAsset: publicNpcPath(row.front_asset),
      frontGifAsset: publicNpcPath(row.front_gif_asset),
      backAsset: publicNpcPath(row.back_asset),
      avatarAsset: publicNpcPath(row.avatar_asset),
      teamPoolIds: splitList(row.team_pool_ids),
      notes: splitList(row.notes),
    }));
}

function teamPoolRows(fileName) {
  const groups = new Map();
  for (const row of parseCsv(readText(fileName))) {
    const key = `${row.trainer_id}\u0000${row.battle_rule_preset}\u0000${row.pool_id}\u0000${row.team_index}`;
    const current = groups.get(key) || {
      poolId: row.pool_id,
      battleRulePreset: row.battle_rule_preset,
      trainerId: row.trainer_id,
      trainerNameZh: row.trainer_name_zh,
      teamIndex: Number(row.team_index || 0),
      source: row.source,
      pokemon: [],
    };
    current.pokemon.push({
      slot: Number(row.slot || 0),
      speciesId: row.species_id,
      species: row.species,
      sourceSpeciesRank: row.species_tier,
      sourceStageRank: row.stage_tier,
      sourcePowerProfile: row.generation_profile,
    });
    groups.set(key, current);
  }
  return Array.from(groups.values())
    .map(group => ({...group, pokemon: group.pokemon.sort((a, b) => a.slot - b.slot)}))
    .sort((a, b) => a.trainerId.localeCompare(b.trainerId) || a.battleRulePreset.localeCompare(b.battleRulePreset) || a.poolId.localeCompare(b.poolId) || a.teamIndex - b.teamIndex);
}

function representativeRows(fileName) {
  const result = new Map();
  for (const row of parseCsv(readText(fileName))) {
    const current = result.get(row.trainer_id) || [];
    current.push({
      speciesId: row.species_id,
      species: row.species,
      count: Number(row.count || 0),
      sourceNames: splitList(row.source_names),
    });
    result.set(row.trainer_id, current);
  }
  return Object.fromEntries(Array.from(result.entries()).map(([trainerId, entries]) => [
    trainerId,
    entries.sort((a, b) => b.count - a.count || a.speciesId.localeCompare(b.speciesId)),
  ]));
}

function trainerProfiles(trainers, representatives) {
  return Object.fromEntries(trainers
    .filter(trainer => BOSS_TYPES.has(trainer.trainerType))
    .map(trainer => {
      const originalPreferredSpeciesIds = uniqueList((representatives[trainer.id] || []).map(entry => entry.speciesId));
      const expanded = expandPreferredSpeciesIds(trainer, trainers, representatives, originalPreferredSpeciesIds);
      const scored = archetypeScores(trainer, representatives[trainer.id] || []);
      const teamPreferences = uniqueList([scored[0]?.archetype || "balanced", scored[1]?.archetype || "setup-offense", "balanced"]).slice(0, 3);
      return [trainer.id, {
        trainerId: trainer.id,
        battlePreference: battlePreferenceFor(trainer.trainerType, teamPreferences[0]),
        aiLevel: aiLevelFor(trainer.trainerType),
        powerProfile: trainer.trainerType === "champion" || trainer.trainerType === "villain" ? "champion" : "boss",
        teamPreferences,
        originalPreferredSpeciesIds,
        preferredSpeciesIds: expanded.speciesIds,
        diagnostics: {
          source: "v1-representatives-with-v2-expansion",
          representativeCount: originalPreferredSpeciesIds.length,
          expandedCount: expanded.speciesIds.length,
          expansionSources: expanded.sources,
          inferredFrom: scored.slice(0, 4).map(entry => `${entry.archetype}:${entry.score}`),
          messages: expanded.messages,
        },
      }];
    }));
}

function expandPreferredSpeciesIds(trainer, trainers, representatives, original) {
  const speciesIds = uniqueList(original);
  const sources = [];
  const messages = [];
  addExpansion(speciesIds, sources, representatives[trainer.id] || [], "self");
  const sameRegionSameType = trainers.filter(candidate => candidate.id !== trainer.id && candidate.region === trainer.region && candidate.trainerType === trainer.trainerType);
  for (const candidate of sameRegionSameType) addExpansion(speciesIds, sources, representatives[candidate.id] || [], `same-region-type:${candidate.id}`);
  const sameRegionBoss = trainers.filter(candidate => candidate.id !== trainer.id && candidate.region === trainer.region && BOSS_TYPES.has(candidate.trainerType));
  for (const candidate of sameRegionBoss) addExpansion(speciesIds, sources, representatives[candidate.id] || [], `same-region-boss:${candidate.id}`);
  const sameType = trainers.filter(candidate => candidate.id !== trainer.id && candidate.trainerType === trainer.trainerType);
  for (const candidate of sameType) addExpansion(speciesIds, sources, representatives[candidate.id] || [], `same-type:${candidate.id}`);
  for (const speciesId of FALLBACK_SPECIES) {
    if (speciesIds.length >= 12) break;
    if (!speciesIds.includes(speciesId)) {
      speciesIds.push(speciesId);
      sources.push(`fallback:${speciesId}`);
    }
  }
  if (!original.length) messages.push("V1 代表宝可梦为空，已使用同地区/同身份/通用池补足。");
  if (speciesIds.length < 12) messages.push(`偏好宝可梦池不足 12，只生成 ${speciesIds.length} 个候选。`);
  return {speciesIds: speciesIds.slice(0, 18), sources, messages};
}

function addExpansion(speciesIds, sources, representativeEntries, source) {
  for (const entry of representativeEntries) {
    if (speciesIds.length >= 12) break;
    if (!speciesIds.includes(entry.speciesId)) {
      speciesIds.push(entry.speciesId);
      sources.push(`${source}:${entry.speciesId}`);
    }
  }
}

function archetypeScores(trainer, representativeEntries) {
  const text = [
    trainer.id,
    trainer.region,
    trainer.role,
    trainer.nameZh,
    trainer.name,
    ...trainer.notes,
    ...representativeEntries.flatMap(entry => [entry.speciesId, entry.species, ...entry.sourceNames]),
  ].join(" ").toLowerCase();
  return ARCHETYPE_BY_KEYWORD
    .map(([archetype, keywords]) => ({
      archetype,
      score: keywords.reduce((total, keyword) => total + (text.includes(String(keyword).toLowerCase()) ? 1 : 0), 0),
    }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.archetype.localeCompare(b.archetype));
}

function battlePreferenceFor(trainerType, archetype) {
  if (trainerType === "villain") return "offense";
  if (trainerType === "champion") return "balanced";
  if (["trick-room", "tailwind", "terrain", "hazard-stack", "baton-pass"].includes(archetype)) return "support";
  if (["poison-stall", "sand", "snow"].includes(archetype)) return "defense";
  if (["rain", "sun", "setup-offense"].includes(archetype)) return "offense";
  return "balanced";
}

function aiLevelFor(trainerType) {
  if (trainerType === "gym") return "gymLeader";
  if (trainerType === "elite4") return "eliteFour";
  return "champion";
}

function uniqueList(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function readJson(fileName) {
  return JSON.parse(readText(fileName));
}

const trainers = trainerRows();
const teamPools = [
  ...teamPoolRows("boss_team_pools.csv"),
  ...teamPoolRows("rainbow_rocket_team_pools.csv"),
];
const representatives = {
  ...representativeRows("boss_representatives.csv"),
  ...representativeRows("rainbow_rocket_representatives.csv"),
};
const dialogues = {
  ...readJson("boss_dialogues.json"),
  ...readJson("rainbow_rocket_dialogues.json"),
};
const bossProfiles = trainerProfiles(trainers, representatives);

const header = `// Generated by changeBattleV2/tools/build-trainer-dex-data.mjs from V1 NPC data.\n// Do not edit this file manually; update the V1 source data and regenerate.\n\n`;

const typeBlock = `export type TrainerDataEntry = {\n  id: string;\n  trainerType: "normal" | "gym" | "elite4" | "champion" | "villain" | "player" | "avatar";\n  sourceType: string;\n  region: string;\n  role: string;\n  sourceTier: string;\n  nameZh: string;\n  name: string;\n  frontAsset: string;\n  frontGifAsset: string;\n  backAsset: string;\n  avatarAsset: string;\n  teamPoolIds: string[];\n  notes: string[];\n};\n\nexport type TrainerDialogueLineData = {intro?: string[]; defeat?: string[]; victory?: string[]};\nexport type TrainerDialogueSetData = Record<string, TrainerDialogueLineData[]>;\n\nexport type TrainerTeamPokemonData = {\n  slot: number;\n  speciesId: string;\n  species: string;\n  sourceSpeciesRank: string;\n  sourceStageRank: string;\n  sourcePowerProfile: string;\n};\n\nexport type TrainerTeamPoolData = {\n  poolId: string;\n  battleRulePreset: string;\n  trainerId: string;\n  trainerNameZh: string;\n  teamIndex: number;\n  source: string;\n  pokemon: TrainerTeamPokemonData[];\n};\n\nexport type TrainerRepresentativeData = {speciesId: string; species: string; count: number; sourceNames: string[]};\n\nexport type TrainerBossProfileData = {\n  trainerId: string;\n  battlePreference: "offense" | "defense" | "support" | "balanced";\n  aiLevel: "gymLeader" | "eliteFour" | "champion";\n  powerProfile: "boss" | "champion";\n  teamPreferences: Array<"balanced" | "rain" | "sun" | "sand" | "snow" | "trick-room" | "tailwind" | "terrain" | "hazard-stack" | "poison-stall" | "baton-pass" | "setup-offense">;\n  originalPreferredSpeciesIds: string[];\n  preferredSpeciesIds: string[];\n  diagnostics: {source: string; representativeCount: number; expandedCount: number; expansionSources: string[]; inferredFrom: string[]; messages: string[]};\n};\n\n`;

const body = [
  `export const TrainerData = ${JSON.stringify(trainers, null, 2)} as TrainerDataEntry[];\n`,
  `export const TrainerDialogues = ${JSON.stringify(dialogues, null, 2)} as Record<string, TrainerDialogueSetData>;\n`,
  `export const TrainerTeamPools = ${JSON.stringify(teamPools, null, 2)} as TrainerTeamPoolData[];\n`,
  `export const TrainerRepresentatives = ${JSON.stringify(representatives, null, 2)} as Record<string, TrainerRepresentativeData[]>;\n`,
  `export const TrainerBossProfiles = ${JSON.stringify(bossProfiles, null, 2)} as Record<string, TrainerBossProfileData>;\n`,
].join("\n");

fs.writeFileSync(outFile, `${header}${typeBlock}${body}`);
console.log(`wrote ${outFile}`);
console.log(`trainers=${trainers.length} teamPools=${teamPools.length} dialogueSets=${Object.keys(dialogues).length} bossProfiles=${Object.keys(bossProfiles).length}`);
