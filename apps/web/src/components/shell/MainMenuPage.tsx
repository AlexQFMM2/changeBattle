import {useEffect, useRef, useState} from "react";
import type {TrainerCatalogEntryV2, UserProfileV2} from "@changebattle-v2/api";
import {AnimatedPage} from "../motion/Animated";
import {MainMenuCommandBar, type MainMenuCommandItem} from "./MainMenuCommandBar";
import {TrainerSummaryPanel} from "./TrainerSummaryPanel";
import "./MainMenuPage.css";

export function MainMenuPage({profile, catalog, hasTrainingRun = false, onOpenDex, onOpenComponents, onTraining, onContinueTraining, onUserInfo, onTitle}: {
  profile: UserProfileV2;
  catalog: TrainerCatalogEntryV2[];
  hasTrainingRun?: boolean;
  onOpenDex: () => void;
  onOpenComponents: () => void;
  onTraining: () => void;
  onContinueTraining?: () => void;
  onUserInfo: () => void;
  onTitle: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const actionTimerRef = useRef<number | null>(null);
  const items: MainMenuCommandItem[] = [
    {label: "图鉴", action: onOpenDex, instant: true},
    {label: "查看组件", action: onOpenComponents},
    ...(hasTrainingRun && onContinueTraining ? [{label: "继续游戏", action: onContinueTraining}] : []),
    {label: "训练场", action: onTraining},
    {label: "玩家设置", action: onUserInfo},
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

  return (
    <AnimatedPage className="main-menu-page">
      <video className="main-menu-video-bg" autoPlay muted loop playsInline controls={false} aria-hidden="true">
        <source src="/title/pokemon-room-bg.mp4" type="video/mp4" />
      </video>
      <div className="video-startup-mask" aria-hidden="true" />
      <div className="main-menu-shade" aria-hidden="true" />
      <TrainerSummaryPanel profile={profile} catalog={catalog} leaving={leaving} />
      <MainMenuCommandBar items={items} leaving={leaving} onChoose={choose} />
      {notice ? <div className="main-menu-notice" role="status">{notice}</div> : null}
    </AnimatedPage>
  );
}
