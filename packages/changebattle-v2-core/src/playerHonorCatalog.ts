export type PlayerHonorGroupV4 = {
  id: string;
  name: string;
  description: string;
};

export const PLAYER_HONOR_GROUPS_V4: PlayerHonorGroupV4[] = [];

export type PlayerPokemonHonorBadgeIdV4 =
  | "kanto"
  | "johto"
  | "hoenn"
  | "sinnoh"
  | "unova"
  | "kalos"
  | "alola"
  | "galar"
  | "paldea"
  | "villain";

export type PlayerPokemonHonorBadgeCatalogEntryV4 = {
  id: PlayerPokemonHonorBadgeIdV4;
  name: string;
  shortName: string;
  description: string;
  assetPath: string;
  region?: string;
  targetKinds: Array<"gym" | "elite4" | "champion" | "villain">;
};

export type PlayerPokemonHonorTargetV4 = {
  trainerId: string;
  name: string;
  trainerType: "gym" | "elite4" | "champion" | "villain";
  region: string;
};

export type PlayerPokemonHonorBadgeStateV4 = PlayerPokemonHonorBadgeCatalogEntryV4 & {
  earned: boolean;
  completedTargetCount: number;
  targetCount: number;
  targets: Array<PlayerPokemonHonorTargetV4 & {completed: boolean}>;
};

export const PLAYER_POKEMON_HONOR_BADGES_V4: PlayerPokemonHonorBadgeCatalogEntryV4[] = [
  {
    id: "kanto",
    name: "关都制霸奖章",
    shortName: "关都",
    description: "与这只宝可梦一同战胜关都地区的所有馆主、四天王与冠军。",
    assetPath: "runtime/soulmate-badges/kanto-medal.png",
    region: "关都地区",
    targetKinds: ["gym", "elite4", "champion"],
  },
  {
    id: "johto",
    name: "城都制霸奖章",
    shortName: "城都",
    description: "与这只宝可梦一同战胜城都地区的所有馆主、四天王与冠军。",
    assetPath: "runtime/soulmate-badges/johto-medal.png",
    region: "城都地区",
    targetKinds: ["gym", "elite4", "champion"],
  },
  {
    id: "hoenn",
    name: "丰缘制霸奖章",
    shortName: "丰缘",
    description: "与这只宝可梦一同战胜丰缘地区的所有馆主、四天王与冠军。",
    assetPath: "runtime/soulmate-badges/hoenn-medal.png",
    region: "丰缘地区",
    targetKinds: ["gym", "elite4", "champion"],
  },
  {
    id: "sinnoh",
    name: "神奥制霸奖章",
    shortName: "神奥",
    description: "与这只宝可梦一同战胜神奥地区的所有馆主、四天王与冠军。",
    assetPath: "runtime/soulmate-badges/sinnoh-medal.png",
    region: "神奥地区",
    targetKinds: ["gym", "elite4", "champion"],
  },
  {
    id: "unova",
    name: "合众制霸奖章",
    shortName: "合众",
    description: "与这只宝可梦一同战胜合众地区的所有馆主、四天王与冠军。",
    assetPath: "runtime/soulmate-badges/unova-medal.png",
    region: "合众地区",
    targetKinds: ["gym", "elite4", "champion"],
  },
  {
    id: "kalos",
    name: "卡洛斯制霸奖章",
    shortName: "卡洛斯",
    description: "与这只宝可梦一同战胜卡洛斯地区的所有馆主、四天王与冠军。",
    assetPath: "runtime/soulmate-badges/kalos-medal.png",
    region: "卡洛斯地区",
    targetKinds: ["gym", "elite4", "champion"],
  },
  {
    id: "alola",
    name: "阿罗拉制霸奖章",
    shortName: "阿罗拉",
    description: "与这只宝可梦一同战胜阿罗拉地区的所有馆主、四天王与冠军。",
    assetPath: "runtime/soulmate-badges/alola-medal.png",
    region: "阿罗拉地区",
    targetKinds: ["gym", "elite4", "champion"],
  },
  {
    id: "galar",
    name: "伽勒尔制霸奖章",
    shortName: "伽勒尔",
    description: "与这只宝可梦一同战胜伽勒尔地区的所有馆主、四天王与冠军。",
    assetPath: "runtime/soulmate-badges/galar-medal.png",
    region: "伽勒尔地区",
    targetKinds: ["gym", "elite4", "champion"],
  },
  {
    id: "paldea",
    name: "帕底亚制霸奖章",
    shortName: "帕底亚",
    description: "与这只宝可梦一同战胜帕底亚地区的所有馆主、四天王与冠军。",
    assetPath: "runtime/soulmate-badges/paldea-medal.png",
    region: "帕底亚地区",
    targetKinds: ["gym", "elite4", "champion"],
  },
  {
    id: "villain",
    name: "反派肃清奖章",
    shortName: "反派",
    description: "与这只宝可梦一同战胜所有反派头目。",
    assetPath: "runtime/soulmate-badges/villain-medal.png",
    targetKinds: ["villain"],
  },
];

export const PLAYER_POKEMON_HONOR_BADGE_BY_ID_V4 = new Map(PLAYER_POKEMON_HONOR_BADGES_V4.map(badge => [badge.id, badge]));

export function playerPokemonHonorTargetMarkerV4(badgeId: string, trainerId: string): string {
  return `soulmate-honor-target:${normalizeHonorText(badgeId)}:${normalizeHonorText(trainerId)}`;
}

export function playerPokemonHonorMedalMarkerV4(badgeId: string): string {
  return `soulmate-honor-medal:${normalizeHonorText(badgeId)}`;
}

export function addPlayerPokemonHonorTargetV4(honors: string[] | undefined | null, badgeId: string, trainerId: string, targets: PlayerPokemonHonorTargetV4[]): string[] {
  const next = uniqueHonors(honors);
  const targetMarker = playerPokemonHonorTargetMarkerV4(badgeId, trainerId);
  if (!next.includes(targetMarker)) next.push(targetMarker);
  return completePlayerPokemonHonorMedalsV4(next, [{badgeId, targets}]);
}

export function completePlayerPokemonHonorMedalsV4(honors: string[] | undefined | null, badges: Array<{badgeId: string; targets: PlayerPokemonHonorTargetV4[]}>): string[] {
  const next = uniqueHonors(honors);
  for (const badge of badges) {
    if (!badge.targets.length) continue;
    const earned = badge.targets.every(target => next.includes(playerPokemonHonorTargetMarkerV4(badge.badgeId, target.trainerId)));
    const marker = playerPokemonHonorMedalMarkerV4(badge.badgeId);
    if (earned && !next.includes(marker)) next.push(marker);
  }
  return next;
}

export function playerPokemonHonorBadgeStateV4(honors: string[] | undefined | null, badge: PlayerPokemonHonorBadgeCatalogEntryV4, targets: PlayerPokemonHonorTargetV4[]): PlayerPokemonHonorBadgeStateV4 {
  const normalized = uniqueHonors(honors);
  const medalMarker = playerPokemonHonorMedalMarkerV4(badge.id);
  const targetViews = targets.map(target => ({
    ...target,
    completed: normalized.includes(playerPokemonHonorTargetMarkerV4(badge.id, target.trainerId)),
  }));
  const completedTargetCount = targetViews.filter(target => target.completed).length;
  const earned = normalized.includes(medalMarker) || (targetViews.length > 0 && completedTargetCount === targetViews.length);
  return {
    ...badge,
    earned,
    completedTargetCount,
    targetCount: targetViews.length,
    targets: targetViews,
  };
}

export function normalizePlayerPokemonHonorBadgeIdV4(value: unknown): PlayerPokemonHonorBadgeIdV4 | null {
  const id = normalizeHonorText(value);
  return PLAYER_POKEMON_HONOR_BADGE_BY_ID_V4.has(id as PlayerPokemonHonorBadgeIdV4) ? id as PlayerPokemonHonorBadgeIdV4 : null;
}

function uniqueHonors(honors: string[] | undefined | null): string[] {
  return Array.from(new Set((Array.isArray(honors) ? honors : []).map(normalizeHonorText).filter(Boolean)));
}

function normalizeHonorText(value: unknown): string {
  return String(value || "").trim();
}
