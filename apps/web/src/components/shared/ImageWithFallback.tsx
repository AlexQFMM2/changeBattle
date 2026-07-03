import {useEffect, useState} from "react";
import {assetUrl} from "../../lib/assetUrl";

export function ImageWithFallback({src, alt, fallback = "?"}: {src?: string; alt: string; fallback?: string}) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = assetUrl(src);
  useEffect(() => {
    setFailed(false);
  }, [resolvedSrc]);
  if (!resolvedSrc || failed) return <span className="image-fallback">{fallback}</span>;
  return <img src={resolvedSrc} alt={alt} draggable={false} onError={() => {
    console.error("[ImageWithFallback] image failed", {src, resolvedSrc, alt});
    setFailed(true);
  }} />;
}
