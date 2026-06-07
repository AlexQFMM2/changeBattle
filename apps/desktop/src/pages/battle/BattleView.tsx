import type {ComponentProps} from "react";
import {BattleView as BattleViewComponent} from "../../components/battle/BattleView";

export function BattleView(props: ComponentProps<typeof BattleViewComponent>) {
  return <BattleViewComponent {...props} />;
}
