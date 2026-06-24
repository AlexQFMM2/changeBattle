import {useState} from "react";

export function ImageWithFallback({src, alt, fallback = "?"}: {src?: string; alt: string; fallback?: string}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className="image-fallback">{fallback}</span>;
  return <img src={src} alt={alt} onError={() => setFailed(true)} />;
}
