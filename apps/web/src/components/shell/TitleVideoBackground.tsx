import {assetUrl} from "../../lib/assetUrl";
import "./TitleVideoBackground.css";

export function TitleVideoBackground({preferStatic = false}: {preferStatic?: boolean}) {
  return (
    <>
      {preferStatic ? (
        <img className="title-video-bg title-video-bg-static" src={assetUrl("title/may-pokemon-bg-poster.jpg")} alt="" aria-hidden="true" />
      ) : (
        <video className="title-video-bg" poster={assetUrl("title/may-pokemon-bg-poster.jpg")} autoPlay muted loop playsInline controls={false} disablePictureInPicture controlsList="nodownload nofullscreen noplaybackrate" aria-hidden="true">
          <source src={assetUrl("title/may-pokemon-bg.mp4")} type="video/mp4" />
        </video>
      )}
      <div className="title-video-startup-mask" aria-hidden="true" />
      <div className="title-atmosphere" aria-hidden="true" />
    </>
  );
}
