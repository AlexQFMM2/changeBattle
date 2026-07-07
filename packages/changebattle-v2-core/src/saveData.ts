import {normalizePlayerVaultV4, type PlayerVaultV4} from "./playerVault.js";
import {normalizeUserProfileV2, type UserProfileTrainerDefaultsV2, type UserProfileV2} from "./userProfile.js";

export const SAVE_DATA_SCHEMA_VERSION_V4 = 1 as const;

export type SaveDataTableNameV4 = "profile" | "playerVault" | "trainingRun" | "formalRun";

export type NormalizeSaveTableOptionsV4 = {
  trainerDefaults?: UserProfileTrainerDefaultsV2;
  nowIso?: string;
};

export type NormalizeSaveTableResultV4<T = unknown> = {
  tableName: SaveDataTableNameV4;
  schemaVersion: typeof SAVE_DATA_SCHEMA_VERSION_V4;
  owner: "core" | "api";
  value: T;
};

export function normalizeSaveTableV4(tableName: "profile", value: unknown, options: NormalizeSaveTableOptionsV4 & {trainerDefaults: UserProfileTrainerDefaultsV2}): NormalizeSaveTableResultV4<UserProfileV2>;
export function normalizeSaveTableV4(tableName: "playerVault", value: unknown, options?: NormalizeSaveTableOptionsV4): NormalizeSaveTableResultV4<PlayerVaultV4>;
export function normalizeSaveTableV4(tableName: "trainingRun" | "formalRun", value: unknown, options?: NormalizeSaveTableOptionsV4): NormalizeSaveTableResultV4<unknown>;
export function normalizeSaveTableV4(tableName: SaveDataTableNameV4, value: unknown, options: NormalizeSaveTableOptionsV4 = {}): NormalizeSaveTableResultV4 {
  if (tableName === "profile") {
    if (!options.trainerDefaults) {
      throw new Error("normalizeSaveTableV4(profile) requires trainerDefaults");
    }
    return {
      tableName,
      schemaVersion: SAVE_DATA_SCHEMA_VERSION_V4,
      owner: "core",
      value: normalizeUserProfileV2(value as Partial<UserProfileV2> | null | undefined, options.trainerDefaults, options.nowIso),
    };
  }
  if (tableName === "playerVault") {
    return {
      tableName,
      schemaVersion: SAVE_DATA_SCHEMA_VERSION_V4,
      owner: "core",
      value: normalizePlayerVaultV4(value),
    };
  }
  return {
    tableName,
    schemaVersion: SAVE_DATA_SCHEMA_VERSION_V4,
    owner: "api",
    value,
  };
}
