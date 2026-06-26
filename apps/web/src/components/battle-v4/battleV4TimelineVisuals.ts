import type {CSSProperties} from "react";
import type {BattleAnimationEventV4, BattleProtocolSeatV4} from "./battleV4Playback";
import type {ShowdownAnimationStepV4} from "./battleV4ShowdownAnimationAdapter";

export type BattleV4TimelineVisuals = {
  fx: {
    visible: boolean;
    targetSeat: BattleProtocolSeatV4;
    kind: string;
    effectSprite: string;
    durationMs: number;
    style: CSSProperties;
  };
  result: {
    visible: boolean;
    targetSeat: BattleProtocolSeatV4;
    kind: string;
    text: string;
    tone: "good" | "bad" | "neutral" | "status" | "weather" | "";
  };
  background: {
    visible: boolean;
    color: string;
    opacity: number;
    durationMs: number;
    label: string;
    weatherId: string;
  };
  actor: {
    seat: BattleProtocolSeatV4;
    style: CSSProperties;
    className: string;
  } | null;
};

export function getBattleV4ActiveTimelineVisuals(
  animation: BattleAnimationEventV4 | null,
  step: ShowdownAnimationStepV4 | null,
): BattleV4TimelineVisuals {
  const fallbackSeat = animation?.targetSeat || animation?.actorSeat || "";
  const fallbackKind = animation?.kind || "";
  const visuals: BattleV4TimelineVisuals = {
    fx: {
      visible: Boolean(animation && fallbackKind !== "turn" && fallbackKind !== "message"),
      targetSeat: fallbackSeat,
      kind: fallbackKind,
      effectSprite: animation?.effectSprite || "impact",
      durationMs: animation?.durationMs || 600,
      style: fxStyle(animation?.effectSprite || "impact", animation?.durationMs || 600),
    },
    result: {
      visible: Boolean(animation?.resultText || fallbackKind === "damage" || fallbackKind === "heal"),
      targetSeat: fallbackSeat,
      kind: fallbackKind,
      text: fallbackResultText(animation),
      tone: animation?.resultTone || "neutral",
    },
    background: {
      visible: Boolean(animation?.kind === "weather" && animation.weatherId && animation.weatherId !== "none"),
      color: "#f3d45a",
      opacity: .42,
      durationMs: animation?.durationMs || 800,
      label: animation?.resultText || "天气",
      weatherId: animation?.weatherId || "",
    },
    actor: null,
  };

  if (!animation || !step) return visuals;
  if (step.type === "showEffect") {
    const effectSprite = step.sprite.effectId || step.effectId || animation.effectSprite || "impact";
    return {
      ...visuals,
      fx: {
        visible: true,
        targetSeat: step.to.seat || fallbackSeat,
        kind: animation.kind,
        effectSprite,
        durationMs: step.durationMs,
        style: fxStyle(effectSprite, step.durationMs, step.sprite.scale, step.sprite.opacity),
      },
      result: {...visuals.result, visible: false},
    };
  }
  if (step.type === "actorAnim") {
    return {
      ...visuals,
      fx: {...visuals.fx, visible: false},
      result: {...visuals.result, visible: false},
      actor: {
        seat: step.actor.seat,
        className: "anim-timeline-actor",
        style: actorStyle(step),
      },
    };
  }
  if (step.type === "backgroundEffect") {
    return {
      ...visuals,
      fx: {...visuals.fx, visible: false},
      result: {...visuals.result, visible: false},
      background: {
        visible: true,
        color: step.color,
        opacity: step.opacity,
        durationMs: step.durationMs,
        label: animation.resultText || (animation.kind === "weather" ? "天气变化" : "能力发动"),
        weatherId: animation.weatherId || animation.selectedAnimationKey || "",
      },
    };
  }
  if (step.type === "resultAnim") {
    return {
      ...visuals,
      fx: {...visuals.fx, visible: false},
      result: {
        visible: Boolean(step.text || animation.resultText),
        targetSeat: step.actor.seat || fallbackSeat,
        kind: animation.kind,
        text: step.text || animation.resultText,
        tone: step.tone || animation.resultTone || "neutral",
      },
    };
  }
  if (step.type === "damageAnim") {
    return {
      ...visuals,
      fx: {...visuals.fx, visible: false},
      result: {
        visible: true,
        targetSeat: step.actor.seat || fallbackSeat,
        kind: animation.kind,
        text: "受到伤害",
        tone: "bad",
      },
    };
  }
  if (step.type === "healAnim") {
    return {
      ...visuals,
      fx: {...visuals.fx, visible: false},
      result: {
        visible: true,
        targetSeat: step.actor.seat || fallbackSeat,
        kind: animation.kind,
        text: animation.resultText || "恢复体力",
        tone: "good",
      },
    };
  }
  return {
    ...visuals,
    fx: {...visuals.fx, visible: false},
    result: {...visuals.result, visible: false},
  };
}

function fxStyle(effectSprite: string, durationMs: number, scale = 1, opacity = 1): CSSProperties {
  return {
    "--battle-v4-fx-image": `url("/showdown/fx/${effectSprite}.png")`,
    "--battle-v4-fx-duration": `${durationMs}ms`,
    "--battle-v4-fx-scale": String(scale),
    "--battle-v4-fx-opacity": String(opacity),
  } as CSSProperties;
}

function actorStyle(step: Extract<ShowdownAnimationStepV4, {type: "actorAnim"}>): CSSProperties {
  const base = step.actor;
  const props = step.props;
  const x = typeof props.x === "number" ? props.x - base.x : 0;
  const y = typeof props.y === "number" ? props.y - base.y : 0;
  const scale = typeof props.scale === "number" ? props.scale : 1;
  const xscale = typeof props.xscale === "number" ? props.xscale : 1;
  const yscale = typeof props.yscale === "number" ? props.yscale : 1;
  const opacity = typeof props.opacity === "number" ? props.opacity : 1;
  return {
    "--battle-v4-actor-x": `${x}px`,
    "--battle-v4-actor-y": `${y}px`,
    "--battle-v4-actor-scale": String(scale),
    "--battle-v4-actor-xscale": String(xscale),
    "--battle-v4-actor-yscale": String(yscale),
    "--battle-v4-actor-opacity": String(opacity),
    "--battle-v4-actor-duration": `${step.durationMs}ms`,
  } as CSSProperties;
}

function fallbackResultText(animation: BattleAnimationEventV4 | null): string {
  if (!animation) return "";
  if (animation.resultText) return animation.resultText;
  if (animation.kind === "damage") return "受到伤害";
  if (animation.kind === "heal") return "恢复体力";
  return "";
}
