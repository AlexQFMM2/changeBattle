import {Fragment, type ReactNode, useEffect, useState} from "react";
import {MotionConfig, motion} from "motion/react";
import type {TargetAndTransition, Transition, Variants} from "motion/react";

const MotionFragment = motion.create(Fragment);

type AnimationPhase = "idle" | "entry" | "spin" | "expand" | "exit";

const baseValues = {scale: 1, opacity: 1, rotate: 0};

const SPIN_TRANSITION: Transition = {
  ease: "linear",
  duration: 0.33,
  rotate: {
    inherit: true,
    ease: [0.57, 0.44, 0.66, 1.17],
  },
};

const EXPAND_TRANSITION: Transition = {
  type: "spring",
  duration: 0.55,
  bounce: 0.05,
  borderRadius: {inherit: true, ease: "linear"},
  scale: {inherit: true, ease: "backOut"},
  rotate: {type: false},
};

const shellVariants: Record<AnimationPhase, TargetAndTransition> = {
  idle: {scale: 0.42, borderRadius: 75, opacity: 0},
  entry: {
    ...baseValues,
    borderRadius: 75,
    transition: {opacity: {duration: 0.08}, duration: 0.13},
  },
  spin: {
    ...baseValues,
    borderRadius: 50,
    rotate: [-180, 0],
    transition: SPIN_TRANSITION,
  },
  expand: {
    ...baseValues,
    borderRadius: 24,
    transition: EXPAND_TRANSITION,
  },
  exit: {opacity: 0, scale: 0.9, borderRadius: 24},
};

const colorLayerVariants: Record<AnimationPhase, TargetAndTransition> = {
  idle: {borderRadius: 70},
  entry: {borderRadius: 70},
  spin: {borderRadius: 45, transition: SPIN_TRANSITION},
  expand: {borderRadius: 18, transition: EXPAND_TRANSITION},
  exit: {borderRadius: 18},
};

const contentVariants: Record<AnimationPhase, TargetAndTransition> = {
  idle: {opacity: 0, y: 4},
  entry: {opacity: 0, y: 4},
  spin: {opacity: 0, y: 4},
  expand: {
    opacity: 1,
    y: 0,
    transition: {
      opacity: {duration: 0.12, ease: "linear"},
      delayChildren: 0.08,
      staggerChildren: 0.055,
    },
  },
  exit: {opacity: 0, y: 3},
};

const markerVariants: Record<AnimationPhase, TargetAndTransition> = {
  idle: {scale: 0.8, opacity: 0},
  entry: {scale: [0.8, 1.75, 0.8], opacity: 1, transition: {scale: {duration: 0.36, ease: "easeInOut"}, opacity: {duration: 0.05}}},
  spin: {scale: [0.8, 1.75, 0.8], opacity: 1, transition: {scale: {duration: 0.36, ease: "easeInOut"}, opacity: {duration: 0.05}}},
  expand: {scale: 2, opacity: 0, transition: {scale: {duration: 0.36, ease: "easeInOut"}, opacity: {duration: 0.15, delay: 0.3}}},
  exit: {scale: 2, opacity: 0},
};

export const pokopiaItemVariants: Variants = {
  idle: {opacity: 0, y: 6},
  entry: {opacity: 0, y: 6},
  spin: {opacity: 0, y: 6},
  expand: {opacity: 1, y: 0, transition: {type: "spring", stiffness: 520, damping: 30}},
  exit: {opacity: 0, y: 4},
};

type PokopiaModalChildren = ReactNode | ((requestClose: (force?: boolean) => void) => ReactNode);

export function PokopiaModal({children, className = "", closeDisabled = false, labelledBy, onClose}: {children: PokopiaModalChildren; className?: string; closeDisabled?: boolean; labelledBy?: string; onClose: () => void}) {
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>("idle");

  useEffect(() => {
    if (animationPhase !== "idle") return;
    const id = window.setTimeout(() => setAnimationPhase("entry"), 16);
    return () => window.clearTimeout(id);
  }, [animationPhase]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  function requestClose(force = false) {
    if (closeDisabled && !force) return;
    if (animationPhase === "idle" || animationPhase === "entry" || animationPhase === "spin" || animationPhase === "exit") return;
    setAnimationPhase("exit");
  }

  return (
    <MotionConfig transition={animationPhase === "expand" ? EXPAND_TRANSITION : undefined} reducedMotion="user">
      <motion.div className="modal-layer pokopia-layer" data-phase={animationPhase} role="presentation" onClick={() => requestClose()} initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
        <MotionFragment
          initial={false}
          animate={animationPhase}
          onAnimationComplete={definition => {
            if (definition === "entry") setAnimationPhase("spin");
            else if (definition === "spin") setAnimationPhase("expand");
            else if (definition === "exit") onClose();
          }}
        >
          <motion.div className={`pokopia-shell ${className}`} variants={shellVariants} layout role="dialog" aria-modal="true" aria-labelledby={labelledBy} onClick={event => event.stopPropagation()}>
            <motion.div className="pokopia-color-layer" variants={colorLayerVariants} layout />
          </motion.div>
          <motion.div className={`pokopia-content ${className}`} variants={contentVariants} onClick={event => event.stopPropagation()}>
            {typeof children === "function" ? children(requestClose) : children}
          </motion.div>
          <motion.div className="pokopia-marker" variants={markerVariants} aria-hidden="true">
            <svg viewBox="0 0 115 115" fill="none">
              <path d="M55.7433 0.0168174C87.2515 -0.740415 113.418 24.1683 114.212 55.6756C115.007 87.183 90.1295 113.379 58.6231 114.211C27.0639 115.044 0.814386 90.1155 0.0185149 58.5553C-0.777328 26.9952 24.1822 0.775333 55.7433 0.0168174Z" fill="#FDFBF7" />
              <path d="M54.3116 6.21124C82.4237 4.69293 106.441 26.2584 107.946 54.3713C109.452 82.484 87.8757 106.491 59.7622 107.984C31.6666 109.476 7.67795 87.9166 6.17333 59.8218C4.6687 31.7269 26.2174 7.72856 54.3116 6.21124Z" fill="#24483c" />
              <path d="M12.2132 60.7636L38.4644 60.7113C41.1467 68.6183 45.504 73.8847 54.1334 75.5215C63.3339 77.2668 74.0019 70.249 75.3303 60.8202C84.0595 60.6643 93.1491 60.7742 101.903 60.7762C99.287 86.1578 77.9825 101.975 60.3584 101.975C35.5907 103.546 13.8134 85.8403 12.2132 60.7636Z" fill="#FDFBF7" />
              <path d="M32.7167 19.35C59.0868 2.16005 95.4285 17.4744 101.396 48.324C101.729 50.0418 101.893 51.671 102.177 53.3734C93.4621 53.5918 84.3325 53.4668 75.5906 53.4388C74.2155 48.2409 71.3752 43.8985 66.7064 41.1552C62.8705 38.9013 60.7359 38.8329 56.487 38.7633C47.3529 38.6139 40.8877 44.888 38.621 53.3862C29.8802 53.2381 20.9489 53.6203 12.1438 53.3507C13.055 38.018 20.9194 27.0292 32.7167 19.35Z" fill="#8ee377" />
              <path d="M55.2785 43.9393C62.5335 42.9596 69.2137 48.0337 70.2161 55.2854C71.2188 62.5372 66.1658 69.2334 58.9173 70.2588C51.6362 71.2888 44.9035 66.2083 43.8965 58.9241C42.8895 51.6399 47.9912 44.9232 55.2785 43.9393Z" fill="#FDFBF7" />
            </svg>
          </motion.div>
        </MotionFragment>
      </motion.div>
    </MotionConfig>
  );
}
