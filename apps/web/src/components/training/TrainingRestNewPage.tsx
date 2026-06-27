import {useState} from "react";
import {motion} from "motion/react";
import type {ChangeBattleV2Api, TrainingPlayerDraftV4, TrainingRunGameV4} from "@changebattle-v2/api";
import {TrainingRestBoardTitle} from "./TrainingRestBoardTitle";
import {TrainingRestConfirmDialog} from "./TrainingRestConfirmDialog";
import {TrainingRestNextPreviewPanel, type PreviewPokemonEntry} from "./TrainingRestNextPreviewPanel";
import {TrainingRestNewActionBoard} from "./TrainingRestNewActionBoard";
import {TrainingRestNewBagPanel} from "./TrainingRestNewBagPanel";
import {TrainingRestNewTeamPanel} from "./TrainingRestNewTeamPanel";
import {TrainingRestSideBoard} from "./TrainingRestSideBoard";
import "./TrainingRestNewPage.css";

export type TrainingRestNewPageProps = {
  api: ChangeBattleV2Api;
  run: TrainingRunGameV4;
  onRunChange: (run: TrainingRunGameV4) => void;
  onBackToConfig: () => void;
  onStartBattle: () => void;
  onOpenDex: () => void;
  onOpenPokemonDex: (speciesId: string) => void;
};

export function TrainingRestNewPage({api, run, onRunChange, onBackToConfig, onStartBattle, onOpenDex, onOpenPokemonDex}: TrainingRestNewPageProps) {
  const [activeAction, setActiveAction] = useState("我的队伍");
  const [teamPanelOpen, setTeamPanelOpen] = useState(false);
  const [bagPanelOpen, setBagPanelOpen] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<PreviewPokemonEntry | null>(null);
  const [message, setMessage] = useState("休整中心已就绪。");
  const p1Team = run.players.p1?.localTeam || null;

  function updateP1Team(localTeam: TrainingPlayerDraftV4["localTeam"]) {
    const p1 = run.players.p1;
    if (!p1) return;
    const nextP1 = {...p1, localTeam};
    const nextPlayers = {...run.players, p1: nextP1};
    const nextScenarioPlayers = run.scenario.players.map(player => player.playerId === "p1" ? nextP1 : player);
    const nextRun = {
      ...run,
      players: nextPlayers,
      scenario: {...run.scenario, players: nextScenarioPlayers},
      updatedAt: new Date().toISOString(),
    };
    onRunChange(nextRun);
    setMessage("队伍已调整，记得手动保存。");
  }

  async function saveRunGameSnapshot() {
    const saved = await api.saveTrainingRun({...run, updatedAt: new Date().toISOString()});
    onRunChange(saved);
    setMessage("RunGame 快照已保存。");
  }

  function updateRunGameDraft(nextRun: TrainingRunGameV4, nextMessage: string) {
    onRunChange(nextRun);
    setMessage(nextMessage);
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
      setBagPanelOpen(false);
      setTeamPanelOpen(true);
      return;
    }
    if (action === "我的背包") {
      setTeamPanelOpen(false);
      setBagPanelOpen(true);
      return;
    }
    if (["我的背包", "图鉴", "保存"].includes(action)) {
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
      onStartBattle();
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
      <img className="training-rest-new-bg" src="/training/rest-center-bg.png" alt="休整中心背景预览" />
      <TrainingRestNextPreviewPanel run={run} onLockedPokemonClick={setUnlockTarget} onUnlockedPokemonClick={pokemon => onOpenPokemonDex(pokemon.speciesId)} />
      <TrainingRestNewActionBoard activeAction={activeAction} onAction={selectAction} />
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
        actions={[{label: "结束休整"}, {label: "放弃比赛", danger: true}]}
        activeAction={activeAction}
        onAction={selectAction}
      />
      <div className="training-rest-new-save-message" role="status">{message}</div>
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
      />
      {abandonOpen ? (
        <TrainingRestConfirmDialog
          title="是否放弃？"
          message="当前只是确认弹窗预览，暂不执行实际效果。"
          confirmLabel="放弃"
          danger
          ariaLabel="确认放弃比赛"
          onCancel={() => setAbandonOpen(false)}
          onConfirm={onBackToConfig}
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
