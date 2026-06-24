import {useMemo} from "react";
import {
  createShowdownDexService,
  type DexAbilityDetail,
  type DexCategory,
  type DexItemDetail,
  type DexMoveDetail,
  type DexPokemonDetail,
  type DexSearchRow,
  type ShowdownDexService,
  type ShowdownDexLike,
} from "@changebattle-v2/showdown-dex-core";

export type UseDexHookOptions = {
  dex?: ShowdownDexLike;
  resourcePrefix?: string;
  translate?: (table: string, value: string) => string;
};

export type DexInfoBase<TDetail> = {
  id: string;
  name: string;
  nameZH: string;
  description?: string;
  detail: TDetail;
};

export type PokemonInfo = DexInfoBase<DexPokemonDetail> & {
  types: string[];
  num: number;
  iconStyle?: string;
  frontUrl?: string;
};

export type MoveInfo = DexInfoBase<DexMoveDetail> & {
  type: string;
  typeId?: string;
  category: string;
  categoryId?: string;
  power: number;
  accuracy: number | null;
  pp: number;
};

export type AbilityInfo = DexInfoBase<DexAbilityDetail> & {
  holderCount: number;
};

export type ItemInfo = DexInfoBase<DexItemDetail> & {
  kind: string;
  kindLabel: string;
  iconStyle?: string;
};

export function useDexHook(options: UseDexHookOptions = {}) {
  const dex = useMemo(() => createShowdownDexService(options), [options.dex, options.resourcePrefix, options.translate]);

  return useMemo(() => ({
    dex,
    searchDex: dex.searchDex,
    getPokemonInfo(name: string): PokemonInfo | null {
      const id = resolveDexId(dex, name, "pokemon");
      let detail: DexPokemonDetail;
      try {
        detail = dex.getPokemonDetail(id);
      } catch {
        return null;
      }
      if (!detail) return null;
      return {
        id: detail.id,
        name: detail.name,
        nameZH: detail.nameZh,
        types: detail.types,
        num: detail.num,
        iconStyle: detail.sprites.iconStyle,
        frontUrl: detail.sprites.animatedFrontUrl || detail.sprites.frontUrl,
        detail,
      };
    },
    getMoveInfo(name: string): MoveInfo | null {
      const id = resolveDexId(dex, name, "moves");
      let detail: DexMoveDetail;
      try {
        detail = dex.getMoveDetail(id);
      } catch {
        return null;
      }
      if (!detail) return null;
      return {
        id: detail.id,
        name: detail.name,
        nameZH: detail.nameZh,
        description: detail.description,
        type: detail.type,
        typeId: detail.typeId,
        category: detail.category,
        categoryId: detail.categoryId,
        power: detail.power,
        accuracy: detail.accuracy,
        pp: detail.pp,
        detail,
      };
    },
    getAbilityInfo(name: string): AbilityInfo | null {
      const id = resolveDexId(dex, name, "abilities");
      let detail: DexAbilityDetail;
      try {
        detail = dex.getAbilityDetail(id);
      } catch {
        return null;
      }
      if (!detail) return null;
      return {
        id: detail.id,
        name: detail.name,
        nameZH: detail.nameZh,
        description: detail.description,
        holderCount: detail.holders.length,
        detail,
      };
    },
    getItemInfo(name: string): ItemInfo | null {
      const id = resolveDexId(dex, name, "items");
      let detail: DexItemDetail;
      try {
        detail = dex.getItemDetail(id);
      } catch {
        return null;
      }
      if (!detail) return null;
      return {
        id: detail.id,
        name: detail.name,
        nameZH: detail.nameZh,
        description: detail.description,
        kind: detail.kind,
        kindLabel: detail.kindLabel,
        iconStyle: detail.iconStyle,
        detail,
      };
    },
  }), [dex]);
}

function resolveDexId(
  service: ShowdownDexService,
  name: string,
  category: Extract<DexCategory, "pokemon" | "moves" | "abilities" | "items">,
): string {
  const row = findDexRow(service.searchDex({category, query: name, limit: 10}).rows, name);
  return row?.id || name;
}

function findDexRow(rows: DexSearchRow[], name: string): DexSearchRow | undefined {
  const needle = normalize(name);
  return rows.find(row => [row.id, row.name, row.nameZh].some(value => normalize(value) === needle)) || rows[0];
}

function normalize(value: string): string {
  return String(value || "").trim().toLowerCase();
}
