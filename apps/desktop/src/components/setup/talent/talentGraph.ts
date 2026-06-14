import type {TalentView} from "@changebattle/shared";

export type TalentNodeState = "preview" | "maxed" | "active" | "available" | "locked";

export type TalentViewState = {
  x: number;
  y: number;
  scale: number;
};

export type TalentGraphBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type TalentCategoryHub = {
  category: string;
  x: number;
  y: number;
  active: boolean;
};

export type TalentDetailModel = {
  level: number;
  max: number;
  cost: number | null;
  ready: boolean;
  state: TalentNodeState;
  currentEffect: string;
  nextEffect: string;
  canUpgrade: boolean;
};

export const TALENT_INITIAL_VIEW: TalentViewState = {x: 0, y: 0, scale: 0.78};

const TALENT_CATEGORY_ORDER = ["开局筹备", "整备器械", "情报规划", "交换筑队", "养成改造", "经济运营", "奇遇预留"];

export function talentNodePoint(catalog: TalentView[], node: TalentView, index = catalog.indexOf(node)): {x: number; y: number} {
  const hasExplicitPosition = node.x !== undefined || node.y !== undefined;
  if (hasExplicitPosition) return {x: Number(node.x || 0), y: Number(node.y || 0)};
  if (node.id === "root_trainer_star" || node.kind === "root") return {x: 0, y: 0};
  const categories = TALENT_CATEGORY_ORDER.filter(category => catalog.some(entry => entry.category === category));
  const fallbackCategories = [...new Set(catalog.map(entry => entry.category).filter(Boolean))].filter(category => !categories.includes(category));
  const orderedCategories = [...categories, ...fallbackCategories];
  const categoryIndex = Math.max(0, orderedCategories.indexOf(node.category));
  const categoryCount = Math.max(1, orderedCategories.length);
  const angle = -Math.PI / 2 + (categoryIndex / categoryCount) * Math.PI * 2;
  const siblings = catalog.filter(entry => entry.category === node.category && entry.id !== "root_trainer_star" && entry.kind !== "root");
  const siblingIndex = Math.max(0, siblings.findIndex(entry => entry.id === node.id));
  const ring = Math.floor(siblingIndex / 4);
  const offset = (siblingIndex % 4 - 1.5) * 42;
  const radius = 230 + ring * 96;
  return {
    x: Math.round(Math.cos(angle) * radius + Math.cos(angle + Math.PI / 2) * offset + index * 0.001),
    y: Math.round(Math.sin(angle) * radius + Math.sin(angle + Math.PI / 2) * offset + index * 0.001),
  };
}

export function talentNodeLevel(nodeById: Map<string, TalentView>, id: string): number {
  return Math.max(0, Math.floor(Number(nodeById.get(id)?.level || 0)));
}

export function talentNodeReady(nodeById: Map<string, TalentView>, node: TalentView): boolean {
  return (node.requires || []).every(requirement => talentNodeLevel(nodeById, requirement.id) >= Math.max(1, Number(requirement.level || 1)));
}

export function talentNodeCost(node?: TalentView): number | null {
  if (!node || node.disabled || node.kind === "root" || node.kind === "event_preview") return null;
  const level = Math.max(0, Math.floor(Number(node.level || 0)));
  const max = Math.max(1, Number(node.max_level || 1));
  if (level >= max) return null;
  return node.costs?.[level] ?? node.cost ?? null;
}

export function talentNodeState(nodeById: Map<string, TalentView>, node: TalentView): TalentNodeState {
  const level = talentNodeLevel(nodeById, node.id);
  if (node.kind === "event_preview" || node.disabled) return "preview";
  if (level > 0) return level >= Number(node.max_level || 1) ? "maxed" : "active";
  return talentNodeReady(nodeById, node) ? "available" : "locked";
}

export function talentRouteClass(category?: string): string {
  if (category === "开局筹备") return "starter";
  if (category === "整备器械") return "gear";
  if (category === "情报规划") return "intel";
  if (category === "交换筑队") return "exchange";
  if (category === "养成改造") return "growth";
  if (category === "经济运营") return "economy";
  if (category === "奇遇预留") return "event";
  return "root";
}

export function talentGraphBounds(catalog: TalentView[]): TalentGraphBounds {
  const points = catalog.map((node, index) => talentNodePoint(catalog, node, index));
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  return {
    minX: Math.min(-760, ...xs) - 140,
    maxX: Math.max(760, ...xs) + 140,
    minY: Math.min(-620, ...ys) - 140,
    maxY: Math.max(620, ...ys) + 140,
  };
}

export function talentCategoryHubs(catalog: TalentView[]): Map<string, TalentCategoryHub> {
  const root = catalog.find(node => node.id === "root_trainer_star");
  if (!root) return new Map<string, TalentCategoryHub>();
  const rootPoint = talentNodePoint(catalog, root);
  const rootX = rootPoint.x;
  const rootY = rootPoint.y;
  const groups = new Map<string, TalentView[]>();
  for (const node of catalog) {
    if (node.id === "root_trainer_star") continue;
    if (!(node.requires || []).some(requirement => requirement.id === "root_trainer_star")) continue;
    const next = groups.get(node.category) || [];
    next.push(node);
    groups.set(node.category, next);
  }
  const hubs = new Map<string, TalentCategoryHub>();
  for (const [category, nodes] of groups) {
    const points = nodes.map(node => talentNodePoint(catalog, node));
    const avgX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const avgY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    const dx = avgX - rootX;
    const dy = avgY - rootY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const trunkLength = Math.max(92, Math.min(155, distance * 0.44));
    hubs.set(category, {
      category,
      x: rootX + (dx / distance) * trunkLength,
      y: rootY + (dy / distance) * trunkLength,
      active: nodes.some(node => Number(node.level || 0) > 0),
    });
  }
  return hubs;
}

export function talentRequirementText(nodeById: Map<string, TalentView>, requirement: {id: string; level?: number}) {
  const node = nodeById.get(requirement.id);
  const level = Math.max(1, Number(requirement.level || 1));
  return `${node?.name || requirement.id} Lv${level}`;
}

export function talentLinkPath(from: {x?: number; y?: number}, to: {x?: number; y?: number}): string {
  const x1 = Number(from.x || 0);
  const y1 = Number(from.y || 0);
  const x2 = Number(to.x || 0);
  const y2 = Number(to.y || 0);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const bend = Math.max(-70, Math.min(70, (Math.abs(dx) - Math.abs(dy)) * 0.12));
  const cx = x1 + dx * 0.52 - dy * 0.08;
  const cy = y1 + dy * 0.52 + bend;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

export function talentDetailModel(nodeById: Map<string, TalentView>, selected: TalentView | undefined, bp: number): TalentDetailModel {
  const level = selected ? talentNodeLevel(nodeById, selected.id) : 0;
  const max = selected ? Math.max(1, Number(selected.max_level || 1)) : 1;
  const cost = talentNodeCost(selected);
  const ready = selected ? talentNodeReady(nodeById, selected) : false;
  const state = selected ? talentNodeState(nodeById, selected) : "locked";
  const effects = selected?.effects?.filter(Boolean) || [];
  const currentEffect = level > 0
    ? effects[Math.min(level - 1, effects.length - 1)] || selected?.desc || `Lv${level} 已点亮。`
    : "尚未点亮。";
  const nextEffect = level >= max
    ? "已满级。"
    : effects[Math.min(level, effects.length - 1)] || selected?.desc || `点亮后提升到 Lv${level + 1}。`;
  return {
    level,
    max,
    cost,
    ready,
    state,
    currentEffect,
    nextEffect,
    canUpgrade: Boolean(selected && cost !== null && ready && bp >= Number(cost) && state !== "preview"),
  };
}
