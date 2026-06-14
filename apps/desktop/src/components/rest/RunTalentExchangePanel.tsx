import {useState} from "react";
import type {RestState} from "@changebattle/shared";
import type {RestActionHandler} from "./restActionTypes";
import "./RunTalentExchangePanel.css";

export function RunTalentExchangePanel({rest, disabled, onAction}: {rest: RestState; disabled?: boolean; onAction: RestActionHandler}) {
  const [bpAmount, setBpAmount] = useState(1);
  const safeAmount = Math.max(1, Math.min(99, Math.floor(Number(bpAmount || 1))));
  return (
    <div className="run-talent-exchange-panel">
      <div className="run-talent-exchange-copy">
        <strong>BP 兑换金币</strong>
        <span>当前 BP {Number(rest.battle_points || 0)}，按 1 BP = 50 金币兑换救急资金。</span>
      </div>
      <label>
        <span>兑换 BP</span>
        <input type="number" min={1} max={99} value={safeAmount} disabled={disabled} onChange={event => setBpAmount(Math.max(1, Math.min(99, Math.floor(Number(event.target.value || 1)))))} />
      </label>
      <button type="button" disabled={disabled} onClick={() => onAction({type: "bp_to_coins", bp: safeAmount})}>
        兑换 {safeAmount * 50} 金币
      </button>
    </div>
  );
}
