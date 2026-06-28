import {useEffect, useMemo, useState} from "react";
import type {ChangeBattleV2Api, DexCategory, DexSearchRow, TrainingRunGameV4, UserProfileV2} from "@changebattle-v2/api";
import {DiscoveryPanel} from "./DiscoveryPanel";
import {FavoritePokemonPanel} from "./FavoritePokemonPanel";
import type {MainMenuDexCard, MainMenuQuickDexSeed, MainMenuShopItem, QuickDexCategory} from "./mainMenuTypes";

const DISCOVERY_LABELS: Record<string, string> = {
  item: "随机道具",
  pokemon: "随机宝可梦",
  tm: "技能机器",
  berry: "树果",
  ability: "随机特性",
  move: "随机技能",
};

function stableNumber(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function dexSpriteUrl(entry: DexSearchRow): string {
  return entry.sprite?.frontUrl || entry.sprite?.fallbackFrontUrl || entry.sprite?.iconUrl || "";
}

function searchOne(api: ChangeBattleV2Api, category: QuickDexCategory, query: string, offset = 0): DexSearchRow | null {
  const result = api.searchDex({category, query, offset, limit: 1});
  return result.rows[0] || null;
}

function searchStable(api: ChangeBattleV2Api, category: QuickDexCategory, query: string, seed: string): DexSearchRow | null {
  const first = api.searchDex({category, query, offset: 0, limit: 1});
  const offset = first.total > 1 ? stableNumber(seed) % first.total : 0;
  const result = api.searchDex({category, query, offset, limit: 1});
  return result.rows[0] || first.rows[0] || null;
}

export function MainMenuHome({api, profile, run, leaving = false, onOpenDexCard}: {
  api: ChangeBattleV2Api;
  profile: UserProfileV2;
  run: TrainingRunGameV4 | null;
  leaving?: boolean;
  onOpenDexCard: (seed: MainMenuQuickDexSeed) => void;
}) {
  const [favorites, setFavorites] = useState<MainMenuDexCard[]>([]);
  const [discoveries, setDiscoveries] = useState<MainMenuDexCard[]>([]);
  const [pageRandomSeed] = useState(() => Math.random().toString(36).slice(2));
  const seed = useMemo(() => profile.id || profile.name || "changebattle-v2", [profile.id, profile.name]);

  useEffect(() => {
    let cancelled = false;
    function loadFavorites() {
      const remembered = p1SpeciesIds(run).slice(0, 3);
      const entries: DexSearchRow[] = [];
      for (const speciesId of remembered) {
        const found = searchOne(api, "pokemon", speciesId);
        if (found && !entries.some(entry => entry.id === found.id)) entries.push(found);
      }
      let fallbackOffset = stableNumber(`${seed}:favorite`);
      while (entries.length < 3) {
        const found = searchOne(api, "pokemon", "", fallbackOffset % 151);
        fallbackOffset += 17;
        if (!found || entries.some(entry => entry.id === found.id)) break;
        entries.push(found);
      }
      if (cancelled) return;
      setFavorites(entries.map((entry, index) => ({
        id: `favorite-${entry.id}`,
        label: entry.nameZh || entry.name,
        eyebrow: index === 0 ? "最常用" : `常用 ${index + 1}`,
        category: "pokemon",
        entry,
        icon: dexSpriteUrl(entry),
      })));
    }
    try {
      loadFavorites();
    } catch {
      if (!cancelled) setFavorites([]);
    }
    return () => {
      cancelled = true;
    };
  }, [api, run, seed]);

  useEffect(() => {
    let cancelled = false;
    function loadDiscoveries() {
      const randomSeed = `${seed}:page-${pageRandomSeed}`;
      const item = searchStable(api, "items", "", `${randomSeed}:item`);
      const berry = searchStable(api, "items", "berry 树果", `${randomSeed}:berry`);
      const pokemon = searchStable(api, "pokemon", "", `${randomSeed}:random-pokemon`);
      const tmMove = searchStable(api, "moves", "", `${randomSeed}:random-tm`);
      const ability = searchStable(api, "abilities", "", `${randomSeed}:random-ability`);
      const move = searchStable(api, "moves", "", `${randomSeed}:random-move`);
      const cards: MainMenuDexCard[] = [];
      if (item) cards.push(rowToDiscoveryCard(item, "item", "items"));
      if (pokemon) cards.push(rowToDiscoveryCard(pokemon, "pokemon", "pokemon"));
      if (tmMove) cards.push(rowToDiscoveryCard(tmMove, "tm", "moves"));
      if (berry) cards.push(rowToDiscoveryCard(berry, "berry", "items"));
      if (ability) cards.push(rowToDiscoveryCard(ability, "ability", "abilities"));
      if (move) cards.push(rowToDiscoveryCard(move, "move", "moves"));
      if (!cancelled) setDiscoveries(cards.slice(0, 4));
    }
    try {
      loadDiscoveries();
    } catch {
      if (!cancelled) setDiscoveries([]);
    }
    return () => {
      cancelled = true;
    };
  }, [api, pageRandomSeed, seed]);

  function openCard(card: MainMenuDexCard) {
    onOpenDexCard({category: card.category, entry: card.entry, query: card.entry.id});
  }

  return (
    <>
      <FavoritePokemonPanel cards={favorites} leaving={leaving} onOpenCard={openCard} />
      <DiscoveryPanel cards={discoveries} leaving={leaving} onCardsChange={setDiscoveries} onOpenCard={openCard} />
    </>
  );
}

function p1SpeciesIds(run: TrainingRunGameV4 | null): string[] {
  const p1 = run?.players.p1 || run?.scenario.players.find(player => player.playerId === "p1");
  const ids = p1?.localTeam.pokemon.map(pokemon => pokemon.speciesId).filter(Boolean) || [];
  return Array.from(new Set(ids));
}

function rowToDiscoveryCard(row: DexSearchRow, labelKey: keyof typeof DISCOVERY_LABELS, category: QuickDexCategory): MainMenuDexCard {
  const shopItem = category === "items" ? rowToShopItem(row) : undefined;
  return {
    id: `${labelKey}-${row.id}`,
    label: row.nameZh || row.name,
    eyebrow: DISCOVERY_LABELS[labelKey],
    category,
    entry: category === row.category ? row : {...row, category: category as DexCategory},
    icon: category === "pokemon" ? dexSpriteUrl(row) : undefined,
    shopItem,
  };
}

function rowToShopItem(row: DexSearchRow): MainMenuShopItem {
  return {
    id: row.id,
    name: row.name,
    name_zh: row.nameZh,
    iconUrl: row.iconUrl,
    iconStyle: row.iconStyle,
  };
}
