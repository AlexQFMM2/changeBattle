import {contextBridge, ipcRenderer} from "electron";
import type {AudioSettings, BattleAiHint, BattleSetting, BattleState, BattleTrainingConfig, DesktopDexCategory, DesktopDexSearchResult, DesktopGameState, GeneratedTeam, LocalSave, PokemonEditOptions, PricedMove, RestAction, SaveBattleRecordsTable, ShopItem, StarChartState, StarterUpgradeView, TalentView, TrainerCatalogState, TrainerProfile} from "@changebattle/shared";

const api = {
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
  deleteSave(): Promise<void> {
    return ipcRenderer.invoke("save:delete");
  },
  updateTrainer(trainer: TrainerProfile): Promise<LocalSave> {
    return ipcRenderer.invoke("save:updateTrainer", trainer);
  },
  battleRecords(): Promise<SaveBattleRecordsTable> {
    return ipcRenderer.invoke("save:battleRecords");
  },
  enableTestMode(): Promise<LocalSave> {
    return ipcRenderer.invoke("save:testMode");
  },
  startRainbowRocketTestRun(): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:rainbowRocketTest");
  },
  startBattleTraining(config: BattleTrainingConfig): Promise<DesktopGameState> {
    return ipcRenderer.invoke("training:startBattle", config);
  },
  getBattleSetting(): Promise<{setting: BattleSetting; save?: LocalSave | null}> {
    return ipcRenderer.invoke("battleSetting:get");
  },
  updateBattleSetting(setting: BattleSetting): Promise<{setting: BattleSetting; save?: LocalSave | null}> {
    return ipcRenderer.invoke("battleSetting:update", setting);
  },
  getAudioSettings(): Promise<{settings: AudioSettings; save?: LocalSave | null}> {
    return ipcRenderer.invoke("audioSettings:get");
  },
  updateAudioSettings(settings: Partial<AudioSettings>): Promise<{settings: AudioSettings; save?: LocalSave | null}> {
    return ipcRenderer.invoke("audioSettings:update", settings);
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
  cancelPreparation(): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:cancelPreparation");
  },
  getTalentConfig(): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; star_chart?: StarChartState; save?: LocalSave | null}> {
    return ipcRenderer.invoke("talents:get");
  },
  unlockTalent(id: string): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; star_chart?: StarChartState; save?: LocalSave | null}> {
    return ipcRenderer.invoke("talents:unlock", id);
  },
  configureTalents(ids: string[]): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; star_chart?: StarChartState; save?: LocalSave | null}> {
    return ipcRenderer.invoke("talents:configure", ids);
  },
  setNamedChallenge(trainerId: string | null): Promise<{catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; star_chart?: StarChartState; save?: LocalSave | null}> {
    return ipcRenderer.invoke("talents:setNamedChallenge", trainerId);
  },
  getStarterUpgrades(): Promise<{catalog: StarterUpgradeView[]; save?: LocalSave | null}> {
    return ipcRenderer.invoke("starterUpgrades:get");
  },
  upgradeStarter(id: string): Promise<{catalog: StarterUpgradeView[]; save?: LocalSave | null}> {
    return ipcRenderer.invoke("starterUpgrades:upgrade", id);
  },
  rerollStarterCandidate(index: number): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:rerollStarterCandidate", index);
  },
  beginChallenge(selectedIndexes: number[], seed: number, battles?: number): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:beginChallenge", selectedIndexes, seed, battles);
  },
  continueRun(): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:continue");
  },
  battleHint(): Promise<BattleAiHint> {
    return ipcRenderer.invoke("run:battleHint");
  },
  battleChoice(choice: string): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:battleChoice", choice);
  },
  autoAdvanceBattle(): Promise<DesktopGameState> {
    return ipcRenderer.invoke("run:autoAdvanceBattle");
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
  dexSearch(category: DesktopDexCategory, query?: string, offset?: number, limit?: number): Promise<DesktopDexSearchResult> {
    return ipcRenderer.invoke("dex:search", category, query || "", offset || 0, limit || 8);
  },
  getBattleState(): Promise<BattleState | null> {
    return ipcRenderer.invoke("run:getBattleState");
  },
};

if (process.env.CHANGEBATTLE_E2E === "1") {
  Object.assign(api, {
    e2ePatchSave: (patch: Partial<LocalSave>): Promise<LocalSave> => ipcRenderer.invoke("e2e:patchSave", patch),
  });
}

contextBridge.exposeInMainWorld("changeBattle", api);
