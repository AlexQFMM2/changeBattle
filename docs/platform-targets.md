# 平台形态与优先级

这份文档记录 ChangeBattle 各平台形态的定位、优先级和技术路线。它是内部开发方向说明，用来避免后续把测试入口、历史入口和正式产品入口混在一起。

## 总览

| 形态 | 定位 | 优先级 | 是否正式发布 | 目标用户 |
| --- | --- | --- | --- | --- |
| CLI | 早期快速验证入口，已完成使命 | 停止主动投入 | 否 | 开发者历史参考 |
| Desk | 桌面端正式版本，当前核心 | 最高 | 是 | PC 玩家和主要验收 |
| Web | 浏览器本地测试入口 | 高 | 否 | MCP/Chrome 自动化测试 |
| App | Android 本地自用手机版 | 一般 | 否，上架不考虑 | 自己手机游玩 |

推荐演进顺序：

1. Desk 持续作为唯一正式主版本。
2. Web 作为测试外壳辅助 Desk，优先服务自动化验收。
3. App 等 Desk 和 Web 测试入口稳定后再推进。
4. CLI 不再投入新功能、平衡同步或体验修复。

## CLI

CLI 是早期 Python 文字版入口，用来快速验证核心循环、随机生成、连战和部分规则显示。它已经完成了最初的验证使命。

后续策略：

- 不再主动开发 CLI 新功能。
- 不要求同步 Desk 的平衡数值、UI 流程、存档结构或战斗展示。
- 不作为当前回归测试重点。
- 仅在需要查历史实现或做极小范围语法检查时保留参考价值。

如果 CLI 与 Desk 行为不一致，以 Desk 和当前 TypeScript 代码为准。

## Desk

Desk 是 Electron + React + TypeScript game-service 的桌面端，也是 ChangeBattle 当前真正的核心形态。

技术路线：

- Electron main/preload 负责桌面端 IPC、本地文件、存档、release 运行环境和 Node 能力。
- React renderer 负责 640x320 基础画布、战斗页、图鉴、休整页、选队、天赋和结果页。
- `packages/game-service` 负责 Showdown 数据、候选生成、战斗服务和运行时展示数据。
- `packages/shared` 作为跨层类型事实源。

后续策略：

- 所有正式规则验收、战斗展示、存档、资源、平衡调整和 Windows release 都优先以 Desk 为准。
- 真实玩家体验和长期可玩性优先在 Desk 落地。
- Web/App 的改动不能反向削弱 Desk 的稳定性。
- Windows 便携包继续按 `windows-desktop-release.md` 生成；该文档只服务 Desk release。

## Web

Web 是浏览器本地测试入口，不是正式游玩模式，不做线上发布，不做服务器存档，也不承担长期数据可靠性。

技术路线：

- 复用 React renderer 和 640x320 基础画布。
- 通过 Vite 启动本地页面，供 Chrome MCP / Chrome Automation 打开。
- 使用专门的 browser test bridge 或 scenario bridge 提供测试状态。
- 可以用固定种子、固定队伍、固定 timeline 和指定场景来提高自动化测试稳定性。

后续策略：

- 第一目标是让 Codex/Chrome MCP 能真实点击 UI、截图、检查布局和跑 smoke。
- 可支持类似 `?automated`、`?scenario=battle-flinch`、`?scenario=rest-shop` 的测试入口。
- 不要求做正式浏览器存档；如需临时状态，优先使用内存 mock、测试 bridge 或 IndexedDB 测试数据。
- 不作为玩家正式入口，不处理上线、账号、服务器同步或浏览器长期缓存可靠性。

Web 的价值是让 Desk 的 UI 和战斗流程更容易被自动化验证，而不是替代 Desk。

### Web v1 本地测试入口

启动命令：

```bash
pnpm --dir changeBattle web:dev
```

默认测试地址：

```text
http://127.0.0.1:5179/?automated#/
```

`?automated` 是完整 smoke 入口，从标题页开始，使用内存 mock 存档和固定候选，方便 Chrome MCP 从头点击到战斗和结算。

指定场景入口：

```text
http://127.0.0.1:5179/?scenario=battle-basic#/
http://127.0.0.1:5179/?scenario=battle-flinch#/
http://127.0.0.1:5179/?scenario=entry-weather#/
http://127.0.0.1:5179/?scenario=duplicate-status#/
http://127.0.0.1:5179/?scenario=rest-shop#/
http://127.0.0.1:5179/?scenario=dex#/
```

这些场景只用于 UI 与展示流程测试。它们会注入 Web test bridge 和 `window.__changeBattleTest` 只读钩子，供 MCP 检查当前场景、最近动作、战斗状态和 timeline display steps。

没有 `?automated` 或 `?scenario=...` 时，浏览器页面不会注入测试 bridge，避免误认为正式 Web 版。

## App

App 指未来 Android 本地自用版本。不上架，不考虑 iOS，不把移动端作为当前最高优先级。

技术路线建议：

- 优先考虑 Capacitor/WebView，复用现有 React renderer。
- 保持 640x320 基础画布模型，面向手机横屏做缩放、安全区和触摸热区适配。
- 使用独立 mobile bridge 接本地存档、资源路径和必要的系统能力。
- 存档走 App 本地存储，不依赖浏览器缓存或远程服务器。

后续策略：

- 等 Desk 主流程和 Web 自动化测试入口稳定后再推进。
- 第一版只服务自己手机安装游玩，不考虑商店上架、iOS、账号系统或云同步。
- 移动端适配重点是横屏体验、触摸按钮、文字密度、音频播放和资源体积。
- App 不改变 Desk 的正式主版本地位。

## 边界

- Desk 是当前唯一正式主版本。
- Web 只作为本地测试和自动化入口。
- App 是未来 Android 自用方向，不是当前发版目标。
- CLI 是历史验证入口，不再要求继续跟随当前规则演进。
- `docs/` 是内部说明，仍不进入最终 Desk release zip。
