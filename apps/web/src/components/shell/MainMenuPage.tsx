import {useEffect, useRef, useState} from "react";
import type {ChangeBattleV2Api, FormalGameModeV4, TrainerCatalogEntryV2, TrainingRunGameV4, UserProfileV2} from "@changebattle-v2/api";
import {AnimatedPage} from "../motion/Animated";
import {MainMenuCommandBar, type MainMenuCommandItem} from "./MainMenuCommandBar";
import {MainMenuHome} from "./MainMenuHome";
import type {MainMenuQuickDexSeed} from "./mainMenuTypes";
import {TrainerSummaryPanel} from "./TrainerSummaryPanel";
import {assetUrl} from "../../lib/assetUrl";
import "./MainMenuPage.css";

export type MainMenuManualSaveState = "idle" | "saving" | "saved" | "error";

export function MainMenuPage({api, profile, catalog, trainingRun, continueGameLabel, manualSaveState = "idle", debugFeatureEnabled = false, onOpenDex, onOpenDexCard, onTraining, onFormalGame, onContinueGame, onStarChart, onTrainerVaultBag, onTrainerVaultPokemon, onManualSave, onBattlePreference, onEnableTestMode, onUserInfo, onTitle}: {
  api: ChangeBattleV2Api;
  profile: UserProfileV2;
  catalog: TrainerCatalogEntryV2[];
  trainingRun: TrainingRunGameV4 | null;
  continueGameLabel?: string;
  manualSaveState?: MainMenuManualSaveState;
  debugFeatureEnabled?: boolean;
  onOpenDex: () => void;
  onOpenDexCard: (seed: MainMenuQuickDexSeed) => void;
  onTraining: () => void;
  onFormalGame: (mode: FormalGameModeV4) => void;
  onContinueGame?: () => void;
  onStarChart: () => void;
  onTrainerVaultBag: () => void;
  onTrainerVaultPokemon: () => void;
  onManualSave: () => void;
  onBattlePreference: () => void;
  onEnableTestMode?: () => void;
  onUserInfo: () => void;
  onTitle: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const actionTimerRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const mainMenuItems: MainMenuCommandItem[] = [
    ...(continueGameLabel && onContinueGame ? [{label: continueGameLabel, action: onContinueGame}] : []),
    {label: "开始新游戏", action: () => setGameMenuOpen(true), instant: true},
    {label: "图鉴", action: onOpenDex, instant: true},
    {label: "训练家星图", action: onStarChart},
    {label: "对局偏好", action: onBattlePreference},
    {label: "我的背包", action: onTrainerVaultBag},
    {label: "我的宝可梦", action: onTrainerVaultPokemon},
    {label: "玩家设置", action: onUserInfo},
    ...(debugFeatureEnabled && onEnableTestMode ? [{label: "测试模式", action: onEnableTestMode, instant: true}] : []),
    {label: manualSaveLabel(manualSaveState), action: onManualSave, instant: true},
    {label: "回到主页", action: onTitle},
  ];
  const gameMenuItems: MainMenuCommandItem[] = [
    {label: "单打-AI", action: () => onFormalGame("singles"), instant: true},
    {label: "双打-AI", action: () => onFormalGame("doubles"), instant: true},
    {label: "合作-AI", action: () => onFormalGame("coop"), instant: true},
    {label: "合作-玩家", action: () => showNotice("合作-玩家 后续开发"), instant: true},
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
      <video className="main-menu-video-bg" autoPlay muted loop playsInline controls={false} aria-hidden="true">
        <source src={assetUrl("title/pokemon-room-bg.mp4")} type="video/mp4" />
      </video>
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
