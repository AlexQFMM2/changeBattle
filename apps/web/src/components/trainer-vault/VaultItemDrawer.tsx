import {useMemo} from "react";
import type {ChangeBattleV2Api} from "@changebattle-v2/api";
import {GameDrawer} from "../shared/GameDrawer";
import {PlayerBagItemIcon} from "../training/PlayerBagPanel";
import {isVaultUsableItemDetail, itemRecordView, safeItemDetail, type VaultItemEntry} from "./TrainerVaultModel";
import "./VaultItemDrawer.css";

export function VaultItemDrawer({api, entry, saving, useModeActive, message, onClose, onUseItem, onDiscard}: {
  api: ChangeBattleV2Api;
  entry: VaultItemEntry | null;
  saving: boolean;
  useModeActive: boolean;
  message: string;
  onClose: () => void;
  onUseItem: () => void;
  onDiscard: () => void;
}) {
  const selectedItemId = entry?.item.itemId || "";
  const selectedItemQuantity = entry?.item.quantity || 0;
  const itemView = useMemo(() => entry ? itemRecordView(api, entry.item) : null, [api, entry, selectedItemId, selectedItemQuantity]);
  const canUseInVault = useMemo(() => entry ? isVaultUsableItemDetail(safeItemDetail(api, entry.item.itemId)) : false, [api, entry, selectedItemId]);
  const item = entry?.item;
  return (
    <GameDrawer open={Boolean(entry && itemView && item)} placement="right" title="道具详情" width={220} onClose={onClose}>
      {entry && itemView && item ? (
        <section className="vault-item-drawer">
          <div className="vault-item-drawer-hero">
            <PlayerBagItemIcon api={api} item={itemView.iconItem} />
            <div>
              <strong>{itemView.name}</strong>
              <span>{itemView.kindLabel}</span>
            </div>
          </div>
          <dl>
            <div><dt>来源</dt><dd>{item.sourceKind === "debug" ? "调试道具" : "道具存储箱"}</dd></div>
            {item.sourceKind === "debug" ? <div><dt>标记</dt><dd>调试道具</dd></div> : null}
            <div><dt>数量</dt><dd>{item.quantity}</dd></div>
            <div><dt>编号</dt><dd>{item.itemId}</dd></div>
          </dl>
          {!useModeActive ? (
            <div className="vault-item-drawer-actions">
              {canUseInVault ? <button type="button" onClick={onUseItem} disabled={saving}>使用</button> : null}
              <button type="button" onClick={onDiscard} disabled={saving}>丢弃</button>
            </div>
          ) : null}
          {message ? <span className="vault-item-drawer-message">{message}</span> : null}
          <p>{itemView.description || "暂无说明。"}</p>
        </section>
      ) : null}
    </GameDrawer>
  );
}
