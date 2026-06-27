import {useEffect, useMemo, useState} from "react";
import {HashRouter, Navigate, Route, Routes, useLocation, useNavigate} from "react-router";
import {
  createBrowserUserProfileAdapter,
  createBrowserTrainingRunAdapter,
  createChangeBattleV2Api,
  createDesktopUserProfileAdapter,
  type AppDebugConfigV4,
  type DesktopUserProfileBridge,
  type TrainingRunGameV4,
  type UserProfileDraftV2,
  type UserProfileV2,
} from "@changebattle-v2/api";
import {QuickDexModal} from "./components/dex/QuickDexModal";
import {BattleV4Page} from "./components/battle-v4/BattleV4Page";
import {TrainingBattleTransitionPage} from "./components/battle-v4/TrainingBattleTransitionPage";
import {PlayerSettingsPage} from "./components/player/PlayerSettingsPage";
import {GameViewport} from "./components/shell/GameViewport";
import {MainMenuPage} from "./components/shell/MainMenuPage";
import {TitlePage} from "./components/shell/TitlePage";
import {TrainingConfigPage} from "./components/training/TrainingConfigPage";
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
  const [trainingRun, setTrainingRun] = useState<TrainingRunGameV4 | null>(null);
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
    const loaded = await api.loadTrainingRun();
    const next = loaded || await api.saveTrainingRun(api.createTrainingRunGame(profile));
    setTrainingRun(next);
    navigate("/training/config", {replace: true});
  }

  async function startTrainingRun(run: TrainingRunGameV4) {
    const saved = await api.saveTrainingRun(api.createTrainingRunFromScenario(run));
    setTrainingRun(saved);
    navigate("/training/run-transition", {replace: true});
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

  function enterBattle(sessionId: string) {
    setBattleSessionId(sessionId);
    window.sessionStorage?.setItem(`changebattle-v2:${runtime}:battle-session`, sessionId);
    navigate("/training/battle", {replace: true});
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
        profile={profile}
        catalog={catalog.trainers}
        onOpenDex={() => setDexOpen(true)}
        onTraining={() => void createTrainingRunAndOpenConfig()}
        onUserInfo={startEdit}
        onTitle={() => navigate("/", {replace: true})}
      />
      {dexOpen ? <QuickDexModal api={api} onClose={() => setDexOpen(false)} /> : null}
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

  const trainingConfigPage = profile ? (
    trainingRun ? (
      <TrainingConfigPage
        api={api}
        run={trainingRun}
        onRunChange={setTrainingRun}
        onStartRun={startTrainingRun}
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

  return (
    <GameViewport showVersion={location.pathname === "/"}>
      <Routes>
        <Route path="/" element={titlePage} />
        <Route path="/main" element={mainPage} />
        <Route path="/user" element={settingsPage} />
        <Route path="/training/transition" element={<Navigate to="/training/config" replace />} />
        <Route path="/training/config" element={trainingConfigPage} />
        <Route path="/training/run-transition" element={trainingRunTransitionPage} />
        <Route path="/training/rest" element={trainingRestPage} />
        <Route path="/training/battle-transition" element={trainingBattleTransitionPage} />
        <Route path="/training/battle" element={trainingBattlePage} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GameViewport>
  );
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
