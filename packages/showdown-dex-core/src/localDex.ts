import {Abilities} from "./data/abilities.js";
import {Items} from "./data/items.js";
import {Learnsets} from "./data/learnsets.js";
import {Moves} from "./data/moves.js";
import {Natures} from "./data/natures.js";
import {Pokedex} from "./data/pokedex.js";
import {AbilitiesText} from "./data/text/abilities.js";
import {ItemsText} from "./data/text/items.js";
import {MovesText} from "./data/text/moves.js";
import {PokedexText} from "./data/text/pokedex.js";
import type {ShowdownDexLike} from "./index.js";

type TableEntry = Record<string, unknown> & {
  id?: string;
  name?: string;
  exists?: boolean;
};

function withIdentity<T extends TableEntry>(id: string, entry: T | undefined): T {
  if (!entry) return {id, name: id, exists: false} as T;
  const name = String(entry.name || id);
  const next = {...entry, id, name, exists: entry.exists !== false} as TableEntry;
  if (!next.spriteid && "baseSpecies" in next) next.spriteid = pokemonSpriteId(next);
  return next as T;
}

function mergeText<T extends TableEntry>(data: Record<string, T>, text: Record<string, TableEntry>): Record<string, T> {
  return Object.fromEntries(Object.entries(data).map(([id, entry]) => [id, {...entry, ...(text[id] || {})}])) as Record<string, T>;
}

function tableApi<T extends TableEntry>(table: Record<string, T>) {
  const cache = new Map<string, T>();

  function get(value: string): T {
    const id = toID(value);
    const cached = cache.get(id);
    if (cached) return cached;
    const direct = table[id];
    const byName = direct || Object.entries(table).find(([, entry]) => toID(entry.name) === id)?.[1];
    const next = withIdentity(id, byName);
    cache.set(id, next);
    return next;
  }

  function all(): T[] {
    return Object.entries(table).map(([id, entry]) => withIdentity(id, entry));
  }

  return {get, all};
}

function toID(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function pokemonSpriteId(species: TableEntry): string {
  const id = toID(species.id || species.name);
  const baseId = toID(species.baseSpecies || species.name || id);
  const forme = toID(species.forme || "");
  let spriteId = baseId === id ? baseId : `${baseId}-${forme}`;
  if (spriteId.endsWith("totem")) spriteId = spriteId.slice(0, -5);
  if (spriteId === "greninja-bond") spriteId = "greninja";
  if (spriteId === "rockruff-dusk") spriteId = "rockruff";
  if (spriteId.endsWith("-")) spriteId = spriteId.slice(0, -1);
  return spriteId;
}

export function createLocalShowdownDex(): ShowdownDexLike {
  const species = tableApi(mergeText(Pokedex as Record<string, TableEntry>, PokedexText as Record<string, TableEntry>));
  const moves = tableApi(mergeText(Moves as Record<string, TableEntry>, MovesText as Record<string, TableEntry>));
  const abilities = tableApi(mergeText(Abilities as Record<string, TableEntry>, AbilitiesText as Record<string, TableEntry>));
  const items = tableApi(mergeText(Items as Record<string, TableEntry>, ItemsText as Record<string, TableEntry>));
  const natures = tableApi(Natures as Record<string, TableEntry>);

  return {
    species: {
      get: species.get,
      all: species.all,
      getFullLearnset(id: string) {
        const speciesId = species.get(id).id || toID(id);
        const chain = [];
        let current: TableEntry | undefined = species.get(speciesId);
        const visited = new Set<string>();
        while (current?.id && !visited.has(current.id)) {
          visited.add(current.id);
          const learnset = (Learnsets as Record<string, {learnset?: Record<string, string[]>}>)[current.id]?.learnset;
          if (learnset) chain.push({learnset});
          const prevo: string = current.prevo ? toID(current.prevo) : "";
          current = prevo ? species.get(prevo) : undefined;
        }
        return chain;
      },
    },
    moves,
    abilities,
    items,
    natures,
  };
}
