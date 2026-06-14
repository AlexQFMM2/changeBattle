import "./RouteTransitionCopyPanel.css";

export function RouteTransitionCopyPanel({title, detail, tip}: {title: string; detail: string; tip: string}) {
  return (
    <section className="route-transition-loading">
      <div className="route-transition-copy">
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <div className="route-transition-progress" aria-label="加载进度">
        <span />
      </div>
      <p className="route-transition-tip">
        <strong>提示</strong>
        <span>{tip}</span>
      </p>
    </section>
  );
}
