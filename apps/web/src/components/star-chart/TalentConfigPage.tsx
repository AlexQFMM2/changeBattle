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
  onSaveAndBack: (profile: UserProfileV2) => Promise<void>;
  onBack: () => void;
  previewCatalog?: StarChartNodeViewV4[];
  previewBp?: number;
  previewDetailOpen?: boolean;
  previewSelectedId?: string;
};

export function TalentConfigPage({api, profile, onSaveAndBack, onBack, previewCatalog, previewBp, previewDetailOpen = true, previewSelectedId}: TalentConfigPageProps) {
  const [draftProfile, setDraftProfile] = useState(profile);
  const [catalog, setCatalog] = useState<StarChartNodeViewV4[]>(previewCatalog || api.getStarChartCatalog(profile));
  const [selectedId, setSelectedId] = useState(previewSelectedId || "root_trainer_star");
  const [detailOpen, setDetailOpen] = useState(previewDetailOpen);
  const [view, setView] = useState(TALENT_INITIAL_VIEW);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "error">("idle");
  const [statusText, setStatusText] = useState("");
  const dragRef = useRef<{x: number; y: number; originX: number; originY: number} | null>(null);
  const selected = catalog.find(node => node.id === selectedId) || catalog[0];
  const bp = previewBp ?? draftProfile.battlePoints ?? 0;
  const nodeById = useMemo(() => new Map(catalog.map(node => [node.id, node])), [catalog]);
  const unlockedCount = catalog.filter(node => Number(node.level || 0) > 0 && node.kind !== "root").length;
  const detail = talentDetailModel(nodeById, selected, bp);
  const busy = saveState === "saving";

  useEffect(() => {
    if (previewCatalog) {
      setCatalog(previewCatalog);
      setSelectedId(current => previewCatalog.some(node => node.id === current) ? current : previewSelectedId || previewCatalog.find(node => node.id === "root_trainer_star")?.id || previewCatalog[0]?.id || "");
      setDetailOpen(previewDetailOpen);
      return;
    }
    setDraftProfile(profile);
    setSaveState("idle");
    setStatusText("");
    const nextCatalog = api.getStarChartCatalog(profile);
    setCatalog(nextCatalog);
    setSelectedId(current => nextCatalog.some(node => node.id === current) ? current : nextCatalog.find(node => node.id === "root_trainer_star")?.id || nextCatalog[0]?.id || "");
  }, [api, profile.id, previewCatalog, previewDetailOpen, previewSelectedId]);

  function upgradeSelected() {
    if (previewCatalog || busy || !selected || !detail.canUpgrade) return;
    const nextProfile = api.draftUnlockStarChartNode(draftProfile, selected.id);
    setDraftProfile(nextProfile);
    setCatalog(api.getStarChartCatalog(nextProfile));
    setSaveState("idle");
    setStatusText("");
  }

  function clearUnlocks() {
    if (previewCatalog || busy) return;
    const nextProfile = api.clearStarChartUnlocks(draftProfile);
    setDraftProfile(nextProfile);
    const nextCatalog = api.getStarChartCatalog(nextProfile);
    setCatalog(nextCatalog);
    setSelectedId(current => nextCatalog.some(node => node.id === current) ? current : "root_trainer_star");
    setSaveState("idle");
    setStatusText("已清空点亮节点，BP 已返还。");
  }

  async function saveAndBack() {
    if (previewCatalog) {
      onBack();
      return;
    }
    if (busy) return;
    setSaveState("saving");
    setStatusText("正在保存星图...");
    try {
      await onSaveAndBack(draftProfile);
    } catch (error) {
      setSaveState("error");
      setStatusText(error instanceof Error ? `保存失败：${error.message}` : "保存失败。");
    }
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
        <TalentToolbar unlockedCount={unlockedCount} bp={bp} statusText={statusText} busy={busy} onZoomOut={() => zoomBy(-0.12)} onActualSize={() => setView(TALENT_INITIAL_VIEW)} onZoomIn={() => zoomBy(0.12)} onClear={clearUnlocks} onBack={saveAndBack} />
      </section>
      {detailOpen && selected ? <TalentNodeDetailDrawer node={selected} catalog={catalog} bp={bp} busy={busy} onClose={() => setDetailOpen(false)} onUpgrade={upgradeSelected} /> : null}
    </div>
  );
}
