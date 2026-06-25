import type {CSSProperties} from "react";
import {useEffect, useRef, useState} from "react";
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(onReady, TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [onReady]);

  function playVideo() {
    void videoRef.current?.play().then(() => setVideoPlaying(true)).catch(() => setVideoPlaying(false));
  }

  function randomizePlaybackStart() {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 8) {
      playVideo();
      return;
    }
    video.currentTime = Math.random() * Math.max(0, video.duration - 6);
    playVideo();
  }

  return (
    <section className="training-transition-page" style={{"--training-transition-duration": `${TRANSITION_MS}ms`} as CSSProperties} aria-live="polite">
      <video ref={videoRef} className={`training-transition-video ${videoPlaying ? "playing" : ""}`} autoPlay muted loop playsInline preload="auto" controls={false} disablePictureInPicture controlsList="nodownload nofullscreen noplaybackrate" onLoadedMetadata={randomizePlaybackStart} onCanPlay={playVideo} aria-hidden="true">
        <source src="/title/spritesaurus-transition.mp4" type="video/mp4" />
      </video>
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
