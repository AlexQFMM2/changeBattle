import type {ChangeBattleV2Api} from "@changebattle-v2/api";
import type {BattlePlaybackStepV4, BattleProtocolSeatV4} from "./battleV4Playback";
import type {BattleSemanticEventV4} from "./battleV4ProtocolExecutor";
import type {BattleVisualCommandV4} from "./battleV4VisualScene";

export type BattleV4CommentaryTone = "move" | "good" | "bad" | "heal" | "status" | "weather" | "neutral";
type SemanticEventByKind<K extends BattleSemanticEventV4["kind"]> = BattleSemanticEventV4 extends infer E
  ? E extends {kind: infer Kind}
    ? K extends Kind ? E : never
    : never
  : never;

export type BattleV4CommentaryEntry = {
  id: string;
  stepId: string;
  commandId: string;
  sequence: number;
  speaker: "赛事解说" | "裁判";
  text: string;
  tone: BattleV4CommentaryTone;
  sourceRawLines: string[];
};

export type BattleV4VisibleCommentaryEntry = BattleV4CommentaryEntry & {
  shownAt: number;
};

export type BattleV4StepCommentaryIndex = {
  byCommandId: Map<string, BattleV4CommentaryEntry>;
  immediate: BattleV4CommentaryEntry[];
};

const MOVE_FOLLOWUP_KINDS = new Set<BattleSemanticEventV4["kind"]>(["result", "damage", "heal", "status", "cureStatus", "faint"]);

export function buildBattleV4StepCommentaryIndex(step: BattlePlaybackStepV4, api: ChangeBattleV2Api): BattleV4StepCommentaryIndex {
  const entries = step.commands
    .map(command => commentaryForBattleV4Command(step, command, api))
    .filter((entry): entry is BattleV4CommentaryEntry => Boolean(entry));
  const coveredCommands = new Set<string>();
  for (const command of step.commands) {
    if (command.semanticEvent.kind !== "move") continue;
    for (const followup of moveFollowupCommands(step, command)) {
      if (followup.semanticEvent.kind === "result" || followup.semanticEvent.kind === "damage" || followup.semanticEvent.kind === "heal") {
        coveredCommands.add(followup.id);
      }
    }
  }
  const byCommandId = new Map<string, BattleV4CommentaryEntry>();
  const immediate: BattleV4CommentaryEntry[] = [];
  for (const entry of entries) {
    if (coveredCommands.has(entry.commandId)) continue;
    byCommandId.set(entry.commandId, entry);
    const command = step.commands.find(item => item.id === entry.commandId);
    if (command && !command.animationEvent) immediate.push(entry);
  }
  return {byCommandId, immediate};
}

export function commentaryForBattleV4Command(
  step: BattlePlaybackStepV4,
  command: BattleVisualCommandV4,
  api: ChangeBattleV2Api,
): BattleV4CommentaryEntry | null {
  const event = command.semanticEvent;
  if (event.kind === "switchIn" || event.kind === "dragIn" || event.kind === "switchOut" || event.kind === "turn" || event.kind === "message" || event.kind === "win") return null;
  if (event.kind === "move") return moveCommentary(step, command, api);
  if (event.kind === "weather") return baseEntry(step, command, weatherCommentary(event, api), "weather");
  if (event.kind === "field") return baseEntry(step, command, fieldCommentary(event), "weather");
  if (event.kind === "sideCondition") return baseEntry(step, command, sideConditionCommentary(event), "status");
  if (event.kind === "heal") return baseEntry(step, command, healCommentary(event, api), "heal");
  if (event.kind === "damage") return baseEntry(step, command, damageCommentary(event, api), "bad");
  if (event.kind === "status" || event.kind === "cureStatus") return baseEntry(step, command, statusCommentary(event, api), "status");
  if (event.kind === "faint") return baseEntry(step, command, faintCommentary(event, api), "bad", "裁判");
  if (event.kind === "transform") return baseEntry(step, command, transformCommentary(event, api), "good");
  if (event.kind === "result") return baseEntry(step, command, resultCommentary(event, api), toneForResult(event));
  return null;
}

function moveCommentary(step: BattlePlaybackStepV4, command: BattleVisualCommandV4, api: ChangeBattleV2Api): BattleV4CommentaryEntry | null {
  const event = command.semanticEvent;
  if (event.kind !== "move") return null;
  const actor = localizePokemonName(event.actorName, api) || "场上的宝可梦";
  const move = localizeMoveName(event.moveName || event.moveId, api) || "招式";
  const followups = moveFollowupCommands(step, command);
  const resultPhrases = compactMoveResultPhrases(event, followups, api);
  const text = resultPhrases.length
    ? `${actor}使用了${move}，${resultPhrases.join("，")}！`
    : `${actor}使用了${move}！`;
  return baseEntry(
    step,
    command,
    text,
    moveTone(followups),
    "赛事解说",
    [event.rawLine, ...followups.map(item => item.semanticEvent.rawLine)].filter(Boolean),
  );
}

function moveFollowupCommands(step: BattlePlaybackStepV4, moveCommand: BattleVisualCommandV4): BattleVisualCommandV4[] {
  const startIndex = step.commands.findIndex(command => command.id === moveCommand.id);
  if (startIndex < 0) return [];
  const result: BattleVisualCommandV4[] = [];
  for (let index = startIndex + 1; index < step.commands.length; index += 1) {
    const command = step.commands[index];
    if (!command) continue;
    if (command.semanticEvent.kind === "move") break;
    if (!MOVE_FOLLOWUP_KINDS.has(command.semanticEvent.kind)) continue;
    result.push(command);
  }
  return result;
}

function compactMoveResultPhrases(
  moveEvent: SemanticEventByKind<"move">,
  followups: BattleVisualCommandV4[],
  api: ChangeBattleV2Api,
): string[] {
  const phrases: string[] = [];
  const targetEffects = new Map<string, {target: string; effects: string[]}>();
  let missed = false;
  let failed = false;
  for (const command of followups) {
    const event = command.semanticEvent;
    if (event.kind === "result") {
      const id = toId(event.text || event.protocolEvent.eventType);
      const targetName = targetNameForEvent(event, moveEvent, api);
      if (id.includes("miss") || event.text.includes("未命中")) {
        missed = true;
        continue;
      }
      if (id.includes("fail") || event.text.includes("失败")) {
        failed = true;
        continue;
      }
      const effect = resultEffectPhrase(event);
      if (!effect) continue;
      const current = targetEffects.get(targetName) || {target: targetName, effects: []};
      current.effects.push(effect);
      targetEffects.set(targetName, current);
    } else if (event.kind === "damage") {
      const targetName = targetNameForEvent(event, moveEvent, api);
      if (!targetEffects.has(targetName)) targetEffects.set(targetName, {target: targetName, effects: ["造成了伤害"]});
    } else if (event.kind === "heal") {
      const targetName = targetNameForEvent(event, moveEvent, api);
      if (!targetEffects.has(targetName)) targetEffects.set(targetName, {target: targetName, effects: ["恢复了体力"]});
    }
  }
  if (missed) phrases.push("但没有命中");
  if (failed) phrases.push("但招式没能成功");
  for (const entry of targetEffects.values()) {
    const unique = Array.from(new Set(entry.effects));
    if (!entry.target) {
      phrases.push(unique.join("，"));
    } else if (unique.includes("没有效果")) {
      phrases.push(`但对${entry.target}没有效果`);
    } else {
      phrases.push(`对${entry.target}${unique.join("，")}`);
    }
  }
  return phrases.slice(0, 3);
}

function resultEffectPhrase(event: SemanticEventByKind<"result">): string {
  const id = toId(event.text || event.protocolEvent.eventType);
  if (id.includes("supereffective") || event.text.includes("效果拔群")) return "非常有效";
  if (id.includes("resisted") || event.text.includes("效果不好")) return "效果不理想";
  if (id.includes("immune") || event.text.includes("没有效果")) return "没有效果";
  if (id.includes("crit") || event.text.includes("要害")) return "击中了要害";
  return "";
}

function weatherCommentary(event: SemanticEventByKind<"weather">, api: ChangeBattleV2Api): string {
  const weather = weatherLabel(event.id);
  if (!event.active) return `${weather}停止了。`;
  const from = cleanEffect(event.protocolEvent.kwArgs.from || "");
  const of = event.protocolEvent.kwArgs.of || event.protocolEvent.actorName || "";
  const ability = from && event.protocolEvent.kwArgs.from?.startsWith("ability:") ? localizeAbilityName(from, api) : "";
  const actor = localizePokemonName(of, api);
  if (actor && ability) return `${actor}的${ability}让天气变成了${weather}！`;
  return `天气变成了${weather}！`;
}

function fieldCommentary(event: SemanticEventByKind<"field">): string {
  const label = fieldLabel(event.id);
  if (event.id.includes("terrain")) return event.active ? `${label}覆盖了场地！` : `${label}消失了。`;
  return event.active ? `${label}展开了！` : `${label}结束了。`;
}

function sideConditionCommentary(event: SemanticEventByKind<"sideCondition">): string {
  const side = seatSideLabel(event.protocolEvent.seat || event.protocolEvent.targetSeat);
  const label = sideConditionLabel(event.id);
  if (event.active) {
    if (["stealthrock", "spikes", "toxicspikes", "stickyweb"].includes(toId(event.id))) return `${side}撒下了${label}！`;
    return `${side}展开了${label}！`;
  }
  return `${side}的${label}消失了。`;
}

function healCommentary(event: SemanticEventByKind<"heal">, api: ChangeBattleV2Api): string {
  const target = targetNameForEvent(event, null, api) || "场上的宝可梦";
  const from = cleanEffect(event.protocolEvent.kwArgs.from || "");
  if (event.source === "item" && from) return `${localizeItemName(from, api)}让${target}恢复了体力。`;
  if (event.source === "ability" && from) return `${target}的${localizeAbilityName(from, api)}恢复了体力。`;
  return `${target}恢复了体力。`;
}

function damageCommentary(event: SemanticEventByKind<"damage">, api: ChangeBattleV2Api): string {
  const target = targetNameForEvent(event, null, api) || "场上的宝可梦";
  const from = cleanEffect(event.protocolEvent.kwArgs.from || "");
  if (event.source === "status" && from) return `${target}受到了${statusOrEffectLabel(from)}的伤害。`;
  if (event.source === "field" && from) return `${target}受到了${sideConditionLabel(toId(from))}的伤害。`;
  return `${target}受到了伤害。`;
}

function statusCommentary(event: SemanticEventByKind<"status" | "cureStatus">, api: ChangeBattleV2Api): string {
  const target = targetNameForEvent(event, null, api) || "场上的宝可梦";
  if (event.kind === "cureStatus") return `${target}的${statusLabel(event.oldStatus)}解除了。`;
  return `${target}陷入了${statusLabel(event.newStatus)}状态。`;
}

function faintCommentary(event: SemanticEventByKind<"faint">, api: ChangeBattleV2Api): string {
  const name = event.slot ? event.slot.nameZh || event.slot.name : event.protocolEvent.actorName || event.protocolEvent.targetName;
  return `${localizePokemonName(name, api) || "宝可梦"}失去战斗能力！`;
}

function transformCommentary(event: SemanticEventByKind<"transform">, api: ChangeBattleV2Api): string {
  const actor = localizePokemonName(event.protocolEvent.actorName || event.protocolEvent.targetName, api) || "场上的宝可梦";
  const eventType = event.protocolEvent.eventType;
  if (eventType === "-mega") return `${actor}Mega进化了！`;
  if (eventType === "-primal") return `${actor}原始回归了！`;
  if (eventType === "-burst") return `${actor}究极爆发了！`;
  if (eventType === "-zpower") return `${actor}聚集了Z力量！`;
  if (eventType === "-terastallize") {
    const type = cleanEffect(event.protocolEvent.args[2] || "");
    return type ? `${actor}太晶化成${type}属性了！` : `${actor}太晶化了！`;
  }
  if (eventType === "-start" && toId(event.protocolEvent.args[2]) === "dynamax") return `${actor}极巨化了！`;
  if (eventType === "-end" && toId(event.protocolEvent.args[2]) === "dynamax") return `${actor}恢复了原本大小。`;
  if (eventType === "custom" && toId(event.protocolEvent.args[1]) === "endterastallize") return `${actor}的太晶化结束了。`;
  if (eventType === "-transform") return `${actor}变身了！`;
  if (eventType === "detailschange" || eventType === "-formechange") {
    const form = transformTargetFormLabel(event, actor, api);
    return form ? `${actor}变成了${formNamePhrase(form)}！` : `${actor}的形态改变了！`;
  }
  return `${actor}的形态改变了！`;
}

function resultCommentary(event: SemanticEventByKind<"result">, api: ChangeBattleV2Api): string {
  const target = targetNameForEvent(event, null, api);
  const effect = resultEffectPhrase(event);
  if (effect === "非常有效") return target ? `对${target}非常有效！` : "效果非常显著！";
  if (effect === "效果不理想") return target ? `对${target}效果不理想。` : "效果不太理想。";
  if (effect === "没有效果") return target ? `但对${target}没有效果。` : "但没有效果。";
  if (effect === "击中了要害") return "击中了要害！";
  if (toId(event.text).includes("miss") || event.text.includes("未命中")) return "但没有命中！";
  if (toId(event.text).includes("fail") || event.text.includes("失败")) return "但招式没能成功。";
  return event.text ? `${event.text}。` : "";
}

function baseEntry(
  step: BattlePlaybackStepV4,
  command: BattleVisualCommandV4,
  text: string,
  tone: BattleV4CommentaryTone,
  speaker: BattleV4CommentaryEntry["speaker"] = "赛事解说",
  sourceRawLines: string[] = [command.semanticEvent.rawLine].filter(Boolean),
): BattleV4CommentaryEntry | null {
  const normalized = text.trim();
  if (!normalized) return null;
  return {
    id: `${step.id}:${command.id}:commentary`,
    stepId: step.id,
    commandId: command.id,
    sequence: command.semanticEvent.sequence,
    speaker,
    text: normalized,
    tone,
    sourceRawLines,
  };
}

function moveTone(followups: BattleVisualCommandV4[]): BattleV4CommentaryTone {
  if (followups.some(command => command.semanticEvent.kind === "heal")) return "heal";
  if (followups.some(command => command.semanticEvent.kind === "faint")) return "bad";
  if (followups.some(command => command.semanticEvent.kind === "result" && command.semanticEvent.tone === "bad")) return "bad";
  if (followups.some(command => command.semanticEvent.kind === "result" && command.semanticEvent.tone === "good")) return "good";
  return "move";
}

function toneForResult(event: SemanticEventByKind<"result">): BattleV4CommentaryTone {
  if (event.tone === "bad") return "bad";
  if (event.tone === "good") return "good";
  if (event.tone === "status") return "status";
  if (event.tone === "weather") return "weather";
  return "neutral";
}

function targetNameForEvent(
  event: BattleSemanticEventV4,
  moveEvent: SemanticEventByKind<"move"> | null,
  api: ChangeBattleV2Api,
): string {
  if (event.kind === "damage" || event.kind === "heal" || event.kind === "status" || event.kind === "cureStatus" || event.kind === "faint") {
    return localizePokemonName(event.protocolEvent.actorName || event.protocolEvent.targetName, api);
  }
  if (event.kind === "result") {
    return localizePokemonName(event.protocolEvent.actorName || event.protocolEvent.targetName || moveEvent?.targetName || "", api);
  }
  return localizePokemonName(moveEvent?.targetName || event.protocolEvent.targetName || event.protocolEvent.actorName || "", api);
}

function seatSideLabel(seat: BattleProtocolSeatV4): string {
  return seat.startsWith("p2") || seat.startsWith("p4") ? "对方" : "我方";
}

function weatherLabel(id: string): string {
  const normalized = toId(id);
  if (normalized === "raindance" || normalized === "primordialsea" || normalized === "rain") return "雨天";
  if (normalized === "sunnyday" || normalized === "desolateland" || normalized === "sun") return "晴天";
  if (normalized === "sandstorm") return "沙暴";
  if (normalized === "hail" || normalized === "snow" || normalized === "snowscape") return "雪天";
  if (normalized === "deltastream") return "乱流";
  return id || "天气";
}

function fieldLabel(id: string): string {
  const normalized = toId(id);
  if (normalized === "trickroom") return "戏法空间";
  if (normalized === "magicroom") return "魔法空间";
  if (normalized === "wonderroom") return "奇妙空间";
  if (normalized === "electricterrain") return "电气场地";
  if (normalized === "grassyterrain") return "青草场地";
  if (normalized === "mistyterrain") return "薄雾场地";
  if (normalized === "psychicterrain") return "精神场地";
  if (normalized === "gravity") return "重力";
  return id || "场地";
}

function sideConditionLabel(id: string): string {
  const normalized = toId(id);
  if (normalized === "stealthrock") return "隐形岩";
  if (normalized === "spikes") return "撒菱";
  if (normalized === "toxicspikes") return "毒菱";
  if (normalized === "stickyweb") return "黏黏网";
  if (normalized === "reflect") return "反射壁";
  if (normalized === "lightscreen") return "光墙";
  if (normalized === "auroraveil") return "极光幕";
  if (normalized === "safeguard") return "神秘守护";
  if (normalized === "mist") return "白雾";
  if (normalized === "tailwind") return "顺风";
  return id || "场地状态";
}

function statusOrEffectLabel(id: string): string {
  const normalized = toId(id);
  if (normalized === "brn") return "灼伤";
  if (normalized === "psn") return "中毒";
  if (normalized === "tox") return "剧毒";
  if (normalized === "leechseed") return "寄生种子";
  if (normalized === "curse") return "诅咒";
  if (normalized === "confusion") return "混乱";
  return sideConditionLabel(normalized);
}

function statusLabel(status: string): string {
  const normalized = toId(status);
  if (normalized === "brn") return "灼伤";
  if (normalized === "psn") return "中毒";
  if (normalized === "tox") return "剧毒";
  if (normalized === "par") return "麻痹";
  if (normalized === "slp") return "睡眠";
  if (normalized === "frz") return "冰冻";
  return status || "异常";
}

function localizePokemonName(name: string, api: ChangeBattleV2Api): string {
  const normalizedName = cleanProtocolDisplayName(name);
  const id = toId(normalizedName);
  if (!id) return normalizedName || name;
  try {
    const detail = api.getPokemonDetail(id);
    return detail.nameZh || detail.name || normalizedName || name;
  } catch {
    return normalizedName || name;
  }
}

function localizeMoveName(name: string, api: ChangeBattleV2Api): string {
  const normalizedName = cleanProtocolDisplayName(name);
  const id = toId(normalizedName);
  if (!id) return normalizedName || name;
  try {
    const detail = api.getMoveDetail(id);
    return detail.nameZh || detail.name || normalizedName || name;
  } catch {
    return normalizedName || name;
  }
}

function localizeAbilityName(name: string, api: ChangeBattleV2Api): string {
  const normalizedName = cleanEffect(name);
  const id = toId(normalizedName);
  if (!id) return normalizedName || name;
  try {
    const detail = api.getAbilityDetail(id);
    return detail.nameZh || detail.name || normalizedName || name;
  } catch {
    return normalizedName || name;
  }
}

function localizeItemName(name: string, api: ChangeBattleV2Api): string {
  const normalizedName = cleanEffect(name);
  const id = toId(normalizedName);
  if (!id) return normalizedName || name;
  try {
    const detail = api.getItemDetail(id);
    return detail.nameZh || detail.name || normalizedName || name;
  } catch {
    return normalizedName || name;
  }
}

function transformTargetFormLabel(event: SemanticEventByKind<"transform">, actor: string, api: ChangeBattleV2Api): string {
  const rawSpecies = cleanSpeciesDetails(event.protocolEvent.args[2] || event.label || "");
  if (!rawSpecies || toId(rawSpecies) === "formechange") return "";
  const rawActor = cleanProtocolDisplayName(event.protocolEvent.actorName || event.protocolEvent.targetName);
  if (toId(rawSpecies) === toId(rawActor)) return "";
  const localized = localizePokemonName(rawSpecies, api);
  const fromLocalized = stripActorFromFormName(localized, actor);
  if (fromLocalized) return fromLocalized;
  const fromRaw = formSuffixFromRawSpecies(rawSpecies);
  if (fromRaw) return fromRaw;
  return localized && localized !== actor ? localized : "";
}

function stripActorFromFormName(formName: string, actor: string): string {
  const normalized = String(formName || "").trim();
  if (!normalized || normalized === actor) return "";
  if (!normalized.startsWith(actor)) return normalized;
  return normalized
    .slice(actor.length)
    .replace(/^[\s\-_:：·（(]+/g, "")
    .replace(/[）)]$/g, "")
    .trim();
}

function formSuffixFromRawSpecies(rawSpecies: string): string {
  const parts = String(rawSpecies || "").split("-").map(part => part.trim()).filter(Boolean);
  if (parts.length <= 1) return "";
  const suffix = parts.slice(1).join("-");
  const labels: Record<string, string> = {
    meteor: "流星",
    core: "核心",
    shield: "盾牌",
    blade: "刀剑",
    school: "鱼群",
    solo: "单独",
    complete: "完全体",
    origin: "起源",
    altered: "别种",
    zen: "达摩",
    galar: "伽勒尔",
    alola: "阿罗拉",
    hisui: "洗翠",
    paldea: "帕底亚",
  };
  return labels[toId(suffix)] || suffix;
}

function formNamePhrase(form: string): string {
  const normalized = String(form || "").trim();
  if (!normalized) return "";
  if (/形态|样子|模式|状态$/.test(normalized)) return normalized;
  return `${normalized}形态`;
}

function cleanProtocolDisplayName(name: string): string {
  return cleanEffect(name)
    .replace(/^p[1-4][a-z]?:\s*/i, "")
    .split(",")[0]!
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .trim();
}

function cleanSpeciesDetails(value: string): string {
  return cleanEffect(value).split(",")[0]!.trim();
}

function cleanEffect(value: string): string {
  return String(value || "").replace(/^(move|ability|item):\s*/i, "").trim();
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
