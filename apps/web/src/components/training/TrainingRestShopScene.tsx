import type {ChangeBattleV2Api, FormalRestShopV4} from "@changebattle-v2/api";
import {TrainingRestShopDialogue, type TrainingRestShopDialogueProps} from "./TrainingRestShopDialogue";
import {TrainingRestShopClerk} from "./TrainingRestShopClerk";
import {TrainingRestShopRouteButton} from "./TrainingRestShopRouteButton";
import {TrainingRestShopShelf} from "./TrainingRestShopShelf";
import "./TrainingRestShopScene.css";

export type TrainingRestShopSceneProps = {
  api: ChangeBattleV2Api;
  open: boolean;
  shop: FormalRestShopV4 | null;
  money: number;
  busy?: boolean;
  dialogue?: TrainingRestShopDialogueProps | null;
  onBack: () => void;
};

export function TrainingRestShopScene({api, open, shop, money, busy = false, dialogue = null, onBack}: TrainingRestShopSceneProps) {
  return (
    <section className="training-rest-shop-scene" data-open={open ? "true" : "false"} aria-label="休整商店场景" aria-hidden={!open}>
      <img className="training-rest-shop-scene-back" src="/shop/rest-store/back-640.png" alt="" draggable={false} />
      <img className="training-rest-shop-scene-shelf-layer" src="/shop/rest-store/shelf-layer-640.png" alt="" draggable={false} />
      <TrainingRestShopShelf api={api} shop={shop} backgroundVisible={false} />
      <div className="training-rest-shop-scene-clerk">
        <TrainingRestShopClerk mood="idle" />
      </div>
      <img className="training-rest-shop-scene-counter-layer" src="/shop/rest-store/counter-layer-640.png" alt="" draggable={false} />
      <TrainingRestShopRouteButton
        className="training-rest-shop-scene-back-route"
        label="去休整中心"
        direction="left"
        onClick={onBack}
      />
      <div className="training-rest-shop-scene-money" aria-label="当前金币">
        <img src="/aboutIcon/coin.png" alt="" draggable={false} />
        <strong>{Math.max(0, Math.floor(money)).toLocaleString()}</strong>
      </div>
      {dialogue ? <TrainingRestShopDialogue {...dialogue} /> : null}
      {busy ? <div className="training-rest-shop-scene-busy" role="status">整理货架中</div> : null}
    </section>
  );
}
