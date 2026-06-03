# Change Battle CLI

纯文本摸鱼版对战工厂。

这个入口负责文字展示和玩家输入，战斗规则与队伍格式全部走 Pokemon Showdown。

## Run

```bash
./start_game_cli 123
```

自动烟测：

```bash
./start_game_cli --seed 123 --battles 1 --auto
```

## Flow

- Showdown 生成 6 只候选。
- 玩家选择 3 只。
- 每局敌方生成 3 只。
- 进入 Showdown `gen7customgame` 3v3。
- 玩家选择招式或换人。
- 敌方第一版随机行动。
- 胜利后可以交换 1 只敌方宝可梦。
- 默认最多 7 连战。

## Selection Input

- `n`：下一只。
- `p`：上一只。
- `t`：选中/取消选中当前宝可梦。
- `1`-`6`：跳转候选。
- 选满 3 只后自动开始。
- `q`：退出。

## Battle Input

- `1`、`2`、`3`、`4`：使用对应招式。
- `s2`、`s3`：换到对应位置。
- `team`：查看队伍并选择一只看详细信息。
- `team 2`：直接查看第 2 只的详细信息。
- `field`：查看天气、场地、钉子等对局信息。
- `q`：退出。
