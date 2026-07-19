import {useEffect, useRef, useState} from "react";
import type {ChangeBattleV2Api, DesktopFormalGameBridge, FormalBattleResultFinalizeReasonV4, FormalGameRunV4, FormalRoomCommandResultV1, FormalSoulmateFriendshipSettlementRecordV4, FormalSoulmateHonorSettlementRecordV4, PlayerVaultV4, RunGameBattleViewV5, ShowdownPlaybackTimelineV4, ViewScopeNameV5} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";
import {loadFormalRoomCredential} from "../../lib/formalRoomCredential";
import "./FormalGameTransitionPage.css";

export function FormalBattleResultTransitionPage({api, formalGameBridge, run, roomBattleView, playerVault, sessionId, reason, onSavePlayerVault, onPlayerVaultChange, onSoulmateSettlementNotice, onRoomScopedViewChange, onRoomRestReady, onRoomSettlementReady, onRestReady, onSettlementReady}: {
  api: ChangeBattleV2Api;
  formalGameBridge?: DesktopFormalGameBridge;
  run?: FormalGameRunV4 | null;
  roomBattleView?: RunGameBattleViewV5 | null;
  playerVault: PlayerVaultV4;
  sessionId: string;
  reason?: FormalBattleResultFinalizeReasonV4;
  onSavePlayerVault?: (vault: PlayerVaultV4) => Promise<PlayerVaultV4>;
  onPlayerVaultChange?: (vault: PlayerVaultV4) => void;
  onSoulmateSettlementNotice?: (message: string) => void;
  onRoomScopedViewChange?: (scope: ViewScopeNameV5, view: FormalRoomCommandResultV1["view"], meta: {revision: number; phase: string}) => void;
  onRoomRestReady?: () => void;
  onRoomSettlementReady?: (reason: FormalBattleResultFinalizeReasonV4) => void;
  onRestReady: (run: FormalGameRunV4) => void;
  onSettlementReady: (run: FormalGameRunV4, reason: FormalBattleResultFinalizeReasonV4) => void;
}) {
  const [transitionReady, setTransitionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!transitionReady || startedRef.current) return;
    startedRef.current = true;
    void (async () => {
      const credential = loadFormalRoomCredential();
      if (credential) {
        const clientRequestId = formalBattleFinalizeClientRequestId(credential.roomId, credential.matchId || roomBattleView?.matchId || "match", roomBattleView?.revision || 0);
        if (credential.matchId) {
          const finalized = await api.submitFormalRoomMatchCommand({
            roomId: credential.roomId,
            roomToken: credential.roomToken,
            matchId: credential.matchId,
            actionName: "rooms.matches.commands.finalizeBattle",
            commandId: clientRequestId,
            payload: {reason, playerVaultSnapshot: playerVault},
          });
          if (!finalized.ok) throw new Error(finalized.message);
          onRoomScopedViewChange?.(finalized.data.scope, finalized.data.view, {revision: finalized.data.revision, phase: finalized.data.phase});
          const resultPayload = finalized.data.result as any;
          const nextVault = finalized.data.playerVault || resultPayload?.playerVault;
          if (nextVault) {
            void (onSavePlayerVault ? onSavePlayerVault(nextVault) : api.savePlayerVault(nextVault))
              .then(savedVault => onPlayerVaultChange?.(savedVault))
              .catch(() => undefined);
          }
          const notice = resultPayload?.settlementNotice;
          if (notice) onSoulmateSettlementNotice?.(notice);
          if (!mountedRef.current) return;
          if (finalized.data.destination === "settlement") {
            onRoomSettlementReady?.((resultPayload?.reason || reason || "loss") as FormalBattleResultFinalizeReasonV4);
            return;
          }
          onRoomRestReady?.();
          return;
        }
        throw new Error("当前房间缺少对局 ID，不能结算正式战斗。");
      }
      if (!run) throw new Error("正式存档不存在。");
      if (!sessionId) {
        if (reason === "surrender" || reason === "loss") {
          const saved = await api.saveFormalGameRun(run);
          if (mountedRef.current) onSettlementReady(saved, reason);
          return;
        }
        const settled = formalGameBridge
          ? await formalGameBridge.settleFormalBattleRound(run)
          : await api.settleFormalBattleRoundV4(run);
        const saved = await api.saveFormalGameRun(settled);
        if (!mountedRef.current) return;
        routeFormalBattleResult(saved, onRestReady, onSettlementReady);
        return;
      }
      const timeline = await loadFormalBattlePlaybackTimeline(api, sessionId);
      const result = formalGameBridge
        ? await formalGameBridge.finalizeFormalBattleResult(run, sessionId, reason, {playbackTimeline: timeline})
        : await api.finalizeFormalBattleResultV4(run, await api.battleService.getSnapshot(sessionId), reason, {playbackTimeline: timeline});
      const soulmateSettlement = api.applyFormalSoulmateBattleFriendshipSettlement(result.run, playerVault);
      const honorSettlement = api.applyFormalSoulmateHonorSettlement(soulmateSettlement.run, playerVault);
      const savedVault = honorSettlement.playerVault === playerVault
        ? playerVault
        : onSavePlayerVault
          ? await onSavePlayerVault(honorSettlement.playerVault)
          : await api.savePlayerVault(honorSettlement.playerVault);
      if (savedVault !== playerVault) onPlayerVaultChange?.(savedVault);
      const soulmateNotice = soulmateSettlement.alreadySettled ? "" : formatSoulmateSettlementNotice(soulmateSettlement.summary);
      const honorNotice = honorSettlement.alreadySettled ? "" : formatSoulmateHonorSettlementNotice(honorSettlement.summary);
      const settlementNotice = [soulmateNotice, honorNotice].filter(Boolean).join("；");
      if (settlementNotice) onSoulmateSettlementNotice?.(settlementNotice);
      const saved = await api.saveFormalGameRun(honorSettlement.run);
      if (!mountedRef.current) return;
      if (result.destination === "settlement") {
        onSettlementReady(saved, result.reason || "loss");
        return;
      }
      onRestReady(saved);
    })().catch(caught => {
      if (mountedRef.current) setError(caught instanceof Error ? caught.message : "正式战斗结算失败。");
    });
  }, [transitionReady]);

  return (
    <section className="formal-game-transition-wrap">
      <TrainingRunTransitionPage
        title="处理战斗结果"
        detail="正在结算奖励、医疗和下一场对局"
        tip={error || "战斗演出已结束，正在写入正式流程进度。"}
        onReady={() => setTransitionReady(true)}
      />
    </section>
  );
}

function formalBattleFinalizeClientRequestId(roomId: string, matchId: string, revision: number): string {
  const key = `changebattle-v2:formal-room:${roomId}:finalize-battle:${matchId}:${revision}`;
  try {
    const existing = window.sessionStorage?.getItem(key);
    if (existing) return existing;
    const next = `finalize-battle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage?.setItem(key, next);
    return next;
  } catch {
    return `finalize-battle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

function formatSoulmateSettlementNotice(summary: FormalSoulmateFriendshipSettlementRecordV4 | null): string {
  const deltas = summary?.deltas?.filter(delta => delta.delta !== 0) || [];
  if (!deltas.length) return "";
  return deltas
    .map(delta => `${delta.displayName}亲密度 ${delta.delta > 0 ? "+" : ""}${delta.delta}`)
    .join("、");
}

function formatSoulmateHonorSettlementNotice(summary: FormalSoulmateHonorSettlementRecordV4 | null): string {
  const awards = summary?.awards || [];
  if (!awards.length) return "";
  const medalAwards = awards.filter(award => award.medalEarned);
  if (medalAwards.length) {
    return medalAwards
      .map(award => `${award.displayName}点亮了${award.badgeName}`)
      .join("、");
  }
  return awards
    .map(award => `${award.displayName}荣誉进度：击败${award.trainerName}`)
    .join("、");
}

async function loadFormalBattlePlaybackTimeline(api: ChangeBattleV2Api, sessionId: string): Promise<ShowdownPlaybackTimelineV4 | null> {
  try {
    return await api.battleService.getPlaybackTimeline(sessionId, 0);
  } catch (error) {
    console.warn("[FormalBattleResultTransitionPage] playback timeline unavailable, fallback to rawLog settlement", {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function routeFormalBattleResult(
  run: FormalGameRunV4,
  onRestReady: (run: FormalGameRunV4) => void,
  onSettlementReady: (run: FormalGameRunV4, reason: FormalBattleResultFinalizeReasonV4) => void,
) {
  const restRunSnapshot = run.restRunSnapshot;
  if (restRunSnapshot?.status === "battleEndedPendingSettlement") {
    onRestReady(run);
    return;
  }
  if (restRunSnapshot?.result?.outcome === "loss" || restRunSnapshot?.status === "ended" || isFormalRestRunComplete(restRunSnapshot)) {
    onSettlementReady(run, restRunSnapshot?.result?.outcome === "loss" ? "loss" : "complete");
    return;
  }
  onRestReady(run);
}

function isFormalRestRunComplete(run: FormalGameRunV4["restRunSnapshot"]): boolean {
  return Boolean(run?.gameMap.length && run.gameMap.every(node => node.state === "won"));
}
