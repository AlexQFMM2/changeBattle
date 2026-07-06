import type {CSSProperties, ReactNode} from "react";
import {useResponsiveCanvas} from "../../hooks/useResponsiveCanvas";

export function GameViewport({children, viewportClassName = "", screenClassName = "", style, showVersion = false}: {children: ReactNode; viewportClassName?: string; screenClassName?: string; style?: CSSProperties; showVersion?: boolean}) {
  const responsiveCanvas = useResponsiveCanvas();
  const screenClasses = ["game-screen", screenClassName].filter(Boolean).join(" ");
  const viewportClasses = ["game-viewport", viewportClassName].filter(Boolean).join(" ");
  return (
    <main className="game-shell">
      <section className={screenClasses} ref={responsiveCanvas.ref} style={{...responsiveCanvas.style, ...style}}>
        <div className={viewportClasses}>
          {children}
          {showVersion ? <span className="game-version-badge" aria-label="release 0.1.4">release 0.1.4</span> : null}
        </div>
      </section>
    </main>
  );
}
