import {motion, type Variants} from "motion/react";
import type {MainMenuDexCard} from "./mainMenuTypes";
import "./FavoritePokemonPanel.css";

export const mainMenuHomePanelVariants: Variants = {
  hidden: (index: number) => ({opacity: 0, x: index === 0 ? -28 : 0, y: index === 0 ? 0 : 22}),
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      delay: 0.18 + index * 0.1,
      type: "spring",
      stiffness: 300,
      damping: 30,
      staggerChildren: 0.045,
      delayChildren: 0.1,
    },
  }),
  leaving: (index: number) => ({
    opacity: 0,
    x: index === 0 ? -34 : 0,
    y: index === 0 ? 0 : 28,
    transition: {duration: 0.24, ease: "easeInOut"},
  }),
};

export const mainMenuCardVariants: Variants = {
  hidden: {opacity: 0, y: 10, scale: 0.94},
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {type: "spring", stiffness: 360, damping: 24},
  },
  leaving: {opacity: 0, y: 8, scale: 0.96, transition: {duration: 0.18, ease: "easeInOut"}},
};

export function FavoritePokemonPanel({cards, leaving = false, onOpenCard}: {cards: MainMenuDexCard[]; leaving?: boolean; onOpenCard: (card: MainMenuDexCard) => void}) {
  return (
    <motion.section className="favorite-pokemon-panel" aria-label="常用宝可梦" custom={0} initial="hidden" animate={leaving ? "leaving" : "visible"} variants={mainMenuHomePanelVariants}>
      <header>
        <strong>常用宝可梦</strong>
        <span>{cards.length}/3</span>
      </header>
      <div className="favorite-pokemon-list">
        {cards.map((card, index) => (
          <motion.button
            className="favorite-pokemon-card"
            type="button"
            onClick={() => onOpenCard(card)}
            variants={mainMenuCardVariants}
            whileHover={{scale: 1.07, y: -4, rotate: index % 2 === 0 ? -1.8 : 1.8}}
            whileTap={{scale: 0.98}}
            transition={{type: "spring", stiffness: 470, damping: 12}}
            key={card.id}
          >
            <span>{card.icon ? <img src={card.icon} alt={card.label} /> : "?"}</span>
            <small>{card.eyebrow}</small>
            <strong>{card.label}</strong>
          </motion.button>
        ))}
        {!cards.length ? <p>完成一局后记录队伍。</p> : null}
      </div>
    </motion.section>
  );
}
