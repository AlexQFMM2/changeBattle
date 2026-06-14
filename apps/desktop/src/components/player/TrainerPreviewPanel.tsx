import type {TrainerNpcView} from "@changebattle/shared";
import {trainerImageUrl} from "../../lib/ui";
import "./TrainerPreviewPanel.css";

export function TrainerPreviewPanel({name, player}: {name: string; player?: TrainerNpcView}) {
  return (
    <section className="trainer-preview-panel" aria-label="训练师预览">
      <div className="trainer-preview-panel-image">
        {player ? <img src={trainerImageUrl(player, "frontGif") || trainerImageUrl(player, "front")} alt={player.name_zh} /> : <span>?</span>}
      </div>
      <strong>{name || "训练师"}</strong>
      <small>{player?.name_zh || "请选择角色"}</small>
    </section>
  );
}
