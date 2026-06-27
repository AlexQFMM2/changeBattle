import {useMemo, useState} from "react";
import type {ChangeBattleV2Api, TrainingRunGameV4} from "@changebattle-v2/api";
import {TrainingRestNextPreviewPanel, type PreviewPokemonEntry} from "./TrainingRestNextPreviewPanel";
import "./TrainingRestNextPreviewPanel.preview.css";

export function TrainingRestNextPreviewPanelPreview({api}: {api: ChangeBattleV2Api}) {
  const initialRun = useMemo(() => api.createTrainingRunFromScenario(api.createTrainingRunGame({
    id: "next-preview-profile",
    name: "预览训练师",
    avatarAsset: "/npc/avatars/6-asset-a73f3e71.webp",
  })), [api]);
  const [run, setRun] = useState(initialRun);
  function unlock(entry: PreviewPokemonEntry) {
    setRun(current => ({...current, restPreviewUnlocks: {...(current.restPreviewUnlocks || {}), [entry.unlockKey]: true}} as TrainingRunGameV4));
  }
  return (
    <section className="training-rest-next-preview-canvas" aria-label="下一场预览组件预览">
      <div className="training-rest-next-preview-bg" aria-hidden="true" />
      <TrainingRestNextPreviewPanel
        run={run}
        onLockedPokemonClick={unlock}
        onUnlockedPokemonClick={() => undefined}
      />
    </section>
  );
}
