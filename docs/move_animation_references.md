# 招式动画参考抓取流程

## 当前状态

这是一份资料抓取和观察工作流文档，用来辅助研究招式动画节奏；它不是运行时依赖说明，当前运行时不直接依赖神百媒体或抓取结果。

目标：把神百“招式动画”章节里的 GIF/WebM/MP4 拉到本地，用 `ffmpeg` 做观察图，然后在 `battle_effect_assets.json` 和 CSS 里模仿节奏、密度、锚点和透明度。

页面规则：

```text
https://wiki.52poke.com/wiki/${招式名}（招式）#招式动画
```

例如：

```text
https://wiki.52poke.com/wiki/冲浪（招式）#招式动画
https://wiki.52poke.com/wiki/十万伏特（招式）#招式动画
```

## 抓取

神百有 Cloudflare，仍然按 [52poke_fetching.md](./52poke_fetching.md) 的方式走 ChromeAutomation。

1. 启动浏览器：

```bash
start-chrome-automation
```

2. 在 ChromeAutomation 的窗口里手动打开一次神百页面，必要时完成验证。

3. 抓单个或少量招式：

```bash
pnpm moves:fetch-animations -- 冲浪 十万伏特 喷射火焰
```

4. 批量抓取：

```bash
pnpm moves:fetch-animations -- --file work/move-animation-targets.txt
```

输出目录默认是：

```text
work/52poke-move-animations/
```

每个招式会生成：

- `manifest.json`：页面 URL、抓到的媒体候选、下载结果。
- 原始媒体文件：通常是 `.gif`、`.webm` 或 `.mp4`。

根目录会生成：

- `manifest.json`：全部招式汇总。
- `index.md`：方便快速检查哪些抓到了。

## ffmpeg 观察

抓完后生成观察 sheet：

```bash
pnpm moves:observe-animations
```

可调抽帧密度和拼图尺寸：

```bash
pnpm moves:observe-animations -- --fps 10 --tile 8x4
```

输出：

- `observation.json`：`ffprobe` 得到的宽高、时长、编码等。
- `observation.md`：全部媒体的观察索引。
- `*/observations/*-sheet.jpg`：抽帧拼图，用来判断动画节奏和关键元素。

## CSS 模仿原则

- 只模仿战斗可读性需要的视觉语言，不照搬整段 UI 画面。
- 优先记录：锚点、入场方向、持续时间、主色、粒子密度、是否全场、是否遮挡宝可梦。
- 天气和场地用全场层，技能命中用 target 层，墙/撒菱用 side 层。
- 先覆盖属性/状态/天气，再给代表性招式加 `move:<id>` 精确项。
- 不再依赖 `1w.zip` 或 3DS 解包素材；它们只作为已经放弃的研究分支。

## 推荐首批目标

```text
冲浪
十万伏特
喷射火焰
冰冻光束
毒粉
催眠术
奇异之光
剑舞
叫声
求雨
大晴天
沙暴
下雪
电气场地
隐形岩
反射壁
```
