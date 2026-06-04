/// <reference types="vite/client" />

import type {BattleState, DesktopGameState, GeneratedTeam, LocalSave, TrainerProfile} from "@changebattle/shared";

declare global {
  interface Window {
    changeBattle?: {
      generateCandidates(seed?: number): Promise<GeneratedTeam>;
      assetUrl(relativePath: string): string;
      loadSave(): Promise<LocalSave | null>;
      createNewSave(trainer: TrainerProfile): Promise<LocalSave>;
      updateTrainer(trainer: TrainerProfile): Promise<LocalSave>;
      prepareCandidates(seed?: number): Promise<DesktopGameState>;
      beginChallenge(selectedIndexes: number[], seed: number, battles?: number): Promise<DesktopGameState>;
      continueRun(): Promise<DesktopGameState>;
      battleChoice(choice: string): Promise<DesktopGameState>;
      exchange(ownIndex: number | null, enemyIndex: number | null): Promise<DesktopGameState>;
      getBattleState(): Promise<BattleState | null>;
    };
  }
}
