import {useEffect, useMemo, useState} from "react";
import type {ChangeBattleV2Api, DexMoveSummary, PlayerPokemonHonorBadgeViewV4, PlayerPokemonRecordV4, PlayerVaultV4} from "@changebattle-v2/api";
import {AppConfirmModal} from "../shared/AppModal";
import {GameEvolutionModal, type GameEvolutionModalTarget} from "../shared/GameEvolutionModal";
import {assetUrl} from "../../lib/assetUrl";
import {TrainerVaultBagList} from "./TrainerVaultBagList";
import {TrainerVaultDebugAddModal, type TrainerVaultDebugAddState} from "./TrainerVaultDebugAddModal";
import {buildItemPageEntries, buildPokemonPageEntries, createEmptyEntries, findItemEntryByKey, findPlayerVaultItemRecordByKey, findPokemonEntryById, isItemEntryWithKey, isPokemonEntryWithId, isVaultUsableItemDetail, itemRecordKey, itemRecordView, moveTeachingUnavailableMessage, playerMoveToReplaceMove, playerPokemonShortName, POKEMON_PAGE_SIZE, safeItemDetail, STORAGE_BOX_UNLOCK_BP_COST, type TrainerVaultTab, type VaultActiveUseItem, type VaultItemEntry, type VaultPageEntry, type VaultPokemonEntry} from "./TrainerVaultModel";
import {TrainerVaultPokemonBox} from "./TrainerVaultPokemonBox";
import {VaultItemDrawer} from "./VaultItemDrawer";
import {VaultMoveReplaceModal, type VaultMoveReplaceState} from "./VaultMoveReplaceModal";
import {VaultMoveSelectModal, type VaultMoveSelectState} from "./VaultMoveSelectModal";
import {VaultNumericPreviewModal, type VaultNumericPreviewModalState} from "./VaultNumericPreviewModal";
import {VaultPokemonHonorBadgeModal} from "./VaultPokemonHonorBadges";
import {VaultPokemonDrawer} from "./VaultPokemonDrawer";
import {VaultUseNotice, type VaultUseNoticeState, type VaultUseNoticeTone} from "./VaultUseNotice";
import "./TrainerVaultPage.css";

type VaultConfirmDialog = {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
};
type VaultNumericPreviewState = VaultNumericPreviewModalState;
type VaultEvolutionPreviewState = Extract<ReturnType<ChangeBattleV2Api["previewPlayerVaultEvolutionItemUse"]>, {ok: true}>;

export function TrainerVaultPage({api, playerVault, playerVaultDirty, profileBattlePoints, debugFeatureEnabled = false, onPlayerVaultChange, onPlayerVaultDirtyChange, onSavePlayerVault, onUnlockStoragePage, onBack}: {
  api: ChangeBattleV2Api;
  playerVault: PlayerVaultV4;
  playerVaultDirty: boolean;
  profileBattlePoints: number;
  debugFeatureEnabled?: boolean;
  onPlayerVaultChange: (vault: PlayerVaultV4) => void;
  onPlayerVaultDirtyChange: (dirty: boolean) => void;
  onSavePlayerVault: (vault: PlayerVaultV4) => Promise<PlayerVaultV4>;
  onUnlockStoragePage: (tab: TrainerVaultTab) => Promise<PlayerVaultV4>;
  onBack: () => void;
}) {
  const [draftVault, setDraftVault] = useState(() => api.normalizePlayerVault(playerVault));
  const [draftDirty, setDraftDirty] = useState(false);
  const [itemPageIndex, setItemPageIndex] = useState(0);
  const [pokemonPageIndex, setPokemonPageIndex] = useState(0);
  const [itemDrawerKey, setItemDrawerKey] = useState("");
  const [pokemonDrawerId, setPokemonDrawerId] = useState("");
  const [vaultMessage, setVaultMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [unlockingKind, setUnlockingKind] = useState<TrainerVaultTab | "">("");
  const [confirmDialog, setConfirmDialog] = useState<VaultConfirmDialog | null>(null);
  const [moveSelect, setMoveSelect] = useState<VaultMoveSelectState | null>(null);
  const [moveReplace, setMoveReplace] = useState<VaultMoveReplaceState | null>(null);
  const [numericPreview, setNumericPreview] = useState<VaultNumericPreviewState | null>(null);
  const [evolutionPreview, setEvolutionPreview] = useState<VaultEvolutionPreviewState | null>(null);
  const [selectedHonorBadge, setSelectedHonorBadge] = useState<PlayerPokemonHonorBadgeViewV4 | null>(null);
  const [activeUseItem, setActiveUseItem] = useState<VaultActiveUseItem | null>(null);
  const [debugAdd, setDebugAdd] = useState<TrainerVaultDebugAddState | null>(null);
  const [useNotice, setUseNotice] = useState<VaultUseNoticeState | null>(null);

  const itemStoragePageCount = api.playerVaultUnlockedStoragePageCountV4(draftVault, "item");
  const pokemonStoragePageCount = api.playerVaultUnlockedStoragePageCountV4(draftVault, "pokemon");
  const itemTotalPageCount = itemStoragePageCount + 1;
  const pokemonTotalPageCount = pokemonStoragePageCount + 1;
  const itemPageLocked = itemPageIndex >= itemStoragePageCount;
  const pokemonPageLocked = pokemonPageIndex >= pokemonStoragePageCount;
  const itemEntries = useMemo(() => itemPageLocked ? [] : buildItemPageEntries(draftVault, itemPageIndex), [draftVault, itemPageIndex, itemPageLocked]);
  const pokemonEntries = useMemo(() => pokemonPageLocked ? createEmptyEntries(POKEMON_PAGE_SIZE, pokemonPageIndex) : buildPokemonPageEntries(draftVault, pokemonPageIndex), [draftVault, pokemonPageIndex, pokemonPageLocked]);
  const itemDrawerEntry = useMemo<VaultItemEntry | null>(() => itemEntries.find(isItemEntryWithKey(itemDrawerKey)) || findItemEntryByKey(draftVault, itemDrawerKey), [draftVault, itemEntries, itemDrawerKey]);
  const pokemonDrawerEntry = useMemo<VaultPokemonEntry | null>(() => pokemonEntries.find(isPokemonEntryWithId(pokemonDrawerId)) || findPokemonEntryById(draftVault, pokemonDrawerId), [draftVault, pokemonEntries, pokemonDrawerId]);
  const activeUseItemRecord = activeUseItem ? findPlayerVaultItemRecordByKey(draftVault, activeUseItem.itemKey) : null;
  const activeUseItemQuantity = activeUseItemRecord?.quantity ?? activeUseItem?.quantity ?? 0;
  const evolutionModalTargets = useMemo<GameEvolutionModalTarget[]>(
    () => evolutionPreview?.targets.map(target => ({
      toSpeciesId: target.toSpeciesId,
      toName: target.toName,
      toSpriteUrl: target.toSpriteUrl,
      friendshipRequirement: target.friendshipRequirement,
      statChanges: target.statChanges,
    })) || [],
    [evolutionPreview],
  );

  useEffect(() => {
    if (draftDirty) return;
    setDraftVault(api.normalizePlayerVault(playerVault));
  }, [api, playerVault, draftDirty]);

  function updateVaultDraft(nextVault: PlayerVaultV4, message: string) {
    setDraftVault(api.normalizePlayerVault(nextVault));
    setDraftDirty(true);
    setVaultMessage(message);
  }

  function showUseNotice(message: string, tone: VaultUseNoticeTone = "danger") {
    setUseNotice({id: Date.now(), message, tone});
  }

  function openDebugAdd(kind: TrainerVaultTab) {
    if (activeUseItem) return;
    setDebugAdd({kind, query: "", selectedId: "", quantity: 1});
  }

  function applyDebugAdd() {
    if (!debugAdd) return;
    if (!debugAdd.selectedId) {
      setDebugAdd({...debugAdd, error: debugAdd.kind === "bag" ? "请选择道具。" : "请选择宝可梦。"});
      return;
    }
    const result = debugAdd.kind === "bag"
      ? api.addDebugPlayerVaultItem(draftVault, debugAdd.selectedId, debugAdd.quantity)
      : api.addDebugPlayerVaultPokemon(draftVault, debugAdd.selectedId);
    if (!result.ok) {
      setDebugAdd({...debugAdd, error: result.reason});
      return;
    }
    setDebugAdd(null);
    updateVaultDraft(result.vault, `${result.message} 返回主页时保存。`);
  }

  async function saveAndBack() {
    if (saving) return;
    if (!draftDirty && !playerVaultDirty) {
      onBack();
      return;
    }
    setSaving(true);
    setVaultMessage("保存中...");
    try {
      const saved = await onSavePlayerVault(api.normalizePlayerVault(draftVault));
      setDraftVault(api.normalizePlayerVault(saved));
      setDraftDirty(false);
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

  function handleItemEntrySelect(entry: VaultPageEntry) {
    if (entry.kind === "item") {
      setPokemonDrawerId("");
      setItemDrawerKey(entry.key);
      setVaultMessage("");
    }
  }

  function handlePokemonCellSelect(entry: VaultPageEntry) {
    if (pokemonPageLocked) return;
    if (activeUseItem) {
      handleUseModeCellSelect(entry);
      return;
    }
    if (entry.kind === "pokemon") {
      setItemDrawerKey("");
      setPokemonDrawerId(entry.pokemon.playerPokemonId);
      setVaultMessage("");
    }
  }

  function discardItem(entry: VaultItemEntry) {
    if (activeUseItem) return;
    const itemView = itemRecordView(api, entry.item);
    setConfirmDialog({
      title: "丢弃道具",
      message: `确认丢弃 ${itemView.name} x${entry.item.quantity}？`,
      confirmLabel: "丢弃",
      danger: true,
      onConfirm: () => applyDiscardSelectedItem(entry.key),
    });
  }

  function applyDiscardSelectedItem(entryKey: string) {
    const nextItems = draftVault.items.filter(item => itemRecordKey(item) !== entryKey);
    setItemDrawerKey(current => current === entryKey ? "" : current);
    updateVaultDraft({...draftVault, items: nextItems}, "已丢弃道具，返回主页时保存。");
  }

  function startUsingVaultItem(entry: VaultItemEntry) {
    const detail = safeItemDetail(api, entry.item.itemId);
    if (!detail || !isVaultUsableItemDetail(detail)) {
      showUseNotice("该道具当前不能在仓库中使用。");
      return;
    }
    setItemDrawerKey("");
    setMoveSelect(null);
    setMoveReplace(null);
    setNumericPreview(null);
    setEvolutionPreview(null);
    setActiveUseItem({
      itemKey: entry.key,
      itemId: entry.item.itemId,
      itemName: detail.nameZh || detail.name || entry.item.itemId,
      quantity: entry.item.quantity,
      startedFromTab: "bag",
      startedFromPageIndex: itemPageIndex,
    });
    setVaultMessage(`选择宝可梦使用「${detail.nameZh || detail.name || entry.item.itemId}」。`);
  }

  function applyMoveTeaching(moveSlot: number) {
    if (!moveReplace) return;
    const result = api.applyPlayerVaultMoveTeachingItem({
      vault: draftVault,
      itemKey: moveReplace.itemKey,
      pokemonId: moveReplace.pokemon.playerPokemonId,
      moveId: moveReplace.move.id,
      moveSlot,
    });
    if (!result.ok) {
      setEvolutionPreview(null);
      showUseNotice(result.reason);
      return;
    }
    setMoveSelect(null);
    setMoveReplace(null);
    showUseNotice(result.message, "normal");
    updateVaultAfterUse(result.vault, result.message);
  }

  function openMoveSelectForTarget(itemKey: string, pokemon: PlayerPokemonRecordV4) {
    const view = api.getPlayerVaultMoveTeachingView(draftVault, itemKey, pokemon.playerPokemonId, "");
    if (!view.ok) {
      showUseNotice(view.reason);
      return;
    }
    if (view.unavailableReason || !view.moves.length) {
      showUseNotice(moveTeachingUnavailableMessage(view));
      return;
    }
    setMoveReplace(null);
    setMoveSelect({itemKey, pokemonId: pokemon.playerPokemonId, query: ""});
  }

  function openMoveReplaceFromSelection(view: Extract<ReturnType<ChangeBattleV2Api["getPlayerVaultMoveTeachingView"]>, {ok: true}>, move: DexMoveSummary) {
    setMoveReplace({
      itemKey: moveSelect?.itemKey || itemRecordKey(view.item),
      itemName: view.itemName,
      pokemon: view.pokemon,
      pokemonName: view.pokemonName,
      move,
      currentMoves: view.pokemon.moves.map(record => playerMoveToReplaceMove(api, record.moveId)),
    });
  }

  function handleUseModeCellSelect(entry: VaultPageEntry) {
    if (!activeUseItem) return;
    if (entry.kind !== "pokemon") {
      showUseNotice("请选择一个宝可梦作为目标。");
      return;
    }
    const detail = safeItemDetail(api, activeUseItem.itemId);
    if (!detail || !isVaultUsableItemDetail(detail)) {
      showUseNotice("该道具当前不能继续使用。");
      finishUseMode("已结束使用。");
      return;
    }
    const pokemonName = playerPokemonShortName(api, entry.pokemon);
    if (detail.friendshipEffect || detail.trainingEffect) {
      setEvolutionPreview(null);
      const preview = api.previewPlayerVaultNumericItemUse({vault: draftVault, itemKey: activeUseItem.itemKey, pokemonId: entry.pokemon.playerPokemonId});
      if (!preview.ok) {
        showUseNotice(preview.reason);
        return;
      }
      setNumericPreview(preview);
      return;
    }
    if (detail.moveTeachingEffect || detail.kind === "tm") {
      setNumericPreview(null);
      setEvolutionPreview(null);
      openMoveSelectForTarget(activeUseItem.itemKey, entry.pokemon);
      return;
    }
    if (detail.kind === "evolution") {
      setNumericPreview(null);
      setMoveSelect(null);
      setMoveReplace(null);
      const preview = api.previewPlayerVaultEvolutionItemUse({vault: draftVault, itemKey: activeUseItem.itemKey, pokemonId: entry.pokemon.playerPokemonId});
      if (!preview.ok) {
        showUseNotice(preview.reason);
        return;
      }
      setEvolutionPreview(preview);
      return;
    }
    if (detail.kind === "battle" || detail.kind === "held") {
      const heldItemId = entry.pokemon.heldItemId;
      const heldDetail = heldItemId ? safeItemDetail(api, heldItemId) : null;
      const heldItemName = heldItemId ? heldDetail?.nameZh || heldDetail?.name || heldItemId : "";
      if (!heldItemName) {
        applyHeldItemToPokemon(entry.pokemon.playerPokemonId);
        return;
      }
      setConfirmDialog({
        title: `携带 ${activeUseItem.itemName}`,
        message: `${pokemonName} 已携带 ${heldItemName}，是否交换为 ${activeUseItem.itemName}？`,
        confirmLabel: "交换",
        onConfirm: () => applyHeldItemToPokemon(entry.pokemon.playerPokemonId),
      });
    }
  }

  function applyNumericItem() {
    if (!activeUseItem || !numericPreview) return;
    const result = api.applyPlayerVaultNumericItem({
      vault: draftVault,
      itemKey: activeUseItem.itemKey,
      pokemonId: numericPreview.pokemon.playerPokemonId,
    });
    if (!result.ok) {
      showUseNotice(result.reason);
      return;
    }
    setNumericPreview(null);
    showUseNotice(result.message, "normal");
    updateVaultAfterUse(result.vault, result.message);
  }

  function applyEvolutionItem(toSpeciesId: string) {
    if (!activeUseItem || !evolutionPreview) return;
    const result = api.applyPlayerVaultEvolutionItem({
      vault: draftVault,
      itemKey: activeUseItem.itemKey,
      pokemonId: evolutionPreview.pokemon.playerPokemonId,
      toSpeciesId,
    });
    if (!result.ok) {
      showUseNotice(result.reason);
      return;
    }
    setEvolutionPreview(null);
    showUseNotice(result.message, "normal");
    updateVaultAfterUse(result.vault, result.message);
  }

  function applyHeldItemToPokemon(pokemonId: string) {
    if (!activeUseItem) return;
    const result = api.applyPlayerVaultHeldItem({
      vault: draftVault,
      itemKey: activeUseItem.itemKey,
      pokemonId,
    });
    if (!result.ok) {
      showUseNotice(result.reason);
      return;
    }
    showUseNotice(result.message, "normal");
    updateVaultAfterUse(result.vault, result.message);
  }

  function unequipHeldItemFromPokemon(pokemonId: string) {
    if (activeUseItem) return;
    const result = api.unequipPlayerVaultHeldItem({vault: draftVault, pokemonId});
    if (!result.ok) {
      showUseNotice(result.reason);
      return;
    }
    showUseNotice(result.message, "normal");
    updateVaultDraft(result.vault, `${result.message} 返回主页时保存。`);
  }

  function togglePokemonBattleMarked(pokemonId: string, marked: boolean) {
    if (activeUseItem) return;
    const pokemon = draftVault.pokemon.find(entry => entry.playerPokemonId === pokemonId);
    if (!pokemon) {
      showUseNotice("请选择要标记的宝可梦。");
      return;
    }
    const result = api.setPlayerVaultPokemonBattleMarked({vault: draftVault, pokemonId, marked});
    const pokemonName = playerPokemonShortName(api, pokemon);
    const message = marked ? `${pokemonName} 已标记出战。` : `${pokemonName} 已取消出战。`;
    showUseNotice(message, "normal");
    updateVaultDraft(result, `${message} 返回主页时保存。`);
  }

  function releaseSelectedPokemon(pokemon: PlayerPokemonRecordV4) {
    if (activeUseItem) return;
    const pokemonName = playerPokemonShortName(api, pokemon);
    setConfirmDialog({
      title: "放生宝可梦",
      message: `确认放生 ${pokemonName}？该操作不可撤销。${pokemon.heldItemId ? " 携带道具会尝试放回道具箱。" : ""}`,
      confirmLabel: "放生",
      danger: true,
      onConfirm: () => applyReleaseSelectedPokemon(pokemon.playerPokemonId),
    });
  }

  function applyReleaseSelectedPokemon(pokemonId: string) {
    const result = api.releasePlayerVaultPokemon({vault: draftVault, pokemonId});
    if (!result.ok) {
      showUseNotice(result.reason);
      return;
    }
    setPokemonDrawerId("");
    showUseNotice(result.message, "normal");
    updateVaultDraft(result.vault, `${result.message} 返回主页时保存。`);
  }

  function updateVaultAfterUse(nextVault: PlayerVaultV4, message: string) {
    const normalized = api.normalizePlayerVault(nextVault);
    const nextItem = activeUseItem ? findPlayerVaultItemRecordByKey(normalized, activeUseItem.itemKey) : null;
    setDraftVault(normalized);
    setDraftDirty(true);
    if (activeUseItem && nextItem) {
      setActiveUseItem({...activeUseItem, quantity: nextItem.quantity});
      setVaultMessage(`${message} 可继续选择目标。`);
      return;
    }
    finishUseMode(`${message} 道具已用完。`);
  }

  function finishUseMode(message = "已结束使用。") {
    const useItem = activeUseItem;
    setActiveUseItem(null);
    setItemDrawerKey("");
    setPokemonDrawerId("");
    setMoveSelect(null);
    setMoveReplace(null);
    setNumericPreview(null);
    setEvolutionPreview(null);
    setVaultMessage(message);
    if (!useItem) return;
    setItemPageIndex(useItem.startedFromPageIndex);
  }

  async function unlockCurrentStoragePage(kind: TrainerVaultTab) {
    const locked = kind === "bag" ? itemPageLocked : pokemonPageLocked;
    if (!locked || unlockingKind || saving) return;
    if (draftDirty) {
      showUseNotice("请先保存当前整理结果，再解锁箱子。");
      return;
    }
    if (profileBattlePoints < STORAGE_BOX_UNLOCK_BP_COST) {
      setVaultMessage(`BP 不足，需要 ${STORAGE_BOX_UNLOCK_BP_COST} BP。`);
      return;
    }
    setConfirmDialog({
      title: "解锁箱子",
      message: `确认花费 ${STORAGE_BOX_UNLOCK_BP_COST} BP 解锁这个箱子？`,
      confirmLabel: "解锁",
      onConfirm: () => applyUnlockCurrentStoragePage(kind),
    });
  }

  async function applyUnlockCurrentStoragePage(kind: TrainerVaultTab) {
    setUnlockingKind(kind);
    setVaultMessage("解锁中...");
    try {
      const unlockedVault = await onUnlockStoragePage(kind);
      setDraftVault(api.normalizePlayerVault(unlockedVault));
      setDraftDirty(false);
      setVaultMessage("箱子已解锁。");
    } catch (error) {
      console.error("[TrainerVaultPage] unlock storage page failed", error);
      setVaultMessage(error instanceof Error ? `解锁失败：${error.message}` : "解锁失败。");
    } finally {
      setUnlockingKind("");
    }
  }

  return (
    <section className="trainer-vault-page" aria-label="训练家仓库">
      <video className="trainer-vault-video-bg" autoPlay muted loop playsInline controls={false} aria-hidden="true">
        <source src={assetUrl("title/pokemon-room-bg.mp4")} type="video/mp4" />
      </video>
      <div className="trainer-vault-backdrop" aria-hidden="true" />
      {useNotice ? (
        <VaultUseNotice
          key={useNotice.id}
          message={useNotice.message}
          tone={useNotice.tone}
          onDone={() => setUseNotice(current => current?.id === useNotice.id ? null : current)}
        />
      ) : null}
      <header className="trainer-vault-header">
        <div>
          <span>训练家仓库</span>
          <strong>整理箱</strong>
        </div>
        <div className="trainer-vault-header-actions">
          {debugFeatureEnabled && !activeUseItem ? <button type="button" onClick={() => openDebugAdd("bag")}>新增道具</button> : null}
          {debugFeatureEnabled && !activeUseItem ? <button type="button" onClick={() => openDebugAdd("pokemon")}>新增宝可梦</button> : null}
          <button type="button" onClick={() => void saveAndBack()} disabled={saving}>{saving ? "保存中..." : draftDirty || playerVaultDirty ? "保存并返回" : "返回主页"}</button>
        </div>
      </header>
      <main className="trainer-vault-layout">
        <TrainerVaultBagList
          api={api}
          entries={itemEntries}
          pageIndex={itemPageIndex}
          totalPageCount={itemTotalPageCount}
          locked={itemPageLocked}
          saving={saving}
          unlocking={unlockingKind === "bag"}
          activeUseItem={activeUseItem}
          activeUseItemQuantity={activeUseItemQuantity}
          message={vaultMessage}
          onSelectEntry={handleItemEntrySelect}
          onUseItem={startUsingVaultItem}
          onOpenDetail={(entry) => {
            setPokemonDrawerId("");
            setItemDrawerKey(entry.key);
          }}
          onFinishUse={() => finishUseMode()}
          onUnlock={() => void unlockCurrentStoragePage("bag")}
          onPageChange={setItemPageIndex}
        />
        <TrainerVaultPokemonBox
          api={api}
          entries={pokemonEntries}
          pageIndex={pokemonPageIndex}
          totalPageCount={pokemonTotalPageCount}
          locked={pokemonPageLocked}
          saving={saving}
          unlocking={unlockingKind === "pokemon"}
          useModeActive={Boolean(activeUseItem)}
          onSelectEntry={handlePokemonCellSelect}
          onUnlock={() => void unlockCurrentStoragePage("pokemon")}
          onPageChange={setPokemonPageIndex}
        />
      </main>
      <VaultItemDrawer
        api={api}
        entry={itemDrawerEntry}
        saving={saving}
        useModeActive={Boolean(activeUseItem)}
        message={vaultMessage}
        onClose={() => setItemDrawerKey("")}
        onUseItem={() => itemDrawerEntry ? startUsingVaultItem(itemDrawerEntry) : undefined}
        onDiscard={() => itemDrawerEntry ? discardItem(itemDrawerEntry) : undefined}
      />
      <VaultPokemonDrawer
        api={api}
        entry={pokemonDrawerEntry}
        saving={saving}
        useModeActive={Boolean(activeUseItem)}
        onClose={() => setPokemonDrawerId("")}
        onToggleBattleMarked={togglePokemonBattleMarked}
        onUnequipHeldItem={unequipHeldItemFromPokemon}
        onReleasePokemon={releaseSelectedPokemon}
        onSelectHonorBadge={setSelectedHonorBadge}
      />
      {selectedHonorBadge ? (
        <VaultPokemonHonorBadgeModal badge={selectedHonorBadge} onClose={() => setSelectedHonorBadge(null)} />
      ) : null}
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
      {moveSelect && !moveReplace ? (
        <VaultMoveSelectModal
          api={api}
          vault={draftVault}
          state={moveSelect}
          onStateChange={setMoveSelect}
          onCancel={() => setMoveSelect(null)}
          onSelectMove={openMoveReplaceFromSelection}
        />
      ) : null}
      {moveReplace ? (
        <VaultMoveReplaceModal
          api={api}
          state={moveReplace}
          onBack={() => setMoveReplace(null)}
          onCancel={() => {
            setMoveReplace(null);
            setMoveSelect(null);
          }}
          onConfirm={applyMoveTeaching}
        />
      ) : null}
      {numericPreview ? (
        <VaultNumericPreviewModal
          preview={numericPreview}
          onCancel={() => setNumericPreview(null)}
          onConfirm={applyNumericItem}
        />
      ) : null}
      {evolutionPreview ? (
        <GameEvolutionModal
          open={Boolean(evolutionPreview)}
          fromName={evolutionPreview.fromName}
          displayName={evolutionPreview.pokemonName}
          fromSpriteUrl={evolutionPreview.fromSpriteUrl}
          itemName={evolutionPreview.itemName}
          targets={evolutionModalTargets}
          onCancel={() => setEvolutionPreview(null)}
          onConfirm={applyEvolutionItem}
        />
      ) : null}
      {debugAdd ? (
        <TrainerVaultDebugAddModal
          api={api}
          state={debugAdd}
          onStateChange={setDebugAdd}
          onCancel={() => setDebugAdd(null)}
          onConfirm={applyDebugAdd}
        />
      ) : null}
    </section>
  );
}
