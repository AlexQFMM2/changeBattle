import {useEffect, useRef, useState} from "react";
import type {ChangeBattleV2Api, DesktopFormalGameBridge, FormalGameRunV4, TrainingRunGameV4} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";
import {loadFormalRoomCredential} from "../../lib/formalRoomCredential";

export function FormalBattleTransitionPage({api, formalGameBridge, battleBackendLabel, run, onRunChange, onReady, onBackToRest}: {
  api: ChangeBattleV2Api;
  formalGameBridge?: DesktopFormalGameBridge;
  battleBackendLabel?: string;
  run: FormalGameRunV4;
  onRunChange: (run: FormalGameRunV4) => void;
  onReady: (sessionId: string) => void;
  onBackToRest: () => void;
}) {
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      const credential = loadFormalRoomCredential();
      if (credential) {
        const clientRequestId = formalBattleClientRequestId(credential.roomId, run);
        if (credential.matchId) {
          const prepared = await api.submitFormalRoomMatchCommand({
            roomId: credential.roomId,
            roomToken: credential.roomToken,
            matchId: credential.matchId,
            actionName: "rooms.matches.commands.prepareBattle",
            commandId: clientRequestId,
            payload: {},
          });
          if (!prepared.ok) throw new Error(prepared.message);
          const nextRun = prepared.data.view.formalRun;
          if (!nextRun) throw new Error("房间内对局尚未开始。");
          onRunChange(nextRun);
          onReady(String(prepared.data.sessionId || (prepared.data.result as any)?.sessionId || ""));
          return;
        }
        throw new Error("当前房间缺少对局 ID，不能创建正式战斗。");
      }
      const prepared = formalGameBridge
        ? await formalGameBridge.prepareFormalBattleSession(run)
        : await api.prepareFormalBattleSession(run);
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
      setError(error instanceof Error ? error.message : "正式战斗创建失败。");
      if (loadFormalRoomCredential()) return;
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
    });
  }, [api, formalGameBridge, onBackToRest, onReady, onRunChange, run]);

  if (error) {
    return (
      <section className="training-transition-page" aria-live="polite">
        <div className="training-transition-video-fallback" aria-hidden="true">
          <span />
          <i />
        </div>
        <div className="training-transition-shade" aria-hidden="true" />
        <section className="training-transition-loading training-transition-error-panel">
          <div className="training-transition-copy">
            <strong>正式战斗创建失败</strong>
            <span>BattleGame V4</span>
          </div>
          <p className="training-transition-tip">
            <strong>后端</strong>
            <span>{battleBackendLabel || "server-api"}</span>
            <strong>错误</strong>
            <span>{error}</span>
          </p>
          <div className="training-transition-error-actions">
            <button type="button" onClick={onBackToRest}>返回休整</button>
          </div>
        </section>
      </section>
    );
  }

  return (
    <TrainingRunTransitionPage
      title="准备正式战斗"
      detail="正在派遣队友并创建 BattleGame V4"
      tip="正式对局计算在后端完成；页面只等待战斗协议快照。"
      onReady={() => undefined}
    />
  );
}

function formalBattleClientRequestId(roomId: string, run: FormalGameRunV4): string {
  const key = `changebattle-v2:formal-room:${roomId}:prepare-battle:${run.id}:${run.currentRoundIndex}`;
  try {
    const existing = window.sessionStorage?.getItem(key);
    if (existing) return existing;
    const next = `prepare-battle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage?.setItem(key, next);
    return next;
  } catch {
    return `prepare-battle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
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
