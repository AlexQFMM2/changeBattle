import {SpriteSequencePlayer} from "../sprite/SpriteSequencePlayer";
import {resolveSpriteSequence, type SpriteActionKeyV4} from "../sprite/spriteAnimationCatalog";
import "./TrainingRestShopClerk.css";

export type TrainingRestShopClerkMood = "idle" | "intro";
export type TrainingRestShopClerkAction = Extract<SpriteActionKeyV4, "idle" | "wait" | "intro" | "get" | "pull">;

export type TrainingRestShopClerkProps = {
  mood?: TrainingRestShopClerkMood;
  action?: TrainingRestShopClerkAction;
};

export function TrainingRestShopClerk({mood = "idle", action}: TrainingRestShopClerkProps) {
  const resolvedAction = action || mood;
  const sequence = resolveSpriteSequence("shop-clerk-gardevoir", resolvedAction);
  return (
    <div className={`training-rest-shop-clerk action-${resolvedAction} mood-${mood}`} aria-label="商店服务员">
      <SpriteSequencePlayer sequence={sequence} />
    </div>
  );
}
