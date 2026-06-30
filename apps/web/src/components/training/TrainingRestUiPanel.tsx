import type {CSSProperties, ReactNode} from "react";
import "./TrainingRestUiPanel.css";

export type TrainingRestUiPanelProps = {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
  width?: number | string;
  height?: number | string;
};

function toCssSize(value: number | string | undefined): string | undefined {
  if (typeof value === "number") return `${value}px`;
  return value;
}

export function TrainingRestUiPanel({
  children,
  className = "",
  contentClassName = "",
  style,
  width,
  height,
}: TrainingRestUiPanelProps) {
  const panelStyle = {
    ...style,
    "--training-rest-ui-panel-width": toCssSize(width),
    "--training-rest-ui-panel-height": toCssSize(height),
  } as CSSProperties;

  return (
    <div className={`training-rest-ui-panel-frame ${className}`.trim()} style={panelStyle}>
      <div className={`training-rest-ui-panel-content ${contentClassName}`.trim()}>
        {children}
      </div>
    </div>
  );
}
