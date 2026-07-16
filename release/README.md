# ChangeBattle V2 Release Workspace

`release/` 是桌面端发版工作台。当前主流程由 GitHub Actions 构建 Windows debug/stable portable 包，完整包托管在 GitHub Release，更新入口和增量对象仍发布到自有服务器。

当前推荐链路：

```text
push v2/release
  -> GitHub Actions 构建 desktop portable
  -> GitHub Release 托管完整 zip
  -> GitHub Actions artifact 产出 latest.json + manifests + objects
  -> 本地下载 artifact
  -> 本地上传 artifact 内容到服务器
  -> 玩家从服务器 latest.json/current.json/objects 增量更新
```

当前线上基线：

```text
stable latest: http://119.45.240.157/changebattle/latest.json
stable site:   http://119.45.240.157/changebattle/
beta latest:   http://119.45.240.157/changebattle-beta/latest.json
beta site:     http://119.45.240.157/changebattle-beta/
server root:   /home/ubuntu/webApp/
```

当前已发布版本：

```text
0.1.1  增量更新初始化版本；旧正式包默认追 stable。
0.1.2  验证 0.1.1 -> 0.1.2 自动增量更新；新增右下角手动检查入口。
0.1.3  验证 0.1.2 -> 0.1.3 自动增量更新；压缩更新弹窗 UI 到 640x320 规格。
0.1.4  修复出招面板禁用技能槽位显示；结算统计优先按后端播放流程归因。
0.1.20 debug  GitHub Actions 桌面构建 + 内容哈希对象池更新迁移首包。
```

`0.1.3` 线上完整包镜像：

```text
百度网盘: https://pan.baidu.com/s/1IkuAW6RnYnckOmZe68QZ6g?pwd=1tjq
提取码: 1tjq
```

## Branch / Channel

长期分支和更新通道保持这个关系：

```text
release 分支 -> stable 正式通道 -> /changebattle/
v2 分支      -> beta 测试通道   -> /changebattle-beta/
hotfix/*    -> 从 release 临时切出，通常先 beta 验证，再回 release 发 stable
update 分支  -> 更新系统/发布流程专项分支，验证后合回 v2
```

不要维护长期 `debug` 分支。测试包由 `CHANGEBATTLE_RELEASE_CHANNEL=beta` 决定；分支来源可以是 `v2`，也可以是某个临时 `hotfix/*`。

`CHANGEBATTLE_RELEASE_CHANNEL` 控制构建和发布通道：

```text
stable -> CHANGEBATTLE_UPDATE_MANIFEST_URLS=http://119.45.240.157/changebattle/latest.json
beta   -> CHANGEBATTLE_UPDATE_MANIFEST_URLS=http://119.45.240.157/changebattle-beta/latest.json
```

portable 包构建时会把通道地址写入 `ChangeBattle-V2-Desk.cmd`。因此 stable 包只吃 stable 更新，beta 包只吃 beta 更新。

## Local Worktree Policy

正式发布必须用 `git worktree` 隔离工作区，不要手动复制项目目录。

推荐固定目录：

```text
/home/alexqfmm/workPlace/pokemon/changeBattleV2          v2 日常开发工作区
/home/alexqfmm/workPlace/pokemon/changeBattleV2-release  release 正式发布工作区
```

临时紧急修复目录按需创建，用完删除：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
git worktree add -b hotfix/<name> ../changeBattleV2-hotfix-<name> release
```

硬规范：

- `changeBattleV2` 只做 `v2` 新功能和 beta/debug 验证。
- `changeBattleV2-release` 只做 stable 正式发布，不做日常开发。
- `changeBattleV2-hotfix-*` 只做正式版紧急修复，修完合回 `release` 后必须同步回 `v2`，然后删除临时 worktree。
- `release/` 是发版产物目录，不等于 `release` 分支，也不能当独立代码工作区使用。
- 不要用复制目录代替 worktree；复制目录容易带走 `node_modules`、构建产物、旧 `release/` 文件和未提交改动，导致发版来源不清。

已建立的本地工作区：

```text
/home/alexqfmm/workPlace/pokemon/changeBattleV2          v2
/home/alexqfmm/workPlace/pokemon/changeBattleV2-release  release
```

## Server Layout

服务器固定目录：

```text
/home/ubuntu/webApp/changebattle/       stable 正式站
/home/ubuntu/webApp/changebattle-beta/  beta 测试站
  latest.json
  index.html
  image/
  manifests/current.json
  manifests/vX.Y.Z.json
  objects/<sha前2位>/<完整sha256>
```

`latest.json` 给桌面端启动自检和右下角手动检查使用。`index.html` 是玩家访问的游戏官网。`manifests/current.json` 描述当前目标安装目录，`objects/` 按内容 sha256 存储增量对象。

发布脚本会上传 `latest.json`、`index.html`、`image/`、`manifests/` 和 `objects/`，但不会上传约 600 MiB 的 zip。完整包由 GitHub Release 托管，并写入 `latest.json.fullPackage` / `mirrors`。

下载链接继承规则：

- 发布脚本生成新 `latest.json/index.html` 前，会先读取当前通道线上旧版 `latest.json`。
- 如果本次没有显式设置 `CHANGEBATTLE_RELEASE_MIRRORS`、`CHANGEBATTLE_FULL_PACKAGE_URL` 或 `--mirror/--full-package-url`，则继承旧版 `mirrors` 和 `fullPackage`。
- 如果本次显式设置了新镜像，则以新镜像为准，并用本次 zip 计算新的 `sha256/size`。
- 常规增量修复可以不重新上传 600 MiB 完整包，下载页继续展示上一版可用完整包链接。
- 如果本次必须玩家下载完整包，例如 runtime、launcher、updater、目录结构变化，必须上传新完整包并显式设置镜像链接，不能依赖继承旧链接。

## Incremental Update

桌面端更新流程：

1. 启动后后台读取当前通道的 `latest.json`。
2. 如果 `latest.json` 有 `objectBaseUrl`，读取远端 `manifests/current.json`。
3. 客户端重新计算本地实际文件 sha256，不完全信任本地 `update-manifest.json`。
4. 用 `path + sha256` 比较本地实际状态和远端目标状态。
5. 新增/修改文件从 `objects/<sha前2位>/<完整sha256>` 下载到 `.update-staging/`。
6. 校验 sha256。
7. 替换或删除前备份旧文件到 `.update-backup/`。
8. 全部成功后写入新的 `update-manifest.json`。
9. 提示玩家重启后生效。

当前允许增量管理：

```text
apps/
assets/
resources/
vendor/
package.json
```

禁止增量管理：

```text
runtime/electron/
ChangeBattle-V2-Desk.exe
ChangeBattle-V2-Desk.cmd
ChangeBattle-V2-Desk.launcher.env
update-manifest.json
```

Electron runtime、launcher、updater 或目录结构变化，一律发布完整包，并在生成清单时标记 `requiresFullPackage`。

迁移注意：

- `0.1.20` 是对象池迁移首包，服务器之前没有 `manifests/current.json`，所以 artifact 仍接近全量。
- 迁移首包建议玩家下载完整包，让客户端拿到新版 updater。
- 从下一个版本开始，GitHub Actions 能读取服务器 `manifests/current.json`，artifact 才会只包含新增对象。

## Version Source Policy

版本号是 release 安全边界，不能写散。

权威版本源：

```text
package.json                         构建和发布脚本校验版本
release/changebattle/latest.json      远端通道版本
release/changebattle/manifests/current.json        当前目标文件清单
release/changebattle/manifests/vX.Y.Z.json         版本留档文件清单
portable/update-manifest.json         已安装客户端的本地真实版本
```

桌面端运行时必须优先读取 `portable/update-manifest.json.version` 作为当前版本。`CHANGEBATTLE_DESKTOP_VERSION` 和 Electron `app.getVersion()` 只能作为 fallback，不能作为增量更新后的权威版本。

禁止事项：

- 禁止在 UI 中硬编码旧版本号，例如 `v0.1.0`。
- 禁止让 `apps/desktop/package.json` 的包版本冒充 release 版本。
- 禁止把 `.cmd` 中的 `CHANGEBATTLE_DESKTOP_VERSION` 当成增量更新后的真实版本，因为 `.cmd` 不参与增量替换。
- 禁止同版本覆盖作为常规修复方式；只有在客户端仍把自己识别成旧版本时，才允许用同版本 manifest 补救一次。

0.1.4 事故复盘：

```text
现象：增量更新后右下角显示 v0.1.0。
原因 1：前端版本 badge 曾经硬编码 v0.1.0。
原因 2：桌面端版本读取链路曾经优先读 CHANGEBATTLE_DESKTOP_VERSION/app.getVersion()。
原因 3：ChangeBattle-V2-Desk.cmd 不参与增量更新，旧包里的环境变量会残留。
修复：版本 badge 显示 release 0.1.4；桌面端优先读取 update-manifest.json.version；官网和更新链接在域名未就绪前使用 http+ip。
```

每次 release 前必须检查：

```bash
node -p "require('./package.json').version"
rg -n "v0\\.1\\.0|release 0\\.1\\.0|0\\.1\\.0" apps/web apps/desktop packages tools
node --check tools/generate_desktop_update_manifest.mjs
bash -n tools/build_release_on_windows.sh
bash -n tools/publish_desktop_update_manifest.sh
```

构建后必须检查本地产物：

```bash
rg -n '"version": "X.Y.Z"' tmp/gha-beta-update-vX.Y.Z-*/latest.json tmp/gha-beta-update-vX.Y.Z-*/manifests/current.json
rg -n '"objectBaseUrl"' tmp/gha-beta-update-vX.Y.Z-*/latest.json
cat tmp/gha-beta-update-vX.Y.Z-*/object-update-summary.json
```

## Release Flow

推荐主流程：

1. 在 `v2` 开发并自测。
2. 提升 `package.json.version`，提交并 push。
3. GitHub Actions 运行 `Release Debug Desktop`。
4. GitHub Release 生成完整 zip。
5. GitHub Actions 生成 update metadata artifact。
6. 本地下载 artifact 到 `tmp/`。
7. 本地上传 artifact 内容到服务器。
8. 测试玩家下载完整包或走增量更新验证。
9. 验证通过后合入 `release`，stable 通道使用同样 GitHub Actions/本地发布 artifact 模式。

正式版紧急修复流程：

1. 从 `release` 临时切 `hotfix/<name>`，推荐单独 worktree。
2. 在 hotfix 工作区修改。
3. 本地测试通过。
4. 必要时从 hotfix 发 beta/debug 包给测试者验证。
5. 验证通过后合并回 `release`。
6. 在 `changeBattleV2-release` 工作区重新 release stable 正式版。
7. 将 hotfix 合并或 cherry-pick 回 `v2`，防止下次新功能覆盖正式修复。
8. 删除临时 hotfix worktree。

紧急修复命令模板：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
git worktree add -b hotfix/<name> ../changeBattleV2-hotfix-<name> release

cd /home/alexqfmm/workPlace/pokemon/changeBattleV2-hotfix-<name>
# 修改代码
pnpm --filter @changebattle-v2/api test:formal-game
pnpm --filter @changebattle-v2/web typecheck
pnpm --filter @changebattle-v2/desktop typecheck
git add <files>
git commit -m "fix <name>"

cd /home/alexqfmm/workPlace/pokemon/changeBattleV2-release
git merge --no-ff hotfix/<name>
# push release 后使用 GitHub Actions 构建 stable/debug；不要再走旧 Windows scp 构建主流程。

cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
git merge --no-ff hotfix/<name>
git worktree remove ../changeBattleV2-hotfix-<name>
git branch -d hotfix/<name>
```

新功能流程：

1. 在 `v2` 工作区开发。
2. 本地测试通过。
3. 从 `v2` 生成 beta/debug 版本。
4. 测试通过后合并到 `release`。
5. 在 `changeBattleV2-release` 工作区重新 release stable 正式版。

新功能不能直接在 `release` 分支开发；`release` 只能接收已经验证过的提交。

### Beta Test Release

当前主流程走 GitHub Actions，不再从本机 scp 源码到 Windows 构建机。公共素材已迁移到腾讯 COS/CDN，debug desktop 构建不再下载 `changeBattleV2-assets.tgz`。

1. 确认版本并提交：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
node -p "require('./package.json').version"
git push origin v2
```

2. 触发 GitHub Actions：

```bash
VERSION=0.1.20
gh workflow run "Release Debug Desktop" \
  --repo AlexQFMM2/changeBattle \
  --ref v2 \
  -f version="$VERSION" \
  -f source_ref=v2 \
  -f create_github_release=true \
  -f update_manifest_url=http://119.45.240.157/changebattle-beta/latest.json \
  -f official_site_url=http://119.45.240.157/changebattle-beta/
```

3. 等待构建完成：

```bash
gh run list --repo AlexQFMM2/changeBattle --workflow "Release Debug Desktop" --limit 3
gh run watch <run_id> --repo AlexQFMM2/changeBattle --exit-status
```

4. 下载 update metadata artifact 到本地 `tmp/`：

```bash
VERSION=0.1.20
RUN_ID=<run_id>
OUT_DIR="/home/alexqfmm/workPlace/pokemon/changeBattleV2/tmp/gha-beta-update-v${VERSION}-${RUN_ID}"
mkdir -p "$OUT_DIR"
gh run download "$RUN_ID" \
  --repo AlexQFMM2/changeBattle \
  --name "changebattle-beta-update-metadata-v${VERSION}" \
  --dir "$OUT_DIR"
```

5. 发布 artifact 内容到 beta 服务器：

```bash
VERSION=0.1.20
OUT_DIR="/home/alexqfmm/workPlace/pokemon/changeBattleV2/tmp/gha-beta-update-v${VERSION}-<run_id>"
CHANGEBATTLE_RELEASE_CHANNEL=beta \
CHANGEBATTLE_UPDATE_LOCAL_DIR="$OUT_DIR" \
./tools/publish_desktop_update_manifest.sh "$VERSION"
```

生成的 beta 包会追：

```text
http://119.45.240.157/changebattle-beta/latest.json
```

完整 debug 包由 GitHub Release 托管：

```text
https://github.com/AlexQFMM2/changeBattle/releases/tag/desk-debug-vX.Y.Z
```

### Stable Release

stable 也采用同一模式：从 `release` 分支触发 GitHub Actions 构建，完整包托管 GitHub Release，metadata artifact 下载后发布到 `/changebattle/`。

当前 workflow 仍叫 `Release Debug Desktop`，默认面向 beta/debug；stable 正式发版前需要确认 workflow inputs 和 release channel 已切到 stable。没有切 stable 前，不要用 debug workflow 覆盖正式通道。

stable 发布 metadata 的本地命令形状如下：

```bash
VERSION=X.Y.Z
OUT_DIR="/home/alexqfmm/workPlace/pokemon/changeBattleV2-release/tmp/gha-stable-update-v${VERSION}-<run_id>"
CHANGEBATTLE_RELEASE_CHANNEL=stable \
CHANGEBATTLE_UPDATE_LOCAL_DIR="$OUT_DIR" \
./tools/publish_desktop_update_manifest.sh "$VERSION"
```

生成的 stable 包会追：

```text
http://119.45.240.157/changebattle/latest.json
```

### Legacy Windows SCP Build

以下流程已废弃为主流程，只作为 GitHub Actions 故障时的备用方案：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
CHANGEBATTLE_RELEASE_CHANNEL=beta ./tools/build_release_on_windows.sh X.Y.Z
```

旧流程会把源码/assets/vendor 通过 scp 传到 Windows 构建机，再把 zip 拉回本地。它比 GitHub Actions 慢且更容易受远程机器状态影响。

```text
win10@172.16.10.41
D:\changeBattleV2\changeBattleV2
D:\changeBattleV2\release
D:\changeBattleV2\electron-runtime
```

## Build Output

GitHub Actions 成功后会产生：

```text
GitHub Release:
  ChangeBattle-V2-Desk-portable-debug-vX.Y.Z.zip

GitHub Actions artifact:
  changebattle-beta-update-metadata-vX.Y.Z
    latest.json
    index.html
    object-update-summary.json
    manifests/current.json
    manifests/vX.Y.Z.json
    objects/<sha前2位>/<完整sha256>
```

本地下载 artifact 后放在：

```text
/home/alexqfmm/workPlace/pokemon/changeBattleV2/tmp/gha-beta-update-vX.Y.Z-<run_id>
```

发布到服务器后，服务器静态目录为：

```text
/home/ubuntu/webApp/changebattle-beta/
  latest.json
  index.html
  manifests/current.json
  manifests/vX.Y.Z.json
  objects/<sha前2位>/<完整sha256>
```

## Download Mirrors

GitHub Actions 主流程会自动把完整包 GitHub Release URL 写入 `latest.json.fullPackage` 和 `mirrors`，通常不需要手动设置 `CHANGEBATTLE_RELEASE_MIRRORS`。

只有 legacy/手动生成 metadata 时，才需要用 `名称=链接` 写入 `CHANGEBATTLE_RELEASE_MIRRORS`。多个镜像用换行分隔。

示例：

```bash
export CHANGEBATTLE_RELEASE_MIRRORS=$'GitHub Release=https://github.com/AlexQFMM2/changeBattle/releases/download/desk-debug-vX.Y.Z/ChangeBattle-V2-Desk-portable-debug-vX.Y.Z.zip'
```

手动重新生成本地 `latest.json/index.html`：

```bash
CHANGEBATTLE_RELEASE_CHANNEL=stable node tools/generate_desktop_update_manifest.mjs X.Y.Z
```

发布本地 artifact 目录：

```bash
CHANGEBATTLE_RELEASE_CHANNEL=stable \
CHANGEBATTLE_UPDATE_LOCAL_DIR=/path/to/gha-stable-update-vX.Y.Z-<run_id> \
./tools/publish_desktop_update_manifest.sh X.Y.Z
```

如果只想更新下载页入口，不想重传 `objects/`，需要非常谨慎：只能在 `manifests/current.json` 和所需 objects 已经存在于服务器时做。常规发布不要手动只覆盖入口文件。


## Release Notes

更新说明用换行分隔：

```bash
export CHANGEBATTLE_RELEASE_NOTES=$'修复正式模式商店价格\n压缩更新弹窗 UI\n调整训练场自习收益'
```

强制完整包：

```bash
node tools/generate_desktop_update_manifest.mjs X.Y.Z --requires-full-package --requires-full-package-reason "本版本包含启动器或运行时更新"
```

## Verification

本地快速检查：

```bash
bash -n tools/build_release_on_windows.sh
bash -n tools/publish_desktop_update_manifest.sh
node --check tools/generate_desktop_update_manifest.mjs
node --check tools/generate_desktop_file_manifest.mjs
python3 -m py_compile tools/package_desktop_release.py
pnpm --filter @changebattle-v2/web typecheck
pnpm --filter @changebattle-v2/desktop typecheck
pnpm --filter @changebattle-v2/desktop build
pnpm --filter @changebattle-v2/desktop test:ipc-bundle
```

线上抽查：

```bash
curl -sS http://119.45.240.157/changebattle/latest.json
curl -I http://119.45.240.157/changebattle/manifests/current.json
curl -I http://119.45.240.157/changebattle/manifests/vX.Y.Z.json
```

## More Docs

详细 Windows release 教程：

```text
release/docs/windows-desktop-release.md
```

分支和发布流：

```text
docs/gitAbout.md
```
