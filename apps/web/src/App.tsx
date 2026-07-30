import {useEffect, useMemo, useRef, useState} from "react";
import {HashRouter, Navigate, Route, Routes, useLocation, useNavigate} from "react-router";
import {
  createBrowserUserProfileAdapter,
  createBrowserFormalGameRunAdapter,
  createBrowserPlayerVaultAdapter,
  createBrowserTrainingRunAdapter,
  createChangeBattleV2Api,
  createDesktopFormalGameRunAdapter,
  createDesktopPlayerVaultAdapter,
  createDesktopTrainingRunAdapter,
  createDesktopUserProfileAdapter,
  isUserProfileAssetFieldsValidV4,
  starChartHasSpecialTrainingLockV4,
  starChartHasOpponentRumorV4,
  starChartHasSoulmateRewardV4,
  type AppDebugConfigV4,
  type BattleServerConfigV4,
  type ChangeBattleV2Api,
  type DesktopBattleServiceBridge,
  type DesktopAppBridge,
  type DesktopFormalGameBridge,
  type DesktopFormalGameRunBridge,
  type DesktopPlayerVaultBridge,
  type DesktopUpdateStatusV4,
  type PlayerVaultStorageAdapter,
  type DesktopTrainingRunBridge,
  type DesktopUserProfileBridge,
  type FormalBattleResultFinalizeReasonV4,
  type BattlePreferenceV4,
  type FormalGameModeV4,
  type FormalGameRunV4,
  type FormalMedicalInsuranceChoiceV4,
  type FormalPokemonExchangeViewV4,
  type FormalRoomV1,
  type FormalRoomRestActionV1,
  type FormalRoundSettlementV4,
  type RunGameBattleViewV5,
  type RunGameRestViewV5,
  type RunGameScopedViewV5,
  type RunGameSettlementViewV5,
  type RunGameStarterViewV5,
  type RunGameSummaryViewV5,
  type ViewScopeNameV5,
  type FormalSettlementReasonV4,
  type LocalPokemonV4,
  type PostServiceActionNameV4,
  type PostServiceConnectionStateV4,
  type TrainingRunGameV4,
  type UserProfileDraftV2,
  type UserProfileV2,
  type PlayerVaultV4,
  type DexSearchRow,
  type DexCategory,
} from "@changebattle-v2/api";
import {QuickDexModal} from "./components/dex/QuickDexModal";
import {BgmController} from "./components/audio/BgmController";
import type {BgmSceneV2} from "./components/audio/musicManifest";
import {BattlePreferencePage} from "./components/battle-preference/BattlePreferencePage";
import {BattleV4Page} from "./components/battle-v4/BattleV4Page";
import {TrainingBattleTransitionPage} from "./components/battle-v4/TrainingBattleTransitionPage";
import {ComponentGalleryPage} from "./components/gallery/ComponentGalleryPage";
import {FormalGamePendingPage} from "./components/formal/FormalGamePendingPage";
import {FormalMedicalInsuranceDialog} from "./components/formal/FormalMedicalInsuranceDialog";
import {FormalSettlementPage} from "./components/formal/FormalSettlementPage";
import {FormalSettlementTransitionPage} from "./components/formal/FormalSettlementTransitionPage";
import {FormalBattleResultTransitionPage} from "./components/formal/FormalBattleResultTransitionPage";
import {FormalBattleTransitionPage} from "./components/formal/FormalBattleTransitionPage";
import {FormalRoundTransitionPage} from "./components/formal/FormalRoundTransitionPage";
import {FormalStarterSelectPage} from "./components/formal/FormalStarterSelectPage";
import {PlayerSettingsPage} from "./components/player/PlayerSettingsPage";
import {GameViewport} from "./components/shell/GameViewport";
import {MainMenuPage} from "./components/shell/MainMenuPage";
import {RoomLobbyPage} from "./components/room/RoomLobbyPage";
import {NetworkOfflineSettingsModal} from "./components/shell/NetworkOfflineSettingsModal";
import {DesktopUpdateModal, desktopUpdateStatusVisible} from "./components/shell/DesktopUpdateModal";
import {TalentConfigPage} from "./components/star-chart/TalentConfigPage";
import {TitlePage} from "./components/shell/TitlePage";
import {TrainerVaultPage} from "./components/trainer-vault/TrainerVaultPage";
import {TrainingConfigPage} from "./components/training/TrainingConfigPage";
import {TrainingBattleResultTransitionPage} from "./components/training/TrainingBattleResultTransitionPage";
import {TrainingRestNewPage} from "./components/training/TrainingRestNewPage";
import {trainingRestDisplayFromTrainingRunV4, type TrainingRestDisplayModel as TrainingRestLegacyDisplayModel} from "./components/training/TrainingRestLegacyDisplayModel";
import {trainingRestDisplayFromRestViewV5, type RoomRestDisplayModel} from "./components/training/TrainingRestRoomDisplayModel";
import {TrainingRestPage} from "./components/training/TrainingRestPage";
import {TrainingRunTransitionPage} from "./components/training/TrainingRunTransitionPage";
import {setAssetCacheRuntimeConfig, showdownAssetPrefix} from "./lib/assetUrl";
import {battleServerBaseUrl, battleServerConfigWithEnvFallback, clearAssetRuntimeCache, loadBattleServerRuntimeConfig, saveBattleServerRuntimeConfig, testBattleServerRuntimeUrl} from "./lib/battleServerRuntimeConfig";
import {releaseGuardProfileBattlePreferenceV4} from "./lib/battlePreferenceReleaseGuard";
import {CHANGE_BATTLE_DEBUG_FEATURES_ENABLED, CHANGE_BATTLE_RELEASE_CHANNEL} from "./lib/debugFeatures";
import {clearFormalRoomCredential, loadFormalRoomCredential, saveFormalRoomCredential} from "./lib/formalRoomCredential";
import {createFormalRoomSyncClient, type FormalRoomSyncClientV4} from "./lib/formalRoomSyncClient";

type AppProps = {
  runtime: "web" | "desktop" | "mobile";
};

type FormalRoomClientCacheV5 = {
  revision: number;
  phase: string | null;
  views: {
    summary?: RunGameSummaryViewV5;
    starter?: RunGameStarterViewV5;
    rest?: RunGameRestViewV5;
    battle?: RunGameBattleViewV5;
    settlement?: RunGameSettlementViewV5;
  };
  stale: Partial<Record<ViewScopeNameV5, number>>;
  pendingCommand: {commandId: string; commandName: string; scope: ViewScopeNameV5; startedAt: string} | null;
  localDraft: Record<string, unknown>;
};

type FormalRestDisplayModel = TrainingRestLegacyDisplayModel | RoomRestDisplayModel;

const EMPTY_FORMAL_ROOM_CLIENT_CACHE_V5: FormalRoomClientCacheV5 = {
  revision: 0,
  phase: null,
  views: {},
  stale: {},
  pendingCommand: null,
  localDraft: {},
};

const IS_DEV_BUILD = import.meta.env.DEV;
const DEBUG_FEATURE_ENABLED = CHANGE_BATTLE_DEBUG_FEATURES_ENABLED;
const DEFAULT_PUBLIC_BATTLE_SERVICE_URL = "https://api.65h26i.top/changebattle/battle";
const isDebug = true;
const APP_DEBUG_CONFIG_V4: AppDebugConfigV4 = {
  isDebug,
  battle: true,
  command: true,
  mapping: true,
  protocol: true,
  ui: true,
};

type ChangeBattleV2Window = Window & {
  changeBattleV2?: {
    app?: DesktopAppBridge;
    battleService?: DesktopBattleServiceBridge;
    formalGame?: DesktopFormalGameBridge;
    formalRun?: DesktopFormalGameRunBridge;
    playerVault?: DesktopPlayerVaultBridge;
    trainingRun?: DesktopTrainingRunBridge;
    userProfile?: DesktopUserProfileBridge;
  };
};

export function App({runtime}: AppProps) {
  return (
    <HashRouter>
      <RoutedApp runtime={runtime} />
    </HashRouter>
  );
}

function RoutedApp({runtime}: AppProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const initialDesktopPathnameRef = useRef(location.pathname);
  const [desktopStartupRouteResetting, setDesktopStartupRouteResetting] = useState(() => runtime === "desktop" && location.pathname !== "/");
  const desktopBridgeRoot = useMemo(() => runtime === "desktop" && typeof window !== "undefined"
    ? (window as ChangeBattleV2Window).changeBattleV2
    : undefined, [runtime]);
  const battleServiceBridge = desktopBridgeRoot?.battleService;
  const desktopAppBridge = desktopBridgeRoot?.app;
  const [desktopBattleServiceConfig, setDesktopBattleServiceConfig] = useState<{backend: "server" | "local-fallback"; url?: string} | null>(null);
  const [battleServerConfig, setBattleServerConfig] = useState<BattleServerConfigV4 | null>(null);
  const [battleServerConfigLoaded, setBattleServerConfigLoaded] = useState(false);
  const [networkSettingsOpen, setNetworkSettingsOpen] = useState(false);
  const [formalRoomConnectionEnabled, setFormalRoomConnectionEnabled] = useState(false);
  const [formalRoomCredentialVersion, setFormalRoomCredentialVersion] = useState(0);
  const battleServiceUrl = useMemo(() => resolveBattleServiceUrl(runtime, battleServerConfig, desktopBattleServiceConfig), [battleServerConfig, desktopBattleServiceConfig, runtime]);
  setAssetCacheRuntimeConfig({
    enabled: Boolean(battleServerConfig?.assetCache.enabled),
    provider: runtime === "desktop" ? "desktop" : "none",
  });
  const useDesktopLocalBattleFallback = runtime === "desktop" && desktopBattleServiceConfig?.backend === "local-fallback" && !battleServiceUrl && Boolean(battleServiceBridge);
  const battleBackendLabel = useDesktopLocalBattleFallback ? "local-dev-fallback" : "server-api";
  const desktopUpdatesEnabled = runtime === "desktop" && !IS_DEV_BUILD && Boolean(desktopAppBridge);
  const userProfileAdapter = useMemo(() => createUserProfileAdapter(runtime), [runtime]);
  const playerVaultAdapter = useMemo(() => createPlayerVaultAdapter(runtime), [runtime]);
  const [serverConnectionState, setServerConnectionState] = useState<PostServiceConnectionStateV4 | null>(null);
  const api = useMemo(() => createChangeBattleV2Api({
    userProfileAdapter,
    playerVaultAdapter,
    trainingRunAdapter: createTrainingRunAdapter(runtime),
    formalGameRunAdapter: createFormalRunAdapter(runtime),
    battleServiceClient: useDesktopLocalBattleFallback ? battleServiceBridge : undefined,
    battleServiceUrl,
    onServerConnectionState: setServerConnectionState,
    resourcePrefix: showdownAssetPrefix(),
  }), [battleServerConfig?.assetCache.enabled, battleServiceBridge, battleServiceUrl, playerVaultAdapter, runtime, useDesktopLocalBattleFallback, userProfileAdapter]);
  const formalGameBridge = desktopBridgeRoot?.formalGame;
  const formalGameBattleResultBridge = useDesktopLocalBattleFallback ? formalGameBridge : undefined;
  const catalog = useMemo(() => api.getTrainerCatalog(), [api]);
  const [profile, setProfile] = useState<UserProfileV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("正在读取本地资料...");
  const [editingProfile, setEditingProfile] = useState<UserProfileV2 | null>(null);
  const [dexOpen, setDexOpen] = useState(false);
  const [dexInitialPokemonId, setDexInitialPokemonId] = useState<string | null>(null);
  const [dexInitialCategory, setDexInitialCategory] = useState<Extract<DexCategory, "pokemon" | "moves" | "abilities" | "items"> | undefined>(undefined);
  const [dexInitialQuery, setDexInitialQuery] = useState<string | null>(null);
  const [dexInitialRow, setDexInitialRow] = useState<DexSearchRow | null>(null);
  const [playerVault, setPlayerVault] = useState<PlayerVaultV4>(() => api.normalizePlayerVault());
  const [playerVaultDirty, setPlayerVaultDirty] = useState(false);
  const [trainingRun, setTrainingRun] = useState<TrainingRunGameV4 | null>(null);
  const [formalRun, setFormalRun] = useState<FormalGameRunV4 | null>(null);
  const [formalRoomClientCache, setFormalRoomClientCache] = useState<FormalRoomClientCacheV5>(EMPTY_FORMAL_ROOM_CLIENT_CACHE_V5);
  const [lobbyRoom, setLobbyRoom] = useState<FormalRoomV1 | null>(null);
  const [lobbyRoomToken, setLobbyRoomToken] = useState("");
  const [lobbyBusyMessage, setLobbyBusyMessage] = useState<string | null>(null);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [formalRunLoaded, setFormalRunLoaded] = useState(false);
  const profileAssetWarning = profile && !isUserProfileAssetFieldsValidV4(profile)
    ? "头像资源设置无效，请重新设置头像。"
    : "";
  const formalRoomSyncClientRef = useRef<FormalRoomSyncClientV4 | null>(null);
  const apiRef = useRef(api);
  const confirmedFormalRunRef = useRef<FormalGameRunV4 | null>(null);
  const formalTransitionProfile = useMemo(() => profile ? releaseGuardProfileBattlePreferenceV4(profile, DEBUG_FEATURE_ENABLED) : null, [profile]);
  const formalRoomRouteActive = isFormalRoomConnectionRoute(location.pathname);
  const formalRoomCredential = useMemo(() => {
    if (desktopStartupRouteResetting || !formalRoomRouteActive) return null;
    return loadFormalRoomCredential();
  }, [desktopStartupRouteResetting, formalRoomCredentialVersion, formalRoomRouteActive, location.pathname]);
  const formalRoomSummaryView = formalRoomClientCache.views.summary || null;
  const formalRoomStarterView = formalRoomClientCache.views.starter || null;
  const formalRoomRestView = formalRoomClientCache.views.rest || null;
  const formalRoomBattleView = formalRoomClientCache.views.battle || null;
  const formalRoomSettlementView = formalRoomClientCache.views.settlement || null;
  const formalRoomRevision = formalRoomClientCache.revision;
  const formalRoomCurrentScope = formalRoomScopeForRoute(location.pathname);
  const formalRoomCurrentScopedView = formalRoomCurrentScope ? formalRoomClientCache.views[formalRoomCurrentScope] || null : null;
  const formalRoomBattleService = useMemo(() => formalRoomCredential
    ? api.createFormalRoomBattleServiceClient({roomId: formalRoomCredential.roomId, roomToken: formalRoomCredential.roomToken, matchId: formalRoomCredential.matchId})
    : undefined, [api, formalRoomCredential?.matchId, formalRoomCredential?.roomId, formalRoomCredential?.roomToken]);
  const [manualSaveState, setManualSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const formalBattleSessionStorageKey = `changebattle-v2:${runtime}:formal-battle-session`;
  const [battleSessionId, setBattleSessionId] = useState(() => {
    try {
      return window.sessionStorage?.getItem(formalBattleSessionStorageKey) || "";
    } catch {
      return "";
    }
  });
  const [formalBattleSessionRestoring, setFormalBattleSessionRestoring] = useState(false);
  const [formalBattleRecoveredSceneSessionId, setFormalBattleRecoveredSceneSessionId] = useState("");
  const [seenRoundSettlementNodeIds, setSeenRoundSettlementNodeIds] = useState<Record<string, true>>({});
  const [formalRestInitialNotice, setFormalRestInitialNotice] = useState<string | null>(null);
  const [formalRestBusyMessage, setFormalRestBusyMessage] = useState<string | null>(null);
  const [medicalInsuranceBusy, setMedicalInsuranceBusy] = useState(false);
  const [medicalInsuranceError, setMedicalInsuranceError] = useState<string | null>(null);
  const [desktopUpdateStatus, setDesktopUpdateStatus] = useState<DesktopUpdateStatusV4 | null>(null);
  const [desktopUpdateModalDismissed, setDesktopUpdateModalDismissed] = useState(false);
  const [desktopUpdateChecking, setDesktopUpdateChecking] = useState(false);
  const [desktopManualUpdateCheckActive, setDesktopManualUpdateCheckActive] = useState(false);

  useEffect(() => {
    if (runtime !== "desktop") return;
    if (!desktopStartupRouteResetting) return;
    if (initialDesktopPathnameRef.current === "/") {
      setDesktopStartupRouteResetting(false);
      return;
    }
    navigate("/", {replace: true});
    setDesktopStartupRouteResetting(false);
  }, [desktopStartupRouteResetting, navigate, runtime]);

  useEffect(() => {
    if (!formalRoomConnectionEnabled) return;
    if (isFormalRoomSessionRoute(location.pathname)) return;
    deactivateFormalRoomConnection();
  }, [formalRoomConnectionEnabled, location.pathname]);

  useEffect(() => {
    if (desktopStartupRouteResetting || formalRoomConnectionEnabled || !formalRoomRouteActive) return;
    const credential = loadFormalRoomCredential();
    if (!credential) return;
    setFormalRoomConnectionEnabled(true);
    setFormalRoomCredentialVersion(version => version + 1);
  }, [desktopStartupRouteResetting, formalRoomConnectionEnabled, formalRoomRouteActive, location.pathname]);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  useEffect(() => {
    confirmedFormalRunRef.current = formalRun;
  }, [formalRun?.id]);

  useEffect(() => {
    formalRoomSyncClientRef.current?.dispose();
    formalRoomSyncClientRef.current = null;
    if (!formalRoomCredential) return;
    if (formalRun) confirmedFormalRunRef.current = formalRun;
    const client = createFormalRoomSyncClient({
      baseUrl: battleServiceUrl,
      roomId: formalRoomCredential.roomId,
      roomToken: formalRoomCredential.roomToken,
      onConnectionState: setServerConnectionState,
      onRoomUpdated: payload => {
        setLobbyRoom(payload.room);
      },
      onRoomClosed: reason => {
        setFormalRestInitialNotice(reason === "deleted" ? "房间已经关闭。" : `房间连接已关闭：${reason}`);
      },
      fallbackHeartbeat: () => apiRef.current.heartbeatFormalRoom({
        roomId: formalRoomCredential.roomId,
        roomToken: formalRoomCredential.roomToken,
      }),
    });
    formalRoomSyncClientRef.current = client;
    return () => {
      client.dispose();
      if (formalRoomSyncClientRef.current === client) formalRoomSyncClientRef.current = null;
    };
  }, [battleServiceUrl, formalRoomCredential?.roomId, formalRoomCredential?.roomToken]);

  useEffect(() => {
    if (!formalRoomRouteActive || !formalRoomCredential) return;
    void api.deleteFormalGameRun().catch(() => undefined);
  }, [api, formalRoomCredential?.roomId, formalRoomRouteActive]);

  useEffect(() => {
    if (!formalRun?.settled) return;
    const credential = loadFormalRoomCredential();
    if (credential?.matchId || (credential && formalRoomRouteActive)) return;
    clearFormalRoomCredential();
    try {
      window.sessionStorage?.removeItem(formalBattleSessionStorageKey);
    } catch {
      // Best-effort cleanup only.
    }
    setBattleSessionId("");
    setFormalBattleRecoveredSceneSessionId("");
  }, [formalBattleSessionStorageKey, formalRoomRouteActive, formalRun?.settled]);

  useEffect(() => {
    if (location.pathname !== "/formal/battle" || !formalRoomCredential) return;
    const cachedSessionId = battleSessionId || safeSessionStorageGet(formalBattleSessionStorageKey);
    if (cachedSessionId) return;
    let cancelled = false;
    setFormalBattleSessionRestoring(true);
    const loadBattleView = formalRoomCredential.matchId
      ? api.getFormalRoomMatchView({roomId: formalRoomCredential.roomId, roomToken: formalRoomCredential.roomToken, matchId: formalRoomCredential.matchId, scope: "battle"})
      : api.getFormalRoom({roomId: formalRoomCredential.roomId, roomToken: formalRoomCredential.roomToken});
    loadBattleView
      .then(result => {
        if (cancelled) return;
        if (!result.ok) {
          setFormalRestInitialNotice(`战斗房间恢复失败：${result.message}`);
          return;
        }
        const room = "view" in result.data ? result.data.room : result.data;
        const activeBattle = "view" in result.data ? result.data.activeBattle : result.data.activeBattle;
        if ("view" in result.data) applyFormalRoomCommandView(result.data);
        const sessionId = activeBattle?.sessionId || "";
        if (sessionId) {
          setBattleSessionId(sessionId);
          setFormalBattleRecoveredSceneSessionId(sessionId);
          safeSessionStorageSet(formalBattleSessionStorageKey, sessionId);
        } else if (room.status === "ended") {
          clearFormalRoomCredential();
        } else {
          setFormalRestInitialNotice("当前房间没有可恢复的战斗会话，请返回休整页重新进入。");
        }
      })
      .catch(error => {
        if (cancelled) return;
        setFormalRestInitialNotice(error instanceof Error ? `战斗房间恢复失败：${error.message}` : "战斗房间恢复失败。");
      })
      .finally(() => {
        if (!cancelled) setFormalBattleSessionRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, battleSessionId, formalBattleSessionStorageKey, formalRoomCredential?.matchId, formalRoomCredential?.roomId, formalRoomCredential?.roomToken, location.pathname]);

  useEffect(() => {
    if (!formalRoomCredential?.matchId || !formalRoomRouteActive || !formalRoomCurrentScope || formalRoomCurrentScopedView || !formalRunLoaded) return;
    let cancelled = false;
    setFormalRestBusyMessage("正在同步房间视图");
    api.getFormalRoomMatchView({roomId: formalRoomCredential.roomId, roomToken: formalRoomCredential.roomToken, matchId: formalRoomCredential.matchId, scope: formalRoomCurrentScope})
      .then(result => {
        if (cancelled) return;
        if (!result.ok) {
          setFormalRestInitialNotice(`房间视图同步失败：${result.message}`);
          return;
        }
        setLobbyRoom(result.data.room);
        applyFormalRoomCommandView(result.data);
      })
      .catch(error => {
        if (cancelled) return;
        setFormalRestInitialNotice(error instanceof Error ? `房间视图同步失败：${error.message}` : "房间视图同步失败。");
      })
      .finally(() => {
        if (!cancelled) setFormalRestBusyMessage(null);
      });
    return () => {
      cancelled = true;
      // The scoped view itself is part of this effect's dependencies. A
      // successful response updates that view, which cleans up this effect
      // before the promise's finally handler gets a chance to run. Always
      // release the overlay during cleanup so a successful view refresh
      // cannot leave the rest page permanently blocked.
      setFormalRestBusyMessage(null);
    };
  }, [api, formalRoomCredential?.matchId, formalRoomCredential?.roomId, formalRoomCredential?.roomToken, formalRoomCurrentScope, formalRoomCurrentScopedView, formalRoomRouteActive, formalRunLoaded]);

  useEffect(() => {
    if (location.pathname !== "/formal/room/create" || lobbyRoom || lobbyRoomToken || !formalRoomCredential?.roomId) return;
    let cancelled = false;
    setLobbyBusyMessage("正在恢复房间...");
    api.getFormalRoom({roomId: formalRoomCredential.roomId, roomToken: formalRoomCredential.roomToken})
      .then(result => {
        if (cancelled) return;
        if (!result.ok) {
          setLobbyError(result.message);
          return;
        }
        setLobbyRoom(result.data);
        setLobbyRoomToken(formalRoomCredential.roomToken);
      })
      .catch(error => {
        if (!cancelled) setLobbyError(error instanceof Error ? error.message : "恢复房间失败。");
      })
      .finally(() => {
        if (!cancelled) setLobbyBusyMessage(null);
      });
    return () => {
      cancelled = true;
    };
  }, [api, formalRoomCredential?.roomId, formalRoomCredential?.roomToken, lobbyRoom, lobbyRoomToken, location.pathname]);

  useEffect(() => {
    if (!formalRoomCredential?.roomId || formalRoomSettlementView?.settlement || !formalRunLoaded) return;
    if (location.pathname !== "/formal/settlement" && location.pathname !== "/formal/settlement-transition") return;
    let cancelled = false;
    api.getFormalRoomFinalResult({roomId: formalRoomCredential.roomId, roomToken: formalRoomCredential.roomToken})
      .then(result => {
        if (cancelled || !result.ok) return;
        setProfile(result.data.profile);
        setPlayerVault(result.data.playerVault);
        setPlayerVaultDirty(false);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, formalRoomCredential?.roomId, formalRoomCredential?.roomToken, formalRoomSettlementView?.settlement, formalRunLoaded, location.pathname]);

  useEffect(() => {
    let cancelled = false;
    api.loadUserProfile()
      .then(next => {
        if (cancelled) return;
        setProfile(next);
        setMessage(next ? (isUserProfileAssetFieldsValidV4(next) ? "已找到本地资料。" : "头像资源设置无效，请重新设置头像。") : "还没有资料，先创建一个训练师。");
      })
      .catch(error => {
        if (cancelled) return;
        setMessage(error instanceof Error ? error.message : "读取资料失败。");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    if (runtime !== "desktop" || profile) return;
    const bridge = typeof window === "undefined"
      ? undefined
      : (window as ChangeBattleV2Window).changeBattleV2?.userProfile;
    if (!bridge?.getUserProfilePath) return;
    let cancelled = false;
    bridge.getUserProfilePath()
      .then(filePath => {
        if (!cancelled) setMessage(`还没有资料，桌面资料文件将保存到：${filePath}`);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [runtime, profile]);

  useEffect(() => {
    if (runtime === "desktop" && !desktopAppBridge) {
      setBattleServerConfigLoaded(false);
      return;
    }
    let cancelled = false;
    setBattleServerConfigLoaded(false);
    loadBattleServerRuntimeConfig(desktopAppBridge)
      .then(config => {
        if (!cancelled) setBattleServerConfig(config);
      })
      .catch(() => {
        if (!cancelled) setBattleServerConfig(null);
      })
      .finally(() => {
        if (!cancelled) setBattleServerConfigLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [desktopAppBridge, runtime]);

  useEffect(() => {
    if (runtime !== "desktop") {
      setDesktopBattleServiceConfig(null);
      return;
    }
    if (!desktopAppBridge?.getBattleServiceConfig) {
      setDesktopBattleServiceConfig({backend: "server", url: DEFAULT_PUBLIC_BATTLE_SERVICE_URL});
      return;
    }
    let cancelled = false;
    desktopAppBridge.getBattleServiceConfig()
      .then(config => {
        if (!cancelled) setDesktopBattleServiceConfig(config);
      })
      .catch(() => {
        if (!cancelled) setDesktopBattleServiceConfig({backend: "server", url: DEFAULT_PUBLIC_BATTLE_SERVICE_URL});
      });
    return () => {
      cancelled = true;
    };
  }, [battleServiceBridge, desktopAppBridge, runtime]);

  useEffect(() => {
    if (!desktopUpdatesEnabled || !desktopAppBridge) return;
    let cancelled = false;
    desktopAppBridge.getUpdateStatus()
      .then(status => {
        if (!cancelled) setDesktopUpdateStatus(status);
      })
      .catch(() => undefined);
    const unsubscribe = desktopAppBridge.onUpdateStatus(status => {
      if (cancelled) return;
      setDesktopUpdateStatus(status);
      if (desktopUpdateStatusVisible(status) && status.phase !== "downloading" && status.phase !== "up-to-date") {
        setDesktopUpdateModalDismissed(false);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [desktopAppBridge, desktopUpdatesEnabled]);

  useEffect(() => {
    if (!profile) {
      setPlayerVault(api.normalizePlayerVault());
      setPlayerVaultDirty(false);
      setTrainingRun(null);
      setFormalRun(null);
      setFormalRoomClientCache(EMPTY_FORMAL_ROOM_CLIENT_CACHE_V5);
      return;
    }
    let cancelled = false;
    api.loadTrainingRun()
      .then(next => {
        if (!cancelled) setTrainingRun(next);
      })
      .catch(() => {
        if (!cancelled) setTrainingRun(null);
      });
    return () => {
      cancelled = true;
    };
  }, [api, profile]);

  useEffect(() => {
    if (!profile) {
      setPlayerVault(api.normalizePlayerVault());
      setPlayerVaultDirty(false);
      return;
    }
    let cancelled = false;
    api.loadPlayerVault()
      .then(next => {
        if (!cancelled) {
          setPlayerVault(next);
          setPlayerVaultDirty(false);
        }
      })
      .catch(error => {
        if (!cancelled) {
          console.error("[changebattle-v2] load player vault failed", error);
          setPlayerVault(api.normalizePlayerVault());
          setPlayerVaultDirty(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [api, profile]);

  useEffect(() => {
    if (!profile) {
      setFormalRun(null);
      setFormalRoomClientCache(EMPTY_FORMAL_ROOM_CLIENT_CACHE_V5);
      setFormalRunLoaded(true);
      return;
    }
    if (formalRoomRouteActive && loadFormalRoomCredential()) {
      setFormalRunLoaded(true);
      return;
    }
    let cancelled = false;
    setFormalRunLoaded(false);
    api.loadFormalGameRun()
      .then(next => {
        if (!cancelled) setFormalRun(next);
      })
      .catch(() => {
        if (!cancelled) setFormalRun(null);
      })
      .finally(() => {
        if (!cancelled) setFormalRunLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [api, formalRoomRouteActive, profile]);

  async function createOrUpdateProfile(draft: UserProfileDraftV2) {
    try {
      const next = editingProfile
        ? await api.updateUserProfile(editingProfile, draft)
        : await api.createUserProfile(draft);
      setProfile(next);
      setEditingProfile(null);
      setMessage("资料已保存。");
      navigate("/main", {replace: true});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存资料失败。");
      throw error;
    }
  }

  async function deleteProfile() {
    try {
      deactivateFormalRoomConnection();
      clearFormalRoomCredential();
      await api.deleteTrainingRun();
      await api.deleteFormalGameRun();
      await api.deletePlayerVault();
      await api.deleteUserProfile();
      setProfile(null);
      setPlayerVault(api.normalizePlayerVault());
      setPlayerVaultDirty(false);
      setEditingProfile(null);
      setMessage("本地资料已删除。");
      navigate("/", {replace: true});
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除资料失败。");
    }
  }

  function startCreate() {
    setEditingProfile(null);
    navigate("/user");
  }

  function startEdit() {
    setEditingProfile(profile);
    navigate("/user");
  }

  function ensureProfileAssetFieldsReady(): boolean {
    if (!profile || isUserProfileAssetFieldsValidV4(profile)) return true;
    setMessage("头像资源设置无效，请重新设置头像。");
    setEditingProfile(profile);
    navigate("/user", {replace: true});
    return false;
  }

  async function createTrainingRunAndOpenConfig() {
    if (!profile) {
      navigate("/", {replace: true});
      return;
    }
    if (!ensureProfileAssetFieldsReady()) return;
    await api.deleteTrainingRun();
    const next = await api.saveTrainingRun(api.createTrainingRunGame(profile));
    setTrainingRun(next);
    navigate("/training/config", {replace: true});
  }

  async function createFormalLobbyRoom() {
    if (!profile) {
      navigate("/", {replace: true});
      return;
    }
    if (!ensureProfileAssetFieldsReady()) return;
    deactivateFormalRoomConnection();
    clearFormalRoomCredential();
    setFormalRun(null);
    void api.deleteFormalGameRun().catch(() => undefined);
    setLobbyRoom(null);
    setLobbyRoomToken("");
    setLobbyError(null);
    setLobbyBusyMessage("正在创建房间...");
    navigate("/formal/room/create", {replace: true});
    try {
      const result = await api.startFormalRoom({memberName: profile.name, profileSnapshot: profile});
      if (!result.ok) throw new Error(result.message);
      saveFormalRoomCredential(result.data.roomId, result.data.roomToken);
      setLobbyRoom(result.data);
      setLobbyRoomToken(result.data.roomToken);
      setFormalRoomConnectionEnabled(false);
      setFormalRoomCredentialVersion(version => version + 1);
    } catch (error) {
      setLobbyError(error instanceof Error ? error.message : "创建房间失败。");
    } finally {
      setLobbyBusyMessage(null);
    }
  }

  async function createFormalLobbyMatch(input: {mode: FormalGameModeV4; battlePreferenceSnapshot: BattlePreferenceV4}) {
    if (!profile || !lobbyRoom || !lobbyRoomToken) throw new Error("房间不存在。");
    setLobbyError(null);
    setLobbyBusyMessage("正在创建对局...");
    try {
      const result = await api.createFormalRoomMatch({
        roomId: lobbyRoom.roomId,
        roomToken: lobbyRoomToken,
        clientRequestId: `match-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        profileSnapshot: formalTransitionProfile || profile,
        playerVaultSnapshot: playerVault,
        mode: input.mode,
        battlePreferenceSnapshot: input.battlePreferenceSnapshot,
        options: {mode: input.mode},
      });
      if (!result.ok) throw new Error(result.message);
      setLobbyRoom(result.data.room);
    } catch (error) {
      setLobbyError(error instanceof Error ? error.message : "创建对局失败。");
      throw error;
    } finally {
      setLobbyBusyMessage(null);
    }
  }

  async function setFormalLobbyMatchReady(ready: boolean, matchId: string) {
    if (!lobbyRoom || !lobbyRoomToken) throw new Error("房间不存在。");
    setLobbyError(null);
    setLobbyBusyMessage(ready ? "正在准备..." : "正在取消准备...");
    try {
      const result = ready
        ? await api.readyFormalRoomMatch({roomId: lobbyRoom.roomId, roomToken: lobbyRoomToken, matchId})
        : await api.unreadyFormalRoomMatch({roomId: lobbyRoom.roomId, roomToken: lobbyRoomToken, matchId});
      if (!result.ok) throw new Error(result.message);
      setLobbyRoom(result.data.room);
    } catch (error) {
      setLobbyError(error instanceof Error ? error.message : "准备状态同步失败。");
      throw error;
    } finally {
      setLobbyBusyMessage(null);
    }
  }

  async function startFormalLobbyMatch(matchId: string) {
    if (!lobbyRoom || !lobbyRoomToken) throw new Error("房间不存在。");
    setLobbyError(null);
    setLobbyBusyMessage("正在开始游戏...");
    try {
      const result = await api.startFormalRoomMatch({
        roomId: lobbyRoom.roomId,
        roomToken: lobbyRoomToken,
        matchId,
        clientRequestId: `start-${matchId}`,
      });
      if (!result.ok) throw new Error(result.message);
      setLobbyRoom(result.data.room);
      saveFormalRoomCredential(lobbyRoom.roomId, lobbyRoomToken, matchId);
      const viewResult = await api.getFormalRoomMatchView({roomId: lobbyRoom.roomId, roomToken: lobbyRoomToken, matchId, scope: "starter"});
      if (!viewResult.ok) throw new Error(viewResult.message);
      if (!viewResult.data.view) throw new Error("对局启动失败：服务器未返回 V5 房间视图。");
      applyFormalRoomCommandView(viewResult.data);
      setFormalRoomConnectionEnabled(true);
      setFormalRoomCredentialVersion(version => version + 1);
      activateFormalRoomConnection();
      navigate("/formal/starter-select", {replace: true});
    } catch (error) {
      setLobbyError(error instanceof Error ? error.message : "开始游戏失败。");
      throw error;
    } finally {
      setLobbyBusyMessage(null);
    }
  }

  async function leaveFormalLobbyRoom() {
    const roomId = lobbyRoom?.roomId;
    const roomToken = lobbyRoomToken;
    setLobbyBusyMessage("正在关闭房间...");
    try {
      if (roomId && roomToken) await api.deleteFormalRoom({roomId, roomToken}).catch(() => undefined);
    } finally {
      deactivateFormalRoomConnection();
      clearFormalRoomCredential();
      setLobbyRoom(null);
      setLobbyRoomToken("");
      setFormalRun(null);
      await api.deleteFormalGameRun().catch(() => undefined);
      setLobbyBusyMessage(null);
      navigate("/main", {replace: true});
    }
  }

  async function returnToFormalLobbyAfterSettlement(credential: {roomId: string; roomToken: string; matchId?: string}) {
    if (!credential.matchId) {
      navigate("/main", {replace: true});
      return;
    }
    setLobbyBusyMessage("正在返回房间...");
    setLobbyError(null);
    try {
      const result = await api.submitFormalRoomMatchCommand({
        roomId: credential.roomId,
        roomToken: credential.roomToken,
        matchId: credential.matchId,
        actionName: "rooms.matches.commands.ackFinalResult",
        commandId: `ack-final-${credential.matchId}`,
        payload: {},
      });
      if (!result.ok) throw new Error(result.message);
      setLobbyRoom(result.data.room);
      setLobbyRoomToken(credential.roomToken);
      setFormalRun(null);
      setBattleSessionId("");
      setFormalBattleRecoveredSceneSessionId("");
      saveFormalRoomCredential(credential.roomId, credential.roomToken);
      setFormalRoomCredentialVersion(version => version + 1);
      activateFormalRoomConnection();
      navigate("/formal/room/create", {replace: true});
    } catch (error) {
      setLobbyError(error instanceof Error ? error.message : "返回房间失败。");
    } finally {
      setLobbyBusyMessage(null);
    }
  }

  async function enableTestMode() {
    if (!profile) return;
    if (!ensureProfileAssetFieldsReady()) return;
    try {
      const next = await api.enableTestMode(profile);
      setProfile(next);
      setMessage("测试模式已开启：BP 99999，星图已全解锁。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "测试模式开启失败。");
    }
  }

  async function saveAllCurrentState() {
    if (!profile || manualSaveState === "saving") return;
    if (!ensureProfileAssetFieldsReady()) return;
    setManualSaveState("saving");
    setMessage("存档中...");
    try {
      const savedProfile = await userProfileAdapter.saveUserProfile(profile);
      const savedVault = await api.savePlayerVault(playerVault);
      if (trainingRun) {
        const savedTrainingRun = await api.saveTrainingRun(trainingRun);
        setTrainingRun(savedTrainingRun);
      }
      if (formalRun && !formalRoomCredential) {
        const savedFormalRun = await persistFormalRunLocal(formalRun);
        setFormalRun(savedFormalRun);
      }
      setProfile(savedProfile);
      setPlayerVault(savedVault);
      setPlayerVaultDirty(false);
      setManualSaveState("saved");
      setMessage("存档完成。");
      window.setTimeout(() => setManualSaveState(current => current === "saved" ? "idle" : current), 1400);
    } catch (error) {
      console.error("[changebattle-v2] manual save failed", error);
      setManualSaveState("error");
      setMessage(error instanceof Error ? `存档失败：${error.message}` : "存档失败。");
    }
  }

  async function unlockPlayerVaultStoragePage(tab: "bag" | "pokemon") {
    if (!profile) throw new Error("还没有训练师资料。");
    const cost = 24;
    if ((profile.battlePoints || 0) < cost) {
      throw new Error(`BP 不足，需要 ${cost} BP。`);
    }
    const normalizedVault = api.normalizePlayerVault(playerVault);
    const nextVault = api.normalizePlayerVault(tab === "bag"
      ? {...normalizedVault, itemStoragePageCount: normalizedVault.itemStoragePageCount + 1}
      : {...normalizedVault, pokemonStoragePageCount: normalizedVault.pokemonStoragePageCount + 1});
    const nextProfile = {
      ...profile,
      battlePoints: Math.max(0, Math.floor(Number(profile.battlePoints || 0)) - cost),
      updatedAt: new Date().toISOString(),
    };
    const savedVault = await api.savePlayerVault(nextVault);
    const savedProfile = await userProfileAdapter.saveUserProfile(nextProfile);
    setPlayerVault(savedVault);
    setPlayerVaultDirty(false);
    setProfile(savedProfile);
    setMessage(`已花费 ${cost} BP 解锁箱子。`);
    return savedVault;
  }

  async function continueTrainingRun() {
    const current = trainingRun || await api.loadTrainingRun();
    if (!current) {
      setMessage("没有可继续的训练存档。");
      return;
    }
    const saved = await api.saveTrainingRun(api.enterTrainingRest(current));
    setTrainingRun(saved);
    navigate("/training/rest-new", {replace: true});
  }

  async function continueFormalRun() {
    const current = formalRun || await api.loadFormalGameRun();
    if (!current) {
      setMessage("没有可继续的正式游戏存档。");
      return;
    }
    if (!isFormalRunContinuable(current)) {
      setMessage("正式游戏存档已结算，请开始新游戏。");
      return;
    }
    setFormalRun(current);
    navigate("/formal/room/continue", {replace: true});
  }

  function routeResumedFormalRun(current: FormalGameRunV4) {
    setFormalRun(current);
    if (current.restRunSnapshot) {
      if (current.restRunSnapshot.status === "battling" || hasRunningFormalBattleNode(current)) {
        const cachedSessionId = safeSessionStorageGet(formalBattleSessionStorageKey);
        if (cachedSessionId) setFormalBattleRecoveredSceneSessionId(cachedSessionId);
        navigate("/formal/battle", {replace: true});
        return;
      }
      if (current.restRunSnapshot.status === "battlePreparing") {
        navigate("/formal/battle-transition", {replace: true});
        return;
      }
      if (isFormalPendingSettlementRestRun(current.restRunSnapshot)) {
        navigate("/formal/rest", {replace: true});
        return;
      }
      if (hasUnsettledFormalWonRound(current)) {
        navigate("/formal/battle-result-transition", {replace: true});
        return;
      }
      if (current.restRunSnapshot.result?.outcome === "loss" || current.restRunSnapshot.status === "ended" || isFormalRestRunComplete(current.restRunSnapshot)) {
        enterFormalSettlement(current.restRunSnapshot.result?.outcome === "loss" ? "loss" : "complete");
        return;
      }
      navigate("/formal/rest", {replace: true});
      return;
    }
    if (current.playerTeam) {
      navigate("/formal/round-transition", {replace: true});
      return;
    }
    if (current.starterCandidates.length) {
      navigate("/formal/starter-select", {replace: true});
      return;
    }
    navigate(`/formal/transition/${current.mode}`, {replace: true});
  }

  function enterClosedFormalRoomSettlement(run: FormalGameRunV4) {
    deactivateFormalRoomConnection();
    clearFormalRoomCredential();
    setBattleSessionId("");
    setFormalBattleRecoveredSceneSessionId("");
    try {
      window.sessionStorage?.removeItem(formalBattleSessionStorageKey);
    } catch {
      // Best-effort cleanup only.
    }
    setFormalRun(run);
    setMessage("房间已关闭，对局判定非正常结束。");
    navigate("/formal/settlement-transition?reason=loss", {replace: true});
  }

  async function continueSavedRunGame() {
    if (isFormalRunContinuable(formalRun)) {
      await continueFormalRun();
      return;
    }
    await continueTrainingRun();
  }

  async function startTrainingRun(run: TrainingRunGameV4) {
    const saved = await api.saveTrainingRun(api.createTrainingRunFromScenario(run));
    setTrainingRun(saved);
    navigate("/training/run-transition", {replace: true});
  }

  async function startTrainingRunNew(run: TrainingRunGameV4) {
    const saved = await api.saveTrainingRun(api.createTrainingRunFromScenario(run));
    setTrainingRun(saved);
    navigate("/training/rest-new", {replace: true});
  }

  async function enterTrainingRest() {
    const current = trainingRun || await api.loadTrainingRun();
    if (!current) {
      await createTrainingRunAndOpenConfig();
      return;
    }
    const saved = await api.saveTrainingRun(api.enterTrainingRest(current));
    setTrainingRun(saved);
    navigate("/training/rest", {replace: true});
  }

  function startBattleFromRest() {
    navigate("/training/battle-transition", {replace: true});
  }

  function startFormalBattleFromRest() {
    navigate("/formal/battle-transition", {replace: true});
  }

  function enterBattle(sessionId: string) {
    setBattleSessionId(sessionId);
    window.sessionStorage?.setItem(`changebattle-v2:${runtime}:battle-session`, sessionId);
    navigate("/training/battle", {replace: true});
  }

  function enterFormalBattle(sessionId: string) {
    setBattleSessionId(sessionId);
    setFormalBattleRecoveredSceneSessionId("");
    safeSessionStorageSet(formalBattleSessionStorageKey, sessionId);
    navigate("/formal/battle", {replace: true});
  }

  function enterFormalSettlement(reason: FormalSettlementReasonV4) {
    setBattleSessionId("");
    setFormalBattleRecoveredSceneSessionId("");
    try {
      window.sessionStorage?.removeItem(formalBattleSessionStorageKey);
    } catch {
      // Best-effort cleanup only.
    }
    navigate(`/formal/settlement-transition?reason=${reason}`, {replace: true});
  }

  function activateFormalRoomConnection() {
    setFormalRoomConnectionEnabled(true);
    setFormalRoomCredentialVersion(current => current + 1);
  }

  function deactivateFormalRoomConnection() {
    formalRoomSyncClientRef.current?.dispose();
    formalRoomSyncClientRef.current = null;
    setFormalRoomConnectionEnabled(false);
    setServerConnectionState(null);
    setFormalRoomClientCache(EMPTY_FORMAL_ROOM_CLIENT_CACHE_V5);
  }

  async function chooseMedicalInsurance(choice: FormalMedicalInsuranceChoiceV4) {
    if (medicalInsuranceBusy) return;
    if (!formalRun && !formalRoomCredential) return;
    setMedicalInsuranceBusy(true);
    setMedicalInsuranceError(null);
    setFormalRestBusyMessage(formalServerBusyMessageForLabel(choice === "decline" ? "医疗保险" : "购买保险"));
    try {
      if (formalRoomCredential) {
        const submitted = await submitFormalRestAction({type: "insurance.buy", choice});
        const resultPayload = submitted.result as any;
        if (resultPayload?.ok === false) {
          setMedicalInsuranceError(resultPayload.message || submitted.message);
        }
        return;
      }
      if (!formalRun) return;
      const result = formalGameBridge
        ? await formalGameBridge.chooseFormalMedicalInsurance(formalRun, choice)
        : api.chooseFormalMedicalInsurance(formalRun, choice);
      if (!result.ok) {
        setMedicalInsuranceError(result.message);
        return;
      }
      const saved = await api.saveFormalGameRun(result.run);
      setFormalRun(saved);
    } catch (caught) {
      setMedicalInsuranceError(caught instanceof Error ? caught.message : "医疗保险处理失败。");
    } finally {
      setMedicalInsuranceBusy(false);
      setFormalRestBusyMessage(null);
    }
  }

  async function withFormalRestServerBusy<T>(message: string, task: () => Promise<T>): Promise<T> {
    setFormalRestBusyMessage(message);
    try {
      return await task();
    } finally {
      setFormalRestBusyMessage(null);
    }
  }

  function applyFormalRunView(nextRun: FormalGameRunV4): FormalGameRunV4 {
    confirmedFormalRunRef.current = nextRun;
    setFormalRun(nextRun);
    return nextRun;
  }

  function applyFormalRoomScopedView(scope: ViewScopeNameV5, nextView: RunGameScopedViewV5 | null | undefined, meta?: {revision?: number; phase?: string | null}): RunGameScopedViewV5 | null {
    const normalized = nextView || null;
    setFormalRoomClientCache(current => ({
      ...current,
      revision: Number(meta?.revision ?? normalized?.revision ?? current.revision ?? 0),
      phase: meta?.phase ?? normalized?.phase ?? current.phase ?? null,
      views: normalized ? {...current.views, [scope]: normalized as any} : current.views,
      stale: {...current.stale, [scope]: undefined},
      pendingCommand: null,
    }));
    return normalized;
  }

  function applyFormalRoomCommandView(response: {scope: ViewScopeNameV5; view: RunGameScopedViewV5 | null; revision: number; phase: string}): RunGameScopedViewV5 | null {
    return applyFormalRoomScopedView(response.scope, response.view, {revision: response.revision, phase: response.phase});
  }

  async function persistFormalRunLocal(nextRun: FormalGameRunV4): Promise<FormalGameRunV4> {
    if (formalRoomCredential) return applyFormalRunView(nextRun);
    const saved = await api.saveFormalGameRun(nextRun);
    confirmedFormalRunRef.current = saved;
    setFormalRun(saved);
    return saved;
  }

  async function persistServerConfirmedFormalRun(nextRun: FormalGameRunV4): Promise<FormalGameRunV4> {
    if (formalRoomCredential) return applyFormalRunView(nextRun);
    try {
      return await persistFormalRunLocal(nextRun);
    } catch (error) {
      applyFormalRunView(nextRun);
      const message = error instanceof Error ? error.message : "本地缓存写入失败。";
      setFormalRestInitialNotice(`服务器已同步，但本地缓存写入失败：${message}`);
      return nextRun;
    }
  }

  async function syncFormalRunDraft(nextRun: FormalGameRunV4, label: string): Promise<FormalGameRunV4> {
    if (!formalRoomCredential) {
      setFormalRun(nextRun);
      return nextRun;
    }
    const previousConfirmed = confirmedFormalRunRef.current || formalRun || nextRun;
    setFormalRun(nextRun);
    setFormalRun(previousConfirmed);
    const error = new Error("新房间主线不支持整局草稿同步。");
    setFormalRestInitialNotice(`网络异常，${label}未成功：${error.message}`);
    throw error;
  }

  async function syncFormalRestSnapshot(restRunSnapshot: TrainingRunGameV4, label: string): Promise<void> {
    if (!formalRun) return;
    const nextRun = {...formalRun, restRunSnapshot, updatedAt: new Date().toISOString()};
    if (!formalRoomCredential) {
      setFormalRun(nextRun);
      return;
    }
    await syncFormalRunDraft(nextRun, label);
  }

  async function submitFormalTeamReorder(pokemonIds: string[]): Promise<void> {
    if (!formalRoomCredential?.matchId) {
      if (!formalRun) throw new Error("正式存档不存在。");
      if (!formalRun.restRunSnapshot) throw new Error("当前不是休整阶段。");
      const currentTeam = formalRun.restRunSnapshot?.players.p1?.localTeam || formalRun.playerTeam;
      if (!currentTeam) throw new Error("当前队伍不存在。");
      const ordered = pokemonIds
        .map(id => currentTeam.pokemon.find(pokemon => pokemon.localPokemonId === id) || null)
        .filter((pokemon): pokemon is typeof currentTeam.pokemon[number] => Boolean(pokemon));
      const missing = currentTeam.pokemon.filter(pokemon => !pokemonIds.includes(pokemon.localPokemonId));
      await syncFormalRestSnapshot({
        ...formalRun.restRunSnapshot!,
        players: {
          ...formalRun.restRunSnapshot!.players,
          p1: {
            ...formalRun.restRunSnapshot!.players.p1!,
            localTeam: {...currentTeam, pokemon: ordered.concat(missing)},
          },
        },
      }, "调整顺序");
      return;
    }
    if (!formalRoomRestView) throw new Error("房间视图尚未同步。");
    const actionKey = formalTeamReorderStorageKey(formalRoomCredential.roomId, formalRoomCredential.matchId, formalRoomRestView.revision, pokemonIds);
    const commandId = loadOrCreateFormalRestActionClientId(actionKey, "team.reorder");
    const response = await api.submitFormalRoomMatchCommand({
      roomId: formalRoomCredential.roomId,
      roomToken: formalRoomCredential.roomToken,
      matchId: formalRoomCredential.matchId,
      actionName: "rooms.matches.commands.teamReorder",
      commandId,
      payload: {pokemonIds},
    });
    if (!response.ok) throw new Error(response.message);
    applyFormalRoomCommandView(response.data);
    clearFormalRestActionClientId(actionKey);
  }

  async function submitFormalRestAction(action: FormalRoomRestActionV1) {
    if (!formalRoomCredential) throw new Error("正式房间凭证不存在。");
    if (!formalRoomRestView) throw new Error("房间视图尚未同步。");
    const actionKey = formalRestActionStorageKey(formalRoomCredential.roomId, formalRoomCredential.matchId || formalRoomRestView.matchId, formalRoomRestView.revision, action);
    const clientActionId = loadOrCreateFormalRestActionClientId(actionKey, action.type);
    const label = formalRestActionLabel(action);
    const result = await withFormalRestServerBusy(formalServerBusyMessageForLabel(label), async () => {
      if (formalRoomCredential.matchId) {
        const response = await api.submitFormalRoomMatchCommand({
          roomId: formalRoomCredential.roomId,
          roomToken: formalRoomCredential.roomToken,
          matchId: formalRoomCredential.matchId,
          actionName: formalRestCommandActionName(action),
          commandId: clientActionId,
          payload: formalRestCommandPayload(action),
        });
        if (!response.ok) {
          return {
            ok: false as const,
            error: response.error,
            message: response.message,
            retryable: response.retryable,
            backend: response.backend,
            statusCode: response.statusCode,
            elapsedMs: response.elapsedMs,
          };
        }
        const payload = response.data.result as any;
        applyFormalRoomCommandView(response.data);
        return {
          ok: true as const,
          data: {
            room: response.data.room,
            scope: response.data.scope,
            view: response.data.view,
            revision: response.data.revision,
            phase: response.data.phase,
            actionType: action.type,
            message: response.data.message || payload?.message || "操作完成。",
            moneyDelta: 0,
            result: payload || {ok: true, message: response.data.message || "操作完成。"},
            reused: Boolean(response.data.reused),
          },
          statusCode: response.statusCode,
          elapsedMs: response.elapsedMs,
        };
      }
      throw new Error("当前房间缺少对局 ID，不能提交休整命令。");
    });
    if (!result.ok) {
      if (!result.retryable) clearFormalRestActionClientId(actionKey);
      throw new Error(result.message);
    }
    clearFormalRestActionClientId(actionKey);
    return result.data;
  }

  function openDex(initialPokemonId: string | null = null) {
    setDexInitialPokemonId(initialPokemonId);
    setDexInitialCategory(undefined);
    setDexInitialQuery(null);
    setDexInitialRow(null);
    setDexOpen(true);
  }

  function pokemonFromRestViewV5(view: RunGameScopedViewV5 | null | undefined, pokemonId: string): LocalPokemonV4 | undefined {
    if (!view || !pokemonId || !("team" in view) || !Array.isArray(view.team)) return undefined;
    return (view as RunGameRestViewV5).team.find(entry => entry.localPokemon.localPokemonId === pokemonId || entry.pokemonId === pokemonId)?.localPokemon;
  }

  function pokemonFromRestDisplayModel(model: FormalRestDisplayModel, pokemonId: string): LocalPokemonV4 | undefined {
    if (!pokemonId) return undefined;
    return model.player?.localTeam.pokemon.find(pokemon => pokemon.localPokemonId === pokemonId);
  }

  function openDexCard(seed: {category: Extract<DexCategory, "pokemon" | "moves" | "abilities" | "items">; query: string; entry: DexSearchRow}) {
    setDexInitialPokemonId(null);
    setDexInitialCategory(seed.category);
    setDexInitialQuery(seed.query);
    setDexInitialRow(seed.entry);
    setDexOpen(true);
  }

  async function checkDesktopUpdatesFromVersionBadge() {
    if (!desktopAppBridge || desktopUpdateChecking) return;
    const currentVersion = String(import.meta.env.VITE_CHANGEBATTLE_DESKTOP_VERSION || "").trim() || "unknown";
    setDesktopUpdateChecking(true);
    setDesktopManualUpdateCheckActive(true);
    setDesktopUpdateStatus({
      phase: "checking",
      currentVersion,
      officialSiteUrl: desktopUpdateStatus?.officialSiteUrl || "",
    });
    setDesktopUpdateModalDismissed(false);
    try {
      const status = await desktopAppBridge.checkForUpdates();
      setDesktopUpdateStatus(status);
      setDesktopUpdateModalDismissed(false);
      if (status.phase !== "up-to-date") setDesktopManualUpdateCheckActive(false);
    } catch (error) {
      console.error("[changebattle-v2] manual desktop update check failed", error);
      setDesktopManualUpdateCheckActive(false);
    } finally {
      setDesktopUpdateChecking(false);
    }
  }

  const titlePage = (
    <TitlePage
      profile={profile}
      catalog={catalog.trainers}
      loading={loading}
      message={message}
      onLoad={() => navigate(profile ? "/main" : "/", {replace: true})}
      onCreate={startCreate}
      onDelete={deleteProfile}
      onOpenOfficialSite={desktopAppBridge ? () => desktopAppBridge.openOfficialSite() : undefined}
      onNetworkSettings={openNetworkSettings}
      preferStaticBackground={false}
    />
  );

  const missingProfileFormalPage = loading ? <FormalRouteLoadingPage /> : <Navigate to="/" replace />;
  async function saveBattleServerSettings(nextConfig: BattleServerConfigV4): Promise<BattleServerConfigV4> {
    const previousConfig = battleServerConfigWithDefault(battleServerConfig, runtime);
    const previousUrl = battleServerBaseUrl(previousConfig, currentEnvBattleServiceUrl(runtime));
    const saved = await saveBattleServerRuntimeConfig(nextConfig, desktopAppBridge);
    const nextUrl = battleServerBaseUrl(saved, currentEnvBattleServiceUrl(runtime));
    if (previousConfig.mode !== saved.mode || previousUrl !== nextUrl) {
      deactivateFormalRoomConnection();
      clearFormalRoomCredential();
      setFormalRoomCredentialVersion(version => version + 1);
      setFormalRun(null);
      setLobbyRoom(null);
      setLobbyRoomToken("");
      setLobbyError(null);
    }
    setBattleServerConfig(saved);
    if (runtime === "desktop" && desktopAppBridge?.getBattleServiceConfig) {
      desktopAppBridge.getBattleServiceConfig()
        .then(config => setDesktopBattleServiceConfig(config))
        .catch(() => setDesktopBattleServiceConfig({backend: "server", url: DEFAULT_PUBLIC_BATTLE_SERVICE_URL}));
    }
    setBattleServerConfigLoaded(true);
    return saved;
  }

  async function clearAssetCacheSettings(): Promise<BattleServerConfigV4> {
    const saved = await clearAssetRuntimeCache(battleServerConfigWithDefault(battleServerConfig, runtime), desktopAppBridge);
    setBattleServerConfig(saved);
    setBattleServerConfigLoaded(true);
    return saved;
  }

  function openNetworkSettings() {
    setNetworkSettingsOpen(true);
    setBattleServerConfigLoaded(false);
    loadBattleServerRuntimeConfig(desktopAppBridge)
      .then(config => setBattleServerConfig(config))
      .catch(() => setBattleServerConfig(null))
      .finally(() => setBattleServerConfigLoaded(true));
  }

  const networkSettingsModal = networkSettingsOpen ? (
    <NetworkOfflineSettingsModal
      runtime={runtime}
      config={battleServerConfigWithDefault(battleServerConfig, runtime)}
      configLoading={!battleServerConfigLoaded}
      onClose={() => setNetworkSettingsOpen(false)}
      onSave={saveBattleServerSettings}
      onTestServer={url => testBattleServerRuntimeUrl(url, desktopAppBridge)}
      onClearAssetCache={clearAssetCacheSettings}
    />
  ) : null;

  const mainPage = profile ? (
    <>
      <MainMenuPage
        api={api}
        profile={profile}
        catalog={catalog.trainers}
        trainingRun={trainingRun}
        preferStaticBackground={false}
        onOpenDex={() => openDex()}
        onOpenDexCard={openDexCard}
        onTraining={() => void createTrainingRunAndOpenConfig()}
        onCreateRoom={() => void createFormalLobbyRoom()}
        onStarChart={() => navigate("/star-chart")}
        onTrainerVault={() => navigate("/trainer-vault")}
        onManualSave={() => void saveAllCurrentState()}
        profileWarning={profileAssetWarning}
        manualSaveState={manualSaveState}
        debugFeatureEnabled={DEBUG_FEATURE_ENABLED}
        onEnableTestMode={() => void enableTestMode()}
        onUserInfo={startEdit}
        onNetworkSettings={openNetworkSettings}
        onTitle={() => navigate("/", {replace: true})}
      />
    </>
  ) : <Navigate to="/" replace />;

  const settingsPage = (
    <PlayerSettingsPage
      title={editingProfile ? "玩家设置" : "新建资料"}
      profile={editingProfile}
      catalog={catalog.trainers}
      onBack={() => navigate(profile ? "/main" : "/", {replace: true})}
      onSave={createOrUpdateProfile}
      saveLabel="保存资料"
    />
  );

  const componentGalleryPage = (
    <ComponentGalleryPage
      api={api}
      onBack={() => navigate(profile ? "/main" : "/", {replace: true})}
    />
  );

  const battlePreferencePage = profile ? (
    <BattlePreferencePage
      api={api}
      profile={profile}
      debugFeatureEnabled={DEBUG_FEATURE_ENABLED}
      onProfileChange={setProfile}
      onBack={() => navigate("/main", {replace: true})}
    />
  ) : <Navigate to="/" replace />;

  const starChartPage = profile ? (
    <TalentConfigPage
      api={api}
      profile={profile}
      onSaveAndBack={async nextProfile => {
        const savedProfile = await userProfileAdapter.saveUserProfile(nextProfile);
        setProfile(savedProfile);
        setMessage("星图已保存。");
        navigate("/main", {replace: true});
      }}
      onBack={() => navigate("/main", {replace: true})}
    />
  ) : <Navigate to="/" replace />;

  const trainerVaultPage = profile ? (
    <TrainerVaultPage
      api={api}
      playerVault={playerVault}
      playerVaultDirty={playerVaultDirty}
      profileBattlePoints={profile.battlePoints}
      debugFeatureEnabled={DEBUG_FEATURE_ENABLED}
      onPlayerVaultChange={setPlayerVault}
      onPlayerVaultDirtyChange={setPlayerVaultDirty}
      onSavePlayerVault={api.savePlayerVault}
      onUnlockStoragePage={unlockPlayerVaultStoragePage}
      onBack={() => navigate("/main", {replace: true})}
    />
  ) : <Navigate to="/" replace />;

  const trainingConfigPage = profile ? (
    trainingRun ? (
      <TrainingConfigPage
        api={api}
        run={trainingRun}
        onRunChange={setTrainingRun}
        onStartRun={startTrainingRun}
        onStartRunNew={startTrainingRunNew}
        onBack={() => navigate("/main", {replace: true})}
      />
    ) : (
      <TrainingConfigBootstrap onReady={() => void createTrainingRunAndOpenConfig()} />
    )
  ) : <Navigate to="/" replace />;

  const trainingRunTransitionPage = profile ? (
    <TrainingRunTransitionPage
      title="进入休息室"
      detail="正在整理训练流程"
      tip="休息室会承接队伍、背包和下一场节点，BattleGame 稍后接入。"
      onReady={() => void enterTrainingRest()}
    />
  ) : <Navigate to="/" replace />;

  const trainingRestPage = profile ? (
    trainingRun ? (
      <TrainingRestPage
        api={api}
        run={trainingRun}
        onRunChange={setTrainingRun}
        onBackToConfig={() => navigate("/training/config", {replace: true})}
        onStartBattle={startBattleFromRest}
      />
    ) : (
      <TrainingRunTransitionPage onReady={() => void enterTrainingRest()} />
    )
  ) : <Navigate to="/" replace />;

  const trainingRestNewPage = profile ? (
    trainingRun ? (
      <TrainingRestNewPage
        api={api}
        run={trainingRun}
        onRunChange={setTrainingRun}
        onBackToConfig={() => navigate("/training/config", {replace: true})}
        onStartBattle={startBattleFromRest}
        onOpenDex={() => openDex()}
        onOpenPokemonDex={(speciesId: string) => openDex(speciesId)}
      />
    ) : (
      <TrainingRunTransitionPage onReady={() => void enterTrainingRest()} />
    )
  ) : <Navigate to="/" replace />;

  const trainingBattleTransitionPage = profile ? (
    trainingRun ? (
      <TrainingBattleTransitionPage
        api={api}
        run={trainingRun}
        onRunChange={setTrainingRun}
        onReady={enterBattle}
        onBackToRest={() => navigate("/training/rest", {replace: true})}
      />
    ) : (
      <TrainingRunTransitionPage onReady={() => void enterTrainingRest()} />
    )
  ) : <Navigate to="/" replace />;

  const trainingBattlePage = profile ? (
    trainingRun ? (
      <BattleV4Page
        api={api}
        run={trainingRun}
        sessionId={battleSessionId || window.sessionStorage?.getItem(`changebattle-v2:${runtime}:battle-session`) || ""}
        debugConfig={APP_DEBUG_CONFIG_V4}
        playerProfile={profile}
        endFlow="auto-exit"
        onRunChange={setTrainingRun}
        onBackToRest={() => navigate("/training/battle-result-transition", {replace: true})}
        onBattleComplete={result => {
          if (result.sessionId) setBattleSessionId(result.sessionId);
          navigate("/training/battle-result-transition", {replace: true});
        }}
      />
    ) : (
      <TrainingRunTransitionPage onReady={() => void enterTrainingRest()} />
    )
  ) : <Navigate to="/" replace />;

  const trainingBattleResultTransitionPage = profile ? (
    trainingRun ? (
      <TrainingBattleResultTransitionPage
        api={api}
        run={trainingRun}
        sessionId={battleSessionId || window.sessionStorage?.getItem(`changebattle-v2:${runtime}:battle-session`) || ""}
        onRestReady={run => {
          setTrainingRun(run);
          navigate("/training/rest-new", {replace: true});
        }}
      />
    ) : (
      <TrainingRunTransitionPage onReady={() => void enterTrainingRest()} />
    )
  ) : <Navigate to="/" replace />;

  const formalMode = parseFormalMode(location.pathname.split("/").pop());
  const formalRoomGate = parseFormalRoomGatePath(location.pathname);
  const formalLobbyPage = profile ? (
    lobbyRoom && lobbyRoomToken ? (
      <RoomLobbyPage
        api={api}
        profile={profile}
        room={lobbyRoom}
        roomToken={lobbyRoomToken}
        busyMessage={lobbyBusyMessage}
        error={lobbyError}
        onCreateMatch={createFormalLobbyMatch}
        onReadyChange={setFormalLobbyMatchReady}
        onStartMatch={startFormalLobbyMatch}
        onLeave={() => void leaveFormalLobbyRoom()}
      />
    ) : (
      <section className="formal-room-page" style={{padding: 32, minHeight: "100%", color: "#f8f4df", background: "#101716"}}>
        <h2 style={{margin: "0 0 12px"}}>正在进入房间</h2>
        <p style={{margin: "0 0 20px", color: "#c9d8cb"}}>{lobbyError ? `房间创建失败：${lobbyError}` : lobbyBusyMessage || "正在连接服务器..."}</p>
        <button type="button" onClick={() => navigate("/main", {replace: true})}>返回</button>
      </section>
    )
  ) : missingProfileFormalPage;
  const formalRoomPage = profile ? (
    formalRoomGate ? (
      <Navigate to="/formal/room/create" replace />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : missingProfileFormalPage;
  const formalTransitionPage = formalTransitionProfile ? (
    <Navigate to={`/formal/room/start/${formalMode}`} replace />
  ) : missingProfileFormalPage;

  const formalResumeTransitionPage = profile ? (
    formalRun ? (
      <FormalResumeTransitionPage
        api={api}
        run={formalRun}
        formalRoomCredential={formalRoomCredential}
        onRunSynced={setFormalRun}
        onResumeReady={routeResumedFormalRun}
        onClosedConfirm={enterClosedFormalRoomSettlement}
      />
    ) : !formalRunLoaded ? (
      <FormalRouteLoadingPage />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : missingProfileFormalPage;

  const formalStarterSelectPage = profile ? (
    (formalRoomCredential?.matchId && formalRoomStarterView?.phase === "starter") || (formalRun && formalRun.starterCandidates.length) ? (
      <FormalStarterSelectPage
        api={api}
        run={formalRun}
        roomStarterView={formalRoomCredential ? formalRoomStarterView : null}
        onRunChange={setFormalRun}
        onRoomScopedViewChange={applyFormalRoomScopedView}
        onDone={() => navigate("/formal/round-transition", {replace: true})}
        backLabel={formalRoomCredential?.matchId ? "返回房间" : "返回主页"}
        onBack={() => navigate(formalRoomCredential?.matchId ? "/formal/room/create" : "/main", {replace: true})}
      />
    ) : !formalRunLoaded ? (
      <FormalRouteLoadingPage />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : missingProfileFormalPage;

  const formalPendingPage = profile ? (
    formalRun ? (
      <FormalGamePendingPage run={formalRun} onBack={() => navigate("/main", {replace: true})} />
    ) : !formalRunLoaded ? (
      <FormalRouteLoadingPage />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : missingProfileFormalPage;

  const formalRoundTransitionPage = profile ? (
    (formalRoomCredential?.matchId && formalRoomStarterView?.phase === "starter") || formalRun?.playerTeam ? (
      <FormalRoundTransitionPage
        api={api}
        formalGameBridge={formalGameBridge}
        run={formalRun}
        roomStarterView={formalRoomCredential ? formalRoomStarterView : null}
        playerVault={playerVault}
        onSavePlayerVault={api.savePlayerVault}
        onRoomScopedViewReady={applyFormalRoomScopedView}
        onRoomReady={() => {
          navigate("/formal/rest", {replace: true});
        }}
        onRunReady={(run, nextPlayerVault) => {
          applyFormalRunView(run);
          setPlayerVault(nextPlayerVault);
          setPlayerVaultDirty(false);
          navigate("/formal/rest", {replace: true});
        }}
      />
    ) : !formalRunLoaded ? (
      <FormalRouteLoadingPage />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : missingProfileFormalPage;

  const medicalInsuranceOffer = formalRun?.restRunSnapshot ? api.getFormalMedicalInsuranceOffer(formalRun) : null;
  const shouldShowMedicalInsurance = Boolean(
    !formalRoomCredential
      && formalRun?.restRunSnapshot
      && formalRun.currentRoundIndex === 0
      && medicalInsuranceOffer?.available
      && !medicalInsuranceOffer.seen
      && !medicalInsuranceOffer.purchased
  );
  const roomRestDisplayModel = formalRoomCredential && formalRoomRestView
    ? trainingRestDisplayFromRestViewV5({view: formalRoomRestView, seenRoundSettlementNodeIds})
    : null;
  const legacyFormalRestDisplayModel = !formalRoomCredential && formalRun?.restRunSnapshot ? trainingRestDisplayFromTrainingRunV4({
      api,
      run: formalRun.restRunSnapshot,
      formalRun,
      roundSettlement: latestUnreadRoundSettlement(formalRun, seenRoundSettlementNodeIds),
      money: formalRun.money,
    }) : null;
  const formalRestDisplayModel: FormalRestDisplayModel | null = roomRestDisplayModel || legacyFormalRestDisplayModel;
  const formalRestPage = profile ? (
    formalRestDisplayModel && (formalRoomCredential || formalRun) ? (
      <div className="formal-rest-page-shell">
        <TrainingRestNewPage
          api={api}
          run={formalRestDisplayModel.legacyRun}
          displayModel={formalRestDisplayModel}
          onRunChange={restRunSnapshot => {
            if (formalRoomCredential) return;
            setFormalRun(current => current ? {...current, restRunSnapshot, updatedAt: new Date().toISOString()} : current);
          }}
          onSaveRunSnapshot={async restRunSnapshot => {
            if (!formalRun) return restRunSnapshot;
            if (formalRoomCredential) return restRunSnapshot;
            const saved = await api.saveFormalGameRun({...formalRun, restRunSnapshot, updatedAt: new Date().toISOString()});
            setFormalRun(saved);
            return saved.restRunSnapshot || restRunSnapshot;
          }}
          onTeamReorderSave={formalRoomCredential ? submitFormalTeamReorder : undefined}
          hideSaveAction={Boolean(formalRoomCredential)}
          serverBusyMessage={formalRestBusyMessage}
          onBackToConfig={() => formalRoomCredential ? navigate("/formal/room/create", {replace: true}) : navigate("/main", {replace: true})}
          onAbandonRun={async () => {
            enterFormalSettlement("abandon");
          }}
          onProceedToSettlement={async () => {
            enterFormalSettlement("complete");
          }}
          onStartBattle={async () => {
            startFormalBattleFromRest();
          }}
          onOpenDex={() => openDex()}
          onOpenPokemonDex={(speciesId: string) => openDex(speciesId)}
          moneyAmount={formalRestDisplayModel.money}
          roundSettlement={formalRestDisplayModel.roundSettlement}
          onRoundSettlementSeen={nodeId => setSeenRoundSettlementNodeIds(current => ({...current, [`${formalRoomRestView?.runId || formalRun?.id || "formal"}:${nodeId}`]: true}))}
          healController={{
            money: formalRestDisplayModel.money,
            cost: Math.max(1, Math.floor(250 * (formalRun ? api.formalMedicalInsuranceEffectsForRun(formalRun).recoveryShopPriceMultiplier : formalRoomRestView?.rest.medicalInsurance?.recoveryShopPriceMultiplier || 1))),
            serverCommitted: Boolean(formalRoomCredential),
            onHeal: async () => {
              if (formalRoomCredential) {
                const submitted = await submitFormalRestAction({type: "team.heal"});
                return {...(submitted.result as any), source: "room" as const, serverCommitted: true as const, ok: true, message: submitted.message, reused: submitted.reused};
              }
              if (!formalRun) throw new Error("正式存档不存在。");
              const result = formalGameBridge
                ? await formalGameBridge.healFormalRestTeam(formalRun)
                : api.healFormalRestTeam(formalRun);
              if (result.ok) setFormalRun(result.run);
              return result;
            },
          }}
          teamRerollController={{
            money: formalRestDisplayModel.money,
            locksEnabled: formalRun ? starChartHasSpecialTrainingLockV4(formalRun.starChartSnapshot) : false,
            serverCommitted: Boolean(formalRoomCredential),
            onRerollStats: async input => {
              if (formalRoomCredential) {
                const submitted = await submitFormalRestAction({type: "pokemon.reroll-stats", input: input as Record<string, unknown>});
                const payload = submitted.result as any;
                return {
                  ...payload,
                  source: "room" as const,
                  serverCommitted: true as const,
                  ok: true,
                  message: submitted.message,
                  reused: submitted.reused,
                  cost: Number(payload?.cost || 0),
                };
              }
              if (!formalRun) throw new Error("正式存档不存在。");
              const result = api.rerollFormalRestPokemonStats(formalRun, input);
              if (result.ok) setFormalRun(result.run);
              return result;
            },
          }}
          opponentPreviewController={{
            enabled: formalRun ? starChartHasOpponentRumorV4(formalRun.starChartSnapshot) : true,
            cost: 10,
            serverCommitted: Boolean(formalRoomCredential),
            onUnlock: async input => {
              if (formalRoomCredential) {
                const submitted = await submitFormalRestAction({type: "opponent-preview.unlock", input: input as Record<string, unknown>});
                const payload = submitted.result as any;
                return {
                  ...payload,
                  source: "room" as const,
                  serverCommitted: true as const,
                  ok: true,
                  message: submitted.message,
                  reused: submitted.reused,
                };
              }
              if (!formalRun) throw new Error("正式存档不存在。");
              const result = api.unlockFormalRestOpponentPreview(formalRun, input);
              if (result.ok) setFormalRun(result.run);
              return result;
            },
          }}
          exchangeController={{
            getView: () => formalRoomCredential ? formalRestDisplayModel.exchange : api.getFormalRestExchangeView(formalRun as any),
            serverCommitted: Boolean(formalRoomCredential),
            onExchange: async input => {
              if (formalRoomCredential) {
                const submitted = await submitFormalRestAction({
                  type: "pokemon.exchange",
                  sourcePokemonId: input.sourcePokemonId,
                  targetPokemonId: input.targetPokemonId,
                });
                const payload = submitted.result as any;
                return {
                  ...payload,
                  source: "room" as const,
                  serverCommitted: true as const,
                  ok: true,
                  message: submitted.message,
                  reused: submitted.reused,
                  cost: Number(payload?.cost || 0),
                  view: payload?.view || unavailableFormalExchangeView(formalRestDisplayModel),
                };
              }
              if (!formalRun) throw new Error("正式存档不存在。");
              const result = api.exchangeFormalRestPokemon(formalRun, input);
              if (result.ok) setFormalRun(result.run);
              return result;
            },
          }}
          bagActionController={formalRoomCredential ? {
            serverCommitted: true,
            onAction: async action => {
              const submitted = await submitFormalRestAction(action);
              return {source: "room" as const, serverCommitted: true as const, ok: true, message: submitted.message, reused: submitted.reused};
            },
          } : undefined}
          initialNotice={formalRestInitialNotice}
          onInitialNoticeConsumed={() => setFormalRestInitialNotice(null)}
          soulmateRewardEnabled={formalRun ? starChartHasSoulmateRewardV4(formalRun.starChartSnapshot) : false}
          onSoulmateEggPrepare={input => {
            if (!formalRun) throw new Error("正式存档不存在。");
            return api.prepareFormalSoulmateEggHatch(formalRun, input.candidateId);
          }}
          onSoulmateEggClaim={async input => {
            if (formalRoomCredential) {
              const submitted = await submitFormalRestAction({type: "soulmate-egg.claim", candidateId: input.candidateId, nickname: input.nickname, playerVaultSnapshot: playerVault});
              const payload = submitted.result as any;
              const nextVault = payload?.playerVault || playerVault;
              if (nextVault !== playerVault) {
                const savedVault = await api.savePlayerVault(nextVault);
                setPlayerVault(savedVault);
                setPlayerVaultDirty(false);
                return {...payload, source: "room" as const, serverCommitted: true as const, ok: true, playerVault: savedVault, message: submitted.message, reused: submitted.reused};
              }
              return {...payload, source: "room" as const, serverCommitted: true as const, ok: true, playerVault: nextVault, message: submitted.message, reused: submitted.reused};
            }
            if (!formalRun) throw new Error("正式存档不存在。");
            const result = api.claimFormalSoulmateEgg(formalRun, playerVault, input.candidateId, input.nickname);
            if (!result.ok) return result;
            const syncedRun = await api.saveFormalGameRun(result.run);
            const savedVault = await api.savePlayerVault(result.playerVault);
            setPlayerVault(savedVault);
            setPlayerVaultDirty(false);
            setFormalRun(syncedRun);
            return {...result, run: syncedRun, playerVault: savedVault};
          }}
          shopController={{
            getShop: () => formalRestDisplayModel.shop,
            player: formalRestDisplayModel.player,
            money: formalRestDisplayModel.money,
            onBuy: async slotId => {
              if (formalRoomCredential) {
                const submitted = await submitFormalRestAction({type: "shop.buy", slotId});
                return submitted.message;
              }
              if (!formalRun) return "正式存档不存在。";
              const result = api.buyFormalRestShopItem(formalRun, slotId);
              if (!result.ok) throw new Error(result.message);
              setFormalRun(result.run);
              return result.message;
            },
            onBuyCart: async slotIds => {
              if (formalRoomCredential) {
                const submitted = await submitFormalRestAction({type: "shop.buy-cart", slotIds});
                return submitted.message;
              }
              if (!formalRun) return "正式存档不存在。";
              let nextRun = formalRun;
              let message = "";
              for (const slotId of slotIds) {
                const result = api.buyFormalRestShopItem(nextRun, slotId);
                if (!result.ok) throw new Error(result.message);
                nextRun = result.run;
                message = result.message;
              }
              setFormalRun(nextRun);
              return slotIds.length > 1 ? `已购买 ${slotIds.length} 件商品。` : message;
            },
            onRefresh: formalRoomCredential ? async () => {
              const submitted = await submitFormalRestAction({type: "shop.refresh"});
              return submitted.message;
            } : undefined,
            onSell: async itemInstanceIds => {
              if (formalRoomCredential) {
                const submitted = await submitFormalRestAction({type: "shop.sell", itemInstanceIds});
                return submitted.message;
              }
              if (!formalRun) return "正式存档不存在。";
              const result = api.sellFormalRestBagItems(formalRun, itemInstanceIds);
              if (!result.ok) throw new Error(result.message);
              setFormalRun(result.run);
              return result.message;
            },
          }}
          trainingGroundController={{
            getLesson: () => formalRestDisplayModel.trainingGround.lesson,
            getLessons: () => formalRestDisplayModel.trainingGround.lessons,
            player: formalRestDisplayModel.player,
            money: formalRestDisplayModel.money,
            onApply: async input => {
              if (formalRoomCredential) {
                const submitted = await submitFormalRestAction({type: "training.apply", input: input as Record<string, unknown>});
                const payload = submitted.result as any;
                const pokemonId = String(payload?.pokemonId || input.pokemonId || "");
                const afterPokemon = pokemonFromRestViewV5(submitted.view, pokemonId);
                return {
                  ...payload,
                  source: "room" as const,
                  serverCommitted: true as const,
                  ok: true,
                  message: submitted.message,
                  reused: submitted.reused,
                  pokemonId,
                  beforePokemon: pokemonFromRestDisplayModel(formalRestDisplayModel, pokemonId),
                  afterPokemon,
                  lesson: payload?.lesson || formalRestDisplayModel.trainingGround.lesson,
                };
              }
              if (!formalRun) throw new Error("正式存档不存在。");
              const result = api.applyFormalTrainingGroundLesson(formalRun, input);
              if (!result.ok) throw new Error(result.message);
              setFormalRun(result.run);
              return result;
            },
            onAdvance: () => {
              if (!formalRun) return;
              if (formalRoomCredential) {
                setFormalRestInitialNotice("训练换课需要服务端命令，当前版本请完成一次学习后刷新课程。");
                return;
              }
              const nextRun = api.advanceFormalTrainingGroundLesson(formalRun);
              setFormalRun(nextRun);
            },
          }}
        />
        {shouldShowMedicalInsurance && medicalInsuranceOffer ? (
          <FormalMedicalInsuranceDialog
            offer={medicalInsuranceOffer}
            money={formalRun?.money || formalRestDisplayModel.money}
            busy={medicalInsuranceBusy}
            error={medicalInsuranceError}
            onChoose={chooseMedicalInsurance}
          />
        ) : null}
      </div>
    ) : formalRoomCredential || !formalRunLoaded ? (
      <FormalRouteLoadingPage />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : missingProfileFormalPage;

  const formalBattleRunSnapshot = formalRoomCredential
    ? null
    : formalRun?.restRunSnapshot || null;
  const formalBattleTransitionPage = profile ? (
    (formalRoomCredential ? formalRoomRestView : formalBattleRunSnapshot) ? (
      <FormalBattleTransitionPage
        api={api}
        formalGameBridge={formalGameBridge}
        run={formalRun}
        roomRestView={formalRoomCredential ? formalRoomRestView : null}
        onRunChange={setFormalRun}
        onRoomScopedViewChange={applyFormalRoomScopedView}
        onReady={enterFormalBattle}
        onBackToRest={() => navigate("/formal/rest", {replace: true})}
      />
    ) : !formalRunLoaded ? (
      <FormalRouteLoadingPage />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : missingProfileFormalPage;

  const formalBattleSessionId = battleSessionId || safeSessionStorageGet(formalBattleSessionStorageKey);
  const formalBattlePage = profile ? (
    (formalRoomCredential ? formalRoomBattleView : formalBattleRunSnapshot) ? formalRoomCredential && !formalBattleSessionId && formalBattleSessionRestoring ? (
      <FormalRouteLoadingPage />
    ) : (
      <BattleV4Page
        api={api}
        run={formalRoomCredential ? undefined : formalBattleRunSnapshot || undefined}
        roomBattleView={formalRoomCredential ? formalRoomBattleView || undefined : undefined}
        sessionId={formalBattleSessionId}
        debugConfig={APP_DEBUG_CONFIG_V4}
        diagnosticsContext={{formalRun, playerVault}}
        battleServiceOverride={formalRoomBattleService}
        playerProfile={profile}
        endFlow="auto-exit"
        recoveringExistingScene={Boolean(formalBattleSessionId && formalBattleRecoveredSceneSessionId === formalBattleSessionId)}
        onRunChange={restRunSnapshot => setFormalRun(current => current ? {...current, restRunSnapshot, updatedAt: new Date().toISOString()} : current)}
        onAfterSubmitSnapshot={async snapshot => {
          if (formalRoomCredential) return snapshot;
          if (!formalRun || !formalBattleSessionId) return snapshot;
          const result = await api.tryApplyFormalSoulmateBattleEvolution({
            run: formalRun,
            playerVault,
            sessionId: formalBattleSessionId,
            snapshot,
            chanceOverride: DEBUG_FEATURE_ENABLED ? 1 : undefined,
            friendshipOverride: DEBUG_FEATURE_ENABLED ? 255 : undefined,
          });
          if (!result.evolved) return snapshot;
          const savedVault = await api.savePlayerVault(result.playerVault);
          const savedRun = await api.saveFormalGameRun(result.run);
          setPlayerVault(savedVault);
          setPlayerVaultDirty(false);
          setFormalRun(savedRun);
          return result.snapshot || snapshot;
        }}
        onBackToRest={() => {
          navigate("/formal/battle-result-transition", {replace: true});
        }}
        onBattleComplete={result => {
          if (result.sessionId) {
            setBattleSessionId(result.sessionId);
            setFormalBattleRecoveredSceneSessionId("");
            safeSessionStorageSet(formalBattleSessionStorageKey, result.sessionId);
          }
          const suffix = result.reason === "surrender" ? "?reason=surrender" : "";
          navigate(`/formal/battle-result-transition${suffix}`, {replace: true});
        }}
      />
    ) : !formalRunLoaded ? (
      <FormalRouteLoadingPage />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : missingProfileFormalPage;

  const formalBattleResultTransitionPage = profile ? (
    (formalRoomCredential ? formalRoomBattleView : formalBattleRunSnapshot) ? (
      <FormalBattleResultTransitionPage
        api={api}
        formalGameBridge={formalGameBattleResultBridge}
        run={formalRun}
        roomBattleView={formalRoomCredential ? formalRoomBattleView : null}
        playerVault={playerVault}
        sessionId={formalBattleSessionId}
        reason={parseFormalBattleResultReason(new URLSearchParams(location.search).get("reason"))}
        onSavePlayerVault={api.savePlayerVault}
        onPlayerVaultChange={nextPlayerVault => {
          setPlayerVault(nextPlayerVault);
          setPlayerVaultDirty(false);
        }}
        onSoulmateSettlementNotice={setFormalRestInitialNotice}
        onRoomScopedViewChange={applyFormalRoomScopedView}
        onRoomRestReady={() => {
          navigate("/formal/rest", {replace: true});
        }}
        onRoomSettlementReady={reason => {
          enterFormalSettlement(reason);
        }}
        onRestReady={run => {
          applyFormalRunView(run);
          navigate("/formal/rest", {replace: true});
        }}
        onSettlementReady={(run, reason) => {
          applyFormalRunView(run);
          enterFormalSettlement(reason);
        }}
      />
    ) : !formalRunLoaded ? (
      <FormalRouteLoadingPage />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : missingProfileFormalPage;

  const settlementReason = parseSettlementReason(new URLSearchParams(location.search).get("reason"));
  const formalSettlementTransitionPage = profile ? (
    formalRoomCredential || formalRun ? (
      <FormalSettlementTransitionPage
        api={api}
        formalGameBridge={formalGameBridge}
        run={formalRun}
        profile={profile}
        playerVault={playerVault}
        reason={settlementReason}
        formalRoomCredential={formalRoomCredential}
        onSaveProfile={userProfileAdapter.saveUserProfile}
        onSavePlayerVault={api.savePlayerVault}
        onRoomScopedViewChange={applyFormalRoomScopedView}
        onRoomSettled={(nextProfile, nextPlayerVault) => {
          setBattleSessionId("");
          setFormalBattleRecoveredSceneSessionId("");
          try {
            window.sessionStorage?.removeItem(formalBattleSessionStorageKey);
          } catch {
            // Best-effort cleanup only.
          }
          setProfile(nextProfile);
          setPlayerVault(nextPlayerVault);
          setPlayerVaultDirty(false);
          navigate("/formal/settlement", {replace: true});
        }}
        onSettled={(run, nextProfile, nextPlayerVault) => {
          setBattleSessionId("");
          setFormalBattleRecoveredSceneSessionId("");
          try {
            window.sessionStorage?.removeItem(formalBattleSessionStorageKey);
          } catch {
            // Best-effort cleanup only.
          }
          setFormalRun(run);
          setProfile(nextProfile);
          setPlayerVault(nextPlayerVault);
          setPlayerVaultDirty(false);
          navigate("/formal/settlement", {replace: true});
        }}
      />
    ) : !formalRunLoaded || formalRoomCredential ? (
      <FormalRouteLoadingPage />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : missingProfileFormalPage;

  const formalSettlementPage = profile ? (
    formalRun?.settlement || formalRoomSettlementView?.settlement ? (
      <FormalSettlementPage
        run={formalRun}
        settlement={formalRoomSettlementView?.settlement || null}
        profile={profile}
        backLabel={formalRoomCredential?.matchId ? "返回房间" : "返回主页"}
        onBackToMain={() => {
          if (formalRoomCredential?.matchId) {
            void returnToFormalLobbyAfterSettlement(formalRoomCredential);
            return;
          }
          navigate("/main", {replace: true});
        }}
      />
    ) : !formalRunLoaded || formalRoomCredential ? (
      <FormalRouteLoadingPage />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : missingProfileFormalPage;

  const bgmScene = bgmSceneForRoute(location.pathname, formalRun, formalRoomRestView, formalRoomBattleView);
  const bgmControlVisible = (location.pathname === "/" || location.pathname === "/main") && !networkSettingsOpen;
  const versionBadgeLabel = desktopVersionBadgeLabel();

  if (desktopStartupRouteResetting) {
    return (
      <GameViewport
        showVersion
        versionLabel={versionBadgeLabel}
        versionChecking={desktopUpdateChecking}
        onVersionClick={desktopUpdatesEnabled ? checkDesktopUpdatesFromVersionBadge : undefined}
      >
        <FormalRouteLoadingPage />
      </GameViewport>
    );
  }

  return (
    <GameViewport
      showVersion={location.pathname === "/"}
      versionLabel={versionBadgeLabel}
      versionChecking={desktopUpdateChecking}
      onVersionClick={desktopUpdatesEnabled ? checkDesktopUpdatesFromVersionBadge : undefined}
    >
      <BgmController scene={bgmScene} controlVisible={bgmControlVisible} />
      <Routes>
        <Route path="/" element={titlePage} />
        <Route path="/main" element={mainPage} />
        <Route path="/components" element={componentGalleryPage} />
        <Route path="/user" element={settingsPage} />
        <Route path="/star-chart" element={starChartPage} />
        <Route path="/trainer-vault" element={trainerVaultPage} />
        <Route path="/trainer-vault/bag" element={<Navigate to="/trainer-vault" replace />} />
        <Route path="/trainer-vault/pokemon" element={<Navigate to="/trainer-vault" replace />} />
        <Route path="/battle-preference" element={battlePreferencePage} />
        <Route path="/training/transition" element={<Navigate to="/training/config" replace />} />
        <Route path="/training/config" element={trainingConfigPage} />
        <Route path="/training/run-transition" element={trainingRunTransitionPage} />
        <Route path="/training/rest" element={trainingRestPage} />
        <Route path="/training/rest-new" element={trainingRestNewPage} />
        <Route path="/training/battle-transition" element={trainingBattleTransitionPage} />
        <Route path="/training/battle" element={trainingBattlePage} />
        <Route path="/training/battle-result-transition" element={trainingBattleResultTransitionPage} />
        <Route path="/formal/room/create" element={formalLobbyPage} />
        <Route path="/formal/room/start/:mode" element={formalRoomPage} />
        <Route path="/formal/room/continue" element={formalRoomPage} />
        <Route path="/formal/transition/:mode" element={formalTransitionPage} />
        <Route path="/formal/resume-transition" element={formalResumeTransitionPage} />
        <Route path="/formal/starter-select" element={formalStarterSelectPage} />
        <Route path="/formal/round-transition" element={formalRoundTransitionPage} />
        <Route path="/formal/rest" element={formalRestPage} />
        <Route path="/formal/battle-transition" element={formalBattleTransitionPage} />
        <Route path="/formal/battle" element={formalBattlePage} />
        <Route path="/formal/battle-result-transition" element={formalBattleResultTransitionPage} />
        <Route path="/formal/settlement-transition" element={formalSettlementTransitionPage} />
        <Route path="/formal/settlement" element={formalSettlementPage} />
        <Route path="/formal/pending" element={formalPendingPage} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {networkSettingsModal}
      {dexOpen ? (
        <QuickDexModal
          api={api}
          initialPokemonId={dexInitialPokemonId}
          initialCategory={dexInitialCategory}
          initialQuery={dexInitialQuery}
          initialRow={dexInitialRow}
          onClose={() => setDexOpen(false)}
        />
      ) : null}
      {desktopAppBridge && desktopUpdateStatus && !desktopUpdateModalDismissed && (desktopUpdateStatus.phase !== "up-to-date" || desktopManualUpdateCheckActive) ? (
        <DesktopUpdateModal
          status={desktopUpdateStatus}
          onClose={() => {
            setDesktopUpdateModalDismissed(true);
            if (desktopUpdateStatus.phase === "up-to-date") setDesktopManualUpdateCheckActive(false);
          }}
          onCancel={() => desktopAppBridge.cancelUpdate()}
          onOpenOfficialSite={() => desktopAppBridge.openOfficialSite()}
        />
      ) : null}
      <ServerConnectionBadge state={formalRoomCredential && formalRoomRouteActive ? serverConnectionState : null} />
    </GameViewport>
  );
}

function ServerConnectionBadge({state}: {state: PostServiceConnectionStateV4 | null}) {
  if (!state || state.state === "idle") return null;
  const tone = serverConnectionTone(state);
  const msLabel = typeof state.lastRttMs === "number" ? `${Math.max(0, Math.round(state.lastRttMs))}ms` : serverConnectionText(state);
  const barCount = tone === "good" ? 3 : tone === "warn" ? 2 : 1;
  const color = tone === "good" ? "#63e67c" : tone === "warn" ? "#f0c84c" : "#ff5f5f";
  return (
    <div
      aria-live="polite"
      className={`server-connection-signal ${tone}`}
      style={{
        position: "absolute",
        left: 8,
        top: 8,
        zIndex: 120,
        display: "inline-grid",
        gridTemplateColumns: "12px auto",
        alignItems: "end",
        gap: 3,
        height: 14,
        padding: "2px 4px",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        borderRadius: 4,
        background: "rgba(5, 8, 7, 0.76)",
        color,
        fontSize: 7,
        fontWeight: 950,
        lineHeight: 1,
        boxShadow: "0 1px 0 rgba(0, 0, 0, 0.28), inset 0 0 0 1px rgba(255, 255, 255, 0.04)",
        pointerEvents: "none",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 12,
          height: 9,
          display: "grid",
          gridTemplateColumns: "repeat(3, 3px)",
          alignItems: "end",
          gap: 1.5,
        }}
      >
        {[1, 2, 3].map(index => (
          <i
            key={index}
            style={{
              display: "block",
              width: 3,
              height: `${3 + index * 2}px`,
              borderRadius: "2px 2px 1px 1px",
              background: index <= barCount ? color : "rgba(255, 255, 255, 0.18)",
            }}
          />
        ))}
      </span>
      <span>{msLabel}</span>
    </div>
  );
}

function serverConnectionTone(state: PostServiceConnectionStateV4): "good" | "warn" | "bad" {
  if (state.state === "failed") return "bad";
  if (state.state === "connecting" || state.state === "reconnecting" || state.state === "syncing") return "warn";
  if (typeof state.lastRttMs === "number") {
    if (state.lastRttMs >= 800) return "bad";
    if (state.lastRttMs >= 250) return "warn";
  }
  return "good";
}

function serverConnectionText(state: PostServiceConnectionStateV4): string {
  if (state.state === "failed") return "断线";
  if (state.state === "reconnecting") return "重连";
  if (state.state === "syncing") return "同步";
  if (state.state === "online") return "在线";
  return "连接";
}

function parseFormalMode(value: unknown): FormalGameModeV4 {
  return value === "doubles" || value === "coop" ? value : "singles";
}

function parseFormalRoomGatePath(pathname: string): {action: "start" | "continue"; mode: FormalGameModeV4} | null {
  if (pathname === "/formal/room/continue") return {action: "continue", mode: "singles"};
  const match = /^\/formal\/room\/start\/([^/]+)$/.exec(pathname);
  if (!match) return null;
  return {action: "start", mode: parseFormalMode(match[1])};
}

function bgmSceneForRoute(
  pathname: string,
  formalRun: FormalGameRunV4 | null,
  roomRestView: RunGameRestViewV5 | null,
  roomBattleView: RunGameBattleViewV5 | null,
): BgmSceneV2 {
  if (pathname === "/training/battle" || pathname === "/training/battle-transition") return "battle";
  if (pathname === "/formal/battle" || pathname === "/formal/battle-transition") return isFormalBossRound(formalRun, roomRestView, roomBattleView) ? "boss" : "battle";
  if (
    pathname === "/training/rest"
    || pathname === "/training/rest-new"
    || pathname === "/training/run-transition"
    || pathname === "/training/battle-result-transition"
    || pathname === "/formal/starter-select"
    || pathname === "/formal/round-transition"
    || pathname === "/formal/rest"
    || pathname === "/formal/battle-result-transition"
  ) {
    return "rest";
  }
  return "nonBattle";
}

function desktopVersionBadgeLabel(): string {
  const version = String(import.meta.env.VITE_CHANGEBATTLE_DESKTOP_VERSION || "").trim() || "unknown";
  if (IS_DEV_BUILD) return `dev ${version}`;
  return `${CHANGE_BATTLE_RELEASE_CHANNEL === "beta" ? "debug" : "release"} ${version}`;
}

function resolveBattleServiceUrl(runtime: AppProps["runtime"], battleServerConfig?: BattleServerConfigV4 | null, desktopConfig?: {backend: "server" | "local-fallback"; url?: string} | null): string | undefined {
  const envUrl = currentEnvBattleServiceUrl(runtime);
  if (battleServerConfig) return battleServerBaseUrl(battleServerConfig, envUrl);
  if (runtime === "desktop" && desktopConfig?.backend === "local-fallback") return undefined;
  return battleServerBaseUrl(null, runtime === "desktop" ? desktopConfig?.url || envUrl : envUrl);
}

function battleServerConfigWithDefault(config: BattleServerConfigV4 | null, runtime: AppProps["runtime"]): BattleServerConfigV4 {
  return battleServerConfigWithEnvFallback(config, currentEnvBattleServiceUrl(runtime));
}

function currentEnvBattleServiceUrl(runtime: AppProps["runtime"]): string {
  const env = import.meta.env as ImportMetaEnv & {
    VITE_CHANGEBATTLE_MOBILE_BATTLE_SERVICE_URL?: string;
    VITE_CHANGEBATTLE_BATTLE_SERVICE_URL?: string;
  };
  const webUrl = String(env.VITE_CHANGEBATTLE_BATTLE_SERVICE_URL || "").trim();
  if (runtime === "mobile") return String(env.VITE_CHANGEBATTLE_MOBILE_BATTLE_SERVICE_URL || "").trim() || webUrl || DEFAULT_PUBLIC_BATTLE_SERVICE_URL;
  return webUrl || DEFAULT_PUBLIC_BATTLE_SERVICE_URL;
}

function isFormalBossRound(
  run: FormalGameRunV4 | null,
  roomRestView: RunGameRestViewV5 | null,
  roomBattleView: RunGameBattleViewV5 | null,
): boolean {
  if (Object.values(roomBattleView?.participants || {}).some(player => player?.alliance === "far" && player.npcProfile?.isBoss)) return true;
  if (roomRestView?.players.some(player => player.alliance === "far" && player.npcProfile?.isBoss)) return true;
  if (!run?.restRunSnapshot) return false;
  const node = run.restRunSnapshot.gameMap.find(entry => entry.id === run.restRunSnapshot?.currentNodeId)
    || run.restRunSnapshot.gameMap[run.currentRoundIndex]
    || null;
  return Boolean(node && node.index >= 5);
}

function isFormalRoomConnectionRoute(pathname: string): boolean {
  return pathname.startsWith("/formal/room/")
    || pathname === "/formal/resume-transition"
    || pathname === "/formal/starter-select"
    || pathname === "/formal/round-transition"
    || pathname === "/formal/rest"
    || pathname === "/formal/battle-transition"
    || pathname === "/formal/battle"
    || pathname === "/formal/battle-result-transition"
    || pathname === "/formal/settlement-transition"
    || pathname === "/formal/settlement";
}

function isFormalRoomSessionRoute(pathname: string): boolean {
  return isFormalRoomConnectionRoute(pathname);
}

function formalRoomScopeForRoute(pathname: string): ViewScopeNameV5 | null {
  if (pathname === "/formal/starter-select") return "starter";
  if (pathname === "/formal/round-transition" || pathname === "/formal/rest" || pathname === "/formal/battle-transition") return "rest";
  if (pathname === "/formal/battle" || pathname === "/formal/battle-result-transition") return "battle";
  if (pathname === "/formal/settlement-transition" || pathname === "/formal/settlement") return "settlement";
  return null;
}

function isClosedFormalRoom(room: FormalRoomV1): boolean {
  return room.status === "closed" || room.connectionState === "closed" || Boolean(room.closeReason);
}

function isFormalRunContinuable(run: FormalGameRunV4 | null | undefined): run is FormalGameRunV4 {
  return Boolean(run && run.settled === false);
}

function formalModeLabel(mode: FormalGameModeV4): string {
  if (mode === "doubles") return "双打-AI";
  if (mode === "coop") return "合作-AI";
  return "单打-AI";
}

function parseSettlementReason(value: unknown): FormalSettlementReasonV4 {
  return value === "complete" || value === "loss" || value === "surrender" || value === "abandon" ? value : "loss";
}

function parseFormalBattleResultReason(value: unknown): FormalBattleResultFinalizeReasonV4 | undefined {
  return value === "surrender" || value === "loss" || value === "complete" ? value : undefined;
}

function safeSessionStorageGet(key: string): string {
  try {
    return window.sessionStorage?.getItem(key) || "";
  } catch {
    return "";
  }
}

function safeSessionStorageSet(key: string, value: string): void {
  try {
    window.sessionStorage?.setItem(key, value);
  } catch {
    // Best-effort cache only.
  }
}

function isFormalRestRunComplete(run: TrainingRunGameV4 | null | undefined): boolean {
  if (isFormalPendingSettlementRestRun(run)) return false;
  return Boolean(run?.gameMap.length && run.gameMap.every(node => node.state === "won"));
}

function hasUnsettledFormalWonRound(run: FormalGameRunV4 | null | undefined): boolean {
  if (isFormalPendingSettlementRestRun(run?.restRunSnapshot)) return false;
  const settledNodeIds = new Set(Object.keys(run?.roundSettlementByNodeId || {}));
  return Boolean(run?.restRunSnapshot?.gameMap.some(node => node.state === "won" && !settledNodeIds.has(node.id)));
}

function isFormalPendingSettlementRestRun(run: TrainingRunGameV4 | null | undefined): boolean {
  return run?.status === "battleEndedPendingSettlement";
}

function hasRunningFormalBattleNode(run: FormalGameRunV4): boolean {
  return Boolean(run.restRunSnapshot?.gameMap.some(node => node.state === "running" && node.battleGame?.status === "running"));
}

function TrainingConfigBootstrap({onReady}: {onReady: () => void}) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return (
    <section className="training-transition-page" aria-live="polite">
      <div className="training-transition-video-fallback" aria-hidden="true">
        <span />
        <i />
      </div>
      <div className="training-transition-shade" aria-hidden="true" />
      <section className="training-transition-loading">
        <div className="training-transition-copy">
          <strong>读取训练配置</strong>
          <span>正在打开训练场</span>
        </div>
      </section>
    </section>
  );
}

function FormalRouteLoadingPage() {
  return (
    <section className="training-transition-page" aria-live="polite">
      <div className="training-transition-video-fallback" aria-hidden="true">
        <span />
        <i />
      </div>
      <div className="training-transition-shade" aria-hidden="true" />
      <section className="training-transition-loading">
        <div className="training-transition-copy">
          <strong>读取正式流程</strong>
          <span>正在恢复本局进度</span>
        </div>
      </section>
    </section>
  );
}

function FormalResumeTransitionPage({api, run, formalRoomCredential, onRunSynced, onResumeReady, onClosedConfirm}: {
  api: ReturnType<typeof createChangeBattleV2Api>;
  run: FormalGameRunV4;
  formalRoomCredential?: {roomId: string; roomToken: string} | null;
  onRunSynced: (run: FormalGameRunV4) => void;
  onResumeReady: (run: FormalGameRunV4) => void;
  onClosedConfirm: (run: FormalGameRunV4) => void;
}) {
  const [transitionReady, setTransitionReady] = useState(false);
  const [closedRoom, setClosedRoom] = useState<FormalRoomV1 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!transitionReady || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    void (async () => {
      if (!formalRoomCredential) {
        onResumeReady(run);
        return;
      }
      const result = await api.getFormalRoom(formalRoomCredential);
      if (cancelled) return;
      if (!result.ok) {
        if (result.error === "room_not_found") {
          setClosedRoom({
            roomId: formalRoomCredential.roomId,
            formalRun: run,
            activeBattle: null,
            revision: 0,
            status: "closed",
            connectionState: "closed",
            closeReason: "expired",
            createdAt: "",
            updatedAt: "",
            lastHeartbeatAt: "",
            expiresAt: "",
          });
          return;
        }
        setError(result.message);
        return;
      }
      const room = result.data;
      if (!room.formalRun) {
        setError("房间内对局尚未开始。");
        return;
      }
      onRunSynced(room.formalRun);
      if (isClosedFormalRoom(room)) {
        setClosedRoom(room);
        return;
      }
      if (cancelled) return;
      onResumeReady(room.formalRun);
    })().catch(caught => {
      if (!cancelled) setError(caught instanceof Error ? caught.message : "恢复正式游戏失败。");
    });
    return () => {
      cancelled = true;
    };
  }, [api, formalRoomCredential?.roomId, formalRoomCredential?.roomToken, onResumeReady, onRunSynced, run, transitionReady]);

  if (closedRoom) {
    return (
      <section className="training-transition-page" aria-live="polite">
        <div className="training-transition-video-fallback" aria-hidden="true">
          <span />
          <i />
        </div>
        <div className="training-transition-shade" aria-hidden="true" />
        <section className="training-transition-loading">
          <div className="training-transition-copy">
            <strong>房间已关闭</strong>
            <span>{closedRoom.closeReason === "timeout" ? "对局长时间无响应，判定为非正常结束。" : "对局已无法恢复，判定为非正常结束。"}</span>
          </div>
          <p className="training-transition-tip">
            <strong>提示</strong>
            <span>确认后会按失败结算本局，并清理本地房间凭证。</span>
          </p>
          <button type="button" className="training-transition-action" disabled={!closedRoom.formalRun} onClick={() => closedRoom.formalRun ? onClosedConfirm(closedRoom.formalRun) : undefined}>
            进入结算
          </button>
        </section>
      </section>
    );
  }

  return (
    <TrainingRunTransitionPage
      title="恢复正式游戏"
      detail="正在检查房间状态"
      tip={error ? `恢复失败：${error}` : "正在连接服务器确认本局是否仍可继续。"}
      onReady={() => setTransitionReady(true)}
    />
  );
}

function createUserProfileAdapter(runtime: AppProps["runtime"]) {
  const bridge = typeof window === "undefined"
    ? undefined
    : (window as ChangeBattleV2Window).changeBattleV2?.userProfile;
  if (runtime === "desktop" && bridge) {
    const desktopAdapter = createDesktopUserProfileAdapter(bridge);
    const staleFallbackAdapter = createBrowserUserProfileAdapter("changebattle-v2:desktop:user-profile");
    return {
      async loadUserProfile() {
        const desktopProfile = await desktopAdapter.loadUserProfile();
        if (desktopProfile) return desktopProfile;
        const staleProfile = await staleFallbackAdapter.loadUserProfile();
        if (!staleProfile) return null;
        await desktopAdapter.saveUserProfile(staleProfile);
        await staleFallbackAdapter.deleteUserProfile();
        return staleProfile;
      },
      saveUserProfile: desktopAdapter.saveUserProfile,
      async deleteUserProfile() {
        await desktopAdapter.deleteUserProfile();
        await staleFallbackAdapter.deleteUserProfile();
      },
    };
  }
  if (runtime === "desktop") {
    return {
      async loadUserProfile() {
        throw new Error("桌面资料桥接未加载，请重启桌面端或检查 preload 配置。");
      },
      async saveUserProfile() {
        throw new Error("桌面资料桥接未加载，无法写入本地 JSON。");
      },
      async deleteUserProfile() {
        throw new Error("桌面资料桥接未加载，无法删除本地 JSON。");
      },
    };
  }
  return createBrowserUserProfileAdapter(`changebattle-v2:${runtime}:user-profile`);
}

function createPlayerVaultAdapter(runtime: AppProps["runtime"]): PlayerVaultStorageAdapter {
  const bridge = typeof window === "undefined"
    ? undefined
    : (window as ChangeBattleV2Window).changeBattleV2?.playerVault;
  if (runtime === "desktop" && bridge) {
    return createDesktopPlayerVaultAdapter(bridge);
  }
  if (runtime === "desktop") {
    return {
      async loadPlayerVault() {
        throw new Error("桌面玩家资产桥接未加载，请重启桌面端或检查 preload 配置。");
      },
      async savePlayerVault(_vault: PlayerVaultV4) {
        throw new Error("桌面玩家资产桥接未加载，无法写入本地存档。");
      },
      async deletePlayerVault() {
        throw new Error("桌面玩家资产桥接未加载，无法删除本地存档。");
      },
    };
  }
  return createBrowserPlayerVaultAdapter(`changebattle-v2:${runtime}:player-vault`);
}

function createTrainingRunAdapter(runtime: AppProps["runtime"]) {
  const bridge = typeof window === "undefined"
    ? undefined
    : (window as ChangeBattleV2Window).changeBattleV2?.trainingRun;
  if (runtime === "desktop" && bridge) {
    const desktopAdapter = createDesktopTrainingRunAdapter(bridge);
    const staleFallbackAdapter = createBrowserTrainingRunAdapter("changebattle-v2:desktop:training-run");
    return {
      async loadTrainingRun() {
        const desktopRun = await desktopAdapter.loadTrainingRun();
        if (desktopRun) return desktopRun;
        const staleRun = await staleFallbackAdapter.loadTrainingRun();
        if (!staleRun) return null;
        await desktopAdapter.saveTrainingRun(staleRun);
        await staleFallbackAdapter.deleteTrainingRun();
        return staleRun;
      },
      saveTrainingRun: desktopAdapter.saveTrainingRun,
      async deleteTrainingRun() {
        await desktopAdapter.deleteTrainingRun();
        await staleFallbackAdapter.deleteTrainingRun();
      },
    };
  }
  if (runtime === "desktop") {
    return {
      async loadTrainingRun() {
        throw new Error("桌面训练存档桥接未加载，请重启桌面端或检查 preload 配置。");
      },
      async saveTrainingRun() {
        throw new Error("桌面训练存档桥接未加载，无法写入本地存档。");
      },
      async deleteTrainingRun() {
        throw new Error("桌面训练存档桥接未加载，无法删除本地存档。");
      },
    };
  }
  return createBrowserTrainingRunAdapter(`changebattle-v2:${runtime}:training-run`);
}

function createFormalRunAdapter(runtime: AppProps["runtime"]) {
  const bridge = typeof window === "undefined"
    ? undefined
    : (window as ChangeBattleV2Window).changeBattleV2?.formalRun;
  if (runtime === "desktop" && bridge) {
    const desktopAdapter = createDesktopFormalGameRunAdapter(bridge);
    const staleFallbackAdapters = [
      createBrowserFormalGameRunAdapter("changebattle-v2:web:formal-run"),
      createBrowserFormalGameRunAdapter("changebattle-v2:desktop:formal-run"),
    ];
    return {
      async loadFormalGameRun() {
        const desktopRun = await desktopAdapter.loadFormalGameRun();
        if (desktopRun) return desktopRun;
        for (const staleFallbackAdapter of staleFallbackAdapters) {
          const staleRun = await staleFallbackAdapter.loadFormalGameRun();
          if (!staleRun) continue;
          await desktopAdapter.saveFormalGameRun(staleRun);
          await staleFallbackAdapter.deleteFormalGameRun();
          return staleRun;
        }
        return null;
      },
      saveFormalGameRun: desktopAdapter.saveFormalGameRun,
      async deleteFormalGameRun() {
        await desktopAdapter.deleteFormalGameRun();
        await Promise.all(staleFallbackAdapters.map(adapter => adapter.deleteFormalGameRun()));
      },
    };
  }
  if (runtime === "desktop") {
    return {
      async loadFormalGameRun() {
        throw new Error("桌面正式流程存档桥接未加载，请重启桌面端或检查 preload 配置。");
      },
      async saveFormalGameRun() {
        throw new Error("桌面正式流程存档桥接未加载，无法写入本地存档。");
      },
      async deleteFormalGameRun() {
        throw new Error("桌面正式流程存档桥接未加载，无法删除本地存档。");
      },
    };
  }
  return createBrowserFormalGameRunAdapter(`changebattle-v2:${runtime}:formal-run`);
}

function latestUnreadRoundSettlement(run: FormalGameRunV4, seen: Record<string, true>): FormalRoundSettlementV4 | null {
  const settlements = Object.values(run.roundSettlementByNodeId || {});
  settlements.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return settlements.find(settlement => !seen[`${run.id}:${settlement.nodeId}`]) || null;
}

function formalRestActionStorageKey(roomId: string, matchId: string, revision: number, action: FormalRoomRestActionV1): string {
  const actionHash = stableHash(JSON.stringify(action));
  return `changebattle-v2:formal-room:${roomId}:match:${matchId}:rest-command:${revision}:${actionHash}`;
}

function formalTeamReorderStorageKey(roomId: string, matchId: string, revision: number, pokemonIds: string[]): string {
  const actionHash = stableHash(JSON.stringify(pokemonIds));
  return `changebattle-v2:formal-room:${roomId}:match:${matchId}:team-reorder:${revision}:${actionHash}`;
}

function formalRestActionLabel(action: FormalRoomRestActionV1): string {
  if (action.type === "team.heal") return "治疗";
  if (action.type === "pokemon.exchange") return "交换";
  if (action.type === "shop.buy") return "购买";
  if (action.type === "shop.buy-cart") return "购物车购买";
  if (action.type === "shop.refresh") return "刷新商品";
  if (action.type === "shop.sell") return "出售";
  if (action.type === "training.apply") return "学习";
  if (action.type === "pokemon.reroll-stats") return "重随能力";
  if (action.type === "opponent-preview.unlock") return "打听情报";
  if (action.type === "insurance.buy") return "购买保险";
  if (action.type === "soulmate-egg.claim") return "灵魂蛋领取";
  return "休整操作";
}

function formalRestCommandActionName(action: FormalRoomRestActionV1): Extract<PostServiceActionNameV4,
  | "rooms.matches.commands.teamHeal"
  | "rooms.matches.commands.pokemonExchange"
  | "rooms.matches.commands.shopBuy"
  | "rooms.matches.commands.shopBuyCart"
  | "rooms.matches.commands.shopRefresh"
  | "rooms.matches.commands.shopSell"
  | "rooms.matches.commands.trainingApply"
  | "rooms.matches.commands.pokemonRerollStats"
  | "rooms.matches.commands.bagUse"
  | "rooms.matches.commands.bagEquip"
  | "rooms.matches.commands.bagUnequip"
  | "rooms.matches.commands.bagDiscard"
  | "rooms.matches.commands.opponentPreviewUnlock"
  | "rooms.matches.commands.insuranceBuy"
  | "rooms.matches.commands.soulmateEggClaim"> {
  if (action.type === "team.heal") return "rooms.matches.commands.teamHeal";
  if (action.type === "pokemon.exchange") return "rooms.matches.commands.pokemonExchange";
  if (action.type === "shop.buy") return "rooms.matches.commands.shopBuy";
  if (action.type === "shop.buy-cart") return "rooms.matches.commands.shopBuyCart";
  if (action.type === "shop.refresh") return "rooms.matches.commands.shopRefresh";
  if (action.type === "shop.sell") return "rooms.matches.commands.shopSell";
  if (action.type === "training.apply") return "rooms.matches.commands.trainingApply";
  if (action.type === "pokemon.reroll-stats") return "rooms.matches.commands.pokemonRerollStats";
  if (action.type === "bag.use") return "rooms.matches.commands.bagUse";
  if (action.type === "bag.equip") return "rooms.matches.commands.bagEquip";
  if (action.type === "bag.unequip") return "rooms.matches.commands.bagUnequip";
  if (action.type === "bag.discard") return "rooms.matches.commands.bagDiscard";
  if (action.type === "opponent-preview.unlock") return "rooms.matches.commands.opponentPreviewUnlock";
  if (action.type === "insurance.buy") return "rooms.matches.commands.insuranceBuy";
  if (action.type === "soulmate-egg.claim") return "rooms.matches.commands.soulmateEggClaim";
  throw new Error(`Unsupported formal rest command: ${(action as {type?: string}).type || "unknown"}`);
}

function formalRestCommandPayload(action: FormalRoomRestActionV1): Record<string, unknown> {
  if (action.type === "team.heal") return {};
  return {...action};
}

function unavailableFormalExchangeView(displayModel: FormalRestDisplayModel): FormalPokemonExchangeViewV4 {
  return {
    available: false,
    message: "交换结果已同步，刷新房间视图后可继续操作。",
    nodeId: displayModel.currentNode?.id || null,
    playerId: "p1",
    opponentPlayerId: "p2",
    player: displayModel.player,
    opponent: null,
    exchangeCount: 0,
    maxExchangeCount: 0,
    nextCost: 0,
    secondExchangeCost: 0,
    flags: {
      lossless: false,
      eliteEducation: false,
      itemSteal: false,
      secondExchange: false,
    },
  };
}

function formalServerBusyMessageForLabel(label: string): string {
  if (label.includes("治疗")) return "正在治疗中";
  if (label.includes("交换")) return "正在交换中";
  if (label.includes("购买") || label.includes("保险")) return "正在购买中";
  if (label.includes("出售")) return "正在出售中";
  if (label.includes("学习") || label.includes("训练")) return "正在学习中";
  if (label.includes("打听") || label.includes("情报")) return "正在打听中";
  if (label.includes("重随")) return "正在重随中";
  if (label.includes("灵魂蛋")) return "正在领取中";
  if (label.includes("放弃")) return "正在放弃中";
  if (label.includes("结算")) return "正在结算中";
  return "正在同步中";
}

function createFormalSyncClientId(prefix: string): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

function loadOrCreateFormalRestActionClientId(storageKey: string, actionType: string): string {
  try {
    const existing = window.sessionStorage?.getItem(storageKey);
    if (existing) return existing;
    const next = `${actionType}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage?.setItem(storageKey, next);
    return next;
  } catch {
    return `${actionType}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

function clearFormalRestActionClientId(storageKey: string): void {
  try {
    window.sessionStorage?.removeItem(storageKey);
  } catch {
    // Best effort; a stale id only affects a retry of the exact same rest action.
  }
}

function stableHash(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}
