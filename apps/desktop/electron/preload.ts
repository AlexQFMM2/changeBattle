import {contextBridge, ipcRenderer} from "electron";
import type {BattleState, DesktopGameState, GeneratedTeam, LocalSave, PokemonEditOptions, PricedMove, RestAction, ShopItem, TalentView, TrainerCatalogState, TrainerProfile} from "@changebattle/shared";

contextBridge.exposeInMainWorld("changeBattle", {
  generateCandidates(seed?: number): Promise<GeneratedTeam> {
    return ipcRenderer.invoke("game:generateCandidates", seed);
  },
  assetUrl(relativePath: string): string {
    if (/^https?:\/\//i.test(relativePath)) return relativePath;
    const safePath = relativePath.split("/").map(part => encodeURIComponent(part)).join("/");
    return `changebattle-asset://local/${safePath}`;
  },
  loadSave(): Promise<LocalSave | null> {
    return ipcRenderer.invoke("save:load");
  },
  createNewSave(trainer: TrainerProfile): Promise<LocalSave> {
    return ipcRenderer.invoke("save:createNew", trainer);
  },
  updateTrainer(trainer: TrainerProfile): Promise<LocalSave> {
    return ipcRenderer.invoke("save:updateTrainer", trainer);
  },
  trainerCatalog(): Promise<TrainerCatalogState> {
    return ipcRenderer.invoke("trainer:catalog");
  },
  prepareCandidates(seed?: number): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:prepareCandidates", seed);
  },
  prepareStarterItems(seed?: number): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:prepareStarterItems", seed);
  },
  chooseStarterItem(offerId?: string | null): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:chooseStarterItem", offerId || null);
  },
  getTalentConfig(): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; save?: LocalSave | null}> {
    return ipcRenderer.invoke("talents:get");
  },
  unlockTalent(id: string): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; save?: LocalSave | null}> {
    return ipcRenderer.invoke("talents:unlock", id);
  },
  configureTalents(ids: string[]): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; save?: LocalSave | null}> {
    return ipcRenderer.invoke("talents:configure", ids);
  },
  beginChallenge(selectedIndexes: number[], seed: number, battles?: number): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:beginChallenge", selectedIndexes, seed, battles);
  },
  continueRun(): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:continue");
  },
  battleChoice(choice: string): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:battleChoice", choice);
  },
  secondTeamRoar(useRescue: boolean): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:secondTeamRoar", useRescue);
  },
  exchange(ownIndex: number | null, enemyIndex: number | null): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:exchange", ownIndex, enemyIndex);
  },
  restAction(action: RestAction): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:restAction", action);
  },
  shopItems(query?: string): Promise<ShopItem[]> {
    return ipcRenderer.invoke("shop:items", query);
  },
  learnableMoves(slot: number, query?: string): Promise<PricedMove[]> {
    return ipcRenderer.invoke("pokemon:learnableMoves", slot, query);
  },
  editOptions(slot: number): Promise<PokemonEditOptions> {
    return ipcRenderer.invoke("pokemon:editOptions", slot);
  },
  getBattleState(): Promise<BattleState | null> {
    return ipcRenderer.invoke("run:getBattleState");
  },
});
