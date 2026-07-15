import type {
  BattleAiOutcomeBucketV4,
  BattleServiceRequestV4,
  BattleServiceSidePokemonV4,
  BattleServiceSnapshotV4,
  ShowdownPlayerIdV4,
} from "./types.js";
import type {BattleAiPokemonRoleSummaryV4, BattleAiTeamRoleAnalysisV4} from "./aiTeamRoleAnalyzerV4.js";

export type BattleAiReasonTagV4 =
  | "ko-current-threat"
  | "pressure-current-threat"
  | "preserve-wincon"
  | "avoid-wincon-sacrifice"
  | "safe-switch"
  | "unsafe-switch"
  | "commit-dynamax"
  | "hold-dynamax"
  | "commit-tera"
  | "hold-tera"
  | "avoid-immune-move"
  | "avoid-low-value-setup"
  | "revenge-kill"
  | "speed-control-value";

export type BattleAiThreatEntryV4 = {
  playerId: ShowdownPlayerIdV4;
  ident: string;
  rowIndex: number;
  active: boolean;
  fainted: boolean;
  hpRatio: number;
  score: number;
  tags: string[];
  reasons: string[];
};

export type BattleAiResourceAdviceV4 = {
  holdDynamax: boolean;
  holdTera: boolean;
  preferredResourceHolder?: string;
  reasons: string[];
};

export type BattleAiStrategicContextV4 = {
  selfWinConditions: BattleAiThreatEntryV4[];
  foeThreats: BattleAiThreatEntryV4[];
  currentFoeThreat?: BattleAiThreatEntryV4;
  resourceAdvice: BattleAiResourceAdviceV4;
};

export type BattleAiStrategicContextInputV4 = {
  request?: BattleServiceRequestV4;
  snapshot: BattleServiceSnapshotV4;
  playerId: ShowdownPlayerIdV4;
  roleAnalysis?: BattleAiTeamRoleAnalysisV4;
  foeRoleAnalysis?: BattleAiTeamRoleAnalysisV4;
};

export type BattleAiReasonTagCandidateV4 = {
  choice: string;
  score: number;
  kind: string;
  diagnostics?: Record<string, unknown>;
};

export type BattleAiReasonTagsInputV4 = {
  candidate: BattleAiReasonTagCandidateV4;
  reply?: BattleAiReasonTagCandidateV4 | null;
  buckets?: BattleAiOutcomeBucketV4[];
  strategicContext?: BattleAiStrategicContextV4;
  activeIsWinCondition?: boolean;
};

const SETUP_MOVES = new Set(["swordsdance", "nastyplot", "dragondance", "calmmind", "bulkup", "quiverdance", "shellsmash", "growth", "coil"]);
const SPEED_CONTROL_MOVES = new Set(["tailwind", "trickroom", "icywind", "electroweb", "stringshot", "bulldoze"]);
const PRIORITY_MOVES = new Set(["quickattack", "aquajet", "machpunch", "bulletpunch", "iceshard", "shadowsneak", "vacuumwave", "suckerpunch", "extremespeed"]);

export function buildBattleAiStrategicContextV4(input: BattleAiStrategicContextInputV4): BattleAiStrategicContextV4 {
  const selfEntries = threatEntriesForSide(input.playerId, input.snapshot, input.request, input.roleAnalysis);
  const foePlayerId = opponentPlayerId(input.snapshot, input.playerId);
  const foeRequest = foePlayerId ? input.snapshot.requests[foePlayerId] : undefined;
  const foeEntries = foePlayerId ? threatEntriesForSide(foePlayerId, input.snapshot, foeRequest, input.foeRoleAnalysis) : [];
  const selfWinConditions = selfEntries
    .filter(entry => !entry.fainted && isWinConditionTagList(entry.tags))
    .sort((a, b) => b.score - a.score);
  const foeThreats = foeEntries
    .filter(entry => !entry.fainted)
    .sort((a, b) => b.score - a.score);
  const activeFoe = foeThreats.find(entry => entry.active);
  return {
    selfWinConditions,
    foeThreats,
    currentFoeThreat: activeFoe || foeThreats[0],
    resourceAdvice: resourceAdviceForSelf(selfEntries, selfWinConditions),
  };
}

export function battleAiReasonTagsForCandidateV4(input: BattleAiReasonTagsInputV4): {tags: BattleAiReasonTagV4[]; score: number} {
  const tags = new Set<BattleAiReasonTagV4>();
  const candidate = input.candidate;
  const buckets = input.buckets || [];
  const moveId = candidateMoveId(candidate);
  const damageRatio = expectedDamageRatio(candidate);
  const koChance = candidateKoChance(candidate);
  const specialTags = candidateSpecialSystemTags(candidate);
  const typeMultiplier = candidateTypeMultiplier(candidate);
  const currentThreat = input.strategicContext?.currentFoeThreat;
  const resourceAdvice = input.strategicContext?.resourceAdvice;

  if (candidate.kind === "move" && typeMultiplier <= 0 && damageRatio <= 0 && !isSupportLikeMove(moveId)) {
    tags.add("avoid-immune-move");
  }
  if (currentThreat?.active && (koChance >= 1 || buckets.includes("ko"))) {
    tags.add("ko-current-threat");
  } else if (currentThreat?.active && (damageRatio >= 0.45 || buckets.includes("threaten-ko"))) {
    tags.add("pressure-current-threat");
  }
  if (candidate.kind === "switch" && buckets.includes("safe-switch")) tags.add("safe-switch");
  if (candidate.kind === "switch" && buckets.includes("unsafe-switch")) tags.add("unsafe-switch");
  if (buckets.includes("preserve-wincon")) tags.add("preserve-wincon");
  if (input.activeIsWinCondition && (buckets.includes("self-ko-risk") || buckets.includes("unsafe-switch"))) {
    tags.add("avoid-wincon-sacrifice");
  }
  if ((koChance >= 1 || buckets.includes("ko")) && (movePriority(moveId) > 0 || specialTags.includes("max-speed"))) {
    tags.add("revenge-kill");
  }
  if (SPEED_CONTROL_MOVES.has(moveId) || specialTags.includes("max-speed") || specialTags.includes("max-speed-drop")) {
    tags.add("speed-control-value");
  }
  if (SETUP_MOVES.has(moveId) && (buckets.includes("self-ko-risk") || expectedDamageRatio(input.reply) >= 0.45)) {
    tags.add("avoid-low-value-setup");
  }

  const dynamaxCommit = specialTags.includes("dynamax") && (
    koChance >= 1 ||
    specialTags.some(tag => ["dynamax-survival", "max-speed", "max-weather", "max-defense-boost", "max-special-defense-boost", "gmax-aurora-veil", "gmax-residual", "gmax-hazard", "gmax-ignore-protect"].includes(tag))
  );
  if (specialTags.includes("dynamax")) {
    if (dynamaxCommit && !lowValueSpecial(candidate)) tags.add("commit-dynamax");
    else if (resourceAdvice?.holdDynamax) tags.add("hold-dynamax");
  }

  const teraCommit = specialTags.includes("terastallize") && (
    koChance >= 1 ||
    specialTags.includes("tera-defensive") ||
    specialTags.includes("tera-wincon") && damageRatio >= 0.45 ||
    specialTags.includes("tera-offense") && damageRatio >= 0.65
  );
  if (specialTags.includes("terastallize")) {
    if (teraCommit && !lowValueSpecial(candidate)) tags.add("commit-tera");
    else if (resourceAdvice?.holdTera) tags.add("hold-tera");
  }

  return {tags: [...tags], score: reasonTagScore([...tags])};
}

function threatEntriesForSide(
  playerId: ShowdownPlayerIdV4,
  snapshot: BattleServiceSnapshotV4,
  request: BattleServiceRequestV4 | undefined,
  roleAnalysis: BattleAiTeamRoleAnalysisV4 | undefined,
): BattleAiThreatEntryV4[] {
  const rows = request?.side?.pokemon?.length ? request.side.pokemon : snapshot.debug.latestSidePokemon?.[playerId] || [];
  return rows.map((row, rowIndex) => {
    const roleEntry = roleAnalysis ? Object.values(roleAnalysis.pokemon).find(entry => entry.rowIndex === rowIndex || normalizeId(entry.ident) === normalizeId(row.ident)) : undefined;
    return threatEntryForRow(playerId, row, rowIndex, roleEntry);
  });
}

function threatEntryForRow(
  playerId: ShowdownPlayerIdV4,
  row: BattleServiceSidePokemonV4,
  rowIndex: number,
  roleEntry: BattleAiPokemonRoleSummaryV4 | undefined,
): BattleAiThreatEntryV4 {
  const fainted = Boolean(row.fainted || row.condition.includes("fnt"));
  const hpRatio = fainted ? 0 : hpRatioFromCondition(row.condition);
  const tags = (roleEntry?.tags || []).map(tag => tag.subtype ? `${tag.kind}:${tag.subtype}` : tag.kind);
  const reasons: string[] = [];
  let score = 0;
  for (const tag of roleEntry?.tags || []) {
    const value = roleThreatValue(tag.kind) * Math.max(0.4, tag.confidence);
    if (value > 0) {
      score += value;
      reasons.push(`role:${tag.subtype ? `${tag.kind}:${tag.subtype}` : tag.kind}`);
    }
  }
  const stats = row.stats || {};
  const atk = Number(stats.atk || 0);
  const spa = Number(stats.spa || 0);
  const spe = Number(stats.spe || 0);
  if (atk >= 120 || spa >= 120) {
    score += 10;
    reasons.push("stats:offense");
  }
  if (spe >= 120) {
    score += 8;
    reasons.push("stats:speed");
  }
  if (row.active) {
    score += 12;
    reasons.push("active");
  }
  score += hpRatio * 22;
  if (hpRatio <= 0.25) score -= 10;
  if (fainted) score = 0;
  return {
    playerId,
    ident: row.ident || `${playerId}:slot-${rowIndex + 1}`,
    rowIndex,
    active: Boolean(row.active),
    fainted,
    hpRatio,
    score: Math.round(score * 100) / 100,
    tags,
    reasons,
  };
}

function resourceAdviceForSelf(entries: BattleAiThreatEntryV4[], winConditions: BattleAiThreatEntryV4[]): BattleAiResourceAdviceV4 {
  const active = entries.find(entry => entry.active && !entry.fainted);
  const preferred = winConditions.find(entry => entry.hpRatio >= 0.45);
  const activeIsPreferred = Boolean(active && preferred && normalizeId(active.ident) === normalizeId(preferred.ident));
  const reasons: string[] = [];
  if (preferred) reasons.push(`healthy-wincon:${preferred.ident}`);
  if (preferred && !activeIsPreferred) reasons.push("resource-holder-on-bench");
  const hold = Boolean(preferred && !activeIsPreferred);
  return {
    holdDynamax: hold,
    holdTera: hold,
    preferredResourceHolder: preferred?.ident,
    reasons,
  };
}

function roleThreatValue(kind: string): number {
  if (kind === "setup-sweeper") return 32;
  if (kind === "weather-abuser") return 28;
  if (kind === "revenge-killer") return 24;
  if (kind === "priority-user") return 18;
  if (kind === "mixed-attacker") return 16;
  if (kind === "physical-attacker" || kind === "special-attacker") return 14;
  if (kind === "speed-control" || kind === "trick-room-setter") return 12;
  if (kind === "wall" || kind === "pivot") return 6;
  return 0;
}

function reasonTagScore(tags: BattleAiReasonTagV4[]): number {
  return tags.reduce((sum, tag) => sum + ({
    "ko-current-threat": 28,
    "pressure-current-threat": 14,
    "preserve-wincon": 12,
    "avoid-wincon-sacrifice": -28,
    "safe-switch": 12,
    "unsafe-switch": -18,
    "commit-dynamax": 18,
    "hold-dynamax": -14,
    "commit-tera": 16,
    "hold-tera": -12,
    "avoid-immune-move": -34,
    "avoid-low-value-setup": -16,
    "revenge-kill": 18,
    "speed-control-value": 12,
  } satisfies Record<BattleAiReasonTagV4, number>)[tag], 0);
}

function isWinConditionTagList(tags: string[]): boolean {
  return tags.some(tag =>
    tag.startsWith("weather-abuser") ||
    tag === "setup-sweeper" ||
    tag === "revenge-killer" ||
    tag === "priority-user" ||
    tag === "mixed-attacker",
  );
}

function candidateMoveId(candidate: BattleAiReasonTagCandidateV4 | undefined | null): string {
  return String(flattenedDiagnostics(candidate?.diagnostics)[0]?.moveId || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function candidateKoChance(candidate: BattleAiReasonTagCandidateV4 | undefined | null): number {
  return firstFiniteNumber(flattenedDiagnostics(candidate?.diagnostics).map(entry => Number(entry.koChance))) ?? 0;
}

function expectedDamageRatio(candidate: BattleAiReasonTagCandidateV4 | undefined | null): number {
  return firstFiniteNumber(flattenedDiagnostics(candidate?.diagnostics).map(entry => Number(entry.expectedDamageRatio))) ?? 0;
}

function candidateTypeMultiplier(candidate: BattleAiReasonTagCandidateV4 | undefined | null): number {
  return firstFiniteNumber(flattenedDiagnostics(candidate?.diagnostics).map(entry => Number(entry.typeMultiplier))) ?? 1;
}

function candidateSpecialSystemTags(candidate: BattleAiReasonTagCandidateV4): string[] {
  return flattenedDiagnostics(candidate.diagnostics).flatMap(entry => Array.isArray(entry.specialSystemTags) ? entry.specialSystemTags.map(String) : []);
}

function lowValueSpecial(candidate: BattleAiReasonTagCandidateV4): boolean {
  const diagnostics = flattenedDiagnostics(candidate.diagnostics);
  const breakdowns = diagnostics.flatMap(entry => isRecord(entry.specialSystemBreakdown) ? [entry.specialSystemBreakdown] : []);
  return breakdowns.some(breakdown => Number(breakdown.teraLowValuePenalty || 0) < 0);
}

function movePriority(moveId: string): number {
  if (moveId === "extremespeed") return 2;
  if (PRIORITY_MOVES.has(moveId)) return 1;
  return 0;
}

function isSupportLikeMove(moveId: string): boolean {
  return SETUP_MOVES.has(moveId) || SPEED_CONTROL_MOVES.has(moveId) || ["protect", "detect", "recover", "roost", "raindance", "sunnyday", "sandstorm", "snowscape", "stealthrock", "spikes", "toxicspikes", "stickyweb"].includes(moveId);
}

function flattenedDiagnostics(diagnostics: Record<string, unknown> | undefined): Array<Record<string, unknown>> {
  if (!diagnostics) return [];
  if (Array.isArray(diagnostics.parts)) {
    return diagnostics.parts.flatMap(part => flattenedDiagnostics(isRecord(part) ? part : undefined));
  }
  return [diagnostics];
}

function firstFiniteNumber(values: number[]): number | null {
  for (const value of values) {
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function hpRatioFromCondition(condition: string): number {
  const match = /^(\d+)\/(\d+)/.exec(condition.trim());
  const hp = match ? Number(match[1]) : Number.NaN;
  const maxHp = match ? Number(match[2]) : Number.NaN;
  if (!Number.isFinite(hp) || !Number.isFinite(maxHp) || maxHp <= 0) return condition.includes("fnt") ? 0 : 1;
  return Math.max(0, Math.min(1, hp / maxHp));
}

function opponentPlayerId(snapshot: BattleServiceSnapshotV4, playerId: ShowdownPlayerIdV4): ShowdownPlayerIdV4 | undefined {
  const player = snapshot.players.find(entry => entry.playerId === playerId);
  return snapshot.players.find(entry => entry.playerId !== playerId && entry.alliance !== player?.alliance)?.playerId;
}

function normalizeId(value: string): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
