# ChangeBattle Assets CDN Core Plan

## Summary

把 ChangeBattle 的图片、音频和大体积静态资源从应用 release 包中拆出来，逐步迁移到 CDN 直连。第一版先搭建厂商无关的 `packages/assets-core`：业务代码只通过资源常量名取 URL，不直接写腾讯 COS、七牛或本地路径。后续腾讯 COS 只作为发布端 provider，不进入前端运行时代码。

目标状态：

```text
业务代码 -> assetsTool(assetKey) -> provider config -> CDN URL
```

资源发布：

```text
assets.csv / registry -> 上传腾讯 COS -> CDN 分发 -> 三端共用
```

## Design Principles

- 业务层只引用资源 key，例如 `assetsTool("app.logo")`。
- `assets-core` 只处理资源协议、路径清洗、provider URL 拼接和 registry 类型。
- 腾讯 COS SDK、密钥、上传逻辑不进入 `assets-core` 运行时包。
- 第一阶段三端都 CDN 直连，桌面/移动本地缓存作为后续增强。
- 支持 provider 切换：`tx`、`qiniu`、`local`，默认先按腾讯 COS/CDN 方向设计。
- 当前资源统一上传到 `beta/` 前缀，先不按 debug/beta/stable 复制三份；后续如果需要环境差异，优先通过 registry/manifest 指向不同对象。

## Current Slice

- [x] 新增 `packages/assets-core` 骨架。
- [x] 新增 `assets.csv` 作为人工维护入口。
- [x] 新增生成态 `assetRegistry` 示例，后续由脚本生成。
- [x] 新增 `assetsTool()`，按 key 解析资源 URL。
- [x] 新增路径清洗，禁止完整 URL、`..`、空路径等危险输入。
- [x] 新增 provider config，默认 provider 为 `tx`。
- [x] 新增基础单元测试。

## Next Slices

- [ ] 扫描现有前端、桌面端和 core 中的本地 assets 引用。
- [ ] 增加 CSV -> generated registry 脚本。
- [ ] 增加腾讯 COS 上传脚本，使用环境变量读取密钥。
- [ ] 增加 CDN base URL 环境配置；默认仍指向统一公共资源根 `https://assets.65h26i.top/beta`。
- [ ] 把第一批稳定图片迁移到 `assetsTool(assetKey)`。
- [ ] 调整桌面 release 构建，排除已经 CDN 化的大体积 assets。
- [ ] 增加 asset manifest/hash object 方案，解决 CDN 缓存和同路径更新问题。
- [ ] 桌面端增加本地缓存：CDN 先展示，后台下载，下一次走本地。
- [ ] 移动端接入 Capacitor Filesystem cache。

## Tencent COS Direction

腾讯 COS 作为第一版候选 provider：

```text
COS bucket / CDN domain
  beta/
    ui/logo.png
    pokemon/sprites/...
```

运行时只看到：

```text
https://assets.65h26i.top/beta/ui/logo.png
```

上传端后续使用腾讯 COS Node.js SDK：

```text
scan assets -> upload missing objects -> update registry/manifest
```

密钥只存在本地发布环境或 CI secret，不进入客户端。

## Test Plan

- `pnpm --filter @changebattle-v2/assets-core test`
- `pnpm --filter @changebattle-v2/assets-core typecheck`
- `git diff --check`

后续接入业务引用后，再跑：

- `pnpm --filter @changebattle-v2/api typecheck`
- `pnpm --filter @changebattle-v2/web typecheck`
- `pnpm --filter @changebattle-v2/desktop typecheck`

## Notes

- 第一版 registry 可以手工维护少量 key，等引用规模扩大后再强制用 CSV 生成。
- `assetsTool()` 默认严格要求 key 存在，迁移期如需兼容裸 path，可显式传 `allowRawPath: true`。
- 不用版本号判断资源是否变化；长期方向仍是 `path + sha256` 或 hash object。
