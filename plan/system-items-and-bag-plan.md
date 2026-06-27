# System Items And Bag Plan

## Summary

本计划用于把特殊系统资格从 Battle V4 前端硬编码中抽出来，沉到玩家背包与道具实例系统中。

核心目标：

```txt
玩家拥有什么 -> player.bag
道具是什么 -> itemID 对应静态 registry / 图鉴
这个具体道具还能不能用 -> item instance
战斗里能不能点 Mega/Z/极巨/太晶 -> Showdown request can* 字段
```

Battle V4 指令 UI 后续不再按我们自己的 `gen7/gen8/gen9` 逻辑硬过滤特殊系统按钮；它只相信 Showdown request。我们的规则系统只负责战斗前生成系统道具、映射真实携带物、注入 Showdown set。

## Principles

- 所有道具都是实例，不堆叠。两个相同道具也有不同 `id / getRound / useCount`。
- 静态道具定义和玩家道具实例分离。`itemID` 是查图鉴、图标、默认效果与行为的稳定 key。
- 系统道具控制特殊系统资格；Showdown request 控制战斗中是否可用。
- Mega / Z 需要真实携带物，因此由通用系统道具映射成真实 Mega 石 / Z 纯晶。
- 极巨化手环 / 通用太晶珠是 player 级资格，不占宝可梦携带道具。
- 合作模式不在 UI 层写死特殊系统限制；P1/P2 各自 request 和各自 bag 独立决定。

## Data Model

### Player Bag

```ts
type PlayerBagV4 = {
  maxSize: number;
  items: PlayerItemInstanceV4[];
};
```

每个 player 实例拥有一个 bag。`maxSize` 控制背包容量，`items` 是道具实例集合。

### Item Instance

```ts
type PlayerItemInstanceV4 = {
  id: string;
  itemID: string;

  name: string;
  image: string;

  cost: number;
  canSale: boolean;

  type: PlayerItemTypeV4;

  canBattleUse: boolean;
  canUse: boolean;
  canUseToPokemon: boolean;
  canTake: boolean;

  effectRound: number | null;
  getRound: number;

  maxUseCount: number | null;
  useCount: number;
};
```

字段说明：

- `id`：实例 id，同种道具也不同。
- `itemID`：静态道具定义 id，可通过它获取道具图鉴、效果和默认行为。
- `name / image`：实例显示信息，可从静态定义初始化，也允许后续有实例化名称。
- `cost`：获取成本，便于后续卖出价格或经济系统计算。
- `canSale`：是否可售卖。
- `type`：道具分类。
- `canBattleUse`：是否能在战斗背包中使用。
- `canUse`：是否能直接使用，例如打折券、钥匙、系统道具配置入口。
- `canUseToPokemon`：是否能对宝可梦使用，例如回复药、树果、训练道具。
- `canTake`：是否能被宝可梦直接携带。
- `effectRound / getRound`：按回合报废或过期。
- `maxUseCount / useCount`：按使用次数报废。战斗携带类道具进入战斗携带可计 1 次。

建议把用户草案中的 `getIcon` 改名为 `cost`，因为注释语义是“获取花了多少钱”。

### Item Type

```ts
type PlayerItemTypeV4 =
  | "system"
  | "held"
  | "medicine"
  | "berry"
  | "training"
  | "battle"
  | "coupon"
  | "key"
  | "misc";
```

### Static Item Definition

```ts
type ItemDefinitionV4 = {
  itemID: string;
  name: string;
  nameZh: string;
  description: string;
  image: string;
  type: PlayerItemTypeV4;

  defaultCost: number;
  defaultCanSale: boolean;

  defaultCanBattleUse: boolean;
  defaultCanUse: boolean;
  defaultCanUseToPokemon: boolean;
  defaultCanTake: boolean;

  defaultEffectRound: number | null;
  defaultMaxUseCount: number | null;

  systemKind?: SpecialSystemKindV4;
};
```

```ts
type SpecialSystemKindV4 =
  | "mega"
  | "zmove"
  | "dynamax"
  | "terastallize";
```

## Default System Items

新增 web/dex 可见系统道具：

```ts
const DEFAULT_SYSTEM_ITEMS = [
  {
    itemID: "system-mega-stone",
    nameZh: "通用Mega石",
    type: "system",
    systemKind: "mega",
    defaultCanTake: false,
    defaultCanUse: true,
  },
  {
    itemID: "system-z-crystal",
    nameZh: "通用Z纯晶",
    type: "system",
    systemKind: "zmove",
    defaultCanTake: false,
    defaultCanUse: true,
  },
  {
    itemID: "system-dynamax-band",
    nameZh: "极巨化手环",
    type: "system",
    systemKind: "dynamax",
    defaultCanTake: false,
    defaultCanUse: false,
  },
  {
    itemID: "system-tera-orb",
    nameZh: "通用太晶珠",
    type: "system",
    systemKind: "terastallize",
    defaultCanTake: false,
    defaultCanUse: true,
  },
];
```

说明：

- `通用Mega石` 不直接给宝可梦携带；准备阶段映射成真实 Mega 石，例如 `charizarditey`。
- `通用Z纯晶` 不直接给宝可梦携带；准备阶段映射成真实 Z 纯晶，例如 `pikaniumz` 或 `electriumz`。
- `极巨化手环` 不占携带道具；只表示 player 有极巨化资格。
- `通用太晶珠` 不占携带道具；它的属性作为太晶属性来源。

## Dex Integration

图鉴新增 web 侧虚拟分类：`系统道具`。

第一版不修改 dex-core 公共 `DexCategory`，避免影响训练选择器等已有调用。和之前 `环境` 分类一样，先在 `QuickDexModal` 内接本地 registry。

系统道具详情展示：

- 名称 / 英文名
- 图标 / 图片
- 类型：系统道具
- 是否可售卖
- 是否可战斗中使用
- 是否可直接使用
- 是否可对宝可梦使用
- 是否可携带
- 系统效果说明
- 当前版本占位说明

## Special System Loadout

准备阶段新增 player 级特殊系统配置：

```ts
type PlayerSpecialSystemLoadoutV4 = {
  mega?: {
    itemInstanceId: string;
    pokemonLocalId: string;
    mappedItemId: string;
  };
  zmove?: {
    itemInstanceId: string;
    pokemonLocalId: string;
    mappedItemId: string;
  };
  dynamax?: {
    itemInstanceId: string;
  };
  terastallize?: {
    itemInstanceId: string;
    teraType: string;
  };
};
```

唯一性由系统道具实例保证：

- 一个 player 同一场只分配一个 Mega 系统资格。
- 一个 player 同一场只分配一个 Z 系统资格。
- 一个 player 同一场只分配一个极巨化手环资格。
- 一个 player 同一场只分配一个太晶珠资格。

## Showdown Team Compilation

进入战斗前，编译 Showdown team 时：

1. 读取 player bag。
2. 读取 `PlayerSpecialSystemLoadoutV4`。
3. Mega：
   - 找到 `system-mega-stone` 实例。
   - 找到目标宝可梦。
   - 将目标宝可梦 Showdown item 写成真实 `mappedItemId`。
   - 系统道具实例 `useCount += 1`。
4. Z：
   - 找到 `system-z-crystal` 实例。
   - 将目标宝可梦 Showdown item 写成真实 `mappedItemId`。
   - 系统道具实例 `useCount += 1`。
5. 极巨化：
   - 不写宝可梦 item。
   - 是否出现 `canDynamax/maxMoves` 由 Showdown format 和 request 决定。
6. 太晶化：
   - 不写宝可梦 item。
   - 根据通用太晶珠的属性写入 Showdown set 的 `teraType`。
   - 是否出现 `canTerastallize` 由 Showdown format 和 request 决定。

## Battle V4 UI Policy

Battle V4 特殊按钮只根据 Showdown request 渲染：

- Mega：`canMegaEvo / canMegaEvoX / canMegaEvoY`
- Z：`canZMove / zMoves`
- 极巨化：`canDynamax / maxMoves`
- 太晶化：`canTerastallize`

不再用我们自己的 gen 判断来隐藏按钮。`battleSpecialSystemAllowedForRuleSetV4()` 只保留给准备页推荐、默认系统道具生成、规则说明或非 Showdown 前置校验。

灰色按钮仍可点击，并显示原因：

- `Showdown request 未返回 Mega 入口`
- `Showdown request 未返回 Z 招式入口`
- `Showdown request 未返回极巨化入口`
- `Showdown request 未返回太晶化入口`

## Coop Policy

合作模式遵循 Showdown client 的 choice builder 思路：

- 同一个 player 的同一个 request 内，`alreadyMega / alreadyZ / alreadyMax / alreadyTera` 互斥。
- 不在 UI 层跨 player 禁用 P1/P2 的特殊系统。
- P1/P2 是否都能使用 Mega/Z/极巨/太晶，由各自 bag、各自 loadout、各自 Showdown request 决定。
- 如果 Showdown 服务端拒绝或不给入口，UI 显示灰色和 request 原因。

## Expiration And Use Count

道具过期判断：

```ts
function itemInstanceExpired(item: PlayerItemInstanceV4, currentRound: number): boolean {
  if (item.effectRound !== null && currentRound >= item.getRound + item.effectRound) return true;
  if (item.maxUseCount !== null && item.useCount >= item.maxUseCount) return true;
  return false;
}
```

使用次数原则：

- Mega/Z 系统道具映射进战斗时计 1 次。
- 普通携带战斗道具如果后续设计为计划报废，进入战斗携带可计 1 次。
- 极巨化手环 / 太晶珠第一版可设为永久道具：`maxUseCount = null`。

## Diagnostics

Battle diagnostics 增加：

- player bag snapshot
- system item instances
- special system loadout
- mapped Showdown item
- generated Showdown set item
- request `can*` fields
- selected special suffix

这样能追踪“玩家拥有资格 -> 编译成 Showdown 输入 -> Showdown request 返回入口 -> UI 可点击 -> 提交 choice”的完整链路。

## Non-Goals

- 第一版不实现完整商店经济系统。
- 第一版不实现战斗背包使用药品。
- 第一版不实现全部道具效果。
- 第一版不修改 Showdown 规则合法性；Showdown request 仍是战斗可用性的事实源。
