import type {ReactNode} from "react";
import "./RestMainPanelHost.css";

export function RestMainPanelHost({children}: {children: ReactNode}) {
  return (
    <section className="rest-main-panel-host" aria-label="休整工作区">
      {children}
    </section>
  );
}
