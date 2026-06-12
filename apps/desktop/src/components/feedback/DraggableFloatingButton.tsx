import {useEffect, useRef, useState} from "react";
import type {CSSProperties, PointerEvent, ReactNode} from "react";

type FloatingPosition = {
  x: number;
  y: number;
};

type FloatingBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function viewportSize(): {width: number; height: number} {
  const viewport = window.visualViewport;
  return {
    width: Math.max(1, viewport?.width || window.innerWidth || document.documentElement.clientWidth || 1),
    height: Math.max(1, viewport?.height || window.innerHeight || document.documentElement.clientHeight || 1),
  };
}

function floatingBounds(width: number, height: number): FloatingBounds {
  const viewport = viewportSize();
  const margin = 4;
  const minX = margin;
  const minY = margin;
  const maxX = Math.max(minX, viewport.width - width - margin);
  const maxY = Math.max(minY, viewport.height - height - margin);
  return {minX, maxX, minY, maxY};
}

function clampPosition(position: FloatingPosition, bounds: FloatingBounds): FloatingPosition {
  return {
    x: clamp(position.x, bounds.minX, bounds.maxX),
    y: clamp(position.y, bounds.minY, bounds.maxY),
  };
}

function readPosition(storageKey?: string): FloatingPosition | null {
  if (!storageKey) return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FloatingPosition>;
    if (!Number.isFinite(parsed.x) || !Number.isFinite(parsed.y)) return null;
    return {x: Number(parsed.x), y: Number(parsed.y)};
  } catch {
    return null;
  }
}

function writePosition(storageKey: string | undefined, position: FloatingPosition): void {
  if (!storageKey) return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(position));
  } catch {
    // Drag persistence is a convenience only.
  }
}

export function DraggableFloatingButton({
  children,
  className = "",
  storageKey,
  title,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  storageKey?: string;
  title?: string;
  onClick: () => void;
}) {
  const [position, setPosition] = useState<FloatingPosition | null>(() => readPosition(storageKey));
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    bounds: FloatingBounds;
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  function clampCurrentPosition(): void {
    const element = buttonRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const bounds = floatingBounds(rect.width, rect.height);
    const current = position || {
      x: rect.left,
      y: rect.top,
    };
    const next = clampPosition(current, bounds);
    if (Math.abs(next.x - current.x) > 0.5 || Math.abs(next.y - current.y) > 0.5) {
      setPosition(next);
      writePosition(storageKey, next);
    }
  }

  useEffect(() => {
    clampCurrentPosition();
    const handleResize = () => clampCurrentPosition();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  });

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      bounds: floatingBounds(rect.width, rect.height),
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    element.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (distance > 3) drag.moved = true;
    const next = {
      x: clamp(event.clientX - drag.offsetX, drag.bounds.minX, drag.bounds.maxX),
      y: clamp(event.clientY - drag.offsetY, drag.bounds.minY, drag.bounds.maxY),
    };
    setPosition(next);
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (drag.moved) {
      suppressClickRef.current = true;
      const rect = event.currentTarget.getBoundingClientRect();
      const next = clampPosition({
        x: rect.left,
        y: rect.top,
      }, floatingBounds(rect.width, rect.height));
      setPosition(next);
      writePosition(storageKey, next);
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  }

  function handleClick() {
    if (suppressClickRef.current) return;
    onClick();
  }

  const style = {
    position: "fixed",
    ...(position ? {left: position.x, top: position.y, right: "auto", bottom: "auto"} : {}),
  } as CSSProperties;

  return (
    <button
      ref={buttonRef}
      className={`draggable-floating-button ${className}`.trim()}
      title={title}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
