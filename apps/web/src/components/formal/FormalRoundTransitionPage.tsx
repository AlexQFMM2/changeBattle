import {useEffect, useRef, useState} from "react";
import type {ChangeBattleV2Api, FormalGameRunV4} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";
import "./FormalGameTransitionPage.css";

export function FormalRoundTransitionPage({api, run, onRunReady}: {
  api: ChangeBattleV2Api;
  run: FormalGameRunV4;
  onRunReady: (run: FormalGameRunV4) => void;
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
        const planned = api.prepareFormalRoundPlan(run);
        void api.saveFormalGameRun(planned)
          .then(saved => {
            if (!cancelled) onRunReady(saved);
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
  }, [api, onRunReady, run, transitionReady]);

  return (
    <section className="formal-game-transition-wrap">
      <TrainingRunTransitionPage
        title="生成正式赛程"
        detail={`${modeLabel(run.mode)} · 正在固化 7 场对局计划`}
        tip={error || "正在生成 NPC、队伍、队友、对手预览，并写入正式存档。"}
        onReady={() => setTransitionReady(true)}
      />
    </section>
  );
}

function modeLabel(mode: FormalGameRunV4["mode"]): string {
  if (mode === "doubles") return "双打-AI";
  if (mode === "coop") return "合作-AI";
  return "单打-AI";
}
