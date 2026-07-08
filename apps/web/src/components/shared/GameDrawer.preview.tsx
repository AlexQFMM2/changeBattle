import {useState} from "react";
import {GameDrawer, type GameDrawerPlacement} from "./GameDrawer";
import "./GameDrawer.preview.css";

const PLACEMENTS: GameDrawerPlacement[] = ["left", "right", "top", "bottom"];

export function GameDrawerPreview() {
  const [open, setOpen] = useState(true);
  const [placement, setPlacement] = useState<GameDrawerPlacement>("right");
  return (
    <section className="game-drawer-preview" aria-label="通用抽屉预览">
      <div className="game-drawer-preview-stage">
        <header>
          <strong>抽屉预览</strong>
          <button type="button" onClick={() => setOpen(true)}>打开</button>
        </header>
        <div className="game-drawer-preview-controls">
          {PLACEMENTS.map(nextPlacement => (
            <button className={placement === nextPlacement ? "active" : ""} type="button" onClick={() => {
              setPlacement(nextPlacement);
              setOpen(true);
            }} key={nextPlacement}>
              {placementLabel(nextPlacement)}
            </button>
          ))}
        </div>
        <p>默认有阻塞遮罩，点击遮罩或关闭按钮会关闭。</p>
        <GameDrawer open={open} placement={placement} title="通用抽屉" onClose={() => setOpen(false)}>
          <div className="game-drawer-preview-content">
            <strong>详情内容</strong>
            <span>这个组件使用 motion 实现滑入，不参与页面布局。</span>
            <button type="button" onClick={() => setOpen(false)}>完成</button>
          </div>
        </GameDrawer>
      </div>
    </section>
  );
}

function placementLabel(placement: GameDrawerPlacement): string {
  if (placement === "left") return "左";
  if (placement === "right") return "右";
  if (placement === "top") return "上";
  return "下";
}
