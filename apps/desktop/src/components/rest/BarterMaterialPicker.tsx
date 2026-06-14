import {useState} from "react";
import {motion} from "motion/react";
import type {RestState, ShopOffer} from "@changebattle/shared";
import {ItemIcon, coinCostLabel} from "../../lib/ui";
import {PokopiaModal, pokopiaItemVariants} from "../motion/PokopiaModal";
import "./BarterMaterialPicker.css";

export function BarterMaterialPicker({rest, offer, onClose, onBuy}: {rest: RestState; offer: ShopOffer; onClose: () => void; onBuy: (offerId: string, itemIds: string[]) => void | Promise<void>}) {
  const items = Object.values(rest.bag_categories || {consumable: [], held: [], tm: []}).flat().filter(isBarterMaterialItem);
  const [selected, setSelected] = useState<string[]>([]);
  const counts = selected.reduce<Record<string, number>>((acc, id) => ({...acc, [id]: Number(acc[id] || 0) + 1}), {});
  const value = selected.reduce((sum, id) => sum + Number(items.find(item => item.id === id)?.sell_price || 0), 0);
  const required = Math.ceil(Number(offer.cost || 0) * 0.7);

  function toggle(id: string, maxCount: number) {
    setSelected(current => {
      const picked = current.filter(value => value === id).length;
      if (current.length >= 3 || picked >= maxCount) return current;
      return [...current, id];
    });
  }

  return (
    <PokopiaModal className="barter-buy-modal" labelledBy="barter-buy-title" onClose={onClose}>
      {requestClose => (
        <motion.section className="barter-material-picker" variants={pokopiaItemVariants}>
          <header>
            <div><h2 id="barter-buy-title">以物易物</h2><p>{offer.name_zh || offer.name} 需要材料估值至少 {coinCostLabel(required)}，不找零。</p></div>
            <button type="button" onClick={() => requestClose()}>关闭</button>
          </header>
          <div className="barter-material-list">
            {items.length ? items.map(item => {
              const picked = Number(counts[item.id] || 0);
              return (
                <button className={picked ? "selected" : ""} type="button" disabled={selected.length >= 3 && !picked} onClick={() => toggle(item.id, item.count)} key={`barter-${item.id}`}>
                  <ItemIcon item={item} />
                  <span><strong>{item.name_zh || item.name}</strong><small>x{item.count}　估值 {coinCostLabel(item.sell_price || 0)}{picked ? `　已选 ${picked}` : ""}</small></span>
                </button>
              );
            }) : <p>背包里没有可交换的道具。</p>}
          </div>
          <footer className="command-row">
            <span>当前估值 {coinCostLabel(value)}</span>
            <button type="button" disabled={!selected.length} onClick={() => setSelected([])}>清空</button>
            <button type="button" disabled={!selected.length || value < required} onClick={() => onBuy(offer.offer_id, selected)}>确认交换</button>
          </footer>
        </motion.section>
      )}
    </PokopiaModal>
  );
}

function isBarterMaterialItem(item?: {count?: number; locked?: boolean; item_battle_system?: string} | null): boolean {
  return Boolean(item && Number(item.count || 0) > 0 && !item.locked && !item.item_battle_system);
}
