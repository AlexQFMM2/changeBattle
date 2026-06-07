import type {ComponentProps} from "react";
import {ResultView as ResultViewComponent} from "../../components/result/ResultView";

export function ResultView(props: ComponentProps<typeof ResultViewComponent>) {
  return <ResultViewComponent {...props} />;
}
