import {
  appendShowdownSpecialChoiceSuffixV4,
  chooseAiBattleChoiceV4,
  createBattleSession,
  filterShowdownChoiceForRuleSetV4,
  generateShowdownRandomTeamV4,
  parseShowdownChoiceCommandV4,
  randomLegalChoice,
  resolveBattleWinnerPlayerIdV4,
  resolveShowdownRandomTeamFormatV4,
  showdownMoveNeedsExplicitTargetV4,
  applyPermanentFormeChange,
  __testApplyBattleProtocolLinesV4,
  submitTrainerItem,
  submitChoice,
  validateShowdownChoiceCommandV4,
  withShowdownMoveTargetSuffixV4,
} from "./index.js";
import {compileShowdownPlaybackTimelineFromRawLog} from "./playbackCompiler.js";
import type {BattleAiLevelV4, BattleAiPreferenceV4, BattleServiceRequestV4, BattleServiceSessionInputV4, BattleServiceSnapshotV4} from "./types.js";

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

function localPokemonFromSet(set: typeof pikachu, overrides: Record<string, unknown> = {}) {
  return {
    localPokemonId: `${set.name.toLowerCase()}-local`,
    speciesId: set.species.toLowerCase(),
    name: set.name,
    nameZh: set.name,
    level: set.level,
    gender: "M" as const,
    shiny: false,
    itemId: "",
    abilityId: set.ability.toLowerCase().replace(/[^a-z0-9]+/g, ""),
    moves: set.moves.map(move => ({moveId: move.toLowerCase().replace(/[^a-z0-9]+/g, "")})),
    nature: set.nature,
    evs: set.evs,
    ivs: set.ivs,
    maxHp: 100,
    entryHp: 100,
    entryStatus: "",
    ...overrides,
  };
}

function trainerItemDraft(playerId: "p1" | "p2", pokemon: ReturnType<typeof localPokemonFromSet>[], items: Array<Record<string, unknown>> = []) {
  return {
    playerId,
    name: playerId,
    avatar: "",
    controller: playerId === "p1" ? "local" as const : "ai" as const,
    alliance: playerId === "p1" ? "near" as const : "far" as const,
    localTeam: {id: `${playerId}-team`, name: `${playerId} team`, pokemon},
    bag: {items},
  };
}

const charizard = {
  ...pikachu,
  species: "Charizard",
  name: "Charizard",
  ability: "Blaze",
  item: "Charizardite X",
  moves: ["Flamethrower", "Air Slash", "Protect", "Rest"],
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
  const next = snapshot.requests.p1?.active?.length
    ? snapshot
    : await submitChoice({sessionId: snapshot.id, playerId: "p1", choice: randomLegalChoice(snapshot.requests.p1)});
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

async function gen7CoopFormatSmoke() {
  const input: BattleServiceSessionInputV4 = {
    runId: "test-run",
    nodeId: "test-node-gen7-coop-format",
    mode: "coop",
    ruleSet: "gen7",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: [pikachu, eevee], draft: null as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [bulbasaur, eevee], draft: null as any},
      {playerId: "p3", name: "C", controller: "script", alliance: "near", team: [eevee, pikachu], draft: null as any},
      {playerId: "p4", name: "D", controller: "ai", alliance: "far", team: [bulbasaur, eevee], draft: null as any},
    ],
  };
  const snapshot = await createBattleSession(input);
  if (!snapshot.rawLog.some(line => line === "|gametype|multi")) {
    throw new Error(`gen7 coop should start as multi, status=${snapshot.status}, error=${snapshot.error}, input=${JSON.stringify(snapshot.debug.inputLog)}, streams=${JSON.stringify(snapshot.debug.playerStreams)}, raw log: ${snapshot.rawLog.join("\n")}`);
  }
  if (snapshot.rawLog.some(line => line === "|gametype|singles")) {
    throw new Error(`gen7 coop leaked singles gametype: ${snapshot.rawLog.join("\n")}`);
  }
  if (!snapshot.rawLog.some(line => line.includes("|player|p3|")) || !snapshot.rawLog.some(line => line.includes("|player|p4|"))) {
    throw new Error(`gen7 coop should register p3/p4 players: ${snapshot.rawLog.join("\n")}`);
  }
  if (!snapshot.requests.p1?.active?.length) {
    throw new Error(`gen7 coop should expose an actionable p1 request: ${JSON.stringify(snapshot.requests)}`);
  }
  console.log("showdown-battle-core gen7 coop format smoke ok");
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

function allAdjacentDoublesTargetChoiceSmoke() {
  const request: BattleServiceRequestV4 = {
    targetable: true,
    active: [
      {moves: [{move: "Surf", id: "surf", pp: 14, maxpp: 24, target: "allAdjacent"}]},
      {moves: [{move: "Brick Break", id: "brickbreak", pp: 14, maxpp: 24, target: "normal"}]},
    ],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: Starmie", details: "Starmie, L50", condition: "266/266", active: true},
        {ident: "p1: Breloom", details: "Breloom, L50", condition: "137/137", active: true},
      ],
    },
  };
  const choice = randomLegalChoice(request);
  if (!/^move 1, move 1 \+\d$/.test(choice)) {
    throw new Error(`allAdjacent doubles move should not include manual target loc: ${choice}`);
  }
  console.log("showdown-battle-core all-adjacent doubles target choice smoke ok");
}

function showdownChoiceValidationSmoke() {
  const request: BattleServiceRequestV4 = {
    targetable: true,
    active: [
      {moves: [
        {move: "Surf", id: "surf", pp: 14, maxpp: 24, target: "allAdjacent"},
        {move: "Thunderbolt", id: "thunderbolt", pp: 15, maxpp: 24, target: "normal"},
        {move: "Heal Pulse", id: "healpulse", pp: 10, maxpp: 16, target: "adjacentAlly"},
        {move: "Protect", id: "protect", pp: 10, maxpp: 16, target: "self"},
      ]},
      {moves: [
        {move: "Aura Sphere", id: "aurasphere", pp: 14, maxpp: 24, target: "any"},
        {move: "Helping Hand", id: "helpinghand", pp: 20, maxpp: 32, target: "adjacentAllyOrSelf"},
        {move: "Snarl", id: "snarl", pp: 15, maxpp: 24, target: "allAdjacentFoes"},
        {move: "Rain Dance", id: "raindance", pp: 5, maxpp: 8, target: "all"},
      ]},
    ],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: Starmie", details: "Starmie, L50", condition: "266/266", active: true},
        {ident: "p1: Breloom", details: "Breloom, L50", condition: "137/137", active: true},
        {ident: "p1: Jolteon", details: "Jolteon, L50", condition: "140/140", active: false},
      ],
    },
  };
  const cases: Array<{choice: string; ok: boolean; reason?: string}> = [
    {choice: "move 4 +1, move 4", ok: false, reason: "forbidden-target"},
    {choice: "move 4, move 4", ok: true},
    {choice: "move 1 +1, move 4", ok: false, reason: "forbidden-target"},
    {choice: "move 1, move 4", ok: true},
    {choice: "move 2, move 4", ok: false, reason: "missing-target"},
    {choice: "move 2 +1, move 4", ok: true},
    {choice: "move 3 +1, move 4", ok: false, reason: "invalid-target"},
    {choice: "move 3 -2, move 4", ok: true},
    {choice: "move 2 +1, move 1 -1", ok: true},
    {choice: "move 2 +1, move 1 -2", ok: false, reason: "invalid-target"},
    {choice: "move 2 +1, move 2 +1", ok: false, reason: "invalid-target"},
    {choice: "move 2 +1, move 2 -2", ok: true},
    {choice: "move 2 +1, move 3 +1", ok: false, reason: "forbidden-target"},
    {choice: "move 2 +1, move 3", ok: true},
  ];
  for (const entry of cases) {
    const result = validateShowdownChoiceCommandV4({request, choice: entry.choice});
    if (result.ok !== entry.ok || (!result.ok && entry.reason && result.reason !== entry.reason)) {
      throw new Error(`choice validation mismatch for ${entry.choice}: ${JSON.stringify(result)}`);
    }
  }
  const maxRequest: BattleServiceRequestV4 = {
    targetable: true,
    active: [
      {
        moves: [{move: "Protect", id: "protect", pp: 10, maxpp: 16, target: "self"}],
        maxMoves: [{move: "Max Guard", id: "maxguard", target: "self"}],
      },
      null,
    ],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: Pikachu", details: "Pikachu, L50", condition: "100/100", active: true},
        {ident: "p1: Eevee", details: "Eevee, L50", condition: "0 fnt", active: true, fainted: true},
      ],
    },
  };
  const maxNoTarget = validateShowdownChoiceCommandV4({request: maxRequest, choice: "move 1 max, pass"});
  const maxWithTarget = validateShowdownChoiceCommandV4({request: maxRequest, choice: "move 1 max +1, pass"});
  if (!maxNoTarget.ok || maxWithTarget.ok || (!maxWithTarget.ok && maxWithTarget.reason !== "forbidden-target")) {
    throw new Error(`max guard target validation mismatch: ${JSON.stringify({maxNoTarget, maxWithTarget})}`);
  }
  console.log("showdown-battle-core choice validation smoke ok");
}

function activeMaxMoveTargetValidationSmoke() {
  const request: BattleServiceRequestV4 = {
    targetable: false,
    active: [
      {
        moves: [
          {move: "Surf", id: "surf", pp: 14, maxpp: 24, target: "allAdjacent"},
        ],
        maxMoves: {
          maxMoves: [
            {move: "Max Geyser", id: "maxgeyser", target: "adjacentFoe"},
          ],
        },
      },
      {
        moves: [
          {move: "Brick Break", id: "brickbreak", pp: 14, maxpp: 24, target: "normal"},
        ],
      },
    ],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: Starmie", details: "Starmie, L50", condition: "266/266", active: true},
        {ident: "p1: Breloom", details: "Breloom, L50", condition: "137/137", active: true},
      ],
    },
  };
  const missingTarget = validateShowdownChoiceCommandV4({request, choice: "move 1, move 1 +1"});
  const withTarget = validateShowdownChoiceCommandV4({request, choice: "move 1 +2, move 1 +1"});
  const fallback = randomLegalChoice(request);
  const fallbackValidation = validateShowdownChoiceCommandV4({request, choice: fallback});
  if (missingTarget.ok || (!missingTarget.ok && missingTarget.reason !== "missing-target")) {
    throw new Error(`active max move without target should be rejected: ${JSON.stringify(missingTarget)}`);
  }
  if (!withTarget.ok) throw new Error(`active max move with target should be accepted: ${JSON.stringify(withTarget)}`);
  if (!/^move 1 \+\d, move 1 \+\d$/.test(fallback) || !fallbackValidation.ok) {
    throw new Error(`active max fallback should include legal target: ${fallback}; ${JSON.stringify(fallbackValidation)}`);
  }
  console.log("showdown-battle-core active max move target validation smoke ok");
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

function coopWinnerNameSmoke() {
  const players: BattleServiceSessionInputV4["players"] = [
    {playerId: "p1", name: "P1", controller: "local", alliance: "near", team: [pikachu], draft: null as any},
    {playerId: "p2", name: "P2", controller: "ai", alliance: "far", team: [eevee], draft: null as any},
    {playerId: "p3", name: "P3", controller: "ai", alliance: "near", team: [bulbasaur], draft: null as any},
    {playerId: "p4", name: "P4", controller: "ai", alliance: "far", team: [eevee], draft: null as any},
  ];
  const nearWinner = resolveBattleWinnerPlayerIdV4(players, "P1 & P3");
  const farWinner = resolveBattleWinnerPlayerIdV4(players, "P2 & P4");
  if (nearWinner !== "p1") throw new Error(`coop near winner should resolve to p1: ${nearWinner}`);
  if (farWinner !== "p2") throw new Error(`coop far winner should resolve to p2: ${farWinner}`);
  console.log("showdown-battle-core coop winner name smoke ok");
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
  const initialP1Roster = snapshot.battleRosterByPlayer?.p1;
  const initialP1Keys = [initialP1Roster?.activeKeyBySlot?.p1a, initialP1Roster?.activeKeyBySlot?.p1b].filter(Boolean);
  if (new Set(initialP1Keys).size !== 2) {
    throw new Error(`duplicate species should keep separate p1 roster keys: ${JSON.stringify(initialP1Roster)}`);
  }
  const next = await submitChoice({sessionId: snapshot.id, playerId: "p1", choice: randomLegalChoice(snapshot.requests.p1)});
  const slots = next.active.map(active => active.slot).sort();
  for (const slot of ["p1a", "p1b", "p2a", "p2b"]) {
    if (!slots.includes(slot)) throw new Error(`missing duplicate doubles active slot ${slot}`);
  }
  const nextP1Roster = next.battleRosterByPlayer?.p1;
  const nextP1Keys = [nextP1Roster?.activeKeyBySlot?.p1a, nextP1Roster?.activeKeyBySlot?.p1b].filter(Boolean);
  if (new Set(nextP1Keys).size !== 2) {
    throw new Error(`duplicate species should keep separate p1 roster keys after turn: ${JSON.stringify(nextP1Roster)}`);
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

async function permanentFormeChangeSmoke() {
  const input: BattleServiceSessionInputV4 = {
    runId: "test-run",
    nodeId: "test-node-forme-change",
    mode: "singles",
    ruleSet: "gen9",
    seed: "test-seed-forme-change",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: [{...pikachu, species: "Bulbasaur", name: "Seed", ability: "Overgrow", moves: ["Tackle"]}], draft: null as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [pikachu], draft: null as any},
    ],
  };
  const snapshot = await createBattleSession(input);
  const next = await submitChoice({sessionId: snapshot.id, playerId: "p1", choice: randomLegalChoice(snapshot.requests.p1)});
  const changed = await applyPermanentFormeChange({
    sessionId: snapshot.id,
    playerId: "p1",
    activeIndex: 0,
    toSpeciesId: "venusaur",
    message: "Seed进化了！",
  });
  if (!changed.ok) throw new Error(`forme change should succeed: ${changed.message}`);
  const p1Row = changed.snapshot.requests.p1?.side?.pokemon.find(row => row.active);
  if (!p1Row?.details.includes("Venusaur")) {
    throw new Error(`forme change should refresh request details: ${JSON.stringify(changed.snapshot.requests.p1)}`);
  }
  if (!changed.snapshot.rawLog.some(line => line.includes("|detailschange|") && line.includes("Venusaur"))) {
    throw new Error(`forme change rawLog should include detailschange: ${changed.snapshot.rawLog.join("\n")}`);
  }
  if (!changed.snapshot.rawLog.some(line => line.includes("|-message|Seed进化了！"))) {
    throw new Error(`forme change rawLog should include evolution message: ${changed.snapshot.rawLog.join("\n")}`);
  }
  const timeline = compileShowdownPlaybackTimelineFromRawLog(changed.snapshot.rawLog, {sessionId: snapshot.id, previousIndex: next.rawLog.length});
  if (!timeline.groups.some(group => group.calls.some(call => call.kind === "transform"))) {
    throw new Error(`forme change should compile to transform group: ${JSON.stringify(timeline.groups)}`);
  }
}

async function activeIdentityContinuitySmoke() {
  const ninetales = {...pikachu, species: "Ninetales", name: "Ninetales", ability: "Flash Fire", moves: ["Flamethrower", "Protect"]};
  const volcarona = {...pikachu, species: "Volcarona", name: "Volcarona", ability: "Flame Body", moves: ["Bug Buzz", "Protect"]};
  const magnezone = {...pikachu, species: "Magnezone", name: "Magnezone", ability: "Sturdy", moves: ["Thunderbolt", "Protect"]};
  const greninja = {...pikachu, species: "Greninja", name: "Greninja", ability: "Torrent", item: "Greninjite", moves: ["Water Shuriken", "U-turn", "Protect"]};
  const localTeam = [
    localPokemonFromSet(ninetales, {localPokemonId: "formal-p1-1-ninetales", showdownIdentityToken: "pokeball", showdownId: "pokeball", pokeballId: "pokeball"}),
    localPokemonFromSet(volcarona, {localPokemonId: "formal-p1-2-volcarona", showdownIdentityToken: "greatball", showdownId: "greatball", pokeballId: "greatball"}),
    localPokemonFromSet(magnezone, {localPokemonId: "formal-p1-3-magnezone", showdownIdentityToken: "ultraball", showdownId: "ultraball", pokeballId: "ultraball"}),
    localPokemonFromSet(greninja, {localPokemonId: "formal-p1-4-greninja", showdownIdentityToken: "masterball", showdownId: "masterball", pokeballId: "masterball"}),
  ];
  const identityTokens = ["pokeball", "greatball", "ultraball", "masterball"];
  const teamMapping = localTeam.map((pokemon, index) => ({
    playerId: "p1" as const,
    teamIndex: index,
    choiceIndex: index + 1,
    localPokemonId: pokemon.localPokemonId,
    showdownIdentityToken: identityTokens[index]!,
    showdownId: identityTokens[index]!,
    pokeballId: identityTokens[index]!,
    speciesId: pokemon.speciesId,
    displayName: pokemon.nameZh,
  }));
  const ninetalesToken = "pokeball";
  const volcaronaToken = "greatball";
  const magnezoneToken = "ultraball";
  const greninjaToken = "masterball";
  const greninjaMapping = teamMapping[3]!;
  const snapshot: BattleServiceSnapshotV4 = {
    id: "active-identity-test-session",
    runId: "test-run",
    nodeId: "test-node-active-identity",
    status: "running",
    mode: "doubles",
    ruleSet: "gen9",
    turn: 3,
    winner: null,
    error: null,
    players: [{
      playerId: "p1",
      name: "A",
      controller: "local",
      alliance: "near",
      team: [],
      draft: trainerItemDraft("p1", localTeam) as any,
      teamMapping,
    }],
    requests: {},
    active: [],
    rawLog: [],
    debug: {inputLog: [], lastChoices: [], playerStreams: [], latestSidePokemon: {}, latestRequests: {}, latestMovePpByPokemon: {}, aiDecisions: []},
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z",
  };
  const reordered = {
    ...snapshot,
    requests: {
      ...snapshot.requests,
      p1: {
        rqid: 99,
        targetable: true,
        active: [
          {moves: [{move: "Flamethrower", id: "flamethrower", pp: 15, maxpp: 15, target: "normal"}]},
          {moves: [{move: "Water Shuriken", id: "watershuriken", pp: 20, maxpp: 20, target: "normal"}]},
        ],
        side: {
          id: "p1",
          name: "A",
          pokemon: [
            {ident: "p1: Greninja", details: "Greninja-Mega, L50, M", condition: "151/151", active: true, pokeball: greninjaToken},
            {ident: "p1: Ninetales", details: "Ninetales, L50, M", condition: "100/100", active: true, pokeball: ninetalesToken},
            {ident: "p1: Magnezone", details: "Magnezone, L50", condition: "100/100", active: false, pokeball: magnezoneToken},
            {ident: "p1: Volcarona", details: "Volcarona, L50, M", condition: "100/100", active: false, pokeball: volcaronaToken},
          ],
        },
      },
    },
    debug: {
      ...snapshot.debug,
      latestSidePokemon: {
        ...snapshot.debug.latestSidePokemon,
        p1: [
          {ident: "p1: Greninja", details: "Greninja-Mega, L50, M", condition: "151/151", active: true, pokeball: greninjaToken},
          {ident: "p1: Ninetales", details: "Ninetales, L50, M", condition: "100/100", active: true, pokeball: ninetalesToken},
          {ident: "p1: Magnezone", details: "Magnezone, L50", condition: "100/100", active: false, pokeball: magnezoneToken},
          {ident: "p1: Volcarona", details: "Volcarona, L50, M", condition: "100/100", active: false, pokeball: volcaronaToken},
        ],
      },
    },
    active: [{
      ident: "p1a: Greninja",
      playerId: "p1",
      slot: "p1a",
      localPokemonId: greninjaMapping.localPokemonId,
      showdownIdentityToken: greninjaToken,
      showdownId: greninjaToken,
      pokeballId: greninjaToken,
      pokeball: greninjaToken,
      species: "Greninja-Mega",
      details: "Greninja-Mega, L50, M",
      condition: "151/151",
      hp: 151,
      maxHp: 151,
      status: "",
      fainted: false,
    }],
  } satisfies BattleServiceSnapshotV4;
  const afterOnlyDetailsChange = __testApplyBattleProtocolLinesV4(reordered, [
    "|detailschange|p1a: Greninja|Greninja-Mega, L50, M",
  ]);
  const afterDetailsRoster = afterOnlyDetailsChange.battleRosterByPlayer?.p1;
  const afterDetailsKey = afterDetailsRoster?.activeKeyBySlot?.p1a;
  if (!afterDetailsKey) throw new Error(`detailschange should bind p1a to a roster key: ${JSON.stringify(afterOnlyDetailsChange.battleRosterByPlayer)}`);
  const afterDetailsEntry = afterDetailsRoster?.pokemonByKey?.[afterDetailsKey];
  if (afterDetailsEntry?.localPokemonId !== greninjaMapping.localPokemonId || afterDetailsEntry.details !== "Greninja-Mega, L50, M") {
    throw new Error(`detailschange should mutate greninja roster entry only: ${JSON.stringify(afterDetailsEntry)}`);
  }
  const afterDetailsChange = __testApplyBattleProtocolLinesV4(afterOnlyDetailsChange, [
    "|switch|p1a: Greninja|Greninja-Mega, L50, M|151/151",
  ]);
  const afterSwitchRoster = afterDetailsChange.battleRosterByPlayer?.p1;
  const afterSwitchKey = afterSwitchRoster?.activeKeyBySlot?.p1a;
  if (afterSwitchKey !== afterDetailsKey) {
    throw new Error(`switch should keep same greninja roster key after detailschange: ${afterDetailsKey} -> ${afterSwitchKey}`);
  }
  const activeGreninja = afterDetailsChange.active.find(entry => entry.slot === "p1a");
  if (activeGreninja?.localPokemonId !== greninjaMapping.localPokemonId) {
    throw new Error(`mega active identity should remain greninja, got ${JSON.stringify(activeGreninja)}`);
  }
  if (activeGreninja?.localPokemonId?.includes("magnezone")) {
    throw new Error(`mega active identity should not become magnezone: ${JSON.stringify(activeGreninja)}`);
  }
  console.log("showdown-battle-core active identity continuity smoke ok");
}

async function activeIdentityStressMatrixSmoke() {
  const ninetales = {...pikachu, species: "Ninetales", name: "Ninetales", ability: "Flash Fire", moves: ["Flamethrower", "Protect"]};
  const volcarona = {...pikachu, species: "Volcarona", name: "Volcarona", ability: "Flame Body", moves: ["Bug Buzz", "Protect"]};
  const magnezone = {...pikachu, species: "Magnezone", name: "Magnezone", ability: "Sturdy", moves: ["Thunderbolt", "Protect"]};
  const greninja = {...pikachu, species: "Greninja", name: "Greninja", ability: "Torrent", item: "Greninjite", moves: ["Water Shuriken", "U-turn", "Protect"]};
  const localTeam = [
    localPokemonFromSet(ninetales, {localPokemonId: "formal-p1-1-ninetales", showdownIdentityToken: "pokeball", showdownId: "pokeball", pokeballId: "pokeball"}),
    localPokemonFromSet(volcarona, {localPokemonId: "formal-p1-2-volcarona", showdownIdentityToken: "greatball", showdownId: "greatball", pokeballId: "greatball"}),
    localPokemonFromSet(magnezone, {localPokemonId: "formal-p1-3-magnezone", showdownIdentityToken: "ultraball", showdownId: "ultraball", pokeballId: "ultraball"}),
    localPokemonFromSet(greninja, {localPokemonId: "formal-p1-4-greninja", showdownIdentityToken: "masterball", showdownId: "masterball", pokeballId: "masterball"}),
  ];
  const teamMapping = localTeam.map((pokemon, index) => {
    const token = ["pokeball", "greatball", "ultraball", "masterball"][index]!;
    return {
      playerId: "p1" as const,
      teamIndex: index,
      choiceIndex: index + 1,
      localPokemonId: pokemon.localPokemonId,
      showdownIdentityToken: token,
      showdownId: token,
      pokeballId: token,
      speciesId: pokemon.speciesId,
      displayName: pokemon.nameZh,
    };
  });
  const row = (ident: string, details: string, condition: string, active: boolean, pokeball: string) => ({ident, details, condition, active, pokeball});
  const requestForRows = (rows: ReturnType<typeof row>[]): BattleServiceRequestV4 => ({
    rqid: 100,
    targetable: true,
    active: rows.filter(entry => entry.active).map(() => ({moves: [{move: "Protect", id: "protect", pp: 16, maxpp: 16, target: "self"}]})),
    side: {id: "p1", name: "A", pokemon: rows},
  });
  const withRows = (snapshot: BattleServiceSnapshotV4, rows: ReturnType<typeof row>[]): BattleServiceSnapshotV4 => ({
    ...snapshot,
    requests: {...snapshot.requests, p1: requestForRows(rows)},
    debug: {
      ...snapshot.debug,
      latestSidePokemon: {...snapshot.debug.latestSidePokemon, p1: rows},
    },
  });
  const activeRows = {
    opening: [
      row("p1: Ninetales", "Ninetales, L50, M", "100/100", true, "pokeball"),
      row("p1: Greninja", "Greninja, L50, M", "151/151", true, "masterball"),
      row("p1: Magnezone", "Magnezone, L50", "100/100", false, "ultraball"),
      row("p1: Volcarona", "Volcarona, L50, M", "100/100", false, "greatball"),
    ],
    magnezoneIn: [
      row("p1: Ninetales", "Ninetales, L50, M", "100/100", true, "pokeball"),
      row("p1: Greninja", "Greninja-Mega, L50, M", "77/151", false, "masterball"),
      row("p1: Magnezone", "Magnezone, L50", "100/100", true, "ultraball"),
      row("p1: Volcarona", "Volcarona, L50, M", "100/100", false, "greatball"),
    ],
    reorderedReturn: [
      row("p1: Greninja", "Greninja-Mega, L50, M", "77/151", true, "masterball"),
      row("p1: Ninetales", "Ninetales, L50, M", "100/100", true, "pokeball"),
      row("p1: Magnezone", "Magnezone, L50", "100/100", false, "ultraball"),
      row("p1: Volcarona", "Volcarona, L50, M", "100/100", false, "greatball"),
    ],
  };
  let current: BattleServiceSnapshotV4 = withRows({
    id: "active-identity-stress-session",
    runId: "test-run",
    nodeId: "test-node-active-identity-stress",
    status: "running",
    mode: "doubles",
    ruleSet: "gen9",
    turn: 4,
    winner: null,
    error: null,
    players: [{
      playerId: "p1",
      name: "A",
      controller: "local",
      alliance: "near",
      team: [],
      draft: trainerItemDraft("p1", localTeam) as any,
      teamMapping,
    }],
    requests: {},
    active: [],
    battleRosterByPlayer: {},
    rawLog: [],
    debug: {inputLog: [], lastChoices: [], playerStreams: [], latestSidePokemon: {}, latestRequests: {}, latestMovePpByPokemon: {}, aiDecisions: []},
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z",
  }, activeRows.opening);

  const activeLocalId = (snapshot: BattleServiceSnapshotV4, slot: string) => snapshot.active.find(entry => entry.slot === slot)?.localPokemonId;
  const activeKey = (snapshot: BattleServiceSnapshotV4, slot: string) => snapshot.battleRosterByPlayer?.p1?.activeKeyBySlot?.[slot];
  const rosterEntry = (snapshot: BattleServiceSnapshotV4, key: string | undefined) => key ? snapshot.battleRosterByPlayer?.p1?.pokemonByKey?.[key] : undefined;

  current = __testApplyBattleProtocolLinesV4(current, [
    "|switch|p1a: Ninetales|Ninetales, L50, M|100/100",
    "|switch|p1b: Greninja|Greninja, L50, M|151/151",
  ]);
  if (activeLocalId(current, "p1a") !== "formal-p1-1-ninetales" || activeLocalId(current, "p1b") !== "formal-p1-4-greninja") {
    throw new Error(`opening active identity mismatch: ${JSON.stringify(current.active)}`);
  }
  const greninjaKey = activeKey(current, "p1b");

  current = __testApplyBattleProtocolLinesV4(current, ["|detailschange|p1b: Greninja|Greninja-Mega, L50, M"]);
  if (activeKey(current, "p1b") !== greninjaKey || rosterEntry(current, greninjaKey)?.details !== "Greninja-Mega, L50, M") {
    throw new Error(`detailschange should preserve greninja key and update details: ${JSON.stringify(current.battleRosterByPlayer?.p1)}`);
  }

  current = __testApplyBattleProtocolLinesV4(current, ["|-damage|p1b: Greninja|77/151"]);
  if (rosterEntry(current, greninjaKey)?.hp !== 77) {
    throw new Error(`damage should update greninja roster entry: ${JSON.stringify(rosterEntry(current, greninjaKey))}`);
  }

  current = withRows(current, activeRows.magnezoneIn);
  current = __testApplyBattleProtocolLinesV4(current, ["|switch|p1b: Magnezone|Magnezone, L50|100/100"]);
  if (activeLocalId(current, "p1b") !== "formal-p1-3-magnezone") {
    throw new Error(`switch-in should resolve magnezone by current row token: ${JSON.stringify(current.active)}`);
  }
  if (rosterEntry(current, greninjaKey)?.localPokemonId !== "formal-p1-4-greninja" || rosterEntry(current, greninjaKey)?.hp !== 77) {
    throw new Error(`greninja inactive roster entry should survive switch-out: ${JSON.stringify(current.battleRosterByPlayer?.p1)}`);
  }

  current = withRows(current, activeRows.reorderedReturn);
  current = __testApplyBattleProtocolLinesV4(current, [
    "|switch|p1b: Ninetales|Ninetales, L50, M|100/100",
    "|switch|p1a: Greninja|Greninja-Mega, L50, M|77/151",
  ]);
  if (activeKey(current, "p1a") !== greninjaKey || activeLocalId(current, "p1a") !== "formal-p1-4-greninja") {
    throw new Error(`greninja should return with same roster key after row reorder: ${JSON.stringify(current.battleRosterByPlayer?.p1)}`);
  }
  if (activeLocalId(current, "p1b") !== "formal-p1-1-ninetales" || activeLocalId(current, "p1b") === "formal-p1-3-magnezone") {
    throw new Error(`slot move should not leave magnezone identity on p1b: ${JSON.stringify(current.active)}`);
  }

  console.log("showdown-battle-core active identity stress matrix smoke ok");
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

async function trainerItemSmoke() {
  const p1 = trainerItemDraft("p1", [
    localPokemonFromSet(pikachu, {entryHp: 50, maxHp: 100}),
    localPokemonFromSet(eevee),
  ], [{id: "potion-1", itemID: "potion", name: "回复药", canBattleUse: true}]);
  const p2 = trainerItemDraft("p2", [
    localPokemonFromSet(bulbasaur, {moves: [{moveId: "sleeptalk"}, {moveId: "growl"}, {moveId: "protect"}, {moveId: "rest"}]}),
    localPokemonFromSet(eevee),
  ]);
  const snapshot = await createBattleSession({
    runId: "test-run",
    node: {
      id: "test-node-trainer-item",
      mode: "singles",
      ruleSet: "gen9",
      seed: "test-seed",
      p1: "p1",
      p2: "p2",
      p3: null,
      p4: null,
      participants: {p1, p2},
    },
    players: {p1, p2},
  });
  if (!snapshot.requests.p1?.active?.length) throw new Error("missing trainer item request");
  const next = await submitTrainerItem({
    sessionId: snapshot.id,
    playerId: "p1",
    choice: "pass",
    trainerItems: [{activeIndex: 0, itemInstanceId: "potion-1", targetKey: "pokeball"}],
  });
  if (!next.debug.inputLog.some(line => line.includes("[trainer-item]"))) {
    throw new Error(`trainer item input log missing: ${JSON.stringify(next.debug.inputLog)}`);
  }
  if (!next.rawLog.some(line => line.includes("|-heal|p1a: Pikachu|") && line.includes("[from] item: 回复药"))) {
    throw new Error(`trainer item heal protocol missing: ${next.rawLog.join("\n")}`);
  }
  const player = next.players.find(entry => entry.playerId === "p1");
  if (player?.draft.bag.items.some(item => item.id === "potion-1")) {
    throw new Error("trainer item was not consumed from bag");
  }
  const healed = player?.draft.localTeam.pokemon[0];
  if (!healed || Number(healed.entryHp || 0) <= 50) {
    throw new Error(`trainer item did not heal local pokemon: ${JSON.stringify(healed)}`);
  }
  console.log("showdown-battle-core trainer item smoke ok");
}

async function trainerItemNoEffectSmoke() {
  const p1 = trainerItemDraft("p1", [
    localPokemonFromSet(pikachu, {entryHp: 100, maxHp: 100}),
    localPokemonFromSet(eevee),
  ], [{id: "potion-full-hp", itemID: "potion", name: "回复药", canBattleUse: true}]);
  const p2 = trainerItemDraft("p2", [
    localPokemonFromSet(bulbasaur),
    localPokemonFromSet(eevee),
  ]);
  const snapshot = await createBattleSession({
    runId: "test-run",
    node: {
      id: "test-node-trainer-item-no-effect",
      mode: "singles",
      ruleSet: "gen9",
      seed: "test-seed",
      p1: "p1",
      p2: "p2",
      p3: null,
      p4: null,
      participants: {p1, p2},
    },
    players: {p1, p2},
  });
  if (!snapshot.requests.p1?.active?.length) throw new Error("missing no-effect trainer item request");
  const next = await submitTrainerItem({
    sessionId: snapshot.id,
    playerId: "p1",
    choice: "pass",
    trainerItems: [{activeIndex: 0, itemInstanceId: "potion-full-hp", targetKey: "pokeball"}],
  });
  if (!next.rawLog.some(line => line.includes("|-message|但是没有效果。"))) {
    throw new Error(`trainer item no-effect protocol missing: ${next.rawLog.join("\n")}`);
  }
  if (!next.debug.inputLog.some(line => line.includes("[trainer-item]") && line.includes("noEffect=true"))) {
    throw new Error(`trainer item no-effect input log missing: ${JSON.stringify(next.debug.inputLog)}`);
  }
  const player = next.players.find(entry => entry.playerId === "p1");
  if (player?.draft.bag.items.some(item => item.id === "potion-full-hp")) {
    throw new Error("no-effect trainer item should still be consumed");
  }
  console.log("showdown-battle-core trainer item no-effect smoke ok");
}

async function trainerItemDoublesPlaceholderTargetSmoke() {
  const p1 = trainerItemDraft("p1", [
    localPokemonFromSet({...pikachu, species: "Skuntank", name: "Skuntank", ability: "Keen Eye", moves: ["Sucker Punch", "Screech", "Explosion", "Bite"]}, {entryHp: 100, maxHp: 100}),
    localPokemonFromSet({...pikachu, species: "Sigilyph", name: "Sigilyph", ability: "Tinted Lens", moves: ["Psybeam", "Confusion", "Synchronoise", "Psywave"]}),
    localPokemonFromSet(eevee),
    localPokemonFromSet({...eevee, species: "Jolteon", name: "Jolteon"}),
  ], [{id: "potion-doubles-placeholder", itemID: "potion", name: "回复药", canBattleUse: true}]);
  const p2 = trainerItemDraft("p2", [
    localPokemonFromSet(bulbasaur),
    localPokemonFromSet(eevee),
    localPokemonFromSet({...pikachu, species: "Raichu", name: "Raichu"}),
    localPokemonFromSet({...eevee, species: "Vaporeon", name: "Vaporeon"}),
  ]);
  const snapshot = await createBattleSession({
    runId: "test-run",
    node: {
      id: "test-node-trainer-item-doubles-placeholder",
      mode: "doubles",
      ruleSet: "gen8",
      seed: "test-seed",
      p1: "p1",
      p2: "p2",
      p3: null,
      p4: null,
      participants: {p1, p2},
    },
    players: {p1, p2},
  });
  if ((snapshot.requests.p1?.active || []).length !== 2) throw new Error("missing doubles trainer item request");
  const next = await submitTrainerItem({
    sessionId: snapshot.id,
    playerId: "p1",
    choice: "pass, move 1 +1",
    trainerItems: [{activeIndex: 0, itemInstanceId: "potion-doubles-placeholder", targetKey: "pokeball"}],
  });
  if (next.error?.includes("needs a target") || next.debug.inputLog.some(line => line.includes("needs a target"))) {
    throw new Error(`trainer item placeholder should include target: ${JSON.stringify(next.debug.inputLog)}`);
  }
  if (!next.debug.inputLog.some(line => line.includes("[trainer-item-placeholder]") && line.includes("move 1 +1"))) {
    throw new Error(`trainer item placeholder target log missing: ${JSON.stringify(next.debug.inputLog)}`);
  }
  if (!next.debug.inputLog.some(line => line.includes("[trainer-item]"))) {
    throw new Error(`trainer item did not execute after placeholder target: ${JSON.stringify(next.debug.inputLog)}`);
  }
  if (next.rawLog.some(line => line.includes("|move|p1a: Skuntank|Sucker Punch|"))) {
    throw new Error(`trainer item placeholder move should not execute: ${next.rawLog.join("\n")}`);
  }
  console.log("showdown-battle-core trainer item doubles placeholder target smoke ok");
}

async function rulesetSpecialSystemFilterSmoke() {
  const input: BattleServiceSessionInputV4 = {
    runId: "test-run",
    nodeId: "test-node-ruleset-special-filter",
    mode: "singles",
    ruleSet: "gen8",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: [charizard, eevee], draft: null as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [pikachu, eevee], draft: null as any},
    ],
  };
  const snapshot = await createBattleSession(input);
  const active = snapshot.requests.p1?.active?.[0];
  if (!active) throw new Error("missing gen8 active request");
  if (active.canMegaEvo || active.canMegaEvoX || active.canMegaEvoY || active.canZMove || active.zMoves) {
    throw new Error(`gen8 request leaked Mega/Z options: ${JSON.stringify(active)}`);
  }
  const next = await submitChoice({sessionId: snapshot.id, playerId: "p1", choice: "move 1 mega"});
  if (!next.debug.inputLog.some(line => line.includes("gen8 sanitized") && line.includes("move 1 mega -> move 1"))) {
    throw new Error("gen8 illegal Mega suffix was not sanitized");
  }
  console.log("showdown-battle-core ruleset special filter smoke ok");
}

async function specialSystemBagGateSmoke() {
  const baseTeam = [{...pikachu, teraType: "Electric"}, eevee];
  const noOrbInput: BattleServiceSessionInputV4 = {
    runId: "test-run",
    nodeId: "test-node-gen9-no-orb",
    mode: "singles",
    ruleSet: "gen9",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: baseTeam, draft: {bag: {items: []}} as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [pikachu, eevee], draft: null as any},
    ],
  };
  const noOrb = await createBattleSession(noOrbInput);
  if (noOrb.requests.p1?.active?.[0]?.canTerastallize) {
    throw new Error(`gen9 without tera orb leaked tera request: ${JSON.stringify(noOrb.requests.p1?.active?.[0])}`);
  }
  const noOrbNext = await submitChoice({sessionId: noOrb.id, playerId: "p1", choice: "move 1 terastallize"});
  if (noOrbNext.debug.lastChoices.some(entry => entry.playerId === "p1" && entry.choice.includes("terastallize"))) {
    throw new Error("gen9 without tera orb submitted terastallize choice");
  }

  const withOrbInput: BattleServiceSessionInputV4 = {
    ...noOrbInput,
    nodeId: "test-node-gen9-with-orb",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: baseTeam, draft: {bag: {items: [{itemID: "system-tera-orb"}]}} as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [pikachu, eevee], draft: null as any},
    ],
  };
  const withOrb = await createBattleSession(withOrbInput);
  if (!withOrb.requests.p1?.active?.[0]?.canTerastallize) {
    throw new Error(`gen9 with tera orb should expose tera request: ${JSON.stringify(withOrb.requests.p1?.active?.[0])}`);
  }

  const gen8BaseTeam = [{...charizard, item: undefined}, eevee];
  const noBandInput: BattleServiceSessionInputV4 = {
    runId: "test-run",
    nodeId: "test-node-gen8-no-band",
    mode: "singles",
    ruleSet: "gen8",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: gen8BaseTeam, draft: {bag: {items: []}} as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [pikachu, eevee], draft: null as any},
    ],
  };
  const noBand = await createBattleSession(noBandInput);
  if (noBand.requests.p1?.active?.[0]?.canDynamax || noBand.requests.p1?.active?.[0]?.maxMoves) {
    throw new Error(`gen8 without Dynamax Band leaked max request: ${JSON.stringify(noBand.requests.p1?.active?.[0])}`);
  }
  const withBand = await createBattleSession({
    ...noBandInput,
    nodeId: "test-node-gen8-with-band",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: gen8BaseTeam, draft: {bag: {items: [{itemID: "system-dynamax-band"}]}} as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [pikachu, eevee], draft: null as any},
    ],
  });
  const withBandMaxMoves = withBand.requests.p1?.active?.[0]?.maxMoves;
  const withBandMaxMoveCount = Array.isArray(withBandMaxMoves) ? withBandMaxMoves.length : withBandMaxMoves?.maxMoves?.length || 0;
  if (!withBand.requests.p1?.active?.[0]?.canDynamax || !withBandMaxMoveCount) {
    throw new Error(`gen8 with Dynamax Band should expose max request: ${JSON.stringify(withBand.requests.p1?.active?.[0])}`);
  }

  const gen7Mega = await createBattleSession({
    runId: "test-run",
    nodeId: "test-node-gen7-mega",
    mode: "singles",
    ruleSet: "gen7",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: [charizard, eevee], draft: {bag: {items: [{itemID: "system-mega-stone"}]}} as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [pikachu, eevee], draft: null as any},
    ],
  });
  if (!gen7Mega.requests.p1?.active?.[0]?.canMegaEvo) {
    throw new Error(`gen7 with mapped Mega Stone should expose Mega request: ${JSON.stringify(gen7Mega.requests.p1?.active?.[0])}`);
  }
  const pikachuWithZ = {
    ...pikachu,
    item: "Pikanium Z",
    moves: ["Volt Tackle", "Thunderbolt", "Quick Attack", "Protect"],
  };
  const gen7Z = await createBattleSession({
    runId: "test-run",
    nodeId: "test-node-gen7-z",
    mode: "singles",
    ruleSet: "gen7",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: [pikachuWithZ, eevee], draft: {bag: {items: [{itemID: "system-z-crystal"}]}} as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [pikachu, eevee], draft: null as any},
    ],
  });
  if (!gen7Z.requests.p1?.active?.[0]?.canZMove?.some(Boolean)) {
    throw new Error(`gen7 with Z-Crystal and required move should expose Z request: ${JSON.stringify(gen7Z.requests.p1?.active?.[0])}`);
  }

  const standardCoopInput: BattleServiceSessionInputV4 = {
    runId: "test-run",
    nodeId: "test-node-standard-coop",
    mode: "coop",
    ruleSet: "standard",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: baseTeam, draft: {bag: {items: [{itemID: "system-tera-orb"}]}} as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [pikachu, eevee], draft: null as any},
      {playerId: "p3", name: "C", controller: "script", alliance: "near", team: [pikachu, eevee], draft: null as any},
      {playerId: "p4", name: "D", controller: "ai", alliance: "far", team: [pikachu, eevee], draft: null as any},
    ],
  };
  const standardCoop = await createBattleSession(standardCoopInput);
  if (standardCoop.requests.p1?.active?.[0]?.canTerastallize || standardCoop.requests.p3?.active?.[0]?.canTerastallize) {
    throw new Error(`standard coop leaked tera request: ${JSON.stringify(standardCoop.requests)}`);
  }
  console.log("showdown-battle-core special system bag gate smoke ok");
}

async function scriptAllyAutoChoiceSmoke() {
  const input: BattleServiceSessionInputV4 = {
    runId: "test-run",
    nodeId: "test-node-script-auto-choice",
    mode: "coop",
    ruleSet: "standard",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: [pikachu, eevee], draft: null as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [bulbasaur, eevee], draft: null as any},
      {playerId: "p3", name: "C", controller: "script", alliance: "near", team: [eevee, pikachu], draft: null as any},
      {playerId: "p4", name: "D", controller: "ai", alliance: "far", team: [bulbasaur, eevee], draft: null as any},
    ],
  };
  const snapshot = await createBattleSession(input);
  if (!snapshot.requests.p1) throw new Error("missing p1 coop request");
  const next = await submitChoice({sessionId: snapshot.id, playerId: "p1", choice: randomLegalChoice(snapshot.requests.p1)});
  if (next.requests.p3 && !next.requests.p1) {
    throw new Error(`script ally still pending after p1 choice: ${JSON.stringify(next.requests.p3)}`);
  }
  if (!next.debug.lastChoices.some(entry => entry.playerId === "p3")) {
    throw new Error(`script ally did not submit a choice: ${JSON.stringify(next.debug.lastChoices)}`);
  }
  console.log("showdown-battle-core script ally auto choice smoke ok");
}

async function humanInvalidChoicePreflightSmoke() {
  const team = [
    {...pikachu, name: "Starmie", species: "Starmie", moves: ["Surf", "Protect", "Recover", "Thunderbolt"]},
    {...eevee, name: "Breloom", species: "Breloom", moves: ["Brick Break", "Protect", "Spore", "Tackle"]},
    {...pikachu, name: "Raichu", species: "Raichu"},
    {...eevee, name: "Jolteon", species: "Jolteon"},
  ];
  const snapshot = await createBattleSession({
    runId: "test-run",
    nodeId: "test-node-human-invalid-choice",
    mode: "doubles",
    ruleSet: "gen9",
    seed: "test-seed",
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team, draft: null as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team, draft: null as any},
    ],
  });
  const beforeRequest = snapshot.requests.p1;
  if (!beforeRequest?.active?.length) throw new Error("missing p1 request for invalid choice smoke");
  let threw = false;
  try {
    await submitChoice({sessionId: snapshot.id, playerId: "p1", choice: "move 1 +1, move 1 +1"});
  } catch (error) {
    threw = true;
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("不能手动选择目标")) {
      throw new Error(`unexpected invalid choice message: ${message}`);
    }
  }
  if (!threw) throw new Error("invalid player choice should throw before stream write");
  const after = await submitChoice({sessionId: snapshot.id, playerId: "p1", choice: randomLegalChoice(beforeRequest)});
  if (after.status === "blocked") throw new Error(`session blocked after recoverable invalid player choice: ${after.error}`);
  if (!after.debug.inputLog.some(line => line.includes("[BattleV4][invalid-choice][human][p1]"))) {
    throw new Error(`missing preflight invalid choice debug line: ${JSON.stringify(after.debug.inputLog.slice(-8))}`);
  }
  console.log("showdown-battle-core human invalid choice preflight smoke ok");
}

function showdownCommandReferenceSmoke() {
  const parsed = parseShowdownChoiceCommandV4("move 1 max +1");
  if (!parsed || parsed.kind !== "move" || parsed.index !== 1 || parsed.special !== "max" || parsed.target !== "+1") {
    throw new Error(`failed to parse canonical max choice: ${JSON.stringify(parsed)}`);
  }
  if (parseShowdownChoiceCommandV4("move 1 +1 max")) {
    throw new Error("old target-before-special move order should not parse in V4 command helpers");
  }
  const withSpecial = appendShowdownSpecialChoiceSuffixV4("move 1", "zmove");
  if (withSpecial !== "move 1 zmove") throw new Error(`unexpected special order: ${withSpecial}`);
  const withTarget = withShowdownMoveTargetSuffixV4(withSpecial, "+1");
  if (withTarget !== "move 1 zmove +1") throw new Error(`unexpected target order: ${withTarget}`);
  const filtered = filterShowdownChoiceForRuleSetV4("move 1 mega +1, move 2", "gen8", "doubles");
  if (filtered !== "move 1 +1, move 2") throw new Error(`unexpected gen8 filtered choice: ${filtered}`);
  if (showdownMoveNeedsExplicitTargetV4({id: "maxguard", target: "self"})) {
    throw new Error("self-targeting max guard should not require explicit target");
  }
  console.log("showdown command reference smoke ok");
}

function aiPureChoiceSmoke() {
  const request: BattleServiceRequestV4 = {
    rqid: 7,
    targetable: true,
    active: [
      {
        canTerastallize: "Fire",
        moves: [
          {move: "Thunderbolt", id: "thunderbolt", pp: 15, maxpp: 15, target: "normal"},
          {move: "Protect", id: "protect", pp: 10, maxpp: 10, target: "self"},
          {move: "Rain Dance", id: "raindance", pp: 5, maxpp: 5, target: "all"},
          {move: "Swords Dance", id: "swordsdance", pp: 20, maxpp: 20, target: "self"},
        ],
      },
    ],
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {ident: "p2: Pikachu", details: "Pikachu, L50", condition: "80/100", active: true, ability: "Static", item: "Light Ball"},
        {ident: "p2: Eevee", details: "Eevee, L50", condition: "100/100", active: false},
      ],
    },
  };
  const snapshot = aiSnapshot("gen9", "singles", request);
  const levels: BattleAiLevelV4[] = ["rookie", "normal", "elite", "gymLeader", "eliteFour", "champion"];
  const preferences: BattleAiPreferenceV4[] = ["offense", "defense", "support", "balanced"];
  for (const level of levels) {
    for (const preference of preferences) {
      const result = chooseAiBattleChoiceV4({
        request,
        snapshot,
        playerId: "p2",
        aiProfile: {level, preference},
        rngSeed: `${level}-${preference}`,
        timeBudgetMs: 10_000,
      });
      if (!result.choice || !result.choice.split(",").every(part => parseShowdownChoiceCommandV4(part.trim()))) {
        throw new Error(`AI produced unparsable choice for ${level}/${preference}: ${result.choice}`);
      }
      if (result.elapsedMs >= 10_000) throw new Error(`AI exceeded budget for ${level}/${preference}`);
      if (result.debug.candidateCount <= 0) throw new Error(`AI produced no candidates for ${level}/${preference}`);
      const featureKeys = Object.keys(result.debug.topCandidates[0]?.features || {});
      for (const key of ["damage", "weather", "terrain", "room", "statStage", "ability", "item"]) {
        if (!featureKeys.includes(key)) throw new Error(`AI debug missing feature ${key}`);
      }
    }
  }
  console.log("showdown-battle-core ai pure choice smoke ok");
}

function aiSpecialSystemSmoke() {
  const gen7Request: BattleServiceRequestV4 = {
    rqid: 8,
    active: [
      {
        canMegaEvo: true,
        canZMove: [{move: "Gigavolt Havoc", id: "gigavolthavoc", target: "normal"}],
        moves: [{move: "Thunderbolt", id: "thunderbolt", pp: 15, maxpp: 15, target: "normal"}],
      },
    ],
    side: {id: "p2", name: "B", pokemon: [{ident: "p2: Pikachu", details: "Pikachu, L50", condition: "100/100", active: true}]},
  };
  const gen8Request: BattleServiceRequestV4 = {
    rqid: 9,
    active: [
      {
        canDynamax: true,
        maxMoves: [{move: "Max Lightning", id: "maxlightning", pp: 10, maxpp: 10, target: "normal"}],
        moves: [{move: "Thunderbolt", id: "thunderbolt", pp: 15, maxpp: 15, target: "normal"}],
      },
    ],
    side: {id: "p2", name: "B", pokemon: [{ident: "p2: Pikachu", details: "Pikachu, L50", condition: "100/100", active: true}]},
  };
  const gen9Request: BattleServiceRequestV4 = {
    rqid: 10,
    active: [
      {
        canTerastallize: true,
        moves: [{move: "Thunderbolt", id: "thunderbolt", pp: 15, maxpp: 15, target: "normal"}],
      },
    ],
    side: {id: "p2", name: "B", pokemon: [{ident: "p2: Pikachu", details: "Pikachu, L50", condition: "100/100", active: true}]},
  };
  const gen7 = chooseAiBattleChoiceV4({
    request: gen7Request,
    snapshot: aiSnapshot("gen7", "singles", gen7Request, ["mega", "zmove"]),
    playerId: "p2",
    aiProfile: {level: "champion", preference: "offense"},
    rngSeed: "gen7-special",
  });
  if (!gen7.debug.topCandidates.some(entry => entry.choice.includes("mega") || entry.choice.includes("zmove"))) {
    throw new Error(`AI did not generate Gen7 special candidates: ${JSON.stringify(gen7.debug.topCandidates)}`);
  }
  if (!gen7.debug.selectedChoice.includes("mega") && !gen7.debug.selectedChoice.includes("zmove")) {
    throw new Error(`AI did not select a Gen7 special choice: ${JSON.stringify(gen7.debug)}`);
  }

  const gen8 = chooseAiBattleChoiceV4({
    request: gen8Request,
    snapshot: aiSnapshot("gen8", "singles", gen8Request, ["max"]),
    playerId: "p2",
    aiProfile: {level: "champion", preference: "offense"},
    rngSeed: "gen8-special",
  });
  if (!gen8.debug.topCandidates.some(entry => entry.choice.includes("max"))) {
    throw new Error(`AI did not generate Gen8 max candidates: ${JSON.stringify(gen8.debug.topCandidates)}`);
  }
  if (!gen8.debug.selectedChoice.includes("max")) {
    throw new Error(`AI did not select a Gen8 max choice: ${JSON.stringify(gen8.debug)}`);
  }
  if (gen8.debug.topCandidates.some(entry => entry.choice.includes("mega") || entry.choice.includes("zmove") || entry.choice.includes("terastallize"))) {
    throw new Error(`AI leaked Gen7 special candidates in Gen8: ${JSON.stringify(gen8.debug.topCandidates)}`);
  }

  const gen9 = chooseAiBattleChoiceV4({
    request: gen9Request,
    snapshot: aiSnapshot("gen9", "singles", gen9Request, ["terastallize"]),
    playerId: "p2",
    aiProfile: {level: "champion", preference: "offense"},
    rngSeed: "gen9-special",
  });
  if (!gen9.debug.topCandidates.some(entry => entry.choice.includes("terastallize"))) {
    throw new Error(`AI did not generate Gen9 tera candidates: ${JSON.stringify(gen9.debug.topCandidates)}`);
  }
  if (!gen9.debug.selectedChoice.includes("terastallize")) {
    throw new Error(`AI did not select a Gen9 tera choice: ${JSON.stringify(gen9.debug)}`);
  }
  if (gen9.debug.topCandidates.some(entry => entry.choice.includes("mega") || entry.choice.includes("zmove") || entry.choice.includes("max"))) {
    throw new Error(`AI leaked non-Gen9 special candidates in Gen9: ${JSON.stringify(gen9.debug.topCandidates)}`);
  }
  console.log("showdown-battle-core ai special system smoke ok");
}

function aiMaxGuardTargetSmoke() {
  const request: BattleServiceRequestV4 = {
    rqid: 11,
    targetable: true,
    active: [
      {
        moves: [
          {move: "Protect", id: "protect", pp: 6, maxpp: 16, target: "self"},
          {move: "Scald", id: "scald", pp: 14, maxpp: 24, target: "normal"},
          {move: "Attract", id: "attract", pp: 15, maxpp: 24, target: "normal"},
          {move: "Mirror Coat", id: "mirrorcoat", pp: 20, maxpp: 32, target: "scripted"},
        ],
        canDynamax: true,
        maxMoves: {
          maxMoves: [
            {move: "Max Guard", id: "maxguard", target: "self"},
            {move: "Max Geyser", id: "maxgeyser", target: "adjacentFoe"},
            {move: "Max Guard", id: "maxguard", target: "self"},
            {move: "Max Mindstorm", id: "maxmindstorm", target: "adjacentFoe"},
          ],
        },
      },
      null,
    ],
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {ident: "p2: Alomomola", details: "Alomomola, L48, M", condition: "55/466", active: true},
        {ident: "p2: Togedemaru", details: "Togedemaru, L48, F", condition: "0 fnt", active: true, fainted: true},
      ],
    },
  };
  const result = chooseAiBattleChoiceV4({
    request,
    snapshot: aiSnapshot("gen8", "doubles", request, ["max"]),
    playerId: "p2",
    aiProfile: {level: "champion", preference: "support"},
    rngSeed: "max-guard-target",
  });
  if (result.debug.topCandidates.some(candidate => candidate.choice.includes("move 3 max +"))) {
    throw new Error(`AI generated illegal target suffix for Max Guard: ${JSON.stringify(result.debug.topCandidates)}`);
  }
  console.log("showdown-battle-core ai max guard target smoke ok");
}

function aiForceSwitchSmoke() {
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
  const result = chooseAiBattleChoiceV4({
    request,
    snapshot: aiSnapshot("gen9", "doubles", request),
    playerId: "p2",
    aiProfile: {level: "elite", preference: "balanced"},
    rngSeed: "force-switch",
  });
  const choices = result.choice.split(",").map(part => part.trim());
  if (choices.length !== 2 || !choices.includes("switch 3") || !choices.includes("switch 4")) {
    throw new Error(`AI force switch should choose unique bench slots: ${result.choice}`);
  }
  console.log("showdown-battle-core ai force switch smoke ok");
}

async function randomTeamGeneratorSmoke() {
  const first = await generateShowdownRandomTeamV4({ruleSet: "gen9", mode: "singles", seed: "team-seed"});
  const second = await generateShowdownRandomTeamV4({ruleSet: "gen9", mode: "singles", seed: "team-seed"});
  if (!first.diagnostics.ok) throw new Error(`gen9 singles random team failed: ${first.diagnostics.messages.join("; ")}`);
  if (first.pokemonSets.length !== 6) throw new Error(`expected default 6 pokemon, got ${first.pokemonSets.length}`);
  if (first.packedTeam !== second.packedTeam) throw new Error("same seed should generate stable packed team");
  for (const set of first.pokemonSets) {
    if (!set.species || !set.ability || !set.nature || !set.level || !set.moves?.length) {
      throw new Error(`generated incomplete pokemon set: ${JSON.stringify(set)}`);
    }
  }
  if (!first.packedTeam || !first.exportedTeam) throw new Error("missing packed/exported team output");

  const cases: Array<[BattleServiceSessionInputV4["ruleSet"], BattleServiceSessionInputV4["mode"]]> = [
    ["gen9", "singles"],
    ["gen9", "doubles"],
    ["gen9", "coop"],
    ["gen8", "singles"],
    ["gen8", "doubles"],
    ["gen8", "coop"],
    ["gen7", "singles"],
    ["standard", "singles"],
  ];
  for (const [ruleSet, mode] of cases) {
    const result = await generateShowdownRandomTeamV4({ruleSet, mode, seed: `${ruleSet}-${mode}`});
    if (!result.diagnostics.ok) {
      throw new Error(`${ruleSet}/${mode} random team failed: ${result.diagnostics.messages.join("; ")}`);
    }
    if (!result.formatId || result.formatId !== resolveShowdownRandomTeamFormatV4(ruleSet, mode)) {
      throw new Error(`format mismatch for ${ruleSet}/${mode}: ${result.formatId}`);
    }
  }

  const unavailable = await generateShowdownRandomTeamV4({ruleSet: "gen7", mode: "doubles", seed: "gen7-doubles"});
  if (unavailable.diagnostics.ok || unavailable.pokemonSets.length || !unavailable.diagnostics.messages.length) {
    throw new Error(`gen7 doubles should return explicit unavailable diagnostics: ${JSON.stringify(unavailable)}`);
  }
  const gen7DoublesFallback = await generateShowdownRandomTeamV4({
    ruleSet: "gen7",
    mode: "doubles",
    formatOverride: "[Gen 7] Random Battle",
    seed: "gen7-doubles-fallback",
    teamSize: 6,
  });
  if (!gen7DoublesFallback.diagnostics.ok || gen7DoublesFallback.pokemonSets.length !== 6) {
    throw new Error(`gen7 doubles fallback should generate a full team: ${JSON.stringify(gen7DoublesFallback.diagnostics)}`);
  }
  if (gen7DoublesFallback.diagnostics.fallbackFormatId !== "[Gen 7] Random Battle") {
    throw new Error(`gen7 doubles fallback diagnostics missing format: ${JSON.stringify(gen7DoublesFallback.diagnostics)}`);
  }

  const allowedSpecies = ["pelipper", "torkoal", "tyranitar", "hatterene", "glimmora", "toxapex", "dragonite", "leafeon"];
  const filtered = await generateShowdownRandomTeamV4({
    ruleSet: "gen9",
    mode: "singles",
    seed: "filtered-team",
    teamSize: 3,
    pokemonFilter: {speciesIds: allowedSpecies},
  });
  if (!filtered.diagnostics.ok) throw new Error(`filtered team failed: ${filtered.diagnostics.messages.join("; ")}`);
  const allowed = new Set(allowedSpecies);
  if (!filtered.pokemonSets.every(set => allowed.has(String(set.species || "").toLowerCase().replace(/[^a-z0-9]+/g, "")))) {
    throw new Error(`filtered team leaked species outside pool: ${filtered.pokemonSets.map(set => set.species).join(", ")}`);
  }
  if (!filtered.diagnostics.pokemonFilter?.matchedSpeciesIds.length) throw new Error("missing pokemon filter diagnostics");

  const rain = await generateShowdownRandomTeamV4({
    ruleSet: "gen9",
    mode: "singles",
    seed: "rain-team",
    teamArchetype: "rain",
    archetypeAttempts: 8,
  });
  if (!rain.diagnostics.ok) throw new Error(`rain team failed: ${rain.diagnostics.messages.join("; ")}`);
  if (!rain.diagnostics.archetype || rain.diagnostics.archetype.bestScore <= 0 || rain.diagnostics.archetype.matchedPoolSize <= 0) {
    throw new Error(`rain archetype diagnostics missing score: ${JSON.stringify(rain.diagnostics.archetype)}`);
  }
  console.log("showdown-battle-core random team generator smoke ok");
}

function aiSnapshot(ruleSet: BattleServiceSessionInputV4["ruleSet"], mode: BattleServiceSessionInputV4["mode"], request: BattleServiceRequestV4, allowedSpecialSystems?: BattleServiceSnapshotV4["players"][number]["allowedSpecialSystems"]): BattleServiceSnapshotV4 {
  return {
    id: "ai-test-session",
    runId: "ai-test-run",
    nodeId: "ai-test-node",
    status: "running",
    mode,
    ruleSet,
    turn: 1,
    winner: null,
    error: null,
    players: [
      {playerId: "p1", name: "A", controller: "local", alliance: "near", team: [pikachu, eevee], draft: null as any},
      {playerId: "p2", name: "B", controller: "ai", alliance: "far", team: [pikachu, eevee], draft: null as any, allowedSpecialSystems},
    ],
    requests: {p2: request},
    active: [
      {ident: "p1a: Gyarados", playerId: "p1", slot: "p1a", species: "Gyarados", details: "Gyarados, L50", condition: "65/170", hp: 65, maxHp: 170, status: "", fainted: false},
      {ident: "p2a: Pikachu", playerId: "p2", slot: "p2a", species: "Pikachu", details: "Pikachu, L50", condition: "80/100", hp: 80, maxHp: 100, status: "", fainted: false},
    ],
    rawLog: [],
    debug: {inputLog: [], lastChoices: [], playerStreams: [], latestSidePokemon: {}, latestRequests: {}, latestMovePpByPokemon: {}, aiDecisions: []},
    createdAt: "2026-06-28T00:00:00.000Z",
    updatedAt: "2026-06-28T00:00:00.000Z",
  };
}

function showdownPlaybackTimelineSmoke() {
  const rawLog = [
    "|player|p1|A|",
    "|player|p2|B|",
    "|gametype|singles",
    "|gen|9",
    "|tier|[Gen 9] Custom Game",
    "|rated|",
    "|rule|Species Clause: Limit one of each Pokemon",
    "|rule|HP Percentage Mod: HP is shown in percentages",
    "|rule|Cancel Mod: Prevents moves from locking in",
    "|",
    "|t:|1782889410",
    "|switch|p1a: Raichu|Raichu, L50|100/100",
    "|switch|p2a: Fearow|Fearow, L50|100/100",
    "|turn|1",
    "|move|p1a: Raichu|Spark|p2a: Fearow",
    "|-supereffective|p2a: Fearow",
    "|-damage|p2a: Fearow|34/100",
    "|-enditem|p2a: Fearow|Oran Berry|[eat]",
    "|-heal|p2a: Fearow|44/100|[from] item: Oran Berry",
    "|move|p2a: Fearow|Pursuit|p1a: Raichu",
    "|-damage|p1a: Raichu|72/100",
    "|upkeep",
    "|turn|2",
  ];
  const timeline = compileShowdownPlaybackTimelineFromRawLog(rawLog, {sessionId: "timeline-smoke", previousIndex: 0});
  const signatures = timeline.groups.map(group => group.calls.map(call => call.kind === "otherAnim" ? `${call.kind}:${call.effect}` : call.kind).join("+"));
  const expected = ["switch", "switch", "turn", "move", "result+damage", "otherAnim:consume", "otherAnim:heal+heal", "move", "damage", "statbar+statbar", "turn"];
  for (let index = 0; index < expected.length; index += 1) {
    if (signatures[index] !== expected[index]) {
      throw new Error(`playback timeline group order mismatch at ${index}: expected=${expected[index]} actual=${signatures[index]}\n${timeline.groups.map(group => group.summary).join("\n")}`);
    }
  }
  const consumeGroup = timeline.groups.find(group => group.calls.some(call => call.kind === "otherAnim" && call.effect === "consume"));
  if (!consumeGroup || !consumeGroup.rawLines.some(line => line.includes("|-enditem|") && line.includes("[eat]"))) {
    throw new Error("enditem eat should compile to independent consume animation group");
  }
  const healGroup = timeline.groups.find(group => group.calls.some(call => call.kind === "otherAnim" && call.effect === "heal") && group.calls.some(call => call.kind === "heal"));
  if (!healGroup || !healGroup.rawLines.some(line => line.startsWith("|-heal|"))) {
    throw new Error("item heal should compile to other heal + heal animation group");
  }
  const weatherRawLog = [
    "|player|p1|A|",
    "|player|p2|B|",
    "|gametype|singles",
    "|gen|9",
    "|",
    "|switch|p1a: Raichu|Raichu, L50|100/100",
    "|switch|p2a: Fearow|Fearow, L50|100/100",
    "|turn|1",
    "|-weather|Hail",
    "|-fieldstart|move: Grassy Terrain",
    "|upkeep",
    "|turn|2",
  ];
  const weatherTimeline = compileShowdownPlaybackTimelineFromRawLog(weatherRawLog, {sessionId: "timeline-weather", previousIndex: 0});
  const weatherGroup = weatherTimeline.groups.find(group => group.rawLines.includes("|-weather|Hail"));
  if (!weatherGroup || !weatherGroup.calls.some(call => call.kind === "weatherUpdate" && call.method === "protocolWeather" && call.effect === "hail")) {
    throw new Error(`weather protocol line should compile to its own weather update group: ${JSON.stringify(weatherTimeline.groups)}`);
  }
  const fieldGroup = weatherTimeline.groups.find(group => group.rawLines.includes("|-fieldstart|move: Grassy Terrain"));
  if (!fieldGroup || !fieldGroup.calls.some(call => call.kind === "weatherUpdate" && call.method === "protocolField" && call.effect === "grassyterrain")) {
    throw new Error(`field protocol line should compile to its own field update group: ${JSON.stringify(weatherTimeline.groups)}`);
  }
  const upkeepIndex = weatherTimeline.groups.findIndex(group => group.rawLines.includes("|upkeep"));
  const weatherIndex = weatherTimeline.groups.indexOf(weatherGroup);
  const fieldIndex = weatherTimeline.groups.indexOf(fieldGroup);
  if (!(weatherIndex >= 0 && fieldIndex >= 0 && upkeepIndex >= 0 && weatherIndex < upkeepIndex && fieldIndex < upkeepIndex)) {
    throw new Error(`weather/field groups should appear before upkeep: ${weatherTimeline.groups.map(group => group.summary).join(" -> ")}`);
  }
  const increment = compileShowdownPlaybackTimelineFromRawLog(rawLog, {sessionId: "timeline-smoke", previousIndex: 17});
  if (increment.groups.some(group => group.rawIndices.some(index => index < 17))) {
    throw new Error(`previousIndex should only return increment groups: ${JSON.stringify(increment.groups.map(group => group.rawIndices))}`);
  }
  const dynamaxRawLog = [
    "|player|p1|A|",
    "|player|p2|B|",
    "|gametype|singles",
    "|gen|8",
    "|tier|[Gen 8] Custom Game",
    "|",
    "|switch|p1a: Lapras|Lapras, L50|100/100",
    "|switch|p2a: Lucario|Lucario, L50|100/100",
    "|turn|1",
    "|-start|p1a: Lapras|Dynamax|",
    "|-heal|p1a: Lapras|200/200|[silent]",
    "|move|p1a: Lapras|Max Geyser|p2a: Lucario",
    "|-damage|p2a: Lucario|10/100",
    "|upkeep",
    "|turn|2",
  ];
  const dynamaxTimeline = compileShowdownPlaybackTimelineFromRawLog(dynamaxRawLog, {sessionId: "timeline-dynamax", previousIndex: 0});
  const dynamaxSignatures = dynamaxTimeline.groups.map(group => group.calls.map(call => call.kind).join("+"));
  const transformIndex = dynamaxSignatures.findIndex(signature => signature.includes("transform"));
  const healIndex = dynamaxSignatures.findIndex(signature => signature.includes("heal"));
  const moveIndex = dynamaxSignatures.indexOf("move");
  if (transformIndex < 0 || healIndex < 0 || moveIndex < 0 || !(transformIndex < healIndex && healIndex < moveIndex)) {
    throw new Error(`dynamax transform should compile before heal and max move: ${dynamaxTimeline.groups.map(group => group.summary).join(" -> ")}`);
  }
  const transformGroup = dynamaxTimeline.groups[transformIndex]!;
  if (!transformGroup.rawLines.includes("|-start|p1a: Lapras|Dynamax|")) {
    throw new Error(`dynamax transform group should map raw line: ${JSON.stringify(transformGroup)}`);
  }
  const faintBeforeReplacementRawLog = [
    "|player|p1|A|",
    "|player|p2|B|",
    "|gametype|doubles",
    "|gen|8",
    "|tier|[Gen 8] Doubles Custom Game",
    "|clearpoke",
    "|poke|p1|Tropius, L50, M|",
    "|poke|p1|Mamoswine, L55, M|",
    "|poke|p2|Sigilyph, L50, M|",
    "|poke|p2|Gallade, L46, M|",
    "|poke|p2|Kingdra, L49, F|",
    "|teampreview",
    "|",
    "|teamsize|p1|2",
    "|teamsize|p2|3",
    "|start",
    "|switch|p1a: Tropius|Tropius, L50, M|175/175",
    "|switch|p1b: Mamoswine|Mamoswine, L55, M|208/208",
    "|switch|p2a: Sigilyph|Sigilyph, L50, M|149/149",
    "|switch|p2b: Gallade|Gallade, L46, M|125/125",
    "|turn|1",
    "|move|p1a: Tropius|Max Airstream|p2b: Gallade",
    "|-supereffective|p2b: Gallade",
    "|-damage|p2b: Gallade|0 fnt",
    "|faint|p2b: Gallade",
    "|upkeep",
    "|switch|p2b: Kingdra|Kingdra, L49, F|147/147",
    "|turn|2",
  ];
  const faintTimeline = compileShowdownPlaybackTimelineFromRawLog(faintBeforeReplacementRawLog, {sessionId: "timeline-faint-before-replacement", previousIndex: 0});
  const faintIndex = faintTimeline.groups.findIndex(group => group.calls.some(call => call.kind === "faint"));
  const replacementIndex = faintTimeline.groups.findIndex(group => group.rawLines.some(line => line.includes("|switch|p2b: Kingdra|")));
  if (faintIndex < 0 || replacementIndex < 0 || !(faintIndex < replacementIndex)) {
    throw new Error(`faint should compile before replacement switch: ${faintTimeline.groups.map(group => `${group.rawIndices.join(",") || "scene"} ${group.summary}`).join(" -> ")}`);
  }
  const faintGroup = faintTimeline.groups[faintIndex]!;
  if (!faintGroup.rawLines.includes("|faint|p2b: Gallade")) {
    throw new Error(`faint group should map raw faint line: ${JSON.stringify(faintGroup)}`);
  }
  console.log("showdown playback timeline smoke ok");
}

void smoke()
  .then(doublesSmoke)
  .then(permanentFormeChangeSmoke)
  .then(activeIdentityContinuitySmoke)
  .then(activeIdentityStressMatrixSmoke)
  .then(gen7CoopFormatSmoke)
  .then(rechargeChoiceSmoke)
  .then(faintedDoublesActiveChoiceSmoke)
  .then(allAdjacentDoublesTargetChoiceSmoke)
  .then(duplicateForceSwitchChoiceSmoke)
  .then(coopWinnerNameSmoke)
  .then(duplicateSpeciesDoublesSmoke)
  .then(initialStateSmoke)
  .then(residualStatusSmoke)
  .then(sleepCantMoveSmoke)
  .then(trainerItemSmoke)
  .then(trainerItemNoEffectSmoke)
  .then(trainerItemDoublesPlaceholderTargetSmoke)
  .then(rulesetSpecialSystemFilterSmoke)
  .then(specialSystemBagGateSmoke)
  .then(scriptAllyAutoChoiceSmoke)
  .then(showdownCommandReferenceSmoke)
  .then(showdownChoiceValidationSmoke)
  .then(activeMaxMoveTargetValidationSmoke)
  .then(humanInvalidChoicePreflightSmoke)
  .then(aiPureChoiceSmoke)
  .then(aiSpecialSystemSmoke)
  .then(aiMaxGuardTargetSmoke)
  .then(aiForceSwitchSmoke)
  .then(randomTeamGeneratorSmoke)
  .then(showdownPlaybackTimelineSmoke);
