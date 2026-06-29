import "./TrainingRestShopRouteButton.css";

export type TrainingRestShopRouteButtonProps = {
  label: string;
  direction?: "right" | "left";
  className?: string;
  onClick: () => void;
};

export function TrainingRestShopRouteButton({label, direction = "right", className = "", onClick}: TrainingRestShopRouteButtonProps) {
  return (
    <button
      className={`training-rest-shop-route-button direction-${direction} ${className}`}
      type="button"
      onClick={onClick}
    >
      <img src="/shop/rest-store/to.png" alt="" draggable={false} />
      <strong>{label}</strong>
    </button>
  );
}
