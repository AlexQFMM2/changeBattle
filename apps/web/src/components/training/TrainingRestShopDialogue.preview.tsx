import {useState} from "react";
import {TrainingRestShopDialogue} from "./TrainingRestShopDialogue";
import "./TrainingRestShopDialogue.preview.css";

export function TrainingRestShopDialoguePreview() {
  const [message, setMessage] = useState("欢迎光临，今天想要做些什么呢");
  return (
    <section className="training-rest-shop-dialogue-preview" aria-label="商店商品对话预览">
      <img className="training-rest-shop-dialogue-preview-bg" src="shop/rest-store/back-lounge-menu-v4-640.png" alt="" draggable={false} />
      <TrainingRestShopDialogue
        speaker="店员"
        text={message}
        actions={[
          {label: "离开", onClick: () => setMessage("欢迎下次再来。")},
          {label: "售出", onClick: () => setMessage("出售功能正在整理中。")},
          {label: "购买", primary: true, onClick: () => setMessage("购买清单马上就来。")},
        ]}
      />
    </section>
  );
}
