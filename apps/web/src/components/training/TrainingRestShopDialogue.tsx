import "./TrainingRestShopDialogue.css";

export type TrainingRestShopDialogueAction = {
  label: string;
  meta?: string;
  primary?: boolean;
  onClick: () => void;
};

export type TrainingRestShopDialogueProps = {
  speaker?: string;
  text: string;
  itemName?: string;
  actions?: TrainingRestShopDialogueAction[];
  onBackdropClick?: () => void;
};

export function TrainingRestShopDialogue({speaker = "店员", text, itemName, actions = [], onBackdropClick}: TrainingRestShopDialogueProps) {
  return (
    <section
      className="training-rest-shop-dialogue"
      role="dialog"
      aria-label="商店对话"
      onClick={event => {
        if (event.target === event.currentTarget) onBackdropClick?.();
      }}
    >
      <div className="training-rest-shop-dialogue-clerk" aria-hidden="true" />
      <div className="training-rest-shop-dialogue-box">
        <div className="training-rest-shop-dialogue-text">
          <header>
            <strong>{speaker}</strong>
            {itemName ? <span>{itemName}</span> : null}
          </header>
          <p>{text}</p>
        </div>
        <div className="training-rest-shop-dialogue-actions">
          {actions.slice(0, 3).map(action => (
            <button className={action.primary ? "primary" : ""} type="button" onClick={action.onClick} key={action.label}>
              <strong>{action.label}</strong>
              {action.meta ? <small>{action.meta}</small> : null}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
