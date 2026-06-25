import {createBattleSession, randomLegalChoice, submitChoice} from "./index.js";
import type {BattleServiceSessionInputV4} from "./types.js";

const pikachu = {
  species: "Pikachu",
  name: "Pikachu",
  ability: "Static",
  moves: ["Thunderbolt", "Quick Attack", "Iron Tail", "Protect"],
  nature: "Serious",
  evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0},
  ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
  level: 50,
};

const eevee = {
  ...pikachu,
  species: "Eevee",
  name: "Eevee",
  ability: "Run Away",
  moves: ["Tackle", "Quick Attack", "Protect", "Rest"],
};

async function smoke() {
  const input: BattleServiceSessionInputV4 = {
    runId: "test-run",
    nodeId: "test-node",
    mode: "singles",
    ruleSet: "gen9",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: [pikachu, eevee], draft: null as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [pikachu, eevee], draft: null as any},
    ],
  };
  const snapshot = await createBattleSession(input);
  if (!snapshot.requests.p1) throw new Error("missing p1 request");
  const choice = randomLegalChoice(snapshot.requests.p1);
  const next = await submitChoice({sessionId: snapshot.id, playerId: "p1", choice});
  if (!next.rawLog.length) throw new Error("missing raw log");
  console.log("showdown-battle-core smoke ok", next.turn);
}

async function doublesSmoke() {
  const team = [pikachu, eevee, {...pikachu, name: "Raichu", species: "Raichu"}, {...eevee, name: "Jolteon", species: "Jolteon"}];
  const input: BattleServiceSessionInputV4 = {
    runId: "test-run",
    nodeId: "test-node-doubles",
    mode: "doubles",
    ruleSet: "gen9",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team, draft: null as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team, draft: null as any},
    ],
  };
  const snapshot = await createBattleSession(input);
  if (!snapshot.rawLog.some(line => line === "|gametype|doubles")) throw new Error("missing doubles gametype");
  const previewChoice = randomLegalChoice(snapshot.requests.p1);
  const next = await submitChoice({sessionId: snapshot.id, playerId: "p1", choice: previewChoice});
  if ((next.requests.p1?.active || []).length !== 2) throw new Error("missing doubles active request");
  console.log("showdown-battle-core doubles smoke ok");
}

async function duplicateSpeciesDoublesSmoke() {
  const team = [pikachu, {...pikachu}, {...pikachu, name: "Raichu", species: "Raichu"}, {...eevee, name: "Jolteon", species: "Jolteon"}];
  const input: BattleServiceSessionInputV4 = {
    runId: "test-run",
    nodeId: "test-node-duplicate-doubles",
    mode: "doubles",
    ruleSet: "gen9",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team, draft: null as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team, draft: null as any},
    ],
  };
  const snapshot = await createBattleSession(input);
  const next = await submitChoice({sessionId: snapshot.id, playerId: "p1", choice: randomLegalChoice(snapshot.requests.p1)});
  const slots = next.active.map(active => active.slot).sort();
  for (const slot of ["p1a", "p1b", "p2a", "p2b"]) {
    if (!slots.includes(slot)) throw new Error(`missing duplicate doubles active slot ${slot}`);
  }
  console.log("showdown-battle-core duplicate doubles smoke ok");
}

void smoke().then(doublesSmoke).then(duplicateSpeciesDoublesSmoke);
