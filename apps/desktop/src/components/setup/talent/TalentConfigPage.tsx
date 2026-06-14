import {useEffect, useMemo, useRef, useState} from "react";
import type {PointerEvent, WheelEvent} from "react";
import type {LocalSave, TalentView} from "@changebattle/shared";
import {TalentBoardCanvas} from "./TalentBoardCanvas";
import {TalentNodeDetailDrawer} from "./TalentNodeDetailDrawer";
import {TalentToolbar} from "./TalentToolbar";
import {TALENT_INITIAL_VIEW, talentDetailModel} from "./talentGraph";
import "./TalentConfigPage.css";

export type TalentConfigPageProps = {
  save: LocalSave | null;
  onSaved: (save: LocalSave) => void;
  onBack: () => void;
  previewCatalog?: TalentView[];
  previewBp?: number;
  previewDetailOpen?: boolean;
  previewSelectedId?: string;
};

export function TalentConfigPage({save, onSaved, onBack, previewCatalog, previewBp, previewDetailOpen = true, previewSelectedId}: TalentConfigPageProps) {
  const [catalog, setCatalog] = useState<TalentView[]>(previewCatalog || []);
  const [selectedId, setSelectedId] = useState(previewSelectedId || "root_trainer_star");
  const [detailOpen, setDetailOpen] = useState(previewDetailOpen);
  const [view, setView] = useState(TALENT_INITIAL_VIEW);
  const dragRef = useRef<{x: number; y: number; originX: number; originY: number} | null>(null);
  const selected = catalog.find(node => node.id === selectedId) || catalog[0];
  const bp = previewBp ?? save?.stats.battle_points ?? 0;
  const nodeById = useMemo(() => new Map(catalog.map(node => [node.id, node])), [catalog]);
  const unlockedCount = catalog.filter(node => Number(node.level || 0) > 0 && node.kind !== "root").length;
  const detail = talentDetailModel(nodeById, selected, bp);

  useEffect(() => {
    if (previewCatalog) {
      setCatalog(previewCatalog);
      setSelectedId(current => previewCatalog.some(node => node.id === current) ? current : previewSelectedId || previewCatalog.find(node => node.id === "root_trainer_star")?.id || previewCatalog[0]?.id || "");
      setDetailOpen(previewDetailOpen);
      return;
    }
    let cancelled = false;
    void window.changeBattle?.getTalentConfig().then(config => {
      if (cancelled) return;
      const nextCatalog = config.catalog || [];
      setCatalog(nextCatalog);
      if (config.save) onSaved(config.save);
      setSelectedId(current => nextCatalog.some(node => node.id === current) ? current : nextCatalog.find(node => node.id === "root_trainer_star")?.id || nextCatalog[0]?.id || "");
    });
    return () => { cancelled = true; };
  }, [onSaved, previewCatalog, previewDetailOpen, previewSelectedId]);

  async function upgradeSelected() {
    if (previewCatalog || !selected || !detail.canUpgrade) return;
    const config = await window.changeBattle?.unlockTalent(selected.id);
    if (!config) return;
    setCatalog(config.catalog || []);
    if (config.save) onSaved(config.save);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    dragRef.current = {x: event.clientX, y: event.clientY, originX: view.x, originY: view.y};
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    setView(current => ({...current, x: drag.originX + event.clientX - drag.x, y: drag.originY + event.clientY - drag.y}));
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function zoomBy(delta: number) {
    setView(current => ({...current, scale: Math.max(0.55, Math.min(1.8, Math.round((current.scale + delta) * 100) / 100))}));
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    zoomBy(delta);
  }

  function selectNode(node: TalentView) {
    setSelectedId(node.id);
    setDetailOpen(true);
  }

  return (
    <div className="talent-config-page">
      <section className="talent-config-board">
        <TalentBoardCanvas catalog={catalog} selectedId={selectedId} view={view} onSelectNode={selectNode} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onWheel={onWheel} />
        <TalentToolbar unlockedCount={unlockedCount} bp={bp} onZoomOut={() => zoomBy(-0.12)} onActualSize={() => setView(current => ({...current, scale: 1}))} onZoomIn={() => zoomBy(0.12)} onReset={() => setView(TALENT_INITIAL_VIEW)} onBack={onBack} />
      </section>
      {detailOpen && selected ? <TalentNodeDetailDrawer node={selected} catalog={catalog} bp={bp} onClose={() => setDetailOpen(false)} onUpgrade={upgradeSelected} /> : null}
    </div>
  );
}
