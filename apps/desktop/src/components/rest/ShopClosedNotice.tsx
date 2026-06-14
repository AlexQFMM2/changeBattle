import "./ShopClosedNotice.css";

type ShopClosedNoticeProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onBack: () => void;
};

export function ShopClosedNotice({title = "商店已被彩虹火箭队成员占领", message = "普通商店暂时关闭。请优先处理工厂支援、技能服务和下一场战斗。", actionLabel = "返回", onBack}: ShopClosedNoticeProps) {
  return (
    <div className="shop-closed-notice">
      <section>
        <strong>{title}</strong>
        <p>{message}</p>
        <button type="button" onClick={onBack}>{actionLabel}</button>
      </section>
    </div>
  );
}
