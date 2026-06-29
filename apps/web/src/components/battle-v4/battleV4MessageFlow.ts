import type {BattleMessageEventV4} from "./battleV4Playback";
import type {BattleSemanticEventV4} from "./battleV4ProtocolExecutor";

export type BattleMessageQueueItemV4 = BattleMessageEventV4 & {
  semanticKind: BattleSemanticEventV4["kind"];
  blocksCommands: boolean;
};

export function createBattleV4MessageQueue(events: BattleSemanticEventV4[]): BattleMessageQueueItemV4[] {
  return events
    .map(messageForSemanticEvent)
    .filter((event): event is BattleMessageQueueItemV4 => Boolean(event));
}

function messageForSemanticEvent(event: BattleSemanticEventV4): BattleMessageQueueItemV4 | null {
  const message = semanticMessageText(event);
  if (!message) return null;
  return {
    sequence: event.sequence,
    rawLine: event.rawLine,
    args: [event.kind],
    kwArgs: {},
    eventType: event.kind,
    message,
    turn: event.protocolEvent.turn,
    semanticKind: event.kind,
    blocksCommands: false,
  };
}

function semanticMessageText(event: BattleSemanticEventV4): string {
  switch (event.kind) {
  case "switchIn":
    return `${event.slot.nameZh || event.slot.name || event.protocolEvent.actorName} 登场！`;
  case "dragIn":
    return `${event.slot.nameZh || event.slot.name || event.protocolEvent.actorName} 被拖入战斗！`;
  case "move":
    return `${event.actorName || event.protocolEvent.actorName} 使用了${event.moveName || event.moveId}！`;
  case "result":
    return event.text;
  case "status":
    return `${event.protocolEvent.actorName} 陷入${event.label}。`;
  case "cureStatus":
    return `${event.protocolEvent.actorName} 的${event.label}解除了。`;
  case "weather":
    return event.active ? `${event.label}开始了。` : "天气停止了。";
  case "field":
    return event.active ? `${event.label}展开了。` : `${event.label}结束了。`;
  case "sideCondition":
    return event.active ? `${event.label}生效了。` : `${event.label}消失了。`;
  case "turn":
    return `Turn ${event.turn}`;
  case "win":
    return `${event.winner} 获胜！`;
  case "message":
    return event.text;
  default:
    return "";
  }
}
