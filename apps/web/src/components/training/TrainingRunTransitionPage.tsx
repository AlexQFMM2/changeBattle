import type {CSSProperties} from "react";
import {useEffect} from "react";
import {motion} from "motion/react";
import "./TrainingRunTransitionPage.css";

export type TrainingRunTransitionPageProps = {
  title?: string;
  detail?: string;
  tip?: string;
  onReady: () => void;
};

const TRANSITION_MS = 1800;

export function TrainingRunTransitionPage({
  title = "准备训练场",
  detail = "正在生成训练配置",
  tip = "训练场用于快速验证 BattleGame 输入，不会污染正式存档。",
  onReady,
}: TrainingRunTransitionPageProps) {
  useEffect(() => {
    const timer = window.setTimeout(onReady, TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [onReady]);

  return (
    <section className="training-transition-page" style={{"--training-transition-duration": `${TRANSITION_MS}ms`} as CSSProperties} aria-live="polite">
      <div className="training-transition-video-fallback" aria-hidden="true">
        <span />
        <i />
      </div>
      <div className="training-transition-shade" aria-hidden="true" />
      <motion.section className="training-transition-loading" initial={{opacity: 0, y: 18}} animate={{opacity: 1, y: 0}} transition={{type: "spring", stiffness: 300, damping: 30}}>
        <div className="training-transition-copy">
          <strong>{title}</strong>
          <span>{detail}</span>
        </div>
        <div className="training-transition-progress" aria-label="加载进度">
          <span />
        </div>
        <p className="training-transition-tip">
          <strong>提示</strong>
          <span>{tip}</span>
        </p>
      </motion.section>
    </section>
  );
}

