import type {CSSProperties, ReactNode} from "react";
import {useResponsiveCanvas} from "../../hooks/useResponsiveCanvas";
import "./GameViewport.css";

export function GameViewport({children, viewportClassName = "", screenClassName = "", style}: {children: ReactNode; viewportClassName?: string; screenClassName?: string; style?: CSSProperties}) {
  const responsiveCanvas = useResponsiveCanvas();

  return (
    <main className="game-shell">
      <section className={`game-screen ${screenClassName}`.trim()} ref={responsiveCanvas.ref} style={{...responsiveCanvas.style, ...style}}>
        <div className={`game-viewport ${viewportClassName}`.trim()}>
          {children}
        </div>
      </section>
    </main>
  );
}
