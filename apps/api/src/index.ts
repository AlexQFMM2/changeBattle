import {createShowdownDexService, type DexSearchRequest, type ShowdownDexLike} from "@changebattle-v2/showdown-dex-core";

export type ChangeBattleV2ApiOptions = {
  dex?: ShowdownDexLike;
  resourcePrefix?: string;
  translate?: (table: string, value: string) => string;
};

export function createChangeBattleV2Api(options: ChangeBattleV2ApiOptions = {}) {
  const dex = createShowdownDexService({
    dex: options.dex,
    resourcePrefix: options.resourcePrefix,
    translate: options.translate,
  });

  return {
    dex,
    searchDex: (request: DexSearchRequest = {}) => dex.searchDex(request),
    getPokemonDetail: (id: string) => dex.getPokemonDetail(id),
    getMoveDetail: (id: string) => dex.getMoveDetail(id),
    getAbilityDetail: (id: string) => dex.getAbilityDetail(id),
    getItemDetail: (id: string) => dex.getItemDetail(id),
  };
}

export type ChangeBattleV2Api = ReturnType<typeof createChangeBattleV2Api>;
export type * from "@changebattle-v2/showdown-dex-core";
