import {useEffect, useRef, useState} from "react";
import type {ChangeBattleV2Api, DesktopFormalGameBridge, FormalGameRunV4, FormalSettlementReasonV4, PlayerVaultV4, UserProfileV2} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";
import "./FormalGameTransitionPage.css";

export function FormalSettlementTransitionPage({api, formalGameBridge, run, profile, playerVault, reason, onSettled, onSaveProfile, onSavePlayerVault}: {
  api: ChangeBattleV2Api;
  formalGameBridge?: DesktopFormalGameBridge;
  run: FormalGameRunV4;
  profile: UserProfileV2;
  playerVault: PlayerVaultV4;
  reason: FormalSettlementReasonV4;
  onSettled: (run: FormalGameRunV4, profile: UserProfileV2, playerVault: PlayerVaultV4) => void;
  onSaveProfile?: (profile: UserProfileV2) => Promise<UserProfileV2>;
  onSavePlayerVault?: (vault: PlayerVaultV4) => Promise<PlayerVaultV4>;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!ready || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void settleFormalRun()
        .then(result => {
          if (!cancelled) onSettled(result.run, result.profile, result.playerVault);
        })
        .catch(caught => {
          if (!cancelled) setError(caught instanceof Error ? caught.message : "正式结算失败。");
        });
    });
    async function settleFormalRun() {
      if (run.settled !== false) return {run, profile, playerVault};
      if (formalGameBridge) {
        const prepared = await formalGameBridge.prepareFormalSettlement(run, profile, reason);
        const savedProfile = onSaveProfile ? await onSaveProfile(prepared.profile) : prepared.profile;
        const syncedVault = await syncSoulmateVault(prepared.run, playerVault);
        const claimed = await claimPlayerVaultItems(prepared.run, syncedVault);
        const saved = await api.saveFormalGameRun(claimed.run);
        return {run: saved, profile: savedProfile, playerVault: claimed.playerVault};
      }
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
      const syncedVault = await syncSoulmateVault(nextRun, playerVault);
      const claimed = await claimPlayerVaultItems(nextRun, syncedVault);
      const saved = await api.saveFormalGameRun(claimed.run);
      return {run: saved, profile: nextProfile, playerVault: claimed.playerVault};
    }
    async function syncSoulmateVault(nextRun: FormalGameRunV4, currentVault: PlayerVaultV4): Promise<PlayerVaultV4> {
      const syncedVault = api.syncFormalSoulmateLocalTeamToVault(nextRun, currentVault);
      return onSavePlayerVault ? onSavePlayerVault(syncedVault) : api.savePlayerVault(syncedVault);
    }
    async function claimPlayerVaultItems(nextRun: FormalGameRunV4, currentVault: PlayerVaultV4): Promise<{run: FormalGameRunV4; playerVault: PlayerVaultV4}> {
      if (!nextRun.settlement || nextRun.settlement.playerVaultItemsClaimedAt) return {run: nextRun, playerVault: currentVault};
      if (!nextRun.pendingSettlementExportItemInstanceIds?.length) {
        const claimedAt = new Date().toISOString();
        return {
          run: {
            ...nextRun,
            settlement: {
              ...nextRun.settlement,
              playerVaultItemsClaimedAt: claimedAt,
              playerVaultItemsClaimedCount: 0,
              playerVaultItemsRejectedCount: 0,
            },
            updatedAt: claimedAt,
          },
          playerVault: currentVault,
        };
      }
      const mergeResult = api.mergeFormalRunBagIntoPlayerVault(currentVault, nextRun);
      const savedVault = onSavePlayerVault ? await onSavePlayerVault(mergeResult.vault) : await api.savePlayerVault(mergeResult.vault);
      const claimedAt = new Date().toISOString();
      return {
        run: {
          ...nextRun,
          settlement: {
            ...nextRun.settlement,
            playerVaultItemsClaimedAt: claimedAt,
            playerVaultItemsClaimedCount: mergeResult.depositedItemCount,
            playerVaultItemsRejectedCount: mergeResult.rejectedItemCount,
          },
          updatedAt: claimedAt,
        },
        playerVault: savedVault,
      };
    }
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [api, formalGameBridge, onSavePlayerVault, onSaveProfile, onSettled, playerVault, profile, ready, reason, run]);

  return (
    <section className="formal-game-transition-wrap">
      <TrainingRunTransitionPage
        title="结算本局"
        detail="正在整理 BP、金币流水、背包资产和宝可梦战绩"
        tip={error || "正在计算 MVP、KDA、输出、承伤，并整理可带出工厂的养成物资。"}
        onReady={() => setReady(true)}
      />
    </section>
  );
}
