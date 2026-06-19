import type {LocalSave, TrainerCatalogState} from "@changebattle/shared";
import {MainMenuPage} from "./MainMenuPage";
import {TitlePage} from "./TitlePage";

export function TitleScreen({save, catalog, defaultAvatarAsset, onLoad, onNew, onCreate, onDelete}: {save: LocalSave | null; catalog: TrainerCatalogState; defaultAvatarAsset?: string; onLoad: () => void; onNew: () => void; onCreate: (name: string, playerId: string, avatarAsset: string) => Promise<LocalSave | null>; onDelete: () => void | Promise<void>}) {
  return <TitlePage save={save} catalog={catalog} defaultAvatarAsset={defaultAvatarAsset} onLoad={onLoad} onNew={onNew} onCreate={onCreate} onDelete={onDelete} />;
}

export function MainMenu({save, onStart, onTraining, onTalent, onUserInfo, onHistory, onBattleSetting, onTitle, onTestMode, onRainbowRocketTest}: {save: LocalSave | null; onStart: () => void; onTraining: () => void; onTalent: () => void; onUserInfo: () => void; onHistory: () => void; onBattleSetting: () => void; onTitle: () => void; onTestMode?: () => void; onRainbowRocketTest?: () => void}) {
  return <MainMenuPage save={save} onStart={onStart} onTraining={onTraining} onTalent={onTalent} onUserInfo={onUserInfo} onHistory={onHistory} onBattleSetting={onBattleSetting} onTitle={onTitle} onTestMode={onTestMode} onRainbowRocketTest={onRainbowRocketTest} />;
}
