import type {ComponentProps} from "react";
import {QuickDexModal as QuickDexModalComponent} from "../../components/dex/QuickDexModal";

export function QuickDexModal(props: ComponentProps<typeof QuickDexModalComponent>) {
  return <QuickDexModalComponent {...props} />;
}
