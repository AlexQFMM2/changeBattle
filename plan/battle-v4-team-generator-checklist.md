# Battle V4 队伍生成器 Checklist

## 第一批：函数式预览

- [x] 调研 Showdown vendor `Teams.generate / pack / export`。
- [x] 新增 `generateShowdownRandomTeamV4(input)`。
- [x] 固定第一版 `ruleSet + mode` 到 Showdown random format 的映射。
- [x] `standard` 默认映射到 Gen9。
- [x] Gen7 doubles/coop 无随机格式时返回 diagnostics。
- [x] 输出 `pokemonSets / packedTeam / exportedTeam / diagnostics`。
- [x] 相同 seed 生成稳定结果。
- [x] 支持 `pokemonFilter` 指定物种池硬过滤。
- [x] 支持 `excludedSpeciesIds` 排除指定物种。
- [x] 支持常见 `teamArchetype` 软倾向生成。
- [x] 支持 `strictArchetype` 调试用硬风格过滤。
- [x] diagnostics 记录过滤池和 archetype 评分。
- [x] 新增 V2 adapter：`convertShowdownSetToLocalPokemonV4`。
- [x] 新增 V2 adapter：`convertShowdownTeamToLocalTeamV4`。
- [x] moves 转换为 `TrainingMoveSlotV4`。
- [x] maxHp/entryHp 通过 dex stats 计算。
- [x] sprite/icon 注入到 `LocalPokemonV4`。
- [x] held item 第一版只写 `itemId`，不创建背包实例。
- [x] 在 API 暴露 `generateRandomBattleTeamPreviewV4`。
- [x] 新增 core smoke 测试。
- [x] API adapter 通过 typecheck 验证模型契约。
- [x] 记录架构文档。

## 暂不做

- [ ] 不接训练配置页按钮。
- [ ] 不替换正式 NPC 队伍。
- [ ] 不写入 runGame。
- [ ] 不创建背包实例。
- [ ] 不处理系统战斗道具生命周期。
- [ ] 不做馆主/四天王/冠军构筑风格分组。

## 后续候选任务

- [ ] 增加开发预览命令或调试面板，输出 exported team 与 V2 localTeam diff。
- [ ] workspace 包 build/runtime 策略统一后，补 api runtime smoke。
- [ ] 设计 NPC 队伍生成策略：Showdown random、签名宝可梦池、主题队、等级分组之间如何组合。
- [ ] 正式接入时补 `PlayerItemInstanceV4` 生成与 `heldItemInstanceId` 同步。
- [ ] 对 Mega/Z/太晶队伍生成做 V2 系统道具适配，不让 Showdown 原始特殊道具绕过背包规则。
- [ ] 增加更多 fixture：Gen8/Gen9 doubles、coop 的 V2 adapter 结果快照。
- [ ] 将常见队伍类型从软评分升级为模板约束，例如天气手/空间手/撒钉手/清场手的关键位保障。
