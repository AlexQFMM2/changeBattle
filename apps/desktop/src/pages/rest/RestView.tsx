import type {ComponentProps} from "react";
import {ExchangeView as ExchangeViewComponent, RestView as RestViewComponent} from "../../components/rest/RestView";

export function ExchangeView(props: ComponentProps<typeof ExchangeViewComponent>) {
  return <ExchangeViewComponent {...props} />;
}

export function RestView(props: ComponentProps<typeof RestViewComponent>) {
  return <RestViewComponent {...props} />;
}
