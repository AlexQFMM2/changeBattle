import type {CSSProperties, ReactNode} from "react";
import {useResponsiveCanvas} from "../../hooks/useResponsiveCanvas";
import "./GameViewport.css";

export function GameViewport({children, viewportClassName = "", screenClassName = "", style, showVersion = false}: {children: ReactNode; viewportClassName?: string; screenClassName?: string; style?: CSSProperties; showVersion?: boolean}) {
  const responsiveCanvas = useResponsiveCanvas();
  const version = import.meta.env.VITE_CHANGEBATTLE_VERSION;

  return (
    <main className="game-shell">
      <section className={`game-screen ${screenClassName}`.trim()} ref={responsiveCanvas.ref} style={{...responsiveCanvas.style, ...style}}>
        <div className={`game-viewport ${viewportClassName}`.trim()}>
          {children}
          {showVersion && version ? <span className="game-version-badge" aria-label={`版本 ${version}`}>v{version}</span> : null}
        </div>
      </section>
    </main>
  );
}
