import type {DesktopDexEntry} from "@changebattle/shared";
import {ItemIcon, trainerImageUrl} from "../../lib/ui";
import {MoveCard} from "../move/MoveCard";
import {dexEntryText, dexSpriteUrl, entrySummary, type DexVariant} from "./dexModel";
import "./DexResultList.css";

function TrainerBadges({tags, compact = false, variant = "full"}: {tags: string[]; compact?: boolean; variant?: DexVariant}) {
  const uniqueTags = Array.from(new Set(tags.filter(Boolean)));
  if (!uniqueTags.length) return null;
  const className = variant === "quick" ? "quick-dex-trainer-badges" : `trainer-dex-badges ${compact ? "compact" : ""}`.trim();
  return <div className={className}>{uniqueTags.map(tag => <span key={tag}>{tag}</span>)}</div>;
}

export function DexTrainerBadges(props: {tags: string[]; compact?: boolean; variant?: DexVariant}) {
  return <TrainerBadges {...props} />;
}

export function DexTrainerAvatar({entry, variant = "full"}: {entry: DesktopDexEntry; variant?: DexVariant}) {
  const image = entry.unlocked
    ? variant === "quick"
      ? trainerImageUrl(entry.trainer, "avatar") || trainerImageUrl(entry.trainer, "front")
      : trainerImageUrl(entry.trainer, "frontGif")
    : "";
  if (image) return <img className={variant === "quick" ? "quick-dex-trainer-avatar" : "trainer-dex-avatar"} src={image} alt={entry.name_zh || entry.name} />;
  return variant === "quick" ? <span>?</span> : <i className="shadow-orb">?</i>;
}

function DexResultEntry({entry, selected, variant, onSelect}: {entry: DesktopDexEntry; selected: boolean; variant: DexVariant; onSelect: (entry: DesktopDexEntry) => void}) {
  if (variant === "quick" && entry.category === "moves") {
    return (
      <MoveCard
        size="dex"
        className="quick-dex-move-card quick-dex-result-move-card"
        selected={selected}
        name={entry.name_zh || entry.name}
        moveType={entry.type || entry.type_zh}
        typeLabel={entry.type_zh || entry.type || "一般"}
        category={entry.move_category_zh || entry.move_category || "变化"}
        pp={entry.pp || "--"}
        power={entry.power || "--"}
        accuracy={entry.accuracy ?? "必中"}
        onClick={() => onSelect(entry)}
      />
    );
  }
  if (variant === "quick") {
    return (
      <button className={`${selected ? "selected" : ""} ${entry.category === "trainers" && !entry.unlocked ? "locked" : ""}`} onClick={() => onSelect(entry)}>
        {entry.category === "pokemon" && dexSpriteUrl(entry) ? <img src={dexSpriteUrl(entry)} alt={entry.name_zh || entry.name} /> : null}
        {entry.category === "items" ? <ItemIcon item={entry} /> : null}
        {entry.category === "trainers" ? <DexTrainerAvatar entry={entry} variant="quick" /> : null}
        {entry.category !== "pokemon" && entry.category !== "items" && entry.category !== "trainers" ? <span>特</span> : null}
        <strong>{entry.name_zh || entry.name}</strong>
        {entry.category === "trainers" && entry.unlocked && entry.trainer_tags?.length ? <TrainerBadges tags={entry.trainer_tags} variant="quick" /> : null}
        <small>{entrySummary(entry)}</small>
      </button>
    );
  }
  return (
    <button className={`${selected ? "selected" : ""} ${entry.category === "trainers" && !entry.unlocked ? "locked" : ""}`} onClick={() => onSelect(entry)}>
      {entry.category === "pokemon" && dexSpriteUrl(entry) ? <img src={dexSpriteUrl(entry)} alt={entry.name_zh || entry.name} /> : null}
      {entry.category === "items" ? <ItemIcon item={entry} /> : null}
      {entry.category === "trainers" ? <DexTrainerAvatar entry={entry} /> : null}
      <strong>{entry.name_zh || entry.name}</strong>
      <span>{entry.name}</span>
      {entry.category === "trainers" && entry.unlocked && entry.trainer_tags?.length ? <TrainerBadges tags={entry.trainer_tags} compact /> : null}
      <small>{dexEntryText(entry)}</small>
    </button>
  );
}

export function DexResultList({variant = "full", entries, selectedId, loading = false, error = null, page, pageCount, category, onSelect, onPageChange}: {variant?: DexVariant; entries: DesktopDexEntry[]; selectedId?: string; loading?: boolean; error?: string | null; page: number; pageCount: number; category?: DesktopDexEntry["category"]; onSelect: (entry: DesktopDexEntry) => void; onPageChange: (page: number) => void}) {
  const listClass = variant === "quick" ? `quick-dex-list ${category === "moves" ? "move-results" : ""}` : "dex-result-list";
  const messageClass = variant === "quick" ? "quick-dex-message" : "";
  const currentPage = Math.max(0, Math.min(page, pageCount - 1));
  const pagerClass = variant === "quick" ? "quick-dex-pager" : "dex-pager";
  const content = (
    <>
      {loading ? <p className={messageClass}>读取本地图鉴...</p> : null}
      {error ? <p className={messageClass}>{error}</p> : null}
      {!loading && !error && entries.length === 0 ? <p className={messageClass}>没有匹配结果。</p> : null}
      {entries.map(entry => <DexResultEntry entry={entry} selected={selectedId === entry.id} variant={variant} onSelect={onSelect} key={`${entry.category}-${entry.id}`} />)}
    </>
  );
  if (variant === "quick") {
    return (
      <div className="quick-dex-result-pane dex-result-list-shell quick">
        <div className={listClass}>{content}</div>
        <nav className={pagerClass} aria-label="图鉴翻页">
          <button disabled={loading || currentPage <= 0} onClick={() => onPageChange(Math.max(0, currentPage - 1))}>上一页</button>
          <span>{currentPage + 1}/{pageCount}</span>
          <button disabled={loading || currentPage >= pageCount - 1} onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}>下一页</button>
        </nav>
      </div>
    );
  }
  return (
    <div className="dex-result-list-shell">
      <div className={listClass}>{content}</div>
      <nav className={pagerClass} aria-label="图鉴翻页">
        <button disabled={loading || currentPage <= 0} onClick={() => onPageChange(Math.max(0, currentPage - 1))}>上一页</button>
        <span>{currentPage + 1}/{pageCount}</span>
        <button disabled={loading || currentPage >= pageCount - 1} onClick={() => onPageChange(Math.min(pageCount - 1, currentPage + 1))}>下一页</button>
      </nav>
    </div>
  );
}
