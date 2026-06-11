import type {ChangeBattleRuntimeApi} from "./api.js";
import type {RuntimeEnvironment} from "./environment.js";
import type {PreparationRuntimeApi} from "./preparation.js";
import type {ProfileSettingsRuntimeApi} from "./profile-settings.js";
import type {ProgressionRuntimeApi} from "./progression.js";
import type {RunPlanningRuntimeApi} from "./run-planning.js";

type RuntimeHandlerOverrides = Partial<Omit<
  ChangeBattleRuntimeApi,
  | "assetUrl"
  | "loadSave"
  | "createNewSave"
  | "deleteSave"
  | "updateTrainer"
  | "battleRecords"
  | "getBattleSetting"
  | "updateBattleSetting"
  | "getAudioSettings"
  | "updateAudioSettings"
  | "trainerCatalog"
  | "prepareCandidates"
  | "prepareStarterItems"
  | "chooseStarterItem"
  | "cancelPreparation"
  | "getTalentConfig"
  | "unlockTalent"
  | "configureTalents"
  | "setNamedChallenge"
  | "getStarterUpgrades"
  | "upgradeStarter"
  | "rerollStarterCandidate"
  | "beginChallenge"
>>;

export type ChangeBattleRuntimeParts = {
  profileSettings: ProfileSettingsRuntimeApi;
  progression: ProgressionRuntimeApi;
  preparation: PreparationRuntimeApi;
  runPlanning: RunPlanningRuntimeApi;
  handlers: RuntimeHandlerOverrides;
};

export function createChangeBattleRuntime(env: Pick<RuntimeEnvironment, "assets">, parts: ChangeBattleRuntimeParts): ChangeBattleRuntimeApi {
  const missing = <Name extends keyof ChangeBattleRuntimeApi>(name: Name): ChangeBattleRuntimeApi[Name] => {
    return (async () => {
      throw new Error(`Runtime handler not implemented: ${String(name)}`);
    }) as unknown as ChangeBattleRuntimeApi[Name];
  };
  return {
    generateCandidates: parts.handlers.generateCandidates || missing("generateCandidates"),
    assetUrl: relativePath => env.assets.assetUrl(relativePath),
    loadSave: parts.profileSettings.loadSave,
    createNewSave: parts.profileSettings.createNewSave,
    deleteSave: parts.profileSettings.deleteSave,
    updateTrainer: parts.profileSettings.updateTrainer,
    battleRecords: parts.profileSettings.battleRecords,
    enableTestMode: parts.handlers.enableTestMode || missing("enableTestMode"),
    getBattleSetting: parts.profileSettings.getBattleSetting,
    updateBattleSetting: parts.profileSettings.updateBattleSetting,
    getAudioSettings: parts.profileSettings.getAudioSettings,
    updateAudioSettings: parts.profileSettings.updateAudioSettings,
    trainerCatalog: parts.profileSettings.trainerCatalog,
    prepareCandidates: parts.preparation.prepareCandidates,
    prepareStarterItems: parts.preparation.prepareStarterItems,
    chooseStarterItem: offerId => parts.preparation.chooseStarterItem(offerId || null),
    cancelPreparation: parts.preparation.cancelPreparation,
    getTalentConfig: parts.progression.talentConfig,
    unlockTalent: parts.progression.unlockTalent,
    configureTalents: parts.progression.configureTalents,
    setNamedChallenge: parts.progression.setNamedChallenge,
    getStarterUpgrades: parts.progression.starterUpgradeConfig,
    upgradeStarter: parts.progression.upgradeStarter,
    rerollStarterCandidate: parts.preparation.rerollStarterCandidate,
    beginChallenge: parts.runPlanning.beginChallenge,
    continueRun: parts.handlers.continueRun || missing("continueRun"),
    battleChoice: parts.handlers.battleChoice || missing("battleChoice"),
    autoAdvanceBattle: parts.handlers.autoAdvanceBattle || missing("autoAdvanceBattle"),
    exchange: parts.handlers.exchange || missing("exchange"),
    restAction: parts.handlers.restAction || missing("restAction"),
    shopItems: async query => (parts.handlers.shopItems || missing("shopItems"))(query || ""),
    learnableMoves: async (slot, query) => (parts.handlers.learnableMoves || missing("learnableMoves"))(slot, query || ""),
    editOptions: parts.handlers.editOptions || missing("editOptions"),
    dexSearch: async (category, query, offset, limit) => (parts.handlers.dexSearch || missing("dexSearch"))(category, query || "", offset || 0, limit || 8),
    getBattleState: parts.handlers.getBattleState || missing("getBattleState"),
  };
}
