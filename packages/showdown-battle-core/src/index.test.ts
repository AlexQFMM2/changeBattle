import {
  appendShowdownSpecialChoiceSuffixV4,
  chooseAiBattleChoiceV4,
  createBattleSession,
  filterShowdownChoiceForRuleSetV4,
  generateShowdownRandomTeamV4,
  parseShowdownChoiceCommandV4,
  randomLegalChoice,
  resolveShowdownRandomTeamFormatV4,
  submitChoice,
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

  const gen8 = chooseAiBattleChoiceV4({
    request: gen7Request,
    snapshot: aiSnapshot("gen8", "singles", gen7Request),
    playerId: "p2",
    aiProfile: {level: "champion", preference: "offense"},
    rngSeed: "gen8-filter",
  });
  if (gen8.debug.topCandidates.some(entry => entry.choice.includes("mega") || entry.choice.includes("zmove"))) {
    throw new Error(`AI leaked Gen7 special candidates in Gen8: ${JSON.stringify(gen8.debug.topCandidates)}`);
  }
  console.log("showdown-battle-core ai special system smoke ok");
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
  const transformIndex = dynamaxSignatures.indexOf("transform");
  const healIndex = dynamaxSignatures.findIndex(signature => signature.includes("heal"));
  const moveIndex = dynamaxSignatures.indexOf("move");
  if (transformIndex < 0 || healIndex < 0 || moveIndex < 0 || !(transformIndex < healIndex && healIndex < moveIndex)) {
    throw new Error(`dynamax transform should compile before heal and max move: ${dynamaxTimeline.groups.map(group => group.summary).join(" -> ")}`);
  }
  const transformGroup = dynamaxTimeline.groups[transformIndex]!;
  if (!transformGroup.rawLines.includes("|-start|p1a: Lapras|Dynamax|")) {
    throw new Error(`dynamax transform group should map raw line: ${JSON.stringify(transformGroup)}`);
  }
  console.log("showdown playback timeline smoke ok");
}

void smoke()
  .then(doublesSmoke)
  .then(rechargeChoiceSmoke)
  .then(faintedDoublesActiveChoiceSmoke)
  .then(duplicateForceSwitchChoiceSmoke)
  .then(duplicateSpeciesDoublesSmoke)
  .then(initialStateSmoke)
  .then(residualStatusSmoke)
  .then(sleepCantMoveSmoke)
  .then(rulesetSpecialSystemFilterSmoke)
  .then(specialSystemBagGateSmoke)
  .then(scriptAllyAutoChoiceSmoke)
  .then(showdownCommandReferenceSmoke)
  .then(aiPureChoiceSmoke)
  .then(aiSpecialSystemSmoke)
  .then(aiForceSwitchSmoke)
  .then(randomTeamGeneratorSmoke)
  .then(showdownPlaybackTimelineSmoke);
