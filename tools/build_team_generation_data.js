const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const {TextDecoder} = require("node:util");

const root = path.resolve(__dirname, "..");
const showdownPath = process.env.SHOWDOWN_PATH || path.join(root, "vendor", "pokemon-showdown");
const fallbackShowdownPath = "/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown";
const simPath = fs.existsSync(path.join(showdownPath, "dist", "sim"))
  ? showdownPath
  : fallbackShowdownPath;
const Sim = require(path.join(simPath, "dist", "sim"));
const DATA_DEX = Sim.Dex.mod("gen9");

const STAT_IDS = ["hp", "atk", "def", "spa", "spd", "spe"];
const trainerCsvPath = path.join(root, "data", "npc_trainers.csv");
const pokemonTiersPath = path.join(root, "data", "pokemon_tiers.csv");
const bossRepresentativesPath = path.join(root, "data", "boss_representatives.csv");
const bossPoolsPath = path.join(root, "data", "boss_team_pools.csv");
const spriteMapPath = path.join(root, "data", "sprite_index_map.json");
const overridesPath = path.join(root, "data", "zh_cn_overrides.json");
const npcZipPath = path.resolve(root, "..", "npcAbout.zip");
const gbDecoder = new TextDecoder("gb18030");
const GENERIC_NPC_ALIASES = new Set([
  "玩家", "馆主", "道馆馆主", "四天王", "冠军", "普通", "NPC",
  "关都地区", "城都地区", "丰缘地区", "神奥地区", "合众地区", "卡洛斯地区", "阿罗拉地区", "伽勒尔地区", "帕底亚地区", "蓝莓学园",
]);
const LEGENDARY_TIER = 10;
const BATTLE_RULE_PRESETS = ["none", "gen7", "gen8", "gen9"];
const BATTLE_RULE_MAX_GENERATION = {none: 9, gen7: 7, gen8: 8, gen9: 9};
const NON_LEGENDARY_TAGGED_SPECIES = new Set(["kubfu", "urshifu", "urshifurapidstrike"]);
const FORCED_SPECIES_TIERS = new Map([
  ["kubfu", 6],
  ["urshifu", 6],
  ["urshifurapidstrike", 6],
]);
const TACTICAL_SCORE_BONUS = new Map([
  ["ditto", 320],
  ["smeargle", 320],
  ["shedinja", 180],
  ["wobbuffet", 160],
]);

function toId(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function parseCsvLine(line) {
  const cells = [];
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

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0] || "");
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    return Object.fromEntries(header.map((key, index) => [key, values[index] || ""]));
  });
}

function writeCsv(filePath, header, rows) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  const csv = [header.join(","), ...rows.map(row => header.map(key => csvCell(row[key])).join(","))].join("\n") + "\n";
  fs.writeFileSync(filePath, csv, "utf8");
}

function baseStatTotal(species) {
  return STAT_IDS.reduce((sum, stat) => sum + Number(species.baseStats?.[stat] || 0), 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function bulkScore(species) {
  return ["hp", "def", "spd"].reduce((sum, stat) => sum + Number(species.baseStats?.[stat] || 0), 0);
}

function seedArrayForText(text) {
  const seed = seededNumber(text);
  return [seed & 0xffff, (seed >>> 16) & 0xffff, (seed * 1103515245) & 0xffff, (seed * 2654435761) & 0xffff];
}

function loadRandomLevels() {
  const setsPath = path.join(simPath, "dist", "data", "random-battles", "gen7", "sets.json");
  const sets = fs.existsSync(setsPath) ? JSON.parse(fs.readFileSync(setsPath, "utf8")) : {};
  return Object.fromEntries(Object.entries(sets).map(([id, data]) => [id, Number(data.level || 100)]));
}

function randomSetItem(species) {
  try {
    const generator = Sim.Teams.getGenerator("gen7randombattle", seedArrayForText(`tier-item:${species.id}`));
    return String(generator.randomSet(species)?.item || "");
  } catch {
    return "";
  }
}

function hasUsableSprite(spriteMap, species) {
  const entry = spriteMap.entries?.[species.id];
  if (!entry || entry.sprite_index === 0) return false;
  const spritePath = entry.paths?.front_normal;
  if (!spritePath) return false;
  return /^https?:\/\//i.test(spritePath) || fs.existsSync(path.join(root, spritePath));
}

function isSpecialBattleForm(species) {
  const text = `${species.id || ""} ${species.name || ""} ${species.forme || ""}`.toLowerCase();
  if (species.isMega || species.battleOnly) return true;
  if (/\b(gmax|mega|tera|terastal|stellar)\b/.test(text)) return true;
  if (/(gmax|mega|tera|terastal|stellar)$/.test(species.id || "")) return true;
  return false;
}

function isPoolSpecies(species, spriteMap) {
  if (!species.exists || !species.id || species.num <= 0) return false;
  if (species.isNonstandard && species.isNonstandard !== "Past") return false;
  if (isSpecialBattleForm(species)) return false;
  if (species.requiredItem && !species.requiredMove) return false;
  return hasUsableSprite(spriteMap, species);
}

function speciesTagText(species) {
  return (species.tags || []).map(tag => String(tag || "").toLowerCase()).join("|");
}

function isLegendarySpecies(species) {
  if (NON_LEGENDARY_TAGGED_SPECIES.has(species.id)) return false;
  return /legendary/.test(speciesTagText(species));
}

function isMythicalSpecies(species) {
  return /mythical/.test(speciesTagText(species));
}

function speciesRows() {
  const spriteMap = JSON.parse(fs.readFileSync(spriteMapPath, "utf8"));
  const randomLevels = loadRandomLevels();
  const candidates = [];
  for (const species of DATA_DEX.species.all()) {
    if (!isPoolSpecies(species, spriteMap)) continue;
    const bst = baseStatTotal(species);
    const defensiveBulk = bulkScore(species);
    const nfePenalty = species.nfe ? -45 : 45;
    const legendary = isLegendarySpecies(species);
    const mythical = isMythicalSpecies(species);
    const legendaryBonus = legendary || mythical ? 90 : 0;
    const randomLevel = randomLevels[species.id] || "";
    const randomLevelScore = randomLevel ? Math.max(0, 100 - Number(randomLevel)) * 3 : 0;
    const nfeEvioliteBulkBonus = species.nfe ? Math.round(clamp((defensiveBulk - 220) / 2, 0, 80)) : 0;
    const randbatItem = randomSetItem(species);
    const randomSetEvioliteBonus = toId(randbatItem) === "eviolite" ? 40 : 0;
    const tacticalBonus = TACTICAL_SCORE_BONUS.get(species.id) || 0;
    const score = bst + nfePenalty + legendaryBonus + randomLevelScore + nfeEvioliteBulkBonus + randomSetEvioliteBonus + tacticalBonus;
    const notes = [
      species.nfe ? "nfe" : "",
      legendary ? "legendary" : "",
      mythical ? "mythical" : "",
      nfeEvioliteBulkBonus ? `eviolite-bulk+${nfeEvioliteBulkBonus}` : "",
      randomSetEvioliteBonus ? "eviolite-randset" : "",
      tacticalBonus ? `tactical+${tacticalBonus}` : "",
    ].filter(Boolean).join("|");
    candidates.push({
      species_id: species.id,
      species: species.name,
      base_species: species.baseSpecies || species.name,
      types: (species.types || []).join("|"),
      bst,
      bulk_score: defensiveBulk,
      random_battle_level: randomLevel,
      eviolite_bulk_bonus: nfeEvioliteBulkBonus,
      random_set_item: randbatItem,
      random_set_eviolite_bonus: randomSetEvioliteBonus,
      score,
      tier: 1,
      override_tier: "",
      source: randomLevel || randbatItem ? "showdown-randbats+auto-score" : "auto-score",
      notes,
    });
  }
  const sorted = [...candidates]
    .filter(row => !/(^|\|)(legendary|mythical)(\||$)/.test(row.notes))
    .sort((a, b) => a.score - b.score);
  const legendaryRows = candidates.filter(row => /(^|\|)(legendary|mythical)(\||$)/.test(row.notes));
  const tierForIndex = index => Math.min(6, Math.max(1, Math.floor(index / Math.max(1, sorted.length / 6)) + 1));
  sorted.forEach((row, index) => {
    row.tier = tierForIndex(index);
  });
  legendaryRows.forEach(row => {
    row.tier = LEGENDARY_TIER;
  });
  const tierById = new Map(sorted.map(row => [row.species_id, row.tier]));
  return candidates
    .map(row => ({...row, tier: FORCED_SPECIES_TIERS.get(row.species_id) || tierById.get(row.species_id) || row.tier}))
    .sort((a, b) => Number(a.tier) - Number(b.tier) || Number(a.bst) - Number(b.bst) || a.species.localeCompare(b.species));
}

function reverseSpeciesNames() {
  const overrides = JSON.parse(fs.readFileSync(overridesPath, "utf8"));
  const speciesNames = overrides.species || {};
  const result = new Map();
  for (const [english, zh] of Object.entries(speciesNames)) {
    const species = DATA_DEX.species.get(english);
    if (!species.exists || isSpecialBattleForm(species)) continue;
    result.set(String(zh), species.id);
    result.set(String(zh).replace(/^超级/, ""), species.id);
    result.set(species.name, species.id);
  }
  for (const species of DATA_DEX.species.all()) {
    if (species.exists && species.id) {
      result.set(species.name, species.id);
      if (species.num > 0 && !result.has(String(species.num))) result.set(String(species.num), species.id);
    }
  }
  return result;
}

function unzipText(zipEntry) {
  if (!fs.existsSync(npcZipPath)) return "";
  const buffer = fs.readFileSync(npcZipPath);
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 0xffff - 22); offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) return "";
  const centralDirectorySize = buffer.readUInt32LE(eocd + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocd + 16);
  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;
  for (let offset = centralDirectoryOffset; offset < centralDirectoryEnd;) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileNameBuffer = buffer.subarray(offset + 46, offset + 46 + fileNameLength);
    const fileNames = [fileNameBuffer.toString("utf8"), gbDecoder.decode(fileNameBuffer)];
    const fileName = fileNames.find(name => name === zipEntry);
    if (fileName === zipEntry) {
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const data = buffer.subarray(dataOffset, dataOffset + compressedSize);
      if (method === 0) return data.toString("utf8");
      if (method === 8) return zlib.inflateRawSync(data).toString("utf8");
      return "";
    }
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return "";
}

function trainerAliases(row) {
  const names = new Set([row.name_zh, row.name_en]);
  for (const part of String(row.notes || "").split("|")) names.add(part);
  return [...names].filter(name => name && !GENERIC_NPC_ALIASES.has(name)).sort((a, b) => b.length - a.length);
}

function extractRepresentatives(trainers, nameToSpecies) {
  const bossRows = trainers.filter(row => ["gym", "elite4", "champion"].includes(row.type) && row.enabled !== "0");
  const byName = new Map();
  for (const row of bossRows) {
    for (const alias of trainerAliases(row)) {
      if (!byName.has(alias)) byName.set(alias, []);
      byName.get(alias).push(row);
    }
  }
  const docs = [
    unzipText("npcAbout/馆主.md"),
    unzipText("npcAbout/四天王.md"),
    unzipText("npcAbout/冠军.md"),
  ].join("\n");
  const reps = new Map();
  let currentRows = [];
  let gapRows = 0;
  for (const rawRow of docs.split(/<tr\b/i).slice(1)) {
    const rowHtml = `<tr${rawRow}`;
    const trainerMatches = [...rowHtml.matchAll(/<a\b[^>]*title="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
      .map(match => match[1] || match[2])
      .filter(name => byName.has(name));
    if (trainerMatches.length) {
      const picked = trainerMatches.sort((a, b) => b.length - a.length)[0];
      currentRows = byName.get(picked) || [];
      gapRows = 0;
    }
    if (!currentRows.length) continue;
    const pokemonMatches = [...rowHtml.matchAll(/sprite-icon-([0-9]{3,4})[A-Za-z]*"[^>]*title="([^"]+)"/g)];
    if (!pokemonMatches.length) {
      gapRows += 1;
      if (gapRows > 6) currentRows = [];
      continue;
    }
    gapRows = 0;
    for (const match of pokemonMatches) {
      const dexNo = String(Number(match[1]));
      const pokemonName = match[2];
      const speciesId = nameToSpecies.get(pokemonName) || nameToSpecies.get(dexNo);
      if (!speciesId) continue;
      for (const trainer of currentRows) {
        const owner = String(pokemonName).split("的", 1)[0];
        if (owner && owner !== pokemonName && !trainerAliases(trainer).some(alias => owner === alias || owner.includes(alias) || alias.includes(owner))) continue;
        const key = trainer.id;
        if (!reps.has(key)) reps.set(key, new Map());
        const bucket = reps.get(key);
        const current = bucket.get(speciesId) || {count: 0, source_names: new Set()};
        current.count += 1;
        current.source_names.add(pokemonName);
        bucket.set(speciesId, current);
      }
    }
  }
  const manualRepresentatives = new Map([
    ["赤红", ["pikachu", "charizard", "venusaur", "blastoise", "snorlax", "lapras"]],
    ["小茂 / 青绿", ["pidgeot", "alakazam", "rhydon", "gyarados", "arcanine", "exeggutor"]],
    ["青绿", ["pidgeot", "alakazam", "rhydon", "gyarados", "arcanine", "exeggutor"]],
    ["竹兰", ["garchomp", "lucario", "milotic", "roserade", "spiritomb", "togekiss"]],
    ["大吾", ["metagross", "aggron", "skarmory", "cradily", "armaldo", "claydol"]],
    ["米可利", ["milotic", "gyarados", "tentacruel", "whiscash", "ludicolo", "wailord"]],
    ["阿戴克", ["volcarona", "bouffalant", "accelgor", "escavalier", "druddigon", "vanilluxe"]],
    ["艾莉丝", ["haxorus", "hydreigon", "druddigon", "aggron", "archeops", "lapras"]],
    ["卡露妮", ["gardevoir", "hawlucha", "tyrantrum", "aurorus", "goodra", "gourgeist"]],
  ]);
  for (const trainer of bossRows) {
    const aliases = trainerAliases(trainer);
    const manualEntry = [...manualRepresentatives.entries()].find(([name]) => aliases.includes(name) || trainer.name_zh === name || trainer.name_zh.includes(name));
    if (!manualEntry) continue;
    const [, speciesIds] = manualEntry;
    for (const speciesId of speciesIds) {
      const species = DATA_DEX.species.get(speciesId);
      if (!species.exists || !species.id) continue;
      const key = trainer.id;
      if (!reps.has(key)) reps.set(key, new Map());
      const bucket = reps.get(key);
      const current = bucket.get(species.id) || {count: 0, source_names: new Set()};
      current.count += 20;
      current.source_names.add("manual-high-confidence");
      bucket.set(species.id, current);
    }
  }
  const rows = [];
  for (const trainer of bossRows) {
    const bucket = reps.get(trainer.id) || new Map();
    for (const [speciesId, data] of bucket.entries()) {
      const species = DATA_DEX.species.get(speciesId);
      rows.push({
        trainer_id: trainer.id,
        trainer_name_zh: trainer.name_zh,
        trainer_type: trainer.type,
        trainer_tier: trainer.tier,
        species_id: speciesId,
        species: species.name || speciesId,
        count: data.count,
        source_names: [...data.source_names].join("|"),
      });
    }
  }
  return rows.sort((a, b) => a.trainer_id.localeCompare(b.trainer_id) || Number(b.count) - Number(a.count));
}

function profileDistributionForTrainer(row) {
  if (row.type === "champion") return ["champion", "champion", "champion"];
  if (row.type === "elite4" || row.tier === "tier3") return ["tier3", "tier4", "tier4"];
  if (row.tier === "tier2") return ["tier2", "tier3", "tier3"];
  return ["tier1", "tier2", "tier2"];
}

function speciesTierDistributionForTrainer(row) {
  if (row.type === "champion") return [5, 6, 6];
  if (row.type === "elite4" || row.tier === "tier3") return [5, 5, 6];
  if (row.tier === "tier2") return [4, 5, 5];
  return [4, 4, 5];
}

function seededNumber(text) {
  let hash = 2166136261;
  for (const char of String(text)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function speciesGeneration(speciesId) {
  return Math.max(1, Math.min(9, Number(DATA_DEX.species.get(speciesId)?.gen || 1)));
}

function speciesAllowedForPreset(speciesId, preset) {
  return speciesGeneration(speciesId) <= (BATTLE_RULE_MAX_GENERATION[preset] || 9);
}

function megaCapableSpeciesSet() {
  const ids = new Set();
  for (const item of DATA_DEX.items.all()) {
    if (!item?.megaStone) continue;
    if (item.id === "crucibellite") continue;
    if (item.isNonstandard && item.isNonstandard !== "Past") continue;
    for (const baseName of Object.keys(item.megaStone || {})) {
      const species = DATA_DEX.species.get(baseName);
      if (species.exists && species.id) ids.add(species.id);
    }
  }
  return ids;
}

function gmaxCapableSpeciesSet() {
  const ids = new Set();
  for (const species of DATA_DEX.species.all()) {
    if (species.exists && species.id && species.canGigantamax) ids.add(species.id);
  }
  return ids;
}

function stablePick(pool, salt) {
  if (!pool.length) return "";
  return pool[seededNumber(salt) % pool.length];
}

function makeBossPools(trainers, reps, tierRows) {
  const tierBySpecies = new Map(tierRows.map(row => [row.species_id, Number(row.override_tier || row.tier)]));
  const speciesByTier = new Map();
  const tierRowBySpecies = new Map(tierRows.map(row => [row.species_id, row]));
  for (const row of tierRows) {
    const tier = Number(row.override_tier || row.tier);
    if (!speciesByTier.has(tier)) speciesByTier.set(tier, []);
    speciesByTier.get(tier).push(row.species_id);
  }
  for (const list of speciesByTier.values()) list.sort();
  const repsByTrainer = new Map();
  for (const rep of reps) {
    if (!repsByTrainer.has(rep.trainer_id)) repsByTrainer.set(rep.trainer_id, []);
    repsByTrainer.get(rep.trainer_id).push(rep.species_id);
  }
  const megaSpecies = megaCapableSpeciesSet();
  const gmaxSpecies = gmaxCapableSpeciesSet();
  const allowed = (id, preset, used = new Set()) => id && !used.has(id) && speciesAllowedForPreset(id, preset) && tierBySpecies.has(id);
  const themedCandidate = (tier, preset, used, preferredTypes, predicate = () => true) => {
    const pool = (speciesByTier.get(tier) || []).filter(id => {
      if (!allowed(id, preset, used) || !predicate(id)) return false;
      const types = DATA_DEX.species.get(id).types || [];
      return types.some(type => preferredTypes.has(type));
    });
    return pool[0] || "";
  };
  const fallbackCandidate = (tier, preset, used, salt, predicate = () => true) => {
    const exact = (speciesByTier.get(tier) || []).filter(id => allowed(id, preset, used) && predicate(id));
    if (exact.length) return stablePick(exact, salt);
    const loose = [...speciesByTier.entries()]
      .filter(([candidateTier]) => candidateTier !== LEGENDARY_TIER)
      .sort((a, b) => Math.abs(a[0] - tier) - Math.abs(b[0] - tier) || a[0] - b[0])
      .flatMap(([, ids]) => ids)
      .filter(id => allowed(id, preset, used) && predicate(id));
    return stablePick(loose, salt);
  };
  const representativeCandidate = (repIds, tier, preset, used) => {
    const exact = repIds.find(id => allowed(id, preset, used) && (tierBySpecies.get(id) || tier) === tier);
    if (exact) return {speciesId: exact, source: "representative-exact-tier"};
    const notLower = repIds.find(id => allowed(id, preset, used) && (tierBySpecies.get(id) || tier) >= tier);
    if (notLower) return {speciesId: notLower, source: "representative-near-tier"};
    return {speciesId: "", source: ""};
  };
  const chooseSpecies = ({trainer, preset, teamIndex, slotIndex, desiredTier, repIds, preferredTypes, used}) => {
    const representative = representativeCandidate(repIds, desiredTier, preset, used);
    if (representative.speciesId) return representative;
    const themed = themedCandidate(desiredTier, preset, used, preferredTypes);
    if (themed) return {speciesId: themed, source: "theme-fill"};
    const fallback = fallbackCandidate(desiredTier, preset, used, `${trainer.id}:${preset}:${teamIndex}:${slotIndex}`);
    return {speciesId: fallback, source: "tier-fill"};
  };
  const ensureSystemAnchor = ({team, preset, preferredTypes, trainer, teamIndex}) => {
    const needsMega = preset === "gen7" && !team.some(entry => megaSpecies.has(entry.species_id));
    const needsGmax = preset === "gen8" && !team.some(entry => gmaxSpecies.has(entry.species_id));
    if (!needsMega && !needsGmax) return team;
    const predicate = needsMega ? id => megaSpecies.has(id) : id => gmaxSpecies.has(id);
    const label = needsMega ? "mega-system-fill" : "gmax-system-fill";
    const replaceIndex = team.length - 1;
    const used = new Set(team.map(entry => entry.species_id));
    used.delete(team[replaceIndex]?.species_id);
    const desiredTier = team[replaceIndex]?.species_tier || 5;
    const themed = themedCandidate(desiredTier, preset, used, preferredTypes, predicate);
    const fallback = themed || fallbackCandidate(desiredTier, preset, used, `${trainer.id}:${preset}:${teamIndex}:system`, predicate);
    if (!fallback) return team;
    const next = [...team];
    const tier = tierBySpecies.get(fallback) || desiredTier;
    next[replaceIndex] = {
      ...next[replaceIndex],
      species_id: fallback,
      species: DATA_DEX.species.get(fallback).name || fallback,
      species_tier: tier,
      source: themed ? `${label}-theme` : label,
    };
    return next;
  };
  const rows = [];
  const bossRows = trainers.filter(row => ["gym", "elite4", "champion"].includes(row.type) && row.enabled !== "0");
  for (const trainer of bossRows) {
    const speciesDistribution = speciesTierDistributionForTrainer(trainer);
    const profileDistribution = profileDistributionForTrainer(trainer);
    const repIds = [...new Set(repsByTrainer.get(trainer.id) || [])];
    const preferredTypes = new Set(repIds.flatMap(id => DATA_DEX.species.get(id).types || []));
    const poolId = trainer.team_pool_ids || `${trainer.type}:${trainer.tier}:${trainer.name_zh}`;
    for (const preset of BATTLE_RULE_PRESETS) {
      for (let teamIndex = 1; teamIndex <= 4; teamIndex += 1) {
        const used = new Set();
        const team = speciesDistribution.map((desiredTier, slotIndex) => {
          const picked = chooseSpecies({trainer, preset, teamIndex, slotIndex, desiredTier, repIds, preferredTypes, used});
          const speciesId = picked.speciesId || "pikachu";
          used.add(speciesId);
          const tier = tierBySpecies.get(speciesId) || desiredTier;
          return {
            pool_id: poolId,
            battle_rule_preset: preset,
            trainer_id: trainer.id,
            trainer_name_zh: trainer.name_zh,
            team_index: teamIndex,
            slot: slotIndex + 1,
            species_id: speciesId,
            species: DATA_DEX.species.get(speciesId).name || speciesId,
            species_tier: tier,
            stage_tier: desiredTier,
            generation_profile: profileDistribution[slotIndex] || "tier1",
            source: picked.source || "tier-fill",
          };
        });
        for (const entry of ensureSystemAnchor({team, preset, preferredTypes, trainer, teamIndex})) rows.push({
          pool_id: poolId,
          battle_rule_preset: entry.battle_rule_preset,
          trainer_id: trainer.id,
          trainer_name_zh: trainer.name_zh,
          team_index: entry.team_index,
          slot: entry.slot,
          species_id: entry.species_id,
          species: entry.species,
          species_tier: entry.species_tier || tierRowBySpecies.get(entry.species_id)?.tier || "",
          stage_tier: entry.stage_tier,
          generation_profile: entry.generation_profile,
          source: entry.source,
        });
      }
    }
  }
  return rows;
}

const tierRows = speciesRows();
writeCsv(
  pokemonTiersPath,
  ["species_id", "species", "base_species", "types", "bst", "bulk_score", "random_battle_level", "eviolite_bulk_bonus", "random_set_item", "random_set_eviolite_bonus", "score", "tier", "override_tier", "source", "notes"],
  tierRows,
);

const trainers = readCsv(trainerCsvPath);
const reps = extractRepresentatives(trainers, reverseSpeciesNames());
writeCsv(
  bossRepresentativesPath,
  ["trainer_id", "trainer_name_zh", "trainer_type", "trainer_tier", "species_id", "species", "count", "source_names"],
  reps,
);

const pools = makeBossPools(trainers, reps, tierRows);
writeCsv(
  bossPoolsPath,
  ["pool_id", "battle_rule_preset", "trainer_id", "trainer_name_zh", "team_index", "slot", "species_id", "species", "species_tier", "stage_tier", "generation_profile", "source"],
  pools,
);

console.log(`Wrote ${tierRows.length} species tiers to ${path.relative(root, pokemonTiersPath)}`);
console.log(`Wrote ${reps.length} boss representative rows to ${path.relative(root, bossRepresentativesPath)}`);
console.log(`Wrote ${pools.length} boss team pool rows to ${path.relative(root, bossPoolsPath)}`);
