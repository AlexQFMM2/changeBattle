import {createShowdownDexService, type DexPokemonDetail, type DexSearchRequest, type ShowdownDexLike} from "@changebattle-v2/showdown-dex-core";
import {getPokemonBattleProfileV4} from "@changebattle-v2/showdown-battle-core/battleProfiles";
import {
  firstOpenPlayerVaultStorageSlotV4,
  REST_CENTER_LEFT_SIDE_ACTIONS_V4,
  REST_CENTER_PAPER_ACTIONS_V4,
  REST_CENTER_RIGHT_SIDE_ACTIONS_V4,
  getNatureEffectsV4,
  normalizeSoulmateEvolutionRequirementV4,
  soulmateEvolutionFriendshipRequirementForChainV4,
  normalizeProfileNameV2,
  normalizeSaveTableV4,
  normalizeTrainerVaultV2,
  normalizeUserProfileV2,
  playerPokemonHonorBadgeStateV4,
  playerVaultStorageCapacityV4,
  playerVaultUnlockedStoragePageCountV4,
  PLAYER_POKEMON_HONOR_BADGES_V4,
  releasePlayerVaultPokemonV4,
  setPlayerVaultPokemonBattleMarkedV4,
  createSoulmateCandidateListV4,
  applyFormalSoulmateBattleEvolutionToVaultV4,
  evaluateFormalSoulmateBattleEvolutionV4,
  formalShopSlotsForCategoryV4,
  FORMAL_PENDING_SETTLEMENT_SHOP_SLOTS_PER_CATEGORY,
  type PlayerPokemonHonorBadgeStateV4,
  type PlayerPokemonHonorTargetV4,
  type PlayerItemRecordV4,
  type PlayerPokemonMoveRecordV4,
  type PlayerPokemonRecordV4,
  type PlayerVaultMergeResultV4,
  type PlayerVaultPokemonReleaseResultV4,
  type PlayerVaultV4,
  type FormalSoulmateBattleEvolutionCandidateV4,
  type RestCenterActionEntryV4,
  type SoulmateCandidateV4,
  type TrainerVaultV2,
  type UserProfileDraftV2,
  type UserProfileV2,
} from "@changebattle-v2/core";
import {createBrowserTrainingRunAdapter, createTrainingRunApi, normalizeBattlePreferenceV4, type BattlePreferenceV4, type TrainingRunStorageAdapter} from "./training.js";
import {createBrowserFormalGameRunAdapter, createFormalGameRunApi, createFormalShopProductViewsV4, type FormalGameRunStorageAdapter} from "./formalGame.js";
import type {CoopPartnerPreferenceV4, FormalBattleResultFinalizeReasonV4, FormalBattleResultFinalizeResultV4, FormalBattleSessionPreparationV4, FormalGameModeV4, FormalGameRunV4, FormalGameSettlementV4, FormalMedicalInsuranceChoiceResultV4, FormalMedicalInsuranceChoiceV4, FormalMedicalInsuranceEffectsV4, FormalMedicalInsuranceOfferV4, FormalRestTeamHealResultV4, FormalSettlementReasonV4, FormalSoulmateBattleFriendshipSettlementResultV4, FormalSoulmateEggClaimResultV4, FormalSoulmateEggHatchResultV4, FormalSoulmateEggPokemonDisplayV4, FormalSoulmateFriendshipSettlementRecordV4, FormalSoulmateHonorSettlementRecordV4, FormalSoulmateHonorSettlementResultV4, FormalTrainingGroundLessonViewV4} from "./formalGame.js";
import {applyBattleSessionToRun, createBattleServiceClient, patchBattleRunLocalTeamsFromSnapshot, type BattleServiceClientV4, type BattleSessionSnapshotV4, type ShowdownPlaybackTimelineV4} from "./battle.js";
import type {LocalPokemonV4, LocalTeamV4, ShowdownPlayerIdV4, TrainingPlayerDraftV4, TrainingRunGameNodeV4, TrainingRunGameV4} from "./training.js";
import {generateRandomBattleTeamPreviewV4, type RandomBattleTeamPreviewInputV4} from "./teamGenerator.js";
import {generateBossTrainerPresetTeamsV4, type BossTrainerPresetTeamV4, type BossTrainerPresetMatrixSummaryV4} from "./bossTeamGenerator.js";
import {applyPlayerVaultEvolutionItemV4, applyPlayerVaultFriendshipItemV4, applyPlayerVaultHeldItemV4, applyPlayerVaultMoveTeachingItemV4, applyPlayerVaultNumericItemV4, getPlayerVaultMoveTeachingViewV4, previewPlayerVaultEvolutionItemUseV4, previewPlayerVaultNumericItemUseV4, unequipPlayerVaultHeldItemV4, type PlayerVaultEvolutionApplyResultV4, type PlayerVaultEvolutionPreviewResultV4, type PlayerVaultFriendshipItemApplyResultV4, type PlayerVaultHeldItemApplyResultV4, type PlayerVaultHeldItemUnequipResultV4, type PlayerVaultMoveTeachingApplyResultV4 as PlayerVaultMoveTeachingApplyResultFromItemEffectsV4, type PlayerVaultMoveTeachingViewResultV4, type PlayerVaultNumericItemApplyResultV4, type PlayerVaultNumericItemPreviewResultV4} from "./itemEffects.js";
import {addDebugPlayerVaultItemV4, addDebugPlayerVaultPokemonV4} from "./debugVault.js";
import {
  clearStarChartUnlocksForProfileV4,
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
  soulmateVaultStarterSlotCountForStarChartV4,
  soulmateBaseFriendshipForStarChartV4,
  soulmateShinyRateForStarChartV4,
  starterCandidateCountForStarChart,
  unlockStarChartNodeForProfileV4,
} from "./starChart.js";
export {FORMAL_PENDING_SETTLEMENT_SHOP_SLOTS_PER_CATEGORY, REST_CENTER_LEFT_SIDE_ACTIONS_V4, REST_CENTER_PAPER_ACTIONS_V4, REST_CENTER_RIGHT_SIDE_ACTIONS_V4, createSoulmateCandidateListV4, formalShopSlotsForCategoryV4};
export {
  formalBattleSystemLabelV4,
  formalGameModeLabelV4,
  formalMedicalInsuranceTierLabelV4,
  formalNpcTeamPreferenceLabelV4,
  formalRoundStageLabelV4,
  formalSettlementOutcomeLabelV4,
  formalSettlementReasonLabelV4,
  formalStarterRoleLabelV4,
} from "@changebattle-v2/core";
export type {NatureEffectV4} from "@changebattle-v2/core";
export {normalizeShowdownChoiceRequestV4, showdownMoveNeedsExplicitTargetV4, showdownNormalizeMoveTargetV4, showdownTargetTypeAllowsChoiceV4, validShowdownTargetLocV4} from "@changebattle-v2/showdown-battle-core/showdownCommand";
export {battleKeyFromRosterIdentityV4, canonicalBattleKeyV4, isProtocolBattleKeyV4} from "@changebattle-v2/showdown-battle-core/battleIdentity";
export {dexLabelToId, toDexId, translateDexDescription, translateDexLabel} from "@changebattle-v2/showdown-dex-core";
export type {PlayerItemRecordV4, PlayerPokemonMoveRecordV4, PlayerPokemonRecordV4, PlayerVaultMergeResultV4, PlayerVaultPokemonReleaseResultV4, PlayerVaultV4, RestCenterActionEntryV4, SoulmateCandidateV4, TrainerVaultV2, UserProfileDraftV2, UserProfileV2};
export type {FormalSoulmateBattleFriendshipSettlementResultV4, FormalSoulmateEggClaimResultV4, FormalSoulmateEggHatchResultV4, FormalSoulmateEggPokemonDisplayV4, FormalSoulmateFriendshipSettlementRecordV4, FormalSoulmateHonorSettlementRecordV4, FormalSoulmateHonorSettlementResultV4};
export type {DebugPlayerVaultItemAddResultV4, DebugPlayerVaultPokemonAddResultV4} from "./debugVault.js";
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

export type FormalSoulmateBattleEvolutionApplyResultV4 = {
  run: FormalGameRunV4;
  playerVault: PlayerVaultV4;
  snapshot: BattleSessionSnapshotV4 | null;
  evolved: boolean;
  evolution?: FormalSoulmateBattleEvolutionCandidateV4 & {
    battleNodeId: string;
    battleSessionId: string;
    turn: number;
  };
  message?: string;
};

export type PlayerVaultPokemonDetailViewV4 = {
  title: string;
  speciesName: string;
  subtitle: string;
  spriteUrl: string;
  shiny: boolean;
  overview: Array<{label: string; value: string}>;
  stats: Array<{id: string; label: string; actual: number; iv: number; ev: number}>;
  moves: Array<{slot: number; id: string; name: string; type: string; category: string; power: string; pp: string}>;
  evolutions: Array<{from: string; to: string; method: string}>;
};

export type PlayerPokemonHonorBadgeViewV4 = PlayerPokemonHonorBadgeStateV4 & {
  iconPath: string;
  statusLabel: string;
  missingTargets: Array<PlayerPokemonHonorTargetV4 & {completed: false}>;
};

export type PlayerVaultMoveTeachingViewV4 = PlayerVaultMoveTeachingViewResultV4;
export type PlayerVaultMoveTeachingApplyResultV4 = PlayerVaultMoveTeachingApplyResultFromItemEffectsV4;
export type PlayerVaultFriendshipApplyResultV4 = PlayerVaultFriendshipItemApplyResultV4;
export type PlayerVaultNumericPreviewResultV4 = PlayerVaultNumericItemPreviewResultV4;
export type PlayerVaultNumericApplyResultV4 = PlayerVaultNumericItemApplyResultV4;
export type PlayerVaultEvolutionPreviewResult = PlayerVaultEvolutionPreviewResultV4;
export type PlayerVaultEvolutionApplyResult = PlayerVaultEvolutionApplyResultV4;
export type PlayerVaultHeldApplyResultV4 = PlayerVaultHeldItemApplyResultV4;
export type PlayerVaultHeldUnequipResultV4 = PlayerVaultHeldItemUnequipResultV4;
export type PlayerVaultPokemonReleaseViewResultV4 =
  | {ok: true; vault: PlayerVaultV4; releasedPokemon: PlayerPokemonRecordV4; message: string; returnedHeldItemId?: string}
  | {ok: false; reason: string; vault: PlayerVaultV4};

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
  | {
      phase: "up-to-date";
      currentVersion: string;
      remoteVersion?: string;
      officialSiteUrl: string;
      notes?: string[];
      fullPackageSize?: number;
    }
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
    playerVault?: PlayerVaultV4 | null,
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
    translateDexLabel: dex.translateDexLabel,
    translateDexDescription: dex.translateDexDescription,
    dexLabelToId: dex.dexLabelToId,
    toDexId: dex.toDexId,
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
    createPlayerVaultPokemonDetailView: (pokemon: PlayerPokemonRecordV4) => createPlayerVaultPokemonDetailView(dex, pokemon),
    getPlayerPokemonHonorBadges: (pokemon: PlayerPokemonRecordV4) => createPlayerPokemonHonorBadgeViews(dex, pokemon),
    getPlayerVaultMoveTeachingView: (vault: PlayerVaultV4, itemKey: string, pokemonId: string, query = "") => getPlayerVaultMoveTeachingViewV4(dex, vault, itemKey, pokemonId, query),
    applyPlayerVaultMoveTeachingItem: (input: {vault: PlayerVaultV4; itemKey: string; pokemonId: string; moveId: string; moveSlot: number}) => applyPlayerVaultMoveTeachingItemV4(dex, input),
    previewPlayerVaultNumericItemUse: (input: {vault: PlayerVaultV4; itemKey: string; pokemonId: string}) => previewPlayerVaultNumericItemUseV4(dex, input),
    applyPlayerVaultNumericItem: (input: {vault: PlayerVaultV4; itemKey: string; pokemonId: string}) => applyPlayerVaultNumericItemV4(dex, input),
    previewPlayerVaultEvolutionItemUse: (input: {vault: PlayerVaultV4; itemKey: string; pokemonId: string}) => previewPlayerVaultEvolutionItemUseV4(dex, input),
    applyPlayerVaultEvolutionItem: (input: {vault: PlayerVaultV4; itemKey: string; pokemonId: string; toSpeciesId: string}) => applyPlayerVaultEvolutionItemV4(dex, input),
    applyPlayerVaultFriendshipItem: (input: {vault: PlayerVaultV4; itemKey: string; pokemonId: string}) => applyPlayerVaultFriendshipItemV4(dex, input),
    applyPlayerVaultHeldItem: (input: {vault: PlayerVaultV4; itemKey: string; pokemonId: string}) => applyPlayerVaultHeldItemV4(dex, input),
    unequipPlayerVaultHeldItem: (input: {vault: PlayerVaultV4; pokemonId: string}) => unequipPlayerVaultHeldItemV4(dex, input),
    releasePlayerVaultPokemon: (input: {vault: PlayerVaultV4; pokemonId: string}) => releasePlayerVaultPokemon(dex, input),
    setPlayerVaultPokemonBattleMarked: (input: {vault: PlayerVaultV4; pokemonId: string; marked: boolean}) => setPlayerVaultPokemonBattleMarkedV4(input.vault, input.pokemonId, input.marked),
    addDebugPlayerVaultItem: (vault: PlayerVaultV4, itemId: string, quantity = 1) => addDebugPlayerVaultItemV4(dex, vault, itemId, quantity),
    addDebugPlayerVaultPokemon: (vault: PlayerVaultV4, speciesId: string) => addDebugPlayerVaultPokemonV4(dex, vault, speciesId),
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
    draftUnlockStarChartNode: (profile: UserProfileV2, nodeId: string) => normalizeProfile(unlockStarChartNodeForProfileV4(profile, nodeId)),
    clearStarChartUnlocks: (profile: UserProfileV2) => normalizeProfile(clearStarChartUnlocksForProfileV4(profile)),
    unlockStarChartNode: async (profile: UserProfileV2, nodeId: string) => userProfiles.saveUserProfile(normalizeProfile(unlockStarChartNodeForProfileV4(profile, nodeId))),
    enableTestMode: async (profile: UserProfileV2) => userProfiles.saveUserProfile(normalizeProfile(enableTestModeForProfileV4(profile))),
    starterCandidateCountForStarChart,
    soulmateVaultStarterSlotCountForStarChartV4,
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
    applyFormalSoulmateBattleFriendshipSettlement: formalRuns.applyFormalSoulmateBattleFriendshipSettlement,
    applyFormalSoulmateHonorSettlement: formalRuns.applyFormalSoulmateHonorSettlement,
    syncFormalSoulmateLocalTeamToVault: formalRuns.syncFormalSoulmateLocalTeamToVault,
    tryApplyFormalSoulmateBattleEvolution,
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
    prepareFormalSoulmateEggHatch: formalRuns.prepareFormalSoulmateEggHatch,
    claimFormalSoulmateEgg: formalRuns.claimFormalSoulmateEgg,
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

  async function tryApplyFormalSoulmateBattleEvolution(input: {
    run: FormalGameRunV4;
    playerVault: PlayerVaultV4 | undefined | null;
    sessionId: string;
    snapshot?: BattleSessionSnapshotV4 | null;
    chanceOverride?: number;
    friendshipOverride?: number;
  }): Promise<FormalSoulmateBattleEvolutionApplyResultV4> {
    const vault = normalizePlayerVault(input.playerVault);
    const sessionId = String(input.sessionId || "").trim();
    const snapshot = input.snapshot || (sessionId ? await battleService.getSnapshot(sessionId) : null);
    if (!sessionId || !snapshot || snapshot.status !== "running" || !input.run.restRunSnapshot) {
      return {run: input.run, playerVault: vault, snapshot, evolved: false, message: "当前没有可进化的战斗会话。"};
    }
    const request = snapshot.requests?.p1;
    if (!request || request.wait || request.teamPreview || request.forceSwitch?.some(Boolean) || !request.active?.length) {
      return {run: input.run, playerVault: vault, snapshot, evolved: false, message: "当前不是行动请求。"};
    }
    const player = input.run.restRunSnapshot.players.p1;
    const team = player?.localTeam.pokemon || [];
    const nodeId = snapshot.nodeId || input.run.restRunSnapshot.currentNodeId || "";
    const records = input.run.soulmateBattleEvolutionByNodeId?.[nodeId] || [];
    const alreadyEvolved = records.map(record => record.sourcePlayerPokemonId);
    for (let activeIndex = 0; activeIndex < request.active.length; activeIndex += 1) {
      if (!request.active[activeIndex]) continue;
      const row = request.side?.pokemon?.filter(pokemon => pokemon.active)[activeIndex] || request.side?.pokemon?.find(pokemon => pokemon.active);
      const local = localPokemonForBattleRequestRow(team, row);
      if (!local) continue;
      const tree = dex.getPokemonEvolutionTree(local.speciesId);
      const seed = `${input.run.seed}:${nodeId}:${snapshot.turn}:${local.sourcePlayerPokemonId || local.localPokemonId}:soulmate-battle-evolution`;
      const evaluated = evaluateFormalSoulmateBattleEvolutionV4({
        localPokemon: local,
        vault,
        evolutionEdges: tree.edges,
        evolutionStageCount: vaultEvolutionStageCount(tree.edges),
        seed,
        chance: input.chanceOverride,
        friendshipOverride: input.friendshipOverride,
        alreadyEvolvedSourcePlayerPokemonIds: alreadyEvolved,
      });
      if (!evaluated.ok) continue;
      const message = `${evaluated.candidate.displayName}进化了！`;
      const formeResult = await battleService.applyPermanentFormeChange({
        sessionId,
        playerId: "p1",
        activeIndex,
        toSpeciesId: evaluated.candidate.toSpeciesId,
        message,
      });
      if (!formeResult.ok) {
        return {run: input.run, playerVault: vault, snapshot: formeResult.snapshot as BattleSessionSnapshotV4, evolved: false, message: formeResult.message};
      }
      const now = new Date().toISOString();
      const evolution = {
        ...evaluated.candidate,
        battleNodeId: nodeId,
        battleSessionId: sessionId,
        turn: snapshot.turn,
        createdAt: now,
      };
      const displaySyncedRun = syncFormalRunSoulmateEvolutionDisplay(input.run, evolution, dex);
      const nextRun = {
        ...displaySyncedRun,
        soulmateBattleEvolutionByNodeId: {
          ...(input.run.soulmateBattleEvolutionByNodeId || {}),
          [nodeId]: [...records, evolution],
        },
        updatedAt: now,
      };
      const nextVault = applyFormalSoulmateBattleEvolutionToVaultV4({
        vault,
        sourcePlayerPokemonId: evaluated.candidate.sourcePlayerPokemonId,
        toSpeciesId: evaluated.candidate.toSpeciesId,
      });
      return {
        run: nextRun,
        playerVault: nextVault,
        snapshot: formeResult.snapshot as BattleSessionSnapshotV4,
        evolved: true,
        evolution,
        message,
      };
    }
    return {run: input.run, playerVault: vault, snapshot, evolved: false};
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

export function createPlayerVaultPokemonDetailView(dex: ReturnType<typeof createShowdownDexService>, pokemon: PlayerPokemonRecordV4): PlayerVaultPokemonDetailViewV4 {
  const detail = safePokemonDetailForVault(dex, pokemon.speciesId);
  const speciesName = detail?.nameZh || detail?.name || pokemon.speciesId;
  const title = pokemon.nickname ? `${pokemon.nickname}（${speciesName}）` : speciesName;
  const ability = detail?.abilities.find(entry => entry.id === pokemon.abilityId);
  const abilityName = ability?.nameZh || ability?.name || pokemon.abilityId || "特性未知";
  const level = Math.max(1, Math.min(100, Math.floor(Number(pokemon.level || 50))));
  const nature = natureViewForVault(dex, pokemon.nature);
  const stats = vaultStatRows(dex, pokemon, level);
  const moves = pokemon.moves.slice(0, 4).map((move, index) => vaultMoveView(dex, move, index));
  const evolutions = vaultEvolutionViews(dex, pokemon.speciesId);
  const originLabel = vaultPokemonOriginLabel(pokemon);
  const heldItemName = pokemon.heldItemId ? vaultHeldItemLabel(dex, pokemon.heldItemId) : "无";
  return {
    title,
    speciesName,
    subtitle: `Lv.${level} · ${pokemon.gender || "N"} · ${abilityName}${pokemon.shiny ? " · ★ 闪光" : ""}`,
    spriteUrl: pokemon.shiny
      ? detail?.sprites.frontShinyUrl || detail?.sprites.fallbackFrontShinyUrl || detail?.sprites.frontUrl || detail?.sprites.fallbackFrontUrl || detail?.sprites.iconUrl || ""
      : detail?.sprites.frontUrl || detail?.sprites.fallbackFrontUrl || detail?.sprites.iconUrl || "",
    shiny: Boolean(pokemon.shiny),
    overview: [
      {label: "来源", value: originLabel},
      {label: "等级", value: `Lv.${level}`},
      {label: "性格", value: nature},
      {label: "特性", value: abilityName},
      {label: "携带", value: heldItemName},
      {label: "亲密", value: String(Math.max(0, Math.floor(Number(pokemon.friendship || 0))))},
      {label: "获得日期", value: formatVaultDate(pokemon.metAt)},
    ],
    stats,
    moves,
    evolutions,
  };
}

export function createPlayerPokemonHonorBadgeViews(dex: ReturnType<typeof createShowdownDexService>, pokemon: PlayerPokemonRecordV4): PlayerPokemonHonorBadgeViewV4[] {
  return PLAYER_POKEMON_HONOR_BADGES_V4.map(badge => {
    const state = playerPokemonHonorBadgeStateV4(pokemon.honors, badge, playerPokemonHonorTargetsForBadgeView(dex, badge));
    return {
      ...state,
      iconPath: badge.assetPath,
      statusLabel: state.earned ? "已点亮" : `${state.completedTargetCount}/${state.targetCount}`,
      missingTargets: state.targets.filter((target): target is PlayerPokemonHonorTargetV4 & {completed: false} => !target.completed),
    };
  });
}

export function releasePlayerVaultPokemon(
  dex: ReturnType<typeof createShowdownDexService>,
  input: {vault: PlayerVaultV4 | undefined | null; pokemonId: string},
): PlayerVaultPokemonReleaseViewResultV4 {
  const result = releasePlayerVaultPokemonV4(input.vault, input.pokemonId);
  if (!result.ok) return result;
  const pokemonName = createPlayerVaultPokemonDetailView(dex, result.releasedPokemon).title;
  return {
    ...result,
    message: result.returnedHeldItemId
      ? `已放生 ${pokemonName}。携带道具已放回道具箱。`
      : `已放生 ${pokemonName}。`,
  };
}

function vaultHeldItemLabel(dex: ReturnType<typeof createShowdownDexService>, itemId: string): string {
  try {
    const detail = dex.getItemDetail(itemId);
    return detail.nameZh || detail.name || itemId;
  } catch {
    return itemId;
  }
}

function playerPokemonHonorTargetsForBadgeView(dex: ReturnType<typeof createShowdownDexService>, badge: (typeof PLAYER_POKEMON_HONOR_BADGES_V4)[number]): PlayerPokemonHonorTargetV4[] {
  const rows = dex.searchDex({category: "trainers", query: badge.id === "villain" ? "type:villain" : badge.region || "", limit: 300}).rows.filter(row => row.category === "trainers");
  const targets = rows.flatMap(row => {
    try {
      const detail = dex.getTrainerDetail(row.id);
      if (!badge.targetKinds.includes(detail.trainerType as PlayerPokemonHonorTargetV4["trainerType"])) return [];
      if (badge.region && detail.region !== badge.region) return [];
      return [{
        trainerId: detail.id,
        name: detail.nameZh || detail.name || detail.id,
        trainerType: detail.trainerType as PlayerPokemonHonorTargetV4["trainerType"],
        region: detail.region,
      }];
    } catch {
      return [];
    }
  });
  return Array.from(new Map(targets.map(target => [target.trainerId, target])).values())
    .sort((a, b) => a.region.localeCompare(b.region, "zh-Hans-CN") || honorTrainerTypeSort(a.trainerType) - honorTrainerTypeSort(b.trainerType) || a.name.localeCompare(b.name, "zh-Hans-CN"));
}

function honorTrainerTypeSort(type: PlayerPokemonHonorTargetV4["trainerType"]): number {
  if (type === "gym") return 0;
  if (type === "elite4") return 1;
  if (type === "champion") return 2;
  return 3;
}

function vaultPokemonOriginLabel(pokemon: PlayerPokemonRecordV4): string {
  if (pokemon.originKind === "soulmate") return "灵魂伴侣";
  if (pokemon.originKind === "debug-custom") return "调试创建";
  return "宝可梦存储箱";
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

function safePokemonDetailForVault(dex: ReturnType<typeof createShowdownDexService>, speciesId: string) {
  try {
    return dex.getPokemonDetail(speciesId);
  } catch {
    return null;
  }
}

function natureViewForVault(dex: ReturnType<typeof createShowdownDexService>, natureId: string): string {
  const nature = getNatureEffectsV4().find(entry => entry.id === natureId || entry.name === natureId || entry.nameZh === natureId);
  const natureName = dex.translateDexLabel("natures", nature?.name || natureId || "");
  if (!nature) return natureName || "未知";
  const neutral = !nature.plus && !nature.minus;
  return `${natureName} · ${neutral ? "无修正" : `+${dex.translateDexLabel("stats", nature.plus)} / -${dex.translateDexLabel("stats", nature.minus)}`}`;
}

function vaultStatRows(dex: ReturnType<typeof createShowdownDexService>, pokemon: PlayerPokemonRecordV4, level: number): PlayerVaultPokemonDetailViewV4["stats"] {
  const statIds = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
  let actual: Record<string, number> = {};
  try {
    actual = dex.calculatePokemonStats({speciesId: pokemon.speciesId, level, nature: pokemon.nature, ivs: pokemon.ivs, evs: pokemon.evs}).stats;
  } catch {
    actual = {};
  }
  return statIds.map(id => ({
    id,
    label: dex.translateDexLabel("stats", id),
    actual: Math.max(0, Math.floor(Number(actual[id] || 0))),
    iv: Math.max(0, Math.floor(Number(pokemon.ivs[id] || 0))),
    ev: Math.max(0, Math.floor(Number(pokemon.evs[id] || 0))),
  }));
}

function vaultMoveView(dex: ReturnType<typeof createShowdownDexService>, move: PlayerPokemonMoveRecordV4, index: number): PlayerVaultPokemonDetailViewV4["moves"][number] {
  try {
    const detail = dex.getMoveDetail(move.moveId);
    return {
      slot: index + 1,
      id: detail.id,
      name: detail.nameZh || detail.name || move.moveId,
      type: detail.type || dex.translateDexLabel("types", detail.typeId || ""),
      category: detail.category || dex.translateDexLabel("categories", detail.categoryId || ""),
      power: detail.power > 0 ? String(detail.power) : "-",
      pp: `${move.remainingPp ?? detail.pp}/${move.maxPp ?? detail.pp}`,
    };
  } catch {
    return {slot: index + 1, id: move.moveId, name: move.moveId || "未知招式", type: "-", category: "-", power: "-", pp: `${move.remainingPp ?? "-"}/${move.maxPp ?? "-"}`};
  }
}

function vaultEvolutionViews(dex: ReturnType<typeof createShowdownDexService>, speciesId: string): PlayerVaultPokemonDetailViewV4["evolutions"] {
  try {
    const tree = dex.getPokemonEvolutionTree(speciesId);
    const edges = tree.edges.filter(edge => edge.fromSpeciesId === speciesId || edge.toSpeciesId === speciesId);
    const evolutionStageCount = vaultEvolutionStageCount(tree.edges);
    return edges.map(edge => ({
      from: edge.fromSpeciesNameZh || edge.fromSpeciesName || edge.fromSpeciesId,
      to: edge.toSpeciesNameZh || edge.toSpeciesName || edge.toSpeciesId,
      method: vaultEvolutionMethod(dex, edge, vaultEvolutionIndexForEdge(tree.edges, edge), evolutionStageCount),
    }));
  } catch {
    return [];
  }
}

function vaultEvolutionMethod(dex: ReturnType<typeof createShowdownDexService>, edge: Parameters<typeof normalizeSoulmateEvolutionRequirementV4>[0] & {evoLevel?: number; evoMove?: string; evoCondition?: string; evoRegion?: string}, evolutionIndex: number, evolutionStageCount: number): string {
  const requirement = normalizeSoulmateEvolutionRequirementV4(edge);
  const itemLabel = requirement.requirementKind === "linking-cord"
    ? "通讯绳"
    : requirement.requirementKind === "specific-item"
      ? dex.translateDexLabel("items", edge?.evoItem || requirement.itemId)
      : "通用进化石";
  const friendshipRequirement = soulmateEvolutionFriendshipRequirementForChainV4(evolutionIndex, evolutionStageCount);
  const parts = [
    friendshipRequirement === null
      ? "亲密度达到后续开放门槛后"
      : `亲密度达到 ${friendshipRequirement} 后`,
    `使用 ${itemLabel}进化`,
  ];
  if (edge?.evoLevel) parts.push(`原条件 Lv.${edge.evoLevel}`);
  if (edge?.evoMove) parts.push(`原条件 学会 ${dex.translateDexLabel("moves", edge.evoMove)}`);
  if (edge?.evoCondition) parts.push(edge.evoCondition);
  if (edge?.evoRegion) parts.push(edge.evoRegion);
  return parts.join(" · ");
}

function vaultEvolutionIndexForEdge(edges: Array<{fromSpeciesId: string; toSpeciesId: string}>, target: {fromSpeciesId: string; toSpeciesId: string}): number {
  const incoming = new Map(edges.map(edge => [edge.toSpeciesId, edge.fromSpeciesId]));
  let index = 0;
  let cursor = target.fromSpeciesId;
  const visited = new Set<string>();
  while (incoming.has(cursor) && !visited.has(cursor)) {
    visited.add(cursor);
    index += 1;
    cursor = incoming.get(cursor)!;
  }
  return index;
}

function vaultEvolutionStageCount(edges: Array<{fromSpeciesId: string; toSpeciesId: string}>): number {
  const incoming = new Map(edges.map(edge => [edge.toSpeciesId, edge.fromSpeciesId]));
  const outgoing = new Map<string, string[]>();
  for (const edge of edges) {
    const next = outgoing.get(edge.fromSpeciesId) || [];
    next.push(edge.toSpeciesId);
    outgoing.set(edge.fromSpeciesId, next);
  }
  const roots = new Set(edges.map(edge => edge.fromSpeciesId).filter(speciesId => !incoming.has(speciesId)));
  const stack = [...roots].map(speciesId => ({speciesId, depth: 0, visited: new Set<string>()}));
  let maxDepth = edges.length ? 1 : 0;
  while (stack.length) {
    const current = stack.pop()!;
    if (current.visited.has(current.speciesId)) continue;
    const visited = new Set(current.visited);
    visited.add(current.speciesId);
    const nextSpecies = outgoing.get(current.speciesId) || [];
    if (!nextSpecies.length) {
      maxDepth = Math.max(maxDepth, current.depth);
      continue;
    }
    for (const next of nextSpecies) stack.push({speciesId: next, depth: current.depth + 1, visited});
  }
  return maxDepth;
}

function localPokemonForBattleRequestRow(team: LocalPokemonV4[], row: {ident?: string; pokeball?: string; details?: string} | undefined): LocalPokemonV4 | null {
  if (!row) return null;
  const keys = [
    row.pokeball,
    row.ident?.split(":").slice(1).join(":"),
    row.details?.split(",")[0],
  ].map(normalizeBattleIdentityKey).filter(Boolean);
  return team.find(pokemon => {
    const pokemonKeys = [
      pokemon.showdownIdentityToken,
      pokemon.showdownId,
      pokemon.pokeballId,
      pokemon.localPokemonId,
      pokemon.nickname,
      pokemon.name,
      pokemon.nameZh,
      pokemon.speciesId,
    ].map(normalizeBattleIdentityKey).filter(Boolean);
    return keys.some(key => pokemonKeys.includes(key));
  }) || null;
}

function syncFormalRunSoulmateEvolutionDisplay(
  run: FormalGameRunV4,
  evolution: FormalSoulmateBattleEvolutionApplyResultV4["evolution"],
  dex: ReturnType<typeof createShowdownDexService>,
): FormalGameRunV4 {
  if (!evolution) return run;
  const detail = safePokemonDetailForEvolutionDisplay(dex, evolution.toSpeciesId);
  const patchTeam = (team: LocalTeamV4 | null | undefined): LocalTeamV4 | null | undefined => {
    if (!team) return team;
    return {
      ...team,
      pokemon: team.pokemon.map(pokemon => patchSoulmateEvolutionPokemonDisplay(pokemon, evolution, detail, dex)),
    };
  };
  const patchPlayer = (player: TrainingPlayerDraftV4 | null | undefined): TrainingPlayerDraftV4 | null | undefined => {
    if (!player) return player;
    return {...player, localTeam: patchTeam(player.localTeam) || player.localTeam};
  };
  const patchPlayers = <T extends Partial<Record<ShowdownPlayerIdV4, TrainingPlayerDraftV4>>>(players: T): T => {
    const next = {...players};
    if (next.p1) next.p1 = patchPlayer(next.p1) as TrainingPlayerDraftV4;
    return next;
  };
  const patchScenarioPlayers = (players: TrainingPlayerDraftV4[]): TrainingPlayerDraftV4[] => (
    players.map(player => player.playerId === "p1" ? patchPlayer(player) || player : player)
  );
  const patchNode = (node: TrainingRunGameNodeV4): TrainingRunGameNodeV4 => ({
    ...node,
    participants: patchPlayers(node.participants),
  });
  const patchRestRun = (restRun: TrainingRunGameV4 | null): TrainingRunGameV4 | null => restRun ? {
    ...restRun,
    players: patchPlayers(restRun.players),
    scenario: {
      ...restRun.scenario,
      players: patchScenarioPlayers(restRun.scenario.players),
    },
    gameMap: restRun.gameMap.map(patchNode),
    updatedAt: new Date().toISOString(),
  } : restRun;
  return {
    ...run,
    playerTeam: patchTeam(run.playerTeam) || run.playerTeam,
    roundPlan: run.roundPlan.map(round => ({
      ...round,
      participants: patchPlayers(round.participants),
    })),
    restRunSnapshot: patchRestRun(run.restRunSnapshot),
  };
}

function patchSoulmateEvolutionPokemonDisplay(
  pokemon: LocalPokemonV4,
  evolution: NonNullable<FormalSoulmateBattleEvolutionApplyResultV4["evolution"]>,
  detail: DexPokemonDetail,
  dex: ReturnType<typeof createShowdownDexService>,
): LocalPokemonV4 {
  if (pokemon.localPokemonId !== evolution.localPokemonId && pokemon.sourcePlayerPokemonId !== evolution.sourcePlayerPokemonId) return pokemon;
  const level = Math.max(1, Math.min(100, Math.trunc(Number(pokemon.level) || 50)));
  const maxHp = Math.max(1, dex.calculatePokemonStats({
    speciesId: detail.id,
    level,
    nature: pokemon.nature || "Serious",
    evs: pokemon.evs,
    ivs: pokemon.ivs,
  }).stats.hp);
  const oldMaxHp = Math.max(1, Number(pokemon.maxHp) || maxHp);
  const oldEntryHp = Math.max(0, Math.min(oldMaxHp, Number(pokemon.entryHp) || 0));
  const hpRatio = oldMaxHp > 0 ? oldEntryHp / oldMaxHp : 1;
  const entryHp = Math.max(0, Math.min(maxHp, Math.round(maxHp * hpRatio)));
  const frontSpriteUrl = detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl;
  const backSpriteUrl = detail.sprites.backUrl || detail.sprites.fallbackBackUrl || frontSpriteUrl;
  const frontShinySpriteUrl = detail.sprites.frontShinyUrl || detail.sprites.fallbackFrontShinyUrl || frontSpriteUrl;
  const backShinySpriteUrl = detail.sprites.backShinyUrl || detail.sprites.fallbackBackShinyUrl || backSpriteUrl || frontShinySpriteUrl;
  return {
    ...pokemon,
    speciesId: detail.id,
    showdownId: detail.id,
    name: pokemon.nickname || detail.name,
    nameZh: pokemon.nickname || detail.nameZh || detail.name,
    maxHp,
    entryHp,
    spriteUrl: frontSpriteUrl,
    shinySpriteUrl: frontShinySpriteUrl,
    frontSpriteUrl,
    backSpriteUrl,
    frontShinySpriteUrl,
    backShinySpriteUrl,
    iconUrl: detail.sprites.iconUrl,
    iconStyle: detail.sprites.iconStyle,
  };
}

function safePokemonDetailForEvolutionDisplay(dex: ReturnType<typeof createShowdownDexService>, speciesId: string): DexPokemonDetail {
  try {
    return dex.getPokemonDetail(speciesId);
  } catch {
    return dex.getPokemonDetail("pikachu");
  }
}

function normalizeBattleIdentityKey(value: unknown): string {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

function formatVaultDate(value: unknown): string {
  const time = Date.parse(String(value || ""));
  if (!Number.isFinite(time)) return "未知";
  return new Date(time).toLocaleDateString("zh-CN");
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
