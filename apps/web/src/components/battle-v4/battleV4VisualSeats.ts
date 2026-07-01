import type {BattleProtocolSeatV4} from "./battleV4Playback";

export type BattleV4VisualAlliance = "near" | "far" | "";
export type BattleV4VisualPosition = "A" | "B" | "";

export function visualAllianceForSeat(seat: BattleProtocolSeatV4): BattleV4VisualAlliance {
  if (seat.startsWith("p1") || seat.startsWith("p3")) return "near";
  if (seat.startsWith("p2") || seat.startsWith("p4")) return "far";
  return "";
}

export function visualPositionForSeat(seat: BattleProtocolSeatV4): BattleV4VisualPosition {
  if (!seat) return "";
  return seat.endsWith("B") ? "B" : "A";
}

export function visualSeatForSeat(seat: BattleProtocolSeatV4): BattleProtocolSeatV4 {
  const alliance = visualAllianceForSeat(seat);
  const position = visualPositionForSeat(seat);
  if (!alliance || !position) return "";
  return `${alliance === "near" ? "p1" : "p2"}${position}` as BattleProtocolSeatV4;
}

export function visualSeatClassForSeat(seat: BattleProtocolSeatV4, fallback = "target-center"): string {
  const visualSeat = visualSeatForSeat(seat);
  return visualSeat ? `target-${visualSeat.toLowerCase()}` : fallback;
}
