import {useEffect, useRef, useState} from "react";
import type {LocalSave, TrainerCatalogState} from "@changebattle/shared";
import {motion, type Variants} from "motion/react";
import mainMenuBackgroundVideo from "../../assets/title/pokemon-room-bg.mp4";
import titleBackgroundPoster from "../../assets/title/may-pokemon-bg-poster.jpg";
import titleBackgroundVideo from "../../assets/title/may-pokemon-bg.mp4";
import {QuickDexModal} from "../dex/QuickDexModal";
import {AnimatedPage} from "../motion/Animated";
import {MainMenuHome} from "./MainMenuHome";
import {SaveSelectPanel} from "./SaveSelectModal";
import {TrainerAvatar} from "./TrainerAvatar";
import {TitleLogo} from "./TitleLogo";

const mainMenuItemVariants: Variants = {
  hidden: (index: number) => ({opacity: 0, x: 36, y: index * 2}),
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: {delay: 0.12 + index * 0.07, type: "spring", stiffness: 330, damping: 30},
  }),
  leaving: (index: number) => ({
    opacity: 0,
    x: 38,
    y: -index * 1.5,
    transition: {delay: index * 0.06, duration: 0.24, ease: "easeInOut"},
  }),
};

const mainUserPanelVariants: Variants = {
  hidden: {opacity: 0, x: 36},
  visible: {opacity: 1, x: 0, transition: {delay: 0.1, type: "spring", stiffness: 330, damping: 30}},
  leaving: {opacity: 0, x: 38, transition: {duration: 0.28, ease: "easeInOut"}},
};

export function TitleScreen({save, catalog, defaultAvatarAsset, onLoad, onNew, onCreate, onDelete}: {save: LocalSave | null; catalog: TrainerCatalogState; defaultAvatarAsset?: string; onLoad: () => void; onNew: () => void; onCreate: (name: string, playerId: string, avatarAsset: string) => Promise<LocalSave | null>; onDelete: () => void | Promise<void>}) {
  const [savePickerOpen, setSavePickerOpen] = useState(false);
  function startNewSave() {
    onNew();
    setSavePickerOpen(true);
  }

  return (
    <AnimatedPage className="title-screen title-page">
      <video className="title-video-bg" poster={titleBackgroundPoster} autoPlay muted loop playsInline controls={false} disablePictureInPicture controlsList="nodownload nofullscreen noplaybackrate" aria-hidden="true">
        <source src={titleBackgroundVideo} type="video/mp4" />
      </video>
      <div className="video-startup-mask" aria-hidden="true" />
      <div className="title-atmosphere" aria-hidden="true" />
      <div className="title-slide-track">
        <motion.div className="title-slide-pane save-pane" animate={{x: savePickerOpen ? "0%" : "-112%", opacity: savePickerOpen ? 1 : 0.85}} transition={{type: "spring", stiffness: 210, damping: 30}}>
          <SaveSelectPanel active={savePickerOpen} save={save} catalog={catalog} defaultAvatarAsset={defaultAvatarAsset} onBack={() => setSavePickerOpen(false)} onLoad={onLoad} onNew={startNewSave} onCreate={onCreate} onDelete={onDelete} />
        </motion.div>
        <motion.section className="title-slide-pane title-home-page" animate={{x: savePickerOpen ? "112%" : "0%", opacity: savePickerOpen ? 0 : 1}} transition={{type: "spring", stiffness: 210, damping: 30}}>
          <aside className="title-menu-panel">
            <TitleLogo />
            <nav className="title-command-menu" aria-label="标题菜单">
              <button className="title-menu-item primary" onClick={() => setSavePickerOpen(true)}>
                <span>读取存档</span>
              </button>
              <button className="title-menu-item" onClick={startNewSave}>
                <span>开始新游戏</span>
              </button>
              <button className="title-menu-item quiet" onClick={() => window.close()}>
                <span>退出</span>
              </button>
            </nav>
            <div className="title-save-strip">
              <span>
                <TrainerAvatar candidates={[save?.trainer.avatar_asset, save?.trainer.front_asset, defaultAvatarAsset]} alt={save?.trainer.name || "训练师"} fallbackText={save ? save.trainer.name.slice(0, 1) : "?"} />
              </span>
              <strong>{save ? save.trainer.name : "未读取存档"}</strong>
              <small>{save ? `${save.stats.battle_points} BP` : "选择存档或创建新训练师"}</small>
            </div>
          </aside>
        </motion.section>
      </div>
    </AnimatedPage>
  );
}

export function MainMenu({save, onStart, onTalent, onStarterUpgrade, onHistory, onBattleSetting, onTitle, onTestMode, onRainbowRocketTest}: {save: LocalSave | null; onStart: () => void; onTalent: () => void; onStarterUpgrade: () => void; onHistory: () => void; onBattleSetting: () => void; onTitle: () => void; onTestMode: () => void; onRainbowRocketTest?: () => void}) {
  void onStarterUpgrade;
  const [leaving, setLeaving] = useState(false);
  const [quickDexOpen, setQuickDexOpen] = useState(false);
  const actionTimerRef = useRef<number | null>(null);
  const winRate = save?.stats.battles ? Math.round((save.stats.wins / save.stats.battles) * 1000) / 10 : 0;
  const menuItems = [
    {label: save?.current_run ? "继续游戏" : "开始游戏", action: onStart},
    {label: "训练家星图", action: onTalent},
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

  function choose(action: () => void, instant = false) {
    if (leaving) return;
    if (instant) {
      action();
      return;
    }
    setLeaving(true);
    if (actionTimerRef.current !== null) window.clearTimeout(actionTimerRef.current);
    actionTimerRef.current = window.setTimeout(() => {
      setLeaving(false);
      action();
    }, 680);
  }

  return (
    <AnimatedPage className="main-menu-page">
      <video className="main-menu-video-bg" autoPlay muted loop playsInline controls={false} disablePictureInPicture controlsList="nodownload nofullscreen noplaybackrate" aria-hidden="true">
        <source src={mainMenuBackgroundVideo} type="video/mp4" />
      </video>
      <div className="video-startup-mask" aria-hidden="true" />
      <div className="main-menu-shade" aria-hidden="true" />
      <motion.section className="main-user-panel" aria-label="用户信息" initial="hidden" animate={leaving ? "leaving" : "visible"} variants={mainUserPanelVariants}>
        <span className="main-user-avatar">
          <TrainerAvatar candidates={[save?.trainer.avatar_asset, save?.trainer.front_asset]} alt={save?.trainer.name || "训练师"} fallbackText={save ? save.trainer.name.slice(0, 1) : "?"} />
        </span>
        <div>
          <strong>{save?.trainer.name || "未读取存档"}</strong>
          <small>ID {save?.trainer.player_npc_id || "--"}</small>
        </div>
        <p><b>{save?.stats.battle_points ?? 0}</b><span>BP</span></p>
        <p><b>{winRate}%</b><span>胜率</span></p>
      </motion.section>
      <MainMenuHome save={save} leaving={leaving} />
      <motion.nav className={`main-menu-panel ${leaving ? "leaving" : ""}`} aria-label="主页菜单" initial="hidden" animate={leaving ? "leaving" : "visible"}>
        {menuItems.map((item, index) => (
          <motion.button custom={index} variants={mainMenuItemVariants} onClick={() => choose(item.action, item.instant)} key={item.label}>
            {item.label}
          </motion.button>
        ))}
      </motion.nav>
      {quickDexOpen ? <QuickDexModal onClose={() => setQuickDexOpen(false)} /> : null}
    </AnimatedPage>
  );
}
