import {useState} from "react";
import {TrainingRestNewActionBoard} from "./TrainingRestNewActionBoard";
import "./TrainingRestNewActionBoard.preview.css";

export function TrainingRestNewActionBoardPreview() {
  const [activeAction, setActiveAction] = useState("图鉴");
  return (
    <section className="training-rest-new-action-preview-canvas" aria-label="休整功能公告栏预览">
      <div className="training-rest-new-action-preview-bg" aria-hidden="true" />
      <TrainingRestNewActionBoard activeAction={activeAction} onAction={setActiveAction} />
    </section>
  );
}
