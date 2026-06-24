import {useEffect, useMemo, useState} from "react";
import {HashRouter, Navigate, Route, Routes, useNavigate} from "react-router";
import {
  createBrowserUserProfileAdapter,
  createBrowserTrainingRunAdapter,
  createChangeBattleV2Api,
  createDesktopUserProfileAdapter,
  type DesktopUserProfileBridge,
  type TrainingRunGameV4,
  type UserProfileDraftV2,
  type UserProfileV2,
} from "@changebattle-v2/api";
import {QuickDexModal} from "./components/dex/QuickDexModal";
import {PlayerSettingsPage} from "./components/player/PlayerSettingsPage";
import {GameViewport} from "./components/shell/GameViewport";
import {MainMenuPage} from "./components/shell/MainMenuPage";
import {TitlePage} from "./components/shell/TitlePage";
import {TrainingConfigPage} from "./components/training/TrainingConfigPage";
import {TrainingRunTransitionPage} from "./components/training/TrainingRunTransitionPage";

type AppProps = {
  runtime: "web" | "desktop";
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
  const api = useMemo(() => createChangeBattleV2Api({
    userProfileAdapter: createUserProfileAdapter(runtime),
    trainingRunAdapter: createBrowserTrainingRunAdapter(`changebattle-v2:${runtime}:training-run`),
  }), [runtime]);
  const catalog = useMemo(() => api.getTrainerCatalog(), [api]);
  const [profile, setProfile] = useState<UserProfileV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("正在读取本地资料...");
  const [editingProfile, setEditingProfile] = useState<UserProfileV2 | null>(null);
  const [dexOpen, setDexOpen] = useState(false);
  const [trainingRun, setTrainingRun] = useState<TrainingRunGameV4 | null>(null);

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
    const next = editingProfile
      ? await api.updateUserProfile(editingProfile, draft)
      : await api.createUserProfile(draft);
    setProfile(next);
    setEditingProfile(null);
    setMessage("资料已保存。");
    navigate("/main", {replace: true});
  }

  async function deleteProfile() {
    await api.deleteUserProfile();
    setProfile(null);
    setEditingProfile(null);
    setMessage("本地资料已删除。");
    navigate("/", {replace: true});
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
    const next = await api.saveTrainingRun(api.createTrainingRunGame(profile));
    setTrainingRun(next);
    navigate("/training/config", {replace: true});
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
        onTraining={() => navigate("/training/transition")}
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

  const trainingTransitionPage = profile ? (
    <TrainingRunTransitionPage onReady={() => void createTrainingRunAndOpenConfig()} />
  ) : <Navigate to="/" replace />;

  const trainingConfigPage = profile ? (
    trainingRun ? (
      <TrainingConfigPage
        api={api}
        run={trainingRun}
        onRunChange={setTrainingRun}
        onBack={() => navigate("/main", {replace: true})}
      />
    ) : (
      <TrainingRunTransitionPage onReady={() => void createTrainingRunAndOpenConfig()} />
    )
  ) : <Navigate to="/" replace />;

  return (
    <GameViewport showVersion>
      <Routes>
        <Route path="/" element={titlePage} />
        <Route path="/main" element={mainPage} />
        <Route path="/user" element={settingsPage} />
        <Route path="/training/transition" element={trainingTransitionPage} />
        <Route path="/training/config" element={trainingConfigPage} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GameViewport>
  );
}

function createUserProfileAdapter(runtime: AppProps["runtime"]) {
  const bridge = typeof window === "undefined"
    ? undefined
    : (window as ChangeBattleV2Window).changeBattleV2?.userProfile;
  if (runtime === "desktop" && bridge) return createDesktopUserProfileAdapter(bridge);
  return createBrowserUserProfileAdapter(`changebattle-v2:${runtime}:user-profile`);
}
