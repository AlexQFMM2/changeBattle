import type {CSSProperties, ReactNode} from "react";
import {useResponsiveCanvas} from "../../hooks/useResponsiveCanvas";

export function GameViewport({
  children,
  viewportClassName = "",
  screenClassName = "",
  style,
  showVersion = false,
  versionLabel = "release 0.1.4",
  versionChecking = false,
  onVersionClick,
}: {
  children: ReactNode;
  viewportClassName?: string;
  screenClassName?: string;
  style?: CSSProperties;
  showVersion?: boolean;
  versionLabel?: string;
  versionChecking?: boolean;
  onVersionClick?: () => void | Promise<void>;
}) {
  const responsiveCanvas = useResponsiveCanvas();
  const screenClasses = ["game-screen", screenClassName].filter(Boolean).join(" ");
  const viewportClasses = ["game-viewport", viewportClassName].filter(Boolean).join(" ");
  const badgeText = versionChecking ? "检查中..." : versionLabel;
  return (
    <main className="game-shell">
      <section className={screenClasses} ref={responsiveCanvas.ref} style={{...responsiveCanvas.style, ...style}}>
        <div className={viewportClasses}>
          {children}
          {showVersion && onVersionClick ? (
            <button className="game-version-badge" type="button" aria-label={`检查更新，当前 ${versionLabel}`} disabled={versionChecking} onClick={() => void onVersionClick()}>
              {badgeText}
            </button>
          ) : showVersion ? (
            <span className="game-version-badge" aria-label={`当前 ${versionLabel}`}>{badgeText}</span>
          ) : null}
        </div>
      </section>
    </main>
  );
}
