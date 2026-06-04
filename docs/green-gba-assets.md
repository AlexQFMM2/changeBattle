# green.gba 图片资源说明

`green.gba` 是一个基于美版 Pokemon Emerald 的改版 ROM，头信息为 `POKEMON EMER / BPEE01`。当前只把它当成本地图片资源来源使用，不修改 ROM 本体。

## 已确认的资源表

这个 ROM 在 GBA 头部扩展区保留了 Gen III 改版工具常用的资源表指针：

```text
0x128 -> 0x00F20A20  宝可梦正面图表
0x12C -> 0x00F22FA0  宝可梦背面图表
0x130 -> 0x00F25520  普通调色板表
0x134 -> 0x00F27AA0  闪光调色板表
```

四张表每项 8 字节，数量为 `0x2580 / 8 = 1200`。

图像是 GBA LZ77 压缩后的 4bpp tile 数据；调色板是 LZ77 压缩后的 16 色 BGR555。导出脚本会把它们转成透明背景 PNG。

## 正确导出宝可梦图片

推荐使用这个脚本：

```bash
python3 tools/extract_green_gba_pokemon_sprites.py \
  /home/alexqfmm/workPlace/pokemon/green.gba \
  --out-dir dump/green-gba-pokemon
```

输出包括：

```text
dump/green-gba-pokemon/pokemon_sprites_manifest.json
dump/green-gba-pokemon/pokemon/{index}/front_normal.png
dump/green-gba-pokemon/pokemon/{index}/back_normal.png
dump/green-gba-pokemon/pokemon/{index}/front_shiny.png
dump/green-gba-pokemon/pokemon/{index}/back_shiny.png
dump/green-gba-pokemon/sheets/front_normal_000.png
dump/green-gba-pokemon/sheets/back_normal_000.png
```

`front_normal_full.png` / `front_shiny_full.png` 会保留 Emerald 正面动画的完整帧高度；`front_normal.png` / `front_shiny.png` 只取第一帧，适合 UI 直接展示。

## 本地稳定资源目录

为了让桌面 UI 使用稳定路径，可以把导出结果复制到：

```text
assets/pokemon-green/pokemon/{index}/...
```

当前本地已经复制了一份。这个目录被 `.gitignore` 忽略，不随仓库发布。

如果需要重新复制：

```bash
mkdir -p assets/pokemon-green
cp -a dump/green-gba-pokemon/pokemon assets/pokemon-green/
```

## Showdown species 到图片的映射

可人工校对的源映射表：

```text
data/sprite_index_map.csv
```

运行时 manifest：

```text
data/sprite_index_map.json
```

生成命令：

```bash
python3 tools/build_sprite_index_map.py \
  --csv data/sprite_index_map.csv \
  --out data/sprite_index_map.json
```

如果需要按当前启发式规则重建 CSV：

```bash
python3 tools/build_sprite_index_map.py \
  --write-csv \
  --csv data/sprite_index_map.csv \
  --out data/sprite_index_map.json
```

CSV 是之后校图的主入口，每行至少关心这两列：

```text
species_id,image
ambipom,assets/pokemon-green/pokemon/0477/front_normal.png
```

当前默认映射策略：

- `1-251`：Kanto / Johto 基本与 sprite index 直接对应。
- `252-386`：Hoenn 使用 Emerald 内部 species 顺序，默认 `national_dex + 25`。
- `387+`：这个 ROM 在 Gen IV 前放了未知图腾形态槽，默认 `national_dex + 53`。
- 形态、Mega、Gmax、地区形态等默认回退到基础 species 的图片，发现专用图后直接改 CSV。
- `sprite_index=0000` 是问号占位图，不绑定 Showdown species。
- 发现错图时直接改 `data/sprite_index_map.csv` 的 `image`，再重新生成 JSON。

UI 读取流程建议：

```text
Showdown species id
  -> data/sprite_index_map.json entries[species_id]  # 由 CSV 生成
  -> paths.front_normal / paths.back_normal
  -> 找不到时回退 assets/placeholders/pokemon.png
```

## 粗抽候选工具

`tools/extract_green_gba_assets.py` 是宽松扫描工具，会导出所有疑似 LZ77 图片块，适合继续找道具、招式特效、UI 图片等非宝可梦资源。

```bash
python3 tools/extract_green_gba_assets.py \
  /home/alexqfmm/workPlace/pokemon/green.gba \
  --out-dir dump/green-gba-assets
```

粗抽结果不保证颜色和 ID 对应关系，只用于探索。

## 战斗特效候选工具

`tools/extract_green_gba_battle_effects.py` 是战斗特效专用的第一轮摸索工具。它会：

- 扫描疑似 LZ77 4bpp 图形块。
- 扫描疑似 16 色 BGR555 调色板块。
- 把每个图形块和最近的 palette 做一次初步配对。
- 输出候选 PNG、palette 条、contact sheet 和 manifest，方便人工找火焰、水流、电光、爆炸、天气、撒钉等效果。

推荐命令：

```bash
python3 tools/extract_green_gba_battle_effects.py \
  /home/alexqfmm/workPlace/pokemon/green.gba \
  --out-dir dump/green-gba-battle-effects
```

输出包括：

```text
dump/green-gba-battle-effects/manifest.json
dump/green-gba-battle-effects/summary.txt
dump/green-gba-battle-effects/candidates/*.png
dump/green-gba-battle-effects/palettes/*.png
dump/green-gba-battle-effects/sheets/*.png
```

烟测可以限制每种尺寸数量：

```bash
python3 tools/extract_green_gba_battle_effects.py \
  /home/alexqfmm/workPlace/pokemon/green.gba \
  --out-dir /tmp/changebattle-green-gba-battle-effects-smoke \
  --limit-per-size 3
```

注意：这一步仍然不是完整 GBA 动画脚本解释器。GBA 战斗动画通常由 tile、palette、OAM/affine 模板和动画脚本共同组成；第一版只负责把“可看的候选素材”摸出来。

## 桌面战斗特效索引

桌面端读取的第一版视觉索引是：

```text
data/battle_effect_assets.json
```

当前索引先使用 CSS fallback，覆盖：

- 18 属性通用招式效果。
- 回复、伤害、强化、道具、特性、倒下。
- 灼伤、麻痹、中毒、睡眠、冰冻、混乱等状态表现。
- 雨、晴、沙暴、冰雹。
- 撒菱、毒菱、隐形岩、反射壁、光墙和常见场地。
- 出场、收回、濒死。

后续从 `dump/green-gba-battle-effects/` 里人工确认出具体帧后，直接把对应 key 从 CSS fallback 替换为 PNG frame 序列即可。Showdown 仍然只负责战斗事件；这个索引只影响桌面表现层。
