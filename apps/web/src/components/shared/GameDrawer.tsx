import {AnimatePresence, motion} from "motion/react";
import type {CSSProperties, ReactNode} from "react";
import "./GameDrawer.css";

export type GameDrawerPlacement = "left" | "right" | "top" | "bottom";
export type GameDrawerBackdrop = "dismiss" | "static" | "none";

export function GameDrawer({open, placement = "right", title, width, height, backdrop = "dismiss", destroyOnClose = true, className = "", children, onClose}: {
  open: boolean;
  placement?: GameDrawerPlacement;
  title?: ReactNode;
  width?: number | string;
  height?: number | string;
  backdrop?: GameDrawerBackdrop;
  destroyOnClose?: boolean;
  className?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const style = {
    ...(width ? {"--game-drawer-panel-width": toCssSize(width)} : null),
    ...(height ? {"--game-drawer-panel-height": toCssSize(height)} : null),
  } as CSSProperties;
  if (!open && !destroyOnClose) {
    return <div className="game-drawer-preserved" hidden>{children}</div>;
  }
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className={`game-drawer-layer placement-${placement} backdrop-${backdrop}`}
          role="presentation"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          exit={{opacity: 0}}
          transition={{duration: 0.12}}
        >
          {backdrop !== "none" ? (
            <motion.div
              className="game-drawer-backdrop"
              aria-hidden="true"
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              exit={{opacity: 0}}
              transition={{duration: 0.12}}
              onClick={backdrop === "dismiss" ? onClose : undefined}
            />
          ) : null}
          <motion.aside
            className={`game-drawer-panel ${className}`}
            role="dialog"
            aria-modal={backdrop !== "none"}
            aria-label={typeof title === "string" ? title : "详情"}
            style={style}
            initial={drawerOffset(placement)}
            animate={{x: 0, y: 0, opacity: 1}}
            exit={drawerOffset(placement)}
            transition={{type: "spring", stiffness: 420, damping: 38, mass: 0.8}}
            onClick={event => event.stopPropagation()}
          >
            <header className="game-drawer-header">
              <div>{title}</div>
              <button type="button" aria-label="关闭" onClick={onClose}>×</button>
            </header>
            <div className="game-drawer-body">
              {children}
            </div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function drawerOffset(placement: GameDrawerPlacement): {x?: number | string; y?: number | string; opacity: number} {
  if (placement === "left") return {x: "-112%", opacity: 0.88};
  if (placement === "right") return {x: "112%", opacity: 0.88};
  if (placement === "top") return {y: "-112%", opacity: 0.88};
  return {y: "112%", opacity: 0.88};
}

function toCssSize(value: number | string): string {
  return typeof value === "number" ? `${value}px` : value;
}
