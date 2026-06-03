# Core

`core` 现在只保留本项目调用 Pokemon Showdown 所需的内部 API。

职责：

- 读取和校验 `SHOWDOWN_PATH`。
- 启动 `showdown-adapter/adapter.js`。
- 用 JSONL stdin/stdout 调用 Showdown。
- 暴露 Python 侧的轻量客户端给 CLI 和未来 UI 使用。

不再由本项目维护的内容：

- 宝可梦、招式、特性、道具、学习表等权威战斗数据。
- 伤害计算、命中、会心、异常、能力变化。
- 特性、道具、天气、场地、复杂招式效果。

这些全部交给 Pokemon Showdown。

当前公共入口：

- `core.showdown_config.validate_showdown_path(...)`
- `core.showdown_client.ShowdownClient`

验证：

```bash
python3 -m core.showdown_config
python3 -m core.showdown_client
```
