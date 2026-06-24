import "./TitleVideoBackground.css";

export function TitleVideoBackground() {
  return (
    <>
      <video className="title-video-bg" poster="/title/may-pokemon-bg-poster.jpg" autoPlay muted loop playsInline controls={false} disablePictureInPicture controlsList="nodownload nofullscreen noplaybackrate" aria-hidden="true">
        <source src="/title/may-pokemon-bg.mp4" type="video/mp4" />
      </video>
      <div className="title-video-startup-mask" aria-hidden="true" />
      <div className="title-atmosphere" aria-hidden="true" />
    </>
  );
}
