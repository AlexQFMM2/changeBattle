import "./RestHeader.css";

export type RestHeaderToolItem = {
  id: string;
  label: string;
  badge?: string;
  selected?: boolean;
};

export function RestHeader({battleNo, battles, wins, coins, tools = [], nextDisabled, nextTitle, onOpenCoinLedger, onAbort, onNext, onSelectTool}: {battleNo: number; battles: number; wins: number; coins: number; tools?: RestHeaderToolItem[]; nextDisabled?: boolean; nextTitle?: string; onOpenCoinLedger: () => void; onAbort: () => void; onNext: () => void; onSelectTool?: (id: string) => void}) {
  return (
    <header className="rest-header">
      <div className="rest-header-title">
        <h2>休整菜单</h2>
        {tools.length ? (
          <nav className="rest-header-tools" aria-label="常用休整工具">
            {tools.map(tool => (
              <button className={tool.selected ? "selected" : ""} type="button" onClick={() => onSelectTool?.(tool.id)} key={tool.id}>
                {tool.label}
                {tool.badge ? <small>{tool.badge}</small> : null}
              </button>
            ))}
          </nav>
        ) : null}
      </div>
      <div className="rest-header-stats" aria-label="本局状态">
        <span>第 {battleNo}/{battles} 场后</span>
        <span>连胜 {wins}</span>
        <button className="coin-ledger-trigger" type="button" onClick={onOpenCoinLedger}>金币 {coins}</button>
      </div>
      <div className="rest-header-actions">
        <button className="danger-button" type="button" onClick={onAbort}>中断挑战</button>
        <button type="button" disabled={nextDisabled} title={nextTitle} onClick={onNext}>下一场</button>
      </div>
    </header>
  );
}
