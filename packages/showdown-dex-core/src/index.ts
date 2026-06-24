import {createLocalShowdownDex} from "./localDex.js";
import {BattlePokemonIconIndexes} from "./data/pokemon-icon-indexes.js";
import {ZhCnDetails} from "./data/i18n/zh-cn-details.js";
import {ZhCnOverrides} from "./data/i18n/zh-cn-overrides.js";

export type DexCategory = "pokemon" | "moves" | "abilities" | "items" | "trainers";
export type DexStatId = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
export type DexLearnSource = "levelup" | "machine" | "tutor" | "egg" | "event" | "transfer" | "other";
export type DexItemKind = "recovery" | "training" | "system" | "special" | "held" | "battle" | "other";

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
  recovery: "恢复道具",
  training: "训练道具",
  system: "系统道具",
  special: "特殊道具",
  held: "携带道具",
  battle: "战斗道具",
  other: "其他道具",
};

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
    const item = activeDex.items.get(id);
    assertExists(item, "Item", id);
    const kind: DexItemKind = "battle";
    const icon = resolveItemIcon(item.id);
    return {id: item.id, name: item.name, nameZh: translate("items", item.name), kind, kindLabel: ITEM_KIND_LABEL[kind], description: translatedDescription("items", item.name, item.desc || item.shortDesc || ""), iconUrl: icon.url, iconStyle: icon.style};
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
    if (category === "items") return activeDex.items.all().filter(entry => entry.exists).map(item => {
      const icon = resolveItemIcon(item.id);
      return {id: item.id, category: "items", name: item.name, nameZh: translate("items", item.name), subtitle: ITEM_KIND_LABEL.battle, description: translatedDescription("items", item.name, item.shortDesc || item.desc || ""), tags: [item.id, item.name, translate("items", item.name), "battle", ITEM_KIND_LABEL.battle].filter(Boolean), iconUrl: icon.url, iconStyle: icon.style};
    });
    return [];
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
  return null;
}

function categoryOrder(category: DexCategory): number {
  return {pokemon: 1, moves: 2, abilities: 3, items: 4, trainers: 5}[category];
}

function itemKind(item: any): DexItemKind {
  const id = toID(item?.id || item?.name);
  if (/potion|restore|revive|heal|ether|elixir|water|sodapop|lemonade|milk|herb|powder|root|antidote|awakening/.test(id)) return "recovery";
  if (/mint|abilitycapsule|abilitypatch|protein|iron|calcium|zinc|carbos|hpup/.test(id)) return "training";
  if (/ticket|pass|coupon|key/.test(id)) return "system";
  if (item?.megaStone || item?.zMove || item?.zMoveType || /iumz|ite$|itex$|itey$|max|tera/.test(id)) return "special";
  return "other";
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
