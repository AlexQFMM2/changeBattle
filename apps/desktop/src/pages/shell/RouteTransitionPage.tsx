import {useRef} from "react";
import type {CSSProperties} from "react";
import spritesaurusTransitionVideo from "../../assets/title/spritesaurus-transition.mp4";

const ROUTE_TRANSITION_MIN_MS = 3000;
const ROUTE_TRANSITION_MAX_MS = 5000;

export type RouteTransitionReason =
  | "prepare"
  | "starterReady"
  | "battleStart"
  | "battleComplete"
  | "loadSave"
  | "settlement"
  | "returnHome";

export type RouteTransitionCopy = {
  title: string;
  detail: string;
  tip: string;
  durationMs: number;
};

function routeTransitionDuration() {
  return Math.round(ROUTE_TRANSITION_MIN_MS + Math.random() * (ROUTE_TRANSITION_MAX_MS - ROUTE_TRANSITION_MIN_MS));
}

export function routeTransitionCopy(targetScreen: string, reason: RouteTransitionReason): RouteTransitionCopy {
  const durationMs = routeTransitionDuration();
  if (targetScreen === "starterItems") {
    return {
      title: "准备挑战",
      detail: "正在整理开局道具池",
      tip: "开局道具按数量和质量分开养成，质量决定可见道具池，数量决定每类能拿多少。",
      durationMs,
    };
  }
  if (targetScreen === "rentalSelect") {
    return {
      title: "生成候选",
      detail: "正在同步租赁队伍数据",
      tip: "队伍强度不只看单只宝可梦，招式覆盖、抗性轮换和携带物组合会一起决定上限。",
      durationMs,
    };
  }
  if (targetScreen === "battleMain") {
    return {
      title: "生成对局",
      detail: "正在读取对手队伍与战斗状态",
      tip: "进入对局后先看对手属性、首发状态和己方关键技能，再决定要不要保留核心资源。",
      durationMs,
    };
  }
  if (targetScreen === "rest") {
    return {
      title: reason === "loadSave" ? "载入休整区" : "整理战果",
      detail: reason === "loadSave" ? "正在恢复本局休整状态" : "正在整理奖励与队伍状态",
      tip: "击败的对手可以交换进队，越往后敌人质量越高，后期成长主要靠交换和休整整理。",
      durationMs,
    };
  }
  if (targetScreen === "result") {
    return {
      title: "结算本局",
      detail: "正在汇总本局挑战记录",
      tip: "本局金币会按基础规则折算成 BP，天赋影响实际收益，但结算页会把结果集中展示。",
      durationMs,
    };
  }
  if (targetScreen === "mainMenu") {
    return {
      title: "返回主界面",
      detail: "正在保存训练师记录",
      tip: "BP 可以用于天赋、开局筹备和长期成长；下一局会从这些积累里获得更稳定的开场。",
      durationMs,
    };
  }
  return {
    title: "同步数据",
    detail: "正在切换页面",
    tip: "整理队伍、资源和路线信息，会让下一场对局更容易做出稳定判断。",
    durationMs,
  };
}

export function RouteTransitionPage({title, detail, tip, durationMs}: RouteTransitionCopy) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const style = {"--route-transition-duration": `${durationMs}ms`} as CSSProperties;
  function randomizePlaybackStart() {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 8) return;
    video.currentTime = Math.random() * Math.max(0, video.duration - 6);
    void video.play().catch(() => undefined);
  }

  return (
    <div className="route-transition-page" style={style} aria-live="polite">
      <video ref={videoRef} className="route-transition-video" muted loop playsInline preload="metadata" onLoadedMetadata={randomizePlaybackStart}>
        <source src={spritesaurusTransitionVideo} type="video/mp4" />
      </video>
      <div className="route-transition-shade" aria-hidden="true" />
      <section className="route-transition-loading">
        <div className="route-transition-copy">
          <strong>{title}</strong>
          <span>{detail}</span>
        </div>
        <div className="route-transition-progress" aria-label="加载进度">
          <span />
        </div>
        <p className="route-transition-tip">
          <strong>提示</strong>
          <span>{tip}</span>
        </p>
      </section>
    </div>
  );
}
