# Boss 训练师预制队伍生成审阅

本文件由 `tools/build-boss-preset-teams.mjs` 生成，用于审阅 V2 正式游戏 Boss 静态队伍池。

## 总览

- Boss 训练师数量：132
- 预制队伍总数：4752
- 目标矩阵：每个 Boss 36 队，覆盖 `none / gen7 / gen8 / gen9` 与 `singles / doubles / coop`，每格 3 个变体。
- 每套队伍：完整 6 只宝可梦，正式游戏后续再按 `6v3 / 6v4 / 6v2` 选择出战数量。
- 生成参数：`archetypeAttempts=1`
- 矩阵缺失：0
- 偏好宝可梦完全未命中 Boss：0
- 命中偏好宝可梦的队伍数：3464
- fallback format 队伍数：792
- 放宽到无过滤 fallback 队伍数：1188
- diagnostics warning 总数：1299

## 规则说明

- Boss 队伍以 V1 代表宝可梦扩展出的 `preferredSpeciesIds` 为核心，最低补到 12 只候选。
- `none` 环境按 Gen9 set 来源生成，但清理 Mega/Z/极巨/太晶相关依赖。
- `gen7 doubles/coop` 当前使用 `[Gen 7] Random Battle` 作为 fallback set 来源，diagnostics 中会记录 `fallbackFormatId`。
- Boss 队伍允许携带 Showdown 生成出的道具；玩家侧正式生成默认不携带道具是后续正式游戏流程规则。

## 样例

### 小刚

- 类型：gym
- 队伍偏好：sand / setup-offense / balanced
- AI/数值：defense / gymLeader / boss
- 矩阵：36/36
- 偏好命中队伍：19
- 样例队伍：
  - none/singles#1：Arcanine / Tyranitar / Metagross / Gyarados / Snorlax / Lapras
  - none/singles#2：Lucario / Golduck / Volcarona / Lapras / Rampardos / Dragonite
  - none/singles#3：Lapras / Gardevoir / Snorlax / Hydreigon / Dragonite / Arcanine

### 竹兰

- 类型：champion
- 队伍偏好：setup-offense / hazard-stack / balanced
- AI/数值：balanced / champion / champion
- 矩阵：36/36
- 偏好命中队伍：30
- 样例队伍：
  - none/singles#1：Gyarados / Volcarona / Lucario / Lapras / Garchomp / Metagross
  - none/singles#2：Dragonite / Volcarona / Metagross / Lapras / Lucario / Milotic
  - none/singles#3：Garchomp / Tyranitar / Snorlax / Arcanine / Magnezone / Gyarados

### 坂木

- 类型：villain
- 队伍偏好：setup-offense / rain / balanced
- AI/数值：offense / champion / champion
- 矩阵：36/36
- 偏好命中队伍：33
- 样例队伍：
  - none/singles#1：Camerupt / Groudon / Mewtwo / Houndoom / Weezing / Persian
  - none/singles#2：Mewtwo / Houndoom / Dugtrio / Camerupt / Mightyena / Persian
  - none/singles#3：Camerupt / Mightyena / Houndoom / Groudon / Persian / Mewtwo

## 全量矩阵摘要

| 训练师 | 类型 | 队伍 | 偏好命中队伍 | 原始偏好->扩展 | 队伍偏好 | AI/数值 | Fallback | Warning |
| --- | --- | ---: | ---: | ---: | --- | --- | ---: | ---: |
| 阿戴克 | champion | 36/36 | 31 | 6->12 | sun / setup-offense / balanced | balanced / champion / champion | 15 | 15 |
| 阿渡 | champion | 36/36 | 27 | 8->12 | setup-offense / rain / balanced | balanced / champion / champion | 15 | 6 |
| 艾莉丝 | champion | 36/36 | 30 | 7->12 | setup-offense / rain / balanced | balanced / champion / champion | 15 | 15 |
| 赤红 | champion | 36/36 | 36 | 6->12 | rain / sun / balanced | balanced / champion / champion | 15 | 6 |
| 大吾 | champion | 36/36 | 31 | 6->12 | sand / hazard-stack / balanced | balanced / champion / champion | 15 | 11 |
| 丹帝 | champion | 36/36 | 26 | 0->12 | balanced / setup-offense | balanced / champion / champion | 15 | 6 |
| 卡露妮 | champion | 36/36 | 24 | 6->12 | snow / tailwind / balanced | balanced / champion / champion | 15 | 10 |
| 库库伊 | champion | 36/36 | 26 | 0->12 | balanced / setup-offense | balanced / champion / champion | 15 | 6 |
| 米可利 | champion | 36/36 | 28 | 9->12 | rain / setup-offense / balanced | balanced / champion / champion | 15 | 6 |
| 妮莫 | champion | 36/36 | 25 | 0->12 | balanced / setup-offense | balanced / champion / champion | 15 | 6 |
| 小茂 / 青绿 | champion | 36/36 | 36 | 12->12 | sun / sand / balanced | balanced / champion / champion | 15 | 6 |
| 也慈 | champion | 36/36 | 26 | 0->12 | balanced / setup-offense | balanced / champion / champion | 15 | 6 |
| 竹兰 | champion | 36/36 | 30 | 6->12 | setup-offense / hazard-stack / balanced | balanced / champion / champion | 15 | 6 |
| 阿渡 | elite4 | 36/36 | 28 | 8->12 | setup-offense / rain / balanced | offense / eliteFour / boss | 15 | 6 |
| 阿桔 | elite4 | 36/36 | 27 | 13->13 | poison-stall / hazard-stack / balanced | defense / eliteFour / boss | 15 | 6 |
| 阿柳 | elite4 | 36/36 | 29 | 8->12 | hazard-stack / poison-stall / balanced | support / eliteFour / boss | 15 | 6 |
| 阿塞萝拉 | elite4 | 36/36 | 27 | 6->12 | snow / trick-room / balanced | defense / eliteFour / boss | 15 | 15 |
| 八朔 | elite4 | 36/36 | 27 | 7->12 | setup-offense / poison-stall / balanced | offense / eliteFour / boss | 15 | 6 |
| 波妮 | elite4 | 36/36 | 28 | 7->12 | snow / setup-offense / balanced | defense / eliteFour / boss | 15 | 6 |
| 波琵 | elite4 | 36/36 | 27 | 6->12 | sand / setup-offense / balanced | defense / eliteFour / boss | 15 | 9 |
| 赤松 | elite4 | 36/36 | 27 | 6->12 | sun / tailwind / balanced | offense / eliteFour / boss | 15 | 15 |
| 大叶 | elite4 | 36/36 | 31 | 10->12 | sun / sand / balanced | offense / eliteFour / boss | 15 | 11 |
| 杜若 | elite4 | 36/36 | 36 | 7->12 | setup-offense / rain / balanced | offense / eliteFour / boss | 15 | 6 |
| 朵拉塞娜 | elite4 | 36/36 | 29 | 4->12 | poison-stall / hazard-stack / balanced | defense / eliteFour / boss | 15 | 6 |
| 芙蓉 | elite4 | 36/36 | 27 | 7->12 | rain / sun / balanced | offense / eliteFour / boss | 15 | 19 |
| 哈拉 | elite4 | 36/36 | 29 | 5->12 | sun / setup-offense / balanced | offense / eliteFour / boss | 15 | 15 |
| 花月 | elite4 | 36/36 | 28 | 9->12 | setup-offense / balanced | offense / eliteFour / boss | 15 | 6 |
| 嘉德丽雅 | elite4 | 36/36 | 25 | 8->12 | trick-room / sand / balanced | support / eliteFour / boss | 15 | 9 |
| 菊野 | elite4 | 36/36 | 27 | 9->12 | sand / snow / balanced | defense / eliteFour / boss | 15 | 15 |
| 菊子 | elite4 | 36/36 | 33 | 19->18 | poison-stall / rain / balanced | defense / eliteFour / boss | 15 | 15 |
| 卡希丽 | elite4 | 36/36 | 29 | 7->12 | tailwind / hazard-stack / balanced | support / eliteFour / boss | 15 | 6 |
| 科拿 | elite4 | 36/36 | 26 | 12->12 | rain / setup-offense / balanced | offense / eliteFour / boss | 15 | 15 |
| 梨花 | elite4 | 36/36 | 27 | 9->12 | sand / snow / balanced | defense / eliteFour / boss | 15 | 18 |
| 丽姿 | elite4 | 36/36 | 26 | 8->12 | sand / setup-offense / balanced | defense / eliteFour / boss | 15 | 6 |
| 连武 | elite4 | 36/36 | 29 | 9->12 | setup-offense / hazard-stack / balanced | offense / eliteFour / boss | 15 | 6 |
| 马睿因 | elite4 | 36/36 | 29 | 5->12 | sand / terrain / balanced | defense / eliteFour / boss | 15 | 15 |
| 纳莉 | elite4 | 36/36 | 29 | 6->12 | hazard-stack / sand / balanced | support / eliteFour / boss | 15 | 15 |
| 帕琦拉 | elite4 | 36/36 | 28 | 4->12 | sun / rain / balanced | offense / eliteFour / boss | 15 | 15 |
| 青木 | elite4 | 36/36 | 26 | 11->12 | setup-offense / balanced | offense / eliteFour / boss | 15 | 6 |
| 婉龙 | elite4 | 36/36 | 29 | 9->12 | snow / rain / balanced | defense / eliteFour / boss | 15 | 24 |
| 悟松 | elite4 | 36/36 | 27 | 11->12 | trick-room / sun / balanced | support / eliteFour / boss | 15 | 15 |
| 希巴 | elite4 | 36/36 | 26 | 11->12 | sand / setup-offense / balanced | defense / eliteFour / boss | 15 | 9 |
| 希巴 | elite4 | 36/36 | 27 | 11->12 | sand / setup-offense / balanced | defense / eliteFour / boss | 15 | 9 |
| 辛俐 | elite4 | 36/36 | 28 | 6->12 | poison-stall / sun / balanced | defense / eliteFour / boss | 15 | 15 |
| 雁铠 | elite4 | 36/36 | 29 | 4->12 | balanced / setup-offense | balanced / eliteFour / boss | 15 | 6 |
| 一树 | elite4 | 36/36 | 27 | 7->12 | trick-room / terrain / balanced | support / eliteFour / boss | 15 | 15 |
| 源治 | elite4 | 36/36 | 27 | 7->12 | setup-offense / poison-stall / balanced | offense / eliteFour / boss | 15 | 6 |
| 越橘 | elite4 | 36/36 | 29 | 10->12 | sand / setup-offense / balanced | defense / eliteFour / boss | 15 | 6 |
| 志米 | elite4 | 36/36 | 29 | 4->12 | sand / rain / balanced | defense / eliteFour / boss | 15 | 23 |
| 紫竽 | elite4 | 36/36 | 36 | 6->12 | sand / setup-offense / balanced | defense / eliteFour / boss | 15 | 6 |
| 阿笔 | gym | 36/36 | 27 | 10->12 | hazard-stack / setup-offense / balanced | support / gymLeader / boss | 15 | 6 |
| 阿枫 | gym | 36/36 | 25 | 9->12 | hazard-stack / setup-offense / balanced | support / gymLeader / boss | 15 | 6 |
| 阿桔 | gym | 36/36 | 31 | 13->13 | poison-stall / hazard-stack / balanced | defense / gymLeader / boss | 15 | 6 |
| 阿李 | gym | 36/36 | 26 | 13->13 | setup-offense / sun / balanced | offense / gymLeader / boss | 15 | 15 |
| 阿蜜 | gym | 36/36 | 27 | 7->12 | sand / hazard-stack / balanced | defense / gymLeader / boss | 15 | 9 |
| 阿四 | gym | 36/36 | 27 | 9->12 | sand / sun / balanced | defense / gymLeader / boss | 15 | 18 |
| 阿速 | gym | 36/36 | 23 | 10->12 | tailwind / setup-offense / balanced | support / gymLeader / boss | 15 | 6 |
| 阿杏 | gym | 36/36 | 26 | 6->12 | poison-stall / hazard-stack / balanced | defense / gymLeader / boss | 15 | 6 |
| 艾莉丝 | gym | 36/36 | 21 | 7->12 | setup-offense / rain / balanced | offense / gymLeader / boss | 15 | 15 |
| 坂木 | gym | 36/36 | 24 | 6->12 | setup-offense / balanced | offense / gymLeader / boss | 15 | 6 |
| 波普菈 | gym | 36/36 | 26 | 8->12 | trick-room / poison-stall / balanced | support / gymLeader / boss | 15 | 6 |
| 伯特 | gym | 36/36 | 7 | 2->12 | balanced / setup-offense | balanced / gymLeader / boss | 15 | 6 |
| 彩豆 | gym | 36/36 | 28 | 7->12 | setup-offense / tailwind / balanced | offense / gymLeader / boss | 15 | 9 |
| 菜种 | gym | 36/36 | 28 | 19->18 | terrain / sun / balanced | support / gymLeader / boss | 15 | 15 |
| 查克洛 | gym | 36/36 | 16 | 6->12 | snow / sand / balanced | defense / gymLeader / boss | 15 | 15 |
| 得抚 | gym | 36/36 | 25 | 4->12 | snow / sand / balanced | defense / gymLeader / boss | 15 | 6 |
| 电次 | gym | 36/36 | 28 | 15->15 | terrain / rain / balanced | support / gymLeader / boss | 15 | 15 |
| 东瓜 | gym | 36/36 | 29 | 14->14 | sand / hazard-stack / balanced | defense / gymLeader / boss | 15 | 9 |
| 杜娟 | gym | 36/36 | 25 | 10->12 | sand / setup-offense / balanced | defense / gymLeader / boss | 15 | 9 |
| 风露 | gym | 36/36 | 19 | 5->12 | tailwind / hazard-stack / balanced | support / gymLeader / boss | 15 | 6 |
| 福爷 | gym | 36/36 | 26 | 3->12 | balanced / setup-offense | balanced / gymLeader / boss | 15 | 6 |
| 葛吉花 | gym | 36/36 | 25 | 3->12 | trick-room / setup-offense / balanced | support / gymLeader / boss | 15 | 6 |
| 古鲁夏 | gym | 36/36 | 30 | 22->18 | rain / snow / balanced | offense / gymLeader / boss | 15 | 6 |
| 哈奇库 | gym | 36/36 | 20 | 3->12 | snow / setup-offense / balanced | defense / gymLeader / boss | 15 | 6 |
| 海岱 | gym | 36/36 | 31 | 6->12 | sand / setup-offense / balanced | defense / gymLeader / boss | 15 | 11 |
| 黑连 | gym | 36/36 | 4 | 4->12 | balanced / setup-offense | balanced / gymLeader / boss | 15 | 6 |
| 霍米加 | gym | 36/36 | 9 | 5->12 | hazard-stack / poison-stall / balanced | support / gymLeader / boss | 15 | 6 |
| 吉宪 | gym | 36/36 | 30 | 13->13 | rain / setup-offense / balanced | offense / gymLeader / boss | 15 | 6 |
| 菊老大 | gym | 36/36 | 22 | 5->12 | sand / setup-offense / balanced | defense / gymLeader / boss | 15 | 6 |
| 卡芜 | gym | 36/36 | 29 | 5->12 | sun / setup-offense / balanced | offense / gymLeader / boss | 15 | 6 |
| 可尔妮 | gym | 36/36 | 24 | 3->12 | tailwind / setup-offense / balanced | support / gymLeader / boss | 15 | 6 |
| 寇恩 | gym | 36/36 | 4 | 2->12 | rain / setup-offense / balanced | offense / gymLeader / boss | 15 | 15 |
| 寇沙 | gym | 36/36 | 26 | 9->12 | balanced / setup-offense | balanced / gymLeader / boss | 15 | 6 |
| 莱姆 | gym | 36/36 | 33 | 6->12 | sand / trick-room / balanced | defense / gymLeader / boss | 15 | 11 |
| 莉佳 | gym | 36/36 | 26 | 12->12 | terrain / hazard-stack / balanced | support / gymLeader / boss | 15 | 15 |
| 莉普 | gym | 36/36 | 32 | 6->12 | trick-room / sun / balanced | support / gymLeader / boss | 15 | 15 |
| 柳伯 | gym | 36/36 | 29 | 13->13 | snow / setup-offense / balanced | defense / gymLeader / boss | 15 | 6 |
| 芦荟 | gym | 36/36 | 8 | 3->12 | balanced / setup-offense | balanced / gymLeader / boss | 15 | 6 |
| 露璃娜 | gym | 36/36 | 29 | 9->12 | hazard-stack / poison-stall / balanced | support / gymLeader / boss | 15 | 6 |
| 马志士 | gym | 36/36 | 25 | 12->12 | terrain / setup-offense / balanced | support / gymLeader / boss | 15 | 15 |
| 玛瓜 | gym | 36/36 | 28 | 5->12 | sand / setup-offense / balanced | defense / gymLeader / boss | 15 | 6 |
| 玛绣 | gym | 36/36 | 23 | 4->12 | balanced / setup-offense | balanced / gymLeader / boss | 15 | 6 |
| 梅丽莎 | gym | 36/36 | 28 | 14->14 | setup-offense / snow / balanced | offense / gymLeader / boss | 15 | 15 |
| 美蓉 | gym | 36/36 | 27 | 5->12 | snow / rain / balanced | defense / gymLeader / boss | 15 | 15 |
| 米可利 | gym | 36/36 | 25 | 9->12 | rain / setup-offense / balanced | offense / gymLeader / boss | 15 | 6 |
| 娜琪 | gym | 36/36 | 26 | 11->12 | setup-offense / tailwind / balanced | offense / gymLeader / boss | 15 | 6 |
| 娜姿 | gym | 36/36 | 28 | 11->12 | trick-room / setup-offense / balanced | support / gymLeader / boss | 15 | 6 |
| 聂梓 | gym | 36/36 | 30 | 10->12 | hazard-stack / poison-stall / balanced | support / gymLeader / boss | 15 | 6 |
| 欧尼奥 | gym | 36/36 | 25 | 8->12 | rain / sun / balanced | offense / gymLeader / boss | 15 | 24 |
| 瓢太 | gym | 36/36 | 28 | 14->14 | sand / setup-offense / balanced | defense / gymLeader / boss | 15 | 6 |
| 奇巴纳 | gym | 36/36 | 30 | 27->18 | setup-offense / sand / balanced | offense / gymLeader / boss | 15 | 10 |
| 奇树 | gym | 36/36 | 24 | 8->12 | terrain / setup-offense / balanced | support / gymLeader / boss | 15 | 15 |
| 千里 | gym | 36/36 | 23 | 9->12 | balanced / setup-offense | balanced / gymLeader / boss | 15 | 6 |
| 青绿 | gym | 36/36 | 36 | 12->12 | sun / sand / balanced | offense / gymLeader / boss | 15 | 6 |
| 青木 | gym | 36/36 | 26 | 11->12 | setup-offense / balanced | offense / gymLeader / boss | 15 | 6 |
| 松叶 | gym | 36/36 | 25 | 7->12 | trick-room / setup-offense / balanced | support / gymLeader / boss | 15 | 6 |
| 藤树 | gym | 36/36 | 25 | 9->12 | setup-offense / balanced | offense / gymLeader / boss | 15 | 6 |
| 天桐 | gym | 36/36 | 5 | 2->12 | balanced / setup-offense | balanced / gymLeader / boss | 15 | 6 |
| 铁旋 | gym | 36/36 | 23 | 14->14 | terrain / setup-offense / balanced | support / gymLeader / boss | 15 | 15 |
| 西子伊 | gym | 36/36 | 10 | 4->12 | snow / setup-offense / balanced | defense / gymLeader / boss | 15 | 15 |
| 希特隆 | gym | 36/36 | 17 | 3->12 | terrain / setup-offense / balanced | support / gymLeader / boss | 15 | 15 |
| 夏伯 | gym | 36/36 | 31 | 18->18 | sun / sand / balanced | offense / gymLeader / boss | 15 | 11 |
| 夏卡 | gym | 36/36 | 16 | 4->12 | setup-offense / balanced | offense / gymLeader / boss | 15 | 6 |
| 小椿 | gym | 36/36 | 29 | 6->12 | setup-offense / rain / balanced | offense / gymLeader / boss | 15 | 6 |
| 小枫与小南 | gym | 36/36 | 24 | 8->12 | sand / setup-offense / balanced | defense / gymLeader / boss | 15 | 9 |
| 小刚 | gym | 36/36 | 19 | 10->12 | sand / setup-offense / balanced | defense / gymLeader / boss | 15 | 9 |
| 小菊儿 | gym | 36/36 | 9 | 5->12 | hazard-stack / terrain / balanced | support / gymLeader / boss | 15 | 15 |
| 小茜 | gym | 36/36 | 25 | 8->12 | terrain / setup-offense / balanced | support / gymLeader / boss | 15 | 15 |
| 小菘 | gym | 36/36 | 36 | 17->17 | snow / rain / balanced | defense / gymLeader / boss | 15 | 12 |
| 小霞 | gym | 36/36 | 28 | 12->12 | rain / sand / balanced | offense / gymLeader / boss | 15 | 9 |
| 亚当 | gym | 36/36 | 26 | 12->12 | rain / setup-offense / balanced | offense / gymLeader / boss | 15 | 6 |
| 亚堤 | gym | 36/36 | 10 | 6->12 | hazard-stack / sand / balanced | support / gymLeader / boss | 15 | 6 |
| 亚洛 | gym | 36/36 | 30 | 8->12 | rain / setup-offense / balanced | offense / gymLeader / boss | 15 | 6 |
| 亚莎 | gym | 36/36 | 31 | 11->12 | sun / hazard-stack / balanced | offense / gymLeader / boss | 15 | 6 |
| 紫罗兰 | gym | 36/36 | 20 | 2->12 | balanced / setup-offense | balanced / gymLeader / boss | 15 | 6 |
| 坂木 | villain | 36/36 | 33 | 6->12 | setup-offense / rain / balanced | offense / champion / champion | 15 | 15 |
| 赤日 | villain | 36/36 | 36 | 6->12 | poison-stall / rain / balanced | offense / champion / champion | 15 | 15 |
| 赤焰松 | villain | 36/36 | 31 | 6->12 | poison-stall / sand / balanced | offense / champion / champion | 15 | 14 |
| 弗拉达利 | villain | 36/36 | 36 | 6->12 | rain / sand / balanced | offense / champion / champion | 15 | 24 |
| 魁奇思 | villain | 36/36 | 36 | 6->12 | setup-offense / rain / balanced | offense / champion / champion | 15 | 10 |
| 露莎米奈 | villain | 36/36 | 36 | 6->12 | rain / sand / balanced | offense / champion / champion | 15 | 24 |
| 水梧桐 | villain | 36/36 | 36 | 6->12 | poison-stall / rain / balanced | offense / champion / champion | 15 | 6 |

## 需要重点复查

- 暂无必须立即处理的缺口。
