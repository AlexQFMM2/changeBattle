import type {ButtonHTMLAttributes} from "react";
import "./QuickDexButton.css";

export function QuickDexButton(props: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type">) {
  return (
    <button {...props} type="button" className={`quick-dex-button ${props.className || ""}`.trim()}>
      图鉴
    </button>
  );
}
