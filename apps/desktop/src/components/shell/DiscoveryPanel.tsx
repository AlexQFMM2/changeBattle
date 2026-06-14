import {AnimatePresence, Reorder, motion} from "motion/react";
import {ItemIcon} from "../../lib/ui";
import type {MainMenuDexCard} from "./mainMenuTypes";
import {mainMenuCardVariants, mainMenuHomePanelVariants} from "./FavoritePokemonPanel";
import "./DiscoveryPanel.css";

export function DiscoveryPanel({cards, leaving = false, onCardsChange, onOpenCard}: {cards: MainMenuDexCard[]; leaving?: boolean; onCardsChange: (cards: MainMenuDexCard[]) => void; onOpenCard: (card: MainMenuDexCard) => void}) {
  return (
    <motion.section className="discovery-panel" aria-label="快捷发现" custom={1} initial="hidden" animate={leaving ? "leaving" : "visible"} variants={mainMenuHomePanelVariants}>
      <header>
        <strong>随便看看</strong>
        <span>进场随机</span>
      </header>
      <Reorder.Group className="discovery-list" axis="y" values={cards} onReorder={onCardsChange}>
        <AnimatePresence initial={false}>
          {cards.map(card => (
            <Reorder.Item className="discovery-card" value={card} onClick={() => onOpenCard(card)} variants={mainMenuCardVariants} initial="hidden" animate="visible" exit="leaving" whileHover={{y: -3, scale: 1.025}} whileTap={{scale: 0.98}} key={card.id}>
              <span className="discovery-icon">
                {card.shopItem ? <ItemIcon item={card.shopItem} /> : card.icon ? <img src={card.icon} alt={card.label} /> : card.category === "moves" ? "TM" : "?"}
              </span>
              <small>{card.eyebrow}</small>
              <strong>{card.label}</strong>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
    </motion.section>
  );
}
