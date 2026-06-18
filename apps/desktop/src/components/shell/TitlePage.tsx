import {useState} from "react";
import type {LocalSave, TrainerCatalogState} from "@changebattle/shared";
import {motion} from "motion/react";
import {AnimatedPage} from "../motion/Animated";
import {SaveSelectPanel} from "./SaveSelectPanel";
import {TitleCommandMenu} from "./TitleCommandMenu";
import {TitleLogo} from "./TitleLogo";
import {TitleVideoBackground} from "./TitleVideoBackground";
import {TrainerAvatar} from "./TrainerAvatar";
import "./TitlePage.css";

export type TitleScreenProps = {
  save: LocalSave | null;
  catalog: TrainerCatalogState;
  defaultAvatarAsset?: string;
  onLoad: () => void;
  onNew: () => void;
  onCreate: (name: string, playerId: string, avatarAsset: string) => Promise<LocalSave | null>;
  onDelete: () => void | Promise<void>;
};

export function TitlePage({save, catalog, defaultAvatarAsset, onLoad, onNew, onCreate, onDelete}: TitleScreenProps) {
  const [savePickerOpen, setSavePickerOpen] = useState(false);

  function startNewSave() {
    onNew();
    setSavePickerOpen(true);
  }

  return (
    <AnimatedPage className="title-screen title-page">
      <TitleVideoBackground />
      <div className="title-slide-track">
        <motion.div className="title-slide-pane save-pane" animate={{x: savePickerOpen ? "0%" : "-112%", opacity: savePickerOpen ? 1 : 0.85}} transition={{type: "spring", stiffness: 210, damping: 30}}>
          <SaveSelectPanel active={savePickerOpen} save={save} catalog={catalog} defaultAvatarAsset={defaultAvatarAsset} onBack={() => setSavePickerOpen(false)} onLoad={onLoad} onNew={startNewSave} onCreate={onCreate} onDelete={onDelete} />
        </motion.div>
        <motion.section className="title-slide-pane title-home-page" animate={{x: savePickerOpen ? "112%" : "0%", opacity: savePickerOpen ? 0 : 1}} transition={{type: "spring", stiffness: 210, damping: 30}}>
          <aside className="title-menu-panel">
            <TitleLogo />
            <TitleCommandMenu onLoadSave={() => setSavePickerOpen(true)} onNewGame={startNewSave} />
            <TitleSaveStrip save={save} defaultAvatarAsset={defaultAvatarAsset} />
          </aside>
        </motion.section>
      </div>
    </AnimatedPage>
  );
}

function TitleSaveStrip({save, defaultAvatarAsset}: {save: LocalSave | null; defaultAvatarAsset?: string}) {
  return (
    <div className="title-save-strip">
      <span>
        <TrainerAvatar candidates={[save?.trainer.avatar_asset, save?.trainer.front_asset, defaultAvatarAsset]} alt={save?.trainer.name || "训练师"} fallbackText={save ? save.trainer.name.slice(0, 1) : "?"} />
      </span>
      <strong>{save ? save.trainer.name : "未读取存档"}</strong>
      <small>{save ? `${save.stats.battle_points} BP` : "选择存档或创建新训练师"}</small>
    </div>
  );
}
