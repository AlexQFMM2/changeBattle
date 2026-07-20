# Formal Rest Shop Plan

## Status

已完成/收口。

正式休整商店第一版已经完成，后续商店优化应另开小计划，不再把新设施内容继续堆到本文件。

## Completed Scope

- [x] 休整页「商店」入口接入正式 GameRun。
- [x] 商店只接正式流程金币、库存和存档状态。
- [x] 每个休整节点拥有独立商店状态，按 `run.seed + nodeId + category` 稳定生成。
- [x] 同一休整节点重复打开商店，商品保持不变。
- [x] 商店面板使用顶部支点 3D 翻转动画进入/离开。
- [x] 购买模式展示 5 类 x 3 件商品：
  - 恢复药
  - 树果
  - 战斗道具
  - 训练道具
  - 技能机器
- [x] 商品卡片展示图标、名称、正式商店价格、详情和购买。
- [x] 技能机器显示技能名，不显示 `技能机器：...` 前缀。
- [x] 商品详情接入店员对话框，并支持「返回 / 立即购买」。
- [x] 购买调用正式 `shopController.onBuy(slotId)`，不改变交易接口。
- [x] 购买成功后按同分类加权补货。
- [x] 购买动画包含卡片碎裂和补货放大。
- [x] 正式商店使用低价专用经济，不再直接使用 dex 原价。
- [x] 树果池扩充到常用果、抗性果和混乱回血果。
- [x] 卖出模式接入商店公告板。
- [x] 售出列表只显示 `canSale`、未被宝可梦携带、售出价大于 0 的背包实例。
- [x] 售出价格按实例 `cost / 4` 计算。
- [x] 售出调用正式 `shopController.onSell(itemInstanceIds)`。
- [x] 买入/卖出只更新运行时 `FormalGameRunV4`，用户点击休整页「保存」时才写入正式存档。
- [x] 交易热路径只 patch 背包、金币、商店和 coinLog，不调用全量 `normalizeFormalRun`。

## Data And Runtime Rules

- 商店 catalog、分类、价格配置和基础权重在 `@changebattle-v2/core`。
- 运行时交易、加权补货、商品 view 装配和 coinLog 在 `apps/api`。
- React UI、动画、购买/售出选择状态在 `apps/web`。
- 商品购买价格写入背包实例 `cost`。
- 售出价格以实例 `cost` 为准，固定为 `Math.floor(cost * 0.25)`。
- 正在被宝可梦携带的实例不可售出。
- 不可售、0 价、系统关键道具不可售出。

## Follow-Up Ideas

这些不是第一版商店收口条件，后续需要时另开计划：

- 花金币主动刷新商店。
- 星图扩充库存容量或解锁稀有商品。
- 不同分类货柜皮肤、店主立绘和更强的店铺主题表现。
- 更细的商品推荐话术，例如根据队伍招式、对局偏好、下一场敌人做推荐。
- 商店统计页或经济平衡 debug 面板。

## Next Facility

商店完成后，正式设施主线转向训练场：

- 传授技能。
- 蛋技能。
- 自主训练，主要用于随机个体值和努力值。

详见 [`formal-training-ground-plan.md`](formal-training-ground-plan.md)。
