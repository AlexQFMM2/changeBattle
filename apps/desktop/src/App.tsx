import {useEffect, useMemo, useRef, useState} from "react";
import {flushSync} from "react-dom";
import {createRoot} from "react-dom/client";
import {HashRouter, Navigate, Route, Routes, useLocation, useNavigate} from "react-router";
import type {AppStatus, BagCategoryView, BattleState, DesktopGameState, LocalSave, RentalPokemon, RestAction, ResultSummaryState, TrainerCatalogState} from "@changebattle/shared";
import {useResponsiveCanvas} from "./hooks/useResponsiveCanvas";
import "./styles.css";
import {BgmController} from "./components/audio/BgmController";
import type {BgmScene} from "./components/audio/musicManifest";
import {ScreenToast} from "./components/feedback/ScreenToast";
import {QuickDexModal} from "./pages/dex/QuickDexModal";
import {PlayerSettings} from "./pages/player/PlayerSettings";
import {BattleHistoryView} from "./pages/result/BattleHistoryView";
import {ResultView} from "./pages/result/ResultView";
import {ExchangeView, RestView} from "./pages/rest/RestView";
import {MainMenu, TitleScreen} from "./pages/shell/ShellScreens";
import {RouteTransitionPage, routeTransitionCopy, type RouteTransitionCopy, type RouteTransitionReason} from "./pages/shell/RouteTransitionPage";
import {BattleSettingPage, RentalSelect, StarterItemsView, StarterUpgradePage, TalentConfigView} from "./pages/setup/SetupPages";
import {BattleView} from "./pages/battle/BattleView";
import {hasStarterItemChoices, mergeBattleSnapshot, profileFromSelection, userFacingError} from "./lib/ui";
import {installBrowserTestBridge} from "./web/browserTestBridge";

installBrowserTestBridge();

const TRANSITION_ROUTE = "/transition";
const BATTLE_SCREENS: AppStatus[] = ["battleMain", "moveMenu", "teamMenu", "statusMenu"];
const HIDDEN_MESSAGE_SCREENS: AppStatus[] = ["rest", "title", "mainMenu", "talentConfig", "starterUpgrade", "battleHistory", "battleSetting", "rentalSelect"];

function saveStarNodeLevel(save: LocalSave | null | undefined, id: string): number {
  return Math.max(0, Math.floor(Number(save?.star_chart?.nodes?.[id] || 0)));
}
const SCREEN_ROUTES: Record<AppStatus, string> = {
  title: "/",
  newGame: "/new",
  mainMenu: "/main",
  userInfo: "/user",
  talentConfig: "/talents",
  starterUpgrade: "/starter-upgrades",
  battleHistory: "/records",
  battleSetting: "/battle-setting",
  starterItems: "/starter-items",
  rentalSelect: "/rentals",
  battleMain: "/battle",
  moveMenu: "/battle/moves",
  teamMenu: "/battle/team",
  statusMenu: "/battle/status",
  exchange: "/exchange",
  rest: "/rest",
  result: "/result",
};
const ROUTE_SCREENS = Object.entries(SCREEN_ROUTES).map(([screen, route]) => ({screen: screen as AppStatus, route}));

function normalizeRoute(pathname: string) {
  const path = pathname || "/";
  if (path === "/") return path;
  return path.replace(/\/+$/, "");
}

function routeForScreen(screen: AppStatus) {
  return SCREEN_ROUTES[screen];
}

function screenForRoute(pathname: string): AppStatus | null {
  const path = normalizeRoute(pathname);
  return ROUTE_SCREENS.find(entry => entry.route === path)?.screen || null;
}

function fallbackScreenForSave(save: LocalSave | null): AppStatus {
  return save ? "mainMenu" : "title";
}

export function App() {
  return (
    <HashRouter>
      <RoutedApp />
    </HashRouter>
  );
}

function RoutedApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const responsiveCanvas = useResponsiveCanvas();
  const routePath = normalizeRoute(location.pathname);
  const browserInitialState = window.__changeBattleTest?.getInitialState() || null;
  const routedScreen = screenForRoute(routePath);
  const screen = routePath === "/" && browserInitialState ? browserInitialState.screen : routedScreen || "title";
  const [save, setSave] = useState<LocalSave | null>(browserInitialState?.save || null);
  const [trainerName, setTrainerName] = useState("训练师");
  const [trainerCatalog, setTrainerCatalog] = useState<TrainerCatalogState>({players: [], avatars: []});
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedAvatarAsset, setSelectedAvatarAsset] = useState("");
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));
  const [candidates, setCandidates] = useState<RentalPokemon[]>(browserInitialState?.candidates?.display || []);
  const [selected, setSelected] = useState<number[]>(browserInitialState?.selected_indexes || []);
  const [focusIndex, setFocusIndex] = useState(0);
  const [inspectedIndexes, setInspectedIndexes] = useState<Set<number>>(() => new Set());
  const [inspectRemaining, setInspectRemaining] = useState(0);
  const [battle, setBattle] = useState<BattleState | null>(browserInitialState?.battle || null);
  const [lastBattleSnapshot, setLastBattleSnapshot] = useState<BattleState | null>(browserInitialState?.battle || null);
  const [starter, setStarter] = useState<DesktopGameState["starter"]>(browserInitialState?.starter || null);
  const [battleBag, setBattleBag] = useState<BagCategoryView | null>(browserInitialState?.battle_bag || null);
  const [exchange, setExchange] = useState<DesktopGameState["exchange"]>(browserInitialState?.exchange || null);
  const [rest, setRest] = useState<DesktopGameState["rest"]>(browserInitialState?.rest || null);
  const [resultSummary, setResultSummary] = useState<ResultSummaryState | null>(browserInitialState?.result_summary || null);
  const [pendingTransition, setPendingTransition] = useState<DesktopGameState | null>(browserInitialState?.pending_transition || null);
  const [dexOpen, setDexOpen] = useState(false);
  const [message, setMessage] = useState(browserInitialState?.message || "欢迎来到 ChangeBattle。选择读取存档或开始新游戏。");
  const [loading, setLoading] = useState(false);
  const [appToast, setAppToast] = useState<{id: number; message: string; durationMs?: number} | null>(null);
  const [routeTransition, setRouteTransition] = useState<(RouteTransitionCopy & {id: number; targetScreen: AppStatus; musicScene?: BgmScene}) | null>(null);
  const [battleChoicePending, setBattleChoicePending] = useState(false);
  const battleChoicePendingRef = useRef(false);
  const routeTransitionTimerRef = useRef<number | null>(null);
  const routeTransitionIdRef = useRef(0);

  function showAppToast(message: string, durationMs = 1400) {
    setAppToast({id: Date.now(), message, durationMs});
  }

  function navigateToScreen(nextScreen: AppStatus, options: {replace?: boolean} = {}) {
    navigate(routeForScreen(nextScreen), {replace: options.replace});
  }

  function clearRouteTransitionTimer() {
    if (routeTransitionTimerRef.current !== null) {
      window.clearTimeout(routeTransitionTimerRef.current);
      routeTransitionTimerRef.current = null;
    }
  }

  useEffect(() => clearRouteTransitionTimer, []);

  useEffect(() => {
    void window.changeBattle?.loadSave().then(loaded => {
      setSave(loaded);
      if (loaded) {
        setTrainerName(loaded.trainer.name);
        setSelectedPlayerId(loaded.trainer.player_npc_id || "");
        setSelectedAvatarAsset(loaded.trainer.avatar_asset || "");
      }
    });
  }, []);

  useEffect(() => {
    void window.changeBattle?.trainerCatalog().then(catalog => {
      setTrainerCatalog(catalog);
      setSelectedPlayerId(current => current || catalog.players[0]?.id || "");
      setSelectedAvatarAsset(current => current || catalog.players[0]?.avatar_asset || catalog.avatars[0]?.avatar_asset || "");
    });
  }, []);

  function applyStateData(state: DesktopGameState, options: {showToastMessage?: boolean} = {}) {
    const showToastMessage = options.showToastMessage ?? true;
    const nextBattle = state.battle || null;
    setSave(state.save || null);
    if (state.candidates?.display) {
      setCandidates(state.candidates.display);
      setSelected(state.selected_indexes || []);
      setFocusIndex(0);
      setInspectedIndexes(new Set());
      setInspectRemaining(state.starter?.inspect_count ?? 0);
    }
    setStarter(state.starter || null);
    setLastBattleSnapshot(current => mergeBattleSnapshot(current, state.pending_transition?.battle || nextBattle));
    setBattle(nextBattle);
    setBattleBag(state.battle_bag || null);
    setExchange(state.exchange || null);
    setRest(state.rest || null);
    setResultSummary(state.result_summary || null);
    setPendingTransition(state.pending_transition || null);
    setMessage(state.message || "");
    if (showToastMessage && state.toast_message) showAppToast(state.toast_message, 2400);
  }

  function applyState(state: DesktopGameState, options: {showToastMessage?: boolean} = {}) {
    flushSync(() => applyStateData(state, options));
    navigateToScreen(state.screen);
  }

  function transitionToState(state: DesktopGameState, reason: RouteTransitionReason, options: {showToastMessage?: boolean} = {}) {
    clearRouteTransitionTimer();
    setDexOpen(false);
    const copy = routeTransitionCopy(state.screen, reason);
    setRouteTransition({...copy, id: ++routeTransitionIdRef.current, targetScreen: state.screen, musicScene: bgmSceneForScreen(state.screen, state.battle || null)});
    navigate(TRANSITION_ROUTE);
    routeTransitionTimerRef.current = window.setTimeout(() => {
      routeTransitionTimerRef.current = null;
      flushSync(() => {
        applyStateData(state, options);
        setRouteTransition(null);
      });
      navigateToScreen(state.screen);
    }, copy.durationMs);
  }

  function transitionToScreen(nextScreen: AppStatus, reason: RouteTransitionReason) {
    clearRouteTransitionTimer();
    setDexOpen(false);
    const copy = routeTransitionCopy(nextScreen, reason);
    setRouteTransition({...copy, id: ++routeTransitionIdRef.current, targetScreen: nextScreen, musicScene: bgmSceneForScreen(nextScreen, nextScreen === "battleMain" ? battle : null)});
    navigate(TRANSITION_ROUTE);
    routeTransitionTimerRef.current = window.setTimeout(() => {
      routeTransitionTimerRef.current = null;
      setRouteTransition(null);
      navigateToScreen(nextScreen);
    }, copy.durationMs);
  }

  function shouldUseRouteTransition(nextScreen: AppStatus, reason?: RouteTransitionReason) {
    if (!reason || routeTransition) return false;
    if (reason === "prepare") return ["starterItems", "battleMain", "rest", "result"].includes(nextScreen);
    if (reason === "starterReady") return nextScreen === "rentalSelect";
    if (reason === "battleStart") return nextScreen === "battleMain" || nextScreen === "result";
    if (reason === "battleComplete") return nextScreen === "rest" || nextScreen === "result";
    if (reason === "loadSave") return nextScreen === "battleMain" || nextScreen === "rest" || nextScreen === "result";
    if (reason === "settlement") return nextScreen === "result";
    if (reason === "returnHome") return nextScreen === "mainMenu";
    return false;
  }

  function bgmSceneForScreen(nextScreen: AppStatus, nextBattle?: BattleState | null): BgmScene {
    if (BATTLE_SCREENS.includes(nextScreen)) return nextBattle?.music_scene === "boss" ? "boss" : "battle";
    if (nextScreen === "starterItems" || nextScreen === "rentalSelect" || nextScreen === "rest" || nextScreen === "exchange") return "rest";
    return "nonBattle";
  }

  async function runAction(action: () => Promise<DesktopGameState | LocalSave | null>, fallbackScreen?: AppStatus, showLoading = true, transitionReason?: RouteTransitionReason): Promise<boolean> {
    if (showLoading) setLoading(true);
    try {
      const result = await action();
      if (result && "screen" in result) {
        if (showLoading) setLoading(false);
        if (shouldUseRouteTransition(result.screen, transitionReason)) transitionToState(result, transitionReason!);
        else applyState(result);
      }
      else if (result && "trainer" in result) setSave(result);
      if (fallbackScreen) navigateToScreen(fallbackScreen);
      return true;
    } catch (err) {
      showAppToast(userFacingError(err));
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function loadGame() {
    await runAction(async () => {
      const loaded = await window.changeBattle!.loadSave();
      if (!loaded) throw new Error("没有找到桌面端存档。请选择新游戏。");
      setTrainerName(loaded.trainer.name);
      setSelectedPlayerId(loaded.trainer.player_npc_id || "");
      setSelectedAvatarAsset(loaded.trainer.avatar_asset || "");
      setSave(loaded);
      if (loaded.current_run) return window.changeBattle!.continueRun();
      return {screen: "mainMenu", save: loaded, message: `欢迎回来，${loaded.trainer.name}。`};
    }, undefined, true, "loadSave");
  }

  async function createNewGame() {
    await runAction(async () => {
      const player = trainerCatalog.players.find(entry => entry.id === selectedPlayerId) || trainerCatalog.players[0];
      const created = await window.changeBattle!.createNewSave(profileFromSelection(trainerName, player, selectedAvatarAsset));
      return {screen: "mainMenu", save: created, message: `新存档已创建：${created.trainer.name}`};
    });
  }

  async function createTitleSave(name: string, playerId: string, avatarAsset: string): Promise<LocalSave | null> {
    const player = trainerCatalog.players.find(entry => entry.id === playerId) || trainerCatalog.players[0];
    const created = await window.changeBattle!.createNewSave(profileFromSelection(name, player, avatarAsset));
    setSave(created);
    setTrainerName(created.trainer.name);
    setSelectedPlayerId(created.trainer.player_npc_id || player?.id || "");
    setSelectedAvatarAsset(created.trainer.avatar_asset || avatarAsset || "");
    navigateToScreen("title");
    setMessage(`新存档已创建：${created.trainer.name}`);
    return created;
  }

  async function deleteSave() {
    await runAction(async () => {
      await window.changeBattle!.deleteSave();
      setSave(null);
      return {screen: "title", save: null, message: "存档已删除。"};
    });
  }

  async function enableTestMode() {
    await runAction(async () => {
      const next = await window.changeBattle!.enableTestMode();
      return {screen: "mainMenu", save: next, message: "测试模式已开启：BP 调整为 99999。"};
    });
  }

  async function prepareChallenge() {
    if (save?.current_run) {
      await runAction(() => window.changeBattle!.continueRun(), undefined, true, "prepare");
      return;
    }
    const nextSeed = Math.floor(Math.random() * 0xffffffff);
    setSeed(nextSeed);
    await runAction(() => window.changeBattle!.prepareStarterItems(nextSeed), undefined, true, "prepare");
  }

  async function chooseStarterItem(offerId: string | null) {
    await runAction(() => window.changeBattle!.chooseStarterItem(offerId), undefined, true, "starterReady");
  }

  async function rerollCandidates() {
    const nextSeed = Math.floor(Math.random() * 0xffffffff);
    setSeed(nextSeed);
    setSelected([]);
    setFocusIndex(0);
    await runAction(() => window.changeBattle!.prepareCandidates(nextSeed));
  }

  async function rerollFocusedCandidate() {
    const slot = focusIndex;
    const nextSelected = selected.filter(index => index !== slot);
    const nextInspected = new Set([...inspectedIndexes].filter(index => index !== slot));
    const nextInspectRemaining = inspectRemaining;
    await runAction(async () => {
      const state = await window.changeBattle!.rerollStarterCandidate(slot);
      return {...state, selected_indexes: nextSelected};
    });
    setFocusIndex(slot);
    setInspectedIndexes(nextInspected);
    setInspectRemaining(nextInspectRemaining);
  }

  function inspectFocusedCandidate() {
    if (inspectRemaining <= 0 || inspectedIndexes.has(focusIndex)) return;
    setInspectedIndexes(current => new Set([...current, focusIndex]));
    setInspectRemaining(current => Math.max(0, current - 1));
  }

  function openStarterUpgrade() {
    navigateToScreen("starterUpgrade");
  }

  async function cancelPreparation() {
    await runAction(() => window.changeBattle!.cancelPreparation());
  }

  function backToStarterItems() {
    if (!hasStarterItemChoices(starter)) {
      setMessage("本次没有可返回的开局道具。");
      return;
    }
    setSelected([]);
    setFocusIndex(0);
    setInspectedIndexes(new Set());
    navigateToScreen("starterItems");
    setMessage("已返回开局道具。");
  }

  async function beginChallenge(nextSelected = selected, runSeed = seed) {
    await runAction(() => window.changeBattle!.beginChallenge(nextSelected, runSeed, 7), undefined, true, "battleStart");
  }

  function toggleCandidate(index: number) {
    setSelected(current => {
      if (current.includes(index)) return current.filter(value => value !== index);
      const origin = (candidates[index] as RentalPokemon & {starter_origin?: string} | undefined)?.starter_origin || "current";
      const memorySelected = current.filter(value => ((candidates[value] as RentalPokemon & {starter_origin?: string} | undefined)?.starter_origin || "current") === "memory").length;
      if (origin === "memory" && memorySelected >= 1) {
        showAppToast("灵魂伴侣最多选择 1 只回忆候选。");
        return current;
      }
      const next = current.length < 3 ? [...current, index] : [...current.slice(0, 2), index];
      return next;
    });
  }

  async function battleChoice(choice: string): Promise<boolean> {
    if (battleChoicePendingRef.current) return false;
    battleChoicePendingRef.current = true;
    setBattleChoicePending(true);
    try {
      return await runAction(() => window.changeBattle!.battleChoice(choice), undefined, false);
    } finally {
      battleChoicePendingRef.current = false;
      setBattleChoicePending(false);
    }
  }

  async function autoAdvanceBattle(): Promise<boolean> {
    if (battleChoicePendingRef.current) return false;
    battleChoicePendingRef.current = true;
    setBattleChoicePending(true);
    try {
      return await runAction(() => window.changeBattle!.autoAdvanceBattle(), undefined, false);
    } finally {
      battleChoicePendingRef.current = false;
      setBattleChoicePending(false);
    }
  }

  async function finishExchange(ownIndex: number | null, enemyIndex: number | null) {
    await runAction(() => window.changeBattle!.exchange(ownIndex, enemyIndex));
  }

  async function restAction(action: RestAction): Promise<DesktopGameState | false> {
    const transitionReason = action.type === "next" ? "battleStart" : action.type === "abort" ? "settlement" : undefined;
    const showLoading = !["roll_shop", "buy_shop_offer"].includes(action.type);
    const bubbleErrorToRestToast = action.type !== "next" && action.type !== "abort";
    if (showLoading) setLoading(true);
    try {
      const result = await window.changeBattle!.restAction(action);
      if (showLoading) setLoading(false);
      if (shouldUseRouteTransition(result.screen, transitionReason)) transitionToState(result, transitionReason!, {showToastMessage: false});
      else applyState(result, {showToastMessage: false});
      return result;
    } catch (err) {
      if (bubbleErrorToRestToast) throw err;
      showAppToast(userFacingError(err));
      return false;
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  function openDex() {
    const battleHasDexTalent = Boolean(battle?.player_talents?.some(talent => talent.id === "intel_god_eye"));
    const restHasDexTalent = Boolean(rest?.talents?.some(talent => talent.id === "intel_god_eye"));
    const canOpenDex = screen === "mainMenu" || (BATTLE_SCREENS.includes(screen) && battleHasDexTalent) || (screen === "rest" && restHasDexTalent);
    if (!canOpenDex) {
      showAppToast("当前页面不能打开图鉴。");
      return;
    }
    setDexOpen(true);
  }

  function guardedRedirectForScreen(currentScreen: AppStatus): AppStatus | null {
    if (currentScreen === "starterItems" && !starter) return fallbackScreenForSave(save);
    if (currentScreen === "rentalSelect" && candidates.length === 0) return fallbackScreenForSave(save);
    if (BATTLE_SCREENS.includes(currentScreen) && !battle) return fallbackScreenForSave(save);
    if (currentScreen === "exchange" && !exchange) return fallbackScreenForSave(save);
    if (currentScreen === "rest" && !rest) return fallbackScreenForSave(save);
    if (currentScreen === "result" && !resultSummary && !battle && !lastBattleSnapshot) return fallbackScreenForSave(save);
    return null;
  }

  const guardedRedirect = routedScreen ? guardedRedirectForScreen(routedScreen) : null;

  useEffect(() => {
    if (!guardedRedirect) return;
    showAppToast("当前页面状态已失效，已返回可用页面。");
    navigateToScreen(guardedRedirect, {replace: true});
  }, [guardedRedirect]);

  const content = useMemo(() => {
    if (screen === "title") return <TitleScreen save={save} catalog={trainerCatalog} defaultAvatarAsset={trainerCatalog.players[0]?.avatar_asset || trainerCatalog.avatars[0]?.avatar_asset} onLoad={loadGame} onNew={() => { setTrainerName("训练师"); }} onCreate={createTitleSave} onDelete={deleteSave} />;
    if (screen === "newGame") return <PlayerSettings title="训练师登记" name={trainerName} setName={setTrainerName} catalog={trainerCatalog} selectedPlayerId={selectedPlayerId} setSelectedPlayerId={setSelectedPlayerId} selectedAvatarAsset={selectedAvatarAsset} setSelectedAvatarAsset={setSelectedAvatarAsset} onSave={createNewGame} onBack={() => navigateToScreen("title")} saveLabel="创建存档" />;
    if (screen === "mainMenu") return <MainMenu save={save} onStart={prepareChallenge} onTalent={() => navigateToScreen("talentConfig")} onStarterUpgrade={openStarterUpgrade} onHistory={() => navigateToScreen("battleHistory")} onBattleSetting={() => navigateToScreen("battleSetting")} onTitle={() => navigateToScreen("title")} onTestMode={enableTestMode} />;
    if (screen === "userInfo") return <PlayerSettings title="玩家设置" save={save} name={save?.trainer.name || trainerName} catalog={trainerCatalog} onSaved={setSave} onBack={() => navigateToScreen("mainMenu")} saveLabel="保存设置" />;
    if (screen === "talentConfig") return <TalentConfigView save={save} onSaved={setSave} onBack={() => navigateToScreen("mainMenu")} />;
    if (screen === "starterUpgrade") return <StarterUpgradePage save={save} onSaved={setSave} onBack={() => navigateToScreen("mainMenu")} />;
    if (screen === "battleHistory") return <BattleHistoryView onBack={() => navigateToScreen("mainMenu")} />;
    if (screen === "battleSetting") return <BattleSettingPage save={save} onSaved={setSave} onBack={() => navigateToScreen("mainMenu")} />;
    if (screen === "starterItems") return <StarterItemsView starter={starter} onChoose={chooseStarterItem} onBack={cancelPreparation} />;
    if (screen === "rentalSelect") return <RentalSelect candidates={candidates} selected={selected} focusIndex={focusIndex} setFocusIndex={setFocusIndex} onToggle={toggleCandidate} onStart={() => beginChallenge()} onBack={hasStarterItemChoices(starter) ? backToStarterItems : undefined} onReroll={rerollCandidates} onSingleReroll={rerollFocusedCandidate} onInspect={inspectFocusedCandidate} runSeed={seed} wholeRerollsRemaining={starter?.whole_rerolls_remaining ?? 0} singleRerollsRemaining={starter?.single_rerolls_remaining ?? 0} inspectRemaining={inspectRemaining} revealTraining={saveStarNodeLevel(save, "intel_god_eye") >= 3 || inspectedIndexes.has(focusIndex)} inspected={inspectedIndexes.has(focusIndex)} />;
    if (BATTLE_SCREENS.includes(screen)) return <BattleView battle={battle} battleBag={battleBag} mode={screen} setMode={navigateToScreen} onChoice={battleChoice} onAutoAdvance={autoAdvanceBattle} choicePending={battleChoicePending} pendingTransition={pendingTransition} onBattleAnimationDone={state => transitionToState(state, "battleComplete")} />;
    if (screen === "exchange") return <ExchangeView exchange={exchange} onSkip={() => finishExchange(null, null)} onExchange={finishExchange} />;
    if (screen === "rest") return <RestView rest={rest} onAction={restAction} />;
    if (screen === "result") return <ResultView message={message} battle={battle || lastBattleSnapshot} summary={resultSummary} onBack={() => transitionToScreen("mainMenu", "returnHome")} />;
    return null;
  }, [screen, save, trainerName, trainerCatalog, selectedPlayerId, selectedAvatarAsset, seed, candidates, selected, focusIndex, starter, inspectedIndexes, inspectRemaining, battle, lastBattleSnapshot, battleBag, battleChoicePending, exchange, rest, resultSummary, pendingTransition, message]);

  const isBattleScreen = BATTLE_SCREENS.includes(screen);
  const hideTransientMessage = HIDDEN_MESSAGE_SCREENS.includes(screen);
  const transientMessage = !isBattleScreen && !hideTransientMessage ? message : "";
  const battleHasDexTalent = Boolean(battle?.player_talents?.some(talent => talent.id === "intel_god_eye"));
  const restHasDexTalent = Boolean(rest?.talents?.some(talent => talent.id === "intel_god_eye"));
  const showDexButton = (isBattleScreen && battleHasDexTalent) || (screen === "rest" && restHasDexTalent);
  const bgmScene = routeTransition?.musicScene || bgmSceneForScreen(screen, battle);

  useEffect(() => {
    if (!showDexButton && dexOpen) setDexOpen(false);
  }, [showDexButton, dexOpen]);

  const gamePage = (
    <main className="game-shell">
      <section className="game-screen" ref={responsiveCanvas.ref} style={responsiveCanvas.style}>
        <div className="game-viewport">
          {guardedRedirect ? null : content}
          {showDexButton ? <button className="floating-dex-button" title="打开图鉴" onClick={openDex}>图鉴</button> : null}
          {dexOpen ? <QuickDexModal onClose={() => setDexOpen(false)} /> : null}
          {loading ? <div className="loading-overlay">正在进入对局...</div> : null}
          {transientMessage ? <ScreenToast message={transientMessage} /> : null}
          {appToast ? <ScreenToast key={appToast.id} message={appToast.message} durationMs={appToast.durationMs ?? 1400} onDone={() => setAppToast(null)} /> : null}
        </div>
      </section>
    </main>
  );

  const transitionPage = routeTransition ? (
    <main className="game-shell">
      <section className="game-screen" ref={responsiveCanvas.ref} style={responsiveCanvas.style}>
        <div className="game-viewport route-transition-viewport">
          <RouteTransitionPage key={routeTransition.id} title={routeTransition.title} detail={routeTransition.detail} tip={routeTransition.tip} durationMs={routeTransition.durationMs} />
        </div>
      </section>
    </main>
  ) : <Navigate to={routeForScreen(fallbackScreenForSave(save))} replace />;

  return (
    <>
      <BgmController scene={bgmScene} save={save} onSave={setSave} />
      <Routes>
        <Route path={TRANSITION_ROUTE} element={transitionPage} />
        {ROUTE_SCREENS.map(entry => <Route path={entry.route} element={routeTransition ? <Navigate to={TRANSITION_ROUTE} replace /> : gamePage} key={entry.route} />)}
        <Route path="*" element={<Navigate to={routeForScreen("title")} replace />} />
      </Routes>
    </>
  );
}

export function mountChangeBattleApp(element = document.getElementById("root")) {
  if (!element) throw new Error("Missing #root element.");
  createRoot(element).render(<App />);
}

if (import.meta.env.VITE_CHANGEBATTLE_MANUAL_MOUNT !== "1") {
  mountChangeBattleApp();
}
