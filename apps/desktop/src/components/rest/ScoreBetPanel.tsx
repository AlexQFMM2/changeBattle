import {useEffect, useState} from "react";
import type {RestScoreBetTarget, RestState} from "@changebattle/shared";
import type {RestActionHandler} from "./restActionTypes";
import "./ScoreBetPanel.css";

export function ScoreBetPanel({rest, onClose, onAction, embedded = false}: {rest: RestState; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const bet = rest.score_bet;
  const [draftStake, setDraftStake] = useState(String(bet?.stake || 100));
  useEffect(() => {
    setDraftStake(String(bet?.stake || 100));
  }, [bet?.stake]);

  const content = (
    <section className={`score-bet-panel ${bet ? "" : "empty"}`}>
      <header>
        <div>
          <h2>重金下注</h2>
          <p>{bet ? "精确命中下一战比分才返还，赢多赢少都算没中。" : "当前没有进行中的盘口。"}</p>
        </div>
        <button type="button" onClick={onClose}>返回</button>
      </header>
      {bet ? <ScoreBetContent bet={bet} draftStake={draftStake} onDraftStake={setDraftStake} onAction={onAction} /> : <p className="score-bet-empty">等待随机事件提供下注盘口。</p>}
    </section>
  );
  return embedded ? content : <div className="modal-layer">{content}</div>;
}

function ScoreBetContent({bet, draftStake, onDraftStake, onAction}: {bet: NonNullable<RestState["score_bet"]>; draftStake: string; onDraftStake: (value: string) => void; onAction: RestActionHandler}) {
  const targets: Array<{value: RestScoreBetTarget; label: string}> = [
    {value: 3, label: "3:0"},
    {value: 2, label: "2:0"},
    {value: 1, label: "1:0"},
  ];
  const multiplierOptions = bet.multiplier_options?.length ? bet.multiplier_options : [1.5, 2, 3, 5];
  const maxStake = Math.max(100, Number(bet.max_stake || bet.stake || 100));
  const numericDraft = Math.max(100, Math.min(maxStake, Math.floor(Number(draftStake || bet.stake || 100))));
  const payout = bet.payout || Math.floor(bet.stake * bet.multiplier);

  function adjustStake(delta: number) {
    const nextStake = Math.max(100, Math.min(maxStake, Math.floor(Number(bet.stake || 100) + delta)));
    onDraftStake(String(nextStake));
    void onAction({type: "event_score_bet_adjust", stake: nextStake}, "下注已调整");
  }

  function applyStake() {
    onDraftStake(String(numericDraft));
    void onAction({type: "event_score_bet_adjust", stake: numericDraft}, "下注已调整");
  }

  return (
    <>
      <div className="score-bet-summary">
        <article><span>盘口</span><strong>{bet.target_alive}:0</strong><small>只押自己赢</small></article>
        <article><span>下注</span><strong>{bet.stake}</strong><small>最高 {maxStake}</small></article>
        <article><span>返还</span><strong>{payout}</strong><small>{bet.multiplier}x</small></article>
      </div>
      <div className="score-bet-option-row">
        {targets.map(target => (
          <button className={bet.target_alive === target.value ? "selected" : ""} type="button" onClick={() => onAction({type: "event_score_bet_adjust", targetAlive: target.value}, `盘口已改为 ${target.label}`)} key={`score-bet-target-${target.value}`}>
            {target.label}
          </button>
        ))}
      </div>
      <div className="score-bet-option-row odds">
        {multiplierOptions.map(multiplier => (
          <button className={Math.abs(Number(bet.multiplier || 0) - multiplier) < 0.001 ? "selected" : ""} type="button" onClick={() => onAction({type: "event_score_bet_adjust", multiplier}, `赔率已改为 ${multiplier}x`)} key={`score-bet-multiplier-${multiplier}`}>
            {multiplier}x
          </button>
        ))}
      </div>
      <div className="score-bet-controls">
        <button type="button" disabled={bet.stake <= 100} onClick={() => adjustStake(-100)}>-100</button>
        <input type="number" min={100} max={maxStake} step={100} value={draftStake} onChange={event => onDraftStake(event.target.value)} onBlur={applyStake} />
        <button type="button" disabled={bet.stake >= maxStake} onClick={() => adjustStake(100)}>+100</button>
        <button type="button" onClick={applyStake}>调整</button>
      </div>
    </>
  );
}
