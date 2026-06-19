import type {ChangeBattleRuntimeApi} from "@changebattle/game-runtime";
import type {
  AudioSettings,
  BattleAiHint,
  BattleSetting,
  BattleState,
  BattleTrainingConfig,
  BattleTrainingOptions,
  BattleTrainingPokemonConfig,
  CurrentRunData,
  DesktopDexCategory,
  DesktopDexSearchResult,
  DesktopGameState,
  GeneratedTeam,
  LocalSave,
  PokemonEditOptions,
  PricedMove,
  RestAction,
  SaveBattleRecordsTable,
  ShopItem,
  StarChartState,
  StarterUpgradeView,
  TalentView,
  TrainerCatalogState,
  TrainerProfile,
} from "@changebattle/shared";

type TalentConfigState = {catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; star_chart?: StarChartState; save?: LocalSave | null};
type StarterUpgradeConfigState = {catalog: StarterUpgradeView[]; save?: LocalSave | null};

export type DesktopRuntimeApiDeps = {
  generateCandidates(seed?: number): Promise<GeneratedTeam>;
  loadSave(): Promise<LocalSave | null>;
  createNewSave(trainer: TrainerProfile): Promise<LocalSave>;
  deleteSave(): Promise<void>;
  updateTrainer(trainer: TrainerProfile): Promise<LocalSave>;
  battleRecords(): Promise<SaveBattleRecordsTable>;
  enableTestMode(): Promise<LocalSave>;
  startRainbowRocketTestRun?(): Promise<DesktopGameState>;
  startBattleTraining(config: BattleTrainingConfig): Promise<DesktopGameState>;
  generateBattleTrainingPokemon(species: string, seed?: number): Promise<BattleTrainingPokemonConfig>;
  battleTrainingOptions(): Promise<BattleTrainingOptions>;
  getBattleSetting(): Promise<{setting: BattleSetting; save?: LocalSave | null}>;
  updateBattleSetting(setting: Partial<BattleSetting>): Promise<{setting: BattleSetting; save?: LocalSave | null}>;
  getAudioSettings(): Promise<{settings: AudioSettings; save?: LocalSave | null}>;
  updateAudioSettings(settings: Partial<AudioSettings>): Promise<{settings: AudioSettings; save?: LocalSave | null}>;
  trainerCatalog(): Promise<TrainerCatalogState>;
  prepareCandidates(seed?: number): Promise<DesktopGameState>;
  prepareStarterItems(seed?: number): Promise<DesktopGameState>;
  chooseStarterItem(offerId?: string | null): Promise<DesktopGameState>;
  cancelPreparation(): Promise<DesktopGameState>;
  getTalentConfig(): Promise<TalentConfigState>;
  unlockTalent(id: string): Promise<TalentConfigState>;
  configureTalents(ids: string[]): Promise<TalentConfigState>;
  setNamedChallenge(trainerId: string | null): Promise<TalentConfigState>;
  getStarterUpgrades(): Promise<StarterUpgradeConfigState>;
  upgradeStarter(id: string): Promise<StarterUpgradeConfigState>;
  rerollStarterCandidate(index: number): Promise<DesktopGameState>;
  beginChallenge(selectedIndexes: number[], seed: number, battles?: number): Promise<DesktopGameState>;
  continueRun(): Promise<DesktopGameState>;
  battleHint(): Promise<BattleAiHint>;
  battleChoice(choice: string): Promise<DesktopGameState>;
  autoAdvanceBattle(): Promise<DesktopGameState>;
  exchange(ownIndex: number | null, enemyIndex: number | null): Promise<DesktopGameState>;
  restAction(action: RestAction): Promise<DesktopGameState>;
  shopItems(query?: string): Promise<ShopItem[]>;
  learnableMoves(slot: number, query?: string): Promise<PricedMove[]>;
  editOptions(slot: number): Promise<PokemonEditOptions>;
  dexSearch(category: DesktopDexCategory, query?: string, offset?: number, limit?: number): Promise<DesktopDexSearchResult>;
  getBattleState(): Promise<BattleState | null>;
};

export function desktopRuntimeAssetUrl(relativePath: string): string {
  if (/^https?:\/\//i.test(relativePath)) return relativePath;
  const safePath = relativePath.split("/").map(part => encodeURIComponent(part)).join("/");
  return `changebattle-asset://local/${safePath}`;
}

export function createDesktopRuntimeApi(deps: DesktopRuntimeApiDeps): ChangeBattleRuntimeApi {
  return {
    generateCandidates: deps.generateCandidates,
    assetUrl: desktopRuntimeAssetUrl,
    loadSave: deps.loadSave,
    createNewSave: deps.createNewSave,
    deleteSave: deps.deleteSave,
    updateTrainer: deps.updateTrainer,
    battleRecords: deps.battleRecords,
    enableTestMode: deps.enableTestMode,
    startRainbowRocketTestRun: deps.startRainbowRocketTestRun,
    startBattleTraining: deps.startBattleTraining,
    generateBattleTrainingPokemon: deps.generateBattleTrainingPokemon,
    battleTrainingOptions: deps.battleTrainingOptions,
    getBattleSetting: deps.getBattleSetting,
    updateBattleSetting: deps.updateBattleSetting,
    getAudioSettings: deps.getAudioSettings,
    updateAudioSettings: deps.updateAudioSettings,
    trainerCatalog: deps.trainerCatalog,
    prepareCandidates: deps.prepareCandidates,
    prepareStarterItems: deps.prepareStarterItems,
    chooseStarterItem: async offerId => deps.chooseStarterItem(offerId || null),
    cancelPreparation: deps.cancelPreparation,
    getTalentConfig: deps.getTalentConfig,
    unlockTalent: deps.unlockTalent,
    configureTalents: deps.configureTalents,
    setNamedChallenge: deps.setNamedChallenge,
    getStarterUpgrades: deps.getStarterUpgrades,
    upgradeStarter: deps.upgradeStarter,
    rerollStarterCandidate: deps.rerollStarterCandidate,
    beginChallenge: deps.beginChallenge,
    continueRun: deps.continueRun,
    battleHint: deps.battleHint,
    battleChoice: deps.battleChoice,
    autoAdvanceBattle: deps.autoAdvanceBattle,
    exchange: deps.exchange,
    restAction: deps.restAction,
    shopItems: async query => deps.shopItems(query || ""),
    learnableMoves: async (slot, query) => deps.learnableMoves(slot, query || ""),
    editOptions: deps.editOptions,
    dexSearch: async (category, query, offset, limit) => deps.dexSearch(category, query || "", offset || 0, limit || 8),
    getBattleState: deps.getBattleState,
  };
}

export function activeBattleStateGetter(options: {
  loadSave(): Promise<LocalSave | null>;
  activeBattleState(): BattleState | null;
  decorateBattleState(state: BattleState, run?: CurrentRunData | null): BattleState;
}): () => Promise<BattleState | null> {
  return async () => {
    const save = await options.loadSave();
    const state = options.activeBattleState();
    return state ? options.decorateBattleState(state, save?.current_run as CurrentRunData | null) : null;
  };
}
