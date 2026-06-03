#!/usr/bin/env node
"use strict";

const readline = require("node:readline");
const path = require("node:path");

const DEFAULT_SHOWDOWN_PATH = "/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown";
const SHOWDOWN_PATH = process.env.SHOWDOWN_PATH || DEFAULT_SHOWDOWN_PATH;
const Sim = require(path.join(SHOWDOWN_PATH, "dist", "sim"));

const FIXED_LEVEL = 50;
const STAT_IDS = ["hp", "atk", "def", "spa", "spd", "spe"];

let stream = null;
let pendingMessages = [];
let latestRequests = {};
let ended = false;
let winner = null;

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
  const nature = Sim.Dex.natures.get(natureName || "Serious");
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

function moveDetails(moveId) {
  const move = Sim.Dex.moves.get(moveId);
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

function describeSet(set) {
  const moves = (set.moves || []).map(moveDetails);
  const species = Sim.Dex.species.get(set.species || set.name);
  const ability = Sim.Dex.abilities.get(set.ability);
  const item = set.item ? Sim.Dex.items.get(set.item) : null;
  const level = FIXED_LEVEL;
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
  };
}

function normalizeTeam(team) {
  return team.map(set => ({
    ...set,
    level: FIXED_LEVEL,
    nature: set.nature || "Serious",
    moves: [...(set.moves || [])],
  }));
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
  const team = normalizeTeam(Sim.Teams.generate(format, { seed }));
  return {
    seed,
    team,
    display: team.map(describeSet),
    packed: Sim.Teams.pack(team),
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

async function handleRequest() {
  return drain();
}

async function dispatch(command) {
  switch (command.cmd) {
  case "ping":
    return { pong: true, showdownPath: SHOWDOWN_PATH };
  case "generate":
    return handleGenerate(command);
  case "start":
    return handleStart(command);
  case "choose":
    return handleChoose(command);
  case "drain":
    return handleRequest();
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
