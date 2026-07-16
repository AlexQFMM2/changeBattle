# @changebattle-v2/assets-core

ChangeBattle V2 的资源 URL 核心包。

第一版只做厂商无关的运行时解析。业务代码优先引用资源 key 或受控相对 path，不直接写腾讯 COS、七牛或本地 assets URL：

```ts
import { assetsTool } from '@changebattle-v2/assets-core'

const logoUrl = assetsTool('app.logo')
```

当前默认腾讯 CDN base URL：

```text
https://assets.65h26i.top/beta
```

例如：

```ts
assetsTool('test.env-example')
```

会解析为：

```text
https://assets.65h26i.top/beta/test/env-example.txt
```

腾讯 COS 上传、SecretId、SecretKey 和发布脚本不进入这个包；上传由通用工具 `/home/alexqfmm/workPlace/tools/tencent-cos` 负责。

## Current Closed Loop

当前闭环已经跑通：

```text
本地公共资源源目录或单个文件
  -> /home/alexqfmm/workPlace/tools/tencent-cos 上传到 COS
  -> https://assets.65h26i.top/beta/... CDN 访问
  -> 写入 assets.csv 或生成全量 registry
  -> 业务代码 assetUrl(path) / assetsTool(assetKey) 加载
```

COS 权限配置：

```text
Bucket: changebattle-1332594319
Region: ap-nanjing
CDN domain: https://assets.65h26i.top
Current public resource root: beta/*
Root path: not public
Write access: private, via local Tencent COS tool credentials only
```

当前约定：**所有 ChangeBattle 公共资源统一上传到 `beta/` 前缀**。这里的 `beta` 先作为公共资源根目录使用，不按 debug/beta/stable 复制三份资源。COS Policy 里如果保留了 `debug/*`、`stable/*` 只读授权，也暂时不作为默认上传目标。

当前 ChangeBattle 主仓库已经不再保留根 `assets/` 和 `apps/web/public` 的大体积运行时资源。`src/generated/assetRegistry.ts` 是已经上传到 CDN 的资源清单快照；没有恢复完整资源源目录时，不要随手重新生成它。

## Files

- `assets.csv`：人工维护的资源 key -> path 清单。
- `src/generated/assetRegistry.ts`：由生成脚本维护的 registry，当前包含已上传 CDN 的公共资源快照。
- `scripts/generate-asset-registry.mjs`：从人工 CSV 和资源扫描结果生成 `assetRegistry.ts`。
- `src/config.ts`：默认 provider 和 provider base URL 配置。
- `src/assetsTool.ts`：对外 URL 解析入口。
- `src/assetPaths.ts`：路径清洗和 URL 拼接。

## Upload Tool

通用上传工具位置：

```bash
cd /home/alexqfmm/workPlace/tools/tencent-cos
```

工具自己的配置文件：

```text
/home/alexqfmm/workPlace/tools/tencent-cos/.env
```

示例配置：

```env
TENCENT_SECRET_ID=your-secret-id
TENCENT_SECRET_KEY=your-secret-key
TENCENT_COS_BUCKET=changebattle-1332594319
TENCENT_COS_REGION=ap-nanjing
TENCENT_ASSET_CDN_BASE_URL=https://assets.65h26i.top
TENCENT_COS_CHANNEL=beta
```

`.env` 只放在本地工具目录，不提交到 ChangeBattle，也不要截图外发。

## Upload One File

只上传文件：

```bash
cd /home/alexqfmm/workPlace/tools/tencent-cos

pnpm upload -- \
  --file /path/to/logo.png \
  --remote ui/logo.png \
  --channel beta
```

上传目标：

```text
cos://changebattle-1332594319/beta/ui/logo.png
https://assets.65h26i.top/beta/ui/logo.png
```

上传并同步到 ChangeBattle `assets.csv`：

```bash
cd /home/alexqfmm/workPlace/tools/tencent-cos

pnpm upload -- \
  --file /path/to/logo.png \
  --remote ui/logo.png \
  --channel beta \
  --asset-key app.logo \
  --description "Application logo" \
  --assets-csv /home/alexqfmm/workPlace/pokemon/changeBattleV2/packages/assets-core/assets.csv
```

同名 `asset-key` 会覆盖 CSV 里的旧 path；新 key 会追加。

## Upload Directory

上传目录：

```bash
cd /home/alexqfmm/workPlace/tools/tencent-cos

pnpm upload -- \
  --dir /path/to/assets \
  --remote-root \
  --channel beta
```

例如本地文件：

```text
/path/to/assets/showdown/sprites/pokemonicons-sheet.png
```

会上传到：

```text
beta/showdown/sprites/pokemonicons-sheet.png
```

目录上传适合批量资源先上云；业务代码里的动态 path 可通过 `assetUrl(path)` 直接拼 CDN。需要稳定语义别名时，再给资源补 `assets.csv` key。

## Generate Registry

上传工具更新 `assets.csv` 或恢复完整资源源目录后，需要重新生成 registry：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2

pnpm --filter @changebattle-v2/assets-core generate
```

生成结果：

```text
packages/assets-core/src/generated/assetRegistry.ts
```

然后业务代码可使用：

```ts
import { assetsTool } from '@changebattle-v2/assets-core'

const url = assetsTool('app.logo')
```

注意：当前根 `assets/` 已从主仓库移除。如果只是本地没有完整资源源目录，不要直接运行 generate 覆盖现有全量 registry；否则 registry 会退化成只包含 CSV 的小清单。

## Useful Upload Flags

- `--dry-run`：只打印上传计划，不上传。
- `--skip-existing`：远端对象存在时跳过。
- `--channel beta`：选择 COS/CDN 前缀。ChangeBattle 当前统一使用 `beta`，不要为同一资源重复上传 debug/stable 三份。
- `--bucket`、`--region`、`--cdn-base-url`：临时覆盖 `.env` 配置。

示例：

```bash
pnpm upload -- \
  --file /path/to/logo.png \
  --remote ui/logo.png \
  --channel beta \
  --skip-existing \
  --dry-run
```

## Verify

上传后先直接访问 CDN URL：

```bash
curl -I https://assets.65h26i.top/beta/ui/logo.png
```

`assets-core` 本地验证：

```bash
cd /home/alexqfmm/workPlace/pokemon/changeBattleV2

pnpm --filter @changebattle-v2/assets-core test
pnpm --filter @changebattle-v2/assets-core typecheck
```

## Rules

- 业务层优先使用 `assetsTool(assetKey)`。
- 动态资源路径使用 Web 层 `assetUrl(path)`，仍由本包的清洗和 CDN base URL 规则兜底。
- 默认 provider 为 `tx`。
- 默认拒绝完整 URL、空路径、`..` 等危险输入。
- 迁移期如必须传裸 path，需要显式开启 `allowRawPath`。
- 上传工具只读本地 `.env`，不要把腾讯云密钥写进仓库。
- `beta/*` 是当前公共资源前缀；不要把私密文件上传进去。
