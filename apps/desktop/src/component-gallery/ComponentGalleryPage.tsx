import {useMemo, useState} from "react";
import type {CSSProperties} from "react";
import {componentRegistry} from "./componentRegistry";
import "./ComponentGalleryPage.css";

export function ComponentGalleryPage({onBack}: {onBack?: () => void}) {
  const [selectedId, setSelectedId] = useState(componentRegistry[0]?.id || "");
  const selected = useMemo(() => componentRegistry.find(entry => entry.id === selectedId) || componentRegistry[0], [selectedId]);
  const [stateId, setStateId] = useState(selected?.states[0]?.id || "");
  const [previewKey, setPreviewKey] = useState(0);
  const activeStateId = selected?.states.some(state => state.id === stateId) ? stateId : selected?.states[0]?.id || "";
  const selectedIndex = Math.max(0, componentRegistry.findIndex(entry => entry.id === selected.id));
  const hasMultipleComponents = componentRegistry.length > 1;

  function selectComponent(id: string) {
    const next = componentRegistry.find(entry => entry.id === id);
    setSelectedId(id);
    setStateId(next?.states[0]?.id || "");
    setPreviewKey(value => value + 1);
  }

  function moveComponent(direction: -1 | 1) {
    if (!hasMultipleComponents) return;
    const nextIndex = (selectedIndex + direction + componentRegistry.length) % componentRegistry.length;
    const next = componentRegistry[nextIndex];
    if (next) selectComponent(next.id);
  }

  if (!selected) {
    return (
      <section className="component-gallery-page">
        <div className="component-gallery-empty">暂无注册组件。</div>
      </section>
    );
  }

  return (
    <section className="component-gallery-page">
      {onBack ? <button className="component-gallery-back" type="button" onClick={onBack}>返回</button> : null}
      <header className="component-gallery-heading">
        <button className="component-gallery-arrow component-gallery-arrow-left" type="button" disabled={!hasMultipleComponents} aria-label="上一个组件" onClick={() => moveComponent(-1)} />
        <div className="component-gallery-title">
          <span>组件名：</span>
          <strong>{selected.name}</strong>
          <small>{selectedIndex + 1}/{componentRegistry.length} · {selected.group} · {selected.id}</small>
        </div>
        <button className="component-gallery-arrow component-gallery-arrow-right" type="button" disabled={!hasMultipleComponents} aria-label="下一个组件" onClick={() => moveComponent(1)} />
      </header>
      <nav className="component-gallery-state-row" aria-label="组件状态">
        {selected.states.map(state => (
          <button className={state.id === activeStateId ? "selected" : ""} type="button" onClick={() => { setStateId(state.id); setPreviewKey(value => value + 1); }} key={state.id}>
            {state.name}
          </button>
        ))}
      </nav>
      <section className="component-gallery-preview" aria-label="组件实现">
        <div className="component-gallery-preview-label">组件实现</div>
        <div className="component-gallery-preview-canvas" style={{"--component-gallery-preview-width": `${selected.defaultSize.width}px`, "--component-gallery-preview-height": `${selected.defaultSize.height}px`} as CSSProperties}>
            <div className="component-gallery-preview-remount" key={`${selected.id}-${activeStateId}-${previewKey}`}>
              {selected.renderPreview(activeStateId)}
            </div>
        </div>
      </section>
      <section className="component-gallery-meta" aria-label="组件信息">
        <p><b>组件文件:</b><span>{selected.componentFile}</span></p>
        <p><b>样式文件:</b><span>{selected.cssFile}</span></p>
        <p><b>组件专属css变量前缀:</b><span>{selected.cssVariablePrefix}</span></p>
        <p><b>引用组件:</b><span>{selected.dependencies.length ? selected.dependencies.join(", ") : "无"}</span></p>
      </section>
    </section>
  );
}
