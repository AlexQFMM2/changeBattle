import {useState} from "react";
import type {DesktopDexEntry, RentalPokemon} from "@changebattle/shared";
import {PokemonProfile} from "../pokemon/PokemonProfile";
import {PokemonSprite, displayName, trainerImageUrl} from "../../lib/ui";
import {DexTrainerBadges} from "./DexResultList";
import type {DexVariant} from "./dexModel";
import "./TrainerDexDetail.css";

export function TrainerDexDetail({entry, variant = "full"}: {entry: DesktopDexEntry; variant?: DexVariant}) {
  const [detailPokemon, setDetailPokemon] = useState<RentalPokemon | null>(null);
  const trainer = entry.trainer;
  const image = entry.unlocked
    ? variant === "quick"
      ? trainerImageUrl(trainer, "frontGif") || trainerImageUrl(trainer, "front") || trainerImageUrl(trainer, "avatar")
      : trainerImageUrl(trainer, "frontGif")
    : "";
  const record = entry.boss_record;
  const lastResult = record?.last_result === "win" ? "胜利" : record?.last_result === "loss" ? "失败" : "未结算";
  if (variant === "quick") {
    return (
      <>
        {entry.unlocked ? <DexTrainerBadges tags={entry.trainer_tags || []} variant="quick" /> : null}
        <div className="quick-dex-trainer-stats">
          <p><span>交手</span><strong>{record?.completed || 0}</strong></p>
          <p><span>胜</span><strong>{record?.wins || 0}</strong></p>
          <p><span>负</span><strong>{record?.losses || 0}</strong></p>
          <p><span>上次</span><strong>{lastResult}</strong></p>
        </div>
        <p className="quick-dex-description">{entry.unlocked ? entry.boss_summary || "已记录这位训练师的遭遇资料。" : "尚未遭遇。遇到后才会显示真实身份、头像和特殊事件标签。"}</p>
      </>
    );
  }
  return (
    <>
      <div className="trainer-dex-stats">
        <span>交手 <strong>{record?.completed || 0}</strong></span>
        <span>胜 <strong>{record?.wins || 0}</strong></span>
        <span>负 <strong>{record?.losses || 0}</strong></span>
        <span>上次 <strong>{lastResult}</strong></span>
      </div>
      <p className="dex-description">{entry.unlocked ? "已记录这位强敌的遭遇资料。配置池展示的是对战中实际遇到过的预设宝可梦配置。" : "尚未遭遇。击败路上的训练师，直到这位强敌站到你面前。"}</p>
      <div className="trainer-pool-panel">
        <h4>遭遇配置池</h4>
        <div>
          {(entry.boss_pool_rows || []).map(row => (
            <article className="trainer-pool-row" key={`${entry.id}-${row.team_index}`}>
              <span>配置 {row.team_index}</span>
              <div>
                {row.slots.map(slot => slot.unlocked && slot.pokemon ? (
                  <button className="trainer-pool-slot unlocked" onClick={() => setDetailPokemon(slot.pokemon || null)} key={slot.key}>
                    <PokemonSprite pokemon={slot.pokemon} alt={displayName(slot.pokemon)} />
                    <strong>{displayName(slot.pokemon)}</strong>
                  </button>
                ) : (
                  <button className="trainer-pool-slot locked" disabled key={slot.key}>
                    <i className="shadow-orb">?</i>
                    <strong>未知</strong>
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
      {detailPokemon ? (
        <div className="modal-layer nested">
          <section className="pokemon-detail-modal trainer-pokemon-detail">
            <header><h2>{displayName(detailPokemon)} 的预设配置</h2><button onClick={() => setDetailPokemon(null)}>关闭</button></header>
            <PokemonProfile pokemon={detailPokemon} compact revealTraining />
          </section>
        </div>
      ) : null}
      {image ? null : null}
    </>
  );
}
