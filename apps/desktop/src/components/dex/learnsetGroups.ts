import type {MoveLearnSource, MoveSummary} from "@changebattle/shared";

type LearnsetSourceGroup = {
  id: MoveLearnSource | "special";
  label: string;
  tabLabel: string;
  sources: MoveLearnSource[];
};

export type LearnsetMoveGroup = {
  id: string;
  label: string;
  moves: MoveSummary[];
};

const LEARNSET_SOURCE_GROUPS: LearnsetSourceGroup[] = [
  {id: "levelup", label: "自学技能", tabLabel: "自学技能", sources: ["levelup"]},
  {id: "egg", label: "遗传技能", tabLabel: "遗传技能", sources: ["egg"]},
  {id: "tutor", label: "教授技能", tabLabel: "教授技能", sources: ["tutor"]},
  {id: "machine", label: "可学技能机器", tabLabel: "技能机器", sources: ["machine"]},
  {id: "special", label: "特殊来源", tabLabel: "特殊来源", sources: ["event", "transfer", "other"]},
];

export const POKEMON_INFO_TAB_ID = "info";

export type PokemonDexDetailTab = {
  id: string;
  label: string;
  count?: number;
};

export function groupLearnsetBySource(learnset: MoveSummary[] = []): LearnsetMoveGroup[] {
  const grouped = LEARNSET_SOURCE_GROUPS.map(group => ({
    id: String(group.id),
    label: group.label,
    moves: learnset.filter(move => {
      const sources = move.learn_sources || [];
      return sources.some(source => group.sources.includes(source));
    }),
  }));
  const groupedMoveIds = new Set(grouped.flatMap(group => group.moves.map(move => move.id)));
  const uncategorized = learnset.filter(move => !groupedMoveIds.has(move.id));
  if (uncategorized.length) {
    grouped.push({id: "uncategorized", label: "其他来源", moves: uncategorized});
  }
  return grouped.filter(group => group.moves.length > 0);
}

export function pokemonDexDetailTabs(learnset: MoveSummary[] = []): PokemonDexDetailTab[] {
  const groups = groupLearnsetBySource(learnset);
  const tabs: PokemonDexDetailTab[] = [{id: POKEMON_INFO_TAB_ID, label: "基本信息"}];
  for (const group of groups) {
    const config = LEARNSET_SOURCE_GROUPS.find(sourceGroup => String(sourceGroup.id) === group.id);
    tabs.push({id: group.id, label: config?.tabLabel || group.label, count: group.moves.length});
  }
  return tabs;
}

export function moveHasMultipleLearnSources(move: MoveSummary): boolean {
  return (move.learn_sources?.length || move.learn_source_labels?.length || 0) > 1;
}
