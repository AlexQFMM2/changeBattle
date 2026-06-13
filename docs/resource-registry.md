# 资源 Registry 与 Runtime Assets

## 当前模型

ChangeBattle 的宝可梦和道具图片不再直接以大素材库目录作为运行时来源。当前分三层：

- `data/pokemon_resource_registry.json`：宝可梦资源权威档案。
- `data/item_resource_registry.json`：道具资源权威档案。
- `assets/runtime/pokemon/`、`assets/runtime/items/`：release 实际打包的精选运行时资源。

`data/sprite_index_map.json` 仍保留，但它是由 `pokemon_resource_registry.json` 派生出的兼容产物，用来减少旧 UI 和 service 代码的改动面。新逻辑应优先读 registry。

## 外部参考库

大体积参考素材库统一放在项目外：

```text
/home/alexqfmm/workPlace/pokemon/ui-refrence/pokemon-showdown/
/home/alexqfmm/workPlace/pokemon/ui-refrence/pokemon-pack/
/home/alexqfmm/workPlace/pokemon/ui-refrence/items-pack/
/home/alexqfmm/workPlace/pokemon/ui-refrence/items/
/home/alexqfmm/workPlace/pokemon/ui-refrence/pokemon-custom/
```

这些目录只是生成 registry 和 runtime assets 时的参考来源，不能作为业务代码的最终读取路径，也不能进入 Desk zip 或 APK。

项目内不要重新提交这些目录：

```text
assets/pokemon-showdown/
assets/pokemon-pack/
assets/items-pack/
assets/items/
assets/pokemon-custom/
```

## 生成命令

构建 registry 和精选资源：

```bash
pnpm assets:build-registry
```

旧的导入命令仍可用于重新生成参考映射，但最终也会调用 registry 构建：

```bash
pnpm assets:import-pokemon-pack
```

生成脚本：

```text
tools/build_resource_registries.py
```

主要输入：

```text
data/resource_source_sprite_index_map.json
data/resource_overrides.json
外部 ui-refrence 参考素材库
Pokemon Showdown Dex
```

主要输出：

```text
data/pokemon_resource_registry.json
data/item_resource_registry.json
data/sprite_index_map.json
assets/runtime/pokemon/
assets/runtime/items/
```

## Registry 字段

宝可梦 registry 记录 species、中文名、全国图鉴编号、基础种、形态类型、具体形态、正面/背面/闪光/图标/叫声等资源路径。

道具 registry 记录 item id、名称、中文名、分类、战斗系统标签、图标、fallback 图标等信息。

registry 内的运行时路径必须是项目内相对路径，例如：

```text
assets/runtime/pokemon/staraptormega/front_normal-xxxx.png
assets/runtime/items/goldbottlecap/icon.png
```

registry 不允许引用 `/home/.../ui-refrence` 绝对路径，也不允许直接引用旧的 `assets/pokemon-showdown`、`assets/pokemon-pack`、`assets/items-pack`、`assets/items`。

## Release 要求

Desk release zip 和 Android APK 必须包含：

```text
data/pokemon_resource_registry.json
data/item_resource_registry.json
data/sprite_index_map.json
assets/runtime/pokemon/
assets/runtime/items/
```

Desk release zip 和 Android APK 不应包含：

```text
assets/pokemon-showdown/
assets/pokemon-pack/
assets/items-pack/
assets/items/
assets/pokemon-custom/
assets/pokemon-green/
```

`tools/package_desktop_release.py`、`tools/windows/build-desk-release.ps1` 和 `tools/windows/build-mobile-release.ps1` 会在 release 阶段校验这些规则。

## 修改资源时的原则

- 物种和形态正确优先于正背面方向正确。
- Mega、地区形态、Gmax 等特殊形态应通过 registry 明确指到对应运行时资源。
- 如果某个形态只有正面图，可以让背面先 fallback 到同一张正确形态正面图，不能 fallback 到普通形态或错误物种。
- 修图时优先改 `data/resource_overrides.json` 或源映射，再重新生成 registry。
- 不要在业务代码里硬编码外部参考库绝对路径。
