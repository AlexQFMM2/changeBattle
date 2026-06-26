import {
  applyBattleSessionToRun,
  createBattleGameFromTrainingNode,
  type BattleSessionSnapshotV4,
} from "./battle.js";
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
    bag: {items: []},
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
};

const {sessionInput} = createBattleGameFromTrainingNode(run, node);
const sessionP1 = sessionInput.players.find(entry => entry.playerId === "p1");
assert(sessionP1, "missing p1 session player");
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
  debug: {inputLog: [], lastChoices: []},
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

console.log("identity sync smoke ok");
