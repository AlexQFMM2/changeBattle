import {useEffect, useRef, useState} from "react";
import type {ChangeBattleV2Api, TrainingRunGameV4} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "./TrainingRunTransitionPage";

export function TrainingBattleResultTransitionPage({api, run, sessionId, onRestReady}: {
  api: ChangeBattleV2Api;
  run: TrainingRunGameV4;
  sessionId: string;
  onRestReady: (run: TrainingRunGameV4) => void;
}) {
  const [transitionReady, setTransitionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!transitionReady || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    void (async () => {
      if (!sessionId) throw new Error("缺少训练战斗 session。");
      const snapshot = await api.battleService.getSnapshot(sessionId);
      const patched = api.applyBattleSessionToRun(run, snapshot);
      const saved = await api.saveTrainingRun(patched);
      if (!cancelled) onRestReady(saved);
    })().catch(caught => {
      if (!cancelled) setError(caught instanceof Error ? caught.message : "训练战斗结果保存失败。");
    });
    return () => {
      cancelled = true;
    };
  }, [api, onRestReady, run, sessionId, transitionReady]);

  return (
    <TrainingRunTransitionPage
      title="同步战斗结果"
      detail="正在保存队伍状态和节点进度"
      tip={error || "战斗演出已结束，正在写入训练流程进度。"}
      onReady={() => setTransitionReady(true)}
    />
  );
}
