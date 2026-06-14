import {useState} from "react";
import {motion} from "motion/react";
import type {RentalPokemon, RestState} from "@changebattle/shared";
import {conditionText, displayName} from "../../lib/ui";
import {PokopiaModal, pokopiaItemVariants} from "../motion/PokopiaModal";
import {RainbowRocketPokemonCard} from "./RainbowRocketPokemonCard";
import type {RestActionHandler} from "./restActionTypes";
import "./RainbowRocketSupportPanel.css";

export function RainbowRocketSupportPanel({rest, onAction}: {rest: RestState; onAction: RestActionHandler}) {
  const support = rest.rainbow_rocket_support;
  const [selected, setSelected] = useState<{source: "factory" | "route"; index: number} | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [restoreSlots, setRestoreSlots] = useState<number[]>([]);
  const [teamMode, setTeamMode] = useState<"replace" | "restore">("replace");
  const [busy, setBusy] = useState(false);
  if (!support) return null;
  const teamFull = rest.player_display.length >= support.max_team_size;
  const canComplete = support.invasion ? rest.player_display.length >= support.max_team_size : support.picks_used >= support.picks_required;
  const selectedPokemon = selected ? selected.source === "route" ? support.route_display[selected.index] : support.factory_display[selected.index] : null;
  const pickedText = `${support.picks_used}/${support.picks_required}`;

  async function chooseSupport() {
    if (!selected || !selectedPokemon || busy) return;
    setBusy(true);
    try {
      await Promise.resolve(onAction({type: "rainbow_rocket_support", source: selected.source, candidateIndex: selected.index, targetIndex: teamFull ? target : null}, "彩虹火箭队支援已加入"));
      setSelected(null);
      setTarget(null);
    } finally {
      setBusy(false);
    }
  }

  async function finishSupport() {
    if (busy || !canComplete) return;
    setBusy(true);
    try {
      await Promise.resolve(onAction({type: "rainbow_rocket_support_done"}, "彩虹火箭队支援已确认"));
    } finally {
      setBusy(false);
    }
  }

  async function restoreTeam() {
    if (busy || !restoreSlots.length) return;
    setBusy(true);
    try {
      await Promise.resolve(onAction({type: "rainbow_rocket_restore", slots: restoreSlots}, "工厂治疗完成"));
      setRestoreSlots([]);
    } finally {
      setBusy(false);
    }
  }

  function toggleRestore(slot: number) {
    setRestoreSlots(current => current.includes(slot) ? current.filter(value => value !== slot) : current.length >= 2 ? current : [...current, slot]);
  }

  const candidateGrid = (title: string, source: "factory" | "route", list: RentalPokemon[]) => (
    <section className="rainbow-support-column">
      <h3>{title}</h3>
      <div className="rainbow-support-grid">
        {list.length ? list.map((pokemon, index) => (
          <RainbowRocketPokemonCard
            pokemon={pokemon}
            selected={selected?.source === source && selected.index === index}
            disabled={busy}
            onClick={() => setSelected({source, index})}
            key={`${source}-${pokemon.species_id}-${index}`}
          />
        )) : <p className="rainbow-support-empty">暂无候选</p>}
      </div>
    </section>
  );

  return (
    <PokopiaModal className="rainbow-support-modal" closeDisabled labelledBy="rainbow-support-title" onClose={() => undefined}>
      {() => (
        <motion.section className="rainbow-support-content" variants={pokopiaItemVariants}>
          <header>
            <div>
              {support.invasion ? <strong className="rainbow-warning">WARNING / WARNING</strong> : <strong className="rainbow-warning compact">RAINBOW ROCKET</strong>}
              <h2 id="rainbow-support-title">彩虹火箭队入侵</h2>
              <p>{support.invasion ? "赛程已被劫持。工厂临时开放支援，必须把队伍补到 6 只后才能迎战。" : "下一名头目正在接近。选择一次工厂或原赛程支援，再进入下一场。"}</p>
            </div>
            <div className="rainbow-support-progress">
              <span>队伍 {rest.player_display.length}/{support.max_team_size}</span>
              <span>支援 {pickedText}</span>
            </div>
          </header>
          <div className="rainbow-support-main">
            <section className="rainbow-support-team">
              <h3>当前队伍</h3>
              <div className="rainbow-support-grid team">
                {rest.player_display.map((pokemon, index) => {
                  const state = rest.player_state[index];
                  const selectedTarget = target === index;
                  return (
                    <RainbowRocketPokemonCard
                      pokemon={pokemon}
                      label={`${index + 1}. ${displayName(pokemon)}`}
                      detail={conditionText(state?.condition) || "状态正常"}
                      selected={selectedTarget}
                      restoreSelected={restoreSlots.includes(index)}
                      disabled={busy}
                      onClick={() => teamFull && teamMode === "replace" ? setTarget(index) : toggleRestore(index)}
                      key={`rainbow-team-${pokemon.species_id}-${index}`}
                    />
                  );
                })}
              </div>
              <div className="rainbow-restore-row">
                {teamFull ? <button className={teamMode === "replace" ? "selected" : ""} type="button" disabled={busy} onClick={() => setTeamMode("replace")}>选择替换</button> : null}
                <button className={teamMode === "restore" ? "selected" : ""} type="button" disabled={busy} onClick={() => setTeamMode("restore")}>选择治疗</button>
                <button type="button" disabled={busy || !restoreSlots.length} onClick={() => void restoreTeam()}>工厂治疗 {restoreSlots.length}/2</button>
                <small>队伍未满时点击队员选择治疗；队伍已满时点击队员选择替换目标。</small>
              </div>
            </section>
            {candidateGrid("工厂支援候选", "factory", support.factory_display)}
            {candidateGrid(`${support.route_trainer?.name_zh || "原赛程对手"}支援`, "route", support.route_display)}
          </div>
          <footer className="command-row">
            <button type="button" disabled={busy || !selectedPokemon || (teamFull && target === null)} onClick={() => void chooseSupport()}>{teamFull ? "替换入队" : "加入队伍"}</button>
            <button type="button" disabled={busy || !canComplete} onClick={() => void finishSupport()}>{canComplete ? "确认支援" : support.invasion ? "队伍未满 6 只" : "尚未选择支援"}</button>
          </footer>
        </motion.section>
      )}
    </PokopiaModal>
  );
}
