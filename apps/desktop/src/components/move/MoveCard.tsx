import type {ButtonHTMLAttributes, ReactNode} from "react";
import {typeId} from "../../lib/ui";

export type MoveCardSize = "battle" | "sheet" | "dex" | "draw";

export type MoveCardData = {
  name: ReactNode;
  moveType?: string;
  typeLabel?: ReactNode;
  category?: ReactNode;
  pp?: ReactNode;
  maxPp?: ReactNode;
  power?: ReactNode;
  accuracy?: ReactNode;
  badge?: ReactNode;
  damageRange?: ReactNode;
  meta?: ReactNode[];
};

export function moveCardClassName({moveType, size = "sheet", selected, className}: {moveType?: string; size?: MoveCardSize; selected?: boolean; className?: string}): string {
  return [
    "move-choice",
    "move-card",
    `move-card-${size}`,
    `move-type-${typeId(moveType) || "normal"}`,
    selected ? "selected" : "",
    className || "",
  ].filter(Boolean).join(" ");
}

export function MoveCardContent({name, moveType, typeLabel, category, pp, maxPp, power, accuracy, badge, damageRange, meta}: MoveCardData) {
  const resolvedType = typeLabel || moveType || "一般";
  const metaItems = meta || [
    pp !== undefined ? `PP ${pp}${maxPp !== undefined ? `/${maxPp}` : ""}` : null,
    power !== undefined ? `威力 ${power || "--"}` : null,
    accuracy !== undefined ? `命中 ${accuracy ?? "必中"}` : null,
  ].filter(Boolean);
  return (
    <>
      <span className="move-name-row">
        <strong>{name}</strong>
        {category ? <i>{category}</i> : null}
        {badge ? <i className="move-card-badge">{badge}</i> : null}
        {damageRange ? <small className="damage-range">{damageRange}</small> : null}
      </span>
      <span className="move-meta-row">
        <b>{resolvedType}</b>
        {metaItems.map((item, index) => <em key={index}>{item}</em>)}
      </span>
    </>
  );
}

export function MoveCard({name, moveType, typeLabel, category, pp, maxPp, power, accuracy, badge, damageRange, meta, size = "sheet", selected, className, ...buttonProps}: MoveCardData & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> & {size?: MoveCardSize; selected?: boolean}) {
  return (
    <button {...buttonProps} type="button" className={moveCardClassName({moveType, size, selected, className})}>
      <MoveCardContent name={name} moveType={moveType} typeLabel={typeLabel} category={category} pp={pp} maxPp={maxPp} power={power} accuracy={accuracy} badge={badge} damageRange={damageRange} meta={meta} />
    </button>
  );
}
