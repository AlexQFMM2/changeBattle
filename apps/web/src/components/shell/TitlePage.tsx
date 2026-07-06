import {useState} from "react";
import {motion} from "motion/react";
import type {TrainerCatalogEntryV2, UserProfileV2} from "@changebattle-v2/api";
import {AnimatedPage} from "../motion/Animated";
import {SaveSelectPanel} from "./SaveSelectPanel";
import {TitleCommandMenu} from "./TitleCommandMenu";
import {TitleLogo} from "./TitleLogo";
import {TitleVideoBackground} from "./TitleVideoBackground";
import {TrainerAvatar} from "./TrainerAvatar";
import "./TitlePage.css";

export function TitlePage({profile, catalog, loading, message, onLoad, onCreate, onDelete, onCheckForUpdates}: {
  profile: UserProfileV2 | null;
  catalog: TrainerCatalogEntryV2[];
  loading: boolean;
  message: string;
  onLoad: () => void;
  onCreate: () => void;
  onDelete: () => void | Promise<void>;
  onCheckForUpdates?: () => Promise<unknown>;
}) {
  const [savePickerOpen, setSavePickerOpen] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  function loadProfile() {
    if (profile) onLoad();
    else setSavePickerOpen(true);
  }

  async function checkForUpdates() {
    if (!onCheckForUpdates || checkingUpdate) return;
    setCheckingUpdate(true);
    try {
      await onCheckForUpdates();
    } finally {
      setCheckingUpdate(false);
    }
  }

  return (
    <AnimatedPage className="title-screen title-page">
      <TitleVideoBackground />
      <div className="title-slide-track">
        <motion.div className="title-slide-pane save-pane" animate={{x: savePickerOpen ? "0%" : "-112%", opacity: savePickerOpen ? 1 : 0.85}} transition={{type: "spring", stiffness: 210, damping: 30}}>
          <SaveSelectPanel
            active={savePickerOpen}
            profile={profile}
            catalog={catalog}
            loading={loading}
            message={message}
            onBack={() => setSavePickerOpen(false)}
            onLoad={onLoad}
            onCreate={onCreate}
            onDelete={onDelete}
          />
        </motion.div>
        <motion.section className="title-slide-pane title-home-page" animate={{x: savePickerOpen ? "112%" : "0%", opacity: savePickerOpen ? 0 : 1}} transition={{type: "spring", stiffness: 210, damping: 30}}>
          <aside className="title-menu-panel">
            <TitleLogo />
            <TitleCommandMenu
              hasProfile={Boolean(profile)}
              loading={loading}
              checkingUpdate={checkingUpdate}
              onLoadProfile={loadProfile}
              onCreateProfile={onCreate}
              onCheckForUpdates={onCheckForUpdates ? checkForUpdates : undefined}
            />
            <div className="title-save-strip">
              <span><TrainerAvatar profile={profile} /></span>
              <strong>{profile ? profile.name : "未读取资料"}</strong>
              <small>{profile ? "本地用户资料" : "选择资料或创建新训练师"}</small>
            </div>
          </aside>
        </motion.section>
      </div>
    </AnimatedPage>
  );
}
