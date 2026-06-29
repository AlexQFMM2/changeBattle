# Dex Items V1 Resource Migration Plan

## Status

第一批已完成：图鉴道具分类、V1 游戏道具 overlay、技能机器虚拟条目、系统道具图鉴条目、V1 图标资源本地迁移。

## Summary

本计划用于先补齐 V2 图鉴的道具体系。Showdown 已有的树果、携带道具、Mega 石、Z 纯晶继续以 Showdown Dex 为事实源；Showdown 未覆盖或更偏游戏流程的恢复药、复活草、PP 道具、训练道具、技能机器、系统道具，从 V1 数据与资源迁移为 V2 图鉴 overlay。

第一批只做图鉴展示、分类、搜索、图标和效果说明，不接入背包实例、商店、购买、出售或战斗背包使用。

## Key Changes

- `showdown-dex-core` 扩展道具分类：树果、恢复道具、复活道具、PP 道具、技能机器、训练道具、携带道具、战斗道具、系统道具、贵重/剧情道具。
- 建立 Showdown + V1 overlay 规则：Showdown item 保留战斗语义，V1 overlay 补中文名、图标、用途字段和效果摘要。
- V1-only 游戏道具加入图鉴：恢复药、好伤药、全满药、复活草、活力碎片、PP 道具、神奇糖果、增强剂、王冠、PP 提升剂等。
- 技能机器以 `tm:<moveId>` 虚拟条目动态生成，图标按招式属性映射到 V1 `machine<Type>` 资源。
- 系统道具加入同一个 items 图鉴入口：通用Mega石、通用Z纯晶、极巨化手环、通用太晶珠。
- QuickDex 道具详情展示来源、用途开关、成本、未来实例兼容、TM 对应技能等字段。
- V1 图标复制到 V2 `assets/runtime/items`，该目录按现有约定不纳入 git 追踪。

## Test Plan

- `pnpm --dir changeBattleV2 --filter @changebattle-v2/showdown-dex-core test`
- `pnpm --dir changeBattleV2 --filter @changebattle-v2/web typecheck`
- `pnpm --dir changeBattleV2 typecheck`
- `pnpm --dir changeBattleV2 test:identity-sync`

## Manual Checks

- 图鉴搜索 `树果`，能看到常见 berry。
- 图鉴搜索 `回复药 / 好伤药 / 全满药`，能看到恢复道具。
- 图鉴搜索 `复活草 / 活力碎片`，能看到复活道具。
- 图鉴搜索 `技能机器 十万伏特`，能看到 `tm:thunderbolt`。
- 图鉴搜索 `训练道具 / 神奇糖果 / 增强剂`，能看到训练道具。
- 图鉴搜索 `Mega / Z招式 / 极巨化 / 太晶珠`，能看到系统道具。

## Assumptions

- 图鉴 registry 的稳定 id 后续会作为非堆叠 item instance 的 `itemID`。
- V1 是资源和效果文案参考，不整体复制 V1 runtime。
- 系统道具图标中 Z/极巨/太晶第一批使用已有 V1 图标占位，后续可替换为专用美术资源。
