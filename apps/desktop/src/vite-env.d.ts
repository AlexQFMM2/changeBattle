/// <reference types="vite/client" />

import type {AudioSettings, BattleSetting, BattleState, DesktopDexCategory, DesktopDexSearchResult, DesktopGameState, GeneratedTeam, LocalSave, PokemonEditOptions, PricedMove, RestAction, SaveBattleRecordsTable, ShopItem, StarChartState, StarterUpgradeView, TalentView, TrainerCatalogState, TrainerProfile} from "@changebattle/shared";
import type {BattleDisplayStep} from "./components/battle/timelineFlow";
import type {BrowserTestScenario} from "./web/browserTestBridge";

declare global {
  interface Window {
    changeBattle?: {
      generateCandidates(seed?: number): Promise<GeneratedTeam>;
      assetUrl(relativePath: string): string;
      loadSave(): Promise<LocalSave | null>;
      createNewSave(trainer: TrainerProfile): Promise<LocalSave>;
      deleteSave(): Promise<void>;
      updateTrainer(trainer: TrainerProfile): Promise<LocalSave>;
      battleRecords(): Promise<SaveBattleRecordsTable>;
      enableTestMode(): Promise<LocalSave>;
      getBattleSetting(): Promise<{setting: BattleSetting; save?: LocalSave | null}>;
      updateBattleSetting(setting: BattleSetting): Promise<{setting: BattleSetting; save?: LocalSave | null}>;
      getAudioSettings(): Promise<{settings: AudioSettings; save?: LocalSave | null}>;
      updateAudioSettings(settings: Partial<AudioSettings>): Promise<{settings: AudioSettings; save?: LocalSave | null}>;
      trainerCatalog(): Promise<TrainerCatalogState>;
      prepareCandidates(seed?: number): Promise<DesktopGameState>;
      prepareStarterItems(seed?: number): Promise<DesktopGameState>;
      chooseStarterItem(offerId?: string | null): Promise<DesktopGameState>;
      cancelPreparation(): Promise<DesktopGameState>;
      getTalentConfig(): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; star_chart?: StarChartState; save?: LocalSave | null}>;
      unlockTalent(id: string): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; star_chart?: StarChartState; save?: LocalSave | null}>;
      configureTalents(ids: string[]): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; star_chart?: StarChartState; save?: LocalSave | null}>;
      setNamedChallenge(trainerId: string | null): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; star_chart?: StarChartState; save?: LocalSave | null}>;
      getStarterUpgrades(): Promise<{catalog: StarterUpgradeView[]; save?: LocalSave | null}>;
      upgradeStarter(id: string): Promise<{catalog: StarterUpgradeView[]; save?: LocalSave | null}>;
      rerollStarterCandidate(index: number): Promise<DesktopGameState>;
      beginChallenge(selectedIndexes: number[], seed: number, battles?: number): Promise<DesktopGameState>;
      continueRun(): Promise<DesktopGameState>;
      battleChoice(choice: string): Promise<DesktopGameState>;
      autoAdvanceBattle(): Promise<DesktopGameState>;
      exchange(ownIndex: number | null, enemyIndex: number | null): Promise<DesktopGameState>;
      restAction(action: RestAction): Promise<DesktopGameState>;
      shopItems(query?: string): Promise<ShopItem[]>;
      learnableMoves(slot: number, query?: string): Promise<PricedMove[]>;
      editOptions(slot: number): Promise<PokemonEditOptions>;
      dexSearch(category: DesktopDexCategory, query?: string, offset?: number, limit?: number): Promise<DesktopDexSearchResult>;
      getBattleState(): Promise<BattleState | null>;
      e2ePatchSave?(patch: Partial<LocalSave>): Promise<LocalSave>;
    };
    __changeBattleTest?: {
      getScenario(): BrowserTestScenario;
      getLastAction(): string;
      getState(): DesktopGameState | null;
      getBattle(): BattleState | null;
      getTimelineSteps(): BattleDisplayStep[];
      getInitialState(): DesktopGameState | null;
    };
  }
}
