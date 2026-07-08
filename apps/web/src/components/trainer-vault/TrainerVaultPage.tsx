import {useEffect, useMemo, useState} from "react";
import type {ChangeBattleV2Api, PlayerItemInstanceV4, PlayerItemRecordV4, PlayerPokemonRecordV4, PlayerVaultPokemonDetailViewV4, PlayerVaultV4} from "@changebattle-v2/api";
import {AppConfirmModal} from "../shared/AppModal";
import {ImageWithFallback} from "../shared/ImageWithFallback";
import {PlayerBagItemIcon} from "../training/PlayerBagPanel";
import {assetUrl} from "../../lib/assetUrl";
import {pokemonSpriteUrl} from "../../lib/showdownPokemonSpriteAdapter";
import "./TrainerVaultPage.css";

type TrainerVaultTab = "bag" | "pokemon";
type TrainerVaultPokemonDetailTab = "overview" | "stats" | "moves" | "evolution";
type VaultPageKind = "prep" | "storage";
type VaultPageEntry =
  | {kind: "item"; key: string; item: PlayerItemRecordV4; pageKind: VaultPageKind; storagePageIndex: number; slotIndex: number}
  | {kind: "pokemon"; key: string; pokemon: PlayerPokemonRecordV4; pageKind: VaultPageKind; storagePageIndex: number; slotIndex: number}
  | {kind: "empty"; key: string; pageKind: VaultPageKind; storagePageIndex: number; slotIndex: number};
type SelectableVaultPageEntry = Exclude<VaultPageEntry, {kind: "empty"}>;
type VaultItemLocation = {pageKind: VaultPageKind; storagePageIndex: number; slotIndex: number};
type VaultConfirmDialog = {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
};

const GRID_SLOT_COUNT = 24;
const STORAGE_BOX_UNLOCK_BP_COST = 24;

export function TrainerVaultPage({api, playerVault, playerVaultDirty, profileBattlePoints, tab, onPlayerVaultChange, onPlayerVaultDirtyChange, onSavePlayerVault, onUnlockStoragePage, onTabChange, onBack}: {
  api: ChangeBattleV2Api;
  playerVault: PlayerVaultV4;
  playerVaultDirty: boolean;
  profileBattlePoints: number;
  tab: TrainerVaultTab;
  onPlayerVaultChange: (vault: PlayerVaultV4) => void;
  onPlayerVaultDirtyChange: (dirty: boolean) => void;
  onSavePlayerVault: (vault: PlayerVaultV4) => Promise<PlayerVaultV4>;
  onUnlockStoragePage: (tab: TrainerVaultTab) => Promise<PlayerVaultV4>;
  onTabChange: (tab: TrainerVaultTab) => void;
  onBack: () => void;
}) {
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState("");
  const [movingItemKey, setMovingItemKey] = useState("");
  const [vaultMessage, setVaultMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<VaultConfirmDialog | null>(null);
  const unlockedStoragePageCount = api.playerVaultUnlockedStoragePageCountV4(playerVault, tab === "bag" ? "item" : "pokemon");
  const hasPrepPage = tab === "pokemon";
  const totalPageCount = (hasPrepPage ? 1 : 0) + unlockedStoragePageCount + 1;
  const pageKind: VaultPageKind = hasPrepPage && pageIndex <= 0 ? "prep" : "storage";
  const storagePageIndex = pageKind === "storage" ? pageIndex - (hasPrepPage ? 1 : 0) : -1;
  const pageLocked = pageKind === "storage" && storagePageIndex >= unlockedStoragePageCount;
  const pageEntries = useMemo(() => pageLocked ? createEmptyEntries(pageKind, storagePageIndex) : buildPageEntries(playerVault, tab, pageKind, storagePageIndex), [pageLocked, playerVault, tab, pageKind, storagePageIndex]);
  const selectableEntries = pageEntries.filter(isSelectableEntry);
  const selectedEntry = selectableEntries.find(entry => entry.key === selectedKey) || selectableEntries[0] || null;

  useEffect(() => {
    setPageIndex(0);
    setSelectedKey("");
    setMovingItemKey("");
    setVaultMessage("");
  }, [tab]);

  useEffect(() => {
    if (!selectableEntries.length) {
      setSelectedKey("");
      return;
    }
    if (!selectableEntries.some(entry => entry.key === selectedKey)) setSelectedKey(selectableEntries[0]!.key);
  }, [selectableEntries.map(entry => entry.key).join("|"), selectedKey]);

  const title = tab === "bag" ? "我的背包" : "我的宝可梦";
  const pageLabel = vaultPageLabel(tab, pageKind, storagePageIndex);
  const movingItem = movingItemKey ? pageEntries.find(entry => entry.kind === "item" && entry.key === movingItemKey) || findItemEntryByKey(playerVault, movingItemKey) : null;

  function updateVaultDraft(nextVault: PlayerVaultV4, message: string) {
    onPlayerVaultChange(api.normalizePlayerVault(nextVault));
    onPlayerVaultDirtyChange(true);
    setVaultMessage(message);
  }

  async function saveAndBack() {
    if (saving) return;
    if (!playerVaultDirty) {
      onBack();
      return;
    }
    setSaving(true);
    setVaultMessage("保存中...");
    try {
      const saved = await onSavePlayerVault(api.normalizePlayerVault(playerVault));
      onPlayerVaultChange(saved);
      onPlayerVaultDirtyChange(false);
      setVaultMessage("保存完成。");
      onBack();
    } catch (error) {
      console.error("[TrainerVaultPage] save player vault failed", error);
      setVaultMessage(error instanceof Error ? `保存失败：${error.message}` : "保存失败。");
    } finally {
      setSaving(false);
    }
  }

  function handleCellSelect(entry: VaultPageEntry) {
    if (pageLocked) {
      if (tab === "bag" && movingItemKey) void unlockAndMoveSelectedItemTo(entry);
      return;
    }
    if (tab !== "bag" || !movingItemKey) {
      if (entry.kind !== "empty") setSelectedKey(entry.key);
      return;
    }
    moveSelectedItemTo(entry);
  }

  function moveSelectedItemTo(target: VaultPageEntry) {
    const source = findItemEntryByKey(playerVault, movingItemKey);
    if (!source) {
      setMovingItemKey("");
      setVaultMessage("移动的道具不存在。");
      return;
    }
    if (target.kind === "pokemon") return;
    if (target.kind === "item" && target.key === source.key) {
      setMovingItemKey("");
      setVaultMessage("已取消移动。");
      return;
    }
    const targetLocation = entryLocation(target);
    const sourceLocation = entryLocation(source);
    const targetItem = target.kind === "item" ? target : null;
    if (targetItem) {
      setConfirmDialog({
        title: "交换道具位置",
        message: "目标格子已有道具，是否交换两个道具的位置？",
        confirmLabel: "交换",
        onConfirm: () => applyMoveSelectedItemTo(target),
      });
      return;
    }
    applyMoveSelectedItemTo(target);
  }

  function applyMoveSelectedItemTo(target: VaultPageEntry) {
    const source = findItemEntryByKey(playerVault, movingItemKey);
    if (!source || target.kind === "pokemon") return;
    const targetLocation = entryLocation(target);
    const sourceLocation = entryLocation(source);
    const targetItem = target.kind === "item" ? target : null;
    const nextItems = playerVault.items.map(item => {
      const currentKey = itemRecordKey(item);
      if (currentKey === source.key) return applyItemLocation(item, targetLocation);
      if (targetItem && currentKey === targetItem.key) return applyItemLocation(item, sourceLocation);
      return item;
    });
    setMovingItemKey("");
    setSelectedKey(itemRecordKey(applyItemLocation(source.item, targetLocation)));
    updateVaultDraft({...playerVault, items: nextItems}, targetItem ? "已交换道具位置，返回主页时保存。" : "已移动道具，返回主页时保存。");
  }

  async function unlockAndMoveSelectedItemTo(target: VaultPageEntry) {
    if (!pageLocked || target.kind === "pokemon" || unlocking || saving) return;
    if (profileBattlePoints < STORAGE_BOX_UNLOCK_BP_COST) {
      setVaultMessage(`BP 不足，需要 ${STORAGE_BOX_UNLOCK_BP_COST} BP。`);
      return;
    }
    setConfirmDialog({
      title: "解锁箱子",
      message: `确认花费 ${STORAGE_BOX_UNLOCK_BP_COST} BP 解锁这个箱子，并把道具移动到这里？`,
      confirmLabel: "解锁并移动",
      onConfirm: () => applyUnlockAndMoveSelectedItemTo(target),
    });
  }

  async function applyUnlockAndMoveSelectedItemTo(target: VaultPageEntry) {
    setUnlocking(true);
    setVaultMessage("解锁中...");
    try {
      const unlockedVault = await onUnlockStoragePage(tab);
      const source = findItemEntryByKey(unlockedVault, movingItemKey);
      if (!source) {
        setMovingItemKey("");
        setVaultMessage("箱子已解锁，但移动的道具不存在。");
        return;
      }
      const targetLocation = entryLocation(target);
      const nextItems = unlockedVault.items.map(item => itemRecordKey(item) === source.key ? applyItemLocation(item, targetLocation) : item);
      const movedItemKey = itemRecordKey(applyItemLocation(source.item, targetLocation));
      setMovingItemKey("");
      setSelectedKey(movedItemKey);
      updateVaultDraft({...unlockedVault, items: nextItems}, "箱子已解锁，道具已移动，返回主页时保存。");
    } catch (error) {
      console.error("[TrainerVaultPage] unlock and move item failed", error);
      setVaultMessage(error instanceof Error ? `解锁失败：${error.message}` : "解锁失败。");
    } finally {
      setUnlocking(false);
    }
  }

  function discardSelectedItem() {
    if (selectedEntry?.kind !== "item") return;
    const itemView = itemRecordView(api, selectedEntry.item);
    const entryKey = selectedEntry.key;
    setConfirmDialog({
      title: "丢弃道具",
      message: `确认丢弃 ${itemView.name} x${selectedEntry.item.quantity}？`,
      confirmLabel: "丢弃",
      danger: true,
      onConfirm: () => applyDiscardSelectedItem(entryKey),
    });
  }

  function applyDiscardSelectedItem(entryKey: string) {
    const nextItems = playerVault.items.filter(item => itemRecordKey(item) !== entryKey);
    setMovingItemKey("");
    setSelectedKey("");
    updateVaultDraft({...playerVault, items: nextItems}, "已丢弃道具，返回主页时保存。");
  }

  async function unlockCurrentStoragePage() {
    if (!pageLocked || unlocking || saving) return;
    if (profileBattlePoints < STORAGE_BOX_UNLOCK_BP_COST) {
      setVaultMessage(`BP 不足，需要 ${STORAGE_BOX_UNLOCK_BP_COST} BP。`);
      return;
    }
    setConfirmDialog({
      title: "解锁箱子",
      message: `确认花费 ${STORAGE_BOX_UNLOCK_BP_COST} BP 解锁这个箱子？`,
      confirmLabel: "解锁",
      onConfirm: applyUnlockCurrentStoragePage,
    });
  }

  async function applyUnlockCurrentStoragePage() {
    setUnlocking(true);
    setVaultMessage("解锁中...");
    try {
      await onUnlockStoragePage(tab);
      setVaultMessage("箱子已解锁。");
    } catch (error) {
      console.error("[TrainerVaultPage] unlock storage page failed", error);
      setVaultMessage(error instanceof Error ? `解锁失败：${error.message}` : "解锁失败。");
    } finally {
      setUnlocking(false);
    }
  }

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
        <button type="button" onClick={() => void saveAndBack()} disabled={saving}>{saving ? "保存中..." : playerVaultDirty ? "保存并返回" : "返回主页"}</button>
      </header>
      <main className="trainer-vault-layout">
        <section className="trainer-vault-left-panel" aria-label={`${title}列表`}>
          <nav className="trainer-vault-tabs" aria-label="训练家仓库分区">
            <button className={tab === "bag" ? "active" : ""} type="button" onClick={() => onTabChange("bag")}>我的背包</button>
            <button className={tab === "pokemon" ? "active" : ""} type="button" onClick={() => onTabChange("pokemon")}>我的宝可梦</button>
          </nav>
          <section className={`trainer-vault-grid ${pageKind} ${pageLocked ? "locked" : ""}`} aria-label={pageLabel}>
            {pageLocked ? <div className="trainer-vault-lock-badge" aria-hidden="true">LOCK</div> : null}
            {pageEntries.map((entry, index) => (
              <VaultGridCell
                api={api}
                entry={entry}
                selected={entry.key === selectedEntry?.key}
                moving={Boolean(movingItemKey)}
                movingSource={entry.key === movingItemKey}
                onSelect={() => handleCellSelect(entry)}
                key={`${entry.key}-${index}`}
              />
            ))}
          </section>
          <footer className="trainer-vault-pagination">
            <button type="button" disabled={pageIndex <= 0} onClick={() => setPageIndex(value => Math.max(0, value - 1))}>上一页</button>
            {pageLocked
              ? <button className="unlock-box" type="button" disabled={unlocking || saving} onClick={() => void unlockCurrentStoragePage()}>{unlocking ? "解锁中..." : `解锁箱子 ${STORAGE_BOX_UNLOCK_BP_COST} BP`}</button>
              : <span>{pageLabel} · {pageIndex + 1}/{totalPageCount}</span>}
            <button type="button" disabled={pageIndex >= totalPageCount - 1} onClick={() => setPageIndex(value => Math.min(totalPageCount - 1, value + 1))}>下一页</button>
          </footer>
        </section>
        <VaultDetailCard
          api={api}
          tab={tab}
          entry={selectedEntry}
          pageKind={pageKind}
          storagePageIndex={storagePageIndex}
          pageLocked={pageLocked}
          count={selectableEntries.length}
          movingItemName={movingItem?.kind === "item" ? itemRecordView(api, movingItem.item).name : ""}
          saving={saving}
          message={vaultMessage}
          onStartMove={() => selectedEntry?.kind === "item" ? setMovingItemKey(selectedEntry.key) : undefined}
          onCancelMove={() => {
            setMovingItemKey("");
            setVaultMessage("已取消移动。");
          }}
          onDiscard={discardSelectedItem}
        />
      </main>
      {confirmDialog ? (
        <AppConfirmModal
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          danger={Boolean(confirmDialog.danger)}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={() => {
            const action = confirmDialog.onConfirm;
            setConfirmDialog(null);
            void action();
          }}
        />
      ) : null}
    </section>
  );
}

function VaultGridCell({api, entry, selected, moving, movingSource, onSelect}: {
  api: ChangeBattleV2Api;
  entry: VaultPageEntry;
  selected: boolean;
  moving: boolean;
  movingSource: boolean;
  onSelect: () => void;
}) {
  if (entry.kind === "item") {
    const itemView = itemRecordView(api, entry.item);
    return (
      <button className={`trainer-vault-cell ${entry.pageKind} ${selected ? "selected" : ""} ${movingSource ? "moving-source" : ""} ${moving ? "move-target" : ""}`} type="button" title={itemView.name} onClick={onSelect}>
        <PlayerBagItemIcon api={api} item={itemView.iconItem} />
        {entry.item.quantity > 1 ? <i>{entry.item.quantity}</i> : null}
      </button>
    );
  }
  if (entry.kind === "pokemon") {
    const pokemonView = pokemonRecordView(api, entry.pokemon);
    return (
      <button className={`trainer-vault-cell pokemon ${entry.pageKind} ${selected ? "selected" : ""}`} type="button" title={pokemonView.name} onClick={onSelect}>
        <ImageWithFallback src={pokemonView.spriteUrl} alt={pokemonView.name} fallback={pokemonView.name.slice(0, 1) || "?"} />
        {entry.pokemon.shiny ? <em>★</em> : null}
      </button>
    );
  }
  return moving
    ? <button className={`trainer-vault-cell empty ${entry.pageKind} move-target`} type="button" onClick={onSelect} aria-label="移动到空格" />
    : <span className={`trainer-vault-cell empty ${entry.pageKind}`} aria-hidden="true" />;
}

function VaultDetailCard({api, tab, entry, pageKind, storagePageIndex, pageLocked, count, movingItemName, saving, message, onStartMove, onCancelMove, onDiscard}: {
  api: ChangeBattleV2Api;
  tab: TrainerVaultTab;
  entry: SelectableVaultPageEntry | null;
  pageKind: VaultPageKind;
  storagePageIndex: number;
  pageLocked: boolean;
  count: number;
  movingItemName: string;
  saving: boolean;
  message: string;
  onStartMove: () => void;
  onCancelMove: () => void;
  onDiscard: () => void;
}) {
  const pageLabel = vaultPageLabel(tab, pageKind, storagePageIndex);
  const selectedPokemonId = entry?.kind === "pokemon" ? entry.pokemon.playerPokemonId : "";
  const [pokemonDetailTab, setPokemonDetailTab] = useState<TrainerVaultPokemonDetailTab>("overview");
  useEffect(() => {
    setPokemonDetailTab("overview");
  }, [selectedPokemonId]);
  if (pageLocked) {
    return (
      <aside className="trainer-vault-detail locked" aria-label="锁定箱子详情">
        <small>{pageLabel}</small>
        <strong>箱子未解锁</strong>
        {message ? <span className="trainer-vault-message">{message}</span> : null}
        <p>这是下一页待解锁箱子。解锁后会变成新的存储箱，系统会继续在后面追加一个新的待解锁箱子。</p>
      </aside>
    );
  }
  if (!entry) {
    return (
      <aside className="trainer-vault-detail" aria-label="详情">
        <small>{pageLabel}</small>
        <strong>{pageKind === "prep" ? "预备宝可梦为空" : "存储箱为空"}</strong>
        {movingItemName ? <div className="trainer-vault-detail-actions"><button type="button" onClick={onCancelMove}>取消移动</button></div> : null}
        {message ? <span className="trainer-vault-message">{message}</span> : null}
        <p>{pageKind === "prep" ? emptyPokemonPrepText() : storagePageEmptyText(tab)}</p>
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
          <div><dt>来源</dt><dd>道具存储箱</dd></div>
          <div><dt>数量</dt><dd>{item.quantity}</dd></div>
          <div><dt>编号</dt><dd>{item.itemId}</dd></div>
        </dl>
        <div className="trainer-vault-detail-actions">
          {movingItemName ? <button type="button" onClick={onCancelMove} disabled={saving}>取消移动</button> : <button type="button" onClick={onStartMove} disabled={saving}>移动</button>}
          <button type="button" onClick={onDiscard} disabled={saving}>丢弃</button>
        </div>
        {movingItemName ? <span className="trainer-vault-message">选择目标格移动「{movingItemName}」。</span> : message ? <span className="trainer-vault-message">{message}</span> : null}
        <p>{itemView.description || "详情卡片占位，后续可接入完整说明、操作按钮和队伍选择。"}</p>
      </aside>
    );
  }
  const pokemon = entry.pokemon;
  const pokemonView = api.createPlayerVaultPokemonDetailView(pokemon);
  return (
    <aside className="trainer-vault-detail" aria-label="宝可梦详情">
      <small>{pageLabel} · {count}</small>
      <div className="trainer-vault-detail-hero pokemon">
        <ImageWithFallback src={pokemonView.spriteUrl} alt={pokemonView.title} fallback={pokemonView.title.slice(0, 1) || "?"} />
        <div>
          <strong>{pokemonView.title}</strong>
          <span>{pokemonView.subtitle}</span>
        </div>
      </div>
      <div className="trainer-vault-pokemon-tabs" role="tablist" aria-label="宝可梦详情分页">
        {POKEMON_DETAIL_TABS.map(detailTab => (
          <button className={pokemonDetailTab === detailTab.id ? "active" : ""} type="button" role="tab" aria-selected={pokemonDetailTab === detailTab.id} onClick={() => setPokemonDetailTab(detailTab.id)} key={detailTab.id}>
            {detailTab.label}
          </button>
        ))}
      </div>
      <PokemonDetailTabPanel view={pokemonView} tab={pokemonDetailTab} />
    </aside>
  );
}

function isSelectableEntry(entry: VaultPageEntry): entry is SelectableVaultPageEntry {
  return entry.kind !== "empty";
}

const POKEMON_DETAIL_TABS: Array<{id: TrainerVaultPokemonDetailTab; label: string}> = [
  {id: "overview", label: "概览"},
  {id: "stats", label: "数值"},
  {id: "moves", label: "技能"},
  {id: "evolution", label: "进化"},
];

function PokemonDetailTabPanel({view, tab}: {view: PlayerVaultPokemonDetailViewV4; tab: TrainerVaultPokemonDetailTab}) {
  if (tab === "overview") {
    return (
      <div className="trainer-vault-pokemon-tab-panel">
        <dl className="trainer-vault-pokemon-overview">
          {view.overview.map(row => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}
        </dl>
      </div>
    );
  }
  if (tab === "stats") {
    return (
      <div className="trainer-vault-pokemon-tab-panel">
        <table className="trainer-vault-pokemon-stat-table">
          <thead><tr><th>能力</th><th>实数</th><th>个体</th><th>努力</th></tr></thead>
          <tbody>
            {view.stats.map(row => <tr key={row.id}><td>{row.label}</td><td>{row.actual}</td><td>{row.iv}</td><td>{row.ev}</td></tr>)}
          </tbody>
        </table>
      </div>
    );
  }
  if (tab === "moves") {
    return (
      <div className="trainer-vault-pokemon-tab-panel">
        <div className="trainer-vault-pokemon-move-list">
          {view.moves.length ? view.moves.map(move => (
            <article key={`${move.slot}:${move.id}`}>
              <strong>{move.slot}. {move.name}</strong>
              <span>{move.type} · {move.category} · 威力 {move.power} · PP {move.pp}</span>
            </article>
          )) : <p>暂无技能记录。</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="trainer-vault-pokemon-tab-panel">
      <div className="trainer-vault-pokemon-evolution-list">
        {view.evolutions.length ? view.evolutions.map((edge, index) => (
          <article key={`${edge.from}:${edge.to}:${index}`}>
            <strong>{edge.from} → {edge.to}</strong>
            <span>{edge.method}</span>
          </article>
        )) : <p>当前形态暂无可用进化。</p>}
      </div>
    </div>
  );
}

function buildPageEntries(playerVault: PlayerVaultV4, tab: TrainerVaultTab, pageKind: VaultPageKind, storagePageIndex: number): VaultPageEntry[] {
  const entries = createEmptyEntries(pageKind, storagePageIndex);
  if (tab === "bag") {
    for (const item of playerVault.items) {
      const location = itemLocation(item);
      if (location.pageKind !== pageKind || location.storagePageIndex !== storagePageIndex) continue;
      if (entries[location.slotIndex]?.kind !== "empty") continue;
      entries[location.slotIndex] = {
        kind: "item",
        key: itemRecordKey(item),
        item,
        ...location,
      };
    }
    return entries;
  }
  if (pageKind === "prep") return entries;
  const start = Math.max(0, storagePageIndex) * GRID_SLOT_COUNT;
  playerVault.pokemon.slice(start, start + GRID_SLOT_COUNT).forEach((pokemon, index) => {
    entries[index] = {kind: "pokemon", key: `pokemon:${pokemon.playerPokemonId}`, pokemon, pageKind, storagePageIndex, slotIndex: index};
  });
  return entries;
}

function createEmptyEntries(pageKind: VaultPageKind, storagePageIndex: number): VaultPageEntry[] {
  return Array.from({length: GRID_SLOT_COUNT}, (_, slotIndex) => ({kind: "empty", key: `empty:${pageKind}:${storagePageIndex}:${slotIndex}`, pageKind, storagePageIndex, slotIndex}));
}

function findItemEntryByKey(playerVault: PlayerVaultV4, key: string): Extract<VaultPageEntry, {kind: "item"}> | null {
  const item = playerVault.items.find(entry => itemRecordKey(entry) === key);
  if (!item) return null;
  const location = itemLocation(item);
  return {
    kind: "item",
    key: itemRecordKey(item),
    item,
    ...location,
  };
}

function itemLocation(item: PlayerItemRecordV4): VaultItemLocation {
  return {
    pageKind: "storage",
    storagePageIndex: Math.max(0, Math.floor(Number(item.storagePageIndex || 0))),
    slotIndex: clampSlotIndex(item.slotIndex),
  };
}

function entryLocation(entry: VaultPageEntry): VaultItemLocation {
  return {
    pageKind: entry.pageKind,
    storagePageIndex: entry.pageKind === "storage" ? Math.max(0, entry.storagePageIndex) : -1,
    slotIndex: clampSlotIndex(entry.slotIndex),
  };
}

function applyItemLocation(item: PlayerItemRecordV4, location: VaultItemLocation): PlayerItemRecordV4 {
  return {
    ...item,
    boxKind: "storage",
    storagePageIndex: Math.max(0, Math.floor(location.storagePageIndex)),
    slotIndex: clampSlotIndex(location.slotIndex),
  };
}

function itemRecordKey(item: PlayerItemRecordV4): string {
  const location = itemLocation(item);
  return `${location.pageKind}:${location.storagePageIndex}:${location.slotIndex}:${item.itemId}`;
}

function clampSlotIndex(value: unknown): number {
  const slotIndex = Math.floor(Number(value));
  if (!Number.isFinite(slotIndex)) return 0;
  return Math.min(GRID_SLOT_COUNT - 1, Math.max(0, slotIndex));
}

function vaultPageLabel(tab: TrainerVaultTab, pageKind: VaultPageKind, storagePageIndex: number): string {
  if (tab === "bag") return `道具存储箱 ${storagePageIndex + 1}`;
  return pageKind === "prep" ? "预备宝可梦" : `宝可梦存储箱 ${storagePageIndex + 1}`;
}

function emptyPokemonPrepText(): string {
  return "预备箱用于后续出发前整理。获得的长期宝可梦会进入后面的宝可梦存储箱。";
}

function storagePageEmptyText(tab: TrainerVaultTab): string {
  return tab === "bag"
    ? "当前存储箱没有道具。本局结算道具会从这里开始入库。"
    : "当前存储箱没有宝可梦。后续获得宝可梦时会从这里开始入库。";
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
