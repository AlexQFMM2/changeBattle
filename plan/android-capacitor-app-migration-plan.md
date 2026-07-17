# Android-only Capacitor App Migration Plan

## Summary

下一步 App 移植只做 Android，不做 iOS。第一版目标不是重写客户端，而是复用现有 Web UI、`apps/api` facade、Battle V4 流程和 CDN 资源，把 ChangeBattle V2 包进 Android WebView，验证能否稳定运行正式流程。

## Scope

- [x] 新增 Android App 工程骨架，优先使用 Capacitor。
- [x] Windows 构建机跑通 Android debug APK：`apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`，当前约 `6.3MB`。
- [x] 新增 `mobile` runtime 适配层，Android 使用 server-first Battle API，不在 WebView 内加载 Node-only Showdown vendor。
- [x] 复用现有 `apps/web` UI，不单独做移动端 UI 重写。
- [x] 继续沿用 `640 x 320` 游戏视口和现有响应式/缩放策略。
- [x] 资源继续直连 `https://assets.65h26i.top/beta/...`，不把全量图片/音频内置进 APK。
- [x] API 和本地规则继续复用 `@changebattle-v2/api`、`@changebattle-v2/core`、`@changebattle-v2/showdown-battle-core` 的现有分层。
- [x] 第一版只验证 Android debug build；不上架、不做 iOS、不做应用商店合规。

## First Validation Checklist

- [x] Windows 构建机可完成 `pnpm --filter @changebattle-v2/mobile android:debug`。
- [ ] Android WebView 能打开首页、设置页、正式模式入口和训练家仓库。
- [x] 本地存档可读写，并明确 Web/Desktop/Android 的存档隔离策略。
- [ ] CDN 图片、Showdown sprite、BGM/音效加载正常。
- [ ] Battle V4 singles/doubles 能进入战斗、提交指令、播放 timeline、完成结算；移动端通过公网 Battle API 获取 snapshot/timeline。
- [ ] 正式 GameRun 能完成选人、7 场计划、休整页、商店/训练/治疗和结算。
- [ ] 屏幕比例、触控目标、弹窗层级和文字大小在常见 Android 分辨率下可用。
- [ ] 离线/弱网时资源加载失败有可接受 fallback，不把白屏当成正常状态。

## Decisions

- Android App 第一版不内置全量 assets；需要缓存时后续再做“CDN 首次加载 + 本地缓存”层。
- 不改 AI 和队伍生成器逻辑；移动端通过 `VITE_CHANGEBATTLE_MOBILE_BATTLE_SERVICE_URL` 接入统一 Battle API。
- 不把 release/debug 桌面更新系统直接搬到 Android；Android 更新策略后续单独设计。
- 不接 iOS，不做 App Store/TestFlight 相关内容。

## Related Docs

- [`../README.md`](../README.md)
- [`assets-cdn-core-plan.md`](assets-cdn-core-plan.md)
- [`../packages/assets-core/README.md`](../packages/assets-core/README.md)
