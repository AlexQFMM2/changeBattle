import type {DesktopDexEntry, MoveSummary} from "@changebattle/shared";
import {ItemIcon, trainerImageUrl} from "../../lib/ui";
import {PokemonDexDetail} from "./PokemonDexDetail";
import {TrainerDexDetail} from "./TrainerDexDetail";
import {MoveDexDetail} from "./MoveDexDetail";
import {AbilityDexDetail, ItemDexDetail} from "./ItemDexDetail";
import {dexSpriteUrl, type DexAbilitySummary, type DexVariant} from "./dexModel";
import {DexTrainerBadges} from "./DexResultList";
import "./DexDetailPanel.css";

export function DexDetailPanel({entry, variant = "full", expanded = false, showTrainerPool = true, onToggleExpanded, onMoveSelect, onAbilitySelect}: {entry: DesktopDexEntry | null; variant?: DexVariant; expanded?: boolean; showTrainerPool?: boolean; onToggleExpanded: () => void; onMoveSelect?: (move: MoveSummary) => void; onAbilitySelect: (ability: DexAbilitySummary) => void}) {
  const emptyClass = variant === "quick" ? "quick-dex-detail empty" : "dex-entry-detail empty";
  if (!entry) return <section className={emptyClass}>{variant === "quick" ? "选择左侧条目查看详情。" : <p>选择一个条目。</p>}</section>;
  const isPokemon = entry.category === "pokemon";
  const isTrainer = entry.category === "trainers";
  const sectionClass = variant === "quick"
    ? `quick-dex-detail ${isPokemon ? "pokemon" : ""} ${isTrainer && !entry.unlocked ? "locked" : ""}`
    : `dex-entry-detail ${isPokemon ? "pokemon-dex-detail" : ""} ${isTrainer ? "trainer-dex-detail" : ""} ${isTrainer && !entry.unlocked ? "locked" : ""}`;
  return (
    <section className={sectionClass}>
      {isPokemon ? null : (
        <DexDetailHeader entry={entry} variant={variant} expanded={expanded} onToggleExpanded={onToggleExpanded} />
      )}
      {isPokemon ? (
        <PokemonDexDetail
          entry={entry}
          variant={variant}
          action={<button className={variant === "quick" ? "quick-dex-detail-expand-button" : "dex-detail-expand-button"} onClick={onToggleExpanded} title={expanded ? "还原详情面板" : "放大详情面板"} aria-label={expanded ? "还原详情面板" : "放大详情面板"}>{expanded ? "↙" : "⛶"}</button>}
          onMoveSelect={onMoveSelect}
          onAbilitySelect={onAbilitySelect}
        />
      ) : null}
      {entry.category === "moves" ? <MoveDexDetail entry={entry} variant={variant} /> : null}
      {entry.category === "items" ? <ItemDexDetail entry={entry} variant={variant} /> : null}
      {entry.category === "abilities" ? <AbilityDexDetail entry={entry} variant={variant} /> : null}
      {isTrainer ? <TrainerDexDetail entry={entry} variant={showTrainerPool ? variant : "quick"} /> : null}
    </section>
  );
}

function DexDetailHeader({entry, variant, expanded, onToggleExpanded}: {entry: DesktopDexEntry; variant: DexVariant; expanded: boolean; onToggleExpanded: () => void}) {
  const sprite = dexSpriteUrl(entry);
  const trainerImage = entry.category === "trainers" && entry.unlocked ? trainerImageUrl(entry.trainer, "frontGif") || trainerImageUrl(entry.trainer, "front") || trainerImageUrl(entry.trainer, "avatar") : "";
  const expandClass = variant === "quick" ? "quick-dex-detail-expand-button" : "dex-detail-expand-button";
  return (
    <header>
      {sprite ? <img src={sprite} alt={entry.name_zh || entry.name} /> : null}
      {!sprite && entry.category === "items" ? <ItemIcon item={entry} /> : null}
      {!sprite && entry.category === "trainers" && trainerImage ? <img src={trainerImage} alt={entry.name_zh || entry.name} /> : null}
      {!sprite && entry.category === "trainers" && !trainerImage && variant === "full" ? <i className="shadow-orb large">?</i> : null}
      {!sprite && !(entry.category === "items") && !(entry.category === "trainers" && (trainerImage || variant === "full")) ? <span>{entry.category === "moves" ? "技" : entry.category === "trainers" ? "?" : "特"}</span> : null}
      <div>
        <h3>{entry.category === "trainers" && !entry.unlocked ? "未知训练师" : entry.name_zh || entry.name}</h3>
        <p>
          {entry.category === "trainers"
            ? entry.unlocked
              ? `${entry.trainer?.region || "未知地区"} / ${entry.trainer?.role || "训练师"}`
              : entry.desc_zh || "尚未遭遇"
            : variant === "quick"
              ? `${entry.name} / ${entry.id}`
              : `${entry.name}　${entry.id}`}
        </p>
        {entry.category === "trainers" && entry.unlocked && variant === "full" ? <DexTrainerBadges tags={entry.trainer_tags || []} /> : null}
      </div>
      <button className={expandClass} onClick={onToggleExpanded} title={expanded ? "还原详情面板" : "放大详情面板"} aria-label={expanded ? "还原详情面板" : "放大详情面板"}>{expanded ? "↙" : "⛶"}</button>
    </header>
  );
}
