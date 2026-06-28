import type {StarChartNodeViewV4} from "@changebattle-v2/api";
import {motion} from "motion/react";
import {talentDetailModel, talentNodeLevel, talentRequirementText} from "./talentGraph";
import "./TalentNodeDetailDrawer.css";

export function TalentNodeDetailDrawer({node, catalog, bp, onClose, onUpgrade}: {node: StarChartNodeViewV4; catalog: StarChartNodeViewV4[]; bp: number; onClose: () => void; onUpgrade: () => void}) {
  const nodeById = new Map(catalog.map(entry => [entry.id, entry]));
  const detail = talentDetailModel(nodeById, node, bp);
  const requirements = node.requires || [];
  return (
    <motion.section
      className="talent-node-detail-drawer"
      initial={{x: 420, opacity: 0}}
      animate={{x: 0, opacity: 1}}
      exit={{x: 420, opacity: 0}}
      transition={{duration: 0.22, ease: "easeOut"}}
    >
      <div className="talent-node-detail-body">
        <button className="talent-node-detail-close" onClick={onClose} aria-label="关闭详情">×</button>
        <span>{node.category}</span>
        <h3>{node.name}</h3>
        <strong>Lv{detail.level}/{detail.max}</strong>
        <p>{node.desc}</p>
        <div className="talent-node-effect-box">
          <span>当前效果</span>
          <p>{detail.currentEffect}</p>
        </div>
        <div className="talent-node-effect-box next">
          <span>下级效果</span>
          <p>{detail.nextEffect}</p>
        </div>
        <div className="talent-node-requirements">
          <span>前置</span>
          {requirements.length ? requirements.map(requirement => (
            <b className={talentNodeLevel(nodeById, requirement.id) >= Math.max(1, Number(requirement.level || 1)) ? "met" : ""} key={`${node.id}-${requirement.id}-${requirement.level || 1}`}>
              {talentRequirementText(nodeById, requirement)}
            </b>
          )) : <b className="met">无</b>}
        </div>
        <small>
          {node.kind === "event_preview" || node.disabled ? "后续奇遇池预留，暂不能点亮。" : detail.cost === null ? "已满级或默认点亮。" : !detail.ready ? "前置节点未满足。" : bp < Number(detail.cost) ? "BP 不足。" : `可花费 ${bpCostLabel(Number(detail.cost))} 点亮/升级。`}
        </small>
      </div>
      <div className="talent-node-detail-actions">
        <button disabled={!detail.canUpgrade} onClick={onUpgrade}>{detail.level > 0 ? "升级" : "点亮"}</button>
        <span>{detail.cost === null ? "MAX" : bpCostLabel(Number(detail.cost || 0))}</span>
      </div>
    </motion.section>
  );
}

function bpCostLabel(value: number): string {
  return `${value} BP`;
}
