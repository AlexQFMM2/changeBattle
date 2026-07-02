import {useEffect, useRef, useState} from "react";
import type {ChangeBattleV2Api, DesktopFormalGameBridge, FormalBattleResultFinalizeReasonV4, FormalGameRunV4} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";
import "./FormalGameTransitionPage.css";

export function FormalBattleResultTransitionPage({api, formalGameBridge, run, sessionId, reason, onRestReady, onSettlementReady}: {
  api: ChangeBattleV2Api;
  formalGameBridge?: DesktopFormalGameBridge;
  run: FormalGameRunV4;
  sessionId: string;
  reason?: FormalBattleResultFinalizeReasonV4;
  onRestReady: (run: FormalGameRunV4) => void;
  onSettlementReady: (run: FormalGameRunV4, reason: FormalBattleResultFinalizeReasonV4) => void;
}) {
  const [transitionReady, setTransitionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!transitionReady || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    void (async () => {
      if (!sessionId) {
        if (reason === "surrender" || reason === "loss") {
          const saved = await api.saveFormalGameRun(run);
          if (!cancelled) onSettlementReady(saved, reason);
          return;
        }
        const settled = formalGameBridge
          ? await formalGameBridge.settleFormalBattleRound(run)
          : api.settleFormalBattleRoundV4(run);
        const saved = await api.saveFormalGameRun(settled);
        if (cancelled) return;
        routeFormalBattleResult(saved, onRestReady, onSettlementReady);
        return;
      }
      const result = formalGameBridge
        ? await formalGameBridge.finalizeFormalBattleResult(run, sessionId, reason)
        : api.finalizeFormalBattleResultV4(run, await api.battleService.getSnapshot(sessionId), reason);
      const saved = await api.saveFormalGameRun(result.run);
      if (cancelled) return;
      if (result.destination === "settlement") {
        onSettlementReady(saved, result.reason || "loss");
        return;
      }
      onRestReady(saved);
    })().catch(caught => {
      if (!cancelled) setError(caught instanceof Error ? caught.message : "正式战斗结算失败。");
    });
    return () => {
      cancelled = true;
    };
  }, [api, formalGameBridge, onRestReady, onSettlementReady, reason, run, sessionId, transitionReady]);

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

function routeFormalBattleResult(
  run: FormalGameRunV4,
  onRestReady: (run: FormalGameRunV4) => void,
  onSettlementReady: (run: FormalGameRunV4, reason: FormalBattleResultFinalizeReasonV4) => void,
) {
  const restRunSnapshot = run.restRunSnapshot;
  if (restRunSnapshot?.result?.outcome === "loss" || restRunSnapshot?.status === "ended" || isFormalRestRunComplete(restRunSnapshot)) {
    onSettlementReady(run, restRunSnapshot?.result?.outcome === "loss" ? "loss" : "complete");
    return;
  }
  onRestReady(run);
}

function isFormalRestRunComplete(run: FormalGameRunV4["restRunSnapshot"]): boolean {
  return Boolean(run?.gameMap.length && run.gameMap.every(node => node.state === "won"));
}
