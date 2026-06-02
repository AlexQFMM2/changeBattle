# Core

`core` 是项目的公共规则核心。

它的职责不是先做成一个网络服务，而是提供一套稳定的内部 API，让纯文本版、未来图形化版本和完整游戏版都复用同一份计算逻辑。

## Responsibilities

- 读取 `data/` 中的宝可梦、招式、特性、道具、属性和学习表。
- 将模板宝可梦实例化为 50 级真实宝可梦。
- 按等级、种族值、个体值、努力值和性格计算最终能力值。
- 生成对战工厂可用的租赁宝可梦池。
- 生成租赁宝可梦套装：等级、招式、道具、特性、性格等。
- 生成玩家和对手队伍。
- 处理随机种子，保证一局游戏可以复现。
- 处理简化战斗流程、伤害计算、胜负结算。
- 处理胜利后的宝可梦交换逻辑。
- 暴露给 CLI 和未来 UI 使用的稳定接口。

## Design Direction

第一版优先做“能玩”的简化核心，不追求完整复刻主系列所有战斗细节。

默认规则：对战工厂里的宝可梦实例固定 50 级。`pokemon.jsonl` 是模板数据，真正进入队伍和战斗的是 `core.create_pokemon_instance(...)` 生成的实例对象。

第一阶段已经提供随机生成入口：

- `core.generate_pokemon_instance(template, natures, rng=None, ev_style=None)`
- `core.generate_random_pokemon_instance(pokemon_templates, natures, rng=None)`

第一阶段只生成真实宝可梦的基础身体数据：

- 性格从 `data/natures.jsonl` 随机选择。
- 个体值固定全 31。
- 努力值从预设模板中选择，单项不超过 252，总和不超过 510。
- 能力值调用 `calculate_stats(...)` 计算。
- 暂不生成技能、特性和携带道具，这些按后续阶段逐步接入。

推荐边界：

- `core` 负责规则和计算。
- `changeBattle-cli` 负责命令行输入输出。
- 未来图形化版本负责 UI、动画、图片和音效。

这样 CLI 和图形版不会各写一套随机逻辑，也方便以后把 `core` 包成 HTTP API 或其他服务。
