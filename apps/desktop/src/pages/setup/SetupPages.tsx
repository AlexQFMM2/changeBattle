import type {ComponentProps} from "react";
import {
  RentalSelect as RentalSelectComponent,
  BattleSettingPage as BattleSettingPageComponent,
  StarterItemsView as StarterItemsViewComponent,
  StarterUpgradePage as StarterUpgradePageComponent,
  TalentConfigView as TalentConfigViewComponent,
} from "../../components/setup/SetupPages";

export function TalentConfigView(props: ComponentProps<typeof TalentConfigViewComponent>) {
  return <TalentConfigViewComponent {...props} />;
}

export function StarterUpgradePage(props: ComponentProps<typeof StarterUpgradePageComponent>) {
  return <StarterUpgradePageComponent {...props} />;
}

export function BattleSettingPage(props: ComponentProps<typeof BattleSettingPageComponent>) {
  return <BattleSettingPageComponent {...props} />;
}

export function StarterItemsView(props: ComponentProps<typeof StarterItemsViewComponent>) {
  return <StarterItemsViewComponent {...props} />;
}

export function RentalSelect(props: ComponentProps<typeof RentalSelectComponent>) {
  return <RentalSelectComponent {...props} />;
}
