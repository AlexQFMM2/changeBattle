import type {AppStatus, BagCategoryView, BattleAiHint, BattleState, DesktopGameState, LocalSave, RentalPokemon, RestAction, ResultSummaryState, TrainerCatalogState} from "@changebattle/shared";
import {PlayerSettings} from "../../pages/player/PlayerSettings";
import {BattleHistoryView} from "../../pages/result/BattleHistoryView";
import {ResultView} from "../../pages/result/ResultView";
import {ExchangeView, RestView} from "../../pages/rest/RestView";
import {MainMenu, TitleScreen} from "../../pages/shell/ShellScreens";
import {BattleSettingPage, RentalSelect, StarterItemsView, StarterUpgradePage, TalentConfigView} from "../../pages/setup/SetupPages";
import {BattleView} from "../../pages/battle/BattleView";
import type {RouteTransitionReason} from "../../pages/shell/RouteTransitionPage";
import "./RouteRenderer.css";

type BattleAnimationSpeed = 1 | 2;

export type RouteRendererProps = {
  screen: AppStatus;
  save: LocalSave | null;
  trainerName: string;
  setTrainerName: (name: string) => void;
  trainerCatalog: TrainerCatalogState;
  selectedPlayerId: string;
  setSelectedPlayerId: (id: string) => void;
  selectedAvatarAsset: string;
  setSelectedAvatarAsset: (asset: string) => void;
  seed: number;
  candidates: RentalPokemon[];
  selected: number[];
  focusIndex: number;
  setFocusIndex: (index: number) => void;
  starter: DesktopGameState["starter"];
  inspectedIndexes: Set<number>;
  inspectRemaining: number;
  battle: BattleState | null;
  lastBattleSnapshot: BattleState | null;
  battleBag: BagCategoryView | null;
  battleChoicePending: boolean;
  exchange: DesktopGameState["exchange"];
  rest: DesktopGameState["rest"];
  resultSummary: ResultSummaryState | null;
  pendingTransition: DesktopGameState | null;
  message: string;
  battleAnimationSpeed: BattleAnimationSpeed;
  battleScreens: AppStatus[];
  saveStarNodeLevel: (save: LocalSave | null | undefined, id: string) => number;
  hasStarterItemChoices: (starter: DesktopGameState["starter"]) => boolean;
  loadGame: () => void;
  createTitleSave: (name: string, playerId: string, avatarAsset: string) => Promise<LocalSave | null>;
  deleteSave: () => void | Promise<void>;
  createNewGame: () => void;
  setSave: (save: LocalSave | null) => void;
  navigateToScreen: (screen: AppStatus, options?: {replace?: boolean}) => void;
  navigateToComponentGallery: () => void;
  prepareChallenge: () => void;
  openStarterUpgrade: () => void;
  enableTestMode: () => void;
  startRainbowRocketTestRun: () => void;
  chooseStarterItem: (offerId: string | null) => void;
  cancelPreparation: () => void;
  backToStarterItems: () => void;
  rerollCandidates: () => void;
  rerollFocusedCandidate: () => void;
  inspectFocusedCandidate: () => void;
  toggleCandidate: (index: number) => void;
  beginChallenge: () => void;
  battleChoice: (choice: string) => Promise<boolean>;
  autoAdvanceBattle: () => Promise<boolean>;
  battleHint: () => Promise<BattleAiHint>;
  transitionToState: (state: DesktopGameState, reason: RouteTransitionReason, options?: {showToastMessage?: boolean}) => void;
  setBattleAnimationSpeed: (speed: BattleAnimationSpeed) => void;
  finishExchange: (ownIndex: number | null, enemyIndex: number | null) => void;
  restAction: (action: RestAction) => Promise<DesktopGameState | false>;
  transitionToScreen: (screen: AppStatus, reason: RouteTransitionReason) => void;
};

export function RouteRenderer(props: RouteRendererProps) {
  const {
    screen,
    save,
    trainerName,
    setTrainerName,
    trainerCatalog,
    selectedPlayerId,
    setSelectedPlayerId,
    selectedAvatarAsset,
    setSelectedAvatarAsset,
    seed,
    candidates,
    selected,
    focusIndex,
    setFocusIndex,
    starter,
    inspectedIndexes,
    inspectRemaining,
    battle,
    lastBattleSnapshot,
    battleBag,
    battleChoicePending,
    exchange,
    rest,
    resultSummary,
    pendingTransition,
    message,
    battleAnimationSpeed,
    battleScreens,
    saveStarNodeLevel,
    hasStarterItemChoices,
    loadGame,
    createTitleSave,
    deleteSave,
    createNewGame,
    setSave,
    navigateToScreen,
    navigateToComponentGallery,
    prepareChallenge,
    openStarterUpgrade,
    enableTestMode,
    startRainbowRocketTestRun,
    chooseStarterItem,
    cancelPreparation,
    backToStarterItems,
    rerollCandidates,
    rerollFocusedCandidate,
    inspectFocusedCandidate,
    toggleCandidate,
    beginChallenge,
    battleChoice,
    autoAdvanceBattle,
    battleHint,
    transitionToState,
    setBattleAnimationSpeed,
    finishExchange,
    restAction,
    transitionToScreen,
  } = props;

  if (screen === "title") return <TitleScreen save={save} catalog={trainerCatalog} defaultAvatarAsset={trainerCatalog.players[0]?.avatar_asset || trainerCatalog.avatars[0]?.avatar_asset} onLoad={loadGame} onNew={() => { setTrainerName("训练师"); }} onCreate={createTitleSave} onDelete={deleteSave} onComponentGallery={navigateToComponentGallery} />;
  if (screen === "newGame") return <PlayerSettings title="训练师登记" name={trainerName} setName={setTrainerName} catalog={trainerCatalog} selectedPlayerId={selectedPlayerId} setSelectedPlayerId={setSelectedPlayerId} selectedAvatarAsset={selectedAvatarAsset} setSelectedAvatarAsset={setSelectedAvatarAsset} onSave={createNewGame} onBack={() => navigateToScreen("title")} saveLabel="创建存档" />;
  if (screen === "mainMenu") return <MainMenu save={save} onStart={prepareChallenge} onTalent={() => navigateToScreen("talentConfig")} onStarterUpgrade={openStarterUpgrade} onHistory={() => navigateToScreen("battleHistory")} onBattleSetting={() => navigateToScreen("battleSetting")} onTitle={() => navigateToScreen("title")} onTestMode={enableTestMode} onRainbowRocketTest={startRainbowRocketTestRun} />;
  if (screen === "userInfo") return <PlayerSettings title="玩家设置" save={save} name={save?.trainer.name || trainerName} catalog={trainerCatalog} onSaved={setSave} onBack={() => navigateToScreen("mainMenu")} saveLabel="保存设置" />;
  if (screen === "talentConfig") return <TalentConfigView save={save} onSaved={setSave} onBack={() => navigateToScreen("mainMenu")} />;
  if (screen === "starterUpgrade") return <StarterUpgradePage save={save} onSaved={setSave} onBack={() => navigateToScreen("mainMenu")} />;
  if (screen === "battleHistory") return <BattleHistoryView onBack={() => navigateToScreen("mainMenu")} />;
  if (screen === "battleSetting") return <BattleSettingPage save={save} onSaved={setSave} onBack={() => navigateToScreen("mainMenu")} />;
  if (screen === "starterItems") return <StarterItemsView starter={starter} onChoose={chooseStarterItem} onBack={cancelPreparation} />;
  if (screen === "rentalSelect") return <RentalSelect candidates={candidates} selected={selected} focusIndex={focusIndex} setFocusIndex={setFocusIndex} onToggle={toggleCandidate} onStart={() => beginChallenge()} onBack={hasStarterItemChoices(starter) ? backToStarterItems : undefined} onReroll={rerollCandidates} onSingleReroll={rerollFocusedCandidate} onInspect={inspectFocusedCandidate} runSeed={seed} wholeRerollsRemaining={starter?.whole_rerolls_remaining ?? 0} singleRerollsRemaining={starter?.single_rerolls_remaining ?? 0} inspectRemaining={inspectRemaining} revealTraining={saveStarNodeLevel(save, "intel_god_eye") >= 3 || inspectedIndexes.has(focusIndex)} inspected={inspectedIndexes.has(focusIndex)} />;
  if (battleScreens.includes(screen)) return <BattleView battle={battle} battleBag={battleBag} mode={screen} setMode={navigateToScreen} onChoice={battleChoice} onAutoAdvance={autoAdvanceBattle} onBattleHint={battleHint} choicePending={battleChoicePending} pendingTransition={pendingTransition} onBattleAnimationDone={state => transitionToState(state, "battleComplete")} battleAnimationSpeed={battleAnimationSpeed} onBattleAnimationSpeedChange={setBattleAnimationSpeed} />;
  if (screen === "exchange") return <ExchangeView exchange={exchange} onSkip={() => finishExchange(null, null)} onExchange={finishExchange} />;
  if (screen === "rest") return <RestView rest={rest} onAction={restAction} />;
  if (screen === "result") return <ResultView message={message} battle={battle || lastBattleSnapshot} summary={resultSummary} onBack={() => transitionToScreen("mainMenu", "returnHome")} />;
  return null;
}
