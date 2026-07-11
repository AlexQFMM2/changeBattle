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

const MOVE_FOLLOWUP_KINDS = new Set<BattleSemanticEventV4["kind"]>(["result", "damage", "heal", "status", "cureStatus", "statChange", "faint"]);

export function buildBattleV4StepCommentaryIndex(step: BattlePlaybackStepV4, api: ChangeBattleV2Api): BattleV4StepCommentaryIndex {
  const entries = step.commands
    .map(command => commentaryForBattleV4Command(step, command, api))
    .filter((entry): entry is BattleV4CommentaryEntry => Boolean(entry));
  const coveredCommands = new Set<string>();
  for (const command of step.commands) {
    if (command.semanticEvent.kind !== "move") continue;
    for (const followup of moveFollowupCommands(step, command)) {
      if (followup.semanticEvent.kind === "result" || followup.semanticEvent.kind === "damage" || followup.semanticEvent.kind === "heal" || followup.semanticEvent.kind === "statChange") {
        coveredCommands.add(followup.id);
      }
    }
  }
  for (const command of step.commands) {
    if (command.semanticEvent.kind !== "message") continue;
    const entry = trainerItemCommentary(step, command, api);
    if (!entry) continue;
    entries.push(entry);
    for (const followup of trainerItemFollowupCommands(step, command)) {
      coveredCommands.add(followup.id);
    }
  }
  const byCommandId = new Map<string, BattleV4CommentaryEntry>();
  const immediate: BattleV4CommentaryEntry[] = [];
  for (const entry of entries) {
    if (coveredCommands.has(entry.commandId)) continue;
    byCommandId.set(entry.commandId, entry);
    const command = step.commands.find(item => item.id === entry.commandId);
    if (command && !command.animationEvent) {
      immediate.push(entry);
      byCommandId.delete(entry.commandId);
    }
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
  if (event.kind === "field") return baseEntry(step, command, fieldCommentary(event, api), "weather");
  if (event.kind === "sideCondition") return baseEntry(step, command, sideConditionCommentary(event, api), "status");
  if (event.kind === "heal") return baseEntry(step, command, healCommentary(event, api), "heal");
  if (event.kind === "damage") return baseEntry(step, command, damageCommentary(event, api), "bad");
  if (event.kind === "status" || event.kind === "cureStatus") return baseEntry(step, command, statusCommentary(event, api), "status");
  if (event.kind === "statChange") return baseEntry(step, command, statChangeCommentary(event, api), statChangeTone(event));
  if (event.kind === "faint") return baseEntry(step, command, faintCommentary(event, api), "bad", "裁判");
  if (event.kind === "transform") return baseEntry(step, command, transformCommentary(step, event, api), "good");
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
  const bondPrelude = soulmateHighHpMovePrelude(event, actor);
  const text = bondPrelude
    ? `${bondPrelude}随后，${actor}使用了${move}${resultPhrases.length ? `，${resultPhrases.join("，")}` : ""}！`
    : resultPhrases.length
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

function trainerItemFollowupCommands(step: BattlePlaybackStepV4, messageCommand: BattleVisualCommandV4): BattleVisualCommandV4[] {
  const startIndex = step.commands.findIndex(command => command.id === messageCommand.id);
  if (startIndex < 0) return [];
  const result: BattleVisualCommandV4[] = [];
  for (let index = startIndex + 1; index < step.commands.length; index += 1) {
    const command = step.commands[index];
    if (!command) continue;
    if (command.semanticEvent.kind === "turn" || command.semanticEvent.kind === "move" || command.semanticEvent.kind === "switchIn" || command.semanticEvent.kind === "switchOut") break;
    if (command.semanticEvent.kind === "message" || command.semanticEvent.kind === "heal" || command.semanticEvent.kind === "cureStatus" || command.semanticEvent.kind === "faint") {
      result.push(command);
    }
    if (command.semanticEvent.kind === "message" && messageMeansTrainerItemNoEffect(command.semanticEvent.text)) break;
  }
  return result;
}

function trainerItemCommentary(step: BattlePlaybackStepV4, command: BattleVisualCommandV4, api: ChangeBattleV2Api): BattleV4CommentaryEntry | null {
  const event = command.semanticEvent;
  if (event.kind !== "message") return null;
  const used = parseTrainerItemUseMessage(event.text);
  if (!used) return null;
  const followups = trainerItemFollowupCommands(step, command);
  const noEffect = followups.some(item => item.semanticEvent.kind === "message" && messageMeansTrainerItemNoEffect(item.semanticEvent.text));
  const revive = followups.find(item => item.semanticEvent.kind === "heal" && item.semanticEvent.oldHp <= 0 && item.semanticEvent.newHp > 0)?.semanticEvent;
  const heal = followups.find(item => item.semanticEvent.kind === "heal" && item.semanticEvent.delta > 0)?.semanticEvent;
  const cure = followups.find(item => item.semanticEvent.kind === "cureStatus")?.semanticEvent;
  const ppMessage = followups.find(item => item.semanticEvent.kind === "message" && /恢复了\s*\d+\s*点\s*PP/i.test(item.semanticEvent.text))?.semanticEvent;
  const actor = localizePokemonName(used.actor, api) || used.actor || "宝可梦";
  const item = localizeItemName(used.item, api) || used.item || "道具";
  let text = `${actor}使用了${item}`;
  if (noEffect) {
    text += "，可惜没有效果。";
  } else if (revive && revive.kind === "heal") {
    const target = targetNameForEvent(revive, null, api) || actor;
    text += `，复活了${target}。`;
  } else if (heal && heal.kind === "heal") {
    const target = targetNameForEvent(heal, null, api) || actor;
    const amount = Math.max(0, heal.delta);
    text += target === actor ? `，恢复了${amount}点体力。` : `，让${target}恢复了${amount}点体力。`;
  } else if (cure && cure.kind === "cureStatus") {
    const target = targetNameForEvent(cure, null, api) || actor;
    text += target === actor ? "，解除了异常状态。" : `，解除了${target}的异常状态。`;
  } else if (ppMessage && ppMessage.kind === "message") {
    const amount = ppMessage.text.match(/恢复了\s*(\d+)\s*点\s*PP/i)?.[1] || "";
    text += amount ? `，恢复了${amount}点PP。` : "，恢复了PP。";
  } else {
    text += "。";
  }
  return baseEntry(
    step,
    command,
    text,
    noEffect ? "neutral" : "heal",
    "赛事解说",
    [event.rawLine, ...followups.map(item => item.semanticEvent.rawLine)].filter(Boolean),
  );
}

function parseTrainerItemUseMessage(text: string): {actor: string; item: string} | null {
  const normalized = text.trim().replace(/[。.!！]+$/g, "");
  const match = /^(.+?)\s*使用了\s*(.+)$/.exec(normalized);
  if (!match) return null;
  return {actor: match[1]!.trim(), item: match[2]!.trim()};
}

function messageMeansTrainerItemNoEffect(text: string): boolean {
  return /没有效果/.test(text);
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
    } else if (event.kind === "statChange") {
      const phrase = statChangeMovePhrase(event, moveEvent, api);
      if (phrase) phrases.push(phrase);
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
  const weather = weatherLabel(event.id, api);
  if (!event.active || event.phase === "end") return `${weather}停止了。`;
  if (event.phase === "upkeep") return `${weather}还在继续。`;
  const from = cleanEffect(event.protocolEvent.kwArgs.from || "");
  const of = event.protocolEvent.kwArgs.of || event.protocolEvent.actorName || "";
  const ability = from && event.protocolEvent.kwArgs.from?.startsWith("ability:") ? localizeAbilityName(from, api) : "";
  const actor = localizePokemonName(of, api);
  if (actor && ability) return `${actor}的${ability}让天气变成了${weather}！`;
  return `天气变成了${weather}！`;
}

function fieldCommentary(event: SemanticEventByKind<"field">, api: ChangeBattleV2Api): string {
  const label = fieldLabel(event.id, api);
  if (event.id.includes("terrain")) return event.active ? `${label}覆盖了场地！` : `${label}消失了。`;
  return event.active ? `${label}展开了！` : `${label}结束了。`;
}

function sideConditionCommentary(event: SemanticEventByKind<"sideCondition">, api: ChangeBattleV2Api): string {
  const side = seatSideLabel(event.protocolEvent.seat || event.protocolEvent.targetSeat);
  const label = sideConditionLabel(event.id, api);
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
  const soulmateText = soulmateBondDamageCommentary(event, target);
  if (soulmateText) return soulmateText;
  const from = cleanEffect(event.protocolEvent.kwArgs.from || "");
  if (event.source === "status" && from) return `${target}受到了${statusOrEffectLabel(from, api)}的伤害。`;
  if (event.source === "field" && from) return `${target}受到了${sideConditionLabel(toId(from), api)}的伤害。`;
  return `${target}受到了伤害。`;
}

function statusCommentary(event: SemanticEventByKind<"status" | "cureStatus">, api: ChangeBattleV2Api): string {
  const target = targetNameForEvent(event, null, api) || "场上的宝可梦";
  if (event.kind === "cureStatus") return `${target}的${statusLabel(event.oldStatus, api)}解除了。`;
  return `${target}陷入了${statusLabel(event.newStatus, api)}状态。`;
}

function statChangeCommentary(event: SemanticEventByKind<"statChange">, api: ChangeBattleV2Api): string {
  const target = targetNameForEvent(event, null, api) || "场上的宝可梦";
  if (event.direction === "neutral") return `${target}的${event.label}。`;
  const ability = event.sourceKind === "ability" && event.sourceName ? localizeAbilityName(event.sourceName, api) : "";
  const sourceActor = event.sourcePokemonName ? localizePokemonName(event.sourcePokemonName, api) : "";
  const verb = statChangeVerb(event.amount);
  if (ability && sourceActor && !sameBattleName(event.sourcePokemonName, event.protocolEvent.actorName || event.protocolEvent.targetName || target)) {
    if (event.direction === "down") return `${sourceActor}的${ability}降低了${target}的${event.statLabel}！`;
    return `${sourceActor}的${ability}提升了${target}的${event.statLabel}！`;
  }
  if (ability) return `${target}的${ability}被触发，${event.statLabel}${verb}！`;
  return `${target}的${event.statLabel}${verb}${event.direction === "up" ? "！" : "。"}`;
}

function statChangeMovePhrase(
  event: SemanticEventByKind<"statChange">,
  moveEvent: SemanticEventByKind<"move">,
  api: ChangeBattleV2Api,
): string {
  if (event.direction === "neutral") return "";
  const target = targetNameForEvent(event, moveEvent, api);
  const actor = localizePokemonName(moveEvent.actorName, api);
  const rawTarget = event.protocolEvent.actorName || event.protocolEvent.targetName || moveEvent.targetName;
  const ability = event.sourceKind === "ability" && event.sourceName ? localizeAbilityName(event.sourceName, api) : "";
  const abilityId = toId(event.sourceName);
  const verb = statChangeVerb(event.amount);
  if (abilityId === "contrary" && event.direction === "up") {
    return `本应下降的${event.statLabel}因为${ability || "唱反调"}而${verb}`;
  }
  if (ability) {
    if (!target || sameBattleName(rawTarget, moveEvent.actorName || actor)) return `${ability}被触发，${event.statLabel}${verb}`;
    if (event.direction === "down") return `${ability}降低了${target}的${event.statLabel}`;
    return `${ability}提升了${target}的${event.statLabel}`;
  }
  if (!target || sameBattleName(rawTarget, moveEvent.actorName || actor)) return `${event.statLabel}${verb}`;
  return `${target}的${event.statLabel}${verb}`;
}

function faintCommentary(event: SemanticEventByKind<"faint">, api: ChangeBattleV2Api): string {
  const name = event.slot ? event.slot.nameZh || event.slot.name : event.protocolEvent.actorName || event.protocolEvent.targetName;
  return `${localizePokemonName(name, api) || "宝可梦"}失去战斗能力！`;
}

function transformCommentary(step: BattlePlaybackStepV4, event: SemanticEventByKind<"transform">, api: ChangeBattleV2Api): string {
  const actor = localizePokemonName(event.protocolEvent.actorName || event.protocolEvent.targetName, api) || "场上的宝可梦";
  const eventType = event.protocolEvent.eventType;
  if (isEvolutionDetailsChangeEvent(step, event)) {
    return soulmateEvolutionBondLine(event, actor) || `${actor}回应了你的心意，进化了！`;
  }
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

function soulmateBondDamageCommentary(event: SemanticEventByKind<"damage">, name: string): string {
  if (!isPlayerSoulmateSlot(event.slot)) return "";
  if (event.fainted || event.newHp <= 0 || event.maxHp <= 0) return "";
  const ratio = event.newHp / event.maxHp;
  if (ratio > 0.35) return "";
  const lines = [
    `为了不让你伤心，${name}咬牙撑住了！`,
    `${name}看了你一眼，硬是没有倒下！`,
    `${name}听见你的声音后，重新打起精神。`,
  ];
  return deterministicPick(lines, `${event.sequence}:${event.seat}:low-hp`);
}

function soulmateEvolutionBondLine(event: SemanticEventByKind<"transform">, name: string): string {
  if (!isPlayerSoulmateSlot(event.slot)) return "";
  const lines = [
    `${name}回应了你的心意，沐浴在耀眼的光芒中！`,
    `你们一路积累的羁绊，让${name}进化了！`,
    `${name}像是听见了你的呼唤，跨过了新的界限！`,
  ];
  return deterministicPick(lines, `${event.sequence}:${event.seat}:evolution`);
}

function soulmateHighHpMovePrelude(event: SemanticEventByKind<"move">, name: string): string {
  if (!isPlayerSoulmateSlot(event.slot)) return "";
  if (!event.slot?.maxHp || event.slot.hp / event.slot.maxHp < 0.85) return "";
  const seed = `${event.sequence}:${event.actorSeat}:high-hp`;
  if (deterministicPercent(seed) >= 22) return "";
  return deterministicPick(soulmateHighHpLinesForNature(event.slot.nature, name), seed);
}

function soulmateHighHpLinesForNature(nature: string | undefined, name: string): string[] {
  const id = toId(nature);
  if (id === "brave" || id === "adamant") return [
    `${name}挺起胸膛，像是在说“交给我吧！”`,
    `${name}斗志很足，毫不犹豫地站到了前面。`,
  ];
  if (id === "careful" || id === "gentle" || id === "calm") return [
    `${name}小心地调整呼吸，努力保持冷静。`,
    `${name}确认了你的指示，沉稳地点了点头。`,
  ];
  if (id === "naughty" || id === "jolly") return [
    `${name}明明很兴奋，却还装作一副没事的样子。`,
    `${name}眨了眨眼，像是已经等不及要行动了。`,
  ];
  return [
    `${name}状态绝佳，向你投来期待的目光。`,
    `${name}精神很好，正等待着你的指示。`,
  ];
}

function isEvolutionDetailsChangeEvent(step: BattlePlaybackStepV4, event: SemanticEventByKind<"transform">): boolean {
  if (event.protocolEvent.eventType !== "detailschange") return false;
  return step.messages.some(message => /进化了/.test(message.message))
    || step.commands.some(command => command.semanticEvent.kind === "message" && /进化了/.test(command.semanticEvent.text));
}

function isPlayerSoulmateSlot(slot: {playerId?: string; formalSourceKind?: string} | null | undefined): boolean {
  return slot?.playerId === "p1" && slot.formalSourceKind === "soulmate-vault";
}

function deterministicPick(lines: string[], seed: string): string {
  if (!lines.length) return "";
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return lines[hash % lines.length] || lines[0] || "";
}

function deterministicPercent(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 33 + seed.charCodeAt(index)) >>> 0;
  }
  return hash % 100;
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
  if (followups.some(command => command.semanticEvent.kind === "statChange" && command.semanticEvent.direction === "down")) return "bad";
  if (followups.some(command => command.semanticEvent.kind === "statChange" && command.semanticEvent.direction === "up")) return "good";
  if (followups.some(command => command.semanticEvent.kind === "result" && command.semanticEvent.tone === "bad")) return "bad";
  if (followups.some(command => command.semanticEvent.kind === "result" && command.semanticEvent.tone === "good")) return "good";
  return "move";
}

function statChangeTone(event: SemanticEventByKind<"statChange">): BattleV4CommentaryTone {
  if (event.direction === "up") return "good";
  if (event.direction === "down") return "bad";
  return "status";
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
  if (event.kind === "result" || event.kind === "statChange") {
    return localizePokemonName(event.protocolEvent.actorName || event.protocolEvent.targetName || moveEvent?.targetName || "", api);
  }
  return localizePokemonName(moveEvent?.targetName || event.protocolEvent.targetName || event.protocolEvent.actorName || "", api);
}

function seatSideLabel(seat: BattleProtocolSeatV4): string {
  return seat.startsWith("p2") || seat.startsWith("p4") ? "对方" : "我方";
}

function weatherLabel(id: string, api: ChangeBattleV2Api): string {
  const normalized = toId(id);
  if (normalized) return api.translateDexLabel("weather", normalized);
  return id || "天气";
}

function fieldLabel(id: string, api: ChangeBattleV2Api): string {
  const normalized = toId(id);
  if (normalized) return api.translateDexLabel("field", normalized);
  return id || "场地";
}

function sideConditionLabel(id: string, api: ChangeBattleV2Api): string {
  const normalized = toId(id);
  if (normalized) return api.translateDexLabel("sideConditions", normalized);
  return id || "场地状态";
}

function statusOrEffectLabel(id: string, api: ChangeBattleV2Api): string {
  const normalized = toId(id);
  const status = api.translateDexLabel("status", normalized);
  if (status !== normalized) return status;
  if (normalized === "leechseed") return "寄生种子";
  if (normalized === "curse") return "诅咒";
  if (normalized === "confusion") return "混乱";
  return sideConditionLabel(normalized, api);
}

function statusLabel(status: string, api: ChangeBattleV2Api): string {
  const normalized = toId(status);
  if (normalized) return api.translateDexLabel("status", normalized);
  return status || "异常";
}

function statChangeVerb(amount: number): string {
  const abs = Math.abs(amount);
  const direction = amount > 0 ? "提升" : "下降";
  if (abs >= 3) return `巨幅${direction}了`;
  if (abs >= 2) return `大幅${direction}了`;
  return `${direction}了`;
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
  if (/[\u4e00-\u9fff]/.test(normalizedName)) return normalizedName;
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

function sameBattleName(left: string, right: string): boolean {
  const leftName = cleanProtocolDisplayName(left);
  const rightName = cleanProtocolDisplayName(right);
  if (!leftName || !rightName) return false;
  const leftId = toId(leftName);
  const rightId = toId(rightName);
  if (leftId || rightId) return leftId === rightId;
  return leftName === rightName;
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
