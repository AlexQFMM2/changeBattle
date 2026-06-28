import type {FormalGameRunV4} from "@changebattle-v2/api";
import "./FormalGamePendingPage.css";

export function FormalGamePendingPage({run, onBack}: {run: FormalGameRunV4; onBack: () => void}) {
  return (
    <main className="formal-game-pending-page">
      <section className="formal-game-pending-panel">
        <span>Formal Game V4</span>
        <h1>初始队伍已确认</h1>
        <p>{modeLabel(run.mode)} 已保存 {run.playerTeam?.pokemon.length || 0} 只首发宝可梦。</p>
        <p>下一步接 7 场计划生成、NPC 队伍和休整页。</p>
        <button type="button" onClick={onBack}>返回主菜单</button>
      </section>
    </main>
  );
}

function modeLabel(mode: FormalGameRunV4["mode"]): string {
  if (mode === "doubles") return "双打-AI";
  if (mode === "coop") return "合作-AI";
  return "单打-AI";
}
