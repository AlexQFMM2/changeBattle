import {buildBattleV4StepCommentaryIndex} from "./battleV4Commentary.js";
import type {BattlePlaybackStepV4, BattleProtocolEventV4} from "./battleV4Playback.js";
import {executeBattleV4Protocol} from "./battleV4ProtocolExecutor.js";
import type {BattleSemanticEventV4} from "./battleV4ProtocolExecutor.js";
import type {BattleVisualCommandV4} from "./battleV4VisualScene.js";

type SemanticEventByKind<K extends BattleSemanticEventV4["kind"]> = BattleSemanticEventV4 extends infer E
  ? E extends {kind: infer Kind}
    ? K extends Kind ? E : never
    : never
  : never;

function smoke() {
  const api = createTestApi();

  const weather = commentaryTexts(step([
    semantic("weather", 1, "|-weather|SunnyDay|[from] ability: Drought|[of] p1a: Torkoal", {
      id: "sunnyday",
      active: true,
      label: "晴天",
      protocolEvent: protocol(1, "|-weather|SunnyDay|[from] ability: Drought|[of] p1a: Torkoal", "-weather", ["-weather", "SunnyDay"], {from: "ability: Drought", of: "p1a: Torkoal"}),
    }),
  ]), api);
  assertIncludes(weather, "煤炭龟的日照让天气变成了晴天！", "weather from ability should be factual");

  const rockSlide = commentaryTexts(step([
    semantic("move", 2, "|move|p1a: Lycanroc|Rock Slide|p2a: Heracross", {
      actorSeat: "p1A",
      targetSeat: "p2A",
      actorName: "Lycanroc",
      targetName: "Heracross",
      moveId: "rockslide",
      moveName: "Rock Slide",
    }),
    semantic("result", 3, "|-supereffective|p2a: Heracross", {
      seat: "p2A",
      text: "效果拔群",
      tone: "bad",
      protocolEvent: protocol(3, "|-supereffective|p2a: Heracross", "-supereffective", ["-supereffective", "p2a: Heracross"]),
    }),
    semantic("damage", 4, "|-damage|p2a: Heracross|12/100", {
      seat: "p2A",
      oldHp: 100,
      newHp: 12,
      maxHp: 100,
      delta: 88,
      status: "",
      fainted: false,
      source: "move",
      label: "88/100",
      protocolEvent: protocol(4, "|-damage|p2a: Heracross|12/100", "-damage", ["-damage", "p2a: Heracross", "12/100"]),
    }),
  ]), api);
  assertEqual(rockSlide.length, 1, "move result should be merged into one commentary entry");
  assertIncludes(rockSlide, "鬃岩狼人使用了岩崩，对赫拉克罗斯非常有效！", "move + supereffective should merge target effect");

  const switchIn = commentaryTexts(step([
    semantic("switchIn", 5, "|switch|p1a: Raichu|Raichu, L50|100/100", {
      seat: "p1A",
      slot: {name: "Raichu", nameZh: "雷丘"} as any,
    }),
  ]), api);
  assertEqual(switchIn.length, 0, "normal switch-in should not generate commentary");

  const heal = commentaryTexts(step([
    semantic("heal", 6, "|-heal|p2a: Skarmory|60/100|[from] item: Sitrus Berry", {
      seat: "p2A",
      oldHp: 35,
      newHp: 60,
      maxHp: 100,
      delta: 25,
      status: "",
      fainted: false,
      source: "item",
      label: "25/100",
      protocolEvent: protocol(6, "|-heal|p2a: Skarmory|60/100|[from] item: Sitrus Berry", "-heal", ["-heal", "p2a: Skarmory", "60/100"], {from: "item: Sitrus Berry"}),
    }),
  ]), api);
  assertIncludes(heal, "文柚果让盔甲鸟恢复了体力。", "item heal should mention item and target");

  const sideCondition = commentaryTexts(step([
    semantic("sideCondition", 7, "|-sidestart|p2: Opponent|move: Aurora Veil", {
      id: "auroraveil",
      active: true,
      label: "极光幕",
      protocolEvent: protocol(7, "|-sidestart|p2: Opponent|move: Aurora Veil", "-sidestart", ["-sidestart", "p2: Opponent", "move: Aurora Veil"]),
    }),
    semantic("sideCondition", 8, "|-sidestart|p1: Player|move: Tailwind", {
      id: "tailwind",
      active: true,
      label: "顺风",
      protocolEvent: protocol(8, "|-sidestart|p1: Player|move: Tailwind", "-sidestart", ["-sidestart", "p1: Player", "move: Tailwind"]),
    }),
    semantic("sideCondition", 9, "|-sidestart|p2: Opponent|move: Stealth Rock", {
      id: "stealthrock",
      active: true,
      label: "隐形岩",
      protocolEvent: protocol(9, "|-sidestart|p2: Opponent|move: Stealth Rock", "-sidestart", ["-sidestart", "p2: Opponent", "move: Stealth Rock"]),
    }),
  ]), api);
  assertIncludes(sideCondition, "对方展开了极光幕！", "aurora veil should be localized");
  assertIncludes(sideCondition, "我方展开了顺风！", "tailwind should be localized");
  assertIncludes(sideCondition, "对方撒下了隐形岩！", "stealth rock should be localized");

  const transforms = commentaryTexts(step([
    semantic("transform", 10, "|-mega|p1a: Gengar|Gengar-Mega", {
      seat: "p1A",
      label: "Mega 进化",
      protocolEvent: protocol(10, "|-mega|p1a: Gengar|Gengar-Mega", "-mega", ["-mega", "p1a: Gengar", "Gengar-Mega"]),
    }),
    semantic("transform", 11, "|detailschange|p2a: Drampa|Drampa, L46, M|100/100", {
      seat: "p2A",
      label: "Drampa, L46, M",
      protocolEvent: protocol(11, "|detailschange|p2a: Drampa|Drampa, L46, M|100/100", "detailschange", ["detailschange", "p2a: Drampa", "Drampa, L46, M", "100/100"]),
    }),
    semantic("transform", 12, "|-formechange|p1a: Minior|Minior-Meteor", {
      seat: "p1A",
      label: "Minior-Meteor",
      protocolEvent: protocol(12, "|-formechange|p1a: Minior|Minior-Meteor", "-formechange", ["-formechange", "p1a: Minior", "Minior-Meteor"]),
    }),
  ]), api);
  assertIncludes(transforms, "耿鬼Mega进化了！", "mega commentary should be concise");
  assertIncludes(transforms, "老翁龙的形态改变了！", "detailschange should not leak level and gender details");
  assertIncludes(transforms, "小陨星变成了流星形态！", "formechange should describe the target form");

  const contrary = commentaryTexts(step([
    semantic("move", 13, "|move|p1a: Serperior|Leaf Storm|p2a: Empoleon", {
      actorSeat: "p1A",
      targetSeat: "p2A",
      actorName: "Serperior",
      targetName: "Empoleon",
      moveId: "leafstorm",
      moveName: "Leaf Storm",
    }),
    semantic("statChange", 14, "|-boost|p1a: Serperior|spa|2|[from] ability: Contrary", {
      seat: "p1A",
      stat: "spa",
      statLabel: "特攻",
      amount: 2,
      direction: "up",
      sourceKind: "ability",
      sourceName: "Contrary",
      sourcePokemonName: "Serperior",
      label: "特攻 ↑↑",
      protocolEvent: protocol(14, "|-boost|p1a: Serperior|spa|2|[from] ability: Contrary", "-boost", ["-boost", "p1a: Serperior", "spa", "2"], {from: "ability: Contrary"}),
    }),
  ]), api);
  assertIncludes(contrary, "君主蛇使用了飞叶风暴，本应下降的特攻因为唱反调而大幅提升了！", "contrary boost should be merged into move commentary");

  const intimidate = commentaryTexts(step([
    semantic("statChange", 15, "|-unboost|p2a: Empoleon|atk|1|[from] ability: Intimidate|[of] p1a: Incineroar", {
      seat: "p2A",
      stat: "atk",
      statLabel: "攻击",
      amount: -1,
      direction: "down",
      sourceKind: "ability",
      sourceName: "Intimidate",
      sourcePokemonName: "Incineroar",
      label: "攻击 ↓",
      protocolEvent: protocol(15, "|-unboost|p2a: Empoleon|atk|1|[from] ability: Intimidate|[of] p1a: Incineroar", "-unboost", ["-unboost", "p2a: Empoleon", "atk", "1"], {from: "ability: Intimidate", of: "p1a: Incineroar"}),
    }),
  ]), api);
  assertIncludes(intimidate, "咆哮虎的威吓降低了帝王拿波的攻击！", "intimidate should mention source ability and target stat");

  const competitive = commentaryTexts(step([
    semantic("statChange", 16, "|-boost|p2a: Empoleon|spa|2|[from] ability: Competitive", {
      seat: "p2A",
      stat: "spa",
      statLabel: "特攻",
      amount: 2,
      direction: "up",
      sourceKind: "ability",
      sourceName: "Competitive",
      sourcePokemonName: "Empoleon",
      label: "特攻 ↑↑",
      protocolEvent: protocol(16, "|-boost|p2a: Empoleon|spa|2|[from] ability: Competitive", "-boost", ["-boost", "p2a: Empoleon", "spa", "2"], {from: "ability: Competitive"}),
    }),
  ]), api);
  assertIncludes(competitive, "帝王拿波的好胜被触发，特攻大幅提升了！", "competitive should be phrased as ability trigger");

  const regularStats = commentaryTexts(step([
    semantic("statChange", 17, "|-boost|p1a: Raichu|spe|1", {
      seat: "p1A",
      stat: "spe",
      statLabel: "速度",
      amount: 1,
      direction: "up",
      sourceKind: "unknown",
      sourceName: "",
      sourcePokemonName: "",
      label: "速度 ↑",
      protocolEvent: protocol(17, "|-boost|p1a: Raichu|spe|1", "-boost", ["-boost", "p1a: Raichu", "spe", "1"]),
    }),
    semantic("statChange", 18, "|-unboost|p1a: Raichu|def|2", {
      seat: "p1A",
      stat: "def",
      statLabel: "防御",
      amount: -2,
      direction: "down",
      sourceKind: "unknown",
      sourceName: "",
      sourcePokemonName: "",
      label: "防御 ↓↓",
      protocolEvent: protocol(18, "|-unboost|p1a: Raichu|def|2", "-unboost", ["-unboost", "p1a: Raichu", "def", "2"]),
    }),
  ]), api);
  assertIncludes(regularStats, "雷丘的速度提升了！", "regular boost should be localized");
  assertIncludes(regularStats, "雷丘的防御大幅下降了。", "regular unboost should be localized");

  const protocolStats = executeBattleV4Protocol({
    id: "stat-change-protocol",
    rawLog: [
      "|-boost|p1a: Serperior|spa|2|[from] ability: Contrary",
      "|-unboost|p1a: Serperior|def|1",
    ],
  } as any, null, 0).semanticEvents.filter((event): event is SemanticEventByKind<"statChange"> => event.kind === "statChange");
  assertEqual(protocolStats.length, 2, "boost/unboost protocol rows should create statChange visual commands");
  assertEqual(protocolStats[0]?.label, "特攻 ↑↑", "boost semantic event should expose stat arrows");
  assertEqual(protocolStats[0]?.direction, "up", "boost semantic event should be positive");
  assertEqual(protocolStats[1]?.label, "防御 ↓", "unboost semantic event should expose stat arrows");
  assertEqual(protocolStats[1]?.direction, "down", "unboost semantic event should be negative");

  console.log("battle-v4 commentary smoke ok");
}

function commentaryTexts(step: BattlePlaybackStepV4, api: ReturnType<typeof createTestApi>): string[] {
  const index = buildBattleV4StepCommentaryIndex(step, api as any);
  return [...index.byCommandId.values(), ...index.immediate].map(entry => entry.text);
}

function step(events: BattleSemanticEventV4[]): BattlePlaybackStepV4 {
  const commands = events.map(commandFromSemanticEvent);
  return {
    id: "test-step",
    sequence: events[0]?.sequence || 0,
    rawLine: events.map(event => event.rawLine).join("\n"),
    messages: [],
    commands,
    sceneCalls: [],
    waitMode: "wait",
    minDurationMs: 0,
    kind: events[0]?.kind || "message",
  };
}

function commandFromSemanticEvent(event: BattleSemanticEventV4): BattleVisualCommandV4 {
  return {
    id: `${event.sequence}-${event.kind}`,
    semanticEvent: event,
    animationEvent: event.kind === "turn" || event.kind === "message" ? null : ({checkpointId: `${event.sequence}-${event.kind}`} as any),
    blocksCommands: true,
  };
}

function semantic<T extends BattleSemanticEventV4["kind"]>(
  kind: T,
  sequence: number,
  rawLine: string,
  patch: Partial<SemanticEventByKind<T>>,
): SemanticEventByKind<T> {
  return {
    kind,
    sequence,
    rawLine,
    protocolEvent: protocol(sequence, rawLine, rawLine.split("|")[1] || "", [rawLine.split("|")[1] || ""]),
    ...patch,
  } as SemanticEventByKind<T>;
}

function protocol(sequence: number, rawLine: string, eventType: string, args: [string, ...string[]], kwArgs: Record<string, string> = {}): BattleProtocolEventV4 {
  const actor = args[1] || "";
  const target = args[3] || args[1] || "";
  return {
    sequence,
    rawLine,
    args,
    kwArgs,
    eventType,
    turn: 1,
    playerId: actor.slice(0, 2),
    seat: seatFromIdent(actor),
    seatExplicit: Boolean(seatFromIdent(actor)),
    targetSeat: seatFromIdent(target),
    targetSeatExplicit: Boolean(seatFromIdent(target)),
    actorName: nameFromIdent(actor),
    targetName: nameFromIdent(target),
    moveId: "",
    moveName: "",
    condition: "",
    status: "",
  };
}

function seatFromIdent(value: string) {
  const match = /^(p[1-4])([a-z])?:/i.exec(value || "");
  if (!match) return "" as const;
  return `${match[1]!.toLowerCase()}${(match[2] || "a").toUpperCase()}` as any;
}

function nameFromIdent(value: string): string {
  return value.replace(/^p[1-4][a-z]?:\s*/i, "");
}

function createTestApi() {
  const pokemon: Record<string, string> = {
    torkoal: "煤炭龟",
    lycanroc: "鬃岩狼人",
    heracross: "赫拉克罗斯",
    skarmory: "盔甲鸟",
    raichu: "雷丘",
    gengar: "耿鬼",
    drampa: "老翁龙",
    minior: "小陨星",
    miniormeteor: "小陨星",
    serperior: "君主蛇",
    empoleon: "帝王拿波",
    incineroar: "咆哮虎",
  };
  const moves: Record<string, string> = {
    rockslide: "岩崩",
    leafstorm: "飞叶风暴",
  };
  const abilities: Record<string, string> = {
    drought: "日照",
    contrary: "唱反调",
    intimidate: "威吓",
    competitive: "好胜",
    defiant: "不服输",
  };
  const items: Record<string, string> = {
    sitrusberry: "文柚果",
  };
  return {
    getPokemonDetail: (id: string) => ({id, name: id, nameZh: pokemon[toId(id)] || id}),
    getMoveDetail: (id: string) => ({id, name: id, nameZh: moves[toId(id)] || id}),
    getAbilityDetail: (id: string) => ({id, name: id, nameZh: abilities[toId(id)] || id}),
    getItemDetail: (id: string) => ({id, name: id, nameZh: items[toId(id)] || id}),
  };
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nexpected: ${String(expected)}\nactual: ${String(actual)}`);
  }
}

function assertIncludes(items: string[], expected: string, message: string) {
  if (!items.includes(expected)) {
    throw new Error(`${message}\nexpected to include: ${expected}\nactual: ${items.join(" | ")}`);
  }
}

smoke();
