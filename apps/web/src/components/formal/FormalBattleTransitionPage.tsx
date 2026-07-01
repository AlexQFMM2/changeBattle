import {useEffect, useRef} from "react";
import type {ChangeBattleV2Api, DesktopFormalGameBridge, FormalGameRunV4, TrainingRunGameV4} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";

export function FormalBattleTransitionPage({api, formalGameBridge, run, onRunChange, onReady, onBackToRest}: {
  api: ChangeBattleV2Api;
  formalGameBridge?: DesktopFormalGameBridge;
  run: FormalGameRunV4;
  onRunChange: (run: FormalGameRunV4) => void;
  onReady: (sessionId: string) => void;
  onBackToRest: () => void;
}) {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      const prepared = formalGameBridge
        ? await formalGameBridge.prepareFormalBattleSession(run)
        : api.prepareFormalBattleSession(run);
      const preparingRestRun = markFormalRestBattleState(prepared.restRunSnapshot, prepared.sessionInput.nodeId, "preparing", prepared.battleGame.id);
      const preparingRun = await api.saveFormalGameRun({
        ...run,
        restRunSnapshot: preparingRestRun,
        updatedAt: new Date().toISOString(),
      });
      onRunChange(preparingRun);
      const snapshot = await api.battleService.createBattleSession(prepared.sessionInput);
      const battlingRestRun = markFormalRestBattleState(preparingRun.restRunSnapshot || preparingRestRun, prepared.sessionInput.nodeId, "running", prepared.battleGame.id);
      const battlingRun = await api.saveFormalGameRun({
        ...preparingRun,
        restRunSnapshot: battlingRestRun,
        updatedAt: new Date().toISOString(),
      });
      onRunChange(battlingRun);
      onReady(snapshot.id);
    })().catch(async error => {
      console.error(error);
      const restRunSnapshot = run.restRunSnapshot;
      if (restRunSnapshot?.currentNodeId) {
        const blockedRestRun = markFormalRestBattleState(restRunSnapshot, restRunSnapshot.currentNodeId, "blocked", "battle-game-blocked");
        const blockedRun = await api.saveFormalGameRun({
          ...run,
          restRunSnapshot: blockedRestRun,
          updatedAt: new Date().toISOString(),
        }).catch(() => ({...run, restRunSnapshot: blockedRestRun}));
        onRunChange(blockedRun);
      }
      onBackToRest();
    });
  }, [api, formalGameBridge, onBackToRest, onReady, onRunChange, run]);

  return (
    <TrainingRunTransitionPage
      title="准备正式战斗"
      detail="正在派遣队友并创建 BattleGame V4"
      tip="正式对局计算在后端完成；页面只等待战斗协议快照。"
      onReady={() => undefined}
    />
  );
}

function markFormalRestBattleState(run: TrainingRunGameV4, nodeId: string, state: "preparing" | "running" | "blocked", battleGameId: string): TrainingRunGameV4 {
  const now = new Date().toISOString();
  return {
    ...run,
    status: state === "running" ? "battling" : state === "blocked" ? "blocked" : "battlePreparing",
    gameMap: run.gameMap.map(node => node.id === nodeId
      ? {
        ...node,
        state,
        startedAt: state === "running" ? now : node.startedAt,
        battleGame: {
          id: node.battleGame?.id || battleGameId,
          status: state === "blocked" ? "blocked" : state === "running" ? "running" : "creating",
        },
      }
      : node),
    updatedAt: now,
  };
}
