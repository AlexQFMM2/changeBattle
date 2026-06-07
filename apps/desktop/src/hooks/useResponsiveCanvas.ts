import {useEffect, useRef, useState} from "react";
import type {CSSProperties, RefObject} from "react";

export function responsiveScale(width: number, height: number, baseWidth = 640, baseHeight = 320): number {
  if (!width || !height) return 1;
  return Math.max(.35, Math.min(4, Math.min(width / baseWidth, height / baseHeight)));
}

export function useResponsiveCanvas(baseWidth = 640, baseHeight = 320): {ref: RefObject<HTMLElement | null>; style: CSSProperties} {
  const ref = useRef<HTMLElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
      setScale(responsiveScale(rect.width, rect.height, baseWidth, baseHeight));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [baseWidth, baseHeight]);

  return {ref, style: {"--ui-scale": scale} as CSSProperties};
}
