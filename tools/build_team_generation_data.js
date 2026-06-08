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

function speciesRows() {
  const spriteMap = JSON.parse(fs.readFileSync(spriteMapPath, "utf8"));
  const randomLevels = loadRandomLevels();
  const candidates = [];
  for (const species of DATA_DEX.species.all()) {
    if (!isPoolSpecies(species, spriteMap)) continue;
    const bst = baseStatTotal(species);
    const defensiveBulk = bulkScore(species);
    const nfePenalty = species.nfe ? -45 : 45;
    const legendaryBonus = species.legendary || species.mythical ? 90 : 0;
    const randomLevel = randomLevels[species.id] || "";
    const randomLevelScore = randomLevel ? Math.max(0, 100 - Number(randomLevel)) * 3 : 0;
    const nfeEvioliteBulkBonus = species.nfe ? Math.round(clamp((defensiveBulk - 220) / 2, 0, 80)) : 0;
    const randbatItem = randomSetItem(species);
    const randomSetEvioliteBonus = toId(randbatItem) === "eviolite" ? 40 : 0;
    const score = bst + nfePenalty + legendaryBonus + randomLevelScore + nfeEvioliteBulkBonus + randomSetEvioliteBonus;
    const notes = [
      species.nfe ? "nfe" : "",
      species.legendary ? "legendary" : "",
      species.mythical ? "mythical" : "",
      nfeEvioliteBulkBonus ? `eviolite-bulk+${nfeEvioliteBulkBonus}` : "",
      randomSetEvioliteBonus ? "eviolite-randset" : "",
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
  const sorted = [...candidates].sort((a, b) => a.score - b.score);
  const tierForIndex = index => Math.min(4, Math.max(1, Math.floor(index / Math.max(1, sorted.length / 4)) + 1));
  sorted.forEach((row, index) => {
    row.tier = tierForIndex(index);
  });
  const tierById = new Map(sorted.map(row => [row.species_id, row.tier]));
  return candidates
    .map(row => ({...row, tier: tierById.get(row.species_id) || row.tier}))
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

function stageDistributionForTrainer(row) {
  if (row.type === "champion") return [4, 4, 4];
  if (row.type === "elite4") return [3, 4, 4];
  if (row.tier === "tier1") return [1, 2, 2];
  if (row.tier === "tier2") return [2, 3, 3];
  return [3, 4, 4];
}

function seededNumber(text) {
  let hash = 2166136261;
  for (const char of String(text)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeBossPools(trainers, reps, tierRows) {
  const tierBySpecies = new Map(tierRows.map(row => [row.species_id, Number(row.override_tier || row.tier)]));
  const speciesByTier = new Map();
  for (const row of tierRows) {
    const tier = Number(row.override_tier || row.tier);
    if (!speciesByTier.has(tier)) speciesByTier.set(tier, []);
    speciesByTier.get(tier).push(row.species_id);
  }
  const repsByTrainer = new Map();
  for (const rep of reps) {
    if (!repsByTrainer.has(rep.trainer_id)) repsByTrainer.set(rep.trainer_id, []);
    repsByTrainer.get(rep.trainer_id).push(rep.species_id);
  }
  const rows = [];
  const bossRows = trainers.filter(row => ["gym", "elite4", "champion"].includes(row.type) && row.enabled !== "0");
  for (const trainer of bossRows) {
    const distribution = stageDistributionForTrainer(trainer);
    const repIds = [...new Set(repsByTrainer.get(trainer.id) || [])];
    const preferredTypes = new Set(repIds.flatMap(id => DATA_DEX.species.get(id).types || []));
    const poolId = trainer.team_pool_ids || `${trainer.type}:${trainer.tier}:${trainer.name_zh}`;
    for (let teamIndex = 1; teamIndex <= 4; teamIndex += 1) {
      const used = new Set();
      distribution.forEach((stageTier, slotIndex) => {
        const profile = trainer.type === "champion" ? "champion" : `tier${stageTier}`;
        const exactRep = repIds.find(id => !used.has(id) && (tierBySpecies.get(id) || stageTier) === stageTier);
        const anyRep = repIds.find(id => !used.has(id));
        const themed = (speciesByTier.get(stageTier) || []).find(id => {
          if (used.has(id)) return false;
          const types = DATA_DEX.species.get(id).types || [];
          return types.some(type => preferredTypes.has(type));
        });
        const fallbackPool = speciesByTier.get(stageTier) || [];
        const fallback = fallbackPool[seededNumber(`${trainer.id}:${teamIndex}:${slotIndex}`) % Math.max(1, fallbackPool.length)];
        const speciesId = exactRep || anyRep || themed || fallback;
        used.add(speciesId);
        rows.push({
          pool_id: poolId,
          trainer_id: trainer.id,
          trainer_name_zh: trainer.name_zh,
          team_index: teamIndex,
          slot: slotIndex + 1,
          species_id: speciesId,
          species: DATA_DEX.species.get(speciesId).name || speciesId,
          stage_tier: stageTier,
          generation_profile: profile,
          source: exactRep ? "representative-exact-tier" : anyRep ? "representative-any-tier" : themed ? "theme-fill" : "tier-fill",
        });
      });
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
  ["pool_id", "trainer_id", "trainer_name_zh", "team_index", "slot", "species_id", "species", "stage_tier", "generation_profile", "source"],
  pools,
);

console.log(`Wrote ${tierRows.length} species tiers to ${path.relative(root, pokemonTiersPath)}`);
console.log(`Wrote ${reps.length} boss representative rows to ${path.relative(root, bossRepresentativesPath)}`);
console.log(`Wrote ${pools.length} boss team pool rows to ${path.relative(root, bossPoolsPath)}`);
