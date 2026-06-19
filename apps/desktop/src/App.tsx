import {useEffect, useRef, useState} from "react";
import {flushSync} from "react-dom";
import {createRoot} from "react-dom/client";
import {HashRouter, Navigate, Route, Routes, useLocation, useNavigate} from "react-router";
import type {AppStatus, BagCategoryView, BattleAiHint, BattleState, DesktopGameState, LocalSave, RentalPokemon, RestAction, ResultSummaryState, TrainerCatalogState} from "@changebattle/shared";
import "./styles.css";
import {BgmController} from "./components/audio/BgmController";
import type {BgmScene} from "./components/audio/musicManifest";
import {ScreenToast} from "./components/feedback/ScreenToast";
import {QuickDexModal} from "./pages/dex/QuickDexModal";
import {RouteTransitionPage, routeTransitionCopy, type RouteTransitionCopy, type RouteTransitionReason} from "./pages/shell/RouteTransitionPage";
import {hasStarterItemChoices, mergeBattleSnapshot, profileFromSelection, userFacingError} from "./lib/ui";
import {installBrowserTestBridge} from "./web/browserTestBridge";
import {GameViewport} from "./components/shell/GameViewport";
import {QuickDexButton} from "./components/shell/QuickDexButton";
import {RouteRenderer} from "./components/shell/RouteRenderer";

installBrowserTestBridge();

const TRANSITION_ROUTE = "/transition";
const BATTLE_SCREENS: AppStatus[] = ["battleMain", "moveMenu", "teamMenu", "statusMenu"];
const HIDDEN_MESSAGE_SCREENS: AppStatus[] = ["rest", "title", "mainMenu", "talentConfig", "starterUpgrade", "battleHistory", "battleSetting", "rentalSelect"];
const BATTLE_ANIMATION_SPEED_STORAGE_KEY = "changebattle:battle-animation-speed";
type BattleAnimationSpeed = 1 | 2;

function appBattleDebugLog(message: string, data?: unknown): void {
  if (data === undefined) console.info(`[changebattle:battle] ${message}`);
  else console.info(`[changebattle:battle] ${message}`, data);
}

function battleStateDebugSnapshot(state: BattleState | null): unknown {
  if (!state) return null;
  return {
    ended: state.ended,
    winner: state.winner,
    turn: state.tracker.turn,
    request: {
      wait: state.request?.wait,
      forceSwitch: state.request?.forceSwitch,
      teamPreview: state.request?.teamPreview,
      activeMoves: state.request?.active?.[0]?.moves?.map((move, index) => ({
        index: index + 1,
        id: move.id,
        move: move.move,
        pp: move.pp,
        maxpp: move.maxpp,
        disabled: move.disabled,
        target: move.target,
      })),
      side: state.request?.side?.pokemon?.map((pokemon, index) => ({
        index: index + 1,
        ident: pokemon.ident,
        condition: pokemon.condition,
        active: pokemon.active,
        pokeball: pokemon.pokeball,
      })),
    },
    timelineCount: state.timeline_events.length,
    recentEvents: state.recent_events.slice(-5),
  };
}

function readBattleAnimationSpeedPreference(): BattleAnimationSpeed {
  if (typeof window === "undefined") return 1;
  return window.localStorage.getItem(BATTLE_ANIMATION_SPEED_STORAGE_KEY) === "2" ? 2 : 1;
}

function saveStarNodeLevel(save: LocalSave | null | undefined, id: string): number {
  return Math.max(0, Math.floor(Number(save?.star_chart?.nodes?.[id] || 0)));
}
const SCREEN_ROUTES: Record<AppStatus, string> = {
  title: "/",
  newGame: "/new",
  mainMenu: "/main",
  battleTraining: "/battle/training",
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
  const [battleAnimationSpeed, setBattleAnimationSpeedState] = useState<BattleAnimationSpeed>(() => readBattleAnimationSpeedPreference());
  const [battleChoicePending, setBattleChoicePending] = useState(false);
  const battleChoicePendingRef = useRef(false);
  const routeTransitionTimerRef = useRef<number | null>(null);
  const routeTransitionIdRef = useRef(0);

  function showAppToast(message: string, durationMs = 1400) {
    setAppToast({id: Date.now(), message, durationMs});
  }

  function setBattleAnimationSpeed(speed: BattleAnimationSpeed) {
    setBattleAnimationSpeedState(speed);
    window.localStorage.setItem(BATTLE_ANIMATION_SPEED_STORAGE_KEY, String(speed));
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
      return {screen: "mainMenu", save: next, message: "测试模式已开启：BP 调整为 99999，星图已全部点亮。"};
    });
  }

  async function startRainbowRocketTestRun() {
    await runAction(async () => {
      if (!window.changeBattle?.startRainbowRocketTestRun) throw new Error("当前运行环境未开放彩虹火箭队测试入口。");
      return window.changeBattle.startRainbowRocketTestRun();
    }, undefined, true, "prepare");
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
    if (battleChoicePendingRef.current) {
      appBattleDebugLog("battle choice 被 pending 阻止", {
        choice,
        screen,
        pending: battleChoicePendingRef.current,
        battle: battleStateDebugSnapshot(battle),
      });
      return false;
    }
    const startedAt = performance.now();
    appBattleDebugLog("battle choice start", {
      choice,
      screen,
      battle: battleStateDebugSnapshot(battle),
    });
    battleChoicePendingRef.current = true;
    setBattleChoicePending(true);
    try {
      const ok = await runAction(() => window.changeBattle!.battleChoice(choice), undefined, false);
      appBattleDebugLog("battle choice finished", {
        choice,
        ok,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
      return ok;
    } finally {
      battleChoicePendingRef.current = false;
      setBattleChoicePending(false);
      appBattleDebugLog("battle choice pending cleared", {
        choice,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    }
  }

  async function autoAdvanceBattle(): Promise<boolean> {
    if (battleChoicePendingRef.current) {
      appBattleDebugLog("auto advance 被 pending 阻止", {
        screen,
        pending: battleChoicePendingRef.current,
        battle: battleStateDebugSnapshot(battle),
      });
      return false;
    }
    const startedAt = performance.now();
    appBattleDebugLog("auto advance start", {
      screen,
      battle: battleStateDebugSnapshot(battle),
    });
    battleChoicePendingRef.current = true;
    setBattleChoicePending(true);
    try {
      const ok = await runAction(() => window.changeBattle!.autoAdvanceBattle(), undefined, false);
      appBattleDebugLog("auto advance finished", {
        ok,
        elapsedMs: Math.round(performance.now() - startedAt),
      });
      return ok;
    } finally {
      battleChoicePendingRef.current = false;
      setBattleChoicePending(false);
      appBattleDebugLog("auto advance pending cleared", {
        elapsedMs: Math.round(performance.now() - startedAt),
      });
    }
  }

  async function battleHint(): Promise<BattleAiHint> {
    if (battleChoicePendingRef.current) throw new Error("上一条战斗指令仍在处理，请稍等。");
    return window.changeBattle!.battleHint();
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
    const canOpenDex = screen === "mainMenu" || (BATTLE_SCREENS.includes(screen) && battleHasDexTalent) || screen === "rest";
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

  const content = guardedRedirect ? null : (
    <RouteRenderer
      screen={screen}
      save={save}
      trainerName={trainerName}
      setTrainerName={setTrainerName}
      trainerCatalog={trainerCatalog}
      selectedPlayerId={selectedPlayerId}
      setSelectedPlayerId={setSelectedPlayerId}
      selectedAvatarAsset={selectedAvatarAsset}
      setSelectedAvatarAsset={setSelectedAvatarAsset}
      seed={seed}
      candidates={candidates}
      selected={selected}
      focusIndex={focusIndex}
      setFocusIndex={setFocusIndex}
      starter={starter}
      inspectedIndexes={inspectedIndexes}
      inspectRemaining={inspectRemaining}
      battle={battle}
      lastBattleSnapshot={lastBattleSnapshot}
      battleBag={battleBag}
      battleChoicePending={battleChoicePending}
      exchange={exchange}
      rest={rest}
      resultSummary={resultSummary}
      pendingTransition={pendingTransition}
      message={message}
      battleAnimationSpeed={battleAnimationSpeed}
      battleScreens={BATTLE_SCREENS}
      saveStarNodeLevel={saveStarNodeLevel}
      hasStarterItemChoices={hasStarterItemChoices}
      loadGame={loadGame}
      createTitleSave={createTitleSave}
      deleteSave={deleteSave}
      createNewGame={createNewGame}
      setSave={setSave}
      navigateToScreen={navigateToScreen}
      prepareChallenge={prepareChallenge}
      enableTestMode={enableTestMode}
      startRainbowRocketTestRun={startRainbowRocketTestRun}
      chooseStarterItem={chooseStarterItem}
      cancelPreparation={cancelPreparation}
      backToStarterItems={backToStarterItems}
      rerollCandidates={rerollCandidates}
      rerollFocusedCandidate={rerollFocusedCandidate}
      inspectFocusedCandidate={inspectFocusedCandidate}
      toggleCandidate={toggleCandidate}
      beginChallenge={beginChallenge}
      battleChoice={battleChoice}
      autoAdvanceBattle={autoAdvanceBattle}
      battleHint={battleHint}
      transitionToState={transitionToState}
      applyState={applyState}
      setBattleAnimationSpeed={setBattleAnimationSpeed}
      finishExchange={finishExchange}
      restAction={restAction}
      transitionToScreen={transitionToScreen}
    />
  );

  const isBattleScreen = BATTLE_SCREENS.includes(screen);
  const hideTransientMessage = HIDDEN_MESSAGE_SCREENS.includes(screen);
  const transientMessage = !isBattleScreen && !hideTransientMessage ? message : "";
  const battleHasDexTalent = Boolean(battle?.player_talents?.some(talent => talent.id === "intel_god_eye"));
  const showDexButton = (isBattleScreen && battleHasDexTalent) || screen === "rest";
  const bgmScene = routeTransition?.musicScene || bgmSceneForScreen(screen, battle);

  useEffect(() => {
    if (!showDexButton && dexOpen) setDexOpen(false);
  }, [showDexButton, dexOpen]);

  const gamePage = (
    <GameViewport showVersion={screen === "title"}>
      {content}
      {showDexButton ? <QuickDexButton title="打开图鉴" onClick={openDex} /> : null}
      {dexOpen ? <QuickDexModal onClose={() => setDexOpen(false)} /> : null}
      {loading ? <div className="loading-overlay">正在进入对局...</div> : null}
      {transientMessage ? <ScreenToast message={transientMessage} /> : null}
      {appToast ? <ScreenToast key={appToast.id} message={appToast.message} durationMs={appToast.durationMs ?? 1400} onDone={() => setAppToast(null)} /> : null}
    </GameViewport>
  );

  const transitionPage = routeTransition ? (
    <GameViewport viewportClassName="route-transition-viewport">
      <RouteTransitionPage key={routeTransition.id} title={routeTransition.title} detail={routeTransition.detail} tip={routeTransition.tip} durationMs={routeTransition.durationMs} />
    </GameViewport>
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
