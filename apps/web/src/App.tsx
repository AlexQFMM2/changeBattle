import {createChangeBattleV2Api} from "@changebattle-v2/api";

type AppProps = {
  runtime: "web" | "desktop";
};

const api = createChangeBattleV2Api({
  resourcePrefix: "https://play.pokemonshowdown.com/",
});

export function App({runtime}: AppProps) {
  let status = "等待注入 Showdown Dex 数据";
  try {
    api.searchDex({query: "fire", limit: 5});
    status = "Dex Core ready";
  } catch (error) {
    status = error instanceof Error ? error.message : String(error);
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">{runtime.toUpperCase()} ADAPTER</p>
        <h1>ChangeBattle V2 Dex</h1>
        <p className="summary">干净的新图鉴基座。Web/Desktop 只做适配器，共用函数放在 <code>apps/api</code>，核心 Dex 能力放在 <code>showdown-dex-core</code>。</p>
        <div className="status-row">
          <span>Core 状态</span>
          <strong>{status}</strong>
        </div>
      </section>
      <section className="work-panel">
        <h2>第一阶段</h2>
        <ul>
          <li>接入 Showdown Dex 数据源</li>
          <li>实现搜索、详情、图片解析、能力计算</li>
          <li>重做主页图鉴弹窗</li>
          <li>只覆盖 Web 和 Desktop</li>
        </ul>
      </section>
    </main>
  );
}
