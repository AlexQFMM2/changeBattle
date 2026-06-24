import {motion} from "motion/react";
import type {ComponentProps} from "react";

type MotionDivProps = ComponentProps<typeof motion.div>;
type MotionSectionProps = ComponentProps<typeof motion.section>;

export function AnimatedPage(props: MotionDivProps) {
  return (
    <motion.div
      initial={{opacity: 0, y: 8}}
      animate={{opacity: 1, y: 0}}
      exit={{opacity: 0, y: -6}}
      transition={{duration: 0.18, ease: "easeOut"}}
      {...props}
    />
  );
}

export function AnimatedPanel(props: MotionSectionProps) {
  return (
    <motion.section
      initial={{opacity: 0, scale: 0.98, y: 8}}
      animate={{opacity: 1, scale: 1, y: 0}}
      exit={{opacity: 0, scale: 0.985, y: 6}}
      transition={{duration: 0.18, ease: "easeOut"}}
      {...props}
    />
  );
}
