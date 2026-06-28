import {motion, type Variants} from "motion/react";
import type {TrainerCatalogEntryV2, UserProfileV2} from "@changebattle-v2/api";
import {TrainerAvatar} from "./TrainerAvatar";
import "./TrainerSummaryPanel.css";

export const trainerSummaryPanelVariants: Variants = {
  hidden: {opacity: 0, x: 36},
  visible: {opacity: 1, x: 0, transition: {delay: 0.1, type: "spring", stiffness: 330, damping: 30}},
  leaving: {opacity: 0, x: 38, transition: {duration: 0.28, ease: "easeInOut"}},
};

export function TrainerSummaryPanel({profile, catalog, leaving = false}: {profile: UserProfileV2; catalog: TrainerCatalogEntryV2[]; leaving?: boolean}) {
  const trainer = catalog.find(item => item.id === profile.trainerId);
  return (
    <motion.section className="trainer-summary-panel" aria-label="用户信息" initial="hidden" animate={leaving ? "leaving" : "visible"} variants={trainerSummaryPanelVariants}>
      <span className="trainer-summary-avatar">
        <TrainerAvatar profile={profile} />
      </span>
      <div>
        <strong>{profile.name}</strong>
        <small>ID {trainer?.id || "--"}</small>
      </div>
      <p><b>{profile.battlePoints}</b><span>BP</span></p>
      <p><b>0%</b><span>胜率</span></p>
    </motion.section>
  );
}
