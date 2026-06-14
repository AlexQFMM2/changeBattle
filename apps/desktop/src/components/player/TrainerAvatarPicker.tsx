import type {TrainerNpcView} from "@changebattle/shared";
import {trainerImageUrl} from "../../lib/ui";
import "./TrainerAvatarPicker.css";

export type TrainerAvatarPickerMode = "players" | "avatars";

export function TrainerAvatarPicker({title, mode, items, selectedId, onSelect}: {title: string; mode: TrainerAvatarPickerMode; items: TrainerNpcView[]; selectedId?: string; onSelect?: (item: TrainerNpcView) => void}) {
  return (
    <section className={`trainer-avatar-picker trainer-avatar-picker-${mode}`}>
      <h3>{title}</h3>
      <div className="trainer-avatar-picker-grid">
        {items.length ? items.map(item => {
          const asset = item.avatar_asset || "";
          const itemSelectedId = mode === "avatars" ? asset : item.id;
          const active = itemSelectedId === selectedId;
          const image = mode === "avatars" ? trainerImageUrl(item, "avatar") : trainerImageUrl(item, active ? "frontGif" : "front");
          return (
            <button className={active ? "selected" : ""} title={item.name_zh} aria-label={item.name_zh || "训练师"} onClick={() => onSelect?.(item)} key={`${mode}-${item.id}`}>
              {image ? <img src={image} alt="" /> : <span>?</span>}
              {mode === "players" ? <b>{item.name_zh}</b> : null}
            </button>
          );
        }) : <p>没有找到资源。</p>}
      </div>
    </section>
  );
}
