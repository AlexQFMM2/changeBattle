import type {
  BattleAiDecisionDebugV4,
  BattleAiFeatureVectorV4,
  BattleAiLevelV4,
  BattleAiPreferenceV4,
  BattleAiProfileV4,
  BattleServiceMoveRequestV4,
  BattleServiceRequestV4,
  BattleServiceSnapshotV4,
  ShowdownPlayerIdV4,
  BattleSpecialSystemV4,
} from "./types.js";
import {
  filterShowdownChoiceForRuleSetV4,
  parseShowdownChoiceCommandV4,
  showdownSpecialSystemForChoiceV4,
  showdownSpecialChoiceAllowedForRuleSetV4,
  stringifyShowdownChoiceCommandV4,
  type ShowdownParsedChoiceV4,
  type ShowdownSpecialChoiceV4,
} from "./showdownCommand.js";

export type BattleAiChoiceContextV4 = {
  request?: BattleServiceRequestV4 | null;
  snapshot: BattleServiceSnapshotV4;
  playerId: ShowdownPlayerIdV4;
  aiProfile?: BattleAiProfileV4 | null;
  rngSeed?: string;
  timeBudgetMs?: number;
};

export type BattleAiChoiceResultV4 = {
  choice: string;
  elapsedMs: number;
  timedOut: boolean;
  debug: BattleAiDecisionDebugV4;
};

type AiLevelConfig = {
  searchDepth: number;
  perSlotTopN: number;
  turnTopK: number;
  randomNoise: number;
  mistakeRate: number;
};

type AiCandidate = {
  choice: string;
  score: number;
  features: BattleAiFeatureVectorV4;
  kind: "team" | "switch" | "move" | "pass";
  activeIndex?: number;
};

const DEFAULT_AI_PROFILE: Required<BattleAiProfileV4> = {
  level: "normal",
  preference: "balanced",
};

const AI_LEVEL_CONFIG: Record<BattleAiLevelV4, AiLevelConfig> = {
  rookie: {searchDepth: 0, perSlotTopN: 0, turnTopK: 0, randomNoise: 80, mistakeRate: 0.45},
  normal: {searchDepth: 0, perSlotTopN: 4, turnTopK: 3, randomNoise: 25, mistakeRate: 0.18},
  elite: {searchDepth: 1, perSlotTopN: 5, turnTopK: 5, randomNoise: 12, mistakeRate: 0.08},
  gymLeader: {searchDepth: 2, perSlotTopN: 6, turnTopK: 8, randomNoise: 8, mistakeRate: 0.04},
  eliteFour: {searchDepth: 3, perSlotTopN: 8, turnTopK: 12, randomNoise: 5, mistakeRate: 0.02},
  champion: {searchDepth: 4, perSlotTopN: 10, turnTopK: 16, randomNoise: 2, mistakeRate: 0.01},
};

const FEATURE_KEYS = [
  "damage",
  "ko",
  "stab",
  "typeAdvantage",
  "accuracy",
  "survival",
  "protect",
  "recovery",
  "support",
  "switch",
  "special",
  "targeting",
  "weather",
  "terrain",
  "room",
  "statStage",
  "ability",
  "item",
] as const;

const PREFERENCE_WEIGHTS: Record<BattleAiPreferenceV4, BattleAiFeatureVectorV4> = {
  offense: {
    damage: 1.45,
    ko: 1.7,
    stab: 1.2,
    typeAdvantage: 1.35,
    accuracy: 1,
    survival: 0.8,
    protect: 0.55,
    recovery: 0.65,
    support: 0.65,
    switch: 0.75,
    special: 1.25,
    targeting: 1.15,
    weather: 0.85,
    terrain: 0.85,
    room: 0.8,
    statStage: 0.9,
    ability: 0.9,
    item: 0.9,
  },
  defense: {
    damage: 0.82,
    ko: 1,
    stab: 0.9,
    typeAdvantage: 1,
    accuracy: 1.1,
    survival: 1.6,
    protect: 1.4,
    recovery: 1.45,
    support: 0.9,
    switch: 1.35,
    special: 0.85,
    targeting: 0.95,
    weather: 1,
    terrain: 1.05,
    room: 1,
    statStage: 1,
    ability: 1.1,
    item: 1.35,
  },
  support: {
    damage: 0.78,
    ko: 0.9,
    stab: 0.85,
    typeAdvantage: 0.95,
    accuracy: 1,
    survival: 1.05,
    protect: 1.1,
    recovery: 1.05,
    support: 1.65,
    switch: 1,
    special: 0.9,
    targeting: 1.35,
    weather: 1.35,
    terrain: 1.35,
    room: 1.45,
    statStage: 1.35,
    ability: 1.2,
    item: 1,
  },
  balanced: Object.fromEntries(FEATURE_KEYS.map(key => [key, 1])) as BattleAiFeatureVectorV4,
};

export function normalizeBattleAiProfileV4(profile?: BattleAiProfileV4 | null): Required<BattleAiProfileV4> {
  const level = profile?.level && profile.level in AI_LEVEL_CONFIG ? profile.level : DEFAULT_AI_PROFILE.level;
  const preference = profile?.preference && profile.preference in PREFERENCE_WEIGHTS ? profile.preference : DEFAULT_AI_PROFILE.preference;
  return {level, preference};
}

export function battleAiRequestKeyV4(playerId: ShowdownPlayerIdV4, request: BattleServiceRequestV4 | undefined | null): string {
  if (!request) return `${playerId}:none`;
  const activeShape = (request.active || []).map((active, index) => {
    const side = request.side?.pokemon?.[index];
    return [
      active ? "a" : "p",
      side?.condition || "",
      (active?.moves || []).map(move => `${move.id}:${move.pp ?? ""}:${move.disabled ? "d" : ""}`).join("/"),
    ].join(":");
  }).join("|");
  const switches = (request.forceSwitch || []).map(Boolean).join(",");
  const side = (request.side?.pokemon || []).map(pokemon => `${pokemon.ident}:${pokemon.condition}:${pokemon.active ? "a" : ""}:${pokemon.commanding ? "c" : ""}`).join("|");
  return `${playerId}:${request.rqid ?? "no-rqid"}:${request.teamPreview ? "team" : ""}:${switches}:${activeShape}:${side}`;
}

export function chooseAiBattleChoiceV4(context: BattleAiChoiceContextV4): BattleAiChoiceResultV4 {
  const startedAt = Date.now();
  const profile = normalizeBattleAiProfileV4(context.aiProfile);
  const levelConfig = AI_LEVEL_CONFIG[profile.level];
  const request = context.request || undefined;
  const requestKey = battleAiRequestKeyV4(context.playerId, request);
  const rng = createSeededRng(`${context.rngSeed || context.snapshot.id}:${context.playerId}:${requestKey}:${profile.level}:${profile.preference}`);
  const candidates = generateTurnCandidates(request, context, profile, rng);
  const legalCandidates = candidates.map(candidate => ({
    ...candidate,
    choice: sanitizeAiChoice(candidate.choice, context.snapshot.ruleSet, context.snapshot.mode, allowedSpecialSystemsForPlayer(context)),
  })).filter(candidate => candidate.choice && choiceLooksParseable(candidate.choice));
  const fallback = fallbackLegalChoiceV4(request);
  const selected = selectCandidate(legalCandidates, profile, levelConfig, rng) || {
    choice: fallback,
    score: 0,
    features: emptyFeatures(),
    kind: "pass" as const,
  };
  const elapsedMs = Date.now() - startedAt;
  const timedOut = elapsedMs > (context.timeBudgetMs ?? 10_000);
  const topCandidates = legalCandidates
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(candidate => ({
      choice: candidate.choice,
      score: roundScore(candidate.score),
      features: roundFeatures(candidate.features),
    }));
  return {
    choice: selected.choice || fallback,
    elapsedMs,
    timedOut,
    debug: {
      playerId: context.playerId,
      rqid: request?.rqid,
      requestKey,
      level: profile.level,
      preference: profile.preference,
      elapsedMs,
      timedOut,
      candidateCount: legalCandidates.length,
      selectedChoice: selected.choice || fallback,
      selectedScore: roundScore(selected.score),
      topCandidates,
    },
  };
}

export function fallbackLegalChoiceV4(request: BattleServiceRequestV4 | undefined): string {
  if (!request) return "pass";
  if (request.wait) return "";
  if (request.teamPreview) {
    const count = request.side?.pokemon?.length || 1;
    return `team ${Array.from({length: count}, (_, index) => index + 1).join(",")}`;
  }
  if (request.forceSwitch?.some(Boolean)) {
    const reservedSwitches = new Set<number>();
    return request.forceSwitch.map(mustSwitch => mustSwitch ? legalSwitchChoice(request, reservedSwitches) : "pass").join(", ");
  }
  if (request.active?.length) {
    return fixedActiveRequests(request).map((active, activeIndex) => {
      if (!active) return "pass";
      const move = firstUsableMove(active.moves || []);
      if (!move) return "move 1";
      return `move ${move.index + 1}${defaultTargetSuffix(request, activeIndex, move.move, Boolean(request.targetable || (request.active || []).length > 1))}`;
    }).join(", ");
  }
  return "pass";
}

function generateTurnCandidates(
  request: BattleServiceRequestV4 | undefined,
  context: BattleAiChoiceContextV4,
  profile: Required<BattleAiProfileV4>,
  rng: () => number,
): AiCandidate[] {
  if (!request || request.wait) return [];
  if (request.teamPreview) return generateTeamPreviewCandidates(request, context, profile, rng);
  if (request.forceSwitch?.some(Boolean)) return generateForceSwitchCandidates(request, context, profile, rng);
  if (request.active?.length) return generateMoveTurnCandidates(request, context, profile, rng);
  return [];
}

function generateTeamPreviewCandidates(
  request: BattleServiceRequestV4,
  context: BattleAiChoiceContextV4,
  profile: Required<BattleAiProfileV4>,
  rng: () => number,
): AiCandidate[] {
  const side = request.side?.pokemon || [];
  const count = side.length || 1;
  const defaultChoice = `team ${Array.from({length: count}, (_, index) => index + 1).join(",")}`;
  return [scoreCandidate({choice: defaultChoice, kind: "team", features: {...emptyFeatures(), targeting: 10}}, context, profile, rng)];
}

function generateForceSwitchCandidates(
  request: BattleServiceRequestV4,
  context: BattleAiChoiceContextV4,
  profile: Required<BattleAiProfileV4>,
  rng: () => number,
): AiCandidate[] {
  const switchFlags = request.forceSwitch || [];
  const candidatesBySlot = switchFlags.map((mustSwitch, activeIndex) => mustSwitch ? switchCandidatesForSlot(request, activeIndex, context, profile, rng) : [passCandidate(context, profile, rng, activeIndex)]);
  return composeSlotCandidates(candidatesBySlot, context, profile, rng, true);
}

function generateMoveTurnCandidates(
  request: BattleServiceRequestV4,
  context: BattleAiChoiceContextV4,
  profile: Required<BattleAiProfileV4>,
  rng: () => number,
): AiCandidate[] {
  const activeRequests = fixedActiveRequests(request);
  const slotCandidates = activeRequests.map((active, activeIndex) => {
    if (!active) return [passCandidate(context, profile, rng, activeIndex)];
    const actions: AiCandidate[] = [];
    for (const entry of (active.moves || []).map((move, index) => ({move, index}))) {
      if (entry.move.disabled || (entry.move.pp ?? 1) <= 0) continue;
      const targets = targetSuffixesForMove(request, activeIndex, entry.move);
      const specials = specialChoicesForMove(request, active, entry.index, context.snapshot.ruleSet, context.snapshot.mode, allowedSpecialSystemsForPlayer(context));
      for (const special of specials) {
        for (const target of targets) {
          const parsed: ShowdownParsedChoiceV4 = {kind: "move", index: entry.index + 1, special: special || undefined, target: target || undefined};
          actions.push(scoreCandidate({
            choice: stringifyShowdownChoiceCommandV4(parsed),
            kind: "move",
            activeIndex,
            features: featuresForMove(request, activeIndex, entry.move, special, target, context.snapshot),
          }, context, profile, rng));
        }
      }
    }
    if (!active.trapped && !active.maybeTrapped) {
      actions.push(...switchCandidatesForSlot(request, activeIndex, context, profile, rng));
    }
    if (!actions.length) actions.push(scoreCandidate({choice: "move 1", kind: "move", activeIndex, features: {...emptyFeatures(), damage: 5}}, context, profile, rng));
    return pruneSlotCandidates(actions, profile);
  });
  return composeSlotCandidates(slotCandidates, context, profile, rng, true);
}

function switchCandidatesForSlot(
  request: BattleServiceRequestV4,
  activeIndex: number,
  context: BattleAiChoiceContextV4,
  profile: Required<BattleAiProfileV4>,
  rng: () => number,
): AiCandidate[] {
  const reservedActiveSlots = request.forceSwitch?.length || request.active?.length || 0;
  return (request.side?.pokemon || [])
    .map((pokemon, index) => ({pokemon, index}))
    .filter(entry => indexIsSwitchableBench(entry.index, reservedActiveSlots, entry.pokemon))
    .map(entry => {
      const features = emptyFeatures();
      features.switch = 45;
      features.survival = activeHpRatio(request, activeIndex) < 0.35 ? 35 : 8;
      features.item = entry.pokemon.item ? 4 : 0;
      features.ability = entry.pokemon.ability || entry.pokemon.baseAbility ? 4 : 0;
      return scoreCandidate({choice: `switch ${entry.index + 1}`, kind: "switch", activeIndex, features}, context, profile, rng);
    });
}

function composeSlotCandidates(
  candidatesBySlot: AiCandidate[][],
  context: BattleAiChoiceContextV4,
  profile: Required<BattleAiProfileV4>,
  rng: () => number,
  enforceUniqueSwitches: boolean,
): AiCandidate[] {
  let combined: AiCandidate[] = [{choice: "", kind: "pass", features: emptyFeatures(), score: 0}];
  for (const slotCandidates of candidatesBySlot) {
    const next: AiCandidate[] = [];
    for (const base of combined) {
      for (const candidate of slotCandidates) {
        const parts = base.choice ? base.choice.split(",").map(part => part.trim()).filter(Boolean) : [];
        if (enforceUniqueSwitches && candidate.kind === "switch") {
          const switchIndex = parseSwitchIndex(candidate.choice);
          if (switchIndex && parts.some(part => parseSwitchIndex(part) === switchIndex)) continue;
        }
        const specialSystem = specialSystemForChoice(candidate.choice);
        if (specialSystem && parts.some(part => specialSystemForChoice(part) === specialSystem)) continue;
        const features = addFeatures(base.features, candidate.features);
        if (candidate.kind === "move" && parts.some(part => isMoveTargetingSameFoe(part, candidate.choice))) {
          features.targeting += 12;
        }
        next.push(scoreCandidate({
          choice: [...parts, candidate.choice].join(", "),
          kind: candidate.kind,
          features,
        }, context, profile, rng, base.score + candidate.score));
      }
    }
    combined = pruneTurnCandidates(next, profile);
  }
  return pruneTurnCandidates(combined, profile);
}

function pruneSlotCandidates(candidates: AiCandidate[], profile: Required<BattleAiProfileV4>): AiCandidate[] {
  const config = AI_LEVEL_CONFIG[profile.level];
  if (!config.perSlotTopN) return candidates;
  return candidates.slice().sort((a, b) => b.score - a.score).slice(0, config.perSlotTopN);
}

function pruneTurnCandidates(candidates: AiCandidate[], profile: Required<BattleAiProfileV4>): AiCandidate[] {
  const config = AI_LEVEL_CONFIG[profile.level];
  if (!config.turnTopK) return candidates;
  return candidates.slice().sort((a, b) => b.score - a.score).slice(0, config.turnTopK);
}

function selectCandidate(
  candidates: AiCandidate[],
  profile: Required<BattleAiProfileV4>,
  config: AiLevelConfig,
  rng: () => number,
): AiCandidate | null {
  if (!candidates.length) return null;
  const sorted = candidates.slice().sort((a, b) => b.score - a.score);
  if (profile.level === "rookie" || rng() < config.mistakeRate) {
    const poolSize = profile.level === "rookie" ? Math.min(sorted.length, 8) : Math.min(sorted.length, 4);
    return sorted[Math.floor(rng() * poolSize)] || sorted[0]!;
  }
  return sorted[0]!;
}

function scoreCandidate(
  candidate: Omit<AiCandidate, "score">,
  context: BattleAiChoiceContextV4,
  profile: Required<BattleAiProfileV4>,
  rng: () => number,
  baseScore = 0,
): AiCandidate {
  const weights = PREFERENCE_WEIGHTS[profile.preference];
  const levelConfig = AI_LEVEL_CONFIG[profile.level];
  const weighted = FEATURE_KEYS.reduce((total, key) => total + (candidate.features[key] || 0) * (weights[key] ?? 1), 0);
  const searchDepthBonus = levelConfig.searchDepth * longTermFeatureScore(candidate.features) * 0.08;
  const noise = (rng() - 0.5) * levelConfig.randomNoise;
  return {
    ...candidate,
    score: baseScore + weighted + searchDepthBonus + noise,
  };
}

function featuresForMove(
  request: BattleServiceRequestV4,
  activeIndex: number,
  move: BattleServiceMoveRequestV4,
  special: ShowdownSpecialChoiceV4 | null,
  target: string,
  snapshot: BattleServiceSnapshotV4,
): BattleAiFeatureVectorV4 {
  const features = emptyFeatures();
  const id = normalizeId(move.id || move.move);
  const statusMove = moveIsSupport(id);
  const recoveryMove = moveIsRecovery(id);
  const protectMove = moveIsProtect(id);
  const hpRatio = activeHpRatio(request, activeIndex);
  features.damage = statusMove || recoveryMove || protectMove ? 0 : movePowerEstimate(id, special);
  features.ko = estimateKoScore(request, move, special, target);
  features.stab = estimateStabScore(request, activeIndex, move);
  features.typeAdvantage = estimateTypeAdvantageScore(move, target, snapshot);
  features.accuracy = moveAccuracyScore(id);
  features.survival = hpRatio < 0.35 ? 20 : hpRatio < 0.6 ? 8 : 0;
  features.protect = protectMove ? (hpRatio < 0.5 ? 42 : 18) : 0;
  features.recovery = recoveryMove ? (hpRatio < 0.5 ? 46 : 8) : 0;
  features.support = statusMove ? 24 : 0;
  features.switch = 0;
  features.special = special ? specialScore(special, features) : 0;
  features.targeting = target ? 8 : 0;
  features.weather = moveIsWeather(id) ? 24 : 0;
  features.terrain = moveIsTerrain(id) ? 24 : 0;
  features.room = moveIsRoomOrSpeedControl(id) ? 28 : 0;
  features.statStage = moveIsStatStage(id) ? 22 : 0;
  features.ability = activeRow(request, activeIndex)?.ability || activeRow(request, activeIndex)?.baseAbility ? 4 : 0;
  features.item = activeRow(request, activeIndex)?.item ? 5 : 0;
  return features;
}

function emptyFeatures(): BattleAiFeatureVectorV4 {
  return Object.fromEntries(FEATURE_KEYS.map(key => [key, 0])) as BattleAiFeatureVectorV4;
}

function addFeatures(left: BattleAiFeatureVectorV4, right: BattleAiFeatureVectorV4): BattleAiFeatureVectorV4 {
  return Object.fromEntries(FEATURE_KEYS.map(key => [key, (left[key] || 0) + (right[key] || 0)])) as BattleAiFeatureVectorV4;
}

function passCandidate(context: BattleAiChoiceContextV4, profile: Required<BattleAiProfileV4>, rng: () => number, activeIndex: number): AiCandidate {
  return scoreCandidate({choice: "pass", kind: "pass", activeIndex, features: emptyFeatures()}, context, profile, rng);
}

function fixedActiveRequests(request: BattleServiceRequestV4): NonNullable<BattleServiceRequestV4["active"]> {
  return (request.active || []).map((active, index) => sidePokemonCanCommand(request.side?.pokemon?.[index]) ? active : null);
}

function sidePokemonCanCommand(pokemon: NonNullable<BattleServiceRequestV4["side"]>["pokemon"][number] | undefined): boolean {
  if (!pokemon) return true;
  return !pokemon.fainted && !pokemon.commanding && !conditionIsFainted(pokemon.condition);
}

function conditionIsFainted(condition: string | undefined): boolean {
  return Boolean(condition?.includes("fnt") || /^\s*0(?:\D|$)/.test(condition || ""));
}

function firstUsableMove(moves: BattleServiceMoveRequestV4[]): {move: BattleServiceMoveRequestV4; index: number} | null {
  return moves.map((move, index) => ({move, index})).find(entry => !entry.move.disabled && (entry.move.pp ?? 1) > 0) || null;
}

function legalSwitchChoice(request: BattleServiceRequestV4, reservedSwitches = new Set<number>()): string {
  const reservedActiveSlots = request.forceSwitch?.length || request.active?.length || 0;
  const candidates = (request.side?.pokemon || [])
    .map((pokemon, index) => ({pokemon, index}))
    .filter(entry => indexIsSwitchableBench(entry.index, reservedActiveSlots, entry.pokemon) && !reservedSwitches.has(entry.index + 1));
  const picked = candidates[0];
  if (picked) reservedSwitches.add(picked.index + 1);
  return picked ? `switch ${picked.index + 1}` : "pass";
}

function indexIsSwitchableBench(index: number, reservedActiveSlots: number, pokemon: NonNullable<BattleServiceRequestV4["side"]>["pokemon"][number]): boolean {
  return index >= reservedActiveSlots && !pokemon.active && !pokemon.condition.includes("fnt");
}

function targetSuffixesForMove(request: BattleServiceRequestV4, activeIndex: number, move: BattleServiceMoveRequestV4): string[] {
  const targetable = Boolean(request.targetable || (request.active || []).length > 1);
  if (!targetable || !moveNeedsExplicitTarget(move.target) || normalizeMoveTarget(move.id) === "recharge") return [""];
  const target = normalizeMoveTarget(move.target);
  const activeCount = Math.max(1, request.active?.length || 1);
  if (target === "adjacentally" || target === "adjacentallyorself") {
    const allies = Array.from({length: activeCount}, (_, index) => index).filter(index => index !== activeIndex && request.active?.[index]);
    return allies.length ? allies.map(index => `-${index + 1}`) : [""];
  }
  if (target === "any") {
    const foes = Array.from({length: activeCount}, (_, index) => `+${index + 1}`);
    const allies = Array.from({length: activeCount}, (_, index) => index).filter(index => index !== activeIndex && request.active?.[index]).map(index => `-${index + 1}`);
    return [...foes, ...allies];
  }
  return Array.from({length: activeCount}, (_, index) => `+${index + 1}`);
}

function defaultTargetSuffix(request: BattleServiceRequestV4, activeIndex: number, move: {id?: string; target?: string}, targetable: boolean): string {
  if (!targetable || !moveNeedsExplicitTarget(move.target)) return "";
  if (normalizeMoveTarget(move.id) === "recharge") return "";
  const target = normalizeMoveTarget(move.target);
  if (target === "adjacentally" || target === "adjacentallyorself") {
    const allyIndex = request.active?.findIndex((active, index) => index !== activeIndex && Boolean(active)) ?? -1;
    return allyIndex >= 0 ? ` -${allyIndex + 1}` : "";
  }
  const foeCount = Math.max(1, request.active?.length || 1);
  return ` +${Math.min(activeIndex + 1, foeCount)}`;
}

function specialChoicesForMove(
  request: BattleServiceRequestV4,
  active: NonNullable<BattleServiceRequestV4["active"]>[number],
  moveIndex: number,
  ruleSet: string,
  mode: string,
  allowedSystems?: readonly BattleSpecialSystemV4[],
): Array<ShowdownSpecialChoiceV4 | null> {
  const choices: Array<ShowdownSpecialChoiceV4 | null> = [null];
  if (!active) return choices;
  const add = (choice: ShowdownSpecialChoiceV4, enabled: unknown) => {
    if (enabled && showdownSpecialChoiceAllowedForRuleSetV4(choice, ruleSet, mode, allowedSystems)) choices.push(choice);
  };
  add("mega", active.canMegaEvo);
  add("megax", active.canMegaEvoX);
  add("megay", active.canMegaEvoY);
  add("ultra", active.canUltraBurst);
  add("max", active.canDynamax || active.maxMoves);
  add("terastallize", active.canTerastallize);
  const zMoves = active.zMoves || active.canZMove || [];
  add("zmove", zMoves[moveIndex]);
  return choices;
}

function sanitizeAiChoice(choice: string, ruleSet: string, mode: string, allowedSystems?: readonly BattleSpecialSystemV4[]): string {
  return filterShowdownChoiceForRuleSetV4(choice, ruleSet, mode, allowedSystems).trim();
}

function allowedSpecialSystemsForPlayer(context: BattleAiChoiceContextV4): readonly BattleSpecialSystemV4[] | undefined {
  return context.snapshot.players.find(player => player.playerId === context.playerId)?.allowedSpecialSystems;
}

function choiceLooksParseable(choice: string): boolean {
  return choice.split(",").every(part => Boolean(parseShowdownChoiceCommandV4(part.trim())));
}

function moveNeedsExplicitTarget(target: string | undefined): boolean {
  if (!target) return false;
  const id = normalizeMoveTarget(target);
  return id === "normal" ||
    id === "any" ||
    id === "adjacentally" ||
    id === "adjacentallyorself" ||
    id === "adjacentfoe";
}

function normalizeMoveTarget(value: string | undefined): string {
  return String(value || "normal").replace(/[^a-z]/gi, "").toLowerCase() || "normal";
}

function activeRow(request: BattleServiceRequestV4, activeIndex: number): NonNullable<BattleServiceRequestV4["side"]>["pokemon"][number] | undefined {
  return request.side?.pokemon?.[activeIndex];
}

function activeHpRatio(request: BattleServiceRequestV4, activeIndex: number): number {
  return hpRatioFromCondition(activeRow(request, activeIndex)?.condition);
}

function hpRatioFromCondition(condition: string | undefined): number {
  const value = String(condition || "");
  if (value.includes("fnt") || value.startsWith("0 ")) return 0;
  const match = /^(\d+)\/(\d+)/.exec(value);
  if (!match) return 1;
  const hp = Number(match[1]);
  const max = Number(match[2]);
  return max > 0 ? Math.max(0, Math.min(1, hp / max)) : 1;
}

function estimateKoScore(request: BattleServiceRequestV4, move: BattleServiceMoveRequestV4, special: ShowdownSpecialChoiceV4 | null, target: string): number {
  const targetIndex = target.startsWith("+") ? Number(target.slice(1)) - 1 : 0;
  const foeActives = request.active?.length || 1;
  const estimatedTargetRatio = foeActives > 1 ? 0.65 : 0.75;
  const power = movePowerEstimate(normalizeId(move.id || move.move), special);
  return power / 100 > estimatedTargetRatio ? 28 : power >= 90 ? 12 : 0;
}

function estimateStabScore(request: BattleServiceRequestV4, activeIndex: number, move: BattleServiceMoveRequestV4): number {
  const row = activeRow(request, activeIndex);
  const details = normalizeId(row?.details || "");
  const moveId = normalizeId(move.id || move.move);
  if (!details || !moveId) return 0;
  if (details.includes("charizard") && (moveId.includes("flame") || moveId.includes("fire") || moveId.includes("air"))) return 14;
  if (details.includes("pikachu") && (moveId.includes("thunder") || moveId.includes("volt") || moveId.includes("electric"))) return 14;
  if (details.includes("bulbasaur") && (moveId.includes("grass") || moveId.includes("vine") || moveId.includes("leaf"))) return 14;
  return 5;
}

function estimateTypeAdvantageScore(move: BattleServiceMoveRequestV4, target: string, snapshot: BattleServiceSnapshotV4): number {
  const id = normalizeId(move.id || move.move);
  if (!target.startsWith("+")) return 0;
  const foe = snapshot.active.find(active => active.playerId !== movePlayerIdFromSnapshot(snapshot));
  const species = normalizeId(foe?.species || foe?.details || "");
  if (id.includes("thunder") && (species.includes("gyarados") || species.includes("water"))) return 28;
  if ((id.includes("flame") || id.includes("fire")) && (species.includes("bulbasaur") || species.includes("grass"))) return 20;
  return 0;
}

function movePlayerIdFromSnapshot(snapshot: BattleServiceSnapshotV4): ShowdownPlayerIdV4 | "" {
  return snapshot.requests.p1 ? "p1" : snapshot.requests.p2 ? "p2" : snapshot.requests.p3 ? "p3" : snapshot.requests.p4 ? "p4" : "";
}

function moveAccuracyScore(id: string): number {
  if (["thunder", "blizzard", "hydropump", "focusblast", "irontail"].includes(id)) return -12;
  if (["willowisp", "hypnosis", "sleeppowder"].includes(id)) return -8;
  return 4;
}

function movePowerEstimate(id: string, special: ShowdownSpecialChoiceV4 | null): number {
  if (special === "zmove") return 150;
  if (special === "max") return 130;
  if (special === "mega" || special === "megax" || special === "megay" || special === "terastallize") return 95;
  const known: Record<string, number> = {
    tackle: 40,
    quickattack: 40,
    thunderbolt: 90,
    irontail: 100,
    flamethrower: 90,
    airslash: 75,
    aquatail: 90,
    shadowpunch: 60,
  };
  return known[id] ?? (moveIsSupport(id) || moveIsRecovery(id) || moveIsProtect(id) ? 0 : 65);
}

function specialScore(special: ShowdownSpecialChoiceV4, features: BattleAiFeatureVectorV4): number {
  if (special === "mega" || special === "megax" || special === "megay" || special === "ultra") return 34;
  if (special === "zmove") return Math.max(22, features.ko ? 44 : 28);
  if (special === "max") return 32;
  if (special === "terastallize") return Math.max(18, features.typeAdvantage + features.stab);
  return 0;
}

function longTermFeatureScore(features: BattleAiFeatureVectorV4): number {
  return (features.weather || 0) + (features.terrain || 0) + (features.room || 0) + (features.statStage || 0) + (features.ability || 0) + (features.item || 0);
}

function moveIsProtect(id: string): boolean {
  return ["protect", "detect", "spikyshield", "kingsshield", "banefulbunker", "wideguard", "quickguard"].includes(id);
}

function moveIsRecovery(id: string): boolean {
  return ["recover", "roost", "rest", "synthesis", "moonlight", "morningsun", "softboiled", "slackoff", "wish"].includes(id);
}

function moveIsSupport(id: string): boolean {
  return moveIsProtect(id) || moveIsRecovery(id) || moveIsWeather(id) || moveIsTerrain(id) || moveIsRoomOrSpeedControl(id) || moveIsStatStage(id) ||
    ["helpinghand", "growl", "thunderwave", "willowisp", "toxic", "yawn", "taunt", "encore", "followme", "ragepowder"].includes(id);
}

function moveIsWeather(id: string): boolean {
  return ["raindance", "sunnyday", "sandstorm", "hail", "snowscape"].includes(id);
}

function moveIsTerrain(id: string): boolean {
  return ["electricterrain", "grassyterrain", "mistyterrain", "psychicterrain"].includes(id);
}

function moveIsRoomOrSpeedControl(id: string): boolean {
  return ["trickroom", "tailwind", "icywind", "electroweb", "stringshot"].includes(id);
}

function moveIsStatStage(id: string): boolean {
  return ["swordsdance", "nastyplot", "dragondance", "calmmind", "bulkup", "growth", "shellsmash", "growl", "leer", "tailwhip", "screech", "charm"].includes(id);
}

function parseSwitchIndex(choice: string): number | null {
  const parsed = parseShowdownChoiceCommandV4(choice);
  return parsed?.kind === "switch" ? parsed.index : null;
}

function specialSystemForChoice(choice: string): string | null {
  const parsed = parseShowdownChoiceCommandV4(choice);
  return parsed?.kind === "move" ? showdownSpecialSystemForChoiceV4(parsed.special) : null;
}

function isMoveTargetingSameFoe(left: string, right: string): boolean {
  const a = parseShowdownChoiceCommandV4(left);
  const b = parseShowdownChoiceCommandV4(right);
  return Boolean(a?.kind === "move" && b?.kind === "move" && a.target && a.target.startsWith("+") && a.target === b.target);
}

function normalizeId(value: string | undefined): string {
  return String(value || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundFeatures(features: BattleAiFeatureVectorV4): BattleAiFeatureVectorV4 {
  return Object.fromEntries(FEATURE_KEYS.map(key => [key, roundScore(features[key] || 0)])) as BattleAiFeatureVectorV4;
}

function createSeededRng(seed: string): () => number {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}
