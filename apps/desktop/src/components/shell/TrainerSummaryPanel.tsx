import type {LocalSave} from "@changebattle/shared";
import {motion, type Variants} from "motion/react";
import {TrainerAvatar} from "./TrainerAvatar";
import "./TrainerSummaryPanel.css";

export const trainerSummaryPanelVariants: Variants = {
  hidden: {opacity: 0, x: 36},
  visible: {opacity: 1, x: 0, transition: {delay: 0.1, type: "spring", stiffness: 330, damping: 30}},
  leaving: {opacity: 0, x: 38, transition: {duration: 0.28, ease: "easeInOut"}},
};

export function TrainerSummaryPanel({save, leaving = false}: {save: LocalSave | null; leaving?: boolean}) {
  const winRate = save?.stats.battles ? Math.round((save.stats.wins / save.stats.battles) * 1000) / 10 : 0;
  return (
    <motion.section className="trainer-summary-panel" aria-label="用户信息" initial="hidden" animate={leaving ? "leaving" : "visible"} variants={trainerSummaryPanelVariants}>
      <span className="trainer-summary-avatar">
        <TrainerAvatar candidates={[save?.trainer.avatar_asset, save?.trainer.front_asset]} alt={save?.trainer.name || "训练师"} fallbackText={save ? save.trainer.name.slice(0, 1) : "?"} />
      </span>
      <div>
        <strong>{save?.trainer.name || "未读取存档"}</strong>
        <small>ID {save?.trainer.player_npc_id || "--"}</small>
      </div>
      <p><b>{save?.stats.battle_points ?? 0}</b><span>BP</span></p>
      <p><b>{winRate}%</b><span>胜率</span></p>
    </motion.section>
  );
}
