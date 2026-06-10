import type {ComponentProps} from "react";
import {BattleHistoryView as BattleHistoryViewComponent} from "../../components/result/BattleHistoryView";

export function BattleHistoryView(props: ComponentProps<typeof BattleHistoryViewComponent>) {
  return <BattleHistoryViewComponent {...props} />;
}
