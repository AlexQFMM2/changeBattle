import type {ChangeBattleV2Api} from "@changebattle-v2/api";
import {PlayerBagItemIcon} from "../training/PlayerBagPanel";
import {isVaultUsableItemDetail, itemRecordView, safeItemDetail, STORAGE_BOX_UNLOCK_BP_COST, type VaultActiveUseItem, type VaultItemEntry} from "./TrainerVaultModel";
import {VaultPagination} from "./VaultPagination";
import "./TrainerVaultBagList.css";

export function TrainerVaultBagList({api, entries, pageIndex, totalPageCount, locked, saving, unlocking, activeUseItem, activeUseItemQuantity, message, onSelectEntry, onUseItem, onOpenDetail, onFinishUse, onUnlock, onPageChange}: {
  api: ChangeBattleV2Api;
  entries: VaultItemEntry[];
  pageIndex: number;
  totalPageCount: number;
  locked: boolean;
  saving: boolean;
  unlocking: boolean;
  activeUseItem: VaultActiveUseItem | null;
  activeUseItemQuantity: number;
  message: string;
  onSelectEntry: (entry: VaultItemEntry) => void;
  onUseItem: (entry: VaultItemEntry) => void;
  onOpenDetail: (entry: VaultItemEntry) => void;
  onFinishUse: () => void;
  onUnlock: () => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <section className={`trainer-vault-bag-list ${activeUseItem ? "using-item" : ""}`} aria-label="背包区域">
      <header>
        <div>
          <small>背包区域</small>
          <strong>我的道具</strong>
        </div>
      </header>
      {activeUseItem ? (
        <div className="trainer-vault-bag-list-use-banner" role="status">
          <span>正在使用：{activeUseItem.itemName} x{activeUseItemQuantity}</span>
          <button type="button" onClick={onFinishUse}>结束使用</button>
        </div>
      ) : null}
      <div className={`trainer-vault-bag-list-rows ${locked ? "locked" : ""}`}>
        {locked ? <div className="trainer-vault-bag-list-lock-badge" aria-hidden="true">LOCK</div> : null}
        {!locked && !entries.length ? <div className="trainer-vault-bag-list-empty">这一页没有道具</div> : null}
        {entries.map(entry => (
          <TrainerVaultItemRow
            api={api}
            entry={entry}
            saving={saving}
            activeUseItem={Boolean(activeUseItem)}
            onSelect={() => onSelectEntry(entry)}
            onUseItem={() => onUseItem(entry)}
            onOpenDetail={() => onOpenDetail(entry)}
            key={entry.key}
          />
        ))}
      </div>
      {message ? <span className="trainer-vault-bag-list-message">{message}</span> : null}
      <VaultPagination
        locked={locked}
        pageIndex={pageIndex}
        totalPageCount={totalPageCount}
        unlockLabel={unlocking ? "解锁中..." : `解锁 ${STORAGE_BOX_UNLOCK_BP_COST} BP`}
        disabled={saving || unlocking}
        onUnlock={onUnlock}
        onPageChange={onPageChange}
      />
    </section>
  );
}

function TrainerVaultItemRow({api, entry, saving, activeUseItem, onSelect, onUseItem, onOpenDetail}: {
  api: ChangeBattleV2Api;
  entry: VaultItemEntry;
  saving: boolean;
  activeUseItem: boolean;
  onSelect: () => void;
  onUseItem: () => void;
  onOpenDetail: () => void;
}) {
  const itemView = itemRecordView(api, entry.item, {preferSpriteIcon: true});
  const canUseInVault = isVaultUsableItemDetail(safeItemDetail(api, entry.item.itemId));
  return (
    <div className="trainer-vault-bag-list-row">
      <button className="trainer-vault-bag-list-row-main" type="button" title={itemView.name} onClick={onSelect}>
        <span className="trainer-vault-bag-list-item-icon"><PlayerBagItemIcon api={api} item={itemView.iconItem} /></span>
        <strong>{itemView.name}</strong>
        <i>x{entry.item.quantity}</i>
      </button>
      <button type="button" disabled={saving || activeUseItem || !canUseInVault} onClick={onUseItem}>使用</button>
      <button type="button" disabled={saving} onClick={onOpenDetail}>详情</button>
    </div>
  );
}
