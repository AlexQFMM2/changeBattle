import {useMemo, useState} from "react";
import type {ChangeBattleV2Api} from "@changebattle-v2/api";
import {COMPONENT_PREVIEWS} from "./componentCatalog";
import "./ComponentGalleryPage.css";

export function ComponentGalleryPage({api, onBack}: {api: ChangeBattleV2Api; onBack: () => void}) {
  const [selectedId, setSelectedId] = useState(COMPONENT_PREVIEWS[0]?.id || "");
  const selected = useMemo(
    () => COMPONENT_PREVIEWS.find(entry => entry.id === selectedId) || COMPONENT_PREVIEWS[0],
    [selectedId],
  );

  return (
    <section className="component-gallery-page" aria-label="组件预览">
      <div className="component-gallery-stage">
        {selected ? selected.render(api) : null}
      </div>
      <aside className="component-gallery-toolbar" aria-label="组件列表">
        <header>
          <strong>查看组件</strong>
          <button type="button" onClick={onBack}>返回</button>
        </header>
        <div className="component-gallery-list">
          {COMPONENT_PREVIEWS.map(entry => (
            <button className={entry.id === selected?.id ? "active" : ""} type="button" onClick={() => setSelectedId(entry.id)} key={entry.id}>
              <strong>{entry.title}</strong>
              <span>{entry.description}</span>
            </button>
          ))}
        </div>
      </aside>
    </section>
  );
}
