import type {
  ShowdownSpecialChoiceV4,
  ShowdownSpecialSystemV4,
  ShowdownParsedChoiceV4,
} from "@changebattle-v2/showdown-battle-core/showdownCommand";
import {
  appendShowdownSpecialChoiceSuffixV4,
  parseShowdownChoiceCommandV4,
  showdownSpecialChoiceAllowedForRuleSetV4,
  showdownSpecialChoiceSuffixV4,
  showdownSpecialSystemAllowedForRuleSetV4,
  showdownSpecialSystemForChoiceV4,
  stringifyShowdownChoiceCommandV4,
  withShowdownMoveTargetSuffixV4,
} from "@changebattle-v2/showdown-battle-core/showdownCommand";
import type {
  LocalPokemonV4,
  ShowdownPlayerIdV4,
  TrainingModeV4,
  TrainingPlayerDraftV4,
  TrainingRuleSetV4,
  TrainingRunGameNodeV4,
  TrainingRunGameV4,
} from "./training.js";
import {battleDebugLog} from "./battleDebug.js";

export type BattleRequestTypeV4 = "move" | "switch" | "team" | "wait";

export type BattleGameV4 = {
  id: string;
  sessionId: string | null;
  runId: string;
  nodeId: string;
  status: "creating" | "running" | "ended" | "blocked";
  createdAt: string;
  updatedAt: string;
  error: string | null;
};

export type BattleMoveRequestV4 = {
  move: string;
  id: string;
  pp?: number;
  maxpp?: number;
  target?: string;
  disabled?: boolean;
  zMove?: BattleMoveRequestV4 | null;
  maxMove?: BattleMoveRequestV4 | null;
};

export type BattleSpecialChoiceV4 = ShowdownSpecialChoiceV4;
export type BattleSpecialSystemV4 = ShowdownSpecialSystemV4;

export type BattleSpecialChoiceOptionV4 = {
  id: BattleSpecialChoiceV4;
  label: string;
  choiceSuffix: string;
  activeIndex: number;
  moveIndex: number;
  moveName?: string;
  typeLabel?: string;
  ruleAllowed: boolean;
  disabled?: boolean;
};

export type BattleActiveRequestV4 = {
  moves?: BattleMoveRequestV4[];
  maxMoves?: BattleMoveRequestV4[];
  zMoves?: Array<BattleMoveRequestV4 | null>;
  trapped?: boolean;
  maybeTrapped?: boolean;
  maybeDisabled?: boolean;
  maybeLocked?: boolean;
  canDynamax?: boolean;
  canMegaEvo?: boolean;
  canMegaEvoX?: boolean;
  canMegaEvoY?: boolean;
  canUltraBurst?: boolean;
  canTerastallize?: string;
  canZMove?: Array<BattleMoveRequestV4 | null>;
  gigantamax?: boolean;
};

export type BattleRequestV4 = {
  requestType?: BattleRequestTypeV4;
  rqid?: number;
  wait?: boolean;
  teamPreview?: boolean;
  maxTeamSize?: number;
  maxChosenTeamSize?: number;
  chosenTeamSize?: number;
  noCancel?: boolean;
  targetable?: boolean;
  active?: Array<BattleActiveRequestV4 | null>;
  forceSwitch?: boolean[];
  side?: {
    id: ShowdownPlayerIdV4;
    name: string;
    pokemon: Array<{
      ident: string;
      details: string;
      condition: string;
      active?: boolean;
      commanding?: boolean;
      moves?: string[];
      item?: string;
      ability?: string;
      name?: string;
      fainted?: boolean;
      pokeball?: string;
    }>;
  };
  ally?: {
    id: string;
    name: string;
    pokemon: Array<{
      ident: string;
      details: string;
      condition: string;
      active?: boolean;
      moves?: string[];
      item?: string;
      ability?: string;
      name?: string;
      fainted?: boolean;
      pokeball?: string;
    }>;
  };
};

export type RequestSidePokemonV4 = NonNullable<BattleRequestV4["side"]>["pokemon"][number];

export type BattleNormalizedRequestV4 = {
  playerId: ShowdownPlayerIdV4;
  mode: TrainingModeV4;
  ruleSet: TrainingRuleSetV4;
  requestType: BattleRequestTypeV4;
  rqid?: number;
  noCancel: boolean;
  targetable: boolean;
  requestLength: number;
  activeIndex: number;
  activeRequests: Array<BattleActiveRequestV4 | null>;
  forceSwitch: boolean[];
  sidePokemon: RequestSidePokemonV4[];
  readonlyAlly: BattleRequestV4["ally"] | null;
  choiceIndexByTeamIndex: Record<number, number>;
  rawRequest: BattleRequestV4;
};

export type BattleCommandDraftV4 = {
  playerId: ShowdownPlayerIdV4;
  mode: TrainingModeV4;
  requestType: BattleRequestTypeV4;
  rqid?: number;
  requestLength: number;
  activeIndex: number;
  choices: string[];
  currentMove: null | {
    moveIndex: number;
    baseChoice: string;
    requiresTarget: boolean;
    selectedSpecial?: BattleSpecialChoiceV4 | null;
  };
  alreadySwitchingIn: number[];
  noCancel: boolean;
  isDone: boolean;
};

export type BattleTargetActionV4 = {
  label: string;
  choiceSuffix: string;
  targetSlot: "far-1" | "far-2" | "near-1" | "near-2";
  side: "near" | "far";
  position: 1 | 2;
  disabled?: boolean;
};

export type ShowdownTeamPokemonMappingV4 = {
  playerId: ShowdownPlayerIdV4;
  teamIndex: number;
  choiceIndex: number;
  localPokemonId: string;
  showdownIdentityToken: string;
  showdownId: string;
  pokeballId: string;
  speciesId: string;
  displayName: string;
};

export type ShowdownIdPoolStateV4 = {
  used: string[];
  available: string[];
};

export type LocalPokemonResolutionV4 = {
  localPokemon: LocalPokemonV4 | null;
  mapping: ShowdownTeamPokemonMappingV4 | null;
  teamIndex: number;
  choiceIndex: number;
  token: string;
  fallbackReason: string;
};

export function resolveLocalPokemonFromRequestRow(
  row: RequestSidePokemonV4 | null | undefined,
  mapping: ShowdownTeamPokemonMappingV4[] | null | undefined,
  localTeam: LocalPokemonV4[],
  index: number,
): LocalPokemonResolutionV4 {
  const safeMapping = mapping || [];
  const choiceIndex = index + 1;
  const rowToken = toId(row?.pokeball || "");
  if (rowToken) {
    const byToken = safeMapping.find(entry =>
      toId(entry.showdownIdentityToken) === rowToken ||
      toId(entry.showdownId) === rowToken ||
      toId(entry.pokeballId) === rowToken
    );
    if (byToken) {
      return resolutionFromMapping(byToken, localTeam, "token");
    }
  }

  const byIndex = safeMapping.find(entry => entry.choiceIndex === choiceIndex || entry.teamIndex === index);
  if (byIndex) {
    return resolutionFromMapping(byIndex, localTeam, rowToken ? "token-miss-index" : "index");
  }

  if (row) {
    const wanted = new Set([row.name, row.ident.split(":").pop() || "", row.details.split(",")[0] || ""].map(value => toId(value)).filter(Boolean));
    const localPokemon = localTeam.find(pokemon => [pokemon.speciesId, pokemon.name, pokemon.nameZh, pokemon.nickname].some(value => wanted.has(toId(value || "")))) || null;
    if (localPokemon) {
      return {
        localPokemon,
        mapping: null,
        teamIndex: localTeam.indexOf(localPokemon),
        choiceIndex,
        token: rowToken,
        fallbackReason: "name-species",
      };
    }
  }

  const byLocalIndex = localTeam[index] || null;
  return {
    localPokemon: byLocalIndex,
    mapping: null,
    teamIndex: byLocalIndex ? index : -1,
    choiceIndex,
    token: rowToken,
    fallbackReason: byLocalIndex ? "local-index" : "unresolved",
  };
}

function resolutionFromMapping(mapping: ShowdownTeamPokemonMappingV4, localTeam: LocalPokemonV4[], fallbackReason: string): LocalPokemonResolutionV4 {
  const localPokemon = localTeam.find(pokemon => pokemon.localPokemonId === mapping.localPokemonId) || localTeam[mapping.teamIndex] || null;
  return {
    localPokemon,
    mapping,
    teamIndex: mapping.teamIndex,
    choiceIndex: mapping.choiceIndex,
    token: mapping.showdownIdentityToken,
    fallbackReason,
  };
}

export type BattleServicePlayerInputV4 = {
  playerId: ShowdownPlayerIdV4;
  name: string;
  controller: "local" | "ai" | "script";
  alliance: "near" | "far";
  team: BattlePokemonSetV4[];
  draft: TrainingPlayerDraftV4;
  teamMapping?: ShowdownTeamPokemonMappingV4[];
};

export type BattlePokemonSetV4 = {
  species: string;
  name: string;
  pokeball?: string;
  entryHp?: number;
  entryStatus?: string;
  maxHp?: number;
  item?: string;
  ability: string;
  moves: string[];
  nature: string;
  evs: Record<string, number>;
  ivs: Record<string, number>;
  gender?: string;
  shiny?: boolean;
  level: number;
};

export type BattleSessionCreateInputV4 = {
  runId: string;
  nodeId: string;
  mode: TrainingModeV4;
  ruleSet: TrainingRuleSetV4;
  seed: string;
  players: BattleServicePlayerInputV4[];
  showdownIdPool: ShowdownIdPoolStateV4;
};

export type BattleActivePokemonV4 = {
  ident: string;
  playerId: ShowdownPlayerIdV4;
  slot: string;
  localPokemonId?: string;
  showdownIdentityToken?: string;
  showdownId?: string;
  pokeballId?: string;
  pokeball?: string;
  species: string;
  details: string;
  condition: string;
  hp: number;
  maxHp: number;
  status: string;
  fainted: boolean;
};

export type BattleSessionSnapshotV4 = {
  id: string;
  runId: string;
  nodeId: string;
  status: "creating" | "running" | "ended" | "blocked";
  mode: TrainingModeV4;
  ruleSet: TrainingRuleSetV4;
  turn: number;
  winner: ShowdownPlayerIdV4 | null;
  error: string | null;
  players: BattleServicePlayerInputV4[];
  showdownIdPool?: ShowdownIdPoolStateV4;
  requests: Partial<Record<ShowdownPlayerIdV4, BattleRequestV4>>;
  active: BattleActivePokemonV4[];
  rawLog: string[];
  debug: {
    inputLog: string[];
    lastChoices: Array<{playerId: ShowdownPlayerIdV4; choice: string; at: string}>;
    playerStreams: Array<{playerId: ShowdownPlayerIdV4; at: string; chunk: string; request: boolean; lines: string[]}>;
    latestSidePokemon?: Partial<Record<ShowdownPlayerIdV4, RequestSidePokemonV4[]>>;
  };
  createdAt: string;
  updatedAt: string;
};

export type BattleCommandActionV4 =
  | {kind: "team"; label: string; choice: string; pokemonIndex: number; disabled?: boolean}
  | {kind: "move"; label: string; choice: string; activeIndex: number; moveIndex: number; move: BattleMoveRequestV4; specialOptions: BattleSpecialChoiceOptionV4[]}
  | {kind: "switch"; label: string; choice: string; pokemonIndex: number; disabled?: boolean};

export type BattleTrainerItemChoiceV4 = {
  kind: "traineritem";
  itemInstanceId: string;
  targetKey: string;
};

export type BattleTrainerItemSubmitV4 = {
  sessionId: string;
  playerId: ShowdownPlayerIdV4;
  choice: string;
  trainerItems: Array<BattleTrainerItemChoiceV4 & {activeIndex: number}>;
};

export type BattleCommandStateV4 = {
  playerId: ShowdownPlayerIdV4;
  waiting: boolean;
  teamPreview: boolean;
  forceSwitch: boolean;
  requestType: BattleRequestTypeV4 | "none";
  rqid?: number;
  activeIndex: number;
  requestLength: number;
  activePokemon: {ident: string; name: string; details: string; condition: string} | null;
  choices: string[];
  isDone: boolean;
  currentMove: BattleCommandDraftV4["currentMove"];
  waitingForTarget: boolean;
  readonlyAllies: BattleNormalizedRequestV4["readonlyAlly"];
  actions: BattleCommandActionV4[];
  switchActions: Array<Extract<BattleCommandActionV4, {kind: "switch"}>>;
  targetActions: BattleTargetActionV4[];
  request: BattleRequestV4 | null;
  normalizedRequest: BattleNormalizedRequestV4 | null;
};

export type BattleViewSlotV4 = {
  seat: "p1A" | "p1B" | "p2A" | "p2B";
  playerId: ShowdownPlayerIdV4;
  side: "near" | "far";
  position: "A" | "B";
  localPokemonId: string;
  showdownIdentityToken?: string;
  showdownId?: string;
  pokeballId?: string;
  active: boolean;
  fainted: boolean;
  name: string;
  nameZh: string;
  speciesId: string;
  level: number;
  hp: number;
  maxHp: number;
  status: string;
  spriteUrl: string;
  frontSpriteUrl: string;
  backSpriteUrl: string;
  frontShinySpriteUrl: string;
  backShinySpriteUrl: string;
  iconUrl: string;
  iconStyle?: string;
  teraType?: string;
  terastallized?: boolean;
  dynamaxActive?: boolean;
  specialFormeKind?: "mega" | "primal" | "ultra" | "";
  teamBallStates: Array<"normal" | "status" | "fainted" | "empty">;
};

export type BattleViewModelV4 = {
  sessionId: string;
  status: BattleSessionSnapshotV4["status"];
  turn: number;
  winner: ShowdownPlayerIdV4 | null;
  mode: TrainingModeV4;
  ruleSet: TrainingRuleSetV4;
  slots: BattleViewSlotV4[];
  nearTeam: BattleViewSlotV4[];
  farTeam: BattleViewSlotV4[];
  command: BattleCommandStateV4;
  rawLog: string[];
  error: string | null;
};

export type BattleServiceClientV4 = {
  createBattleSession(input: BattleSessionCreateInputV4): Promise<BattleSessionSnapshotV4>;
  submitChoice(sessionId: string, playerId: ShowdownPlayerIdV4, choice: string): Promise<BattleSessionSnapshotV4>;
  submitTrainerItem(input: BattleTrainerItemSubmitV4): Promise<BattleSessionSnapshotV4>;
  getSnapshot(sessionId: string): Promise<BattleSessionSnapshotV4>;
  closeSession(sessionId: string): Promise<void>;
};

export const DEFAULT_BATTLE_SERVICE_URL = "http://127.0.0.1:5191";

export const SHOWDOWN_ID_POOL_V4 = [
  "pokeball",
  "greatball",
  "ultraball",
  "masterball",
  "premierball",
  "luxuryball",
  "duskball",
  "healball",
  "quickball",
  "timerball",
  "repeatball",
  "netball",
  "nestball",
  "diveball",
  "cherishball",
  "fastball",
  "friendball",
  "heavyball",
  "levelball",
  "loveball",
  "lureball",
  "moonball",
  "dreamball",
  "beastball",
] as const;

export function createBattleServiceClient(baseUrl = DEFAULT_BATTLE_SERVICE_URL): BattleServiceClientV4 {
  const root = baseUrl.replace(/\/$/, "");
  return {
    async createBattleSession(input) {
      return requestJson(`${root}/sessions`, {method: "POST", body: JSON.stringify(input)});
    },
    async submitChoice(sessionId, playerId, choice) {
      return requestJson(`${root}/sessions/${encodeURIComponent(sessionId)}/choice`, {method: "POST", body: JSON.stringify({playerId, choice})});
    },
    async submitTrainerItem(input) {
      return requestJson(`${root}/sessions/${encodeURIComponent(input.sessionId)}/trainer-item`, {method: "POST", body: JSON.stringify({
        playerId: input.playerId,
        choice: input.choice,
        trainerItems: input.trainerItems,
      })});
    },
    async getSnapshot(sessionId) {
      return requestJson(`${root}/sessions/${encodeURIComponent(sessionId)}`);
    },
    async closeSession(sessionId) {
      await requestJson(`${root}/sessions/${encodeURIComponent(sessionId)}`, {method: "DELETE"});
    },
  };
}

export function createBattleGameFromTrainingNode(run: TrainingRunGameV4, node: TrainingRunGameNodeV4): {battleGame: BattleGameV4; sessionInput: BattleSessionCreateInputV4} {
  const now = new Date().toISOString();
  const showdownIdPool = createShowdownIdPoolState();
  const usedShowdownIdentityTokens = new Set(showdownIdPool.used);
  const players = playerIdsForNode(node)
    .map(playerId => run.players[playerId] || node.participants?.[playerId])
    .filter(Boolean)
    .map(player => compilePlayer(player!, usedShowdownIdentityTokens, showdownIdPool));
  return {
    battleGame: {
      id: createId("battle-game"),
      sessionId: null,
      runId: run.id,
      nodeId: node.id,
      status: "creating",
      createdAt: now,
      updatedAt: now,
      error: null,
    },
    sessionInput: {
      runId: run.id,
      nodeId: node.id,
      mode: node.mode,
      ruleSet: node.ruleSet,
      seed: node.seed,
      players,
      showdownIdPool,
    },
  };
}

export function projectBattleViewModelV4(snapshot: BattleSessionSnapshotV4, localPlayerId: ShowdownPlayerIdV4 = "p1", draft?: BattleCommandDraftV4 | null): BattleViewModelV4 {
  const slots = buildViewSlots(snapshot);
  return {
    sessionId: snapshot.id,
    status: snapshot.status,
    turn: snapshot.turn,
    winner: snapshot.winner,
    mode: snapshot.mode,
    ruleSet: snapshot.ruleSet,
    slots,
    nearTeam: slots.filter(slot => slot.side === "near"),
    farTeam: slots.filter(slot => slot.side === "far"),
    command: buildCommandState(snapshot.requests[localPlayerId] || null, localPlayerId, snapshot.mode, snapshot.ruleSet, draft),
    rawLog: snapshot.rawLog.slice(-120),
    error: snapshot.error,
  };
}

export function applyBattleSessionToRun(run: TrainingRunGameV4, snapshot: BattleSessionSnapshotV4): TrainingRunGameV4 {
  const won = snapshot.winner === "p1" || snapshot.winner === "p3";
  const syncedPlayers = snapshot.status === "ended" ? syncLocalTeamsFromBattleSnapshot(run.players, snapshot) : run.players;
  const nextGameMap = run.gameMap.map(node => {
    if (node.id !== snapshot.nodeId) return node;
    return {
      ...node,
      state: snapshot.status === "ended" ? (won ? "won" as const : "lost" as const) : "running" as const,
      battleGame: {
        id: node.battleGame?.id || snapshot.id,
        status: snapshot.status === "ended" ? "ended" as const : snapshot.status === "blocked" ? "blocked" as const : "running" as const,
      },
      endedAt: snapshot.status === "ended" ? new Date().toISOString() : node.endedAt,
    };
  });
  const currentIndex = nextGameMap.findIndex(node => node.id === snapshot.nodeId);
  if (snapshot.status === "ended" && won && currentIndex >= 0 && nextGameMap[currentIndex + 1]?.state === "locked") {
    nextGameMap[currentIndex + 1] = {...nextGameMap[currentIndex + 1]!, state: "ready"};
  }
  return {
    ...run,
    status: snapshot.status === "ended" ? (won ? "resting" : "ended") : "battling",
    players: syncedPlayers,
    currentNodeId: snapshot.status === "ended" && won ? (nextGameMap[currentIndex + 1]?.id || run.currentNodeId) : run.currentNodeId,
    gameMap: nextGameMap,
    result: snapshot.status === "ended" && !won ? {outcome: "loss", reason: "训练场战斗失败"} : run.result,
    updatedAt: new Date().toISOString(),
  };
}

function syncLocalTeamsFromBattleSnapshot(players: TrainingRunGameV4["players"], snapshot: BattleSessionSnapshotV4): TrainingRunGameV4["players"] {
  let changed = false;
  const nextPlayers = {...players};
  for (const snapshotPlayer of snapshot.players) {
    const runPlayer = nextPlayers[snapshotPlayer.playerId];
    const rows = battleSyncRowsForPlayer(snapshot, snapshotPlayer);
    if (!runPlayer || !rows.length) continue;
    const snapshotTeamById = new Map(snapshotPlayer.draft.localTeam.pokemon.map(pokemon => [pokemon.localPokemonId, pokemon]));
    const nextTeam = runPlayer.localTeam.pokemon.map(pokemon => {
      const snapshotPokemon = snapshotTeamById.get(pokemon.localPokemonId);
      if (!snapshotPokemon) return pokemon;
      return {
        ...pokemon,
        moves: snapshotPokemon.moves || pokemon.moves,
        itemId: snapshotPokemon.itemId,
        heldItemInstanceId: snapshotPokemon.heldItemInstanceId,
      };
    });
    rows.forEach(({row, source}, requestIndex) => {
      const resolved = resolveLocalPokemonFromRequestRow(row, snapshotPlayer.teamMapping, snapshotPlayer.draft.localTeam.pokemon, requestIndex);
      if (!resolved.mapping || !resolved.localPokemon || resolved.fallbackReason !== "token") {
        battleDebugLog(true, "error", "sync-local-team-unresolved", {
          playerId: snapshotPlayer.playerId,
          requestIndex,
          row,
          fallbackReason: resolved.fallbackReason,
          resolvedLocalPokemonId: resolved.localPokemon?.localPokemonId || null,
        });
        return;
      }
      const targetIndex = resolved.mapping.teamIndex;
      const current = nextTeam[targetIndex];
      if (!current || current.localPokemonId !== resolved.mapping.localPokemonId) {
        battleDebugLog(true, "error", "sync-local-team-unresolved", {
          playerId: snapshotPlayer.playerId,
          requestIndex,
          teamIndex: targetIndex,
          expectedLocalPokemonId: resolved.mapping.localPokemonId,
          actualLocalPokemonId: current?.localPokemonId || null,
          fallbackReason: "run-team-mismatch",
        });
        return;
      }
      const parsed = parseSideCondition(row.condition, current.maxHp);
      const updated = {
        ...current,
        entryHp: parsed.hp,
        entryStatus: parsed.status,
      };
      nextTeam[targetIndex] = updated;
      changed = true;
      battleDebugLog(true, "mapping", "sync-local-team-after-battle", {
        playerId: snapshotPlayer.playerId,
        teamIndex: targetIndex,
        localPokemonId: current.localPokemonId,
        showdownIdentityToken: resolved.mapping.showdownIdentityToken,
        before: {hp: current.entryHp, status: current.entryStatus},
        after: {hp: updated.entryHp, status: updated.entryStatus},
        sourceCondition: row.condition,
        source,
        fallbackReason: resolved.fallbackReason,
      });
    });
    nextPlayers[snapshotPlayer.playerId] = {
      ...runPlayer,
      bag: snapshotPlayer.draft.bag || runPlayer.bag,
      localTeam: {
        ...runPlayer.localTeam,
        pokemon: nextTeam,
      },
    };
  }
  return changed ? nextPlayers : players;
}

function battleSyncRowsForPlayer(snapshot: BattleSessionSnapshotV4, snapshotPlayer: BattleServicePlayerInputV4): Array<{row: RequestSidePokemonV4; source: "request" | "latestSidePokemon" | "active-overlay"}> {
  const requestRows = snapshot.requests[snapshotPlayer.playerId]?.side?.pokemon;
  const baseSource: "request" | "latestSidePokemon" = requestRows?.length ? "request" : "latestSidePokemon";
  const baseRows = requestRows?.length ? requestRows : snapshot.debug.latestSidePokemon?.[snapshotPlayer.playerId] || [];
  const rows = baseRows.map(row => ({...row}));
  const sources: Array<"request" | "latestSidePokemon" | "active-overlay"> = rows.map(() => baseSource);
  const mapping = snapshotPlayer.teamMapping || [];
  const usedActiveRowIndices = new Set<number>();
  for (const active of snapshot.active.filter(entry => entry.playerId === snapshotPlayer.playerId)) {
    const activeName = active.ident.split(":").pop() || "";
    const activeRowIndex = rows.findIndex((row, index) => !usedActiveRowIndices.has(index) && row.active && (
      toId(row.details.split(",")[0] || "") === toId(active.species) ||
      toId(row.name || "") === toId(active.species) ||
      toId(row.ident.split(":").pop() || "") === toId(activeName)
    ));
    const mappingEntry = activeRowIndex >= 0
      ? mapping.find(entry => entry.teamIndex === activeRowIndex || entry.choiceIndex === activeRowIndex + 1)
      : mapping.find(entry =>
      toId(entry.speciesId) === toId(active.species) ||
      toId(entry.displayName) === toId(active.species) ||
      toId(entry.displayName) === toId(activeName)
    );
    if (!mappingEntry) continue;
    const index = activeRowIndex >= 0 ? activeRowIndex : mappingEntry.teamIndex;
    usedActiveRowIndices.add(index);
    const currentRow = rows[index];
    if (currentRow) {
      rows[index] = {
        ...currentRow,
        ident: currentRow.ident || active.ident,
        details: currentRow.details || active.details,
        condition: active.condition,
        active: !active.fainted,
        fainted: active.fainted,
      };
      sources[index] = "active-overlay";
    } else {
      rows[index] = {
        ident: active.ident.replace(/^p[1-4][a-z]:/i, `${snapshotPlayer.playerId}:`),
        details: active.details,
        condition: active.condition,
        active: !active.fainted,
        fainted: active.fainted,
        pokeball: mappingEntry.showdownIdentityToken,
      };
      sources[index] = "active-overlay";
    }
  }
  return rows.map((row, index) => ({row, source: sources[index] || baseSource}));
}

function parseSideCondition(condition: string | undefined, maxHp: number): {hp: number; status: LocalPokemonV4["entryStatus"]} {
  if (!condition) return {hp: maxHp, status: ""};
  if (condition.includes("fnt")) return {hp: 0, status: ""};
  const [hpText, statusText = ""] = condition.split(" ");
  const [hpRaw] = (hpText || "").split("/");
  return {
    hp: Math.max(0, Math.min(maxHp, Number(hpRaw) || 0)),
    status: normalizeBattleStatus(statusText),
  };
}

function normalizeBattleStatus(status: string): LocalPokemonV4["entryStatus"] {
  if (status === "brn" || status === "par" || status === "psn" || status === "tox" || status === "slp" || status === "frz") return status;
  return "";
}

function buildCommandState(request: BattleRequestV4 | null, playerId: ShowdownPlayerIdV4, mode: TrainingModeV4, ruleSet: TrainingRuleSetV4, draft?: BattleCommandDraftV4 | null): BattleCommandStateV4 {
  if (!request) return emptyCommandState(playerId);
  const normalizedRequest = normalizeBattleRequestV4(request, playerId, mode, ruleSet);
  const commandDraft = draft && draftMatchesRequest(draft, normalizedRequest) ? fillBattleCommandPassesV4(draft, normalizedRequest) : createBattleCommandDraftV4(normalizedRequest);
  const {requestType, requestLength} = normalizedRequest;
  const activeIndex = commandDraft.activeIndex;
  const switchActions = requestType === "move" || requestType === "switch" ? buildSwitchActions(normalizedRequest, commandDraft) : [];
  const targetActions = buildTargetActions(normalizedRequest);
  const base = {
    playerId,
    waiting: requestType === "wait",
    teamPreview: requestType === "team",
    forceSwitch: requestType === "switch",
    requestType,
    rqid: normalizedRequest.rqid,
    activeIndex,
    requestLength,
    activePokemon: activePokemonForRequest(request, activeIndex),
    choices: commandDraft.choices,
    isDone: commandDraft.isDone,
    currentMove: commandDraft.currentMove,
    waitingForTarget: Boolean(commandDraft.currentMove),
    readonlyAllies: normalizedRequest.readonlyAlly,
    switchActions,
    targetActions,
    request,
    normalizedRequest,
  };

  if (requestType === "wait") return {...base, actions: []};
  if (requestType === "team") {
    return {
      ...base,
      actions: normalizedRequest.sidePokemon.map((pokemon, index) => ({
        kind: "team" as const,
        label: pokemon.name || pokemon.details.split(",")[0] || pokemon.ident,
        choice: buildTeamChoice(normalizedRequest, index),
        pokemonIndex: index,
        disabled: Boolean(pokemon.fainted),
      })).filter(action => !action.disabled),
    };
  }
  if (requestType === "switch") {
    return {
      ...base,
      actions: buildSwitchActions(normalizedRequest, commandDraft),
    };
  }

  const currentActive = normalizedRequest.activeRequests[activeIndex];
  return {
    ...base,
    actions: (currentActive?.moves || []).map((move, moveIndex) => ({
      kind: "move" as const,
      label: move.move,
      choice: buildMoveChoice(normalizedRequest, moveIndex),
      activeIndex,
      moveIndex,
      move,
      specialOptions: buildSpecialChoiceOptions(normalizedRequest, activeIndex, moveIndex),
    })).filter(action => !action.move.disabled && (action.move.pp ?? 1) > 0),
  };
}

function emptyCommandState(playerId: ShowdownPlayerIdV4): BattleCommandStateV4 {
  return {
    playerId,
    waiting: true,
    teamPreview: false,
    forceSwitch: false,
    requestType: "none",
    rqid: undefined,
    activeIndex: 0,
    requestLength: 0,
    activePokemon: null,
    choices: [],
    isDone: false,
    currentMove: null,
    waitingForTarget: false,
    readonlyAllies: null,
    actions: [],
    switchActions: [],
    targetActions: [],
    request: null,
    normalizedRequest: null,
  };
}

export function createBattleCommandDraftV4(request: BattleNormalizedRequestV4): BattleCommandDraftV4 {
  return fillBattleCommandPassesV4({
    playerId: request.playerId,
    mode: request.mode,
    requestType: request.requestType,
    rqid: request.rqid,
    requestLength: request.requestLength,
    activeIndex: request.requestType === "switch" ? firstPendingSwitchIndex([], request) : firstPendingChoiceIndex([], request),
    choices: [],
    currentMove: null,
    alreadySwitchingIn: [],
    noCancel: request.noCancel,
    isDone: request.requestLength === 0,
  }, request);
}

export function resetBattleCommandDraftV4(request: BattleNormalizedRequestV4): BattleCommandDraftV4 {
  return createBattleCommandDraftV4(request);
}

export function addBattleCommandChoiceV4(draft: BattleCommandDraftV4, request: BattleNormalizedRequestV4, input: string): BattleCommandDraftV4 {
  const normalized = fillBattleCommandPassesV4(draftMatchesRequest(draft, request) ? draft : createBattleCommandDraftV4(request), request);
  if (normalized.isDone || request.requestType === "wait") return normalized;
  const parsed = parseBattleCommandChoiceV4(input);
  if (!parsed) return normalized;
  if (parsed.kind === "move" && moveChoiceNeedsExplicitTarget(request, normalized.activeIndex, parsed)) {
    return {
      ...normalized,
      currentMove: {
        moveIndex: parsed.index - 1,
        baseChoice: stringifyParsedChoice({...parsed, target: undefined}),
        requiresTarget: true,
        selectedSpecial: parsed.special || null,
      },
    };
  }
  if (parsed.kind === "switch" && normalized.alreadySwitchingIn.includes(parsed.index)) {
    return normalized;
  }
  const choices = [...normalized.choices];
  const activeIndex = normalized.activeIndex;
  choices[activeIndex] = stringifyParsedChoice(parsed);
  const alreadySwitchingIn = parsed.kind === "switch"
    ? [...normalized.alreadySwitchingIn, parsed.index]
    : normalized.alreadySwitchingIn;
  return fillBattleCommandPassesV4({
    ...normalized,
    choices,
    currentMove: null,
    alreadySwitchingIn,
  }, request);
}

export function undoBattleCommandChoiceV4(draft: BattleCommandDraftV4, request: BattleNormalizedRequestV4): BattleCommandDraftV4 {
  const normalized = fillBattleCommandPassesV4(draftMatchesRequest(draft, request) ? draft : createBattleCommandDraftV4(request), request);
  if (normalized.currentMove) return {...normalized, currentMove: null};
  const choices = normalized.choices.slice();
  for (let index = Math.min(choices.length, request.requestLength) - 1; index >= 0; index -= 1) {
    if (!choices[index] || shouldAutoPassChoiceSlot(request, index)) continue;
    choices[index] = "";
    return fillBattleCommandPassesV4({
      ...normalized,
      choices,
      currentMove: null,
    }, request);
  }
  return normalized;
}

export function setBattleCommandCurrentMoveV4(draft: BattleCommandDraftV4, request: BattleNormalizedRequestV4, moveIndex: number, requiresTarget: boolean, selectedSpecial?: BattleSpecialChoiceV4 | null): BattleCommandDraftV4 {
  const normalized = fillBattleCommandPassesV4(draftMatchesRequest(draft, request) ? draft : createBattleCommandDraftV4(request), request);
  const special = selectedSpecial ? ` ${showdownSpecialChoiceSuffixV4(selectedSpecial)}` : "";
  return {
    ...normalized,
    currentMove: {
      moveIndex,
      baseChoice: `move ${moveIndex + 1}${special}`,
      requiresTarget,
      selectedSpecial: selectedSpecial || null,
    },
  };
}

export function fillBattleCommandPassesV4(draft: BattleCommandDraftV4, request: BattleNormalizedRequestV4): BattleCommandDraftV4 {
  const choices = draft.choices.slice(0, request.requestLength);
  let changed = true;
  while (changed) {
    changed = false;
    for (let index = 0; index < request.requestLength; index += 1) {
      if (choices[index]) continue;
      if (shouldAutoPassChoiceSlot(request, index)) {
        choices[index] = "pass";
        changed = true;
      }
    }
  }
  const alreadySwitchingIn = choices
    .map(choice => parseBattleCommandChoiceV4(choice))
    .filter((choice): choice is Extract<ParsedBattleCommandChoiceV4, {kind: "switch"}> => choice?.kind === "switch")
    .map(choice => choice.index);
  const activeIndex = request.requestType === "switch" ? firstPendingSwitchIndex(choices, request) : firstPendingChoiceIndex(choices, request);
  const isDone = request.requestLength === 0 || choices.filter(Boolean).length >= request.requestLength;
  return {
    ...draft,
    playerId: request.playerId,
    mode: request.mode,
    requestType: request.requestType,
    rqid: request.rqid,
    requestLength: request.requestLength,
    activeIndex,
    choices,
    alreadySwitchingIn,
    noCancel: request.noCancel,
    isDone,
  };
}

export function isBattleCommandDraftDoneV4(draft: BattleCommandDraftV4): boolean {
  return draft.isDone;
}

export function stringifyBattleCommandDraftV4(draft: BattleCommandDraftV4): string {
  return draft.choices.slice(0, draft.requestLength).join(", ");
}

type ParsedBattleCommandChoiceV4 = Extract<ShowdownParsedChoiceV4, {kind: "move" | "switch" | "team" | "pass"}> | BattleTrainerItemChoiceV4;

function parseBattleCommandChoiceV4(input: string | undefined): ParsedBattleCommandChoiceV4 | null {
  const trainerItem = parseBattleTrainerItemChoiceV4(input);
  if (trainerItem) return trainerItem;
  const parsed = parseShowdownChoiceCommandV4(input);
  if (!parsed || (parsed.kind !== "move" && parsed.kind !== "switch" && parsed.kind !== "team" && parsed.kind !== "pass")) return null;
  return parsed;
}

function stringifyParsedChoice(choice: ParsedBattleCommandChoiceV4): string {
  if (choice.kind === "traineritem") return stringifyBattleTrainerItemChoiceV4(choice);
  return stringifyShowdownChoiceCommandV4(choice);
}

export function parseBattleTrainerItemChoiceV4(input: string | undefined): BattleTrainerItemChoiceV4 | null {
  const parts = String(input || "").trim().split(/\s+/).filter(Boolean);
  if (parts[0] !== "traineritem" || !parts[1] || !parts[2] || parts.length !== 3) return null;
  return {kind: "traineritem", itemInstanceId: parts[1], targetKey: parts[2]};
}

export function stringifyBattleTrainerItemChoiceV4(choice: BattleTrainerItemChoiceV4): string {
  return `traineritem ${choice.itemInstanceId} ${choice.targetKey}`;
}

export function splitBattleTrainerItemChoicesV4(draft: BattleCommandDraftV4): {choice: string; trainerItems: Array<BattleTrainerItemChoiceV4 & {activeIndex: number}>} {
  const trainerItems: Array<BattleTrainerItemChoiceV4 & {activeIndex: number}> = [];
  const choices = draft.choices.slice(0, draft.requestLength).map((choice, activeIndex) => {
    const trainerItem = parseBattleTrainerItemChoiceV4(choice);
    if (!trainerItem) return choice;
    trainerItems.push({...trainerItem, activeIndex});
    return "pass";
  });
  return {choice: choices.join(", "), trainerItems};
}

export function appendBattleSpecialChoiceSuffixV4(choice: string, special?: BattleSpecialChoiceV4 | null): string {
  return appendShowdownSpecialChoiceSuffixV4(choice, special);
}

export function withBattleMoveTargetSuffixV4(choice: string, target?: string): string {
  return withShowdownMoveTargetSuffixV4(choice, target);
}

export function battleSpecialSystemForChoiceV4(choice?: BattleSpecialChoiceV4 | null): BattleSpecialSystemV4 | null {
  return showdownSpecialSystemForChoiceV4(choice);
}

export function battleSpecialSystemAllowedForRuleSetV4(system: BattleSpecialSystemV4, ruleSet?: string, mode?: string): boolean {
  return showdownSpecialSystemAllowedForRuleSetV4(system, ruleSet, mode);
}

function buildSpecialChoiceOptions(request: BattleNormalizedRequestV4, activeIndex: number, moveIndex: number): BattleSpecialChoiceOptionV4[] {
  const active = request.activeRequests[activeIndex];
  if (!active) return [];
  const options: BattleSpecialChoiceOptionV4[] = [];
  const withRuleAllowed = (option: Omit<BattleSpecialChoiceOptionV4, "ruleAllowed">): BattleSpecialChoiceOptionV4 => ({
    ...option,
    ruleAllowed: showdownSpecialChoiceAllowedForRuleSetV4(option.id, request.ruleSet, request.mode),
  });
  if (active.canDynamax) {
    const maxMove = active.maxMoves?.[moveIndex] || active.moves?.[moveIndex]?.maxMove || null;
    options.push(withRuleAllowed({
      id: "max",
      label: active.gigantamax ? "超极巨" : "极巨",
      choiceSuffix: "max",
      activeIndex,
      moveIndex,
      moveName: maxMove?.move || maxMove?.id,
      disabled: Boolean(maxMove?.disabled),
    }));
  }
  if (active.canMegaEvo) options.push(withRuleAllowed({id: "mega", label: "Mega", choiceSuffix: "mega", activeIndex, moveIndex}));
  if (active.canMegaEvoX) options.push(withRuleAllowed({id: "megax", label: "Mega X", choiceSuffix: "megax", activeIndex, moveIndex}));
  if (active.canMegaEvoY) options.push(withRuleAllowed({id: "megay", label: "Mega Y", choiceSuffix: "megay", activeIndex, moveIndex}));
  if (active.canUltraBurst) options.push(withRuleAllowed({id: "ultra", label: "究极爆发", choiceSuffix: "ultra", activeIndex, moveIndex}));
  const zMove = active.zMoves?.[moveIndex] || active.moves?.[moveIndex]?.zMove || null;
  if (zMove) {
    options.push(withRuleAllowed({
      id: "zmove",
      label: "Z招式",
      choiceSuffix: "zmove",
      activeIndex,
      moveIndex,
      moveName: zMove.move || zMove.id,
      disabled: Boolean(zMove.disabled),
    }));
  }
  if (active.canTerastallize) {
    options.push(withRuleAllowed({
      id: "terastallize",
      label: "太晶",
      choiceSuffix: "terastallize",
      activeIndex,
      moveIndex,
      typeLabel: String(active.canTerastallize),
    }));
  }
  return options;
}

function draftMatchesRequest(draft: BattleCommandDraftV4, request: BattleNormalizedRequestV4): boolean {
  return draft.playerId === request.playerId &&
    draft.mode === request.mode &&
    draft.requestType === request.requestType &&
    draft.rqid === request.rqid &&
    draft.requestLength === request.requestLength;
}

function moveChoiceNeedsExplicitTarget(request: BattleNormalizedRequestV4, activeIndex: number, choice: Extract<ParsedBattleCommandChoiceV4, {kind: "move"}>): boolean {
  if (!request.targetable || choice.target) return false;
  const move = request.activeRequests[activeIndex]?.moves?.[choice.index - 1];
  if (!move?.target || toId(move.id) === "recharge") return false;
  const target = normalizeChoiceTarget(move.target);
  return target === "normal" ||
    target === "any" ||
    target === "adjacentally" ||
    target === "adjacentallyorself" ||
    target === "adjacentfoe";
}

function normalizeChoiceTarget(value: string | undefined): string {
  return String(value || "normal").replace(/[^a-z]/gi, "").toLowerCase() || "normal";
}

function shouldAutoPassChoiceSlot(request: BattleNormalizedRequestV4, index: number): boolean {
  if (request.requestType === "wait") return true;
  if (request.requestType === "switch") return request.forceSwitch[index] === false;
  if (request.requestType === "move") return !request.activeRequests[index];
  return false;
}

function firstPendingChoiceIndex(choices: string[], request: BattleNormalizedRequestV4): number {
  for (let index = 0; index < request.requestLength; index += 1) {
    if (!choices[index] && !shouldAutoPassChoiceSlot(request, index)) return index;
  }
  return Math.max(0, request.requestLength - 1);
}

function firstPendingSwitchIndex(choices: string[], request: BattleNormalizedRequestV4): number {
  for (let index = 0; index < request.requestLength; index += 1) {
    if (!choices[index] && request.forceSwitch[index]) return index;
  }
  return firstPendingChoiceIndex(choices, request);
}

function buildTargetActions(request: BattleNormalizedRequestV4): BattleTargetActionV4[] {
  if (request.requestType !== "move") return [];
  const activeCount = Math.max(1, request.activeRequests.length);
  const farTargets: BattleTargetActionV4[] = activeCount > 1 || request.mode !== "singles" || request.targetable
    ? [
      {label: "对方 1", choiceSuffix: "+1", targetSlot: "far-1", side: "far", position: 1},
      {label: "对方 2", choiceSuffix: "+2", targetSlot: "far-2", side: "far", position: 2},
    ]
    : [{label: "对方", choiceSuffix: "", targetSlot: "far-1", side: "far", position: 1}];
  const nearTargets: BattleTargetActionV4[] = activeCount > 1 || request.mode !== "singles" || request.targetable
    ? [
      {label: "己方 1", choiceSuffix: "-1", targetSlot: "near-1", side: "near", position: 1},
      {label: "己方 2", choiceSuffix: "-2", targetSlot: "near-2", side: "near", position: 2},
    ]
    : [];
  return [...farTargets, ...nearTargets];
}

export function normalizeBattleRequestV4(request: BattleRequestV4, playerId: ShowdownPlayerIdV4, mode: TrainingModeV4, ruleSet: TrainingRuleSetV4): BattleNormalizedRequestV4 {
  const requestType = requestTypeFor(request);
  const sidePokemon = request.side?.pokemon || [];
  const activeRequests = fixedActiveRequestsForNormalizedRequest(request, sidePokemon);
  const forceSwitch = request.forceSwitch || [];
  const requestLength = requestLengthForNormalizedRequest(request, requestType);
  return {
    playerId,
    mode,
    ruleSet,
    requestType,
    rqid: request.rqid,
    noCancel: Boolean(request.noCancel || request.wait),
    targetable: Boolean(request.targetable || requestType === "move" && activeRequests.length > 1),
    requestLength,
    activeIndex: firstActionableActiveIndex(request, requestType, activeRequests),
    activeRequests,
    forceSwitch,
    sidePokemon,
    readonlyAlly: request.ally || null,
    choiceIndexByTeamIndex: Object.fromEntries(sidePokemon.map((_, index) => [index, index + 1])),
    rawRequest: request,
  };
}

function fixedActiveRequestsForNormalizedRequest(request: BattleRequestV4, sidePokemon: RequestSidePokemonV4[]): Array<BattleActiveRequestV4 | null> {
  return (request.active || []).map((active, index) => sidePokemonCanCommand(sidePokemon[index]) ? normalizeActiveRequestSpecials(active) : null);
}

function normalizeActiveRequestSpecials(active: BattleActiveRequestV4 | null | undefined): BattleActiveRequestV4 | null {
  if (!active) return null;
  const rawMaxMoves = (active as unknown as {maxMoves?: BattleMoveRequestV4[] | {gigantamax?: boolean; maxMoves?: BattleMoveRequestV4[]}}).maxMoves;
  const rawMaxMoveObject = !Array.isArray(rawMaxMoves) && rawMaxMoves ? rawMaxMoves : null;
  const maxMoves = Array.isArray(rawMaxMoves) ? rawMaxMoves : rawMaxMoveObject?.maxMoves || [];
  const zMoves = active.zMoves || active.canZMove || [];
  const moves = (active.moves || []).map((move, index) => ({
    ...move,
    maxMove: maxMoves[index] || move.maxMove || null,
    zMove: zMoves[index] || move.zMove || null,
  }));
  return {
    ...active,
    moves,
    maxMoves,
    zMoves,
    gigantamax: Boolean(active.gigantamax || rawMaxMoveObject?.gigantamax),
    canDynamax: Boolean(active.canDynamax),
    canMegaEvo: Boolean(active.canMegaEvo),
    canMegaEvoX: Boolean(active.canMegaEvoX),
    canMegaEvoY: Boolean(active.canMegaEvoY),
    canUltraBurst: Boolean(active.canUltraBurst),
    canTerastallize: typeof active.canTerastallize === "string" ? active.canTerastallize : active.canTerastallize ? "Tera" : "",
  };
}

function sidePokemonCanCommand(pokemon: RequestSidePokemonV4 | undefined): boolean {
  if (!pokemon) return true;
  return !pokemon.fainted && !pokemon.commanding && !conditionIsFainted(pokemon.condition);
}

function conditionIsFainted(condition: string | undefined): boolean {
  return Boolean(condition?.includes("fnt") || /^\s*0(?:\D|$)/.test(condition || ""));
}

function requestTypeFor(request: BattleRequestV4): BattleRequestTypeV4 {
  if (request.wait) return "wait";
  if (request.teamPreview) return "team";
  if (request.forceSwitch) return "switch";
  return "move";
}

function requestLengthForNormalizedRequest(request: BattleRequestV4, requestType: BattleRequestTypeV4): number {
  if (requestType === "wait") return 0;
  if (requestType === "team") return request.chosenTeamSize || request.maxChosenTeamSize || 0;
  if (requestType === "switch") return request.forceSwitch?.length || 0;
  return request.active?.length || 0;
}

function firstActionableActiveIndex(request: BattleRequestV4, requestType: BattleRequestTypeV4, activeRequests?: Array<BattleActiveRequestV4 | null>): number {
  if (requestType === "switch") {
    const index = request.forceSwitch?.findIndex(Boolean) ?? -1;
    return index >= 0 ? index : 0;
  }
  if (requestType === "wait" || requestType === "team") return 0;
  const index = (activeRequests || request.active)?.findIndex(active => Boolean(active));
  return index && index > 0 ? index : 0;
}

function activePokemonForRequest(request: BattleRequestV4, index: number): BattleCommandStateV4["activePokemon"] {
  const pokemon = request.side?.pokemon?.[index];
  if (!pokemon) return null;
  return {
    ident: pokemon.ident,
    name: pokemon.name || pokemon.details.split(",")[0] || pokemon.ident,
    details: pokemon.details,
    condition: pokemon.condition,
  };
}

function buildTeamChoice(request: BattleNormalizedRequestV4, firstIndex: number): string {
  const teamSize = request.requestLength || (request.sidePokemon.length ? 1 : 0);
  const picked = [firstIndex + 1];
  for (let index = 0; picked.length < teamSize && index < request.sidePokemon.length; index += 1) {
    if (index !== firstIndex) picked.push(index + 1);
  }
  return `team ${picked.join(",")}`;
}

function buildMoveChoice(request: BattleNormalizedRequestV4, moveIndex: number): string {
  // Phase 2 intentionally emits a partial choice for every mode. Phase 3 will
  // assemble multi-active choices with BattleCommandDraftV4.
  return `move ${moveIndex + 1}`;
}

function buildSwitchActions(request: BattleNormalizedRequestV4, draft?: BattleCommandDraftV4 | null): Array<Extract<BattleCommandActionV4, {kind: "switch"}>> {
  const requestLength = request.requestLength || 1;
  const trapped = request.activeRequests[request.activeIndex]?.trapped;
  const sidePokemon = request.sidePokemon;
  const hasActiveFlags = sidePokemon.some(pokemon => pokemon.active);
  return sidePokemon.map((pokemon, index) => ({
    kind: "switch" as const,
    label: pokemon.name || pokemon.details.split(",")[0] || pokemon.ident,
    choice: buildSwitchChoice(request, index),
    pokemonIndex: index,
    disabled: Boolean(trapped || draft?.alreadySwitchingIn.includes(index + 1) || (hasActiveFlags ? pokemon.active : index < requestLength) || pokemon.fainted || pokemon.condition.includes("fnt")),
  })).filter(action => !action.disabled);
}

function buildSwitchChoice(request: BattleNormalizedRequestV4, switchIndex: number): string {
  return `switch ${switchIndex + 1}`;
}

function buildViewSlots(snapshot: BattleSessionSnapshotV4): BattleViewSlotV4[] {
  return snapshot.players.flatMap(player => {
    const side = player.alliance === "near" ? "near" as const : "far" as const;
    const playerActives = snapshot.active
      .filter(active => active.playerId === player.playerId)
      .sort((a, b) => a.slot.localeCompare(b.slot));
    const team = player.draft.localTeam.pokemon;
    const requestRows = snapshot.requests[player.playerId]?.side?.pokemon || [];
    if (playerActives.length) {
      return playerActives.map((active, index) => {
        const rowIndex = findRequestRowIndexForActive(requestRows, active, index);
        const row = rowIndex >= 0 ? requestRows[rowIndex]! : null;
        const resolved = row ? resolveLocalPokemonFromRequestRow(row, player.teamMapping, team, rowIndex) : null;
        const activePokemon = resolved?.localPokemon || resolveLocalPokemonFromActive(active, player.teamMapping, team);
        return activePokemon ? pokemonToSlot(player.playerId, side, activePokemon, active, true, team, seatForActive(player.playerId, active, index), playerActives) : null;
      }).filter(Boolean) as BattleViewSlotV4[];
    }
    const fallbackCount = snapshot.mode === "doubles" ? 2 : 1;
    return team.slice(0, fallbackCount).map((pokemon, index) => (
      pokemonToSlot(player.playerId, side, pokemon, undefined, index === 0, team, seatForActive(player.playerId, undefined, index), playerActives)
    ));
  });
}

function pokemonToSlot(playerId: ShowdownPlayerIdV4, side: "near" | "far", pokemon: LocalPokemonV4, active: BattleActivePokemonV4 | undefined, isActive: boolean, team: LocalPokemonV4[], seat: BattleViewSlotV4["seat"], actives: BattleActivePokemonV4[]): BattleViewSlotV4 {
  return {
    seat,
    playerId,
    side,
    position: seat.endsWith("B") ? "B" : "A",
    localPokemonId: pokemon.localPokemonId,
    showdownIdentityToken: pokemon.showdownIdentityToken,
    showdownId: pokemon.showdownId,
    pokeballId: pokemon.pokeballId,
    active: isActive,
    fainted: active?.fainted ?? pokemon.entryHp <= 0,
    name: pokemon.name,
    nameZh: pokemon.nameZh,
    speciesId: pokemon.speciesId,
    level: pokemon.level,
    hp: active?.hp ?? pokemon.entryHp,
    maxHp: active?.maxHp ?? pokemon.maxHp,
    status: active?.status || pokemon.entryStatus,
    spriteUrl: side === "near"
      ? firstLargeSprite(pokemon.backSpriteUrl, pokemon.spriteUrl)
      : firstLargeSprite(pokemon.frontSpriteUrl, pokemon.spriteUrl),
    frontSpriteUrl: firstLargeSprite(pokemon.frontSpriteUrl, pokemon.spriteUrl),
    backSpriteUrl: firstLargeSprite(pokemon.backSpriteUrl, pokemon.spriteUrl),
    frontShinySpriteUrl: firstLargeSprite(pokemon.frontShinySpriteUrl, pokemon.shinySpriteUrl, pokemon.frontSpriteUrl, pokemon.spriteUrl),
    backShinySpriteUrl: firstLargeSprite(pokemon.backShinySpriteUrl, pokemon.shinySpriteUrl, pokemon.backSpriteUrl, pokemon.spriteUrl),
    iconUrl: pokemon.iconUrl || pokemon.spriteUrl || "",
    iconStyle: pokemon.iconStyle,
    teamBallStates: buildTeamBallStates(team, actives),
  };
}

function buildTeamBallStates(team: LocalPokemonV4[], actives: BattleActivePokemonV4[]): BattleViewSlotV4["teamBallStates"] {
  const states: BattleViewSlotV4["teamBallStates"] = team.slice(0, 6).map(pokemon => {
    const active = actives.find(entry =>
      toId(entry.species) === toId(pokemon.speciesId) ||
      toId(entry.species) === toId(pokemon.name) ||
      toId(entry.species) === toId(pokemon.nameZh)
    );
    const hp = active ? active.hp : pokemon.entryHp;
    const status = active ? active.status : pokemon.entryStatus;
    if ((active && active.fainted) || hp <= 0 || status === "fnt") return "fainted" as const;
    if (status) return "status" as const;
    return "normal" as const;
  });
  while (states.length < 6) states.push("empty");
  return states;
}

function firstLargeSprite(...values: Array<string | undefined>): string {
  return values.find(value => value && !value.includes("pokemonicons-sheet")) || "";
}

function findTeamPokemon(team: LocalPokemonV4[], species: string): LocalPokemonV4 | undefined {
  const wanted = toId(species);
  return team.find(pokemon => toId(pokemon.name) === wanted || toId(pokemon.nameZh) === wanted || toId(pokemon.speciesId) === wanted);
}

function resolveLocalPokemonFromActive(active: BattleActivePokemonV4, mapping: ShowdownTeamPokemonMappingV4[] | undefined, team: LocalPokemonV4[]): LocalPokemonV4 | null {
  const activeSpecies = toId(active.species || active.details.split(",")[0] || active.ident.split(":").pop() || "");
  const activeName = toId(active.ident.split(":").pop() || "");
  const activeDetailSpecies = toId(active.details.split(",")[0] || "");
  const activeTokens = new Set([activeSpecies, activeName, activeDetailSpecies].filter(Boolean));
  const mappingEntry = (mapping || []).find(entry =>
    activeTokens.has(toId(entry.speciesId)) ||
    activeTokens.has(toId(entry.displayName))
  );
  if (mappingEntry) {
    return team.find(pokemon => pokemon.localPokemonId === mappingEntry.localPokemonId) || team[mappingEntry.teamIndex] || null;
  }
  return team.find(pokemon =>
    activeTokens.has(toId(pokemon.speciesId)) ||
    activeTokens.has(toId(pokemon.name)) ||
    activeTokens.has(toId(pokemon.nameZh)) ||
    activeTokens.has(toId(pokemon.nickname))
  ) || null;
}

function compilePlayer(player: TrainingPlayerDraftV4, usedShowdownIdentityTokens: Set<string> = new Set(), showdownIdPool = createShowdownIdPoolState()): BattleServicePlayerInputV4 {
  const identity = createPlayerBattleIdentity(player, usedShowdownIdentityTokens, showdownIdPool);
  const bagItems = player.bag?.items || [];
  return {
    playerId: player.playerId,
    name: player.name,
    controller: player.controller,
    alliance: player.alliance,
    team: identity.localTeam.pokemon.map(pokemon => compilePokemon(pokemon, bagItems)),
    draft: {
      ...player,
      localTeam: identity.localTeam,
    },
    teamMapping: identity.teamMapping,
  };
}

function compilePokemon(pokemon: LocalPokemonV4, bagItems: TrainingPlayerDraftV4["bag"]["items"] = []): BattlePokemonSetV4 {
  const heldItem = heldItemIdForBattle(pokemon, bagItems);
  return {
    species: pokemon.speciesId,
    name: pokemon.nickname || pokemon.name || pokemon.nameZh,
    pokeball: pokemon.showdownIdentityToken || pokemon.showdownId || pokemon.pokeballId,
    entryHp: pokemon.entryHp,
    entryStatus: pokemon.entryStatus,
    maxHp: pokemon.maxHp,
    item: heldItem || undefined,
    ability: pokemon.abilityId || "No Ability",
    moves: pokemon.moves.map(move => move.moveId).filter(Boolean).slice(0, 4),
    nature: pokemon.nature || "Serious",
    evs: pokemon.evs,
    ivs: pokemon.ivs,
    gender: pokemon.gender === "N" ? undefined : pokemon.gender,
    shiny: pokemon.shiny,
    level: pokemon.level,
  };
}

function heldItemIdForBattle(pokemon: LocalPokemonV4, bagItems: TrainingPlayerDraftV4["bag"]["items"]): string {
  if (pokemon.heldItemInstanceId) {
    const instance = bagItems.find(item => item.id === pokemon.heldItemInstanceId);
    return instance?.itemID || "";
  }
  if (!pokemon.itemId) return "";
  const matchedInstance = bagItems.find(item => item.itemID === pokemon.itemId);
  return matchedInstance ? pokemon.itemId : "";
}

function createPlayerBattleIdentity(player: TrainingPlayerDraftV4, usedShowdownIdentityTokens: Set<string>, showdownIdPool: ShowdownIdPoolStateV4): {localTeam: TrainingPlayerDraftV4["localTeam"]; teamMapping: ShowdownTeamPokemonMappingV4[]} {
  const pokemon = player.localTeam.pokemon.map((entry, teamIndex) => {
    const showdownIdentityToken = takeShowdownIdentityToken(usedShowdownIdentityTokens, showdownIdPool);
    return {
      ...entry,
      showdownIdentityToken,
      showdownId: showdownIdentityToken,
      pokeballId: showdownIdentityToken,
    };
  });
  return {
    localTeam: {
      ...player.localTeam,
      pokemon,
    },
    teamMapping: pokemon.map((entry, teamIndex) => ({
      playerId: player.playerId,
      teamIndex,
      choiceIndex: teamIndex + 1,
      localPokemonId: entry.localPokemonId,
      showdownIdentityToken: entry.showdownIdentityToken!,
      showdownId: entry.showdownId!,
      pokeballId: entry.pokeballId!,
      speciesId: entry.speciesId,
      displayName: entry.nickname || entry.nameZh || entry.name || entry.speciesId,
    })),
  };
}

function createShowdownIdPoolState(): ShowdownIdPoolStateV4 {
  return {
    used: [],
    available: [...SHOWDOWN_ID_POOL_V4],
  };
}

function takeShowdownIdentityToken(used: Set<string>, pool: ShowdownIdPoolStateV4): string {
  const token = pool.available.find(candidate => !used.has(candidate));
  if (!token) throw new Error("Showdown ID pool exhausted while creating Battle V4 session.");
  used.add(token);
  pool.used = [...pool.used, token];
  pool.available = pool.available.filter(candidate => candidate !== token);
  return token;
}

function findRequestRowIndexForActive(requestRows: RequestSidePokemonV4[], active: BattleActivePokemonV4, fallbackIndex: number): number {
  const activeName = toId(active.species || active.ident.split(":").pop() || "");
  const activeIdentName = toId(active.ident.split(":").pop() || "");
  const activeRowIndex = requestRows.findIndex(row => row.active && (
    toId(row.details.split(",")[0] || "") === activeName ||
    toId(row.name || "") === activeName ||
    toId(row.ident.split(":").pop() || "") === activeIdentName
  ));
  if (activeRowIndex >= 0) return activeRowIndex;
  return requestRows[fallbackIndex] ? fallbackIndex : -1;
}

function playerIdsForNode(node: TrainingRunGameNodeV4): ShowdownPlayerIdV4[] {
  return [node.p1, node.p2, node.p3, node.p4].filter(Boolean) as ShowdownPlayerIdV4[];
}

function seatFor(playerId: ShowdownPlayerIdV4): BattleViewSlotV4["seat"] {
  if (playerId === "p3") return "p1B";
  if (playerId === "p2") return "p2A";
  if (playerId === "p4") return "p2B";
  return "p1A";
}

function seatForActive(playerId: ShowdownPlayerIdV4, active: BattleActivePokemonV4 | undefined, index: number): BattleViewSlotV4["seat"] {
  if (playerId === "p3") return "p1B";
  if (playerId === "p4") return "p2B";
  const slot = active?.slot.toLowerCase() || "";
  const isSecond = slot.endsWith("b") || index > 0;
  if (playerId === "p2") return isSecond ? "p2B" : "p2A";
  return isSecond ? "p1B" : "p1A";
}

async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {"content-type": "application/json", ...(init.headers || {})},
  });
  const json = await response.json().catch(() => null) as any;
  if (!response.ok) throw new Error(json?.error || `Battle service 请求失败：${response.status}`);
  return json as T;
}

function createId(prefix: string): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return `${prefix}-${cryptoApi.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
