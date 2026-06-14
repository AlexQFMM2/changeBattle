import {useEffect, useRef, useState} from "react";
import type {LocalSave} from "@changebattle/shared";
import mainMenuBackgroundVideo from "../../assets/title/pokemon-room-bg.mp4";
import {QuickDexModal} from "../dex/QuickDexModal";
import {AnimatedPage} from "../motion/Animated";
import {MainMenuCommandBar, type MainMenuCommandItem} from "./MainMenuCommandBar";
import {MainMenuHome} from "./MainMenuHome";
import {TrainerSummaryPanel} from "./TrainerSummaryPanel";
import "./MainMenuPage.css";

export type MainMenuPageProps = {
  save: LocalSave | null;
  onStart: () => void;
  onTalent: () => void;
  onUserInfo: () => void;
  onHistory: () => void;
  onBattleSetting: () => void;
  onTitle: () => void;
  onTestMode: () => void;
  onRainbowRocketTest?: () => void;
  onComponentGallery?: () => void;
};

export function MainMenuPage({save, onStart, onTalent, onUserInfo, onHistory, onBattleSetting, onTitle, onTestMode, onRainbowRocketTest, onComponentGallery}: MainMenuPageProps) {
  const [leaving, setLeaving] = useState(false);
  const [quickDexOpen, setQuickDexOpen] = useState(false);
  const actionTimerRef = useRef<number | null>(null);
  const showComponentGallery = Boolean(onComponentGallery && (import.meta.env.DEV || window.__changeBattleTest));
  const menuItems: MainMenuCommandItem[] = [
    {label: save?.current_run ? "继续游戏" : "开始游戏", action: onStart},
    {label: "训练家星图", action: onTalent},
    {label: "玩家设置", action: onUserInfo},
    {label: "战绩", action: onHistory},
    {label: "对局偏好", action: onBattleSetting},
    {label: "图鉴", action: () => setQuickDexOpen(true), instant: true},
    {label: "测试模式", action: onTestMode},
    ...(onRainbowRocketTest ? [{label: "彩虹火箭队测试", action: onRainbowRocketTest}] : []),
    {label: "回到主页", action: onTitle},
  ];

  useEffect(() => {
    return () => {
      if (actionTimerRef.current !== null) window.clearTimeout(actionTimerRef.current);
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

  function openComponentGallery() {
    if (!onComponentGallery || leaving) return;
    onComponentGallery();
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
      <MainMenuCommandBar items={menuItems} leaving={leaving} showComponentGallery={showComponentGallery} onChoose={choose} onComponentGallery={openComponentGallery} />
      {quickDexOpen ? <QuickDexModal onClose={() => setQuickDexOpen(false)} /> : null}
    </AnimatedPage>
  );
}
