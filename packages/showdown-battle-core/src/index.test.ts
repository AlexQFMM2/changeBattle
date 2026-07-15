import {
  appendShowdownSpecialChoiceSuffixV4,
  chooseAiBattleChoiceV4,
  createBattleSession,
  filterShowdownChoiceForRuleSetV4,
  generateShowdownRandomTeamV4,
  analyzeBattleAiTeamRolesV4,
  battleAiDamageBucketForEstimateV4,
  battleAiCapabilityForLevelV4,
  battleAiEffectiveSearchBudgetForModeV4,
  battleAiSearchBudgetForLevelV4,
  battleAiActsBeforeBySpeedV4,
  buildBattleAiSpeedFieldStateV4,
  buildBattleAiSpeedStateV4,
  estimateBattleAiActionOutcomeV4,
  evaluateBattleAiSinglesLeafValueV4,
  parseShowdownChoiceCommandV4,
  randomLegalChoice,
  resolveBattleWinnerPlayerIdV4,
  resolveShowdownRandomTeamFormatV4,
  showdownMoveNeedsExplicitTargetV4,
  normalizeShowdownChoiceRequestV4,
  applyPermanentFormeChange,
  __testApplyBattleProtocolLinesV4,
  submitTrainerItem,
  submitChoice,
  validateShowdownChoiceCommandV4,
  withShowdownMoveTargetSuffixV4,
} from "./index.js";
import {compileShowdownPlaybackTimelineFromRawLog} from "./playbackCompiler.js";
import {generateBattleAiSelfPlayQuestionsV4, renderBattleAiSelfPlayExamMarkdownV4, runBattleAiSelfPlayExamV4} from "./aiSelfPlayExamV4.js";
import type {BattleAiTeamArchetypeV4} from "./aiTeamRoleAnalyzerV4.js";
import type {BattleAiLevelV4, BattleAiPreferenceV4, BattleServiceRequestV4, BattleServiceSessionInputV4, BattleServiceSidePokemonV4, BattleServiceSnapshotV4} from "./types.js";

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
  const singlesMissingTargetRequest: BattleServiceRequestV4 = {
    targetable: false,
    active: [{moves: [{move: "Tackle", id: "tackle", pp: 35, maxpp: 35}]}],
    side: {id: "p1", name: "A", pokemon: [{ident: "p1: Eevee", details: "Eevee, L50", condition: "100/100", active: true}]},
  };
  const doublesMissingTargetRequest: BattleServiceRequestV4 = {
    targetable: true,
    active: [
      {moves: [{move: "Tackle", id: "tackle", pp: 35, maxpp: 35}]},
      {moves: [{move: "Recharge", id: "recharge"}]},
    ],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: Eevee", details: "Eevee, L50", condition: "100/100", active: true},
        {ident: "p1: Snorlax", details: "Snorlax, L50", condition: "100/100", active: true},
      ],
    },
  };
  const singlesMissingTarget = validateShowdownChoiceCommandV4({request: singlesMissingTargetRequest, choice: "move 1"});
  const doublesMissingTarget = validateShowdownChoiceCommandV4({request: doublesMissingTargetRequest, choice: "move 1, move 1"});
  const doublesWithTarget = validateShowdownChoiceCommandV4({request: doublesMissingTargetRequest, choice: "move 1 +1, move 1"});
  if (!singlesMissingTarget.ok) throw new Error(`singles missing target should use Showdown default target: ${JSON.stringify(singlesMissingTarget)}`);
  if (doublesMissingTarget.ok || (!doublesMissingTarget.ok && doublesMissingTarget.reason !== "missing-target")) {
    throw new Error(`doubles missing target should require explicit target: ${JSON.stringify(doublesMissingTarget)}`);
  }
  if (!doublesWithTarget.ok) throw new Error(`doubles missing target with explicit loc should pass: ${JSON.stringify(doublesWithTarget)}`);
  const reorderedSideRequest: BattleServiceRequestV4 = {
    targetable: true,
    active: [
      {moves: [{move: "Tackle", id: "tackle", pp: 35, maxpp: 35}]},
      {moves: [{move: "Recharge", id: "recharge"}]},
    ],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: Bench", details: "Bench, L50", condition: "100/100", active: false},
        {ident: "p1: Fainted", details: "Fainted, L50", condition: "0 fnt", active: false, fainted: true},
        {ident: "p1: Eevee", details: "Eevee, L50", condition: "100/100", active: true},
        {ident: "p1: Snorlax", details: "Snorlax, L50", condition: "100/100", active: true},
      ],
    },
  };
  const reorderedMove = validateShowdownChoiceCommandV4({request: reorderedSideRequest, choice: "move 1 +1, move 1"});
  const reorderedSwitch = validateShowdownChoiceCommandV4({request: reorderedSideRequest, choice: "switch 1, move 1"});
  const reorderedFaintedSwitch = validateShowdownChoiceCommandV4({request: reorderedSideRequest, choice: "switch 2, move 1"});
  if (!reorderedMove.ok) throw new Error(`reordered side active rows should still validate move request: ${JSON.stringify(reorderedMove)}`);
  if (!reorderedSwitch.ok) throw new Error(`reordered side should allow switch to bench row 1: ${JSON.stringify(reorderedSwitch)}`);
  if (reorderedFaintedSwitch.ok || (!reorderedFaintedSwitch.ok && reorderedFaintedSwitch.reason !== "invalid-switch")) {
    throw new Error(`reordered side should reject fainted bench switch: ${JSON.stringify(reorderedFaintedSwitch)}`);
  }
  const maybeTrappedRequest: BattleServiceRequestV4 = {
    targetable: false,
    active: [{maybeTrapped: true, moves: [{move: "Tackle", id: "tackle", pp: 35, maxpp: 35, target: "normal"}]}],
    side: {id: "p1", name: "A", pokemon: [
      {ident: "p1: Eevee", details: "Eevee, L50", condition: "100/100", active: true},
      {ident: "p1: Pikachu", details: "Pikachu, L50", condition: "100/100", active: false},
    ]},
  };
  const maybeTrappedSwitch = validateShowdownChoiceCommandV4({request: maybeTrappedRequest, choice: "switch 2"});
  if (!maybeTrappedSwitch.ok) throw new Error(`maybeTrapped should match Showdown Client and allow tentative switch: ${JSON.stringify(maybeTrappedSwitch)}`);
  const teamPreviewRequest: BattleServiceRequestV4 = {
    teamPreview: true,
    chosenTeamSize: 2,
    side: {id: "p1", name: "A", pokemon: [
      {ident: "p1: A", details: "A, L50", condition: "100/100"},
      {ident: "p1: B", details: "B, L50", condition: "100/100"},
      {ident: "p1: C", details: "C, L50", condition: "100/100"},
    ]},
  };
  const teamOk = validateShowdownChoiceCommandV4({request: teamPreviewRequest, choice: "team 1, 2"});
  const teamWrongCount = validateShowdownChoiceCommandV4({request: teamPreviewRequest, choice: "team 1, 2, 3"});
  const teamDuplicate = validateShowdownChoiceCommandV4({request: teamPreviewRequest, choice: "team 1, 1"});
  if (!teamOk.ok) throw new Error(`team preview expected size should validate: ${JSON.stringify(teamOk)}`);
  if (teamWrongCount.ok || (!teamWrongCount.ok && teamWrongCount.reason !== "wrong-choice-count")) {
    throw new Error(`team preview should reject wrong count: ${JSON.stringify(teamWrongCount)}`);
  }
  if (teamDuplicate.ok || (!teamDuplicate.ok && teamDuplicate.reason !== "duplicate-switch")) {
    throw new Error(`team preview should reject duplicate slots: ${JSON.stringify(teamDuplicate)}`);
  }
  const rawFixRequest: BattleServiceRequestV4 = {
    active: [
      {moves: [{move: "Tackle", id: "tackle", pp: 35, maxpp: 35}]},
      {moves: [{move: "Recharge", id: "recharge"}]},
    ],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: Bench", details: "Bench, L50", condition: "100/100", active: false},
        {ident: "p1: Fainted", details: "Fainted, L50", condition: "0 fnt", active: false, fainted: true},
        {ident: "p1: Eevee", details: "Eevee, L50", condition: "100/100", active: true},
        {ident: "p1: Snorlax", details: "Snorlax, L50", condition: "100/100", active: true},
      ],
    },
  };
  const fixed = normalizeShowdownChoiceRequestV4(rawFixRequest);
  if (!fixed?.targetable || fixed.requestType !== "move") throw new Error(`fixRequest should infer move targetable: ${JSON.stringify(fixed)}`);
  if (fixed.activeSidePokemon?.[0]?.ident !== "p1: Eevee" || fixed.activeTeamIndexes?.join(",") !== "2,3") {
    throw new Error(`fixRequest should align active rows by row.active: ${JSON.stringify(fixed)}`);
  }
  if (fixed.active?.[0]?.moves?.[0]?.target !== "normal") {
    throw new Error(`fixRequest should default missing move target to normal: ${JSON.stringify(fixed.active?.[0])}`);
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

function showdownChoicePressureMatrixSmoke() {
  const doublesBaseSide: BattleServiceRequestV4["side"] = {
    id: "p1",
    name: "A",
    pokemon: [
      {ident: "p1: Alpha", details: "Alpha, L50", condition: "100/100", active: true},
      {ident: "p1: Beta", details: "Beta, L50", condition: "100/100", active: true},
      {ident: "p1: Gamma", details: "Gamma, L50", condition: "100/100", active: false},
      {ident: "p1: Fainted", details: "Fainted, L50", condition: "0 fnt", active: false, fainted: true},
    ],
  };
  const targetMatrixRequest: BattleServiceRequestV4 = {
    targetable: true,
    active: [
      {moves: [
        {move: "Tackle", id: "tackle", pp: 35, maxpp: 35, target: "normal"},
        {move: "Heal Pulse", id: "healpulse", pp: 10, maxpp: 16, target: "adjacentAlly"},
        {move: "Acupressure", id: "acupressure", pp: 20, maxpp: 30, target: "adjacentAllyOrSelf"},
        {move: "Protect", id: "protect", pp: 10, maxpp: 16, target: "self"},
      ]},
      {moves: [
        {move: "Aura Sphere", id: "aurasphere", pp: 14, maxpp: 24, target: "any"},
        {move: "Heat Wave", id: "heatwave", pp: 10, maxpp: 16, target: "allAdjacentFoes"},
        {move: "Earthquake", id: "earthquake", pp: 10, maxpp: 16, target: "allAdjacent"},
        {move: "Rain Dance", id: "raindance", pp: 5, maxpp: 8, target: "all"},
      ]},
    ],
    side: doublesBaseSide,
  };
  const targetCases: Array<{choice: string; ok: boolean; reason?: string}> = [
    {choice: "move 1 +1, move 4", ok: true},
    {choice: "move 1 +2, move 4", ok: true},
    {choice: "move 1 -2, move 4", ok: true},
    {choice: "move 1 -1, move 4", ok: false, reason: "invalid-target"},
    {choice: "move 2 -2, move 4", ok: true},
    {choice: "move 2 -1, move 4", ok: false, reason: "invalid-target"},
    {choice: "move 3 -1, move 4", ok: true},
    {choice: "move 3 -2, move 4", ok: true},
    {choice: "move 4 +1, move 4", ok: false, reason: "forbidden-target"},
    {choice: "move 1 +1, move 1 +2", ok: true},
    {choice: "move 1 +1, move 1 -1", ok: true},
    {choice: "move 1 +1, move 1 -2", ok: false, reason: "invalid-target"},
    {choice: "move 1 +1, move 2 +1", ok: false, reason: "forbidden-target"},
    {choice: "move 1 +1, move 3 +1", ok: false, reason: "forbidden-target"},
  ];
  for (const entry of targetCases) {
    expectChoiceValidation("target-matrix", targetMatrixRequest, entry.choice, entry.ok, entry.reason);
  }
  expectGeneratedChoiceValid("target-matrix-fallback", targetMatrixRequest, randomLegalChoice(targetMatrixRequest));
  const targetAi = chooseAiBattleChoiceV4({playerId: "p2", request: targetMatrixRequest, snapshot: aiSnapshot("gen9", "doubles", targetMatrixRequest), rngSeed: "pressure-target-matrix"});
  expectGeneratedChoiceValid("target-matrix-ai", targetMatrixRequest, targetAi.choice);

  const specialRequest: BattleServiceRequestV4 = {
    targetable: true,
    active: [
      {
        moves: [
          {move: "Thunderbolt", id: "thunderbolt", pp: 15, maxpp: 15, target: "normal"},
          {move: "Protect", id: "protect", pp: 10, maxpp: 10, target: "self"},
        ],
        canZMove: [
          {move: "Gigavolt Havoc", id: "gigavolthavoc", target: "normal"},
          null,
        ],
        maxMoves: {
          maxMoves: [
            {move: "Max Lightning", id: "maxlightning", target: "adjacentFoe"},
            {move: "Max Guard", id: "maxguard", target: "self"},
          ],
        },
        canDynamax: true,
      },
      {moves: [{move: "Recharge", id: "recharge"}]},
    ],
    side: doublesBaseSide,
  };
  const specialCases: Array<{choice: string; ok: boolean; reason?: string}> = [
    {choice: "move 1 zmove +1, move 1", ok: true},
    {choice: "move 1 zmove, move 1", ok: false, reason: "missing-target"},
    {choice: "move 2 max, move 1", ok: true},
    {choice: "move 2 max +1, move 1", ok: false, reason: "forbidden-target"},
    {choice: "move 1 max +2, move 1", ok: true},
  ];
  for (const entry of specialCases) {
    expectChoiceValidation("special-matrix", specialRequest, entry.choice, entry.ok, entry.reason);
  }
  expectGeneratedChoiceValid("special-matrix-fallback", specialRequest, randomLegalChoice(specialRequest));

  const forcedAndDisabledRequest: BattleServiceRequestV4 = {
    targetable: true,
    active: [
      {moves: [{move: "Bounce", id: "bounce"}]},
      {moves: [
        {move: "Tackle", id: "tackle", pp: 0, maxpp: 35, target: "normal"},
        {move: "Protect", id: "protect", pp: 10, maxpp: 16, target: "self"},
      ]},
    ],
    side: doublesBaseSide,
  };
  expectChoiceValidation("forced-no-target", forcedAndDisabledRequest, "move 1, move 2", true);
  expectChoiceValidation("forced-target-forbidden", forcedAndDisabledRequest, "move 1 +1, move 2", false, "forbidden-target");
  expectChoiceValidation("disabled-pp", forcedAndDisabledRequest, "move 1, move 1 +1", false, "disabled-move");
  expectGeneratedChoiceValid("forced-disabled-fallback", forcedAndDisabledRequest, randomLegalChoice(forcedAndDisabledRequest));

  const reorderedSwitchRequest: BattleServiceRequestV4 = {
    targetable: true,
    active: [
      {moves: [{move: "Tackle", id: "tackle", pp: 35, maxpp: 35}]},
      {moves: [{move: "Recharge", id: "recharge"}]},
    ],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: BenchA", details: "BenchA, L50", condition: "100/100", active: false},
        {ident: "p1: ActiveA", details: "ActiveA, L50", condition: "100/100", active: true},
        {ident: "p1: BenchB", details: "BenchB, L50", condition: "100/100", active: false},
        {ident: "p1: ActiveB", details: "ActiveB, L50", condition: "100/100", active: true},
      ],
    },
  };
  expectChoiceValidation("reordered-switch-bench-a", reorderedSwitchRequest, "switch 1, move 1", true);
  expectChoiceValidation("reordered-switch-active-a", reorderedSwitchRequest, "switch 2, move 1", false, "invalid-switch");
  expectChoiceValidation("reordered-switch-bench-b", reorderedSwitchRequest, "switch 3, move 1", true);
  expectChoiceValidation("reordered-switch-active-b", reorderedSwitchRequest, "switch 4, move 1", false, "invalid-switch");
  expectGeneratedChoiceValid("reordered-switch-fallback", reorderedSwitchRequest, randomLegalChoice(reorderedSwitchRequest));

  const forceSwitchRequest: BattleServiceRequestV4 = {
    forceSwitch: [true, true],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: ActiveA", details: "ActiveA, L50", condition: "0 fnt", active: true, fainted: true},
        {ident: "p1: ActiveB", details: "ActiveB, L50", condition: "0 fnt", active: true, fainted: true},
        {ident: "p1: BenchA", details: "BenchA, L50", condition: "100/100", active: false},
        {ident: "p1: BenchB", details: "BenchB, L50", condition: "100/100", active: false},
        {ident: "p1: BenchFainted", details: "BenchFainted, L50", condition: "0 fnt", active: false, fainted: true},
      ],
    },
  };
  expectChoiceValidation("force-switch-unique", forceSwitchRequest, "switch 3, switch 4", true);
  expectChoiceValidation("force-switch-duplicate", forceSwitchRequest, "switch 3, switch 3", false, "duplicate-switch");
  expectChoiceValidation("force-switch-fainted", forceSwitchRequest, "switch 5, switch 4", false, "invalid-switch");
  expectGeneratedChoiceValid("force-switch-fallback", forceSwitchRequest, randomLegalChoice(forceSwitchRequest));

  const teamPreviewRequest: BattleServiceRequestV4 = {
    teamPreview: true,
    chosenTeamSize: 3,
    side: {id: "p1", name: "A", pokemon: [
      {ident: "p1: A", details: "A, L50", condition: "100/100"},
      {ident: "p1: B", details: "B, L50", condition: "100/100"},
      {ident: "p1: C", details: "C, L50", condition: "100/100"},
      {ident: "p1: D", details: "D, L50", condition: "100/100"},
    ]},
  };
  expectChoiceValidation("team-preview-ok", teamPreviewRequest, "team 4, 2, 1", true);
  expectChoiceValidation("team-preview-short", teamPreviewRequest, "team 1, 2", false, "wrong-choice-count");
  expectChoiceValidation("team-preview-duplicate", teamPreviewRequest, "team 1, 2, 1", false, "duplicate-switch");
  expectGeneratedChoiceValid("team-preview-fallback", teamPreviewRequest, randomLegalChoice(teamPreviewRequest));

  const trainerItemPlaceholderChoice = "pass, move 1";
  expectChoiceValidation("trainer-item-placeholder", forcedAndDisabledRequest, trainerItemPlaceholderChoice, false, "parse-error");
  console.log("showdown-battle-core choice pressure matrix smoke ok");
}

function expectChoiceValidation(label: string, request: BattleServiceRequestV4, choice: string, ok: boolean, reason?: string): void {
  const result = validateShowdownChoiceCommandV4({request, choice});
  if (result.ok !== ok || (!result.ok && reason && result.reason !== reason)) {
    throw new Error(`${label} choice validation mismatch for ${choice}: ${JSON.stringify(result)}`);
  }
}

function expectGeneratedChoiceValid(label: string, request: BattleServiceRequestV4, choice: string): void {
  const result = validateShowdownChoiceCommandV4({request, choice});
  if (!choice || !result.ok) {
    throw new Error(`${label} generated invalid choice: ${choice}; ${JSON.stringify(result)}`);
  }
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
  const team = [
    {...pikachu, pokeball: "pokeball"},
    {...pikachu, pokeball: "greatball"},
    {...pikachu, name: "Raichu", species: "Raichu", pokeball: "ultraball"},
    {...eevee, name: "Jolteon", species: "Jolteon", pokeball: "masterball"},
  ];
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
  if (afterDetailsKey !== "p1:masterball") {
    throw new Error(`detailschange should canonicalize roster key to playerId:pokeball: ${afterDetailsKey}`);
  }
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
  if (greninjaKey !== "p1:masterball") {
    throw new Error(`greninja key should be canonical playerId:pokeball, got ${greninjaKey}`);
  }

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

  const canonicalGreninja = rosterEntry(current, "p1:masterball");
  if (!canonicalGreninja) throw new Error(`canonical greninja roster missing before legacy migration test: ${JSON.stringify(current.battleRosterByPlayer?.p1)}`);
  const legacySnapshot = withRows({
    ...current,
    battleRosterByPlayer: {
      ...current.battleRosterByPlayer,
      p1: {
        pokemonByKey: {
          "formal-p1-4-greninja": {...canonicalGreninja, key: "formal-p1-4-greninja"},
        },
        activeKeyBySlot: {p1a: "formal-p1-4-greninja"},
        lastPokemonKeyBySlot: {},
        updatedAt: "2026-07-12T00:00:00.000Z",
      },
    },
  }, activeRows.reorderedReturn);
  const migrated = __testApplyBattleProtocolLinesV4(legacySnapshot, ["|switch|p1a: Greninja|Greninja-Mega, L50, M|77/151"]);
  if (migrated.battleRosterByPlayer?.p1?.activeKeyBySlot?.p1a !== "p1:masterball") {
    throw new Error(`legacy localPokemonId roster key should migrate to canonical key: ${JSON.stringify(migrated.battleRosterByPlayer?.p1)}`);
  }
  if (migrated.battleRosterByPlayer?.p1?.pokemonByKey?.["formal-p1-4-greninja"]) {
    throw new Error(`legacy roster key should be removed after migration: ${JSON.stringify(migrated.battleRosterByPlayer?.p1)}`);
  }

  console.log("showdown-battle-core active identity stress matrix smoke ok");
}

async function showdownLikeSwitchResolverSmoke() {
  const baseSnapshot: BattleServiceSnapshotV4 = {
    id: "switch-resolver-session",
    runId: "test-run",
    nodeId: "test-node-switch-resolver",
    status: "running",
    mode: "doubles",
    ruleSet: "gen9",
    turn: 4,
    winner: null,
    error: null,
    players: [{
      playerId: "p2",
      name: "B",
      controller: "ai",
      alliance: "far",
      team: [],
      draft: trainerItemDraft("p2", []) as any,
      teamMapping: [
        {playerId: "p2", teamIndex: 0, choiceIndex: 1, localPokemonId: "p2-npc-1-throh", showdownIdentityToken: "duskball", showdownId: "duskball", pokeballId: "duskball", speciesId: "throh", displayName: "Throh"},
        {playerId: "p2", teamIndex: 1, choiceIndex: 2, localPokemonId: "p2-npc-2-chatot", showdownIdentityToken: "luxuryball", showdownId: "luxuryball", pokeballId: "luxuryball", speciesId: "chatot", displayName: "Chatot"},
        {playerId: "p2", teamIndex: 2, choiceIndex: 3, localPokemonId: "p2-npc-3-aerodactyl", showdownIdentityToken: "premierball", showdownId: "premierball", pokeballId: "premierball", speciesId: "aerodactyl", displayName: "Aerodactyl"},
        {playerId: "p2", teamIndex: 3, choiceIndex: 4, localPokemonId: "p2-npc-4-stunfisk", showdownIdentityToken: "healball", showdownId: "healball", pokeballId: "healball", speciesId: "stunfisk", displayName: "Stunfisk"},
      ],
    }],
    requests: {},
    active: [],
    battleRosterByPlayer: {},
    rawLog: [],
    debug: {inputLog: [], lastChoices: [], playerStreams: [], latestSidePokemon: {}, latestRequests: {}, latestMovePpByPokemon: {}, aiDecisions: []},
    createdAt: "2026-07-12T00:00:00.000Z",
    updatedAt: "2026-07-12T00:00:00.000Z",
  };
  const withLatestRows = (snapshot: BattleServiceSnapshotV4, rows: BattleServiceSidePokemonV4[]): BattleServiceSnapshotV4 => ({
    ...snapshot,
    requests: {
      ...snapshot.requests,
      p2: {
        active: [
          {moves: [{move: "Poison Jab", id: "poisonjab", target: "normal"}]},
          {moves: [{move: "Bounce", id: "bounce"}]},
        ],
        side: {id: "p2", name: "B", pokemon: rows},
      },
    },
    debug: {...snapshot.debug, latestSidePokemon: {...snapshot.debug.latestSidePokemon, p2: rows}},
  });
  const chatotRows: BattleServiceSidePokemonV4[] = [
    {ident: "p2: Throh", details: "Throh, L49, M", condition: "192/192", active: true, pokeball: "duskball"},
    {ident: "p2: Chatot", details: "Chatot, L49, F", condition: "99/99", active: true, pokeball: "luxuryball"},
    {ident: "p2: Aerodactyl", details: "Aerodactyl, L49, M", condition: "0 fnt", active: false, fainted: true, pokeball: "premierball"},
    {ident: "p2: Stunfisk", details: "Stunfisk, L49, M", condition: "183/183", active: false, pokeball: "healball"},
  ];
  let current = withLatestRows(baseSnapshot, chatotRows);
  current = __testApplyBattleProtocolLinesV4(current, [
    "|switch|p2a: Throh|Throh, L49, M|192/192",
    "|switch|p2b: Chatot|Chatot, L49, F|99/99",
    "|faint|p2b: Chatot",
  ]);
  const chatotKey: string = current.battleRosterByPlayer?.p2?.lastPokemonKeyBySlot?.p2b || "";
  if (chatotKey !== "p2:luxuryball") {
    throw new Error(`fainted chatot should be remembered as lastPokemon with canonical playerId:pokeball, got ${chatotKey}`);
  }
  const stunfiskRows = chatotRows.map(row => row.ident.includes("Chatot")
    ? {...row, active: false, condition: "0 fnt", fainted: true}
    : row.ident.includes("Stunfisk")
      ? {...row, active: true}
      : row);
  current = withLatestRows(current, stunfiskRows);
  current = __testApplyBattleProtocolLinesV4(current, ["|switch|p2b: Stunfisk|Stunfisk, L49, M|183/183"]);
  const p2b = current.active.find(active => active.slot === "p2b");
  if (p2b?.localPokemonId !== "p2-npc-4-stunfisk" || p2b.showdownIdentityToken !== "healball") {
    throw new Error(`stunfisk should not inherit chatot identity: ${JSON.stringify(p2b)}`);
  }
  const stunfiskKey = current.battleRosterByPlayer?.p2?.activeKeyBySlot?.p2b || "";
  const reusedChatotKey = stunfiskKey === chatotKey;
  if (stunfiskKey !== "p2:healball") {
    throw new Error(`stunfisk key should be canonical playerId:pokeball: ${JSON.stringify(current.battleRosterByPlayer?.p2)}`);
  }
  if (reusedChatotKey) {
    throw new Error(`stunfisk should not reuse chatot roster key: ${JSON.stringify(current.battleRosterByPlayer?.p2)}`);
  }
  if (!current.battleRosterByPlayer?.p2?.lastPokemonKeyBySlot?.p2b) {
    throw new Error(`switch should remember last pokemon until upkeep: ${JSON.stringify(current.battleRosterByPlayer?.p2)}`);
  }
  current = __testApplyBattleProtocolLinesV4(current, ["|upkeep"]);
  if (Object.keys(current.battleRosterByPlayer?.p2?.lastPokemonKeyBySlot || {}).length) {
    throw new Error(`upkeep should clear last pokemon protection like Showdown Client: ${JSON.stringify(current.battleRosterByPlayer?.p2)}`);
  }

  const staleAerodactylRows: BattleServiceSidePokemonV4[] = [
    {ident: "p2: Aerodactyl", details: "Aerodactyl, L49, F", condition: "0 fnt", active: true, fainted: true, pokeball: "premierball"},
    {ident: "p2: Chatot", details: "Chatot, L49, F", condition: "149/149", active: true, pokeball: "luxuryball"},
    {ident: "p2: Throh", details: "Throh, L49, M", condition: "192/192", active: false, pokeball: "duskball"},
    {ident: "p2: Stunfisk", details: "Stunfisk, L49, F", condition: "183/183", active: false, pokeball: "healball"},
  ];
  const staleSwitch = __testApplyBattleProtocolLinesV4(withLatestRows(baseSnapshot, staleAerodactylRows), [
    "|switch|p2a: Aerodactyl|Aerodactyl, L49, F|158/158",
    "|detailschange|p2a: Aerodactyl|Aerodactyl-Mega, L49, F",
    "|faint|p2a: Aerodactyl",
    "|detailschange|p2: Aerodactyl|Aerodactyl, L49, F|[silent]",
    "|switch|p2a: Stunfisk|Stunfisk, L49, F|183/183",
  ]);
  const staleP2a = staleSwitch.active.find(active => active.slot === "p2a");
  if (staleP2a?.species !== "Stunfisk" || staleP2a.pokeball !== "healball" || staleP2a.localPokemonId !== "p2-npc-4-stunfisk") {
    throw new Error(`stale active request row must not make Stunfisk inherit Aerodactyl identity: ${JSON.stringify(staleP2a)}`);
  }
  const staleP2aKey = staleSwitch.battleRosterByPlayer?.p2?.activeKeyBySlot?.p2a || "";
  if (staleP2aKey !== "p2:healball") {
    throw new Error(`stale switch should resolve inactive Stunfisk row by pokeball like Showdown getSwitchedPokemon: ${JSON.stringify(staleSwitch.battleRosterByPlayer?.p2)}`);
  }
  const staleAerodactyl = staleSwitch.battleRosterByPlayer?.p2?.pokemonByKey?.["p2:premierball"];
  if (staleAerodactyl?.details !== "Aerodactyl, L49, F" || staleSwitch.active.find(active => active.slot === "p2a")?.species !== "Stunfisk") {
    throw new Error(`inactive silent detailschange should update inactive Aerodactyl only and leave active Stunfisk intact: ${JSON.stringify(staleSwitch.battleRosterByPlayer?.p2)}`);
  }

  const duplicateSnapshot = __testApplyBattleProtocolLinesV4({
    ...baseSnapshot,
    players: [{...baseSnapshot.players[0]!, teamMapping: []}],
    debug: {...baseSnapshot.debug, latestSidePokemon: {}},
  }, [
    "|switch|p2a: Rotom|Rotom, L50|100/100",
    "|switch|p2b: Rotom|Rotom, L50|100/100",
    "|switch|p2a: Rotom|Rotom, L50|100/100",
  ]);
  const p2aKey = duplicateSnapshot.battleRosterByPlayer?.p2?.activeKeyBySlot?.p2a || "";
  const p2bKey = duplicateSnapshot.battleRosterByPlayer?.p2?.activeKeyBySlot?.p2b || "";
  if (!p2aKey.startsWith("protocol:p2:") || !p2bKey.startsWith("protocol:p2:") || p2aKey === p2bKey) {
    throw new Error(`duplicate unresolved pokemon should use distinct protocol keys: ${JSON.stringify(duplicateSnapshot.battleRosterByPlayer?.p2)}`);
  }
  console.log("showdown-battle-core showdown-like switch resolver smoke ok");
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

function aiLockedMoveMissingTargetSmoke() {
  const request: BattleServiceRequestV4 = {
    rqid: 33,
    targetable: true,
    active: [
      {
        moves: [
          {move: "Poison Jab", id: "poisonjab", pp: 20, maxpp: 20, target: "normal"},
          {move: "Dig", id: "dig", pp: 10, maxpp: 10, target: "normal"},
          {move: "Helping Hand", id: "helpinghand", pp: 20, maxpp: 20, target: "adjacentAlly"},
          {move: "Focus Punch", id: "focuspunch", pp: 20, maxpp: 20, target: "normal"},
        ],
      },
      {
        trapped: true,
        moves: [
          {id: "dig"},
        ],
      },
    ],
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {ident: "p2: Throh", details: "Throh, L50", condition: "83/180", active: true},
        {ident: "p2: Stunfisk", details: "Stunfisk, L50", condition: "183/183", active: true, pokeball: "healball"},
        {ident: "p2: Aerodactyl", details: "Aerodactyl, L50", condition: "0 fnt", active: false, fainted: true},
        {ident: "p2: Chatot", details: "Chatot, L50", condition: "0 fnt", active: false, fainted: true, pokeball: "luxuryball"},
      ],
    },
  };
  const result = chooseAiBattleChoiceV4({
    request,
    snapshot: aiSnapshot("gen9", "doubles", request),
    playerId: "p2",
    aiProfile: {level: "elite", preference: "balanced"},
    rngSeed: "locked-bounce-missing-target",
  });
  const validation = validateShowdownChoiceCommandV4({request, choice: result.choice});
  if (!validation.ok) throw new Error(`AI locked missing-target choice should validate: ${result.choice}; ${JSON.stringify(validation)}; ${JSON.stringify(result.debug)}`);
  const forcedWithTarget = validateShowdownChoiceCommandV4({request, choice: "move 1 +1, move 1 +1"});
  if (forcedWithTarget.ok) {
    throw new Error("server-forced Dig should reject manual target suffix");
  }
  const forcedWithoutTarget = validateShowdownChoiceCommandV4({request, choice: "move 1 +1, move 1"});
  if (!forcedWithoutTarget.ok) {
    throw new Error(`server-forced Dig should accept bare move: ${JSON.stringify(forcedWithoutTarget)}`);
  }
  if (/,\s*move 1\s+[+-]\d/.test(result.choice)) {
    throw new Error(`AI should not append a target to server-forced Dig: ${result.choice}`);
  }
  console.log("showdown-battle-core ai locked missing-target smoke ok");
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

function aiDexDamageEvaluatorSmoke() {
  const request: BattleServiceRequestV4 = {
    rqid: 41,
    active: [
      {
        moves: [
          {move: "Ice Beam", id: "icebeam", pp: 10, maxpp: 10, target: "normal"},
          {move: "Knock Off", id: "knockoff", pp: 20, maxpp: 20, target: "normal"},
          {move: "Stone Edge", id: "stoneedge", pp: 5, maxpp: 5, target: "normal"},
        ],
      },
    ],
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {
          ident: "p2: Tyranitar",
          details: "Tyranitar, L50",
          condition: "180/180",
          active: true,
          ability: "Sand Force",
          item: "",
          stats: {hp: 180, atk: 186, def: 130, spa: 115, spd: 120, spe: 81},
        },
      ],
    },
  };
  const snapshot = {
    ...aiSnapshot("gen9", "singles", request),
    active: [
      {ident: "p1a: Ceruledge", playerId: "p1", slot: "p1a", species: "Ceruledge", details: "Ceruledge, L50", condition: "120/150", hp: 120, maxHp: 150, status: "", fainted: false},
      {ident: "p2a: Tyranitar", playerId: "p2", slot: "p2a", species: "Tyranitar", details: "Tyranitar, L50", condition: "180/180", hp: 180, maxHp: 180, status: "", fainted: false},
    ],
  } satisfies BattleServiceSnapshotV4;
  const expectedEffectiveDepth: Record<"gymLeader" | "eliteFour" | "champion", number> = {
    gymLeader: 2,
    eliteFour: 4,
    champion: 6,
  };
  for (const level of ["gymLeader", "eliteFour", "champion"] satisfies BattleAiLevelV4[]) {
    const result = chooseAiBattleChoiceV4({
      request,
      snapshot,
      playerId: "p2",
      aiProfile: {level, preference: "offense"},
      rngSeed: `tyranitar-ceruledge-${level}`,
      timeBudgetMs: 10_000,
    });
    if (!result.debug.search || result.debug.search.strategy !== "numeric-guard") {
      throw new Error(`${level} AI should include numeric guard search debug: ${JSON.stringify(result.debug)}`);
    }
    if (result.debug.search.maxDepth !== expectedEffectiveDepth[level]) {
      throw new Error(`${level} AI search budget should expose singles effective depth: ${JSON.stringify(result.debug.search)}`);
    }
    if (result.debug.selectedChoice.startsWith("move 1")) {
      throw new Error(`${level} AI should not choose Ice Beam into Ceruledge: ${JSON.stringify(result.debug)}`);
    }
    const ice = result.debug.topCandidates.find(entry => entry.diagnostics?.moveId === "icebeam");
    const best = result.debug.topCandidates[0];
    if (!ice || Number(ice.diagnostics?.typeMultiplier) >= 1) {
      throw new Error(`Ice Beam should be diagnosed as resisted: ${JSON.stringify(result.debug.topCandidates)}`);
    }
    if (!best || !["knockoff", "stoneedge"].includes(String(best.diagnostics?.moveId || ""))) {
      throw new Error(`AI should rank Knock Off or Stone Edge above Ice Beam: ${JSON.stringify(result.debug.topCandidates)}`);
    }
  }
  console.log("showdown-battle-core ai dex damage evaluator smoke ok");
}

function aiSinglesDepth2SearchSmoke() {
  const aiRequest: BattleServiceRequestV4 = {
    rqid: 61,
    active: [
      {
        moves: [
          {move: "Thunderbolt", id: "thunderbolt", pp: 15, maxpp: 15, target: "normal"},
          {move: "Quick Attack", id: "quickattack", pp: 30, maxpp: 30, target: "normal"},
          {move: "Protect", id: "protect", pp: 10, maxpp: 10, target: "self"},
        ],
      },
    ],
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {
          ident: "p2: Pikachu",
          details: "Pikachu, L50",
          condition: "80/100",
          active: true,
          ability: "Static",
          item: "Light Ball",
          stats: {hp: 100, atk: 75, def: 55, spa: 95, spd: 65, spe: 110},
        },
      ],
    },
  };
  const foeRequest: BattleServiceRequestV4 = {
    rqid: 61,
    active: [
      {
        moves: [
          {move: "Waterfall", id: "waterfall", pp: 15, maxpp: 15, target: "normal"},
          {move: "Splash", id: "splash", pp: 40, maxpp: 40, target: "self"},
        ],
      },
    ],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {
          ident: "p1: Gyarados",
          details: "Gyarados, L50",
          condition: "65/170",
          active: true,
          ability: "Intimidate",
          item: "",
          stats: {hp: 170, atk: 145, def: 95, spa: 70, spd: 120, spe: 101},
        },
      ],
    },
  };
  const snapshot = {
    ...aiSnapshot("gen9", "singles", aiRequest),
    requests: {p1: foeRequest, p2: aiRequest},
  } satisfies BattleServiceSnapshotV4;
  const result = chooseAiBattleChoiceV4({
    request: aiRequest,
    snapshot,
    playerId: "p2",
    aiProfile: {level: "gymLeader", preference: "offense"},
    rngSeed: "singles-depth-2",
    timeBudgetMs: 10_000,
  });
  if (result.debug.search?.strategy !== "minimax" || result.debug.search.searchedDepth !== 2) {
    throw new Error(`singles depth 2 should enter minimax search: ${JSON.stringify(result.debug.search)}`);
  }
  if (!result.debug.search.principalVariation?.length || !result.debug.search.replyCount || result.debug.search.replyCount < 1) {
    throw new Error(`singles depth 2 should report principal variation and replies: ${JSON.stringify(result.debug.search)}`);
  }
  if (!result.debug.search.valueBreakdown || !Number.isFinite(result.debug.search.valueBreakdown.activeHp)) {
    throw new Error(`singles depth 2 should report value function breakdown: ${JSON.stringify(result.debug.search)}`);
  }
  if (!result.debug.search.outcomeBuckets?.some(entry => entry.choice === result.choice && entry.buckets.includes("ko"))) {
    throw new Error(`singles depth 2 should report KO outcome bucket for selected KO: ${JSON.stringify(result.debug.search)}`);
  }
  const validation = validateShowdownChoiceCommandV4({request: aiRequest, choice: result.choice});
  if (!validation.ok) {
    throw new Error(`singles depth 2 choice should validate: ${result.choice}; ${JSON.stringify(validation)}; ${JSON.stringify(result.debug)}`);
  }
  for (const level of ["normal", "elite"] satisfies BattleAiLevelV4[]) {
    const lowerResult = chooseAiBattleChoiceV4({
      request: aiRequest,
      snapshot,
      playerId: "p2",
      aiProfile: {level, preference: "offense"},
      rngSeed: `singles-depth-2-capability-${level}`,
      timeBudgetMs: 10_000,
    });
    if (lowerResult.debug.search?.strategy !== "numeric-guard" || lowerResult.debug.search.capabilities?.useMinimax) {
      throw new Error(`${level} should not enable full minimax capability: ${JSON.stringify(lowerResult.debug.search)}`);
    }
    if (lowerResult.debug.search?.outcomeBuckets?.length) {
      throw new Error(`${level} should not emit full outcome buckets: ${JSON.stringify(lowerResult.debug.search)}`);
    }
  }
  console.log("showdown-battle-core ai singles depth 2 search smoke ok");
}

function aiSinglesDynamicDepthSmoke() {
  const aiRequest: BattleServiceRequestV4 = {
    rqid: 67,
    active: [{
      moves: [
        {move: "Thunderbolt", id: "thunderbolt", pp: 15, maxpp: 15, target: "normal"},
        {move: "Quick Attack", id: "quickattack", pp: 30, maxpp: 30, target: "normal"},
      ],
    }],
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {ident: "p2: Pikachu", details: "Pikachu, L50", condition: "80/100", active: true, ability: "Static", item: "Light Ball", moves: ["Thunderbolt", "Quick Attack"], stats: {hp: 100, atk: 75, def: 55, spa: 105, spd: 65, spe: 110}},
      ],
    },
  };
  const foeRequest: BattleServiceRequestV4 = {
    rqid: 67,
    active: [{
      moves: [
        {move: "Waterfall", id: "waterfall", pp: 15, maxpp: 15, target: "normal"},
        {move: "Splash", id: "splash", pp: 40, maxpp: 40, target: "self"},
      ],
    }],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: Gyarados", details: "Gyarados, L50", condition: "65/170", active: true, ability: "Intimidate", item: "", moves: ["Waterfall", "Splash"], stats: {hp: 170, atk: 145, def: 95, spa: 70, spd: 120, spe: 101}},
      ],
    },
  };
  const snapshot = {
    ...aiSnapshot("gen9", "singles", aiRequest),
    requests: {p1: foeRequest, p2: aiRequest},
  } satisfies BattleServiceSnapshotV4;
  const expectedDepth: Record<"gymLeader" | "eliteFour" | "champion", number> = {
    gymLeader: 2,
    eliteFour: 4,
    champion: 6,
  };
  for (const level of ["gymLeader", "eliteFour", "champion"] satisfies BattleAiLevelV4[]) {
    const result = chooseAiBattleChoiceV4({
      request: aiRequest,
      snapshot,
      playerId: "p2",
      aiProfile: {level, preference: "offense"},
      rngSeed: `singles-dynamic-depth-${level}`,
      timeBudgetMs: 10_000,
    });
    if (result.debug.search?.strategy !== "minimax" || result.debug.search.searchedDepth !== expectedDepth[level]) {
      throw new Error(`${level} should use expected singles dynamic depth: ${JSON.stringify(result.debug.search)}`);
    }
    if (!result.debug.search.dynamicDepthReason || !result.debug.search.complexity) {
      throw new Error(`${level} should report dynamic depth reason and complexity: ${JSON.stringify(result.debug.search)}`);
    }
    if (result.debug.search.elapsedMs > 10_000) {
      throw new Error(`${level} dynamic depth should stay inside hard cap: ${JSON.stringify(result.debug.search)}`);
    }
    const validation = validateShowdownChoiceCommandV4({request: aiRequest, choice: result.choice});
    if (!validation.ok) {
      throw new Error(`${level} dynamic depth choice should validate: ${result.choice}; ${JSON.stringify(validation)}`);
    }
  }
  console.log("showdown-battle-core ai singles dynamic depth smoke ok");
}

function aiOutcomeBucketSmoke() {
  const aiRequest: BattleServiceRequestV4 = {
    rqid: 63,
    active: [
      {
        moves: [
          {move: "Stealth Rock", id: "stealthrock", pp: 20, maxpp: 20, target: "foeSide"},
          {move: "Toxic", id: "toxic", pp: 10, maxpp: 10, target: "normal"},
          {move: "Splash", id: "splash", pp: 40, maxpp: 40, target: "self"},
        ],
      },
    ],
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {ident: "p2: Glimmora", details: "Glimmora, L50", condition: "150/150", active: true, ability: "Toxic Debris", moves: ["Stealth Rock", "Toxic", "Splash"], stats: {hp: 150, atk: 75, def: 105, spa: 160, spd: 100, spe: 105}},
      ],
    },
  };
  const foeRequest: BattleServiceRequestV4 = {
    rqid: 63,
    active: [
      {
        moves: [
          {move: "Splash", id: "splash", pp: 40, maxpp: 40, target: "self"},
        ],
      },
    ],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: Snorlax", details: "Snorlax, L50", condition: "220/220", active: true, ability: "Thick Fat", moves: ["Splash"], stats: {hp: 220, atk: 130, def: 100, spa: 75, spd: 130, spe: 45}},
        {ident: "p1: Charizard", details: "Charizard, L50", condition: "160/160", active: false, ability: "Blaze", moves: ["Flamethrower"], stats: {hp: 160, atk: 95, def: 90, spa: 145, spd: 105, spe: 150}},
      ],
    },
  };
  const snapshot = {
    ...aiSnapshot("gen9", "singles", aiRequest),
    requests: {p1: foeRequest, p2: aiRequest},
  } satisfies BattleServiceSnapshotV4;
  const result = chooseAiBattleChoiceV4({
    request: aiRequest,
    snapshot,
    playerId: "p2",
    aiProfile: {level: "gymLeader", preference: "support"},
    rngSeed: "outcome-buckets",
    timeBudgetMs: 10_000,
  });
  const buckets = result.debug.search?.outcomeBuckets || [];
  if (!buckets.some(entry => entry.choice.startsWith("move 1") && entry.buckets.includes("hazard-progress"))) {
    throw new Error(`Stealth Rock should report hazard-progress outcome bucket: ${JSON.stringify(result.debug.search)}`);
  }
  if (!buckets.some(entry => entry.choice.startsWith("move 2") && entry.buckets.includes("status-progress"))) {
    throw new Error(`Toxic should report status-progress outcome bucket: ${JSON.stringify(result.debug.search)}`);
  }
  console.log("showdown-battle-core ai outcome bucket smoke ok");
}

function aiTeamRoleAnalyzerSmoke() {
  const request: BattleServiceRequestV4 = {
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {ident: "p2: Pelipper", details: "Pelipper, L50", condition: "120/120", active: true, ability: "Drizzle", moves: ["Hurricane", "U-turn", "Roost"], stats: {hp: 120, atk: 70, def: 120, spa: 115, spd: 90, spe: 85}},
        {ident: "p2: Barraskewda", details: "Barraskewda, L50", condition: "120/120", active: false, ability: "Swift Swim", moves: ["Liquidation", "Flip Turn", "Aqua Jet"], stats: {hp: 120, atk: 175, def: 80, spa: 70, spd: 70, spe: 170}},
        {ident: "p2: Ferrothorn", details: "Ferrothorn, L50", condition: "150/150", active: false, ability: "Iron Barbs", moves: ["Leech Seed", "Protect", "Spikes"], stats: {hp: 150, atk: 110, def: 160, spa: 60, spd: 150, spe: 30}},
        {ident: "p2: Rotom-Wash", details: "Rotom-Wash, L50", condition: "125/125", active: false, ability: "Levitate", moves: ["Volt Switch", "Will-O-Wisp", "Thunder Wave"], stats: {hp: 125, atk: 70, def: 120, spa: 125, spd: 120, spe: 106}},
        {ident: "p2: Dragonite", details: "Dragonite, L50", condition: "160/160", active: false, ability: "Multiscale", moves: ["Dragon Dance", "Extreme Speed"], stats: {hp: 160, atk: 170, def: 115, spa: 105, spd: 120, spe: 100}},
      ],
    },
  };
  const analysis = analyzeBattleAiTeamRolesV4({playerId: "p2", request, snapshot: aiSnapshot("gen9", "singles", request)});
  const assertTag = (ident: string, kind: string, subtype?: string) => {
    const entry = analysis.pokemon[ident];
    if (!entry || !entry.tags.some(tag => tag.kind === kind && (!subtype || tag.subtype === subtype))) {
      throw new Error(`missing role tag ${kind}:${subtype || ""} for ${ident}: ${JSON.stringify(entry || analysis)}`);
    }
  };
  assertTag("p2: Pelipper", "weather-setter", "rain");
  assertTag("p2: Pelipper", "pivot");
  assertTag("p2: Barraskewda", "weather-abuser", "rain");
  assertTag("p2: Ferrothorn", "wall");
  assertTag("p2: Ferrothorn", "hazard-setter");
  assertTag("p2: Rotom-Wash", "pivot");
  assertTag("p2: Dragonite", "setup-sweeper");
  if (!analysis.team.archetypes.includes("rain")) {
    throw new Error(`rain archetype should be detected: ${JSON.stringify(analysis.team)}`);
  }
  console.log("showdown-battle-core ai team role analyzer smoke ok");
}

function aiTeamArchetypeAnalyzerSmoke() {
  const analyze = (pokemon: BattleServiceSidePokemonV4[]) => {
    const request: BattleServiceRequestV4 = {side: {id: "p2", name: "B", pokemon}};
    return analyzeBattleAiTeamRolesV4({playerId: "p2", request, snapshot: aiSnapshot("gen9", "singles", request)}).team.archetypes;
  };
  const assertArchetype = (name: string, expected: BattleAiTeamArchetypeV4, pokemon: BattleServiceSidePokemonV4[]) => {
    const archetypes = analyze(pokemon);
    if (!archetypes.includes(expected)) {
      throw new Error(`${name} should detect ${expected}: ${JSON.stringify(archetypes)}`);
    }
  };
  assertArchetype("tailwind team", "tailwind", [
    {ident: "p2: Tornadus", details: "Tornadus, L50", condition: "140/140", active: true, ability: "Prankster", moves: ["Tailwind", "U-turn", "Hurricane"], stats: {hp: 140, atk: 105, def: 90, spa: 145, spd: 100, spe: 150}},
    {ident: "p2: Garchomp", details: "Garchomp, L50", condition: "170/170", active: false, ability: "Rough Skin", moves: ["Earthquake", "Swords Dance"], stats: {hp: 170, atk: 160, def: 115, spa: 85, spd: 105, spe: 150}},
    {ident: "p2: Iron Valiant", details: "Iron Valiant, L50", condition: "150/150", active: false, ability: "Quark Drive", moves: ["Moonblast", "Close Combat"], stats: {hp: 150, atk: 150, def: 100, spa: 150, spd: 90, spe: 170}},
  ]);
  assertArchetype("trick room team", "trick-room", [
    {ident: "p2: Hatterene", details: "Hatterene, L50", condition: "150/150", active: true, ability: "Magic Bounce", moves: ["Trick Room", "Calm Mind", "Psychic"], stats: {hp: 150, atk: 80, def: 115, spa: 170, spd: 140, spe: 45}},
    {ident: "p2: Torkoal", details: "Torkoal, L50", condition: "150/150", active: false, ability: "Drought", moves: ["Eruption", "Protect"], stats: {hp: 150, atk: 105, def: 170, spa: 135, spd: 90, spe: 30}},
  ]);
  assertArchetype("terrain team", "terrain", [
    {ident: "p2: Indeedee-F", details: "Indeedee-F, L50", condition: "140/140", active: true, ability: "Psychic Surge", moves: ["Psychic Terrain", "Helping Hand"], stats: {hp: 140, atk: 70, def: 100, spa: 115, spd: 135, spe: 105}},
    {ident: "p2: Armarouge", details: "Armarouge, L50", condition: "160/160", active: false, ability: "Flash Fire", moves: ["Expanding Force", "Armor Cannon"], stats: {hp: 160, atk: 80, def: 120, spa: 165, spd: 100, spe: 95}},
  ]);
  assertArchetype("hazard stack team", "hazard-stack", [
    {ident: "p2: Glimmora", details: "Glimmora, L50", condition: "150/150", active: true, ability: "Toxic Debris", moves: ["Stealth Rock", "Spikes", "Toxic Spikes"], stats: {hp: 150, atk: 75, def: 105, spa: 160, spd: 100, spe: 105}},
    {ident: "p2: Ting-Lu", details: "Ting-Lu, L50", condition: "220/220", active: false, ability: "Vessel of Ruin", moves: ["Spikes", "Whirlwind"], stats: {hp: 220, atk: 130, def: 145, spa: 75, spd: 130, spe: 65}},
  ]);
  assertArchetype("poison stall team", "poison-stall", [
    {ident: "p2: Clodsire", details: "Clodsire, L50", condition: "200/200", active: true, ability: "Water Absorb", moves: ["Toxic", "Recover", "Protect"], stats: {hp: 200, atk: 95, def: 120, spa: 65, spd: 150, spe: 40}},
    {ident: "p2: Toxapex", details: "Toxapex, L50", condition: "150/150", active: false, ability: "Regenerator", moves: ["Toxic Spikes", "Recover"], stats: {hp: 150, atk: 75, def: 180, spa: 75, spd: 170, spe: 55}},
  ]);
  assertArchetype("setup offense team", "setup-offense", [
    {ident: "p2: Dragonite", details: "Dragonite, L50", condition: "160/160", active: true, ability: "Multiscale", moves: ["Dragon Dance", "Extreme Speed"], stats: {hp: 160, atk: 170, def: 115, spa: 105, spd: 120, spe: 100}},
    {ident: "p2: Gholdengo", details: "Gholdengo, L50", condition: "150/150", active: false, ability: "Good as Gold", moves: ["Nasty Plot", "Make It Rain"], stats: {hp: 150, atk: 80, def: 115, spa: 170, spd: 110, spe: 110}},
    {ident: "p2: Chien-Pao", details: "Chien-Pao, L50", condition: "140/140", active: false, ability: "Sword of Ruin", moves: ["Icicle Crash", "Sucker Punch"], stats: {hp: 140, atk: 172, def: 100, spa: 80, spd: 85, spe: 170}},
  ]);
  assertArchetype("balanced fallback team", "balanced", [
    {ident: "p2: Pikachu", details: "Pikachu, L50", condition: "100/100", active: true, ability: "Static", moves: ["Thunderbolt", "Protect"], stats: {hp: 100, atk: 80, def: 70, spa: 90, spd: 80, spe: 90}},
    {ident: "p2: Eevee", details: "Eevee, L50", condition: "110/110", active: false, ability: "Run Away", moves: ["Swift", "Protect"], stats: {hp: 110, atk: 85, def: 75, spa: 75, spd: 85, spe: 75}},
  ]);
  console.log("showdown-battle-core ai team archetype analyzer smoke ok");
}

function aiRainSwitchRoleSmoke() {
  const aiRequest: BattleServiceRequestV4 = {
    rqid: 62,
    active: [
      {
        moves: [
          {move: "Splash", id: "splash", pp: 40, maxpp: 40, target: "self"},
          {move: "Protect", id: "protect", pp: 10, maxpp: 10, target: "self"},
        ],
      },
    ],
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {ident: "p2: Pelipper", details: "Pelipper, L50", condition: "120/120", active: true, ability: "Drizzle", moves: ["Splash", "Protect"], stats: {hp: 120, atk: 70, def: 120, spa: 95, spd: 90, spe: 85}},
        {ident: "p2: Barraskewda", details: "Barraskewda, L50", condition: "120/120", active: false, ability: "Swift Swim", moves: ["Liquidation", "Aqua Jet"], stats: {hp: 120, atk: 175, def: 80, spa: 70, spd: 70, spe: 170}},
      ],
    },
  };
  const foeRequest: BattleServiceRequestV4 = {
    rqid: 62,
    active: [
      {
        moves: [
          {move: "Splash", id: "splash", pp: 40, maxpp: 40, target: "self"},
        ],
      },
    ],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: Magikarp", details: "Magikarp, L50", condition: "80/80", active: true, ability: "Swift Swim", moves: ["Splash"], stats: {hp: 80, atk: 30, def: 55, spa: 25, spd: 35, spe: 80}},
      ],
    },
  };
  const snapshot = {
    ...aiSnapshot("gen9", "singles", aiRequest),
    requests: {p1: foeRequest, p2: aiRequest},
    rawLog: ["|-weather|RainDance|[from] ability: Drizzle"],
    active: [
      {ident: "p1a: Magikarp", playerId: "p1", slot: "p1a", species: "Magikarp", details: "Magikarp, L50", condition: "80/80", hp: 80, maxHp: 80, status: "", fainted: false},
      {ident: "p2a: Pelipper", playerId: "p2", slot: "p2a", species: "Pelipper", details: "Pelipper, L50", condition: "120/120", hp: 120, maxHp: 120, status: "", fainted: false},
    ],
  } satisfies BattleServiceSnapshotV4;
  const result = chooseAiBattleChoiceV4({
    request: aiRequest,
    snapshot,
    playerId: "p2",
    aiProfile: {level: "gymLeader", preference: "balanced"},
    rngSeed: "rain-switch-role",
    timeBudgetMs: 10_000,
  });
  if (!result.choice.startsWith("switch 2")) {
    throw new Error(`rain setter should prefer switching to healthy rain abuser: ${JSON.stringify(result.debug)}`);
  }
  if (result.debug.search?.strategy !== "minimax" || result.debug.search.searchedDepth !== 2) {
    throw new Error(`rain switch should still use singles depth 2 minimax: ${JSON.stringify(result.debug.search)}`);
  }
  console.log("showdown-battle-core ai rain switch role smoke ok");
}

function aiSwitchTargetOverrideSmoke() {
  const makeAiRequest = (barraskewdaCondition = "120/120"): BattleServiceRequestV4 => ({
    rqid: 64,
    active: [
      {
        moves: [
          {move: "Splash", id: "splash", pp: 40, maxpp: 40, target: "self"},
          {move: "Protect", id: "protect", pp: 10, maxpp: 10, target: "self"},
        ],
      },
    ],
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {ident: "p2: Politoed", details: "Politoed, L50", condition: "200/200", active: true, ability: "Drizzle", moves: ["Splash", "Protect"], stats: {hp: 200, atk: 75, def: 140, spa: 110, spd: 200, spe: 90}},
        {ident: "p2: Barraskewda", details: "Barraskewda, L50", condition: barraskewdaCondition, active: false, ability: "Swift Swim", moves: ["Liquidation", "Aqua Jet"], stats: {hp: 120, atk: 175, def: 80, spa: 70, spd: 70, spe: 170}},
      ],
    },
  });
  const makeSnapshot = (aiRequest: BattleServiceRequestV4, foeRequest: BattleServiceRequestV4) => {
    const foeRow = foeRequest.side?.pokemon[0];
    const condition = foeRow?.condition || "100/100";
    const [hp, maxHp] = condition.split("/").map(value => Number(value) || 100);
    return {
      ...aiSnapshot("gen9", "singles", aiRequest),
      requests: {p1: foeRequest, p2: aiRequest},
      rawLog: ["|-weather|RainDance|[from] ability: Drizzle"],
      active: [
        {
          ident: foeRow?.ident?.replace("p1:", "p1a:") || "p1a: Foe",
          playerId: "p1" as const,
          slot: "p1a",
          species: String(foeRow?.details || "Foe").split(",")[0],
          details: foeRow?.details || "Foe, L50",
          condition,
          hp,
          maxHp,
          status: "",
          fainted: false,
        },
        {ident: "p2a: Politoed", playerId: "p2" as const, slot: "p2a", species: "Politoed", details: "Politoed, L50", condition: "200/200", hp: 200, maxHp: 200, status: "", fainted: false},
      ],
    } satisfies BattleServiceSnapshotV4;
  };
  const run = (foeRequest: BattleServiceRequestV4, seed: string, barraskewdaCondition = "120/120") => {
    const aiRequest = makeAiRequest(barraskewdaCondition);
    const snapshot = makeSnapshot(aiRequest, foeRequest);
    return chooseAiBattleChoiceV4({
      request: aiRequest,
      snapshot,
      playerId: "p2",
      aiProfile: {level: "gymLeader", preference: "balanced"},
      rngSeed: seed,
      timeBudgetMs: 10_000,
    });
  };

  const safeFoeRequest: BattleServiceRequestV4 = {
    rqid: 64,
    active: [{moves: [{move: "Tackle", id: "tackle", pp: 35, maxpp: 35, target: "normal"}]}],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: Magikarp", details: "Magikarp, L50", condition: "80/80", active: true, ability: "Swift Swim", moves: ["Tackle"], stats: {hp: 80, atk: 30, def: 55, spa: 25, spd: 35, spe: 80}},
      ],
    },
  };
  const safeResult = run(safeFoeRequest, "switch-target-override-safe");
  if (!safeResult.choice.startsWith("switch 2")) {
    throw new Error(`safe rain abuser switch should still be preferred: ${JSON.stringify(safeResult.debug)}`);
  }
  if (!safeResult.debug.search?.targetOverrideEstimates?.some(entry => entry.switchChoice === "switch 2" && entry.replyChoice === "move 1" && entry.estimatedDamage > 0)) {
    throw new Error(`safe switch should report targetOverride reply estimate: ${JSON.stringify(safeResult.debug.search)}`);
  }
  if (!safeResult.debug.search?.outcomeBuckets?.some(entry => entry.choice === "switch 2" && entry.buckets.includes("safe-switch"))) {
    throw new Error(`safe switch should report safe-switch bucket: ${JSON.stringify(safeResult.debug.search)}`);
  }
  const statusSuffixResult = run(safeFoeRequest, "switch-target-override-safe-status-suffix", "120/120 par");
  const largestBreakdown = Math.max(0, ...Object.values(statusSuffixResult.debug.search?.valueBreakdown || {}).map(value => Math.abs(Number(value))));
  if (largestBreakdown >= 1_000) {
    throw new Error(`status-suffixed HP condition should not explode value breakdown: ${JSON.stringify(statusSuffixResult.debug.search)}`);
  }

  const unsafeFoeRequest: BattleServiceRequestV4 = {
    rqid: 64,
    active: [{moves: [{move: "Thunderbolt", id: "thunderbolt", pp: 15, maxpp: 15, target: "normal"}]}],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: Jolteon", details: "Jolteon, L50", condition: "140/140", active: true, ability: "Volt Absorb", moves: ["Thunderbolt"], stats: {hp: 140, atk: 75, def: 80, spa: 180, spd: 115, spe: 200}},
      ],
    },
  };
  const unsafeResult = run(unsafeFoeRequest, "switch-target-override-unsafe", "60/120");
  if (unsafeResult.choice.startsWith("switch 2")) {
    throw new Error(`unsafe rain abuser switch should be rejected after targetOverride estimate: ${JSON.stringify(unsafeResult.debug)}`);
  }
  if (!unsafeResult.debug.search?.targetOverrideEstimates?.some(entry => entry.switchChoice === "switch 2" && entry.replyChoice === "move 1" && (entry.koChance >= 1 || entry.estimatedDamage >= 60))) {
    throw new Error(`unsafe switch should report lethal targetOverride reply estimate: ${JSON.stringify(unsafeResult.debug.search)}`);
  }
  if (!unsafeResult.debug.search?.outcomeBuckets?.some(entry => entry.choice === "switch 2" && (entry.buckets.includes("unsafe-switch") || entry.buckets.includes("self-ko-risk")))) {
    throw new Error(`unsafe switch should report unsafe/self-ko bucket: ${JSON.stringify(unsafeResult.debug.search)}`);
  }
  for (const level of ["normal", "elite"] satisfies BattleAiLevelV4[]) {
    const aiRequest = makeAiRequest();
    const lowerResult = chooseAiBattleChoiceV4({
      request: aiRequest,
      snapshot: makeSnapshot(aiRequest, unsafeFoeRequest),
      playerId: "p2",
      aiProfile: {level, preference: "balanced"},
      rngSeed: `switch-target-override-low-${level}`,
      timeBudgetMs: 10_000,
    });
    if (lowerResult.debug.search?.strategy !== "numeric-guard" || lowerResult.debug.search.targetOverrideEstimates?.length) {
      throw new Error(`${level} should not enable targetOverride minimax switch estimates: ${JSON.stringify(lowerResult.debug.search)}`);
    }
  }
  console.log("showdown-battle-core ai switch targetOverride smoke ok");
}

function aiValueFunctionResourceSmoke() {
  const capabilities = battleAiCapabilityForLevelV4("gymLeader");
  const pokemon = (hp: number, maxHp: number, fainted = false) => ({
    playerId: "p2" as const,
    activeIndex: 0,
    hp,
    maxHp,
    fainted,
  });
  const hazards = {stealthRock: 0, spikes: 0, toxicSpikes: 0, stickyWeb: 0};
  const resources = (overrides: Record<string, unknown> = {}) => ({
    totalPokemonCount: 3,
    aliveCount: 3,
    faintedCount: 0,
    lowHpCount: 0,
    totalHpRatio: 0.75,
    activeHpRatio: 0.75,
    benchHpRatio: 0.75,
    winConditionAlive: false,
    winConditionHealthy: false,
    activeIsWinCondition: false,
    hazards,
    ...overrides,
  });
  const baseState = {
    self: pokemon(80, 100),
    foe: {...pokemon(70, 100), playerId: "p1" as const},
    selfResources: resources({totalHpRatio: 0.8, activeHpRatio: 0.8}),
    foeResources: resources({totalHpRatio: 0.4, activeHpRatio: 0.2, lowHpCount: 2}),
  };
  const ownHazard = {choice: "move 1", score: 80, kind: "move", diagnostics: {moveId: "stealthrock"}};
  const foeSplash = {choice: "move 1", score: 10, kind: "move", diagnostics: {moveId: "splash"}};
  const hazardIntoBench = evaluateBattleAiSinglesLeafValueV4({
    state: baseState,
    initialState: baseState,
    own: ownHazard,
    foe: foeSplash,
    buckets: ["hazard-progress"],
    capabilities,
  });
  const hazardIntoLastMon = evaluateBattleAiSinglesLeafValueV4({
    state: {...baseState, foeResources: resources({totalPokemonCount: 1, aliveCount: 1, totalHpRatio: 0.2, activeHpRatio: 0.2})},
    initialState: {...baseState, foeResources: resources({totalPokemonCount: 1, aliveCount: 1, totalHpRatio: 0.2, activeHpRatio: 0.2})},
    own: ownHazard,
    foe: foeSplash,
    buckets: ["hazard-progress"],
    capabilities,
  });
  if (!(hazardIntoBench.breakdown.hazard > hazardIntoLastMon.breakdown.hazard && hazardIntoLastMon.breakdown.hazard < 0)) {
    throw new Error(`hazard value should prefer bench-heavy opponents and penalize last-mon hazards: ${JSON.stringify({hazardIntoBench, hazardIntoLastMon})}`);
  }
  if (!(hazardIntoBench.breakdown.teamHp > 0 && hazardIntoBench.breakdown.lowHpPressure > 0)) {
    throw new Error(`resource value should reward team HP lead and foe low HP pressure: ${JSON.stringify(hazardIntoBench.breakdown)}`);
  }

  const healthyWincon = evaluateBattleAiSinglesLeafValueV4({
    state: {...baseState, selfResources: resources({winConditionAlive: true, winConditionHealthy: true, activeIsWinCondition: true})},
    initialState: {...baseState, selfResources: resources({winConditionAlive: true, winConditionHealthy: true, activeIsWinCondition: true})},
    own: {choice: "move 2", score: 90, kind: "move", diagnostics: {moveId: "liquidation"}},
    foe: foeSplash,
    buckets: [],
    capabilities,
  });
  const deadWincon = evaluateBattleAiSinglesLeafValueV4({
    state: {
      ...baseState,
      self: pokemon(0, 100, true),
      selfResources: resources({aliveCount: 2, faintedCount: 1, winConditionAlive: false, winConditionHealthy: false, activeIsWinCondition: true}),
    },
    initialState: {...baseState, selfResources: resources({winConditionAlive: true, winConditionHealthy: true, activeIsWinCondition: true})},
    own: {choice: "switch 2", score: 90, kind: "switch", diagnostics: {}},
    foe: {choice: "move 1", score: 120, kind: "move", diagnostics: {moveId: "thunderbolt"}},
    buckets: ["self-ko-risk", "unsafe-switch"],
    capabilities,
  });
  if (!(healthyWincon.breakdown.winCondition > 0 && deadWincon.breakdown.winCondition < 0 && deadWincon.score < healthyWincon.score)) {
    throw new Error(`win condition value should reward healthy wincon and punish throwing it away: ${JSON.stringify({healthyWincon, deadWincon})}`);
  }
  console.log("showdown-battle-core ai value function resource smoke ok");
}

function aiValueFunctionV2Smoke() {
  const capabilities = battleAiCapabilityForLevelV4("gymLeader");
  const speed = (effectiveSpeed: number, speciesId: string) => ({
    speciesId,
    types: [],
    stats: {hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: effectiveSpeed},
    baseSpeed: effectiveSpeed,
    rawSpeed: effectiveSpeed,
    effectiveSpeed,
    estimatedStats: false,
    modifiers: [],
  });
  const pokemon = (playerId: "p1" | "p2", hp: number, maxHp: number, effectiveSpeed: number, speciesId: string) => ({
    playerId,
    activeIndex: 0,
    hp,
    maxHp,
    fainted: hp <= 0,
    speed: speed(effectiveSpeed, speciesId),
  });
  const resources = {
    totalPokemonCount: 3,
    aliveCount: 3,
    faintedCount: 0,
    lowHpCount: 0,
    totalHpRatio: 0.8,
    activeHpRatio: 0.8,
    benchHpRatio: 0.8,
    winConditionAlive: true,
    winConditionHealthy: true,
    activeIsWinCondition: false,
    hazards: {stealthRock: 0, spikes: 0, toxicSpikes: 0, stickyWeb: 0},
  };
  const state = {
    self: pokemon("p2", 80, 100, 70, "azumarill"),
    foe: pokemon("p1", 30, 100, 160, "jolteon"),
    selfResources: resources,
    foeResources: {...resources, lowHpCount: 2, activeHpRatio: 0.3, totalHpRatio: 0.45},
    fieldSpeed: {trickRoom: false, tailwindByPlayer: {}},
  };
  const foeKoReply = {choice: "move 1", score: 100, kind: "move", diagnostics: {moveId: "thunderbolt", accuracy: 100, koChance: 1, expectedDamageRatio: 1.1}};
  const priorityKo = evaluateBattleAiSinglesLeafValueV4({
    state: {...state, foe: {...state.foe, hp: 0, fainted: true}},
    initialState: state,
    own: {choice: "move 1", score: 80, kind: "move", diagnostics: {moveId: "aquajet", accuracy: 100, koChance: 1, expectedDamageRatio: 0.4}},
    foe: foeKoReply,
    buckets: ["ko"],
    capabilities,
  });
  if (!(priorityKo.breakdown.speed > 0 && priorityKo.breakdown.specialMove > 0)) {
    throw new Error(`priority KO should receive speed and priority value: ${JSON.stringify(priorityKo.breakdown)}`);
  }

  const trickRoomKo = evaluateBattleAiSinglesLeafValueV4({
    state: {...state, fieldSpeed: {trickRoom: true, tailwindByPlayer: {}}},
    initialState: {...state, fieldSpeed: {trickRoom: true, tailwindByPlayer: {}}},
    own: {choice: "move 1", score: 80, kind: "move", diagnostics: {moveId: "earthquake", accuracy: 100, koChance: 1, expectedDamageRatio: 1.1}},
    foe: foeKoReply,
    buckets: ["ko"],
    capabilities,
  });
  if (!(trickRoomKo.breakdown.speed > 0 && trickRoomKo.breakdown.field > 0)) {
    throw new Error(`Trick Room should reward slower first-strike KO: ${JSON.stringify(trickRoomKo.breakdown)}`);
  }

  const lowAccuracyKo = evaluateBattleAiSinglesLeafValueV4({
    state,
    initialState: state,
    own: {choice: "move 1", score: 80, kind: "move", diagnostics: {moveId: "focusblast", accuracy: 70, koChance: 0.4, expectedDamageRatio: 0.9}},
    foe: {choice: "move 1", score: 30, kind: "move", diagnostics: {moveId: "tackle", accuracy: 100, koChance: 0, expectedDamageRatio: 0.1}},
    buckets: ["threaten-ko"],
    capabilities,
  });
  if (!(lowAccuracyKo.breakdown.risk < 0 && lowAccuracyKo.breakdown.threat > 0)) {
    throw new Error(`low accuracy possible KO should expose risk while keeping threat value: ${JSON.stringify(lowAccuracyKo.breakdown)}`);
  }

  const protectThreat = evaluateBattleAiSinglesLeafValueV4({
    state,
    initialState: state,
    own: {choice: "move 2", score: 40, kind: "move", diagnostics: {moveId: "protect", accuracy: 100, koChance: 0, expectedDamageRatio: 0}},
    foe: foeKoReply,
    buckets: ["self-ko-risk"],
    capabilities,
  });
  const recoveryWindow = evaluateBattleAiSinglesLeafValueV4({
    state: {...state, self: {...state.self, hp: 42}},
    initialState: {...state, self: {...state.self, hp: 42}},
    own: {choice: "move 3", score: 40, kind: "move", diagnostics: {moveId: "recover", accuracy: 100, koChance: 0, expectedDamageRatio: 0}},
    foe: {choice: "move 1", score: 30, kind: "move", diagnostics: {moveId: "tackle", accuracy: 100, koChance: 0, expectedDamageRatio: 0.2}},
    buckets: [],
    capabilities,
  });
  const setupSafe = evaluateBattleAiSinglesLeafValueV4({
    state,
    initialState: state,
    own: {choice: "move 4", score: 40, kind: "move", diagnostics: {moveId: "swordsdance", accuracy: 100, koChance: 0, expectedDamageRatio: 0}},
    foe: {choice: "move 1", score: 30, kind: "move", diagnostics: {moveId: "tackle", accuracy: 100, koChance: 0, expectedDamageRatio: 0.2}},
    buckets: [],
    capabilities,
  });
  const setupUnsafe = evaluateBattleAiSinglesLeafValueV4({
    state: {...state, self: {...state.self, hp: 25}},
    initialState: {...state, self: {...state.self, hp: 25}},
    own: {choice: "move 4", score: 40, kind: "move", diagnostics: {moveId: "swordsdance", accuracy: 100, koChance: 0, expectedDamageRatio: 0}},
    foe: foeKoReply,
    buckets: ["self-ko-risk"],
    capabilities,
  });
  if (!(protectThreat.breakdown.specialMove > 0 && recoveryWindow.breakdown.specialMove > 0 && setupSafe.breakdown.specialMove > 0 && setupUnsafe.breakdown.specialMove < 0)) {
    throw new Error(`special move values should handle protect/recovery/setup windows: ${JSON.stringify({protectThreat: protectThreat.breakdown, recoveryWindow: recoveryWindow.breakdown, setupSafe: setupSafe.breakdown, setupUnsafe: setupUnsafe.breakdown})}`);
  }
  console.log("showdown-battle-core ai value function v2 smoke ok");
}

function aiOutcomeBucketsSmoke() {
  const cases: Array<[ReturnType<typeof battleAiDamageBucketForEstimateV4>, Parameters<typeof battleAiDamageBucketForEstimateV4>[0]]> = [
    ["immune", {typeMultiplier: 0, expectedDamageRatio: 0, koChance: 0}],
    ["negligible", {typeMultiplier: 1, expectedDamageRatio: 0.03, koChance: 0}],
    ["chip", {typeMultiplier: 1, expectedDamageRatio: 0.12, koChance: 0}],
    ["pressure", {typeMultiplier: 1, expectedDamageRatio: 0.32, koChance: 0}],
    ["two-hit-ko", {typeMultiplier: 1, expectedDamageRatio: 0.55, koChance: 0}],
    ["near-ko", {typeMultiplier: 1, expectedDamageRatio: 0.88, koChance: 0}],
    ["possible-ko", {typeMultiplier: 1, expectedDamageRatio: 0.7, koChance: 0.2}],
    ["guaranteed-ko", {typeMultiplier: 1, expectedDamageRatio: 1.2, koChance: 1}],
  ];
  for (const [expected, input] of cases) {
    const actual = battleAiDamageBucketForEstimateV4(input);
    if (actual !== expected) {
      throw new Error(`damage bucket mismatch: expected ${expected}, got ${actual}, input=${JSON.stringify(input)}`);
    }
  }
  console.log("showdown-battle-core ai outcome buckets smoke ok");
}

function aiActionOutcomeEstimatorSmoke() {
  const request: BattleServiceRequestV4 = {
    rqid: 65,
    active: [{
      moves: [
        {move: "Tackle", id: "tackle", pp: 35, maxpp: 35, target: "normal"},
        {move: "Quick Attack", id: "quickattack", pp: 30, maxpp: 30, target: "normal"},
        {move: "Rain Dance", id: "raindance", pp: 5, maxpp: 5, target: "all"},
      ],
    }],
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {ident: "p2: Snorlax", details: "Snorlax, L50", condition: "220/220", active: true, ability: "Thick Fat", moves: ["Tackle", "Quick Attack", "Rain Dance"], stats: {hp: 220, atk: 130, def: 100, spa: 75, spd: 130, spe: 45}},
      ],
    },
  };
  const snapshot = {
    ...aiSnapshot("gen9", "singles", request),
    active: [
      {ident: "p1a: Gengar", playerId: "p1", slot: "p1a", species: "Gengar", details: "Gengar, L50", condition: "135/135", hp: 135, maxHp: 135, status: "", fainted: false},
      {ident: "p2a: Snorlax", playerId: "p2", slot: "p2a", species: "Snorlax", details: "Snorlax, L50", condition: "220/220", hp: 220, maxHp: 220, status: "", fainted: false},
    ],
  } satisfies BattleServiceSnapshotV4;
  const immune = estimateBattleAiActionOutcomeV4({request, snapshot, playerId: "p2", activeIndex: 0, move: request.active![0]!.moves![0]!});
  if (immune.damageBucket !== "immune" || immune.expectedDamageRange.average !== 0) {
    throw new Error(`Tackle into Gengar should be immune: ${JSON.stringify(immune)}`);
  }
  const priority = estimateBattleAiActionOutcomeV4({request, snapshot, playerId: "p2", activeIndex: 0, move: request.active![0]!.moves![1]!});
  if (priority.priority !== 1) {
    throw new Error(`Quick Attack should report priority 1: ${JSON.stringify(priority)}`);
  }
  const rain = estimateBattleAiActionOutcomeV4({request, snapshot, playerId: "p2", activeIndex: 0, move: request.active![0]!.moves![2]!});
  if (!rain.fieldBuckets.includes("weather-progress") || rain.damaging) {
    throw new Error(`Rain Dance should report weather-progress and non-damaging: ${JSON.stringify(rain)}`);
  }
  console.log("showdown-battle-core ai action outcome estimator smoke ok");
}

function aiSinglesSpeedStateSmoke() {
  const request: BattleServiceRequestV4 = {
    rqid: 66,
    active: [{moves: [{move: "Tackle", id: "tackle", pp: 35, maxpp: 35, target: "normal"}]}],
    side: {
      id: "p2",
      name: "B",
      pokemon: [
        {ident: "p2: Torkoal", details: "Torkoal, L50", condition: "140/140", active: true, ability: "Drought", item: "", moves: ["Tackle"], stats: {hp: 140, atk: 100, def: 160, spa: 110, spd: 90, spe: 40}},
      ],
    },
  };
  const foeRequest: BattleServiceRequestV4 = {
    rqid: 66,
    active: [{moves: [{move: "Tackle", id: "tackle", pp: 35, maxpp: 35, target: "normal"}]}],
    side: {
      id: "p1",
      name: "A",
      pokemon: [
        {ident: "p1: Jolteon", details: "Jolteon, L50", condition: "140/140", active: true, ability: "Volt Absorb", item: "", moves: ["Tackle"], stats: {hp: 140, atk: 75, def: 80, spa: 150, spd: 115, spe: 200}},
      ],
    },
  };
  const snapshot = {
    ...aiSnapshot("gen9", "singles", request),
    requests: {p1: foeRequest, p2: request},
    rawLog: [
      "|-sidestart|p2: B|move: Tailwind",
    ],
    active: [
      {ident: "p1a: Jolteon", playerId: "p1", slot: "p1a", species: "Jolteon", details: "Jolteon, L50", condition: "140/140", hp: 140, maxHp: 140, status: "", fainted: false},
      {ident: "p2a: Torkoal", playerId: "p2", slot: "p2a", species: "Torkoal", details: "Torkoal, L50", condition: "140/140", hp: 140, maxHp: 140, status: "", fainted: false},
    ],
  } satisfies BattleServiceSnapshotV4;
  const field = buildBattleAiSpeedFieldStateV4(snapshot);
  const self = buildBattleAiSpeedStateV4({snapshot, playerId: "p2", active: snapshot.active[1], row: request.side!.pokemon[0]});
  const foe = buildBattleAiSpeedStateV4({snapshot, playerId: "p1", active: snapshot.active[0], row: foeRequest.side!.pokemon[0]});
  if (self.effectiveSpeed !== 80 || !self.modifiers.includes("tailwind")) {
    throw new Error(`Tailwind should double own effective speed: ${JSON.stringify(self)}`);
  }
  if (battleAiActsBeforeBySpeedV4(self, foe, field) !== false) {
    throw new Error(`Torkoal should still be slower than Jolteon outside Trick Room: ${JSON.stringify({self, foe, field})}`);
  }

  const trickRoomSnapshot = {...snapshot, rawLog: [...snapshot.rawLog, "|-fieldstart|move: Trick Room"]} satisfies BattleServiceSnapshotV4;
  const trickRoomField = buildBattleAiSpeedFieldStateV4(trickRoomSnapshot);
  const trickRoomSelf = buildBattleAiSpeedStateV4({snapshot: trickRoomSnapshot, playerId: "p2", active: trickRoomSnapshot.active[1], row: request.side!.pokemon[0]});
  const trickRoomFoe = buildBattleAiSpeedStateV4({snapshot: trickRoomSnapshot, playerId: "p1", active: trickRoomSnapshot.active[0], row: foeRequest.side!.pokemon[0]});
  if (battleAiActsBeforeBySpeedV4(trickRoomSelf, trickRoomFoe, trickRoomField) !== true || !trickRoomSelf.modifiers.includes("trick-room")) {
    throw new Error(`Trick Room should reverse effective speed order: ${JSON.stringify({trickRoomSelf, trickRoomFoe, trickRoomField})}`);
  }

  const paralyzed = buildBattleAiSpeedStateV4({
    snapshot,
    playerId: "p1",
    active: {...snapshot.active[0], status: "par"},
    row: {...foeRequest.side!.pokemon[0]!, condition: "140/140 par"},
  });
  if (!(paralyzed.effectiveSpeed < foe.effectiveSpeed && paralyzed.modifiers.includes("paralysis"))) {
    throw new Error(`Paralysis should lower effective speed: ${JSON.stringify({paralyzed, foe})}`);
  }
  const estimated = buildBattleAiSpeedStateV4({
    snapshot,
    playerId: "p2",
    active: {...snapshot.active[1], species: "Barraskewda", details: "Barraskewda, L50"},
    row: {ident: "p2: Barraskewda", details: "Barraskewda, L50", condition: "120/120", active: true, ability: "Swift Swim", item: "Choice Scarf"},
  });
  if (!estimated.estimatedStats || !estimated.modifiers.includes("choice-scarf") || estimated.rawSpeed <= 0) {
    throw new Error(`Missing stats should fall back to dex estimate and item modifier: ${JSON.stringify(estimated)}`);
  }
  console.log("showdown-battle-core ai singles speed state smoke ok");
}

function aiSearchBudgetSmoke() {
  const expected: Array<[BattleAiLevelV4, number]> = [
    ["rookie", 1],
    ["normal", 2],
    ["elite", 3],
    ["gymLeader", 4],
    ["eliteFour", 5],
    ["champion", 6],
  ];
  for (const [level, depth] of expected) {
    const budget = battleAiSearchBudgetForLevelV4(level);
    if (budget.maxDepth !== depth) {
      throw new Error(`expected ${level} search depth ${depth}, got ${JSON.stringify(budget)}`);
    }
    if (budget.maxMs > 10_000) {
      throw new Error(`AI search budget should stay within 10s hard cap: ${JSON.stringify(budget)}`);
    }
  }
  const capped = battleAiSearchBudgetForLevelV4("champion", 250);
  if (capped.maxMs !== 250) {
    throw new Error(`explicit time budget should cap champion search maxMs: ${JSON.stringify(capped)}`);
  }
  const expectedEffective: Array<[BattleAiLevelV4, "singles" | "doubles" | "coop", number]> = [
    ["gymLeader", "singles", 2],
    ["eliteFour", "singles", 4],
    ["champion", "singles", 6],
    ["gymLeader", "doubles", 1],
    ["eliteFour", "doubles", 2],
    ["champion", "doubles", 3],
    ["gymLeader", "coop", 1],
    ["eliteFour", "coop", 2],
    ["champion", "coop", 3],
    ["elite", "singles", 1],
  ];
  for (const [level, mode, depth] of expectedEffective) {
    const budget = battleAiEffectiveSearchBudgetForModeV4(level, mode);
    if (budget.maxDepth !== depth) {
      throw new Error(`expected ${level}/${mode} effective depth ${depth}, got ${JSON.stringify(budget)}`);
    }
  }
  const expectedCapabilities: Array<[BattleAiLevelV4, boolean, boolean, number]> = [
    ["rookie", false, false, 0.8],
    ["normal", false, false, 0.55],
    ["elite", false, false, 0.35],
    ["gymLeader", true, true, 0.22],
    ["eliteFour", true, true, 0.16],
    ["champion", true, true, 0.1],
  ];
  for (const [level, useMinimax, useRoleAnalysis, riskTolerance] of expectedCapabilities) {
    const capabilities = battleAiCapabilityForLevelV4(level);
    if (capabilities.useMinimax !== useMinimax || capabilities.useRoleAnalysis !== useRoleAnalysis || capabilities.riskTolerance !== riskTolerance) {
      throw new Error(`unexpected ${level} capability profile: ${JSON.stringify(capabilities)}`);
    }
  }
  console.log("showdown-battle-core ai search budget smoke ok");
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
  if (
    typeof rain.diagnostics.archetype.structureScore !== "number" ||
    !Array.isArray(rain.diagnostics.archetype.fulfilledRequirements) ||
    !Array.isArray(rain.diagnostics.archetype.missingRequirements)
  ) {
    throw new Error(`rain archetype diagnostics missing structure details: ${JSON.stringify(rain.diagnostics.archetype)}`);
  }
  if (![...rain.diagnostics.archetype.fulfilledRequirements, ...rain.diagnostics.archetype.missingRequirements].some(requirement => requirement.startsWith("rain-"))) {
    throw new Error(`rain archetype should report rain structure requirements: ${JSON.stringify(rain.diagnostics.archetype)}`);
  }

  for (const archetype of ["rain", "sand"] as const) {
    const strict = await generateShowdownRandomTeamV4({
      ruleSet: "gen9",
      mode: "singles",
      seed: `strict-${archetype}-team`,
      teamSize: 3,
      teamArchetype: archetype,
      archetypeAttempts: 16,
      strictArchetype: true,
    });
    if (!strict.diagnostics.ok || strict.pokemonSets.length !== 3) {
      throw new Error(`strict ${archetype} team should fall back to a valid generated team: ${JSON.stringify(strict.diagnostics)}`);
    }
    if (!strict.diagnostics.archetype || !Number.isFinite(strict.diagnostics.archetype.structureScore)) {
      throw new Error(`strict ${archetype} diagnostics missing structure score: ${JSON.stringify(strict.diagnostics.archetype)}`);
    }
  }

  for (const archetype of ["rain", "sun", "trick-room"] as const) {
    const strictCore = await generateShowdownRandomTeamV4({
      ruleSet: "gen9",
      mode: "singles",
      seed: `strict-core-${archetype}-team`,
      teamSize: 3,
      teamArchetype: archetype,
      archetypeAttempts: 64,
      purpose: "ai-exam",
      quality: "strict",
      aiLevel: "champion",
    });
    const archetypeDiagnostics = strictCore.diagnostics.archetype;
    if (!strictCore.diagnostics.ok || strictCore.pokemonSets.length !== 3 || !archetypeDiagnostics?.coreComplete) {
      throw new Error(`strict ${archetype} should produce a complete 3v3 core: ${JSON.stringify({team: strictCore.pokemonSets.map(set => `${set.species}:${set.ability}:${set.moves.join("/")}`), diagnostics: archetypeDiagnostics})}`);
    }
    if (archetypeDiagnostics.quality !== "strict" || archetypeDiagnostics.purpose !== "ai-exam") {
      throw new Error(`strict ${archetype} diagnostics should include purpose/quality: ${JSON.stringify(archetypeDiagnostics)}`);
    }
    if ((archetypeDiagnostics.selectedFromCandidateSize || 0) < strictCore.pokemonSets.length || !Number.isFinite(archetypeDiagnostics.selectedSubsetScore)) {
      throw new Error(`strict ${archetype} diagnostics should include subset selection details: ${JSON.stringify(archetypeDiagnostics)}`);
    }
  }

  const rookieTeam = await generateShowdownRandomTeamV4({
    ruleSet: "gen9",
    mode: "singles",
    seed: "rookie-move-quality-team",
    teamSize: 3,
    teamArchetype: "rain",
    archetypeAttempts: 16,
    aiLevel: "rookie",
  });
  if (!rookieTeam.diagnostics.ok || !rookieTeam.diagnostics.moveQuality) {
    throw new Error(`rookie move-quality team failed: ${JSON.stringify(rookieTeam.diagnostics)}`);
  }
  if (rookieTeam.pokemonSets.some(set => (set.moves || []).length > 2)) {
    throw new Error(`rookie team should have reduced move slots: ${rookieTeam.pokemonSets.map(set => `${set.species}:${set.moves.length}`).join(", ")}`);
  }
  if (rookieTeam.diagnostics.moveQuality.maxMoveSlots > 2 || !rookieTeam.diagnostics.moveQuality.adjustedPokemon.length) {
    throw new Error(`rookie move-quality diagnostics missing reductions: ${JSON.stringify(rookieTeam.diagnostics.moveQuality)}`);
  }
  if (rookieTeam.diagnostics.archetype && rookieTeam.diagnostics.archetype.coreComplete !== !rookieTeam.diagnostics.archetype.missingRequirements?.length) {
    throw new Error(`rookie team coreComplete should reflect final post-trim missing requirements: ${JSON.stringify(rookieTeam.diagnostics.archetype)}`);
  }

  const championTeam = await generateShowdownRandomTeamV4({
    ruleSet: "gen9",
    mode: "singles",
    seed: "champion-move-quality-team",
    teamSize: 3,
    teamArchetype: "rain",
    archetypeAttempts: 16,
    aiLevel: "champion",
  });
  if (!championTeam.diagnostics.ok || !championTeam.diagnostics.moveQuality) {
    throw new Error(`champion move-quality team failed: ${JSON.stringify(championTeam.diagnostics)}`);
  }
  if (championTeam.diagnostics.moveQuality.maxMoveSlots < 4 || championTeam.pokemonSets.some(set => (set.moves || []).length < 4)) {
    throw new Error(`champion team should keep full move slots: ${championTeam.pokemonSets.map(set => `${set.species}:${set.moves.length}`).join(", ")}`);
  }
  console.log("showdown-battle-core random team generator smoke ok");
}

async function aiSelfPlayExamSmoke() {
  const questions = generateBattleAiSelfPlayQuestionsV4({
    seed: "self-play-smoke",
    archetypes: ["rain", "balanced"],
    gamesPerPair: 1,
    teamSize: 1,
    maxTurns: 6,
    p1Level: "gymLeader",
    p2Level: "gymLeader",
  });
  if (questions.length !== 2 || !questions[0]?.id.includes("rain-vs-balanced")) {
    throw new Error(`self-play question generator should build archetype matchups: ${JSON.stringify(questions)}`);
  }
  if (!questions.every(question => question.forceLevel === 50 && !question.strictArchetype && question.archetypeAttempts === 64)) {
    throw new Error(`self-play questions should default to L50 high-attempt archetype generation: ${JSON.stringify(questions)}`);
  }
  const report = await runBattleAiSelfPlayExamV4({
    seed: "self-play-smoke",
    archetypes: ["balanced"],
    gamesPerPair: 1,
    teamSize: 1,
    maxTurns: 6,
    p1Level: "gymLeader",
    p2Level: "gymLeader",
  });
  if (report.summary.total !== 1 || !report.results[0]) {
    throw new Error(`self-play report should contain one result: ${JSON.stringify(report.summary)}`);
  }
  const result = report.results[0];
  if (result.status === "team-generation-failed") {
    throw new Error(`self-play smoke team generation failed: ${JSON.stringify(result.teams)}`);
  }
  if (!result.metrics.aiDecisionCount && result.status !== "ended") {
    throw new Error(`self-play should produce AI decisions or end immediately: ${JSON.stringify(result)}`);
  }
  const markdown = renderBattleAiSelfPlayExamMarkdownV4(report);
  if (!markdown.includes("Battle V4 AI Self-Play Exam Report") || !markdown.includes(result.question.id)) {
    throw new Error(`self-play markdown report missing expected content: ${markdown}`);
  }
  console.log("showdown-battle-core ai self-play exam smoke ok");
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
  const megaTimeline = compileShowdownPlaybackTimelineFromRawLog([
    "|player|p1|A|",
    "|player|p2|B|",
    "|gametype|singles",
    "|gen|7",
    "|",
    "|switch|p2a: Aerodactyl|Aerodactyl, L49, F|158/158",
    "|detailschange|p2a: Aerodactyl|Aerodactyl-Mega, L49, F",
    "|-mega|p2a: Aerodactyl|Aerodactyl|Aerodactylite",
  ], {sessionId: "timeline-mega-forme", previousIndex: 0});
  const detailsTransform = megaTimeline.groups.flatMap(group => group.calls).find(call => call.rawLine?.includes("|detailschange|p2a: Aerodactyl|Aerodactyl-Mega"));
  if (detailsTransform?.effect !== "aerodactylmega") {
    throw new Error(`detailschange transform effect should use species only, got ${detailsTransform?.effect}`);
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
  .then(showdownLikeSwitchResolverSmoke)
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
  .then(showdownChoicePressureMatrixSmoke)
  .then(humanInvalidChoicePreflightSmoke)
  .then(aiPureChoiceSmoke)
  .then(aiSpecialSystemSmoke)
  .then(aiMaxGuardTargetSmoke)
  .then(aiLockedMoveMissingTargetSmoke)
  .then(aiForceSwitchSmoke)
  .then(aiDexDamageEvaluatorSmoke)
  .then(aiSinglesDepth2SearchSmoke)
  .then(aiSinglesDynamicDepthSmoke)
  .then(aiOutcomeBucketSmoke)
  .then(aiTeamRoleAnalyzerSmoke)
  .then(aiTeamArchetypeAnalyzerSmoke)
  .then(aiRainSwitchRoleSmoke)
  .then(aiSwitchTargetOverrideSmoke)
  .then(aiValueFunctionResourceSmoke)
  .then(aiValueFunctionV2Smoke)
  .then(aiOutcomeBucketsSmoke)
  .then(aiActionOutcomeEstimatorSmoke)
  .then(aiSinglesSpeedStateSmoke)
  .then(aiSearchBudgetSmoke)
  .then(randomTeamGeneratorSmoke)
  .then(aiSelfPlayExamSmoke)
  .then(showdownPlaybackTimelineSmoke);
