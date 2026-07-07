import {createShowdownDexService, type DexItemDetail, type DexSearchRequest, type ShowdownDexLike} from "@changebattle-v2/showdown-dex-core";
import {getPokemonBattleProfileV4} from "@changebattle-v2/showdown-battle-core/battleProfiles";
import {
  firstOpenPlayerVaultStorageSlotV4,
  REST_CENTER_LEFT_SIDE_ACTIONS_V4,
  REST_CENTER_PAPER_ACTIONS_V4,
  REST_CENTER_RIGHT_SIDE_ACTIONS_V4,
  getNatureEffectsV4,
  normalizeProfileNameV2,
  normalizeSaveTableV4,
  normalizeTrainerVaultV2,
  normalizeUserProfileV2,
  playerVaultStorageCapacityV4,
  playerVaultUnlockedStoragePageCountV4,
  createSoulmateCandidateListV4,
  formalShopSlotsForCategoryV4,
  FORMAL_PENDING_SETTLEMENT_SHOP_SLOTS_PER_CATEGORY,
  type PlayerItemRecordV4,
  type PlayerPokemonMoveRecordV4,
  type PlayerPokemonRecordV4,
  type PlayerVaultMergeResultV4,
  type PlayerVaultV4,
  type RestCenterActionEntryV4,
  type SoulmateCandidateV4,
  type TrainerVaultV2,
  type UserProfileDraftV2,
  type UserProfileV2,
} from "@changebattle-v2/core";
import {createBrowserTrainingRunAdapter, createTrainingRunApi, normalizeBattlePreferenceV4, type BattlePreferenceV4, type TrainingRunStorageAdapter} from "./training.js";
import {createBrowserFormalGameRunAdapter, createFormalGameRunApi, createFormalShopProductViewsV4, type FormalGameRunStorageAdapter} from "./formalGame.js";
import type {CoopPartnerPreferenceV4, FormalBattleResultFinalizeReasonV4, FormalBattleResultFinalizeResultV4, FormalBattleSessionPreparationV4, FormalGameModeV4, FormalGameRunV4, FormalGameSettlementV4, FormalMedicalInsuranceChoiceResultV4, FormalMedicalInsuranceChoiceV4, FormalMedicalInsuranceEffectsV4, FormalMedicalInsuranceOfferV4, FormalRestTeamHealResultV4, FormalSettlementReasonV4, FormalTrainingGroundLessonViewV4} from "./formalGame.js";
import {applyBattleSessionToRun, createBattleServiceClient, patchBattleRunLocalTeamsFromSnapshot, type BattleServiceClientV4, type ShowdownPlaybackTimelineV4} from "./battle.js";
import {generateRandomBattleTeamPreviewV4, type RandomBattleTeamPreviewInputV4} from "./teamGenerator.js";
import {generateBossTrainerPresetTeamsV4, type BossTrainerPresetTeamV4, type BossTrainerPresetMatrixSummaryV4} from "./bossTeamGenerator.js";
import {
  enableTestModeForProfileV4,
  getStarChartCatalogV4,
  normalizeBattlePointsV4,
  starChartHasEmergencyMedicalCareV4,
  starChartHasFreeMedicalCareV4,
  starChartHasMedicalInsuranceV4,
  starChartHasOutpatientMedicalCareV4,
  starChartHasPendingSettlementPurchaseBonusV4,
  starChartHasPendingSettlementShopExportV4,
  starChartHasSoulmateHeldItemEntryV4,
  starChartHasSoulmateRewardV4,
  soulmateBaseFriendshipForStarChartV4,
  soulmateShinyRateForStarChartV4,
  starterCandidateCountForStarChart,
  unlockStarChartNodeForProfileV4,
} from "./starChart.js";
export {FORMAL_PENDING_SETTLEMENT_SHOP_SLOTS_PER_CATEGORY, REST_CENTER_LEFT_SIDE_ACTIONS_V4, REST_CENTER_PAPER_ACTIONS_V4, REST_CENTER_RIGHT_SIDE_ACTIONS_V4, createSoulmateCandidateListV4, formalShopSlotsForCategoryV4};
export type {NatureEffectV4} from "@changebattle-v2/core";
export type {PlayerItemRecordV4, PlayerPokemonMoveRecordV4, PlayerPokemonRecordV4, PlayerVaultMergeResultV4, PlayerVaultV4, RestCenterActionEntryV4, SoulmateCandidateV4, TrainerVaultV2, UserProfileDraftV2, UserProfileV2};
export * from "./itemEffects.js";
export type {BossTrainerPresetTeamV4, BossTrainerPresetMatrixSummaryV4};
export type {PokemonBattleProfileV4, PokemonBattleRoleTagV4} from "@changebattle-v2/showdown-battle-core/battleProfiles";
export type {
  DexTrainerDetail,
  DexTrainerBossProfile,
  DexTrainerDialogueLine,
  DexTrainerDialogueSet,
  DexTrainerRepresentative,
  DexTrainerSummary,
  DexTrainerTeamPokemon,
  DexTrainerTeamPoolSummary,
  DexTrainerType,
  DexSystemBattleReforgeOption,
  DexSystemBattleReforgePokemonInput,
  DexSystemReforgeKind,
} from "@changebattle-v2/showdown-dex-core";

export type TrainerCatalogEntryV2 = {
  id: string;
  name: string;
  title: string;
  frontAsset: string;
  frontGifAsset?: string;
  backAsset?: string;
  avatarAsset: string;
};

export type TrainerCatalogV2 = {
  trainers: TrainerCatalogEntryV2[];
  avatars: TrainerCatalogEntryV2[];
};

export type FormalCarryPrepItemsResultV4 = {
  run: FormalGameRunV4;
  playerVault: PlayerVaultV4;
  carriedItemIds: string[];
};

export type UserProfileStorageAdapter = {
  loadUserProfile(): Promise<UserProfileV2 | null>;
  saveUserProfile(profile: UserProfileV2): Promise<UserProfileV2>;
  deleteUserProfile(): Promise<void>;
};

export type PlayerVaultStorageAdapter = {
  loadPlayerVault(): Promise<PlayerVaultV4 | null>;
  savePlayerVault(vault: PlayerVaultV4): Promise<PlayerVaultV4>;
  deletePlayerVault(): Promise<void>;
};

export type DesktopUserProfileBridge = UserProfileStorageAdapter & {
  getUserProfilePath?: () => Promise<string>;
};

export type DesktopPlayerVaultBridge = PlayerVaultStorageAdapter;

export type DesktopTrainingRunBridge = TrainingRunStorageAdapter;
export type DesktopFormalGameRunBridge = FormalGameRunStorageAdapter;

export type DesktopUpdateStatusV4 =
  | {phase: "idle"; currentVersion: string; officialSiteUrl: string}
  | {phase: "checking"; currentVersion: string; officialSiteUrl: string}
  | {phase: "up-to-date"; currentVersion: string; officialSiteUrl: string}
  | {
      phase: "available";
      currentVersion: string;
      remoteVersion: string;
      officialSiteUrl: string;
      notes?: string[];
      incrementalSize?: number;
      fullPackageSize?: number;
    }
  | {
      phase: "full-package-required";
      currentVersion: string;
      remoteVersion: string;
      officialSiteUrl: string;
      reason?: string;
      notes?: string[];
      fullPackageSize?: number;
    }
  | {
      phase: "downloading";
      currentVersion: string;
      remoteVersion: string;
      officialSiteUrl: string;
      downloadedSize: number;
      totalSize: number;
      notes?: string[];
      fullPackageSize?: number;
    }
  | {
      phase: "verifying" | "replacing";
      currentVersion: string;
      remoteVersion: string;
      officialSiteUrl: string;
      totalSize: number;
      notes?: string[];
      fullPackageSize?: number;
    }
  | {
      phase: "complete";
      currentVersion: string;
      remoteVersion: string;
      officialSiteUrl: string;
      totalSize: number;
      notes?: string[];
      fullPackageSize?: number;
    }
  | {
      phase: "failed" | "cancelled";
      currentVersion: string;
      remoteVersion?: string;
      officialSiteUrl: string;
      reason: string;
      notes?: string[];
      fullPackageSize?: number;
    };

export type DesktopAppBridge = {
  checkForUpdates(): Promise<DesktopUpdateStatusV4>;
  openOfficialSite(): Promise<void>;
  getUpdateStatus(): Promise<DesktopUpdateStatusV4>;
  cancelUpdate(): Promise<void>;
  onUpdateStatus(listener: (status: DesktopUpdateStatusV4) => void): () => void;
};

export type DesktopFormalGameBridge = {
  createFormalGameWithStarterCandidates(
    profile: UserProfileV2,
    options: {mode: FormalGameModeV4; coopPartnerPreference?: CoopPartnerPreferenceV4; streak?: number; seed?: string},
  ): Promise<FormalGameRunV4>;
  prepareFormalRoundPlan(run: FormalGameRunV4): Promise<FormalGameRunV4>;
  prepareFormalBattleSession(run: FormalGameRunV4): Promise<FormalBattleSessionPreparationV4>;
  getFormalMedicalInsuranceOffer(run: FormalGameRunV4): Promise<FormalMedicalInsuranceOfferV4>;
  chooseFormalMedicalInsurance(run: FormalGameRunV4, choice: FormalMedicalInsuranceChoiceV4): Promise<FormalMedicalInsuranceChoiceResultV4>;
  formalMedicalInsuranceEffectsForRun(run: FormalGameRunV4): Promise<FormalMedicalInsuranceEffectsV4>;
  healFormalRestTeam(run: FormalGameRunV4): Promise<FormalRestTeamHealResultV4>;
  getFormalTrainingGroundLessons(run: FormalGameRunV4): Promise<FormalTrainingGroundLessonViewV4[]>;
  prepareFormalSettlement(run: FormalGameRunV4, profile: UserProfileV2, reason: FormalSettlementReasonV4): Promise<{run: FormalGameRunV4; profile: UserProfileV2}>;
  settleFormalBattleRound(run: FormalGameRunV4): Promise<FormalGameRunV4>;
  finalizeFormalBattleResult(run: FormalGameRunV4, sessionId: string, reason?: FormalBattleResultFinalizeReasonV4, options?: {playbackTimeline?: ShowdownPlaybackTimelineV4 | null}): Promise<FormalBattleResultFinalizeResultV4>;
};

export type DesktopBattleServiceBridge = BattleServiceClientV4;

export type ChangeBattleV2ApiOptions = {
  dex?: ShowdownDexLike;
  resourcePrefix?: string;
  translate?: (table: string, value: string) => string;
  userProfileAdapter?: UserProfileStorageAdapter;
  playerVaultAdapter?: PlayerVaultStorageAdapter;
  trainingRunAdapter?: TrainingRunStorageAdapter;
  formalGameRunAdapter?: FormalGameRunStorageAdapter;
  battleServiceClient?: BattleServiceClientV4;
  battleServiceUrl?: string;
};

const DEFAULT_BROWSER_PROFILE_KEY = "changebattle-v2:user-profile";
const DEFAULT_BROWSER_PLAYER_VAULT_KEY = "changebattle-v2:player-vault";

const TRAINER_CATALOG: TrainerCatalogV2 = {
  trainers: [
    {
      id: "rosa",
      name: "鸣依",
      title: "合众训练师",
      frontAsset: "npc/player-front/rosa-spr-b2w2-rosa-b1af3eb8.png",
      backAsset: "npc/player-back/rosa-b2w2-rosa-back-405f562e.png",
      avatarAsset: "npc/avatars/6-asset-a73f3e71.webp",
    },
    {
      id: "nate",
      name: "共平",
      title: "合众训练师",
      frontAsset: "npc/player-front/nate-spr-b2w2-nate-88f1e9d2.png",
      backAsset: "npc/player-back/nate-b2w2-nate-back-e0cef62f.png",
      avatarAsset: "npc/avatars/11-asset-fdb7e61e.webp",
    },
    {
      id: "dawn",
      name: "小光",
      title: "神奥训练师",
      frontAsset: "npc/player-front/dawn-dp-dawn-a35e5a63.png",
      backAsset: "npc/player-back/dawn-dp-dawn-back-65c7fd06.png",
      avatarAsset: "npc/avatars/vsjasmine-79-vsjasmine-b8173b6d.png",
    },
    {
      id: "ethan",
      name: "响",
      title: "城都训练师",
      frontAsset: "npc/player-front/ethan-hgss-ethan-6eefaecf.png",
      backAsset: "npc/player-back/ethan-hgss-gold-back-46e97197.png",
      avatarAsset: "npc/avatars/koga-vskoga-523872dc.png",
    },
    {
      id: "lyra",
      name: "琴音",
      title: "城都训练师",
      frontAsset: "npc/player-front/lyra-hgss-lyra-fe4906cc.png",
      backAsset: "npc/player-back/lyra-hgss-kotone-back-d2d0db32.png",
      avatarAsset: "npc/avatars/alder-vsadeku-c7421c2b.png",
    },
  ],
  avatars: [],
};

TRAINER_CATALOG.avatars = TRAINER_CATALOG.trainers;

export function createChangeBattleV2Api(options: ChangeBattleV2ApiOptions = {}) {
  const publicAssetPrefix = publicAssetPrefixFromShowdownPrefix(options.resourcePrefix);
  const dex = createShowdownDexService({
    dex: options.dex,
    resourcePrefix: options.resourcePrefix,
    translate: options.translate,
  });
  const userProfiles = options.userProfileAdapter || createBrowserUserProfileAdapter();
  const playerVaults = options.playerVaultAdapter || createBrowserPlayerVaultAdapter();
  const trainingRuns = createTrainingRunApi(dex, options.trainingRunAdapter || createBrowserTrainingRunAdapter());
  const formalRuns = createFormalGameRunApi(dex, options.formalGameRunAdapter || createBrowserFormalGameRunAdapter());
  const battleService = options.battleServiceClient || createBattleServiceClient(options.battleServiceUrl);

  return {
    dex,
    searchDex: (request: DexSearchRequest = {}) => dex.searchDex(request),
    getPokemonDetail: (id: string) => dex.getPokemonDetail(id),
    getMoveDetail: (id: string) => dex.getMoveDetail(id),
    getAbilityDetail: (id: string) => dex.getAbilityDetail(id),
    getItemDetail: (id: string) => dex.getItemDetail(id),
    getTmItemDetail: (moveIdOrTmId: string) => dex.getTmItemDetail(moveIdOrTmId),
    getTrainerDetail: (trainerId: string) => dex.getTrainerDetail(trainerId),
    getSystemBattleReforgeOptions: (itemId: string, pokemon: Parameters<typeof dex.getSystemBattleReforgeOptions>[1]) => dex.getSystemBattleReforgeOptions(itemId, pokemon),
    getPokemonLearnset: (speciesId: string) => dex.getPokemonLearnset(speciesId),
    getPokemonSkillsBySource: (speciesId: string, source: Parameters<typeof dex.getPokemonSkillsBySource>[1]) => dex.getPokemonSkillsBySource(speciesId, source),
    getPokemonSelfLearnSkills: (speciesId: string) => dex.getPokemonSelfLearnSkills(speciesId),
    getPokemonTutorSkills: (speciesId: string) => dex.getPokemonTutorSkills(speciesId),
    getPokemonEggSkills: (speciesId: string) => dex.getPokemonEggSkills(speciesId),
    getPokemonMachineSkills: (speciesId: string) => dex.getPokemonMachineSkills(speciesId),
    getPokemonBattleProfile: (speciesId: string) => getPokemonBattleProfileV4(speciesId),
    loadPlayerVault: async () => normalizePlayerVault(await playerVaults.loadPlayerVault()),
    savePlayerVault: async (vault: PlayerVaultV4) => playerVaults.savePlayerVault(normalizePlayerVault(vault)),
    deletePlayerVault: () => playerVaults.deletePlayerVault(),
    normalizePlayerVault,
    mergeFormalRunBagIntoPlayerVault,
    applyFormalCarryPrepItems,
    playerVaultUnlockedStoragePageCountV4,
    playerVaultStorageCapacityV4,
    getTrainerCatalog: () => normalizeTrainerCatalogAssets(TRAINER_CATALOG, publicAssetPrefix),
    loadUserProfile: async () => {
      const profile = await userProfiles.loadUserProfile();
      return profile ? normalizeProfileAssets(profile, publicAssetPrefix) : null;
    },
    createUserProfile: async (draft: UserProfileDraftV2 = {}) => {
      const profile = normalizeProfileAssets(createDefaultUserProfile(draft), publicAssetPrefix);
      return userProfiles.saveUserProfile(profile);
    },
    updateUserProfile: async (profile: UserProfileV2, draft: UserProfileDraftV2 = {}) => {
      const next = normalizeProfileAssets(updateUserProfile(profile, draft), publicAssetPrefix);
      return userProfiles.saveUserProfile(next);
    },
    updateBattlePreference: async (profile: UserProfileV2, battlePreference: Partial<BattlePreferenceV4>) => {
      const next = normalizeProfile({
        ...profile,
        battlePreference: normalizeBattlePreferenceV4(battlePreference),
        updatedAt: new Date().toISOString(),
      });
      return userProfiles.saveUserProfile(next);
    },
    getStarChartCatalog: (profile: UserProfileV2) => getStarChartCatalogV4(profile),
    unlockStarChartNode: async (profile: UserProfileV2, nodeId: string) => userProfiles.saveUserProfile(normalizeProfile(unlockStarChartNodeForProfileV4(profile, nodeId))),
    enableTestMode: async (profile: UserProfileV2) => userProfiles.saveUserProfile(normalizeProfile(enableTestModeForProfileV4(profile))),
    starterCandidateCountForStarChart,
    deleteUserProfile: () => userProfiles.deleteUserProfile(),
    loadTrainingRun: () => trainingRuns.loadTrainingRun(),
    saveTrainingRun: trainingRuns.saveTrainingRun,
    patchBattleRunLocalTeamsFromSnapshot,
    applyBattleSessionToRun,
    deleteTrainingRun: trainingRuns.deleteTrainingRun,
    loadFormalGameRun: () => formalRuns.loadFormalGameRun(),
    saveFormalGameRun: formalRuns.saveFormalGameRun,
    deleteFormalGameRun: formalRuns.deleteFormalGameRun,
    createFormalGameRun: formalRuns.createFormalGameRun,
    prepareFormalStarterCandidates: formalRuns.prepareFormalStarterCandidates,
    selectFormalStarterPokemon: formalRuns.selectFormalStarterPokemon,
    prepareFormalRoundPlan: formalRuns.prepareFormalRoundPlan,
    prepareFormalBattleSession: formalRuns.prepareFormalBattleSession,
    appendCoinLogEntryV4: formalRuns.appendCoinLogEntryV4,
    appendBattleLogEntriesFromSnapshotV4: formalRuns.appendBattleLogEntriesFromSnapshotV4,
    settleFormalBattleRoundV4: formalRuns.settleFormalBattleRoundV4,
    finalizeFormalBattleResultV4: formalRuns.finalizeFormalBattleResultV4,
    prepareFormalSettlement: formalRuns.prepareFormalSettlement,
    getFormalMedicalInsuranceOffer: formalRuns.getFormalMedicalInsuranceOffer,
    chooseFormalMedicalInsurance: formalRuns.chooseFormalMedicalInsurance,
    formalMedicalInsuranceEffectsForRun: formalRuns.formalMedicalInsuranceEffectsForRun,
    healFormalRestTeam: formalRuns.healFormalRestTeam,
    getFormalRestShop: formalRuns.getFormalRestShop,
    getFormalRestShopProducts: formalRuns.getFormalRestShopProducts,
    createFormalShopProductViews: (shop: Parameters<typeof createFormalShopProductViewsV4>[0]) => createFormalShopProductViewsV4(shop, itemID => dex.getItemDetail(itemID)),
    getNatureEffects: getNatureEffectsV4,
    buyFormalRestShopItem: formalRuns.buyFormalRestShopItem,
    sellFormalRestBagItems: formalRuns.sellFormalRestBagItems,
    rerollFormalRestPokemonStats: formalRuns.rerollFormalRestPokemonStats,
    unlockFormalRestOpponentPreview: formalRuns.unlockFormalRestOpponentPreview,
    getFormalRestExchangeView: formalRuns.getFormalRestExchangeView,
    exchangeFormalRestPokemon: formalRuns.exchangeFormalRestPokemon,
    getFormalTrainingGroundLesson: formalRuns.getFormalTrainingGroundLesson,
    getFormalTrainingGroundLessons: formalRuns.getFormalTrainingGroundLessons,
    advanceFormalTrainingGroundLesson: formalRuns.advanceFormalTrainingGroundLesson,
    applyFormalTrainingGroundLesson: formalRuns.applyFormalTrainingGroundLesson,
    claimFormalSettlementBp: async (profile: UserProfileV2, settlement: FormalGameSettlementV4) => userProfiles.saveUserProfile(claimFormalSettlementBp(profile, settlement)),
    selectedCountForFormalMode: formalRuns.selectedCountForFormalMode,
    createTrainingRunGame: trainingRuns.createTrainingRunGame,
    createDefaultTrainingScenario: trainingRuns.createDefaultTrainingScenario,
    updateTrainingScenario: trainingRuns.updateTrainingScenario,
    createTrainingRunFromScenario: trainingRuns.createTrainingRunFromScenario,
    enterTrainingRest: trainingRuns.enterTrainingRest,
    getCurrentTrainingNode: trainingRuns.getCurrentTrainingNode,
    getNextTrainingNode: trainingRuns.getNextTrainingNode,
    randomizeTrainingScenario: trainingRuns.randomizeTrainingScenario,
    randomizeTrainingTeam: trainingRuns.randomizeTeam,
    generateRandomBattleTeamPreviewV4: (input: RandomBattleTeamPreviewInputV4 = {}) => generateRandomBattleTeamPreviewV4(dex, input),
    generateBossTrainerPresetTeamsV4: (input: Parameters<typeof generateBossTrainerPresetTeamsV4>[1] = {}) => generateBossTrainerPresetTeamsV4(dex, input),
    createTrainingNpcCatalog: trainingRuns.createTrainingNpcCatalog,
    createItemInstance: trainingRuns.createItemInstance,
    normalizeBagState: trainingRuns.normalizeBagState,
    ensureDefaultSystemItemsForRuleSet: trainingRuns.ensureDefaultSystemItemsForRuleSet,
    battleService,
  };

  function applyFormalCarryPrepItems(run: FormalGameRunV4, playerVault: PlayerVaultV4 | undefined | null): FormalCarryPrepItemsResultV4 {
    const normalizedVault = normalizePlayerVault(playerVault);
    return {run, playerVault: normalizedVault, carriedItemIds: []};
  }

  function getItemDetailSafe(itemId: string) {
    try {
      return dex.getItemDetail(itemId) || null;
    } catch {
      return null;
    }
  }
}

export {
  starChartHasEmergencyMedicalCareV4,
  starChartHasFreeMedicalCareV4,
  starChartHasMedicalInsuranceV4,
  starChartHasOutpatientMedicalCareV4,
  starChartHasPendingSettlementPurchaseBonusV4,
  starChartHasPendingSettlementShopExportV4,
  starChartHasSoulmateHeldItemEntryV4,
  starChartHasSoulmateRewardV4,
  soulmateBaseFriendshipForStarChartV4,
  soulmateShinyRateForStarChartV4,
};

export function createDefaultUserProfile(draft: UserProfileDraftV2 = {}, now = new Date()): UserProfileV2 {
  const trainer = trainerFor(draft.trainerId);
  const createdAt = now.toISOString();
  return normalizeUserProfileV2({
    id: createId(),
    name: normalizeProfileNameV2(draft.name),
    avatarAsset: draft.avatarAsset || trainer.avatarAsset,
    frontAsset: trainer.frontAsset,
    frontGifAsset: trainer.frontGifAsset,
    backAsset: trainer.backAsset,
    createdAt,
    updatedAt: createdAt,
    battlePreference: normalizeBattlePreferenceV4(),
  }, trainer, createdAt);
}

export function updateUserProfile(profile: UserProfileV2, draft: UserProfileDraftV2 = {}, now = new Date()): UserProfileV2 {
  const trainer = trainerFor(draft.trainerId || profile.trainerId);
  return normalizeUserProfileV2({
    ...profile,
    id: profile.id,
    name: normalizeProfileNameV2(draft.name ?? profile.name),
    avatarAsset: draft.avatarAsset || profile.avatarAsset || trainer.avatarAsset,
    frontAsset: trainer.frontAsset,
    frontGifAsset: trainer.frontGifAsset,
    backAsset: trainer.backAsset,
    createdAt: profile.createdAt,
    updatedAt: now.toISOString(),
  }, trainer, now.toISOString());
}

export function claimFormalSettlementBp(profile: UserProfileV2, settlement: FormalGameSettlementV4, now = new Date()): UserProfileV2 {
  if (settlement.claimedAt) return normalizeProfile(profile);
  return normalizeProfile({
    ...profile,
    battlePoints: normalizeBattlePointsV4(profile.battlePoints) + Math.max(0, Math.round(Number(settlement.bpGained || 0))),
    updatedAt: now.toISOString(),
  });
}

export function createBrowserUserProfileAdapter(storageKey = DEFAULT_BROWSER_PROFILE_KEY): UserProfileStorageAdapter {
  return {
    async loadUserProfile() {
      if (!hasBrowserStorage()) return null;
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      return normalizeProfile(JSON.parse(raw) as UserProfileV2);
    },
    async saveUserProfile(profile) {
      const next = normalizeProfile(profile);
      if (hasBrowserStorage()) {
        window.localStorage.setItem(storageKey, JSON.stringify(next, null, 2));
      }
      return clone(next);
    },
    async deleteUserProfile() {
      if (hasBrowserStorage()) window.localStorage.removeItem(storageKey);
    },
  };
}

export function createBrowserPlayerVaultAdapter(storageKey = DEFAULT_BROWSER_PLAYER_VAULT_KEY): PlayerVaultStorageAdapter {
  return {
    async loadPlayerVault() {
      if (!hasBrowserStorage()) return null;
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      return normalizePlayerVault(JSON.parse(raw));
    },
    async savePlayerVault(vault) {
      const next = normalizePlayerVault(vault);
      if (hasBrowserStorage()) {
        window.localStorage.setItem(storageKey, JSON.stringify(next, null, 2));
      }
      return clone(next);
    },
    async deletePlayerVault() {
      if (hasBrowserStorage()) window.localStorage.removeItem(storageKey);
    },
  };
}

export function createDesktopUserProfileAdapter(bridge: DesktopUserProfileBridge): UserProfileStorageAdapter {
  return {
    async loadUserProfile() {
      const profile = await bridge.loadUserProfile();
      return profile ? normalizeProfile(profile) : null;
    },
    async saveUserProfile(profile) {
      return normalizeProfile(await bridge.saveUserProfile(normalizeProfile(profile)));
    },
    async deleteUserProfile() {
      await bridge.deleteUserProfile();
    },
  };
}

export function createDesktopPlayerVaultAdapter(bridge: DesktopPlayerVaultBridge): PlayerVaultStorageAdapter {
  return {
    async loadPlayerVault() {
      return normalizePlayerVault(await bridge.loadPlayerVault());
    },
    async savePlayerVault(vault) {
      return normalizePlayerVault(await bridge.savePlayerVault(normalizePlayerVault(vault)));
    },
    async deletePlayerVault() {
      await bridge.deletePlayerVault();
    },
  };
}

export function createDesktopTrainingRunAdapter(bridge: DesktopTrainingRunBridge): TrainingRunStorageAdapter {
  return {
    async loadTrainingRun() {
      const run = await bridge.loadTrainingRun();
      return run ? clone(run) : null;
    },
    async saveTrainingRun(run) {
      return clone(await bridge.saveTrainingRun(clone(run)));
    },
    async deleteTrainingRun() {
      await bridge.deleteTrainingRun();
    },
  };
}

export function createDesktopFormalGameRunAdapter(bridge: DesktopFormalGameRunBridge): FormalGameRunStorageAdapter {
  return {
    async loadFormalGameRun() {
      const run = await bridge.loadFormalGameRun();
      return run ? clone(run) : null;
    },
    async saveFormalGameRun(run) {
      return clone(await bridge.saveFormalGameRun(clone(run)));
    },
    async deleteFormalGameRun() {
      await bridge.deleteFormalGameRun();
    },
  };
}

function trainerFor(id: string | undefined): TrainerCatalogEntryV2 {
  return TRAINER_CATALOG.trainers.find(trainer => trainer.id === id) || TRAINER_CATALOG.trainers[0]!;
}

function publicAssetPrefixFromShowdownPrefix(resourcePrefix?: string): string {
  const prefix = resourcePrefix || "/showdown/";
  const normalized = prefix.endsWith("/") ? prefix : `${prefix}/`;
  return normalized.replace(/showdown\/$/, "");
}

function normalizePublicAssetPath(path: string | undefined, publicAssetPrefix: string): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|blob:|file:|capacitor:)/i.test(path)) return path;
  if (path.startsWith("./") || path.startsWith("../")) return path;
  const cleanPath = path.replace(/^\/+/, "").replace(/^assets\//, "");
  return cleanPath ? `${publicAssetPrefix}${cleanPath}` : publicAssetPrefix;
}

function normalizeTrainerAssets(trainer: TrainerCatalogEntryV2, publicAssetPrefix: string): TrainerCatalogEntryV2 {
  return {
    ...trainer,
    frontAsset: normalizePublicAssetPath(trainer.frontAsset, publicAssetPrefix) || "",
    frontGifAsset: normalizePublicAssetPath(trainer.frontGifAsset, publicAssetPrefix),
    backAsset: normalizePublicAssetPath(trainer.backAsset, publicAssetPrefix),
    avatarAsset: normalizePublicAssetPath(trainer.avatarAsset, publicAssetPrefix) || "",
  };
}

function normalizeTrainerCatalogAssets(catalog: TrainerCatalogV2, publicAssetPrefix: string): TrainerCatalogV2 {
  const trainers = catalog.trainers.map(trainer => normalizeTrainerAssets(trainer, publicAssetPrefix));
  const byId = new Map(trainers.map(trainer => [trainer.id, trainer]));
  const avatars = catalog.avatars.map(trainer => byId.get(trainer.id) || normalizeTrainerAssets(trainer, publicAssetPrefix));
  return {trainers, avatars};
}

function normalizeProfileAssets(profile: UserProfileV2, publicAssetPrefix: string): UserProfileV2 {
  const next = normalizeProfile(profile);
  return {
    ...next,
    avatarAsset: normalizePublicAssetPath(next.avatarAsset, publicAssetPrefix) || next.avatarAsset,
    frontAsset: normalizePublicAssetPath(next.frontAsset, publicAssetPrefix) || next.frontAsset,
    frontGifAsset: normalizePublicAssetPath(next.frontGifAsset, publicAssetPrefix),
    backAsset: normalizePublicAssetPath(next.backAsset, publicAssetPrefix),
  };
}

function normalizeProfile(profile: UserProfileV2): UserProfileV2 {
  const trainer = trainerFor(profile.trainerId);
  return normalizeSaveTableV4("profile", profile, {trainerDefaults: trainer}).value;
}

export function normalizePlayerVault(value?: unknown): PlayerVaultV4 {
  return normalizeSaveTableV4("playerVault", value).value;
}

export function mergeFormalRunBagIntoPlayerVault(vault: PlayerVaultV4 | undefined | null, run: FormalGameRunV4 | undefined | null): PlayerVaultMergeResultV4 {
  const next = normalizePlayerVault(vault);
  const items = next.items.map(item => ({...item}));
  let depositedItemCount = 0;
  let rejectedItemCount = 0;
  const exportIds = new Set(run?.pendingSettlementExportItemInstanceIds || []);
  if (!exportIds.size) return {vault: next, depositedItemCount, rejectedItemCount};
  for (const item of run?.restRunSnapshot?.players.p1?.bag.items || []) {
    if (!exportIds.has(item.id)) continue;
    const itemId = normalizeNonEmptyText(item.itemID);
    if (!itemId || item.type === "system" || item.type === "system-battle") continue;
    const existing = items.find(entry => entry.itemId === itemId && (entry.boxKind || "storage") === "storage");
    if (existing) {
      existing.quantity += 1;
      depositedItemCount += 1;
      continue;
    }
    const openSlot = firstOpenPlayerVaultStorageSlotV4(items, next.itemStoragePageCount);
    if (!openSlot) {
      rejectedItemCount += 1;
      continue;
    }
    items.push({itemId, quantity: 1, boxKind: "storage", storagePageIndex: openSlot.storagePageIndex, slotIndex: openSlot.slotIndex});
    depositedItemCount += 1;
  }
  return {
    vault: normalizePlayerVault({
      ...next,
      items,
    }),
    depositedItemCount,
    rejectedItemCount,
  };
}

function normalizeNonEmptyText(value: unknown): string {
  return String(value || "").trim();
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return `profile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function hasBrowserStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export type ChangeBattleV2Api = ReturnType<typeof createChangeBattleV2Api>;
export * from "./battle.js";
export * from "./battleDebug.js";
export * from "./teamGenerator.js";
export * from "./formalGame.js";
export * from "./starChart.js";
export * from "./training.js";
export {createBrowserTrainingRunAdapter, createTrainingNpcCatalog, createTrainingRunApi} from "./training.js";
export type * from "./training.js";
export type * from "@changebattle-v2/showdown-dex-core";
