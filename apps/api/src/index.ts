import {createShowdownDexService, type DexSearchRequest, type ShowdownDexLike} from "@changebattle-v2/showdown-dex-core";
import {createBrowserTrainingRunAdapter, createTrainingRunApi, type TrainingRunStorageAdapter} from "./training.js";
import {createBattleServiceClient, type BattleServiceClientV4} from "./battle.js";

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

export type ChangeBattleV2ApiOptions = {
  dex?: ShowdownDexLike;
  resourcePrefix?: string;
  translate?: (table: string, value: string) => string;
  userProfileAdapter?: UserProfileStorageAdapter;
  trainingRunAdapter?: TrainingRunStorageAdapter;
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
      frontAsset: "/npc/player-front/rosa-spr-b2w2-rosa-b1af3eb8.png",
      backAsset: "/npc/player-back/rosa-b2w2-rosa-back-405f562e.png",
      avatarAsset: "/npc/avatars/6-asset-a73f3e71.webp",
    },
    {
      id: "nate",
      name: "共平",
      title: "合众训练师",
      frontAsset: "/npc/player-front/nate-spr-b2w2-nate-88f1e9d2.png",
      backAsset: "/npc/player-back/nate-b2w2-nate-back-e0cef62f.png",
      avatarAsset: "/npc/avatars/11-asset-fdb7e61e.webp",
    },
    {
      id: "dawn",
      name: "小光",
      title: "神奥训练师",
      frontAsset: "/npc/player-front/dawn-dp-dawn-a35e5a63.png",
      backAsset: "/npc/player-back/dawn-dp-dawn-back-65c7fd06.png",
      avatarAsset: "/npc/avatars/vsjasmine-79-vsjasmine-b8173b6d.png",
    },
    {
      id: "ethan",
      name: "响",
      title: "城都训练师",
      frontAsset: "/npc/player-front/ethan-hgss-ethan-6eefaecf.png",
      backAsset: "/npc/player-back/ethan-hgss-gold-back-46e97197.png",
      avatarAsset: "/npc/avatars/koga-vskoga-523872dc.png",
    },
    {
      id: "lyra",
      name: "琴音",
      title: "城都训练师",
      frontAsset: "/npc/player-front/lyra-hgss-lyra-fe4906cc.png",
      backAsset: "/npc/player-back/lyra-hgss-kotone-back-d2d0db32.png",
      avatarAsset: "/npc/avatars/alder-vsadeku-c7421c2b.png",
    },
  ],
  avatars: [],
};

TRAINER_CATALOG.avatars = TRAINER_CATALOG.trainers;

export function createChangeBattleV2Api(options: ChangeBattleV2ApiOptions = {}) {
  const dex = createShowdownDexService({
    dex: options.dex,
    resourcePrefix: options.resourcePrefix,
    translate: options.translate,
  });
  const userProfiles = options.userProfileAdapter || createBrowserUserProfileAdapter();
  const trainingRuns = createTrainingRunApi(dex, options.trainingRunAdapter || createBrowserTrainingRunAdapter());
  const battleService = options.battleServiceClient || createBattleServiceClient(options.battleServiceUrl);

  return {
    dex,
    searchDex: (request: DexSearchRequest = {}) => dex.searchDex(request),
    getPokemonDetail: (id: string) => dex.getPokemonDetail(id),
    getMoveDetail: (id: string) => dex.getMoveDetail(id),
    getAbilityDetail: (id: string) => dex.getAbilityDetail(id),
    getItemDetail: (id: string) => dex.getItemDetail(id),
    getTrainerCatalog: () => clone(TRAINER_CATALOG),
    loadUserProfile: () => userProfiles.loadUserProfile(),
    createUserProfile: async (draft: UserProfileDraftV2 = {}) => {
      const profile = createDefaultUserProfile(draft);
      return userProfiles.saveUserProfile(profile);
    },
    updateUserProfile: async (profile: UserProfileV2, draft: UserProfileDraftV2 = {}) => {
      const next = updateUserProfile(profile, draft);
      return userProfiles.saveUserProfile(next);
    },
    deleteUserProfile: () => userProfiles.deleteUserProfile(),
    loadTrainingRun: () => trainingRuns.loadTrainingRun(),
    saveTrainingRun: trainingRuns.saveTrainingRun,
    deleteTrainingRun: trainingRuns.deleteTrainingRun,
    createTrainingRunGame: trainingRuns.createTrainingRunGame,
    createDefaultTrainingScenario: trainingRuns.createDefaultTrainingScenario,
    updateTrainingScenario: trainingRuns.updateTrainingScenario,
    createTrainingRunFromScenario: trainingRuns.createTrainingRunFromScenario,
    enterTrainingRest: trainingRuns.enterTrainingRest,
    getCurrentTrainingNode: trainingRuns.getCurrentTrainingNode,
    getNextTrainingNode: trainingRuns.getNextTrainingNode,
    randomizeTrainingScenario: trainingRuns.randomizeTrainingScenario,
    randomizeTrainingTeam: trainingRuns.randomizeTeam,
    createTrainingNpcCatalog: trainingRuns.createTrainingNpcCatalog,
    battleService,
  };
}

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
  };
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

function trainerFor(id: string | undefined): TrainerCatalogEntryV2 {
  return TRAINER_CATALOG.trainers.find(trainer => trainer.id === id) || TRAINER_CATALOG.trainers[0]!;
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
  };
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
export {useDexHook} from "./useDexHook.js";
export type {AbilityInfo, ItemInfo, MoveInfo, PokemonInfo, UseDexHookOptions} from "./useDexHook.js";
export * from "./battle.js";
export * from "./training.js";
export {createBrowserTrainingRunAdapter, createTrainingNpcCatalog, createTrainingRunApi} from "./training.js";
export type * from "./training.js";
export type * from "@changebattle-v2/showdown-dex-core";
