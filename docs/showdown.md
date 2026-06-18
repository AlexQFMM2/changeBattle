# Pokemon Showdown 集成说明

ChangeBattle 把 Pokemon Showdown 作为宝可梦数据、候选生成和战斗规则引擎的事实源。项目不自己重写完整的伤害公式、异常状态、特性、道具、天气、场地和复杂招式交互。

## 规则和数据边界

当前代码里，Showdown 被分成三层使用：

1. **图鉴数据层**
   - `GameService.dataDex()` 固定读取 `Dex.mod("gen9")`。
   - 图鉴条目、宝可梦种族值、招式数据、道具数据、特性数据、技能机器识别、`learnableMoves()` 等，都基于当前打包/构建进来的 Showdown Gen 9 数据。
   - Showdown 的 Gen 9 更像“当前世代数据桶”，不是锁死在某个卡带版本的静态快照。上游 Showdown 如果加入官方公开的新形态、新 Mega 等内容，ChangeBattle 在更新 Showdown runtime 和资源表后也可能显示这些内容。

2. **正式战斗规则层**
   - 正式战斗使用 Showdown 的 `customgame` format，具体 format 由当前 run 的对局设置决定：
     - `none` -> `gen9customgame`
     - `gen7` -> `gen7customgame`
     - `gen8` -> `gen8customgame`
     - `gen9` -> `gen9customgame`
   - `none` 只表示 ChangeBattle 不开启 Mega、Z 招式、极巨化、太晶化等特殊系统，不表示使用旧世代模拟器。它底层仍是 `gen9customgame`。
   - 当前 preset 对应关系：
     - `gen7`：Mega + Z 招式，最高第 7 世代
     - `gen8`：极巨化，最高第 8 世代
     - `gen9`：太晶化，最高第 9 世代

3. **候选生成层**
   - 租赁候选、初始候选、部分事件宝可梦、部分商店/事件技能池，主要从 `gen9randombattle` 生成。
   - 生成后再由 ChangeBattle 根据 `allowed_generations`、`battle_rule_preset`、是否神兽战、species tier、事件规则等做过滤和调整。

当前产品规则可以概括为：

```text
图鉴和 learnset 默认跟随当前 Showdown Gen 9 数据；
战斗机制跟随所选 customgame preset；
ChangeBattle 可以在 Showdown 之上再加自己的游戏合法性规则。
```

## customgame 的开放程度

Showdown 的“战斗模拟”和“合法性校验”是两件事。

- 战斗引擎负责执行当前战斗状态：招式、特性、道具、天气、伤害、异常、行动顺序、换人和协议日志。
- 队伍合法性校验器负责判断某个 set 在某个竞技 format 下是否合法。
- ChangeBattle 使用 `gen*customgame` 战斗 format，不依赖 OU、Battle Stadium、Random Battle 之类标准 format 的合法性校验来决定每一次队伍编辑。

因此，只要招式或特性已经存在于当前打包的 Showdown Dex 里，并且在开战前写进 `PokemonSet`，宝可梦就可以在 `customgame` 里使用原作不合法的技能或特性。

当前外置 Showdown runtime 的本地实测例子：

```text
format: gen9customgame
p1: Charizard / Blaze / moves [Surf]
p2: Onix / Sturdy / moves [Splash]

结果：
|move|p1a: Charizard|Surf|p2a: Onix
|-supereffective|p2a: Onix
|-ability|p2a: Onix|Sturdy
|-damage|p2a: Onix|1/110
```

也就是说，喷火龙可以带原本不合法的 `Surf`，而且能正常打出。

```text
format: gen9customgame
p1: Charizard / Huge Power / moves [Scratch]
p2: Snorlax / Immunity / moves [Splash]

对比：
Charizard + Blaze + Scratch      -> Snorlax 235/235 to 215/235
Charizard + Huge Power + Scratch -> Snorlax 235/235 to 196/235
```

也就是说，喷火龙可以带原本不属于它的 `Huge Power`，而且物攻翻倍效果实际生效。

重要限制：战斗中通常不能临时选择一个当前 Showdown request 里不存在的招式。Showdown 的选择是技能槽位式的，例如 `move 1`、`move 2`，不是“现在释放某个任意 move id”。例如，训练师道具不应该通过“临时假装宝可梦使用了 `Splash`”来实现，除非 `Splash` 本来就是它当前技能栏里的技能。ChangeBattle 的训练师道具应实现为自定义 runtime action、状态修改或 Showdown action queue patch，而不是伪装成任意临时招式选择。

## ChangeBattle 合法性层

因为 `customgame` 很开放，项目里要把两个问题分开：

```text
Showdown 能不能跑？
ChangeBattle 允不允许？
```

推荐模型：

- Showdown 回答：“这个招式/特性/道具是否存在？战斗里会发生什么？”
- ChangeBattle 回答：“这个宝可梦在当前游戏模式下，是否允许学习、使用、获得这个招式/特性/道具/形态？”

正常学习技能的流程目前主要使用 Showdown Gen 9 learnset：

- `learnableMoves(set)` 读取 `Dex.mod("gen9").species.getFullLearnset(...)`。
- `machineMoves()` 从同一套 Gen 9 learnset 里收集来源包含技能机器的招式。
- 背包技能机器、事件学习服务等 UI 流程，默认应该调用这些 service 层检查，除非某个事件明确给予 ChangeBattle 自定义合法性。

如果 ChangeBattle 想“放飞自我”，不要优先复制整个 Showdown 战斗引擎。更推荐加一层本游戏自己的 override，例如：

```json
{
  "learnsets": {
    "victreebel": {
      "sunnyday": ["machine", "event"]
    },
    "staraptormega": {
      "headlongrush": ["boss_reward"],
      "vcreate": ["event"]
    }
  },
  "abilities": {
    "charizard": {
      "hugepower": ["event", "mutation"]
    }
  }
}
```

这样 runtime 可以把这些内容展示为 ChangeBattle 合法选择，写入 `PokemonSet`，再交给 Showdown 执行战斗。

只有当 ChangeBattle 需要一个 Showdown 里不存在的招式、特性、道具或机制时，才考虑 fork/patch Showdown 数据或脚本。

## 本地 Showdown runtime

默认本地路径：

```bash
/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown
```

可用环境变量覆盖：

```bash
export SHOWDOWN_PATH=/path/to/pokemon-showdown
```

构建 Showdown：

```bash
cd "$SHOWDOWN_PATH"
npm ci
node build --force
```

验证模拟器：

```bash
printf '%s\n' \
  '>start {"formatid":"gen7randombattle"}' \
  '>player p1 {"name":"Alice"}' \
  '>player p2 {"name":"Bob"}' \
| ./pokemon-showdown simulate-battle --skip-build
```

注意：

- 不要把 Pokemon Showdown 本体提交进本仓库。
- 运行时优先使用已经 build 好的 `dist/sim`，通过 `--skip-build` 或 `require("dist/sim")` 避免运行时重新构建。
- 当前本地 Showdown checkout 属于外部基础设施，类似本地引擎依赖。
