import {
  addBattleCommandChoiceV4,
  applyBattleSessionToRun,
  createBattleCommandDraftV4,
  createBattleGameFromTrainingNode,
  isBattleCommandDraftDoneV4,
  normalizeBattleRequestV4,
  patchBattleRunLocalTeamsFromSnapshot,
  projectBattleViewModelV4,
  stringifyBattleCommandDraftV4,
  appendBattleSpecialChoiceSuffixV4,
  undoBattleCommandChoiceV4,
  withBattleMoveTargetSuffixV4,
  type BattleRequestV4,
  type BattleSessionSnapshotV4,
} from "./battle.js";
import {createTrainingRunApi, normalizeBattlePreferenceV4} from "./training.js";
import type {LocalPokemonV4, ShowdownPlayerIdV4, TrainingPlayerDraftV4, TrainingRunGameNodeV4, TrainingRunGameV4} from "./training.js";

const STAT_IDS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function stats(value: number) {
  return Object.fromEntries(STAT_IDS.map(stat => [stat, value])) as LocalPokemonV4["evs"];
}

function pikachu(localPokemonId: string, level: number, maxHp: number, entryHp: number, entryStatus: LocalPokemonV4["entryStatus"]): LocalPokemonV4 {
  return {
    localPokemonId,
    speciesId: "pikachu",
    name: "Pikachu",
    nameZh: "皮卡丘",
    nickname: "皮卡丘",
    level,
    gender: "N",
    shiny: false,
    itemId: "",
    abilityId: "static",
    abilityName: "Static",
    abilityNameZh: "静电",
    nature: "Serious",
    moves: [
      move("thunderbolt", "十万伏特"),
      move("quickattack", "电光一闪"),
      move("irontail", "铁尾"),
      move("protect", "守住"),
    ],
    evs: stats(0),
    ivs: stats(31),
    entryHp,
    entryStatus,
    maxHp,
    spriteUrl: "",
    shinySpriteUrl: "",
    frontSpriteUrl: "",
    backSpriteUrl: "",
    frontShinySpriteUrl: "",
    backShinySpriteUrl: "",
    iconUrl: "",
    iconStyle: "",
  };
}

function move(moveId: string, nameZh: string): LocalPokemonV4["moves"][number] {
  return {
    moveId,
    name: moveId,
    nameZh,
    type: "Electric",
    category: "Special",
    power: 90,
    accuracy: 100,
    pp: 15,
    maxPp: 15,
    remainingPp: 15,
  };
}

function player(playerId: ShowdownPlayerIdV4, pokemon: LocalPokemonV4[]): TrainingPlayerDraftV4 {
  return {
    playerId,
    name: playerId.toUpperCase(),
    avatar: "",
    controller: playerId === "p1" ? "local" : "ai",
    alliance: playerId === "p1" || playerId === "p3" ? "near" : "far",
    localTeam: {
      id: `team-${playerId}`,
      name: `${playerId} team`,
      pokemon,
    },
    bag: {maxSize: 50, items: []},
  };
}

const p1Team = [
  pikachu("pika-30", 30, 100, 50, ""),
  pikachu("pika-40", 40, 100, 50, ""),
  pikachu("pika-50", 50, 100, 50, "par"),
];
const p2Team = [
  pikachu("enemy-1", 30, 100, 100, ""),
  pikachu("enemy-2", 40, 100, 100, ""),
  pikachu("enemy-3", 50, 100, 100, ""),
];
const p1 = player("p1", p1Team);
const p2 = player("p2", p2Team);
const trainingApi = createTrainingRunApi({
  getItemDetail(id: string) {
    const system = id.startsWith("system-");
    const evolution = id === "linking-cord" || id === "linkingcord" || id === "universal-evolution-stone" || id === "universalevolutionstone";
    return {
      id,
      name: id,
      nameZh: id,
      kind: system ? "system-battle" : evolution ? "evolution" : "recovery",
      categoryLabel: system ? "系统战斗道具" : evolution ? "进化道具" : "恢复道具",
      source: system ? "system" : "v1-game",
      description: id,
      effectSummary: id,
      cost: system ? 0 : 300,
      canSale: !system,
      canBattleUse: false,
      canUse: !system,
      canUseToPokemon: !system,
      canTake: false,
      futureInstanceCompatible: true,
      iconUrl: "",
      iconStyle: "",
    };
  },
} as unknown as Parameters<typeof createTrainingRunApi>[0]);
const normalizedEmptyBag = trainingApi.normalizeBagState({items: []});
assert(normalizedEmptyBag.maxSize === 50, "bag default maxSize mismatch");
const duplicatedA = trainingApi.createItemInstance("potion");
const duplicatedB = trainingApi.createItemInstance("potion");
assert(duplicatedA.itemID === duplicatedB.itemID && duplicatedA.id !== duplicatedB.id, "same itemID instances must not stack");
const linkingCord = trainingApi.createItemInstance("linking-cord");
assert(linkingCord.type === "evolution", "linking-cord should create evolution item instances");
const gen7Bag = trainingApi.normalizeBagState({maxSize: 50, items: []}, "gen7");
assert(gen7Bag.items.some(item => item.itemID === "system-mega-stone"), "gen7 missing default Mega system item");
assert(gen7Bag.items.some(item => item.itemID === "system-z-crystal"), "gen7 missing default Z system item");
const gen7Again = trainingApi.ensureDefaultSystemItemsForRuleSet(gen7Bag, "gen7");
assert(gen7Again.items.filter(item => item.itemID === "system-mega-stone").length === 1, "gen7 should not duplicate Mega system item");
const gen8Bag = trainingApi.normalizeBagState({maxSize: 50, items: []}, "gen8");
assert(gen8Bag.items.some(item => item.itemID === "system-dynamax-band"), "gen8 missing default Dynamax Band");
const gen7ToGen8Bag = trainingApi.ensureDefaultSystemItemsForRuleSet(gen7Bag, "gen8");
assert(gen7ToGen8Bag.items.some(item => item.itemID === "system-dynamax-band"), "gen7 -> gen8 should add Dynamax Band");
assert(!gen7ToGen8Bag.items.some(item => item.itemID === "system-mega-stone"), "gen7 -> gen8 should remove Mega system item");
assert(!gen7ToGen8Bag.items.some(item => item.itemID === "system-z-crystal"), "gen7 -> gen8 should remove Z system item");
const gen9Bag = trainingApi.normalizeBagState({maxSize: 50, items: []}, "gen9");
assert(gen9Bag.items.some(item => item.itemID === "system-tera-orb"), "gen9 missing default Tera Orb");
const gen8ToGen9Bag = trainingApi.ensureDefaultSystemItemsForRuleSet(gen8Bag, "gen9");
assert(gen8ToGen9Bag.items.some(item => item.itemID === "system-tera-orb"), "gen8 -> gen9 should add Tera Orb");
assert(!gen8ToGen9Bag.items.some(item => item.itemID === "system-dynamax-band"), "gen8 -> gen9 should remove Dynamax Band");
const standardBag = trainingApi.normalizeBagState({maxSize: 50, items: []}, "standard");
assert(standardBag.items.length === 0, "standard should not receive default system items");
const gen9ToStandardBag = trainingApi.ensureDefaultSystemItemsForRuleSet(gen9Bag, "standard");
assert(gen9ToStandardBag.items.length === 0, "gen9 -> standard should remove managed system items");
const mappedMega = trainingApi.normalizeBagState({items: [{
  itemID: "system-mega-stone",
  mappedItemId: "charizarditex",
  mappedItemName: "Charizardite X",
  mappedItemNameZh: "喷火龙X进化石",
  mappedItemIconUrl: "/items/charizarditex.png",
  systemReforgeKind: "mega",
}]});
assert(mappedMega.items[0]?.mappedItemId === "charizarditex", "mappedItemId should survive bag normalize");
assert(mappedMega.items[0]?.mappedItemNameZh === "喷火龙X进化石", "mappedItemNameZh should survive bag normalize");
const node: TrainingRunGameNodeV4 = {
  id: "identity-node",
  index: 0,
  state: "running",
  p1: "p1",
  p2: "p2",
  p3: null,
  p4: null,
  mode: "singles",
  ruleSet: "gen9",
  seed: "identity-seed",
  participants: {p1, p2},
  battleGame: {id: "battle-game", status: "running"},
};
const run: TrainingRunGameV4 = {
  version: 1,
  id: "identity-run",
  source: "training",
  status: "battling",
  profileId: "profile",
  createdAt: "2026-06-26T00:00:00.000Z",
  updatedAt: "2026-06-26T00:00:00.000Z",
  scenario: {
    id: "scenario",
    name: "identity scenario",
    mode: "singles",
    ruleSet: "gen9",
    battleCount: 1,
    players: [p1, p2],
    selectedNpcIds: {p2: "test"},
  },
  players: {p1, p2},
  currentNodeId: node.id,
  gameMap: [node],
  result: null,
  battlePreference: normalizeBattlePreferenceV4({ruleSet: "gen9"}),
};

const {sessionInput} = createBattleGameFromTrainingNode(run, node);
const sessionP1 = sessionInput.players.find(entry => entry.playerId === "p1");
assert(sessionP1, "missing p1 session player");
const sessionP2 = sessionInput.players.find(entry => entry.playerId === "p2");
assert(sessionP2, "missing p2 session player");
const mapping = sessionP1.teamMapping || [];
assert(mapping.length === 3, `expected 3 p1 mapping rows, got ${mapping.length}`);
assert(new Set(mapping.map(entry => entry.showdownIdentityToken)).size === 3, "expected unique p1 tokens");
for (let index = 0; index < mapping.length; index += 1) {
  const row = mapping[index]!;
  assert(row.teamIndex === index, `mapping ${index} teamIndex mismatch`);
  assert(row.choiceIndex === index + 1, `mapping ${index} choiceIndex mismatch`);
  assert(row.localPokemonId === p1Team[index]!.localPokemonId, `mapping ${index} localPokemonId mismatch`);
  assert(row.showdownIdentityToken === row.showdownId, `mapping ${index} showdownId mismatch`);
  assert(row.showdownIdentityToken === row.pokeballId, `mapping ${index} pokeballId mismatch`);
  assert(sessionP1.team[index]?.pokeball === row.showdownIdentityToken, `team ${index} pokeball mismatch`);
}
for (const token of mapping.map(entry => entry.showdownIdentityToken)) {
  assert(sessionInput.showdownIdPool.used.includes(token), `pool missing used token ${token}`);
  assert(!sessionInput.showdownIdPool.available.includes(token), `pool still has available token ${token}`);
}

const systemMega = trainingApi.createItemInstance("system-mega-stone", {id: "system-mega-1", mappedItemId: "charizarditex", mappedItemName: "Charizardite X", mappedItemNameZh: "喷火龙X进化石", systemReforgeKind: "mega"});
const systemTera = trainingApi.createItemInstance("system-tera-orb", {id: "system-tera-1", mappedTeraType: "Fairy", mappedTeraTypeZh: "妖精", systemReforgeKind: "tera"});
const mappedPlayer = player("p1", [{...p1Team[0]!, itemId: "charizarditex", heldItemInstanceId: undefined}]);
mappedPlayer.bag = {maxSize: 50, items: [systemMega, systemTera]};
const mappedNode = {...node, participants: {...node.participants, p1: mappedPlayer}, ruleSet: "gen9" as const};
const mappedRun = {...run, players: {...run.players, p1: mappedPlayer}, gameMap: [mappedNode]};
const {sessionInput: mappedSessionInput} = createBattleGameFromTrainingNode(mappedRun, mappedNode);
const mappedSessionP1 = mappedSessionInput.players.find(entry => entry.playerId === "p1");
assert(mappedSessionP1?.team[0]?.item === "charizarditex", "system Mega should compile to mapped item");
assert(mappedSessionP1?.team[0]?.teraType === "Fairy", "system Tera orb should compile to teraType");
const unreforgedSystemPlayer = player("p1", [{...p1Team[0]!, itemId: "system-mega-stone", heldItemInstanceId: systemMega.id}]);
unreforgedSystemPlayer.bag = {maxSize: 50, items: [trainingApi.createItemInstance("system-mega-stone", {id: systemMega.id})]};
const unreforgedNode = {...node, participants: {...node.participants, p1: unreforgedSystemPlayer}, ruleSet: "gen7" as const};
const unreforgedRun = {...run, players: {...run.players, p1: unreforgedSystemPlayer}, gameMap: [unreforgedNode]};
const {sessionInput: unreforgedSessionInput} = createBattleGameFromTrainingNode(unreforgedRun, unreforgedNode);
assert(!unreforgedSessionInput.players.find(entry => entry.playerId === "p1")?.team[0]?.item, "unmapped system item should not compile as held item");

const endedSnapshot: BattleSessionSnapshotV4 = {
  id: "identity-session",
  runId: run.id,
  nodeId: node.id,
  status: "ended",
  mode: "singles",
  ruleSet: "gen9",
  turn: 9,
  winner: "p1",
  error: null,
  players: sessionInput.players,
  showdownIdPool: sessionInput.showdownIdPool,
  requests: {
    p1: {
      requestType: "move",
      side: {
        id: "p1",
        name: "P1",
        pokemon: [
          sidePokemon(mapping[0]!.showdownIdentityToken, "25/100 brn", true),
          sidePokemon(mapping[1]!.showdownIdentityToken, "50/100 par", false),
          sidePokemon(mapping[2]!.showdownIdentityToken, "100/100 slp", false),
        ],
      },
    },
  },
  active: [],
  rawLog: ["|win|P1"],
  debug: {inputLog: [], lastChoices: [], playerStreams: []},
  createdAt: "2026-06-26T00:00:00.000Z",
  updatedAt: "2026-06-26T00:00:00.000Z",
};

function sidePokemon(pokeball: string, condition: string, active: boolean) {
  return {
    ident: "p1: Pikachu",
    details: "Pikachu, L50",
    condition,
    active,
    moves: ["thunderbolt", "quickattack", "irontail", "protect"],
    ability: "static",
    item: "",
    name: "Pikachu",
    fainted: condition.includes("fnt"),
    pokeball,
  };
}

const synced = applyBattleSessionToRun(run, endedSnapshot);
const syncedTeam = synced.players.p1?.localTeam.pokemon || [];
assert(syncedTeam.map(pokemon => pokemon.localPokemonId).join(",") === "pika-30,pika-40,pika-50", "localPokemonId order changed");
assert(syncedTeam[0]?.level === 30 && syncedTeam[0].entryHp === 25 && syncedTeam[0].entryStatus === "brn", "slot 1 sync mismatch");
assert(syncedTeam[1]?.level === 40 && syncedTeam[1].entryHp === 50 && syncedTeam[1].entryStatus === "par", "slot 2 sync mismatch");
assert(syncedTeam[2]?.level === 50 && syncedTeam[2].entryHp === 100 && syncedTeam[2].entryStatus === "slp", "slot 3 sync mismatch");

const ppSynced = applyBattleSessionToRun(run, {
  ...endedSnapshot,
  requests: {},
  debug: {
    ...endedSnapshot.debug,
    latestSidePokemon: {
      p1: [
        sidePokemon(mapping[0]!.showdownIdentityToken, "25/100 brn", true),
        sidePokemon(mapping[1]!.showdownIdentityToken, "50/100 par", false),
        sidePokemon(mapping[2]!.showdownIdentityToken, "100/100 slp", false),
      ],
    },
    latestMovePpByPokemon: {
      p1: {
        [mapping[0]!.showdownIdentityToken]: [
          {move: "Thunderbolt", id: "thunderbolt", pp: 9, maxpp: 15, target: "normal"},
          {move: "Quick Attack", id: "quickattack", pp: 27, maxpp: 30, target: "normal"},
        ],
      },
    },
  },
});
const ppSyncedTeam = ppSynced.players.p1?.localTeam.pokemon || [];
assert(ppSyncedTeam[0]?.moves[0]?.remainingPp === 9, "battle PP cache should sync active move PP");
assert(ppSyncedTeam[0]?.moves[1]?.remainingPp === 27, "battle PP cache should sync second move PP");
assert(ppSyncedTeam[1]?.moves[0]?.remainingPp === 15, "battle PP sync should not touch pokemon without PP cache");

const runningTeamStateSynced = patchBattleRunLocalTeamsFromSnapshot(run, {
  ...endedSnapshot,
  status: "running",
  winner: null,
  requests: {},
  active: [],
  teamStateByPlayer: {
    p1: {
      updatedAt: "2026-06-26T00:00:01.000Z",
      pokemonByToken: {
        [mapping[0]!.showdownIdentityToken]: {
          localPokemonId: mapping[0]!.localPokemonId,
          showdownIdentityToken: mapping[0]!.showdownIdentityToken,
          showdownId: mapping[0]!.showdownId,
          pokeballId: mapping[0]!.pokeballId,
          pokeball: mapping[0]!.showdownIdentityToken,
          hp: 44,
          maxHp: 100,
          status: "par",
          fainted: false,
          moves: [
            {moveId: "thunderbolt", remainingPp: 8, maxPp: 15},
            {moveId: "quickattack", remainingPp: 26, maxPp: 30},
          ],
        },
      },
    },
  },
  debug: {...endedSnapshot.debug, latestSidePokemon: {}, latestMovePpByPokemon: {}},
});
const runningTeamStatePokemon = runningTeamStateSynced.players.p1?.localTeam.pokemon[0];
assert(runningTeamStatePokemon?.entryHp === 44 && runningTeamStatePokemon.entryStatus === "par", "running teamState should sync HP/status before battle end");
assert(runningTeamStatePokemon?.moves[0]?.remainingPp === 8, "running teamState should sync move PP before battle end");

const latestSidePokemonSnapshot: BattleSessionSnapshotV4 = {
  ...endedSnapshot,
  requests: {},
  active: [
    {
      ident: "p1a: Pikachu",
      playerId: "p1",
      slot: "p1a",
      species: "Pikachu",
      details: "Pikachu, L30",
      condition: "0 fnt",
      hp: 0,
      maxHp: 100,
      status: "fnt",
      fainted: true,
    },
  ],
  debug: {
    ...endedSnapshot.debug,
    latestSidePokemon: {
      p1: [
        sidePokemon(mapping[0]!.showdownIdentityToken, "67/100", true),
        sidePokemon(mapping[1]!.showdownIdentityToken, "50/100 par", false),
        sidePokemon(mapping[2]!.showdownIdentityToken, "100/100 slp", false),
      ],
    },
  },
};
const latestSideSynced = applyBattleSessionToRun(run, latestSidePokemonSnapshot);
const latestSideTeam = latestSideSynced.players.p1?.localTeam.pokemon || [];
assert(latestSideTeam[0]?.entryHp === 0, "active overlay should sync fainted active when ended request is missing");
assert(latestSideTeam[1]?.entryHp === 50 && latestSideTeam[1].entryStatus === "par", "latest side cache should sync bench status");

const protocolActiveSnapshot: BattleSessionSnapshotV4 = {
  ...endedSnapshot,
  status: "running",
  mode: "doubles",
  winner: null,
  requests: {},
  active: [
    {
      ident: "p1a: Pikachu",
      playerId: "p1",
      slot: "p1a",
      species: "Pikachu",
      details: "Pikachu, L50",
      condition: "25/100 brn",
      hp: 25,
      maxHp: 100,
      status: "brn",
      fainted: false,
    },
    {
      ident: "p1b: Raichu",
      playerId: "p1",
      slot: "p1b",
      species: "Raichu",
      details: "Raichu, L50",
      condition: "80/100",
      hp: 80,
      maxHp: 100,
      status: "",
      fainted: false,
    },
  ],
  players: [{
    ...sessionP1,
    draft: {
      ...sessionP1.draft,
      localTeam: {
        ...sessionP1.draft.localTeam,
        pokemon: [
          {...p1Team[0]!, speciesId: "charizard", name: "Charizard", nameZh: "喷火龙"},
          {...p1Team[1]!, speciesId: "dragonite", name: "Dragonite", nameZh: "快龙"},
          {...p1Team[2]!, speciesId: "pikachu", name: "Pikachu", nameZh: "皮卡丘"},
          {...pikachu("raichu-active", 50, 100, 80, ""), speciesId: "raichu", name: "Raichu", nameZh: "雷丘"},
        ],
      },
    },
    teamMapping: [
      {...mapping[0]!, speciesId: "charizard", displayName: "喷火龙"},
      {...mapping[1]!, speciesId: "dragonite", displayName: "快龙"},
      {...mapping[2]!, speciesId: "pikachu", displayName: "皮卡丘"},
      {
        playerId: "p1",
        teamIndex: 3,
        choiceIndex: 4,
        localPokemonId: "raichu-active",
        showdownIdentityToken: "masterball",
        showdownId: "masterball",
        pokeballId: "masterball",
        speciesId: "raichu",
        displayName: "雷丘",
      },
    ],
  }],
};
const activeNames = projectBattleViewModelV4(protocolActiveSnapshot, "p1").nearTeam.map(slot => slot.speciesId).join(",");
assert(activeNames === "pikachu,raichu", `protocol active mapping should ignore empty requests, got ${activeNames}`);

const formeProtocolSnapshot: BattleSessionSnapshotV4 = {
  ...protocolActiveSnapshot,
  mode: "singles",
  active: [
    {
      ident: "p2a: Greninja",
      playerId: "p2",
      slot: "p2a",
      species: "Greninja",
      details: "Greninja, L45",
      condition: "133/133",
      hp: 133,
      maxHp: 133,
      status: "",
      fainted: false,
    },
  ],
  players: [{
    ...sessionP2,
    draft: {
      ...sessionP2.draft,
      localTeam: {
        ...sessionP2.draft.localTeam,
        pokemon: [
          {...p2Team[0]!, localPokemonId: "enemy-greninja-bond", speciesId: "greninjabond", name: "Greninja-Bond", nameZh: "甲贺忍蛙（牵绊变身）", maxHp: 133, entryHp: 133},
        ],
      },
    },
    teamMapping: [{
      playerId: "p2",
      teamIndex: 0,
      choiceIndex: 1,
      localPokemonId: "enemy-greninja-bond",
      showdownIdentityToken: "masterball",
      showdownId: "masterball",
      pokeballId: "masterball",
      speciesId: "greninjabond",
      displayName: "甲贺忍蛙（牵绊变身）",
    }],
  }],
};
const formeFarSpecies = projectBattleViewModelV4(formeProtocolSnapshot, "p1").farTeam.map(slot => slot.speciesId).join(",");
assert(formeFarSpecies === "greninjabond", `protocol forme base species should map to battle-only local species, got ${formeFarSpecies}`);

const singlesMove = normalizeBattleRequestV4(moveRequest(1), "p1", "singles", "standard");
assert(singlesMove.requestType === "move", "singles move requestType mismatch");
assert(singlesMove.requestLength === 1, "singles move requestLength mismatch");
assert(singlesMove.activeIndex === 0, "singles move activeIndex mismatch");
assert(singlesMove.choiceIndexByTeamIndex[1] === 2, "singles choice index mapping mismatch");

const disabledMoveView = projectBattleViewModelV4({
  ...protocolActiveSnapshot,
  requests: {
    p1: {
      ...moveRequest(1),
      active: [{
        moves: [
          {move: "Thunderbolt", id: "thunderbolt", pp: 0, maxpp: 15, target: "normal"},
          {move: "Quick Attack", id: "quickattack", pp: 30, maxpp: 30, target: "normal"},
          {move: "Iron Tail", id: "irontail", pp: 15, maxpp: 15, target: "normal", disabled: true},
          {move: "Protect", id: "protect", pp: 10, maxpp: 10, target: "self"},
        ],
      }],
    },
  },
}, "p1");
const disabledMoveActions = disabledMoveView.command.actions.filter(action => action.kind === "move");
assert(disabledMoveActions.length === 4, "disabled or empty-PP moves should stay visible as command actions");
assert(disabledMoveActions[0]?.moveIndex === 0 && disabledMoveActions[0].move.pp === 0, "first PP0 move should keep slot index");
assert(disabledMoveActions[2]?.moveIndex === 2 && disabledMoveActions[2].move.disabled, "disabled move should keep slot index");

const doublesMove = normalizeBattleRequestV4(moveRequest(2), "p1", "doubles", "standard");
assert(doublesMove.requestType === "move", "doubles move requestType mismatch");
assert(doublesMove.requestLength === 2, "doubles move requestLength mismatch");
assert(doublesMove.activeIndex === 0, "doubles move activeIndex mismatch");
assert(doublesMove.targetable, "doubles move should be targetable like Showdown client fixRequest");

const faintedDoublesMove = normalizeBattleRequestV4({
  ...moveRequest(2),
  active: [
    {moves: [{move: "Shadow Punch", id: "shadowpunch", pp: 20, maxpp: 20, target: "normal"}]},
    {moves: [{move: "Aqua Tail", id: "aquatail", pp: 16, maxpp: 16, target: "normal"}]},
  ],
  side: {
    id: "p1",
    name: "P1",
    pokemon: [
      sidePokemon("token-1", "0 fnt", true),
      sidePokemon("token-2", "80/100", true),
      sidePokemon("token-3", "90/100", false),
    ],
  },
}, "p1", "doubles", "standard");
assert(faintedDoublesMove.requestLength === 2, "fainted doubles requestLength should stay aligned to active length");
assert(faintedDoublesMove.activeRequests[0] === null, "fainted active should normalize to null");
assert(faintedDoublesMove.activeRequests[1], "live second active should remain actionable");
assert(faintedDoublesMove.activeIndex === 1, "fainted doubles activeIndex should advance to live slot");
let faintedDoublesDraft = createBattleCommandDraftV4(faintedDoublesMove);
assert(faintedDoublesDraft.choices[0] === "pass", "fainted doubles draft should auto-pass first slot");
assert(faintedDoublesDraft.activeIndex === 1, "fainted doubles draft should operate second slot");
faintedDoublesDraft = addBattleCommandChoiceV4(faintedDoublesDraft, faintedDoublesMove, "move 1 +2");
assert(isBattleCommandDraftDoneV4(faintedDoublesDraft), "fainted doubles second choice should complete draft");
assert(stringifyBattleCommandDraftV4(faintedDoublesDraft) === "pass, move 1 +2", "fainted doubles final choice mismatch");

const coopMove = normalizeBattleRequestV4({
  ...moveRequest(1),
  ally: {id: "p3", name: "Ally", pokemon: [sidePokemon("ally-token", "100/100", true)]},
}, "p1", "coop", "standard");
assert(coopMove.requestType === "move", "coop move requestType mismatch");
assert(coopMove.requestLength === 1, "coop move requestLength mismatch");
assert(coopMove.readonlyAlly?.pokemon.length === 1, "coop readonly ally missing");
assert(coopMove.sidePokemon.length === 3, "coop local side pokemon mismatch");

const forceSwitch = normalizeBattleRequestV4({...moveRequest(2), active: undefined, forceSwitch: [true, false]}, "p1", "doubles", "standard");
assert(forceSwitch.requestType === "switch", "forceSwitch requestType mismatch");
assert(forceSwitch.requestLength === 2, "forceSwitch requestLength mismatch");
assert(forceSwitch.activeIndex === 0, "forceSwitch activeIndex mismatch");

const teamPreview = normalizeBattleRequestV4({...moveRequest(1), active: undefined, teamPreview: true, chosenTeamSize: 3}, "p1", "singles", "standard");
assert(teamPreview.requestType === "team", "teamPreview requestType mismatch");
assert(teamPreview.requestLength === 3, "teamPreview requestLength mismatch");

const waitRequest = normalizeBattleRequestV4({...moveRequest(1), active: undefined, wait: true}, "p1", "singles", "standard");
assert(waitRequest.requestType === "wait", "wait requestType mismatch");
assert(waitRequest.requestLength === 0, "wait requestLength mismatch");
assert(waitRequest.noCancel, "wait should be noCancel");

const singlesDraft = addBattleCommandChoiceV4(createBattleCommandDraftV4(singlesMove), singlesMove, "move 1");
assert(isBattleCommandDraftDoneV4(singlesDraft), "singles move draft should be done");
assert(stringifyBattleCommandDraftV4(singlesDraft) === "move 1", "singles move final choice mismatch");
assert(appendBattleSpecialChoiceSuffixV4("move 1", "max") === "move 1 max", "special suffix should match Showdown client order");
assert(withBattleMoveTargetSuffixV4("move 1 max", "+1") === "move 1 max +1", "target suffix should stay after special suffix");

let doublesDraft = createBattleCommandDraftV4(doublesMove);
doublesDraft = addBattleCommandChoiceV4(doublesDraft, doublesMove, "move 1");
assert(doublesDraft.currentMove?.baseChoice === "move 1", "doubles naked move should wait for explicit target");
assert(!doublesDraft.choices.length, "doubles naked move should not commit before target");
doublesDraft = addBattleCommandChoiceV4(doublesDraft, doublesMove, "move 1 +1");
assert(!isBattleCommandDraftDoneV4(doublesDraft), "doubles first targeted move should not be done");
assert(doublesDraft.activeIndex === 1, "doubles activeIndex should advance to second active");
doublesDraft = undoBattleCommandChoiceV4(doublesDraft, doublesMove);
assert(!doublesDraft.choices[0], "doubles undo should clear first choice");
assert(doublesDraft.activeIndex === 0, "doubles undo should return to first active");
doublesDraft = addBattleCommandChoiceV4(doublesDraft, doublesMove, "move 1 +1");
doublesDraft = addBattleCommandChoiceV4(doublesDraft, doublesMove, "move 2 +2");
assert(isBattleCommandDraftDoneV4(doublesDraft), "doubles second move should be done");
assert(stringifyBattleCommandDraftV4(doublesDraft) === "move 1 +1, move 2 +2", "doubles move final choice mismatch");

let doublesTargetDraft = createBattleCommandDraftV4(doublesMove);
doublesTargetDraft = addBattleCommandChoiceV4(doublesTargetDraft, doublesMove, "move 1 +2");
assert(!isBattleCommandDraftDoneV4(doublesTargetDraft), "doubles target first move should not be done");
assert(doublesTargetDraft.choices[0] === "move 1 +2", "doubles target choice mismatch");

let mixedDraft = createBattleCommandDraftV4(doublesMove);
mixedDraft = addBattleCommandChoiceV4(mixedDraft, doublesMove, "switch 3");
mixedDraft = addBattleCommandChoiceV4(mixedDraft, doublesMove, "move 1 +1");
assert(stringifyBattleCommandDraftV4(mixedDraft) === "switch 3, move 1 +1", "doubles mixed final choice mismatch");

const forceSwitchDraft = addBattleCommandChoiceV4(createBattleCommandDraftV4(forceSwitch), forceSwitch, "switch 3");
assert(isBattleCommandDraftDoneV4(forceSwitchDraft), "forceSwitch [true,false] should be done");
assert(stringifyBattleCommandDraftV4(forceSwitchDraft) === "switch 3, pass", "forceSwitch pass choice mismatch");

const doubleForceSwitch = normalizeBattleRequestV4({
  ...moveRequest(2),
  active: undefined,
  forceSwitch: [true, true],
  side: {
    id: "p1",
    name: "P1",
    pokemon: [
      sidePokemon("token-1", "0 fnt", true),
      sidePokemon("token-2", "0 fnt", true),
      sidePokemon("token-3", "90/100", false),
      sidePokemon("token-4", "80/100", false),
    ],
  },
}, "p1", "doubles", "standard");
let repeatedSwitchDraft = addBattleCommandChoiceV4(createBattleCommandDraftV4(doubleForceSwitch), doubleForceSwitch, "switch 3");
repeatedSwitchDraft = addBattleCommandChoiceV4(repeatedSwitchDraft, doubleForceSwitch, "switch 3");
assert(!isBattleCommandDraftDoneV4(repeatedSwitchDraft), "repeated switch should be blocked");
assert(repeatedSwitchDraft.choices.join(", ") === "switch 3", "repeated switch choices mismatch");

const oneBenchDoubleForceSwitch = normalizeBattleRequestV4({
  ...moveRequest(2),
  active: undefined,
  forceSwitch: [true, true],
  side: {
    id: "p1",
    name: "P1",
    pokemon: [
      sidePokemon("token-1", "0 fnt", true),
      sidePokemon("token-2", "0 fnt", true),
      sidePokemon("token-3", "90/100", false),
    ],
  },
}, "p1", "doubles", "standard");
const oneBenchForceSwitchDraft = addBattleCommandChoiceV4(createBattleCommandDraftV4(oneBenchDoubleForceSwitch), oneBenchDoubleForceSwitch, "switch 3");
assert(isBattleCommandDraftDoneV4(oneBenchForceSwitchDraft), "double forceSwitch with one bench should auto-pass remaining slot");
assert(stringifyBattleCommandDraftV4(oneBenchForceSwitchDraft) === "switch 3, pass", "double forceSwitch with one bench final choice mismatch");

const firstSlotTrappedMove = normalizeBattleRequestV4({
  ...moveRequest(2),
  active: [
    {trapped: true, moves: [{move: "Shadow Punch", id: "shadowpunch", pp: 20, maxpp: 20, target: "normal"}]},
    {moves: [{move: "Aqua Tail", id: "aquatail", pp: 16, maxpp: 16, target: "normal"}]},
  ],
}, "p1", "doubles", "standard");
let secondSlotSwitchDraft = addBattleCommandChoiceV4(createBattleCommandDraftV4(firstSlotTrappedMove), firstSlotTrappedMove, "move 1 +1");
assert(secondSlotSwitchDraft.activeIndex === 1, "second slot should become active after first trapped slot moves");
const secondSlotSwitchView = projectBattleViewModelV4({
  ...protocolActiveSnapshot,
  requests: {p1: firstSlotTrappedMove.rawRequest},
}, "p1", secondSlotSwitchDraft);
const benchSwitchAction = secondSlotSwitchView.command.switchActions.find(action => action.pokemonIndex === 2);
assert(benchSwitchAction && !benchSwitchAction.disabled, "second active slot should still be able to switch when first slot is trapped");
secondSlotSwitchDraft = addBattleCommandChoiceV4(secondSlotSwitchDraft, firstSlotTrappedMove, "switch 3");
assert(isBattleCommandDraftDoneV4(secondSlotSwitchDraft), "second slot switch should complete draft");
assert(stringifyBattleCommandDraftV4(secondSlotSwitchDraft) === "move 1 +1, switch 3", "second slot switch final choice mismatch");

const waitDraft = createBattleCommandDraftV4(waitRequest);
assert(isBattleCommandDraftDoneV4(waitDraft), "wait draft should be done");
assert(stringifyBattleCommandDraftV4(waitDraft) === "", "wait draft should stringify empty");

const rechargeMove = normalizeBattleRequestV4({
  ...moveRequest(2),
  active: [
    {moves: [{move: "Recharge", id: "recharge"}]},
    {moves: [{move: "Aqua Tail", id: "aquatail", pp: 16, maxpp: 16, target: "normal"}]},
  ],
}, "p1", "doubles", "standard");
const rechargeDraft = addBattleCommandChoiceV4(createBattleCommandDraftV4(rechargeMove), rechargeMove, "move 1");
assert(rechargeDraft.choices[0] === "move 1", "recharge should not wait for target");
assert(!rechargeDraft.currentMove, "recharge should not set currentMove target picker");

function moveRequest(activeLength: number): BattleRequestV4 {
  return {
    requestType: "move",
    rqid: 7,
    targetable: activeLength > 1,
    active: Array.from({length: activeLength}, () => ({
      moves: [
        {move: "Thunderbolt", id: "thunderbolt", pp: 15, maxpp: 15, target: "normal"},
        {move: "Quick Attack", id: "quickattack", pp: 30, maxpp: 30, target: "normal"},
      ],
    })),
    side: {
      id: "p1",
      name: "P1",
      pokemon: [
        sidePokemon("token-1", "100/100", activeLength >= 1),
        sidePokemon("token-2", "80/100", activeLength >= 2),
        sidePokemon("token-3", "90/100", false),
      ],
    },
  };
}

console.log("identity sync smoke ok");
