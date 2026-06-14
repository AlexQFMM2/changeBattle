import {BattleHistoryPage} from "./history/BattleHistoryPage";

type BattleHistoryViewProps = {
  onBack: () => void;
};

export function BattleHistoryView(props: BattleHistoryViewProps) {
  return <BattleHistoryPage {...props} />;
}
