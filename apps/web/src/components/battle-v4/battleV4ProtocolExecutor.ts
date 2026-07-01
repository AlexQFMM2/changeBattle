import type {BattleSessionSnapshotV4, BattleViewModelV4, BattleViewSlotV4, LocalPokemonV4, ShowdownPlayerIdV4} from "@changebattle-v2/api";
import type {BattleProtocolArgsV4, BattleProtocolEventV4, BattleProtocolKwArgsV4, BattleProtocolSeatV4} from "./battleV4Playback";

const RAW_NO_DEFAULT_COMMANDS = new Set([
  "chatmsg",
  "chatmsg-raw",
  "raw",
  "error",
  "html",
  "inactive",
  "inactiveoff",
  "warning",
  "fieldhtml",
  "controlshtml",
  "pagehtml",
  "bigerror",
  "debug",
  "tier",
  "challstr",
  "customgroups",
  "popup",
  "",
]);

const THREE_PART_COMMANDS = new Set(["c", "chat", "uhtml", "uhtmlchange", "queryresponse", "showteam"]);
const FOUR_PART_COMMANDS = new Set(["c:", "pm"]);

export type BattleRuntimeSlotV4 = BattleViewSlotV4 & {
  lastKnownHp: number;
  lastKnownMaxHp: number;
};

export type BattleRuntimeStateV4 = {
  turn: number;
  slots: Partial<Record<BattleProtocolSeatV4, BattleRuntimeSlotV4>>;
  weatherId: string;
  terrainId: string;
  roomId: string;
  gravityActive: boolean;
  sideConditions: Array<{id: string; side: "near" | "far"; label: string; seat: BattleProtocolSeatV4}>;
  lastMove: {
    actorSeat: BattleProtocolSeatV4;
    targetSeat: BattleProtocolSeatV4;
    moveId: string;
    moveName: string;
    rawLine: string;
  } | null;
  winner: string;
};

export type BattleSemanticEventV4 =
  | {kind: "switchIn" | "dragIn"; sequence: number; rawLine: string; protocolEvent: BattleProtocolEventV4; seat: BattleProtocolSeatV4; slot: BattleViewSlotV4}
  | {kind: "switchOut"; sequence: number; rawLine: string; protocolEvent: BattleProtocolEventV4; seat: BattleProtocolSeatV4; slot?: BattleViewSlotV4}
  | {kind: "move"; sequence: number; rawLine: string; protocolEvent: BattleProtocolEventV4; actorSeat: BattleProtocolSeatV4; targetSeat: BattleProtocolSeatV4; moveId: string; moveName: string; actorName: string; targetName: string}
  | {kind: "damage" | "heal"; sequence: number; rawLine: string; protocolEvent: BattleProtocolEventV4; seat: BattleProtocolSeatV4; oldHp: number; newHp: number; maxHp: number; delta: number; status: string; fainted: boolean; source: "move" | "status" | "item" | "ability" | "field" | "unknown"; label: string}
  | {kind: "faint"; sequence: number; rawLine: string; protocolEvent: BattleProtocolEventV4; seat: BattleProtocolSeatV4; slot?: BattleViewSlotV4}
  | {kind: "status" | "cureStatus"; sequence: number; rawLine: string; protocolEvent: BattleProtocolEventV4; seat: BattleProtocolSeatV4; oldStatus: string; newStatus: string; label: string}
  | {kind: "result"; sequence: number; rawLine: string; protocolEvent: BattleProtocolEventV4; seat: BattleProtocolSeatV4; text: string; tone: "good" | "bad" | "neutral" | "status" | "weather" | ""}
  | {kind: "field" | "weather" | "sideCondition"; sequence: number; rawLine: string; protocolEvent: BattleProtocolEventV4; id: string; active: boolean; label: string}
  | {kind: "turn"; sequence: number; rawLine: string; protocolEvent: BattleProtocolEventV4; turn: number}
  | {kind: "message"; sequence: number; rawLine: string; protocolEvent: BattleProtocolEventV4; text: string}
  | {kind: "win"; sequence: number; rawLine: string; protocolEvent: BattleProtocolEventV4; winner: string};

export type BattleProtocolExecutionResultV4 = {
  protocolEvents: BattleProtocolEventV4[];
  semanticEvents: BattleSemanticEventV4[];
  runtimeState: BattleRuntimeStateV4;
};

export function executeBattleV4Protocol(
  snapshot: BattleSessionSnapshotV4,
  viewModel: BattleViewModelV4 | null,
  previousIndex = 0,
): BattleProtocolExecutionResultV4 {
  const runtime = createInitialRuntimeState();
  const protocolEvents: BattleProtocolEventV4[] = [];
  const semanticEvents: BattleSemanticEventV4[] = [];
  let turn = 0;
  for (let index = 0; index < snapshot.rawLog.length; index += 1) {
    const rawLine = snapshot.rawLog[index] || "";
    const {args, kwArgs} = parseBattleProtocolLineForExecutor(rawLine);
    if (args[0] === "request") continue;
    if (args[0] === "turn") turn = Number(args[1] || turn) || turn;
    const protocolEvent = buildProtocolEventForExecutor(index, rawLine, args, kwArgs, turn);
    protocolEvents.push(protocolEvent);
    const shouldEmit = index >= previousIndex;
    const nextEvents = applyProtocolEvent(snapshot, viewModel, runtime, protocolEvent);
    if (shouldEmit) semanticEvents.push(...nextEvents);
  }
  runtime.winner = snapshot.winner || runtime.winner;
  return {protocolEvents, semanticEvents, runtimeState: runtime};
}

export function parseBattleProtocolLineForExecutor(rawLine: string): {args: BattleProtocolArgsV4; kwArgs: BattleProtocolKwArgsV4} {
  if (!rawLine.startsWith("|")) return {args: ["", rawLine], kwArgs: {}};
  if (rawLine === "|") return {args: ["done"], kwArgs: {}};
  const firstPipe = rawLine.indexOf("|", 1);
  const command = firstPipe >= 0 ? rawLine.slice(1, firstPipe) : rawLine.slice(1);
  if (RAW_NO_DEFAULT_COMMANDS.has(command)) {
    return {args: [command, firstPipe >= 0 ? rawLine.slice(firstPipe + 1) : ""], kwArgs: {}};
  }
  if (THREE_PART_COMMANDS.has(command)) {
    const secondPipe = rawLine.indexOf("|", firstPipe + 1);
    return {args: [command, rawLine.slice(firstPipe + 1, secondPipe), rawLine.slice(secondPipe + 1)], kwArgs: {}};
  }
  if (FOUR_PART_COMMANDS.has(command)) {
    const secondPipe = rawLine.indexOf("|", firstPipe + 1);
    const thirdPipe = rawLine.indexOf("|", secondPipe + 1);
    return {args: [command, rawLine.slice(firstPipe + 1, secondPipe), rawLine.slice(secondPipe + 1, thirdPipe), rawLine.slice(thirdPipe + 1)], kwArgs: {}};
  }
  const args = rawLine.slice(1).split("|") as BattleProtocolArgsV4;
  const kwArgs: BattleProtocolKwArgsV4 = {};
  while (args.length > 1) {
    const lastArg = args[args.length - 1] || "";
    if (!lastArg.startsWith("[")) break;
    const bracketPos = lastArg.indexOf("]");
    if (bracketPos <= 0) break;
    kwArgs[lastArg.slice(1, bracketPos)] = lastArg.slice(bracketPos + 1).trim() || ".";
    args.pop();
  }
  return {args, kwArgs};
}

function createInitialRuntimeState(): BattleRuntimeStateV4 {
  const slots: BattleRuntimeStateV4["slots"] = {};
  return {
    turn: 0,
    slots,
    weatherId: "",
    terrainId: "",
    roomId: "",
    gravityActive: false,
    sideConditions: [],
    lastMove: null,
    winner: "",
  };
}

function applyProtocolEvent(
  snapshot: BattleSessionSnapshotV4,
  viewModel: BattleViewModelV4 | null,
  runtime: BattleRuntimeStateV4,
  event: BattleProtocolEventV4,
): BattleSemanticEventV4[] {
  switch (event.eventType) {
  case "switch":
  case "drag": {
    const slot = slotFromSwitchProtocolEvent(snapshot, viewModel, event);
    if (!slot || !event.seat) return [];
    const previousSlot = runtime.slots[event.seat];
    const nextSlot = {...slot, lastKnownHp: slot.hp, lastKnownMaxHp: slot.maxHp};
    runtime.slots[event.seat] = nextSlot;
    return [
      ...(previousSlot ? [{kind: "switchOut" as const, sequence: event.sequence, rawLine: event.rawLine, protocolEvent: event, seat: event.seat, slot: previousSlot}] : []),
      {kind: event.eventType === "drag" ? "dragIn" : "switchIn", sequence: event.sequence, rawLine: event.rawLine, protocolEvent: event, seat: event.seat, slot},
    ];
  }
  case "move": {
    runtime.lastMove = {
      actorSeat: event.seat,
      targetSeat: event.targetSeat,
      moveId: event.moveId,
      moveName: event.moveName,
      rawLine: event.rawLine,
    };
    return [{
      kind: "move",
      sequence: event.sequence,
      rawLine: event.rawLine,
      protocolEvent: event,
      actorSeat: event.seat,
      targetSeat: event.targetSeat,
      moveId: event.moveId,
      moveName: event.moveName,
      actorName: event.actorName,
      targetName: event.targetName,
    }];
  }
  case "-damage":
  case "-heal":
  case "-sethp": {
    const slot = event.seat ? runtime.slots[event.seat] : undefined;
    const condition = parseProtocolCondition(event.condition, slot?.maxHp || slot?.lastKnownMaxHp || 0);
    if (!event.seat || !condition) return [];
    const oldHp = slot ? slot.hp : condition.maxHp;
    const newHp = condition.hp;
    const maxHp = condition.maxHp || slot?.maxHp || 0;
    const nextSlot = slot ? {
      ...slot,
      hp: newHp,
      maxHp,
      status: condition.status || slot.status,
      fainted: condition.fainted,
      lastKnownHp: newHp,
      lastKnownMaxHp: maxHp,
    } : undefined;
    if (nextSlot) runtime.slots[event.seat] = nextSlot;
    const kind = event.eventType === "-heal" || newHp > oldHp ? "heal" : "damage";
    return [{
      kind,
      sequence: event.sequence,
      rawLine: event.rawLine,
      protocolEvent: event,
      seat: event.seat,
      oldHp,
      newHp,
      maxHp,
      delta: Math.abs(newHp - oldHp),
      status: condition.status,
      fainted: condition.fainted,
      source: semanticDamageSource(event),
      label: hpDeltaLabel(oldHp, newHp, maxHp),
    }];
  }
  case "faint": {
    const slot = event.seat ? runtime.slots[event.seat] : undefined;
    if (slot && event.seat) runtime.slots[event.seat] = {...slot, hp: 0, status: "fnt", fainted: true, lastKnownHp: 0};
    return event.seat ? [{kind: "faint", sequence: event.sequence, rawLine: event.rawLine, protocolEvent: event, seat: event.seat, slot}] : [];
  }
  case "-status":
  case "-curestatus": {
    const slot = event.seat ? runtime.slots[event.seat] : undefined;
    const oldStatus = slot?.status || "";
    const newStatus = event.eventType === "-curestatus" ? "" : event.status;
    if (slot && event.seat) runtime.slots[event.seat] = {...slot, status: newStatus};
    return event.seat ? [{
      kind: event.eventType === "-curestatus" ? "cureStatus" : "status",
      sequence: event.sequence,
      rawLine: event.rawLine,
      protocolEvent: event,
      seat: event.seat,
      oldStatus,
      newStatus,
      label: statusLabel(newStatus || oldStatus),
    }] : [];
  }
  case "-supereffective":
  case "-crit":
  case "-resisted":
  case "-immune":
  case "-miss":
  case "-fail":
  case "-activate":
  case "-enditem":
    return [{
      kind: "result",
      sequence: event.sequence,
      rawLine: event.rawLine,
      protocolEvent: event,
      seat: event.seat || event.targetSeat,
      text: resultTextForEvent(event),
      tone: resultToneForEvent(event),
    }];
  case "-weather": {
    const id = toId(event.args[1] || "");
    runtime.weatherId = id;
    return [{kind: "weather", sequence: event.sequence, rawLine: event.rawLine, protocolEvent: event, id, active: Boolean(id && id !== "none"), label: weatherLabel(id)}];
  }
  case "-fieldstart":
  case "-fieldend": {
    const id = toId(cleanEffect(event.args[1] || ""));
    const active = event.eventType === "-fieldstart";
    if (id.includes("terrain")) runtime.terrainId = active ? id : "";
    else if (id.includes("room")) runtime.roomId = active ? id : "";
    else if (id === "gravity") runtime.gravityActive = active;
    return [{kind: "field", sequence: event.sequence, rawLine: event.rawLine, protocolEvent: event, id, active, label: fieldLabel(id)}];
  }
  case "-sidestart":
  case "-sideend": {
    const id = toId(cleanEffect(event.args[2] || event.args[1] || ""));
    const active = event.eventType === "-sidestart";
    const seat = event.seat || event.targetSeat;
    const side = sideConditionSideForSeat(seat);
    runtime.sideConditions = active
      ? [...runtime.sideConditions.filter(item => item.id !== id || item.side !== side), {id, side, seat, label: sideConditionLabel(id)}]
      : runtime.sideConditions.filter(item => item.id !== id || item.side !== side);
    return [{kind: "sideCondition", sequence: event.sequence, rawLine: event.rawLine, protocolEvent: event, id, active, label: sideConditionLabel(id)}];
  }
  case "turn":
    runtime.turn = Number(event.args[1] || event.turn) || event.turn;
    runtime.lastMove = null;
    return [{kind: "turn", sequence: event.sequence, rawLine: event.rawLine, protocolEvent: event, turn: runtime.turn}];
  case "win":
    runtime.winner = event.args[1] || "";
    return [{kind: "win", sequence: event.sequence, rawLine: event.rawLine, protocolEvent: event, winner: runtime.winner}];
  default:
    return [];
  }
}

function buildProtocolEventForExecutor(
  sequence: number,
  rawLine: string,
  args: BattleProtocolArgsV4,
  kwArgs: BattleProtocolKwArgsV4,
  turn: number,
): BattleProtocolEventV4 {
  const eventType = args[0] || "";
  const actor = actorArgForEvent(eventType, args, kwArgs);
  const target = targetArgForEvent(eventType, args);
  const actorParts = parsePokemonProtocolIdent(actor);
  const targetParts = parsePokemonProtocolIdent(target);
  const moveName = moveNameForProtocolEvent(eventType, args, kwArgs);
  return {
    sequence,
    rawLine,
    args,
    kwArgs,
    eventType,
    turn,
    playerId: actorParts.playerId,
    seat: actorParts.seat,
    seatExplicit: actorParts.seatExplicit,
    targetSeat: targetParts.seat,
    targetSeatExplicit: targetParts.seatExplicit,
    actorName: actorParts.name || actor,
    targetName: targetParts.name || target,
    moveId: toId(moveName),
    moveName,
    condition: conditionArgFor(args),
    status: statusArgFor(args, kwArgs),
  };
}

function slotFromSwitchProtocolEvent(snapshot: BattleSessionSnapshotV4, viewModel: BattleViewModelV4 | null, event: BattleProtocolEventV4): BattleViewSlotV4 | null {
  const parsed = parseSwitchDetails(event);
  const playerId = parsed.playerId;
  if (!playerId || !event.seat) return viewModel?.slots.find(slot => slot.seat === event.seat) || null;
  const player = snapshot.players.find(entry => entry.playerId === playerId);
  const side = player?.alliance === "far" ? "far" : "near";
  const team = player?.draft.localTeam.pokemon || [];
  const pokemon = resolveLocalPokemonForProtocolSwitch(parsed, team);
  if (!pokemon) return viewModel?.slots.find(slot => slot.seat === event.seat) || null;
  const condition = parseProtocolCondition(parsed.condition || "", pokemon.maxHp);
  return {
    seat: event.seat,
    playerId,
    side,
    position: event.seat.endsWith("B") ? "B" : "A",
    localPokemonId: pokemon.localPokemonId,
    showdownIdentityToken: pokemon.showdownIdentityToken,
    showdownId: pokemon.showdownId,
    pokeballId: pokemon.pokeballId,
    active: true,
    fainted: condition?.fainted ?? pokemon.entryHp <= 0,
    name: pokemon.name,
    nameZh: pokemon.nameZh,
    speciesId: pokemon.speciesId,
    level: parsed.level || pokemon.level,
    hp: condition?.hp ?? pokemon.entryHp,
    maxHp: pokemon.maxHp || condition?.maxHp || 0,
    status: condition?.status || pokemon.entryStatus,
    spriteUrl: side === "near"
      ? firstLargeSprite(pokemon.backSpriteUrl, pokemon.spriteUrl)
      : firstLargeSprite(pokemon.frontSpriteUrl, pokemon.spriteUrl),
    frontSpriteUrl: firstLargeSprite(pokemon.frontSpriteUrl, pokemon.spriteUrl),
    backSpriteUrl: firstLargeSprite(pokemon.backSpriteUrl, pokemon.spriteUrl),
    frontShinySpriteUrl: firstLargeSprite(pokemon.frontShinySpriteUrl, pokemon.shinySpriteUrl, pokemon.frontSpriteUrl, pokemon.spriteUrl),
    backShinySpriteUrl: firstLargeSprite(pokemon.backShinySpriteUrl, pokemon.shinySpriteUrl, pokemon.backSpriteUrl, pokemon.spriteUrl),
    iconUrl: pokemon.iconUrl || pokemon.spriteUrl || "",
    iconStyle: pokemon.iconStyle,
    teamBallStates: teamBallStates(team, pokemon.localPokemonId),
  };
}

function parseSwitchDetails(event: BattleProtocolEventV4): {
  playerId: ShowdownPlayerIdV4 | "";
  species: string;
  condition: string;
  level: number;
} {
  const {playerId} = parsePokemonProtocolIdent(event.args?.[1] || "");
  const details = event.args?.[2] || event.actorName;
  const condition = event.args?.[3] || event.condition;
  const parts = details.split(",").map(part => part.trim()).filter(Boolean);
  const levelPart = parts.find(part => /^L\d+$/i.test(part));
  return {
    playerId: (playerId || "") as ShowdownPlayerIdV4 | "",
    species: parts[0] || event.actorName,
    condition,
    level: levelPart ? Number(levelPart.slice(1)) || 0 : 0,
  };
}

function resolveLocalPokemonForProtocolSwitch(parsed: ReturnType<typeof parseSwitchDetails>, team: LocalPokemonV4[]): LocalPokemonV4 | null {
  const species = toId(parsed.species);
  const candidates = team.filter(pokemon =>
    toId(pokemon.speciesId) === species ||
    toId(pokemon.name) === species ||
    toId(pokemon.nameZh) === species ||
    toId(pokemon.nickname) === species
  );
  return candidates[0] || null;
}

function parseProtocolCondition(condition: string, trueMaxHp = 0): {hp: number; maxHp: number; status: string; fainted: boolean} | null {
  if (!condition) return null;
  if (condition.includes("fnt")) return {hp: 0, maxHp: trueMaxHp, status: "fnt", fainted: true};
  const match = /^(\d+)\/(\d+)(?:\s+([a-z]+))?/i.exec(condition);
  if (!match) return null;
  const protocolHp = Number(match[1] || 0);
  const protocolMaxHp = Number(match[2] || 0);
  const maxHp = trueMaxHp || protocolMaxHp;
  const hp = maxHp && protocolMaxHp && maxHp !== protocolMaxHp
    ? Math.max(0, Math.min(maxHp, Math.round(protocolHp / protocolMaxHp * maxHp)))
    : protocolHp;
  return {hp, maxHp, status: toId(match[3] || ""), fainted: hp <= 0};
}

function hpDeltaLabel(oldHp: number, newHp: number, maxHp: number): string {
  const delta = Math.abs(newHp - oldHp);
  if (!delta) return "0";
  return maxHp ? `${delta}/${maxHp}` : String(delta);
}

function semanticDamageSource(event: BattleProtocolEventV4): BattleSemanticEventV4 extends infer T ? "move" | "status" | "item" | "ability" | "field" | "unknown" : never {
  const from = toId(event.kwArgs.from || "");
  if (!from) return "move";
  if (["brn", "psn", "tox", "confusion", "leechseed", "curse", "nightmare"].includes(from)) return "status";
  if (["spikes", "stealthrock", "toxicspikes", "stickyweb"].includes(from)) return "field";
  if (event.kwArgs.from?.startsWith("item:")) return "item";
  if (event.kwArgs.from?.startsWith("ability:")) return "ability";
  return "unknown";
}

function actorArgForEvent(eventType: string, args: BattleProtocolArgsV4, kwArgs: BattleProtocolKwArgsV4): string {
  if (eventType === "-weather" || eventType === "-fieldstart" || eventType === "-fieldend") return kwArgs.of || args[1] || "";
  if (eventType === "custom" && toId(args[1]) === "endterastallize") return args[2] || "";
  return args[1] || "";
}

function targetArgForEvent(eventType: string, args: BattleProtocolArgsV4): string {
  if (eventType === "move" || eventType === "-anim") return args[3] || "";
  if (eventType === "-transform") return args[2] || "";
  if (eventType === "-miss") return args[2] || "";
  if (eventType === "-supereffective" || eventType === "-resisted" || eventType === "-crit" || eventType === "-immune" || eventType === "-fail" || eventType === "-activate") return args[1] || "";
  return args[1] || "";
}

function moveNameForProtocolEvent(eventType: string, args: BattleProtocolArgsV4, kwArgs: BattleProtocolKwArgsV4): string {
  if (eventType === "move" || eventType === "-anim") return args[2] || "";
  if (eventType === "-weather") return cleanEffect(kwArgs.from || args[1] || "");
  if (eventType === "-fieldstart" || eventType === "-fieldend") return cleanEffect(args[1] || kwArgs.from || "");
  return kwArgs.move || args[3] || "";
}

function conditionArgFor(args: BattleProtocolArgsV4): string {
  if (args[0] === "-damage" || args[0] === "-heal" || args[0] === "-sethp") return args[2] || "";
  return "";
}

function statusArgFor(args: BattleProtocolArgsV4, kwArgs: BattleProtocolKwArgsV4): string {
  if (args[0] === "-status") return toId(args[2] || "");
  if (args[0] === "-curestatus") return "clear";
  if (args[0] === "-damage" || args[0] === "-heal" || args[0] === "-sethp") return parseProtocolCondition(args[2] || "")?.status || "";
  return toId(kwArgs.status || "");
}

function parsePokemonProtocolIdent(value: string): {playerId?: string; seat: BattleProtocolSeatV4; seatExplicit: boolean; name: string} {
  const match = /^(p[1-4])([a-z])?:\s*(.*)$/i.exec(value || "");
  if (!match) return {seat: "", seatExplicit: false, name: value || ""};
  const playerId = match[1]!.toLowerCase();
  const slot = (match[2] || "a").toUpperCase();
  const seat = `${playerId}${slot}` as BattleProtocolSeatV4;
  return {playerId, seat, seatExplicit: Boolean(match[2]), name: match[3] || ""};
}

function firstLargeSprite(...values: Array<string | undefined>): string {
  return values.find(value => value && !value.includes("pokemonicons-sheet")) || "";
}

function teamBallStates(team: LocalPokemonV4[], activeLocalPokemonId: string): BattleViewSlotV4["teamBallStates"] {
  const states: BattleViewSlotV4["teamBallStates"] = team.slice(0, 6).map(pokemon => {
    if (pokemon.localPokemonId === activeLocalPokemonId) return "normal" as const;
    if (pokemon.entryHp <= 0) return "fainted" as const;
    if (pokemon.entryStatus) return "status" as const;
    return "normal" as const;
  });
  while (states.length < 6) states.push("empty");
  return states;
}

function sideConditionSideForSeat(seat: BattleProtocolSeatV4): "near" | "far" {
  return seat.startsWith("p2") || seat.startsWith("p4") ? "far" : "near";
}

function resultTextForEvent(event: BattleProtocolEventV4): string {
  if (event.eventType === "-supereffective") return "效果拔群";
  if (event.eventType === "-crit") return "击中要害";
  if (event.eventType === "-resisted") return "效果不好";
  if (event.eventType === "-immune") return "没有效果";
  if (event.eventType === "-miss") return "未命中";
  if (event.eventType === "-fail") return "失败";
  if (event.eventType === "-enditem") return cleanEffect(event.args[2] || "道具");
  return cleanEffect(event.args[2] || event.args[1] || "");
}

function resultToneForEvent(event: BattleProtocolEventV4): "good" | "bad" | "neutral" | "status" | "weather" | "" {
  if (event.eventType === "-supereffective" || event.eventType === "-crit") return "bad";
  if (event.eventType === "-resisted" || event.eventType === "-immune" || event.eventType === "-miss" || event.eventType === "-fail") return "neutral";
  return "neutral";
}

function statusLabel(status: string): string {
  if (status === "brn") return "灼伤";
  if (status === "psn" || status === "tox") return "中毒";
  if (status === "par") return "麻痹";
  if (status === "slp") return "睡眠";
  if (status === "frz") return "冰冻";
  return status || "状态";
}

function weatherLabel(id: string): string {
  if (id === "raindance" || id === "primordialsea") return "雨天";
  if (id === "sunnyday" || id === "desolateland") return "晴天";
  if (id === "sandstorm") return "沙暴";
  if (id === "hail" || id === "snow" || id === "snowscape") return "雪天";
  return id || "天气";
}

function fieldLabel(id: string): string {
  if (id === "trickroom") return "戏法空间";
  if (id === "electricterrain") return "电气场地";
  if (id === "grassyterrain") return "青草场地";
  if (id === "mistyterrain") return "薄雾场地";
  if (id === "psychicterrain") return "精神场地";
  if (id === "gravity") return "重力";
  return id || "场地";
}

function sideConditionLabel(id: string): string {
  if (id === "stealthrock") return "隐形岩";
  if (id === "spikes") return "撒菱";
  if (id === "toxicspikes") return "毒菱";
  if (id === "stickyweb") return "黏黏网";
  if (id === "reflect") return "反射壁";
  if (id === "lightscreen") return "光墙";
  return id || "场地状态";
}

function cleanEffect(value: string): string {
  return String(value || "").replace(/^(move|ability|item):\s*/i, "").trim();
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
