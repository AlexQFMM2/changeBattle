import {useMemo, useState} from "react";
import {GameEvolutionModal, type GameEvolutionModalPhase, type GameEvolutionModalTarget} from "./GameEvolutionModal";
import "./GameEvolutionModal.preview.css";

type EvolutionPreviewScenario = "single" | "evolving" | "result" | "details" | "multi" | "long";

const BASE_TARGET: GameEvolutionModalTarget = {
  toSpeciesId: "starmie",
  toName: "宝石海星",
  toSpriteUrl: "",
  friendshipRequirement: 150,
  statChanges: [
    {label: "HP", before: "98", after: "128"},
    {label: "攻击", before: "58", after: "88"},
    {label: "防御", before: "70", after: "105"},
    {label: "特攻", before: "85", after: "125"},
    {label: "特防", before: "70", after: "105"},
    {label: "速度", before: "115", after: "145"},
  ],
};

const MULTI_TARGETS: GameEvolutionModalTarget[] = [
  {...BASE_TARGET, toSpeciesId: "vaporeon", toName: "水伊布", friendshipRequirement: 150},
  {...BASE_TARGET, toSpeciesId: "jolteon", toName: "雷伊布", friendshipRequirement: 150, statChanges: BASE_TARGET.statChanges?.slice(0, 4)},
  {...BASE_TARGET, toSpeciesId: "flareon", toName: "火伊布", friendshipRequirement: 150, statChanges: BASE_TARGET.statChanges?.slice(2)},
];

const SCENARIO_OPTIONS: Array<{id: EvolutionPreviewScenario; label: string; phase: GameEvolutionModalPhase}> = [
  {id: "single", label: "单目标开场", phase: "intro"},
  {id: "evolving", label: "动画中", phase: "evolving"},
  {id: "result", label: "结果提示", phase: "result"},
  {id: "details", label: "最终详情", phase: "details"},
  {id: "multi", label: "多目标", phase: "intro"},
  {id: "long", label: "长名字", phase: "intro"},
];

export function GameEvolutionModalPreview() {
  const [open, setOpen] = useState(true);
  const [scenario, setScenario] = useState<EvolutionPreviewScenario>("single");
  const [confirmation, setConfirmation] = useState("");
  const option = SCENARIO_OPTIONS.find(entry => entry.id === scenario) || SCENARIO_OPTIONS[0];
  const targets = useMemo(() => scenario === "multi" ? MULTI_TARGETS : [scenario === "long" ? {
    ...BASE_TARGET,
    toSpeciesId: "extra-long-target",
    toName: "名字很长很长的进化后形态",
  } : BASE_TARGET], [scenario]);
  const fromName = scenario === "long" ? "名字很长很长的原始形态" : scenario === "multi" ? "伊布" : "海星星";
  const displayName = scenario === "long" ? "很长很长的小伙伴昵称" : fromName;

  function selectScenario(nextScenario: EvolutionPreviewScenario) {
    setScenario(nextScenario);
    setConfirmation("");
    setOpen(true);
  }

  return (
    <section className="game-evolution-modal-preview" aria-label="通用进化弹窗预览">
      <div className="game-evolution-modal-preview-stage">
        <header>
          <div>
            <strong>通用进化弹窗</strong>
            <span>异样提示、进化动画、结果提示、最终对比</span>
          </div>
          <button type="button" onClick={() => setOpen(true)}>打开</button>
        </header>
        <div className="game-evolution-modal-preview-controls" aria-label="预览状态">
          {SCENARIO_OPTIONS.map(entry => (
            <button
              key={entry.id}
              type="button"
              className={scenario === entry.id ? "active" : ""}
              onClick={() => selectScenario(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <p>{confirmation || "640x320 画布内检查弹窗尺寸、动画阶段和长文本截断。"}</p>
        <GameEvolutionModal
          key={`${scenario}:${option.phase}:${open ? "open" : "closed"}`}
          open={open}
          fromName={fromName}
          displayName={displayName}
          fromSpriteUrl=""
          itemName={scenario === "multi" ? "进化石套装" : "水之石"}
          targets={targets}
          initialPhase={option.phase}
          onCancel={() => setOpen(false)}
          onConfirm={toSpeciesId => {
            setConfirmation(`确认进化目标：${toSpeciesId}`);
            setOpen(false);
          }}
        />
      </div>
    </section>
  );
}
