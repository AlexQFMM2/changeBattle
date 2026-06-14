# ChangeBattle 全项目页面/组件 UI 重构计划

本文档是 ChangeBattle 后续 UI 重构的施工图。规则来源是项目内 `docs/ui-design.md`，本文只负责把规则落到每个页面和每类组件上。

目标不是把 UI 改成普通网页，而是把所有 Desktop / App 页面统一按 `640 x 320` 游戏视口设计，再通过外层 viewport 缩放适配桌面窗口和 App 横屏。页面只负责放组件、传数据和派发 action；组件负责具体业务交互、内部状态、列表、弹窗、滚动、固定尺寸布局和假数据预览。

## 0. 逐页重构执行流程

本重构必须按页面顺序逐个闭环处理，不跨页面并行重构。每个页面都先完成组件和组件预览，再进入页面重构，最后通过真实页面确认后才标记完成。

### 0.1 首个基础入口

- 首先实现 `TitleScreen` 上的 `组件预览（测试）` 入口。
- 该入口放在最开始的标题页，只用于开发/测试环境。
- 点击 `组件预览（测试）` 后进入组件预览页。
- 组件预览页读取 `componentRegistry`，列出当前所有已注册组件。
- 组件预览页通过 `previewData` 假数据展示组件本身样式，不依赖真实存档、真实后端或某个页面状态。
- 组件预览页不加入 `AppStatus`，只作为前端开发/测试路由存在，避免污染 `DesktopGameState.screen`。

### 0.2 单页面处理顺序

每个页面必须严格按以下顺序处理：

1. 做组件
   - 按当前页面小节的组件清单创建或整理组件。
   - 每个可见组件必须有独立 `.tsx` 和 `.css`。
   - 每个可见组件必须登记到 `componentRegistry`。
   - 每个可见组件必须提供假数据预览状态。
2. chromeAutomation 进入组件列表页查看组件 UI
   - 打开标题页。
   - 点击 `组件预览（测试）` 进入组件预览页。
   - 查看当前页面相关组件的所有预览状态。
   - 确认组件在 `640 x 320` 视口内不重叠、不撑破、滚动条正确、文字对比正确、按钮和列表行高稳定。
   - 组件 UI 有问题时，只修组件和组件 CSS，暂不重构页面。
3. 重构页面
   - 页面只负责页面骨架、组件摆放、传数据和派发 action。
   - 页面 CSS 只负责页面区域、组件尺寸变量覆盖和组件排布。
   - 复杂交互、列表、弹窗、选择器、滚动区域必须留在组件内部。
   - 保持现有 runtime、IPC、路由和用户流程不变。
4. 确认无误后标记 `【x】`
   - 用 chromeAutomation 进入该页面真实路由或测试场景。
   - 确认页面整体 UI 和交互无误。
   - 运行 `pnpm --filter @changebattle/desktop typecheck`。
   - 通过后在当前页面对应章节标题后标记 `【x】`。

### 0.3 标记规则

- `【x】` 只在该页面完整通过组件预览、页面重构、页面确认和 typecheck 后写入。
- 标记格式统一放在对应章节标题后，例如：`## 3.2 TitlePage 【x】`。
- 未经过组件预览页和真实页面确认的页面，不允许提前标记。
- 基础设施完成后，分别在 `## 2. 组件预览系统` 和 `## 3.1 AppShell / Root` 标题后标记 `【x】`。

## 1. UI 基础规则

- 每次新增或重构页面、弹窗、面板、大型组件前，必须先读 `docs/ui-design.md`。
- 每个页面必须有独立 `.tsx` 和 `.css`。
- 每个组件必须有独立 `.tsx` 和 `.css`。
- 每个可见组件必须支持假数据独立显示。
- 每个可见组件必须登记到组件列表，供组件预览页查看。
- 页面 CSS 只负责页面骨架、组件摆放和传入组件尺寸变量。
- 组件 CSS 只负责组件内部布局、状态、滚动区域和默认尺寸。
- 全局 `styles.css` 只保留 reset、字体、根布局、基础 token、viewport 缩放。
- CSS 变量格式统一为：`--<name>-<type>-<token>`。
- 页面变量示例：`--rest-page-header-height`、`--battle-page-command-height`。
- 组件变量示例：`--bag-container-list-width`、`--pokemon-team-picker-row-height`。
- 每个组件必须在自己的 CSS 中定义一套默认内部尺寸变量，变量前缀归组件所有，例如 `MoveCard` 使用 `--move-card-*`。
- 组件内部宽高、行高、字体、间距、图标尺寸等必须优先读取自己的默认变量，页面或父组件只能通过覆盖公开变量调整尺寸，不直接选择组件内部 DOM class 改样式。
- 同一组件的 `battle`、`dex`、`sheet` 等场景 class 只负责设置一组默认变量，不直接写死内部元素尺寸。
- 组件预览必须包含至少一个默认尺寸和一个外部变量覆盖尺寸，用来确认组件能在不同宽高容器中稳定显示。
- 优先使用准确数值、固定行高、明确列宽、受控滚动区域。
- 不要用无约束 `flex`、`100%`、`100vw` 去赌布局。
- 字号沿用 `docs/ui-design.md` 中主页基准：标题 `14px`、面板标题 `8px`、按钮 `8px`、列表主文本 `9px`、卡片标题 `7px`、辅助文本 `6px`、极小文本 `5px`。
- 浅色背景配深色文字，深色背景配浅色文字。
- 小面板滚动条必须细化，不能露出系统默认粗灰条。

## 2. 组件预览系统 【x】

### 2.1 新增文件

- `apps/desktop/src/component-gallery/componentRegistry.tsx`
- `apps/desktop/src/component-gallery/ComponentGalleryPage.tsx`
- `apps/desktop/src/component-gallery/ComponentGalleryPage.css`
- `apps/desktop/src/component-gallery/previewData.ts`

### 2.2 组件注册表字段

每个组件登记项必须包含：

- `id`：稳定组件 id。
- `name`：组件显示名。
- `group`：页面或模块归属，例如 `rest`、`battle`、`bag`、`shell`。
- `defaultSize`：默认预览尺寸，优先 `640 x 320` 或组件自身默认尺寸。
- `dependencies`：复合组件引用的子组件。
- `states`：可预览状态，例如普通、选中、禁用、空状态、长文本、滚动、错误态。
- `renderPreview(stateId)`：用假数据渲染组件。

### 2.3 组件预览页布局

- 画布：固定 `640 x 320`。
- 左侧组件列表：宽 `150px`，一行一个组件，行高 `18px`。
- 右侧预览区：宽 `478px`，高 `308px`，内部显示组件。
- 顶部状态切换：高 `18px`，按钮字号 `8px`。
- 样式变量前缀：`--component-gallery-page-*`。

### 2.4 首页入口

`TitleScreen` 增加 `组件预览（测试）` 按钮，进入 `ComponentGalleryPage`。该入口只在开发/测试版本显示，或由已有测试模式开关控制。

## 3. 页面重构清单

## 3.1 AppShell / Root 【x】

### 页面职责

- 持有全局路由状态。
- 持有全局 save、battle、rest、result 等数据。
- 只负责把数据传给页面组件。
- 不直接写页面内部布局。

### 组件编排

- `GameViewport`
- `RouteRenderer`
- `BgmController`
- `ScreenToast`
- `QuickDexButton`
- `ComponentGalleryEntry`

### 新增/拆分组件

- `GameViewport.tsx/css` 【x】
  - 功能：统一 `640 x 320` 画布和外层缩放。
  - 变量：`--game-viewport-width`、`--game-viewport-height`、`--game-viewport-scale`。
- `RouteRenderer.tsx/css` 【x】
  - 功能：根据 screen 渲染页面，集中处理失效页面 fallback。
  - 变量：`--route-renderer-width`、`--route-renderer-height`。
- `QuickDexButton.tsx/css` 【x】
  - 功能：固定位置图鉴入口，不拖动。
  - 变量：`--quick-dex-button-size`、`--quick-dex-button-right`、`--quick-dex-button-top`。

### 样式设计

- 画布固定 `640 x 320`。
- App 和 Desk 都只在外层缩放，不改内部组件比例。
- 根布局不允许出现页面业务 class。

### 验收

- Desktop 和 App 同一页面截图布局一致。
- `App.tsx` 不再直接拼大量页面 JSX。

## 3.2 TitlePage 【x】

### 页面职责

- 展示标题页。
- 进入读取存档、新建存档、删除存档流程。

### 组件编排

- `TitleVideoBackground`
- `TitleLogo`
- `TitleCommandMenu`
- `SaveSelectPanel`

### 新增/拆分组件

- `TitlePage.tsx/css` 【x】
  - 页面骨架。
  - 变量：`--title-page-width`、`--title-page-height`。
- `TitleVideoBackground.tsx/css` 【x】
  - 功能：标题视频背景。
  - 变量：`--title-video-width`、`--title-video-height`。
- `TitleCommandMenu.tsx/css` 【x】
  - 功能：标题页按钮列表。
  - 变量：`--title-command-menu-width`、`--title-command-menu-button-height`、`--title-command-menu-gap`。
- `SaveSelectPanel.tsx/css` 【x】
  - 功能：存档读取/新建/删除。
  - 变量：`--save-select-panel-width`、`--save-select-panel-row-height`。

### 样式设计

- 标题 logo 区固定坐标。
- 命令按钮宽 `130px`，高 `20px`，字号 `8px`。
- 存档列表行高固定 `36px`。
- 删除按钮不能撑高存档行。

### 验收

- 640×320 下标题、按钮、存档弹窗不重叠。
- App 横屏下按钮命中区域稳定。

## 3.3 MainMenuPage 【x】

### 页面职责

- 进存档后的主页面。
- 作为字号和密度基准页面。
- 提供挑战、天赋、强化、战绩、设置、返回标题、查看组件入口。

### 组件编排

- `MainMenuHome`
- `TrainerSummaryPanel`
- `FavoritePokemonPanel`
- `DiscoveryPanel`
- `MainMenuCommandBar`
- `ComponentGalleryButton`

### 新增/拆分组件

- `MainMenuPage.tsx/css` 【x】
  - 页面骨架。
  - 变量：`--main-menu-page-left-width`、`--main-menu-page-right-width`、`--main-menu-page-command-height`。
- `TrainerSummaryPanel.tsx/css` 【x】
  - 功能：训练师信息、BP、统计。
  - 变量：`--trainer-summary-panel-width`、`--trainer-summary-panel-height`。
- `FavoritePokemonPanel.tsx/css` 【x】
  - 功能：常用/收藏宝可梦展示。
  - 变量：`--favorite-pokemon-panel-card-height`。
- `DiscoveryPanel.tsx/css` 【x】
  - 功能：发现、提示、最近记录。
  - 变量：`--discovery-panel-row-height`。
- `MainMenuCommandBar.tsx/css` 【x】
  - 功能：主页面按钮。
  - 变量：`--main-menu-command-bar-button-width`、`--main-menu-command-bar-button-height`。

### 样式设计

- 作为全项目字体比例参考，不随 viewport 放大字体。
- 命令栏按钮高 `20px`，字号 `8px`。
- 卡片标题 `7px`，辅助文本 `6px`。

### 验收

- `查看组件` 入口存在。
- 主页字号和 `docs/ui-design.md` 一致。

## 3.4 PlayerSettingsPage 【x】

### 页面职责

- 新建训练师和玩家设置复用。
- 编辑名字、选择训练师形象、选择头像。

### 组件编排

- `PlayerNameEditor`
- `TrainerAvatarPicker`
- `TrainerPreviewPanel`
- `PageActionBar`

### 新增/拆分组件

- `PlayerSettingsPage.tsx/css` 【x】
  - 页面骨架。
  - 变量：`--player-settings-page-form-width`、`--player-settings-page-preview-width`。
- `PlayerNameEditor.tsx/css` 【x】
  - 功能：名字输入。
  - 变量：`--player-name-editor-input-height`。
- `TrainerAvatarPicker.tsx/css` 【x】
  - 功能：头像/角色格子选择。
  - 变量：`--trainer-avatar-picker-cell-size`、`--trainer-avatar-picker-grid-height`。
- `TrainerPreviewPanel.tsx/css` 【x】
  - 功能：右侧角色预览。
  - 变量：`--trainer-preview-panel-image-size`。

### 样式设计

- 左表单宽 `260px`，右预览宽 `340px`。
- 头像格固定 `34px`。
- 头像列表滚动区固定高度。

### 验收

- 长训练师名不撑破输入区域。
- 头像列表滚动条符合 UI 风格。

## 3.5 TalentConfigPage 【x】

### 页面职责

- 星图浏览。
- 天赋节点查看。
- 点亮和升级天赋节点。
- 装备天赋交互已废除，本页面不提供装备槽。

### 组件编排

- `TalentToolbar`
- `TalentBoardCanvas`
- `TalentNodeDetailDrawer`

### 新增/拆分组件

- `TalentConfigPage.tsx/css` 【x】
  - 页面骨架。
  - 变量：`--talent-config-page-toolbar-height`。
- `TalentToolbar.tsx/css` 【x】
  - 功能：返回、重置视角、实际尺寸、BP 展示。
  - 变量：`--talent-toolbar-height`、`--talent-toolbar-button-width`。
- `TalentBoardCanvas.tsx/css` 【x】
  - 功能：星图节点、连线、拖动缩放。
  - 变量：`--talent-board-canvas-width`、`--talent-board-canvas-height`。
- `TalentNodeDetailDrawer.tsx/css` 【x】
  - 功能：右侧详情抽屉。
  - 变量：`--talent-node-detail-drawer-width`。

### 样式设计

- 详情抽屉是 overlay，不参与画布布局。
- 收起详情后画布铺满主区域，不留黑框。
- 节点详情内部滚动，不改变抽屉尺寸。

### 验收

- 打开/关闭详情，右侧不残留空黑框。
- 星图可拖动缩放，节点不溢出主画布。

## 3.6 StarterUpgradePage 【已废弃】

### 页面职责

- 展示御三家强化列表。
- 查看强化详情。
- 消耗 BP 升级。

### 组件编排

- `StarterUpgradeList`
- `StarterUpgradeDetail`
- `StarterUpgradeActionBar`

### 新增/拆分组件

- `StarterUpgradePage.tsx/css` 【已废弃】
  - 页面骨架。
  - 变量：`--starter-upgrade-page-list-width`、`--starter-upgrade-page-detail-width`。
- `StarterUpgradeList.tsx/css` 【已废弃】
  - 功能：强化条目列表。
  - 变量：`--starter-upgrade-list-row-height`。
- `StarterUpgradeDetail.tsx/css` 【已废弃】
  - 功能：详情、等级、效果、消耗。
  - 变量：`--starter-upgrade-detail-header-height`。
- `StarterUpgradeActionBar.tsx/css` 【已废弃】
  - 功能：返回和升级按钮。
  - 变量：`--starter-upgrade-action-bar-height`。

### 样式设计

- 左列表宽 `210px`。
- 右详情宽 `410px`。
- 列表行高 `28px`。
- 操作栏固定在底部。

### 验收

- 长强化说明在详情内滚动，不撑开页面。
- 升级按钮不因文本变长移动。

## 3.7 BattleHistoryPage 【x】

### 页面职责

- 展示一整局挑战记录。
- 点击记录进入结算页。

### 组件编排

- `RunRecordList`
- `RunRecordDetailPanel`
- `HistoryActionBar`

### 新增/拆分组件

- `BattleHistoryPage.tsx/css` 【x】
  - 页面骨架。
  - 变量：`--battle-history-page-list-width`、`--battle-history-page-detail-width`。
- `RunRecordList.tsx/css` 【x】
  - 功能：挑战记录列表。
  - 变量：`--run-record-list-row-height`。
- `RunRecordDetailPanel.tsx/css` 【x】
  - 功能：记录摘要。
  - 变量：`--run-record-detail-panel-width`。
- `HistoryActionBar.tsx/css` 【x】
  - 功能：返回、刷新、进入结算。
  - 变量：`--history-action-bar-height`。

### 样式设计

- 列表一行代表一整局，不突出单场战斗。
- 行高固定 `30px`。
- 右侧摘要固定区域。

### 验收

- 点击记录进入对应 `ResultPage`。
- 单场回合记录只在结算页内查看。

## 3.8 BattleSettingPage 【x】

### 页面职责

- 战斗规则设置。
- 地区、规则预设、神战开关先本地编辑，点击保存并返回后持久化。

### 组件编排

- `BattleRuleTabs`
- `BattleRulePresetList`
- `BattleRuleDetailPanel`
- `BattleSettingActionBar`

### 新增/拆分组件

- `BattleSettingPage.tsx/css` 【x】
  - 页面骨架。
  - 变量：`--battle-setting-page-tabs-height`、`--battle-setting-page-action-height`。
- `BattleRuleTabs.tsx/css` 【x】
  - 功能：规则分组 tab。
  - 变量：`--battle-rule-tabs-height`、`--battle-rule-tabs-button-width`。
- `BattleRulePresetList.tsx/css` 【x】
  - 功能：预设列表。
  - 变量：`--battle-rule-preset-list-row-height`。
- `BattleRuleDetailPanel.tsx/css` 【x】
  - 功能：预设详情。
  - 变量：`--battle-rule-detail-panel-width`。

### 样式设计

- 顶部 tab 高 `22px`。
- 左列表宽 `220px`，右详情宽 `390px`。
- 底部按钮栏高 `28px`。

### 验收

- 规则说明长文本内部滚动。
- App 横屏下 tab 不换两行。
- 页面底部提供保存并返回按钮，保存状态在底部动作栏展示。

## 3.9 StarterItemsPage 【x】

### 页面职责

- 开局道具选择。
- 支持跳过和返回。

### 组件编排

- `StarterOfferList`
- `StarterOfferDetail`
- `StarterItemsActionBar`

### 新增/拆分组件

- `StarterItemsPage.tsx/css` 【x】
  - 页面骨架。
  - 变量：`--starter-items-page-list-width`、`--starter-items-page-detail-width`。
- `StarterOfferList.tsx/css` 【x】
  - 功能：offer 列表。
  - 变量：`--starter-offer-list-row-height`。
- `StarterOfferDetail.tsx/css` 【x】
  - 功能：offer 详情。
  - 变量：`--starter-offer-detail-icon-size`。
- `StarterItemsActionBar.tsx/css` 【x】
  - 功能：确认、跳过、返回。
  - 变量：`--starter-items-action-bar-height`。

### 样式设计

- 左侧一行一个 offer，图标、名称、简短标签。
- 右侧展示完整说明。
- 不在左侧塞说明文本。

### 验收

- 没有 offer 时显示稳定空状态。
- 长道具名省略，不撑高行。

## 3.10 RentalSelectPage 【x】

### 页面职责

- 展示租借候选。
- 选择 3 只宝可梦。
- 支持重抽、单抽、小道消息和开始挑战。

### 组件编排

- `RentalCandidateList`
- `RentalPokemonDetail`
- `RentalTeamPreview`
- `ScoutControls`
- `RentalActionBar`

### 新增/拆分组件

- `RentalSelectPage.tsx/css` 【x】
  - 页面骨架。
  - 变量：`--rental-select-page-candidate-width`、`--rental-select-page-detail-width`、`--rental-select-page-action-height`。
- `RentalCandidateList.tsx/css` 【x】
  - 功能：候选列表。
  - 变量：`--rental-candidate-list-card-height`。
- `RentalCandidateCard.tsx/css` 【x】
  - 功能：单只候选卡。
  - 变量：`--rental-candidate-card-sprite-size`。
- `RentalPokemonDetail.tsx/css` 【x】
  - 功能：当前聚焦宝可梦详情。
  - 变量：`--rental-pokemon-detail-width`。
- `RentalTeamPreview.tsx/css` 【x】
  - 功能：已选队伍预览。
  - 变量：`--rental-team-preview-slot-width`。
- `ScoutControls.tsx/css` 【x】
  - 功能：小道消息按钮和费用展示。
  - 变量：`--scout-controls-button-height`。

### 样式设计

- 候选卡固定高度 `54px`。
- 详情区固定宽 `250px`。
- 底部操作栏固定高 `30px`。

### 验收

- 小道消息免费/50 金币文案清楚。
- 候选数量变化不影响底部按钮位置。

## 3.11 BattlePage 【】

### 页面职责

- 展示战斗。
- 派发出招、换人、道具、AI提示、AI代打、倍速、投降等 action。
- 播放 timeline 动画，但展示事实以 `battle_view` 为准。

### 组件编排

- `BattleField`
- `BattleFighterPanel`
- `BattlePartyBoard`
- `BattleMessageBox`
- `BattleCommandPanel`
- `BattleToolbar`
- `BattleMoveMenu`
- `BattleTeamMenu`
- `BattleBagPanel`
- `BattlePokemonDetail`
- `BattleAiHintModal`
- `BattleTurnRecordPanel`

### 新增/拆分组件

- `BattlePage.tsx/css` 【】
  - 页面骨架。
  - 变量：`--battle-page-field-height`、`--battle-page-party-width`、`--battle-page-command-height`。
- `BattleField.tsx/css` 【】
  - 功能：背景、平台、双方 active、视觉效果。
  - 变量：`--battle-field-width`、`--battle-field-height`、`--battle-field-player-x`、`--battle-field-enemy-x`。
- `BattleFighterPanel.tsx/css` 【】
  - 功能：宝可梦大图、名字、HP、状态。
  - 变量：`--battle-fighter-panel-width`、`--battle-fighter-panel-sprite-size`、`--battle-fighter-panel-hp-width`。
- `BattlePartyBoard.tsx/css` 【】
  - 功能：双方队伍小图。
  - 变量：`--battle-party-board-width`、`--battle-party-board-slot-height`。
- `BattleMessageBox.tsx/css` 【】
  - 功能：战斗文本提示。
  - 变量：`--battle-message-box-height`。
- `BattleCommandPanel.tsx/css` 【】
  - 功能：底部主指令容器。
  - 变量：`--battle-command-panel-height`。
- `BattleToolbar.tsx/css` 【】
  - 功能：AI提示、倍速、AI代打。
  - 变量：`--battle-toolbar-height`、`--battle-toolbar-button-width`。
- `BattleMoveMenu.tsx/css` 【】
  - 功能：招式选择、Mega/Z/极巨/太晶。
  - 变量：`--battle-move-menu-card-height`。
- `BattleTeamMenu.tsx/css` 【】
  - 功能：换人列表。
  - 变量：`--battle-team-menu-row-height`。
- `BattleBagPanel.tsx/css` 【】
  - 功能：战斗背包，复用 `BagContainer`。
  - 变量：`--battle-bag-panel-width`、`--battle-bag-panel-height`。
- `BattlePokemonDetail.tsx/css` 【】
  - 功能：战斗中宝可梦详情。
  - 变量：`--battle-pokemon-detail-width`。
- `BattleAiHintModal.tsx/css` 【】
  - 功能：冠军 AI 建议、理由、执行建议。
  - 变量：`--battle-ai-hint-modal-width`。
- `BattleTurnRecordPanel.tsx/css` 【】
  - 功能：本场回合列表和回合详情。
  - 变量：`--battle-turn-record-panel-row-height`。

### 样式设计

- 战斗场地区固定高，例如 `188px`。
- 底部指令区固定高，例如 `110px`。
- 队伍小图栏固定宽，不跟随文本膨胀。
- AI提示在左，倍速在中，AI代打在右。
- 大图小图全部读取 `battle_view` slot，不从 request/tracker/timeline 各自拼身份。

### 功能验收

- 半血/睡眠/麻痹进入战斗，大图、小图、详情、队伍栏完全一致。
- Mega/极巨/太晶/形态变化后，大图小图一致。
- 敌方当前 active 不能显示黑球问号，除非确实未揭示。
- 战斗结束回写按 `showdown_id / pokeball`，不会 A 覆盖 B。
- AI 代打在宝可梦死亡后能自动处理强制换人。

## 3.12 ExchangePage 【已废弃】

### 页面职责

- 选择己方和敌方宝可梦交换。
- 支持跳过交换。
- 不再作为独立页面实施，后续并入 `## 3.13 RestPage` 的休息页组件体系。

### 组件编排

- `ExchangeOwnTeamList`
- `ExchangeEnemyTeamList`
- `ExchangeComparePanel`
- `ExchangeActionBar`

### 新增/拆分组件

- `ExchangePage.tsx/css` 【已废弃】
  - 页面骨架。
  - 变量：`--exchange-page-list-width`、`--exchange-page-compare-width`。
- `ExchangePokemonRow.tsx/css` 【已废弃】
  - 功能：交换列表行。
  - 变量：`--exchange-pokemon-row-height`、`--exchange-pokemon-row-sprite-size`。
- `ExchangeComparePanel.tsx/css` 【已废弃】
  - 功能：双方比较。
  - 变量：`--exchange-compare-panel-width`。
- `ExchangeActionBar.tsx/css` 【已废弃】
  - 功能：确认、跳过。
  - 变量：`--exchange-action-bar-height`。

### 样式设计

- 左右列表各宽 `190px`。
- 中间比较区宽 `240px`。
- 行高固定 `32px`。

### 验收

- 选择双方后比较区信息完整。
- 跳过和确认按钮不遮挡列表。

## 3.13 RestPage 【】

### 第一版记录

- 第一版已完成顶部菜单、工具切换栏、工具区 `我的队伍` 的组件拆分、预览登记和真实页接入。
- 默认进入休整页选中 `我的队伍`，工具切换栏第一项固定为 `我的队伍`。
- `我的队伍` 左侧队伍缩略卡使用左图右名/HP 条布局，HP 条复用 `PokemonHpBar`。
- 选中宝可梦详情已调整为资料/随机数值/描述三列；技能区为 2 行 2 列完整 `MoveCard`。
- 技能随机改为两段式：先随机候选并确认学习，再选择替换旧技能后确认替换。
- 背包工具区已完成左右分栏重构；商店、熔炉、交换、进度图、事件服务、技能调整、数值调整等暂走 `RestMainPanelHost` legacy adapter 分支，后续逐个工具区继续拆分。
- 工具切换栏当前顺序：`我的队伍`、`背包`、`交换`、`商店`、`熔炉`、事件/进度/天赋入口；`背包` 已移动到 `我的队伍` 后。
- 休整页非阻塞提示继续使用 `ScreenToast`；休整页需要更大提示时通过 `style` 传入 `--screen-toast-*` 变量覆盖，不修改 `ScreenToast.css` 默认值。
- 本节不标记 `【x】`，等所有工具区完成组件化后再整页验收。

### 页面职责

- 休整阶段页面骨架。
- 只负责当前打开哪个面板、传 rest 数据、派发 rest action。
- 不内联背包、商店、熔炉、技能、属性、事件等复杂流程。

### 组件编排

- `RestHeader`
- `RestToolBar`
- `RestMainPanelHost`
- `RestMyTeamPanel`
- `RestTeamMiniCard`
- `RestPokemonSlot`
- `RestPokemonProfileCard`
- `RestPokemonMoveGrid`
- `RestPokemonInfoPanel`
- `RestSelectedPokemonDetail`
- `RestEventPrompt`
- `RestBagPanel`
- `RestShopPanel`
- `RestForgePanel`
- `RestPokemonDetail`
- `RestMoveAdjustPanel`
- `RestStatsAdjustPanel`
- `NightSkyPanel`
- `ItemRecyclerPanel`
- `RunTalentPanel`

### 新增/拆分组件

- `RestPage.tsx/css` 【】
  - 页面骨架。
  - 变量：`--rest-page-header-height`、`--rest-page-toolbar-height`、`--rest-page-main-height`、`--rest-page-right-padding`。
- `RestHeader.tsx/css` 【x】
  - 功能：休整标题、进度、连胜、金币、结束/下一场按钮。
  - 变量：`--rest-header-height`、`--rest-header-button-height`。
- `RestToolBar.tsx/css` 【x】
  - 功能：工具区切换；`我的队伍` 固定第一项，后续接背包、商店、熔炉、进度图、天赋、事件入口。
  - 变量：`--rest-toolbar-height`、`--rest-toolbar-button-width`。
- `RestMainPanelHost.tsx/css` 【x】
  - 功能：承载当前打开的工具面板；第一版保留 legacy adapter 分支转接旧工具区。
  - 变量：`--rest-main-panel-host-width`、`--rest-main-panel-host-height`。
- `RestMyTeamPanel.tsx/css` 【x】
  - 功能：我的队伍工具区，左侧队伍缩略卡，右侧选中宝可梦详情。
  - 变量：`--rest-my-team-panel-slot-width`、`--rest-my-team-panel-profile-width`、`--rest-my-team-panel-stats-width`、`--rest-my-team-panel-move-width`。
- `RestTeamMiniCard.tsx/css` 【x】
  - 功能：队伍小卡，展示编号、小图、名字、HP 条、异常状态、选中态。
  - 变量：`--rest-team-mini-card-*`。
- `RestPokemonSlot.tsx/css` 【x】
  - 功能：队伍小格子，展示小图、名字、HP 条、异常状态、选中态。
  - 变量：`--rest-pokemon-slot-*`。
- `RestPokemonProfileCard.tsx/css` 【x】
  - 功能：当前宝可梦资料卡，展示大图、HP 条、名字、属性、性格、特性、道具。
  - 变量：`--rest-pokemon-profile-card-*`。
- `RestPokemonMoveGrid.tsx/css` 【x】
  - 功能：技能卡网格，复用 `MoveCard`。
  - 变量：`--rest-pokemon-move-grid-*`。
- `RestPokemonInfoPanel.tsx/css` 【x】
  - 功能：当前聚焦性格/特性/道具/技能说明和相关操作。
  - 变量：`--rest-pokemon-info-panel-*`。
- `RestSelectedPokemonDetail.tsx/css` 【x】
  - 功能：选中宝可梦详情，右侧三列布局：资料/技能、随机花费与数值、选中描述；技能区为 2 行 2 列。
  - 变量：`--rest-selected-pokemon-detail-*`。
- `RestEventPrompt.tsx/css` 【】
  - 功能：随机事件提示和选择。
  - 变量：`--rest-event-prompt-height`。
- `RestBagPanel.tsx/css` 【x】
  - 功能：休整背包工具区入口，左侧分类/列表，右侧详情、队伍目标、技能替换流程。
  - 使用：接收 `rest`、`initialTarget`、`onAction`；内部继续派发现有 `use_item`、`equip_item`、`use_tm`，不新增 runtime API。
  - 注意：外层宽度通过 `--rest-bag-panel-*` 控制；不要重新接回旧 `BagManageModal` / `BagLayout` 分支。
  - 变量：`--rest-bag-panel-width`、`--rest-bag-panel-height`、`--rest-bag-panel-list-width`、`--rest-bag-panel-action-width`。
- `BagFilterTabs.tsx/css` 【x】
  - 功能：背包分类 tab。
  - 使用：只负责显示分类、数量和选中态；分类语义由 `bagModel.ts` 的 `BAG_FILTERS` / `bagFilterForItem` 提供。
  - 变量：`--bag-filter-tabs-*`。
- `BagItemList.tsx/css` 【x】
  - 功能：道具列表，只显示图标、名称、数量。
  - 使用：点击行只更新选中道具；不要在列表行内塞说明文本、tooltip 或使用流程。
  - 变量：`--bag-item-list-*`。
- `BagTargetPokemonList.tsx/css` 【x】
  - 功能：背包使用/携带/TM 学习目标队伍列表，最多 6 只，当前为 3 行 2 列，显示小图、名字、携带物、HP 条和 HP 文本。
  - 使用：HP 必须复用 `PokemonHpBar`，只通过 `--pokemon-hp-bar-*` 变量调整尺寸；不要选择 `.pokemon-hp-bar b` 或其它内部 DOM。
  - 注意：普通可用目标不显示“使用/选择”徽标；只在 `disabledReason` 或处理中时显示状态提示，避免遮挡 HP。
  - 变量：`--bag-target-pokemon-list-*`。
- `BagActionPanel.tsx/css` 【x】
  - 功能：背包右侧操作状态容器，切换详情、队伍目标、技能替换。
  - 使用：只承载 `detail / pokemonPicker / moveReplace` 三种阶段；右侧宽度跟随父 grid，内部尺寸通过 `--bag-container-action-*` 和 `--bag-action-panel-*` 控制。
  - 变量：`--bag-action-panel-*`。
- `RestShopPanel.tsx/css` 【】
  - 功能：商店流程。
  - 变量：`--rest-shop-panel-list-width`。
- `RestForgePanel.tsx/css` 【】
  - 功能：熔炉流程。
  - 变量：`--rest-forge-panel-material-width`。
- `RestPokemonDetail.tsx/css` 【x】
  - 功能：队伍宝可梦详情、卸下道具、查看技能；当前由 `RestSelectedPokemonDetail`、`RestPokemonProfileCard`、`RestPokemonMoveGrid`、`RestPokemonInfoPanel` 组合实现。
  - 变量：使用 `--rest-selected-pokemon-detail-*`、`--rest-pokemon-profile-card-*`、`--rest-pokemon-move-grid-*`、`--rest-pokemon-info-panel-*`。
- `RestMoveAdjustPanel.tsx/css` 【】
  - 功能：技能调整、教学、遗传。
  - 变量：`--rest-move-adjust-panel-card-height`。
- `RestStatsAdjustPanel.tsx/css` 【】
  - 功能：能力/努力/个体相关调整。
  - 变量：`--rest-stats-adjust-panel-row-height`。
- `NightSkyPanel.tsx/css` 【】
  - 功能：小道消息/夜观天象。
  - 变量：`--night-sky-panel-button-width`。
- `ItemRecyclerPanel.tsx/css` 【】
  - 功能：道具回收。
  - 变量：`--item-recycler-panel-row-height`。
- `RunTalentPanel.tsx/css` 【】
  - 功能：局内天赋行动。
  - 变量：`--run-talent-panel-row-height`。
- 后续事件服务组件 【】：
  - `DoctorEventPanel` 【】
  - `EventMoveServicePanel` 【】
  - `RaidExchangePanel` 【】
  - `ScoreBetPanel` 【】
  - `EventLevelPanel` 【】

### 样式设计

- 顶部栏高度从现状缩小到固定 `28px` 左右。
- 工具栏高度固定 `24px` 左右。
- 主内容区吃掉节省出来的高度。
- `我的队伍` 第一版使用左侧队伍缩略列 + 右侧三列详情。
- 技能区为 2 行 2 列，使用完整 `MoveCard`。
- 所有面板在 `RestMainPanelHost` 内部固定布局，不撑开页面。
- 页面右侧保留明确右边距，例如 `8px`。

### 功能验收

- 休整页不再直接维护背包流程；商店、熔炉、技能调整等 legacy 工具后续继续拆分。
- 背包左侧列表不放说明文本，右侧按详情/队伍目标/技能替换切换。
- 640×320 下队伍、工具栏、主面板不挤压。
- 所有滚动容器高度明确。

## 3.14 ResultPage 【x】

### 页面职责

- 展示挑战结算。
- 展示整局记录。
- 支持点击单场进入回合记录。

### 组件编排

- `ResultHeader`
- `ResultSettlementGrid`
- `ResultTeamSummary`
- `ResultProgressList`
- `BattleRoundList`
- `TurnDetailPanel`

### 新增/拆分组件

- `ResultPage.tsx/css` 【x】
  - 页面骨架。
  - 变量：`--result-page-left-width`、`--result-page-right-width`。
- `ResultHeader.tsx/css` 【x】
  - 功能：胜负、标题、返回按钮。
  - 变量：`--result-header-height`。
- `ResultSettlementGrid.tsx/css` 【x】
  - 功能：金币、BP、奖励、扣费。
  - 变量：`--result-settlement-grid-row-height`。
- `ResultTeamSummary.tsx/css` 【x】
  - 功能：队伍总结。
  - 变量：`--result-team-summary-row-height`。
- `ResultProgressList.tsx/css` 【x】
  - 功能：整局进度列表。
  - 变量：`--result-progress-list-row-height`。
- `BattleRoundList.tsx/css` 【x】
  - 功能：单场战斗列表。
  - 变量：`--battle-round-list-row-height`。
- `TurnDetailPanel.tsx/css` 【x】
  - 功能：回合详情、双方状态。
  - 变量：`--turn-detail-panel-team-row-height`。

### 样式设计

- 左侧摘要宽 `260px`。
- 右侧进度/回合宽 `360px`。
- 回合列表一行一个回合，行高固定。

### 验收

- 从战绩进入整局结算正确。
- 点击某场、某回合后详情不撑破页面。

## 3.15 DexModal / QuickDexModal 【x】

### 页面职责

- 图鉴查询。
- 快捷图鉴。
- 支持宝可梦、训练师、招式、道具详情。

### 组件编排

- `DexSearchBar`
- `DexCategoryTabs`
- `DexResultList`
- `PokemonDexDetail`
- `TrainerDexDetail`
- `MoveDexDetail`
- `ItemDexDetail`

### 新增/拆分组件

- `DexModal.tsx/css` 【x】
  - 弹窗骨架。
  - 变量：`--dex-modal-width`、`--dex-modal-height`。
- `QuickDexModal.tsx/css` 【x】
  - 快捷弹窗骨架。
  - 变量：`--quick-dex-modal-width`、`--quick-dex-modal-height`。
- `DexSearchBar.tsx/css` 【x】
  - 功能：搜索输入。
  - 变量：`--dex-search-bar-height`。
- `DexCategoryTabs.tsx/css` 【x】
  - 功能：分类 tab。
  - 变量：`--dex-category-tabs-height`。
- `DexResultList.tsx/css` 【x】
  - 功能：左侧结果列表。
  - 变量：`--dex-result-list-width`、`--dex-result-list-row-height`。
- `DexDetailPanel.tsx/css` 【x】
  - 功能：右侧详情容器。
  - 变量：`--dex-detail-panel-width`。

### 样式设计

- 左列表右详情。
- 展开详情时右侧占满，关闭不留黑框。
- 长文本在详情内部滚动。

### 验收

- 锁定条目、长名字、长说明都不破坏行高。
- 快捷图鉴和完整图鉴共用详情组件。

## 3.16 RouteTransitionPage 【x】

### 页面职责

- 战斗/休整/回家等路线转场。

### 组件编排

- `RouteTransitionVideo`
- `RouteTransitionCopyPanel`

### 新增/拆分组件

- `RouteTransitionPage.tsx/css` 【x】
  - 页面骨架。
  - 变量：`--route-transition-page-width`、`--route-transition-page-height`。
- `RouteTransitionVideo.tsx/css` 【x】
  - 功能：背景视频。
  - 变量：`--route-transition-video-width`、`--route-transition-video-height`。
- `RouteTransitionCopyPanel.tsx/css` 【x】
  - 功能：文字提示。
  - 变量：`--route-transition-copy-panel-width`。

### 样式设计

- 视频全画布背景。
- 文字固定区域，不使用网页式大卡片。

### 验收

- 过渡文本不遮挡关键画面。
- 视频加载失败时 fallback 可读。

## 3.17 ComponentGalleryPage 【x】

### 页面职责

- 用假数据查看所有组件样式。
- 便于 640×320 人工验 UI。

### 组件编排

- `ComponentGalleryList`
- `ComponentPreviewCanvas`
- `ComponentStateControls`

### 新增组件

- `ComponentGalleryPage.tsx/css` 【x】
  - 页面骨架。
  - 变量：`--component-gallery-page-list-width`、`--component-gallery-page-preview-width`。
- `ComponentGalleryList.tsx/css` 【x】
  - 功能：组件列表。
  - 变量：`--component-gallery-list-row-height`。
- `ComponentPreviewCanvas.tsx/css` 【x】
  - 功能：预览画布。
  - 变量：`--component-preview-canvas-width`、`--component-preview-canvas-height`。
- `ComponentStateControls.tsx/css` 【x】
  - 功能：切换组件状态。
  - 变量：`--component-state-controls-height`。

### 样式设计

- 左侧列表宽 `150px`。
- 右侧预览区宽 `478px`。
- 预览画布固定 `640 x 320` 或按组件默认尺寸显示。

### 验收

- 所有登记组件都能单独显示。
- 每个组件至少有普通、空状态、禁用/不可用状态。

# 4. 通用组件清单与设计

## 4.1 BagContainer 【】

### 功能

统一背包容器，供休整页和战斗页复用。

### 子组件

- `BagFilterTabs`
- `BagItemList`
- `BagItemDetailPanel`
- `BagTargetPokemonList`
- `BagActionPanel`
- `PokemonTeamPicker`
- `MoveReplacePanel`

### 样式设计

- 默认尺寸：`600 x 236`。
- 左侧宽 `210px`，右侧宽 `378px`。
- 筛选栏高 `20px`。
- 道具列表行高 `22px`。
- 变量前缀：`--bag-container-*`。

### 功能细节

- 左侧只显示图标、名字、数量。
- 右侧显示详情、队伍选择或技能替换。
- 恢复道具：使用后进入队伍选择。
- 携带物：使用后进入队伍选择。
- 技能机器：先选宝可梦，再进入技能替换。
- 战斗背包：只展示战斗可用消耗品。
- 已完成的休整背包组件是后续 `BagContainer` 收敛的事实来源：新背包入口优先复用 `BagFilterTabs`、`BagItemList`、`BagItemDetailPanel`、`BagTargetPokemonList`、`BagActionPanel`，不要重新实现同名 UI。
- HP 展示统一使用 `PokemonHpBar`；任何背包/队伍目标行只传 `current/max/text/className`，再用 CSS 变量覆盖尺寸。
- 非阻塞操作反馈统一使用 `ScreenToast`；局部页面需要更大/更靠左/更深色时传 `style={{"--screen-toast-*": "..."}}`，不要直接修改 `ScreenToast.css` 默认值。

### 假数据状态

- 普通道具。
- 恢复道具。
- 技能机器。
- 携带物。
- 空背包。
- 长名字。
- 禁用道具。
- 滚动列表。

## 4.2 BagFilterTabs 【x】

### 功能

背包筛选。

### 使用方式

- Props：`activeKey`、`counts`、`disabled`、`onSelect`。
- 分类来源：`components/bag/bagModel.ts` 的 `BAG_FILTERS`，不要在页面里硬编码分类按钮。
- 用途：休整背包左侧 tab；后续战斗背包或通用背包继续复用。

### 筛选项

- 恢复道具
- 技能机器
- 战斗道具
- 训练道具
- 系统道具

### 样式设计

- 不保留 `全部`。
- 单行横向排列，超出时横向滚动。
- 按钮高 `18px`，字号 `6px`。
- 变量前缀：`--bag-filter-tabs-*`。

## 4.3 BagItemList 【x】

### 功能

背包左侧道具列表。

### 使用方式

- Props：`items`、`selectedId`、`disabled`、`emptyText`、`onSelect`。
- 行内容固定为 `ItemIcon`、名称、数量；点击只选择道具，不直接使用。
- 不显示说明、分类文案、使用按钮或 hover 详情；这些属于右侧 `BagActionPanel` / `BagItemDetailPanel`。

### 子组件

- `BagItemRow`
- `ItemIcon`

### 样式设计

- 行高 `22px`。
- 图标 `16px`。
- 名字 `9px`。
- 数量 `8px`。
- 变量前缀：`--bag-item-list-*`。

### 验收

- 不显示说明文本。
- hover/selected 不改变行高。
- 长名字只省略，不撑宽；数量徽标不遮挡名称。

## 4.4 BagItemDetailPanel 【x】

### 功能

背包右侧详情。

### 使用方式

- Props：`item`、`busy`、`disabled`、`disabledReason`、`useLabel`、`onUse`。
- 只展示当前道具的图标、标题、分类/数量、说明和底部动作按钮。
- 使用按钮只负责进入下一阶段，不在本组件里直接调用 runtime。

### 子组件

- `ItemIcon`
- `ItemMetaLine`
- `UseButton`

### 样式设计

- 不把介绍包成夸张卡片。
- 图标 `30px`。
- 标题 `10px`。
- 说明 `6px`。
- 使用按钮固定底部，高 `20px`。
- 变量前缀：`--bag-item-detail-*`。

### 注意事项

- 右侧详情布局应参考图鉴式“图标 + 标题 + 元信息 + 说明 + 操作按钮”，不要再加额外黑框或嵌套卡片。
- 局部宽高通过 `--bag-item-detail-*` 或父级 `--bag-container-action-*` 控制，不要在页面 CSS 里选内部节点硬改。

## 4.4.a BagTargetPokemonList 【x】

### 功能

背包右侧的宝可梦目标列表，用于消耗品使用、携带物替换、技能机器学习目标选择。

### 使用方式

- Props：`team`、`selectedIndex`、`busyIndex`、`title`、`emptyText`、`onSelect`。
- `team` 条目只提供宝可梦展示、状态、携带物、是否禁用和禁用原因；点击行为由父组件处理。
- 目标列表最多展示 6 只，当前布局为 3 行 2 列，适合休整页右侧 340px 操作区。

### 子组件

- `PokemonSprite`
- `PokemonHpBar`
- `StatusBadge`
- `HeldItemLabel`

### 样式设计

- 小图、名字、携带物、HP 条、HP 文本在卡片内固定位置。
- 普通可用目标不显示“使用/选择”徽标，避免遮挡 HP；只在处理中或不可用时显示 `disabledReason`。
- 变量前缀：`--bag-target-pokemon-list-*`。

### 注意事项

- HP 条必须使用 `PokemonHpBar`，不要重新写血条 DOM。
- 不要写 `.bag-target-pokemon-list b` 这类宽泛选择器；`PokemonHpBar` 内部使用 `<b>` 作为填充条，外部 CSS 不允许选中它。
- 需要调整血条尺寸时，在 `.bag-target-hp` 上覆盖 `--pokemon-hp-bar-width`、`--pokemon-hp-bar-height`。

## 4.4.b BagActionPanel 【x】

### 功能

背包右侧操作状态容器，在详情、目标选择、技能替换三个阶段之间切换。

### 使用方式

- Props：`step`、`item`、`targetTeam`、`targetTitle`、`selectedTarget`、`busyIndex`、训练项选项、技能替换数据和各类回调。
- `detail` 阶段渲染 `BagItemDetailPanel`。
- `pokemonPicker` 阶段渲染 `BagTargetPokemonList`。
- `moveReplace` 阶段渲染 `MoveReplacePanel`。

### 样式设计

- 自身 `width: 100%`、`height: 100%`，跟随右侧 grid cell，不写死超出父容器的宽度。
- 内部宽度通过 `--bag-container-action-inner-width` / `--bag-action-panel-inner-width` 控制。
- 变量前缀：`--bag-action-panel-*`。

### 注意事项

- 本组件只编排阶段，不直接决定背包业务规则；规则在 `RestBagPanel` / `bagModel.ts`。
- 不要在页面层直接选择 `BagActionPanel` 内部元素改布局；需要尺寸时覆盖公开变量。

## 4.5 PokemonTeamPicker 【已废弃】

### 功能

选择当前宝可梦队伍目标。

### 子组件

- `PokemonTeamRow`
- `PokemonHpBar`
- `HeldItemLabel`
- `StatusBadge`

### 样式设计

- 默认尺寸：`378 x 214`。
- 行高 `32px`。
- 图片 `28px`。
- 名字 `8px`。
- HP 条宽 `96px`，高 `4px`。
- 状态/道具 `6px`。
- 返回按钮高 `18px`，不能突出。
- 变量前缀：`--pokemon-team-picker-*`。

### 功能细节

- 恢复道具：点击宝可梦即使用。
- 携带物：点击宝可梦即切换携带。
- 技能机器：点击宝可梦进入技能替换。
- 禁用目标显示不可用原因。

### 验收

- 血条必须有颜色填充。
- 一整个队列滚动容器高度足够。
- 行内文字不换行撑高。

## 4.6 MoveReplacePanel 【x】

### 功能

技能替换。

### 使用方式

- Props：`pokemon`、`state`、`newMove`、`selectedMoveSlot`、`busy`、`onSelectMoveSlot`、`onConfirm`、`onCancel`。
- 用途：背包技能机器替换、休整页技能随机确认学习后的替换弹窗。
- 新技能展示在左侧，当前 4 个技能展示在右侧；点击旧技能后再确认替换。

### 子组件

- `NewMoveCard`
- `CurrentMoveGrid`
- `MoveReplaceActionBar`

### 样式设计

- 默认尺寸：`378 x 214`。
- 左侧新技能宽 `176px`。
- 右侧当前技能宽 `176px`。
- 当前 4 招为 `4 行 1 列`。
- 技能卡高度 `34px`。
- 底部按钮水平布局，高 `20px`。
- 不应出现滚动条，除非异常长文本。
- 变量前缀：`--move-replace-panel-*`。

### 验收

- 左右技能卡大小一致。
- 内容居中。
- 红框类多余区域移除。
- 后续所有“学习/替换技能”流程都复用本组件，不再重新写替换弹窗。

## 4.7 PokemonProfile / PokemonSummaryCard 【】

### 功能

通用宝可梦摘要卡。

### 子组件

- `PokemonSprite`
- `TypeBadges`
- `AbilityLine`
- `StatMiniGrid`
- `MoveMiniList`

### 样式设计

- 卡片默认宽 `150px`，高 `70px`。
- 图片 `36px`。
- 名字 `8px`。
- 辅助信息 `6px`。
- 变量前缀：`--pokemon-summary-card-*`。

### 使用位置

- 租借选择。
- 休整队伍。
- 战斗详情。
- 结算队伍。

## 4.8 MoveCard 【x】

### 功能

通用招式卡。

### 子组件

- `MoveNameLine`
- `MoveTypeBadge`
- `MoveMetaLine`
- `MovePpLine`

### 样式设计

- 小卡默认高 `34px`。
- 名字 `8px`。
- 属性/分类 `6px`。
- PP `6px`。
- 变量前缀：`--move-card-*`。

### 使用位置

- 战斗招式菜单。
- 技能替换。
- 技能教学。
- 图鉴学习面板。

## 4.9 BattleField 【】

### 功能

战斗主场景。

### 子组件

- `BattleBackground`
- `BattlePlatform`
- `BattleFighterPanel`
- `BattleEffectLayer`
- `FieldEffectsOverlay`

### 样式设计

- 默认宽 `640px`，高 `188px`。
- 玩家坐标和敌方坐标使用固定变量。
- 不用百分比漂移。
- 变量前缀：`--battle-field-*`。

## 4.10 BattleFighterPanel 【】

### 功能

战斗大图和当前状态。

### 子组件

- `PokemonSprite`
- `PokemonHpBar`
- `StatusBadge`
- `TeraBadge`

### 样式设计

- 图片 `72px`。
- HP 条宽 `92px`，高 `5px`。
- 名字 `8px`。
- 状态 `6px`。
- 变量前缀：`--battle-fighter-panel-*`。

### 数据规则

- 只接受 `battle_view` slot 数据。
- timeline 只能覆盖动画状态，不能决定宝可梦身份。

## 4.11 BattlePartyBoard 【】

### 功能

战斗双方队伍小图栏。

### 子组件

- `PartyStatusColumn`
- `BattleSmallImage`
- `PartyHpMiniBar`

### 样式设计

- 槽位高 `24px`。
- 小图 `20px`。
- HP mini bar 高 `3px`。
- 变量前缀：`--battle-party-board-*`。

### 验收

- 小图和大图同源。
- 当前 active 必须 revealed。
- 问号只用于未揭示槽位。

## 4.12 BattleCommandPanel 【】

### 功能

战斗底部指令。

### 子组件

- `MainBattleCommands`
- `BattleToolbar`
- `BattleSpeedToggle`
- `BattleAiButtons`

### 样式设计

- 底部区域高 `110px`。
- 主按钮高 `24px`。
- 工具栏高 `20px`。
- AI提示左，倍速中，AI代打右。
- 变量前缀：`--battle-command-panel-*`。

## 4.13 RestToolBar 【x】

### 功能

休整工具入口。

### 子组件

- `RestToolButton`
- `RestResourceBadge`

### 样式设计

- 高度固定 `24px`。
- 按钮高 `18px`。
- 字号 `7px`。
- 变量前缀：`--rest-toolbar-*`。

## 4.14 ShopPanel 【】

### 功能

商店。

### 子组件

- `ShopKindTabs`
- `ShopOfferList`
- `ShopOfferDetail`
- `BarterMaterialPicker`

### 样式设计

- 左列表宽 `230px`。
- 右详情宽 `350px`。
- offer 行高 `30px`。
- 变量前缀：`--shop-panel-*`。

## 4.15 ForgePanel 【】

### 功能

熔炉。

### 子组件

- `ForgeMaterialList`
- `ForgeRecipePreview`
- `ForgeResultPanel`

### 样式设计

- 材料列表宽 `230px`。
- 结果区宽 `350px`。
- 材料行高 `24px`。
- 变量前缀：`--forge-panel-*`。

## 4.16 NightSkyPanel 【】

### 功能

小道消息/夜观天象。

### 子组件

- `ScoutTargetPreview`
- `ScoutActionButtons`
- `ScoutCostLine`

### 样式设计

- 按钮宽 `90px`，高 `20px`。
- 费用文本 `6px`。
- 变量前缀：`--night-sky-panel-*`。

### 功能细节

- `揭示 1 只（免费）`。
- `解锁 3 只（50 金币）`。

## 4.17 ItemIcon 【x】

### 功能

统一道具图标。

### 样式设计

- 默认尺寸 `18px`。
- 可通过 `--item-icon-size` 覆盖。
- 技能机器优先用资源库光盘/机器图片。
- 变量前缀：`--item-icon-*`。

### 使用位置

- 背包。
- 商店。
- 熔炉。
- 开局道具。
- 结算奖励。

## 4.18 PokemonHpBar 【x】

### 功能

统一 HP 条。

### 使用方式

- Props：`current`、`max`、`text`、`className`。
- 组件内部按 `current / max` 自动计算填充比例和颜色档位。
- 外部只通过 `className` 定位容器，再覆盖 `--pokemon-hp-bar-width`、`--pokemon-hp-bar-height` 调整尺寸。

### 样式设计

- 默认宽 `96px`，高 `4px`。
- 高血量绿色，中血量黄色，低血量红色。
- 变量前缀：`--pokemon-hp-bar-*`。

### 注意事项

- 不要重新实现 HP 条；队伍缩略卡、背包目标列表、战斗面板、结算队伍都复用本组件。
- 不要在外部 CSS 里选择 `.pokemon-hp-bar b`，内部 `<b>` 是填充条实现细节。
- 如需显示 HP 数字，数字文本放在调用组件自己的节点里；`PokemonHpBar` 只负责条形视觉和 `title`。

### 使用位置

- 队伍选择。
- 战斗大图。
- 战斗小图。
- 休整队伍。
- 结算队伍。

## 4.18.a ScreenToast 【x】

### 功能

全局非阻塞操作提示，例如道具使用成功、技能已更换、操作失败等短提示。

### 使用方式

- Props：`message`、`durationMs`、`tone`、`inline`、`style`、`onDone`。
- 默认非 inline 时通过 portal 挂到 `document.body`，不参与页面布局。
- 页面需要局部尺寸或位置时，传 `style` 覆盖 `--screen-toast-*` 变量，例如休整页通过 `RestView` 传更大的 `--screen-toast-font-size` 和 `--screen-toast-min-width`。

### 样式设计

- 默认样式在 `ScreenToast.css`，保持全局通用小提示尺寸。
- 变量前缀：`--screen-toast-*`。

### 注意事项

- 不要为了某个页面直接修改 `ScreenToast.css` 默认值。
- 不要在普通组件里重新写黑底提示框；操作反馈统一用 `ScreenToast`。
- 需要页面特化时只传 CSS 变量，不改组件结构。

## 4.19 ComponentPreviewCanvas 【x】

### 功能

组件预览画布。

### 子组件

- `PreviewFrame`
- `PreviewToolbar`
- `PreviewStateSelector`

### 样式设计

- 固定 `640 x 320`。
- 可以显示组件默认尺寸。
- 变量前缀：`--component-preview-canvas-*`。

## 5. 实施顺序

1. 写入本计划到 `/home/alexqfmm/workPlace/pokemon/plan.md`。
2. 建立组件预览基础设施：组件注册表、预览页、首页入口、假数据约定。
3. 收敛全局 `styles.css`：先迁出 Rest/Battle 样式，再迁其他页面样式。
4. 重构背包组件族：`BagContainer`、筛选、列表、详情、队伍选择、技能替换。
5. 重构 `RestPage`：先队伍、工具栏、背包，再商店、熔炉、事件、技能、属性、天赋。
6. 重构 `BattlePage`：先展示源组件，再指令区、AI、背包、回合记录。
7. 重构 Setup 页面：Talent、StarterUpgrade、BattleSetting、StarterItems、RentalSelect。
8. 重构 Shell 页面：Title、MainMenu、PlayerSettings、RouteTransition。
9. 重构 Result、History、Dex、Exchange。
10. 做 App 适配验收，确认 App 只通过外层缩放和页面变量适配。

## 6. 验收标准

### 文档验收

- 每个页面都有：页面职责、组件编排、新增/拆分组件、样式设计、功能验收。
- 每个组件都有：功能、子组件、样式设计、变量前缀、假数据状态。
- 明确 Rest/Battle 是最高优先级。
- 明确 Desktop/App 按同一 `640 x 320` 基准。

### 代码实施后验收

- 每个页面/组件都有独立 `.tsx` 和 `.css`。
- 新增或重构组件都登记到组件列表。
- 首页有 `查看组件` 入口。
- 组件预览页能展示全部登记组件。
- 所有组件有假数据。
- `styles.css` 不再承载页面/组件主体样式。
- 640×320 下无重叠、无默认粗滚动条、无字体比例失控。
- Desktop/App 组件比例一致。

### 命令验证

- `pnpm --filter @changebattle/desktop typecheck`
- `pnpm --filter @changebattle/mobile build`
- `git diff --check`

## 7. 默认假数据要求

每个组件至少准备以下假数据状态：

- 普通状态。
- 选中状态。
- 禁用状态。
- 空状态。
- 长文本状态。
- 滚动内容状态。
- 错误/不可用原因状态。
- Desktop 预览。
- App 横屏预览。

## 8. Assumptions

- `docs/ui-design.md` 是 UI 规则源头。
- 本计划文件是项目外执行计划，不替代 `docs/ui-design.md`。
- `apps/mobile/dist` 不作为源码处理。
- 当前优先解决休整页和战斗页，因为这两个页面复杂度最高，且最容易出现高度、滚动、展示源不同步问题。
