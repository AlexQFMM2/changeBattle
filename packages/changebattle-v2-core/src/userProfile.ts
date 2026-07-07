import {normalizeBagStateV4, type BagStateV4} from "./bagState.js";
import {normalizeBattlePreferenceV4, type BattlePreferenceV4} from "./battlePreference.js";
import {normalizeLocalPokemonV4, type LocalPokemonV4} from "./pokemonInstance.js";
import {normalizeBattlePointsV4, normalizeStarChartV4} from "./starChartRules.js";
import type {StarChartStateV4} from "./starChartCatalog.js";

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

export type UserProfileTrainerDefaultsV2 = {
  id: string;
  avatarAsset: string;
  frontAsset: string;
  frontGifAsset?: string;
  backAsset?: string;
};

export const USER_PROFILE_VERSION_V2 = 1 as const;

export function normalizeTrainerVaultV2(value?: unknown): TrainerVaultV2 {
  const raw = isPlainRecord(value) ? value : {};
  const rawBag = isPlainRecord(raw.bag) ? raw.bag : {};
  const maxSize = Math.max(1, Math.floor(Number(rawBag.maxSize || 80)));
  const pokemonBox = Array.isArray(raw.pokemonBox)
    ? raw.pokemonBox.map((pokemon, index) => normalizeLocalPokemonV4(pokemon, {fallbackId: `box-pokemon-${index + 1}`}))
    : [];
  return {
    version: 1,
    bag: normalizeBagStateV4({...rawBag, maxSize}, {defaultMaxSize: maxSize}),
    pokemonBox,
  };
}

export function normalizeUserProfileV2(profile: Partial<UserProfileV2> | undefined | null, trainer: UserProfileTrainerDefaultsV2, nowIso = new Date().toISOString()): UserProfileV2 {
  const raw = isPlainRecord(profile) ? profile : {};
  const createdAt = normalizeIsoText(raw.createdAt) || nowIso;
  return {
    version: USER_PROFILE_VERSION_V2,
    id: normalizeText(raw.id) || createFallbackId("profile"),
    name: normalizeProfileNameV2(raw.name),
    trainerId: trainer.id,
    avatarAsset: normalizeText(raw.avatarAsset) || trainer.avatarAsset,
    frontAsset: normalizeText(raw.frontAsset) || trainer.frontAsset,
    frontGifAsset: normalizeOptionalText(raw.frontGifAsset) || trainer.frontGifAsset,
    backAsset: normalizeOptionalText(raw.backAsset) || trainer.backAsset,
    createdAt,
    updatedAt: normalizeIsoText(raw.updatedAt) || createdAt,
    battlePreference: normalizeBattlePreferenceV4(raw.battlePreference),
    battlePoints: normalizeBattlePointsV4(raw.battlePoints),
    starChart: normalizeStarChartV4(raw.starChart as StarChartStateV4 | null | undefined),
    trainerVault: normalizeTrainerVaultV2(raw.trainerVault),
  };
}

export function normalizeProfileNameV2(name: unknown): string {
  const next = normalizeText(name);
  return next || "训练师";
}

function normalizeText(value: unknown): string {
  return String(value || "").trim();
}

function normalizeOptionalText(value: unknown): string | undefined {
  const text = normalizeText(value);
  return text || undefined;
}

function normalizeIsoText(value: unknown): string {
  const text = normalizeText(value);
  if (!text) return "";
  const time = Date.parse(text);
  return Number.isFinite(time) ? new Date(time).toISOString() : "";
}

function createFallbackId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
