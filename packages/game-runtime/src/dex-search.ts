import type {BossDexPoolRow, BossDexRecord, DesktopDexEntry, DesktopDexSearchResult, LocalSave, PokemonSet, RentalPokemon, TrainerNpcType, TrainerNpcView} from "@changebattle/shared";

export type TrainerDexSearchOptions = {
  save: LocalSave | null;
  npcCatalog: TrainerNpcView[];
  query?: string;
  offset?: number;
  limit?: number;
  includeNormal?: boolean;
  requireFrontAsset?: boolean;
  bossPoolRowsForDex?(trainer: TrainerNpcView, record: BossDexRecord | undefined): BossDexPoolRow[];
  bossSummary?(record: BossDexRecord | undefined): string;
};

export function trainerDexTypeLabel(type: TrainerNpcType): string {
  if (type === "champion") return "冠军";
  if (type === "elite4") return "四天王";
  if (type === "gym") return "馆主";
  if (type === "villain") return "反派头目";
  return "训练师";
}

export function trainerDexTags(trainer: TrainerNpcView, record: BossDexRecord | undefined): string[] {
  const tags = [trainerDexTypeLabel(trainer.type), ...(record?.event_tags || [])].filter(Boolean);
  return Array.from(new Set(tags));
}

export function bossSummary(record?: BossDexRecord): string {
  if (!record?.encounters) return "尚未遭遇";
  const last = record.last_result === "win" ? "上次胜利" : record.last_result === "loss" ? "上次失败" : "尚未结算";
  return `交手 ${record.completed || 0} 次　胜 ${record.wins || 0} / 负 ${record.losses || 0}　${last}`;
}

export function trainerDexSearch(options: TrainerDexSearchOptions): DesktopDexSearchResult {
  const normalizedOffset = Math.max(0, Math.floor(Number(options.offset || 0)));
  const cappedLimit = Math.max(1, Math.min(120, Math.floor(Number(options.limit || 8))));
  const query = String(options.query || "");
  const typeMatch = query.match(/\btype:(normal|gym|elite4|champion|villain)\b/i);
  const typeFilter = typeMatch?.[1] as TrainerNpcType | undefined;
  const eventMatch = query.match(/\bevent:(special|villain_intrusion|rainbow_rocket)\b/i);
  const eventFilter = eventMatch?.[1]?.toLowerCase();
  const cleanQuery = query.replace(/\btype:(normal|gym|elite4|champion|villain)\b/ig, "").replace(/\bevent:(special|villain_intrusion|rainbow_rocket)\b/ig, "").trim().toLowerCase();
  const cleanId = toId(cleanQuery);
  const bossDex = normalizeBossDex(options.save?.boss_dex);
  const includeNormal = options.includeNormal ?? false;
  const requireFrontAsset = options.requireFrontAsset ?? false;
  const entries: DesktopDexEntry[] = options.npcCatalog
    .filter(trainer => isTrainerDexType(trainer.type, includeNormal))
    .filter(trainer => !requireFrontAsset || Boolean(trainer.front_asset))
    .filter(trainer => !typeFilter || trainer.type === typeFilter)
    .map((trainer, index) => trainerDexEntry(trainer, index, bossDex[trainer.id], options))
    .filter(entry => {
      if (eventFilter) {
        if (!entry.unlocked) return false;
        const eventTags = new Set(entry.boss_record?.event_tags || []);
        if (eventFilter === "special" && !eventTags.has("特殊事件")) return false;
        if (eventFilter === "villain_intrusion" && !eventTags.has("普通乱入")) return false;
        if (eventFilter === "rainbow_rocket" && !eventTags.has("彩虹火箭队")) return false;
      }
      if (!cleanQuery && !cleanId) return true;
      const rawParts = entry.unlocked ? [entry.id, entry.name, entry.name_zh, entry.desc_zh, ...(entry.tags || [])] : [entry.desc_zh, ...(entry.tags || [])];
      const parts = rawParts.filter(Boolean).map(value => String(value).toLowerCase());
      const ids = parts.map(value => toId(value));
      return parts.some(value => value.includes(cleanQuery)) || ids.some(value => value.includes(cleanId));
    })
    .sort((a, b) => {
      const typeOrder = {normal: -1, gym: 0, elite4: 1, champion: 2, villain: 3} as Record<string, number>;
      return (typeOrder[a.trainer?.type || ""] ?? 9) - (typeOrder[b.trainer?.type || ""] ?? 9)
        || String(a.trainer?.region || "").localeCompare(String(b.trainer?.region || ""))
        || a.id.localeCompare(b.id);
    });
  const page = entries.slice(normalizedOffset, normalizedOffset + cappedLimit);
  return {
    category: "trainers",
    query,
    offset: normalizedOffset,
    limit: cappedLimit,
    total: entries.length,
    has_more: normalizedOffset + page.length < entries.length,
    entries: page,
  };
}

export function pokemonUsageKey(pokemon?: Partial<RentalPokemon> | PokemonSet | DesktopDexEntry | null): string {
  if (!pokemon) return "";
  const entry = pokemon as {species_id?: unknown; species?: unknown; name?: unknown; id?: unknown; name_zh?: unknown};
  const value = entry.species_id || entry.species || entry.id || entry.name_zh || entry.name;
  return toId(String(value || ""));
}

export function decorateDexUsageCounts(save: LocalSave | null, result: DesktopDexSearchResult): DesktopDexSearchResult {
  if (result.category !== "pokemon") return result;
  const counts = save?.stats?.pokemon_usage_counts || {};
  return {
    ...result,
    entries: result.entries.map(entry => ({
      ...entry,
      usage_count: Math.max(0, Math.floor(Number(counts[toId(entry.id)] ?? counts[pokemonUsageKey(entry)] ?? 0))),
    })),
  };
}

function trainerDexEntry(trainer: TrainerNpcView, index: number, record: BossDexRecord | undefined, options: TrainerDexSearchOptions): DesktopDexEntry {
  const unlocked = trainer.type === "normal" || Boolean(record?.encounters);
  const typeLabel = trainerDexTypeLabel(trainer.type);
  const tags = unlocked ? trainerDexTags(trainer, record) : [];
  const hiddenName = `${trainer.region || "未知地区"}${typeLabel} #${index + 1}`;
  return {
    id: trainer.id,
    name: unlocked ? (trainer.name_en || trainer.name_zh) : "???",
    name_zh: unlocked ? trainer.name_zh : "？？？",
    category: "trainers",
    desc_zh: unlocked ? `${trainer.region || "未知地区"}${typeLabel}` : hiddenName,
    tags: unlocked
      ? [trainer.id, trainer.name_zh, trainer.name_en || "", trainer.region || "", trainer.role || "", typeLabel, ...(record?.event_tags || []), trainer.notes || ""]
      : [trainer.region || "", typeLabel, hiddenName],
    icon_asset: unlocked ? trainer.avatar_asset || trainer.front_asset : undefined,
    trainer: unlocked ? trainer : {...trainer, name_zh: "？？？", name_en: "???", front_asset: undefined, front_gif_asset: undefined, avatar_asset: undefined},
    unlocked,
    trainer_tags: tags,
    boss_record: record,
    boss_pool_rows: options.bossPoolRowsForDex?.(trainer, record) || [],
    boss_summary: options.bossSummary?.(record) || bossSummary(record),
  };
}

function isTrainerDexType(type: TrainerNpcType, includeNormal: boolean): boolean {
  return type === "gym" || type === "elite4" || type === "champion" || type === "villain" || (includeNormal && type === "normal");
}

function normalizeBossDex(dex?: Record<string, BossDexRecord> | null): Record<string, BossDexRecord> {
  return Object.fromEntries(Object.entries(dex || {}).map(([id, record]) => [id, normalizeBossDexRecord(record)]));
}

function normalizeBossDexRecord(record?: Partial<BossDexRecord> | null): BossDexRecord {
  return {
    encounters: Math.max(0, Number(record?.encounters || 0)),
    completed: Math.max(0, Number(record?.completed || 0)),
    wins: Math.max(0, Number(record?.wins || 0)),
    losses: Math.max(0, Number(record?.losses || 0)),
    event_tags: Array.from(new Set(record?.event_tags || [])),
    last_result: record?.last_result || null,
    first_seen_at: record?.first_seen_at,
    last_seen_at: record?.last_seen_at,
    last_battled_at: record?.last_battled_at,
    seen_pool_slots: Array.from(new Set(record?.seen_pool_slots || [])),
    seen_pokemon: record?.seen_pokemon || {},
  };
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "");
}
