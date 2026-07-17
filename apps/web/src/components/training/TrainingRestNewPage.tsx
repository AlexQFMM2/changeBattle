import {useEffect, useMemo, useState} from "react";
import type {CSSProperties} from "react";
import {motion} from "motion/react";
import {
  REST_CENTER_LEFT_SIDE_ACTIONS_V4,
  REST_CENTER_RIGHT_SIDE_ACTIONS_V4,
  createSoulmateCandidateListV4,
  type ChangeBattleV2Api,
  type DexStatId,
  type FormalRestTeamHealResultV4,
  type FormalPokemonExchangeResultV4,
  type FormalPokemonExchangeViewV4,
  type FormalRestOpponentPreviewUnlockResultV4,
  type FormalSoulmateEggClaimResultV4,
  type FormalSoulmateEggHatchResultV4,
  type FormalRoundSettlementV4,
  type FormalRestPokemonStatRerollResultV4,
  type FormalTrainingGroundApplyInputV4,
  type FormalTrainingGroundLessonViewV4,
  type FormalTrainingGroundResultV4,
  type SoulmateCandidateV4,
  type TrainingPlayerDraftV4,
  type TrainingRunGameV4,
} from "@changebattle-v2/api";
import {TrainingRestBoardTitle} from "./TrainingRestBoardTitle";
import {TrainingRestConfirmDialog} from "./TrainingRestConfirmDialog";
import {TrainingRestExchangePanel} from "./TrainingRestExchangePanel";
import {TrainingRestNextPreviewPanel, type PreviewPokemonEntry} from "./TrainingRestNextPreviewPanel";
import {TrainingRestNewActionBoard} from "./TrainingRestNewActionBoard";
import {TrainingRestNewBagPanel} from "./TrainingRestNewBagPanel";
import {TrainingRestShopScene} from "./TrainingRestShopScene";
import {TrainingRestShopDialogue} from "./TrainingRestShopDialogue";
import {TrainingRestTrainingGroundScene} from "./TrainingRestTrainingGroundScene";
import {TrainingRestNewTeamPanel} from "./TrainingRestNewTeamPanel";
import {TrainingRestSideBoard} from "./TrainingRestSideBoard";
import {TrainingRestToast, type TrainingRestToastTone} from "./TrainingRestToast";
import {assetUrl} from "../../lib/assetUrl";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import "./TrainingRestNewPage.css";
import type {FormalRestShopV4} from "@changebattle-v2/api";

export type TrainingRestShopController = {
  shop?: FormalRestShopV4 | null;
  getShop?: () => FormalRestShopV4 | null;
  player: TrainingPlayerDraftV4 | null;
  money: number;
  onBuy: (slotId: string) => Promise<string> | string;
  onSell: (itemInstanceIds: string[]) => Promise<string> | string;
};

export type TrainingRestTrainingGroundController = {
  lesson?: FormalTrainingGroundLessonViewV4 | null;
  getLesson?: () => FormalTrainingGroundLessonViewV4 | null;
  lessons?: FormalTrainingGroundLessonViewV4[];
  getLessons?: () => FormalTrainingGroundLessonViewV4[];
  player: TrainingPlayerDraftV4 | null;
  money: number;
  onApply: (input: FormalTrainingGroundApplyInputV4) => Promise<FormalTrainingGroundResultV4> | FormalTrainingGroundResultV4;
  onAdvance: () => Promise<void> | void;
};

export type TrainingRestHealController = {
  money: number;
  cost?: number;
  onHeal: () => Promise<FormalRestTeamHealResultV4> | FormalRestTeamHealResultV4;
};

export type TrainingRestTeamRerollController = {
  money: number;
  locksEnabled?: boolean;
  onRerollStats: (input: {pokemonId: string; part: "ivs" | "evs"; lockedStats: DexStatId[]}) => Promise<FormalRestPokemonStatRerollResultV4> | FormalRestPokemonStatRerollResultV4;
};

export type TrainingRestOpponentPreviewController = {
  enabled: boolean;
  cost: number;
  onUnlock: (input: {unlockKey: string}) => Promise<FormalRestOpponentPreviewUnlockResultV4> | FormalRestOpponentPreviewUnlockResultV4;
};

export type TrainingRestExchangeController = {
  view?: FormalPokemonExchangeViewV4 | null;
  getView?: () => FormalPokemonExchangeViewV4 | null;
  onExchange: (input: {sourcePokemonId: string; targetPokemonId: string}) => Promise<FormalPokemonExchangeResultV4> | FormalPokemonExchangeResultV4;
};

export type TrainingRestNewPageProps = {
  api: ChangeBattleV2Api;
  run: TrainingRunGameV4;
  onRunChange: (run: TrainingRunGameV4) => void;
  onBackToConfig: () => void;
  onStartBattle: () => void;
  onOpenDex: () => void;
  onOpenPokemonDex: (speciesId: string) => void;
  onSaveRunSnapshot?: (run: TrainingRunGameV4) => Promise<TrainingRunGameV4> | TrainingRunGameV4;
  hideSaveAction?: boolean;
  onAbandonRun?: () => void;
  onProceedToSettlement?: () => void;
  moneyAmount?: number;
  roundSettlement?: FormalRoundSettlementV4 | null;
  onRoundSettlementSeen?: (nodeId: string) => void;
  shopController?: TrainingRestShopController;
  trainingGroundController?: TrainingRestTrainingGroundController;
  healController?: TrainingRestHealController;
  teamRerollController?: TrainingRestTeamRerollController;
  opponentPreviewController?: TrainingRestOpponentPreviewController;
  exchangeController?: TrainingRestExchangeController;
  initialNotice?: string | null;
  onInitialNoticeConsumed?: () => void;
  soulmateRewardEnabled?: boolean;
  onSoulmateEggPrepare?: (input: {candidateId: string}) => Promise<FormalSoulmateEggHatchResultV4> | FormalSoulmateEggHatchResultV4;
  onSoulmateEggClaim?: (input: {candidateId: string; nickname?: string}) => Promise<FormalSoulmateEggClaimResultV4> | FormalSoulmateEggClaimResultV4;
};

const PENDING_SETTLEMENT_CAPTURE_ACTIONS = [
  {label: "商店", iconSrc: "aboutIcon/shop.png", disabled: false},
];

type SoulmateHatchState =
  | {phase: "idle"}
  | {phase: "hatching"; candidateId: string; prepare?: FormalSoulmateEggHatchResultV4; error?: string}
  | {phase: "naming"; candidateId: string; prepare: FormalSoulmateEggHatchResultV4; nickname: string; error?: string}
  | {phase: "saving"; candidateId: string; prepare: FormalSoulmateEggHatchResultV4; nickname?: string}
  | {phase: "done"; result: FormalSoulmateEggClaimResultV4}
  | {phase: "error"; message: string};

export function TrainingRestNewPage({api, run, onRunChange, onBackToConfig, onStartBattle, onOpenDex, onOpenPokemonDex, onSaveRunSnapshot, hideSaveAction = false, onAbandonRun, onProceedToSettlement, moneyAmount, roundSettlement, onRoundSettlementSeen, shopController, trainingGroundController, healController, teamRerollController, opponentPreviewController, exchangeController, initialNotice, onInitialNoticeConsumed, soulmateRewardEnabled, onSoulmateEggPrepare, onSoulmateEggClaim}: TrainingRestNewPageProps) {
  const [activeAction, setActiveAction] = useState("我的队伍");
  const [restScene, setRestScene] = useState<"center" | "shop" | "training-ground">("center");
  const [teamPanelOpen, setTeamPanelOpen] = useState(false);
  const [bagPanelOpen, setBagPanelOpen] = useState(false);
  const [exchangePanelOpen, setExchangePanelOpen] = useState(false);
  const [exchangeView, setExchangeView] = useState<FormalPokemonExchangeViewV4 | null>(exchangeController?.view || null);
  const [exchangeSelection, setExchangeSelection] = useState({sourcePokemonId: "", targetPokemonId: ""});
  const [exchangeBusy, setExchangeBusy] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [healConfirmOpen, setHealConfirmOpen] = useState(false);
  const [lessonEndOpen, setLessonEndOpen] = useState(false);
  const [selectedTrainingLesson, setSelectedTrainingLesson] = useState<FormalTrainingGroundLessonViewV4 | null>(null);
  const [unlockTarget, setUnlockTarget] = useState<PreviewPokemonEntry | null>(null);
  const [soulmateDialogOpen, setSoulmateDialogOpen] = useState(false);
  const [soulmateDialogDismissed, setSoulmateDialogDismissed] = useState(false);
  const [selectedSoulmateCandidateId, setSelectedSoulmateCandidateId] = useState("");
  const [soulmateHatch, setSoulmateHatch] = useState<SoulmateHatchState>({phase: "idle"});
  const [message, setMessage] = useState("休息室已就绪。");
  const [toast, setToast] = useState<{id: number; message: string; tone?: TrainingRestToastTone} | null>(null);
  const p1Team = run.players.p1?.localTeam || null;
  const pendingSettlement = run.status === "battleEndedPendingSettlement";
  const soulmateCandidates = useMemo(() => createRestSoulmateCandidates(run), [run]);
  const selectedSoulmateCandidate = soulmateCandidates.find(candidate => candidate.candidateId === selectedSoulmateCandidateId) || null;
  const leftSideActions = REST_CENTER_LEFT_SIDE_ACTIONS_V4
    .filter(action => !(hideSaveAction && action.label === "保存"))
    .map(action => ({label: action.label}));
  const rightSideActions = pendingSettlement
    ? [{label: "去结算", primary: true}]
    : REST_CENTER_RIGHT_SIDE_ACTIONS_V4.map(action => ({label: action.label, primary: action.primary, danger: action.danger}));

  useEffect(() => {
    setSoulmateDialogDismissed(false);
    setSoulmateDialogOpen(false);
    setSelectedSoulmateCandidateId("");
    setSoulmateHatch({phase: "idle"});
  }, [run.id, run.status]);

  useEffect(() => {
    if (!pendingSettlement || !soulmateRewardEnabled || soulmateDialogDismissed || roundSettlement || soulmateHatch.phase !== "idle" || !soulmateCandidates.length) return;
    setSoulmateDialogOpen(true);
  }, [pendingSettlement, roundSettlement, soulmateCandidates.length, soulmateDialogDismissed, soulmateHatch.phase, soulmateRewardEnabled]);

  useEffect(() => {
    if (!initialNotice) return;
    setToast({id: Date.now(), message: initialNotice});
    onInitialNoticeConsumed?.();
  }, [initialNotice, onInitialNoticeConsumed]);

  function updateP1Team(localTeam: TrainingPlayerDraftV4["localTeam"]) {
    const p1 = run.players.p1;
    if (!p1) return;
    const nextP1 = {...p1, localTeam};
    const nextRun = {
      ...run,
      players: {...run.players, p1: nextP1},
      updatedAt: new Date().toISOString(),
    };
    onRunChange(nextRun);
    setMessage("队伍已调整，记得手动保存。");
  }

  async function saveRunGameSnapshot() {
    const draft = {...run, updatedAt: new Date().toISOString()};
    const saved = onSaveRunSnapshot ? await onSaveRunSnapshot(draft) : await api.saveTrainingRun(draft);
    onRunChange(saved);
    setMessage("RunGame 快照已保存。");
  }

  function updateRunGameDraft(nextRun: TrainingRunGameV4, nextMessage: string) {
    onRunChange(nextRun);
    setMessage(nextMessage);
  }

  function showNotice(nextMessage: string, tone: TrainingRestToastTone = "normal") {
    setToast({id: Date.now(), message: nextMessage, tone});
  }

  async function startSoulmateEggHatch(candidate: SoulmateCandidateV4) {
    setSoulmateDialogOpen(false);
    setSoulmateDialogDismissed(true);
    setSoulmateHatch({phase: "hatching", candidateId: candidate.candidateId});
    setMessage("宝可梦蛋开始晃动了。");
    const minAnimation = delay(1800);
    try {
      const preparePromise = Promise.resolve(onSoulmateEggPrepare
        ? onSoulmateEggPrepare({candidateId: candidate.candidateId})
        : {ok: false, run: undefined as never, message: "灵魂伴侣孵化入口暂不可用。"});
      const [prepare] = await Promise.all([preparePromise, minAnimation]);
      if (!prepare.ok) {
        setSoulmateHatch({phase: "error", message: prepare.message});
        setMessage(prepare.message);
        showNotice(prepare.message, "danger");
        return;
      }
      setSoulmateHatch({phase: "naming", candidateId: candidate.candidateId, prepare, nickname: ""});
      setMessage(`${prepare.display?.nameZh || prepare.display?.name || "宝可梦"} 孵化了。`);
    } catch (error) {
      await minAnimation.catch(() => undefined);
      const nextMessage = error instanceof Error ? error.message : "宝可梦蛋孵化失败。";
      setSoulmateHatch({phase: "error", message: nextMessage});
      setMessage(nextMessage);
      showNotice(nextMessage, "danger");
    }
  }

  async function claimSoulmateEgg(nickname?: string) {
    if (soulmateHatch.phase !== "naming") return;
    if (!onSoulmateEggClaim) {
      const nextMessage = "灵魂伴侣入库入口暂不可用。";
      setSoulmateHatch({...soulmateHatch, error: nextMessage});
      setMessage(nextMessage);
      showNotice(nextMessage, "danger");
      return;
    }
    const normalizedNickname = normalizeSoulmateNickname(nickname);
    if (nickname && !normalizedNickname) {
      const nextMessage = "名字不能为空。";
      setSoulmateHatch({...soulmateHatch, error: nextMessage});
      return;
    }
    setSoulmateHatch({phase: "saving", candidateId: soulmateHatch.candidateId, prepare: soulmateHatch.prepare, nickname: normalizedNickname});
    try {
      const result = await onSoulmateEggClaim({candidateId: soulmateHatch.candidateId, nickname: normalizedNickname});
      if (!result.ok) {
        setSoulmateHatch({phase: "naming", candidateId: soulmateHatch.candidateId, prepare: soulmateHatch.prepare, nickname: normalizedNickname || "", error: result.message});
        setMessage(result.message);
        showNotice(result.message, "danger");
        return;
      }
      onRunChange(result.run.restRunSnapshot || run);
      setSoulmateHatch({phase: "done", result});
      setMessage(result.message);
      showNotice(result.message);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "灵魂伴侣入库失败。";
      setSoulmateHatch({phase: "naming", candidateId: soulmateHatch.candidateId, prepare: soulmateHatch.prepare, nickname: normalizedNickname || "", error: nextMessage});
      setMessage(nextMessage);
      showNotice(nextMessage, "danger");
    }
  }

  function closeFloatingPanels() {
    setTeamPanelOpen(false);
    setBagPanelOpen(false);
    setExchangePanelOpen(false);
  }

  function validateBattleLead(): string | null {
    const mode = api.getCurrentTrainingNode(run)?.mode || run.scenario.mode;
    const pokemon = p1Team?.pokemon || [];
    const requiredLeadCount = mode === "doubles" ? 2 : 1;
    const leads = pokemon.slice(0, requiredLeadCount);
    if (leads.length < requiredLeadCount) return mode === "doubles" ? "双打需要至少两只首发宝可梦。" : "当前队伍没有可首发宝可梦。";
    const faintedLead = leads.find(entry => entry.entryHp <= 0);
    if (!faintedLead) return null;
    const name = faintedLead.nameZh || faintedLead.name;
    return mode === "doubles" ? `双打首发两只不能有濒死宝可梦：${name}。` : `首发不能是濒死宝可梦：${name}。`;
  }

  function startBattleAfterValidation() {
    const error = validateBattleLead();
    if (error) {
      setMessage(error);
      showNotice(error, "danger");
      return;
    }
    onStartBattle();
  }

  async function unlockPreviewPokemon(target: PreviewPokemonEntry) {
    if (opponentPreviewController) {
      const result = await opponentPreviewController.onUnlock({unlockKey: target.unlockKey});
      if (result.ok) onRunChange(result.run.restRunSnapshot || run);
      setUnlockTarget(null);
      setMessage(result.message);
      showNotice(result.message, result.ok ? "normal" : "danger");
      return;
    }
    const nextRun = {
      ...run,
      restPreviewUnlocks: {...(run.restPreviewUnlocks || {}), [target.unlockKey]: true as const},
      updatedAt: new Date().toISOString(),
    };
    onRunChange(nextRun);
    setUnlockTarget(null);
    setMessage(`${target.pokemon.nameZh || target.pokemon.name} 已解锁，记得手动保存。`);
  }

  function onLockedPreviewPokemonClick(target: PreviewPokemonEntry) {
    if (opponentPreviewController && !opponentPreviewController.enabled) {
      const nextMessage = "需要点亮星图「小道消息」后才能打听对手情报。";
      setMessage(nextMessage);
      showNotice(nextMessage, "danger");
      return;
    }
    setUnlockTarget(target);
  }

  async function confirmExchangePokemon() {
    if (!exchangeController || exchangeBusy) return;
    setExchangeBusy(true);
    setMessage("正在交换...");
    try {
      const result = await exchangeController.onExchange(exchangeSelection);
      if (result.ok) {
        onRunChange(result.run.restRunSnapshot || run);
        setExchangeSelection({sourcePokemonId: "", targetPokemonId: ""});
        setExchangeView(result.view);
      }
      setMessage(result.message);
      showNotice(result.message, result.ok ? "normal" : "danger");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "交换失败。";
      setMessage(nextMessage);
      showNotice(nextMessage, "danger");
    } finally {
      setExchangeBusy(false);
    }
  }

  async function healTeam() {
    closeFloatingPanels();
    setRestScene("center");
    if (!healController) {
      const nextMessage = "治疗服务仅正式流程开放。";
      setMessage(nextMessage);
      showNotice(nextMessage, "danger");
      return;
    }
    try {
      setMessage("正在治疗...");
      const result = await healController.onHeal();
      if (result.ok) onRunChange(result.run.restRunSnapshot || run);
      setMessage(result.message);
      showNotice(result.message, result.ok ? "normal" : "danger");
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "治疗失败。";
      setMessage(nextMessage);
      showNotice(nextMessage, "danger");
    }
  }

  function currentTrainingLessons(): FormalTrainingGroundLessonViewV4[] {
    const lessons = trainingGroundController?.getLessons?.() || trainingGroundController?.lessons || [];
    if (lessons.length) return lessons;
    const lesson = trainingGroundController?.getLesson?.() || trainingGroundController?.lesson || null;
    return lesson ? [lesson] : [];
  }

  function openTrainingGroundSelection() {
    closeFloatingPanels();
    const lessons = currentTrainingLessons();
    if (!lessons.length) {
      setRestScene("center");
      setMessage("今天暂时没有课程。");
      showNotice("今天暂时没有课程。", "danger");
      return;
    }
    setSelectedTrainingLesson(null);
    setRestScene("training-ground");
    setMessage("训练场老师正在等你选择课程。");
  }

  function enterTrainingLesson(lesson: FormalTrainingGroundLessonViewV4) {
    closeFloatingPanels();
    setSelectedTrainingLesson(lesson);
    setRestScene("training-ground");
    setActiveAction("训练场");
    setMessage(`${trainingLessonTitle(lesson)} 已开始。`);
  }

  function selectAction(action: string) {
    setActiveAction(action);
    if (action === "去结算") {
      setRestScene("center");
      closeFloatingPanels();
      if (onProceedToSettlement) {
        onProceedToSettlement();
        return;
      }
      setMessage("结算入口暂不可用。");
      showNotice("结算入口暂不可用。", "danger");
      return;
    }
    if (action === "我的队伍") {
      setRestScene("center");
      setBagPanelOpen(false);
      setExchangePanelOpen(false);
      setTeamPanelOpen(true);
      return;
    }
    if (action === "我的背包") {
      setRestScene("center");
      setTeamPanelOpen(false);
      setExchangePanelOpen(false);
      setBagPanelOpen(true);
      return;
    }
    if (action === "商店") {
      setActiveAction(action);
      closeFloatingPanels();
      if (!shopController) {
        setRestScene("center");
        setMessage("商店仅正式流程开放。");
        showNotice("商店仅正式流程开放。");
        return;
      }
      setRestScene("shop");
      setMessage("欢迎光临，货架已经整理好了。");
      return;
    }
    if (action === "训练场") {
      closeFloatingPanels();
      if (!trainingGroundController) {
        setRestScene("center");
        setMessage("训练场仅正式流程开放。");
        showNotice("训练场仅正式流程开放。");
        return;
      }
      openTrainingGroundSelection();
      return;
    }
    if (action === "治疗") {
      closeFloatingPanels();
      setRestScene("center");
      if (!healController) {
        const nextMessage = "治疗服务仅正式流程开放。";
        setMessage(nextMessage);
        showNotice(nextMessage, "danger");
        return;
      }
      setHealConfirmOpen(true);
      return;
    }
    if (action === "交换") {
      setRestScene("center");
      closeFloatingPanels();
      if (!exchangeController) {
        setMessage("交换仅正式流程开放。");
        showNotice("交换仅正式流程开放。");
        return;
      }
      const nextExchangeView = exchangeController.getView?.() || exchangeController.view || null;
      const nextExchangeSource = nextExchangeView?.player?.localTeam.pokemon.find(pokemon => !isProtectedSoulmatePokemon(pokemon))?.localPokemonId || "";
      const nextExchangeTarget = nextExchangeView?.opponent?.localTeam.pokemon[0]?.localPokemonId || "";
      setExchangeView(nextExchangeView);
      setExchangeSelection({sourcePokemonId: nextExchangeSource, targetPokemonId: nextExchangeTarget});
      setExchangePanelOpen(true);
      setMessage(nextExchangeView?.message || "选择双方宝可梦后即可交换。");
      return;
    }
    if (["我的背包", "图鉴", "保存"].includes(action)) {
      setRestScene("center");
      setTeamPanelOpen(false);
      setBagPanelOpen(false);
      setExchangePanelOpen(false);
    }
    if (action === "图鉴") {
      onOpenDex();
      return;
    }
    if (action === "保存") {
      if (hideSaveAction) return;
      void saveRunGameSnapshot();
      return;
    }
    if (action === "结束休整") {
      startBattleAfterValidation();
      return;
    }
    if (action === "放弃比赛") setAbandonOpen(true);
  }

  return (
    <motion.section
      className="training-rest-new-page"
      initial={{opacity: 0, scale: 0.985}}
      animate={{opacity: 1, scale: 1}}
      transition={{duration: 0.18}}
      aria-label="新休整页预览"
    >
      <div className="training-rest-new-stage" data-scene={restScene}>
        {restScene === "shop" ? (
          <TrainingRestShopScene
            api={api}
            open
            shop={shopController?.getShop?.() || shopController?.shop || null}
            player={shopController?.player}
            money={shopController?.money ?? moneyAmount ?? 0}
            onBuy={shopController?.onBuy}
            onSell={shopController?.onSell}
            onBack={() => {
              setRestScene("center");
              setActiveAction("我的队伍");
              setMessage("已返回休息室。");
            }}
          />
        ) : (
          <section className="training-rest-new-scene-placeholder" aria-hidden="true" />
        )}
        <section className="training-rest-new-center-scene" aria-label="休息室">
          <img className="training-rest-new-bg" src={assetUrl("training/rest-center-bg.png")} alt="休息室背景预览" />
          {pendingSettlement ? (
            <section className="training-rest-new-next-preview-empty" aria-label="下一场预览" />
          ) : (
            <TrainingRestNextPreviewPanel run={run} onLockedPokemonClick={onLockedPreviewPokemonClick} onUnlockedPokemonClick={pokemon => onOpenPokemonDex(pokemon.speciesId)} />
          )}
          <TrainingRestNewActionBoard activeAction={activeAction} onAction={selectAction} entries={pendingSettlement ? PENDING_SETTLEMENT_CAPTURE_ACTIONS : undefined} />
          {typeof moneyAmount === "number" ? (
            <div className="training-rest-new-money-pill" aria-label="当前金币">
              <img src={assetUrl("aboutIcon/coin.png")} alt="" />
              <strong>{Math.max(0, Math.floor(moneyAmount)).toLocaleString()}</strong>
            </div>
          ) : null}
          <TrainingRestBoardTitle side="left">休息室菜单</TrainingRestBoardTitle>
          <TrainingRestBoardTitle side="right">{pendingSettlement ? "" : "下一场预览"}</TrainingRestBoardTitle>
          <TrainingRestSideBoard
            side="left"
            actions={leftSideActions}
            activeAction={activeAction}
            onAction={selectAction}
          />
          <TrainingRestSideBoard
            side="right"
            actions={rightSideActions}
            activeAction={activeAction}
            onAction={selectAction}
          />
          <div className="training-rest-new-save-message" role="status">{message}</div>
        </section>
        {restScene === "training-ground" ? (
          <TrainingRestTrainingGroundScene
            api={api}
            open
            lesson={selectedTrainingLesson}
            lessonOptions={selectedTrainingLesson ? [] : currentTrainingLessons()}
            player={trainingGroundController?.player}
            money={trainingGroundController?.money ?? moneyAmount ?? 0}
            onApply={trainingGroundController?.onApply ? input => trainingGroundController.onApply({
              ...input,
              lessonId: selectedTrainingLesson?.lessonId,
              lessonKind: selectedTrainingLesson?.kind,
            }) : undefined}
            onLessonComplete={nextMessage => {
              setMessage(nextMessage);
              setLessonEndOpen(true);
            }}
            onSelectLesson={enterTrainingLesson}
            onCancelLesson={() => {
              setSelectedTrainingLesson(null);
              setRestScene("training-ground");
              setActiveAction("训练场");
              setMessage("重新选择课程。");
            }}
            onBack={() => {
              setSelectedTrainingLesson(null);
              setRestScene("center");
              setActiveAction("我的队伍");
              setMessage("已返回休息室。");
            }}
          />
        ) : (
          <section className="training-rest-new-scene-placeholder" aria-hidden="true" />
        )}
      </div>
      {teamPanelOpen || bagPanelOpen ? (
        <div className="training-rest-new-modal-layer training-rest-new-floating-panel-layer" role="presentation">
          <button
            className="training-rest-new-panel-scrim"
            type="button"
            aria-label="关闭当前面板"
            onClick={closeFloatingPanels}
          />
          <TrainingRestNewTeamPanel
            api={api}
            open={teamPanelOpen}
            localTeam={p1Team}
            onClose={() => setTeamPanelOpen(false)}
            onLocalTeamChange={updateP1Team}
            statRerollController={teamRerollController ? {
              money: teamRerollController.money,
              locksEnabled: teamRerollController.locksEnabled,
              onRerollStats: async input => {
                const result = await teamRerollController.onRerollStats(input);
                setMessage(result.message);
                showNotice(result.message, result.ok ? "normal" : "danger");
                return result;
              },
            } : undefined}
          />
          <TrainingRestNewBagPanel
            api={api}
            open={bagPanelOpen}
            run={run}
            onClose={() => setBagPanelOpen(false)}
            onRunDraftChange={updateRunGameDraft}
            onNotice={showNotice}
          />
        </div>
      ) : null}
      {exchangePanelOpen ? (
        <TrainingRestExchangePanel
          open
          view={exchangeView}
          selectedSourceId={exchangeSelection.sourcePokemonId}
          selectedTargetId={exchangeSelection.targetPokemonId}
          busy={exchangeBusy}
          onSelectSource={sourcePokemonId => setExchangeSelection(current => ({...current, sourcePokemonId}))}
          onSelectTarget={targetPokemonId => setExchangeSelection(current => ({...current, targetPokemonId}))}
          onConfirm={() => void confirmExchangePokemon()}
          onClose={() => setExchangePanelOpen(false)}
        />
      ) : null}
      {toast ? (
        <TrainingRestToast
          key={toast.id}
          message={toast.message}
          tone={toast.tone}
          durationMs={1800}
          onDone={() => setToast(current => current?.id === toast.id ? null : current)}
        />
      ) : null}
      {abandonOpen ? (
        <TrainingRestConfirmDialog
          title="是否放弃？"
          message={onAbandonRun ? "当前正式 run 会进入结算页，已完成的胜场会结算 BP。" : "当前只是确认弹窗预览，暂不执行实际效果。"}
          confirmLabel="放弃"
          danger
          ariaLabel="确认放弃比赛"
          onCancel={() => setAbandonOpen(false)}
          onConfirm={onAbandonRun || onBackToConfig}
        />
      ) : null}
      {unlockTarget ? (
        <TrainingRestConfirmDialog
          title="是否解锁？"
          message="解锁后会显示这只宝可梦，并可打开图鉴详情。"
          confirmLabel={opponentPreviewController ? `解锁（${opponentPreviewController.cost}金币）` : "解锁"}
          ariaLabel="确认解锁预览"
          onCancel={() => setUnlockTarget(null)}
          onConfirm={() => void unlockPreviewPokemon(unlockTarget)}
        />
      ) : null}
      {healConfirmOpen ? (
        <div className="training-rest-new-modal-layer" role="presentation">
          <TrainingRestShopDialogue
            speaker="医疗员"
            itemName="全队治疗"
            portraitSrc="npc/staff/nurse.png"
            text={`需要花费 ${Math.max(1, Math.floor(Number(healController?.cost ?? 250))).toLocaleString()} 金币。治疗后全队会恢复满 HP，异常状态也会清除，PP 也会补满。要现在治疗吗？`}
            actions={[
              {label: "取消", onClick: () => setHealConfirmOpen(false)},
              {
                label: "治疗",
                meta: `${Math.max(1, Math.floor(Number(healController?.cost ?? 250))).toLocaleString()} 金币`,
                primary: true,
                onClick: () => {
                  setHealConfirmOpen(false);
                  void healTeam();
                },
              },
            ]}
          />
        </div>
      ) : null}
      {lessonEndOpen ? (
        <TrainingRestConfirmDialog
          title="当前课程已结束"
          message="可以继续选择课程，也可以返回休息室。"
          confirmLabel="继续选课"
          cancelLabel="返回休息室"
          ariaLabel="训练课程结束"
          onCancel={() => {
            setLessonEndOpen(false);
            setRestScene("center");
            setActiveAction("我的队伍");
            setMessage("已返回休息室。");
          }}
          onConfirm={() => {
            setLessonEndOpen(false);
            openTrainingGroundSelection();
          }}
        />
      ) : null}
      {soulmateDialogOpen ? (
        <div className="training-rest-new-modal-layer training-rest-new-soulmate-layer" role="presentation">
          <section className="training-rest-new-soulmate-candidates" aria-label="选择宝可梦蛋原型">
            <header>
              <strong>同行记录</strong>
              <span>{soulmateCandidates.length} 只宝可梦</span>
            </header>
            <div className="training-rest-new-soulmate-grid">
              {soulmateCandidates.map(candidate => (
                <button
                  className="training-rest-new-soulmate-card"
                  data-selected={candidate.candidateId === selectedSoulmateCandidateId}
                  type="button"
                  key={candidate.candidateId}
                  onClick={() => setSelectedSoulmateCandidateId(candidate.candidateId)}
                >
                  <span className="training-rest-new-soulmate-icon">{renderSoulmateCandidateIcon(candidate)}</span>
                  <strong>{candidate.displayName}</strong>
                  <small>{candidate.usedRounds.length ? `记录 ${candidate.usedRounds.length}` : "本局同行"}</small>
                </button>
              ))}
            </div>
          </section>
          <TrainingRestShopDialogue
            speaker="护士"
            itemName={selectedSoulmateCandidate?.displayName || "宝可梦蛋"}
            portraitSrc="npc/staff/nurse.png"
            text="宝可梦们很喜欢你呢，你真是一位出色的训练师。作为奖励工厂允许你选择一只宝可梦蛋带走培养；请选择吧"
            actions={[
              {
                label: "不用了",
                onClick: () => {
                  setSoulmateDialogOpen(false);
                  setSoulmateDialogDismissed(true);
                  setSelectedSoulmateCandidateId("");
                },
              },
              {
                label: "就决定是你了",
                primary: true,
                disabled: !selectedSoulmateCandidate,
                onClick: () => {
                  if (selectedSoulmateCandidate) void startSoulmateEggHatch(selectedSoulmateCandidate);
                },
              },
            ]}
          />
        </div>
      ) : null}
      {soulmateHatch.phase !== "idle" ? (
        <SoulmateEggHatchDialog
          state={soulmateHatch}
          onNicknameChange={nickname => {
            if (soulmateHatch.phase === "naming") setSoulmateHatch({...soulmateHatch, nickname: normalizeSoulmateNickname(nickname) || ""});
          }}
          onSkipNickname={() => void claimSoulmateEgg()}
          onConfirmNickname={() => {
            if (soulmateHatch.phase === "naming") void claimSoulmateEgg(soulmateHatch.nickname);
          }}
          onClose={() => {
            if (soulmateHatch.phase === "hatching" || soulmateHatch.phase === "saving") return;
            setSoulmateHatch({phase: "idle"});
          }}
        />
      ) : null}
      {roundSettlement ? (
        <TrainingRestConfirmDialog
          title="本局结算"
          message={formatRoundSettlementMessage(roundSettlement)}
          confirmLabel="知道了"
          cancelLabel="关闭"
          ariaLabel="本局战后结算"
          onCancel={() => onRoundSettlementSeen?.(roundSettlement.nodeId)}
          onConfirm={() => onRoundSettlementSeen?.(roundSettlement.nodeId)}
        />
      ) : null}
    </motion.section>
  );
}

function trainingLessonTitle(lesson: FormalTrainingGroundLessonViewV4): string {
  if (lesson.kind === "tutor") return "教学课程";
  if (lesson.kind === "egg") return "蛋招式课程";
  if (lesson.kind === "self-learn") return "自学招式课程";
  return "自习课程";
}

function formatRoundSettlementMessage(settlement: FormalRoundSettlementV4): string {
  const parts = [`胜利奖励 +${settlement.rewardCoins} 金币`];
  if (settlement.revivedPokemonIds.length) {
    parts.push(`复活 ${settlement.revivedPokemonIds.length} 只宝可梦${settlement.reviveCost > 0 ? `，医疗费 -${settlement.reviveCost} 金币` : "，医疗费已免除"}`);
  }
  if (settlement.emergencyHealedPokemonIds.length) parts.push(`专业急诊：${settlement.emergencyHealedPokemonIds.length} 只恢复到半血`);
  if (settlement.outpatientHealedPokemonIds.length) parts.push(`普通门诊：${settlement.outpatientHealedPokemonIds.length} 只获得门诊恢复`);
  if (settlement.leveledPokemonIds.length) parts.push(`熟能生巧：${settlement.leveledPokemonIds.length} 只宝可梦等级 +1`);
  parts.push(`本局净收益 ${settlement.netCoins >= 0 ? "+" : ""}${settlement.netCoins} 金币。`);
  return parts.join("。");
}

function SoulmateEggHatchDialog({
  state,
  onNicknameChange,
  onSkipNickname,
  onConfirmNickname,
  onClose,
}: {
  state: SoulmateHatchState;
  onNicknameChange: (nickname: string) => void;
  onSkipNickname: () => void;
  onConfirmNickname: () => void;
  onClose: () => void;
}) {
  const display = state.phase === "naming" || state.phase === "saving"
    ? state.prepare.display
    : state.phase === "done"
      ? state.result.display
      : undefined;
  const nickname = state.phase === "naming" ? state.nickname : "";
  const busy = state.phase === "hatching" || state.phase === "saving";
  const title = state.phase === "hatching"
    ? "宝可梦蛋正在孵化"
    : state.phase === "naming"
      ? "要给它起名字吗？"
      : state.phase === "saving"
        ? "正在送入箱子"
        : state.phase === "done"
          ? "已送入宝可梦箱子"
          : "孵化失败";
  const message = state.phase === "hatching"
    ? "蛋壳正在发出温暖的光。"
    : state.phase === "naming"
      ? `${display?.nameZh || display?.name || "宝可梦"} 孵化了。`
      : state.phase === "saving"
        ? "护士正在登记这只新伙伴。"
        : state.phase === "done"
          ? state.result.message
          : state.phase === "error"
            ? state.message
            : "";
  const spriteSrc = state.phase === "done" && state.result.pokemon?.shiny
    ? display?.shinySpriteUrl || display?.spriteUrl || ""
    : display?.spriteUrl || "";
  return (
    <div className="training-rest-new-modal-layer training-rest-new-hatch-layer" role="presentation">
      <section className="training-rest-new-hatch-dialog" role="dialog" aria-label="灵魂伴侣孵化">
        <div className="training-rest-new-hatch-stage">
          {state.phase === "hatching" ? (
            <div className="training-rest-new-egg-animation" aria-hidden="true" />
          ) : display ? (
            <span className="training-rest-new-hatch-pokemon">
              <ImageWithFallback src={spriteSrc} alt={display.nameZh || display.name} fallback={display.nameZh || display.name} />
            </span>
          ) : (
            <div className="training-rest-new-hatch-error-mark">!</div>
          )}
        </div>
        <div className="training-rest-new-hatch-panel">
          <header>
            <strong>{title}</strong>
            <span>{display?.speciesId || "soulmate"}</span>
          </header>
          <p>{message}</p>
          {state.phase === "naming" ? (
            <label className="training-rest-new-hatch-name">
              <span>名字</span>
              <input
                value={nickname}
                maxLength={12}
                placeholder={display?.nameZh || display?.name || "宝可梦"}
                onChange={event => onNicknameChange(event.target.value)}
              />
            </label>
          ) : null}
          {state.phase === "naming" && state.error ? <small className="training-rest-new-hatch-error">{state.error}</small> : null}
          <div className="training-rest-new-hatch-actions">
            {state.phase === "naming" ? (
              <>
                <button type="button" onClick={onSkipNickname}>不用起名</button>
                <button className="primary" type="button" onClick={onConfirmNickname}>确认名字</button>
              </>
            ) : (
              <button className={state.phase === "done" ? "primary" : ""} type="button" disabled={busy} onClick={onClose}>
                {busy ? "请稍候" : "知道了"}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function createRestSoulmateCandidates(run: TrainingRunGameV4): SoulmateCandidateV4[] {
  const team = run.players.p1?.localTeam;
  if (!team || !run.battleLog?.length) return [];
  return createSoulmateCandidateListV4({
    battleLog: run.battleLog,
    team,
    resolvePokemonKey: summary => resolveSoulmateCandidateTeamKey(summary.pokemonKey, team),
  });
}

function resolveSoulmateCandidateTeamKey(rawKey: string, team: NonNullable<TrainingPlayerDraftV4["localTeam"]>): string | null {
  const normalizedRawKey = normalizeSoulmateKey(rawKey);
  const rawName = normalizedRawKey.replace(/^p[1-4][a-d]?/, "").replace(/^:/, "");
  for (const pokemon of team.pokemon || []) {
    const aliases = [
      pokemon.localPokemonId,
      pokemon.pokeballId,
      pokemon.showdownId,
      pokemon.showdownIdentityToken,
      pokemon.speciesId,
      pokemon.name,
      pokemon.nameZh,
      pokemon.nickname,
    ].map(normalizeSoulmateKey).filter(Boolean);
    if (aliases.some(alias => alias === normalizedRawKey || alias === rawName || normalizedRawKey.endsWith(`:${alias}`))) {
      return pokemon.localPokemonId || pokemon.showdownId || pokemon.speciesId;
    }
  }
  return null;
}

function isProtectedSoulmatePokemon(pokemon: Pick<TrainingPlayerDraftV4["localTeam"]["pokemon"][number], "formalSourceKind" | "originKind"> | null | undefined): boolean {
  return pokemon?.formalSourceKind === "soulmate-vault" || pokemon?.originKind === "soulmate";
}

function normalizeSoulmateKey(value: unknown): string {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5:]+/g, "");
}

function normalizeSoulmateNickname(value: unknown): string | undefined {
  const text = String(value || "").trim();
  return text ? Array.from(text).slice(0, 12).join("") : undefined;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function renderSoulmateCandidateIcon(candidate: SoulmateCandidateV4) {
  const alt = candidate.displayName || candidate.pokemon.nameZh || candidate.pokemon.name || "";
  if (candidate.iconStyle) {
    return <span className="training-rest-new-soulmate-picon picon" aria-label={alt} style={styleFromCss(candidate.iconStyle)} />;
  }
  return <ImageWithFallback src={candidate.iconUrl || candidate.pokemon.spriteUrl || ""} alt={alt} fallback={alt.slice(0, 1) || "?"} />;
}

function styleFromCss(cssText: string): CSSProperties {
  const style: CSSProperties = {};
  cssText.split(";").forEach(part => {
    const [rawKey, rawValue] = part.split(":");
    const key = rawKey?.trim();
    const value = rawValue?.trim();
    if (!key || !value) return;
    const camelKey = key.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
    (style as Record<string, string>)[camelKey] = value;
  });
  return style;
}
