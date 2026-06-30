import {useState} from "react";
import {motion} from "motion/react";
import type {ChangeBattleV2Api, TrainingPlayerDraftV4, TrainingRunGameV4} from "@changebattle-v2/api";
import {TrainingRestBoardTitle} from "./TrainingRestBoardTitle";
import {TrainingRestConfirmDialog} from "./TrainingRestConfirmDialog";
import {TrainingRestNextPreviewPanel, type PreviewPokemonEntry} from "./TrainingRestNextPreviewPanel";
import {TrainingRestNewActionBoard} from "./TrainingRestNewActionBoard";
import {TrainingRestNewBagPanel} from "./TrainingRestNewBagPanel";
import {TrainingRestShopScene} from "./TrainingRestShopScene";
import {TrainingRestNewTeamPanel} from "./TrainingRestNewTeamPanel";
import {TrainingRestSideBoard} from "./TrainingRestSideBoard";
import {TrainingRestToast, type TrainingRestToastTone} from "./TrainingRestToast";
import "./TrainingRestNewPage.css";
import type {FormalRestShopV4} from "@changebattle-v2/api";

export type TrainingRestShopController = {
  shop: FormalRestShopV4 | null;
  player: TrainingPlayerDraftV4 | null;
  money: number;
  onBuy: (slotId: string) => Promise<string> | string;
  onSell: (itemInstanceIds: string[]) => Promise<string> | string;
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
  shopController?: TrainingRestShopController;
};

export function TrainingRestNewPage({api, run, onRunChange, onBackToConfig, onStartBattle, onOpenDex, onOpenPokemonDex, onSaveRunSnapshot, onAbandonRun, moneyAmount, shopController}: TrainingRestNewPageProps) {
  const [activeAction, setActiveAction] = useState("我的队伍");
  const [restScene, setRestScene] = useState<"center" | "shop">("center");
  const [teamPanelOpen, setTeamPanelOpen] = useState(false);
  const [bagPanelOpen, setBagPanelOpen] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<PreviewPokemonEntry | null>(null);
  const [message, setMessage] = useState("休整中心已就绪。");
  const [toast, setToast] = useState<{id: number; message: string; tone?: TrainingRestToastTone} | null>(null);
  const p1Team = run.players.p1?.localTeam || null;

  function updateP1Team(localTeam: TrainingPlayerDraftV4["localTeam"]) {
    const p1 = run.players.p1;
    if (!p1) return;
    const nextP1 = {...p1, localTeam};
    const nextPlayers = {...run.players, p1: nextP1};
    const nextScenarioPlayers = run.scenario.players.map(player => player.playerId === "p1" ? nextP1 : player);
    const nextGameMap = run.gameMap.map(node => node.id === run.currentNodeId
      ? {...node, participants: {...node.participants, p1: nextP1}}
      : node);
    const nextRun = {
      ...run,
      players: nextPlayers,
      scenario: {...run.scenario, players: nextScenarioPlayers},
      gameMap: nextGameMap,
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

  function unlockPreviewPokemon(target: PreviewPokemonEntry) {
    const nextRun = {
      ...run,
      restPreviewUnlocks: {...(run.restPreviewUnlocks || {}), [target.unlockKey]: true as const},
      updatedAt: new Date().toISOString(),
    };
    onRunChange(nextRun);
    setUnlockTarget(null);
    setMessage(`${target.pokemon.nameZh || target.pokemon.name} 已解锁，记得手动保存。`);
  }

  function selectAction(action: string) {
    setActiveAction(action);
    if (action === "我的队伍") {
      setRestScene("center");
      setBagPanelOpen(false);
      setTeamPanelOpen(true);
      return;
    }
    if (action === "我的背包") {
      setRestScene("center");
      setTeamPanelOpen(false);
      setBagPanelOpen(true);
      return;
    }
    if (action === "商店") {
      setActiveAction(action);
      setTeamPanelOpen(false);
      setBagPanelOpen(false);
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
    if (["我的背包", "图鉴", "保存"].includes(action)) {
      setRestScene("center");
      setTeamPanelOpen(false);
      setBagPanelOpen(false);
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
        <section className="training-rest-new-center-scene" aria-label="休整中心">
          <img className="training-rest-new-bg" src="/training/rest-center-bg.png" alt="休整中心背景预览" />
          <TrainingRestNextPreviewPanel run={run} onLockedPokemonClick={setUnlockTarget} onUnlockedPokemonClick={pokemon => onOpenPokemonDex(pokemon.speciesId)} />
          <TrainingRestNewActionBoard activeAction={activeAction} onAction={selectAction} />
          {typeof moneyAmount === "number" ? (
            <div className="training-rest-new-money-pill" aria-label="当前金币">
              <img src="/aboutIcon/coin.png" alt="" />
              <strong>{Math.max(0, Math.floor(moneyAmount)).toLocaleString()}</strong>
            </div>
          ) : null}
          <TrainingRestBoardTitle side="left">休整菜单</TrainingRestBoardTitle>
          <TrainingRestBoardTitle side="right">下一场预览</TrainingRestBoardTitle>
          <TrainingRestSideBoard
            side="left"
            actions={[{label: "我的队伍"}, {label: "我的背包"}, {label: "保存"}]}
            activeAction={activeAction}
            onAction={selectAction}
          />
          <TrainingRestSideBoard
            side="right"
            actions={[{label: "结束休整", primary: true}, {label: "放弃比赛", danger: true}]}
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
        <TrainingRestShopScene
          api={api}
          open={restScene === "shop"}
          shop={shopController?.shop}
          money={shopController?.money ?? moneyAmount ?? 0}
          onBuy={shopController?.onBuy}
          onBack={() => {
            setRestScene("center");
            setActiveAction("我的队伍");
            setMessage("已返回休整中心。");
          }}
        />
      </div>
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
          confirmLabel="解锁"
          ariaLabel="确认解锁预览"
          onCancel={() => setUnlockTarget(null)}
          onConfirm={() => unlockPreviewPokemon(unlockTarget)}
        />
      ) : null}
    </motion.section>
  );
}
