# 真实战斗灵魂伴侣回合进化计划

## Summary

作为灵魂伴侣系统最后收尾，本计划实现“战斗中临门一脚进化”：灵魂伴侣亲密度达到进化门槛后，只要在正式战斗的下一次行动请求前仍处于场上，就按 core 中配置的概率判定是否进化。判定成功后，Showdown 场上宝可梦使用永久 `formeChange` 直接切换为进化后形态，本局 run-local 副本和来源仓库宝可梦同步 `speciesId`。前端不本地插队动画，只消费后端 `rawLog -> playbackTimeline` 中按顺序出现的 `detailschange` 与 `-message`。

本轮除多目标进化外，尽量支持所有可明确归一到单一目标的进化方式；多目标进化继续留在仓库页道具进化/玩家选择流程中处理。

## Why It Is Feasible

### Showdown 实测依据

本地使用 `packages/showdown-battle-core/vendor/showdown/sim` 实测：

- 对场上妙蛙种子调用：

  ```js
  const evolutionEffect = battle.dex.conditions.get("evolution");
  pokemon.formeChange("Venusaur", evolutionEffect, true);
  ```

  会把 Showdown active Pokemon 从 `Bulbasaur` 永久切换为 `Venusaur`。

- Showdown 会发出客户端可见协议：

  ```txt
  |detailschange|p1a: Seed|Venusaur, L50, M
  ```

- 下一回合 request 中已经使用新形态：

  ```txt
  "details":"Venusaur, L50, M"
  "stats":{"atk":102,"def":103,"spa":120,"spd":120,"spe":100}
  ```

- 伤害也按新形态计算。测试中同样的 `Tackle` 打幸福蛋，未进化第二回合伤害为 `35`，进化成妙蛙花后第二回合伤害为 `51`。

- 双打中，场上宝可梦进化后再阵亡，Showdown 仍能正常生成 `forceSwitch` request。只要前端继续按 Showdown request 的 pokemon index 提交替换，不会因为进化本身卡住。

### 正确调用方式

不能使用空 source：

```js
pokemon.formeChange("Venusaur", null, true);
```

实测这样会让 Showdown 标记 `formeRegression = true`，阵亡或清状态后可能回退为原形态。

必须使用非空 evolution effect：

```js
const evolutionEffect = battle.dex.conditions.get("evolution");
pokemon.formeChange(toSpeciesId, evolutionEffect, true);
```

这样：

- `species/baseSpecies/details` 持久保持进化后形态。
- `storedStats/speed/types/maxhp` 会由 Showdown 重新计算。
- 阵亡后 request 仍保持进化后 details/stats。
- 客户端能收到 `detailschange` 协议。

### HP 处理

Showdown 的 `formeChange(..., true)` 会保留已损失 HP，而不是按比例折算。

例如 `20/120` 的妙蛙种子进化为 `155` HP 的妙蛙花后，会变成 `55/155`，因为原本损失了 `100` HP。

该行为符合“进化后体格变强，伤势不消失”的直觉，本计划沿用 Showdown 规则，不在 V2 额外改写 HP。

## Rules

### 触发对象

只针对正式战斗中的灵魂伴侣 run-local 副本：

- `formalSourceKind === "soulmate-vault"`
- `sourcePlayerPokemonId` 存在
- 当前 Showdown active Pokemon 仍在场且未阵亡
- 来源仓库中能找到对应 `PlayerPokemonRecordV4`

仓库里的长期宝可梦不直接参与战斗判定；战斗成功后再同步写回来源仓库记录。

### 触发时机

推荐把判定放在“上一回合 Showdown 已经结算完、下一次操作面板展示之前”的边界：

- 本回合开始时仍是当前形态，例如妙蛙种子。
- 玩家按当前形态选择动作，例如选择 `藤鞭` 打 A。
- Showdown 正常结算这一回合，妙蛙种子仍按妙蛙种子的 stats / speed / typing 行动和受伤。
- 回合结束后，Showdown 推进到下一回合并生成新的 move request，例如 `|turn|2` 后准备弹操作面板。
- API 在把“下一次操作面板”返回给前端之前，检查仍在场的灵魂伴侣是否触发进化。
- 若判定成功，后端对 Showdown active Pokemon 调用永久 `formeChange`。
- 因为此时 Showdown 已经生成过旧 request，后端必须重新生成/刷新 request，让操作面板里的 details / stats / moves 使用进化后形态。
- Showdown `rawLog` 中保留 `detailschange`，battle service 再追加 `|-message|{displayName}进化了！`。前端只按 `rawLog -> playbackTimeline -> scheduler` 顺序播放，不额外插入本地事件。

这样玩家的体感是：

1. 这回合开始时还是妙蛙种子，玩家正常选择藤鞭。
2. 这一回合照常打完，妙蛙种子可能受伤、残血、甚至刚打出关键伤害。
3. 本来要弹下一次操作面板时，后端判定进化成功。
4. 前端的 playback 调度器按 `detailschange` 先播放妙蛙种子进化为妙蛙花，再播放后端追加的进化提示。
5. 动画结束后，操作面板展示的已经是妙蛙花，下一回合开始按进化后形态结算。

这种时机更符合“受伤后临门一脚、绝境反击”的叙事，也不会让玩家刚选择的当前回合动作突然改用新形态结算。真正的 Showdown 替换与协议事件生成必须由后端完成；前端不能自己手改战斗事实，也不能绕过 playback scheduler 本地插队。

本地补测结果：

- `battle.choose(sideId, input)`：当最后一方选择完成时会立刻触发 `commitChoices()`，因此它不是可插入进化判定的安全点。
- `battle.makeChoices(...)`：内部也是写入选择后立即 `commitChoices()`，同样不能在调用之后再插进化。
- `battle.sides[i].choose(input)`：只写入对应 side 的 choice，不自动结算。两边 `side.choose` 完成后、手动 `commitChoices()` 之前插入 `pokemon.formeChange(toSpeciesId, evolutionEffect, true)`，实测可行。
- 在这个插点进化后，protocol 中 `detailschange` 出现在本回合 `move` 之前，本回合伤害也按进化后形态计算。
- 更推荐的“操作面板前插入”也已补测：上一回合 `makeChoices` 结算结束后，Showdown 已经有下一回合旧 request。此时调用 `pokemon.formeChange(toSpeciesId, evolutionEffect, true)` 会成功改变 active Pokemon，并追加 `detailschange`；但 `activeRequest` 仍保留旧形态，需要再调用 `battle.makeRequest()` 或等价刷新方法，新的 request 才会包含进化后 details / stats / max HP。

### 推荐 Showdown 调度节点

按 Showdown 的实际 API 行为，首版推荐流程如下：

1. 前端提交本回合选择。
2. 后端按现有流程调用 `battle.choose(...)` / `battle.makeChoices(...)`，让 Showdown 完整结算本回合。
3. `makeChoices` 返回后，Showdown 已经进入下一次请求状态，通常是 `battle.requestState === "move"`，并且 `side.activeRequest` 已经生成。
4. 后端检查此时仍在场、未阵亡、且对应 request 是 move request 的灵魂伴侣。
5. core 判定亲密度、唯一进化目标和 3% roll。
6. 命中后调用：

   ```js
   const evolutionEffect = battle.dex.conditions.get("evolution");
   pokemon.formeChange(toSpeciesId, evolutionEffect, true);
   ```

7. 立刻刷新 Showdown request：

   ```js
   battle.makeRequest();
   ```

   或使用 battle service 内部等价方法重建当前 request。目的不是推进回合，而是让 `activeRequest.side.pokemon[].details/stats/condition` 从旧形态刷新为进化后形态。

8. Battle service 调 `battle.sendUpdates()`，让返回给前端的 snapshot rawLog 已经包含 `detailschange`、进化提示和刷新后的 request。
9. 前端等待 `onAfterSubmitSnapshot` 返回后再进入 playback；动画和提示都从 timeline 中自然播放，结束后展示刷新后的操作面板。

这个流程的好处：

- 不需要改 Showdown 的选择提交语义。
- 不需要绕开 `battle.choose` / `battle.makeChoices` 去手动管理 `side.choose` 与 `commitChoices`。
- 当前回合的速度、伤害、属性仍按玩家选择时看到的形态结算，体感稳定。
- 进化后 request 会在下一次操作面板自然生效，前端不会拿旧形态面板。
- 双打中如果本回合结束后进入 `switch` / forced switch request，首版直接跳过判定，等完成换人并回到 move request 后再判定，风险最低。

不在以下时机判定：

- 伤害事件中。
- 阵亡事件中。
- 强制换人 request 尚未处理完成时。
- 当前回合动作结算过程中。
- 战斗结束后。

这样可以避免双打中同时阵亡、只剩少量候补、forced switch 队列与本地队伍同步互相干扰。

### 概率

概率放在 `packages/changebattle-v2-core`：

```ts
export const FORMAL_SOULMATE_BATTLE_EVOLUTION_CHANCE_V4 = 0.03;
```

或使用等价配置对象：

```ts
export type FormalSoulmateBattleEvolutionConfigV4 = {
  chance: number;
};

export const DEFAULT_FORMAL_SOULMATE_BATTLE_EVOLUTION_CONFIG_V4 = {
  chance: 0.03,
};
```

正式运行默认 `0.03`。测试通过参数覆盖为 `1`，不要为了测试临时改生产常量，避免忘记调回。

3% 的定位是“偶发的羁绊突破”，不是稳定替代仓库进化道具。玩家如果想确定进化，仍然应该优先使用仓库页进化道具；战斗进化只提供少量惊喜和叙事高潮。

### 判定频率

- 每只灵魂伴侣每个回合开始最多判定一次。
- 同一场战斗中，同一只宝可梦成功进化后不再判定。
- 若本回合判定失败，下个回合开始只要仍在场，可以再次判定。
- 若离场再上场，仍按“每回合开始”继续判定，而不是按“出场次数”判定。

3% 的累计体感：

| 在场回合数 | 至少触发一次概率 |
| --- | ---: |
| 1 | 3.0% |
| 2 | 5.9% |
| 3 | 8.7% |
| 4 | 11.5% |
| 5 | 14.1% |

这符合“亲密度已经接近，战斗中临门一脚”的叙事。

### 进化条件

沿用仓库进化已有的进化边归一规则和亲密度分段门槛：

- 单段进化链：`150`
- 两段进化链第一段：`100`
- 两段进化链第二段：`200`

候选目标来自当前 species 的下一段进化边，只允许进入单一合法目标。

### 支持范围

除多目标外，支持所有能明确归一为单一目标的进化方式：

- 普通等级进化。
- 亲密度进化。
- 学会招式后进化。
- 特殊条件进化，只要现有归一逻辑能映射到通用进化要求。
- 交换进化，只要归一逻辑能映射到通讯绳且目标唯一。
- 道具进化，只要当前 species + 条件只会得到一个唯一目标，且实现层能明确处理道具来源和消耗策略。

### 暂不支持

多目标进化不进入战斗自动进化：

- 伊布类多分支。
- 同一当前 species 在同一条件下存在多个候选目标。
- 任何需要玩家选择目标形态的进化。

原因：

- 战斗中自动随机分叉不透明。
- 玩家没有显式选择“想要哪种进化”。
- 多目标本来已经由仓库页 preview/modal 负责，保留给局外选择更清晰。

## 道具与消耗策略

战斗进化是灵魂伴侣的“羁绊突破”，不是玩家在战斗中主动使用背包道具。

本计划建议：

- 第一版不消耗仓库道具。
- 对于必须依赖具体道具且目标唯一的进化，可以只在规则允许时触发，但需要文案明确为“羁绊突破”，不是“自动使用道具”。
- 如果后续决定必须消耗道具，必须把消耗写入来源 `PlayerVaultV4`，并在战斗进化事件 summary 中记录 itemKey/itemId，保证幂等。

为了降低 MVP 风险，推荐首版只启用“无需玩家选择且无需明确道具消耗”的单目标进化边；通讯绳/石头类可在后续开关中逐步放开。

## Data / State Design

### Run marker

给 `FormalGameRunV4` 增加战斗进化记录，防止重放、刷新、重复 turn 事件导致重复进化：

```ts
export type FormalSoulmateBattleEvolutionRecordV4 = {
  battleNodeId: string;
  battleSessionId?: string;
  turn: number;
  sourcePlayerPokemonId: string;
  fromSpeciesId: string;
  toSpeciesId: string;
  displayName: string;
  createdAt: string;
};

export type FormalSoulmateBattleEvolutionSettlementByNodeIdV4 =
  Record<string, FormalSoulmateBattleEvolutionRecordV4[]>;
```

或按 `battleSessionId` 建索引。关键是：

- 同一 battle node/session 中，同一 `sourcePlayerPokemonId` 成功后只能记录一次。
- finalize / reload / playback 重放不会再次写仓库。

### Battle service state

Battle service 需要记录每场战斗已经判定过的回合，避免同一个 `|turn|` 被重复处理：

```ts
type FormalBattleEvolutionRuntimeState = {
  checkedKeys: Set<string>; // `${sessionId}:${turn}:${sourcePlayerPokemonId}`
  evolvedSourcePokemonIds: Set<string>;
};
```

该状态只用于运行时判定；最终事实仍以 run marker 和 playerVault 为准。

### 同步对象

进化成功后同步三层：

1. Showdown active Pokemon：

   ```js
   pokemon.formeChange(toSpeciesId, battle.dex.conditions.get("evolution"), true);
   ```

2. 当前正式 run-local 队伍：

   - `LocalPokemonV4.speciesId = toSpeciesId`
   - 不改 nickname / moves / nature / ivs / evs / level / held item
   - HP/状态/PP 以战斗同步链路为准

3. 来源仓库宝可梦：

   - `PlayerPokemonRecordV4.speciesId = toSpeciesId`
   - 保留 nickname / moves / nature / ivs / evs / level / friendship / heldItemId / honors 等字段

## API / Service Design

### Core helper

新增纯 helper：

```ts
evaluateFormalSoulmateBattleEvolutionV4(input): {
  ok: true;
  toSpeciesId: string;
  friendshipRequirement: number;
  roll: number;
} | {
  ok: false;
  reason: string;
};
```

职责：

- 判断是否灵魂伴侣。
- 判断亲密度是否达到门槛。
- 判断是否存在唯一进化目标。
- 判断概率 roll 是否成功。
- 不访问 Showdown battle 实例。
- 不写 run/vault。

随机必须稳定：

```ts
seed = `${run.seed}:${battleNodeId}:${turn}:${sourcePlayerPokemonId}:soulmate-battle-evolution`
```

测试传 `chance: 1`。

### API facade

新增应用层 facade：

```ts
tryApplyFormalSoulmateBattleEvolution({
  run,
  playerVault,
  battleSessionId,
  battleNodeId,
  turn,
  activePokemonRefs,
  chanceOverride,
})
```

职责：

- 从 run/vault/dex 拼出候选。
- 调 core helper 判定。
- 调 battle service 受控方法修改 Showdown active。
- 更新 run-local 队伍。
- 更新 playerVault。
- 写 run marker。
- 返回更新后的 run / playerVault / snapshot；snapshot 必须来自 battle service，包含已经入列的 Showdown 协议事件。

### Battle service 方法

新增受控方法：

```ts
applyBattlePokemonPermanentFormeChange(sessionId, {
  sideId,
  activeSlot,
  toSpeciesId,
  effectId: "evolution",
})
```

方法内部：

- 找到 `battle.sides[].active[activeSlot]`。
- 校验 active Pokemon 存在且未 faint。
- 调 `pokemon.formeChange(toSpeciesId, battle.dex.conditions.get("evolution"), true)`。
- 可追加 `|-message|{displayName}进化了！`。
- `battle.makeRequest()` 后 `battle.sendUpdates()`，让 protocol 中包含 `detailschange`、提示和新 request。
- 返回变更前后 details/stats/hp。

禁止 Web 直接手改 Showdown 内部字段。

## Frontend Design

战斗中进化使用 battle playback 里的短动画，不复用仓库进化大弹窗，也不新增绕过调度器的本地队列。

### 动画流程

1. 玩家提交动作后，Web 等待 API 返回最终 snapshot。
2. 若后端判定进化成功，该 snapshot 的 rawLog 已按顺序包含本回合结算、`detailschange`、`|-message|{displayName}进化了！` 和刷新后的 request。
3. `getPlaybackTimeline` 把 `detailschange` 编译成 transform。
4. 现有 scheduler 播放 transform：当前场上 sprite 发亮、白光覆盖、切换为进化后 sprite、白光散去。
5. `-message` 按 rawLog 顺序显示 `{displayName}进化了！`。
6. playback 阻塞结束后，操作面板展示刷新后的新形态 request。

### UI 要求

- 不展示左右对比。
- 不打开大弹窗。
- 动画期间沿用现有 playback blocking，不让操作面板早于协议事件出现。
- 单打、双打、合作共用同一个 battle overlay 组件。
- 双打中只覆盖对应 active slot，不影响同伴 slot。

## Edge Cases

- **双打 forced switch**：只在下一次 request 是 move request 时判定，避开 forced switch request 未处理状态。
- **同回合多个灵魂伴侣在场**：逐个判定；每只用自己的 stable seed。若多个成功，后端按 active slot 顺序写入 rawLog，前端按 timeline 顺序播放。
- **已经阵亡**：不判定。
- **替身/异常/能力变化**：Showdown `formeChange` 不会清空 boosts/volatiles；沿用 Showdown 行为。
- **太晶 / Mega / 极巨**：首版如果 active 已处于太晶、Mega、极巨等特殊形态，建议跳过战斗进化，避免 details/type/form 叠加边界不清。
- **幻觉 Illusion**：如果存在 illusion，Showdown 会按自身逻辑处理 details；首版可跳过有 `illusion` 的宝可梦。
- **多目标**：直接返回不可自动进化，留给仓库页选择。
- **仓库保存失败**：进化事件必须和 run/vault 保存同一层处理；若 vault 保存失败，不能只保存 run。

## Test Plan

### Core / API

- 亲密度不足时不判定进化。
- 无下一段进化时不判定。
- 多目标进化不自动触发。
- `chance: 0` 永不触发。
- `chance: 1` 必定触发。
- 同一只宝可梦同一场成功后不重复触发。
- 同一回合重复处理不重复触发。
- 成功后 run-local 和 playerVault 都更新 `speciesId`。
- 成功后 nickname / moves / ivs / evs / nature / level / held item / honors 保持不变。

### Showdown service

- 妙蛙种子在上一回合结算后、下一次 move request 前进化为妙蛙花，protocol 包含 `detailschange`。
- 下一回合 request details/stats 使用妙蛙花。
- 下一回合伤害按妙蛙花 stats 计算。
- 使用非空 `evolution` effect 后，阵亡不会回退为妙蛙种子。
- 双打中进化后阵亡，forced switch request 正常生成。

### Web

- 提交动作后的 playback 按 rawLog 顺序触发进化动画：发亮、白光、切 sprite、提示。
- 单打、双打、合作 active slot 显示位置正确。
- 动画期间沿用现有 playback blocking，操作面板不会早于 transform/message 出现。
- 多只同时成功时按 rawLog/timeline 顺序播放，不重叠。
- 刷新/重放不重复播放已持久化的进化，除非明确播放历史事件。

### Commands

- `pnpm --filter @changebattle-v2/core typecheck`
- `pnpm --filter @changebattle-v2/api typecheck`
- `pnpm --filter @changebattle-v2/web typecheck`
- `pnpm --filter @changebattle-v2/api test:formal-game`
- `pnpm typecheck`

## Assumptions

- “亲密度差不多了”沿用现有仓库进化分段门槛，不引入新的战斗专属门槛。
- 战斗进化是灵魂伴侣羁绊突破，不是玩家主动使用道具。
- 本计划不处理多目标进化；多目标继续由仓库页 preview + 选择弹窗完成。
- 本计划不改变 moves、ability 合法性、nickname、level、IV、EV、nature、held item。
- Showdown 是战斗中形态与数值的事实源；V2 run/vault 在进化成功后同步记录长期事实。
