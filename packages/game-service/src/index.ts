import {existsSync} from "node:fs";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import path from "node:path";
import type {
  BattleRequestView,
  BattleState,
  BattleTimelineEvent,
  BattleTracker,
  GeneratedTeam,
  PokemonSet,
  RentalPokemon,
  SpriteIndexMap,
  SpriteMapEntry,
} from "@changebattle/shared";

const require = createRequire(import.meta.url);
const DEFAULT_SHOWDOWN_PATH = "/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown";
const FIXED_LEVEL = 50;
const RENTAL_CANDIDATE_COUNT = 6;
const MAX_GENERATION_ATTEMPTS = 40;
const STAT_IDS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
const SIDE_NAMES = {p1: "玩家", p2: "对手"} as const;

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

export type GameServiceOptions = {
  projectRoot: string;
  showdownPath?: string;
};

export type StartBattleOptions = {
  playerTeam: PokemonSet[];
  enemyTeam: PokemonSet[];
  playerDisplay: RentalPokemon[];
  enemyDisplay: RentalPokemon[];
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

  constructor(options: GameServiceOptions) {
    this.projectRoot = options.projectRoot;
    this.showdownPath = options.showdownPath || process.env.SHOWDOWN_PATH || DEFAULT_SHOWDOWN_PATH;
  }

  async generateRentalCandidates(seed: number | number[] = Date.now(), format = "gen7randombattle"): Promise<GeneratedTeam> {
    const sim = this.loadShowdown();
    const seedArray = this.seedArray(seed);
    await this.loadDisplayData();
    const team: PokemonSet[] = [];
    const display: RentalPokemon[] = [];
    const seenSpecies = new Set<string>();

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS && team.length < RENTAL_CANDIDATE_COUNT; attempt += 1) {
      const attemptSeed = this.bumpSeed(seedArray, attempt);
      const generated = this.normalizeTeam(sim.Teams.generate(format, {seed: attemptSeed}));
      for (const set of generated) {
        if (team.length >= RENTAL_CANDIDATE_COUNT) break;
        const described = this.describeSet(set);
        if (seenSpecies.has(described.species_id)) continue;
        if (!this.hasUsableSprite(described)) continue;
        seenSpecies.add(described.species_id);
        team.push(set);
        display.push(described);
      }
    }

    if (team.length < RENTAL_CANDIDATE_COUNT) {
      throw new Error(`可用图片的租赁候选不足：${team.length}/${RENTAL_CANDIDATE_COUNT}`);
    }

    return {seed: seedArray, team, display, packed: sim.Teams.pack(team)};
  }

  async describeTeam(team: PokemonSet[]): Promise<RentalPokemon[]> {
    await this.loadDisplayData();
    return this.normalizeTeam(team).map(set => this.describeSet(set));
  }

  async getSpriteForSpecies(speciesId: string): Promise<SpriteMapEntry | undefined> {
    const spriteMap = await this.loadSpriteMap();
    return spriteMap.entries[speciesId];
  }

  async createBattleSession(options: StartBattleOptions): Promise<BattleSession> {
    await this.loadDisplayData();
    const session = new BattleSession(this, this.loadShowdown(), options);
    await session.start();
    return session;
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
    return team.map(set => ({...set, level: FIXED_LEVEL, nature: set.nature || "Serious", moves: [...(set.moves || [])]}));
  }

  private describeSet(set: PokemonSet): RentalPokemon {
    const sim = this.loadShowdown();
    const species = sim.Dex.species.get(set.species || set.name);
    const ability = sim.Dex.abilities.get(set.ability);
    const item = set.item ? sim.Dex.items.get(set.item) : null;
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
      level: FIXED_LEVEL,
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
      stats: this.calculatedStats(baseStats, ivs, evs, FIXED_LEVEL, nature),
      evs,
      ivs,
      nature: nature.name,
      nature_zh: this.zh("natures", nature.name),
      nature_plus: nature.plus,
      nature_minus: nature.minus,
      role: set.role || "",
      role_zh: this.zh("roles", set.role || ""),
      sprite,
    };
  }

  private hasUsableSprite(pokemon: RentalPokemon): boolean {
    const spritePath = pokemon.sprite?.paths.front_normal;
    if (!spritePath || pokemon.sprite?.sprite_index === 0) return false;
    return existsSync(path.join(this.projectRoot, spritePath));
  }

  private moveDetails(moveId: string) {
    const move = this.loadShowdown().Dex.moves.get(moveId);
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
  private readonly service: GameService;
  private readonly sim: ShowdownModule;
  private readonly playerTeam: PokemonSet[];
  private readonly enemyTeam: PokemonSet[];
  private readonly playerDisplay: RentalPokemon[];
  private readonly enemyDisplay: RentalPokemon[];
  private readonly seed: number | number[];
  private stream: any = null;
  private pendingMessages: Message[] = [];
  private latestRequests: Record<string, BattleRequestView> = {};
  private ended = false;
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

  private async chooseSide(side: SideId, choice: string): Promise<void> {
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

  private randomChoice(request: BattleRequestView | null | undefined): string {
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
  ownerIdent: string;
  ownerName: string;
};

function sourceLabel(raw: string, service: GameService): Omit<ProtocolSource, "ownerIdent" | "ownerName"> {
  if (raw.startsWith("item: ")) {
    const name = service.plain("items", raw.replace("item: ", ""));
    return {kind: "item", name, label: `道具${name}`};
  }
  if (raw.startsWith("ability: ")) {
    const name = service.plain("abilities", raw.replace("ability: ", ""));
    return {kind: "ability", name, label: `特性${name}`};
  }
  if (raw.startsWith("move: ")) {
    const name = service.plain("moves", raw.replace("move: ", ""));
    return {kind: "move", name, label: `招式${name}`};
  }
  const name = service.effectName(raw);
  return {kind: "effect", name, label: name};
}

function protocolSource(parts: string[], service: GameService, start = 4): ProtocolSource {
  let source: Omit<ProtocolSource, "ownerIdent" | "ownerName"> = {kind: "", name: "", label: ""};
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
      const oldName = translatedSpecies(service, parts[2]);
      const nextDetails = parts[3] || parts[2];
      const nextName = tag === "switch" || tag === "drag" || tag === "replace" ? oldName : service.plain("species", shortIdent(nextDetails));
      const targetId = tag === "switch" || tag === "drag" || tag === "replace" ? shortIdent(parts[2]) : shortIdent(nextDetails);
      const condition = parts[4] || tracker.active[side || "p1"]?.condition || "?";
      if (side) {
        tracker.active[side] = {name: targetId, condition, status: ""};
        if (tag === "switch" || tag === "drag") tracker.boosts[side] = {};
      }
      text = tag === "detailschange" || tag === "-formechange"
        ? `${oldName} ${pokemonActionLabel(tag)}为 ${nextName}。`
        : `${nextName} ${pokemonActionLabel(tag)}。`;
      timelineEvent = {type: "switch", text, side: side || undefined, targetSide: side || undefined, target: nextName, target_id: targetId, condition, hp: parseConditionHp(condition)};
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
      const target = service.plain("species", shortIdent(parts[3]));
      const protocol = protocolSource(parts, service);
      text = protocol.name ? sourceActivationText(protocol, source, `变身为 ${target}。`) : `${source} 变身为 ${target}。`;
      timelineEvent = {type: protocol.name ? sourceEventType(protocol) : "message", text, side: side || undefined, targetSide: side || undefined, source, source_id: shortIdent(parts[2]), target, target_id: shortIdent(parts[3]), effect: protocol.name || "变身"};
    } else if ((tag === "-damage" || tag === "-heal") && parts[2] && parts[3]) {
      const side = sideFromIdent(parts[2]);
      const target = translatedSpecies(service, parts[2]);
      const targetId = shortIdent(parts[2]);
      if (side) {
        tracker.active[side] = {...tracker.active[side], name: shortIdent(parts[2]), condition: parts[3]};
      }
      const protocol = protocolSource(parts, service);
      if (protocol.name && protocol.name !== "吸取效果") {
        text = sourceActivationText(protocol, target, `${target} HP: ${service.conditionText(parts[3])}`);
      } else if (protocol.name === "吸取效果") {
        text = `${target} 通过吸取效果回复到 ${service.conditionText(parts[3])}`;
      } else {
        text = tag === "-heal" ? `${target} 回复到 ${service.conditionText(parts[3])}` : `${target} HP: ${service.conditionText(parts[3])}`;
      }
      timelineEvent = {type: tag === "-heal" ? "heal" : "damage", text, targetSide: side || undefined, target, target_id: targetId, effect: protocol.label || protocol.name || undefined, condition: parts[3], hp: parseConditionHp(parts[3])};
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
      const target = translatedSpecies(service, parts[2]);
      const effect = service.effectName(parts[3]);
      text = `${target} 获得状态：${effect}`;
      timelineEvent = {type: "status", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect};
    } else if (tag === "-end" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const effect = service.effectName(parts[3]);
      text = `${target} 的 ${effect} 结束了。`;
      timelineEvent = {type: "status", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect};
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
      if (side) tracker.active[side] = {...tracker.active[side], condition: "0 濒死"};
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
      timelineEvent = {type: "item", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: item};
    } else if (tag === "-enditem" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const item = service.plain("items", parts[3].replace("item: ", ""));
      const protocol = protocolSource(parts, service);
      const suffix = hasTag(parts, "[eat]") ? `${target} 吃掉了 ${item}。` : `${target} 消耗/失去道具：${item}`;
      text = protocol.name ? sourceActivationText(protocol, target, suffix) : suffix;
      timelineEvent = {type: "item", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: item};
    } else if (tag === "-ability" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const ability = service.plain("abilities", parts[3].replace("ability: ", ""));
      const source = eventSource(parts, parts[2], service);
      text = source ? `${target} 的特性变为 ${ability}（${source}）。` : `${target} 的特性${ability}发动。`;
      timelineEvent = {type: "ability", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: ability};
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
      timelineEvent = {type: sourceEventType(fullSource), text, targetSide: sideFromIdent(targetIdent) || undefined, target, target_id: targetIdent ? shortIdent(targetIdent) : undefined, effect};
    } else if (tag === "-mega" && parts[2] && parts[3]) {
      const target = translatedSpecies(service, parts[2]);
      const item = service.plain("items", parts[3]);
      text = `${target} 用 ${item} 进行了超级进化！`;
      timelineEvent = {type: "item", text, targetSide: sideFromIdent(parts[2]) || undefined, target, target_id: shortIdent(parts[2]), effect: item};
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
