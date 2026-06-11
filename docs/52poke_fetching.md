# 神百资料抓取流程

## 当前状态

这是一份资料抓取工作流文档，用来说明如何复用 ChromeAutomation 抓取神百资料；它不是运行时依赖说明，游戏运行不依赖在线神百页面。

## 背景

神奇宝贝百科页面可以直接用如下规则访问：

```text
https://wiki.52poke.com/wiki/${条目名}#对话
```

例如：

```text
https://wiki.52poke.com/wiki/阿桔#对话
https://wiki.52poke.com/wiki/莉佳#对话
```

不过在当前环境里，不建议直接用 `curl` / Node `fetch` 批量抓取神百页面：

- 神百前面有 Cloudflare。
- 浏览器里会有 `cf_clearance` 等通关 cookie。
- 普通命令行请求不一定带这些 cookie，容易出现 DNS、挑战页、403 或连接失败。
- Chrome 页面本身可以正常访问，因为请求是在已通过验证的浏览器会话内发出的。

因此后续抓神百资料时，优先复用 ChromeAutomation 里的浏览器会话。

## 推荐方式

1. 启动 ChromeAutomation：

```bash
start-chrome-automation
```

2. 在 ChromeAutomation 窗口里手动打开一次神百页面，必要时完成 Cloudflare 验证。

3. 后续脚本通过本机 DevTools 地址连接该 Chrome：

```text
http://127.0.0.1:9222
```

4. 脚本创建少量 worker 标签页，通过 Chrome DevTools Protocol 执行：

- `Page.navigate` 到目标 URL
- 等待 `Page.loadEventFired`
- 用 `Runtime.evaluate` 在页面 DOM 内提取目标章节
- 处理完成后关闭 worker 标签页

这样所有请求都由 Chrome 发起，会自动带上浏览器 cookie 和请求头。

## 并发限制

建议并发最多 `3` 个标签页。

原因：

- 神百页面比较大。
- 多开标签页会明显卡顿。
- Cloudflare/浏览器资源也不适合过高并发。

当前 boss 台词抓取脚本已按这个规则实现：

```bash
node tools/fetch_boss_dialogues.mjs
```

招式动画参考抓取也复用同一套 ChromeAutomation/DevTools 方式：

```bash
pnpm moves:fetch-animations -- 冲浪 十万伏特
pnpm moves:observe-animations
```

详细流程见 [move_animation_references.md](./move_animation_references.md)。

脚本内：

```js
const CONCURRENCY = 3;
```

彩虹火箭队 7 人资源预设也复用同一套 ChromeAutomation/DevTools 方式。第一版只抓固定名单：坂木、赤焰松、水梧桐、赤日、魁奇思、弗拉达利、露莎米奈。

```bash
pnpm rainbow:fetch-resources
pnpm rainbow:build-data
```

抓取脚本会访问以下三个章节：

```text
https://wiki.52poke.com/wiki/${name}#宝可梦
https://wiki.52poke.com/wiki/${name}#对话
https://wiki.52poke.com/wiki/${name}#画像
```

临时抓取结果写入：

- `work/rainbow_rocket/resources.json`
- `work/rainbow_rocket/review.md`
- `work/rainbow_rocket/assets/`

正式数据生成结果写入：

- `data/npc_trainers.csv`：追加/更新 `type=villain` 的彩虹火箭队 7 人训练师。
- `data/rainbow_rocket_representatives.csv`：每位头目的代表宝可梦。
- `data/rainbow_rocket_team_pools.csv`：未来彩虹火箭路线使用的 4 人队预设，不写入当前 `boss_team_pools.csv`。
- `data/rainbow_rocket_dialogues.json`：按 `boss_dialogues.json` 同款格式生成的游戏台词；神百原始台词素材留在 `work/rainbow_rocket/resources.json` 和 `review.md` 里审核。

`work/` 目录只作为审核和续跑缓存，不进入 release。正式脚本只补缺资源；已有可用头像/画像不应被批量覆盖。

## 续跑策略

抓取脚本应具备以下行为：

- 已有人工内容的条目不覆盖。
- 已经自动抓过的条目不重复抓。
- 抓取失败也写明失败原因，方便后续人工检查。
- 后续再次运行时只处理空白条目。

当前自动块格式：

```md
<!-- AUTO_FETCHED_DIALOGUE_START -->
来源：https://wiki.52poke.com/wiki/莉佳#对话

抓到的原始文本……

<!-- AUTO_FETCHED_DIALOGUE_END -->
```

## 章节提取

神百页面锚点在浏览器地址栏里可以使用简体：

```text
#对话
```

但页面 DOM 中有时仍是繁体标题：

```text
對話
```

因此脚本提取章节时应同时识别：

- `对话`
- `對話`

不要只依赖 URL hash。

## 注意

抓下来的内容只作为素材库使用。最终进游戏的台词不需要完全照搬原文，可以结合角色语气改写成更适合 ChangeBattle 战斗节奏的短句，只要不 OOC 即可。
