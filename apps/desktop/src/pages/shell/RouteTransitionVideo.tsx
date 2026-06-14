import {useRef, useState} from "react";
import spritesaurusTransitionVideo from "../../assets/title/spritesaurus-transition.mp4";
import "./RouteTransitionVideo.css";

export function RouteTransitionVideo({disabled = false}: {disabled?: boolean}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  function playVideo() {
    if (disabled) return;
    void videoRef.current?.play().then(() => setVideoPlaying(true)).catch(() => setVideoPlaying(false));
  }

  function randomizePlaybackStart() {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 8) return;
    video.currentTime = Math.random() * Math.max(0, video.duration - 6);
    playVideo();
  }

  return (
    <>
      {!disabled ? (
        <video ref={videoRef} className={`route-transition-video ${videoPlaying ? "playing" : ""}`} autoPlay muted loop playsInline preload="auto" controls={false} disablePictureInPicture controlsList="nodownload nofullscreen noplaybackrate" onLoadedMetadata={randomizePlaybackStart} onCanPlay={playVideo}>
          <source src={spritesaurusTransitionVideo} type="video/mp4" />
        </video>
      ) : null}
      <div className="route-transition-shade" aria-hidden="true" />
    </>
  );
}
