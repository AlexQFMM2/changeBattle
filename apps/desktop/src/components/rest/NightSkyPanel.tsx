import {useEffect, useState} from "react";
import type {ReactElement} from "react";
import type {DesktopGameState} from "@changebattle/shared";
import {AnimatePresence, motion} from "motion/react";
import {PokemonSprite, coinCostLabel, displayName, trainerImageUrl} from "../../lib/ui";
import type {RestActionHandler} from "./restActionTypes";
import "./NightSkyPanel.css";

type RestState = NonNullable<DesktopGameState["rest"]>;

export function NightSkyPanel({rest, onClose, onAction, embedded = false}: {rest: RestState; onClose: () => void; onAction: RestActionHandler; embedded?: boolean}) {
  const rows = rest.night_sky?.rows || [];
  const nextBattleNo = Math.max(1, Math.min(Number(rest.battles || rows.length || 1), Number(rest.battle_no || 0) + 1));
  const [selectedBattleNo, setSelectedBattleNo] = useState(() => rows.find(row => row.battle_no === nextBattleNo)?.battle_no || rows[0]?.battle_no || 0);
  useEffect(() => {
    if (!rows.length) {
      setSelectedBattleNo(0);
      return;
    }
    if (!rows.some(row => row.battle_no === selectedBattleNo)) setSelectedBattleNo(rows.find(row => row.battle_no === nextBattleNo)?.battle_no || rows[0].battle_no);
  }, [nextBattleNo, rows, selectedBattleNo]);

  const selectedIndex = Math.max(0, rows.findIndex(row => row.battle_no === selectedBattleNo));
  const selectedRow = rows[selectedIndex] || rows[0] || null;
  const rumorLevel = runTalentLevel(rest, "intel_rumor");
  const hasScoutTalent = rumorLevel > 0;
  const hasRerouteTalent = hasRunTalent(rest, "intel_reroute");
  const currentBattleNo = Number(rest.battle_no || 0);
  const selectedTrainerVisible = selectedRow ? selectedRow.trainer_visible !== false : false;
  const selectedTrainerImage = selectedRow && selectedTrainerVisible ? trainerImageUrl(selectedRow.trainer, "front") || trainerImageUrl(selectedRow.trainer, "avatar") : "";
  const selectedFuture = selectedRow ? Number(selectedRow.battle_no) > currentBattleNo : false;
  const rerouteUsed = Number(rest.reroute_used || 0);
  const rerouteLimit = Number(rest.reroute_limit || 3);
  const canRerouteSelected = Boolean(hasRerouteTalent && selectedRow && selectedFuture && rerouteUsed < rerouteLimit);
  const canScoutOne = Boolean(rumorLevel >= 2 && selectedRow && selectedFuture && Number(selectedRow.revealed || 0) < 1);
  const canScoutAll = Boolean(rumorLevel >= 3 && selectedRow && selectedFuture && !selectedRow.unlocked);
  const scoutOneLabel = !hasScoutTalent ? "需要小道消息" : rumorLevel < 2 ? "需要 Lv2" : !selectedFuture ? "已挑战" : Number(selectedRow?.revealed || 0) >= 1 ? "已揭示一只" : "揭示 1 只（免费）";
  const scoutAllLabel = !hasScoutTalent ? "需要小道消息" : rumorLevel < 3 ? "需要 Lv3" : !selectedFuture ? "已挑战" : selectedRow?.unlocked ? "已解锁三只" : `解锁三只（${coinCostLabel(rest.costs.scout_all)}）`;

  return (
    <EmbeddedOrModal embedded={embedded}>
      <section className="shop-modal night-sky-modal night-sky-gallery-modal">
        {selectedRow ? (
          <div className="night-sky-gallery">
            <div className="night-sky-gallery-main">
              <AnimatePresence mode="wait">
                <motion.div className={`night-sky-gallery-stage ${selectedTrainerVisible ? "" : "unknown"}`} initial={{opacity: 0, x: 16, scale: .98}} animate={{opacity: 1, x: 0, scale: 1}} exit={{opacity: 0, x: -16, scale: .98}} transition={{type: "spring", stiffness: 330, damping: 30}} key={`night-sky-stage-${selectedRow.battle_no}`}>
                  {selectedTrainerImage ? <img src={selectedTrainerImage} alt="" /> : <i>?</i>}
                  <small>{selectedTrainerVisible ? selectedRow.trainer.name_zh : "???"}</small>
                </motion.div>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.article className="night-sky-selected-detail" initial={{opacity: 0, y: 8}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -8}} transition={{duration: .18}} key={`night-sky-detail-${selectedRow.battle_no}`}>
                  <div className="night-sky-selected-copy">
                    <strong>{selectedRow.battle_no === nextBattleNo ? "下一场" : selectedRow.encountered ? "已挑战" : `第 ${selectedRow.battle_no} 场`}</strong>
                    <span>{selectedTrainerVisible ? selectedRow.label : "未知对手"}</span>
                  </div>
                  <div className="night-sky-selected-enemies">
                    {selectedRow.enemies.map((enemy, index) => enemy ? (
                      <div className="night-sky-pokemon" key={`${selectedRow.battle_no}-${enemy.species_id}-${index}`}>
                        <PokemonSprite pokemon={enemy} alt={displayName(enemy)} />
                        <span>{displayName(enemy)}</span>
                      </div>
                    ) : (
                      <div className="night-sky-pokemon night-sky-unknown" key={`${selectedRow.battle_no}-unknown-${index}`}>
                        <i>?</i>
                        <span>未查看</span>
                      </div>
                    ))}
                  </div>
                  <div className="night-sky-actions">
                    <button disabled={!canScoutOne} onClick={() => onAction({type: "night_sky_scout", battleNo: selectedRow.battle_no, level: "one"})}>{scoutOneLabel}</button>
                    <button disabled={!canScoutAll} onClick={() => onAction({type: "night_sky_scout", battleNo: selectedRow.battle_no, level: "all"})}>{scoutAllLabel}</button>
                    <button disabled={!canRerouteSelected} onClick={() => onAction({type: "reroute_next", battleNo: selectedRow.battle_no})}>{hasRerouteTalent ? `更换对手 ${rerouteUsed}/${rerouteLimit}` : "需要公子驾到"}</button>
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>
            <nav className="night-sky-thumbnail-nav" aria-label="小道消息节点">
              {rows.map(row => {
                const trainerVisible = row.trainer_visible !== false;
                const trainerImage = trainerVisible ? trainerImageUrl(row.trainer, "avatar") || trainerImageUrl(row.trainer, "front") : "";
                const selected = row.battle_no === selectedRow.battle_no;
                return (
                  <motion.button
                    className={`night-sky-thumbnail ${selected ? "active" : ""} ${trainerVisible ? "" : "unknown"} ${row.encountered ? "encountered" : ""}`}
                    aria-label={`选择小道消息节点 ${row.battle_no}`}
                    onClick={() => setSelectedBattleNo(row.battle_no)}
                    initial={false}
                    animate={{opacity: selected ? 1 : 0.62, y: selected ? -2 : 0}}
                    whileHover={{scale: 1.05, opacity: 1}}
                    whileTap={{scale: 0.96}}
                    key={`night-sky-thumb-${row.battle_no}`}
                  >
                    {selected ? <motion.i layoutId="night-sky-thumbnail-active" transition={{type: "spring", stiffness: 420, damping: 32}} /> : null}
                    {trainerImage ? <img src={trainerImage} alt="" /> : <span>?</span>}
                  </motion.button>
                );
              })}
            </nav>
          </div>
        ) : <p className="night-sky-empty">小道消息尚未展开。</p>}
      </section>
    </EmbeddedOrModal>
  );
}

function EmbeddedOrModal({embedded, children}: {embedded?: boolean; children: ReactElement}) {
  return embedded ? children : <div className="modal-layer">{children}</div>;
}

function hasRunTalent(rest: RestState, id: string): boolean {
  return runTalentLevel(rest, id) > 0;
}

function runTalentLevel(rest: RestState, id: string): number {
  const talent = rest.talents?.find(entry => entry.id === id);
  return talent ? Math.max(1, Math.floor(Number(talent.level || 1))) : 0;
}
