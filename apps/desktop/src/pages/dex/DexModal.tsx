import type {ComponentProps} from "react";
import {DexModal as DexModalComponent} from "../../components/dex/DexModal";

export function DexModal(props: ComponentProps<typeof DexModalComponent>) {
  return <DexModalComponent {...props} />;
}
