import type {CSSProperties, PointerEvent, WheelEvent} from "react";
import type {StarChartNodeViewV4} from "@changebattle-v2/api";
import {talentGraphBounds, talentLinkPath, talentNodeLevel, talentNodePoint, talentNodeState, talentRouteClass, type TalentViewState} from "./talentGraph";
import "./TalentBoardCanvas.css";

export function TalentBoardCanvas({catalog, selectedId, view, onSelectNode, onPointerDown, onPointerMove, onPointerUp, onWheel}: {catalog: StarChartNodeViewV4[]; selectedId: string; view: TalentViewState; onSelectNode: (node: StarChartNodeViewV4) => void; onPointerDown: (event: PointerEvent<HTMLDivElement>) => void; onPointerMove: (event: PointerEvent<HTMLDivElement>) => void; onPointerUp: (event: PointerEvent<HTMLDivElement>) => void; onWheel: (event: WheelEvent<HTMLDivElement>) => void}) {
  const nodeById = new Map(catalog.map(node => [node.id, node]));
  const graphBounds = talentGraphBounds(catalog);
  const graphWidth = graphBounds.maxX - graphBounds.minX;
  const graphHeight = graphBounds.maxY - graphBounds.minY;
  const nodePoints = new Map(catalog.map((node, index) => [node.id, talentNodePoint(catalog, node, index)]));

  return (
    <div className="talent-board-canvas" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}>
      <div
        className="talent-board-canvas-inner"
        style={{
          width: graphWidth,
          height: graphHeight,
          left: `calc(50% + ${view.x}px)`,
          top: `calc(50% + ${view.y}px)`,
          transform: `translate(-50%, -50%) scale(${view.scale})`,
        }}
      >
        <svg className="talent-board-links" viewBox={`${graphBounds.minX} ${graphBounds.minY} ${graphWidth} ${graphHeight}`} aria-hidden="true">
          {catalog.flatMap(node => (node.requires || []).map(requirement => {
            const from = nodeById.get(requirement.id);
            if (!from) return null;
            const requirementMet = talentNodeLevel(nodeById, from.id) >= Math.max(1, Number(requirement.level || 1));
            const childActive = talentNodeLevel(nodeById, node.id) > 0;
            const stateClass = childActive ? "active" : requirementMet ? "available" : "locked";
            return (
              <path
                className={`${stateClass} ${requirement.id === "root_trainer_star" ? "trunk" : "branch"}`}
                d={talentLinkPath(nodePoints.get(from.id) || from, nodePoints.get(node.id) || node)}
                key={`${from.id}-${node.id}-${requirement.level || 1}`}
              />
            );
          }))}
        </svg>
        {catalog.map(node => {
          const level = talentNodeLevel(nodeById, node.id);
          const max = Math.max(1, Number(node.max_level || 1));
          const point = nodePoints.get(node.id) || {x: Number(node.x || 0), y: Number(node.y || 0)};
          return (
            <button
              className={`talent-board-node ${talentRouteClass(node.category)} ${talentNodeState(nodeById, node)} ${selectedId === node.id ? "selected" : ""}`}
              style={{
                left: point.x - graphBounds.minX,
                top: point.y - graphBounds.minY,
                "--progress": `${max ? Math.max(0, Math.min(1, level / max)) : 0}`,
                "--progress-pct": `${max ? Math.max(0, Math.min(100, (level / max) * 100)) : 0}%`,
              } as CSSProperties}
              title={`${node.name} Lv${level}/${max}`}
              aria-label={`${node.name} Lv${level}/${max}`}
              onClick={() => onSelectNode(node)}
              key={node.id}
            />
          );
        })}
      </div>
    </div>
  );
}
