import {useState} from "react";
import {TrainingRestShopDialogue} from "./TrainingRestShopDialogue";
import "./TrainingRestShopDialogue.preview.css";

export function TrainingRestShopDialoguePreview() {
  const [message, setMessage] = useState("这瓶厉害伤药能回复大量 HP。现在带上它，下一场会轻松很多哦。");
  return (
    <section className="training-rest-shop-dialogue-preview" aria-label="商店商品对话预览">
      <img className="training-rest-shop-dialogue-preview-bg" src="/shop/rest-store/back.png" alt="" draggable={false} />
      <TrainingRestShopDialogue
        speaker="店员"
        itemName="厉害伤药"
        text={message}
        actions={[
          {label: "再看看", onClick: () => setMessage("没关系，慢慢挑。好东西会等会看货架的人。")},
          {label: "立即购买", meta: "金币 500", primary: true, onClick: () => setMessage("噢，太可惜了，你的钱好像不太够。")},
        ]}
      />
    </section>
  );
}
