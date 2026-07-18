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

export function TitlePage({profile, catalog, loading, message, onLoad, onCreate, onDelete, onOpenOfficialSite, onNetworkSettings, preferStaticBackground}: {
  profile: UserProfileV2 | null;
  catalog: TrainerCatalogEntryV2[];
  loading: boolean;
  message: string;
  onLoad: () => void;
  onCreate: () => void;
  onDelete: () => void | Promise<void>;
  onOpenOfficialSite?: () => void | Promise<void>;
  onNetworkSettings: () => void;
  preferStaticBackground?: boolean;
}) {
  const [savePickerOpen, setSavePickerOpen] = useState(false);

  function loadProfile() {
    if (profile) onLoad();
    else setSavePickerOpen(true);
  }

  return (
    <AnimatedPage className="title-screen title-page">
      <TitleVideoBackground preferStatic={preferStaticBackground} />
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
              onLoadProfile={loadProfile}
              onCreateProfile={onCreate}
              onOpenOfficialSite={onOpenOfficialSite}
              onNetworkSettings={onNetworkSettings}
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
