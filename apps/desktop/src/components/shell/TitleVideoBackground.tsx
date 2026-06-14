import titleBackgroundPoster from "../../assets/title/may-pokemon-bg-poster.jpg";
import titleBackgroundVideo from "../../assets/title/may-pokemon-bg.mp4";
import "./TitleVideoBackground.css";

export function TitleVideoBackground({masked = true}: {masked?: boolean}) {
  return (
    <>
      <video className="title-video-bg" poster={titleBackgroundPoster} autoPlay muted loop playsInline controls={false} disablePictureInPicture controlsList="nodownload nofullscreen noplaybackrate" aria-hidden="true">
        <source src={titleBackgroundVideo} type="video/mp4" />
      </video>
      {masked ? <div className="title-video-startup-mask" aria-hidden="true" /> : null}
      <div className="title-atmosphere" aria-hidden="true" />
    </>
  );
}
