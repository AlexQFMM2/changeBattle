import {existsSync, readFileSync} from "node:fs";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import path from "node:path";
import type {
  BattleRequestView,
  BattleState,
  BattleTimelineEvent,
  BattleTracker,
  GeneratedTeam,
  PokemonEditOptions,
  PokemonSet,
  PricedMove,
  RentalPokemon,
  PlayerPokemonState,
  ShopItem,
  SpriteIndexMap,
  SpriteMapEntry,
} from "@changebattle/shared";

const require = createRequire(import.meta.url);
const DEFAULT_SHOWDOWN_PATH = "/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown";
const MIN_RENTAL_LEVEL = 45;
const MAX_RENTAL_LEVEL = 55;
const SHINY_RATE = 30;
const RENTAL_CANDIDATE_COUNT = 6;
const MAX_GENERATION_ATTEMPTS = 40;
const STAT_IDS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
const SIDE_NAMES = {p1: "玩家", p2: "对手"} as const;
const FALLBACK_HELD_ITEMS = ["Leftovers", "Sitrus Berry", "Life Orb", "Choice Scarf", "Choice Band", "Choice Specs", "Assault Vest", "Focus Sash", "Expert Belt"];

type ShowdownModule = {
  Dex: any;
  Teams: any;
  BattleStream: any;
};

type TranslationData = Record<string, Record<string, string>>;
type DetailData = Record<string, Record<string, any>>;
type SideId = "p1" | "p2";
type Message = {type: string; data: string};
type ParsedTimelineEvent = Omit<BattleTimelineEvent, "id">;
type SlotKeySpec = {slot: number; keys: Set<string>};
type GenerationProfile = "tier1" | "tier2" | "tier3" | "tier4" | "champion";
type StageTier = 1 | 2 | 3 | 4;
type TierRow = {species_id: string; species: string; tier: StageTier; override_tier?: string};
type ConsumableItemEffect = {
  id: string;
  hp: string;
  revive: "" | "half" | "full";
  pp: string;
  pp_scope: "" | "one" | "all";
  status: string;
  notes?: string;
};

export type GenerateRentalOptions = {
  profiles?: GenerationProfile[];
  stages?: StageTier[];
  speciesIds?: string[];
  purpose?: "starter" | "normal" | "boss" | "rescue";
};

export type GameServiceOptions = {
  projectRoot: string;
  showdownPath?: string;
};

export type StartBattleOptions = {
  playerTeam: PokemonSet[];
  enemyTeam: PokemonSet[];
  playerDisplay: RentalPokemon[];
  enemyDisplay: RentalPokemon[];
  playerState?: PlayerPokemonState[];
  seed: number | number[];
};

export class GameService {
  readonly projectRoot: string;
  private readonly showdownPath: string;
  private sim: ShowdownModule | null = null;
  private spriteMap: SpriteIndexMap | null = null;
  private translations: TranslationData | null = null;
  private translationNormalized: TranslationData | null = null;
  private details: DetailData | null = null;
  private detailsNormalized: DetailData | null = null;
  private tierRows: TierRow[] | null = null;
  private consumableEffects: Map<string, ConsumableItemEffect> | null = null;

  constructor(options: GameServiceOptions) {
    this.projectRoot = options.projectRoot;
    this.showdownPath = options.showdownPath || process.env.SHOWDOWN_PATH || DEFAULT_SHOWDOWN_PATH;
  }

  async generateRentalCandidates(seed: number | number[] = Date.now(), format: string | GenerateRentalOptions = "gen7randombattle", count = RENTAL_CANDIDATE_COUNT, options: GenerateRentalOptions = {}): Promise<GeneratedTeam> {
    if (typeof format === "object") {
      options = format;
      format = "gen7randombattle";
      count = options.profiles?.length || options.stages?.length || options.speciesIds?.length || count;
    }
    const sim = this.loadShowdown();
    const seedArray = this.seedArray(seed);
    await this.loadDisplayData();
    if (options.profiles?.length || options.stages?.length || options.speciesIds?.length) {
      return this.generateProfiledCandidates(seedArray, format, count, options);
    }
    const team: PokemonSet[] = [];
    const display: RentalPokemon[] = [];
    const seenSpecies = new Set<string>();

    const targetCount = Math.max(1, Math.min(24, Number(count || RENTAL_CANDIDATE_COUNT)));
    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS && team.length < targetCount; attempt += 1) {
      const attemptSeed = this.bumpSeed(seedArray, attempt);
      const generated = this.normalizeTeam(sim.Teams.generate(format, {seed: attemptSeed}));
      const rng = this.createRngFromSeed(attemptSeed, attempt + 1);
      for (const baseSet of generated) {
        if (team.length >= targetCount) break;
        const set = this.randomizeRentalSet(baseSet, rng);
        const described = this.describeSet(set);
        if (seenSpecies.has(described.species_id)) continue;
        if (!this.hasUsableSprite(described)) continue;
        seenSpecies.add(described.species_id);
        team.push(set);
        display.push(described);
      }
    }

    if (team.length < targetCount) {
      throw new Error(`可用图片的租赁候选不足：${team.length}/${targetCount}`);
    }

    return {seed: seedArray, team, display, packed: sim.Teams.pack(team)};
  }

  async describeTeam(team: PokemonSet[]): Promise<RentalPokemon[]> {
    await this.loadDisplayData();
    return this.normalizeTeam(team).map(set => this.describeSet(set));
  }

  speciesDisplay(rawSpecies: string): {species_id: string; name: string; name_zh: string; sprite?: SpriteMapEntry} {
    const species = this.loadShowdown().Dex.species.get(rawSpecies);
    const speciesId = species.id || this.toId(rawSpecies);
    const name = species.name || rawSpecies;
    return {
      species_id: speciesId,
      name,
      name_zh: this.zh("species", name),
      sprite: this.spriteMap?.entries[speciesId],
    };
  }

  async itemOptions(): Promise<ShopItem[]> {
    await this.loadDisplayData();
    const sim = this.loadShowdown();
    return sim.Dex.items.all()
      .filter((item: any) => item.exists && !item.isNonstandard)
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        name_zh: this.zh("items", item.name),
        cost: 500,
        desc: item.desc || item.shortDesc || "",
        desc_zh: this.detailDescription("items", item.name),
      }));
  }

  async learnableMoves(set: PokemonSet): Promise<PricedMove[]> {
    await this.loadDisplayData();
    const dex = this.loadShowdown().Dex.mod("gen7");
    const species = dex.species.get(set.species || set.name);
    if (!species.exists) return [];
    const seen = new Set<string>();
    const moves: PricedMove[] = [];
    for (const entry of dex.species.getFullLearnset(species.id) || []) {
      for (const moveId of Object.keys(entry.learnset || {})) {
        const move = dex.moves.get(moveId);
        if (!move.exists || !move.id || seen.has(move.id)) continue;
        if (move.isNonstandard && move.isNonstandard !== "Past") continue;
        seen.add(move.id);
        const summary = this.moveDetails(move.id, dex);
        moves.push({...summary, cost: this.defaultMoveCost(summary.power)});
      }
    }
    return moves.sort((a, b) => (b.power || 0) - (a.power || 0) || a.name.localeCompare(b.name));
  }

  async editOptions(set: PokemonSet): Promise<PokemonEditOptions> {
    await this.loadDisplayData();
    const dex = this.loadShowdown().Dex.mod("gen7");
    const species = dex.species.get(set.species || set.name);
    const seen = new Set<string>();
    const abilities = [];
    for (const abilityName of Object.values(species.abilities || {})) {
      const ability = dex.abilities.get(abilityName as string);
      const name = ability.exists ? ability.name : String(abilityName || "");
      const id = ability.exists ? ability.id : this.toId(name);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      abilities.push({
        id,
        name,
        name_zh: this.zh("abilities", name),
        desc: ability.exists ? (ability.desc || ability.shortDesc || "") : "",
        desc_zh: this.detailDescription("abilities", name),
      });
    }
    const natures = dex.natures.all().map((nature: any) => ({
      id: nature.id,
      name: nature.name,
      name_zh: this.zh("natures", nature.name),
      plus: nature.plus || "",
      minus: nature.minus || "",
      plus_zh: this.zh("stats", nature.plus || ""),
      minus_zh: this.zh("stats", nature.minus || ""),
    }));
    return {abilities, natures};
  }

  async getSpriteForSpecies(speciesId: string): Promise<SpriteMapEntry | undefined> {
    const spriteMap = await this.loadSpriteMap();
    return spriteMap.entries[speciesId];
  }

  async createBattleSession(options: StartBattleOptions): Promise<TrainerItemBattleSession> {
    await this.loadDisplayData();
    const session = new TrainerItemBattleSession(this, this.loadShowdown(), options);
    await session.start();
    return session;
  }

  async hasConsumableItemEffect(itemId: string): Promise<boolean> {
    return Boolean((await this.loadConsumableItemEffects()).get(toId(itemId)));
  }

  async applyConsumableItemEffectToState(itemId: string, state: PlayerPokemonState, moveSlot?: number): Promise<string> {
    await this.loadDisplayData();
    const effect = (await this.loadConsumableItemEffects()).get(toId(itemId));
    if (!effect) throw new Error("这个道具不能作为消耗道具使用。");
    const itemName = this.plain("items", itemId);
    const result = applyConsumableEffectToMutableState(effect, state, itemName, moveSlot);
    return result.message;
  }

  loadShowdown(): ShowdownModule {
    if (!this.sim) {
      this.sim = require(path.join(this.showdownPath, "dist", "sim")) as ShowdownModule;
    }
    return this.sim;
  }

  seedArray(seed: number | number[]): number[] {
    if (Array.isArray(seed) && seed.length === 4) return seed.map(value => Number(value) & 0xffff);
    let value = Number.isFinite(Number(seed)) ? Number(seed) >>> 0 : 1;
    const out: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      value = (value * 1664525 + 1013904223) >>> 0;
      out.push(value & 0xffff);
    }
    return out;
  }

  deriveSeed(base: number, salt: number): number {
    return (Number(base) * 1103515245 + 12345 + salt * 2654435761) >>> 0;
  }

  plain(section: string, value: string | undefined): string {
    return this.zh(section, value);
  }

  effectName(raw: string): string {
    const value = raw.replace("[from] ", "").replace("[of] ", "")
      .replace("move: ", "").replace("item: ", "").replace("ability: ", "");
    if (value === "drain") return "吸取效果";
    for (const section of ["moves", "items", "abilities", "statuses"]) {
      const translated = this.zh(section, value);
      if (translated !== value) return translated;
    }
    return value;
  }

  abilityDescription(rawAbility: string | undefined): string {
    const value = String(rawAbility || "").replace("ability: ", "");
    return this.detailDescription("abilities", value);
  }

  itemDescription(rawItem: string | undefined): string {
    const value = String(rawItem || "").replace("item: ", "");
    return this.detailDescription("items", value);
  }

  conditionText(condition: string | undefined): string {
    if (!condition) return "?";
    const parts = String(condition).split(" ");
    const last = parts[parts.length - 1];
    const translated = this.zh("statuses", last);
    if (translated !== last) parts[parts.length - 1] = translated;
    return parts.join(" ");
  }

  private async loadDisplayData(): Promise<void> {
    await this.loadSpriteMap();
    await this.loadTranslations();
    await this.loadDetails();
  }

  private async loadSpriteMap(): Promise<SpriteIndexMap> {
    if (!this.spriteMap) {
      const raw = await readFile(path.join(this.projectRoot, "data", "sprite_index_map.json"), "utf8");
      this.spriteMap = JSON.parse(raw) as SpriteIndexMap;
    }
    return this.spriteMap;
  }

  private bumpSeed(seed: number[], attempt: number): number[] {
    if (attempt === 0) return seed;
    return seed.map((value, index) => (value + attempt * (9973 + index * 7919)) & 0xffff);
  }

  private normalizeTeam(team: PokemonSet[]): PokemonSet[] {
    return team.map(set => ({...set, level: Number(set.level || 50), nature: set.nature || "Serious", moves: [...(set.moves || [])]}));
  }

  private describeSet(set: PokemonSet): RentalPokemon {
    const sim = this.loadShowdown();
    const species = sim.Dex.species.get(set.species || set.name);
    const ability = sim.Dex.abilities.get(set.ability);
    const item = set.item ? sim.Dex.items.get(set.item) : null;
    const level = Math.max(1, Number(set.level || 50));
    const nature = this.natureModifiers(set.nature || "Serious");
    const ivs = this.fullStats(set.ivs || {}, 31);
    const evs = this.fullStats(set.evs || {}, 0);
    const speciesId = species.id || this.toId(set.species || set.name);
    const sprite = this.spriteMap?.entries[speciesId];
    const baseStats = this.fullStats(species.baseStats || {}, 0);
    return {
      name: set.name || set.species,
      species: set.species,
      species_zh: this.zh("species", species.name || set.species),
      species_id: speciesId,
      level,
      gender: set.gender || "",
      types: species.types || [],
      types_zh: (species.types || []).map((typeName: string) => this.zh("types", typeName)),
      ability: ability.exists ? ability.name : (set.ability || ""),
      ability_zh: this.zh("abilities", ability.exists ? ability.name : set.ability),
      ability_id: ability.exists ? ability.id : "",
      ability_desc: ability.exists ? (ability.desc || ability.shortDesc || "") : "",
      ability_desc_zh: this.detailDescription("abilities", ability.exists ? ability.name : set.ability),
      item: item?.exists ? item.name : (set.item || ""),
      item_zh: this.zh("items", item?.exists ? item.name : set.item),
      item_id: item?.exists ? item.id : "",
      item_desc: item?.exists ? (item.desc || item.shortDesc || "") : "",
      item_desc_zh: this.detailDescription("items", item?.exists ? item.name : set.item),
      moves: (set.moves || []).map((moveId: string) => this.moveDetails(moveId)),
      base_stats: baseStats,
      stats: this.calculatedStats(baseStats, ivs, evs, level, nature),
      evs,
      ivs,
      nature: nature.name,
      nature_zh: this.zh("natures", nature.name),
      nature_plus: nature.plus,
      nature_minus: nature.minus,
      role: set.role || "",
      role_zh: this.zh("roles", set.role || ""),
      shiny: Boolean(set.shiny),
      stage_tier: set.stage_tier,
      generation_profile: set.generation_profile,
      sprite,
    };
  }

  private createRngFromSeed(seed: number[], salt = 0): () => number {
    let state = seed.reduce((acc, value, index) => (acc ^ ((Number(value) & 0xffff) << ((index % 2) * 16))) >>> 0, 0x9e3779b9 ^ salt);
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }

  private randomInt(rng: () => number, min: number, max: number): number {
    return min + Math.floor(rng() * (max - min + 1));
  }

  private randomIvs(rng: () => number): Record<string, number> {
    return Object.fromEntries(STAT_IDS.map(stat => [stat, this.randomInt(rng, 0, 31)]));
  }

  private randomEvs(rng: () => number): Record<string, number> {
    const evs = Object.fromEntries(STAT_IDS.map(stat => [stat, 0])) as Record<string, number>;
    let remaining = 510;
    const order = [...STAT_IDS].sort(() => rng() - 0.5);
    for (const stat of order) {
      const value = this.randomInt(rng, 0, Math.min(255, remaining));
      evs[stat] = value;
      remaining -= value;
    }
    return evs;
  }

  private randomMovesForSet(set: PokemonSet, rng: () => number): string[] {
    const dex = this.loadShowdown().Dex.mod("gen7");
    const species = dex.species.get(set.species || set.name);
    const pool: string[] = [];
    const seen = new Set<string>();
    for (const entry of dex.species.getFullLearnset(species.id) || []) {
      for (const moveId of Object.keys(entry.learnset || {})) {
        const move = dex.moves.get(moveId);
        if (!move.exists || !move.id || seen.has(move.id)) continue;
        if (move.isNonstandard && move.isNonstandard !== "Past") continue;
        seen.add(move.id);
        pool.push(move.name || move.id);
      }
    }
    const shuffled = [...pool].sort(() => rng() - 0.5);
    const selected = shuffled.slice(0, 4);
    return selected.length >= 4 ? selected : [...(set.moves || [])].slice(0, 4);
  }

  randomizeRentalSet(baseSet: PokemonSet, rng: () => number): PokemonSet {
    const dex = this.loadShowdown().Dex.mod("gen7");
    const natures = dex.natures.all();
    const nature = natures[this.randomInt(rng, 0, Math.max(0, natures.length - 1))]?.name || baseSet.nature || "Serious";
    return {
      ...baseSet,
      level: this.randomInt(rng, MIN_RENTAL_LEVEL, MAX_RENTAL_LEVEL),
      item: "",
      ivs: this.randomIvs(rng),
      evs: this.randomEvs(rng),
      nature,
      moves: this.randomMovesForSet(baseSet, rng),
      shiny: this.randomInt(rng, 1, SHINY_RATE) === 1,
    };
  }

  private generateProfiledCandidates(seedArray: number[], format: string, count: number, options: GenerateRentalOptions): GeneratedTeam {
    const sim = this.loadShowdown();
    const targetCount = Math.max(1, Math.min(24, Number(count || RENTAL_CANDIDATE_COUNT)));
    const requestedProfiles = this.requestedProfiles(options, targetCount);
    const speciesIds = (options.speciesIds || []).map(id => this.toId(id));
    const team: PokemonSet[] = [];
    const display: RentalPokemon[] = [];
    const seenSpecies = new Set<string>();
    const rng = this.createRngFromSeed(seedArray, 4100 + targetCount);
    const generator = this.randomGenerator(format, seedArray);

    for (let index = 0; index < targetCount; index += 1) {
      const profile = requestedProfiles[index] || requestedProfiles[requestedProfiles.length - 1] || "tier1";
      const speciesId = speciesIds[index] || this.pickSpeciesForProfile(profile, rng, seenSpecies);
      const baseSet = this.baseSetForSpecies(speciesId, generator, rng);
      const set = this.applyGenerationProfile(baseSet, profile, rng);
      const described = this.describeSet(set);
      if (seenSpecies.has(described.species_id) && !speciesIds[index]) continue;
      if (!this.hasUsableSprite(described) && !speciesIds[index]) {
        index -= 1;
        continue;
      }
      seenSpecies.add(described.species_id);
      team.push(set);
      display.push(described);
    }
    if (team.length < targetCount) throw new Error(`可用图片的阶段候选不足：${team.length}/${targetCount}`);
    return {seed: seedArray, team, display, packed: sim.Teams.pack(team)};
  }

  private requestedProfiles(options: GenerateRentalOptions, count: number): GenerationProfile[] {
    if (options.profiles?.length) return options.profiles.slice(0, count);
    if (options.stages?.length) return options.stages.slice(0, count).map(stage => `tier${stage}` as GenerationProfile);
    return Array.from({length: count}, () => "tier1" as GenerationProfile);
  }

  private randomGenerator(format: string, seedArray: number[]): any {
    try {
      return this.loadShowdown().Teams.getGenerator(format || "gen7randombattle", seedArray);
    } catch {
      return null;
    }
  }

  private baseSetForSpecies(speciesId: string, generator: any, rng: () => number): PokemonSet {
    const dex = this.loadShowdown().Dex.mod("gen7");
    const species = dex.species.get(speciesId);
    if (generator?.randomSet && species.exists) {
      try {
        return this.normalizeTeam([generator.randomSet(species)])[0];
      } catch {
        // Fall through to the local legal-set fallback.
      }
    }
    const abilities = Object.values(species.abilities || {}).filter(Boolean) as string[];
    const ability = abilities[this.randomInt(rng, 0, Math.max(0, abilities.length - 1))] || "";
    return {
      name: species.name || speciesId,
      species: species.name || speciesId,
      ability,
      item: "",
      moves: this.randomMovesForSet({species: species.name || speciesId, moves: []}, rng),
      nature: "Serious",
      evs: this.fullStats({}, 0),
      ivs: this.fullStats({}, 31),
      level: 50,
    };
  }

  private applyGenerationProfile(baseSet: PokemonSet, profile: GenerationProfile, rng: () => number): PokemonSet {
    const normalizedProfile = profile === "champion" ? "champion" : profile;
    const stageTier = normalizedProfile === "champion" ? 4 : Number(normalizedProfile.replace("tier", "")) as StageTier;
    const dex = this.loadShowdown().Dex.mod("gen7");
    const natures = dex.natures.all();
    const randomNature = () => natures[this.randomInt(rng, 0, Math.max(0, natures.length - 1))]?.name || "Serious";
    const heldItem = baseSet.item || FALLBACK_HELD_ITEMS[this.randomInt(rng, 0, FALLBACK_HELD_ITEMS.length - 1)];
    const set = {...baseSet, moves: [...(baseSet.moves || [])], shiny: this.randomInt(rng, 1, SHINY_RATE) === 1};
    if (normalizedProfile === "tier1") {
      return {...set, level: this.randomInt(rng, 45, 50), item: "", ivs: this.randomStatsWithTotal(rng, this.randomInt(rng, 0, 90), 31), evs: this.randomStatsWithTotal(rng, this.randomInt(rng, 0, 200), 255), nature: "Serious", stage_tier: stageTier, generation_profile: normalizedProfile};
    }
    if (normalizedProfile === "tier2") {
      return {...set, level: this.randomInt(rng, 45, 50), item: heldItem, ivs: this.randomStatsWithTotal(rng, this.randomInt(rng, 60, 120), 31), evs: this.randomStatsWithTotal(rng, this.randomInt(rng, 180, 300), 255), nature: randomNature(), stage_tier: stageTier, generation_profile: normalizedProfile};
    }
    if (normalizedProfile === "tier3") {
      return {...set, level: this.randomInt(rng, 50, 54), item: heldItem, ivs: this.randomStatsWithTotal(rng, this.randomInt(rng, 90, 150), 31), evs: this.randomStatsWithTotal(rng, this.randomInt(rng, 270, 450), 255), nature: baseSet.nature || randomNature(), stage_tier: stageTier, generation_profile: normalizedProfile};
    }
    const level = normalizedProfile === "champion" ? this.randomInt(rng, 58, 60) : 55;
    return {...set, level, item: heldItem, ivs: this.fullStats({}, 31), evs: this.randomStatsWithTotal(rng, 510, 255), nature: baseSet.nature || randomNature(), stage_tier: 4, generation_profile: normalizedProfile};
  }

  private randomStatsWithTotal(rng: () => number, total: number, maxPerStat: number): Record<string, number> {
    const cappedTotal = Math.max(0, Math.min(total, maxPerStat * STAT_IDS.length));
    const values = Object.fromEntries(STAT_IDS.map(stat => [stat, 0])) as Record<string, number>;
    let remaining = cappedTotal;
    const order = [...STAT_IDS].sort(() => rng() - 0.5);
    for (let index = 0; index < order.length; index += 1) {
      const stat = order[index];
      const slotsLeft = order.length - index - 1;
      const min = Math.max(0, remaining - maxPerStat * slotsLeft);
      const max = Math.min(maxPerStat, remaining);
      const value = index === order.length - 1 ? remaining : this.randomInt(rng, min, max);
      values[stat] = value;
      remaining -= value;
    }
    return values;
  }

  private pickSpeciesForProfile(profile: GenerationProfile, rng: () => number, seenSpecies: Set<string>): string {
    const tier = profile === "champion" ? 4 : Number(profile.replace("tier", "")) as StageTier;
    const pool = this.loadTierRows().filter(row => row.tier === tier && !seenSpecies.has(row.species_id));
    const fallback = this.loadTierRows().filter(row => row.tier === tier);
    const selectedPool = pool.length ? pool : fallback;
    return selectedPool[this.randomInt(rng, 0, Math.max(0, selectedPool.length - 1))]?.species_id || "pikachu";
  }

  private loadTierRows(): TierRow[] {
    if (this.tierRows) return this.tierRows;
    const filePath = path.join(this.projectRoot, "data", "pokemon_tiers.csv");
    if (!existsSync(filePath)) {
      this.tierRows = [];
      return this.tierRows;
    }
    const lines = readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
    const header = this.parseCsvLine(lines[0] || "");
    this.tierRows = lines.slice(1).map(line => {
      const values = this.parseCsvLine(line);
      const row = Object.fromEntries(header.map((key, index) => [key, values[index] || ""])) as Record<string, string>;
      return {
        species_id: row.species_id,
        species: row.species,
        tier: Number(row.override_tier || row.tier || 1) as StageTier,
        override_tier: row.override_tier,
      };
    }).filter(row => row.species_id && row.tier >= 1 && row.tier <= 4);
    return this.tierRows;
  }

  private parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === "\"") {
        if (quoted && line[index + 1] === "\"") {
          cell += "\"";
          index += 1;
        } else quoted = !quoted;
      } else if (char === "," && !quoted) {
        cells.push(cell);
        cell = "";
      } else cell += char;
    }
    cells.push(cell);
    return cells;
  }

  private hasUsableSprite(pokemon: RentalPokemon): boolean {
    const spritePath = pokemon.sprite?.paths.front_normal;
    if (!spritePath || pokemon.sprite?.sprite_index === 0) return false;
    if (/^https?:\/\//i.test(spritePath)) return true;
    return existsSync(path.join(this.projectRoot, spritePath));
  }

  private moveDetails(moveId: string, dex = this.loadShowdown().Dex) {
    const move = dex.moves.get(moveId);
    const detail = this.detail("moves", move.name || moveId);
    return {
      id: move.id || moveId,
      name: move.name || moveId,
      name_zh: this.zh("moves", move.name || moveId),
      type: move.type || "",
      type_zh: detail?.type?.zh_cn || this.zh("types", move.type || ""),
      category: move.category || "",
      category_zh: detail?.category?.zh_cn || this.zh("categories", move.category || ""),
      power: move.basePower || 0,
      accuracy: move.accuracy === true ? null : move.accuracy,
      pp: move.pp || 0,
      priority: move.priority || 0,
      short_desc: move.shortDesc || "",
      short_desc_zh: detail?.description || "",
      desc: move.desc || move.shortDesc || "",
      desc_zh: detail?.description || "",
    };
  }

  private natureModifiers(natureName: string) {
    const nature = this.loadShowdown().Dex.natures.get(natureName || "Serious");
    return {name: nature.name || "Serious", plus: nature.plus || "", minus: nature.minus || ""};
  }

  private defaultMoveCost(power: number | undefined): number {
    const value = Number(power || 0);
    if (value >= 120) return 500;
    if (value > 90) return 400;
    if (value > 60) return 300;
    if (value > 30) return 200;
    return 100;
  }

  private calculatedStats(baseStats: Record<string, number>, ivs: Record<string, number>, evs: Record<string, number>, level: number, nature: {plus: string; minus: string}): Record<string, number> {
    const result: Record<string, number> = {};
    for (const stat of STAT_IDS) {
      const base = baseStats[stat] || 0;
      const value = Math.floor(((2 * base + ivs[stat] + Math.floor(evs[stat] / 4)) * level) / 100);
      if (stat === "hp") {
        result[stat] = value + level + 10;
      } else {
        let adjusted = value + 5;
        if (nature.plus === stat) adjusted = Math.floor(adjusted * 1.1);
        if (nature.minus === stat) adjusted = Math.floor(adjusted * 0.9);
        result[stat] = adjusted;
      }
    }
    return result;
  }

  private fullStats(input: Record<string, number>, defaultValue: number): Record<string, number> {
    const result: Record<string, number> = {};
    for (const stat of STAT_IDS) result[stat] = input[stat] === undefined ? defaultValue : Number(input[stat]);
    return result;
  }

  async loadConsumableItemEffects(): Promise<Map<string, ConsumableItemEffect>> {
    if (this.consumableEffects) return this.consumableEffects;
    const effects = new Map<string, ConsumableItemEffect>();
    const filePath = path.join(this.projectRoot, "data", "consumable_item_effects.csv");
    if (existsSync(filePath)) {
      const lines = (await readFile(filePath, "utf8")).split(/\r?\n/).filter(line => line.trim());
      const header = parseCsvLine(lines[0] || "");
      for (const line of lines.slice(1)) {
        const values = parseCsvLine(line);
        const row = Object.fromEntries(header.map((key, index) => [key, values[index] || ""]));
        const id = toId(row.id);
        if (!id) continue;
        effects.set(id, {
          id,
          hp: String(row.hp || ""),
          revive: row.revive === "half" || row.revive === "full" ? row.revive : "",
          pp: String(row.pp || ""),
          pp_scope: row.pp_scope === "one" || row.pp_scope === "all" ? row.pp_scope : "",
          status: String(row.status || "none"),
          notes: row.notes || "",
        });
      }
    }
    this.consumableEffects = effects;
    return effects;
  }

  private toId(value: string): string {
    return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  private async loadTranslations(): Promise<TranslationData> {
    if (!this.translations) {
      const raw = await readFile(path.join(this.projectRoot, "data", "zh_cn_overrides.json"), "utf8");
      const parsed = JSON.parse(raw) as TranslationData;
      this.translations = parsed;
      this.translationNormalized = this.normalizeSections(parsed);
    }
    return this.translations;
  }

  private async loadDetails(): Promise<DetailData> {
    if (!this.details) {
      const raw = await readFile(path.join(this.projectRoot, "data", "zh_cn_details.json"), "utf8");
      const parsed = JSON.parse(raw) as DetailData;
      this.details = parsed;
      this.detailsNormalized = this.normalizeSections(parsed);
    }
    return this.details;
  }

  private normalizeSections<T extends Record<string, any>>(sections: T): T {
    const normalized: Record<string, any> = {};
    for (const [section, values] of Object.entries(sections)) {
      if (!values || typeof values !== "object") continue;
      normalized[section] = Object.fromEntries(Object.entries(values).map(([key, value]) => [this.toId(key), value]));
    }
    return normalized as T;
  }

  private zh(section: string, value: string | undefined): string {
    if (!value) return "";
    const direct = this.translations?.[section]?.[value];
    if (direct) return direct;
    const normalized = this.translationNormalized?.[section]?.[this.toId(value)];
    return normalized || value;
  }

  private detail(section: string, value: string | undefined): any {
    if (!value) return null;
    return this.details?.[section]?.[value] || this.detailsNormalized?.[section]?.[this.toId(value)] || null;
  }

  private detailDescription(section: string, value: string | undefined): string {
    const detail = this.detail(section, value);
    return detail?.description || "";
  }
}

export class BattleSession {
  protected readonly service: GameService;
  private readonly sim: ShowdownModule;
  private readonly playerTeam: PokemonSet[];
  private readonly enemyTeam: PokemonSet[];
  private readonly playerDisplay: RentalPokemon[];
  private readonly enemyDisplay: RentalPokemon[];
  private readonly initialPlayerState?: PlayerPokemonState[];
  private readonly playerSlotKeys: SlotKeySpec[];
  private readonly enemySlotKeys: SlotKeySpec[];
  private readonly seed: number | number[];
  protected stream: any = null;
  private pendingMessages: Message[] = [];
  protected latestRequests: Record<string, BattleRequestView> = {};
  protected ended = false;
  private winner: string | null = null;
  private tracker = createBattleTracker();
  private recentEvents: string[] = [];
  private timelineEvents: BattleTimelineEvent[] = [];
  private timelineSeq = 0;
  private rngState: number;

  constructor(service: GameService, sim: ShowdownModule, options: StartBattleOptions) {
    this.service = service;
    this.sim = sim;
    this.playerTeam = options.playerTeam;
    this.enemyTeam = options.enemyTeam;
    this.playerDisplay = options.playerDisplay;
    this.enemyDisplay = options.enemyDisplay;
    this.initialPlayerState = options.playerState;
    this.playerSlotKeys = buildSideSlotKeys(options.playerTeam, options.playerDisplay, options.playerState, "p1");
    this.enemySlotKeys = buildSideSlotKeys(options.enemyTeam, options.enemyDisplay, undefined, "p2");
    this.seed = options.seed;
    const seedValue = Array.isArray(options.seed) ? options.seed.reduce((acc, value) => acc ^ value, 0) : Number(options.seed);
    this.rngState = seedValue >>> 0;
  }

  async start(): Promise<BattleState> {
    this.latestRequests = {};
    this.pendingMessages = [];
    this.ended = false;
    this.winner = null;
    this.tracker = createBattleTracker();
    this.recentEvents = [];
    this.timelineEvents = [];
    this.timelineSeq = 0;
    this.stream = new this.sim.BattleStream({keepAlive: true});
    this.startReader();
    const init = [
      `>start ${JSON.stringify({formatid: "gen7customgame", seed: this.service.seedArray(this.seed)})}`,
      `>player p1 ${JSON.stringify({name: "Player", team: this.sim.Teams.pack(this.playerTeam)})}`,
      `>player p2 ${JSON.stringify({name: "Enemy", team: this.sim.Teams.pack(this.enemyTeam)})}`,
    ].join("\n");
    await this.stream.write(init);
    await this.waitForMessages();
    this.consumePending();
    await this.chooseTeamPreview();
    if (this.initialPlayerState?.length) this.syncSideState("p1", this.initialPlayerState);
    return this.getState();
  }

  async choose(choice: string): Promise<BattleState> {
    if (!this.stream || this.ended) return this.getState();
    await this.chooseSide("p1", choice);
    await this.resolveEnemyIfNeeded();
    return this.getState();
  }

  forfeit(): BattleState {
    if (!this.ended) {
      this.ended = true;
      this.winner = "Enemy";
      this.recentEvents.push("玩家认输。", "胜者：对手");
      this.timelineEvents.push(
        this.withTimelineId({type: "message", text: "玩家认输。", side: "p1"}),
        this.withTimelineId({type: "win", text: "胜者：对手", side: "p2"})
      );
    }
    return this.getState();
  }

  getState(): BattleState {
    return {
      ended: this.ended,
      winner: this.winner,
      request: this.latestRequests.p1 || null,
      tracker: this.tracker,
      recent_events: this.recentEvents.slice(-30),
      timeline_events: this.timelineEvents.slice(-100),
      player_team: this.playerTeam,
      player_display: this.playerDisplay,
      enemy_team: this.enemyTeam,
      enemy_display: this.enemyDisplay,
    };
  }

  getPlayerState(): PlayerPokemonState[] {
    return this.currentSideState("p1");
  }

  syncPlayerState(states: PlayerPokemonState[]): BattleState {
    this.syncSideState("p1", states);
    return this.getState();
  }

  private async chooseTeamPreview(): Promise<void> {
    const p1 = this.latestRequests.p1;
    const p2 = this.latestRequests.p2;
    if (p1?.teamPreview) await this.chooseSide("p1", "team 123");
    if (p2?.teamPreview) await this.chooseSide("p2", this.randomChoice(p2));
    this.updatePpMemory(this.latestRequests.p1);
  }

  private async resolveEnemyIfNeeded(): Promise<void> {
    for (let guard = 0; guard < 6 && !this.ended; guard += 1) {
      const p1 = this.latestRequests.p1;
      const p2 = this.latestRequests.p2;
      if (p2 && !p2.wait) {
        await this.chooseSide("p2", this.randomChoice(p2));
        continue;
      }
      if (!p1 || !p1.wait) break;
      await this.waitForMessages();
      this.consumePending();
      if (!this.latestRequests.p2 || this.latestRequests.p2.wait) break;
    }
  }

  protected async chooseSide(side: SideId, choice: string): Promise<void> {
    await this.stream.write(`>${side} ${choice}`);
    await this.waitForMessages();
    this.consumePending();
    this.updatePpMemory(this.latestRequests.p1);
  }

  private startReader(): void {
    (async () => {
      for await (const chunk of this.stream) this.parseChunk(String(chunk));
    })().catch((error: Error) => {
      this.pendingMessages.push({type: "error", data: error.stack || String(error)});
    });
  }

  private parseChunk(chunk: string): void {
    const lines = chunk.split("\n");
    const type = lines.shift() || "";
    const data = lines.join("\n");
    this.pendingMessages.push({type, data});
    if (type === "sideupdate") {
      const side = lines[0];
      for (const line of lines.slice(1)) {
        if (line.startsWith("|request|")) {
          const nextRequest = JSON.parse(line.slice("|request|".length));
          this.captureRequestHeals(side as SideId, this.latestRequests[side], nextRequest);
          this.latestRequests[side] = nextRequest;
        }
      }
    } else if (type === "update") {
      for (const line of lines) {
        if (line.startsWith("|win|")) {
          this.ended = true;
          this.winner = line.slice("|win|".length);
        } else if (line === "|tie") {
          this.ended = true;
          this.winner = "tie";
        }
      }
    } else if (type === "end") {
      this.ended = true;
    }
  }

  private consumePending(): void {
    const {events, timeline} = consumeLog(this.pendingMessages, this.tracker, this.service);
    this.pendingMessages = [];
    this.recentEvents.push(...events);
    this.recentEvents = this.recentEvents.slice(-40);
    this.timelineEvents.push(...timeline.map(event => this.withTimelineId(event)));
    this.timelineEvents = this.timelineEvents.slice(-140);
  }

  private waitForMessages(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 25));
  }

  protected randomChoice(request: BattleRequestView | null | undefined): string {
    if (!request) return "default";
    if (request.teamPreview) {
      const indexes = Array.from({length: request.side?.pokemon?.length || 0}, (_, index) => index + 1);
      this.shuffle(indexes);
      return "team " + indexes.join("");
    }
    if (request.forceSwitch) {
      const switches = legalSwitchIndexes(request);
      return switches.length ? `switch ${this.pick(switches)}` : "default";
    }
    const moves = (request.active?.[0]?.moves || [])
      .map((move, index) => ({move, index: index + 1}))
      .filter(entry => !entry.move.disabled)
      .map(entry => entry.index);
    if (moves.length) return `move ${this.pick(moves)}`;
    const switches = legalSwitchIndexes(request);
    return switches.length ? `switch ${this.pick(switches)}` : "default";
  }

  private updatePpMemory(request: BattleRequestView | null | undefined): void {
    if (!request) return;
    const active = request.side?.pokemon?.[0];
    const activeName = shortIdent(active?.ident || "");
    if (!activeName) return;
    const activeMoves = request.active?.[0]?.moves || [];
    if (!activeMoves.length) return;
    this.tracker.pp[activeName] = Object.fromEntries(activeMoves.map(move => [move.id || move.move, {name: move.move || move.id, pp: move.pp, maxpp: move.maxpp}]));
  }

  private currentSideState(side: SideId): PlayerPokemonState[] {
    if (!this.stream?.battle) return [];
    const battleSide = this.stream.battle.sides[side === "p2" ? 1 : 0];
    const states = battleSide.pokemon.map((pokemon: any, index: number) => pokemonStateFromBattle(pokemon, battleSide, index));
    return alignStatesToSlots(states, this.slotKeysForSide(side));
  }

  private syncSideState(side: SideId, states: PlayerPokemonState[]): void {
    if (!this.stream?.battle) return;
    const battleSide = this.stream.battle.sides[side === "p2" ? 1 : 0];
    const stateBySlot = new Map(states.map(state => [Number(state.slot), state]));
    const slotKeys = this.slotKeysForSide(side);
    const usedSlots = new Set<number>();
    for (let index = 0; index < battleSide.pokemon.length; index += 1) {
      const pokemon = battleSide.pokemon[index];
      const current = pokemonStateFromBattle(pokemon, battleSide, index);
      const slot = resolveStateSlot(current, slotKeys, usedSlots);
      const state = stateBySlot.get(slot);
      usedSlots.add(slot);
      if (!state) continue;
      const hp = Math.max(0, Math.min(Number(state.hp ?? pokemon.maxhp) || 0, pokemon.maxhp));
      pokemon.hp = hp;
      pokemon.fainted = hp <= 0;
      pokemon.faintQueued = false;
      pokemon.subFainted = null;
      const status = toId(state.status || "");
      pokemon.status = "";
      pokemon.statusState = {};
      if (status && hp > 0) pokemon.setStatus(status, pokemon, null, true);
      const ppById = new Map<string, number>();
      const ppBySlot = new Map<number, number>();
      for (const move of state.moves || []) {
        ppById.set(toId(move.id || move.move), Number(move.pp));
        ppBySlot.set(Number(move.slot), Number(move.pp));
      }
      for (let moveIndex = 0; moveIndex < pokemon.moveSlots.length; moveIndex += 1) {
        const moveSlot = pokemon.moveSlots[moveIndex];
        const nextPp = ppById.has(moveSlot.id) ? ppById.get(moveSlot.id) : ppBySlot.get(moveIndex + 1);
        if (Number.isFinite(nextPp)) moveSlot.pp = Math.max(0, Math.min(Number(nextPp), moveSlot.maxpp));
      }
    }
    battleSide.pokemonLeft = battleSide.pokemon.filter((pokemon: any) => !pokemon.fainted && pokemon.hp > 0).length;
    this.refreshRequests();
    this.updatePpMemory(this.latestRequests.p1);
    this.applyPlayerStateToTracker(this.currentSideState(side));
  }

  private slotKeysForSide(side: SideId): SlotKeySpec[] {
    return side === "p2" ? this.enemySlotKeys : this.playerSlotKeys;
  }

  private refreshRequests(): void {
    if (!this.stream?.battle?.requestState) return;
    const requests = this.stream.battle.getRequests(this.stream.battle.requestState);
    this.latestRequests.p1 = requests[0];
    this.latestRequests.p2 = requests[1];
    for (let index = 0; index < this.stream.battle.sides.length; index += 1) {
      const side = this.stream.battle.sides[index];
      side.activeRequest = requests[index];
      side.emitRequest(requests[index], true);
    }
  }

  private applyPlayerStateToTracker(states: PlayerPokemonState[]): void {
    if (!states.length) return;
    const active = states.find(state => state.active) || states[0];
    this.tracker.active.p1 = {
      name: shortIdent(active.ident || "") || active.species || active.details || "",
      condition: active.condition || stateCondition(active),
      status: active.status || "",
    };
  }

  private captureRequestHeals(side: SideId, previous: BattleRequestView | undefined, next: BattleRequestView): void {
    if (!previous?.side?.pokemon?.length || !next?.side?.pokemon?.length) return;
    const previousByIdent = new Map(previous.side.pokemon.map(pokemon => [pokemon.ident, pokemon]));
    for (const pokemon of next.side.pokemon) {
      const before = previousByIdent.get(pokemon.ident);
      if (!before || before.condition === pokemon.condition) continue;
      const oldHp = parseConditionHp(before.condition);
      const newHp = parseConditionHp(pokemon.condition);
      if (!oldHp || !newHp || newHp.current <= oldHp.current) continue;
      const display = side === "p1" ? findRentalByRuntime(this.playerDisplay, pokemon.ident) : findRentalByRuntime(this.enemyDisplay, pokemon.ident);
      const ability = display?.ability_id === "regenerator" || display?.ability === "Regenerator" ? "Regenerator" : "";
      if (!ability) continue;
      if (hasPendingRealHeal(this.pendingMessages, pokemon.ident, pokemon.condition)) continue;
      this.pendingMessages.push({type: "update", data: `|-heal|${pokemon.ident}|${pokemon.condition}|[from] ability: Regenerator`});
    }
  }

  private nextRandom(): number {
    this.rngState = (this.rngState * 1664525 + 1013904223) >>> 0;
    return this.rngState / 0x100000000;
  }

  private pick<T>(values: T[]): T {
    return values[Math.floor(this.nextRandom() * values.length)];
  }

  private shuffle<T>(values: T[]): void {
    for (let index = values.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(this.nextRandom() * (index + 1));
      [values[index], values[swap]] = [values[swap], values[index]];
    }
  }

  private withTimelineId(event: ParsedTimelineEvent): BattleTimelineEvent {
    this.timelineSeq += 1;
    return {...event, id: `t${this.timelineSeq}`};
  }
}

export class TrainerItemBattleSession extends BattleSession {
  private trainerItemPatchInstalled = false;

  async chooseTrainerItem(itemId: string, targetSlot: number, moveSlot?: number): Promise<BattleState> {
    if (!this.stream || this.ended) return this.getState();
    const battle = this.stream.battle;
    if (!battle) throw new Error("当前对战尚未开始。");
    const request = this.latestRequests.p1;
    if (!request || request.wait) throw new Error("现在不能使用道具。");
    if (request.forceSwitch) throw new Error("当前必须换人，不能使用战斗道具。");
    if (!request.active?.length) throw new Error("当前不是出招阶段，不能使用战斗道具。");
    const side = battle.sides[0];
    const active = side.active[0];
    if (!active || active.fainted || active.hp <= 0) throw new Error("当前宝可梦无法行动，不能使用战斗道具。");
    const targetIndex = Math.max(0, Number(targetSlot || 0));
    const target = side.pokemon[targetIndex];
    if (!target) throw new Error("道具目标不存在。");
    const effect = (await this.service.loadConsumableItemEffects()).get(toId(itemId));
    if (!effect) throw new Error("这个道具不能在战斗中主动使用。");
    const itemName = this.service.plain("items", itemId) || itemId;
    assertConsumableEffectCanApplyToBattlePokemon(effect, target, moveSlot);
    this.installTrainerItemAction();
    side.clearChoice();
    side.choice.actions.push({
      choice: "trainerItem",
      pokemon: active,
      target,
      itemId: toId(itemId),
      itemName,
      effect,
      moveSlot,
      order: 102,
      priority: 0,
      speed: 1,
    });
    const enemyRequest = this.latestRequests.p2;
    if (enemyRequest && !enemyRequest.wait) await this.chooseSide("p2", this.randomChoice(enemyRequest));
    else await this.chooseSide("p2", "default");
    return this.getState();
  }

  private installTrainerItemAction(): void {
    if (this.trainerItemPatchInstalled || !this.stream?.battle) return;
    const battle = this.stream.battle;
    const originalRunAction = battle.runAction.bind(battle);
    battle.runAction = (action: any) => {
      if (action?.choice !== "trainerItem") return originalRunAction(action);
      battle.add('-message', `${battlePokemonName(action.target)} 使用了 ${action.itemName}。`);
      applyConsumableEffectToBattlePokemon(battle, action.effect, action.target, action.itemId, action.itemName, action.moveSlot);
      return undefined;
    };
    this.trainerItemPatchInstalled = true;
  }
}

function createBattleTracker(): BattleTracker {
  return {
    turn: 1,
    active: {p1: {}, p2: {}},
    boosts: {p1: {}, p2: {}},
    side_conditions: {p1: [], p2: []},
    weather: "无",
    field: [],
    pp: {},
  };
}

function activeDisplay(service: GameService, rawSpecies: string | undefined): {species_id: string; name: string; name_zh: string; sprite?: SpriteMapEntry} {
  return service.speciesDisplay(shortIdent(rawSpecies || "").split(",", 1)[0].trim());
}

function setActiveDisplay(tracker: BattleTracker, service: GameService, side: SideId, rawSpecies: string | undefined, condition?: string, clearSubstitute = false): void {
  const display = activeDisplay(service, rawSpecies);
  tracker.active[side] = {
    ...tracker.active[side],
    name: display.name,
    display_name: display.name_zh,
    species_id: display.species_id,
    sprite: display.sprite,
    condition: condition || tracker.active[side]?.condition,
    ...(clearSubstitute ? {substitute: false} : {}),
  };
}

function legalSwitchIndexes(request: BattleRequestView): number[] {
  return (request.side?.pokemon || [])
    .map((pokemon, index) => ({pokemon, index: index + 1}))
    .filter(({pokemon}) => !pokemon.active && !String(pokemon.condition || "").endsWith(" fnt"))
    .map(({index}) => index);
}

function splitLogLines(messages: Message[]): string[] {
  const lines: string[] = [];
  for (const message of messages) {
    if (message.type !== "update") continue;
    const rawLines = String(message.data || "").split("\n");
    for (let index = 0; index < rawLines.length; index += 1) {
      const line = rawLines[index];
      if (!line || line.startsWith("|request|")) continue;
      if (line.startsWith("|split|")) {
        const side = line.split("|")[2] as SideId | undefined;
        const secret = rawLines[index + 1] || "";
        const publicLine = rawLines[index + 2] || "";
        const selected = side === "p1" ? secret : publicLine;
        if (selected && !selected.startsWith("|request|")) lines.push(selected);
        index += 2;
        continue;
      }
      lines.push(line);
    }
  }
  return lines;
}

function sideFromIdent(raw: string): SideId | null {
  if (raw.startsWith("p1")) return "p1";
  if (raw.startsWith("p2")) return "p2";
  return null;
}

function shortIdent(raw: string): string {
  let value = raw.split("|")[0].trim();
  if (value.includes(":")) value = value.split(":", 2)[1].trim();
  return value;
}

function toId(value: string): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (quoted && line[index + 1] === "\"") {
        cell += "\"";
        index += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
}

function computeHpAmount(raw: string, maxhp: number): number {
  const value = String(raw || "").trim();
  if (!value) return 0;
  if (value === "full") return maxhp;
  if (value.endsWith("%")) return Math.max(1, Math.floor(maxhp * Number(value.slice(0, -1)) / 100));
  return Math.max(0, Number(value || 0));
}

function computePpAmount(raw: string, maxpp: number): number {
  const value = String(raw || "").trim();
  if (!value) return 0;
  if (value === "full") return maxpp;
  return Math.max(0, Number(value || 0));
}

function statusCanBeCured(effect: ConsumableItemEffect, status: string): boolean {
  const current = toId(status);
  if (!current || effect.status === "none") return false;
  if (effect.status === "all") return true;
  return effect.status.split("|").map(toId).includes(current);
}

function normalizeMoveSlot(moveSlot?: number): number {
  return Math.max(0, Number(moveSlot || 0));
}

function stateDisplayName(state: PlayerPokemonState): string {
  return state.species || shortIdent(state.ident || "") || state.details || "宝可梦";
}

function refreshMutablePlayerState(state: PlayerPokemonState): void {
  state.hp = Math.max(0, Math.min(Number(state.hp || 0), Number(state.maxhp || 1)));
  state.fainted = state.hp <= 0;
  if (state.fainted) state.status = "";
  state.condition = stateCondition(state);
}

function applyConsumableEffectToMutableState(effect: ConsumableItemEffect, state: PlayerPokemonState, itemName: string, moveSlot?: number): {message: string; details: string[]} {
  const details: string[] = [];
  const beforeHp = Number(state.hp || 0);
  const wasFainted = state.fainted || beforeHp <= 0;
  if (effect.revive) {
    if (!wasFainted) throw new Error("目标没有濒死，不能使用这个复活道具。");
    state.hp = effect.revive === "full" ? state.maxhp : Math.max(1, Math.floor(state.maxhp / 2));
    state.fainted = false;
    state.status = "";
    details.push(`恢复到 ${state.hp}/${state.maxhp}`);
  } else if (wasFainted) {
    throw new Error("目标已经濒死，不能使用这个道具。");
  }

  const hpAmount = computeHpAmount(effect.hp, state.maxhp);
  if (hpAmount > 0 && !state.fainted && state.hp < state.maxhp) {
    const previous = state.hp;
    state.hp = Math.min(state.maxhp, state.hp + hpAmount);
    details.push(`恢复了 ${state.hp - previous} 点生命值`);
  }

  if (effect.pp_scope) {
    const moves = state.moves || [];
    const slot = normalizeMoveSlot(moveSlot);
    const targets = effect.pp_scope === "all"
      ? moves
      : slot ? moves.filter(move => move.slot === slot) : moves.filter(move => move.pp < move.maxpp).slice(0, 1);
    if (!targets.length) throw new Error("请选择需要恢复 PP 的技能。");
    let restored = 0;
    for (const move of targets) {
      if (move.pp >= move.maxpp) continue;
      const amount = computePpAmount(effect.pp, move.maxpp);
      const previous = move.pp;
      move.pp = Math.min(move.maxpp, move.pp + amount);
      restored += move.pp - previous;
    }
    if (restored > 0) details.push(`恢复了 ${restored} 点 PP`);
  }

  if (statusCanBeCured(effect, state.status)) {
    const status = state.status;
    state.status = "";
    details.push(`解除了 ${status}`);
  }

  refreshMutablePlayerState(state);
  if (!details.length) throw new Error("目标不需要这个道具。");
  const name = stateDisplayName(state);
  return {message: `${name} 使用了 ${itemName}。${details.join("，")}。`, details};
}

function battlePokemonName(pokemon: any): string {
  return pokemon?.name || pokemon?.species?.name || "宝可梦";
}

function battleHealthText(pokemon: any): string {
  return `${Math.max(0, Number(pokemon.hp || 0))}/${Math.max(1, Number(pokemon.maxhp || 1))}`;
}

function assertConsumableEffectCanApplyToBattlePokemon(effect: ConsumableItemEffect, target: any, moveSlot?: number): void {
  const wasFainted = Boolean(target.fainted || target.hp <= 0);
  let canApply = false;
  if (effect.revive) {
    if (!wasFainted) throw new Error("目标没有濒死，不能使用这个复活道具。");
    canApply = true;
  } else if (wasFainted) {
    throw new Error("目标已经濒死，不能使用这个道具。");
  }
  const hpAmount = computeHpAmount(effect.hp, target.maxhp);
  if (hpAmount > 0 && !wasFainted && target.hp < target.maxhp) canApply = true;
  if (effect.pp_scope) {
    const moves = target.moveSlots || [];
    const slot = normalizeMoveSlot(moveSlot);
    const targets = effect.pp_scope === "all"
      ? moves
      : slot ? moves.filter((move: any, index: number) => index + 1 === slot) : moves.filter((move: any) => move.pp < move.maxpp).slice(0, 1);
    if (!targets.length) throw new Error("请选择需要恢复 PP 的技能。");
    if (targets.some((move: any) => move.pp < move.maxpp)) canApply = true;
  }
  if (statusCanBeCured(effect, target.status)) canApply = true;
  if (!canApply) throw new Error("目标不需要这个道具。");
}

function applyConsumableEffectToBattlePokemon(battle: any, effect: ConsumableItemEffect, target: any, itemId: string, itemName: string, moveSlot?: number): string[] {
  const details: string[] = [];
  const wasFainted = Boolean(target.fainted || target.hp <= 0);
  if (effect.revive) {
    if (!wasFainted) throw new Error("目标没有濒死，不能使用这个复活道具。");
    target.hp = effect.revive === "full" ? target.maxhp : Math.max(1, Math.floor(target.maxhp / 2));
    target.fainted = false;
    target.faintQueued = false;
    target.status = "";
    target.statusState = {};
    target.side.pokemonLeft = Math.max(Number(target.side.pokemonLeft || 0), target.side.pokemon.filter((pokemon: any) => !pokemon.fainted && pokemon.hp > 0).length);
    battle.add('-heal', target, battleHealthText(target), '[from] item: ' + itemId);
    details.push(`恢复到 ${battleHealthText(target)}`);
  } else if (wasFainted) {
    throw new Error("目标已经濒死，不能使用这个道具。");
  }

  const hpAmount = computeHpAmount(effect.hp, target.maxhp);
  if (hpAmount > 0 && !target.fainted && target.hp < target.maxhp) {
    const previous = target.hp;
    target.hp = Math.min(target.maxhp, target.hp + hpAmount);
    battle.add('-heal', target, battleHealthText(target), '[from] item: ' + itemId);
    details.push(`恢复了 ${target.hp - previous} 点生命值`);
  }

  if (effect.pp_scope) {
    const moves = target.moveSlots || [];
    const slot = normalizeMoveSlot(moveSlot);
    const targets = effect.pp_scope === "all"
      ? moves
      : slot ? moves.filter((move: any, index: number) => index + 1 === slot) : moves.filter((move: any) => move.pp < move.maxpp).slice(0, 1);
    if (!targets.length) throw new Error("请选择需要恢复 PP 的技能。");
    let restored = 0;
    for (const move of targets) {
      if (move.pp >= move.maxpp) continue;
      const amount = computePpAmount(effect.pp, move.maxpp);
      const previous = move.pp;
      move.pp = Math.min(move.maxpp, move.pp + amount);
      restored += move.pp - previous;
    }
    if (restored > 0) {
      battle.add('-message', `${battlePokemonName(target)} 恢复了 ${restored} 点 PP。`);
      details.push(`恢复了 ${restored} 点 PP`);
    }
  }

  if (statusCanBeCured(effect, target.status)) {
    const before = target.status;
    target.cureStatus();
    details.push(`解除了 ${before}`);
  }

  if (!details.length) throw new Error("目标不需要这个道具。");
  return details;
}

function pokemonCondition(pokemon: any): string {
  if (!pokemon) return "?";
  if (!pokemon.hp || pokemon.fainted) return "0 fnt";
  return `${pokemon.hp}/${pokemon.maxhp}${pokemon.status ? ` ${pokemon.status}` : ""}`;
}

function pokemonStateFromBattle(pokemon: any, battleSide: any, index: number): PlayerPokemonState {
  return {
    slot: index + 1,
    ident: pokemon.fullname,
    details: pokemon.details,
    species: pokemon.species?.name || pokemon.set?.species || pokemon.name,
    condition: pokemonCondition(pokemon),
    hp: pokemon.hp || 0,
    maxhp: pokemon.maxhp || 0,
    status: pokemon.status || "",
    fainted: Boolean(pokemon.fainted || !pokemon.hp),
    active: battleSide.active.includes(pokemon),
    item: pokemon.item || "",
    moves: (pokemon.moveSlots || []).map((moveSlot: any, moveIndex: number) => ({
      slot: moveIndex + 1,
      id: moveSlot.id,
      move: moveSlot.move,
      pp: moveSlot.pp,
      maxpp: moveSlot.maxpp,
    })),
  };
}

function stateCondition(state: PlayerPokemonState): string {
  if (!state.hp || state.fainted) return "0 fnt";
  return `${state.hp}/${state.maxhp}${state.status ? ` ${state.status}` : ""}`;
}

function addSlotKey(keys: Set<string>, prefix: string, value: unknown): void {
  const normalized = toId(String(value || ""));
  if (normalized) keys.add(`${prefix}:${normalized}`);
}

function addSpeciesLikeKeys(keys: Set<string>, value: unknown): void {
  const raw = String(value || "").trim();
  if (!raw) return;
  addSlotKey(keys, "species", raw);
  addSlotKey(keys, "details_species", raw.split(",", 1)[0]);
}

function addMoveSignatureKey(keys: Set<string>, species: unknown, moves: unknown): void {
  const speciesId = toId(String(species || ""));
  if (!speciesId || !Array.isArray(moves)) return;
  const moveIds = moves.map((move: any) => toId(move?.id || move?.move || move?.name || move)).filter(Boolean).sort();
  if (moveIds.length) keys.add(`species_moves:${speciesId}:${moveIds.join(",")}`);
}

function keysForState(state: Partial<PlayerPokemonState>): Set<string> {
  const keys = new Set<string>();
  const short = shortIdent(state.ident || "");
  addSlotKey(keys, "ident", short);
  addSpeciesLikeKeys(keys, state.details);
  addSpeciesLikeKeys(keys, state.species);
  addSlotKey(keys, "item", state.item);
  addMoveSignatureKey(keys, state.species || state.details || short, state.moves || []);
  return keys;
}

function keysForSet(set: Partial<PokemonSet> | undefined): Set<string> {
  const keys = new Set<string>();
  if (!set) return keys;
  addSlotKey(keys, "ident", set.name || set.species);
  addSpeciesLikeKeys(keys, set.species || set.name);
  addSlotKey(keys, "ability", set.ability);
  addSlotKey(keys, "item", set.item);
  addMoveSignatureKey(keys, set.species || set.name, set.moves || []);
  return keys;
}

function keysForDisplay(pokemon: Partial<RentalPokemon> | undefined): Set<string> {
  const keys = new Set<string>();
  if (!pokemon) return keys;
  addSlotKey(keys, "ident", pokemon.name || pokemon.species || pokemon.species_id);
  addSpeciesLikeKeys(keys, pokemon.species || pokemon.name || pokemon.species_id);
  addSlotKey(keys, "species_id", pokemon.species_id);
  addSlotKey(keys, "ability", pokemon.ability_id || pokemon.ability);
  addSlotKey(keys, "item", pokemon.item_id || pokemon.item);
  addMoveSignatureKey(keys, pokemon.species || pokemon.name || pokemon.species_id, pokemon.moves || []);
  return keys;
}

function buildSideSlotKeys(team: PokemonSet[], display: RentalPokemon[], states: PlayerPokemonState[] | undefined, side: SideId): SlotKeySpec[] {
  const maxLength = Math.max(team.length, display.length, states?.length || 0);
  return Array.from({length: maxLength}, (_, index) => {
    const slot = index + 1;
    const keys = new Set<string>();
    for (const key of keysForSet(team[index])) keys.add(key);
    for (const key of keysForDisplay(display[index])) keys.add(key);
    for (const key of keysForState(states?.[index] || {})) keys.add(key);
    const fallbackName = display[index]?.species || display[index]?.name || team[index]?.species || team[index]?.name || states?.[index]?.species || states?.[index]?.details || slot;
    addSlotKey(keys, "ident", `${side}: ${fallbackName}`);
    keys.add(`slot:${slot}`);
    return {slot, keys};
  });
}

function resolveStateSlot(state: PlayerPokemonState, slotKeys: SlotKeySpec[], usedSlots: Set<number>): number {
  if (!slotKeys.length) return Number(state.slot) || 1;
  const keys = keysForState(state);
  for (const key of keys) {
    const match = slotKeys.find(spec => !usedSlots.has(spec.slot) && spec.keys.has(key));
    if (match) return match.slot;
  }
  const fallbackSlot = Number(state.slot);
  if (fallbackSlot && slotKeys.some(spec => spec.slot === fallbackSlot) && !usedSlots.has(fallbackSlot)) return fallbackSlot;
  return slotKeys.find(spec => !usedSlots.has(spec.slot))?.slot || fallbackSlot || 1;
}

function alignStatesToSlots(states: PlayerPokemonState[], slotKeys: SlotKeySpec[]): PlayerPokemonState[] {
  if (!slotKeys.length) return states;
  const usedSlots = new Set<number>();
  return states
    .map(state => {
      const slot = resolveStateSlot(state, slotKeys, usedSlots);
      usedSlots.add(slot);
      return {...state, slot};
    })
    .sort((a, b) => a.slot - b.slot);
}

function findRentalByRuntime(team: RentalPokemon[], ident: string): RentalPokemon | undefined {
  const key = toId(shortIdent(ident));
  return team.find(pokemon => toId(pokemon.species) === key || toId(pokemon.name) === key || pokemon.species_id === key);
}

function addUnique(values: string[], value: string): void {
  if (value && !values.includes(value)) values.push(value);
}

function removeValue(values: string[], value: string): void {
  const index = values.indexOf(value);
  if (index >= 0) values.splice(index, 1);
}

function boostText(service: GameService, stat: string, value: string): string {
  const translated = service.plain("stats", stat);
  return `${translated}${Number(value) >= 0 ? "+" : ""}${value}`;
}

function effectTarget(parts: string[], start = 4): string {
  const owner = parts.slice(start).find(part => part.startsWith("[of] "));
  return owner ? owner.replace("[of] ", "") : "";
}

type ProtocolSource = {
  kind: "item" | "ability" | "move" | "effect" | "";
  name: string;
  label: string;
  raw: string;
  ownerIdent: string;
  ownerName: string;
};

function sourceLabel(raw: string, service: GameService): Omit<ProtocolSource, "ownerIdent" | "ownerName"> {
  if (raw.startsWith("item: ")) {
    const name = service.plain("items", raw.replace("item: ", ""));
    return {kind: "item", name, label: `道具${name}`, raw};
  }
  if (raw.startsWith("ability: ")) {
    const name = service.plain("abilities", raw.replace("ability: ", ""));
    return {kind: "ability", name, label: `特性${name}`, raw};
  }
  if (raw.startsWith("move: ")) {
    const name = service.plain("moves", raw.replace("move: ", ""));
    return {kind: "move", name, label: `招式${name}`, raw};
  }
  const name = service.effectName(raw);
  return {kind: "effect", name, label: name, raw};
}

function protocolSource(parts: string[], service: GameService, start = 4): ProtocolSource {
  let source: Omit<ProtocolSource, "ownerIdent" | "ownerName"> = {kind: "", name: "", label: "", raw: ""};
  let ownerIdent = "";
  for (const part of parts.slice(start)) {
    if (part.startsWith("[from] ")) source = sourceLabel(part.replace("[from] ", ""), service);
    else if (part.startsWith("[of] ")) ownerIdent = part.replace("[of] ", "");
  }
  return {
    ...source,
    ownerIdent,
    ownerName: ownerIdent ? translatedSpecies(service, ownerIdent) : "",
  };
}

function sourceEventType(source: ProtocolSource): ParsedTimelineEvent["type"] {
  if (source.kind === "item") return "item";
  if (source.kind === "ability") return "ability";
  return "message";
}

function eventSource(parts: string[], targetIdent: string | undefined, service: GameService): string {
  const source = protocolSource(parts, service);
  const target = service.plain("species", shortIdent(targetIdent || ""));
  if (source.name && source.name !== "吸取效果" && source.ownerName && source.ownerName !== target) return `${source.ownerName} 的${source.label}`;
  return source.label || source.name;
}

function sourceActivationText(source: ProtocolSource, fallbackOwner: string, suffix: string): string {
  const owner = source.ownerName || fallbackOwner;
  if (!source.name) return suffix;
  if (source.name === "吸取效果") return `吸取效果${suffix}`;
  return suffix ? `${owner} 的${source.label}发动，${suffix}` : `${owner} 的${source.label}发动。`;
}

function appendDescription(text: string, description: string): string {
  const clean = description.trim();
  return clean ? `${text}${clean}` : text;
}

function abilityNotice(service: GameService, target: string, rawAbility: string, fallbackAbility: string): Pick<ParsedTimelineEvent, "notice_title" | "notice_detail"> {
  const ability = service.plain("abilities", rawAbility.replace("ability: ", "")) || fallbackAbility;
  return {
    notice_title: `${target}的${ability}`,
    notice_detail: service.abilityDescription(rawAbility),
  };
}

function itemNotice(service: GameService, target: string, rawItem: string, fallbackItem: string, action = ""): Pick<ParsedTimelineEvent, "notice_title" | "notice_detail"> {
  const item = service.plain("items", rawItem.replace("item: ", "")) || fallbackItem;
  return {
    notice_title: `${target}使用了${item}`,
    notice_detail: action || service.itemDescription(rawItem),
  };
}

function sourceNotice(service: GameService, target: string, source: ProtocolSource, action = ""): Pick<ParsedTimelineEvent, "notice_title" | "notice_detail"> {
  if (source.kind === "ability") return abilityNotice(service, target, source.raw, source.name);
  if (source.kind === "item") return itemNotice(service, target, source.raw, source.name, action);
  return {};
}

function hasTag(parts: string[], tag: string): boolean {
  return parts.includes(tag);
}

function protocolDebugEnabled(): boolean {
  return process.env.CHANGEBATTLE_DEBUG_SHOWDOWN === "1";
}

function isIgnoredProtocolTag(tag: string): boolean {
  return [
    "",
    "player",
    "teamsize",
    "gametype",
    "gen",
    "tier",
    "rule",
    "clearpoke",
    "poke",
    "teampreview",
    "start",
    "request",
    "upkeep",
    "t:",
    "inactive",
    "inactiveoff",
    "debug",
    "-center",
  ].includes(tag);
}

function pokemonActionLabel(tag: string): string {
  return ({
    switch: "上场了",
    drag: "被拖上场",
    replace: "显露了真实身份",
    detailschange: "形态改变",
    "-formechange": "形态改变",
  } as Record<string, string>)[tag] || "变化";
}

function sideConditionText(side: SideId, action: "start" | "end", value: string): string {
  return `${SIDE_NAMES[side]} 场地${action === "start" ? "出现" : "移除"}：${value}`;
}

function setBoostValue(tracker: BattleTracker, side: SideId | null, stat: string, value: number): void {
  if (!side) return;
  tracker.boosts[side][stat] = Math.max(-6, Math.min(6, value));
}

function addBoostValue(tracker: BattleTracker, side: SideId | null, stat: string, value: number): void {
  if (!side) return;
  const current = Number(tracker.boosts[side][stat] || 0);
  setBoostValue(tracker, side, stat, current + value);
}

function clearBoostValue(tracker: BattleTracker, side: SideId | null, positive: boolean | null = null): void {
  if (!side) return;
  for (const [stat, value] of Object.entries(tracker.boosts[side])) {
    if (positive === null || (positive && value > 0) || (!positive && value < 0)) {
      delete tracker.boosts[side][stat];
    }
  }
}

function hasPendingRealHeal(messages: Message[], ident: string, condition: string): boolean {
  const target = shortIdent(ident);
  return splitLogLines(messages).some(line => {
    const parts = line.split("|");
    return parts[1] === "-heal" && shortIdent(parts[2] || "") === target && parts[3] === condition;
  });
}

function parseConditionHp(condition: string | undefined): BattleTimelineEvent["hp"] {
  const match = String(condition || "").match(/(\d+)\/(\d+)/);
  if (!match) return null;
  return {current: Number(match[1]), max: Number(match[2]), text: `${match[1]}/${match[2]}`};
}

function translatedSpecies(service: GameService, ident: string | undefined): string {
  return service.plain("species", shortIdent(ident || ""));
}

function consumeLog(messages: Message[], tracker: BattleTracker, service: GameService): {events: string[]; timeline: ParsedTimelineEvent[]} {
  const events: string[] = [];
  const timeline: ParsedTimelineEvent[] = [];
  let pendingEffectiveness: Array<{text: string; event: ParsedTimelineEvent}> = [];
  for (const line of splitLogLines(messages)) {
    const parts = line.split("|");
    const tag = parts[1] || "";
    if (protocolDebugEnabled()) events.push(`Showdown: ${line}`);
    let text: string | null = null;
    let timelineEvent: ParsedTimelineEvent | null = null;
    let afterEvents: Array<{text: string; event: ParsedTimelineEvent}> = [];
    if (tag === "turn" && parts[2]) {
      tracker.turn = Number(parts[2]) || tracker.turn;
      continue;
    } else if (["switch", "drag", "replace", "detailschange", "-formechange"].includes(tag) && parts[2]) {
      const side = sideFromIdent(parts[2]);
      const oldName = side ? tracker.active[side]?.display_name || translatedSpecies(service, parts[2]) : translatedSpecies(service, parts[2]);
      const nextDetails = parts[3] || parts[2];
      const nextDisplay = activeDisplay(service, nextDetails);
      const nextName = nextDisplay.name_zh;
      const targetId = nextDisplay.name;
      const condition = parts[4] || tracker.active[side || "p1"]?.condition || "?";
      if (side) {
        setActiveDisplay(tracker, service, side, nextDetails, condition, tag === "switch" || tag === "drag");
        tracker.active[side].status = "";
        if (tag === "switch" || tag === "drag") tracker.boosts[side] = {};
      }
      text = tag === "detailschange" || tag === "-formechange"
        ? `${oldName} ${pokemonActionLabel(tag)}为 ${nextName}。`
        : `${nextName} ${pokemonActionLabel(tag)}。`;
      timelineEvent = {type: tag === "detailschange" || tag === "-formechange" ? "form" : "switch", text, side: side || undefined, targetSide: side || undefined, target: nextName, target_id: targetId, target_species_id: nextDisplay.species_id, sprite: nextDisplay.sprite, condition, hp: parseConditionHp(condition)};
    } else if (tag === "move" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      const source = translatedSpecies(service, parts[2]);
      const sourceId = shortIdent(parts[2]);
      const move = service.plain("moves", parts[3]);
      text = `${source} 使用 ${move}。`;
      timelineEvent = {type: "move", text, side: side || undefined, source, source_id: sourceId, move};
    } else if (tag === "cant" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const reason = service.effectName(parts[3]);
      const move = parts[4] ? service.plain("moves", parts[4]) : "";
      text = move ? `${target} 因 ${reason} 无法使出 ${move}。` : `${target} 因 ${reason} 无法行动。`;
      timelineEvent = {type: "message", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: reason};
    } else if (tag === "-transform" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      const source = translatedSpecies(service, parts[2]);
      const targetDisplay = activeDisplay(service, parts[3]);
      const target = targetDisplay.name_zh;
      const protocol = protocolSource(parts, service);
      if (side) setActiveDisplay(tracker, service, side, parts[3], tracker.active[side]?.condition);
      text = protocol.name ? sourceActivationText(protocol, source, `变身为 ${target}。`) : `${source} 变身为 ${target}。`;
      timelineEvent = {type: "form", text, side: side || undefined, targetSide: side || undefined, source, source_id: shortIdent(parts[2]), target, target_id: targetDisplay.name, target_species_id: targetDisplay.species_id, sprite: targetDisplay.sprite, effect: protocol.name || "变身"};
    } else if ((tag === "-damage" || tag === "-heal") && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      const target = translatedSpecies(service, parts[2]);
      const targetId = shortIdent(parts[2]);
      if (side) {
        tracker.active[side] = {...tracker.active[side], condition: parts[3]};
      }
      const protocol = protocolSource(parts, service);
      if (protocol.name && protocol.name !== "吸取效果") {
        text = sourceActivationText(protocol, target, `${target} HP: ${service.conditionText(parts[3])}`);
      } else if (protocol.name === "吸取效果") {
        text = `${target} 通过吸取效果回复到 ${service.conditionText(parts[3])}`;
      } else {
        text = tag === "-heal" ? `${target} 回复到 ${service.conditionText(parts[3])}` : `${target} HP: ${service.conditionText(parts[3])}`;
      }
      timelineEvent = {type: tag === "-heal" ? "heal" : "damage", text, targetSide: side || undefined, target, target_id: targetId, effect: protocol.label || protocol.name || undefined, condition: parts[3], hp: parseConditionHp(parts[3]), ...sourceNotice(service, target, protocol, tag === "-heal" ? "恢复了血量。" : "受到了伤害。")};
      if (tag === "-damage" && pendingEffectiveness.length) {
        afterEvents = pendingEffectiveness;
        pendingEffectiveness = [];
      }
    } else if (tag === "-sethp" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      const target = translatedSpecies(service, parts[2]);
      const before = side ? parseConditionHp(tracker.active[side].condition) : null;
      const current = Number(parts[3]);
      const condition = before ? `${current}/${before.max}` : parts[3];
      if (side) tracker.active[side] = {...tracker.active[side], name: shortIdent(parts[2]), condition};
      const eventType = before && current > before.current ? "heal" : "damage";
      text = `${target} HP 变为 ${condition}`;
      timelineEvent = {type: eventType, text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), condition, hp: parseConditionHp(condition)};
    } else if (tag === "-status" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      if (side) tracker.active[side] = {...tracker.active[side], status: parts[3]};
      const target = translatedSpecies(service, parts[2]);
      const status = service.plain("statuses", parts[3]);
      const protocol = protocolSource(parts, service);
      text = protocol.name ? sourceActivationText(protocol, target, `${target} 陷入 ${status}`) : `${target} 陷入 ${status}`;
      timelineEvent = {type: protocol.kind === "item" || protocol.kind === "ability" ? sourceEventType(protocol) : "status", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect: protocol.name || status};
    } else if (tag === "-curestatus" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      if (side) tracker.active[side] = {...tracker.active[side], status: ""};
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 解除 ${service.plain("statuses", parts[3])}`;
      timelineEvent = {type: "status", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect: service.plain("statuses", parts[3])};
    } else if (tag === "-cureteam" && parts[2]) {
      const side = sideFromIdent(parts[2]);
      const target = translatedSpecies(service, parts[2]);
      if (side) tracker.active[side] = {...tracker.active[side], status: ""};
      text = `${target} 治愈了队伍的异常状态。`;
      timelineEvent = {type: "status", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2])};
    } else if (tag === "-start" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      const target = translatedSpecies(service, parts[2]);
      const effect = service.effectName(parts[3]);
      if (toId(parts[3]) === "substitute") {
        if (side) tracker.active[side] = {...tracker.active[side], substitute: true};
        text = `${target} 制造了替身。`;
        timelineEvent = {type: "substitute", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect, substitute: true};
      } else {
        text = `${target} 获得状态：${effect}`;
        timelineEvent = {type: "status", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect};
      }
    } else if (tag === "-end" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      const target = translatedSpecies(service, parts[2]);
      const effect = service.effectName(parts[3]);
      if (toId(parts[3]) === "substitute") {
        if (side) tracker.active[side] = {...tracker.active[side], substitute: false};
        text = `${target} 的替身消失了。`;
        timelineEvent = {type: "substitute", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect, substitute: false};
      } else {
        text = `${target} 的 ${effect} 结束了。`;
        timelineEvent = {type: "status", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect};
      }
    } else if ((tag === "-boost" || tag === "-unboost") && parts[2] && parts[3] && parts[4]) {
      const side = sideFromIdent(parts[2]);
      const amount = Number(parts[4]) * (tag === "-boost" ? 1 : -1);
      addBoostValue(tracker, side, parts[3], amount);
      const target = translatedSpecies(service, parts[2]);
      text = `${target} ${boostText(service, parts[3], String(amount))}`;
      timelineEvent = {type: "boost", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect: parts[3]};
    } else if (tag === "-setboost" && parts[2] && parts[3] && parts[4]) {
      const side = sideFromIdent(parts[2]);
      setBoostValue(tracker, side, parts[3], Number(parts[4]));
      const target = translatedSpecies(service, parts[2]);
      text = `${target} ${service.plain("stats", parts[3])}变为 ${Number(parts[4]) >= 0 ? "+" : ""}${parts[4]}`;
      timelineEvent = {type: "boost", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), effect: parts[3]};
    } else if (tag === "-swapboost" && parts[2] && parts[3]) {
      const sourceSide = sideFromIdent(parts[2]);
      const targetSide = sideFromIdent(parts[3]);
      const stats = (parts[4] || "").split(",").filter(Boolean);
      if (sourceSide && targetSide) {
        for (const stat of stats.length ? stats : Object.keys({...tracker.boosts[sourceSide], ...tracker.boosts[targetSide]})) {
          const sourceValue = tracker.boosts[sourceSide][stat] || 0;
          tracker.boosts[sourceSide][stat] = tracker.boosts[targetSide][stat] || 0;
          tracker.boosts[targetSide][stat] = sourceValue;
        }
      }
      text = `${translatedSpecies(service, parts[2])} 和 ${translatedSpecies(service, parts[3])} 交换了能力变化。`;
      timelineEvent = {type: "boost", text, side: sourceSide || undefined, targetSide: targetSide || undefined};
    } else if (tag === "-invertboost" && parts[2]) {
      const side = sideFromIdent(parts[2]);
      if (side) {
        for (const stat of Object.keys(tracker.boosts[side])) tracker.boosts[side][stat] = -tracker.boosts[side][stat];
      }
      text = `${translatedSpecies(service, parts[2])} 的能力变化反转了。`;
      timelineEvent = {type: "boost", text, targetSide: side || undefined, target: translatedSpecies(service, parts[2]), target_id: shortIdent(parts[2])};
    } else if (tag === "-clearboost" || tag === "-clearallboost") {
      if (tag === "-clearallboost") tracker.boosts = {p1: {}, p2: {}};
      else clearBoostValue(tracker, sideFromIdent(parts[2] || ""));
      text = tag === "-clearallboost" ? "双方能力变化被清除了。" : `${translatedSpecies(service, parts[2])} 的能力变化被清除了。`;
      timelineEvent = {type: "boost", text, targetSide: sideFromIdent(parts[2] || "") || undefined};
    } else if (tag === "-clearpositiveboost" && parts[2]) {
      clearBoostValue(tracker, sideFromIdent(parts[2]), true);
      text = `${translatedSpecies(service, parts[2])} 的正向能力变化被清除了。`;
      timelineEvent = {type: "boost", text, targetSide: sideFromIdent(parts[2]) || undefined};
    } else if (tag === "-clearnegativeboost" && parts[2]) {
      clearBoostValue(tracker, sideFromIdent(parts[2]), false);
      text = `${translatedSpecies(service, parts[2])} 的负向能力变化被清除了。`;
      timelineEvent = {type: "boost", text, targetSide: sideFromIdent(parts[2]) || undefined};
    } else if (tag === "-copyboost" && parts[2] && parts[3]) {
      const sourceSide = sideFromIdent(parts[2]);
      const targetSide = sideFromIdent(parts[3]);
      if (sourceSide && targetSide) tracker.boosts[targetSide] = {...tracker.boosts[sourceSide]};
      text = `${translatedSpecies(service, parts[3])} 复制了 ${translatedSpecies(service, parts[2])} 的能力变化。`;
      timelineEvent = {type: "boost", text, side: sourceSide || undefined, targetSide: targetSide || undefined};
    } else if (tag === "-supereffective") {
      text = "效果拔群！";
      timelineEvent = {type: "effectiveness", text, targetSide: sideFromIdent(parts[2] || "") || undefined};
      pendingEffectiveness.push({text, event: timelineEvent});
      continue;
    } else if (tag === "-resisted") {
      text = "效果不理想。";
      timelineEvent = {type: "effectiveness", text, targetSide: sideFromIdent(parts[2] || "") || undefined};
      pendingEffectiveness.push({text, event: timelineEvent});
      continue;
    } else if (tag === "-immune" && parts[2]) {
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 没有效果。`;
      timelineEvent = {type: "effectiveness", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2])};
    } else if (tag === "-miss" && parts[2]) {
      const source = translatedSpecies(service, parts[2]);
      const target = parts[3] ? translatedSpecies(service, parts[3]) : "";
      text = target ? `${source} 的攻击没有命中 ${target}。` : `${source} 的攻击没有命中。`;
      timelineEvent = {type: "miss", text, side: sideFromIdent(parts[2]) || undefined, targetSide: sideFromIdent(parts[3] || parts[2]) || undefined, source, source_id: shortIdent(parts[2]), target, target_id: parts[3] ? shortIdent(parts[3]) : undefined};
    } else if (tag === "-fail" && parts[2]) {
      const target = translatedSpecies(service, parts[2]);
      const action = parts[3] ? service.effectName(parts[3]) : "行动";
      text = `${target} 的 ${action} 失败了。`;
      timelineEvent = {type: "message", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: action};
    } else if (tag === "-block" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const effect = service.effectName(parts[3]);
      const move = parts[4] ? service.plain("moves", parts[4]) : "";
      text = move ? `${target} 被 ${effect} 保护，挡下了 ${move}。` : `${target} 被 ${effect} 保护。`;
      timelineEvent = {type: "message", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect};
    } else if (tag === "-notarget") {
      const target = parts[2] ? translatedSpecies(service, parts[2]) : "";
      text = target ? `${target} 不在场，招式失败了。` : "没有目标，招式失败了。";
      timelineEvent = {type: "miss", text, targetSide: sideFromIdent(parts[2] || "") || undefined, target, target_id: shortIdent(parts[2] || "")};
    } else if (tag === "-crit") {
      text = "会心一击！";
      timelineEvent = {type: "crit", text, targetSide: sideFromIdent(parts[2] || "") || undefined};
    }
    else if (tag === "faint" && parts[2]) {
      const side = sideFromIdent(parts[2]);
      if (side) tracker.active[side] = {...tracker.active[side], condition: "0 濒死", substitute: false};
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 倒下了。`;
      timelineEvent = {type: "faint", text, targetSide: side || undefined, target, target_id: shortIdent(parts[2]), condition: "0 fnt", hp: {current: 0, max: 1, text: "0/0"}};
    } else if (tag === "-weather" && parts[2]) {
      tracker.weather = parts[2] === "none" ? "无" : service.effectName(parts[2]);
      const protocol = protocolSource(parts, service, 3);
      if (hasTag(parts, "[upkeep]")) text = `${tracker.weather}还在持续。`;
      else if (tracker.weather === "无") text = "天气恢复正常。";
      else text = protocol.name ? sourceActivationText(protocol, protocol.ownerName, `天气变为${tracker.weather}。`) : `天气变为：${tracker.weather}`;
      timelineEvent = {type: "weather", text, side: sideFromIdent(protocol.ownerIdent) || undefined, targetSide: sideFromIdent(protocol.ownerIdent) || undefined, source: protocol.ownerName || undefined, source_id: protocol.ownerIdent ? shortIdent(protocol.ownerIdent) : undefined, effect: tracker.weather};
    } else if (tag === "-fieldstart" && parts[2]) {
      const value = service.effectName(parts[2]);
      addUnique(tracker.field, value);
      text = `场地效果开始：${value}`;
      timelineEvent = {type: "field", text, effect: value};
    } else if (tag === "-fieldend" && parts[2]) {
      const value = service.effectName(parts[2]);
      removeValue(tracker.field, value);
      text = `场地效果结束：${value}`;
      timelineEvent = {type: "field", text, effect: value};
    } else if ((tag === "-sidestart" || tag === "-sideend") && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      if (side) {
        const value = service.effectName(parts[3]);
        if (tag === "-sidestart") addUnique(tracker.side_conditions[side], value);
        else removeValue(tracker.side_conditions[side], value);
        text = sideConditionText(side, tag === "-sidestart" ? "start" : "end", value);
        timelineEvent = {type: "field", text, side, targetSide: side, effect: value};
      }
    } else if (tag === "-swapsideconditions") {
      [tracker.side_conditions.p1, tracker.side_conditions.p2] = [tracker.side_conditions.p2, tracker.side_conditions.p1];
      text = "双方场地状态交换了。";
      timelineEvent = {type: "field", text};
    } else if (tag === "-item" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const item = service.plain("items", parts[3].replace("item: ", ""));
      const protocol = protocolSource(parts, service);
      text = protocol.name ? sourceActivationText(protocol, target, `${target} 的道具显现：${item}`) : `${target} 的道具显现：${item}`;
      timelineEvent = {type: "item", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: item, ...itemNotice(service, target, parts[3], item, "道具显现了。")};
    } else if (tag === "-enditem" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const item = service.plain("items", parts[3].replace("item: ", ""));
      const protocol = protocolSource(parts, service);
      const suffix = hasTag(parts, "[eat]") ? `${target} 吃掉了 ${item}。` : `${target} 消耗/失去道具：${item}`;
      text = protocol.name ? sourceActivationText(protocol, target, suffix) : suffix;
      timelineEvent = {type: "item", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: item, ...itemNotice(service, target, parts[3], item, hasTag(parts, "[eat]") ? "吃掉了道具。" : "道具被消耗或失去。")};
    } else if (tag === "-ability" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const ability = service.plain("abilities", parts[3].replace("ability: ", ""));
      const abilityDescription = service.abilityDescription(parts[3]);
      const source = eventSource(parts, parts[2], service);
      text = appendDescription(source ? `${target} 的特性变为 ${ability}（${source}）。` : `${target} 的特性${ability}发动。`, abilityDescription);
      timelineEvent = {type: "ability", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: ability, ...abilityNotice(service, target, parts[3], ability)};
    } else if (tag === "-endability" && parts[2]) {
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 的特性被抑制了。`;
      timelineEvent = {type: "ability", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2])};
    } else if (tag === "-activate" && parts[2] && parts[3]) {
      const hasPokemonTarget = Boolean(sideFromIdent(parts[2]));
      const targetIdent = hasPokemonTarget ? parts[2] : effectTarget(parts, 3);
      const target = targetIdent ? translatedSpecies(service, targetIdent) : "";
      const rawEffect = hasPokemonTarget ? parts[3] : parts[2];
      const effect = service.effectName(rawEffect);
      const protocol = sourceLabel(rawEffect, service);
      const fullSource: ProtocolSource = {...protocol, ownerIdent: targetIdent, ownerName: target};
      text = target ? sourceActivationText(fullSource, target, "") || `${target} 触发效果：${effect}` : `触发效果：${effect}`;
      if (protocol.kind === "ability") text = appendDescription(text, service.abilityDescription(rawEffect));
      timelineEvent = {type: sourceEventType(fullSource), text, targetSide: sideFromIdent(targetIdent) || undefined, target, target_id: targetIdent ? shortIdent(targetIdent) : undefined, effect, ...sourceNotice(service, target, fullSource)};
    } else if (tag === "-mega" && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      const target = translatedSpecies(service, parts[2]);
      const nextDisplay = activeDisplay(service, parts[3]);
      const item = service.plain("items", parts[4] || "");
      if (side && nextDisplay.species_id.includes("mega")) setActiveDisplay(tracker, service, side, parts[3], tracker.active[side]?.condition);
      const active = side ? tracker.active[side] : undefined;
      text = `${target} 用 ${item} 进行了超级进化！`;
      timelineEvent = {type: "form", text, targetSide: side || undefined, target: active?.display_name || nextDisplay.name_zh, target_id: active?.name || nextDisplay.name, target_species_id: active?.species_id || nextDisplay.species_id, sprite: active?.sprite || nextDisplay.sprite, effect: item || "超级进化"};
    } else if (tag === "-primal" && parts[2]) {
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 进行了原始回归！`;
      timelineEvent = {type: "ability", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2])};
    } else if (tag === "-burst" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const species = service.plain("species", parts[3]);
      const item = parts[4] ? service.plain("items", parts[4]) : "";
      text = `${target} ${item ? `借助 ${item} ` : ""}究极爆发为 ${species}！`;
      timelineEvent = {type: "item", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: item || species};
    } else if (tag === "-zpower" && parts[2]) {
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 被 Z 力量包围！`;
      timelineEvent = {type: "item", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: "Z招式"};
    } else if (tag === "-zbroken" && parts[2]) {
      const target = translatedSpecies(service, parts[2]);
      text = `Z 招式突破了 ${target} 的守护！`;
      timelineEvent = {type: "message", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: "Z招式"};
    } else if (tag === "-prepare" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const move = service.plain("moves", parts[3]);
      text = parts[4] ? `${target} 准备对 ${translatedSpecies(service, parts[4])} 使用 ${move}。` : `${target} 准备使用 ${move}。`;
      timelineEvent = {type: "move", text, side: sideFromIdent(parts[2]) || undefined, source: target, source_id: shortIdent(parts[2]), target: parts[4] ? translatedSpecies(service, parts[4]) : undefined, move};
    } else if (tag === "-mustrecharge" && parts[2]) {
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 正在充电，无法行动。`;
      timelineEvent = {type: "message", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2])};
    } else if (tag === "-nothing") {
      text = "什么也没有发生。";
      timelineEvent = {type: "message", text};
    } else if (tag === "-hitcount" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      text = `${target} 被击中 ${parts[3]} 次。`;
      timelineEvent = {type: "message", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2])};
    } else if ((tag === "-singlemove" || tag === "-singleturn") && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const effect = service.effectName(parts[3]);
      text = `${target} 准备了 ${effect}。`;
      timelineEvent = {type: "status", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect};
    } else if (tag === "-message" && parts[2]) {
      text = parts.slice(2).join(" ");
      timelineEvent = {type: "message", text};
    } else if (tag === "-hint" && parts[2]) {
      text = `提示：${parts.slice(2).join(" ")}`;
      timelineEvent = {type: "message", text};
    } else if (tag === "win" && parts[2]) {
      text = `胜者：${parts[2] === "Player" ? "玩家" : parts[2] === "Enemy" ? "对手" : parts[2]}`;
      timelineEvent = {type: "win", text, side: parts[2] === "Player" ? "p1" : parts[2] === "Enemy" ? "p2" : undefined};
    } else if (tag === "tie") {
      text = "平局。";
      timelineEvent = {type: "win", text};
    } else if (!isIgnoredProtocolTag(tag)) {
      text = `Showdown事件：${line}`;
      timelineEvent = {type: "debug", text};
    }

    if (text !== null) {
      events.push(text);
      if (timelineEvent) timeline.push(timelineEvent);
    }
    for (const delayed of afterEvents) {
      events.push(delayed.text);
      timeline.push(delayed.event);
    }
  }
  for (const delayed of pendingEffectiveness) {
    events.push(delayed.text);
    timeline.push(delayed.event);
  }
  return {events, timeline};
}
