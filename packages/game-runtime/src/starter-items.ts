import type {BattleSetting, BattleSystemId, GeneratedTeam, ItemCategory, MoveSummary, ShopItem, ShopOffer, StarterItemGroup, StarterUpgradeState, TalentView} from "@changebattle/shared";
import {DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";
import type {RuntimeDataProvider} from "./data-provider.js";
import {parseCsvLine} from "./profile-settings.js";
import {BP_SCALE, STARTER_ITEM_GROUPS, STARTER_ITEM_MAX_LEVEL, itemKey, normalizeStarterUpgrades, pricedForShop, toId} from "./run-rules.js";

export type StarterItemPoolEntry = {
  id: string;
  kind: "item" | "tm";
  category: ItemCategory;
  starter_group: StarterItemGroup;
  tier: number;
  cost: number;
  weight: number;
  enabled: boolean;
  discountable: boolean;
  notes?: string;
};

export type StarterItemOfferService = {
  itemOptions(): Promise<ShopItem[]>;
  generateRentalCandidates(seed: number | number[], format?: string, count?: number, options?: Record<string, unknown>): Promise<GeneratedTeam>;
  deriveSeed(seed: number, salt: number): number;
  battleSystemForItem?(itemId: string): BattleSystemId | null;
};

const LOCAL_ITEM_DETAILS: Record<string, {name: string; name_zh: string; desc: string; desc_zh: string}> = {
  potion: {name: "Potion", name_zh: "回复药", desc: "Restores 20 HP.", desc_zh: "恢复 20 点 HP。"},
  superpotion: {name: "Super Potion", name_zh: "好伤药", desc: "Restores 60 HP.", desc_zh: "恢复 60 点 HP。"},
  hyperpotion: {name: "Hyper Potion", name_zh: "绝好伤药", desc: "Restores 120 HP.", desc_zh: "恢复 120 点 HP。"},
  maxpotion: {name: "Max Potion", name_zh: "全满药", desc: "Fully restores HP.", desc_zh: "恢复全部 HP。"},
  fullrestore: {name: "Full Restore", name_zh: "全复药", desc: "Fully restores HP and cures status.", desc_zh: "恢复全部 HP，并解除异常状态。"},
  freshwater: {name: "Fresh Water", name_zh: "美味之水", desc: "Restores 30 HP.", desc_zh: "恢复 30 点 HP。"},
  sodapop: {name: "Soda Pop", name_zh: "劲爽汽水", desc: "Restores 50 HP.", desc_zh: "恢复 50 点 HP。"},
  lemonade: {name: "Lemonade", name_zh: "果汁牛奶", desc: "Restores 70 HP.", desc_zh: "恢复 70 点 HP。"},
  moomoomilk: {name: "Moomoo Milk", name_zh: "哞哞鲜奶", desc: "Restores 100 HP.", desc_zh: "恢复 100 点 HP。"},
  revive: {name: "Revive", name_zh: "活力碎片", desc: "Revives a fainted Pokemon with half HP.", desc_zh: "让濒死宝可梦复活，并恢复一半 HP。"},
  maxrevive: {name: "Max Revive", name_zh: "活力块", desc: "Revives a fainted Pokemon with full HP.", desc_zh: "让濒死宝可梦复活，并恢复全部 HP。"},
  revivalherb: {name: "Revival Herb", name_zh: "复活草", desc: "Revives a fainted Pokemon with full HP.", desc_zh: "让濒死宝可梦复活，并恢复全部 HP。"},
  energypowder: {name: "Energy Powder", name_zh: "元气粉", desc: "Restores 60 HP.", desc_zh: "恢复 60 点 HP。"},
  energyroot: {name: "Energy Root", name_zh: "元气根", desc: "Restores 120 HP.", desc_zh: "恢复 120 点 HP。"},
  fullheal: {name: "Full Heal", name_zh: "万灵药", desc: "Cures status conditions.", desc_zh: "解除异常状态。"},
  healpowder: {name: "Heal Powder", name_zh: "万能粉", desc: "Cures status conditions.", desc_zh: "解除异常状态。"},
  antidote: {name: "Antidote", name_zh: "解毒药", desc: "Cures poisoning.", desc_zh: "解除中毒状态。"},
  burnheal: {name: "Burn Heal", name_zh: "灼伤药", desc: "Cures a burn.", desc_zh: "解除灼伤状态。"},
  iceheal: {name: "Ice Heal", name_zh: "解冻药", desc: "Cures freezing.", desc_zh: "解除冰冻状态。"},
  awakening: {name: "Awakening", name_zh: "解眠药", desc: "Cures sleep.", desc_zh: "解除睡眠状态。"},
  paralyzeheal: {name: "Paralyze Heal", name_zh: "解麻药", desc: "Cures paralysis.", desc_zh: "解除麻痹状态。"},
  ether: {name: "Ether", name_zh: "PP 单项小补剂", desc: "Restores 10 PP to one move.", desc_zh: "让 1 个招式恢复 10 点 PP。"},
  maxether: {name: "Max Ether", name_zh: "PP 单项全补剂", desc: "Fully restores PP to one move.", desc_zh: "让 1 个招式恢复全部 PP。"},
  elixir: {name: "Elixir", name_zh: "PP 多项小补剂", desc: "Restores 10 PP to all moves.", desc_zh: "让所有招式恢复 10 点 PP。"},
  maxelixir: {name: "Max Elixir", name_zh: "PP 多项全补剂", desc: "Fully restores PP to all moves.", desc_zh: "让所有招式恢复全部 PP。"},
};

export async function generateStarterItemOffers(options: {
  data: RuntimeDataProvider;
  service: StarterItemOfferService;
  runSeed: number;
  talents?: TalentView[];
  upgrades?: StarterUpgradeState;
  battleSetting?: BattleSetting;
}): Promise<ShopOffer[]> {
  const pool = await loadStarterItemPool(options.data);
  const itemOptions = await options.service.itemOptions();
  const normalizedUpgrades = normalizeStarterUpgrades(options.upgrades);
  const battleSetting = normalizeBattleSetting(options.battleSetting || DEFAULT_BATTLE_SETTING);
  const talents = options.talents || [];
  const rng = seededRng(options.runSeed, 0x57a27);
  const result: ShopOffer[] = [];
  for (const group of STARTER_ITEM_GROUPS) {
    const quantityLevel = Number(normalizedUpgrades.item_quantity?.[group.id] || 0);
    if (quantityLevel <= 0) continue;
    const qualityLevel = Number(normalizedUpgrades.item_quality?.[group.id] || 1);
    const used = new Set<string>();
    const entries = pool.filter(entry => entry.starter_group === group.id && entry.tier <= qualityLevel);
    const tmTemplate = entries.find(entry => entry.kind === "tm" && entry.id === "*");
    const tmOffers = tmTemplate
      ? (await starterTmOptions(options.service, options.runSeed, talents, battleSetting)).map((offer, index) => ({
        ...offer,
        cost: 0,
        weight: starterOfferWeight(tmTemplate, qualityLevel),
        discountable: tmTemplate.discountable,
        starter_group: group.id,
        starter_group_label: group.name,
        item_tier: tmTemplate.tier,
        offer_id: `starter-${group.id}-tm-${index}-${itemKey(offer.id || offer.name)}`,
      }))
      : [];
    const itemOffers: Array<ShopOffer & {weight?: number}> = [];
    entries.filter(entry => entry.kind === "item" && battleSettingAllowsItem(entry.id, battleSetting, options.service)).forEach((entry, index) => {
      const item = itemOptions.find(option => itemKey(option.id || option.name) === entry.id);
      const localItem = LOCAL_ITEM_DETAILS[entry.id];
      if (!item && !localItem) return;
      const detail = item || {id: entry.id, ...localItem, cost: entry.cost || 1};
      itemOffers.push({
        ...detail,
        id: entry.id,
        cost: 0,
        category: entry.category,
        icon_asset: itemIconAsset(entry.id),
        offer_id: `starter-${group.id}-${index}-${entry.id}`,
        source: "starter",
        weight: starterOfferWeight(entry, qualityLevel),
        discountable: entry.discountable,
        starter_group: group.id,
        starter_group_label: group.name,
        item_tier: entry.tier,
      });
    });
    const candidates = [...itemOffers, ...tmOffers];
    for (let index = 0; index < quantityLevel; index += 1) {
      const available = candidates.filter(offer => !used.has(itemKey(offer.id || offer.name)));
      const picked = weightedPick(available, rng);
      if (!picked) break;
      used.add(itemKey(picked.id || picked.name));
      const {weight: _weight, ...offer} = picked;
      result.push({...offer, offer_id: `starter-${group.id}-${index}-${itemKey(offer.id || offer.name)}`});
    }
  }
  return result;
}

export function starterGroupName(groupId: StarterItemGroup): string {
  return STARTER_ITEM_GROUPS.find(group => group.id === groupId)?.name || groupId;
}

export async function loadStarterItemPool(data: RuntimeDataProvider): Promise<StarterItemPoolEntry[]> {
  const raw = await data.readText("data/starter_item_pool.csv").catch(() => "");
  if (!raw.trim()) return [];
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0] || "");
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(header.map((key, index) => [key, values[index] || ""]));
    const kind = toId(row.kind) === "tm" ? "tm" : "item";
    const categoryId = toId(row.category);
    const category: ItemCategory = kind === "tm" ? "tm" : categoryId === "consumable" ? "consumable" : "held";
    const starter_group = toId(row.starter_group) as StarterItemGroup;
    if (!STARTER_ITEM_GROUPS.some(group => group.id === starter_group)) return null;
    const id = kind === "tm" && String(row.id || "").trim() === "*" ? "*" : itemKey(row.id);
    if (!id) return null;
    const entry: StarterItemPoolEntry = {
      id,
      kind,
      category,
      starter_group,
      tier: Math.max(1, Math.min(STARTER_ITEM_MAX_LEVEL, Number(row.tier || 1))),
      cost: Math.max(0, Number(row.coin_cost || row.cost || 0)),
      weight: Math.max(0, Number(row.weight || 1)),
      enabled: String(row.enabled ?? "1").trim() !== "0",
      discountable: String(row.discountable ?? "1").trim() !== "0",
      notes: row.notes || "",
    };
    return entry.enabled && entry.weight > 0 ? entry : null;
  }).filter((entry): entry is StarterItemPoolEntry => Boolean(entry));
}

function starterOfferWeight(entry: Pick<StarterItemPoolEntry, "tier" | "weight">, qualityLevel: number): number {
  const base = Math.max(0, Number(entry.weight || 1));
  if (entry.tier === qualityLevel) return base * 3;
  if (entry.tier === qualityLevel - 1) return base * 2;
  return base;
}

async function starterTmOptions(service: StarterItemOfferService, runSeed: number, talents: TalentView[] = [], battleSetting: BattleSetting = normalizeBattleSetting(DEFAULT_BATTLE_SETTING), limit = 24): Promise<ShopOffer[]> {
  const generated = await service.generateRentalCandidates(service.deriveSeed(runSeed, 77), "gen9randombattle", 6, {battleSetting, purpose: "starter"});
  const seen = new Set<string>();
  const moves: MoveSummary[] = [];
  for (const pokemon of generated.display || []) {
    for (const move of pokemon.moves || []) {
      const moveId = toId(move.id || move.name);
      if (!moveId || seen.has(moveId)) continue;
      seen.add(moveId);
      moves.push(move as MoveSummary);
    }
  }
  const rng = seededRng(runSeed, 0x5a77);
  return shuffleByRng(moves, rng).slice(0, limit).map((move, index) => tmOfferFromMove(move, index, "starter", 1, talents));
}

function tmOfferFromMove(move: MoveSummary, index: number, source: "shop" | "starter", discount = 1, talents: TalentView[] = []): ShopOffer {
  const moveId = toId(move.id || move.name);
  const base = {
    id: tmItemId(moveId),
    name: `TM ${move.name || moveId}`,
    name_zh: `技能机器 ${move.name_zh || move.name || moveId}`,
    cost: Math.floor(defaultMoveCost(move.power) * discount),
    desc: `Teaches ${move.name || moveId}.`,
    desc_zh: `让宝可梦学会 ${move.name_zh || move.name || moveId}。`,
  };
  return {
    ...base,
    cost: pricedForShop(base, talents),
    offer_id: `${source}-tm-${index}-${moveId}`,
    category: "tm",
    icon_asset: tmIconAsset(),
    discount,
    source,
    move_id: moveId,
    move_name: move.name || moveId,
    move_name_zh: move.name_zh || move.name || moveId,
  };
}

function battleSettingAllowsItem(itemId: string, setting: BattleSetting, service: StarterItemOfferService): boolean {
  const normalized = itemKey(itemId);
  if (!normalized) return false;
  const system = service.battleSystemForItem?.(normalized);
  if (!system) return true;
  return normalizeBattleSetting(setting).enabled_battle_systems.includes(system);
}

function defaultMoveCost(power: number | undefined): number {
  const value = Number(power || 0);
  if (value >= 120) return 800;
  if (value > 90) return 650;
  if (value > 60) return 500;
  if (value > 30) return 400;
  return 300;
}

function itemIconAsset(itemId: string): string {
  const normalized = itemKey(itemId);
  if (!normalized) return "assets/placeholders/item.png";
  const zType = Z_CRYSTAL_ICON_TYPES[normalized];
  if (zType) return `assets/items-pack/${ITEM_TYPE_PLATE_ASSETS[zType] || "zapplate"}.png`;
  return `assets/items-pack/${normalized}.png`;
}

const Z_CRYSTAL_ICON_TYPES: Record<string, string> = {
  aloraichiumz: "electric",
  buginiumz: "bug",
  darkiniumz: "dark",
  decidiumz: "ghost",
  dragoniumz: "dragon",
  eeviumz: "normal",
  electriumz: "electric",
  fairiumz: "fairy",
  fightiniumz: "fighting",
  firiumz: "fire",
  flyiniumz: "flying",
  ghostiumz: "ghost",
  grassiumz: "grass",
  groundiumz: "ground",
  iciumz: "ice",
  inciniumz: "dark",
  kommoniumz: "dragon",
  lunaliumz: "ghost",
  lycaniumz: "rock",
  marshadiumz: "ghost",
  mewniumz: "psychic",
  mimikiumz: "fairy",
  normaliumz: "normal",
  pikaniumz: "electric",
  pikashuniumz: "electric",
  poisoniumz: "poison",
  primariumz: "water",
  psychiumz: "psychic",
  rockiumz: "rock",
  snorliumz: "normal",
  solganiumz: "steel",
  steeliumz: "steel",
  tapuniumz: "fairy",
  ultranecroziumz: "psychic",
  wateriumz: "water",
};

const ITEM_TYPE_PLATE_ASSETS: Record<string, string> = {
  bug: "insectplate",
  dark: "dreadplate",
  dragon: "dracoplate",
  electric: "zapplate",
  fairy: "pixieplate",
  fighting: "fistplate",
  fire: "flameplate",
  flying: "skyplate",
  ghost: "spookyplate",
  grass: "meadowplate",
  ground: "earthplate",
  ice: "icicleplate",
  normal: "blankplate",
  poison: "toxicplate",
  psychic: "mindplate",
  rock: "stoneplate",
  steel: "ironplate",
  water: "splashplate",
};

function tmIconAsset(): string {
  return "assets/placeholders/move.png";
}

function tmItemId(moveId: string | undefined): string {
  return `tm:${toId(moveId)}`;
}

function weightedPick<T extends {weight?: number}>(values: T[], rng: () => number): T | null {
  const total = values.reduce((sum, value) => sum + Math.max(0, Number(value.weight || 1)), 0);
  if (total <= 0) return values[0] || null;
  let cursor = rng() * total;
  for (const value of values) {
    cursor -= Math.max(0, Number(value.weight || 1));
    if (cursor <= 0) return value;
  }
  return values[values.length - 1] || null;
}

function seededRng(seed: number, salt = 0): () => number {
  let state = (Number(seed || 1) ^ salt ^ 0x9e3779b9) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function shuffleByRng<T>(values: T[], rng: () => number): T[] {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}
