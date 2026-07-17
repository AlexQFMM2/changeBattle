import {useEffect, useRef, useState} from "react";
import {formalGameModeLabelV4, type ChangeBattleV2Api, type CoopPartnerPreferenceV4, type DesktopFormalGameBridge, type FormalGameModeV4, type FormalGameRunV4, type PlayerVaultV4, type UserProfileV2} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";
import {saveFormalRoomCredential} from "../../lib/formalRoomCredential";
import "./FormalGameTransitionPage.css";

const formalRoomStartPromises = new Map<string, Promise<FormalGameRunV4>>();

export function FormalGameTransitionPage({api, formalGameBridge, profile, playerVault, mode, onRunReady}: {
  api: ChangeBattleV2Api;
  formalGameBridge?: DesktopFormalGameBridge;
  profile: UserProfileV2;
  playerVault: PlayerVaultV4;
  mode: FormalGameModeV4;
  onRunReady: (run: FormalGameRunV4) => void;
}) {
  const [partnerPreference] = useState<CoopPartnerPreferenceV4>("balanced");
  const [preparedRun, setPreparedRun] = useState<FormalGameRunV4 | null>(null);
  const [plannedCandidateCount, setPlannedCandidateCount] = useState(() => api.starterCandidateCountForStarChart(profile.starChart));
  const [transitionReady, setTransitionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const readySentRef = useRef(false);
  const onRunReadyRef = useRef(onRunReady);

  useEffect(() => {
    onRunReadyRef.current = onRunReady;
  }, [onRunReady]);

  useEffect(() => {
    let cancelled = false;
    readySentRef.current = false;
    setPreparedRun(null);
    setPlannedCandidateCount(api.starterCandidateCountForStarChart(profile.starChart));
    setTransitionReady(false);
    setError(null);
    setTip(null);
    const startKey = formalRoomStartKey(profile, playerVault, mode);

    const startTimer = window.setTimeout(() => {
      try {
        const options = {mode, coopPartnerPreference: mode === "coop" ? partnerPreference : undefined};
        if (!cancelled) setTip("正在连接服务器...");
        const started = getOrStartFormalRoom(startKey, () => api.startFormalRoom({
            profileSnapshot: profile,
            playerVaultSnapshot: playerVault,
            mode,
            options,
          })
            .then(room => {
              if (!room.ok) throw new Error(room.message);
              saveFormalRoomCredential(room.data.roomId, room.data.roomToken);
              if (!cancelled) setPlannedCandidateCount(api.starterCandidateCountForStarChart(room.data.formalRun.starChartSnapshot));
              return api.saveFormalGameRun(room.data.formalRun);
            }));
        void started
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
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
    };
  }, [api, formalGameBridge, mode, partnerPreference, playerVault, profile]);

  useEffect(() => {
    if (!transitionReady || !preparedRun || readySentRef.current) return;
    readySentRef.current = true;
    onRunReadyRef.current(preparedRun);
  }, [preparedRun, transitionReady]);

  return (
    <section className="formal-game-transition-wrap">
      <TrainingRunTransitionPage
        title="准备正式游戏"
        detail={formalGamePreparationDetail(mode, plannedCandidateCount)}
        tip={error || tip || (mode === "coop" ? "合作模式会记录队友偏好，具体队友会在进入战斗时派遣。" : "正在生成开局候选宝可梦。")}
        onReady={() => setTransitionReady(true)}
      />
    </section>
  );
}

function formalRoomStartKey(profile: UserProfileV2, playerVault: PlayerVaultV4, mode: FormalGameModeV4): string {
  return [
    profile.id,
    profile.updatedAt,
    playerVault.items.length,
    playerVault.pokemon.length,
    playerVault.itemStoragePageCount,
    playerVault.pokemonStoragePageCount,
    mode,
  ].join(":");
}

function getOrStartFormalRoom(key: string, start: () => Promise<FormalGameRunV4>): Promise<FormalGameRunV4> {
  const existing = formalRoomStartPromises.get(key);
  if (existing) return existing;
  const promise = start().finally(() => {
    window.setTimeout(() => formalRoomStartPromises.delete(key), 30000);
  });
  formalRoomStartPromises.set(key, promise);
  return promise;
}

function formalGamePreparationDetail(mode: FormalGameModeV4, candidateCount: number): string {
  return `${formalGameModeLabelV4(mode)} · 正在生成 ${candidateCount} 只开局候选`;
}
