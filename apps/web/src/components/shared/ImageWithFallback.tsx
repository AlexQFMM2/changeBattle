import {useEffect, useState} from "react";

export function ImageWithFallback({src, alt, fallback = "?"}: {src?: string; alt: string; fallback?: string}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);
  if (!src || failed) return <span className="image-fallback">{fallback}</span>;
  return <img src={src} alt={alt} draggable={false} onError={() => setFailed(true)} />;
}
