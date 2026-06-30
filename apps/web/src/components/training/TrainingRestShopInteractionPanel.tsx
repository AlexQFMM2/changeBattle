import "./TrainingRestShopInteractionPanel.css";
import type {ReactNode} from "react";
import {TrainingRestUiPanel} from "./TrainingRestUiPanel";

export type TrainingRestShopInteractionMode = "buy" | "sell";

export type TrainingRestShopInteractionPanelProps = {
  mode: TrainingRestShopInteractionMode | null;
  children?: ReactNode;
};

export function TrainingRestShopInteractionPanel({mode, children}: TrainingRestShopInteractionPanelProps) {
  return (
    <section
      className="training-rest-shop-interaction-panel"
      data-open={mode ? "true" : "false"}
      aria-label="商店交互面板"
      aria-hidden={mode ? undefined : true}
    >
      <span className="training-rest-shop-interaction-hanger hanger-left" aria-hidden="true" />
      <span className="training-rest-shop-interaction-hanger hanger-right" aria-hidden="true" />
      <TrainingRestUiPanel
        className="training-rest-shop-interaction-card"
        contentClassName="training-rest-shop-interaction-card-inner"
        width="100%"
        height="var(--training-rest-shop-interaction-height)"
      >
        {children}
      </TrainingRestUiPanel>
    </section>
  );
}
