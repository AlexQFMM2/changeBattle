import {createShowdownDexService, type DexSearchRequest, type ShowdownDexLike} from "@changebattle-v2/showdown-dex-core";
import {getPokemonBattleProfileV4} from "@changebattle-v2/showdown-battle-core/battleProfiles";
import {
  REST_CENTER_LEFT_SIDE_ACTIONS_V4,
  REST_CENTER_PAPER_ACTIONS_V4,
  REST_CENTER_RIGHT_SIDE_ACTIONS_V4,
  type RestCenterActionEntryV4,
} from "@changebattle-v2/core";
import {createBrowserTrainingRunAdapter, createTrainingRunApi, normalizeBattlePreferenceV4, type BagStateV4, type BattlePreferenceV4, type LocalPokemonV4, type TrainingRunStorageAdapter} from "./training.js";
import {createBrowserFormalGameRunAdapter, createFormalGameRunApi, createFormalShopProductViewsV4, type FormalGameRunStorageAdapter} from "./formalGame.js";
import type {CoopPartnerPreferenceV4, FormalBattleResultFinalizeReasonV4, FormalBattleResultFinalizeResultV4, FormalBattleSessionPreparationV4, FormalGameModeV4, FormalGameRunV4, FormalGameSettlementV4, FormalMedicalInsuranceChoiceResultV4, FormalMedicalInsuranceChoiceV4, FormalMedicalInsuranceEffectsV4, FormalMedicalInsuranceOfferV4, FormalRestTeamHealResultV4, FormalSettlementReasonV4, FormalTrainingGroundLessonViewV4} from "./formalGame.js";
import {applyBattleSessionToRun, createBattleServiceClient, patchBattleRunLocalTeamsFromSnapshot, type BattleServiceClientV4} from "./battle.js";
import {generateRandomBattleTeamPreviewV4, type RandomBattleTeamPreviewInputV4} from "./teamGenerator.js";
import {generateBossTrainerPresetTeamsV4, type BossTrainerPresetTeamV4, type BossTrainerPresetMatrixSummaryV4} from "./bossTeamGenerator.js";
import {
  enableTestModeForProfileV4,
  getStarChartCatalogV4,
  normalizeBattlePointsV4,
  normalizeStarChartV4,
  starChartHasBattlePracticeMasteryV4,
  starChartHasEmergencyMedicalCareV4,
  starChartHasFreeMedicalCareV4,
  starChartHasMedicalInsuranceV4,
  starChartHasOutpatientMedicalCareV4,
  starterCandidateCountForStarChart,
  unlockStarChartNodeForProfileV4,
  type StarChartStateV4,
} from "./starChart.js";
export {REST_CENTER_LEFT_SIDE_ACTIONS_V4, REST_CENTER_PAPER_ACTIONS_V4, REST_CENTER_RIGHT_SIDE_ACTIONS_V4};
export type {RestCenterActionEntryV4};
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

export type TrainerVaultV2 = {
  version: 1;
  bag: BagStateV4;
  pokemonBox: LocalPokemonV4[];
};

export type UserProfileV2 = {
  version: 1;
  id: string;
  name: string;
  trainerId: string;
  avatarAsset: string;
  frontAsset: string;
  frontGifAsset?: string;
  backAsset?: string;
  createdAt: string;
  updatedAt: string;
  battlePreference: BattlePreferenceV4;
  battlePoints: number;
  starChart: StarChartStateV4;
  trainerVault: TrainerVaultV2;
};

export type UserProfileDraftV2 = {
  name?: string;
  trainerId?: string;
  avatarAsset?: string;
};

export type UserProfileStorageAdapter = {
  loadUserProfile(): Promise<UserProfileV2 | null>;
  saveUserProfile(profile: UserProfileV2): Promise<UserProfileV2>;
  deleteUserProfile(): Promise<void>;
};

export type DesktopUserProfileBridge = UserProfileStorageAdapter & {
  getUserProfilePath?: () => Promise<string>;
};

export type DesktopTrainingRunBridge = TrainingRunStorageAdapter;
export type DesktopFormalGameRunBridge = FormalGameRunStorageAdapter;

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
  finalizeFormalBattleResult(run: FormalGameRunV4, sessionId: string, reason?: FormalBattleResultFinalizeReasonV4): Promise<FormalBattleResultFinalizeResultV4>;
};

export type DesktopBattleServiceBridge = BattleServiceClientV4;

export type ChangeBattleV2ApiOptions = {
  dex?: ShowdownDexLike;
  resourcePrefix?: string;
  translate?: (table: string, value: string) => string;
  userProfileAdapter?: UserProfileStorageAdapter;
  trainingRunAdapter?: TrainingRunStorageAdapter;
  formalGameRunAdapter?: FormalGameRunStorageAdapter;
  battleServiceClient?: BattleServiceClientV4;
  battleServiceUrl?: string;
};

const USER_PROFILE_VERSION = 1 as const;
const DEFAULT_BROWSER_PROFILE_KEY = "changebattle-v2:user-profile";

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
}

export {
  starChartHasBattlePracticeMasteryV4,
  starChartHasEmergencyMedicalCareV4,
  starChartHasFreeMedicalCareV4,
  starChartHasMedicalInsuranceV4,
  starChartHasOutpatientMedicalCareV4,
};

export function createDefaultUserProfile(draft: UserProfileDraftV2 = {}, now = new Date()): UserProfileV2 {
  const trainer = trainerFor(draft.trainerId);
  const createdAt = now.toISOString();
  return {
    version: USER_PROFILE_VERSION,
    id: createId(),
    name: normalizeName(draft.name),
    trainerId: trainer.id,
    avatarAsset: draft.avatarAsset || trainer.avatarAsset,
    frontAsset: trainer.frontAsset,
    frontGifAsset: trainer.frontGifAsset,
    backAsset: trainer.backAsset,
    createdAt,
    updatedAt: createdAt,
    battlePreference: normalizeBattlePreferenceV4(),
    battlePoints: 0,
    starChart: normalizeStarChartV4(),
    trainerVault: normalizeTrainerVault(),
  };
}

export function updateUserProfile(profile: UserProfileV2, draft: UserProfileDraftV2 = {}, now = new Date()): UserProfileV2 {
  const trainer = trainerFor(draft.trainerId || profile.trainerId);
  return {
    version: USER_PROFILE_VERSION,
    id: profile.id,
    name: normalizeName(draft.name ?? profile.name),
    trainerId: trainer.id,
    avatarAsset: draft.avatarAsset || profile.avatarAsset || trainer.avatarAsset,
    frontAsset: trainer.frontAsset,
    frontGifAsset: trainer.frontGifAsset,
    backAsset: trainer.backAsset,
    createdAt: profile.createdAt,
    updatedAt: now.toISOString(),
    battlePreference: normalizeBattlePreferenceV4(profile.battlePreference),
    battlePoints: normalizeBattlePointsV4(profile.battlePoints),
    starChart: normalizeStarChartV4(profile.starChart),
    trainerVault: normalizeTrainerVault(profile.trainerVault),
  };
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

function normalizeName(name: string | undefined): string {
  const next = (name || "").trim();
  return next || "训练师";
}

function normalizeProfile(profile: UserProfileV2): UserProfileV2 {
  const trainer = trainerFor(profile.trainerId);
  return {
    version: USER_PROFILE_VERSION,
    id: profile.id || createId(),
    name: normalizeName(profile.name),
    trainerId: trainer.id,
    avatarAsset: profile.avatarAsset || trainer.avatarAsset,
    frontAsset: profile.frontAsset || trainer.frontAsset,
    frontGifAsset: profile.frontGifAsset || trainer.frontGifAsset,
    backAsset: profile.backAsset || trainer.backAsset,
    createdAt: profile.createdAt || new Date().toISOString(),
    updatedAt: profile.updatedAt || profile.createdAt || new Date().toISOString(),
    battlePreference: normalizeBattlePreferenceV4(profile.battlePreference),
    battlePoints: normalizeBattlePointsV4(profile.battlePoints),
    starChart: normalizeStarChartV4(profile.starChart),
    trainerVault: normalizeTrainerVault(profile.trainerVault),
  };
}

function normalizeTrainerVault(value?: unknown): TrainerVaultV2 {
  const raw = isPlainRecord(value) ? value : {};
  const rawBag = isPlainRecord(raw.bag) ? raw.bag : {};
  const maxSize = Math.max(1, Math.floor(Number(rawBag.maxSize || 80)));
  const rawItems = Array.isArray(rawBag.items) ? rawBag.items : [];
  const pokemonBox = Array.isArray(raw.pokemonBox)
    ? raw.pokemonBox.filter(isPlainRecord).map(pokemon => clone(pokemon) as LocalPokemonV4)
    : [];
  return {
    version: 1,
    bag: {
      maxSize,
      items: rawItems.filter(isPlainRecord).map(item => clone(item) as BagStateV4["items"][number]).slice(0, maxSize),
      battleBagEnabled: Boolean(rawBag.battleBagEnabled),
    },
    pokemonBox,
  };
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
