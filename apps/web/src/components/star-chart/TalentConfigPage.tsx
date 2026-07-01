import {useEffect, useMemo, useRef, useState} from "react";
import type {PointerEvent, WheelEvent} from "react";
import type {ChangeBattleV2Api, StarChartNodeViewV4, UserProfileV2} from "@changebattle-v2/api";
import {TalentBoardCanvas} from "./TalentBoardCanvas";
import {TalentNodeDetailDrawer} from "./TalentNodeDetailDrawer";
import {TalentToolbar} from "./TalentToolbar";
import {TALENT_INITIAL_VIEW, talentDetailModel} from "./talentGraph";
import "./TalentConfigPage.css";

export type TalentConfigPageProps = {
  api: ChangeBattleV2Api;
  profile: UserProfileV2;
  onProfileChange: (profile: UserProfileV2) => void;
  onBack: () => void;
  previewCatalog?: StarChartNodeViewV4[];
  previewBp?: number;
  previewDetailOpen?: boolean;
  previewSelectedId?: string;
};

export function TalentConfigPage({api, profile, onProfileChange, onBack, previewCatalog, previewBp, previewDetailOpen = true, previewSelectedId}: TalentConfigPageProps) {
  const [catalog, setCatalog] = useState<StarChartNodeViewV4[]>(previewCatalog || api.getStarChartCatalog(profile));
  const [selectedId, setSelectedId] = useState(previewSelectedId || "root_trainer_star");
  const [detailOpen, setDetailOpen] = useState(previewDetailOpen);
  const [view, setView] = useState(TALENT_INITIAL_VIEW);
  const dragRef = useRef<{x: number; y: number; originX: number; originY: number} | null>(null);
  const selected = catalog.find(node => node.id === selectedId) || catalog[0];
  const bp = previewBp ?? profile.battlePoints ?? 0;
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
    const nextCatalog = api.getStarChartCatalog(profile);
    setCatalog(nextCatalog);
    setSelectedId(current => nextCatalog.some(node => node.id === current) ? current : nextCatalog.find(node => node.id === "root_trainer_star")?.id || nextCatalog[0]?.id || "");
  }, [api, profile, previewCatalog, previewDetailOpen, previewSelectedId]);

  async function upgradeSelected() {
    if (previewCatalog || !selected || !detail.canUpgrade) return;
    const nextProfile = await api.unlockStarChartNode(profile, selected.id);
    onProfileChange(nextProfile);
    setCatalog(api.getStarChartCatalog(nextProfile));
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
    const delta = event.deltaY > 0 ? -0.08 : 0.08;
    zoomBy(delta);
  }

  function selectNode(node: StarChartNodeViewV4) {
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
