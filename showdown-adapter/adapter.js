#!/usr/bin/env node
"use strict";

const readline = require("node:readline");
const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const VENDORED_SHOWDOWN_PATH = path.join(PROJECT_ROOT, "vendor", "pokemon-showdown");
const DEFAULT_SHOWDOWN_PATH = VENDORED_SHOWDOWN_PATH;
const SHOWDOWN_PATH = process.env.SHOWDOWN_PATH || DEFAULT_SHOWDOWN_PATH;
const Sim = require(path.join(SHOWDOWN_PATH, "dist", "sim"));
const DATA_DEX = Sim.Dex.mod("gen9");

const MIN_RENTAL_LEVEL = 45;
const MAX_RENTAL_LEVEL = 55;
const SHINY_RATE = 30;
const STAT_IDS = ["hp", "atk", "def", "spa", "spd", "spe"];
const FALLBACK_HELD_ITEMS = ["Leftovers", "Sitrus Berry", "Life Orb", "Choice Scarf", "Choice Band", "Choice Specs", "Assault Vest", "Focus Sash", "Expert Belt"];

let stream = null;
let pendingMessages = [];
let latestRequests = {};
let ended = false;
let winner = null;
let sideTeams = { p1: [], p2: [] };
let sideSlotKeys = { p1: [], p2: [] };
let spriteMap = null;
let tierRows = null;

function toId(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function loadSpriteMap() {
  if (spriteMap) return spriteMap;
  const mapPath = path.join(PROJECT_ROOT, "data", "sprite_index_map.json");
  try {
    spriteMap = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  } catch {
    spriteMap = { entries: {} };
  }
  return spriteMap;
}

function shortIdent(raw) {
  let value = String(raw || "").split("|")[0].trim();
  if (value.includes(":")) value = value.split(":", 2)[1].trim();
  return value;
}

function seedArray(seed) {
  if (Array.isArray(seed) && seed.length === 4) return seed.map(n => Number(n) & 0xffff);
  let value = Number.isFinite(Number(seed)) ? Number(seed) >>> 0 : 1;
  const out = [];
  for (let i = 0; i < 4; i++) {
    value = (value * 1664525 + 1013904223) >>> 0;
    out.push(value & 0xffff);
  }
  return out;
}

function natureModifiers(natureName) {
  const nature = DATA_DEX.natures.get(natureName || "Serious");
  return {
    name: nature.name || "Serious",
    plus: nature.plus || "",
    minus: nature.minus || "",
  };
}

function fullIvs(ivs) {
  const result = {};
  for (const stat of STAT_IDS) result[stat] = ivs && ivs[stat] !== undefined ? Number(ivs[stat]) : 31;
  return result;
}

function fullEvs(evs) {
  const result = {};
  for (const stat of STAT_IDS) result[stat] = evs && evs[stat] !== undefined ? Number(evs[stat]) : 0;
  return result;
}

function rngFromSeed(seed, salt = 0) {
  let state = seed.reduce((acc, value, index) => (acc ^ ((Number(value) & 0xffff) << ((index % 2) * 16))) >>> 0, (0x9e3779b9 ^ salt) >>> 0);
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function randomIvs(rng) {
  return Object.fromEntries(STAT_IDS.map(stat => [stat, randomInt(rng, 0, 31)]));
}

function randomEvs(rng) {
  const evs = Object.fromEntries(STAT_IDS.map(stat => [stat, 0]));
  let remaining = 510;
  const order = [...STAT_IDS].sort(() => rng() - 0.5);
  for (const stat of order) {
    const value = randomInt(rng, 0, Math.min(255, remaining));
    evs[stat] = value;
    remaining -= value;
  }
  return evs;
}

function randomStatsWithTotal(rng, total, maxPerStat) {
  const cappedTotal = Math.max(0, Math.min(Number(total) || 0, maxPerStat * STAT_IDS.length));
  const values = Object.fromEntries(STAT_IDS.map(stat => [stat, 0]));
  let remaining = cappedTotal;
  const order = [...STAT_IDS].sort(() => rng() - 0.5);
  for (let index = 0; index < order.length; index++) {
    const stat = order[index];
    const slotsLeft = order.length - index - 1;
    const min = Math.max(0, remaining - maxPerStat * slotsLeft);
    const max = Math.min(maxPerStat, remaining);
    const value = index === order.length - 1 ? remaining : randomInt(rng, min, max);
    values[stat] = value;
    remaining -= value;
  }
  return values;
}

function statValue(base, iv, ev, level, stat, nature) {
  const baseValue = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100);
  if (stat === "hp") return baseValue + level + 10;
  let value = baseValue + 5;
  if (nature.plus === stat) value = Math.floor(value * 1.1);
  if (nature.minus === stat) value = Math.floor(value * 0.9);
  return value;
}

function calculatedStats(species, ivs, evs, level, nature) {
  const stats = {};
  for (const stat of STAT_IDS) {
    stats[stat] = statValue(species.baseStats[stat] || 0, ivs[stat], evs[stat], level, stat, nature);
  }
  return stats;
}

function includeDataEntry(entry) {
  return !entry.isNonstandard || entry.isNonstandard === "Past";
}

function moveDetails(moveId, dex = DATA_DEX) {
  const move = dex.moves.get(moveId);
  return {
    id: move.id || moveId,
    name: move.name || moveId,
    type: move.type || "",
    category: move.category || "",
    power: move.basePower || 0,
    accuracy: move.accuracy === true ? null : move.accuracy,
    pp: move.pp || 0,
    priority: move.priority || 0,
    target: move.target || "",
    short_desc: move.shortDesc || "",
    desc: move.desc || move.shortDesc || "",
  };
}

function itemDetails(itemId, dex = DATA_DEX) {
  const item = dex.items.get(itemId);
  return {
    id: item.id || itemId,
    name: item.name || itemId,
    desc: item.desc || item.shortDesc || "",
    short_desc: item.shortDesc || "",
    gen: item.gen || 0,
    isNonstandard: item.isNonstandard || null,
  };
}

function describeSet(set) {
  const moves = (set.moves || []).map(move => moveDetails(move));
  const species = DATA_DEX.species.get(set.species || set.name);
  const ability = DATA_DEX.abilities.get(set.ability);
  const item = set.item ? DATA_DEX.items.get(set.item) : null;
  const level = Math.max(1, Number(set.level || 50));
  const ivs = fullIvs(set.ivs || {});
  const evs = fullEvs(set.evs || {});
  const nature = natureModifiers(set.nature || "Serious");
  return {
    name: set.name || set.species,
    species: set.species,
    species_id: species.id,
    level,
    gender: set.gender || "",
    types: species.types || [],
    base_stats: species.baseStats || {},
    stats: calculatedStats(species, ivs, evs, level, nature),
    ability: ability.exists ? ability.name : (set.ability || ""),
    ability_id: ability.exists ? ability.id : "",
    ability_desc: ability.exists ? (ability.desc || ability.shortDesc || "") : "",
    ability_short_desc: ability.exists ? (ability.shortDesc || "") : "",
    item: item && item.exists ? item.name : (set.item || ""),
    item_id: item && item.exists ? item.id : "",
    item_desc: item && item.exists ? (item.desc || item.shortDesc || "") : "",
    item_short_desc: item && item.exists ? (item.shortDesc || "") : "",
    moves,
    evs,
    ivs,
    nature: nature.name,
    nature_plus: nature.plus,
    nature_minus: nature.minus,
    role: set.role || "",
    shiny: Boolean(set.shiny),
    stage_tier: set.stage_tier,
    generation_profile: set.generation_profile,
    sprite: loadSpriteMap().entries[species.id],
  };
}

function normalizeTeam(team) {
  return team.map(set => ({
    ...set,
    level: Number(set.level || 50),
    nature: set.nature || "Serious",
    moves: [...(set.moves || [])],
  }));
}

function randomMovesForSet(set, rng) {
  const pool = legalLearnsetMoveIds(set)
    .map(moveId => DATA_DEX.moves.get(moveId))
    .filter(move => move.exists && move.id)
    .map(move => move.name || move.id);
  const shuffled = [...pool].sort(() => rng() - 0.5);
  const selected = shuffled.slice(0, 4);
  return selected.length >= 4 ? selected : [...(set.moves || [])].slice(0, 4);
}

function randomizeRentalSet(set, rng) {
  const natures = DATA_DEX.natures.all();
  const nature = natures[randomInt(rng, 0, Math.max(0, natures.length - 1))]?.name || set.nature || "Serious";
  return {
    ...set,
    level: randomInt(rng, MIN_RENTAL_LEVEL, MAX_RENTAL_LEVEL),
    item: "",
    ivs: randomIvs(rng),
    evs: randomEvs(rng),
    nature,
    moves: randomMovesForSet(set, rng),
    shiny: randomInt(rng, 1, SHINY_RATE) === 1,
  };
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        cell += "\"";
        index++;
      } else {
        quoted = !quoted;
      }
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

function loadTierRows() {
  if (tierRows) return tierRows;
  const filePath = path.join(PROJECT_ROOT, "data", "pokemon_tiers.csv");
  if (!fs.existsSync(filePath)) {
    tierRows = [];
    return tierRows;
  }
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0] || "");
  tierRows = lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(header.map((key, index) => [key, values[index] || ""]));
    return {
      species_id: row.species_id,
      species: row.species,
      tier: Number(row.override_tier || row.tier || 1),
    };
  }).filter(row => row.species_id && row.tier >= 1 && row.tier <= 4);
  return tierRows;
}

function requestedProfiles(command, targetCount) {
  if (Array.isArray(command.profiles) && command.profiles.length) return command.profiles.slice(0, targetCount);
  if (Array.isArray(command.stages) && command.stages.length) return command.stages.slice(0, targetCount).map(stage => `tier${stage}`);
  return Array.from({ length: targetCount }, () => "tier1");
}

function pickSpeciesForProfile(profile, rng, seenSpecies) {
  const tier = profile === "champion" ? 4 : Number(String(profile).replace("tier", "")) || 1;
  const rows = loadTierRows();
  const pool = rows.filter(row => row.tier === tier && !seenSpecies.has(row.species_id));
  const fallback = rows.filter(row => row.tier === tier);
  const selectedPool = pool.length ? pool : fallback;
  return selectedPool[randomInt(rng, 0, Math.max(0, selectedPool.length - 1))]?.species_id || "pikachu";
}

function randomGenerator(format, seed) {
  try {
    return Sim.Teams.getGenerator(format || "gen7randombattle", seed);
  } catch {
    return null;
  }
}

function baseSetForSpecies(speciesId, generator, rng) {
  const species = DATA_DEX.species.get(speciesId);
  if (generator && generator.randomSet && species.exists) {
    try {
      return normalizeTeam([generator.randomSet(species)])[0];
    } catch {
      // Fall through.
    }
  }
  const abilities = Object.values(species.abilities || {}).filter(Boolean);
  const ability = abilities[randomInt(rng, 0, Math.max(0, abilities.length - 1))] || "";
  return {
    name: species.name || speciesId,
    species: species.name || speciesId,
    ability,
    item: "",
    moves: randomMovesForSet({ species: species.name || speciesId, moves: [] }, rng),
    nature: "Serious",
    evs: Object.fromEntries(STAT_IDS.map(stat => [stat, 0])),
    ivs: Object.fromEntries(STAT_IDS.map(stat => [stat, 31])),
    level: 50,
  };
}

function applyGenerationProfile(baseSet, profile, rng) {
  const normalizedProfile = profile === "champion" ? "champion" : String(profile || "tier1");
  const stageTier = normalizedProfile === "champion" ? 4 : Number(normalizedProfile.replace("tier", "")) || 1;
  const natures = DATA_DEX.natures.all();
  const randomNature = () => natures[randomInt(rng, 0, Math.max(0, natures.length - 1))]?.name || "Serious";
  const heldItem = baseSet.item || FALLBACK_HELD_ITEMS[randomInt(rng, 0, FALLBACK_HELD_ITEMS.length - 1)];
  const set = { ...baseSet, moves: [...(baseSet.moves || [])], shiny: randomInt(rng, 1, SHINY_RATE) === 1 };
  if (normalizedProfile === "tier1") {
    return { ...set, level: randomInt(rng, 45, 50), item: "", ivs: randomStatsWithTotal(rng, randomInt(rng, 0, 90), 31), evs: randomStatsWithTotal(rng, randomInt(rng, 0, 200), 255), nature: "Serious", stage_tier: stageTier, generation_profile: normalizedProfile };
  }
  if (normalizedProfile === "tier2") {
    return { ...set, level: randomInt(rng, 45, 50), item: heldItem, ivs: randomStatsWithTotal(rng, randomInt(rng, 60, 120), 31), evs: randomStatsWithTotal(rng, randomInt(rng, 180, 300), 255), nature: randomNature(), stage_tier: stageTier, generation_profile: normalizedProfile };
  }
  if (normalizedProfile === "tier3") {
    return { ...set, level: randomInt(rng, 50, 54), item: heldItem, ivs: randomStatsWithTotal(rng, randomInt(rng, 90, 150), 31), evs: randomStatsWithTotal(rng, randomInt(rng, 270, 450), 255), nature: baseSet.nature || randomNature(), stage_tier: stageTier, generation_profile: normalizedProfile };
  }
  const level = normalizedProfile === "champion" ? randomInt(rng, 58, 60) : 55;
  return { ...set, level, item: heldItem, ivs: Object.fromEntries(STAT_IDS.map(stat => [stat, 31])), evs: randomStatsWithTotal(rng, 510, 255), nature: baseSet.nature || randomNature(), stage_tier: 4, generation_profile: normalizedProfile };
}

function generateProfiledCandidates(command, seed, format, targetCount) {
  const profiles = requestedProfiles(command, targetCount);
  const speciesIds = (command.speciesIds || command.species_ids || []).map(toId);
  const seenSpecies = new Set();
  const team = [];
  const rng = rngFromSeed(seed, 4100 + targetCount);
  const generator = randomGenerator(format, seed);
  for (let index = 0; index < targetCount; index++) {
    const profile = profiles[index] || profiles[profiles.length - 1] || "tier1";
    const speciesId = speciesIds[index] || pickSpeciesForProfile(profile, rng, seenSpecies);
    const set = applyGenerationProfile(baseSetForSpecies(speciesId, generator, rng), profile, rng);
    const speciesKey = toId(set.species || set.name);
    if (seenSpecies.has(speciesKey) && !speciesIds[index]) continue;
    seenSpecies.add(speciesKey);
    team.push(set);
  }
  if (team.length < targetCount) throw new Error(`profiled rental candidates not enough: ${team.length}/${targetCount}`);
  return { seed, team, display: team.map(describeSet), packed: Sim.Teams.pack(team) };
}

function legalAbilities(set) {
  const species = DATA_DEX.species.get(set.species || set.name);
  const seen = new Set();
  const result = [];
  for (const abilityName of Object.values(species.abilities || {})) {
    const ability = DATA_DEX.abilities.get(abilityName);
    const name = ability.exists ? ability.name : abilityName;
    const id = ability.exists ? ability.id : toId(name);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push({
      id,
      name,
      desc: ability.exists ? (ability.desc || ability.shortDesc || "") : "",
      short_desc: ability.exists ? (ability.shortDesc || "") : "",
    });
  }
  return result;
}

function natureOptions() {
  return DATA_DEX.natures.all().map(nature => ({
    id: nature.id,
    name: nature.name,
    plus: nature.plus || "",
    minus: nature.minus || "",
  }));
}

function legalLearnsetMoveIds(set) {
  const species = DATA_DEX.species.get(set.species || set.name);
  if (!species.exists) return [];
  const fullLearnset = DATA_DEX.species.getFullLearnset(species.id);
  const seen = new Set();
  for (const entry of fullLearnset || []) {
    for (const moveId of Object.keys(entry.learnset || {})) {
      const move = DATA_DEX.moves.get(moveId);
      if (!move.exists || !move.id || seen.has(move.id)) continue;
      if (move.isNonstandard && move.isNonstandard !== "Past") continue;
      seen.add(move.id);
    }
  }
  return [...seen];
}

function learnableMoves(set) {
  return legalLearnsetMoveIds(set)
    .map(moveId => moveDetails(moveId, DATA_DEX))
    .sort((a, b) => {
      if ((b.power || 0) !== (a.power || 0)) return (b.power || 0) - (a.power || 0);
      return a.name.localeCompare(b.name);
    });
}

function itemOptions() {
  return DATA_DEX.items.all()
    .filter(item => item.exists && item.id && includeDataEntry(item))
    .map(item => itemDetails(item.id, DATA_DEX))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function defaultMoveCost(move) {
  const power = Number(move.basePower || move.power || 0);
  if (power >= 120) return 500;
  if (power > 90) return 400;
  if (power > 60) return 300;
  if (power > 30) return 200;
  return 100;
}

function goodsDefaults() {
  const rows = [];
  for (const move of DATA_DEX.moves.all()) {
    if (!move.exists || !move.id) continue;
    if (!includeDataEntry(move)) continue;
    rows.push({
      item_id: move.id,
      item_type: "skill",
      item_name: move.name,
      item_cost: defaultMoveCost(move),
      power: move.basePower || 0,
    });
  }
  for (const item of itemOptions()) {
    rows.push({
      item_id: item.id,
      item_type: "item",
      item_name: item.name,
      item_cost: 500,
    });
  }
  for (const service of [
    ["exchange_1", "service", "交换宝可梦第1只", 0],
    ["exchange_2", "service", "交换宝可梦第2只", 100],
    ["exchange_3", "service", "交换宝可梦第3只", 200],
    ["restore_hp_1", "service", "恢复HP 1只", 100],
    ["restore_hp_2", "service", "恢复HP 2只", 200],
    ["restore_hp_3", "service", "恢复HP 3只", 300],
    ["restore_pp_1", "service", "恢复PP 1只", 0],
    ["restore_pp_2", "service", "恢复PP 2只", 100],
    ["restore_pp_3", "service", "恢复PP 3只", 200],
    ["restore_status_1", "service", "恢复异常 1只", 0],
    ["restore_status_2", "service", "恢复异常 2只", 0],
    ["restore_status_3", "service", "恢复异常 3只", 100],
    ["adjust_stats", "service", "调整能力值", 1000],
  ]) {
    rows.push({
      item_id: service[0],
      item_type: service[1],
      item_name: service[2],
      item_cost: service[3],
    });
  }
  return { rows };
}

function parseChunk(chunk) {
  const lines = chunk.split("\n");
  const type = lines.shift();
  const data = lines.join("\n");
  pendingMessages.push({ type, data });

  if (type === "sideupdate") {
    const side = lines[0];
    for (const line of lines.slice(1)) {
      if (line.startsWith("|request|")) {
        latestRequests[side] = JSON.parse(line.slice("|request|".length));
      }
    }
  } else if (type === "update") {
    for (const line of lines) {
      if (line.startsWith("|win|")) {
        ended = true;
        winner = line.slice("|win|".length);
      } else if (line === "|tie") {
        ended = true;
        winner = "tie";
      }
    }
  } else if (type === "end") {
    ended = true;
  }
}

async function waitForMessages() {
  await new Promise(resolve => setTimeout(resolve, 20));
}

function drain() {
  const messages = pendingMessages;
  pendingMessages = [];
  return {
    messages,
    requests: latestRequests,
    ended,
    winner,
  };
}

function sideIndex(side) {
  if (side === "p2" || side === 2) return 1;
  return 0;
}

function pokemonCondition(pokemon) {
  if (!pokemon) return "?";
  if (!pokemon.hp || pokemon.fainted) return "0 fnt";
  const suffix = pokemon.status ? ` ${pokemon.status}` : "";
  return `${pokemon.hp}/${pokemon.maxhp}${suffix}`;
}

function pokemonStateFromBattle(pokemon, battleSide, index) {
  return {
    slot: index + 1,
    ident: pokemon.fullname,
    details: pokemon.details,
    species: pokemon.species?.name || pokemon.set?.species || pokemon.name,
    condition: pokemonCondition(pokemon),
    hp: pokemon.hp || 0,
    maxhp: pokemon.maxhp || 0,
    status: pokemon.status || "",
    fainted: Boolean(pokemon.fainted || !pokemon.hp),
    active: battleSide.active.includes(pokemon),
    item: pokemon.item || "",
    moves: pokemon.moveSlots.map((moveSlot, moveIndex) => ({
      slot: moveIndex + 1,
      id: moveSlot.id,
      move: moveSlot.move,
      pp: moveSlot.pp,
      maxpp: moveSlot.maxpp,
    })),
  };
}

function addSlotKey(keys, prefix, value) {
  const normalized = toId(String(value || ""));
  if (normalized) keys.add(`${prefix}:${normalized}`);
}

function addSpeciesLikeKeys(keys, value) {
  const raw = String(value || "").trim();
  if (!raw) return;
  addSlotKey(keys, "species", raw);
  addSlotKey(keys, "details_species", raw.split(",", 1)[0]);
}

function addMoveSignatureKey(keys, species, moves) {
  const speciesId = toId(String(species || ""));
  if (!speciesId || !Array.isArray(moves)) return;
  const moveIds = moves
    .map(move => toId(move?.id || move?.move || move?.name || move))
    .filter(Boolean)
    .sort();
  if (moveIds.length) keys.add(`species_moves:${speciesId}:${moveIds.join(",")}`);
}

function keysForState(state = {}) {
  const keys = new Set();
  const short = shortIdent(state.ident || "");
  addSlotKey(keys, "ident", short);
  addSpeciesLikeKeys(keys, state.details);
  addSpeciesLikeKeys(keys, state.species);
  addSlotKey(keys, "item", state.item);
  addMoveSignatureKey(keys, state.species || state.details || short, state.moves || []);
  return keys;
}

function keysForSet(set = {}) {
  const keys = new Set();
  addSlotKey(keys, "ident", set.name || set.species);
  addSpeciesLikeKeys(keys, set.species || set.name);
  addSlotKey(keys, "ability", set.ability);
  addSlotKey(keys, "item", set.item);
  addMoveSignatureKey(keys, set.species || set.name, set.moves || []);
  return keys;
}

function buildSideSlotKeys(team = [], states = [], side = "p1") {
  const maxLength = Math.max(team.length, states.length);
  return Array.from({ length: maxLength }, (_, index) => {
    const slot = index + 1;
    const keys = new Set();
    for (const key of keysForSet(team[index] || {})) keys.add(key);
    for (const key of keysForState(states[index] || {})) keys.add(key);
    const fallbackName = team[index]?.species || team[index]?.name || states[index]?.species || states[index]?.details || slot;
    addSlotKey(keys, "ident", `${side}: ${fallbackName}`);
    keys.add(`slot:${slot}`);
    return { slot, keys };
  });
}

function resolveStateSlot(state, slotKeys, usedSlots) {
  if (!slotKeys.length) return Number(state.slot) || 1;
  for (const key of keysForState(state)) {
    const match = slotKeys.find(spec => !usedSlots.has(spec.slot) && spec.keys.has(key));
    if (match) return match.slot;
  }
  const fallbackSlot = Number(state.slot);
  if (fallbackSlot && slotKeys.some(spec => spec.slot === fallbackSlot) && !usedSlots.has(fallbackSlot)) return fallbackSlot;
  return slotKeys.find(spec => !usedSlots.has(spec.slot))?.slot || fallbackSlot || 1;
}

function alignStatesToSlots(states, slotKeys) {
  if (!slotKeys.length) return states;
  const usedSlots = new Set();
  return states
    .map(state => {
      const slot = resolveStateSlot(state, slotKeys, usedSlots);
      usedSlots.add(slot);
      return { ...state, slot };
    })
    .sort((a, b) => a.slot - b.slot);
}

function currentSideState(side = "p1") {
  if (!stream || !stream.battle) throw new Error("battle has not started");
  const battleSide = stream.battle.sides[sideIndex(side)];
  const states = battleSide.pokemon.map((pokemon, index) => pokemonStateFromBattle(pokemon, battleSide, index));
  return alignStatesToSlots(states, sideSlotKeys[side] || []);
}

function refreshRequests() {
  if (!stream || !stream.battle || !stream.battle.requestState) return;
  const requests = stream.battle.getRequests(stream.battle.requestState);
  for (let index = 0; index < stream.battle.sides.length; index++) {
    const side = stream.battle.sides[index];
    side.activeRequest = requests[index];
    side.emitRequest(requests[index], true);
  }
}

function syncSideState(side = "p1", states = []) {
  if (!stream || !stream.battle) throw new Error("battle has not started");
  const battleSide = stream.battle.sides[sideIndex(side)];
  const stateBySlot = new Map(states.map(state => [Number(state.slot), state]));
  sideSlotKeys[side] = buildSideSlotKeys(sideTeams[side] || [], states, side);
  const usedSlots = new Set();
  for (let index = 0; index < battleSide.pokemon.length; index++) {
    const pokemon = battleSide.pokemon[index];
    const current = pokemonStateFromBattle(pokemon, battleSide, index);
    const slot = resolveStateSlot(current, sideSlotKeys[side] || [], usedSlots);
    const state = stateBySlot.get(slot);
    usedSlots.add(slot);
    if (!state) continue;

    const hp = Math.max(0, Math.min(Number(state.hp ?? pokemon.maxhp) || 0, pokemon.maxhp));
    pokemon.hp = hp;
    pokemon.fainted = hp <= 0;
    pokemon.faintQueued = false;
    pokemon.subFainted = null;

    const status = toId(state.status || "");
    pokemon.status = "";
    pokemon.statusState = {};
    if (status && hp > 0) pokemon.setStatus(status, pokemon, null, true);

    const ppById = new Map();
    const ppBySlot = new Map();
    for (const move of state.moves || []) {
      ppById.set(toId(move.id || move.move), Number(move.pp));
      ppBySlot.set(Number(move.slot), Number(move.pp));
    }
    for (let moveIndex = 0; moveIndex < pokemon.moveSlots.length; moveIndex++) {
      const moveSlot = pokemon.moveSlots[moveIndex];
      const nextPp = ppById.has(moveSlot.id) ? ppById.get(moveSlot.id) : ppBySlot.get(moveIndex + 1);
      if (Number.isFinite(nextPp)) {
        moveSlot.pp = Math.max(0, Math.min(Number(nextPp), moveSlot.maxpp));
      }
    }
  }
  battleSide.pokemonLeft = battleSide.pokemon.filter(pokemon => !pokemon.fainted && pokemon.hp > 0).length;
  pendingMessages = [];
  refreshRequests();
}

function startReader() {
  (async () => {
    for await (const chunk of stream) {
      parseChunk(chunk);
    }
  })().catch(error => {
    pendingMessages.push({ type: "error", data: error.stack || String(error) });
  });
}

async function handleGenerate(command) {
  const format = command.format || "gen7randombattle";
  const seed = seedArray(command.seed);
  const targetCount = Math.max(1, Math.min(24, Number(command.count || 6)));
  if ((Array.isArray(command.profiles) && command.profiles.length) || (Array.isArray(command.stages) && command.stages.length) || (Array.isArray(command.speciesIds) && command.speciesIds.length) || (Array.isArray(command.species_ids) && command.species_ids.length)) {
    return generateProfiledCandidates(command, seed, format, targetCount);
  }
  const seenSpecies = new Set();
  const team = [];
  for (let attempt = 0; attempt < 40 && team.length < targetCount; attempt++) {
    const attemptSeed = seedArray(seed.reduce((acc, value) => ((acc * 1664525 + Number(value)) >>> 0), attempt + 1));
    const rng = rngFromSeed(attemptSeed, attempt + 1);
    for (const baseSet of normalizeTeam(Sim.Teams.generate(format, { seed: attemptSeed }))) {
      if (team.length >= targetCount) break;
      const set = randomizeRentalSet(baseSet, rng);
      const speciesId = toId(set.species || set.name);
      if (seenSpecies.has(speciesId)) continue;
      seenSpecies.add(speciesId);
      team.push(set);
    }
  }
  if (team.length < targetCount) throw new Error(`rental candidates not enough: ${team.length}/${targetCount}`);
  return {
    seed,
    team,
    display: team.map(describeSet),
    packed: Sim.Teams.pack(team),
  };
}

async function handleDescribe(command) {
  const set = normalizeTeam([command.set || {}])[0];
  return {
    set,
    display: describeSet(set),
  };
}

async function handleOptions(command) {
  const set = command.set || {};
  return {
    abilities: legalAbilities(set),
    natures: natureOptions(),
  };
}

async function handleLearnableMoves(command) {
  return {
    moves: learnableMoves(command.set || {}),
  };
}

async function handleItemOptions() {
  return {
    items: itemOptions(),
  };
}

async function handleStart(command) {
  latestRequests = {};
  pendingMessages = [];
  ended = false;
  winner = null;
  stream = new Sim.BattleStream({ keepAlive: true });
  startReader();

  const p1Team = command.p1Team || [];
  const p2Team = command.p2Team || [];
  sideTeams = { p1: p1Team, p2: p2Team };
  sideSlotKeys = {
    p1: buildSideSlotKeys(p1Team, [], "p1"),
    p2: buildSideSlotKeys(p2Team, [], "p2"),
  };
  const init = [
    `>start ${JSON.stringify({ formatid: command.formatid || "gen7customgame", seed: seedArray(command.seed) })}`,
    `>player p1 ${JSON.stringify({ name: command.p1Name || "Player", team: Sim.Teams.pack(p1Team) })}`,
    `>player p2 ${JSON.stringify({ name: command.p2Name || "Enemy", team: Sim.Teams.pack(p2Team) })}`,
  ].join("\n");
  await stream.write(init);
  await waitForMessages();
  return drain();
}

async function handleChoose(command) {
  if (!stream) throw new Error("battle has not started");
  const side = command.side || "p1";
  const choice = command.choice || "";
  await stream.write(`>${side} ${choice}`);
  await waitForMessages();
  return drain();
}

async function handleForfeit(command) {
  if (!stream) throw new Error("battle has not started");
  const side = command.side || "p1";
  await stream.write(`>forcelose ${side}`);
  await waitForMessages();
  return drain();
}

async function handleRequest() {
  return drain();
}

async function handleState(command) {
  return {
    p1: currentSideState("p1"),
    p2: currentSideState("p2"),
  };
}

async function handleSyncState(command) {
  syncSideState(command.side || "p1", command.states || []);
  await waitForMessages();
  return {
    messages: pendingMessages.splice(0),
    requests: latestRequests,
    ended,
    winner,
    state: currentSideState(command.side || "p1"),
  };
}

async function dispatch(command) {
  switch (command.cmd) {
  case "ping":
    return { pong: true, showdownPath: SHOWDOWN_PATH };
  case "generate":
    return handleGenerate(command);
  case "describe":
    return handleDescribe(command);
  case "options":
    return handleOptions(command);
  case "learnableMoves":
    return handleLearnableMoves(command);
  case "itemOptions":
    return handleItemOptions(command);
  case "goodsDefaults":
    return goodsDefaults();
  case "start":
    return handleStart(command);
  case "choose":
    return handleChoose(command);
  case "forfeit":
    return handleForfeit(command);
  case "drain":
    return handleRequest();
  case "state":
    return handleState(command);
  case "syncState":
    return handleSyncState(command);
  default:
    throw new Error(`unknown command: ${command.cmd}`);
  }
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on("line", async line => {
  if (!line.trim()) return;
  try {
    const result = await dispatch(JSON.parse(line));
    process.stdout.write(JSON.stringify({ ok: true, result }) + "\n");
  } catch (error) {
    process.stdout.write(JSON.stringify({ ok: false, error: error.stack || String(error) }) + "\n");
  }
});
