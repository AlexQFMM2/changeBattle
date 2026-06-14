import type {DesktopDexEntry} from "@changebattle/shared";
import type {DexVariant} from "./dexModel";
import "./ItemDexDetail.css";

export function ItemDexDetail({entry, variant = "full"}: {entry: DesktopDexEntry; variant?: DexVariant}) {
  return <p className={variant === "quick" ? "quick-dex-description" : "dex-description"}>{entry.desc_zh || "暂无中文说明。"}</p>;
}

export function AbilityDexDetail({entry, variant = "full"}: {entry: DesktopDexEntry; variant?: DexVariant}) {
  return <p className={variant === "quick" ? "quick-dex-description" : "dex-description"}>{entry.desc_zh || "暂无中文说明。"}</p>;
}
