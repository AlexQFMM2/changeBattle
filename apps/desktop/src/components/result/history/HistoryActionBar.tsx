import "./HistoryActionBar.css";

export type HistoryActionBarProps = {
  title?: string;
  subtitle?: string;
  status?: string;
  tone?: "normal" | "loading" | "error";
  onBack: () => void;
};

export function HistoryActionBar({title = "战绩", subtitle = "查看历史挑战的完整结算记录。", status = "RECORDS", tone = "normal", onBack}: HistoryActionBarProps) {
  return (
    <header className={`history-action-bar ${tone}`}>
      <div>
        <span>{status}</span>
        <strong>{title}</strong>
        <p>{subtitle}</p>
      </div>
      <button onClick={onBack} type="button">返回主界面</button>
    </header>
  );
}
