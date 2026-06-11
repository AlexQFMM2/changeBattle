import type {LocalSave, StarChartState, StarterItemGroup, StarterUpgradeState, StarterUpgradeView, TalentView, TrainerNpcView} from "@changebattle/shared";
import {
  STAR_CHART_NODE_BY_ID,
  STARTER_ITEM_GROUPS,
  activeTalentsForSave,
  normalizeStarChart,
  normalizeStarterUpgrades,
  spendBp,
  starChartCatalog,
  starNodeLevel,
  starNodeUnlocked,
  starNodeUpgradeCost,
  starterUpgradeCatalog,
  starterUpgradesForSave,
  starterUpgradesForStarChart,
} from "./run-rules.js";

export type TalentConfigState = {catalog: TalentView[]; unlocked: TalentView[]; equipped: TalentView[]; star_chart?: StarChartState; save?: LocalSave | null};
export type StarterUpgradeConfigState = {catalog: StarterUpgradeView[]; save?: LocalSave | null};

export type ProgressionRuntimeApi = {
  talentConfig(): Promise<TalentConfigState>;
  unlockTalent(id: string): Promise<TalentConfigState>;
  configureTalents(ids: string[]): Promise<TalentConfigState>;
  setNamedChallenge(trainerId: string | null): Promise<TalentConfigState>;
  starterUpgradeConfig(): Promise<StarterUpgradeConfigState>;
  upgradeStarter(id: string): Promise<StarterUpgradeConfigState>;
};

export function createProgressionRuntime(options: {
  loadSave(): Promise<LocalSave | null>;
  persist(save: LocalSave): Promise<LocalSave>;
  npcCatalog: TrainerNpcView[];
}): ProgressionRuntimeApi {
  const talentConfigForSave = (save: LocalSave | null): TalentConfigState => {
    const chart = normalizeStarChart(save?.star_chart, save?.talent_unlocks, save?.starter_upgrades);
    const catalog = starChartCatalog(chart);
    const unlocked = catalog.filter(node => Number(node.level || 0) > 0);
    const equipped = activeTalentsForSave(save);
    return {catalog, unlocked, equipped, star_chart: chart, save};
  };

  return {
    async talentConfig() {
      return talentConfigForSave(await options.loadSave());
    },
    async unlockTalent(id) {
      const save = await requireSave(options.loadSave);
      const node = STAR_CHART_NODE_BY_ID.get(id);
      if (!node) throw new Error("星图节点不存在。");
      if (node.disabled || node.kind === "event_preview") throw new Error("这个节点是后续奇遇预留，暂不可解锁。");
      const chart = normalizeStarChart(save.star_chart, save.talent_unlocks, save.starter_upgrades);
      if (!starNodeUnlocked(chart, node)) throw new Error("前置节点尚未点亮。");
      const cost = starNodeUpgradeCost(chart, id);
      if (cost === null) throw new Error("这个节点已经满级。");
      spendBp(save, cost);
      chart.nodes[id] = Math.min(node.max_level, starNodeLevel(chart, id) + 1);
      save.star_chart = chart;
      return talentConfigForSave(await options.persist(save));
    },
    async configureTalents(ids) {
      void ids;
      const save = await requireSave(options.loadSave);
      return talentConfigForSave(await options.persist(save));
    },
    async setNamedChallenge(trainerId) {
      const save = await requireSave(options.loadSave);
      const id = trainerId || null;
      if (id && !options.npcCatalog.some(entry => entry.type === "champion" && entry.id === id)) throw new Error("只能指定冠军作为最终 Boss。");
      save.named_champion_id = id;
      return talentConfigForSave(await options.persist(save));
    },
    async starterUpgradeConfig() {
      const save = await options.loadSave();
      return {catalog: starterUpgradeCatalog(starterUpgradesForSave(save)), save};
    },
    async upgradeStarter(id) {
      const save = await requireSave(options.loadSave);
      const chart = normalizeStarChart(save.star_chart, save.talent_unlocks, save.starter_upgrades);
      const node = STAR_CHART_NODE_BY_ID.get(id);
      if (!node || node.kind !== "starter_upgrade") throw new Error("开局筹备项目不存在。");
      const currentLevel = starNodeLevel(chart, id);
      const cost = starNodeUpgradeCost(chart, id);
      if (cost === null || cost === undefined) throw new Error("这个项目已经满级。");
      if (!starNodeUnlocked(chart, node)) throw new Error("前置节点尚未点亮。");
      spendBp(save, cost);
      chart.nodes[id] = Math.min(node.max_level, currentLevel + 1);
      save.star_chart = chart;
      const next = await options.persist(save);
      return {catalog: starterUpgradeCatalog(starterUpgradesForSave(next)), save: next};
    },
  };
}

export function setStarterUpgradeLevel(upgrades: StarterUpgradeState, id: string, level: number): StarterUpgradeState {
  const next = normalizeStarterUpgrades(upgrades);
  const [kind, groupRaw] = id.split(":");
  const group = groupRaw as StarterItemGroup | undefined;
  if (kind === "item_quality" && group && STARTER_ITEM_GROUPS.some(entry => entry.id === group)) next.item_quality = {...next.item_quality, [group]: level};
  else if (kind === "item_quantity" && group && STARTER_ITEM_GROUPS.some(entry => entry.id === group)) next.item_quantity = {...next.item_quantity, [group]: level};
  else if (id === "pokemon_reroll") next.pokemon_reroll = level;
  else if (id === "pokemon_inspect") next.pokemon_inspect = level;
  else if (id === "pokemon_single_reroll") next.pokemon_single_reroll = level;
  else throw new Error("开局筹备项目不存在。");
  return normalizeStarterUpgrades(next);
}

async function requireSave(loadSave: () => Promise<LocalSave | null>): Promise<LocalSave> {
  const save = await loadSave();
  if (!save) throw new Error("请先创建或读取存档。");
  return save;
}
