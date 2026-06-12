# ChangeBattle Mobile Runtime 迁移清单

## Summary

- 目标：保留一段通用业务代码，由 Desk 和 Android App 分别提供平台适配器；文件拆分只服务这个目标。
- 目标形态：`packages/game-runtime` 是唯一玩法 runtime，`apps/desktop/electron` 和 `apps/mobile/src` 只装配平台能力，例如存档、数据、资源 URL、Showdown loader、日志、UUID、时钟。
- 原则：迁移时优先把 Electron main 中的真实业务搬进 runtime，再由 Desk/App adapter 调用同一个 `createChangeBattleRuntime(env)`；不再为了拆文件而横向切碎。
- 当前状态：基础 façade、Profile/Settings、Progression、Preparation、planned battle 生成、特殊 planned battle 生成、彩虹火箭支援候选/选择、开战前 run 准备已进入 runtime；Mobile 普通战已创建真实 Showdown battle session，并接入普通反派乱入/彩虹火箭 planned route 与开局 WARNING 支援页；完整战斗结算、普通 rest/shop、exchange、dex 仍主要留在 Desk 侧，Mobile 仍有部分简化逻辑。

## 当前待修复问题

记录日期：2026-06-12。

- [x] 普通流程选完人后直接进入战斗页，预期应先进入第 1 场前休整页。
- [ ] 战斗页显示大量 `?`、HP 不显示，点击“战斗”不弹技能菜单；已补齐 Mobile battle state 装饰和 `battle_bag`，仍需用模拟器点按和 logcat 验证 battle state/request。
- [x] 路由中转页 Android WebView 会短暂露出原生视频播放按钮；已用高层 1 秒黑色遮罩处理，不关闭视频加载。
- [ ] 星图右侧描述已显示，移动端详情面板已先行放大并改为更稳的两列布局；仍需按真机截图继续调整。

远程模拟器 smoke 流程见 `docs/android-emulator-smoke.md`。

## 已修复问题记录

- [x] mobile Showdown bundle 缺 `random-battles/**/teams.js`，导致开始游戏时报 `Module not found in bundle: ../data/random-battles/gen9/teams`。
- [x] mobile tier rows 只走同步读取，导致候选队 fallback 到皮卡丘形态；已补异步 `pokemon_tiers.csv` 加载。
- [x] 公共 `assets/` 未完整进入 APK 导致图片/BGM 缺失；已按 mobile static copy 方向处理，后续每版仍需验 APK 内资源。

## Migration Checklist

- [x] 建立 `packages/game-runtime`
  - [x] `ChangeBattleRuntimeApi` 拆到 `api.ts`
  - [x] runtime 环境接口拆到 `environment.ts`
  - [x] `DataProvider` 与 fetch/record provider 拆到 `data-provider.ts`
  - [x] 新增 `createChangeBattleRuntime` 统一 runtime façade
  - [x] `index.ts` 改为 re-export 入口

- [x] Desk IPC 层拆分
  - [x] IPC channel 注册移到 `apps/desktop/electron/runtime-ipc.ts`
  - [x] Desk runtime API 装配移到 `apps/desktop/electron/desktop-runtime-api.ts`
  - [x] `main.ts` 底部不再直接散绑 IPC handler

- [x] Mobile 平台壳拆分
  - [x] `mobileBridge.ts` 缩成 bridge 安装器
  - [x] Android 状态栏/沉浸/返回键移到 `mobileNativeShell.ts`
  - [x] 当前 mock/scaffold runtime 曾迁出为独立文件
  - [x] `mobileBridge.ts` 开始调用 `createChangeBattleRuntime` façade
  - [x] 移除 `mobileScaffoldRuntime.ts` 和临时 fallback handler

- [x] Showdown Mobile 可行性验证
  - [x] 新增 `mobile:showdown:smoke`
  - [x] 验证 Showdown sim 可打成浏览器/WebView bundle
  - [x] 验证 bundle 能跑一回合 battle 输出
  - [x] 把 smoke 临时 bundle 整理成正式 `ShowdownLoader`
  - [x] Mobile adapter 提供正式 Showdown loader
  - [x] Mobile build 自动生成并携带 `/showdown/showdown-mobile.mjs`
  - [x] `game-service` 清完 Node 边界后接入 Mobile runtime 使用正式 Showdown bundle

- [x] `game-service` 初步平台边界
  - [x] 支持注入 `showdownModule`
  - [x] 支持注入 `dataProvider`
  - [x] 支持注入 `assetExistsSync`
  - [x] 部分 data/assets 读取改走 provider
  - [x] 清理 `game-service` 入口的 Node-only 顶层依赖边界
  - [x] 为 Mobile 提供正式 data bundle loader
  - [x] 队伍池 CSV 解析 helper 进入 runtime，Mobile 通过 DataProvider 读取 boss/rainbow rocket 队伍池

- [x] SaveStore 迁移
  - [x] runtime 新增 `SplitJsonSaveStore`
  - [x] runtime 新增 `createInitialSave/normalizeTrainerProfile`
  - [x] Mobile 新增 Capacitor 私有文件 storage adapter
  - [x] Mobile scaffold 改用 `manifest + 多表 json` split save
  - [x] 抽象 Desk split save 为 runtime `SaveStore`
  - [x] 保留 Desk 现有存档格式与加密语义
  - [x] 新增 Mobile `CapacitorSaveStore`
  - [x] 废弃当前 mobile mock `save.json`
  - [x] App 重启后可恢复真实休整页 checkpoint 基础流程

- [x] Trainer/Profile/Settings 迁移
  - [x] Mobile scaffold 的 `loadSave/createNewSave/deleteSave/updateTrainer` 改走 runtime save store
  - [x] Mobile scaffold 的 battle setting/audio setting 改走 runtime save store
  - [x] Desk 的 `loadSave/createNewSave/deleteSave/updateTrainer` 迁入 game-runtime
  - [x] Desk 的 battle setting/audio setting 迁入 game-runtime
  - [x] trainer catalog/player avatar
  - [x] test mode/e2e patch 仅保留 Desk 测试适配

- [x] Candidate/Starter 迁移
  - [x] 候选队生成与重随
  - [x] 开局候选 profile/tier/回忆候选 helper 迁入 runtime
  - [x] 开局候选展示状态 helper 迁入 runtime
  - [x] Desk 开局候选生成委托 runtime helper
  - [x] Mobile `generateCandidates` 开始调用真实 `GameService`
  - [x] Mobile `prepareCandidates/chooseStarterItem` 切到真实开局候选生成
  - [x] 开局道具池与购买
  - [x] starter upgrades
  - [x] talents/star chart
  - [x] Mobile 开局道具基础真实数据候选接入
  - [x] Mobile 已选开局道具写入 run 背包
  - [x] Mobile 开局道具升级/价格/分类规则与 Desk 完全一致
  - [x] Desk/Mobile 同 seed 输出一致

- [x] Run Planning 迁移
  - [x] `beginChallenge`
  - [x] planned battles 生成
  - [x] NPC 预生成
  - [x] 普通反派乱入 planned battle 生成进入 runtime
  - [x] Mobile 进入休整页时执行普通反派乱入 deterministic 检查
  - [x] 彩虹火箭 special run
  - [x] 彩虹火箭 7 场 planned battle 生成进入 runtime
  - [x] Mobile 彩虹火箭命中时保存 original planned battles 并替换 7 场路线
  - [x] 彩虹火箭 support candidates 生成进入 runtime
  - [x] Mobile 彩虹火箭命中后先进入 WARNING/支援休整页

- [x] Battle Flow 迁移
  - [x] `startNextBattle` 开战前通用准备
  - [x] 开战前 run/planned battle 状态准备 helper
  - [x] 开战 Showdown session options 共用 helper
  - [x] Mobile 开始创建真实 Showdown battle session
  - [x] Mobile `battleChoice` 接真实 battle session
  - [x] Mobile `autoAdvanceBattle` 接真实 battle session
  - [x] `battleChoice` 指令系统校验 helper
  - [x] 训练师战斗道具使用/扣包 helper
  - [x] `battleChoice` 通用指令执行入口 helper
  - [x] `autoAdvanceBattle` 通用推进入口 helper
  - [x] battle finish 基础胜负统计/胜利奖励 helper
  - [x] battle finish player/enemy 视角与队伍状态回写 helper
  - [x] `battleChoice` 通用结算/回写 helper
  - [x] `autoAdvanceBattle` 通用结算/回写 helper
  - [x] Mobile 基础胜负/通关结算迁入 runtime helper
  - [x] Mobile trainer item 指令接真实 battle session
  - [x] forced switch
  - [x] battle finish/writeback
  - [x] `showdown_id`/异常/HP/PP 不串位

- [ ] Rest Flow 迁移
  - [x] `restState`
  - [x] `restAction`
  - [x] 休整进入下一场的 run 状态清理 helper
  - [x] Mobile `shopItems/learnableMoves/editOptions` 接真实 GameService 查询
  - [x] Mobile 基础恢复/学习招式/能力调整动作可用
  - [x] 首发调整 helper 迁入 runtime 并接入 Desk/Mobile
  - [x] 彩虹火箭支援候选/选择/完成/工厂治疗 helper 迁入 runtime
  - [x] Desk 彩虹火箭支援动作调用 runtime helper
  - [x] Mobile 彩虹火箭支援动作调用 runtime helper
  - [x] 现有 Rest UI 支援面板接入 runtime 返回的 `rainbow_rocket_support`
  - [x] 普通休整事件
  - [x] 商店/抽奖/购买
  - [x] 技能学习/能力调整/首发调整
  - [x] 背包/装备/出售/BP兑换/医生/下注/信赖等级基础动作迁入 runtime helper
  - [x] 高级休整动作补齐：以物易物、熔炉、奇袭交换、孤注一掷、小道消息/改道/指名挑战
  - [x] 彩虹火箭 WARNING 与支援面板核心流程可用
  - [ ] 彩虹火箭 WARNING 与支援面板真机 UI 验收

- [x] Exchange/Result/Records 迁移
  - [x] Mobile 战后基础交换接 runtime helper
  - [x] Desk/Mobile 战后交换规则完全一致
  - [x] Mobile 基础胜利金币奖励
  - [x] Mobile 反派乱入/彩虹火箭金币奖励预留
  - [x] Desk/Mobile 反派乱入 +500 金币完全一致
  - [x] Desk/Mobile 彩虹火箭 +2000 金币完全一致
  - [x] Mobile 基础 battle record 写入
  - [x] Desk/Mobile battle record/run record/result summary 完全一致
  - [x] Mobile boss dex 遭遇写入基础记录
  - [x] Mobile boss dex 胜负结果写入基础记录
  - [x] Mobile boss dex 遭遇写入 seen pool slots / seen pokemon
  - [x] boss dex result/seen pokemon/pool slots 与 Desk 完全一致

- [x] Dex/Search 迁移
  - [x] Mobile pokemon/moves/items/abilities dex 接真实 GameService
  - [x] Mobile trainer dex 接真实 NPC catalog 基础搜索
  - [x] Mobile trainer dex 支持 `type:villain` / `event:*` 基础查询
  - [x] trainer dex 搜索/隐藏/类型标签/事件标签 helper 迁入 runtime
  - [x] Desk trainer dex 调用 runtime helper 并保留 boss pool rows 详情
  - [x] Mobile trainer dex 调用 runtime helper
  - [x] 反派头目/特殊事件标签
  - [x] usage count 装饰 helper 迁入 runtime
  - [x] Desk/Mobile 非训练师 dex 搜索共用 usage count 装饰
  - [x] Mobile 与 Desk 搜索结果完全一致（Desk 仍额外提供 boss pool rows 详情）

- [x] Mobile 真运行时接入
  - [x] `mobileBridge.ts` 调用真实 runtime factory
  - [x] Mobile `assetUrl()` 使用 WebView/Capacitor 可访问路径
  - [x] Mobile data bundle 打包到 APK
  - [x] Mobile Showdown bundle 有构建脚本并可被 loader 加载
  - [x] Mobile Showdown bundle 随 mobile build 输出到 App public assets
  - [x] Mobile `generateCandidates` 默认不再走 fallback
  - [x] Mobile 开局选队候选默认不再走 fallback
  - [x] Mobile 普通战 battle session 默认不再走 fallback
  - [x] Mobile 普通反派乱入 planned route 默认不再走 fallback
  - [x] Mobile 彩虹火箭 planned route 默认不再走 fallback
  - [x] Mobile 战斗/rest/dex 默认不再走 scaffold fallback
  - [x] 删除 `mobileScaffoldRuntime.ts`
  - [x] 清理 Mobile debug battle 遗留入口

## Architecture Rule

- `packages/game-runtime`
  - 只放通用玩法业务：建档、设置、开局、赛程、战斗流、休整、交换、图鉴、记录。
  - 只能依赖 `RuntimeEnvironment` 注入的平台能力，不直接 import Electron、Capacitor、Node `fs/path/crypto`。
- Desk adapter
  - 提供 encrypted split save、文件型 data provider、`changebattle-asset://`、Node Showdown loader、Desk 日志和 e2e patch。
  - 不再长期保存玩法规则，只保留平台装配和还没迁完的临时 handler。
- Mobile adapter
  - 提供 Capacitor private save、bundled data provider、WebView asset URL、browser Showdown loader、移动端原生壳。
  - 不重写玩法规则；当前 fallback 只能作为迁移缺口，不能作为最终 App 逻辑。

- [ ] APK 完整流程验收
  - [ ] 新建存档
  - [ ] 开局道具
  - [ ] 选队
  - [ ] 普通战
  - [ ] 休整
  - [ ] 下一场
  - [ ] 交换
  - [ ] 图鉴
  - [ ] 普通反派乱入
  - [ ] 彩虹火箭路线
  - [x] 退出重进继续休整页 checkpoint 基础流程

## Test Plan

- 每次迁移后固定跑：
  - `pnpm --dir changeBattle typecheck`
  - `pnpm --dir changeBattle --filter @changebattle/desktop build`
  - `pnpm --dir changeBattle --filter @changebattle/mobile build`
  - `pnpm --dir changeBattle --filter @changebattle/game-service test:trainer-items`
  - `pnpm --dir changeBattle --filter @changebattle/desktop test:talents`
  - `pnpm --dir changeBattle mobile:showdown:smoke`

- 关键验收场景：
  - Desk 原流程完全不变。
  - Desk/Mobile 同 seed 生成候选、开局道具、planned battles 一致。
  - 同物种、换人、异常状态、HP/PP、濒死、战斗结束回写不串位。
  - 普通反派乱入和彩虹火箭流程在 Desk/Mobile 规则一致。
  - Android 真机可完整跑通一局普通挑战并恢复存档。

## Assumptions

- 不做旧 mobile mock 存档迁移；内部测试阶段可以重置 App 数据。
- Desk 仍是最高优先级，迁移期间 Desk release 不能被破坏。
- Mobile v1 使用真实 Showdown + TypeScript runtime，不接受简化战斗器作为最终方案。
- 迁移顺序默认先 runtime/platform 边界，再 run planning，再 battle/rest/dex，最后切 Mobile bridge。
