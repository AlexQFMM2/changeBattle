import {useEffect, useRef, useState} from "react";
import type {ChangeBattleV2Api, TrainerCatalogEntryV2, TrainingRunGameV4, UserProfileV2} from "@changebattle-v2/api";
import {AnimatedPage} from "../motion/Animated";
import {MainMenuCommandBar, type MainMenuCommandItem} from "./MainMenuCommandBar";
import {MainMenuHome} from "./MainMenuHome";
import type {MainMenuQuickDexSeed} from "./mainMenuTypes";
import {TrainerSummaryPanel} from "./TrainerSummaryPanel";
import {assetUrl} from "../../lib/assetUrl";
import "./MainMenuPage.css";

export type MainMenuManualSaveState = "idle" | "saving" | "saved" | "error";

export function MainMenuPage({api, profile, catalog, trainingRun, manualSaveState = "idle", debugFeatureEnabled = false, preferStaticBackground = false, onOpenDex, onOpenDexCard, onTraining, onCreateRoom, onStarChart, onTrainerVault, onManualSave, onEnableTestMode, onUserInfo, onNetworkSettings, onTitle}: {
  api: ChangeBattleV2Api;
  profile: UserProfileV2;
  catalog: TrainerCatalogEntryV2[];
  trainingRun: TrainingRunGameV4 | null;
  manualSaveState?: MainMenuManualSaveState;
  debugFeatureEnabled?: boolean;
  preferStaticBackground?: boolean;
  onOpenDex: () => void;
  onOpenDexCard: (seed: MainMenuQuickDexSeed) => void;
  onTraining: () => void;
  onCreateRoom: () => void;
  onStarChart: () => void;
  onTrainerVault: () => void;
  onManualSave: () => void;
  onEnableTestMode?: () => void;
  onUserInfo: () => void;
  onNetworkSettings: () => void;
  onTitle: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const actionTimerRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const mainMenuItems: MainMenuCommandItem[] = [
    {label: "开始新游戏", action: () => setGameMenuOpen(true), instant: true},
    {label: "图鉴", action: onOpenDex, instant: true},
    {label: "训练家星图", action: onStarChart},
    {label: "我的仓库", action: onTrainerVault},
    {label: "玩家设置", action: onUserInfo},
    {label: "游戏设置", action: onNetworkSettings, instant: true},
    ...(debugFeatureEnabled && onEnableTestMode ? [{label: "测试模式", action: onEnableTestMode, instant: true}] : []),
    {label: manualSaveLabel(manualSaveState), action: onManualSave, instant: true},
    {label: "回到主页", action: onTitle},
  ];
  const gameMenuItems: MainMenuCommandItem[] = [
    {label: "创建房间", action: onCreateRoom, instant: true},
    {label: "加入房间", action: () => showNotice("加入房间后续开放"), instant: true},
    {label: "训练场", action: onTraining},
    {label: "返回", action: closeGameMenu, instant: true},
  ];
  const items = gameMenuOpen ? gameMenuItems : mainMenuItems;

  useEffect(() => {
    return () => {
      if (actionTimerRef.current !== null) window.clearTimeout(actionTimerRef.current);
      if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    };
  }, []);

  function choose(item: MainMenuCommandItem) {
    if (leaving) return;
    if (item.instant) {
      if (actionTimerRef.current !== null) {
        window.clearTimeout(actionTimerRef.current);
        actionTimerRef.current = null;
      }
      item.action();
      return;
    }
    setLeaving(true);
    if (actionTimerRef.current !== null) window.clearTimeout(actionTimerRef.current);
    actionTimerRef.current = window.setTimeout(() => {
      setLeaving(false);
      item.action();
    }, 680);
  }

  function closeGameMenu() {
    if (actionTimerRef.current !== null) {
      window.clearTimeout(actionTimerRef.current);
      actionTimerRef.current = null;
    }
    setLeaving(false);
    setGameMenuOpen(false);
    setNotice(null);
  }

  function showNotice(message: string) {
    setNotice(message);
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), 1400);
  }

  return (
    <AnimatedPage className="main-menu-page">
      {preferStaticBackground ? (
        <img className="main-menu-video-bg main-menu-static-bg" src={assetUrl("title/may-pokemon-bg-poster.jpg")} alt="" aria-hidden="true" />
      ) : (
        <video className="main-menu-video-bg" autoPlay muted loop playsInline controls={false} disablePictureInPicture controlsList="nodownload nofullscreen noplaybackrate" aria-hidden="true">
          <source src={assetUrl("title/pokemon-room-bg.mp4")} type="video/mp4" />
        </video>
      )}
      <div className="video-startup-mask" aria-hidden="true" />
      <div className="main-menu-shade" aria-hidden="true" />
      <TrainerSummaryPanel profile={profile} catalog={catalog} leaving={leaving} />
      <MainMenuHome api={api} profile={profile} run={trainingRun} leaving={leaving} onOpenDexCard={onOpenDexCard} />
      <MainMenuCommandBar key={gameMenuOpen ? "new-game-menu" : "main-menu"} items={items} leaving={leaving} onChoose={choose} />
      {notice ? <div className="main-menu-notice" role="status">{notice}</div> : null}
    </AnimatedPage>
  );
}

function manualSaveLabel(state: MainMenuManualSaveState): string {
  if (state === "saving") return "存档中...";
  if (state === "saved") return "存档完成";
  if (state === "error") return "存档失败";
  return "保存";
}
