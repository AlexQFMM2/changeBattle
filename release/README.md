# ChangeBattle V2 Release Workspace

`release/` 是桌面端发版工作台，存放本地生成的 Windows portable 包、`latest.json`、游戏官网页面、文件级增量清单和增量文件目录。

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
  manifests/vX.Y.Z/files.json
  files/vX.Y.Z/...
```

`latest.json` 给桌面端启动自检和右下角手动检查使用。`index.html` 是玩家访问的游戏官网。`manifests/` 和 `files/` 是自动增量更新的直链资源。

发布脚本会上传 `latest.json`、`index.html`、`image/`、`manifests/` 和 `files/`，但不会上传约 600 MiB 的 zip。完整包需要手动上传到百度网盘、GitHub Release 或其它镜像，再把链接写进 `CHANGEBATTLE_RELEASE_MIRRORS`。

下载链接继承规则：

- 发布脚本生成新 `latest.json/index.html` 前，会先读取当前通道线上旧版 `latest.json`。
- 如果本次没有显式设置 `CHANGEBATTLE_RELEASE_MIRRORS`、`CHANGEBATTLE_FULL_PACKAGE_URL` 或 `--mirror/--full-package-url`，则继承旧版 `mirrors` 和 `fullPackage`。
- 如果本次显式设置了新镜像，则以新镜像为准，并用本次 zip 计算新的 `sha256/size`。
- 常规增量修复可以不重新上传 600 MiB 完整包，下载页继续展示上一版可用完整包链接。
- 如果本次必须玩家下载完整包，例如 runtime、launcher、updater、目录结构变化，必须上传新完整包并显式设置镜像链接，不能依赖继承旧链接。

## Incremental Update

桌面端更新流程：

1. 启动后后台读取当前通道的 `latest.json`。
2. 若版本无变化，静默结束。
3. 若 `requiresFullPackage=true`，提示去游戏官网下载完整包。
4. 若可增量，读取本地 `update-manifest.json` 和远端 `files.json`。
5. 计算 sha256 不一致的文件，下载到 `.update-staging/`。
6. 校验 sha256。
7. 替换前备份旧文件到 `.update-backup/`。
8. 替换成功后写入新的 `update-manifest.json`。
9. 提示玩家重启后生效。

第一版允许增量管理：

```text
apps/
assets/
vendor/
package.json
update-manifest.json
```

第一版禁止增量管理：

```text
runtime/electron/
ChangeBattle-V2-Desk.exe
ChangeBattle-V2-Desk.cmd
ChangeBattle-V2-Debug.cmd
ChangeBattle-V2-Updater.exe
ChangeBattle-V2-Updater.cmd
```

Electron runtime、launcher、updater 或目录结构变化，一律发布完整包，并在生成清单时标记 `requiresFullPackage`。

## Version Source Policy

版本号是 release 安全边界，不能写散。

权威版本源：

```text
package.json                         构建和发布脚本校验版本
release/changebattle/latest.json      远端通道版本
release/changebattle/manifests/vX.Y.Z/files.json  文件级增量版本
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
rg -n '"version": "0.1.4"' release/changebattle/latest.json release/changebattle/manifests/v0.1.4/files.json
rg -n "release 0.1.4" release/changebattle/files/v0.1.4/apps/desktop/out/renderer/assets/*.js
rg -n "update-manifest\\.json" release/changebattle/files/v0.1.4/apps/desktop/out/main/main.js
```

## Release Flow

推荐正式流程：

1. 在 `v2` 开发并自测。
2. 需要测试玩家验证时，发 beta 通道。
3. 验证通过后合入 `release`。
4. 在 `release` 分支发 stable 通道。
5. 上传完整 zip 到网盘/GitHub。
6. 重新生成并发布含下载镜像的 `latest.json/index.html`。

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
CHANGEBATTLE_RELEASE_CHANNEL=stable ./tools/build_release_on_windows.sh X.Y.Z
CHANGEBATTLE_RELEASE_CHANNEL=stable ./tools/publish_desktop_update_manifest.sh X.Y.Z

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

通常在 `v2` 分支执行：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
CHANGEBATTLE_RELEASE_CHANNEL=beta ./tools/build_release_on_windows.sh 0.1.4
```

发布 beta 更新清单和增量文件：

```bash
CHANGEBATTLE_RELEASE_CHANNEL=beta ./tools/publish_desktop_update_manifest.sh 0.1.4
```

生成的 beta 包会追：

```text
http://119.45.240.157/changebattle-beta/latest.json
```

### Stable Release

通常在 `release` 分支执行：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2
git switch release
CHANGEBATTLE_RELEASE_CHANNEL=stable ./tools/build_release_on_windows.sh 0.1.4
```

发布 stable 更新清单和增量文件：

```bash
CHANGEBATTLE_RELEASE_CHANNEL=stable ./tools/publish_desktop_update_manifest.sh 0.1.4
```

生成的 stable 包会追：

```text
http://119.45.240.157/changebattle/latest.json
```

## Build Output

构建完成后，Linux 本地会得到：

```text
release/ChangeBattle-V2-Desk-portable-vX.Y.Z.zip
release/changebattle/latest.json
release/changebattle/index.html
release/changebattle/manifests/vX.Y.Z/files.json
release/changebattle/files/vX.Y.Z/
```

Windows 构建机对应目录：

```text
D:\changeBattleV2\changeBattleV2
D:\changeBattleV2\release
D:\changeBattleV2\electron-runtime
```

构建机地址：

```text
win10@172.16.10.41
```

## Download Mirrors

拿到网盘或 GitHub 链接后，用 `名称=链接` 写入 `CHANGEBATTLE_RELEASE_MIRRORS`。多个镜像用换行分隔。

示例：

```bash
export CHANGEBATTLE_RELEASE_MIRRORS=$'百度网盘=https://pan.baidu.com/s/xxx?pwd=xxxx\nGitHub Release=https://github.com/AlexQFMM2/changeBattle/releases/download/deskV20.1.4/ChangeBattle-V2-Desk-portable-v0.1.4.zip'
```

只重新生成本地 `latest.json/index.html`：

```bash
CHANGEBATTLE_RELEASE_CHANNEL=stable node tools/generate_desktop_update_manifest.mjs 0.1.4
```

只发布入口文件和现有增量目录：

```bash
CHANGEBATTLE_RELEASE_CHANNEL=stable ./tools/publish_desktop_update_manifest.sh 0.1.4
```

如果只是代码/资源增量修复，没有重新上传完整包，可以不设置 `CHANGEBATTLE_RELEASE_MIRRORS`。发布脚本会继承当前线上 `latest.json` 中已有的下载镜像，避免下载页被清空。

如果已经上传了新的完整包，必须显式设置新链接：

```bash
export CHANGEBATTLE_RELEASE_MIRRORS=$'百度网盘=https://pan.baidu.com/s/xxx?pwd=xxxx'
CHANGEBATTLE_RELEASE_CHANNEL=stable ./tools/publish_desktop_update_manifest.sh 0.1.4
```

如果只想更新下载链接，不想重传 `files/`，可以手动生成 `latest.json/index.html` 后只覆盖服务器两个入口文件：

```bash
scp release/changebattle/latest.json release/changebattle/index.html ubuntu@119.45.240.157:/tmp/changebattle-update-manifest/
ssh ubuntu@119.45.240.157 "sudo install -m 0644 /tmp/changebattle-update-manifest/latest.json /home/ubuntu/webApp/changebattle/latest.json && sudo install -m 0644 /tmp/changebattle-update-manifest/index.html /home/ubuntu/webApp/changebattle/index.html"
```

## Release Notes

更新说明用换行分隔：

```bash
export CHANGEBATTLE_RELEASE_NOTES=$'修复正式模式商店价格\n压缩更新弹窗 UI\n调整训练场自习收益'
```

强制完整包：

```bash
node tools/generate_desktop_update_manifest.mjs 0.1.4 --requires-full-package --requires-full-package-reason "本版本包含启动器或运行时更新"
```

## Verification

本地快速检查：

```bash
bash -n tools/build_release_on_windows.sh
bash -n tools/publish_desktop_update_manifest.sh
node --check tools/generate_desktop_update_manifest.mjs
python3 -m py_compile tools/package_desktop_release.py
pnpm --filter @changebattle-v2/web typecheck
pnpm --filter @changebattle-v2/desktop typecheck
pnpm --filter @changebattle-v2/desktop build
pnpm --filter @changebattle-v2/desktop test:ipc-bundle
```

线上抽查：

```bash
curl -sS http://119.45.240.157/changebattle/latest.json
curl -I http://119.45.240.157/changebattle/manifests/vX.Y.Z/files.json
curl -I http://119.45.240.157/changebattle/files/vX.Y.Z/apps/desktop/out/renderer/index.html
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
