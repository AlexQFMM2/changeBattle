import {motion, type Variants} from "motion/react";
import "./MainMenuCommandBar.css";

export type MainMenuCommandItem = {
  label: string;
  action: () => void;
  instant?: boolean;
};

const mainMenuItemVariants: Variants = {
  hidden: (index: number) => ({opacity: 0, x: 36, y: index * 2}),
  visible: (index: number) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: {delay: 0.12 + index * 0.07, type: "spring", stiffness: 330, damping: 30},
  }),
  leaving: (index: number) => ({
    opacity: 0,
    x: 38,
    y: -index * 1.5,
    transition: {delay: index * 0.06, duration: 0.24, ease: "easeInOut"},
  }),
};

export function MainMenuCommandBar({items, leaving = false, onChoose}: {items: MainMenuCommandItem[]; leaving?: boolean; onChoose: (item: MainMenuCommandItem) => void}) {
  return (
    <motion.nav className={`main-menu-command-bar ${leaving ? "leaving" : ""}`} aria-label="主页菜单" initial="hidden" animate={leaving ? "leaving" : "visible"}>
      {items.map((item, index) => (
        <motion.button custom={index} variants={mainMenuItemVariants} type="button" onClick={() => onChoose(item)} key={item.label}>
          {item.label}
        </motion.button>
      ))}
    </motion.nav>
  );
}
