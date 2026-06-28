# Pokemon Species Rank Distribution

## Summary

本文记录 V1 宝可梦物种分布迁移到 V2 后的命名和规则。V2 不再把物种池叫做 `tier`，统一使用 `speciesRank`：

| V1 来源字段 | V2 术语 | 用途 |
| --- | --- | --- |
| `species tier1` | `speciesRank=rank1` | 极低强度物种池，主要是弱小未进化 |
| `species tier2` | `speciesRank=rank2` | 低强度物种池，主要是未进化和低战力 |
| `species tier3` | `speciesRank=rank3` | 过渡物种池，含部分战术价值物种 |
| `species tier4` | `speciesRank=rank4` | 普通最终形与中档对战主体 |
| `species tier5` | `speciesRank=rank5` | 较强最终形与高质量普通物种 |
| `species tier6` | `speciesRank=rank6` | 高强度普通物种、准神、强战术物种 |
| `species tier10` | `speciesRank=legendary` | 神兽、幻兽、特殊传说形态 |

`speciesRank` 只决定“抽哪个物种池”。它不决定等级、IV、EV、性格和携带道具；这些由 `powerProfile` 和 owner 规则决定。

## Source And Scoring

V2 第一版沿用 V1 `data/pokemon_tiers.csv` 的物种分布结果，迁移来源为 V1 `docs/randomPokemonRule.md` 与 `tools/build_team_generation_data.js`。

V1 评分公式：

```text
score = BST
      + nfePenalty
      + legendaryBonus
      + randomLevelScore
      + evioliteBulkBonus
      + randomSetEvioliteBonus
      + tacticalBonus
```

评分含义：

- `BST`：六项种族值总和。
- `nfePenalty`：未最终进化减分，非未最终进化加分。
- `legendaryBonus`：神兽或幻兽进入传说池，不参与普通六档切分。
- `randomLevelScore`：Showdown 随机对战等级越低，表示随机对战中越强，分数越高。
- `evioliteBulkBonus`：耐久高的未进化宝可梦获得辉石潜力补偿。
- `randomSetEvioliteBonus`：Showdown random set 给辉石时额外补偿。
- `tacticalBonus`：百变怪、图图犬、脱壳忍者、果然翁等低 BST 高战术价值物种获得补偿。

普通物种按 score 从低到高排序后六等分为 `rank1-rank6`。神兽、幻兽和特殊传说形态进入 `legendary`。边界分数可能重叠，因为普通 rank 按排序序号切分，不按固定分数阈值切分。

## Rank Summary

### rank1

- V1 来源：`species tier1`
- 数量：176
- 分数范围：135-255
- NFE 数量：174
- 神兽/幻兽数量：0
- 地区分布：关都 Gen1: 23；城都 Gen2: 20；丰缘 Gen3: 32；神奥 Gen4: 15；合众 Gen5: 20；卡洛斯 Gen6: 8；阿罗拉 Gen7: 19；伽勒尔 Gen8: 19；帕底亚 Gen9: 20。
- 用途：低档数据池、弱小未进化、早期波动候选。
- 代表物种：弱丁鱼、向日种子、雪吞虫、绿毛虫、鲤鱼王、皮丘、小福蛋、土狼犬、咕妞妞、超音蝠、玛力露、烛光灵、利欧路、圆陆鲨、迷你龙、幼基拉斯。

### rank2

- V1 来源：`species tier2`
- 数量：175
- 分数范围：257-313
- NFE 数量：175
- 神兽/幻兽数量：0
- 地区分布：关都 Gen1: 33；城都 Gen2: 10；丰缘 Gen3: 16；神奥 Gen4: 19；合众 Gen5: 34；卡洛斯 Gen6: 19；阿罗拉 Gen7: 11；伽勒尔 Gen8: 16；帕底亚 Gen9: 17。
- 用途：低档未进化、御三家初始形态、普通敌人低档补位。
- 代表物种：小火龙、杰尼龟、妙蛙种子、皮卡丘、伊布、鬼斯、独剑鞘、小磁怪、小海狮、卡蒂狗、利牙鱼、牙牙、凉脊龙、火斑喵、新叶喵、呱呱泡蛙。

### rank3

- V1 来源：`species tier3`
- 数量：176
- 分数范围：315-480
- NFE 数量：119
- 神兽/幻兽数量：0
- 地区分布：关都 Gen1: 27；城都 Gen2: 24；丰缘 Gen3: 25；神奥 Gen4: 9；合众 Gen5: 21；卡洛斯 Gen6: 17；阿罗拉 Gen7: 21；伽勒尔 Gen8: 19；帕底亚 Gen9: 13。
- 用途：开局低档波动、普通敌人早期主体、部分战术价值物种。
- 代表物种：脱壳忍者、信使鸟、未知图腾、大嘴娃、勾魂眼、鬼斯通、豪力、沼跃鱼、毒蔷薇、哈克龙、金属怪、三合一磁怪、鸭嘴火兽、电击兽、大嘴蝠。

### rank4

- V1 来源：`species tier4`
- 数量：175
- 分数范围：481-552
- NFE 数量：8
- 神兽/幻兽数量：0
- 地区分布：关都 Gen1: 18；城都 Gen2: 14；丰缘 Gen3: 23；神奥 Gen4: 11；合众 Gen5: 13；卡洛斯 Gen6: 8；阿罗拉 Gen7: 16；伽勒尔 Gen8: 40；帕底亚 Gen9: 32。
- 用途：普通最终形、中档对战主体、0 连胜及以上开局主体。
- 代表物种：玛力露丽、大嘴鸥、洛托姆、双剑鞘、风铃铃、火暴猴、海豚侠、喷火驼、电灯怪、阿勃梭鲁、雪绒蛾、钢铠鸦、大王铜象、巨锻匠、铝钢龙。

### rank5

- V1 来源：`species tier5`
- 数量：176
- 分数范围：552-590
- NFE 数量：3
- 神兽/幻兽数量：0
- 地区分布：关都 Gen1: 22；城都 Gen2: 9；丰缘 Gen3: 18；神奥 Gen4: 15；合众 Gen5: 33；卡洛斯 Gen6: 15；阿罗拉 Gen7: 22；伽勒尔 Gen8: 25；帕底亚 Gen9: 17。
- 用途：高质量普通物种、强力最终形、普通敌人高档和 boss 固定池候选。
- 代表物种：吉利蛋、斗笠菇、盔甲鸟、煤炭龟、钥圈儿、皮可西、袋兽、暴雪王、骑士蜗牛、青铜钟、凯罗斯、飞天螳螂、闪焰王牌、轰擂金刚猩、弃世猴。

### rank6

- V1 来源：`species tier6`
- 数量：178
- 分数范围：430-763
- NFE 数量：1
- 神兽/幻兽数量：0
- 地区分布：关都 Gen1: 23；城都 Gen2: 17；丰缘 Gen3: 11；神奥 Gen4: 31；合众 Gen5: 23；卡洛斯 Gen6: 15；阿罗拉 Gen7: 26；伽勒尔 Gen8: 7；帕底亚 Gen9: 25。
- 用途：高强度普通物种、准神、强战术物种、高阶 boss 固定池候选。
- 代表物种：图图犬、百变怪、果然翁、谜拟Ｑ、坚果哑铃、超坏星、烈箭鹰、坚盾剑怪、胡地、耿鬼、巨钳螳螂、沙奈朵、路卡利欧、暴鲤龙、火神蛾、快龙、烈咬陆鲨、巨金怪、暴飞龙、班基拉斯。

### legendary

- V1 来源：`species tier10`
- 数量：132
- 分数范围：245-1260
- NFE 数量：3
- 神兽/幻兽数量：132
- 地区分布：关都 Gen1: 5；城都 Gen2: 6；丰缘 Gen3: 13；神奥 Gen4: 31；合众 Gen5: 19；卡洛斯 Gen6: 8；阿罗拉 Gen7: 20；伽勒尔 Gen8: 18；帕底亚 Gen9: 12。
- 用途：神战池、特殊 boss 池、邪恶头领/冠军高强度池。
- 代表物种：梦幻、超梦、凤王、洛奇亚、固拉多、盖欧卡、烈空坐、帝牙卢卡、帕路奇亚、骑拉帝纳、阿尔宙斯、捷克罗姆、莱希拉姆、哲尔尼亚斯、伊裴尔塔尔、苍响、藏玛然特、故勒顿、密勒顿。

## Selection Rules

正式游戏生成时：

- `battlePreference.allowedGenerations` 会作为地区过滤条件，限制普通随机池。
- `battlePreference.legendaryBattle=false` 时，普通随机池排除 `speciesRank=legendary`。
- `battlePreference.legendaryBattle=true` 时，`legendary` 可以进入普通随机池，但每队最多 1 只。
- Boss 固定队伍不受神战开关影响，但仍受规则系统和世代兼容池约束。
- 同一队伍内应避免重复物种，并尽量让世代分布更均衡。

## Review Lists

战术补偿审阅清单：

- 脱壳忍者
- 图图犬
- 百变怪
- 果然翁

多形态和特殊形态后续需要继续审阅，决定是否合并、升降 rank 或受神战规则控制。V2 第一版先保留 V1 物种池结果，不在文档迁移阶段重新打分。
