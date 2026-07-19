import {useEffect, useRef, useState} from "react";
import type {ChangeBattleV2Api, DesktopFormalGameBridge, FormalGameRunV4, FormalRoomCommandResultV1, FormalSettlementReasonV4, PlayerVaultV4, UserProfileV2, ViewScopeNameV5} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";
import "./FormalGameTransitionPage.css";

export function FormalSettlementTransitionPage({api, formalGameBridge, run, profile, playerVault, reason, formalRoomCredential, onSettled, onRoomSettled, onRoomScopedViewChange, onSaveProfile, onSavePlayerVault}: {
  api: ChangeBattleV2Api;
  formalGameBridge?: DesktopFormalGameBridge;
  run?: FormalGameRunV4 | null;
  profile: UserProfileV2;
  playerVault: PlayerVaultV4;
  reason: FormalSettlementReasonV4;
  formalRoomCredential?: {roomId: string; roomToken: string; matchId?: string} | null;
  onSettled: (run: FormalGameRunV4, profile: UserProfileV2, playerVault: PlayerVaultV4) => void;
  onRoomSettled?: (profile: UserProfileV2, playerVault: PlayerVaultV4) => void;
  onRoomScopedViewChange?: (scope: ViewScopeNameV5, view: FormalRoomCommandResultV1["view"], meta: {revision: number; phase: string}) => void;
  onSaveProfile?: (profile: UserProfileV2) => Promise<UserProfileV2>;
  onSavePlayerVault?: (vault: PlayerVaultV4) => Promise<PlayerVaultV4>;
}) {
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
    if (startedRef.current) return;
    startedRef.current = true;
    void settleFormalRun()
      .then(result => {
        if (!mountedRef.current) return;
        if (formalRoomCredential && !result.run) {
          onRoomSettled?.(result.profile, result.playerVault);
          return;
        }
        if (result.run) onSettled(result.run, result.profile, result.playerVault);
      })
      .catch(caught => {
        if (mountedRef.current) setError(caught instanceof Error ? caught.message : "正式结算失败。");
    });
    async function settleFormalRun() {
      if (!formalRoomCredential && run?.settled !== false) return {run, profile, playerVault};
      if (formalRoomCredential) {
        const clientRequestId = loadOrCreateSettlementRequestId(formalRoomCredential.roomId, formalRoomCredential.matchId || "match");
        if (!formalRoomCredential.matchId) throw new Error("当前房间缺少对局 ID，不能结算。请返回房间重新进入对局。");
        const finalized = await api.submitFormalRoomMatchCommand({
          roomId: formalRoomCredential.roomId,
          roomToken: formalRoomCredential.roomToken,
          matchId: formalRoomCredential.matchId,
          actionName: "rooms.matches.commands.finalizeRun",
          commandId: clientRequestId,
          payload: {
            reason,
            profileSnapshot: profile,
            playerVaultSnapshot: playerVault,
          },
        });
        if (!finalized.ok) throw new Error(finalized.message);
        onRoomScopedViewChange?.(finalized.data.scope, finalized.data.view, {revision: finalized.data.revision, phase: finalized.data.phase});
        const settlementId = finalized.data.settlementId;
        const nextProfile = finalized.data.profile;
        const nextVault = finalized.data.playerVault;
        if (!settlementId || !nextProfile || !nextVault) throw new Error("最终结算结果返回异常。");
        const applied = hasAppliedSettlement(profile.id, settlementId);
        const savedProfile = applied
          ? profile
          : onSaveProfile ? await onSaveProfile(nextProfile) : nextProfile;
        const savedVault = applied
          ? playerVault
          : onSavePlayerVault ? await onSavePlayerVault(nextVault) : await api.savePlayerVault(nextVault);
        if (!applied) markSettlementApplied(profile.id, settlementId);
        clearSettlementRequestId(formalRoomCredential.roomId, formalRoomCredential.matchId || "match");
        return {run: null, profile: savedProfile, playerVault: savedVault};
      }
      if (!run) throw new Error("正式存档不存在。");
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
  }, []);

  return (
    <section className="formal-game-transition-wrap">
      <TrainingRunTransitionPage
        title="结算本局"
        detail="正在整理 BP、金币流水、背包资产和宝可梦战绩"
        tip={error || "正在计算 MVP、KDA、输出、承伤，并整理可带出工厂的养成物资。"}
        onReady={() => undefined}
      />
    </section>
  );
}

function loadOrCreateSettlementRequestId(roomId: string, runId: string): string {
  const key = settlementRequestStorageKey(roomId, runId);
  try {
    const existing = window.sessionStorage?.getItem(key);
    if (existing) return existing;
    const next = `finalize-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage?.setItem(key, next);
    return next;
  } catch {
    return `finalize-run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

function clearSettlementRequestId(roomId: string, runId: string): void {
  try {
    window.sessionStorage?.removeItem(settlementRequestStorageKey(roomId, runId));
  } catch {
    // Best effort cleanup only.
  }
}

function settlementRequestStorageKey(roomId: string, runId: string): string {
  return `changebattle-v2:formal-room:${roomId}:finalize-run:${runId}`;
}

function hasAppliedSettlement(profileId: string, settlementId: string): boolean {
  try {
    return window.localStorage?.getItem(appliedSettlementStorageKey(profileId, settlementId)) === "1";
  } catch {
    return false;
  }
}

function markSettlementApplied(profileId: string, settlementId: string): void {
  try {
    window.localStorage?.setItem(appliedSettlementStorageKey(profileId, settlementId), "1");
  } catch {
    // If storage is unavailable, server idempotency still prevents duplicate final results.
  }
}

function appliedSettlementStorageKey(profileId: string, settlementId: string): string {
  return `changebattle-v2:formal-settlement-applied:${profileId}:${settlementId}`;
}
