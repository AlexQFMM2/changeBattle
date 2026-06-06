# 神百资料抓取流程

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

脚本内：

```js
const CONCURRENCY = 3;
```

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
