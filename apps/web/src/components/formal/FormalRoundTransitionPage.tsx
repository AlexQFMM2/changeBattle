import {useEffect, useRef, useState} from "react";
import {formalGameModeLabelV4, type ChangeBattleV2Api, type DesktopFormalGameBridge, type FormalGameRunV4, type PlayerVaultV4} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";
import "./FormalGameTransitionPage.css";

export function FormalRoundTransitionPage({api, formalGameBridge, run, playerVault, onSavePlayerVault, onRunReady}: {
  api: ChangeBattleV2Api;
  formalGameBridge?: DesktopFormalGameBridge;
  run: FormalGameRunV4;
  playerVault: PlayerVaultV4;
  onSavePlayerVault: (vault: PlayerVaultV4) => Promise<PlayerVaultV4>;
  onRunReady: (run: FormalGameRunV4, playerVault: PlayerVaultV4) => void;
}) {
  const [transitionReady, setTransitionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!transitionReady || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      try {
        const plannedPromise = formalGameBridge
          ? formalGameBridge.prepareFormalRoundPlan(run)
          : Promise.resolve(api.prepareFormalRoundPlan(run));
        void plannedPromise
          .then(async planned => {
            const carryResult = api.applyFormalCarryPrepItems(planned, playerVault);
            const savedVault = await onSavePlayerVault(carryResult.playerVault);
            const savedRun = await api.saveFormalGameRun(carryResult.run);
            return {savedRun, savedVault};
          })
          .then(({savedRun, savedVault}) => {
            if (!cancelled) onRunReady(savedRun, savedVault);
          })
          .catch(caught => {
            if (!cancelled) setError(caught instanceof Error ? caught.message : "正式 7 场计划保存失败。");
          });
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "正式 7 场计划生成失败。");
      }
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [api, formalGameBridge, onRunReady, onSavePlayerVault, playerVault, run, transitionReady]);

  return (
    <section className="formal-game-transition-wrap">
      <TrainingRunTransitionPage
        title="生成正式赛程"
        detail={`${formalGameModeLabelV4(run.mode)} · 正在固化 7 场对局计划`}
        tip={error || "正在生成 NPC、对手预览和休整快照，并写入正式存档。"}
        onReady={() => setTransitionReady(true)}
      />
    </section>
  );
}
