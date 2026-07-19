import {useEffect, useRef, useState} from "react";
import {formalGameModeLabelV4, type ChangeBattleV2Api, type DesktopFormalGameBridge, type FormalGameRunV4, type FormalRoomCommandResultV1, type PlayerVaultV4, type RunGameStarterViewV5, type ViewScopeNameV5} from "@changebattle-v2/api";
import {TrainingRunTransitionPage} from "../training/TrainingRunTransitionPage";
import {loadFormalRoomCredential} from "../../lib/formalRoomCredential";
import "./FormalGameTransitionPage.css";

export function FormalRoundTransitionPage({api, formalGameBridge, run, roomStarterView, playerVault, onSavePlayerVault, onRunReady, onRoomScopedViewReady, onRoomReady}: {
  api: ChangeBattleV2Api;
  formalGameBridge?: DesktopFormalGameBridge;
  run?: FormalGameRunV4 | null;
  roomStarterView?: RunGameStarterViewV5 | null;
  playerVault: PlayerVaultV4;
  onSavePlayerVault: (vault: PlayerVaultV4) => Promise<PlayerVaultV4>;
  onRunReady: (run: FormalGameRunV4, playerVault: PlayerVaultV4) => void;
  onRoomScopedViewReady?: (scope: ViewScopeNameV5, view: FormalRoomCommandResultV1["view"], meta: {revision: number; phase: string}) => void;
  onRoomReady?: () => void;
}) {
  const [, setTransitionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const onRunReadyRef = useRef(onRunReady);
  const onSavePlayerVaultRef = useRef(onSavePlayerVault);
  const onRoomReadyRef = useRef(onRoomReady);
  const onRoomScopedViewReadyRef = useRef(onRoomScopedViewReady);
  const apiRef = useRef(api);
  const formalGameBridgeRef = useRef(formalGameBridge);
  const runRef = useRef(run);
  const roomStarterViewRef = useRef(roomStarterView);
  const playerVaultRef = useRef(playerVault);

  useEffect(() => {
    onRunReadyRef.current = onRunReady;
  }, [onRunReady]);

  useEffect(() => {
    onSavePlayerVaultRef.current = onSavePlayerVault;
  }, [onSavePlayerVault]);

  useEffect(() => {
    onRoomReadyRef.current = onRoomReady;
  }, [onRoomReady]);

  useEffect(() => {
    onRoomScopedViewReadyRef.current = onRoomScopedViewReady;
  }, [onRoomScopedViewReady]);

  useEffect(() => {
    if (startedRef.current) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || startedRef.current) return;
      startedRef.current = true;
      try {
        const credential = loadFormalRoomCredential();
        if (credential) {
          void prepareServerRoomRound(apiRef.current, credential.roomId, credential.roomToken, roomStarterViewRef.current)
            .then(response => {
              if (!cancelled) {
                onRoomScopedViewReadyRef.current?.(response.scope, response.view, {revision: response.revision, phase: response.phase});
                onRoomReadyRef.current?.();
              }
            })
            .catch(caught => {
              if (!cancelled) setError(caught instanceof Error ? caught.message : "正式赛程保存失败。");
            });
          return;
        }
        const currentRun = runRef.current;
        if (!currentRun) throw new Error("正式存档不存在。");
        const planPromise = apiRef.current.loadFormalGameRun()
            .then(saved => {
              if (saved?.id === currentRun.id && saved.restRunSnapshot) return saved;
              return formalGameBridgeRef.current
                ? formalGameBridgeRef.current.prepareFormalRoundPlan(currentRun)
                : Promise.resolve(apiRef.current.prepareFormalRoundPlan(currentRun));
            });
        void planPromise
          .then(async planned => {
            const carryResult = apiRef.current.applyFormalCarryPrepItems(planned, playerVaultRef.current);
            if (credential) {
              void onSavePlayerVaultRef.current(carryResult.playerVault).catch(() => undefined);
              return {savedRun: carryResult.run, savedVault: carryResult.playerVault};
            }
            const savedVault = await onSavePlayerVaultRef.current(carryResult.playerVault);
            const savedRun = await apiRef.current.saveFormalGameRun(carryResult.run);
            return {savedRun, savedVault};
          })
          .then(({savedRun, savedVault}) => {
            if (!cancelled) onRunReadyRef.current(savedRun, savedVault);
          })
          .catch(caught => {
            if (!cancelled) setError(caught instanceof Error ? caught.message : "正式赛程保存失败。");
          });
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "正式赛程生成失败。");
      }
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);
  const mode = roomStarterView?.config.mode || run?.mode || "singles";
  const competitionMode = roomStarterView?.config.competitionMode || run?.competitionMode || "single";
  const roundPlanLabel = competitionMode === "single" ? "1 场对局计划" : "7 场对局计划";

  return (
    <section className="formal-game-transition-wrap">
      <TrainingRunTransitionPage
        title="生成正式赛程"
        detail={`${formalGameModeLabelV4(mode)} · 正在固化 ${roundPlanLabel}`}
        tip={error || "正在生成 NPC、对手预览和休整快照，并写入正式存档。"}
        onReady={() => setTransitionReady(true)}
      />
    </section>
  );
}

async function prepareServerRoomRound(api: ChangeBattleV2Api, roomId: string, roomToken: string, view: RunGameStarterViewV5 | null | undefined): Promise<FormalRoomCommandResultV1> {
  const credential = loadFormalRoomCredential();
  if (credential?.matchId) {
    const result = await api.submitFormalRoomMatchCommand({
      roomId,
      roomToken,
      matchId: credential.matchId,
      actionName: "rooms.matches.commands.prepareRound",
      commandId: `prepare-round-${credential.matchId}-${view?.revision || 0}`,
      payload: {},
    });
    if (!result.ok) throw new Error(result.message);
    if (!result.data.view) throw new Error("服务器未返回房间视图。");
    return result.data;
  }
  throw new Error("当前房间缺少对局 ID，不能生成赛程。");
}
