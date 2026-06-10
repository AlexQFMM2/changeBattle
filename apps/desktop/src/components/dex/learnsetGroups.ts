import type {MoveLearnSource, MoveSummary} from "@changebattle/shared";

type LearnsetSourceGroup = {
  id: MoveLearnSource | "special";
  label: string;
  sources: MoveLearnSource[];
};

export type LearnsetMoveGroup = {
  id: string;
  label: string;
  moves: MoveSummary[];
};

const LEARNSET_SOURCE_GROUPS: LearnsetSourceGroup[] = [
  {id: "levelup", label: "天生就会", sources: ["levelup"]},
  {id: "machine", label: "技能机器", sources: ["machine"]},
  {id: "tutor", label: "教学", sources: ["tutor"]},
  {id: "egg", label: "遗传", sources: ["egg"]},
  {id: "special", label: "特殊来源", sources: ["event", "transfer", "other"]},
];

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

export function moveHasMultipleLearnSources(move: MoveSummary): boolean {
  return (move.learn_sources?.length || move.learn_source_labels?.length || 0) > 1;
}
