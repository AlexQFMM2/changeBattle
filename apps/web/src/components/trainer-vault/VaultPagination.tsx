import {STORAGE_BOX_UNLOCK_BP_COST} from "./TrainerVaultModel";
import "./VaultPagination.css";

export function VaultPagination({locked, pageIndex, totalPageCount, unlockLabel, disabled, onUnlock, onPageChange}: {
  locked: boolean;
  pageIndex: number;
  totalPageCount: number;
  unlockLabel?: string;
  disabled: boolean;
  onUnlock: () => void;
  onPageChange: (page: number) => void;
}) {
  return (
    <footer className="vault-pagination">
      <button type="button" disabled={pageIndex <= 0} onClick={() => onPageChange(Math.max(0, pageIndex - 1))}>上一页</button>
      {locked
        ? <button className="vault-pagination-unlock" type="button" disabled={disabled} onClick={onUnlock}>{unlockLabel || `解锁 ${STORAGE_BOX_UNLOCK_BP_COST} BP`}</button>
        : <span>{pageIndex + 1}/{totalPageCount}</span>}
      <button type="button" disabled={pageIndex >= totalPageCount - 1} onClick={() => onPageChange(Math.min(totalPageCount - 1, pageIndex + 1))}>下一页</button>
    </footer>
  );
}
