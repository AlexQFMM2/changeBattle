# Dex Items V1 Resource Migration Checklist

## Status

第一批已全部完成。背包实例、商店、战斗背包使用仍在 `../items-and-bag/system-items-and-bag-checklist.md` 后续批次追踪。

## Count Verification

```txt
Dex item kind expansion = 10
V1 game item first batch = 39
Default system item dex entries = 4
TM virtual item generator = 1
QuickDex item detail expansion = 1
V1 icon resource local copy batch = 1
```

## P0: Dex Data And Registry

- [x] 扩展 `DexItemKind`：`berry/recovery/revive/pp/tm/training/system/valuable/special/held/battle/other`。 | priority: P0 | source: showdown-dex-core | adapter: native | notes: dex category labels wired
- [x] 扩展 `DexItemDetail`：source、effectSummary、usage flags、cost、futureInstanceCompatible、TM move fields。 | priority: P0 | source: showdown-dex-core | adapter: native | notes: QuickDex consumes fields
- [x] Showdown item 使用 `itemKind()` 自动归类树果、特殊道具、携带道具、贵重/剧情道具。 | priority: P0 | source: showdown-dex-core | adapter: native | notes: berries no longer all shown as battle items
- [x] V1 overlay 合并恢复药、复活道具、PP 道具、训练道具。 | priority: P0 | source: V1-game | adapter: native | notes: first batch registry
- [x] 系统道具加入 items 图鉴：通用Mega石、通用Z纯晶、极巨化手环、通用太晶珠。 | priority: P0 | source: system-items | adapter: native | notes: dex-only, no bag behavior
- [x] 技能机器虚拟条目 `tm:<moveId>` 动态生成。 | priority: P0 | source: moves | adapter: native | notes: uses move name/type/power/accuracy

## P0: QuickDex UI

- [x] 道具搜索支持中文名、英文名、id、分类、来源、效果摘要。 | priority: P0 | source: QuickDex | adapter: native | notes: rankRow tags include overlay fields
- [x] 道具详情展示来源、用途开关、成本、未来实例兼容。 | priority: P0 | source: QuickDex | adapter: native | notes: no bag mutations
- [x] TM 详情展示对应技能。 | priority: P0 | source: QuickDex | adapter: native | notes: submits no action

## P1: Resource Migration

- [x] 从 V1 复制第一批药品、复活、PP、训练、技能机器图标到 V2 assets。 | priority: P1 | source: V1-assets | adapter: native | notes: assets/runtime/items, gitignored
- [x] 系统道具使用已有 V1 图标占位。 | priority: P1 | source: V1-assets | adapter: fallback | notes: Mega=medichamite, Z=electriumz, Dynamax=redorb, Tera=adamantcrystal

## Verification

- [x] `showdown-dex-core` 单测覆盖 berries、恢复药、复活草、TM、系统道具。 | priority: P0 | source: tests | adapter: native | notes: added assertions
- [x] `pnpm --dir changeBattleV2 --filter @changebattle-v2/showdown-dex-core test`。 | priority: P0 | source: verification | adapter: native | notes: passed
- [x] `pnpm --dir changeBattleV2 --filter @changebattle-v2/web typecheck`。 | priority: P0 | source: verification | adapter: native | notes: passed
- [x] `pnpm --dir changeBattleV2 typecheck`。 | priority: P0 | source: verification | adapter: native | notes: passed
- [x] `pnpm --dir changeBattleV2 test:identity-sync`。 | priority: P1 | source: verification | adapter: native | notes: passed
