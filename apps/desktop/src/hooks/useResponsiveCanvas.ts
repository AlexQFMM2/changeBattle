import {useCallback, useEffect, useRef, useState} from "react";
import type {CSSProperties} from "react";

export function responsiveScale(width: number, height: number, baseWidth = 640, baseHeight = 320): number {
  if (!width || !height) return 1;
  return Math.max(.35, Math.min(4, Math.min(width / baseWidth, height / baseHeight)));
}

export function useResponsiveCanvas(baseWidth = 640, baseHeight = 320): {ref: (node: HTMLElement | null) => void; style: CSSProperties} {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [scale, setScale] = useState(1);
  const maxMobileScaleRef = useRef(0);
  const ref = useCallback((nextNode: HTMLElement | null) => {
    setNode(nextNode);
  }, []);

  useEffect(() => {
    if (!node) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
      const nextScale = responsiveScale(rect.width, rect.height, baseWidth, baseHeight);
      if (import.meta.env.VITE_CHANGEBATTLE_MOBILE === "1") {
        maxMobileScaleRef.current = Math.max(maxMobileScaleRef.current || 0, nextScale);
        setScale(maxMobileScaleRef.current || nextScale);
        return;
      }
      setScale(nextScale);
    };
    update();
    const frame = window.requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(node);
    window.addEventListener("resize", update);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [baseWidth, baseHeight, node]);

  return {ref, style: {"--ui-scale": scale} as CSSProperties};
}
