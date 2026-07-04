# ChangeBattle V2 v0.1.0 Release Notes - 2026-07-04

## Release Artifact

```text
release/ChangeBattle-V2-Desk-portable-v0.1.0.zip
source: v2@f8ec6aac
generated: 2026-07-04 18:37 Asia/Shanghai
size: 597 MiB
```

玩家解压后运行：

```text
ChangeBattle-V2-Desk.cmd
```

## Progress Since 2026-07-03

- 星图天赋效果已静态化：节点 catalog 同时声明 UI 文案和 `runtimeEffects`，业务逻辑显式读取效果，新增/移除天赋的维护成本更低。
- 新增星图天赋“随身携带”：每个正式 run 第一次进入休整页时，从玩家预备背包随机带入最多 3 种道具，每种 1 个，并扣减长期仓库库存。
- 玩家长期资产已进入独立 player vault：道具和宝可梦从 profile 拆分，仓库支持预备箱、存储箱、移动、丢弃和箱页解锁基础流程。
- 正式结算会把本局背包道具存入长期道具仓库；已结算 run 不再作为继续游戏入口。
- 主页菜单顺序已整理，保存入口和返回主页入口更清晰。
- 星图布局和 BP 成本继续压缩打磨，当前全解锁成本已降到约 150 BP。
- 通用 `AppModal` 组件已加入，作为后续系统弹窗统一遮罩层和居中弹窗基础。

## Release Fixes

- 修复 desktop split save 里 player vault 表没有保存/读取 `itemStoragePageCount` 和 `pokemonStoragePageCount` 的类型问题。
- `player_item.dat` 现在会保存道具仓库页数，`player_pokemon.dat` 会保存宝可梦仓库页数；旧 split 表缺字段时按默认 2 页读取。
- desktop save-store 测试样本已补齐仓库页数字段。

## Verification

本地验证：

```text
pnpm --dir changeBattleV2 --filter @changebattle-v2/core build
pnpm --dir changeBattleV2 --filter @changebattle-v2/api typecheck
pnpm --dir changeBattleV2 --filter @changebattle-v2/web typecheck
pnpm --dir changeBattleV2 --filter @changebattle-v2/api test:formal-game
pnpm --dir changeBattleV2 --filter @changebattle-v2/desktop typecheck
pnpm --dir changeBattleV2 --filter @changebattle-v2/desktop test:save-store
```

Windows release checks 已通过：

```text
pnpm --filter @changebattle-v2/core typecheck
pnpm --filter @changebattle-v2/api typecheck
pnpm --filter @changebattle-v2/web typecheck
pnpm --filter @changebattle-v2/desktop typecheck
pnpm --filter @changebattle-v2/api test:formal-game
pnpm typecheck
pnpm --filter @changebattle-v2/desktop build
pnpm --filter @changebattle-v2/desktop test:ipc-bundle
pnpm --filter @changebattle-v2/desktop test:renderer-assets
pnpm --filter @changebattle-v2/desktop test:formal-worker
python tools\package_desktop_release.py
```

## Notes

- 这是仍以 `0.1.0` 命名的 Windows Desktop portable 包，主要用于当前试玩和流程测试。
- `release/` 不进入 git；源码以 `v2@f8ec6aac` 为准。
- 包体较大，因为包含 Electron runtime、Showdown runtime、Showdown client、静态资源和 desktop build output。
