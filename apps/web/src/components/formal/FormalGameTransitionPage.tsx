import {useEffect, useRef, useState} from "react";
import type {ChangeBattleV2Api, CoopPartnerPreferenceV4, DesktopFormalGameBridge, FormalGameModeV4, FormalGameRunV4, UserProfileV2} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";
import "./FormalGameTransitionPage.css";

export function FormalGameTransitionPage({api, formalGameBridge, profile, mode, onRunReady}: {
  api: ChangeBattleV2Api;
  formalGameBridge?: DesktopFormalGameBridge;
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
          const options = {mode, coopPartnerPreference: mode === "coop" ? partnerPreference : undefined};
          const base = formalGameBridge
            ? null
            : api.createFormalGameRun(profile, options);
          const candidateCount = api.starterCandidateCountForStarChart(base?.starChartSnapshot || profile.starChart);
          if (!cancelled) setPlannedCandidateCount(candidateCount);
          const preparedPromise = formalGameBridge
            ? formalGameBridge.createFormalGameWithStarterCandidates(profile, options)
            : Promise.resolve(api.prepareFormalStarterCandidates(base!));
          void preparedPromise
            .then(prepared => {
              if (!cancelled) setPlannedCandidateCount(api.starterCandidateCountForStarChart(prepared.starChartSnapshot));
              return api.saveFormalGameRun(prepared);
            })
            .then(saved => {
              if (!cancelled) setPreparedRun(saved);
            })
            .catch(caught => {
              console.error("[changebattle-v2:web] formal game preparation failed", caught);
              if (!cancelled) setError(caught instanceof Error ? caught.message : "正式游戏准备失败。");
            });
        } catch (caught) {
          console.error("[changebattle-v2:web] formal game preparation failed", caught);
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
  }, [api, formalGameBridge, mode, partnerPreference, profile]);

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
        tip={error || (mode === "coop" ? "合作模式会记录队友偏好，具体队友会在进入战斗时派遣。" : "正在生成开局候选宝可梦。")}
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
