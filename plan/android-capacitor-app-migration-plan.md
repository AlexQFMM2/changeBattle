# Android-only Capacitor App Migration Plan

## Summary

下一步 App 移植只做 Android，不做 iOS。第一版目标不是重写客户端，而是复用现有 Web UI、`apps/api` facade、Battle V4 流程和 CDN 资源，把 ChangeBattle V2 包进 Android WebView，验证能否稳定运行正式流程。

## Scope

- [ ] 新增 Android App 工程，优先使用 Capacitor。
- [ ] 复用现有 `apps/web` UI，不单独做移动端 UI 重写。
- [ ] 继续沿用 `640 x 320` 游戏视口和现有响应式/缩放策略。
- [ ] 资源继续直连 `https://assets.65h26i.top/beta/...`，不把全量图片/音频内置进 APK。
- [ ] API 和本地规则继续复用 `@changebattle-v2/api`、`@changebattle-v2/core`、`@changebattle-v2/showdown-battle-core` 的现有分层。
- [ ] 第一版只验证 Android debug build；不上架、不做 iOS、不做应用商店合规。

## First Validation Checklist

- [ ] Android WebView 能打开首页、设置页、正式模式入口和训练家仓库。
- [ ] 本地存档可读写，并明确 Web/Desktop/Android 的存档隔离策略。
- [ ] CDN 图片、Showdown sprite、BGM/音效加载正常。
- [ ] Battle V4 singles/doubles 能进入战斗、提交指令、播放 timeline、完成结算。
- [ ] 正式 GameRun 能完成选人、7 场计划、休整页、商店/训练/治疗和结算。
- [ ] 屏幕比例、触控目标、弹窗层级和文字大小在常见 Android 分辨率下可用。
- [ ] 离线/弱网时资源加载失败有可接受 fallback，不把白屏当成正常状态。

## Decisions

- Android App 第一版不内置全量 assets；需要缓存时后续再做“CDN 首次加载 + 本地缓存”层。
- 不改 AI、队伍生成器和 battle service 逻辑；移动端只验证运行环境和交互适配。
- 不把 release/debug 桌面更新系统直接搬到 Android；Android 更新策略后续单独设计。
- 不接 iOS，不做 App Store/TestFlight 相关内容。

## Related Docs

- [`../README.md`](../README.md)
- [`assets-cdn-core-plan.md`](assets-cdn-core-plan.md)
- [`../packages/assets-core/README.md`](../packages/assets-core/README.md)
