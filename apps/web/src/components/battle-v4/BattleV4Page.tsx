// Battle V4 是本项目的底层战斗逻辑；active 身份连续性、switch/detailschange 和 choice 闭环
// 全面参考 Pokemon Showdown Client 的 battle.ts / battle-choices.ts，并翻译为本项目的 snapshot/projection 架构。
// 后续修改或排查战斗页 bug 时，优先横向对比本实现与 Showdown Client 的差异，再决定如何落到本项目架构。
// 严禁随意修改；只有确认 Showdown Client 对应实现来源与差异后，才允许调整这里的战斗行为。
import {useEffect, useMemo, useRef, useState, type CSSProperties} from "react";
import type {AppDebugConfigV4, BagStateV4, BattleCommandActionV4, BattleCommandDraftV4, BattleMoveRequestV4, BattleNormalizedRequestV4, BattleRequestV4, BattleServiceClientV4, BattleSessionSnapshotV4, BattleSpecialChoiceV4, BattleSpecialSystemV4, BattleViewModelV4, BattleViewSlotV4, ChangeBattleV2Api, DexMoveDetail, DexTrainerDetail, FormalGameRunV4, LocalPokemonV4, PlayerItemInstanceV4, PlayerVaultV4, RequestSidePokemonV4, ShowdownPlaybackTimelineV4, ShowdownPlayerIdV4, TrainingMoveSlotV4, TrainingPlayerDraftV4, TrainingRunGameV4, UserProfileV2} from "@changebattle-v2/api";
import {battleDebugLog, battleSpecialSystemForChoiceV4, canUseRecoveryItemV4, createBattleCommandDraftV4, fillBattleCommandPassesV4, formalRoundStageLabelV4, patchBattleRunLocalTeamsFromSnapshot, projectBattleViewModelV4, showdownNormalizeMoveTargetV4, showdownTargetTypeAllowsChoiceV4, splitBattleTrainerItemChoicesV4, stringifyBattleTrainerItemChoiceV4, translateDexLabel, validShowdownTargetLocV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {assetUrl, styleUrlAssetPath} from "../../lib/assetUrl";
import {BattleV4MovePreviewModal} from "./BattleV4MovePreviewModal";
import {BattleV4SurrenderPanel, type BattleV4SurrenderParticipant} from "./BattleV4SurrenderPanel";
import {BattleV4SkillCommandPanel, uniqueSpecialOptionsForActions, type BattleV4SkillCommandMoveCardView} from "./BattleV4SkillCommandPanel";
import {BattleV4TrainerNarrativeOverlay, type BattleV4NarrativeDialogue, type BattleV4NarrativePhase, type BattleV4NarrativeTrainer} from "./BattleV4TrainerNarrativeOverlay";
import {parseBattleProtocolLineV4, useBattleV4Playback, type BattleAnimationEventV4, type BattlePlaybackDebugV4, type BattleProtocolSeatV4, type BattleV4PersistentFieldVisuals, type BattleV4PersistentSideConditionVisuals, type BattleV4SideConditionVisualV4, type BattleV4TwoTurnMoveState} from "./battleV4Playback";
import type {BattleV4VisibleCommentaryEntry} from "./battleV4Commentary";
import {getBattleV4ActiveTimelineActorVisuals, getBattleV4ActiveTimelineFxVisuals, getBattleV4ActiveTimelineResultVisuals, getBattleV4ActiveTimelineVisuals, type BattleV4TimelineActorVisual, type BattleV4TimelineFxVisual, type BattleV4TimelineResultVisual, type BattleV4TimelineVisuals} from "./battleV4TimelineVisuals";
import {visualSeatClassForSeat} from "./battleV4VisualSeats";
import type {ShowdownAnimationStepV4} from "./battleV4ShowdownAnimationAdapter";
import type {BattleV4ScheduledTimelineStep} from "./useBattleV4ShowdownTimelineRunner";
import {useBattleV4CommandBuilder} from "./useBattleV4CommandBuilder";
import {usePokemonBattleOBJHook, type PokemonBattleOBJ, type PokemonBattleOBJState} from "./usePokemonBattleOBJHook";
import {PlayerBagPanel, type PlayerBagAction, type PlayerBagPokemonTarget} from "../training/PlayerBagPanel";
import "./BattleV4Page.css";

export type BattleV4PageProps = {
  api: ChangeBattleV2Api;
  run: TrainingRunGameV4;
  sessionId: string;
  debugConfig?: AppDebugConfigV4;
  diagnosticsContext?: BattleV4DiagnosticsContext;
  onRunChange: (run: TrainingRunGameV4) => void;
  onBackToRest: () => void;
  onBattleComplete?: (result: {sessionId: string; reason?: "surrender"}) => void;
  onAfterSubmitSnapshot?: (snapshot: BattleSessionSnapshotV4) => Promise<BattleSessionSnapshotV4> | BattleSessionSnapshotV4;
  battleServiceOverride?: BattleServiceClientV4;
  playerProfile?: Pick<UserProfileV2, "name" | "frontAsset" | "frontGifAsset" | "backAsset" | "avatarAsset">;
  endFlow?: "auto-exit" | "result-panel";
};

type BattleV4DiagnosticsContext = {
  formalRun?: FormalGameRunV4 | null;
  playerVault?: PlayerVaultV4 | null;
};

type SwitchActionV4 = Extract<BattleCommandActionV4, {kind: "switch"}>;
type MoveActionV4 = Extract<BattleCommandActionV4, {kind: "move"}>;
type RequestPokemonV4 = RequestSidePokemonV4;

type BattleV4StatusBadge = {
  code: string;
  label: string;
  title: string;
  className: string;
};

type BattleV4MoveCardView = BattleV4SkillCommandMoveCardView;

type BattleV4MoveDisplaySpecialChoice = BattleSpecialChoiceV4 | "active-max" | null;

type BattleV4VisibleSlot = BattleViewSlotV4 & {
  twoTurnMoveState?: BattleV4TwoTurnMoveState;
  substituteActive?: boolean;
};

type BattleV4TargetCardView = {
  key: string;
  slot: BattleViewSlotV4 | null;
  selectable: boolean;
  affected: boolean;
  choiceSuffix: string;
  effectivenessLabel: string;
  effectivenessTone: BattleV4MoveCardView["effectivenessTone"];
};

type BattleV4BoostStat = "atk" | "def" | "spa" | "spd" | "spe" | "accuracy" | "evasion";

type BattleV4FieldStatus = {
  id: string;
  label: string;
  category: "weather" | "terrain" | "room" | "field" | "side";
  side?: "near" | "far";
  remaining: number | null;
  note: string;
};

type BattleV4NarrativeState = {
  phase: BattleV4NarrativePhase;
  dialogueIndex: number;
  dialogue: BattleV4NarrativeDialogue;
};

type BattleV4ResolvedNarrativeTrainer = BattleV4NarrativeTrainer & {
  detail: DexTrainerDetail | null;
  draft: TrainingPlayerDraftV4 | null;
};

type BattleV4BlockingError = {
  key: string;
  message: string;
  detail: string;
};

type BattleV4DiagnosticsUiState = {
  pendingMoveAction?: MoveActionV4 | null;
  visualNearTeam?: BattleViewSlotV4[];
  visualFarTeam?: BattleViewSlotV4[];
};

type BattleV4BattleStatus = {
  turn: number;
  weather: BattleV4FieldStatus | null;
  fields: BattleV4FieldStatus[];
  boostsBySeat: Record<string, Partial<Record<BattleV4BoostStat, number>>>;
};

const STATUS_BADGES: Record<string, Omit<BattleV4StatusBadge, "code">> = {
  brn: {label: "烧", title: "烧伤", className: "brn"},
  par: {label: "麻", title: "麻痹", className: "par"},
  psn: {label: "毒", title: "中毒", className: "psn"},
  tox: {label: "毒", title: "剧毒", className: "tox"},
  slp: {label: "睡", title: "睡眠", className: "slp"},
  frz: {label: "冰", title: "冰冻", className: "frz"},
  fnt: {label: "倒", title: "倒下", className: "fnt"},
};

const STAT_ROWS: Array<[keyof LocalPokemonV4["evs"], string]> = [
  ["hp", "HP"],
  ["atk", "攻击"],
  ["def", "防御"],
  ["spa", "特攻"],
  ["spd", "特防"],
  ["spe", "速度"],
];

const SURRENDER_TIMEOUT_MS = 15000;
const SURRENDER_SUBMIT_DELAY_MS = 3000;
const BATTLE_V4_NARRATIVE_FLOW_VERSION = "referee-dialogue-v2";
const BATTLE_V4_REFEREE_PORTRAIT = "npc/staff/judge.png";

const BOOST_STAT_IDS: BattleV4BoostStat[] = ["atk", "def", "spa", "spd", "spe", "accuracy", "evasion"];
const WEATHER_STATUS_IDS = new Set(["sunnyday", "desolateland", "raindance", "primordialsea", "sandstorm", "hail", "snow", "snowscape", "deltastream"]);
const SIDE_CONDITION_STATUS_IDS = new Set(["reflect", "lightscreen", "auroraveil", "safeguard", "mist", "stealthrock", "spikes", "toxicspikes", "stickyweb", "tailwind"]);

const POKEMON_FORM_LABELS: Array<[RegExp, string]> = [
  [/-mega-x$/i, "Mega X"],
  [/-mega-y$/i, "Mega Y"],
  [/-mega$/i, "Mega"],
  [/-primal$/i, "原始回归"],
  [/-ultra$/i, "究极爆发"],
  [/-gmax$/i, "超极巨"],
  [/-g-max$/i, "超极巨"],
];

const POKEMON_FORM_ID_SUFFIXES: Array<[string, string]> = [
  ["bustedtotem", "现形的样子霸主"],
  ["busted", "现形的样子"],
  ["totem", "霸主"],
  ["meteor", "流星"],
  ["megax", "Mega X"],
  ["megay", "Mega Y"],
  ["mega", "Mega"],
  ["primal", "原始回归"],
  ["ultra", "究极爆发"],
  ["gmax", "超极巨"],
];

const TYPE_CHART: Record<string, Record<string, number>> = {
  normal: {rock: 0.5, ghost: 0, steel: 0.5},
  fire: {fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2},
  water: {fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5},
  electric: {water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5},
  grass: {fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5},
  ice: {fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5},
  fighting: {normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5},
  poison: {grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2},
  ground: {fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2},
  flying: {electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5},
  psychic: {fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5},
  bug: {fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5},
  rock: {fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5},
  ghost: {normal: 0, psychic: 2, ghost: 2, dark: 0.5},
  dragon: {dragon: 2, steel: 0.5, fairy: 0},
  dark: {fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5},
  steel: {fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2},
  fairy: {fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5},
};

const TYPE_SHORT_LABEL: Record<string, string> = {
  normal: "普",
  fire: "火",
  water: "水",
  electric: "电",
  grass: "草",
  ice: "冰",
  fighting: "斗",
  poison: "毒",
  ground: "地",
  flying: "飞",
  psychic: "超",
  bug: "虫",
  rock: "岩",
  ghost: "鬼",
  dragon: "龙",
  dark: "恶",
  steel: "钢",
  fairy: "妖",
};

type BattleSubmitErrorV4 = {
  at: string;
  reason: string;
  sessionId: string;
  playerId: "p1";
  choice: string;
  trainerItems: ReturnType<typeof splitBattleTrainerItemChoicesV4>["trainerItems"];
  busy: boolean;
  commandsLocked: boolean;
  playbackBlockingCommands: boolean;
  commandDraft: BattleCommandDraftV4 | null;
  normalizedRequest: BattleNormalizedRequestV4 | null;
  draftBefore?: BattleCommandDraftV4;
  draftAfter?: BattleCommandDraftV4;
  finalChoice?: string;
  error?: string;
};

export function BattleV4Page({api, run, sessionId, debugConfig, diagnosticsContext, onRunChange, onBackToRest, onBattleComplete, onAfterSubmitSnapshot, battleServiceOverride, playerProfile, endFlow = "result-panel"}: BattleV4PageProps) {
  const battleService = battleServiceOverride || api.battleService;
  const runRef = useRef(run);
  const onRunChangeRef = useRef(onRunChange);
  const [snapshot, setSnapshot] = useState<BattleSessionSnapshotV4 | null>(null);
  const [message, setMessage] = useState("正在连接 Battle Service...");
  const [busy, setBusy] = useState(false);
  const [battleStatusOpen, setBattleStatusOpen] = useState(false);
  const [switchPanelOpen, setSwitchPanelOpen] = useState(false);
  const [battleBagOpen, setBattleBagOpen] = useState(false);
  const [commandMode, setCommandMode] = useState<"command" | "moves">("command");
  const [lastSubmitError, setLastSubmitError] = useState<BattleSubmitErrorV4 | null>(null);
  const skipAnimations = false;
  const [previewMove, setPreviewMove] = useState<DexMoveDetail | null>(null);
  const [surrenderOpen, setSurrenderOpen] = useState(false);
  const [surrenderApproved, setSurrenderApproved] = useState(false);
  const [surrenderAllyApproved, setSurrenderAllyApproved] = useState(false);
  const [surrenderRemainingMs, setSurrenderRemainingMs] = useState(SURRENDER_TIMEOUT_MS);
  const [surrenderSubmitRemainingMs, setSurrenderSubmitRemainingMs] = useState(SURRENDER_SUBMIT_DELAY_MS);
  const [surrenderSubmitting, setSurrenderSubmitting] = useState(false);
  const [playbackTimeline, setPlaybackTimeline] = useState<ShowdownPlaybackTimelineV4 | null>(null);
  const [playbackTimelinePending, setPlaybackTimelinePending] = useState(false);
  const [playbackTimelineUnavailable, setPlaybackTimelineUnavailable] = useState(false);
  const [submittedPlaybackLock, setSubmittedPlaybackLock] = useState<{sessionId: string; rawLength: number} | null>(null);
  const [narrativeState, setNarrativeState] = useState<BattleV4NarrativeState | null>(null);
  const [introPlayedSessionId, setIntroPlayedSessionId] = useState("");
  const [outroPlayedSessionId, setOutroPlayedSessionId] = useState("");
  const [outroFallbackReadySessionId, setOutroFallbackReadySessionId] = useState("");
  const [surrenderSettlementSessionId, setSurrenderSettlementSessionId] = useState("");
  const surrenderSubmitTimerRef = useRef<number | null>(null);
  const outroFallbackTimerRef = useRef<number | null>(null);
  const finalizedSessionRef = useRef("");
  const trainerItemAutoSubmitKeyRef = useRef("");
  const narrativeSessionKey = useMemo(() => battleV4NarrativeSessionKey(sessionId), [sessionId]);
  const rawViewModel = useMemo(() => snapshot ? projectBattleViewModelV4(snapshot, "p1") : null, [snapshot]);
  const requestResetKey = useMemo(() => requestKeyForCommand(rawViewModel?.command.request || null, rawViewModel?.command.requestType || "none"), [rawViewModel?.command.request, rawViewModel?.command.requestType]);
  const {
    commandDraft,
    pendingMoveAction,
    choiceStatus,
    setChoiceStatus,
    setPendingMoveAction,
    clearDraft: clearCommandDraft,
    applyChoice: applyDraftChoice,
    draftMoveAction: draftCommandMoveAction,
    applyMoveTarget,
    undoChoice: undoCommandChoice,
    moveNeedsSubmittedTarget,
  } = useBattleV4CommandBuilder({
    normalizedRequest: rawViewModel?.command.normalizedRequest || null,
    requestResetKey,
    battleStatus: rawViewModel?.status || null,
    debugConfig,
    onCommandModeChange: setCommandMode,
    onSwitchPanelOpenChange: setSwitchPanelOpen,
    onFinalChoice: ({input, choice, trainerItems, draft}) => {
      logSubmitInfo("p1 指令草稿完成，准备提交", {
        input,
        finalChoice: choice,
        trainerItems,
        requestType: draft.requestType,
        progress: `${draft.choices.filter(Boolean).length}/${draft.requestLength}`,
      });
      void submitChoice(choice, trainerItems);
    },
    onIncompleteChoice: payload => {
      reportSubmitError(payload);
    },
  });
  const viewModel = useMemo(() => snapshot ? projectBattleViewModelV4(snapshot, "p1", commandDraft) : null, [snapshot, commandDraft]);
  const narrativeDisplayPhase = narrativeState?.phase || "";
  const narrativeActive = Boolean(narrativeState);
  const narrativePhaseClass = narrativeDisplayPhase ? ` is-narrative is-narrative-${narrativeDisplayPhase}` : "";
  const introNarrativeActive = narrativeDisplayPhase === "intro";
  const playback = useBattleV4Playback(snapshot, viewModel, {skipAnimations, debugConfig, paused: introNarrativeActive || playbackTimelinePending, playbackTimeline, playbackTimelineUnavailable, api});
  const playbackMessage = useMemo(
    () => localizeBattleV4PlaybackMessage(playback.messagebar?.message || "", playback.activeAnimation, api),
    [api, playback.activeAnimation, playback.messagebar?.message],
  );
  const pokemonBattleOBJ = usePokemonBattleOBJHook({api, snapshot, viewModel, playback});
  const submittedTurnPlaybackPending = Boolean(
    submittedPlaybackLock &&
    submittedPlaybackLock.sessionId === sessionId &&
    (!snapshot || snapshot.rawLog.length <= submittedPlaybackLock.rawLength || !playback.playbackComplete)
  );
  const playbackBlockingCommands = Boolean(!skipAnimations && (
    !playback.playbackComplete ||
    playback.pendingBlockingAnimations > 0 ||
    playbackTimelinePending ||
    submittedTurnPlaybackPending
  ));
  const commandsLocked = Boolean(narrativeActive || playbackBlockingCommands);
  const shouldShowResultPanel = Boolean(endFlow === "result-panel" && snapshot?.status === "ended" && !playbackBlockingCommands && !narrativeActive && outroPlayedSessionId === narrativeSessionKey);
  const shouldShowSwitchPanel = Boolean(!commandsLocked && snapshot && viewModel && (
    viewModel.command.requestType === "switch" || (switchPanelOpen && viewModel.command.requestType === "move")
  ));
  const visualNearTeam = pokemonBattleOBJ.nearSlots;
  const visualFarTeam = pokemonBattleOBJ.farSlots;
  const battleError = useMemo(() => battleV4BlockingError(snapshot, lastSubmitError), [snapshot, lastSubmitError]);
  const activeBattleBag = api.normalizeBagState(run.players.p1?.bag);
  const battleBagEnabled = Boolean(run.battlePreference?.battleBagEnabled && activeBattleBag.battleBagEnabled);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  useEffect(() => {
    onRunChangeRef.current = onRunChange;
  }, [onRunChange]);
  const canSurrender = Boolean(onBattleComplete || endFlow === "auto-exit");
  const battleStageLabel = useMemo(() => battleV4StageLabelForNode(run, snapshot?.nodeId), [run, snapshot?.nodeId]);
  const narrativeTrainers = useMemo(() => buildBattleV4NarrativeTrainers(api, run, playerProfile, snapshot?.nodeId), [api, playerProfile, run, snapshot?.nodeId]);
  const introDialogue = useMemo(() => buildBattleV4IntroDialogue(narrativeTrainers, battleStageLabel), [battleStageLabel, narrativeTrainers]);
  const outroDialogue = useMemo(() => buildBattleV4OutroDialogue(narrativeTrainers, snapshot, battleStageLabel), [battleStageLabel, narrativeTrainers, snapshot?.winner]);
  const surrenderParticipants = useMemo<BattleV4SurrenderParticipant[]>(() => {
    const player = run.players.p1;
    const ally = run.scenario.mode === "coop" ? run.players.p3 : null;
    return [
      {id: "p1", name: player?.name || "玩家", avatar: player?.avatar || ""},
      ...(ally ? [{id: "p3", name: ally.name || "AI 队友", avatar: ally.avatar || ""}] : []),
    ];
  }, [run.players.p1, run.players.p3, run.scenario.mode]);

  useEffect(() => {
    setNarrativeState(null);
    setIntroPlayedSessionId("");
    setOutroPlayedSessionId("");
    setOutroFallbackReadySessionId("");
    setSurrenderSettlementSessionId("");
    setSubmittedPlaybackLock(null);
    trainerItemAutoSubmitKeyRef.current = "";
    finalizedSessionRef.current = "";
    if (outroFallbackTimerRef.current !== null) {
      window.clearTimeout(outroFallbackTimerRef.current);
      outroFallbackTimerRef.current = null;
    }
  }, [sessionId]);

  useEffect(() => {
    if (!submittedPlaybackLock || submittedPlaybackLock.sessionId !== sessionId) return;
    if (!snapshot || snapshot.rawLog.length <= submittedPlaybackLock.rawLength || !playback.playbackComplete) return;
    setSubmittedPlaybackLock(null);
  }, [playback.playbackComplete, sessionId, snapshot?.rawLog.length, submittedPlaybackLock]);

  useEffect(() => {
    if (!sessionId || !snapshot || !viewModel) return;
    if (snapshot.status === "ended" || introPlayedSessionId === narrativeSessionKey || narrativeState) return;
    setIntroPlayedSessionId(narrativeSessionKey);
    setNarrativeState({phase: "intro", dialogueIndex: 0, dialogue: introDialogue});
  }, [introDialogue, introPlayedSessionId, narrativeSessionKey, narrativeState, sessionId, snapshot, viewModel]);

  useEffect(() => {
    if (!sessionId || snapshot?.status !== "ended") return;
    const outroReady = !playbackBlockingCommands || (outroFallbackReadySessionId === narrativeSessionKey && !playback.activeAnimation && !playback.pendingBlockingAnimations);
    if (!outroReady) return;
    if (outroPlayedSessionId === narrativeSessionKey || narrativeState) return;
    setOutroPlayedSessionId(narrativeSessionKey);
    setNarrativeState({phase: "outro", dialogueIndex: 0, dialogue: outroDialogue});
  }, [narrativeSessionKey, narrativeState, outroDialogue, outroFallbackReadySessionId, outroPlayedSessionId, playback.activeAnimation, playbackBlockingCommands, sessionId, snapshot?.status]);

  useEffect(() => {
    if (!sessionId || snapshot?.status !== "ended" || outroPlayedSessionId === narrativeSessionKey) {
      if (outroFallbackTimerRef.current !== null) {
        window.clearTimeout(outroFallbackTimerRef.current);
        outroFallbackTimerRef.current = null;
      }
      if (snapshot?.status !== "ended") setOutroFallbackReadySessionId("");
      return;
    }
    if (!playbackBlockingCommands) {
      if (outroFallbackTimerRef.current !== null) {
        window.clearTimeout(outroFallbackTimerRef.current);
        outroFallbackTimerRef.current = null;
      }
      return;
    }
    if (outroFallbackReadySessionId === narrativeSessionKey || outroFallbackTimerRef.current !== null) return;
    outroFallbackTimerRef.current = window.setTimeout(() => {
      outroFallbackTimerRef.current = null;
      setOutroFallbackReadySessionId(narrativeSessionKey);
    }, 12000);
  }, [narrativeSessionKey, outroFallbackReadySessionId, outroPlayedSessionId, playbackBlockingCommands, sessionId, snapshot?.status]);

  useEffect(() => {
    if (!snapshot) return;
    battleDebugLog(debugConfig, "mapping", "showdown-id-pool", {
      used: snapshot.showdownIdPool?.used || [],
      available: snapshot.showdownIdPool?.available || [],
    });
    for (const player of snapshot.players) {
      for (const entry of player.teamMapping || []) {
        battleDebugLog(debugConfig, "mapping", "create-source-map", entry);
      }
    }
  }, [debugConfig, snapshot?.id]);

  useEffect(() => {
    if (!viewModel?.command.request) return;
    battleDebugLog(debugConfig, "request", "normalize-summary", requestDebugSummary(viewModel.command));
  }, [debugConfig, requestResetKey, viewModel?.command.request, viewModel?.command.requestType]);

  useEffect(() => {
    setBattleBagOpen(false);
  }, [requestResetKey]);

  useEffect(() => {
    if (!playbackBlockingCommands) return;
    setPendingMoveAction(null);
  }, [playbackBlockingCommands]);

  useEffect(() => {
    if (!battleError) return;
    setPendingMoveAction(null);
    setSwitchPanelOpen(false);
    setBattleBagOpen(false);
    setPreviewMove(null);
    setCommandMode("command");
    setChoiceStatus(`战斗异常：${battleError.message}`);
    setMessage(`战斗异常：${battleError.message}`);
  }, [battleError?.key]);

  useEffect(() => {
    if (!commandDraft || !commandDraft.isDone || busy || !sessionId) return;
    if (!commandDraft.choices.some(choice => choice.trim().startsWith("traineritem "))) return;
    const split = splitBattleTrainerItemChoicesV4(commandDraft);
    if (!split.trainerItems.length) return;
    const autoSubmitKey = `${sessionId}:${commandDraft.rqid || ""}:${commandDraft.choices.join("|")}`;
    if (trainerItemAutoSubmitKeyRef.current === autoSubmitKey) return;
    trainerItemAutoSubmitKeyRef.current = autoSubmitKey;
    battleDebugLog(debugConfig, "submit", "submit-completed-trainer-item-draft", {
      sessionId,
      choice: split.choice,
      trainerItems: split.trainerItems,
      commandsLocked,
      playbackBlockingCommands,
    });
    if (commandsLocked) {
      console.error("[BattleV4][submit] trainer item draft completed while commands are locked; submitting anyway", {
        sessionId,
        choice: split.choice,
        trainerItems: split.trainerItems,
        commandDraft,
        commandsLocked,
        playbackBlockingCommands,
      });
    }
    void submitChoice(split.choice, split.trainerItems);
  }, [busy, commandDraft, commandsLocked, debugConfig, playbackBlockingCommands, sessionId]);

  useEffect(() => {
    if (!narrativeActive) return;
    setPendingMoveAction(null);
    setSwitchPanelOpen(false);
    setBattleBagOpen(false);
    setBattleStatusOpen(false);
    setPreviewMove(null);
    setSurrenderOpen(false);
  }, [narrativeActive]);

  useEffect(() => {
    if (!surrenderOpen) return;
    setSurrenderRemainingMs(SURRENDER_TIMEOUT_MS);
    setSurrenderSubmitRemainingMs(SURRENDER_SUBMIT_DELAY_MS);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, SURRENDER_TIMEOUT_MS - (Date.now() - startedAt));
      setSurrenderRemainingMs(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        if (!surrenderSubmitting) {
          setSurrenderOpen(false);
          setSurrenderApproved(false);
          setSurrenderAllyApproved(false);
          setChoiceStatus("投降确认超时，继续战斗。");
        }
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [surrenderOpen, surrenderSubmitting]);

  useEffect(() => {
    if (!surrenderOpen || run.scenario.mode !== "coop") return;
    const timer = window.setTimeout(() => setSurrenderAllyApproved(true), 800);
    return () => window.clearTimeout(timer);
  }, [run.scenario.mode, surrenderOpen]);

  useEffect(() => {
    if (!surrenderOpen || surrenderSubmitting || !surrenderApproved) return;
    if (run.scenario.mode === "coop" && !surrenderAllyApproved) return;
    setSurrenderSubmitting(true);
  }, [run.scenario.mode, surrenderAllyApproved, surrenderApproved, surrenderOpen, surrenderSubmitting]);

  useEffect(() => {
    if (!surrenderOpen || !surrenderSubmitting) return;
    setSurrenderSubmitRemainingMs(SURRENDER_SUBMIT_DELAY_MS);
    if (surrenderSubmitTimerRef.current !== null) window.clearTimeout(surrenderSubmitTimerRef.current);
    const startedAt = Date.now();
    const progressTimer = window.setInterval(() => {
      setSurrenderSubmitRemainingMs(Math.max(0, SURRENDER_SUBMIT_DELAY_MS - (Date.now() - startedAt)));
    }, 100);
    surrenderSubmitTimerRef.current = window.setTimeout(() => {
      void submitSurrender();
    }, SURRENDER_SUBMIT_DELAY_MS);
    return () => {
      window.clearInterval(progressTimer);
      if (surrenderSubmitTimerRef.current !== null) {
        window.clearTimeout(surrenderSubmitTimerRef.current);
        surrenderSubmitTimerRef.current = null;
      }
    };
  }, [surrenderOpen, surrenderSubmitting]);

  useEffect(() => () => {
    if (surrenderSubmitTimerRef.current !== null) window.clearTimeout(surrenderSubmitTimerRef.current);
    if (outroFallbackTimerRef.current !== null) window.clearTimeout(outroFallbackTimerRef.current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    async function tick() {
      if (!sessionId) {
        setMessage("缺少战斗 session，请从休息室重新进入。");
        return;
      }
      if (busy) {
        timer = window.setTimeout(tick, 250);
        return;
      }
      try {
        const next = await battleService.getSnapshot(sessionId);
        if (cancelled) return;
        setSnapshot(next);
        const blocking = battleV4BlockingError(next, lastSubmitError);
        setMessage(blocking ? `战斗异常：${blocking.message}` : "");
        const currentRun = runRef.current;
        const patchedRun = next.status === "ended" || next.status === "blocked" ? currentRun : patchBattleRunLocalTeamsFromSnapshot(currentRun, next);
        if (!cancelled && patchedRun !== currentRun) onRunChangeRef.current(patchedRun);
        if (next.status === "ended" || next.status === "blocked") {
          if (finalizedSessionRef.current === sessionId) return;
          finalizedSessionRef.current = sessionId;
          return;
        }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "Battle Service 连接失败。");
      }
      timer = window.setTimeout(tick, 700);
    }
    void tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [battleService, busy, sessionId]);

  useEffect(() => {
    let cancelled = false;
    if (!snapshot || !sessionId) {
      setPlaybackTimeline(null);
      return;
    }
    const previousIndex = playbackTimeline?.sessionId === sessionId ? playbackTimeline.rawTo : 0;
    if (snapshot.rawLog.length <= previousIndex && playbackTimeline?.sessionId === sessionId) return;
    setPlaybackTimelinePending(true);
    setPlaybackTimelineUnavailable(false);
    battleService.getPlaybackTimeline(sessionId, previousIndex)
      .then(timeline => {
        if (cancelled) return;
        setPlaybackTimelineUnavailable(false);
        setPlaybackTimeline(current => {
          if (!current || current.sessionId !== sessionId || previousIndex === 0) return timeline;
          return {
            ...timeline,
            rawFrom: current.rawFrom,
            groups: [...current.groups, ...timeline.groups],
            debug: {
              ...timeline.debug,
              calls: [...current.debug.calls, ...timeline.debug.calls].slice(-400),
            },
          };
        });
      })
      .catch(error => {
        if (!cancelled) setPlaybackTimelineUnavailable(true);
        battleDebugLog(debugConfig, "error", "playback-timeline-failed", {
          sessionId,
          previousIndex,
          rawLogLength: snapshot.rawLog.length,
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        if (!cancelled) setPlaybackTimelinePending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [battleService, debugConfig, playbackTimeline?.rawTo, playbackTimeline?.sessionId, sessionId, snapshot?.id, snapshot?.rawLog.length]);

  function reportSubmitError(input: {
    reason: string;
    choice: string;
    trainerItems: ReturnType<typeof splitBattleTrainerItemChoicesV4>["trainerItems"];
    error?: unknown;
    draftBefore?: BattleCommandDraftV4;
    draftAfter?: BattleCommandDraftV4;
    finalChoice?: string;
  }) {
    const payload: BattleSubmitErrorV4 = {
      at: new Date().toISOString(),
      reason: input.reason,
      sessionId: sessionId || "",
      playerId: "p1",
      choice: input.choice,
      trainerItems: input.trainerItems,
      busy,
      commandsLocked,
      playbackBlockingCommands,
      commandDraft,
      normalizedRequest: viewModel?.command.normalizedRequest || null,
      draftBefore: input.draftBefore,
      draftAfter: input.draftAfter,
      finalChoice: input.finalChoice,
      error: input.error instanceof Error ? input.error.message : input.error ? String(input.error) : undefined,
    };
    setLastSubmitError(payload);
    console.error(`[BattleV4][submit] p1 指令提交失败：${input.reason}`, payload);
    battleDebugLog(debugConfig, "error", "submit-choice-failed", payload);
  }

  function logSubmitInfo(label: string, payload: Record<string, unknown>) {
    console.info(`[BattleV4][submit] ${label}`, {
      playerId: "p1",
      sessionId: sessionId || "",
      ...payload,
    });
  }

  async function submitChoice(choice: string, trainerItems: ReturnType<typeof splitBattleTrainerItemChoicesV4>["trainerItems"] = []) {
    if (!choice) {
      reportSubmitError({reason: "empty-choice", choice, trainerItems});
      return;
    }
    if (!sessionId) {
      reportSubmitError({reason: "missing-session-id", choice, trainerItems});
      return;
    }
    if (busy) {
      reportSubmitError({reason: "submit-busy", choice, trainerItems});
      return;
    }
    logSubmitInfo("p1 提交了指令", {
      choice,
      trainerItems,
      commandsLocked,
      playbackBlockingCommands,
    });
    battleDebugLog(debugConfig, "submit", "submit-choice", {
      sessionId,
      playerId: "p1",
      choice,
      trainerItems,
      commandDraft,
      commandsLocked,
      playbackBlockingCommands,
    });
    setLastSubmitError(null);
    setBusy(true);
    setSubmittedPlaybackLock({sessionId, rawLength: snapshot?.rawLog.length || 0});
    setChoiceStatus(`提交中：${choice}`);
    setMessage(`提交指令：${choice}`);
    try {
      const submitted = trainerItems.length
        ? await battleService.submitTrainerItem({sessionId, playerId: "p1", choice, trainerItems})
        : await battleService.submitChoice(sessionId, "p1", choice);
      const next = onAfterSubmitSnapshot ? await onAfterSubmitSnapshot(submitted) : submitted;
      setSnapshot(next);
      clearCommandDraft();
      setSwitchPanelOpen(false);
      const blocking = battleV4BlockingError(next, null);
      if (blocking) {
        setPendingMoveAction(null);
        setBattleBagOpen(false);
        setPreviewMove(null);
        setChoiceStatus(`战斗异常：${blocking.message}`);
        setMessage(`战斗异常：${blocking.message}`);
      } else {
        setChoiceStatus(`提交成功：${choice}`);
        setMessage("");
      }
      logSubmitInfo("p1 指令提交成功", {
        choice,
        trainerItems,
        nextStatus: next.status,
        nextTurn: next.turn,
        rawLogLength: next.rawLog.length,
      });
      battleDebugLog(debugConfig, "snapshot", "after-submit", snapshotDebugSummary(next));
    } catch (error) {
      reportSubmitError({reason: trainerItems.length ? "submit-trainer-item-threw" : "submit-choice-threw", choice, trainerItems, error});
      setMessage(error instanceof Error ? error.message : "提交指令失败。");
    } finally {
      setBusy(false);
    }
  }

  async function submitSurrender() {
    if (!sessionId) {
      onBattleComplete?.({sessionId: "", reason: "surrender"});
      return;
    }
    setChoiceStatus("投降已确认，正在结束战斗...");
    try {
      const next = await battleService.submitChoice(sessionId, "p1", "forfeit");
      setSnapshot(next);
      if (next.status === "ended" || next.status === "blocked") {
        finalizedSessionRef.current = sessionId;
        setSurrenderSettlementSessionId(sessionId);
        setSurrenderOpen(false);
        setSurrenderSubmitting(false);
        setSurrenderSubmitRemainingMs(SURRENDER_SUBMIT_DELAY_MS);
        setSurrenderApproved(false);
        setSurrenderAllyApproved(false);
        setChoiceStatus("投降已确认。");
        setMessage("");
        return;
      }
    } catch (error) {
      battleDebugLog(debugConfig, "error", "surrender-forfeit-failed", {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    onBattleComplete?.({sessionId, reason: "surrender"});
  }

  function openSurrenderDialog() {
    if ((!onBattleComplete && endFlow !== "auto-exit") || snapshot?.status === "ended" || narrativeActive) return;
    setSurrenderApproved(false);
    setSurrenderAllyApproved(run.scenario.mode !== "coop");
    setSurrenderRemainingMs(SURRENDER_TIMEOUT_MS);
    setSurrenderSubmitRemainingMs(SURRENDER_SUBMIT_DELAY_MS);
    setSurrenderSubmitting(false);
    if (surrenderSubmitTimerRef.current !== null) {
      window.clearTimeout(surrenderSubmitTimerRef.current);
      surrenderSubmitTimerRef.current = null;
    }
    setSurrenderOpen(true);
  }

  function advanceNarrative() {
    if (!narrativeState) return;
    const lineCount = Math.max(1, narrativeState.dialogue.entries?.length || narrativeState.dialogue.lines.length);
    if (narrativeState.dialogueIndex < lineCount - 1) {
      setNarrativeState(current => current ? {...current, dialogueIndex: current.dialogueIndex + 1} : current);
      return;
    }
    const phase = narrativeState.phase;
    setNarrativeState(null);
    if (phase === "outro" && endFlow === "auto-exit") {
      onBattleComplete?.({sessionId, reason: surrenderSettlementSessionId === sessionId ? "surrender" : undefined});
      if (onBattleComplete) return;
      onBackToRest();
    }
  }

  function draftMoveAction(action: MoveActionV4, selectedSpecial?: BattleSpecialChoiceV4 | null) {
    if (!viewModel) return;
    const displaySpecial = selectedSpecial || activeMaxDisplaySpecialForAction(action, visualNearTeam, viewModel.nearTeam);
    const commandSpecial = displaySpecial === "active-max" ? null : selectedSpecial || null;
    const displayedMove = displayedMoveForSpecial(action.move, displaySpecial);
    draftCommandMoveAction(action, {
      selectedSpecial,
      commandSpecial,
      displayedMove,
    });
  }

  function undoDraftChoice() {
    undoCommandChoice();
    setBattleBagOpen(false);
  }

  return (
    <section className={`battle-v4-page${narrativePhaseClass}`}>
      <BattleArena
        near={visualNearTeam}
        far={visualFarTeam}
        commandActiveIndex={viewModel?.command.activeIndex || 0}
        messagebar={playbackMessage}
        activeAnimation={playback.activeAnimation}
        openingSwitchInSeats={playback.openingSwitchInSeats}
        activeTimelineStep={playback.activeTimelineStep}
        renderedTimelineHandles={playback.renderedTimelineHandles}
        persistentFieldVisuals={playback.persistentFieldVisuals}
        persistentSideConditionVisuals={playback.persistentSideConditionVisuals}
        commentaryItems={playback.commentaryItems}
        api={api}
      />
      <header className="battle-v4-hud">
        <button type="button" onClick={() => setBattleStatusOpen(true)} disabled={!snapshot}>场地状态</button>
        <button type="button" onClick={() => exportBattleV4Diagnostics(snapshot, commandDraft, playback.debug, lastSubmitError, diagnosticsContext, {pendingMoveAction, visualNearTeam, visualFarTeam})} disabled={!snapshot}>导出诊断</button>
        {canSurrender ? <button className="danger" type="button" onClick={openSurrenderDialog} disabled={!snapshot || surrenderOpen || narrativeActive}>投降</button> : null}
      </header>
      {!commandsLocked && !battleError ? (
        <BattleCommandDock
          api={api}
          viewModel={viewModel}
          visualNearTeam={visualNearTeam}
          visualFarTeam={visualFarTeam}
          snapshot={snapshot}
          busy={busy}
          message={message}
          actions={viewModel?.command.actions || []}
          mode={viewModel?.mode || "singles"}
          requestType={viewModel?.command.requestType || "none"}
          commandMode={commandMode}
          onCommandModeChange={setCommandMode}
          onOpenSwitch={() => setSwitchPanelOpen(true)}
          battleBag={activeBattleBag}
          battleBagEnabled={battleBagEnabled}
          battleBagOpen={battleBagOpen}
          onOpenBattleBag={() => {
            if (!battleBagEnabled) {
              setChoiceStatus("当前对局偏好已关闭战斗背包。");
              setBattleBagOpen(false);
              return;
            }
            setBattleBagOpen(value => !value);
          }}
          canUndoChoice={canUndoBattleCommandChoice(commandDraft, viewModel?.command.normalizedRequest || null)}
          onUndoChoice={undoDraftChoice}
          onSubmit={applyDraftChoice}
          onMoveDraft={draftMoveAction}
          onPreviewMove={setPreviewMove}
          onUnavailableSpecial={setChoiceStatus}
        />
      ) : null}
      {!commandsLocked && !battleError && pendingMoveAction && viewModel ? (
        <BattleV4TargetPanel
          api={api}
          viewModel={viewModel}
          visualNearTeam={visualNearTeam}
          visualFarTeam={visualFarTeam}
          action={pendingMoveAction}
          onClose={() => setPendingMoveAction(null)}
          moveNeedsSubmittedTarget={moveNeedsSubmittedTarget}
          onSelectTarget={(action, choiceSuffix, shouldUseTargetSuffix) => applyMoveTarget(action, choiceSuffix, shouldUseTargetSuffix)}
        />
      ) : null}
      {battleError ? (
        <BattleV4ErrorPanel
          error={battleError}
          onExport={() => exportBattleV4Diagnostics(snapshot, commandDraft, playback.debug, lastSubmitError, diagnosticsContext, {pendingMoveAction, visualNearTeam, visualFarTeam})}
        />
      ) : null}
      {shouldShowSwitchPanel && !battleError && snapshot && viewModel ? (
        <BattleV4SwitchPanel
          api={api}
          snapshot={snapshot}
          request={viewModel.command.normalizedRequest}
          pokemonBattleOBJ={pokemonBattleOBJ}
          switchActions={viewModel.command.switchActions}
          forceSwitch={viewModel.command.requestType === "switch"}
          busy={busy}
          debugConfig={debugConfig}
          onOpenStatus={() => setBattleStatusOpen(true)}
          onClose={() => setSwitchPanelOpen(false)}
          onConfirm={applyDraftChoice}
        />
      ) : null}
      {!commandsLocked && !battleError && battleBagEnabled && battleBagOpen ? (
        <BattleV4BagPanel
          api={api}
          bag={activeBattleBag}
          snapshot={snapshot}
          request={viewModel?.command.normalizedRequest || null}
          pokemonBattleOBJ={pokemonBattleOBJ}
          commandDraft={commandDraft}
          onClose={() => setBattleBagOpen(false)}
          onUnavailable={setChoiceStatus}
          onSubmitItemChoice={applyDraftChoice}
        />
      ) : null}
      {choiceStatus ? <BattleV4GlobalNotice message={choiceStatus} /> : null}
      {shouldShowResultPanel && snapshot ? (
        <div className="battle-v4-result-panel">
          <strong>{snapshot.winner === "p1" || snapshot.winner === "p3" ? "训练胜利" : "训练失败"}</strong>
          <span>节点状态已回写，返回休息室查看下一场。</span>
          <button type="button" onClick={onBackToRest}>返回休息室</button>
        </div>
      ) : null}
      {battleStatusOpen ? (
        <BattleV4StatusModal
          snapshot={snapshot}
          slots={[...visualNearTeam, ...visualFarTeam]}
          api={api}
          onClose={() => setBattleStatusOpen(false)}
        />
      ) : null}
      {previewMove ? (
        <BattleV4MovePreviewModal
          api={api}
          move={previewMove}
          initialMode={viewModel?.mode === "singles" ? "singles" : "doubles"}
          onClose={() => setPreviewMove(null)}
        />
      ) : null}
      {surrenderOpen ? (
        <BattleV4SurrenderPanel
          participants={surrenderParticipants}
          approvedIds={new Set([
            ...(surrenderApproved ? ["p1"] : []),
            ...(surrenderAllyApproved ? ["p3"] : []),
          ])}
          remainingMs={surrenderRemainingMs}
          durationMs={SURRENDER_TIMEOUT_MS}
          submitRemainingMs={surrenderSubmitRemainingMs}
          submitDurationMs={SURRENDER_SUBMIT_DELAY_MS}
          submitting={surrenderSubmitting}
          onConfirm={() => setSurrenderApproved(true)}
          onCancel={() => {
            if (surrenderSubmitting) return;
            setSurrenderOpen(false);
            setSurrenderApproved(false);
            setSurrenderAllyApproved(false);
          }}
        />
      ) : null}
      {narrativeState ? (
        <BattleV4TrainerNarrativeOverlay
          phase={narrativeState.phase}
          trainers={narrativeTrainers}
          dialogue={narrativeState.dialogue}
          dialogueIndex={narrativeState.dialogueIndex}
          onAdvance={advanceNarrative}
        />
      ) : null}
    </section>
  );
}

function BattleV4GlobalNotice({message}: {message: string}) {
  return (
    <div className="battle-v4-global-notice" role="status" aria-live="polite">
      {message}
    </div>
  );
}

function buildBattleV4NarrativeTrainers(
  api: ChangeBattleV2Api,
  run: TrainingRunGameV4,
  playerProfile?: Pick<UserProfileV2, "name" | "frontAsset" | "frontGifAsset" | "backAsset" | "avatarAsset">,
  battleNodeId?: string,
): BattleV4ResolvedNarrativeTrainer[] {
  const node = (battleNodeId ? run.gameMap.find(entry => entry.id === battleNodeId) : null) || api.getCurrentTrainingNode(run);
  const playerIds: ShowdownPlayerIdV4[] = run.scenario.mode === "coop" ? ["p1", "p3", "p2", "p4"] : ["p1", "p2"];
  return playerIds.map(playerId => {
    const draft = node?.participants[playerId] || run.players[playerId] || run.scenario.players.find(player => player.playerId === playerId) || null;
    const detail = playerId === "p1" ? null : resolveBattleV4TrainerDetail(api, run, node?.index ?? 0, playerId, draft);
    const side = playerId === "p1" || playerId === "p3" ? "near" : "far";
    const isPlayer = playerId === "p1";
    const name = isPlayer
      ? playerProfile?.name || draft?.name || "玩家"
      : detail?.nameZh || draft?.name || (playerId === "p3" ? "AI 队友" : "训练家");
    const title = isPlayer
      ? "玩家"
      : detail?.trainerTypeLabel || (playerId === "p3" ? "AI 队友" : "挑战者");
    const isNearSide = playerId === "p1" || playerId === "p3";
    const image = isPlayer
      ? playerProfile?.backAsset || draft?.backImage || playerProfile?.frontGifAsset || playerProfile?.frontAsset || playerProfile?.avatarAsset || draft?.avatar || ""
      : isNearSide
        ? draft?.backImage || draft?.avatar || detail?.frontGifAsset || detail?.frontAsset || detail?.avatarAsset || ""
        : detail?.frontGifAsset || detail?.frontAsset || detail?.avatarAsset || draft?.avatar || "";
    return {playerId, name, title, image, side, detail, draft};
  });
}

function resolveBattleV4TrainerDetail(
  api: ChangeBattleV2Api,
  run: TrainingRunGameV4,
  nodeIndex: number,
  playerId: ShowdownPlayerIdV4,
  draft: TrainingPlayerDraftV4 | null,
): DexTrainerDetail | null {
  const selected = safeTrainerDetail(api, run.scenario.selectedNpcIds?.[playerId]);
  if (selected && (nodeIndex === 0 || !draft || trainerDetailMatchesDraft(selected, draft))) return selected;
  if (draft?.name) return findAuthoredTrainerDetailByName(api, draft.name);
  return selected && battleV4TrainerUsesAuthoredDialogue(selected) ? selected : null;
}

function trainerDetailMatchesDraft(detail: DexTrainerDetail, draft: TrainingPlayerDraftV4): boolean {
  const draftName = normalizeNarrativeName(draft.name);
  return Boolean(draftName && (normalizeNarrativeName(detail.nameZh) === draftName || normalizeNarrativeName(detail.name) === draftName));
}

function findAuthoredTrainerDetailByName(api: ChangeBattleV2Api, name: string): DexTrainerDetail | null {
  const normalized = normalizeNarrativeName(name);
  if (!normalized) return null;
  try {
    const rows = api.searchDex({category: "trainers", query: name, limit: 20}).rows;
    for (const row of rows) {
      if (row.category !== "trainers") continue;
      const detail = safeTrainerDetail(api, row.id);
      if (!detail || !battleV4TrainerUsesAuthoredDialogue(detail)) continue;
      if (normalizeNarrativeName(detail.nameZh) === normalized || normalizeNarrativeName(detail.name) === normalized) return detail;
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeNarrativeName(value: string | undefined): string {
  return (value || "").trim().toLowerCase();
}

function buildBattleV4IntroDialogue(trainers: BattleV4ResolvedNarrativeTrainer[], stageLabel: string): BattleV4NarrativeDialogue {
  const trainer = firstEnemyNarrativeTrainer(trainers) || trainers[0] || fallbackNarrativeTrainer();
  const referee = battleV4RefereeTrainer();
  const nearNames = trainers.filter(item => item.side === "near").map(item => item.name).filter(Boolean);
  const farNames = trainers.filter(item => item.side === "far").map(item => item.name).filter(Boolean);
  const matchup = `${nearNames.join("、") || "玩家"}选手 对阵 ${farNames.join("、") || trainer.name}选手`;
  const lines = collectBossTrainerDialogueLines(trainer.detail, "intro", ["first_meeting", "default", "rematch"], 2);
  const entries = [
    {trainer: referee, text: `现在开始${stageLabel}，对战双方是：${matchup}。双方准备完毕，比赛开始！`},
    ...(lines.length ? lines : [`${trainer.name} 前来挑战！`]).map(text => ({trainer, text})),
  ];
  return {
    trainer,
    lines: entries.map(entry => entry.text),
    entries,
  };
}

function buildBattleV4OutroDialogue(trainers: BattleV4ResolvedNarrativeTrainer[], snapshot: BattleSessionSnapshotV4 | null, stageLabel: string): BattleV4NarrativeDialogue {
  const trainer = firstEnemyNarrativeTrainer(trainers) || trainers[0] || fallbackNarrativeTrainer();
  const referee = battleV4RefereeTrainer();
  const playerWon = battleV4PlayerWon(snapshot);
  const winner = battleV4WinnerTrainerName(trainers, snapshot) || (playerWon ? "玩家" : trainer.name);
  const fainted = battleV4LastFaintedPokemonName(snapshot) || "最后一只宝可梦";
  const kind: keyof DexTrainerDetail["dialogues"][string][number] = playerWon ? "defeat" : "victory";
  const states = playerWon
    ? ["after_player_win", "default", "rematch", "first_meeting"]
    : ["after_player_loss", "default", "rematch", "first_meeting"];
  const lines = collectBossTrainerDialogueLines(trainer.detail, kind, states, 2);
  const entries = [
    {trainer: referee, text: `${fainted}失去战斗能力！${stageLabel}的胜利者是 ${winner} 选手！`},
    ...(lines.length ? lines : [playerWon ? "这场战斗，是你赢了。" : "这场胜利，我就收下了。"]).map(text => ({trainer, text})),
  ];
  return {
    trainer,
    lines: entries.map(entry => entry.text),
    entries,
  };
}

function battleV4RefereeTrainer(): BattleV4ResolvedNarrativeTrainer {
  return {
    playerId: "p2",
    name: "裁判",
    title: "赛事裁判",
    image: BATTLE_V4_REFEREE_PORTRAIT,
    side: "far",
    isReferee: true,
    detail: null,
    draft: null,
  };
}

function battleV4StageLabelForNode(run: TrainingRunGameV4, nodeId?: string): string {
  const node = (nodeId ? run.gameMap.find(entry => entry.id === nodeId) : null) || run.gameMap.find(entry => entry.id === run.currentNodeId) || null;
  return formalRoundStageLabelV4(node?.index ?? 0);
}

function battleV4NarrativeSessionKey(sessionId: string): string {
  return `${sessionId}:${BATTLE_V4_NARRATIVE_FLOW_VERSION}`;
}

function battleV4WinnerTrainerName(trainers: BattleV4ResolvedNarrativeTrainer[], snapshot: BattleSessionSnapshotV4 | null): string {
  const winner = snapshot?.winner;
  if (!winner) return "";
  return trainers.find(trainer => trainer.playerId === winner)?.name || "";
}

function battleV4LastFaintedPokemonName(snapshot: BattleSessionSnapshotV4 | null): string {
  const line = [...(snapshot?.rawLog || [])].reverse().find(entry => entry.startsWith("|faint|"));
  if (!line) return "";
  const ident = line.split("|")[2] || "";
  return normalizeProtocolDisplayName(ident.replace(/^p[1-4][a-z]?:\s*/i, ""));
}

function firstEnemyNarrativeTrainer(trainers: BattleV4ResolvedNarrativeTrainer[]): BattleV4ResolvedNarrativeTrainer | undefined {
  return trainers.find(trainer => trainer.side === "far");
}

function fallbackNarrativeTrainer(): BattleV4ResolvedNarrativeTrainer {
  return {
    playerId: "p2",
    name: "训练家",
    title: "挑战者",
    image: "",
    side: "far",
    detail: null,
    draft: null,
  };
}

function safeTrainerDetail(api: ChangeBattleV2Api, trainerId: string | undefined): DexTrainerDetail | null {
  if (!trainerId) return null;
  try {
    return api.getTrainerDetail(trainerId);
  } catch {
    return null;
  }
}

function collectBossTrainerDialogueLines(
  detail: DexTrainerDetail | null,
  kind: keyof DexTrainerDetail["dialogues"][string][number],
  states: string[],
  limit: number,
): string[] {
  if (!detail || !battleV4TrainerUsesAuthoredDialogue(detail)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const state of states) {
    for (const line of detail.dialogues[state] || []) {
      for (const text of line[kind] || []) {
        const normalized = text.trim();
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        result.push(normalized);
        if (result.length >= limit) return result;
      }
    }
  }
  return result;
}

function battleV4TrainerUsesAuthoredDialogue(detail: DexTrainerDetail): boolean {
  return Boolean(detail.isBoss || detail.trainerType === "gym" || detail.trainerType === "elite4" || detail.trainerType === "champion" || detail.trainerType === "villain");
}

function battleV4PlayerWon(snapshot: BattleSessionSnapshotV4 | null): boolean {
  return snapshot?.winner === "p1" || snapshot?.winner === "p3";
}

function BattleArena({near, far, commandActiveIndex = 0, messagebar, activeAnimation, openingSwitchInSeats = [], activeTimelineStep, renderedTimelineHandles = [], persistentFieldVisuals, persistentSideConditionVisuals, commentaryItems, api}: {
  near: BattleViewSlotV4[];
  far: BattleViewSlotV4[];
  commandActiveIndex?: number;
  messagebar?: string;
  activeAnimation?: BattleAnimationEventV4 | null;
  openingSwitchInSeats?: BattleProtocolSeatV4[];
  activeTimelineStep?: ShowdownAnimationStepV4 | null;
  renderedTimelineHandles?: BattleV4ScheduledTimelineStep[];
  persistentFieldVisuals: BattleV4PersistentFieldVisuals;
  persistentSideConditionVisuals: BattleV4PersistentSideConditionVisuals;
  commentaryItems: BattleV4VisibleCommentaryEntry[];
  api: ChangeBattleV2Api;
}) {
  const nearSlots = useMemo(() => sortSlotsForArena(near, "near"), [near]);
  const farSlots = useMemo(() => sortSlotsForArena(far, "far"), [far]);
  const visuals = useMemo(() => getBattleV4ActiveTimelineVisuals(activeAnimation || null, activeTimelineStep || null), [activeAnimation, activeTimelineStep]);
  const fxVisuals = useMemo(() => getBattleV4ActiveTimelineFxVisuals(activeAnimation || null, [], renderedTimelineHandles), [activeAnimation, renderedTimelineHandles]);
  const resultVisuals = useMemo(() => getBattleV4ActiveTimelineResultVisuals(activeAnimation || null, activeTimelineStep || null, renderedTimelineHandles), [activeAnimation, activeTimelineStep, renderedTimelineHandles]);
  const actorVisuals = useMemo(() => getBattleV4ActiveTimelineActorVisuals(activeAnimation || null, activeTimelineStep || null, renderedTimelineHandles), [activeAnimation, activeTimelineStep, renderedTimelineHandles]);
  return (
    <div className="battle-v4-arena" aria-label="战斗场地">
      <div className="battle-v4-scene-overlay" />
      <BattleV4PersistentFieldLayer visuals={persistentFieldVisuals} />
      <BattleV4SideConditionLayer visuals={persistentSideConditionVisuals} />
      <BattleV4WeatherBurstLayer animation={activeAnimation || null} visuals={visuals} />
      <BattleV4CommentaryPanel items={commentaryItems} />
      <BattleV4FxLayer animation={activeAnimation || null} visuals={visuals} fxVisuals={fxVisuals} />
      <div className="battle-v4-enemy-panels">
        {farSlots.map(slot => <BattleHpPanel api={api} slot={slot} compact key={`${slot.playerId}-${slot.position}-hp`} />)}
      </div>
      <div className="battle-v4-player-panels">
        {nearSlots.map((slot, index) => <BattleHpPanel api={api} slot={slot} current={slot.active} commanding={index === commandActiveIndex} key={`${slot.playerId}-${slot.position}-hp`} />)}
      </div>
      <div className="battle-v4-model-layer">
        {farSlots.map(slot => <BattlePokemonSlot api={api} slot={slot} animation={activeAnimation || null} openingSwitchInSeats={openingSwitchInSeats} visuals={visuals} actorVisuals={actorVisuals} key={`${slot.playerId}-${slot.position}`} />)}
        {nearSlots.map((slot, index) => <BattlePokemonSlot api={api} slot={slot} commanding={index === commandActiveIndex} animation={activeAnimation || null} openingSwitchInSeats={openingSwitchInSeats} visuals={visuals} actorVisuals={actorVisuals} key={`${slot.playerId}-${slot.position}`} />)}
      </div>
    </div>
  );
}

function BattleV4CommentaryPanel({items}: {items: BattleV4VisibleCommentaryEntry[]}) {
  if (!items.length) return null;
  return (
    <aside className="battle-v4-commentary" role="log" aria-live="polite" aria-relevant="additions text">
      {items.map((item, index) => item ? (
        <article className={`battle-v4-commentary-item tone-${item.tone}${index === 0 ? " latest" : ""}`} key={`${item.id}:${item.shownAt}`}>
          <strong>{item.speaker}</strong>
          <p>{item.text}</p>
        </article>
      ) : null)}
    </aside>
  );
}

function sortSlotsForArena(slots: BattleViewSlotV4[], side: "near" | "far"): BattleViewSlotV4[] {
  return [...slots].sort((a, b) => {
    const aRank = a.position === "B" ? 1 : 0;
    const bRank = b.position === "B" ? 1 : 0;
    return side === "far" ? bRank - aRank : aRank - bRank;
  });
}

function BattleV4SideConditionLayer({visuals}: {visuals: BattleV4PersistentSideConditionVisuals}) {
  const all = [...visuals.far, ...visuals.near];
  if (!all.length) return null;
  return (
    <div className="battle-v4-side-condition-layer" aria-hidden="true">
      <BattleV4SideConditionGroup side="far" items={visuals.far} />
      <BattleV4SideConditionGroup side="near" items={visuals.near} />
    </div>
  );
}

function BattleV4SideConditionGroup({side, items}: {side: "near" | "far"; items: BattleV4SideConditionVisualV4[]}) {
  if (!items.length) return null;
  return (
    <div className={`battle-v4-side-condition-group side-${side}`}>
      {items.map(item => (
        <span className={`condition-${item.id}`} key={`${item.side}-${item.id}`}>
          {item.label}
        </span>
      ))}
    </div>
  );
}

function BattleV4PersistentFieldLayer({visuals}: {visuals: BattleV4PersistentFieldVisuals}) {
  const activeId = visuals.weatherId || visuals.terrainId || visuals.roomId || (visuals.gravityActive ? "gravity" : "");
  if (!activeId || !visuals.resourcePath) return null;
  const resourceKey = `${activeId}:${visuals.resourceKind}:${visuals.resourcePath}`;
  return (
    <div key={resourceKey} className={`battle-v4-persistent-field-layer field-${activeId} fidelity-${visuals.adapterFidelity}`} aria-hidden="true">
      {visuals.resourceKind === "video" ? (
        <video key={resourceKey} muted autoPlay loop playsInline>
          <source src={visuals.resourcePath} type="video/webm" />
          <source src={visuals.resourcePath.replace(/\.webm$/i, ".mp4")} type="video/mp4" />
        </video>
      ) : (
        <i key={resourceKey} style={{backgroundImage: `url("${visuals.resourcePath}")`}} />
      )}
    </div>
  );
}

function BattleV4WeatherBurstLayer({animation, visuals}: {animation: BattleAnimationEventV4 | null; visuals: BattleV4TimelineVisuals}) {
  if (!visuals.background.visible) return null;
  const style = {
    "--battle-v4-background-color": visuals.background.color,
    "--battle-v4-background-opacity": String(visuals.background.opacity),
    "--battle-v4-background-duration": `${visuals.background.durationMs}ms`,
  } as CSSProperties;
  return (
    <div className={`battle-v4-weather-layer weather-${visuals.background.weatherId || animation?.weatherId || "effect"}`} style={style} aria-hidden="true">
      <span>{visuals.background.label}</span>
    </div>
  );
}

function BattleV4ResultLayer({animation, visuals, resultVisuals, api}: {animation: BattleAnimationEventV4 | null; visuals: BattleV4TimelineVisuals; resultVisuals: BattleV4TimelineResultVisual[]; api: ChangeBattleV2Api}) {
  if (!animation) return null;
  const activeResults = resultVisuals.length ? resultVisuals : visuals.result.visible ? [{...visuals.result, key: "active", animation}] : [];
  if (!activeResults.length) return null;
  return (
    <>
      {activeResults.map(result => {
        const event = result.animation || animation;
        const text = localizeBattleV4ResultText(result.text, event, api);
        if (!text) return null;
        const seat = result.targetSeat || event.targetSeat || event.actorSeat;
        const targetClass = visualSeatClassForSeat(seat, "target-center");
        return (
          <div className={`battle-v4-result-pop ${targetClass} tone-${result.tone || "neutral"} kind-${result.kind || event.kind}`} aria-hidden="true" key={result.key}>
            {text}
          </div>
        );
      })}
    </>
  );
}

function BattleV4Messagebar({message, kind}: {message: string; kind: string}) {
  if (!message) return null;
  return (
    <div className={`battle-v4-messagebar kind-${kind || "message"}`} role="status">
      <span>{message}</span>
    </div>
  );
}

function BattleV4FxLayer({animation, visuals, fxVisuals}: {animation: BattleAnimationEventV4 | null; visuals: BattleV4TimelineVisuals; fxVisuals: BattleV4TimelineFxVisual[]}) {
  if (!animation) return null;
  const activeFx = fxVisuals.length ? fxVisuals : visuals.fx.visible ? [{...visuals.fx, key: "active"}] : [];
  if (!activeFx.length) return null;
  return (
    <>
      {activeFx.map(fx => {
        const targetClass = visualSeatClassForSeat(fx.targetSeat || animation.actorSeat, "target-center");
        return (
          <div className={`battle-v4-fx-layer ${targetClass} kind-${fx.kind || animation.kind} ${fx.className}`} aria-hidden="true" key={fx.key}>
            <i className="battle-v4-fx-sprite" style={fx.style} />
          </div>
        );
      })}
    </>
  );
}

function BattlePokemonSlot({api, slot, commanding = false, animation, openingSwitchInSeats = [], visuals, actorVisuals = []}: {api: ChangeBattleV2Api; slot: BattleViewSlotV4; commanding?: boolean; animation?: BattleAnimationEventV4 | null; openingSwitchInSeats?: BattleProtocolSeatV4[]; visuals: BattleV4TimelineVisuals; actorVisuals?: BattleV4TimelineActorVisual[]}) {
  const timelineActor = [...actorVisuals].reverse().find(actor => actor.seat === slot.seat) || (visuals.actor?.seat === slot.seat ? visuals.actor : null);
  const animationClass = timelineActor?.className || (openingSwitchInSeats.includes(slot.seat as BattleProtocolSeatV4) ? "anim-switch-in" : battlePokemonAnimationClass(slot.seat, animation || null));
  const statChange = statChangeVisualForSlot(slot.seat as BattleProtocolSeatV4, animation || null);
  const specialClass = slot.dynamaxActive ? "special-dynamax" : slot.terastallized ? "special-tera" : "";
  const displayName = battleSlotDisplayName(slot, api);
  const twoTurnState = (slot as BattleV4VisibleSlot).twoTurnMoveState;
  const substituteActive = Boolean((slot as BattleV4VisibleSlot).substituteActive);
  return (
    <article className={`battle-v4-pokemon ${slot.side} ${slot.position.toLowerCase()} species-${toId(slot.speciesId)} ${commanding ? "commanding" : ""} ${slot.fainted ? "fainted" : ""} ${specialClass} ${animationClass}`} style={timelineActor?.style}>
      <ImageWithFallback src={slot.spriteUrl || slot.iconUrl} alt={displayName} />
      {twoTurnState ? (
        <span className={`battle-v4-two-turn-marker tone-${twoTurnState.tone}`} title={twoTurnState.moveName}>
          {twoTurnState.label}
        </span>
      ) : null}
      {substituteActive ? <span className="battle-v4-substitute-marker" title="替身">替身</span> : null}
      {statChange ? <BattleV4StatChangeBurst visual={statChange} /> : null}
    </article>
  );
}

function BattleV4StatChangeBurst({visual}: {visual: {direction: "up" | "down" | "neutral"; label: string; amount: number}}) {
  if (visual.direction === "neutral") return null;
  const particles = Array.from({length: Math.max(4, Math.min(8, visual.amount + 4))});
  return (
    <div className={`battle-v4-stat-burst ${visual.direction}`} aria-hidden="true">
      <span className="battle-v4-stat-label">{visual.label}</span>
      {particles.map((_, index) => <i key={index} style={{"--particle-index": index} as CSSProperties} />)}
    </div>
  );
}

function statChangeVisualForSlot(seat: BattleProtocolSeatV4, animation: BattleAnimationEventV4 | null): {direction: "up" | "down" | "neutral"; label: string; amount: number} | null {
  if (!animation || animation.kind !== "statChange" || !seat || animation.targetSeat !== seat) return null;
  const direction = animation.resultTone === "bad" ? "down" : animation.resultTone === "good" ? "up" : "neutral";
  const amount = Math.max(1, (animation.resultText.match(/[↑↓]/g) || []).length || 1);
  return {direction, label: animation.resultText, amount};
}

function battlePokemonAnimationClass(seat: BattleProtocolSeatV4, animation: BattleAnimationEventV4 | null): string {
  if (!animation || !seat) return "";
  if (animation.kind === "moveStart" && animation.actorSeat === seat) return "anim-move-start";
  if (animation.kind === "moveEffect" && animation.actorSeat === seat) return "anim-move-cast";
  if (animation.kind === "ability" && animation.actorSeat === seat) return "anim-ability";
  if (animation.kind === "weather" && animation.actorSeat === seat) return "anim-ability";
  if (animation.kind === "transform" && animation.actorSeat === seat) return animation.transformVariant === "evolution" ? "anim-evolution" : "anim-transform";
  if ((animation.kind === "moveEffect" || animation.kind === "damage" || animation.kind === "status") && animation.targetSeat === seat) return `anim-target-${animation.kind}`;
  if (animation.kind === "statChange" && animation.targetSeat === seat) return animation.resultTone === "bad" ? "anim-stat-down" : animation.resultTone === "good" ? "anim-stat-up" : "anim-stat-neutral";
  if (animation.kind === "heal" && animation.actorSeat === seat) return "anim-heal";
  if (animation.kind === "faint" && animation.actorSeat === seat) return "anim-faint";
  if (animation.kind === "switchIn" && animation.actorSeat === seat) return "anim-switch-in";
  if (animation.kind === "switchOut" && animation.actorSeat === seat) return "anim-switch-out";
  return "";
}

function BattleHpPanel({api, slot, compact = false, current = false, commanding = false}: {api: ChangeBattleV2Api; slot: BattleViewSlotV4; compact?: boolean; current?: boolean; commanding?: boolean}) {
  const hpRate = slot.maxHp ? Math.max(0, Math.min(100, slot.hp / slot.maxHp * 100)) : 0;
  const status = statusBadge(slot.status);
  const identity = slotIdentityLabel(slot);
  const displayName = battleSlotDisplayName(slot, api);
  const displayHp = Math.round(slot.hp);
  return (
    <section className={`battle-v4-hp-panel ${slot.side} ${slot.position.toLowerCase()} ${compact ? "compact" : ""} ${current ? "current" : ""} ${commanding ? "commanding" : ""}`} title={identity ? `ID: ${identity}` : undefined}>
      <div className="battle-v4-hp-portrait">
        <BattleV4Icon src={slot.iconUrl || slot.frontSpriteUrl || slot.spriteUrl} iconStyle={slot.iconStyle} alt={displayName} />
      </div>
      <div className="battle-v4-hp-main">
        <div className="battle-v4-hp-name-row">
          <strong>{displayName}</strong>
          <SpecialSystemBadges slot={slot} />
          {status ? <StatusBadge badge={status} /> : null}
          <em>Lv.{slot.level}</em>
        </div>
        <div className="battle-v4-hp-bar"><b style={{transform: `scaleX(${hpRate / 100})`}} /></div>
        <div className="battle-v4-hp-value-row">
          <span>{slot.side === "far" ? `${Math.round(hpRate)}%` : `${displayHp}/${slot.maxHp}`}</span>
          {identity ? <code>{identity}</code> : null}
        </div>
      </div>
    </section>
  );
}

function SpecialSystemBadges({slot}: {slot: BattleViewSlotV4}) {
  const badges: Array<{key: string; label: string; title: string}> = [];
  if (slot.specialFormeKind === "mega") badges.push({key: "mega", label: "M", title: "Mega 进化"});
  if (slot.specialFormeKind === "primal") badges.push({key: "primal", label: "P", title: "原始回归"});
  if (slot.specialFormeKind === "ultra") badges.push({key: "ultra", label: "U", title: "究极爆发"});
  if (slot.terastallized) badges.push({key: "tera", label: typeShortLabel(slot.teraType || "T"), title: `${slot.teraType || "未知"}太晶`});
  if (slot.dynamaxActive) badges.push({key: "dynamax", label: "D", title: "极巨化"});
  if (!badges.length) return null;
  return (
    <span className="battle-v4-special-badges">
      {badges.map(badge => <i className={`special-${badge.key}`} title={badge.title} key={badge.key}>{badge.label}</i>)}
    </span>
  );
}

function BattleCommandDock({api, viewModel, visualNearTeam, visualFarTeam, snapshot, busy, message, actions, mode, requestType, commandMode, onCommandModeChange, onOpenSwitch, battleBag, battleBagEnabled, battleBagOpen, onOpenBattleBag, canUndoChoice, onUndoChoice, onSubmit, onMoveDraft, onPreviewMove, onUnavailableSpecial}: {
  api: ChangeBattleV2Api;
  viewModel: BattleViewModelV4 | null;
  visualNearTeam: BattleViewSlotV4[];
  visualFarTeam: BattleViewSlotV4[];
  snapshot: BattleSessionSnapshotV4 | null;
  busy: boolean;
  message: string;
  actions: BattleCommandActionV4[];
  mode: string;
  requestType: string;
  commandMode: "command" | "moves";
  onCommandModeChange: (mode: "command" | "moves") => void;
  onOpenSwitch: () => void;
  battleBag: BagStateV4;
  battleBagEnabled: boolean;
  battleBagOpen: boolean;
  onOpenBattleBag: () => void;
  canUndoChoice: boolean;
  onUndoChoice: () => void;
  onSubmit: (choice: string) => void;
  onMoveDraft: (action: MoveActionV4, selectedSpecial?: BattleSpecialChoiceV4 | null) => void;
  onPreviewMove: (move: DexMoveDetail) => void;
  onUnavailableSpecial: (message: string) => void;
}) {
  const canInspectSwitch = requestType === "move" && Boolean(snapshot?.requests.p1?.side?.pokemon?.length);
  const [previewMoveId, setPreviewMoveId] = useState("");
  const [selectedSpecial, setSelectedSpecial] = useState<BattleSpecialChoiceV4 | null>(null);
  const moveActions = actions.filter((action): action is Extract<BattleCommandActionV4, {kind: "move"}> => action.kind === "move");
  const lockedSpecialSystems = useMemo(() => lockedSpecialSystemsForCommand(viewModel?.command.choices || []), [viewModel?.command.choices]);
  const selectedSystem = battleSpecialSystemForChoiceV4(selectedSpecial);
  const activeSpecial = selectedSystem && lockedSpecialSystems.has(selectedSystem) ? null : selectedSpecial;
  const moveCards = useMemo(() => moveActions.map(action => {
    const selectedForAction = selectedSpecialForAction(action, activeSpecial, lockedSpecialSystems);
    const displaySpecial = selectedForAction || activeMaxDisplaySpecialForAction(action, visualNearTeam, viewModel?.nearTeam || []);
    return buildBattleV4MoveCard(action, api, visualFarTeam, displaySpecial, selectedForAction);
  }), [api, moveActions, viewModel?.nearTeam, visualNearTeam, visualFarTeam, activeSpecial, lockedSpecialSystems]);
  const specialOptions = useMemo(() => uniqueSpecialOptionsForActions(moveActions), [moveActions]);
  const previewCard = moveCards.find(card => card.id === previewMoveId && card.detail) ||
    moveCards.find(card => card.detail && !isDisabledAction(card.action)) ||
    moveCards.find(card => card.detail);
  const commandStatus = commandStatusText(viewModel, busy, message, api);
  useEffect(() => {
    if (!selectedSpecial) return;
    const system = battleSpecialSystemForChoiceV4(selectedSpecial);
    if (system && lockedSpecialSystems.has(system)) {
      setSelectedSpecial(null);
      return;
    }
    if (!specialOptions.some(option => option.id === selectedSpecial)) setSelectedSpecial(null);
  }, [selectedSpecial, specialOptions, lockedSpecialSystems]);
  if (requestType === "switch") {
    return (
      <section className="battle-v4-command-dock waiting action" aria-label="等待换人" role="button" tabIndex={0} onClick={onOpenSwitch} onKeyDown={event => {
        if (event.key === "Enter" || event.key === " ") onOpenSwitch();
      }}>
        <span>{busy ? "提交中..." : message || "请选择要换上的宝可梦"}</span>
      </section>
    );
  }
  if (requestType !== "move") {
    const waitingLabel = requestType === "wait" ? "等待对手行动 / wait request" : "等待行动";
    const diagnosis = battleV4StallDiagnosis(snapshot);
    const diagnosisLabel = diagnosis.includes("no-obvious-stall-signal") ? "" : ` · ${diagnosis.join(" / ")}`;
    return (
      <section className="battle-v4-command-dock waiting" aria-label="等待指令">
        <span>{busy ? "提交中..." : message || snapshot?.error || `${waitingLabel}${diagnosisLabel}`}</span>
      </section>
    );
  }
  if (commandMode === "moves") {
    return (
      <BattleV4SkillCommandPanel
        commandStatus={commandStatus}
        message={message}
        busy={busy}
        moveCards={moveCards}
        previewCard={previewCard}
        specialOptions={specialOptions}
        selectedSpecial={selectedSpecial}
        lockedSystems={lockedSpecialSystems}
        mode={viewModel?.command.normalizedRequest?.mode}
        ruleSet={viewModel?.command.normalizedRequest?.ruleSet}
        onBack={() => onCommandModeChange("command")}
        onPreviewMove={onPreviewMove}
        onMoveDraft={onMoveDraft}
        onPreviewMoveIdChange={setPreviewMoveId}
        onChooseSpecial={setSelectedSpecial}
        onUnavailableSpecial={onUnavailableSpecial}
        isDisabledAction={isDisabledAction}
        isSpecialDisplayedMoveDisabled={specialDisplayedMoveDisabled}
      />
    );
  }
  return (
    <section className="battle-v4-command-dock command" aria-label="战斗指令">
      <span className="battle-v4-command-progress">{commandStatus}</span>
      {canUndoChoice ? (
        <button className="battle-v4-command-undo" type="button" disabled={busy} onClick={onUndoChoice}>
          返回上一步
        </button>
      ) : null}
      <button className="battle-v4-main-command fight" type="button" disabled={busy || !moveActions.length} onClick={() => onCommandModeChange("moves")}>
        <img src={assetUrl("battle/command-buttons/fight.webp")} alt="" />
        <span>战斗</span>
      </button>
      <div className="battle-v4-secondary-commands">
        <button className="battle-v4-main-command switch" type="button" disabled={busy || !canInspectSwitch} onClick={onOpenSwitch}>
          <img src={assetUrl("battle/command-buttons/switch.webp")} alt="" />
          <span>宝可梦</span>
        </button>
        {battleBagEnabled ? (
          <button className={`battle-v4-main-command bag ${battleBagOpen ? "active" : ""}`} type="button" disabled={busy} onClick={onOpenBattleBag} title="查看战斗背包">
            <span className="battle-v4-main-command-fallback-icon">包</span>
            <span>背包</span>
          </button>
        ) : null}
      </div>
    </section>
  );
}

function BattleV4BagPanel({api, bag, snapshot, request, pokemonBattleOBJ, commandDraft, onClose, onUnavailable, onSubmitItemChoice}: {
  api: ChangeBattleV2Api;
  bag: BagStateV4;
  snapshot: BattleSessionSnapshotV4 | null;
  request: BattleNormalizedRequestV4 | null;
  pokemonBattleOBJ: PokemonBattleOBJState;
  commandDraft: BattleCommandDraftV4 | null;
  onClose: () => void;
  onUnavailable: (message: string) => void;
  onSubmitItemChoice: (choice: string) => void;
}) {
  const targets = useMemo(() => buildBattleBagTargets(api, bag.items, pokemonBattleOBJ.partyByPlayer.p1), [api, bag.items, pokemonBattleOBJ.partyByPlayer.p1]);
  const [selection, setSelection] = useState<{item: PlayerItemInstanceV4 | null; target: PlayerBagPokemonTarget | null}>({item: null, target: null});
  const selectedDetail = useMemo(() => selection.item ? safeItemDetail(api, selection.item.itemID) : null, [api, selection.item]);
  const canUse = Boolean(request && selection.item && selection.target && canUseRecoveryItemV4(selection.item, selectedDetail));
  const actions: PlayerBagAction[] = [{
    key: "use",
    label: "立即使用",
    disabled: !canUse,
    title: canUse ? "使用道具并占用当前行动" : "请选择可恢复道具和目标宝可梦。",
    onClick: () => {
      if (!request || !selection.item || !selection.target) {
        console.error("[BattleV4][bag] trainer item cannot be used: missing request/item/target", {
          hasRequest: Boolean(request),
          item: selection.item,
          target: selection.target,
          commandDraft,
        });
        onUnavailable("请选择可使用道具和目标宝可梦。");
        return;
      }
      const draft = fillBattleCommandPassesV4(commandDraft || createBattleCommandDraftV4(request), request);
      if (draft.isDone) {
        console.error("[BattleV4][bag] trainer item cannot be used: command draft is already done", {
          request,
          commandDraft,
          normalizedDraft: draft,
          item: selection.item,
          target: selection.target,
        });
        onUnavailable("当前回合指令已经完成。");
        return;
      }
      onSubmitItemChoice(stringifyBattleTrainerItemChoiceV4({
        kind: "traineritem",
        itemInstanceId: selection.item.id,
        targetKey: selection.target.key,
      }));
      onClose();
    },
  }];
  return (
    <div className="battle-v4-player-bag-layer">
      <PlayerBagPanel
        api={api}
        open
        layout="battle"
        title="战斗背包"
        items={bag.items}
        maxSize={bag.maxSize}
        isBattle
        pokemonTargets={targets}
        actions={actions}
        emptyItemText="没有可战斗使用的道具"
        emptyTargetText="暂无可选择宝可梦"
        footerNote="使用道具会占用当前行动，并在本回合先手恢复。"
        onClose={onClose}
        onSelectionChange={nextSelection => {
          setSelection(current => current.item?.id === nextSelection.item?.id && current.target?.key === nextSelection.target?.key ? current : nextSelection);
        }}
      />
    </div>
  );
}

function safeItemDetail(api: ChangeBattleV2Api, itemId: string) {
  try {
    return api.getItemDetail(itemId);
  } catch {
    return null;
  }
}

function lockedSpecialSystemsForCommand(choices: unknown[]): Set<BattleSpecialSystemV4> {
  const locked = new Set<BattleSpecialSystemV4>();
  for (const choice of choices) {
    const system = battleSpecialSystemForChoiceV4(specialChoiceFromChoiceString(choice));
    if (system) locked.add(system);
  }
  return locked;
}

function buildBattleBagTargets(api: ChangeBattleV2Api, bagItems: PlayerItemInstanceV4[], party: PokemonBattleOBJ[]): PlayerBagPokemonTarget[] {
  return party.map((obj, index) => {
    const pokemon = obj.localPokemon;
    const name = obj.displayName || obj.name || obj.battleSpeciesId || `宝可梦 ${index + 1}`;
    return {
      key: obj.showdownIdentityToken || obj.showdownId || obj.pokeballId || obj.pokeball || obj.localPokemonId || obj.battleKey,
      name,
      nameZh: obj.nameZh || name,
      level: obj.level,
      hp: obj.hp,
      maxHp: obj.maxHp,
      status: obj.status,
      iconUrl: obj.iconUrl,
      spriteUrl: obj.spriteUrl || obj.frontSpriteUrl,
      iconStyle: obj.iconStyle,
      heldItem: heldItemForBattleTarget(api, bagItems, pokemon, obj.row?.item),
      battleIdLabel: obj.showdownIdentityToken || obj.pokeball || "",
    };
  });
}

function heldItemForBattleTarget(api: ChangeBattleV2Api, bagItems: PlayerItemInstanceV4[], pokemon: LocalPokemonV4 | null, requestItemId?: string): PlayerItemInstanceV4 | null {
  if (pokemon?.heldItemInstanceId) {
    const byInstance = bagItems.find(item => item.id === pokemon.heldItemInstanceId);
    if (byInstance) return byInstance;
  }
  const itemId = requestItemId || pokemon?.itemId || "";
  if (!itemId) return null;
  return bagItems.find(item => item.itemID === itemId) || displayItemInstance(api, itemId);
}

function displayItemInstance(api: ChangeBattleV2Api, itemId: string): PlayerItemInstanceV4 {
  let name = itemId;
  let image = "";
  try {
    const detail = api.getItemDetail(itemId);
    name = detail.nameZh || detail.name || itemId;
    image = detail.iconUrl || "";
  } catch {
    // Keep the raw Showdown id visible when the dex has no item detail.
  }
  return {
    id: `battle-display-${itemId}`,
    itemID: itemId,
    name,
    image,
    cost: 0,
    canSale: false,
    type: "held",
    canBattleUse: false,
    canUse: false,
    canUseToPokemon: false,
    canTake: true,
    effectRound: null,
    getRound: 0,
    maxUseCount: null,
    useCount: 0,
  };
}

function specialChoiceFromChoiceString(choice: unknown): BattleSpecialChoiceV4 | null {
  if (typeof choice !== "string") return null;
  const tokens = choice.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;
  const id = String(tokens[2] || "").toLowerCase();
  if (id === "mega" || id === "megax" || id === "megay" || id === "ultra" || id === "zmove" || id === "terastallize") return id;
  if (id === "max" || id === "dynamax") return "max";
  return null;
}

function canUndoBattleCommandChoice(draft: BattleCommandDraftV4 | null, request: BattleNormalizedRequestV4 | null): boolean {
  if (!draft || !request) return false;
  if (draft.currentMove) return true;
  return draft.choices.some(choice => {
    const normalized = choice.trim();
    return normalized && normalized !== "pass";
  });
}

function selectedSpecialForAction(action: MoveActionV4, selected: BattleSpecialChoiceV4 | null, lockedSystems = new Set<BattleSpecialSystemV4>()): BattleSpecialChoiceV4 | null {
  if (!selected) return null;
  const system = battleSpecialSystemForChoiceV4(selected);
  if (system && lockedSystems.has(system)) return null;
  return action.specialOptions.some(option => option.id === selected && option.ruleAllowed && !option.disabled) ? selected : null;
}

function activeMaxDisplaySpecialForAction(action: MoveActionV4, visualNearTeam: BattleViewSlotV4[], requestNearTeam: BattleViewSlotV4[]): BattleV4MoveDisplaySpecialChoice {
  if (!action.move.maxMove) return null;
  if (action.move.maxMove && !action.specialOptions.some(option => option.id === "max")) return "active-max";
  const visualActive = visualNearTeam[action.activeIndex] || null;
  const requestActive = requestNearTeam[action.activeIndex] || null;
  if (visualActive?.dynamaxActive && (!requestActive || sameBattleViewSlotIdentity(visualActive, requestActive))) return "active-max";
  const requestMatchedVisual = requestActive ? visualNearTeam.find(slot => sameBattleViewSlotIdentity(slot, requestActive)) || null : null;
  if (requestMatchedVisual?.dynamaxActive) return "active-max";
  return null;
}

function sameBattleViewSlotIdentity(a: BattleViewSlotV4, b: BattleViewSlotV4): boolean {
  if (a.localPokemonId && b.localPokemonId && a.localPokemonId === b.localPokemonId) return true;
  if (a.showdownIdentityToken && b.showdownIdentityToken && a.showdownIdentityToken === b.showdownIdentityToken) return true;
  if (a.showdownId && b.showdownId && a.showdownId === b.showdownId) return true;
  return a.playerId === b.playerId && a.position === b.position && toId(a.speciesId || a.name) === toId(b.speciesId || b.name);
}

function BattleV4TargetPanel({api, viewModel, visualNearTeam, visualFarTeam, action, onClose, moveNeedsSubmittedTarget, onSelectTarget}: {
  api: ChangeBattleV2Api;
  viewModel: BattleViewModelV4;
  visualNearTeam: BattleViewSlotV4[];
  visualFarTeam: BattleViewSlotV4[];
  action: MoveActionV4;
  onClose: () => void;
  moveNeedsSubmittedTarget: (move: BattleMoveRequestV4) => boolean;
  onSelectTarget: (action: MoveActionV4, choiceSuffix: string, shouldUseTargetSuffix: boolean) => void;
}) {
  const moveCard = useMemo(() => {
    const selectedSpecial = specialChoiceFromChoiceString(action.choice);
    const displaySpecial = selectedSpecial || activeMaxDisplaySpecialForAction(action, visualNearTeam, viewModel.nearTeam);
    return buildBattleV4MoveCard(action, api, visualFarTeam, displaySpecial, selectedSpecial);
  }, [action, api, viewModel.nearTeam, visualFarTeam, visualNearTeam]);
  const shouldSubmitTargetSuffix = moveNeedsSubmittedTarget(moveCard.displayedMove);
  const targets = useMemo(
    () => buildBattleV4TargetCards(visualNearTeam, visualFarTeam, action, moveCard.displayedMove, moveCard.detail, shouldSubmitTargetSuffix, api),
    [visualNearTeam, visualFarTeam, action, moveCard.displayedMove, moveCard.detail, shouldSubmitTargetSuffix, api],
  );
  return (
    <section className="battle-v4-target-modal" aria-label="攻击对象选择">
      <div className="battle-v4-target-modal-top" />
      <div className="battle-v4-target-modal-bottom" />
      <div className="battle-v4-target-header"><span>{moveCard.name}</span></div>
      <div className="battle-v4-target-grid">
        {targets.map(target => (
          <BattleV4TargetCard
            api={api}
            target={target}
            key={target.key}
            onSelect={next => {
              const shouldUseTargetSuffix = Boolean(next.choiceSuffix && shouldSubmitTargetSuffix);
              onSelectTarget(action, next.choiceSuffix, shouldUseTargetSuffix);
            }}
          />
        ))}
      </div>
      <button className="battle-v4-target-close" type="button" onClick={onClose}><b>B</b><span>关闭</span></button>
    </section>
  );
}

function BattleV4TargetCard({api, target, onSelect}: {api: ChangeBattleV2Api; target: BattleV4TargetCardView; onSelect: (target: BattleV4TargetCardView) => void}) {
  const slot = target.slot;
  if (!slot) return <button className="battle-v4-target-card empty" type="button" disabled />;
  const hpRate = slot.maxHp ? Math.max(0, Math.min(100, slot.hp / slot.maxHp * 100)) : 0;
  const status = statusBadge(slot.status);
  const displayName = battleSlotDisplayName(slot, api);
  return (
    <button
      className={`battle-v4-target-card side-${slot.side} effect-${target.effectivenessTone} ${target.affected ? "affected" : ""} ${target.selectable ? "selectable" : "not-selectable"}`}
      type="button"
      disabled={!target.selectable}
      onClick={() => onSelect(target)}
    >
      {target.selectable ? <span className="battle-v4-target-arrow">›</span> : null}
      <span className="battle-v4-target-effect">{target.effectivenessLabel}</span>
      <span className="battle-v4-target-sprite">
        <BattleV4Icon src={slot.iconUrl || slot.frontSpriteUrl || slot.spriteUrl} iconStyle={slot.iconStyle} alt={displayName} />
      </span>
      <span className="battle-v4-target-info">
        <strong>{displayName}</strong>
        <span className="battle-v4-target-hp"><i><b style={{width: `${hpRate}%`}} /></i></span>
        <span className="battle-v4-target-meta">
          <b>{slot.side === "far" ? `${Math.round(hpRate)}%` : `${slot.hp}/${slot.maxHp}`}</b>
          <em>Lv.{slot.level}</em>
          {status ? <StatusBadge badge={status} /> : null}
        </span>
      </span>
    </button>
  );
}

function isDisabledAction(action: BattleCommandActionV4): boolean {
  return action.kind === "move" ? Boolean(action.move.disabled || action.move.pp === 0) : Boolean(action.disabled);
}

function commandStatusText(viewModel: BattleViewModelV4 | null, busy: boolean, message: string, api?: ChangeBattleV2Api): string {
  if (busy) return message || "提交中...";
  const command = viewModel?.command;
  if (!command || command.requestType === "none") return "等待 request";
  if (command.waiting) return "等待对局推进";
  const doneCount = command.choices.filter(Boolean).length;
  const total = Math.max(1, command.requestLength);
  if (command.isDone) return `已完成 ${doneCount}/${total}`;
  const activeName = command.activePokemon?.name
    ? api ? localizeProtocolPokemonName(command.activePokemon.name, api) : command.activePokemon.name
    : `第 ${command.activeIndex + 1} 只`;
  return `${activeName}要做什么？ · ${doneCount}/${total}`;
}

function BattleV4ErrorPanel({error, onExport}: {error: BattleV4BlockingError; onExport: () => void}) {
  return (
    <section className="battle-v4-error-panel" role="alert" aria-live="assertive">
      <strong>战斗异常</strong>
      <span>{error.message}</span>
      {error.detail && error.detail !== error.message ? <code>{error.detail}</code> : null}
      <button type="button" onClick={onExport}>导出诊断</button>
    </section>
  );
}

function localizeBattleV4PlaybackMessage(message: string, animation: BattleAnimationEventV4 | null, api: ChangeBattleV2Api): string {
  if (!message || !animation) return message;
  if (animation.kind === "turn") {
    const turn = animation.rawLine.match(/^\|turn\|(\d+)/)?.[1] || "";
    return turn ? `第 ${turn} 回合` : message;
  }
  if (animation.kind === "moveStart" || animation.kind === "moveEffect") {
    return `${localizeProtocolPokemonName(animation.actorName, api)}使用了${localizeProtocolMoveName(animation.moveName || animation.moveId, api)}！`;
  }
  if (animation.kind === "switchIn") {
    return animation.rawLine.startsWith("|drag|")
      ? `${localizeProtocolPokemonName(animation.actorName, api)}被拖上场了！`
      : `${localizeProtocolPokemonName(animation.actorName, api)}上场了！`;
  }
  if (animation.kind === "ability") {
    return `${localizeProtocolPokemonName(animation.actorName, api)}的${localizeProtocolAbilityName(animation.resultText || animation.args[2] || "", api)}发动了！`;
  }
  if (animation.kind === "transform") {
    const species = animation.args[2] || animation.resultText || "";
    if (animation.rawLine.startsWith("|-formechange|")) {
      return `${localizeProtocolPokemonName(animation.actorName, api)}变成了${localizeProtocolPokemonName(species, api)}！`;
    }
    if (animation.rawLine.startsWith("|detailschange|")) {
      return `${localizeProtocolPokemonName(animation.actorName, api)}的样子改变了！`;
    }
    return `${localizeProtocolPokemonName(animation.actorName, api)}变身了！`;
  }
  if (animation.kind === "weather" && animation.weatherId === "sunnyday") {
    return animation.actorName
      ? `${localizeProtocolPokemonName(animation.actorName, api)}的日照让阳光变强了！`
      : "阳光变强了！";
  }
  return localizeProtocolItemMentions(localizeProtocolPokemonMentions(localizeProtocolMoveMentions(message, api), api), api);
}

function localizeBattleV4ResultText(text: string, animation: BattleAnimationEventV4, api: ChangeBattleV2Api): string {
  if (!text) return "";
  if (animation.kind === "ability") return localizeProtocolAbilityName(text, api);
  if (animation.kind === "transform") return localizeProtocolPokemonName(text, api);
  return localizeProtocolItemMentions(localizeProtocolMoveMentions(localizeProtocolPokemonMentions(text, api), api), api);
}

function localizeProtocolPokemonMentions(text: string, api: ChangeBattleV2Api): string {
  return text.replace(/\b[A-Z][A-Za-z0-9' -]+\b/g, match => localizeProtocolPokemonName(match, api));
}

function localizeProtocolMoveMentions(text: string, api: ChangeBattleV2Api): string {
  return text.replace(/\b[A-Z][A-Za-z0-9' -]+\b/g, match => localizeProtocolMoveName(match, api));
}

function localizeProtocolItemMentions(text: string, api: ChangeBattleV2Api): string {
  return text.replace(/\b[A-Z][A-Za-z0-9' -]+\b/g, match => localizeProtocolItemName(match, api));
}

function localizeProtocolPokemonName(name: string, api: ChangeBattleV2Api): string {
  const normalizedName = normalizeProtocolDisplayName(name);
  const id = toId(normalizedName);
  if (!id) return name;
  const formName = localizeProtocolPokemonFormName(normalizedName, api);
  if (formName) return formName;
  try {
    const detail = api.getPokemonDetail(id);
    const localized = detail.nameZh || detail.name || "";
    if (localized && localized !== detail.name && localized !== normalizedName) return localized;
  } catch {
    // Fall through to form-aware fallback below.
  }
  return localizeProtocolPokemonFormName(normalizedName, api) || normalizedName || name;
}

function localizeProtocolMoveName(name: string, api: ChangeBattleV2Api): string {
  const id = toId(name);
  if (!id) return name;
  try {
    const detail = api.getMoveDetail(id);
    return detail.nameZh || detail.name || name;
  } catch {
    return name;
  }
}

function localizeProtocolItemName(name: string, api: ChangeBattleV2Api): string {
  const id = toId(name);
  if (!id) return name;
  try {
    const detail = api.getItemDetail(id);
    return detail.nameZh || detail.name || name;
  } catch {
    return name;
  }
}

function normalizeProtocolDisplayName(name: string): string {
  return String(name || "")
    .replace(/^move:\s*/i, "")
    .replace(/^ability:\s*/i, "")
    .replace(/^item:\s*/i, "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .trim();
}

function localizeProtocolPokemonFormName(name: string, api: ChangeBattleV2Api): string | null {
  for (const [pattern, formLabel] of POKEMON_FORM_LABELS) {
    if (!pattern.test(name)) continue;
    const baseName = name.replace(pattern, "");
    const baseId = toId(baseName);
    if (!baseId) return `${baseName} ${formLabel}`;
    try {
      const baseDetail = api.getPokemonDetail(baseId);
      return `${baseDetail.nameZh || baseDetail.name || baseName} ${formLabel}`;
    } catch {
      return `${baseName} ${formLabel}`;
    }
  }
  return null;
}

function battleSlotDisplayName(slot: BattleViewSlotV4, api: ChangeBattleV2Api): string {
  const preferred = slot.nameZh || slot.name;
  const species = slot.speciesId || slot.name;
  if (preferred && toId(preferred) !== toId(species)) return preferred;
  return localizePokemonFormDisplayName(preferred, species, api);
}

function localizePokemonFormDisplayName(preferredName: string, speciesName: string, api: ChangeBattleV2Api): string {
  const normalizedSpecies = normalizeProtocolDisplayName(speciesName);
  const normalizedPreferred = normalizeProtocolDisplayName(preferredName);
  for (const [pattern, formLabel] of POKEMON_FORM_LABELS) {
    if (!pattern.test(normalizedSpecies)) continue;
    if (new RegExp(`${formLabel.replace(/\s+/g, "[-\\s]?")}$`, "i").test(normalizedPreferred)) return normalizedPreferred;
    const baseSpecies = normalizedSpecies.replace(pattern, "");
    const baseName = normalizedPreferred && normalizedPreferred !== normalizedSpecies ? normalizedPreferred : baseSpecies;
    return `${baseName} ${formLabel}`;
  }
  const speciesId = toId(normalizedSpecies);
  for (const [suffix, formLabel] of POKEMON_FORM_ID_SUFFIXES) {
    if (!speciesId.endsWith(suffix)) continue;
    if (new RegExp(`${formLabel.replace(/\s+/g, "[-\\s]?")}$`, "i").test(normalizedPreferred)) return normalizedPreferred;
    const baseId = speciesId.slice(0, -suffix.length);
    const baseName = baseId ? localizePokemonSpeciesId(baseId, normalizedPreferred || preferredName || speciesName, api) : normalizedPreferred || preferredName || speciesName;
    return `${baseName}-${formLabel}`;
  }
  return normalizedPreferred || preferredName || speciesName;
}

function localizePokemonSpeciesId(speciesId: string, fallback: string, api: ChangeBattleV2Api): string {
  const id = toId(speciesId);
  if (!id) return fallback;
  try {
    const detail = api.getPokemonDetail(id);
    return detail.nameZh || detail.name || fallback;
  } catch {
    return fallback;
  }
}

function localizeProtocolAbilityName(name: string, api: ChangeBattleV2Api): string {
  const id = toId(name);
  if (!id) return name;
  try {
    const detail = api.getAbilityDetail(id);
    return detail.nameZh || detail.name || name;
  } catch {
    return name;
  }
}

function StatusBadge({badge, className = "battle-v4-status-badge"}: {badge: BattleV4StatusBadge; className?: string}) {
  return <i className={`${className} status-${badge.className}`} title={badge.title}>{badge.label}</i>;
}

function typeShortLabel(type: string): string {
  const id = toId(type);
  return TYPE_SHORT_LABEL[id] || String(type || "?").slice(0, 1).toUpperCase();
}

function buildBattleV4MoveCard(action: MoveActionV4, api: ChangeBattleV2Api, targetSlots: BattleViewSlotV4[], displaySpecial: BattleV4MoveDisplaySpecialChoice = null, selectedSpecial: BattleSpecialChoiceV4 | null = displaySpecial === "active-max" ? null : displaySpecial): BattleV4MoveCardView {
  const displayedMove = displayedMoveForSpecial(action.move, displaySpecial);
  const detail = moveDetailFor(api, displayedMove);
  const id = toId(detail?.id || displayedMove.id || displayedMove.move || action.label);
  const typeId = typeIdFor(detail?.typeId || detail?.type || displayedMove.id || "");
  const category = detail?.categoryId || detail?.category || "";
  const categoryId = toId(category);
  const effectiveness = moveEffectiveness(detail, api, targetSlots);
  const currentPp = action.move.pp ?? detail?.pp;
  const maxPp = action.move.maxpp ?? detail?.pp;
  return {
    action,
    detail,
    baseMove: action.move,
    displayedMove,
    selectedSpecial,
    id,
    name: detail?.nameZh || detail?.name || displayedMove.move || displayedMove.id || action.label || "技能",
    typeId: typeId || "unknown",
    typeLabel: TYPE_SHORT_LABEL[typeId] || detail?.type || "?",
    categoryLabel: translateDexLabel("categories", categoryId || detail?.category || "") || "?",
    powerLabel: detail ? Number(detail.power || 0) ? String(detail.power) : "—" : "—",
    accuracyLabel: detail ? detail.accuracy == null ? "必中" : String(detail.accuracy) : "—",
    ppLabel: `${currentPp ?? "—"}/${maxPp ?? "—"}`,
    effectivenessLabel: effectiveness.label,
    effectivenessTone: effectiveness.tone,
  };
}

function displayedMoveForSpecial(move: BattleMoveRequestV4, selectedSpecial: BattleV4MoveDisplaySpecialChoice): BattleMoveRequestV4 {
  if (selectedSpecial === "zmove" && move.zMove) return move.zMove;
  if ((selectedSpecial === "max" || selectedSpecial === "active-max") && move.maxMove) return move.maxMove;
  return move;
}

function specialDisplayedMoveDisabled(card: BattleV4MoveCardView): boolean {
  return Boolean(card.selectedSpecial && card.displayedMove.disabled);
}

function buildBattleV4TargetCards(nearTeam: BattleViewSlotV4[], farTeam: BattleViewSlotV4[], action: MoveActionV4, displayedMove: BattleMoveRequestV4, detail: DexMoveDetail | null, submitTargetSuffix: boolean, api: ChangeBattleV2Api): BattleV4TargetCardView[] {
  const visualFarTeam = sortSlotsForArena(farTeam, "far");
  const visualNearTeam = sortSlotsForArena(nearTeam, "near");
  const active = visualNearTeam[action.activeIndex] || visualNearTeam.find(slot => slot.active) || visualNearTeam[0] || null;
  const slots: Array<BattleViewSlotV4 | null> = [
    visualFarTeam[0] || null,
    visualFarTeam[1] || null,
    visualNearTeam[0] || null,
    visualNearTeam[1] || null,
  ];
  const activeCount = Math.max(1, visualNearTeam.filter(slot => slot.active).length, visualFarTeam.filter(slot => slot.active).length);
  const target = showdownNormalizeMoveTargetV4(displayedMove.target || detail?.target || action.move.target || "normal");
  return slots.map((slot, index) => {
    if (!slot) {
      return {key: `empty-${index}`, slot: null, selectable: false, affected: false, choiceSuffix: "", effectivenessLabel: "效果一般", effectivenessTone: "normal"};
    }
    const choiceSuffix = targetChoiceSuffix(active, slot, visualNearTeam, visualFarTeam);
    const state = targetStateForV4(target, active, slot, action.activeIndex, activeCount, choiceSuffix);
    const multiplier = moveMultiplier(detail, slot, api);
    const effectiveness = detail ? effectivenessFromMultiplier(multiplier) : {label: "效果一般", tone: "normal" as const};
    return {
      key: battleV4TargetCardKey(slot, index),
      slot,
      selectable: state.selectable,
      affected: state.affected,
      choiceSuffix: submitTargetSuffix ? choiceSuffix : "",
      effectivenessLabel: effectiveness.label,
      effectivenessTone: effectiveness.tone,
    };
  });
}

function battleV4TargetCardKey(slot: BattleViewSlotV4, index: number): string {
  return `${slot.seat}:${battleViewSlotBattleKey(slot) || `slot-${index}`}:${slot.active ? "active" : "bench"}:${slot.fainted ? "fnt" : "live"}`;
}

function moveDetailFor(api: ChangeBattleV2Api, move: BattleMoveRequestV4): DexMoveDetail | null {
  const id = move.id || move.move;
  if (!id) return null;
  try {
    return api.getMoveDetail(id);
  } catch {
    try {
      return api.getMoveDetail(toId(id));
    } catch {
      return null;
    }
  }
}

function moveEffectiveness(detail: DexMoveDetail | null, api: ChangeBattleV2Api, targetSlots: BattleViewSlotV4[]): {label: string; tone: BattleV4MoveCardView["effectivenessTone"]} {
  if (!detail || toId(detail.categoryId || detail.category) === "status" || !Number(detail.power || 0)) return {label: "效果一般", tone: "normal"};
  const targets = targetSlots.filter(slot => slot.active && !slot.fainted);
  if (!targets.length) return {label: "效果一般", tone: "normal"};
  const multipliers = targets.map(slot => moveMultiplier(detail, slot, api));
  const best = multipliers.includes(0) && multipliers.every(value => value <= 0) ? 0 : Math.max(...multipliers);
  return effectivenessFromMultiplier(best);
}

function moveMultiplier(detail: DexMoveDetail | null, target: BattleViewSlotV4, api?: ChangeBattleV2Api): number {
  const attackType = typeIdFor(detail?.typeId || detail?.type || "");
  if (!detail || !attackType || !target || target.fainted) return 1;
  let targetTypes: string[] = [];
  try {
    targetTypes = api?.getPokemonDetail(target.speciesId).types || [];
  } catch {
    targetTypes = [];
  }
  const uniqueTypes = [...new Set(targetTypes.map(typeIdFor).filter(Boolean))];
  if (!uniqueTypes.length) return 1;
  return uniqueTypes.reduce((multiplier, defenseType) => multiplier * (TYPE_CHART[attackType]?.[defenseType] ?? 1), 1);
}

function effectivenessFromMultiplier(multiplier: number): {label: string; tone: BattleV4MoveCardView["effectivenessTone"]} {
  if (multiplier <= 0) return {label: "没有效果", tone: "none"};
  if (multiplier <= 0.25) return {label: "效果非常不好", tone: "bad"};
  if (multiplier < 1) return {label: "效果不好", tone: "weak"};
  if (multiplier >= 4) return {label: "效果无比绝佳", tone: "great"};
  if (multiplier > 1) return {label: "效果拔群", tone: "good"};
  return {label: "效果一般", tone: "normal"};
}

function targetStateForV4(target: string, active: BattleViewSlotV4 | null, slot: BattleViewSlotV4, activeIndex: number, activeCount: number, choiceSuffix: string): {selectable: boolean; affected: boolean} {
  const exists = slot.active && !slot.fainted;
  if (!exists || !active) return {selectable: false, affected: false};
  const isSelf = slot.seat === active.seat;
  const sameSide = slot.side === active.side;
  const targetLoc = Number(choiceSuffix || 0);
  if (showdownTargetTypeAllowsChoiceV4(target)) {
    const selectable = Boolean(targetLoc && validShowdownTargetLocV4(targetLoc, activeIndex, activeCount, target));
    return {selectable, affected: selectable};
  }
  if (target === "self") return {selectable: false, affected: isSelf};
  if (target === "adjacentally") return {selectable: false, affected: sameSide && !isSelf};
  if (target === "alladjacentfoes") return {selectable: false, affected: !sameSide};
  if (target === "alladjacent") return {selectable: false, affected: !isSelf};
  if (target === "foeside") return {selectable: false, affected: !sameSide};
  if (target === "allyside" || target === "allyteam") return {selectable: false, affected: sameSide};
  if (FIELD_TARGETS.has(target)) return {selectable: false, affected: true};
  return {selectable: false, affected: false};
}

const FIELD_TARGETS = new Set(["all", "field", "scripted", "randomnormal"]);

function targetChoiceSuffix(active: BattleViewSlotV4 | null, target: BattleViewSlotV4, visualNearTeam: BattleViewSlotV4[], visualFarTeam: BattleViewSlotV4[]): string {
  if (!active) return target.side === "far" ? "+1" : "-1";
  const sideSlots = target.side === "far" ? visualFarTeam : visualNearTeam;
  const activeTargets = sideSlots.filter(slot => slot.active);
  const protocolIndex = target.position === "B" ? 2 : 1;
  const position = activeTargets.some(slot => slot.seat === target.seat) ? protocolIndex : Math.max(1, protocolIndex);
  return target.side === active.side ? `-${position}` : `+${position}`;
}

function typeIdFor(value: string | undefined): string {
  const id = toId(value);
  if (id === "electric" || id === "elec") return "electric";
  if (id === "fighting" || id === "fight") return "fighting";
  if (id === "psychic" || id === "psy") return "psychic";
  return id;
}

function statusBadge(status: string | undefined): BattleV4StatusBadge | null {
  const code = String(status || "").toLowerCase();
  const badge = STATUS_BADGES[code];
  return badge ? {code, ...badge} : null;
}

type SwitchCandidateV4 = {
  key: string;
  index: number;
  row: RequestPokemonV4 | null;
  localPokemon: LocalPokemonV4 | null;
  battleObject: PokemonBattleOBJ | null;
  known: boolean;
  action: SwitchActionV4 | null;
  relation: "self" | "ally" | "foe";
  label: string;
  status: string;
  hp: number;
  maxHp: number;
  active: boolean;
  fainted: boolean;
  canSwitch: boolean;
  reason: string;
};

type SwitchPanelTeamV4 = {
  playerId: string;
  title: string;
  side: "near" | "far";
  relation: "self" | "ally" | "foe";
  candidates: SwitchCandidateV4[];
};

function BattleV4SwitchPanel({api, snapshot, request, pokemonBattleOBJ, switchActions, forceSwitch, busy, debugConfig, onOpenStatus, onClose, onConfirm}: {
  api: ChangeBattleV2Api;
  snapshot: BattleSessionSnapshotV4;
  request: BattleNormalizedRequestV4 | null;
  pokemonBattleOBJ: PokemonBattleOBJState;
  switchActions: SwitchActionV4[];
  forceSwitch: boolean;
  busy: boolean;
  debugConfig?: AppDebugConfigV4;
  onOpenStatus: () => void;
  onClose: () => void;
  onConfirm: (choice: string) => void;
}) {
  const candidates = useMemo(() => buildSwitchCandidates(pokemonBattleOBJ.partyByPlayer.p1, switchActions, debugConfig), [pokemonBattleOBJ.partyByPlayer.p1, switchActions, debugConfig]);
  const panelTeams = useMemo(() => buildSwitchPanelTeams(pokemonBattleOBJ, candidates), [pokemonBattleOBJ, candidates]);
  const enemies = useMemo(() => buildNonCoopEnemySwitchCandidates(pokemonBattleOBJ), [pokemonBattleOBJ]);
  const isCoop = snapshot.mode === "coop";
  const flatCandidates = useMemo(() => isCoop ? panelTeams.flatMap(team => team.candidates) : [...candidates, ...enemies], [candidates, enemies, isCoop, panelTeams]);
  const firstSelectable = flatCandidates.find(candidate => candidate.canSwitch);
  const [selectedKey, setSelectedKey] = useState(firstSelectable?.key || flatCandidates.find(candidate => candidate.row || candidate.localPokemon)?.key || flatCandidates[0]?.key || "");
  const selected = flatCandidates.find(candidate => candidate.key === selectedKey) || firstSelectable || flatCandidates[0] || null;
  useEffect(() => {
    if (!flatCandidates.length) {
      setSelectedKey("");
      return;
    }
    if (selectedKey && flatCandidates.some(candidate => candidate.key === selectedKey)) return;
    setSelectedKey(firstSelectable?.key || flatCandidates.find(candidate => candidate.row || candidate.localPokemon)?.key || flatCandidates[0]?.key || "");
  }, [firstSelectable?.key, flatCandidates, selectedKey]);
  return (
    <section className={`battle-v4-switch-selector ${isCoop ? "coop" : ""}`} aria-label="换人选择">
      <div className="battle-v4-switch-title">
        <button type="button" onClick={onOpenStatus}>场地状态</button>
        <strong>{forceSwitch ? "必须换人" : "选择交换对象"}</strong>
      </div>
      {isCoop ? (
        <>
          <aside className="battle-v4-switch-team-stack left" aria-label="P1 和 P2 队伍">
            {panelTeams.filter(team => team.playerId === "p1" || team.playerId === "p2").map(team => (
              <BattleV4SwitchTeamList api={api} team={team} selectedKey={selected?.key || ""} onSelect={setSelectedKey} key={team.playerId} />
            ))}
          </aside>
        </>
      ) : (
        <aside className="battle-v4-switch-list ally-list" aria-label="我方队伍">
          <h3>我方队伍</h3>
          {candidates.map(candidate => (
            <BattleV4SwitchPartyCard
              api={api}
              candidate={candidate}
              selected={candidate.key === selected?.key}
              onSelect={setSelectedKey}
              key={candidate.key}
            />
          ))}
        </aside>
      )}
      <BattleV4SwitchDetailPanel api={api} candidate={selected} />
      {isCoop ? (
        <aside className="battle-v4-switch-team-stack right" aria-label="P3 和 P4 队伍">
          {panelTeams.filter(team => team.playerId === "p3" || team.playerId === "p4").map(team => (
            <BattleV4SwitchTeamList api={api} team={team} selectedKey={selected?.key || ""} onSelect={setSelectedKey} key={team.playerId} />
          ))}
        </aside>
      ) : (
        <aside className="battle-v4-switch-list enemy-list" aria-label="敌方队伍">
          <h3>敌方队伍</h3>
          {enemies.map(candidate => (
            <BattleV4SwitchPartyCard
              api={api}
              candidate={candidate}
              selected={candidate.key === selected?.key}
              onSelect={setSelectedKey}
              key={candidate.key}
            />
          ))}
        </aside>
      )}
      <footer className="battle-v4-switch-footer">
        <button type="button" disabled={busy || forceSwitch} onClick={onClose}>返回</button>
        {selected?.canSwitch && selected.action ? (
          <button className="confirm" type="button" disabled={busy} onClick={() => selected.action && onConfirm(selected.action.choice)}>
            确认交换
          </button>
        ) : <span>{selected?.reason || "不可交换"}</span>}
      </footer>
    </section>
  );
}

function BattleV4SwitchTeamList({api, team, selectedKey, onSelect}: {api: ChangeBattleV2Api; team: SwitchPanelTeamV4; selectedKey: string; onSelect: (key: string) => void}) {
  return (
    <section className={`battle-v4-switch-list battle-v4-switch-team ${team.side} ${team.relation}`} aria-label={`${team.title}队伍`}>
      <h3>{team.title}</h3>
      {team.candidates.map(candidate => (
        <BattleV4SwitchPartyCard
          api={api}
          candidate={candidate}
          selected={candidate.key === selectedKey}
          onSelect={onSelect}
          key={candidate.key}
        />
      ))}
    </section>
  );
}

function BattleV4SwitchPartyCard({api, candidate, selected, onSelect}: {
  api: ChangeBattleV2Api;
  candidate: SwitchCandidateV4;
  selected: boolean;
  onSelect: (key: string) => void;
}) {
  const status = statusBadge(candidate.status);
  const hpRate = candidate.maxHp ? Math.max(0, Math.min(100, candidate.hp / candidate.maxHp * 100)) : 0;
  const identity = switchCandidateIdentity(candidate);
  const known = candidate.known;
  const pokemon = candidate.localPokemon;
  const heldItemName = known ? battleHeldItemName(api, pokemon, candidate.row) : "未知";
  const display = switchCandidateDisplay(candidate, api);
  return (
    <button
      className={`battle-v4-switch-card ${candidate.relation} ${candidate.canSwitch ? "operable" : "readonly"} ${selected ? "selected" : ""} ${candidate.active ? "active" : ""} ${candidate.fainted ? "fainted" : ""} ${candidate.status && !candidate.fainted ? "statused" : ""}`}
      type="button"
      onClick={() => onSelect(candidate.key)}
      title={[candidate.reason, identity ? `ID: ${identity}` : ""].filter(Boolean).join(" · ")}
    >
      <span className="battle-v4-switch-sprite">
        <BattleV4Icon src={known ? display.iconUrl : ""} iconStyle={known ? display.iconStyle : ""} alt={display.name || candidate.label} />
      </span>
      <span className="battle-v4-switch-info">
        <strong>{display.name || candidate.label}</strong>
        <span className="battle-v4-switch-hp">
          <i><b style={{width: `${hpRate}%`}} /></i>
          <b>{known ? candidate.maxHp ? `${candidate.hp}/${candidate.maxHp}` : candidate.row?.condition || "--" : "???"}</b>
        </span>
        <small>{heldItemName}</small>
      </span>
      {candidate.active ? <em className="battle-v4-switch-mark active">出战</em> : null}
      {status ? <StatusBadge badge={status} className="battle-v4-switch-mark status" /> : null}
      {!candidate.canSwitch && !candidate.active && !candidate.fainted ? <em className="battle-v4-switch-mark reason">{candidate.reason}</em> : null}
    </button>
  );
}

function BattleV4SwitchDetailPanel({api, candidate}: {api: ChangeBattleV2Api; candidate: SwitchCandidateV4 | null}) {
  const pokemon = candidate?.localPokemon || null;
  const battleObject = candidate?.battleObject || null;
  const battleSpeciesId = candidate ? switchCandidateBattleSpeciesId(candidate) : "";
  const detail = useMemo(() => {
    if (!candidate?.known) return null;
    try {
      return api.getPokemonDetail(battleSpeciesId || pokemon?.speciesId || "pikachu");
    } catch {
      return null;
    }
  }, [api, candidate?.known, pokemon, battleSpeciesId]);
  const stats = useMemo(() => {
    if (!pokemon && !battleObject) return null;
    try {
      return api.dex.calculatePokemonStats({
        speciesId: battleSpeciesId || pokemon?.speciesId || battleObject?.battleSpeciesId || "pikachu",
        level: pokemon?.level || battleObject?.level || 50,
        nature: pokemon?.nature,
        evs: pokemon?.evs,
        ivs: pokemon?.ivs,
      }).stats;
    } catch {
      return null;
    }
  }, [api, pokemon, battleObject, battleSpeciesId]);
  if (!candidate || !candidate.known || (!pokemon && !battleObject)) {
    return (
      <section className="battle-v4-switch-detail empty">
        <header><strong>能力</strong></header>
        <div className="battle-v4-switch-empty-detail">
          <strong>{candidate?.label || "请选择我方宝可梦"}</strong>
          <span>{candidate?.known ? candidate?.row?.details || "暂无本地详情" : "尚未出场，资料未知"}</span>
        </div>
      </section>
    );
  }
  const display = switchCandidateDisplay(candidate, api);
  const level = pokemon?.level || battleObject?.level || 50;
  if (candidate.relation !== "self") {
    const hpRate = candidate.maxHp ? Math.max(0, Math.min(100, candidate.hp / candidate.maxHp * 100)) : 0;
    const status = statusBadge(candidate.fainted ? "fnt" : candidate.status);
    return (
      <section className="battle-v4-switch-detail readonly">
        <header>
          <strong>{candidate.relation === "ally" ? "队友资料" : "对方资料"}</strong>
          <span>{display.name || pokemon?.nameZh || pokemon?.name || candidate.label} Lv.{level}</span>
        </header>
        <div className="battle-v4-switch-detail-types">
          {(detail?.types || []).slice(0, 2).map(type => <i key={type}>{type}</i>)}
          <b>{candidate.active ? "场上" : candidate.fainted ? "倒下" : "后备"}</b>
        </div>
        <div className="battle-v4-switch-basic-card">
          <BattleV4Icon src={display.iconUrl} iconStyle={display.iconStyle} alt={display.name || pokemon?.nameZh || pokemon?.name || candidate.label} />
          <span>
            <strong>{display.name || pokemon?.nameZh || pokemon?.name || candidate.label}</strong>
            <small>{battleSpeciesId || candidate.row?.details || pokemon?.speciesId || "未知种类"}</small>
          </span>
        </div>
        <div className="battle-v4-switch-public-info">
          <span><b>HP</b><i><em style={{width: `${hpRate}%`}} /></i><strong>{candidate.maxHp ? `${candidate.hp}/${candidate.maxHp}` : candidate.row?.condition || "--"}</strong></span>
          <span><b>状态</b><strong>{status?.title || "正常"}</strong></span>
          <span><b>公开信息</b><strong>{candidate.battleObject?.battleDetails || candidate.row?.details || `Lv.${level}`}</strong></span>
        </div>
        <small className="battle-v4-switch-identity-note">
          只读信息，不可代替操作
        </small>
      </section>
    );
  }
  return (
    <section className="battle-v4-switch-detail">
      <header>
        <strong>能力</strong>
        <span>{display.name || pokemon?.nameZh || pokemon?.name || candidate.label} Lv.{level}</span>
      </header>
      <div className="battle-v4-switch-detail-types">
        {(detail?.types || []).slice(0, 2).map(type => <i key={type}>{type}</i>)}
        <b>{pokemon?.nature || "性格未知"}</b>
      </div>
      <div className="battle-v4-switch-moves">
        {(pokemon?.moves || []).slice(0, 4).map((move, index) => <BattleV4SwitchMove move={move} key={`${move.moveId}-${index}`} />)}
      </div>
      <div className="battle-v4-switch-ability-item">
        <span>
          <b>特性</b>
          <strong>{pokemon?.abilityNameZh || pokemon?.abilityName || pokemon?.abilityId || "未知"}</strong>
          <em>{pokemon?.abilityId || "暂无说明"}</em>
        </span>
        <span>
          <b>持有物</b>
          <strong>{battleHeldItemName(api, pokemon, candidate.row)}</strong>
          <em>{battleHeldItemId(pokemon, candidate.row) ? "已携带道具" : "没有持有道具"}</em>
        </span>
      </div>
      <div className="battle-v4-switch-stats">
        {STAT_ROWS.map(([stat, label]) => (
          <span key={stat}><b>{label}</b><strong>{stats?.[stat] ?? (stat === "hp" ? battleObject?.maxHp || pokemon?.maxHp : pokemon?.level) ?? "?"}</strong></span>
        ))}
      </div>
      <small className="battle-v4-switch-identity-note">
        ID {shortIdentity(battleObject?.showdownIdentityToken || pokemon?.showdownIdentityToken || pokemon?.showdownId || pokemon?.pokeballId || candidate?.row?.pokeball || pokemon?.localPokemonId || battleObject?.battleKey || "")}
      </small>
    </section>
  );
}

function BattleV4SwitchMove({move}: {move: TrainingMoveSlotV4}) {
  return (
    <span>
      <b>{move.type || "?"}</b>
      <strong>{move.nameZh || move.name || move.moveId}</strong>
      <i>威 {move.power || "—"}</i>
      <em>PP {move.remainingPp}/{move.maxPp}</em>
    </span>
  );
}

function buildSwitchCandidates(party: PokemonBattleOBJ[], switchActions: SwitchActionV4[], debugConfig?: AppDebugConfigV4): SwitchCandidateV4[] {
  const actionByIndex = new Map(switchActions.map(action => [action.pokemonIndex, action]));
  return party.map((obj, index) => {
    const action = actionByIndex.get(obj.teamIndex) || null;
    battleDebugLog(debugConfig, "ui", "resolve-switch-candidate", {
      requestIndex: obj.teamIndex,
      choiceIndex: obj.choiceIndex,
      rowPokeball: obj.row?.pokeball || "",
      resolvedLocalPokemonId: obj.localPokemonId || null,
      resolvedToken: obj.showdownIdentityToken || obj.pokeball || "",
      fallbackReason: "pokemon-battle-obj",
      finalChoice: action?.choice || null,
    });
    const label = obj.displayName || obj.nameZh || obj.name || `空位 ${index + 1}`;
    let reason = "";
    if (!obj.localPokemon && !obj.row && !obj.battleSpeciesId) reason = "空位";
    else if (action?.disabledReason) reason = action.disabledReason;
    else if (obj.active) reason = "当前出战";
    else if (obj.fainted) reason = "已经倒下";
    else if (!action) reason = "无法定位";
    return {
      key: switchCandidateKeyFromObj(obj, index),
      index: obj.teamIndex,
      row: obj.row,
      localPokemon: obj.localPokemon,
      battleObject: obj,
      known: true,
      action,
      relation: "self",
      label,
      status: obj.status,
      hp: obj.hp,
      maxHp: obj.maxHp,
      active: obj.active,
      fainted: obj.fainted,
      canSwitch: Boolean(action && !action.disabled && !reason),
      reason,
    };
  });
}

function buildSwitchPanelTeams(pokemonBattleOBJ: PokemonBattleOBJState, selfCandidates: SwitchCandidateV4[]): SwitchPanelTeamV4[] {
  const playerIds = ["p1", "p2", "p3", "p4"] as const;
  const titles: Record<(typeof playerIds)[number], string> = {
    p1: "P1 队伍",
    p2: "P2 队伍",
    p3: "P3 队伍",
    p4: "P4 队伍",
  };
  return playerIds.map(playerId => {
    const relation = playerId === "p1" ? "self" : playerId === "p3" ? "ally" : "foe";
    const side = playerId === "p1" || playerId === "p3" ? "near" : "far";
    const candidates = playerId === "p1"
      ? selfCandidates
      : buildReadonlySwitchCandidatesForPlayer(pokemonBattleOBJ.partyByPlayer[playerId], playerId, playerId === "p3" ? "ally" : "foe");
    return {
      playerId,
      title: titles[playerId],
      side,
      relation,
      candidates,
    };
  });
}

function buildReadonlySwitchCandidatesForPlayer(
  party: PokemonBattleOBJ[],
  playerId: "p2" | "p3" | "p4",
  relation: "ally" | "foe",
): SwitchCandidateV4[] {
  return party.map((obj, index) => {
    const known = relation === "ally" || Boolean(obj.active || obj.fainted || obj.row || obj.teamState);
    const label = known ? obj.displayName || obj.nameZh || obj.name || `空位 ${index + 1}` : `未知 ${index + 1}`;
    return {
      key: switchCandidateKeyFromObj(obj, index),
      index: obj.teamIndex,
      row: known ? obj.row : null,
      localPokemon: known ? obj.localPokemon : null,
      battleObject: known ? obj : null,
      known,
      action: null,
      relation,
      label,
      status: known ? obj.status : "",
      hp: known ? obj.hp : 0,
      maxHp: known ? obj.maxHp : 0,
      active: known && obj.active,
      fainted: known && obj.fainted,
      canSwitch: false,
      reason: relation === "ally" ? "队友只读" : known ? "对方只读" : "尚未出场",
    };
  });
}

function buildNonCoopEnemySwitchCandidates(pokemonBattleOBJ: PokemonBattleOBJState): SwitchCandidateV4[] {
  const party = pokemonBattleOBJ.partyByPlayer.p2;
  const visible = party.length ? party : [];
  return visible.map((obj, index) => {
    const known = Boolean(obj.active || obj.fainted || obj.row || obj.teamState);
    return {
      key: switchCandidateKeyFromObj(obj, index),
      index: obj.teamIndex,
      row: known ? obj.row : null,
      localPokemon: known ? obj.localPokemon : null,
      battleObject: known ? obj : null,
      known,
      action: null,
      relation: "foe",
      label: known ? obj.displayName || obj.nameZh || obj.name || `未知 ${index + 1}` : `未知 ${index + 1}`,
      status: known ? obj.status : "",
      hp: known ? obj.hp : 0,
      maxHp: known ? obj.maxHp : 0,
      active: known && obj.active,
      fainted: known && obj.fainted,
      canSwitch: false,
      reason: known ? "对方只读" : "尚未出场",
    };
  });
}

function switchCandidateBattleSpeciesId(candidate: SwitchCandidateV4): string {
  return candidate.battleObject?.battleSpeciesId || candidate.row?.details?.split(",")[0]?.trim() || candidate.localPokemon?.speciesId || "";
}

function switchCandidateDisplay(candidate: SwitchCandidateV4, api: ChangeBattleV2Api): {name: string; iconUrl: string; iconStyle: string} {
  const obj = candidate.battleObject;
  if (obj) {
    return {
      name: obj.displayName || obj.nameZh || obj.name || candidate.label,
      iconUrl: obj.iconUrl || obj.frontSpriteUrl || obj.spriteUrl,
      iconStyle: obj.iconStyle,
    };
  }
  const speciesId = switchCandidateBattleSpeciesId(candidate);
  try {
    const detail = speciesId ? api.getPokemonDetail(speciesId) : null;
    return {
      name: detail?.nameZh || detail?.name || candidate.label,
      iconUrl: detail?.sprites?.iconUrl || candidate.localPokemon?.iconUrl || candidate.localPokemon?.frontSpriteUrl || candidate.localPokemon?.spriteUrl || "",
      iconStyle: detail?.sprites?.iconStyle || candidate.localPokemon?.iconStyle || "",
    };
  } catch {
    return {
      name: candidate.localPokemon?.nameZh || candidate.localPokemon?.name || candidate.label,
      iconUrl: candidate.localPokemon?.iconUrl || candidate.localPokemon?.frontSpriteUrl || candidate.localPokemon?.spriteUrl || "",
      iconStyle: candidate.localPokemon?.iconStyle || "",
    };
  }
}

function battleHeldItemId(pokemon: LocalPokemonV4 | null | undefined, row: RequestPokemonV4 | null): string {
  return row?.item || pokemon?.itemId || "";
}

function battleHeldItemName(api: ChangeBattleV2Api, pokemon: LocalPokemonV4 | null | undefined, row: RequestPokemonV4 | null): string {
  const itemId = battleHeldItemId(pokemon, row);
  if (!itemId) return "无道具";
  try {
    const detail = api.getItemDetail(itemId);
    return detail.nameZh || detail.name || itemId;
  } catch {
    return itemId;
  }
}

function slotIdentityLabel(slot: BattleViewSlotV4): string {
  return shortIdentity(slot.showdownIdentityToken || slot.showdownId || slot.pokeballId || slot.localPokemonId);
}

function switchCandidateIdentity(candidate: SwitchCandidateV4): string {
  const token = candidate.battleObject?.showdownIdentityToken
    || candidate.battleObject?.showdownId
    || candidate.battleObject?.pokeballId
    || candidate.battleObject?.pokeball
    || candidate.localPokemon?.showdownIdentityToken
    || candidate.localPokemon?.showdownId
    || candidate.localPokemon?.pokeballId
    || candidate.row?.pokeball
    || "";
  const localId = candidate.battleObject?.localPokemonId || candidate.localPokemon?.localPokemonId || "";
  if (token && localId) return `${shortIdentity(token)} · ${shortIdentity(localId)}`;
  return shortIdentity(token || localId);
}

function switchCandidateKeyFromObj(obj: PokemonBattleOBJ, index: number): string {
  return obj.battleKey || `protocol:${obj.playerId}:${index + 1}`;
}

function battleViewSlotBattleKey(slot: BattleViewSlotV4): string {
  const token = toId(slot.showdownIdentityToken || slot.showdownId || slot.pokeballId || "");
  return token ? `${slot.playerId}:${token}` : "";
}

function shortIdentity(value: string): string {
  if (!value) return "";
  return value.length > 10 ? `${value.slice(0, 10)}…` : value;
}

function BattleV4Icon({src, iconStyle, alt}: {src?: string; iconStyle?: string; alt: string}) {
  if (iconStyle) return <span className="battle-v4-picon" aria-label={alt} style={styleFromCss(iconStyle)} />;
  if (!src || src.includes("pokemonicons-sheet")) return <span className="battle-v4-picon empty" aria-label={alt}>?</span>;
  return <ImageWithFallback src={src} alt={alt} fallback={alt.slice(0, 1) || "?"} />;
}

function styleFromCss(css: string): CSSProperties {
  const match = /url\(([^)]+)\).*?(-?\d+)px\s+(-?\d+)px/.exec(css);
  if (!match) return {};
  return {
    backgroundImage: `url("${styleUrlAssetPath(match[1])}")`,
    backgroundPosition: `${match[2]}px ${match[3]}px`,
    backgroundRepeat: "no-repeat",
  };
}

function requestKeyForCommand(request: BattleRequestV4 | null, requestType: string): string {
  if (!request) return "none";
  if (request.rqid !== undefined) return `${requestType}:${request.rqid}`;
  const moves = (request.active || []).map(active => (active?.moves || []).map(move => `${move.id || move.move}:${move.pp ?? ""}:${move.disabled ? 1 : 0}`).join("/")).join("|");
  const switches = (request.forceSwitch || []).map(Boolean).join(",");
  const side = (request.side?.pokemon || []).map(pokemon => `${pokemon.ident}:${pokemon.pokeball || ""}:${pokemon.condition}:${pokemon.active ? 1 : 0}`).join("|");
  return `${requestType}:${moves}:${switches}:${side}`;
}

function requestDebugSummary(command: BattleViewModelV4["command"]) {
  const request = command.request;
  const normalized = command.normalizedRequest;
  if (!request) return null;
  return {
    requestType: normalized?.requestType || command.requestType,
    rqid: request.rqid,
    noCancel: normalized?.noCancel ?? Boolean(request.noCancel),
    targetable: normalized?.targetable ?? Boolean(request.targetable),
    requestLength: normalized?.requestLength ?? command.requestLength,
    activeIndex: normalized?.activeIndex ?? command.activeIndex,
    activeLength: request.active?.length || 0,
    forceSwitch: request.forceSwitch || null,
    ally: Boolean(normalized?.readonlyAlly || request.ally),
    readonlyAllyPokemon: normalized?.readonlyAlly?.pokemon?.length || 0,
    sidePokemon: (normalized?.sidePokemon || request.side?.pokemon || []).map((pokemon, index) => ({
      requestIndex: index,
      choiceIndex: normalized?.choiceIndexByTeamIndex?.[index] || index + 1,
      ident: pokemon.ident,
      details: pokemon.details,
      condition: pokemon.condition,
      active: Boolean(pokemon.active),
      pokeball: pokemon.pokeball || "",
    })),
  };
}

function buildSpecialMoveDisplayDiagnostics(snapshot: BattleSessionSnapshotV4 | null) {
  const request = snapshot?.requests.p1;
  return (request?.active || []).map((active, activeIndex) => ({
    activeIndex,
    moves: (active?.moves || []).map((move, moveIndex) => ({
      moveIndex,
      baseMoveId: move.id || toId(move.move),
      baseMoveName: move.move || move.id,
      zMoveId: move.zMove?.id || toId(move.zMove?.move || ""),
      zMoveName: move.zMove?.move || move.zMove?.id || "",
      maxMoveId: move.maxMove?.id || toId(move.maxMove?.move || ""),
      maxMoveName: move.maxMove?.move || move.maxMove?.id || "",
    })),
  }));
}

function snapshotDebugSummary(snapshot: BattleSessionSnapshotV4) {
  const request = snapshot.requests.p1 || null;
  const command = projectBattleViewModelV4(snapshot, "p1").command;
  return {
    status: snapshot.status,
    turn: snapshot.turn,
    winner: snapshot.winner,
    request: request ? requestDebugSummary(command) : null,
    requests: Object.fromEntries(Object.entries(snapshot.requests).map(([playerId, playerRequest]) => [
      playerId,
      playerRequest ? summarizeRawRequest(playerRequest) : null,
    ])),
    lastChoices: snapshot.debug.lastChoices.slice(-12),
    inputLogTail: snapshot.debug.inputLog.slice(-12),
    playerStreamTail: snapshot.debug.playerStreams.slice(-20),
    activeSlots: snapshot.active.map(active => ({
      ident: active.ident,
      playerId: active.playerId,
      slot: active.slot,
      species: active.species,
      condition: active.condition,
      hp: active.hp,
      maxHp: active.maxHp,
      status: active.status,
      fainted: active.fainted,
    })),
    recordTail: snapshot.rawLog.slice(-12),
  };
}

function summarizeRawRequest(request: BattleRequestV4) {
  return {
    wait: Boolean(request.wait),
    teamPreview: Boolean(request.teamPreview),
    targetable: Boolean(request.targetable),
    rqid: request.rqid,
    activeLength: request.active?.length || 0,
    forceSwitch: request.forceSwitch || null,
    side: request.side ? {
      id: request.side.id,
      pokemon: request.side.pokemon.map((pokemon, index) => ({
        index,
        ident: pokemon.ident,
        details: pokemon.details,
        condition: pokemon.condition,
        active: Boolean(pokemon.active),
        fainted: Boolean(pokemon.fainted),
        pokeball: pokemon.pokeball || "",
      })),
    } : null,
  };
}

function battleV4BlockingError(snapshot: BattleSessionSnapshotV4 | null, lastSubmitError?: BattleSubmitErrorV4 | null): BattleV4BlockingError | null {
  const debugLine = latestBattleV4BlockingInputLog(snapshot);
  const snapshotError = String(snapshot?.error || "").trim();
  const submitError = battleV4BlockingSubmitError(lastSubmitError);
  if (snapshot?.status !== "blocked" && !snapshotError && !debugLine && !submitError) return null;
  const detail = snapshotError || debugLine || submitError || "Battle service blocked without detail.";
  const message = battleV4PlayerFacingErrorMessage(detail);
  return {
    key: `${snapshot?.id || "no-session"}:${snapshot?.turn ?? "no-turn"}:${snapshot?.status || "no-status"}:${detail}`,
    message,
    detail,
  };
}

function battleV4BlockingSubmitError(lastSubmitError?: BattleSubmitErrorV4 | null): string {
  const reason = String(lastSubmitError?.reason || "");
  const detail = String(lastSubmitError?.error || reason || "").trim();
  if (!detail) return "";
  return /blocked|invalid|snapshot\.error/i.test(`${reason} ${detail}`) ? detail : "";
}

function latestBattleV4BlockingInputLog(snapshot: BattleSessionSnapshotV4 | null): string {
  const line = snapshot?.debug.inputLog.slice().reverse().find(entry =>
    entry.includes("[BattleV4][blocked]") ||
    entry.includes("[Invalid choice]") ||
    entry.includes("[BattleV4][invalid-choice]") ||
    entry.includes("|error|")
  );
  return line || "";
}

function battleV4PlayerFacingErrorMessage(detail: string): string {
  const text = String(detail || "").trim();
  if (!text) return "战斗服务进入异常状态，请导出诊断后重新进入战斗。";
  if (/invalid choice|invalid-choice|missing-target/i.test(text)) return "提交的战斗指令不合法，战斗已停止以避免继续错乱。";
  if (/blocked/i.test(text)) return "战斗服务进入阻塞状态，请导出诊断后重新进入战斗。";
  return text.length > 120 ? `${text.slice(0, 120)}...` : text;
}

function battleV4BlockingInputLogTail(snapshot: BattleSessionSnapshotV4 | null): string[] {
  return (snapshot?.debug.inputLog || []).filter(entry =>
    entry.includes("[BattleV4][blocked]") ||
    entry.includes("[Invalid choice]") ||
    entry.includes("[BattleV4][invalid-choice]") ||
    entry.includes("|error|")
  ).slice(-20);
}

function battleV4StallDiagnosis(snapshot: BattleSessionSnapshotV4 | null): string[] {
  if (!snapshot) return ["missing-snapshot"];
  const diagnosis: string[] = [];
  const p1 = snapshot.requests.p1;
  const aiRequests = Object.entries(snapshot.requests)
    .filter(([playerId]) => playerId !== "p1")
    .filter(([, request]) => request && !request.wait);
  if (snapshot.status === "running" && !p1) diagnosis.push("p1-request-missing");
  if (p1?.wait) diagnosis.push("p1-wait-request");
  for (const [playerId, request] of aiRequests) {
    if (request?.forceSwitch?.some(Boolean)) diagnosis.push(`${playerId}-pending-force-switch`);
    else if (request?.teamPreview) diagnosis.push(`${playerId}-pending-team-preview`);
    else diagnosis.push(`${playerId}-pending-action`);
  }
  const lastRaw = snapshot.rawLog.slice(-20);
  if (lastRaw.some(line => line.startsWith("|faint|"))) diagnosis.push("recent-faint");
  if (lastRaw.some(line => line.startsWith("|turn|"))) diagnosis.push(`last-turn-${snapshot.turn}`);
  return diagnosis.length ? diagnosis : ["no-obvious-stall-signal"];
}

function buildBattleV4Diagnostics(snapshot: BattleSessionSnapshotV4 | null, draft: BattleCommandDraftV4 | null, playbackDebug?: BattlePlaybackDebugV4 | null, lastSubmitError?: BattleSubmitErrorV4 | null, diagnosticsContext?: BattleV4DiagnosticsContext | null, uiState?: BattleV4DiagnosticsUiState | null) {
  const command = snapshot ? projectBattleViewModelV4(snapshot, "p1", draft).command : null;
  return {
    exportedAt: new Date().toISOString(),
    diagnosis: battleV4StallDiagnosis(snapshot),
    battleError: battleV4BlockingError(snapshot, lastSubmitError),
    lastSubmitError: lastSubmitError || null,
    context: {
      formalRun: diagnosticsContext?.formalRun || null,
      playerVault: diagnosticsContext?.playerVault || null,
    },
    snapshotSummary: snapshot ? snapshotDebugSummary(snapshot) : null,
    draft,
    pendingMoveAction: uiState?.pendingMoveAction || null,
    p1RawRequest: command?.request || null,
    p1NormalizedRequest: command ? requestDebugSummary(command) : null,
    snapshotStatus: snapshot?.status || null,
    snapshotError: snapshot?.error || null,
    blockedInputLogTail: battleV4BlockingInputLogTail(snapshot),
    visualSlots: {
      near: uiState?.visualNearTeam || [],
      far: uiState?.visualFarTeam || [],
    },
    allRequests: snapshot?.requests || {},
    players: snapshot?.players.map(player => ({
      playerId: player.playerId,
      controller: player.controller,
      alliance: player.alliance,
      teamMapping: player.teamMapping || [],
      draftBag: player.draft?.bag || null,
      draftLocalTeam: player.draft?.localTeam || null,
      team: player.team.map((pokemon, index) => ({
        index,
        species: pokemon.species,
        name: pokemon.name,
        pokeball: pokemon.pokeball,
        entryHp: pokemon.entryHp,
        entryStatus: pokemon.entryStatus,
      })),
    })) || [],
    active: snapshot?.active || [],
    lastChoices: snapshot?.debug.lastChoices || [],
    inputLog: snapshot?.debug.inputLog || [],
    selectedSpecialChoiceSuffix: draft?.currentMove?.selectedSpecial || null,
    specialMoveDisplayOptions: buildSpecialMoveDisplayDiagnostics(snapshot),
    playerStreams: snapshot?.debug.playerStreams || [],
    playerStreamTail: snapshot?.debug.playerStreams.slice(-80) || [],
    rawLog: snapshot?.rawLog || [],
    protocolEvents: playbackDebug?.protocolEvents || [],
    semanticEvents: playbackDebug?.semanticEvents || [],
    runtimeState: playbackDebug?.runtimeState || null,
    messageEvents: playbackDebug?.messageEvents || [],
    messageQueue: playbackDebug?.messageQueue || [],
    playbackStepQueue: playbackDebug?.playbackStepQueue || [],
    activePlaybackStep: playbackDebug?.activePlaybackStep || null,
    playbackStepConsumption: playbackDebug?.playbackStepConsumption || [],
    showdownPlaybackTimeline: playbackDebug?.showdownPlaybackTimeline || null,
    playbackCompilerUnavailable: playbackDebug?.playbackCompilerUnavailable || false,
    animationEvents: playbackDebug?.animationEvents || [],
    visualQueue: playbackDebug?.visualQueue || [],
    hpTweens: playbackDebug?.hpTweens || [],
    animationConsumption: playbackDebug?.animationConsumption || [],
    rawIncrements: playbackDebug?.rawIncrements || [],
    specialSystemState: playbackDebug?.renderProbe.visibleSlotSeats || [],
    specialSystemEvents: (playbackDebug?.protocolEvents || []).filter(event =>
      event.eventType === "-zpower" ||
      event.eventType === "-mega" ||
      event.eventType === "-primal" ||
      event.eventType === "-burst" ||
      event.eventType === "-terastallize" ||
      event.rawLine.startsWith("|custom|-endterastallize|") ||
      (event.eventType === "-start" && toId(event.args[2]) === "dynamax") ||
      (event.eventType === "-end" && toId(event.args[2]) === "dynamax")
    ),
    playback: playbackDebug ? {
      lastConsumedRawIndex: playbackDebug.lastConsumedRawIndex,
      hasProtocolState: playbackDebug.hasProtocolState,
      queueLength: playbackDebug.queueLength,
      skipAnimations: playbackDebug.skipAnimations,
      currentAnimation: playbackDebug.currentAnimation,
      currentMessage: playbackDebug.currentMessage,
      runtimeState: playbackDebug.runtimeState,
      semanticEvents: playbackDebug.semanticEvents,
      visualQueue: playbackDebug.visualQueue,
      messageQueue: playbackDebug.messageQueue,
      playbackStepQueue: playbackDebug.playbackStepQueue,
      activePlaybackStep: playbackDebug.activePlaybackStep,
      playbackStepConsumption: playbackDebug.playbackStepConsumption,
      showdownPlaybackTimeline: playbackDebug.showdownPlaybackTimeline,
      playbackCompilerUnavailable: playbackDebug.playbackCompilerUnavailable,
      hpTweens: playbackDebug.hpTweens,
      activeTimelineId: playbackDebug.activeTimelineId,
      activeTimelineStep: playbackDebug.activeTimelineStep,
      activeTimelineStepIndex: playbackDebug.activeTimelineStepIndex,
      renderedTimelineSteps: playbackDebug.renderedTimelineSteps,
      timelineExecutionProbe: playbackDebug.timelineExecutionProbe,
      renderProbe: playbackDebug.renderProbe,
    } : null,
  };
}

function exportBattleV4Diagnostics(snapshot: BattleSessionSnapshotV4 | null, draft: BattleCommandDraftV4 | null, playbackDebug?: BattlePlaybackDebugV4 | null, lastSubmitError?: BattleSubmitErrorV4 | null, diagnosticsContext?: BattleV4DiagnosticsContext | null, uiState?: BattleV4DiagnosticsUiState | null) {
  if (!snapshot) return;
  const diagnostics = buildBattleV4Diagnostics(snapshot, draft, playbackDebug, lastSubmitError, diagnosticsContext, uiState);
  const blob = new Blob([JSON.stringify(diagnostics, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `battle-v4-diagnostics-${snapshot.id}-turn-${snapshot.turn}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function BattleV4StatusModal({snapshot, slots, api, onClose}: {
  snapshot: BattleSessionSnapshotV4 | null;
  slots: BattleViewSlotV4[];
  api: ChangeBattleV2Api;
  onClose: () => void;
}) {
  const status = useMemo(() => projectBattleV4BattleStatus(snapshot), [snapshot]);
  const orderedSlots = useMemo(() => [
    ...sortSlotsForArena(slots.filter(slot => slot.side === "near"), "near"),
    ...sortSlotsForArena(slots.filter(slot => slot.side === "far"), "far"),
  ], [slots]);
  const fieldItems = [status.weather, ...status.fields].filter((item): item is BattleV4FieldStatus => Boolean(item));
  return (
    <div className="battle-v4-status-modal" role="dialog" aria-modal="true" aria-label="对局状态">
      <section className="battle-v4-status-window">
        <header>
          <span>
            <strong>对局状态</strong>
            <small>Turn {status.turn || snapshot?.turn || 0}</small>
          </span>
          <button type="button" onClick={onClose}>关闭</button>
        </header>
        <div className="battle-v4-status-grid">
          <article className="battle-v4-status-field-card">
            <h3>天气 / 场地 / 空间</h3>
            {fieldItems.length ? (
              <div className="battle-v4-status-field-list">
                {fieldItems.map(item => (
                  <span className={`battle-v4-status-field ${item.category}`} key={`${item.category}-${item.side || "field"}-${item.id}`}>
                    <b>{item.label}</b>
                    <small>{item.remaining === null ? item.note : `${item.side === "near" ? "我方 · " : item.side === "far" ? "对方 · " : ""}约 ${item.remaining} 回合`}</small>
                  </span>
                ))}
              </div>
            ) : <p>当前没有天气、场地或空间效果。</p>}
          </article>
          <article className="battle-v4-status-pokemon-card">
            <h3>场上宝可梦强化</h3>
            <div className="battle-v4-status-slot-list">
              {orderedSlots.map(slot => {
                const boosts = status.boostsBySeat[slot.seat] || {};
                const visibleBoosts = BOOST_STAT_IDS.filter(stat => boosts[stat]);
                const badge = statusBadge(slot.fainted ? "fnt" : slot.status);
                const displayName = battleSlotDisplayName(slot, api);
                return (
                  <section className={`battle-v4-status-slot ${slot.side}`} key={`${slot.seat}-${slot.localPokemonId}`}>
                    <div className="battle-v4-status-slot-head">
                      <BattleV4Icon src={slot.iconUrl || slot.frontSpriteUrl || slot.spriteUrl} iconStyle={slot.iconStyle} alt={displayName} />
                      <span>
                        <strong>{localizeProtocolPokemonName(displayName, api)}</strong>
                        <small>{slot.seat} · Lv.{slot.level}</small>
                      </span>
                      {badge ? <StatusBadge badge={badge} /> : <em>正常</em>}
                    </div>
                    {visibleBoosts.length ? (
                      <div className="battle-v4-boost-list">
                        {BOOST_STAT_IDS.map(stat => {
                          const value = boosts[stat] || 0;
                          return (
                            <span className={value > 0 ? "up" : value < 0 ? "down" : ""} key={stat}>
                              <b>{translateDexLabel("stats", stat)}</b>
                              <strong>{value > 0 ? `+${value}` : value}</strong>
                            </span>
                          );
                        })}
                      </div>
                    ) : <p>无能力变化</p>}
                  </section>
                );
              })}
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function projectBattleV4BattleStatus(snapshot: BattleSessionSnapshotV4 | null): BattleV4BattleStatus {
  const status: BattleV4BattleStatus = {
    turn: snapshot?.turn || 0,
    weather: null,
    fields: [],
    boostsBySeat: {},
  };
  if (!snapshot) return status;
  for (const rawLine of snapshot.rawLog) {
    const {args, kwArgs} = parseBattleProtocolLineV4(rawLine);
    const command = args[0] || "";
    if (command === "turn") {
      status.turn = Number(args[1] || status.turn) || status.turn;
      tickFieldStatus(status);
      continue;
    }
    if (command === "switch" || command === "drag" || command === "replace") {
      const seat = protocolSeatFromIdent(args[1] || "");
      if (seat) status.boostsBySeat[seat] = {};
      continue;
    }
    if (command === "-weather") {
      const id = protocolEffectId(args[1]);
      if (!id || id === "none") {
        status.weather = null;
      } else if (kwArgs.upkeep && status.weather?.id === id) {
        status.weather.note = status.weather.remaining === null ? "持续中" : status.weather.note;
      } else {
        status.weather = {
          id,
          label: weatherStatusLabel(id, args[1]),
          category: "weather",
          remaining: defaultWeatherTurns(id),
          note: "持续中",
        };
      }
      continue;
    }
    if (command === "-fieldstart") {
      const id = protocolEffectId(args[1]);
      if (!id) continue;
      const next = {
        id,
        label: fieldStatusLabel(id, args[1]),
        category: fieldCategory(id),
        remaining: defaultFieldTurns(id, Boolean(kwArgs.persistent)),
        note: "持续中",
      };
      status.fields = status.fields.filter(item => {
        if (next.category === "terrain" && item.category === "terrain") return false;
        if (next.category === "room" && item.id === id) return false;
        return item.id !== id;
      });
      status.fields.push(next);
      continue;
    }
    if (command === "-fieldend") {
      const id = protocolEffectId(args[1]);
      status.fields = status.fields.filter(item => item.id !== id);
      continue;
    }
    if (command === "-sidestart") {
      const id = normalizeSideConditionStatusId(protocolEffectId(args[2] || args[1]));
      if (!id) continue;
      const side = sideConditionStatusSide(args[1]);
      status.fields = status.fields.filter(item => item.category !== "side" || item.id !== id || item.side !== side);
      status.fields.push({
        id,
        label: sideConditionStatusLabel(id, args[2] || args[1]),
        category: "side",
        side,
        remaining: defaultSideConditionTurns(id),
        note: "持续中",
      });
      continue;
    }
    if (command === "-sideend") {
      const id = normalizeSideConditionStatusId(protocolEffectId(args[2] || args[1]));
      const side = sideConditionStatusSide(args[1]);
      status.fields = status.fields.filter(item => item.category !== "side" || item.id !== id || item.side !== side);
      continue;
    }
    applyBoostProtocol(status.boostsBySeat, args);
  }
  return status;
}

function protocolEffectId(value: unknown): string {
  return toId(normalizeProtocolDisplayName(String(value || "")));
}

function weatherStatusLabel(id: string, raw: unknown): string {
  return id ? translateDexLabel("weather", id) : normalizeProtocolDisplayName(String(raw || "")) || id;
}

function fieldStatusLabel(id: string, raw: unknown): string {
  return id ? translateDexLabel("field", id) : normalizeProtocolDisplayName(String(raw || "")) || id;
}

function sideConditionStatusLabel(id: string, raw: unknown): string {
  return id ? translateDexLabel("sideConditions", id) : normalizeProtocolDisplayName(String(raw || "")) || id;
}

function normalizeSideConditionStatusId(id: string): string {
  if (SIDE_CONDITION_STATUS_IDS.has(id)) return id;
  return "";
}

function sideConditionStatusSide(value: string | undefined): "near" | "far" {
  const seat = protocolSeatFromIdent(value || "");
  if (seat.startsWith("p2") || seat.startsWith("p4")) return "far";
  return "near";
}

function applyBoostProtocol(boostsBySeat: BattleV4BattleStatus["boostsBySeat"], args: string[]) {
  const command = args[0] || "";
  if (command === "-clearallboost") {
    for (const seat of Object.keys(boostsBySeat)) boostsBySeat[seat] = {};
    return;
  }
  const seat = protocolSeatFromIdent(args[1] || "");
  if (!seat) return;
  const boosts = boostsBySeat[seat] || {};
  boostsBySeat[seat] = boosts;
  if (command === "-boost" || command === "-unboost") {
    const stat = normalizeBoostStat(args[2]);
    if (!stat) return;
    const amount = Number(args[3] || 0) || 0;
    boosts[stat] = clampBoost((boosts[stat] || 0) + (command === "-boost" ? amount : -amount));
    if (!boosts[stat]) delete boosts[stat];
    return;
  }
  if (command === "-setboost") {
    const stat = normalizeBoostStat(args[2]);
    if (!stat) return;
    boosts[stat] = clampBoost(Number(args[3] || 0) || 0);
    if (!boosts[stat]) delete boosts[stat];
    return;
  }
  if (command === "-clearboost") {
    boostsBySeat[seat] = {};
    return;
  }
  if (command === "-clearpositiveboost" || command === "-clearnegativeboost") {
    for (const stat of Object.keys(boosts) as BattleV4BoostStat[]) {
      if (command === "-clearpositiveboost" && (boosts[stat] || 0) > 0) delete boosts[stat];
      if (command === "-clearnegativeboost" && (boosts[stat] || 0) < 0) delete boosts[stat];
    }
    return;
  }
  if (command === "-invertboost") {
    for (const stat of Object.keys(boosts) as BattleV4BoostStat[]) boosts[stat] = clampBoost(-(boosts[stat] || 0));
    return;
  }
  if (command === "-swapboost" || command === "-copyboost") {
    const otherSeat = protocolSeatFromIdent(args[2] || "");
    if (!otherSeat) return;
    const otherBoosts = boostsBySeat[otherSeat] || {};
    boostsBySeat[otherSeat] = otherBoosts;
    const stats = (args[3] ? args[3].split(",") : BOOST_STAT_IDS).map(stat => normalizeBoostStat(stat)).filter((stat): stat is BattleV4BoostStat => Boolean(stat));
    for (const stat of stats) {
      if (command === "-copyboost") {
        boosts[stat] = otherBoosts[stat] || 0;
      } else {
        const current = boosts[stat] || 0;
        boosts[stat] = otherBoosts[stat] || 0;
        otherBoosts[stat] = current;
      }
      if (!boosts[stat]) delete boosts[stat];
      if (!otherBoosts[stat]) delete otherBoosts[stat];
    }
  }
}

function protocolSeatFromIdent(value: string): string {
  const match = String(value || "").match(/^(p[1-4])([a-d])?:/i);
  if (!match) return "";
  const playerId = match[1]?.toLowerCase() || "";
  const position = (match[2] || "a").toUpperCase();
  return `${playerId}${position}`;
}

function normalizeBoostStat(value: string | undefined): BattleV4BoostStat | "" {
  const id = toId(value);
  if (id === "atk" || id === "attack") return "atk";
  if (id === "def" || id === "defense") return "def";
  if (id === "spa" || id === "spatk" || id === "specialattack") return "spa";
  if (id === "spd" || id === "spdef" || id === "specialdefense") return "spd";
  if (id === "spe" || id === "speed") return "spe";
  if (id === "accuracy") return "accuracy";
  if (id === "evasion") return "evasion";
  return "";
}

function clampBoost(value: number): number {
  return Math.max(-6, Math.min(6, value));
}

function tickFieldStatus(status: BattleV4BattleStatus) {
  const weather = status.weather;
  if (weather && weather.remaining !== null) {
    const remaining = Math.max(0, weather.remaining - 1);
    status.weather = {...weather, remaining, note: remaining <= 0 ? "可能即将结束" : weather.note};
  }
  status.fields = status.fields.map(item => item.remaining === null ? item : {
    ...item,
    remaining: Math.max(0, item.remaining - 1),
    note: item.remaining <= 1 ? "可能即将结束" : item.note,
  });
}

function defaultWeatherTurns(id: string): number | null {
  if (id === "desolateland" || id === "primordialsea" || id === "deltastream") return null;
  return WEATHER_STATUS_IDS.has(id) ? 5 : null;
}

function fieldCategory(id: string): BattleV4FieldStatus["category"] {
  if (id.endsWith("terrain")) return "terrain";
  if (id.endsWith("room")) return "room";
  return "field";
}

function defaultFieldTurns(id: string, persistent: boolean): number | null {
  if (id.endsWith("terrain")) return persistent ? 8 : 5;
  if (id.endsWith("room")) return 5;
  if (id === "gravity") return 5;
  return null;
}

function defaultSideConditionTurns(id: string): number | null {
  if (id === "tailwind") return 4;
  if (id === "reflect" || id === "lightscreen" || id === "auroraveil") return 5;
  if (id === "safeguard" || id === "mist") return 5;
  return null;
}

function BattleV4DebugModal({snapshot, draft, playbackDebug, diagnosticsContext, onClose}: {snapshot: BattleSessionSnapshotV4 | null; draft: BattleCommandDraftV4 | null; playbackDebug?: BattlePlaybackDebugV4 | null; diagnosticsContext?: BattleV4DiagnosticsContext | null; onClose: () => void}) {
  const [tab, setTab] = useState<"request" | "raw" | "protocol" | "message" | "animation">("request");
  const command = snapshot ? projectBattleViewModelV4(snapshot, "p1", draft).command : null;
  const rawRequest = command?.request || null;
  const normalizedRequest = command ? requestDebugSummary(command) : null;
  const diagnostics = buildBattleV4Diagnostics(snapshot, draft, playbackDebug, null, diagnosticsContext);
  return (
    <div className="battle-v4-debug-modal">
      <section>
        <header>
          <strong>BattleStream Debug</strong>
          <button type="button" onClick={() => exportBattleV4Diagnostics(snapshot, draft, playbackDebug, null, diagnosticsContext)} disabled={!snapshot}>导出诊断</button>
          <button type="button" onClick={onClose}>关闭</button>
        </header>
        <nav className="battle-v4-debug-tabs" aria-label="debug 视图">
          <button type="button" className={tab === "request" ? "active" : ""} onClick={() => setTab("request")}>Request</button>
          <button type="button" className={tab === "raw" ? "active" : ""} onClick={() => setTab("raw")}>Raw</button>
          <button type="button" className={tab === "protocol" ? "active" : ""} onClick={() => setTab("protocol")}>Protocol</button>
          <button type="button" className={tab === "message" ? "active" : ""} onClick={() => setTab("message")}>Message</button>
          <button type="button" className={tab === "animation" ? "active" : ""} onClick={() => setTab("animation")}>Animation</button>
        </nav>
        <div className="battle-v4-debug-content">
          {tab === "request" ? (
            <>
              <article>
                <h3>Diagnosis</h3>
                <pre>{JSON.stringify(diagnostics.diagnosis, null, 2)}</pre>
              </article>
              <article>
                <h3>Raw Request</h3>
                <pre>{rawRequest ? JSON.stringify(rawRequest, null, 2) : "暂无 request"}</pre>
              </article>
              <article>
                <h3>All Requests</h3>
                <pre>{snapshot ? JSON.stringify(snapshot.requests, null, 2) : "暂无 requests"}</pre>
              </article>
              <article>
                <h3>Normalized Request</h3>
                <pre>{normalizedRequest ? JSON.stringify(normalizedRequest, null, 2) : "暂无 normalized request"}</pre>
              </article>
              <article>
                <h3>Draft</h3>
                <pre>{draft ? JSON.stringify(draft, null, 2) : "暂无 draft"}</pre>
              </article>
              <article>
                <h3>Last Choices</h3>
                <pre>{snapshot?.debug.lastChoices.length ? JSON.stringify(snapshot.debug.lastChoices.slice(-12), null, 2) : "暂无提交记录"}</pre>
              </article>
              <article>
                <h3>Input Log</h3>
                <pre>{snapshot?.debug.inputLog.slice(-20).join("\n\n") || "暂无 input log"}</pre>
              </article>
              <article>
                <h3>Player Streams</h3>
                <pre>{snapshot?.debug.playerStreams.length ? JSON.stringify(snapshot.debug.playerStreams.slice(-40), null, 2) : "暂无 player stream"}</pre>
              </article>
            </>
          ) : null}
          {tab === "raw" ? (
            <article>
              <h3>Raw Protocol</h3>
              <pre>{snapshot?.rawLog.join("\n") || "暂无日志"}</pre>
            </article>
          ) : null}
          {tab === "protocol" ? (
            <>
              <article>
                <h3>Parsed Protocol Events</h3>
                <pre>{playbackDebug?.protocolEvents.length ? JSON.stringify(playbackDebug.protocolEvents, null, 2) : "暂无 protocol events"}</pre>
              </article>
              <article>
                <h3>Semantic Events</h3>
                <pre>{playbackDebug?.semanticEvents.length ? JSON.stringify(playbackDebug.semanticEvents, null, 2) : "暂无 semantic events"}</pre>
              </article>
              <article>
                <h3>Runtime State</h3>
                <pre>{playbackDebug?.runtimeState ? JSON.stringify(playbackDebug.runtimeState, null, 2) : "暂无 runtime state"}</pre>
              </article>
            </>
          ) : null}
          {tab === "message" ? (
            <>
              <article>
                <h3>Message Events</h3>
                <pre>{playbackDebug?.messageEvents.length ? JSON.stringify(playbackDebug.messageEvents, null, 2) : "暂无 message events"}</pre>
              </article>
              <article>
                <h3>Message Queue</h3>
                <pre>{playbackDebug?.messageQueue.length ? JSON.stringify(playbackDebug.messageQueue, null, 2) : "暂无 message queue"}</pre>
              </article>
              <article>
                <h3>Playback Step Queue</h3>
                <pre>{playbackDebug?.playbackStepQueue.length ? JSON.stringify(playbackDebug.playbackStepQueue, null, 2) : "暂无 playback step queue"}</pre>
              </article>
              <article>
                <h3>Active Playback Step</h3>
                <pre>{playbackDebug?.activePlaybackStep ? JSON.stringify(playbackDebug.activePlaybackStep, null, 2) : "暂无 active playback step"}</pre>
              </article>
            </>
          ) : null}
          {tab === "animation" ? (
            <>
              <article>
                <h3>Animation Queue</h3>
                <pre>{playbackDebug?.animationEvents.length ? JSON.stringify(playbackDebug.animationEvents, null, 2) : "暂无 animation events"}</pre>
              </article>
              <article>
                <h3>Visual Queue</h3>
                <pre>{playbackDebug?.visualQueue.length ? JSON.stringify(playbackDebug.visualQueue, null, 2) : "暂无 visual queue"}</pre>
              </article>
              <article>
                <h3>HP Tweens</h3>
                <pre>{playbackDebug?.hpTweens.length ? JSON.stringify(playbackDebug.hpTweens, null, 2) : "暂无 hp tweens"}</pre>
              </article>
              <article>
                <h3>Raw Increments</h3>
                <pre>{playbackDebug?.rawIncrements.length ? JSON.stringify(playbackDebug.rawIncrements, null, 2) : "暂无 raw increments"}</pre>
              </article>
              <article>
                <h3>Render Probe</h3>
                <pre>{playbackDebug ? JSON.stringify(playbackDebug.renderProbe, null, 2) : "暂无 render probe"}</pre>
              </article>
              <article>
                <h3>Animation Consumption</h3>
                <pre>{playbackDebug?.animationConsumption.length ? JSON.stringify(playbackDebug.animationConsumption, null, 2) : "暂无 consumption"}</pre>
              </article>
              <article>
                <h3>Playback Step Consumption</h3>
                <pre>{playbackDebug?.playbackStepConsumption.length ? JSON.stringify(playbackDebug.playbackStepConsumption, null, 2) : "暂无 playback step consumption"}</pre>
              </article>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
