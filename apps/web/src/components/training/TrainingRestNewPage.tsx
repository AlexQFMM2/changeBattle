import {useState} from "react";
import {motion} from "motion/react";
import {
  REST_CENTER_LEFT_SIDE_ACTIONS_V4,
  REST_CENTER_RIGHT_SIDE_ACTIONS_V4,
  type ChangeBattleV2Api,
  type DexStatId,
  type FormalRestTeamHealResultV4,
  type FormalPokemonExchangeResultV4,
  type FormalPokemonExchangeViewV4,
  type FormalRestOpponentPreviewUnlockResultV4,
  type FormalRoundSettlementV4,
  type FormalRestPokemonStatRerollResultV4,
  type FormalTrainingGroundApplyInputV4,
  type FormalTrainingGroundLessonViewV4,
  type FormalTrainingGroundResultV4,
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
  onAbandonRun?: () => void;
  moneyAmount?: number;
  roundSettlement?: FormalRoundSettlementV4 | null;
  onRoundSettlementSeen?: (nodeId: string) => void;
  shopController?: TrainingRestShopController;
  trainingGroundController?: TrainingRestTrainingGroundController;
  healController?: TrainingRestHealController;
  teamRerollController?: TrainingRestTeamRerollController;
  opponentPreviewController?: TrainingRestOpponentPreviewController;
  exchangeController?: TrainingRestExchangeController;
};

export function TrainingRestNewPage({api, run, onRunChange, onBackToConfig, onStartBattle, onOpenDex, onOpenPokemonDex, onSaveRunSnapshot, onAbandonRun, moneyAmount, roundSettlement, onRoundSettlementSeen, shopController, trainingGroundController, healController, teamRerollController, opponentPreviewController, exchangeController}: TrainingRestNewPageProps) {
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
  const [message, setMessage] = useState("休息室已就绪。");
  const [toast, setToast] = useState<{id: number; message: string; tone?: TrainingRestToastTone} | null>(null);
  const p1Team = run.players.p1?.localTeam || null;
  const leftSideActions = REST_CENTER_LEFT_SIDE_ACTIONS_V4.map(action => ({label: action.label}));
  const rightSideActions = REST_CENTER_RIGHT_SIDE_ACTIONS_V4.map(action => ({label: action.label, primary: action.primary, danger: action.danger}));

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
    setSelectedTrainingLesson(lesson);
    setRestScene("training-ground");
    setActiveAction("训练场");
    setMessage(`${trainingLessonTitle(lesson)} 已开始。`);
  }

  function selectAction(action: string) {
    setActiveAction(action);
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
      setTeamPanelOpen(false);
      setBagPanelOpen(false);
      setExchangePanelOpen(false);
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
      setTeamPanelOpen(false);
      setBagPanelOpen(false);
      setExchangePanelOpen(false);
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
      setTeamPanelOpen(false);
      setBagPanelOpen(false);
      if (!exchangeController) {
        setMessage("交换仅正式流程开放。");
        showNotice("交换仅正式流程开放。");
        return;
      }
      const nextExchangeView = exchangeController.getView?.() || exchangeController.view || null;
      setExchangeView(nextExchangeView);
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
          <TrainingRestNextPreviewPanel run={run} onLockedPokemonClick={onLockedPreviewPokemonClick} onUnlockedPokemonClick={pokemon => onOpenPokemonDex(pokemon.speciesId)} />
          <TrainingRestNewActionBoard activeAction={activeAction} onAction={selectAction} />
          {typeof moneyAmount === "number" ? (
            <div className="training-rest-new-money-pill" aria-label="当前金币">
              <img src={assetUrl("aboutIcon/coin.png")} alt="" />
              <strong>{Math.max(0, Math.floor(moneyAmount)).toLocaleString()}</strong>
            </div>
          ) : null}
          <TrainingRestBoardTitle side="left">休息室菜单</TrainingRestBoardTitle>
          <TrainingRestBoardTitle side="right">下一场预览</TrainingRestBoardTitle>
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
          {teamPanelOpen || bagPanelOpen ? (
            <button
              className="training-rest-new-panel-scrim"
              type="button"
              aria-label="关闭当前面板"
              onClick={closeFloatingPanels}
            />
          ) : null}
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
