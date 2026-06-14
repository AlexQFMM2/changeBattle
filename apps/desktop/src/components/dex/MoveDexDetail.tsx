import type {DesktopDexEntry} from "@changebattle/shared";
import type {DexVariant} from "./dexModel";
import "./MoveDexDetail.css";

export function MoveDexDetail({entry, variant = "full"}: {entry: DesktopDexEntry; variant?: DexVariant}) {
  const factClass = variant === "quick" ? "quick-dex-facts" : "dex-fact-grid";
  const descriptionClass = variant === "quick" ? "quick-dex-description" : "dex-description";
  return (
    <>
      <div className={factClass}>
        {variant === "quick" ? (
          <>
            <p>属性 <strong>{entry.type_zh || entry.type || "--"}</strong></p>
            <p>分类 <strong>{entry.move_category_zh || entry.move_category || "--"}</strong></p>
            <p>威力 <strong>{entry.power || "--"}</strong></p>
            <p>命中 <strong>{entry.accuracy ?? "必中"}</strong></p>
            <p>PP <strong>{entry.pp || "--"}</strong></p>
            <p>优先度 <strong>{entry.priority || 0}</strong></p>
          </>
        ) : (
          <>
            <p>属性：{entry.type_zh || entry.type || "--"}</p>
            <p>分类：{entry.move_category_zh || entry.move_category || "--"}</p>
            <p>威力：{entry.power || "--"}</p>
            <p>命中：{entry.accuracy ?? "必中"}</p>
            <p>PP：{entry.pp || "--"}</p>
            <p>优先度：{entry.priority || 0}</p>
          </>
        )}
      </div>
      <p className={descriptionClass}>{entry.desc_zh || "暂无中文说明。"}</p>
    </>
  );
}
