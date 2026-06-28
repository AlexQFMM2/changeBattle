import "./ScoutControls.css";

export function ScoutControls({onBack, onReroll, onSingleReroll, onInspect, wholeRerollsRemaining = 0, singleRerollsRemaining = 0, inspectRemaining = 0, inspected = false}: {onBack?: () => void | Promise<void>; onReroll?: () => void | Promise<void>; onSingleReroll?: () => void | Promise<void>; onInspect?: () => void; wholeRerollsRemaining?: number; singleRerollsRemaining?: number; inspectRemaining?: number; inspected?: boolean}) {
  return (
    <section className="scout-controls" aria-label="开局能力">
      <header>
        <strong>小道消息</strong>
        <span>次数会立即消耗</span>
      </header>
      <div className="scout-controls-buttons">
        {onBack ? <button type="button" onClick={() => void onBack()}>返回</button> : null}
        <button type="button" disabled={!onReroll || wholeRerollsRemaining <= 0} onClick={() => void onReroll?.()}>换人 {wholeRerollsRemaining}</button>
        <button type="button" disabled={!onSingleReroll || singleRerollsRemaining <= 0} onClick={() => void onSingleReroll?.()}>发功 {singleRerollsRemaining}</button>
        <button type="button" disabled={!onInspect || inspectRemaining <= 0 || inspected} onClick={() => onInspect?.()}>{inspected ? "已验牌" : `验牌 ${inspectRemaining}`}</button>
      </div>
    </section>
  );
}
