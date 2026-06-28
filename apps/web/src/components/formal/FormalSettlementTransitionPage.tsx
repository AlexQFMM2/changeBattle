import {useEffect, useRef, useState} from "react";
import type {ChangeBattleV2Api, FormalGameRunV4, FormalSettlementReasonV4, UserProfileV2} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";
import "./FormalGameTransitionPage.css";

export function FormalSettlementTransitionPage({api, run, profile, reason, onSettled, onBack}: {
  api: ChangeBattleV2Api;
  run: FormalGameRunV4;
  profile: UserProfileV2;
  reason: FormalSettlementReasonV4;
  onSettled: (run: FormalGameRunV4, profile: UserProfileV2) => void;
  onBack: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!ready || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      void settleFormalRun()
        .then(result => {
          if (!cancelled) onSettled(result.run, result.profile);
        })
        .catch(caught => {
          if (!cancelled) setError(caught instanceof Error ? caught.message : "正式结算失败。");
        });
    });
    async function settleFormalRun() {
      const prepared = api.prepareFormalSettlement(run, reason);
      let nextProfile = profile;
      let nextRun = prepared;
      if (prepared.settlement && !prepared.settlement.claimedAt) {
        nextProfile = await api.claimFormalSettlementBp(profile, prepared.settlement);
        nextRun = {
          ...prepared,
          settlement: {...prepared.settlement, claimedAt: new Date().toISOString()},
          updatedAt: new Date().toISOString(),
        };
      }
      const saved = await api.saveFormalGameRun(nextRun);
      return {run: saved, profile: nextProfile};
    }
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [api, onSettled, profile, ready, reason, run]);

  return (
    <section className="formal-game-transition-wrap">
      <TrainingRunTransitionPage
        title="结算本局"
        detail="正在整理 BP、金币流水和宝可梦战绩"
        tip={error || "正在计算 MVP、KDA、输出、承伤，并写入正式存档。"}
        onReady={() => setReady(true)}
      />
      <button className="formal-game-transition-back" type="button" onClick={onBack}>返回主页</button>
    </section>
  );
}
