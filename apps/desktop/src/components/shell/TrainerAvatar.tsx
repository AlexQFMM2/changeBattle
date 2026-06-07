import {useEffect, useMemo, useState} from "react";
import {assetUrl} from "../../lib/ui";

export function TrainerAvatar({candidates, alt, fallbackText = "?"}: {candidates: Array<string | undefined>; alt: string; fallbackText?: string}) {
  const sources = useMemo(() => {
    const unique = new Set<string>();
    for (const candidate of candidates) {
      const source = assetUrl(candidate);
      if (source) unique.add(source);
    }
    return [...unique];
  }, [candidates]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const source = sources[sourceIndex];

  useEffect(() => {
    setSourceIndex(0);
  }, [sources.join("|")]);

  if (!source) return <i>{fallbackText}</i>;

  return (
    <img
      src={source}
      alt={alt}
      onError={() => {
        setSourceIndex(index => index + 1);
      }}
    />
  );
}
