import type {ChangeBattleRuntimeApi} from "@changebattle/game-runtime";
import type {AudioSettings, BattleSetting, DesktopDexCategory, LocalSave, RestAction, TrainerProfile} from "@changebattle/shared";

export type DesktopIpcHandler = (channel: string, handler: (...args: any[]) => Promise<unknown> | unknown) => void;

export type RegisterDesktopRuntimeIpcOptions = {
  e2ePatchSave?: (patch: Partial<LocalSave>) => Promise<LocalSave>;
};

export function registerDesktopRuntimeIpc(
  handleIpc: DesktopIpcHandler,
  api: ChangeBattleRuntimeApi,
  options: RegisterDesktopRuntimeIpcOptions = {},
): void {
  handleIpc("save:load", async () => api.loadSave());
  handleIpc("save:createNew", async (trainer: TrainerProfile) => api.createNewSave(trainer));
  handleIpc("save:delete", async () => api.deleteSave());
  handleIpc("save:updateTrainer", async (trainer: TrainerProfile) => api.updateTrainer(trainer));
  handleIpc("save:battleRecords", async () => api.battleRecords());
  handleIpc("save:testMode", async () => api.enableTestMode());
  if (api.startRainbowRocketTestRun) handleIpc("run:rainbowRocketTest", async () => api.startRainbowRocketTestRun!());
  if (options.e2ePatchSave) {
    handleIpc("e2e:patchSave", async (patch: Partial<LocalSave>) => options.e2ePatchSave!(patch));
  }
  handleIpc("battleSetting:get", async () => api.getBattleSetting());
  handleIpc("battleSetting:update", async (setting: Partial<BattleSetting>) => api.updateBattleSetting(setting));
  handleIpc("audioSettings:get", async () => api.getAudioSettings());
  handleIpc("audioSettings:update", async (settings: Partial<AudioSettings>) => api.updateAudioSettings(settings));
  handleIpc("trainer:catalog", async () => api.trainerCatalog());
  handleIpc("game:generateCandidates", async (seed?: number) => api.generateCandidates(seed));
  handleIpc("run:prepareStarterItems", async (seed?: number) => api.prepareStarterItems(seed));
  handleIpc("run:chooseStarterItem", async (offerId?: string | null) => api.chooseStarterItem(offerId || null));
  handleIpc("run:cancelPreparation", async () => api.cancelPreparation());
  handleIpc("talents:get", async () => api.getTalentConfig());
  handleIpc("talents:unlock", async (id: string) => api.unlockTalent(id));
  handleIpc("talents:configure", async (ids: string[]) => api.configureTalents(ids));
  handleIpc("talents:setNamedChallenge", async (trainerId: string | null) => api.setNamedChallenge(trainerId));
  handleIpc("starterUpgrades:get", async () => api.getStarterUpgrades());
  handleIpc("starterUpgrades:upgrade", async (id: string) => api.upgradeStarter(id));
  handleIpc("run:prepareCandidates", async (seed?: number) => api.prepareCandidates(seed));
  handleIpc("run:rerollStarterCandidate", async (index: number) => api.rerollStarterCandidate(index));
  handleIpc("run:beginChallenge", async (selectedIndexes: number[], seed: number, battles?: number) => api.beginChallenge(selectedIndexes, seed, battles));
  handleIpc("run:continue", async () => api.continueRun());
  handleIpc("run:battleChoice", async (choice: string) => api.battleChoice(choice));
  handleIpc("run:autoAdvanceBattle", async () => api.autoAdvanceBattle());
  handleIpc("run:exchange", async (ownIndex: number | null, enemyIndex: number | null) => api.exchange(ownIndex, enemyIndex));
  handleIpc("run:restAction", async (action: RestAction) => api.restAction(action));
  handleIpc("shop:items", async (query?: string) => api.shopItems(query || ""));
  handleIpc("pokemon:learnableMoves", async (slot: number, query?: string) => api.learnableMoves(slot, query || ""));
  handleIpc("pokemon:editOptions", async (slot: number) => api.editOptions(slot));
  handleIpc("dex:search", async (category: DesktopDexCategory, query?: string, offset?: number, limit?: number) => api.dexSearch(category, query || "", offset || 0, limit || 8));
  handleIpc("run:getBattleState", async () => api.getBattleState());
}
