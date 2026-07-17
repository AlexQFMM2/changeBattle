import {useEffect, useMemo, useState} from "react";
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
  starChartHasSpecialTrainingLockV4,
  starChartHasOpponentRumorV4,
  starChartHasSoulmateRewardV4,
  type AppDebugConfigV4,
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
  type FormalGameModeV4,
  type FormalGameRunV4,
  type FormalMedicalInsuranceChoiceV4,
  type FormalRoundSettlementV4,
  type FormalSettlementReasonV4,
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
import {FormalGameTransitionPage} from "./components/formal/FormalGameTransitionPage";
import {FormalRoundTransitionPage} from "./components/formal/FormalRoundTransitionPage";
import {FormalStarterSelectPage} from "./components/formal/FormalStarterSelectPage";
import {PlayerSettingsPage} from "./components/player/PlayerSettingsPage";
import {GameViewport} from "./components/shell/GameViewport";
import {MainMenuPage} from "./components/shell/MainMenuPage";
import {DesktopUpdateModal, desktopUpdateStatusVisible} from "./components/shell/DesktopUpdateModal";
import {TalentConfigPage} from "./components/star-chart/TalentConfigPage";
import {TitlePage} from "./components/shell/TitlePage";
import {TrainerVaultPage} from "./components/trainer-vault/TrainerVaultPage";
import {TrainingConfigPage} from "./components/training/TrainingConfigPage";
import {TrainingBattleResultTransitionPage} from "./components/training/TrainingBattleResultTransitionPage";
import {TrainingRestNewPage} from "./components/training/TrainingRestNewPage";
import {TrainingRestPage} from "./components/training/TrainingRestPage";
import {TrainingRunTransitionPage} from "./components/training/TrainingRunTransitionPage";
import {showdownAssetPrefix} from "./lib/assetUrl";
import {releaseGuardProfileBattlePreferenceV4} from "./lib/battlePreferenceReleaseGuard";
import {CHANGE_BATTLE_DEBUG_FEATURES_ENABLED, CHANGE_BATTLE_RELEASE_CHANNEL} from "./lib/debugFeatures";

type AppProps = {
  runtime: "web" | "desktop" | "mobile";
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
  const desktopBridgeRoot = useMemo(() => runtime === "desktop" && typeof window !== "undefined"
    ? (window as ChangeBattleV2Window).changeBattleV2
    : undefined, [runtime]);
  const battleServiceBridge = desktopBridgeRoot?.battleService;
  const desktopAppBridge = desktopBridgeRoot?.app;
  const [desktopBattleServiceConfig, setDesktopBattleServiceConfig] = useState<{backend: "server" | "local-fallback"; url?: string} | null>(null);
  const battleServiceUrl = useMemo(() => resolveBattleServiceUrl(runtime, desktopBattleServiceConfig), [desktopBattleServiceConfig, runtime]);
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
  }), [battleServiceBridge, battleServiceUrl, playerVaultAdapter, runtime, useDesktopLocalBattleFallback, userProfileAdapter]);
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
  const [manualSaveState, setManualSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [battleSessionId, setBattleSessionId] = useState("");
  const [seenRoundSettlementNodeIds, setSeenRoundSettlementNodeIds] = useState<Record<string, true>>({});
  const [formalRestInitialNotice, setFormalRestInitialNotice] = useState<string | null>(null);
  const [medicalInsuranceBusy, setMedicalInsuranceBusy] = useState(false);
  const [medicalInsuranceError, setMedicalInsuranceError] = useState<string | null>(null);
  const [desktopUpdateStatus, setDesktopUpdateStatus] = useState<DesktopUpdateStatusV4 | null>(null);
  const [desktopUpdateModalDismissed, setDesktopUpdateModalDismissed] = useState(false);
  const [desktopUpdateChecking, setDesktopUpdateChecking] = useState(false);
  const [desktopManualUpdateCheckActive, setDesktopManualUpdateCheckActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.loadUserProfile()
      .then(next => {
        if (cancelled) return;
        setProfile(next);
        setMessage(next ? "已找到本地资料。" : "还没有资料，先创建一个训练师。");
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
      return;
    }
    let cancelled = false;
    api.loadFormalGameRun()
      .then(next => {
        if (!cancelled) setFormalRun(next);
      })
      .catch(() => {
        if (!cancelled) setFormalRun(null);
      });
    return () => {
      cancelled = true;
    };
  }, [api, profile]);

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

  async function createTrainingRunAndOpenConfig() {
    if (!profile) {
      navigate("/", {replace: true});
      return;
    }
    await api.deleteTrainingRun();
    const next = await api.saveTrainingRun(api.createTrainingRunGame(profile));
    setTrainingRun(next);
    navigate("/training/config", {replace: true});
  }

  function startFormalGame(mode: FormalGameModeV4) {
    if (!profile) {
      navigate("/", {replace: true});
      return;
    }
    navigate(`/formal/transition/${mode}`, {replace: true});
  }

  async function enableTestMode() {
    if (!profile) return;
    try {
      const next = await api.enableTestMode(profile);
      setProfile(next);
      setMessage("测试模式已开启：BP 99999。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "测试模式开启失败。");
    }
  }

  async function saveAllCurrentState() {
    if (!profile || manualSaveState === "saving") return;
    setManualSaveState("saving");
    setMessage("存档中...");
    try {
      const savedProfile = await userProfileAdapter.saveUserProfile(profile);
      const savedVault = await api.savePlayerVault(playerVault);
      if (trainingRun) {
        const savedTrainingRun = await api.saveTrainingRun(trainingRun);
        setTrainingRun(savedTrainingRun);
      }
      if (formalRun) {
        const savedFormalRun = await api.saveFormalGameRun(formalRun);
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
    if (current.restRunSnapshot) {
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
    window.sessionStorage?.setItem(`changebattle-v2:${runtime}:formal-battle-session`, sessionId);
    navigate("/formal/battle", {replace: true});
  }

  function enterFormalSettlement(reason: FormalSettlementReasonV4) {
    navigate(`/formal/settlement-transition?reason=${reason}`, {replace: true});
  }

  async function chooseMedicalInsurance(choice: FormalMedicalInsuranceChoiceV4) {
    if (!formalRun || medicalInsuranceBusy) return;
    setMedicalInsuranceBusy(true);
    setMedicalInsuranceError(null);
    try {
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
    }
  }

  function openDex(initialPokemonId: string | null = null) {
    setDexInitialPokemonId(initialPokemonId);
    setDexInitialCategory(undefined);
    setDexInitialQuery(null);
    setDexInitialRow(null);
    setDexOpen(true);
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
      preferStaticBackground={runtime === "mobile"}
    />
  );

  const continueGameLabel = continueGameLabelFor(formalRun, trainingRun);
  const mainPage = profile ? (
    <>
      <MainMenuPage
        api={api}
        profile={profile}
        catalog={catalog.trainers}
        trainingRun={trainingRun}
        continueGameLabel={continueGameLabel}
        onOpenDex={() => openDex()}
        onOpenDexCard={openDexCard}
        onTraining={() => void createTrainingRunAndOpenConfig()}
        onFormalGame={startFormalGame}
        onContinueGame={continueGameLabel ? () => void continueSavedRunGame() : undefined}
        onStarChart={() => navigate("/star-chart")}
        onTrainerVault={() => navigate("/trainer-vault")}
        onManualSave={() => void saveAllCurrentState()}
        manualSaveState={manualSaveState}
        onBattlePreference={() => navigate("/battle-preference")}
        debugFeatureEnabled={DEBUG_FEATURE_ENABLED}
        onEnableTestMode={() => void enableTestMode()}
        onUserInfo={startEdit}
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
  const formalTransitionPage = profile ? (
    <FormalGameTransitionPage
      api={api}
      formalGameBridge={formalGameBridge}
      profile={releaseGuardProfileBattlePreferenceV4(profile, DEBUG_FEATURE_ENABLED)}
      playerVault={playerVault}
      mode={formalMode}
      onRunReady={run => {
        setFormalRun(run);
        navigate("/formal/starter-select", {replace: true});
      }}
    />
  ) : <Navigate to="/" replace />;

  const formalStarterSelectPage = profile ? (
    formalRun && formalRun.starterCandidates.length ? (
      <FormalStarterSelectPage
        api={api}
        run={formalRun}
        onRunChange={setFormalRun}
        onDone={() => navigate("/formal/round-transition", {replace: true})}
        onBack={() => navigate("/main", {replace: true})}
      />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : <Navigate to="/" replace />;

  const formalPendingPage = profile ? (
    formalRun ? (
      <FormalGamePendingPage run={formalRun} onBack={() => navigate("/main", {replace: true})} />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : <Navigate to="/" replace />;

  const formalRoundTransitionPage = profile ? (
    formalRun?.playerTeam ? (
      <FormalRoundTransitionPage
        api={api}
        formalGameBridge={formalGameBridge}
        run={formalRun}
        playerVault={playerVault}
        onSavePlayerVault={api.savePlayerVault}
        onRunReady={(run, nextPlayerVault) => {
          setFormalRun(run);
          setPlayerVault(nextPlayerVault);
          setPlayerVaultDirty(false);
          navigate("/formal/rest", {replace: true});
        }}
      />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : <Navigate to="/" replace />;

  const medicalInsuranceOffer = formalRun?.restRunSnapshot ? api.getFormalMedicalInsuranceOffer(formalRun) : null;
  const shouldShowMedicalInsurance = Boolean(
    formalRun?.restRunSnapshot
    && formalRun.currentRoundIndex === 0
    && medicalInsuranceOffer?.available
    && !medicalInsuranceOffer.seen
    && !medicalInsuranceOffer.purchased
  );
  const formalRestPage = profile ? (
    formalRun?.restRunSnapshot ? (
      <div className="formal-rest-page-shell">
        <TrainingRestNewPage
          api={api}
          run={formalRun.restRunSnapshot}
          onRunChange={restRunSnapshot => setFormalRun(current => current ? {...current, restRunSnapshot, updatedAt: new Date().toISOString()} : current)}
          onSaveRunSnapshot={async restRunSnapshot => {
            if (!formalRun) return restRunSnapshot;
            const saved = await api.saveFormalGameRun({...formalRun, restRunSnapshot, updatedAt: new Date().toISOString()});
            setFormalRun(saved);
            return saved.restRunSnapshot || restRunSnapshot;
          }}
          onBackToConfig={() => navigate("/main", {replace: true})}
          onAbandonRun={() => enterFormalSettlement("abandon")}
          onProceedToSettlement={() => enterFormalSettlement("complete")}
          onStartBattle={startFormalBattleFromRest}
          onOpenDex={() => openDex()}
          onOpenPokemonDex={(speciesId: string) => openDex(speciesId)}
          moneyAmount={formalRun.money}
          roundSettlement={latestUnreadRoundSettlement(formalRun, seenRoundSettlementNodeIds)}
          onRoundSettlementSeen={nodeId => setSeenRoundSettlementNodeIds(current => ({...current, [`${formalRun.id}:${nodeId}`]: true}))}
          healController={{
            money: formalRun.money,
            cost: Math.max(1, Math.floor(250 * (api.formalMedicalInsuranceEffectsForRun(formalRun).recoveryShopPriceMultiplier || 1))),
            onHeal: async () => {
              if (!formalRun) throw new Error("正式存档不存在。");
              const result = formalGameBridge
                ? await formalGameBridge.healFormalRestTeam(formalRun)
                : api.healFormalRestTeam(formalRun);
              if (result.ok) setFormalRun(result.run);
              return result;
            },
          }}
          teamRerollController={{
            money: formalRun.money,
            locksEnabled: starChartHasSpecialTrainingLockV4(formalRun.starChartSnapshot),
            onRerollStats: input => {
              if (!formalRun) throw new Error("正式存档不存在。");
              const result = api.rerollFormalRestPokemonStats(formalRun, input);
              if (result.ok) setFormalRun(result.run);
              return result;
            },
          }}
          opponentPreviewController={{
            enabled: starChartHasOpponentRumorV4(formalRun.starChartSnapshot),
            cost: 10,
            onUnlock: input => {
              if (!formalRun) throw new Error("正式存档不存在。");
              const result = api.unlockFormalRestOpponentPreview(formalRun, input);
              if (result.ok) setFormalRun(result.run);
              return result;
            },
          }}
          exchangeController={{
            getView: () => api.getFormalRestExchangeView(formalRun),
            onExchange: input => {
              if (!formalRun) throw new Error("正式存档不存在。");
              const result = api.exchangeFormalRestPokemon(formalRun, input);
              if (result.ok) setFormalRun(result.run);
              return result;
            },
          }}
          initialNotice={formalRestInitialNotice}
          onInitialNoticeConsumed={() => setFormalRestInitialNotice(null)}
          soulmateRewardEnabled={starChartHasSoulmateRewardV4(formalRun.starChartSnapshot)}
          onSoulmateEggPrepare={input => {
            if (!formalRun) throw new Error("正式存档不存在。");
            return api.prepareFormalSoulmateEggHatch(formalRun, input.candidateId);
          }}
          onSoulmateEggClaim={async input => {
            if (!formalRun) throw new Error("正式存档不存在。");
            const result = api.claimFormalSoulmateEgg(formalRun, playerVault, input.candidateId, input.nickname);
            if (!result.ok) return result;
            const savedVault = await api.savePlayerVault(result.playerVault);
            const savedRun = await api.saveFormalGameRun(result.run);
            setPlayerVault(savedVault);
            setPlayerVaultDirty(false);
            setFormalRun(savedRun);
            return {...result, run: savedRun, playerVault: savedVault};
          }}
          shopController={{
            getShop: () => api.getFormalRestShop(formalRun),
            player: formalRun.restRunSnapshot.players.p1 || null,
            money: formalRun.money,
            onBuy: slotId => {
              if (!formalRun) return "正式存档不存在。";
              const result = api.buyFormalRestShopItem(formalRun, slotId);
              if (!result.ok) throw new Error(result.message);
              setFormalRun(result.run);
              return result.message;
            },
            onSell: itemInstanceIds => {
              if (!formalRun) return "正式存档不存在。";
              const result = api.sellFormalRestBagItems(formalRun, itemInstanceIds);
              if (!result.ok) throw new Error(result.message);
              setFormalRun(result.run);
              return result.message;
            },
          }}
          trainingGroundController={{
            getLesson: () => api.getFormalTrainingGroundLesson(formalRun),
            getLessons: () => api.getFormalTrainingGroundLessons(formalRun),
            player: formalRun.restRunSnapshot.players.p1 || null,
            money: formalRun.money,
            onApply: input => {
              if (!formalRun) throw new Error("正式存档不存在。");
              const result = api.applyFormalTrainingGroundLesson(formalRun, input);
              if (!result.ok) throw new Error(result.message);
              setFormalRun(result.run);
              return result;
            },
            onAdvance: () => {
              if (!formalRun) return;
              setFormalRun(api.advanceFormalTrainingGroundLesson(formalRun));
            },
          }}
        />
        {shouldShowMedicalInsurance && medicalInsuranceOffer ? (
          <FormalMedicalInsuranceDialog
            offer={medicalInsuranceOffer}
            money={formalRun.money}
            busy={medicalInsuranceBusy}
            error={medicalInsuranceError}
            onChoose={chooseMedicalInsurance}
          />
        ) : null}
      </div>
    ) : (
      <Navigate to="/main" replace />
    )
  ) : <Navigate to="/" replace />;

  const formalBattleTransitionPage = profile ? (
    formalRun?.restRunSnapshot ? (
      <FormalBattleTransitionPage
        api={api}
        formalGameBridge={formalGameBridge}
        run={formalRun}
        onRunChange={setFormalRun}
        onReady={enterFormalBattle}
        onBackToRest={() => navigate("/formal/rest", {replace: true})}
      />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : <Navigate to="/" replace />;

  const formalBattlePage = profile ? (
    formalRun?.restRunSnapshot ? (
      <BattleV4Page
        api={api}
        run={formalRun.restRunSnapshot}
        sessionId={battleSessionId || window.sessionStorage?.getItem(`changebattle-v2:${runtime}:formal-battle-session`) || ""}
        debugConfig={APP_DEBUG_CONFIG_V4}
        diagnosticsContext={{formalRun, playerVault}}
        playerProfile={profile}
        endFlow="auto-exit"
        onRunChange={restRunSnapshot => setFormalRun(current => current ? {...current, restRunSnapshot, updatedAt: new Date().toISOString()} : current)}
        onAfterSubmitSnapshot={async snapshot => {
          if (!formalRun || !battleSessionId && !window.sessionStorage?.getItem(`changebattle-v2:${runtime}:formal-battle-session`)) return snapshot;
          const activeSessionId = battleSessionId || window.sessionStorage?.getItem(`changebattle-v2:${runtime}:formal-battle-session`) || "";
          const result = await api.tryApplyFormalSoulmateBattleEvolution({
            run: formalRun,
            playerVault,
            sessionId: activeSessionId,
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
          if (result.sessionId) setBattleSessionId(result.sessionId);
          const suffix = result.reason === "surrender" ? "?reason=surrender" : "";
          navigate(`/formal/battle-result-transition${suffix}`, {replace: true});
        }}
      />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : <Navigate to="/" replace />;

  const formalBattleResultTransitionPage = profile ? (
    formalRun?.restRunSnapshot ? (
      <FormalBattleResultTransitionPage
        api={api}
        formalGameBridge={formalGameBattleResultBridge}
        run={formalRun}
        playerVault={playerVault}
        sessionId={battleSessionId || window.sessionStorage?.getItem(`changebattle-v2:${runtime}:formal-battle-session`) || ""}
        reason={parseFormalBattleResultReason(new URLSearchParams(location.search).get("reason"))}
        onSavePlayerVault={api.savePlayerVault}
        onPlayerVaultChange={nextPlayerVault => {
          setPlayerVault(nextPlayerVault);
          setPlayerVaultDirty(false);
        }}
        onSoulmateSettlementNotice={setFormalRestInitialNotice}
        onRestReady={run => {
          setFormalRun(run);
          navigate("/formal/rest", {replace: true});
        }}
        onSettlementReady={(run, reason) => {
          setFormalRun(run);
          enterFormalSettlement(reason);
        }}
      />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : <Navigate to="/" replace />;

  const settlementReason = parseSettlementReason(new URLSearchParams(location.search).get("reason"));
  const formalSettlementTransitionPage = profile ? (
    formalRun ? (
      <FormalSettlementTransitionPage
        api={api}
        formalGameBridge={formalGameBridge}
        run={formalRun}
        profile={profile}
        playerVault={playerVault}
        reason={settlementReason}
        onSaveProfile={userProfileAdapter.saveUserProfile}
        onSavePlayerVault={api.savePlayerVault}
        onSettled={(run, nextProfile, nextPlayerVault) => {
          setFormalRun(run);
          setProfile(nextProfile);
          setPlayerVault(nextPlayerVault);
          setPlayerVaultDirty(false);
          navigate("/formal/settlement", {replace: true});
        }}
      />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : <Navigate to="/" replace />;

  const formalSettlementPage = profile ? (
    formalRun?.settlement ? (
      <FormalSettlementPage
        run={formalRun}
        profile={profile}
        onBackToMain={() => navigate("/main", {replace: true})}
      />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : <Navigate to="/" replace />;

  const bgmScene = bgmSceneForRoute(location.pathname, formalRun);
  const versionBadgeLabel = desktopVersionBadgeLabel();

  return (
    <GameViewport
      showVersion={location.pathname === "/"}
      versionLabel={versionBadgeLabel}
      versionChecking={desktopUpdateChecking}
      onVersionClick={desktopUpdatesEnabled ? checkDesktopUpdatesFromVersionBadge : undefined}
    >
      <BgmController scene={bgmScene} />
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
        <Route path="/formal/transition/:mode" element={formalTransitionPage} />
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
      <ServerConnectionBadge state={serverConnectionState} />
    </GameViewport>
  );
}

function ServerConnectionBadge({state}: {state: PostServiceConnectionStateV4 | null}) {
  if (!state || state.state === "idle") return null;
  const label = state.state === "online"
    ? `服务器 ${state.lastRttMs ?? "-"}ms`
    : state.state === "failed"
      ? "连接失败"
      : state.state === "reconnecting"
        ? "重连中"
        : "正在连接服务器...";
  return (
    <div
      aria-live="polite"
      style={{
        position: "absolute",
        right: 8,
        top: 8,
        zIndex: 120,
        padding: "3px 7px",
        borderRadius: 6,
        background: state.state === "failed" ? "rgba(120, 28, 28, 0.88)" : "rgba(16, 32, 42, 0.78)",
        color: "#fff",
        fontSize: 11,
        lineHeight: 1.3,
        pointerEvents: "none",
      }}
    >
      {label}
    </div>
  );
}

function parseFormalMode(value: unknown): FormalGameModeV4 {
  return value === "doubles" || value === "coop" ? value : "singles";
}

function bgmSceneForRoute(pathname: string, formalRun: FormalGameRunV4 | null): BgmSceneV2 {
  if (pathname === "/training/battle" || pathname === "/training/battle-transition") return "battle";
  if (pathname === "/formal/battle" || pathname === "/formal/battle-transition") return isFormalBossRound(formalRun) ? "boss" : "battle";
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

function resolveBattleServiceUrl(runtime: AppProps["runtime"], desktopConfig?: {backend: "server" | "local-fallback"; url?: string} | null): string | undefined {
  const env = import.meta.env as ImportMetaEnv & {
    VITE_CHANGEBATTLE_MOBILE_BATTLE_SERVICE_URL?: string;
    VITE_CHANGEBATTLE_BATTLE_SERVICE_URL?: string;
  };
  const webUrl = String(env.VITE_CHANGEBATTLE_BATTLE_SERVICE_URL || "").trim();
  if (runtime === "mobile") {
    return String(env.VITE_CHANGEBATTLE_MOBILE_BATTLE_SERVICE_URL || "").trim() || webUrl || DEFAULT_PUBLIC_BATTLE_SERVICE_URL;
  }
  if (runtime === "desktop") {
    if (desktopConfig?.backend === "local-fallback") return undefined;
    return desktopConfig?.url || webUrl || DEFAULT_PUBLIC_BATTLE_SERVICE_URL;
  }
  return webUrl || DEFAULT_PUBLIC_BATTLE_SERVICE_URL;
}

function isFormalBossRound(run: FormalGameRunV4 | null): boolean {
  if (!run?.restRunSnapshot) return false;
  const node = run.restRunSnapshot.gameMap.find(entry => entry.id === run.restRunSnapshot?.currentNodeId)
    || run.restRunSnapshot.gameMap[run.currentRoundIndex]
    || null;
  return Boolean(node && node.index >= 5);
}

function continueGameLabelFor(formalRun: FormalGameRunV4 | null, trainingRun: TrainingRunGameV4 | null): string | undefined {
  if (isFormalRunContinuable(formalRun)) return `继续游戏（${formalModeLabel(formalRun.mode)}）`;
  if (trainingRun) return "继续游戏（训练场）";
  return undefined;
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
