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
};

export type BattleActiveRequestV4 = {
  moves?: BattleMoveRequestV4[];
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
  };
  createdAt: string;
  updatedAt: string;
};

export type BattleCommandActionV4 =
  | {kind: "team"; label: string; choice: string; pokemonIndex: number; disabled?: boolean}
  | {kind: "move"; label: string; choice: string; activeIndex: number; moveIndex: number; move: BattleMoveRequestV4}
  | {kind: "switch"; label: string; choice: string; pokemonIndex: number; disabled?: boolean};

export type BattleCommandStateV4 = {
  playerId: ShowdownPlayerIdV4;
  waiting: boolean;
  teamPreview: boolean;
  forceSwitch: boolean;
  requestType: BattleRequestTypeV4 | "none";
  activeIndex: number;
  requestLength: number;
  activePokemon: {ident: string; name: string; details: string; condition: string} | null;
  actions: BattleCommandActionV4[];
  switchActions: Array<Extract<BattleCommandActionV4, {kind: "switch"}>>;
  request: BattleRequestV4 | null;
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
    .map(playerId => node.participants?.[playerId] || run.players[playerId])
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

export function projectBattleViewModelV4(snapshot: BattleSessionSnapshotV4, localPlayerId: ShowdownPlayerIdV4 = "p1"): BattleViewModelV4 {
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
    command: buildCommandState(snapshot.requests[localPlayerId] || null, localPlayerId, snapshot.mode),
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
    const rows = snapshot.requests[snapshotPlayer.playerId]?.side?.pokemon || [];
    if (!runPlayer || !rows.length) continue;
    const nextTeam = [...runPlayer.localTeam.pokemon];
    rows.forEach((row, requestIndex) => {
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
        fallbackReason: resolved.fallbackReason,
      });
    });
    nextPlayers[snapshotPlayer.playerId] = {
      ...runPlayer,
      localTeam: {
        ...runPlayer.localTeam,
        pokemon: nextTeam,
      },
    };
  }
  return changed ? nextPlayers : players;
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

function buildCommandState(request: BattleRequestV4 | null, playerId: ShowdownPlayerIdV4, mode: TrainingModeV4): BattleCommandStateV4 {
  if (!request) return emptyCommandState(playerId);
  const requestType = requestTypeFor(request);
  const activeIndex = firstActionableActiveIndex(request);
  const requestLength = request.forceSwitch?.length || request.active?.length || (mode === "doubles" ? 2 : 1);
  const switchActions = requestType === "move" || requestType === "switch" ? buildSwitchActions(request) : [];
  const base = {
    playerId,
    waiting: requestType === "wait",
    teamPreview: requestType === "team",
    forceSwitch: requestType === "switch",
    requestType,
    activeIndex,
    requestLength,
    activePokemon: activePokemonForRequest(request, activeIndex),
    switchActions,
    request,
  };

  if (requestType === "wait") return {...base, actions: []};
  if (requestType === "team") {
    return {
      ...base,
      actions: (request.side?.pokemon || []).map((pokemon, index) => ({
        kind: "team" as const,
        label: pokemon.name || pokemon.details.split(",")[0] || pokemon.ident,
        choice: buildTeamChoice(request, index),
        pokemonIndex: index,
        disabled: Boolean(pokemon.fainted),
      })).filter(action => !action.disabled),
    };
  }
  if (requestType === "switch") {
    return {
      ...base,
      actions: buildSwitchActions(request),
    };
  }

  const currentActive = request.active?.[activeIndex];
  return {
    ...base,
    actions: (currentActive?.moves || []).map((move, moveIndex) => ({
      kind: "move" as const,
      label: move.move,
      choice: buildMoveChoice(request, activeIndex, moveIndex),
      activeIndex,
      moveIndex,
      move,
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
    activeIndex: 0,
    requestLength: 0,
    activePokemon: null,
    actions: [],
    switchActions: [],
    request: null,
  };
}

function requestTypeFor(request: BattleRequestV4): BattleRequestTypeV4 {
  if (request.wait) return "wait";
  if (request.teamPreview) return "team";
  if (request.forceSwitch) return "switch";
  return "move";
}

function firstActionableActiveIndex(request: BattleRequestV4): number {
  if (request.forceSwitch) {
    const index = request.forceSwitch.findIndex(Boolean);
    return index >= 0 ? index : 0;
  }
  const index = request.active?.findIndex(active => Boolean(active));
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

function buildTeamChoice(request: BattleRequestV4, firstIndex: number): string {
  const teamSize = request.chosenTeamSize || request.maxChosenTeamSize || (request.side?.pokemon.length ? 1 : 0);
  const picked = [firstIndex + 1];
  for (let index = 0; picked.length < teamSize && index < (request.side?.pokemon.length || 0); index += 1) {
    if (index !== firstIndex) picked.push(index + 1);
  }
  return `team ${picked.join(",")}`;
}

function buildMoveChoice(request: BattleRequestV4, activeIndex: number, moveIndex: number): string {
  const active = request.active || [];
  const parts = active.map((entry, index) => {
    if (!entry) return "pass";
    if (index === activeIndex) return `move ${moveIndex + 1}`;
    const fallback = (entry.moves || []).findIndex(move => !move.disabled && (move.pp ?? 1) > 0);
    return `move ${fallback >= 0 ? fallback + 1 : 1}`;
  });
  return parts.length ? parts.join(", ") : `move ${moveIndex + 1}`;
}

function buildSwitchActions(request: BattleRequestV4): Array<Extract<BattleCommandActionV4, {kind: "switch"}>> {
  const requestLength = request.forceSwitch?.length || request.active?.length || 1;
  const trapped = request.active?.[0]?.trapped;
  const sidePokemon = request.side?.pokemon || [];
  const hasActiveFlags = sidePokemon.some(pokemon => pokemon.active);
  return sidePokemon.map((pokemon, index) => ({
    kind: "switch" as const,
    label: pokemon.name || pokemon.details.split(",")[0] || pokemon.ident,
    choice: buildSwitchChoice(request, index),
    pokemonIndex: index,
    disabled: Boolean(trapped || (hasActiveFlags ? pokemon.active : index < requestLength) || pokemon.fainted || pokemon.condition.includes("fnt")),
  })).filter(action => !action.disabled);
}

function buildSwitchChoice(request: BattleRequestV4, switchIndex: number): string {
  if (!request.forceSwitch || request.forceSwitch.length <= 1) return `switch ${switchIndex + 1}`;
  let usedSwitch = false;
  return request.forceSwitch.map(mustSwitch => {
    if (!mustSwitch) return "pass";
    if (!usedSwitch) {
      usedSwitch = true;
      return `switch ${switchIndex + 1}`;
    }
    const fallback = (request.side?.pokemon || []).findIndex((pokemon, index) => index >= request.forceSwitch!.length && index !== switchIndex && !pokemon.fainted && !pokemon.condition.includes("fnt"));
    return fallback >= 0 ? `switch ${fallback + 1}` : "pass";
  }).join(", ");
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
        const resolved = resolveLocalPokemonFromRequestRow(row, player.teamMapping, team, rowIndex >= 0 ? rowIndex : index);
        const activePokemon = resolved.localPokemon || findTeamPokemon(team, active.species) || team[index] || team[0];
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

function compilePlayer(player: TrainingPlayerDraftV4, usedShowdownIdentityTokens: Set<string> = new Set(), showdownIdPool = createShowdownIdPoolState()): BattleServicePlayerInputV4 {
  const identity = createPlayerBattleIdentity(player, usedShowdownIdentityTokens, showdownIdPool);
  return {
    playerId: player.playerId,
    name: player.name,
    controller: player.controller,
    alliance: player.alliance,
    team: identity.localTeam.pokemon.map(compilePokemon),
    draft: {
      ...player,
      localTeam: identity.localTeam,
    },
    teamMapping: identity.teamMapping,
  };
}

function compilePokemon(pokemon: LocalPokemonV4): BattlePokemonSetV4 {
  return {
    species: pokemon.speciesId,
    name: pokemon.nickname || pokemon.name || pokemon.nameZh,
    pokeball: pokemon.showdownIdentityToken || pokemon.showdownId || pokemon.pokeballId,
    entryHp: pokemon.entryHp,
    entryStatus: pokemon.entryStatus,
    maxHp: pokemon.maxHp,
    item: pokemon.itemId || undefined,
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
