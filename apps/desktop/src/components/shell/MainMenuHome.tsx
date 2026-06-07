import {useEffect, useMemo, useState} from "react";
import type {DesktopDexEntry, LocalSave, ShopItem} from "@changebattle/shared";
import {AnimatePresence, Reorder, motion, type Variants} from "motion/react";
import {ItemIcon, assetUrl} from "../../lib/ui";
import {QuickDexModal, type QuickDexCategory} from "../dex/QuickDexModal";

type HomeDexCard = {
  id: string;
  label: string;
  eyebrow: string;
  category: QuickDexCategory;
  entry: DesktopDexEntry;
  icon?: string;
  shopItem?: ShopItem;
};

type QuickDexSeed = {
  category: QuickDexCategory;
  entry: DesktopDexEntry;
  query: string;
};

const homePanelVariants: Variants = {
  hidden: (index: number) => ({opacity: 0, x: index === 0 ? -28 : 0, y: index === 0 ? 0 : 22}),
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      delay: 0.18 + index * 0.1,
      type: "spring",
      stiffness: 300,
      damping: 30,
      staggerChildren: 0.045,
      delayChildren: 0.1,
    },
  }),
  leaving: (index: number) => ({
    opacity: 0,
    x: index === 0 ? -34 : 0,
    y: index === 0 ? 0 : 28,
    transition: {duration: 0.24, ease: "easeInOut"},
  }),
};

const homeCardVariants: Variants = {
  hidden: {opacity: 0, y: 10, scale: 0.94},
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {type: "spring", stiffness: 360, damping: 24},
  },
  leaving: {opacity: 0, y: 8, scale: 0.96, transition: {duration: 0.18, ease: "easeInOut"}},
};

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

function dexSpriteUrl(entry: DesktopDexEntry): string {
  const path = String(entry.sprite?.paths.front_normal || entry.sprite?.paths.front_normal_full || "");
  return path ? assetUrl(path) || "" : "";
}

function shopItemToDexEntry(item: ShopItem): DesktopDexEntry {
  return {
    id: item.id,
    name: item.name,
    name_zh: item.name_zh,
    category: "items",
    desc: item.desc,
    desc_zh: item.desc_zh,
  };
}

async function searchOne(category: QuickDexCategory, query: string, offset = 0): Promise<DesktopDexEntry | null> {
  const result = await window.changeBattle!.dexSearch(category, query, offset, 1);
  return result.entries[0] || null;
}

async function searchStable(category: QuickDexCategory, query: string, seed: string): Promise<DesktopDexEntry | null> {
  const first = await window.changeBattle!.dexSearch(category, query, 0, 1);
  const offset = first.total > 1 ? stableNumber(seed) % first.total : 0;
  const result = await window.changeBattle!.dexSearch(category, query, offset, 1);
  return result.entries[0] || first.entries[0] || null;
}

export function MainMenuHome({save, leaving = false}: {save: LocalSave | null; leaving?: boolean}) {
  const [favorites, setFavorites] = useState<HomeDexCard[]>([]);
  const [discoveries, setDiscoveries] = useState<HomeDexCard[]>([]);
  const [quickDex, setQuickDex] = useState<QuickDexSeed | null>(null);
  const [pageRandomSeed] = useState(() => Math.random().toString(36).slice(2));
  const seed = useMemo(() => save?.trainer.player_npc_id || save?.trainer.name || "changebattle", [save]);

  useEffect(() => {
    let cancelled = false;
    async function loadFavorites() {
      const remembered = (save?.run_memory?.player_species_ids || []).slice(0, 3);
      const entries: DesktopDexEntry[] = [];
      for (const speciesId of remembered) {
        const found = await searchOne("pokemon", speciesId);
        if (found && !entries.some(entry => entry.id === found.id)) entries.push(found);
      }
      let fallbackOffset = stableNumber(`${seed}:favorite`);
      while (entries.length < 3) {
        const found = await searchOne("pokemon", "", fallbackOffset % 151);
        fallbackOffset += 17;
        if (!found || entries.some(entry => entry.id === found.id)) break;
        entries.push(found);
      }
      if (cancelled) return;
      setFavorites(entries.map((entry, index) => ({
        id: `favorite-${entry.id}`,
        label: entry.name_zh || entry.name,
        eyebrow: index === 0 ? "最常用" : `常用 ${index + 1}`,
        category: "pokemon",
        entry,
        icon: dexSpriteUrl(entry),
      })));
    }
    void loadFavorites().catch(() => {
      if (!cancelled) setFavorites([]);
    });
    return () => {
      cancelled = true;
    };
  }, [save, seed]);

  useEffect(() => {
    let cancelled = false;
    async function loadDiscoveries() {
      const randomSeed = `${seed}:page-${pageRandomSeed}`;
      const [shopItems, berries, pokemon, tmMove, ability, move] = await Promise.all([
        window.changeBattle!.shopItems(""),
        window.changeBattle!.shopItems("berry"),
        searchStable("pokemon", "", `${randomSeed}:random-pokemon`),
        searchStable("moves", "", `${randomSeed}:random-tm`),
        searchStable("abilities", "", `${randomSeed}:random-ability`),
        searchStable("moves", "", `${randomSeed}:random-move`),
      ]);
      const item = shopItems[stableNumber(`${randomSeed}:item`) % Math.max(1, shopItems.length)];
      const berry = berries[stableNumber(`${randomSeed}:berry`) % Math.max(1, berries.length)];
      const cards: HomeDexCard[] = [];
      if (item) cards.push({id: `item-${item.id}`, label: item.name_zh || item.name, eyebrow: DISCOVERY_LABELS.item, category: "items", entry: shopItemToDexEntry(item), shopItem: item});
      if (pokemon) cards.push({id: `pokemon-${pokemon.id}`, label: pokemon.name_zh || pokemon.name, eyebrow: DISCOVERY_LABELS.pokemon, category: "pokemon", entry: pokemon, icon: dexSpriteUrl(pokemon)});
      if (tmMove) cards.push({id: `tm-${tmMove.id}`, label: tmMove.name_zh || tmMove.name, eyebrow: DISCOVERY_LABELS.tm, category: "moves", entry: tmMove});
      if (berry) cards.push({id: `berry-${berry.id}`, label: berry.name_zh || berry.name, eyebrow: DISCOVERY_LABELS.berry, category: "items", entry: shopItemToDexEntry(berry), shopItem: berry});
      if (ability) cards.push({id: `ability-${ability.id}`, label: ability.name_zh || ability.name, eyebrow: DISCOVERY_LABELS.ability, category: "abilities", entry: ability});
      if (move) cards.push({id: `move-${move.id}`, label: move.name_zh || move.name, eyebrow: DISCOVERY_LABELS.move, category: "moves", entry: move});
      if (!cancelled) setDiscoveries(cards.slice(0, 4));
    }
    void loadDiscoveries().catch(() => {
      if (!cancelled) setDiscoveries([]);
    });
    return () => {
      cancelled = true;
    };
  }, [pageRandomSeed, seed]);

  function openCard(card: HomeDexCard) {
    setQuickDex({category: card.category, entry: card.entry, query: card.entry.id});
  }

  return (
    <>
      <motion.section className="main-favorites-panel" aria-label="常用宝可梦" custom={0} initial="hidden" animate={leaving ? "leaving" : "visible"} variants={homePanelVariants}>
        <header>
          <strong>常用宝可梦</strong>
          <span>{favorites.length}/3</span>
        </header>
        <div className="main-favorite-list">
          {favorites.map((card, index) => (
            <motion.button
              className="main-favorite-card"
              onClick={() => openCard(card)}
              variants={homeCardVariants}
              whileHover={{scale: 1.07, y: -4, rotate: index % 2 === 0 ? -1.8 : 1.8}}
              whileTap={{scale: 0.98}}
              transition={{type: "spring", stiffness: 470, damping: 12}}
              key={card.id}
            >
              <span>{card.icon ? <img src={card.icon} alt={card.label} /> : "?"}</span>
              <small>{card.eyebrow}</small>
              <strong>{card.label}</strong>
            </motion.button>
          ))}
          {!favorites.length ? <p>完成一局后记录队伍。</p> : null}
        </div>
      </motion.section>
      <motion.section className="main-discovery-panel" aria-label="快捷发现" custom={1} initial="hidden" animate={leaving ? "leaving" : "visible"} variants={homePanelVariants}>
        <header>
          <strong>随便看看</strong>
          <span>进场随机</span>
        </header>
        <Reorder.Group className="main-discovery-list" axis="y" values={discoveries} onReorder={setDiscoveries}>
          <AnimatePresence initial={false}>
            {discoveries.map(card => (
              <Reorder.Item className="main-discovery-card" value={card} onClick={() => openCard(card)} variants={homeCardVariants} initial="hidden" animate="visible" exit="leaving" whileHover={{y: -3, scale: 1.025}} whileTap={{scale: 0.98}} key={card.id}>
                <span className="main-discovery-icon">
                  {card.shopItem ? <ItemIcon item={card.shopItem} /> : card.icon ? <img src={card.icon} alt={card.label} /> : card.category === "moves" ? "TM" : "?"}
                </span>
                <small>{card.eyebrow}</small>
                <strong>{card.label}</strong>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </motion.section>
      {quickDex ? <QuickDexModal initialCategory={quickDex.category} initialEntry={quickDex.entry} initialQuery={quickDex.query} onClose={() => setQuickDex(null)} /> : null}
    </>
  );
}
