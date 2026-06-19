import {useEffect, useRef, useState} from "react";
import type {LocalSave} from "@changebattle/shared";
import mainMenuBackgroundVideo from "../../assets/title/pokemon-room-bg.mp4";
import {QuickDexModal} from "../dex/QuickDexModal";
import {AnimatedPage} from "../motion/Animated";
import {MainMenuCommandBar, type MainMenuCommandItem} from "./MainMenuCommandBar";
import {MainMenuHome} from "./MainMenuHome";
import {TrainerSummaryPanel} from "./TrainerSummaryPanel";
import "./MainMenuPage.css";

type ChangeBattleDebugBridge = {
  isVConsoleEnabled?: () => boolean;
};

export type MainMenuPageProps = {
  save: LocalSave | null;
  onStart: () => void;
  onTraining: () => void;
  onTalent: () => void;
  onUserInfo: () => void;
  onHistory: () => void;
  onBattleSetting: () => void;
  onTitle: () => void;
  onTestMode?: () => void;
  onRainbowRocketTest?: () => void;
};

export function MainMenuPage({save, onStart, onTraining, onTalent, onUserInfo, onHistory, onBattleSetting, onTitle, onTestMode, onRainbowRocketTest}: MainMenuPageProps) {
  const [leaving, setLeaving] = useState(false);
  const [quickDexOpen, setQuickDexOpen] = useState(false);
  const [debugMenuVisible, setDebugMenuVisible] = useState(() => isDebugMenuVisible());
  const actionTimerRef = useRef<number | null>(null);
  const menuItems: MainMenuCommandItem[] = [
    {label: save?.current_run ? "继续游戏" : "开始游戏", action: onStart},
    {label: "战斗训练场", action: onTraining},
    {label: "训练家星图", action: onTalent},
    {label: "玩家设置", action: onUserInfo},
    {label: "战绩", action: onHistory},
    {label: "对局偏好", action: onBattleSetting},
    {label: "图鉴", action: () => setQuickDexOpen(true), instant: true},
    ...(debugMenuVisible && onTestMode ? [{label: "测试模式", action: onTestMode}] : []),
    ...(debugMenuVisible && onRainbowRocketTest ? [{label: "彩虹火箭队测试", action: onRainbowRocketTest}] : []),
    {label: "回到主页", action: onTitle},
  ];

  useEffect(() => {
    return () => {
      if (actionTimerRef.current !== null) window.clearTimeout(actionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const refresh = () => setDebugMenuVisible(isDebugMenuVisible());
    window.addEventListener("changebattle:vconsole-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("changebattle:vconsole-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function choose(item: MainMenuCommandItem) {
    if (leaving) return;
    if (item.instant) {
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

  return (
    <AnimatedPage className="main-menu-page">
      <video className="main-menu-video-bg" autoPlay muted loop playsInline controls={false} disablePictureInPicture controlsList="nodownload nofullscreen noplaybackrate" aria-hidden="true">
        <source src={mainMenuBackgroundVideo} type="video/mp4" />
      </video>
      <div className="video-startup-mask" aria-hidden="true" />
      <div className="main-menu-shade" aria-hidden="true" />
      <TrainerSummaryPanel save={save} leaving={leaving} />
      <MainMenuHome save={save} leaving={leaving} />
      <MainMenuCommandBar items={menuItems} leaving={leaving} onChoose={choose} />
      {quickDexOpen ? <QuickDexModal onClose={() => setQuickDexOpen(false)} /> : null}
    </AnimatedPage>
  );
}

function isDebugMenuVisible(): boolean {
  if (typeof window === "undefined") return false;
  const bridge = (window as Window & {__changeBattleDebug?: ChangeBattleDebugBridge}).__changeBattleDebug;
  return Boolean(bridge?.isVConsoleEnabled?.());
}
