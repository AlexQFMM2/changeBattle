import {createLocalShowdownDex} from "./localDex.js";
import {BattlePokemonIconIndexes} from "./data/pokemon-icon-indexes.js";
import {ZhCnDetails} from "./data/i18n/zh-cn-details.js";
import {ZhCnOverrides} from "./data/i18n/zh-cn-overrides.js";

export type DexCategory = "pokemon" | "moves" | "abilities" | "items" | "trainers";
export type DexStatId = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
export type DexLearnSource = "levelup" | "machine" | "tutor" | "egg" | "event" | "transfer" | "other";
export type DexItemKind = "berry" | "recovery" | "revive" | "pp" | "tm" | "training" | "system" | "valuable" | "special" | "held" | "battle" | "other";
export type DexItemSource = "showdown" | "v1-game" | "overlay" | "system";

export type DexSearchRequest = {
  category?: DexCategory | "all";
  query?: string;
  offset?: number;
  limit?: number;
  filters?: Record<string, string | string[] | undefined>;
};

export type DexSearchRow = {
  id: string;
  category: DexCategory;
  name: string;
  nameZh: string;
  subtitle?: string;
  description?: string;
  tags: string[];
  sprite?: DexPokemonSprites;
  iconUrl?: string;
  iconStyle?: string;
};

export type DexSearchResult = {
  category: DexCategory | "all";
  query: string;
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
  rows: DexSearchRow[];
};

export type DexPokemonSprites = {
  resourcePrefix: string;
  spriteId?: string;
  baseSpriteId?: string;
  iconUrl?: string;
  iconStyle?: string;
  frontUrl?: string;
  backUrl?: string;
  frontShinyUrl?: string;
  backShinyUrl?: string;
  fallbackFrontUrl?: string;
  fallbackBackUrl?: string;
  fallbackFrontShinyUrl?: string;
  fallbackBackShinyUrl?: string;
  animatedFrontUrl?: string;
  animatedBackUrl?: string;
  animatedFrontShinyUrl?: string;
  animatedBackShinyUrl?: string;
  fallbackAnimatedFrontUrl?: string;
  fallbackAnimatedBackUrl?: string;
  fallbackAnimatedFrontShinyUrl?: string;
  fallbackAnimatedBackShinyUrl?: string;
  gen5AnimatedFrontUrl?: string;
  gen5AnimatedBackUrl?: string;
  gen5AnimatedFrontShinyUrl?: string;
  gen5AnimatedBackShinyUrl?: string;
};

export type DexPokemonDetail = {
  id: string;
  name: string;
  nameZh: string;
  num: number;
  types: string[];
  heightm?: number;
  weightkg?: number;
  genderRatio?: Record<string, number>;
  color?: string;
  baseStats: Record<DexStatId, number>;
  abilities: Array<{id: string; name: string; nameZh: string; hidden?: boolean; description?: string}>;
  eggGroups: string[];
  evolutionChain: DexPokemonLink[];
  formes: DexPokemonLink[];
  cryUrl?: string;
  sprites: DexPokemonSprites;
  learnset: DexMoveSummary[];
  learnsetGroups: Record<DexLearnSource, DexMoveSummary[]>;
};

export type DexPokemonLink = {
  id: string;
  name: string;
  nameZh: string;
  num: number;
  sprite?: DexPokemonSprites;
};

export type DexMoveSummary = {
  id: string;
  name: string;
  nameZh: string;
  typeId?: string;
  categoryId?: string;
  type: string;
  category: string;
  power: number;
  accuracy: number | null;
  pp: number;
  priority: number;
  target?: string;
  flags?: string[];
  description?: string;
  learnSources?: DexLearnSource[];
};

export type DexMoveDetail = DexMoveSummary & {
  learners: Array<{pokemon: DexSearchRow; sources: DexLearnSource[]}>;
  flagsText: string[];
};

export type DexAbilityDetail = {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  holders: Array<{pokemon: DexSearchRow; hidden?: boolean; unavailable?: boolean}>;
};

export type DexItemDetail = {
  id: string;
  name: string;
  nameZh: string;
  kind: DexItemKind;
  kindLabel: string;
  description: string;
  source?: DexItemSource;
  sourceLabel?: string;
  effectSummary?: string;
  canBattleUse?: boolean;
  canUse?: boolean;
  canUseToPokemon?: boolean;
  canTake?: boolean;
  canSale?: boolean;
  cost?: number;
  futureInstanceCompatible?: boolean;
  moveId?: string;
  moveName?: string;
  moveNameZh?: string;
  iconUrl?: string;
  iconStyle?: string;
};

export type DexStatsInput = {
  speciesId: string;
  level?: number;
  nature?: string;
  evs?: Partial<Record<DexStatId, number>>;
  ivs?: Partial<Record<DexStatId, number>>;
};

export type DexStatsResult = {
  level: number;
  nature: string;
  stats: Record<DexStatId, number>;
};

export type ShowdownDexLike = {
  species: {
    get(id: string): any;
    all(): any[];
    getFullLearnset?(id: string): Array<{learnset?: Record<string, string[]>}>;
  };
  moves: {get(id: string): any; all(): any[]};
  abilities: {get(id: string): any; all(): any[]};
  items: {get(id: string): any; all(): any[]};
  natures?: {get(id: string): any};
};

export type ShowdownDexServiceOptions = {
  dex?: ShowdownDexLike;
  resourcePrefix?: string;
  translate?: (table: string, value: string) => string;
};

export type ShowdownDexService = ReturnType<typeof createShowdownDexService>;

const STAT_IDS: DexStatId[] = ["hp", "atk", "def", "spa", "spd", "spe"];
const DEFAULT_RESOURCE_PREFIX = "/showdown/";
const ITEM_KIND_LABEL: Record<DexItemKind, string> = {
  berry: "树果",
  recovery: "恢复道具",
  revive: "复活道具",
  pp: "PP 道具",
  tm: "技能机器",
  training: "训练道具",
  system: "系统道具",
  valuable: "贵重/剧情道具",
  special: "特殊道具",
  held: "携带道具",
  battle: "战斗道具",
  other: "其他道具",
};
const ITEM_SOURCE_LABEL: Record<DexItemSource, string> = {
  showdown: "Showdown",
  "v1-game": "V1 游戏道具",
  overlay: "Showdown + V1",
  system: "系统道具",
};

type ItemRegistryEntry = {
  id: string;
  name: string;
  nameZh: string;
  kind: DexItemKind;
  source: DexItemSource;
  description: string;
  effectSummary?: string;
  iconAsset?: string;
  canBattleUse: boolean;
  canUse: boolean;
  canUseToPokemon: boolean;
  canTake: boolean;
  canSale: boolean;
  cost: number;
  futureInstanceCompatible: boolean;
  tags?: string[];
};

const V1_GAME_ITEM_ENTRIES: ItemRegistryEntry[] = [
  v1Item("potion", "Potion", "回复药", "recovery", "恢复 20 点 HP。", {cost: 300, canBattleUse: true}),
  v1Item("superpotion", "Super Potion", "好伤药", "recovery", "恢复 60 点 HP。", {cost: 700, canBattleUse: true}),
  v1Item("hyperpotion", "Hyper Potion", "绝好伤药", "recovery", "恢复 120 点 HP。", {cost: 1200, canBattleUse: true}),
  v1Item("maxpotion", "Max Potion", "全满药", "recovery", "恢复全部 HP。", {cost: 2500, canBattleUse: true}),
  v1Item("fullrestore", "Full Restore", "全复药", "recovery", "恢复全部 HP，并解除异常状态。", {cost: 3000, canBattleUse: true}),
  v1Item("freshwater", "Fresh Water", "美味之水", "recovery", "恢复 30 点 HP。", {cost: 200, canBattleUse: true}),
  v1Item("sodapop", "Soda Pop", "劲爽汽水", "recovery", "恢复 50 点 HP。", {cost: 300, canBattleUse: true}),
  v1Item("lemonade", "Lemonade", "果汁牛奶", "recovery", "恢复 70 点 HP。", {cost: 350, canBattleUse: true}),
  v1Item("moomoomilk", "Moomoo Milk", "哞哞鲜奶", "recovery", "恢复 100 点 HP。", {cost: 500, canBattleUse: true}),
  v1Item("fullheal", "Full Heal", "万灵药", "recovery", "解除异常状态。", {cost: 600, canBattleUse: true}),
  v1Item("healpowder", "Heal Powder", "万能粉", "recovery", "解除异常状态。", {cost: 450, canBattleUse: true}),
  v1Item("antidote", "Antidote", "解毒药", "recovery", "解除中毒状态。", {cost: 100, canBattleUse: true}),
  v1Item("burnheal", "Burn Heal", "灼伤药", "recovery", "解除灼伤状态。", {cost: 250, canBattleUse: true}),
  v1Item("iceheal", "Ice Heal", "解冻药", "recovery", "解除冰冻状态。", {cost: 250, canBattleUse: true}),
  v1Item("awakening", "Awakening", "解眠药", "recovery", "解除睡眠状态。", {cost: 250, canBattleUse: true}),
  v1Item("paralyzeheal", "Paralyze Heal", "解麻药", "recovery", "解除麻痹状态。", {cost: 200, canBattleUse: true}),
  v1Item("energypowder", "Energy Powder", "元气粉", "recovery", "恢复 60 点 HP。", {cost: 500, canBattleUse: true}),
  v1Item("energyroot", "Energy Root", "元气根", "recovery", "恢复 120 点 HP。", {cost: 800, canBattleUse: true}),
  v1Item("revive", "Revive", "活力碎片", "revive", "让濒死宝可梦复活，并恢复一半 HP。", {cost: 1500, canBattleUse: true}),
  v1Item("maxrevive", "Max Revive", "活力块", "revive", "让濒死宝可梦复活，并恢复全部 HP。", {cost: 4000, canBattleUse: true}),
  v1Item("revivalherb", "Revival Herb", "复活草", "revive", "让濒死宝可梦复活，并恢复全部 HP。", {cost: 2800, canBattleUse: true}),
  v1Item("ether", "Ether", "PP 单项小补剂", "pp", "让 1 个招式恢复 10 点 PP。", {cost: 1200, canBattleUse: true}),
  v1Item("maxether", "Max Ether", "PP 单项全补剂", "pp", "让 1 个招式恢复全部 PP。", {cost: 2000, canBattleUse: true}),
  v1Item("elixir", "Elixir", "PP 多项小补剂", "pp", "让所有招式恢复 10 点 PP。", {cost: 3000, canBattleUse: true}),
  v1Item("maxelixir", "Max Elixir", "PP 多项全补剂", "pp", "让所有招式恢复全部 PP。", {cost: 4500, canBattleUse: true}),
  v1Item("rarecandy", "Rare Candy", "神奇糖果", "training", "休整页使用，使宝可梦提升 1 级。", {cost: 4800, canBattleUse: false}),
  v1Item("hpup", "HP Up", "HP 增强剂", "training", "休整页使用，提升 HP 努力值 100 点。", {cost: 10000, canBattleUse: false}),
  v1Item("protein", "Protein", "攻击增强剂", "training", "休整页使用，提升攻击努力值 100 点。", {cost: 10000, canBattleUse: false}),
  v1Item("iron", "Iron", "防御增强剂", "training", "休整页使用，提升防御努力值 100 点。", {cost: 10000, canBattleUse: false}),
  v1Item("calcium", "Calcium", "特攻增强剂", "training", "休整页使用，提升特攻努力值 100 点。", {cost: 10000, canBattleUse: false}),
  v1Item("zinc", "Zinc", "特防增强剂", "training", "休整页使用，提升特防努力值 100 点。", {cost: 10000, canBattleUse: false}),
  v1Item("carbos", "Carbos", "速度增强剂", "training", "休整页使用，提升速度努力值 100 点。", {cost: 10000, canBattleUse: false}),
  v1Item("ppup", "PP Up", "PP 提升剂", "training", "提高 1 个招式的 PP 上限。", {cost: 9800, canBattleUse: false}),
  v1Item("ppmax", "PP Max", "PP 极限提升剂", "training", "将 1 个招式的 PP 上限提升到最大。", {cost: 16000, canBattleUse: false}),
  v1Item("bottlecap", "Bottle Cap", "银色王冠", "training", "休整页使用，指定 1 项个体值提升到 31。", {cost: 12000, canBattleUse: false}),
  v1Item("goldbottlecap", "Gold Bottle Cap", "金色王冠", "training", "休整页使用，全部个体值提升到 31。", {cost: 30000, canBattleUse: false}),
  v1Item("system-mega-stone", "Generic Mega Stone", "通用Mega石", "system", "准备阶段映射为真实 Mega 石；战斗中是否可 Mega 由 Showdown request 决定。", {source: "system", canUse: true, canUseToPokemon: false, canTake: false, canSale: false, cost: 0, iconAsset: "runtime/items/medichamite/icon.png", tags: ["Mega", "mega进化", "超级进化"]}),
  v1Item("system-z-crystal", "Generic Z-Crystal", "通用Z纯晶", "system", "准备阶段映射为真实 Z 纯晶；战斗中是否可使用 Z 招式由 Showdown request 决定。", {source: "system", canUse: true, canUseToPokemon: false, canTake: false, canSale: false, cost: 0, iconAsset: "runtime/items/electriumz/icon.png", tags: ["Z招式", "Z-Move", "纯晶"]}),
  v1Item("system-dynamax-band", "Dynamax Band", "极巨化手环", "system", "玩家级系统资格，不占宝可梦携带道具；极巨化入口由 Showdown request 决定。", {source: "system", canUse: false, canUseToPokemon: false, canTake: false, canSale: false, cost: 0, iconAsset: "runtime/items/redorb/icon.png", tags: ["极巨化", "Dynamax", "Max"]}),
  v1Item("system-tera-orb", "Generic Tera Orb", "通用太晶珠", "system", "玩家级系统资格，不占宝可梦携带道具；太晶属性来自后续配置。", {source: "system", canUse: true, canUseToPokemon: false, canTake: false, canSale: false, cost: 0, iconAsset: "runtime/items/adamantcrystal/icon.png", tags: ["太晶化", "Terastallize", "太晶珠"]}),
];

const V1_GAME_ITEM_BY_ID = new Map(V1_GAME_ITEM_ENTRIES.map(entry => [toID(entry.id), entry]));

export function createShowdownDexService(options: ShowdownDexServiceOptions = {}) {
  const dex = options.dex || createLocalShowdownDex();
  const resourcePrefix = normalizeResourcePrefix(options.resourcePrefix || DEFAULT_RESOURCE_PREFIX);
  const translate = options.translate || defaultTranslate;

  function requireDex(): ShowdownDexLike {
    return dex;
  }

  function searchDex(request: DexSearchRequest = {}): DexSearchResult {
    const activeDex = requireDex();
    const category = request.category || "all";
    const query = String(request.query || "");
    const offset = Math.max(0, Number(request.offset || 0));
    const limit = Math.max(1, Math.min(100, Number(request.limit || 20)));
    const categories: DexCategory[] = category === "all" ? ["pokemon", "moves", "abilities", "items"] : [category];
    const rows = categories.flatMap(current => rowsForCategory(activeDex, current));
    const ranked = rows
      .map(row => ({row, rank: rankRow(row, query)}))
      .filter(entry => entry.rank !== null)
      .sort((a, b) => Number(a.rank) - Number(b.rank) || categoryOrder(a.row.category) - categoryOrder(b.row.category) || a.row.name.localeCompare(b.row.name));
    const page = ranked.slice(offset, offset + limit).map(entry => entry.row);
    return {category, query, offset, limit, total: ranked.length, hasMore: offset + page.length < ranked.length, rows: page};
  }

  function getPokemonDetail(id: string): DexPokemonDetail {
    const activeDex = requireDex();
    const species = activeDex.species.get(id);
    assertExists(species, "Pokemon", id);
    return {
      id: species.id,
      name: species.name,
      nameZh: translate("pokemon", species.name),
      num: Number(species.num || 0),
      types: species.types || [],
      baseStats: normalizeStats(species.baseStats || {}),
      abilities: Object.entries(species.abilities || {}).map(([slot, value]) => {
        const ability = activeDex.abilities.get(String(value || ""));
        const name = ability?.exists ? ability.name : String(value || "");
        return {id: ability?.id || toID(name), name, nameZh: translate("abilities", name), hidden: String(slot).toUpperCase() === "H", description: translatedDescription("abilities", name, ability?.desc || ability?.shortDesc || "")};
      }),
      heightm: species.heightm,
      weightkg: species.weightkg,
      genderRatio: species.genderRatio || undefined,
      color: species.color || "",
      eggGroups: species.eggGroups || [],
      evolutionChain: evolutionChain(species.id),
      formes: formesFor(species.id),
      cryUrl: resolvePokemonCry(species.id),
      sprites: resolvePokemonSprites({speciesId: species.id}),
      learnset: getPokemonLearnset(species.id),
      learnsetGroups: groupLearnset(getPokemonLearnset(species.id)),
    };
  }

  function getMoveDetail(id: string): DexMoveDetail {
    const activeDex = requireDex();
    const move = activeDex.moves.get(id);
    assertExists(move, "Move", id);
    return {...moveSummary(activeDex, move, [], translate), learners: getMoveLearners(move.id), flagsText: Object.keys(move.flags || {})};
  }

  function getAbilityDetail(id: string): DexAbilityDetail {
    const activeDex = requireDex();
    const ability = activeDex.abilities.get(id);
    assertExists(ability, "Ability", id);
    return {
      id: ability.id,
      name: ability.name,
      nameZh: translate("abilities", ability.name),
      description: translatedDescription("abilities", ability.name, ability.desc || ability.shortDesc || ""),
      holders: activeDex.species.all()
        .filter(species => includeSpecies(species))
        .flatMap(species => {
          const slot = Object.entries(species.abilities || {}).find(([, value]) => toID(value) === ability.id);
          return slot ? [{pokemon: pokemonRow(activeDex, species), hidden: String(slot[0]).toUpperCase() === "H", unavailable: Boolean(species.isNonstandard && species.isNonstandard !== "Past")}] : [];
        }),
    };
  }

  function getItemDetail(id: string): DexItemDetail {
    const activeDex = requireDex();
    if (isTmItemId(id)) {
      const moveId = id.slice(3);
      const move = activeDex.moves.get(moveId);
      assertExists(move, "Move", moveId);
      return tmItemDetail(activeDex, move);
    }
    const item = activeDex.items.get(id);
    const overlay = V1_GAME_ITEM_BY_ID.get(toID(id));
    if (!item?.exists && overlay) return registryItemDetail(overlay);
    assertExists(item, "Item", id);
    return showdownItemDetail(item, overlay);
  }

  function getPokemonLearnset(speciesId: string): DexMoveSummary[] {
    const activeDex = requireDex();
    const seen = new Map<string, Set<DexLearnSource>>();
    for (const entry of activeDex.species.getFullLearnset?.(speciesId) || []) {
      for (const [moveId, codes] of Object.entries(entry.learnset || {})) {
        const move = activeDex.moves.get(moveId);
        if (!move?.exists) continue;
        const current = seen.get(move.id) || new Set<DexLearnSource>();
        learnSources(codes as string[]).forEach(source => current.add(source));
        seen.set(move.id, current);
      }
    }
    return Array.from(seen.entries()).map(([moveId, sources]) => moveSummary(activeDex, activeDex.moves.get(moveId), Array.from(sources), translate));
  }

  function getMoveLearners(moveId: string): Array<{pokemon: DexSearchRow; sources: DexLearnSource[]}> {
    const activeDex = requireDex();
    const id = toID(moveId);
    return activeDex.species.all()
      .filter(species => includeSpecies(species))
      .flatMap(species => {
        const sources = new Set<DexLearnSource>();
        for (const entry of activeDex.species.getFullLearnset?.(species.id) || []) {
          const codes = entry.learnset?.[id];
          if (codes) learnSources(codes).forEach(source => sources.add(source));
        }
        return sources.size ? [{pokemon: pokemonRow(activeDex, species), sources: Array.from(sources)}] : [];
      });
  }

  function calculatePokemonStats(input: DexStatsInput): DexStatsResult {
    const activeDex = requireDex();
    const species = activeDex.species.get(input.speciesId);
    assertExists(species, "Pokemon", input.speciesId);
    const level = clamp(Number(input.level || 100), 1, 100);
    const nature = String(input.nature || "Serious");
    const natureData = activeDex.natures?.get(nature) || {};
    const stats = Object.fromEntries(STAT_IDS.map(stat => {
      const base = Number(species.baseStats?.[stat] || 0);
      const iv = clamp(Number(input.ivs?.[stat] ?? 31), 0, 31);
      const ev = clamp(Number(input.evs?.[stat] ?? 0), 0, 252);
      if (stat === "hp") return [stat, species.id === "shedinja" ? 1 : Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10];
      const neutral = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
      const modifier = natureData.plus === stat ? 1.1 : natureData.minus === stat ? 0.9 : 1;
      return [stat, Math.floor(neutral * modifier)];
    })) as Record<DexStatId, number>;
    return {level, nature, stats};
  }

  function resolvePokemonSprites(input: {speciesId: string}): DexPokemonSprites {
    const species = requireDex().species.get(input.speciesId);
    const icon = resolvePokemonIcon(species?.id || input.speciesId);
    const spriteId = species?.spriteid || species?.id || toID(input.speciesId);
    return {
      resourcePrefix,
      spriteId,
      baseSpriteId: spriteId,
      iconUrl: icon.url,
      iconStyle: icon.style,
      frontUrl: `${resourcePrefix}sprites/ani/${spriteId}.gif`,
      backUrl: `${resourcePrefix}sprites/ani-back/${spriteId}.gif`,
      frontShinyUrl: `${resourcePrefix}sprites/ani-shiny/${spriteId}.gif`,
      backShinyUrl: `${resourcePrefix}sprites/ani-back-shiny/${spriteId}.gif`,
      animatedFrontUrl: `${resourcePrefix}sprites/ani/${spriteId}.gif`,
      animatedBackUrl: `${resourcePrefix}sprites/ani-back/${spriteId}.gif`,
      animatedFrontShinyUrl: `${resourcePrefix}sprites/ani-shiny/${spriteId}.gif`,
      animatedBackShinyUrl: `${resourcePrefix}sprites/ani-back-shiny/${spriteId}.gif`,
    };
  }

  function resolveTypeIcon(type: string) {
    return {url: `${resourcePrefix}sprites/types/${encodeURIComponent(type)}.png`};
  }

  function resolveCategoryIcon(category: string) {
    return {url: `${resourcePrefix}sprites/categories/${encodeURIComponent(category)}.png`};
  }

  function resolveItemIcon(itemId: string) {
    const item = requireDex().items.get(itemId);
    const num = Number(item?.spritenum || 0);
    const top = Math.floor(num / 16) * 24;
    const left = (num % 16) * 24;
    return {url: `${resourcePrefix}sprites/itemicons-sheet.png`, style: `background:transparent url(${resourcePrefix}sprites/itemicons-sheet.png?v1) no-repeat scroll -${left}px -${top}px`};
  }

  function resolveRegistryItemIcon(asset: string) {
    const path = asset.replace(/^assets\//, "").replace(/^\/+/, "");
    return {url: `${resourcePrefix.replace(/showdown\/$/, "")}${path}`, style: undefined as string | undefined};
  }

  function resolvePokemonIcon(speciesId: string) {
    const species = requireDex().species.get(speciesId);
    const id = species?.id || toID(speciesId);
    let num = Number(species?.num || 0);
    if (num < 0 || num > 1025) num = 0;
    num = BattlePokemonIconIndexes[id] || num;
    const top = Math.floor(num / 12) * 30;
    const left = (num % 12) * 40;
    return {url: `${resourcePrefix}sprites/pokemonicons-sheet.png`, style: `background:transparent url(${resourcePrefix}sprites/pokemonicons-sheet.png?v22) no-repeat scroll -${left}px -${top}px`};
  }

  function rowsForCategory(activeDex: ShowdownDexLike, category: DexCategory): DexSearchRow[] {
    if (category === "pokemon") return activeDex.species.all().filter(includeSpecies).map(species => pokemonRow(activeDex, species));
    if (category === "moves") return activeDex.moves.all().filter(entry => entry.exists).map(move => ({id: move.id, category: "moves", name: move.name, nameZh: translate("moves", move.name), subtitle: `${translate("types", move.type || "")} / ${translate("categories", move.category || "")}`, description: translatedDescription("moves", move.name, move.shortDesc || move.desc || ""), tags: [move.id, move.name, translate("moves", move.name), move.type, translate("types", move.type || ""), move.category, translate("categories", move.category || "")].filter(Boolean)}));
    if (category === "abilities") return activeDex.abilities.all().filter(entry => entry.exists).map(ability => ({id: ability.id, category: "abilities", name: ability.name, nameZh: translate("abilities", ability.name), subtitle: "特性", description: translatedDescription("abilities", ability.name, ability.shortDesc || ability.desc || ""), tags: [ability.id, ability.name, translate("abilities", ability.name)]}));
    if (category === "items") return itemRows(activeDex);
    return [];
  }

  function itemRows(activeDex: ShowdownDexLike): DexSearchRow[] {
    const rows = new Map<string, DexSearchRow>();
    for (const item of activeDex.items.all().filter(entry => entry.exists)) {
      const overlay = V1_GAME_ITEM_BY_ID.get(item.id);
      rows.set(item.id, itemDetailToRow(showdownItemDetail(item, overlay)));
    }
    for (const entry of V1_GAME_ITEM_ENTRIES) {
      if (!rows.has(entry.id)) rows.set(entry.id, itemDetailToRow(registryItemDetail(entry)));
    }
    for (const move of activeDex.moves.all().filter(entry => entry.exists && includeDataEntry(entry))) {
      const detail = tmItemDetail(activeDex, move);
      rows.set(detail.id, itemDetailToRow(detail));
    }
    return Array.from(rows.values());
  }

  function showdownItemDetail(item: any, overlay?: ItemRegistryEntry): DexItemDetail {
    const kind = overlay?.kind || itemKind(item);
    const icon = overlay?.iconAsset ? resolveRegistryItemIcon(overlay.iconAsset) : resolveItemIcon(item.id);
    const source: DexItemSource = overlay ? "overlay" : "showdown";
    const description = overlay?.description || translatedDescription("items", item.name, item.desc || item.shortDesc || "");
    return {
      id: item.id,
      name: item.name,
      nameZh: overlay?.nameZh || translate("items", item.name),
      kind,
      kindLabel: ITEM_KIND_LABEL[kind],
      description,
      source,
      sourceLabel: ITEM_SOURCE_LABEL[source],
      effectSummary: overlay?.effectSummary || description,
      canBattleUse: overlay?.canBattleUse ?? false,
      canUse: overlay?.canUse ?? false,
      canUseToPokemon: overlay?.canUseToPokemon ?? false,
      canTake: overlay?.canTake ?? true,
      canSale: overlay?.canSale ?? true,
      cost: overlay?.cost ?? 500,
      futureInstanceCompatible: true,
      iconUrl: icon.url,
      iconStyle: icon.style,
    };
  }

  function registryItemDetail(entry: ItemRegistryEntry): DexItemDetail {
    const icon = resolveRegistryItemIcon(entry.iconAsset || `runtime/items/${entry.id}/icon.png`);
    return {
      id: entry.id,
      name: entry.name,
      nameZh: entry.nameZh,
      kind: entry.kind,
      kindLabel: ITEM_KIND_LABEL[entry.kind],
      description: entry.description,
      source: entry.source,
      sourceLabel: ITEM_SOURCE_LABEL[entry.source],
      effectSummary: entry.effectSummary || entry.description,
      canBattleUse: entry.canBattleUse,
      canUse: entry.canUse,
      canUseToPokemon: entry.canUseToPokemon,
      canTake: entry.canTake,
      canSale: entry.canSale,
      cost: entry.cost,
      futureInstanceCompatible: entry.futureInstanceCompatible,
      iconUrl: icon.url,
      iconStyle: icon.style,
    };
  }

  function tmItemDetail(activeDex: ShowdownDexLike, move: any): DexItemDetail {
    const typeName = move.type || "Normal";
    const typeZh = translate("types", typeName);
    const moveNameZh = translate("moves", move.name);
    const icon = resolveRegistryItemIcon(`runtime/items/machine${toID(typeName) || "normal"}/icon.png`);
    return {
      id: `tm:${move.id}`,
      name: `TM ${move.name}`,
      nameZh: `技能机器：${moveNameZh || move.name}`,
      kind: "tm",
      kindLabel: ITEM_KIND_LABEL.tm,
      description: `让宝可梦学会 ${moveNameZh || move.name}。`,
      source: "v1-game",
      sourceLabel: ITEM_SOURCE_LABEL["v1-game"],
      effectSummary: `技能机器模板。属性：${typeZh || typeName}，威力：${Number(move.basePower || 0) || "-"}，命中：${move.accuracy === true ? "-" : Number(move.accuracy || 0) || "-"}。`,
      canBattleUse: false,
      canUse: true,
      canUseToPokemon: true,
      canTake: false,
      canSale: true,
      cost: defaultTmCost(move),
      futureInstanceCompatible: true,
      moveId: move.id,
      moveName: move.name,
      moveNameZh,
      iconUrl: icon.url,
      iconStyle: icon.style,
    };
  }

  function itemDetailToRow(detail: DexItemDetail): DexSearchRow {
    return {
      id: detail.id,
      category: "items",
      name: detail.name,
      nameZh: detail.nameZh,
      subtitle: detail.kindLabel,
      description: detail.description,
      tags: [
        detail.id,
        detail.name,
        detail.nameZh,
        detail.kind,
        detail.kindLabel,
        detail.sourceLabel || "",
        detail.effectSummary || "",
        detail.moveId || "",
        detail.moveName || "",
        detail.moveNameZh || "",
        ...(V1_GAME_ITEM_BY_ID.get(detail.id)?.tags || []),
      ].filter(Boolean),
      iconUrl: detail.iconUrl,
      iconStyle: detail.iconStyle,
    };
  }

  function pokemonRow(activeDex: ShowdownDexLike, species: any): DexSearchRow {
    const types = (species.types || []) as string[];
    return {id: species.id, category: "pokemon", name: species.name, nameZh: translate("pokemon", species.name), subtitle: `${types.map(type => translate("types", type)).join(" / ")} No.${species.num || "--"}`, tags: [species.id, species.name, translate("pokemon", species.name), String(species.num || ""), ...types, ...types.map(type => translate("types", type))].filter(Boolean), sprite: resolvePokemonSprites({speciesId: species.id})};
  }

  return {
    searchDex,
    getPokemonDetail,
    getMoveDetail,
    getAbilityDetail,
    getItemDetail,
    getPokemonLearnset,
    getMoveLearners,
    calculatePokemonStats,
    resolvePokemonSprites,
    resolveTypeIcon,
    resolveCategoryIcon,
    resolveItemIcon,
  };

  function evolutionChain(speciesId: string): DexPokemonLink[] {
    const activeDex = requireDex();
    const start = activeDex.species.get(speciesId);
    if (!start?.exists) return [];
    let root = start;
    const visited = new Set<string>();
    while (root.prevo && !visited.has(root.id)) {
      visited.add(root.id);
      const prevo = activeDex.species.get(root.prevo);
      if (!prevo?.exists) break;
      root = prevo;
    }
    const result: DexPokemonLink[] = [];
    const walk = (current: any) => {
      if (!current?.exists || result.some(entry => entry.id === current.id)) return;
      result.push(pokemonLink(current));
      for (const evo of current.evos || []) walk(activeDex.species.get(evo));
    };
    walk(root);
    return result;
  }

  function formesFor(speciesId: string): DexPokemonLink[] {
    const activeDex = requireDex();
    const species = activeDex.species.get(speciesId);
    const ids = [species.baseSpecies, ...(species.otherFormes || []), ...(species.cosmeticFormes || [])].filter(Boolean);
    return Array.from(new Set(ids.map(toID)))
      .map(id => activeDex.species.get(id))
      .filter(entry => entry?.exists && entry.id !== species.id)
      .map(pokemonLink);
  }

  function pokemonLink(species: any): DexPokemonLink {
    return {id: species.id, name: species.name, nameZh: translate("pokemon", species.name), num: Number(species.num || 0), sprite: resolvePokemonSprites({speciesId: species.id})};
  }

  function resolvePokemonCry(speciesId: string): string {
    const species = requireDex().species.get(speciesId);
    const cryId = species?.baseSpecies ? toID(species.baseSpecies) : species?.id || toID(speciesId);
    return `${resourcePrefix}audio/cries/${cryId}.mp3`;
  }
}

export function toID(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function includeSpecies(species: any): boolean {
  return species?.exists && Number(species.num || 0) > 0 && (!species.isNonstandard || species.isNonstandard === "Past" || species.isNonstandard === "Future");
}

function moveSummary(dex: ShowdownDexLike, move: any, sources: DexLearnSource[] = [], translate: (table: string, value: string) => string = defaultTranslate): DexMoveSummary {
  return {id: move.id, name: move.name, nameZh: translate("moves", move.name), typeId: move.type || "", categoryId: move.category || "", type: translate("types", move.type || ""), category: translate("categories", move.category || ""), power: Number(move.basePower || 0), accuracy: move.accuracy === true ? null : Number(move.accuracy || 0), pp: Number(move.pp || 0), priority: Number(move.priority || 0), target: move.target || "", flags: Object.keys(move.flags || {}), description: translatedDescription("moves", move.name, move.desc || move.shortDesc || ""), learnSources: sources};
}

function defaultTranslate(table: string, value: string): string {
  if (!value) return value;
  const key = normalizeTranslateTable(table);
  const section = (ZhCnOverrides as Record<string, Record<string, string>>)[key];
  return section?.[value] || value;
}

function translatedDescription(table: "moves" | "abilities" | "items", name: string, fallback: string): string {
  const section = (ZhCnDetails as Record<string, Record<string, {description?: string}>>)[table];
  return section?.[name]?.description || fallback;
}

function normalizeTranslateTable(table: string): string {
  if (table === "pokemon") return "species";
  return table;
}

function groupLearnset(moves: DexMoveSummary[]): Record<DexLearnSource, DexMoveSummary[]> {
  const groups = {
    levelup: [],
    machine: [],
    tutor: [],
    egg: [],
    event: [],
    transfer: [],
    other: [],
  } as Record<DexLearnSource, DexMoveSummary[]>;
  for (const move of moves) {
    const sources = move.learnSources?.length ? move.learnSources : ["other" as const];
    for (const source of sources) groups[source].push(move);
  }
  return groups;
}

function learnSources(codes: string[] = []): DexLearnSource[] {
  const result = new Set<DexLearnSource>();
  for (const code of codes) {
    const marker = String(code || "").replace(/^\d+/, "").charAt(0).toUpperCase();
    if (marker === "L") result.add("levelup");
    else if (marker === "M") result.add("machine");
    else if (marker === "T") result.add("tutor");
    else if (marker === "E") result.add("egg");
    else if (marker === "S") result.add("event");
    else if (marker === "V" || marker === "D") result.add("transfer");
    else result.add("other");
  }
  return Array.from(result);
}

function normalizeStats(stats: Partial<Record<DexStatId, number>>): Record<DexStatId, number> {
  return Object.fromEntries(STAT_IDS.map(stat => [stat, Number(stats[stat] || 0)])) as Record<DexStatId, number>;
}

function rankRow(row: DexSearchRow, query: string): number | null {
  const needle = String(query || "").trim().toLowerCase();
  const needleId = toID(needle);
  if (!needle && !needleId) return 0;
  const parts = [row.id, row.name, row.nameZh, row.subtitle, row.description, ...row.tags].filter(Boolean).map(value => String(value).toLowerCase());
  const ids = parts.map(toID).filter(Boolean);
  if (parts.some(part => part === needle) || ids.some(id => id === needleId)) return 0;
  if (parts.some(part => part.startsWith(needle)) || (needleId && ids.some(id => id.startsWith(needleId)))) return 1;
  if (parts.some(part => part.includes(needle)) || (needleId && ids.some(id => id.includes(needleId)))) return 2;
  const tokens = needle.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every(token => parts.some(part => part.includes(token)))) return 3;
  return null;
}

function categoryOrder(category: DexCategory): number {
  return {pokemon: 1, moves: 2, abilities: 3, items: 4, trainers: 5}[category];
}

function itemKind(item: any): DexItemKind {
  const id = toID(item?.id || item?.name);
  if (item?.isBerry || id.endsWith("berry")) return "berry";
  if (/revive|revivalherb|sacredash/.test(id)) return "revive";
  if (/ether|elixir|ppup|ppmax/.test(id)) return "pp";
  if (/potion|restore|heal|water|sodapop|lemonade|milk|herb|powder|root|antidote|awakening|burnheal|iceheal|paralyzeheal/.test(id)) return "recovery";
  if (/mint|abilitycapsule|abilitypatch|protein|iron|calcium|zinc|carbos|hpup/.test(id)) return "training";
  if (/ticket|pass|coupon|key|charm|flute|rod|bike|bicycle|coin|case/.test(id)) return "valuable";
  if (item?.megaStone || item?.zMove || item?.zMoveType || /iumz|ite$|itex$|itey$|max|tera/.test(id)) return "special";
  if (item?.fling || item?.onPlate || item?.onDrive || item?.onMemory || item?.onGem || item?.onTakeItem || item?.onStart || item?.onResidual || item?.onModifyAtk || item?.onModifySpA || item?.onModifySpe || item?.onModifyMove || item?.onBasePower) return "held";
  return "battle";
}

function v1Item(
  id: string,
  name: string,
  nameZh: string,
  kind: DexItemKind,
  description: string,
  options: Partial<Omit<ItemRegistryEntry, "id" | "name" | "nameZh" | "kind" | "description">> = {},
): ItemRegistryEntry {
  return {
    id,
    name,
    nameZh,
    kind,
    source: options.source || "v1-game",
    description,
    effectSummary: options.effectSummary || description,
    iconAsset: options.iconAsset || `runtime/items/${id}/icon.png`,
    canBattleUse: options.canBattleUse ?? false,
    canUse: options.canUse ?? true,
    canUseToPokemon: options.canUseToPokemon ?? kind !== "system",
    canTake: options.canTake ?? false,
    canSale: options.canSale ?? true,
    cost: options.cost ?? 500,
    futureInstanceCompatible: options.futureInstanceCompatible ?? true,
    tags: options.tags || [],
  };
}

function isTmItemId(id: string): boolean {
  return /^tm:/i.test(String(id || ""));
}

function includeDataEntry(entry: any): boolean {
  return entry?.exists && (!entry.isNonstandard || entry.isNonstandard === "Past" || entry.isNonstandard === "Future");
}

function defaultTmCost(move: any): number {
  const power = Number(move?.basePower || 0);
  if (power >= 120) return 800;
  if (power > 90) return 650;
  if (power > 60) return 500;
  if (power > 30) return 400;
  return 300;
}

function assertExists(entry: any, label: string, id: string): void {
  if (!entry?.exists) throw new Error(`${label} not found: ${id}`);
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function normalizeResourcePrefix(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}
