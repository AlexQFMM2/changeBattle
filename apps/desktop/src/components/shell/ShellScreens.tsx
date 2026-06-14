import type {LocalSave, TrainerCatalogState} from "@changebattle/shared";
import {MainMenuPage} from "./MainMenuPage";
import {TitlePage} from "./TitlePage";

export function TitleScreen({save, catalog, defaultAvatarAsset, onLoad, onNew, onCreate, onDelete, onComponentGallery}: {save: LocalSave | null; catalog: TrainerCatalogState; defaultAvatarAsset?: string; onLoad: () => void; onNew: () => void; onCreate: (name: string, playerId: string, avatarAsset: string) => Promise<LocalSave | null>; onDelete: () => void | Promise<void>; onComponentGallery?: () => void}) {
  return <TitlePage save={save} catalog={catalog} defaultAvatarAsset={defaultAvatarAsset} onLoad={onLoad} onNew={onNew} onCreate={onCreate} onDelete={onDelete} onComponentGallery={onComponentGallery} />;
}

export function MainMenu({save, onStart, onTalent, onUserInfo, onHistory, onBattleSetting, onTitle, onTestMode, onRainbowRocketTest, onComponentGallery}: {save: LocalSave | null; onStart: () => void; onTalent: () => void; onUserInfo: () => void; onHistory: () => void; onBattleSetting: () => void; onTitle: () => void; onTestMode: () => void; onRainbowRocketTest?: () => void; onComponentGallery?: () => void}) {
  return <MainMenuPage save={save} onStart={onStart} onTalent={onTalent} onUserInfo={onUserInfo} onHistory={onHistory} onBattleSetting={onBattleSetting} onTitle={onTitle} onTestMode={onTestMode} onRainbowRocketTest={onRainbowRocketTest} onComponentGallery={onComponentGallery} />;
}
