import {motion} from "motion/react";
import type {Variants} from "motion/react";
import "./TitleLogo.css";

const draw: Variants = {
  hidden: {pathLength: 0, opacity: 0},
  visible: (delay: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {pathLength: {delay, duration: 0.8, ease: [0.42, 0, 0.58, 1]}, opacity: {delay, duration: 0.2}},
  }),
};

export function TitleLogo() {
  return (
    <div className="title-logo" aria-label="ChangeBattle 宝可梦对战工厂">
      <motion.svg viewBox="0 0 216 72" role="img" initial="hidden" animate="visible">
        <title>ChangeBattle</title>
        <defs>
          <linearGradient id="titleLogoGold" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f8efbd" />
            <stop offset="48%" stopColor="#f3d96e" />
            <stop offset="100%" stopColor="#9ee073" />
          </linearGradient>
          <filter id="titleLogoGlow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <motion.text className="title-logo-kicker" x="4" y="14" initial={{opacity: 0, y: -2}} animate={{opacity: 1, y: 0}} transition={{duration: 0.32}}>
          BATTLE FACTORY
        </motion.text>
        <motion.text className="title-logo-word" x="3" y="47" initial={{opacity: 0, y: 5}} animate={{opacity: 1, y: 0}} transition={{delay: 0.12, duration: 0.36}}>
          ChangeBattle
        </motion.text>
        <motion.path className="title-logo-stroke shadow" d="M5 55 C45 66 93 63 132 57 C160 52 182 52 210 61" custom={0.2} variants={draw} />
        <motion.path className="title-logo-stroke" d="M7 54 C44 63 91 61 130 55 C158 50 181 50 207 58" custom={0.26} variants={draw} />
        <motion.path className="title-logo-accent" d="M160 18 C176 12 192 13 206 20" custom={0.42} variants={draw} />
        <motion.path className="title-logo-accent short" d="M171 24 C184 20 195 21 205 27" custom={0.54} variants={draw} />
      </motion.svg>
      <p>宝可梦对战工厂</p>
    </div>
  );
}
