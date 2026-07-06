# Git Branch Guide

本文档记录 ChangeBattle V2 当前约定的长期分支、发布流和更新通道关系。

## Long-Lived Branches

```text
release   正式发布分支
v2        日常开发分支
update    更新系统/发布流程专项分支
```

### `release`

正式发布分支，只放已经验证过、准备推给玩家的版本。

- 对应正式更新通道。
- 只从通过测试的 `v2` 或紧急 `hotfix/*` 合入。
- 从这个分支生成正式 release 包和正式 `latest.json`。
- 不直接做日常开发。

### `v2`

日常开发分支。

- 平衡调整、普通 bug、新功能默认先进入这里。
- 可以发布到 beta/test 更新通道给自己或测试群验证。
- 验证通过后再合入 `release`。

### `update`

更新系统和发布流程专项分支。

- 用于继续迭代桌面端增量更新、发布脚本、官网页面、更新通道等基础设施。
- 这类改动验证通过后合回 `v2`，再随版本进入 `release`。
- 如果只是很小的发布脚本修正，也可以直接在 `v2` 做，但大改优先走 `update`。

## Temporary Branches

大功能或风险较高的改动使用临时分支：

```text
feature/<name>
hotfix/<name>
```

推荐规则：

- `feature/*` 从 `v2` 切出，做完合回 `v2`。
- `hotfix/*` 从 `release` 切出，修完先合回 `release` 发补丁，再合回 `v2`。

## Release Flow

常规版本：

```text
feature/* -> v2 -> beta/test 验证 -> release -> stable 正式发布
```

操作上可以理解为：

1. 日常开发在 `v2`。
2. 大功能先在 `feature/*`，完成后合入 `v2`。
3. 从 `v2` 生成测试包或发布到测试更新通道。
4. 测试通过后，将 `v2` 合入 `release`。
5. 从 `release` 生成正式包并发布正式更新清单。

紧急修复：

```text
release -> hotfix/* -> release -> v2
```

也就是：

1. 从 `release` 切出 `hotfix/<name>`。
2. 修复并验证。
3. 合回 `release`，生成正式补丁。
4. 再合回 `v2`，避免开发分支漏修。

## Update Channels

Git 分支和更新通道是两件事，但建议保持对应关系：

```text
release 分支 -> stable 正式通道 -> /changebattle/
v2 分支      -> beta 测试通道   -> /changebattle-beta/
feature 分支 -> 不直接给玩家
```

当前桌面端支持通过 `CHANGEBATTLE_UPDATE_MANIFEST_URLS` 指定更新清单地址。正式包默认使用 stable 清单；测试包默认使用 beta 清单。

常用发布命令：

```bash
# 测试通道：通常在 v2 分支执行
CHANGEBATTLE_RELEASE_CHANNEL=beta ./tools/build_release_on_windows.sh 0.1.4
CHANGEBATTLE_RELEASE_CHANNEL=beta ./tools/publish_desktop_update_manifest.sh 0.1.4

# 正式通道：通常在 release 分支执行
git switch release
CHANGEBATTLE_RELEASE_CHANNEL=stable ./tools/build_release_on_windows.sh 0.1.4
CHANGEBATTLE_RELEASE_CHANNEL=stable ./tools/publish_desktop_update_manifest.sh 0.1.4
```

默认地址：

```text
stable latest: http://119.45.240.157/changebattle/latest.json
beta latest:   http://119.45.240.157/changebattle-beta/latest.json
```

## Current Baseline

当前长期分支已经建立：

```text
release
v2
update
```

当前状态：

```text
current working branch: v2
stable latest:          0.1.3
stable site:            http://119.45.240.157/changebattle/
beta site:              http://119.45.240.157/changebattle-beta/
```

`0.1.1` 是桌面端文件级增量更新的初始化版本。`0.1.2` 和 `0.1.3` 已验证普通游戏代码和资源更新可以走增量；Electron runtime、launcher、updater 等变化仍要求完整包。
