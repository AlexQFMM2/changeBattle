import {useEffect, useMemo, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import type {AppStatus, BagCategoryView, BattleState, DesktopGameState, LocalSave, RentalPokemon, RestAction, ResultSummaryState, TrainerCatalogState} from "@changebattle/shared";
import {useResponsiveCanvas} from "./hooks/useResponsiveCanvas";
import "./styles.css";
import {ScreenToast} from "./components/feedback/ScreenToast";
import {QuickDexModal} from "./pages/dex/QuickDexModal";
import {PlayerSettings} from "./pages/player/PlayerSettings";
import {ResultView} from "./pages/result/ResultView";
import {ExchangeView, RestView} from "./pages/rest/RestView";
import {MainMenu, TitleScreen} from "./pages/shell/ShellScreens";
import {RentalSelect, StarterItemsView, StarterUpgradePage, TalentConfigView} from "./pages/setup/SetupPages";
import {BattleView} from "./pages/battle/BattleView";
import {TALENT_CATALOG, debugBattle, debugPokemon, hasStarterItemChoices, mergeBattleSnapshot, profileFromSelection, userFacingError} from "./lib/ui";
function installBrowserAutomationBridge() {
  if (!import.meta.env.DEV || !new URLSearchParams(location.search).has("automated") || window.changeBattle) return;
  const save: LocalSave = {version: 1, bp_scale: 1, trainer: {name: "自动测试", gender: "other"}, stats: {battle_points: 99, battles: 0, wins: 0, losses: 0, rank_status: "未开放"}, talent_unlocks: [], talent_equipped: [], starter_upgrades: {}, current_run: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString()};
  const candidates = Array.from({length: 6}, (_, index) => debugPokemon(`Candidate${index + 1}`, `候选${index + 1}`));
  window.changeBattle = {
    generateCandidates: async () => ({seed: [1, 2, 3, 4], team: candidates.map(pokemon => ({species: pokemon.species})), display: candidates, packed: ""}),
    assetUrl: path => path,
    loadSave: async () => save,
    createNewSave: async trainer => ({...save, trainer}),
    deleteSave: async () => undefined,
    updateTrainer: async trainer => ({...save, trainer}),
    enableTestMode: async () => ({...save, stats: {...save.stats, battle_points: 99999}}),
    trainerCatalog: async () => ({
      players: [{id: "player:debug", type: "player", name_zh: "斗也", front_asset: "assets/npc/player-front/斗也-bw_black.png", back_asset: "assets/npc/player-back/斗也-bw_touya_back.png", avatar_asset: "assets/npc/avatars/斗也-blackchallenge.png"}],
      avatars: [{id: "avatar:debug", type: "avatar", name_zh: "斗也", avatar_asset: "assets/npc/avatars/斗也-blackchallenge.png"}],
      champions: [{id: "champion:debug", type: "champion", name_zh: "调试冠军", front_asset: "assets/npc/normal/dp_battle_girl-2-dp_battle_girl.png"}],
    }),
    prepareStarterItems: async () => ({screen: "starterItems", save, starter: {seed: 1, coins: 0, offers: [], purchased: null}, message: "自动测试开局道具"}),
    chooseStarterItem: async () => ({screen: "rentalSelect", save, candidates: {seed: [1, 2, 3, 4], team: candidates.map(pokemon => ({species: pokemon.species})), display: candidates, packed: ""}, selected_indexes: [], message: "自动测试候选"}),
    cancelPreparation: async () => ({screen: "mainMenu", save, message: "自动测试返回主菜单"}),
    getTalentConfig: async () => ({catalog: TALENT_CATALOG, unlocked: [], equipped: []}),
    unlockTalent: async () => ({catalog: TALENT_CATALOG, unlocked: [], equipped: [], save}),
    configureTalents: async () => ({catalog: TALENT_CATALOG, unlocked: [], equipped: [], save}),
    setNamedChallenge: async trainerId => {
      save.named_champion_id = trainerId;
      return {catalog: TALENT_CATALOG, unlocked: [], equipped: [], save};
    },
    getStarterUpgrades: async () => ({catalog: [], save}),
    upgradeStarter: async () => ({catalog: [], save}),
    prepareCandidates: async () => ({screen: "rentalSelect", save, candidates: {seed: [1, 2, 3, 4], team: candidates.map(pokemon => ({species: pokemon.species})), display: candidates, packed: ""}, selected_indexes: [], message: "自动测试候选"}),
    rerollStarterCandidate: async () => ({screen: "rentalSelect", save, starter: {seed: 1, coins: 0, offers: [], purchased: null, single_rerolls_remaining: 0, inspect_count: 0}, candidates: {seed: [1, 2, 3, 4], team: candidates.map(pokemon => ({species: pokemon.species})), display: candidates, packed: ""}, selected_indexes: [], message: "自动测试单只重随"}),
    beginChallenge: async () => ({screen: "battleMain", save, battle: debugBattle(false), message: "自动测试对局"}),
    continueRun: async () => ({screen: "battleMain", save, battle: debugBattle(false), message: "自动测试对局"}),
    battleChoice: async () => ({screen: "battleMain", save, battle: debugBattle(true), message: "自动测试胜利", pending_transition: {screen: "result", save, battle: debugBattle(true), message: "自动测试结算"}}),
    exchange: async () => ({screen: "result", save, message: "自动测试交换"}),
    restAction: async () => ({screen: "mainMenu", save, message: "自动测试休整"}),
    shopItems: async () => [],
    learnableMoves: async () => [],
    editOptions: async () => ({abilities: [], natures: []}),
    dexSearch: async (category, query = "", offset = 0, limit = 8) => ({
      category,
      query,
      offset,
      limit,
      total: 1,
      has_more: false,
      entries: [{id: "debug", name: "Debug", name_zh: "调试条目", category, desc_zh: "自动测试图鉴条目。"}],
    }),
    getBattleState: async () => debugBattle(false),
  };
}

installBrowserAutomationBridge();

function App() {
  const responsiveCanvas = useResponsiveCanvas();
  const [screen, setScreen] = useState<AppStatus>("title");
  const [save, setSave] = useState<LocalSave | null>(null);
  const [trainerName, setTrainerName] = useState("训练师");
  const [trainerCatalog, setTrainerCatalog] = useState<TrainerCatalogState>({players: [], avatars: []});
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedAvatarAsset, setSelectedAvatarAsset] = useState("");
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0xffffffff));
  const [candidates, setCandidates] = useState<RentalPokemon[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [focusIndex, setFocusIndex] = useState(0);
  const [inspectedIndexes, setInspectedIndexes] = useState<Set<number>>(() => new Set());
  const [inspectRemaining, setInspectRemaining] = useState(0);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [lastBattleSnapshot, setLastBattleSnapshot] = useState<BattleState | null>(null);
  const [starter, setStarter] = useState<DesktopGameState["starter"]>(null);
  const [battleBag, setBattleBag] = useState<BagCategoryView | null>(null);
  const [exchange, setExchange] = useState<DesktopGameState["exchange"]>(null);
  const [rest, setRest] = useState<DesktopGameState["rest"]>(null);
  const [resultSummary, setResultSummary] = useState<ResultSummaryState | null>(null);
  const [pendingTransition, setPendingTransition] = useState<DesktopGameState | null>(null);
  const [dexOpen, setDexOpen] = useState(false);
  const [message, setMessage] = useState("欢迎来到 ChangeBattle。选择读取存档或开始新游戏。");
  const [loading, setLoading] = useState(false);
  const [appToast, setAppToast] = useState<{id: number; message: string} | null>(null);
  const [battleChoicePending, setBattleChoicePending] = useState(false);
  const battleChoicePendingRef = useRef(false);

  function showAppToast(message: string) {
    setAppToast({id: Date.now(), message});
  }

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

  function applyState(state: DesktopGameState) {
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
    setScreen(state.screen);
    setMessage(state.message || "");
  }

  async function runAction(action: () => Promise<DesktopGameState | LocalSave | null>, fallbackScreen?: AppStatus, showLoading = true): Promise<boolean> {
    if (showLoading) setLoading(true);
    try {
      const result = await action();
      if (result && "screen" in result) applyState(result);
      else if (result && "trainer" in result) setSave(result);
      if (fallbackScreen) setScreen(fallbackScreen);
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
    });
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
    setScreen("title");
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
    const nextSeed = Math.floor(Math.random() * 0xffffffff);
    setSeed(nextSeed);
    await runAction(() => window.changeBattle!.prepareStarterItems(nextSeed));
  }

  async function chooseStarterItem(offerId: string | null) {
    await runAction(() => window.changeBattle!.chooseStarterItem(offerId));
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
    setScreen("starterUpgrade");
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
    setScreen("starterItems");
    setMessage("已返回开局道具。");
  }

  async function beginChallenge(nextSelected = selected, runSeed = seed) {
    await runAction(() => window.changeBattle!.beginChallenge(nextSelected, runSeed, 7));
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

  async function battleChoice(choice: string) {
    if (battleChoicePendingRef.current) return;
    battleChoicePendingRef.current = true;
    setBattleChoicePending(true);
    try {
      await runAction(() => window.changeBattle!.battleChoice(choice), undefined, false);
    } finally {
      battleChoicePendingRef.current = false;
      setBattleChoicePending(false);
    }
  }

  async function finishExchange(ownIndex: number | null, enemyIndex: number | null) {
    await runAction(() => window.changeBattle!.exchange(ownIndex, enemyIndex));
  }

  async function restAction(action: RestAction): Promise<boolean> {
    return runAction(() => window.changeBattle!.restAction(action), undefined, !["roll_shop", "buy_shop_offer"].includes(action.type));
  }

  function openDex() {
    const battleHasDexTalent = Boolean(battle?.player_talents?.some(talent => talent.id === "intel_god_eye"));
    const canOpenDex = screen === "mainMenu" || (["battleMain", "moveMenu", "teamMenu", "statusMenu"].includes(screen) && battleHasDexTalent);
    if (!canOpenDex) {
      showAppToast("当前页面不能打开图鉴。");
      return;
    }
    setDexOpen(true);
  }

  const content = useMemo(() => {
    if (screen === "title") return <TitleScreen save={save} catalog={trainerCatalog} defaultAvatarAsset={trainerCatalog.players[0]?.avatar_asset || trainerCatalog.avatars[0]?.avatar_asset} onLoad={loadGame} onNew={() => { setTrainerName("训练师"); }} onCreate={createTitleSave} onDelete={deleteSave} />;
    if (screen === "newGame") return <PlayerSettings title="训练师登记" name={trainerName} setName={setTrainerName} catalog={trainerCatalog} selectedPlayerId={selectedPlayerId} setSelectedPlayerId={setSelectedPlayerId} selectedAvatarAsset={selectedAvatarAsset} setSelectedAvatarAsset={setSelectedAvatarAsset} onSave={createNewGame} onBack={() => setScreen("title")} saveLabel="创建存档" />;
    if (screen === "mainMenu") return <MainMenu save={save} onStart={prepareChallenge} onTalent={() => setScreen("talentConfig")} onStarterUpgrade={openStarterUpgrade} onTitle={() => setScreen("title")} onTestMode={enableTestMode} />;
    if (screen === "userInfo") return <PlayerSettings title="玩家设置" save={save} name={save?.trainer.name || trainerName} catalog={trainerCatalog} onSaved={setSave} onBack={() => setScreen("mainMenu")} saveLabel="保存设置" />;
    if (screen === "talentConfig") return <TalentConfigView save={save} onSaved={setSave} onBack={() => setScreen("mainMenu")} />;
    if (screen === "starterUpgrade") return <StarterUpgradePage save={save} onSaved={setSave} onBack={() => setScreen("mainMenu")} />;
    if (screen === "starterItems") return <StarterItemsView starter={starter} onChoose={chooseStarterItem} onBack={cancelPreparation} />;
    if (screen === "rentalSelect") return <RentalSelect candidates={candidates} selected={selected} focusIndex={focusIndex} setFocusIndex={setFocusIndex} onToggle={toggleCandidate} onStart={() => beginChallenge()} onBack={hasStarterItemChoices(starter) ? backToStarterItems : undefined} onReroll={rerollCandidates} onSingleReroll={rerollFocusedCandidate} onInspect={inspectFocusedCandidate} runSeed={seed} wholeRerollsRemaining={starter?.whole_rerolls_remaining ?? 0} singleRerollsRemaining={starter?.single_rerolls_remaining ?? 0} inspectRemaining={inspectRemaining} revealTraining={Boolean(save?.talent_equipped?.includes("intel_god_eye")) || inspectedIndexes.has(focusIndex)} inspected={inspectedIndexes.has(focusIndex)} />;
    if (["battleMain", "moveMenu", "teamMenu", "statusMenu"].includes(screen)) return <BattleView battle={battle} battleBag={battleBag} mode={screen} setMode={setScreen} onChoice={battleChoice} choicePending={battleChoicePending} pendingTransition={pendingTransition} onBattleAnimationDone={applyState} />;
    if (screen === "exchange") return <ExchangeView exchange={exchange} onSkip={() => finishExchange(null, null)} onExchange={finishExchange} />;
    if (screen === "rest") return <RestView rest={rest} message={message} onAction={restAction} />;
    if (screen === "result") return <ResultView message={message} battle={battle || lastBattleSnapshot} summary={resultSummary} onBack={() => setScreen("mainMenu")} />;
    return null;
  }, [screen, save, trainerName, trainerCatalog, selectedPlayerId, selectedAvatarAsset, seed, candidates, selected, focusIndex, starter, inspectedIndexes, inspectRemaining, battle, lastBattleSnapshot, battleBag, battleChoicePending, exchange, rest, resultSummary, pendingTransition, message]);

  const isBattleScreen = ["battleMain", "moveMenu", "teamMenu", "statusMenu"].includes(screen);
  const hideTransientMessage = ["rest", "title", "mainMenu", "talentConfig", "starterUpgrade", "rentalSelect"].includes(screen);
  const transientMessage = !isBattleScreen && !hideTransientMessage ? message : "";
  const battleHasDexTalent = Boolean(battle?.player_talents?.some(talent => talent.id === "intel_god_eye"));
  const showDexButton = isBattleScreen && battleHasDexTalent;

  useEffect(() => {
    if (!showDexButton && dexOpen) setDexOpen(false);
  }, [showDexButton, dexOpen]);

  return (
    <main className="game-shell">
      <section className="game-screen" ref={responsiveCanvas.ref} style={responsiveCanvas.style}>
        <div className="game-viewport">
          {content}
          {showDexButton ? <button className="floating-dex-button" title="打开图鉴" onClick={openDex}>图鉴</button> : null}
          {dexOpen ? <QuickDexModal onClose={() => setDexOpen(false)} /> : null}
          {loading ? <div className="loading-overlay">正在进入对局...</div> : null}
          {transientMessage ? <ScreenToast message={transientMessage} /> : null}
          {appToast ? <ScreenToast key={appToast.id} message={appToast.message} durationMs={1400} onDone={() => setAppToast(null)} /> : null}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
