/// <reference types="vite/client" />

import type {BattleState, DesktopDexCategory, DesktopDexSearchResult, DesktopGameState, GeneratedTeam, LocalSave, PokemonEditOptions, PricedMove, RestAction, ShopItem, StarterUpgradeView, TalentView, TrainerCatalogState, TrainerProfile} from "@changebattle/shared";

declare global {
  interface Window {
    changeBattle?: {
      generateCandidates(seed?: number): Promise<GeneratedTeam>;
      assetUrl(relativePath: string): string;
      loadSave(): Promise<LocalSave | null>;
      createNewSave(trainer: TrainerProfile): Promise<LocalSave>;
      updateTrainer(trainer: TrainerProfile): Promise<LocalSave>;
      enableTestMode(): Promise<LocalSave>;
      trainerCatalog(): Promise<TrainerCatalogState>;
      prepareCandidates(seed?: number): Promise<DesktopGameState>;
      prepareStarterItems(seed?: number): Promise<DesktopGameState>;
      chooseStarterItem(offerId?: string | null): Promise<DesktopGameState>;
      cancelPreparation(): Promise<DesktopGameState>;
      getTalentConfig(): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; save?: LocalSave | null}>;
      unlockTalent(id: string): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; save?: LocalSave | null}>;
      configureTalents(ids: string[]): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; save?: LocalSave | null}>;
      setNamedChallenge(trainerId: string | null): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; save?: LocalSave | null}>;
      getStarterUpgrades(): Promise<{catalog: StarterUpgradeView[]; save?: LocalSave | null}>;
      upgradeStarter(id: string): Promise<{catalog: StarterUpgradeView[]; save?: LocalSave | null}>;
      rerollStarterCandidate(index: number): Promise<DesktopGameState>;
      beginChallenge(selectedIndexes: number[], seed: number, battles?: number): Promise<DesktopGameState>;
      continueRun(): Promise<DesktopGameState>;
      battleChoice(choice: string): Promise<DesktopGameState>;
      exchange(ownIndex: number | null, enemyIndex: number | null): Promise<DesktopGameState>;
      restAction(action: RestAction): Promise<DesktopGameState>;
      shopItems(query?: string): Promise<ShopItem[]>;
      learnableMoves(slot: number, query?: string): Promise<PricedMove[]>;
      editOptions(slot: number): Promise<PokemonEditOptions>;
      dexSearch(category: DesktopDexCategory, query?: string, offset?: number, limit?: number): Promise<DesktopDexSearchResult>;
      getBattleState(): Promise<BattleState | null>;
    };
  }
}
