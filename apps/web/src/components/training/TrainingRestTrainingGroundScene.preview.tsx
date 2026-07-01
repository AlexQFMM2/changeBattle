import {useMemo, useState} from "react";
import type {ChangeBattleV2Api, FormalTrainingGroundLessonViewV4, TrainingPlayerDraftV4} from "@changebattle-v2/api";
import {TrainingRestTrainingGroundScene} from "./TrainingRestTrainingGroundScene";
import "./TrainingRestTrainingGroundScene.preview.css";

const PREVIEW_LESSON: FormalTrainingGroundLessonViewV4 = {
  lessonId: "preview-training-ground:lesson:0:self-study",
  kind: "self-study",
  teacherLabel: "自习课",
  introText: "教室里现在没有老师，大家都在埋头自习，是否让宝可梦自主学习？座位费 200 金币。",
  completeText: "自习课结束了。",
  fee: 200,
  source: "self-study",
};

export function TrainingRestTrainingGroundScenePreview({api}: {api: ChangeBattleV2Api}) {
  const player = useMemo(() => createPreviewPlayer(api), [api]);
  const [message, setMessage] = useState("预览：进入学习可查看宝可梦选择卡片。");
  return (
    <section className="training-rest-training-ground-preview" aria-label="训练场独立场景预览">
      <TrainingRestTrainingGroundScene
        api={api}
        open
        lesson={PREVIEW_LESSON}
        player={player}
        money={1800}
        onBack={() => setMessage("预览：返回休整中心。")}
        onLessonComplete={setMessage}
      />
      <div className="training-rest-training-ground-preview-note" role="status">{message}</div>
    </section>
  );
}

function createPreviewPlayer(api: ChangeBattleV2Api): TrainingPlayerDraftV4 {
  const team = api.randomizeTrainingTeam("p1", 2, ["dragonair", "tentacruel"]);
  return {
    playerId: "p1",
    name: "预览训练师",
    avatar: "/npc/avatars/6-asset-a73f3e71.webp",
    controller: "local",
    alliance: "near",
    localTeam: {
      ...team,
      pokemon: team.pokemon.map((pokemon, index) => ({
        ...pokemon,
        nameZh: index === 0 ? "黏美龙（洗翠的样子）" : pokemon.nameZh,
        level: 52,
      })),
    },
    bag: {maxSize: 50, items: [], battleBagEnabled: true},
  };
}
