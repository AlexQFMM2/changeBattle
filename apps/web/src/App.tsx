import {useEffect, useMemo, useState} from "react";
import {HashRouter, Navigate, Route, Routes, useLocation, useNavigate} from "react-router";
import {
  createBrowserUserProfileAdapter,
  createBrowserFormalGameRunAdapter,
  createBrowserTrainingRunAdapter,
  createChangeBattleV2Api,
  createDesktopFormalGameRunAdapter,
  createDesktopTrainingRunAdapter,
  createDesktopUserProfileAdapter,
  starChartHasSpecialTrainingLockV4,
  starChartHasOpponentRumorV4,
  type AppDebugConfigV4,
  type DesktopBattleServiceBridge,
  type DesktopFormalGameBridge,
  type DesktopFormalGameRunBridge,
  type DesktopTrainingRunBridge,
  type DesktopUserProfileBridge,
  type FormalBattleResultFinalizeReasonV4,
  type FormalGameModeV4,
  type FormalGameRunV4,
  type FormalMedicalInsuranceChoiceV4,
  type FormalRoundSettlementV4,
  type FormalSettlementReasonV4,
  type TrainingRunGameV4,
  type UserProfileDraftV2,
  type UserProfileV2,
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
import {TalentConfigPage} from "./components/star-chart/TalentConfigPage";
import {TitlePage} from "./components/shell/TitlePage";
import {TrainerVaultPage} from "./components/trainer-vault/TrainerVaultPage";
import {TrainingConfigPage} from "./components/training/TrainingConfigPage";
import {TrainingBattleResultTransitionPage} from "./components/training/TrainingBattleResultTransitionPage";
import {TrainingRestNewPage} from "./components/training/TrainingRestNewPage";
import {TrainingRestPage} from "./components/training/TrainingRestPage";
import {TrainingRunTransitionPage} from "./components/training/TrainingRunTransitionPage";
import {showdownAssetPrefix} from "./lib/assetUrl";

type AppProps = {
  runtime: "web" | "desktop";
};

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
    battleService?: DesktopBattleServiceBridge;
    formalGame?: DesktopFormalGameBridge;
    formalRun?: DesktopFormalGameRunBridge;
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
  const api = useMemo(() => createChangeBattleV2Api({
    userProfileAdapter: createUserProfileAdapter(runtime),
    trainingRunAdapter: createTrainingRunAdapter(runtime),
    formalGameRunAdapter: createFormalRunAdapter(runtime),
    battleServiceClient: battleServiceBridge,
    battleServiceUrl: import.meta.env.VITE_CHANGEBATTLE_BATTLE_SERVICE_URL,
    resourcePrefix: showdownAssetPrefix(),
  }), [battleServiceBridge, runtime]);
  const formalGameBridge = desktopBridgeRoot?.formalGame;
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
  const [trainingRun, setTrainingRun] = useState<TrainingRunGameV4 | null>(null);
  const [formalRun, setFormalRun] = useState<FormalGameRunV4 | null>(null);
  const [battleSessionId, setBattleSessionId] = useState("");
  const [seenRoundSettlementNodeIds, setSeenRoundSettlementNodeIds] = useState<Record<string, true>>({});
  const [medicalInsuranceBusy, setMedicalInsuranceBusy] = useState(false);
  const [medicalInsuranceError, setMedicalInsuranceError] = useState<string | null>(null);

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
    if (!profile) {
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
      await api.deleteUserProfile();
      setProfile(null);
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
    setFormalRun(current);
    if (current.settlement) {
      navigate("/formal/settlement", {replace: true});
      return;
    }
    if (current.restRunSnapshot) {
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
    if (formalRun) {
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

  const titlePage = (
    <TitlePage
      profile={profile}
      catalog={catalog.trainers}
      loading={loading}
      message={message}
      onLoad={() => navigate(profile ? "/main" : "/", {replace: true})}
      onCreate={startCreate}
      onDelete={deleteProfile}
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
        onTrainerVaultBag={() => navigate("/trainer-vault/bag")}
        onTrainerVaultPokemon={() => navigate("/trainer-vault/pokemon")}
        onTestMode={() => void enableTestMode()}
        onBattlePreference={() => navigate("/battle-preference")}
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
      onProfileChange={setProfile}
      onBack={() => navigate("/main", {replace: true})}
    />
  ) : <Navigate to="/" replace />;

  const starChartPage = profile ? (
    <TalentConfigPage
      api={api}
      profile={profile}
      onProfileChange={setProfile}
      onBack={() => navigate("/main", {replace: true})}
    />
  ) : <Navigate to="/" replace />;

  const trainerVaultBagPage = profile ? (
    <TrainerVaultPage
      api={api}
      profile={profile}
      tab="bag"
      onTabChange={tab => navigate(`/trainer-vault/${tab}`)}
      onBack={() => navigate("/main", {replace: true})}
    />
  ) : <Navigate to="/" replace />;

  const trainerVaultPokemonPage = profile ? (
    <TrainerVaultPage
      api={api}
      profile={profile}
      tab="pokemon"
      onTabChange={tab => navigate(`/trainer-vault/${tab}`)}
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
      profile={profile}
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
        onRunReady={run => {
          setFormalRun(run);
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
        playerProfile={profile}
        endFlow="auto-exit"
        onRunChange={restRunSnapshot => setFormalRun(current => current ? {...current, restRunSnapshot, updatedAt: new Date().toISOString()} : current)}
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
        formalGameBridge={formalGameBridge}
        run={formalRun}
        sessionId={battleSessionId || window.sessionStorage?.getItem(`changebattle-v2:${runtime}:formal-battle-session`) || ""}
        reason={parseFormalBattleResultReason(new URLSearchParams(location.search).get("reason"))}
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
        reason={settlementReason}
        onSettled={(run, nextProfile) => {
          setFormalRun(run);
          setProfile(nextProfile);
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

  return (
    <GameViewport showVersion={location.pathname === "/"}>
      <BgmController scene={bgmScene} />
      <Routes>
        <Route path="/" element={titlePage} />
        <Route path="/main" element={mainPage} />
        <Route path="/components" element={componentGalleryPage} />
        <Route path="/user" element={settingsPage} />
        <Route path="/star-chart" element={starChartPage} />
        <Route path="/trainer-vault/bag" element={trainerVaultBagPage} />
        <Route path="/trainer-vault/pokemon" element={trainerVaultPokemonPage} />
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
    </GameViewport>
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

function isFormalBossRound(run: FormalGameRunV4 | null): boolean {
  if (!run?.restRunSnapshot) return false;
  const node = run.restRunSnapshot.gameMap.find(entry => entry.id === run.restRunSnapshot?.currentNodeId)
    || run.restRunSnapshot.gameMap[run.currentRoundIndex]
    || null;
  return Boolean(node && node.index >= 5);
}

function continueGameLabelFor(formalRun: FormalGameRunV4 | null, trainingRun: TrainingRunGameV4 | null): string | undefined {
  if (formalRun) return `继续游戏（${formalModeLabel(formalRun.mode)}）`;
  if (trainingRun) return "继续游戏（训练场）";
  return undefined;
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
  return Boolean(run?.gameMap.length && run.gameMap.every(node => node.state === "won"));
}

function hasUnsettledFormalWonRound(run: FormalGameRunV4 | null | undefined): boolean {
  const settledNodeIds = new Set(Object.keys(run?.roundSettlementByNodeId || {}));
  return Boolean(run?.restRunSnapshot?.gameMap.some(node => node.state === "won" && !settledNodeIds.has(node.id)));
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
  return createBrowserFormalGameRunAdapter();
}

function latestUnreadRoundSettlement(run: FormalGameRunV4, seen: Record<string, true>): FormalRoundSettlementV4 | null {
  const settlements = Object.values(run.roundSettlementByNodeId || {});
  settlements.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return settlements.find(settlement => !seen[`${run.id}:${settlement.nodeId}`]) || null;
}
