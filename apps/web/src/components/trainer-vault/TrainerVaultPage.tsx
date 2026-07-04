import {useEffect, useMemo, useState} from "react";
import type {ChangeBattleV2Api, PlayerItemInstanceV4, PlayerItemRecordV4, PlayerPokemonRecordV4, PlayerVaultV4} from "@changebattle-v2/api";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {PlayerBagItemIcon} from "../training/PlayerBagPanel";
import {assetUrl} from "../../lib/assetUrl";
import {pokemonSpriteUrl} from "../../lib/showdownPokemonSpriteAdapter";
import "./TrainerVaultPage.css";

type TrainerVaultTab = "bag" | "pokemon";
type VaultPageKind = "prep" | "normal-a" | "normal-b";
type VaultPageEntry =
  | {kind: "item"; key: string; item: PlayerItemRecordV4; pageKind: VaultPageKind}
  | {kind: "pokemon"; key: string; pokemon: PlayerPokemonRecordV4; pageKind: VaultPageKind}
  | {kind: "empty"; key: string; pageKind: VaultPageKind; slotIndex: number};
type SelectableVaultPageEntry = Exclude<VaultPageEntry, {kind: "empty"}>;

const VAULT_PAGE_KINDS: VaultPageKind[] = ["prep", "normal-a", "normal-b"];
const GRID_SLOT_COUNT = 24;

export function TrainerVaultPage({api, playerVault, tab, onTabChange, onBack}: {
  api: ChangeBattleV2Api;
  playerVault: PlayerVaultV4;
  tab: TrainerVaultTab;
  onTabChange: (tab: TrainerVaultTab) => void;
  onBack: () => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState("");
  const pageKind = VAULT_PAGE_KINDS[pageIndex] || "prep";
  const pageEntries = useMemo(() => buildPageEntries(playerVault, tab, pageKind), [playerVault, tab, pageKind]);
  const selectableEntries = pageEntries.filter(isSelectableEntry);
  const selectedEntry = selectableEntries.find(entry => entry.key === selectedKey) || selectableEntries[0] || null;

  useEffect(() => {
    setPageIndex(0);
    setSelectedKey("");
  }, [tab]);

  useEffect(() => {
    if (!selectableEntries.length) {
      setSelectedKey("");
      return;
    }
    if (!selectableEntries.some(entry => entry.key === selectedKey)) setSelectedKey(selectableEntries[0]!.key);
  }, [selectableEntries.map(entry => entry.key).join("|"), selectedKey]);

  const title = tab === "bag" ? "我的背包" : "我的宝可梦";
  const pageLabel = vaultPageLabel(tab, pageKind);

  return (
    <section className="trainer-vault-page" aria-label="训练家仓库">
      <video className="trainer-vault-video-bg" autoPlay muted loop playsInline controls={false} aria-hidden="true">
        <source src={assetUrl("title/pokemon-room-bg.mp4")} type="video/mp4" />
      </video>
      <div className="trainer-vault-backdrop" aria-hidden="true" />
      <header className="trainer-vault-header">
        <div>
          <span>训练家仓库</span>
          <strong>{title}</strong>
        </div>
        <button type="button" onClick={onBack}>返回主页</button>
      </header>
      <main className="trainer-vault-layout">
        <section className="trainer-vault-left-panel" aria-label={`${title}列表`}>
          <nav className="trainer-vault-tabs" aria-label="训练家仓库分区">
            <button className={tab === "bag" ? "active" : ""} type="button" onClick={() => onTabChange("bag")}>我的背包</button>
            <button className={tab === "pokemon" ? "active" : ""} type="button" onClick={() => onTabChange("pokemon")}>我的宝可梦</button>
          </nav>
          <section className="trainer-vault-grid" aria-label={pageLabel}>
            {pageEntries.map((entry, index) => (
              <VaultGridCell
                api={api}
                entry={entry}
                selected={entry.key === selectedEntry?.key}
                onSelect={() => entry.kind !== "empty" ? setSelectedKey(entry.key) : undefined}
                key={`${entry.key}-${index}`}
              />
            ))}
          </section>
          <footer className="trainer-vault-pagination">
            <button type="button" disabled={pageIndex <= 0} onClick={() => setPageIndex(value => Math.max(0, value - 1))}>上一页</button>
            <span>{pageLabel} · {pageIndex + 1}/3</span>
            <button type="button" disabled={pageIndex >= 2} onClick={() => setPageIndex(value => Math.min(2, value + 1))}>下一页</button>
          </footer>
        </section>
        <VaultDetailCard api={api} tab={tab} entry={selectedEntry} pageKind={pageKind} count={selectableEntries.length} />
      </main>
    </section>
  );
}

function VaultGridCell({api, entry, selected, onSelect}: {
  api: ChangeBattleV2Api;
  entry: VaultPageEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  if (entry.kind === "item") {
    const itemView = itemRecordView(api, entry.item);
    return (
      <button className={`trainer-vault-cell ${selected ? "selected" : ""}`} type="button" title={itemView.name} onClick={onSelect}>
        <PlayerBagItemIcon api={api} item={itemView.iconItem} />
        {entry.item.quantity > 1 ? <i>{entry.item.quantity}</i> : null}
      </button>
    );
  }
  if (entry.kind === "pokemon") {
    const pokemonView = pokemonRecordView(api, entry.pokemon);
    return (
      <button className={`trainer-vault-cell pokemon ${selected ? "selected" : ""}`} type="button" title={pokemonView.name} onClick={onSelect}>
        <ImageWithFallback src={pokemonView.spriteUrl} alt={pokemonView.name} fallback={pokemonView.name.slice(0, 1) || "?"} />
        {entry.pokemon.shiny ? <em>★</em> : null}
      </button>
    );
  }
  return <span className="trainer-vault-cell empty" aria-hidden="true" />;
}

function VaultDetailCard({api, tab, entry, pageKind, count}: {
  api: ChangeBattleV2Api;
  tab: TrainerVaultTab;
  entry: SelectableVaultPageEntry | null;
  pageKind: VaultPageKind;
  count: number;
}) {
  const pageLabel = vaultPageLabel(tab, pageKind);
  if (!entry) {
    return (
      <aside className="trainer-vault-detail" aria-label="详情">
        <small>{pageLabel}</small>
        <strong>{pageKind === "prep" ? "这里暂时是空的" : "正常仓库待接入"}</strong>
        <p>{pageKind === "prep" ? emptyText(tab) : normalPagePlaceholderText(tab)}</p>
      </aside>
    );
  }
  if (entry.kind === "item") {
    const item = entry.item;
    const itemView = itemRecordView(api, item);
    return (
      <aside className="trainer-vault-detail" aria-label="道具详情">
        <small>{pageLabel} · {count}</small>
        <div className="trainer-vault-detail-hero">
          <PlayerBagItemIcon api={api} item={itemView.iconItem} />
          <div>
            <strong>{itemView.name}</strong>
            <span>{itemView.kindLabel}</span>
          </div>
        </div>
        <dl>
          <div><dt>来源</dt><dd>{pageKind === "prep" ? "预备背包" : "正常背包"}</dd></div>
          <div><dt>数量</dt><dd>{item.quantity}</dd></div>
          <div><dt>编号</dt><dd>{item.itemId}</dd></div>
        </dl>
        <p>{itemView.description || "详情卡片占位，后续可接入完整说明、操作按钮和队伍选择。"}</p>
      </aside>
    );
  }
  const pokemon = entry.pokemon;
  const pokemonView = pokemonRecordView(api, pokemon);
  return (
    <aside className="trainer-vault-detail" aria-label="宝可梦详情">
      <small>{pageLabel} · {count}</small>
      <div className="trainer-vault-detail-hero pokemon">
        <ImageWithFallback src={pokemonView.spriteUrl} alt={pokemonView.name} fallback={pokemonView.name.slice(0, 1) || "?"} />
        <div>
          <strong>{pokemonView.name}</strong>
          <span>{pokemon.gender} · {pokemonView.abilityName}</span>
        </div>
      </div>
      <dl>
        <div><dt>来源</dt><dd>{pageKind === "prep" ? "预备宝可梦" : "正常宝可梦"}</dd></div>
        <div><dt>性格</dt><dd>{pokemon.nature}</dd></div>
        <div><dt>相遇</dt><dd>{formatDate(pokemon.metAt)}</dd></div>
      </dl>
      <p>{pokemon.moves.slice(0, 4).map((move) => move.moveId).join(" / ") || "详情卡片占位，后续可接入完整能力、招式、培养记录。"}</p>
    </aside>
  );
}

function isSelectableEntry(entry: VaultPageEntry): entry is SelectableVaultPageEntry {
  return entry.kind !== "empty";
}

function buildPageEntries(playerVault: PlayerVaultV4, tab: TrainerVaultTab, pageKind: VaultPageKind): VaultPageEntry[] {
  const realEntries = pageKind === "prep"
    ? tab === "bag"
      ? playerVault.items.slice(0, GRID_SLOT_COUNT).map(item => ({kind: "item" as const, key: `item:${item.itemId}`, item, pageKind}))
      : playerVault.pokemon.slice(0, GRID_SLOT_COUNT).map(pokemon => ({kind: "pokemon" as const, key: `pokemon:${pokemon.playerPokemonId}`, pokemon, pageKind}))
    : [];
  return fillEntries(realEntries, pageKind);
}

function fillEntries(entries: VaultPageEntry[], pageKind: VaultPageKind): VaultPageEntry[] {
  const next = entries.slice(0, GRID_SLOT_COUNT);
  while (next.length < GRID_SLOT_COUNT) {
    next.push({kind: "empty", key: `empty:${pageKind}:${next.length}`, pageKind, slotIndex: next.length});
  }
  return next;
}

function vaultPageLabel(tab: TrainerVaultTab, pageKind: VaultPageKind): string {
  if (tab === "bag") return pageKind === "prep" ? "预备背包" : "正常背包";
  return pageKind === "prep" ? "预备宝可梦" : "正常宝可梦";
}

function emptyText(tab: TrainerVaultTab): string {
  return tab === "bag"
    ? "后续正式流程结算、长期奖励和自养成系统会把可长期保存的道具放到这里。"
    : "这里会存放脱离单局流程后仍属于玩家的自养成宝可梦。";
}

function normalPagePlaceholderText(tab: TrainerVaultTab): string {
  return tab === "bag"
    ? "第二、三页预留给正常背包。当前先保留分页和宫格位置，等数据源接入后直接显示道具。"
    : "第二、三页预留给正常宝可梦盒。当前先保留分页和宫格位置，等数据源接入后直接显示伙伴。";
}

function itemRecordView(api: ChangeBattleV2Api, item: PlayerItemRecordV4): {name: string; kindLabel: string; description: string; iconItem: PlayerItemInstanceV4} {
  try {
    const detail = api.getItemDetail(item.itemId);
    return {
      name: detail.nameZh || detail.name || item.itemId,
      kindLabel: detail.kindLabel || detail.kind || "道具",
      description: detail.description || detail.effectSummary || "",
      iconItem: {
        id: `player-vault-item-${item.itemId}`,
        itemID: item.itemId,
        name: detail.nameZh || detail.name || item.itemId,
        type: itemTypeFromDetailKind(detail.kind),
        useCount: item.quantity,
        image: detail.iconUrl || "",
        canBattleUse: Boolean(detail.canBattleUse),
        canUse: Boolean(detail.canUse),
        canUseToPokemon: Boolean(detail.canUseToPokemon),
        canTake: Boolean(detail.canTake),
        canSale: Boolean(detail.canSale),
        cost: detail.cost || 0,
        effectRound: null,
        getRound: 0,
        maxUseCount: null,
      },
    };
  } catch {
    return {
      name: item.itemId,
      kindLabel: "道具",
      description: "",
      iconItem: {
        id: `player-vault-item-${item.itemId}`,
        itemID: item.itemId,
        name: item.itemId,
        image: "",
        type: "misc",
        useCount: item.quantity,
        canBattleUse: false,
        canUse: false,
        canUseToPokemon: false,
        canTake: false,
        canSale: false,
        cost: 0,
        effectRound: null,
        getRound: 0,
        maxUseCount: null,
      },
    };
  }
}

function pokemonRecordView(api: ChangeBattleV2Api, pokemon: PlayerPokemonRecordV4): {name: string; abilityName: string; spriteUrl: string} {
  try {
    const detail = api.getPokemonDetail(pokemon.speciesId);
    const ability = detail.abilities.find(entry => entry.id === pokemon.abilityId);
    return {
      name: detail.nameZh || detail.name || pokemon.speciesId,
      abilityName: ability?.nameZh || ability?.name || pokemon.abilityId || "特性未知",
      spriteUrl: pokemonSpriteUrl({speciesId: pokemon.speciesId, shiny: pokemon.shiny}),
    };
  } catch {
    return {
      name: pokemon.speciesId,
      abilityName: pokemon.abilityId || "特性未知",
      spriteUrl: pokemonSpriteUrl({speciesId: pokemon.speciesId, shiny: pokemon.shiny}),
    };
  }
}

function itemTypeFromDetailKind(kind: string): PlayerItemInstanceV4["type"] {
  if (kind === "berry") return "berry";
  if (kind === "recovery" || kind === "revive" || kind === "pp") return "medicine";
  if (kind === "tm") return "tm";
  if (kind === "training") return "training";
  if (kind === "system") return "system";
  if (kind === "system-battle") return "system-battle";
  if (kind === "held") return "held";
  if (kind === "battle") return "battle";
  return "misc";
}

function formatDate(value: string): string {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "未知";
  return new Date(time).toLocaleDateString("zh-CN");
}
