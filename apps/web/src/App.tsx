import {useEffect, useMemo, useState} from "react";
import {HashRouter, Navigate, Route, Routes, useLocation, useNavigate} from "react-router";
import {
  createBrowserUserProfileAdapter,
  createBrowserTrainingRunAdapter,
  createChangeBattleV2Api,
  createDesktopUserProfileAdapter,
  type AppDebugConfigV4,
  type DesktopUserProfileBridge,
  type FormalGameModeV4,
  type FormalGameRunV4,
  type TrainingRunGameV4,
  type UserProfileDraftV2,
  type UserProfileV2,
  type DexSearchRow,
  type DexCategory,
} from "@changebattle-v2/api";
import {QuickDexModal} from "./components/dex/QuickDexModal";
import {BattlePreferencePage} from "./components/battle-preference/BattlePreferencePage";
import {BattleV4Page} from "./components/battle-v4/BattleV4Page";
import {TrainingBattleTransitionPage} from "./components/battle-v4/TrainingBattleTransitionPage";
import {ComponentGalleryPage} from "./components/gallery/ComponentGalleryPage";
import {FormalGamePendingPage} from "./components/formal/FormalGamePendingPage";
import {FormalGameTransitionPage} from "./components/formal/FormalGameTransitionPage";
import {FormalRoundTransitionPage} from "./components/formal/FormalRoundTransitionPage";
import {FormalStarterSelectPage} from "./components/formal/FormalStarterSelectPage";
import {PlayerSettingsPage} from "./components/player/PlayerSettingsPage";
import {GameViewport} from "./components/shell/GameViewport";
import {MainMenuPage} from "./components/shell/MainMenuPage";
import {TalentConfigPage} from "./components/star-chart/TalentConfigPage";
import {TitlePage} from "./components/shell/TitlePage";
import {TrainingConfigPage} from "./components/training/TrainingConfigPage";
import {TrainingRestNewPage} from "./components/training/TrainingRestNewPage";
import {TrainingRestPage} from "./components/training/TrainingRestPage";
import {TrainingRunTransitionPage} from "./components/training/TrainingRunTransitionPage";

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
  const api = useMemo(() => createChangeBattleV2Api({
    userProfileAdapter: createUserProfileAdapter(runtime),
    trainingRunAdapter: createBrowserTrainingRunAdapter(`changebattle-v2:${runtime}:training-run`),
    battleServiceUrl: import.meta.env.VITE_CHANGEBATTLE_BATTLE_SERVICE_URL,
  }), [runtime]);
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

  const mainPage = profile ? (
    <>
      <MainMenuPage
        api={api}
        profile={profile}
        catalog={catalog.trainers}
        trainingRun={trainingRun}
        hasTrainingRun={Boolean(trainingRun)}
        onOpenDex={() => openDex()}
        onOpenDexCard={openDexCard}
        onTraining={() => void createTrainingRunAndOpenConfig()}
        onFormalGame={startFormalGame}
        onContinueTraining={() => void continueTrainingRun()}
        onStarChart={() => navigate("/star-chart")}
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
      title="进入休整区"
      detail="正在整理训练流程"
      tip="休整页会承接队伍、背包和下一场节点，BattleGame 稍后接入。"
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
        onRunChange={setTrainingRun}
        onBackToRest={() => navigate("/training/rest", {replace: true})}
      />
    ) : (
      <TrainingRunTransitionPage onReady={() => void enterTrainingRest()} />
    )
  ) : <Navigate to="/" replace />;

  const formalMode = parseFormalMode(location.pathname.split("/").pop());
  const formalTransitionPage = profile ? (
    <FormalGameTransitionPage
      api={api}
      profile={profile}
      mode={formalMode}
      onRunReady={run => {
        setFormalRun(run);
        navigate("/formal/starter-select", {replace: true});
      }}
      onBack={() => navigate("/main", {replace: true})}
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
        run={formalRun}
        onRunReady={run => {
          setFormalRun(run);
          navigate("/formal/rest", {replace: true});
        }}
        onBack={() => navigate("/main", {replace: true})}
      />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : <Navigate to="/" replace />;

  const formalRestPage = profile ? (
    formalRun?.restRunSnapshot ? (
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
        onStartBattle={startFormalBattleFromRest}
        onOpenDex={() => openDex()}
        onOpenPokemonDex={(speciesId: string) => openDex(speciesId)}
      />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : <Navigate to="/" replace />;

  const formalBattleTransitionPage = profile ? (
    formalRun?.restRunSnapshot ? (
      <TrainingBattleTransitionPage
        api={api}
        run={formalRun.restRunSnapshot}
        onRunChange={restRunSnapshot => setFormalRun(current => current ? {...current, restRunSnapshot, updatedAt: new Date().toISOString()} : current)}
        onSaveRunSnapshot={async restRunSnapshot => {
          if (!formalRun) return restRunSnapshot;
          const saved = await api.saveFormalGameRun({...formalRun, restRunSnapshot, updatedAt: new Date().toISOString()});
          setFormalRun(saved);
          return saved.restRunSnapshot || restRunSnapshot;
        }}
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
        onRunChange={restRunSnapshot => setFormalRun(current => current ? {...current, restRunSnapshot, updatedAt: new Date().toISOString()} : current)}
        onSaveRunSnapshot={async restRunSnapshot => {
          if (!formalRun) return restRunSnapshot;
          const saved = await api.saveFormalGameRun({...formalRun, restRunSnapshot, updatedAt: new Date().toISOString()});
          setFormalRun(saved);
          return saved.restRunSnapshot || restRunSnapshot;
        }}
        onBackToRest={() => navigate("/formal/rest", {replace: true})}
      />
    ) : (
      <Navigate to="/main" replace />
    )
  ) : <Navigate to="/" replace />;

  return (
    <GameViewport showVersion={location.pathname === "/"}>
      <Routes>
        <Route path="/" element={titlePage} />
        <Route path="/main" element={mainPage} />
        <Route path="/components" element={componentGalleryPage} />
        <Route path="/user" element={settingsPage} />
        <Route path="/star-chart" element={starChartPage} />
        <Route path="/battle-preference" element={battlePreferencePage} />
        <Route path="/training/transition" element={<Navigate to="/training/config" replace />} />
        <Route path="/training/config" element={trainingConfigPage} />
        <Route path="/training/run-transition" element={trainingRunTransitionPage} />
        <Route path="/training/rest" element={trainingRestPage} />
        <Route path="/training/rest-new" element={trainingRestNewPage} />
        <Route path="/training/battle-transition" element={trainingBattleTransitionPage} />
        <Route path="/training/battle" element={trainingBattlePage} />
        <Route path="/formal/transition/:mode" element={formalTransitionPage} />
        <Route path="/formal/starter-select" element={formalStarterSelectPage} />
        <Route path="/formal/round-transition" element={formalRoundTransitionPage} />
        <Route path="/formal/rest" element={formalRestPage} />
        <Route path="/formal/battle-transition" element={formalBattleTransitionPage} />
        <Route path="/formal/battle" element={formalBattlePage} />
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
