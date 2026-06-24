import {useEffect, useMemo, useState} from "react";
import {HashRouter, Navigate, Route, Routes, useNavigate} from "react-router";
import {
  createBrowserUserProfileAdapter,
  createChangeBattleV2Api,
  createDesktopUserProfileAdapter,
  type DesktopUserProfileBridge,
  type UserProfileDraftV2,
  type UserProfileV2,
} from "@changebattle-v2/api";
import {QuickDexModal} from "./components/dex/QuickDexModal";
import {PlayerSettingsPage} from "./components/player/PlayerSettingsPage";
import {GameViewport} from "./components/shell/GameViewport";
import {MainMenuPage} from "./components/shell/MainMenuPage";
import {TitlePage} from "./components/shell/TitlePage";

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
  }), [runtime]);
  const catalog = useMemo(() => api.getTrainerCatalog(), [api]);
  const [profile, setProfile] = useState<UserProfileV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("正在读取本地资料...");
  const [editingProfile, setEditingProfile] = useState<UserProfileV2 | null>(null);
  const [dexOpen, setDexOpen] = useState(false);

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

  return (
    <GameViewport showVersion>
      <Routes>
        <Route path="/" element={titlePage} />
        <Route path="/main" element={mainPage} />
        <Route path="/user" element={settingsPage} />
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
