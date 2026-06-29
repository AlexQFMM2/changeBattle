import {useEffect, useRef, useState} from "react";
import type {ChangeBattleV2Api, CoopPartnerPreferenceV4, FormalGameModeV4, FormalGameRunV4, UserProfileV2} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";
import "./FormalGameTransitionPage.css";

export function FormalGameTransitionPage({api, profile, mode, onRunReady}: {
  api: ChangeBattleV2Api;
  profile: UserProfileV2;
  mode: FormalGameModeV4;
  onRunReady: (run: FormalGameRunV4) => void;
}) {
  const [partnerPreference] = useState<CoopPartnerPreferenceV4>("balanced");
  const [preparedRun, setPreparedRun] = useState<FormalGameRunV4 | null>(null);
  const [plannedCandidateCount, setPlannedCandidateCount] = useState(() => api.starterCandidateCountForStarChart(profile.starChart));
  const [transitionReady, setTransitionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const readySentRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    readySentRef.current = false;
    setPreparedRun(null);
    setPlannedCandidateCount(api.starterCandidateCountForStarChart(profile.starChart));
    setTransitionReady(false);
    setError(null);

    const frameRefs: {second: number | null} = {second: null};
    const firstFrame = window.requestAnimationFrame(() => {
      const secondFrame = window.requestAnimationFrame(() => {
        try {
          const base = api.createFormalGameRun(profile, {
            mode,
            coopPartnerPreference: mode === "coop" ? partnerPreference : undefined,
          });
          const candidateCount = api.starterCandidateCountForStarChart(base.starChartSnapshot);
          if (!cancelled) setPlannedCandidateCount(candidateCount);
          const prepared = api.prepareFormalStarterCandidates(base);
          void api.saveFormalGameRun(prepared)
            .then(saved => {
              if (!cancelled) setPreparedRun(saved);
            })
            .catch(caught => {
              if (!cancelled) setError(caught instanceof Error ? caught.message : "正式游戏准备失败。");
            });
        } catch (caught) {
          if (!cancelled) setError(caught instanceof Error ? caught.message : "正式游戏准备失败。");
        }
      });
      frameRefs.second = secondFrame;
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(firstFrame);
      if (frameRefs.second !== null) window.cancelAnimationFrame(frameRefs.second);
    };
  }, [api, mode, partnerPreference, profile]);

  useEffect(() => {
    if (!transitionReady || !preparedRun || readySentRef.current) return;
    readySentRef.current = true;
    onRunReady(preparedRun);
  }, [onRunReady, preparedRun, transitionReady]);

  return (
    <section className="formal-game-transition-wrap">
      <TrainingRunTransitionPage
        title="准备正式游戏"
        detail={modeLabel(mode, plannedCandidateCount)}
        tip={error || (mode === "coop" ? "合作模式本轮先记录 AI 队友偏好，后续进入 7 场计划时生成精英队友。" : "正在生成开局候选宝可梦。")}
        onReady={() => setTransitionReady(true)}
      />
    </section>
  );
}

function modeLabel(mode: FormalGameModeV4, candidateCount: number): string {
  if (mode === "doubles") return `双打-AI · 正在生成 ${candidateCount} 只开局候选`;
  if (mode === "coop") return `合作-AI · 正在生成 ${candidateCount} 只开局候选`;
  return `单打-AI · 正在生成 ${candidateCount} 只开局候选`;
}
