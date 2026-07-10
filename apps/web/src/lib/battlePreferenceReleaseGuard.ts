import {normalizeBattlePreferenceV4, type BattlePreferenceV4, type UserProfileV2} from "@changebattle-v2/api";

export function releaseGuardBattlePreferenceV4(
  battlePreference: Partial<BattlePreferenceV4> | null | undefined,
  debugFeatureEnabled: boolean,
): BattlePreferenceV4 {
  const normalized = normalizeBattlePreferenceV4(battlePreference);
  if (debugFeatureEnabled) return normalized;
  return normalized.competitionMode === "standard"
    ? normalized
    : {...normalized, competitionMode: "standard"};
}

export function releaseGuardProfileBattlePreferenceV4(
  profile: UserProfileV2,
  debugFeatureEnabled: boolean,
): UserProfileV2 {
  const battlePreference = releaseGuardBattlePreferenceV4(profile.battlePreference, debugFeatureEnabled);
  return battlePreference === profile.battlePreference ? profile : {...profile, battlePreference};
}
