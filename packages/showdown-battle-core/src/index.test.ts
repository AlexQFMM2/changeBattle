import {createBattleSession, randomLegalChoice, submitChoice} from "./index.js";
import type {BattleServiceRequestV4, BattleServiceSessionInputV4} from "./types.js";

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

const bulbasaur = {
  ...pikachu,
  species: "Bulbasaur",
  name: "Bulbasaur",
  ability: "Overgrow",
  moves: ["Tackle", "Growl", "Protect", "Rest"],
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
  const afterTurn = await submitChoice({sessionId: snapshot.id, playerId: "p1", choice: randomLegalChoice(next.requests.p1)});
  if (afterTurn.status === "running" && afterTurn.requests.p1?.wait) {
    throw new Error("doubles submit returned wait request instead of next actionable request");
  }
  if (afterTurn.status === "running" && !afterTurn.requests.p1) {
    throw new Error("doubles submit returned no p1 request");
  }
  console.log("showdown-battle-core doubles smoke ok");
}

function rechargeChoiceSmoke() {
  const request: BattleServiceRequestV4 = {
    targetable: true,
    active: [
      {moves: [{move: "Recharge", id: "recharge"}]},
      {moves: [{move: "Aqua Tail", id: "aquatail", pp: 16, maxpp: 16, target: "normal"}]},
    ],
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {ident: "p2: Gengar", details: "Gengar, L50", condition: "83/135", active: true},
        {ident: "p2: Gyarados", details: "Gyarados, L50", condition: "170/170", active: true},
      ],
    },
  };
  const choice = randomLegalChoice(request);
  const [rechargeChoice] = choice.split(",").map(part => part.trim());
  if (rechargeChoice !== "move 1") throw new Error(`recharge should not receive a target: ${choice}`);
  console.log("showdown-battle-core recharge choice smoke ok");
}

function faintedDoublesActiveChoiceSmoke() {
  const request: BattleServiceRequestV4 = {
    targetable: true,
    active: [
      {moves: [{move: "Shadow Punch", id: "shadowpunch", pp: 20, maxpp: 20, target: "normal"}]},
      {moves: [{move: "Aqua Tail", id: "aquatail", pp: 16, maxpp: 16, target: "normal"}]},
    ],
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {ident: "p2: Gengar", details: "Gengar, L50", condition: "0 fnt", active: true, fainted: true},
        {ident: "p2: Gyarados", details: "Gyarados, L50", condition: "65/170", active: true},
      ],
    },
  };
  const choice = randomLegalChoice(request);
  if (choice !== "pass, move 1 +2") {
    throw new Error(`fainted doubles active should pass and target from live slot: ${choice}`);
  }
  console.log("showdown-battle-core fainted doubles active choice smoke ok");
}

function duplicateForceSwitchChoiceSmoke() {
  const request: BattleServiceRequestV4 = {
    forceSwitch: [true, true],
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {ident: "p2: Gengar", details: "Gengar, L50", condition: "0 fnt", active: true, fainted: true},
        {ident: "p2: Gyarados", details: "Gyarados, L50", condition: "0 fnt", active: true, fainted: true},
        {ident: "p2: Snorlax", details: "Snorlax, L50", condition: "235/235", active: false},
        {ident: "p2: Raticate", details: "Raticate, L50", condition: "120/120", active: false},
      ],
    },
  };
  const choice = randomLegalChoice(request);
  const choices = choice.split(",").map(part => part.trim());
  if (choices.length !== 2 || !choices.includes("switch 3") || !choices.includes("switch 4")) {
    throw new Error(`force switch should choose different bench slots: ${choice}`);
  }
  console.log("showdown-battle-core duplicate force switch choice smoke ok");
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

async function initialStateSmoke() {
  const halfHpPikachu = {
    ...pikachu,
    entryHp: 50,
    entryStatus: "par",
    maxHp: 100,
  };
  const input: BattleServiceSessionInputV4 = {
    runId: "test-run",
    nodeId: "test-node-initial-state",
    mode: "singles",
    ruleSet: "gen9",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: [halfHpPikachu, eevee], draft: null as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [pikachu, eevee], draft: null as any},
    ],
  };
  const snapshot = await createBattleSession(input);
  const active = snapshot.active.find(entry => entry.playerId === "p1");
  if (!active) throw new Error("missing p1 initial active");
  if (active.hp !== 50 || active.status !== "par") {
    throw new Error(`initial state not applied to active: ${JSON.stringify(active)}`);
  }
  const row = snapshot.requests.p1?.side?.pokemon?.[0];
  if (!row?.condition.includes("50/") || !row.condition.includes("par")) {
    throw new Error(`initial state not reflected in request: ${row?.condition || "missing"}`);
  }
  console.log("showdown-battle-core initial state smoke ok");
}

async function residualStatusSmoke() {
  await residualDamageSmoke("brn");
  await residualDamageSmoke("psn");
  console.log("showdown-battle-core residual status smoke ok");
}

async function residualDamageSmoke(status: "brn" | "psn") {
  const input: BattleServiceSessionInputV4 = {
    runId: "test-run",
    nodeId: `test-node-residual-${status}`,
    mode: "singles",
    ruleSet: "gen9",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: [{...bulbasaur, entryHp: 90, entryStatus: status, maxHp: 100}, eevee], draft: null as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [{...eevee, moves: ["Protect", "Rest", "Tackle", "Growl"]}, pikachu], draft: null as any},
    ],
  };
  const snapshot = await createBattleSession(input);
  const before = snapshot.active.find(entry => entry.playerId === "p1");
  if (!before || before.status !== status) throw new Error(`${status} initial status missing`);
  const next = await submitChoice({sessionId: snapshot.id, playerId: "p1", choice: "move 3"});
  const after = next.active.find(entry => entry.playerId === "p1");
  if (!after || after.hp >= before.hp) {
    throw new Error(`${status} residual damage missing: before=${before?.condition} after=${after?.condition}`);
  }
  if (!next.rawLog.some(line => line.includes("|-damage|p1a: Bulbasaur|") && line.includes(`[from] ${status === "brn" ? "brn" : "psn"}`))) {
    throw new Error(`${status} residual damage raw log missing`);
  }
}

async function sleepCantMoveSmoke() {
  const input: BattleServiceSessionInputV4 = {
    runId: "test-run",
    nodeId: "test-node-sleep-cant",
    mode: "singles",
    ruleSet: "gen9",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: [{...bulbasaur, entryHp: 100, entryStatus: "slp", maxHp: 100}, eevee], draft: null as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [{...eevee, moves: ["Protect", "Rest", "Tackle", "Growl"]}, pikachu], draft: null as any},
    ],
  };
  const snapshot = await createBattleSession(input);
  const active = snapshot.active.find(entry => entry.playerId === "p1");
  if (!active || active.status !== "slp") throw new Error("sleep initial status missing");
  const next = await submitChoice({sessionId: snapshot.id, playerId: "p1", choice: "move 1"});
  if (!next.rawLog.some(line => line.includes("|cant|p1a: Bulbasaur|slp"))) {
    throw new Error("sleep did not prevent move");
  }
  console.log("showdown-battle-core sleep cant move smoke ok");
}

void smoke()
  .then(doublesSmoke)
  .then(rechargeChoiceSmoke)
  .then(faintedDoublesActiveChoiceSmoke)
  .then(duplicateForceSwitchChoiceSmoke)
  .then(duplicateSpeciesDoublesSmoke)
  .then(initialStateSmoke)
  .then(residualStatusSmoke)
  .then(sleepCantMoveSmoke);
