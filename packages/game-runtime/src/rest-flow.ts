import type {CurrentRunData, LocalSave, NightSkyState, PlannedBattleData, PlayerPokemonState, PokemonEditOptions, PokemonSet, RainbowRocketSupportState, RentalPokemon, RestAction, RestEventOption, RestScoreBetTarget, RestState, ScoutState, ShopItem, ShopOffer, StatId, TrainerNpcView} from "@changebattle/shared";
import {SHOWDOWN_ID_POOL} from "@changebattle/shared";
import type {PlannedBattleService} from "./planned-battles.js";
import {
  ADJUST_STATS_COST,
  BADGE_LEVEL_CAPS,
  DEFAULT_BATTLES,
  RANDOMIZE_ALL_COST,
  RANDOMIZE_PART_COST,
  REROUTE_LIMIT,
  REST_HP_COSTS,
  REST_PP_COSTS,
  REST_STATUS_COSTS,
  SCOUT_ALL_COST,
  SCOUT_ONE_COST,
  SCORE_BET_MIN_STAKE,
  TRUST_OVERFLOW_COIN_PER_LEVEL,
  addCoins,
  addRunBp,
  applyRestShopDiscountCoupon,
  currentBp,
  currentCoins,
  exchangeCost,
  hasTalent,
  isTaskRewardItemId,
  itemKey,
  moveDrawCost,
  normalizeScoreBetState,
  RUN_QUEST_DEFINITIONS,
  scoreBetMaxStakeForCoins,
  scoreBetMultiplier,
  scoreBetMultiplierChoice,
  scoreBetPayout,
  scoreBetTarget,
  sellPriceForItem,
  spendBp,
  spendRunCoins,
  startRunQuest,
  talentLevel,
} from "./run-rules.js";

export const RAINBOW_ROCKET_TEAM_SIZE = 6;
export const RAINBOW_ROCKET_FACTORY_SUPPORT_COUNT = 6;
export const RAINBOW_ROCKET_SUPPORT_PICK_LIMIT = 3;
export const RAINBOW_ROCKET_FACTORY_SUPPORT_PROFILES = ["tier3", "tier3", "tier4", "tier4", "champion", "champion"] as const;
const STAT_IDS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
const RECENT_REST_EVENT_LIMIT = 5;

export type RainbowRocketSupportRuntimeOptions = {
  service: PlannedBattleService;
  uuid(): string;
  teamSize?: number;
  factorySupportCount?: number;
  supportPickLimit?: number;
};

export type ArrivalLevelCapRuntimeService = {
  describeTeam(team: PokemonSet[]): Promise<RentalPokemon[]>;
};

export type RestItemRuntimeService = ArrivalLevelCapRuntimeService & {
  hasConsumableItemEffect(itemId: string): Promise<boolean> | boolean;
  applyConsumableItemEffectToState(itemId: string, state: PlayerPokemonState, moveSlot?: number): Promise<string> | string;
  trainingItemEffect?(itemId: string): Promise<TrainingItemEffect | null> | TrainingItemEffect | null;
  editOptions?(set: PokemonSet): Promise<PokemonEditOptions> | PokemonEditOptions;
};

export type TrainingItemEffect = {
  stat_kind: "iv" | "ev" | "ability" | "nature";
  stat?: StatId;
  amount: number;
  scope: "one" | "all";
  nature?: string;
};

export type RuntimeRestStateOptions = {
  save: LocalSave;
  run: CurrentRunData;
  defaultBattles?: number;
  exchangeDisabled?: boolean;
  exchangeCost?: number | null;
  costs?: Partial<RestState["costs"]>;
  extra?: Partial<RestState>;
};

export function buildRestState(options: RuntimeRestStateOptions): RestState {
  const run = options.run;
  const defaultBattles = Math.max(1, Math.floor(Number(options.defaultBattles || DEFAULT_BATTLES)));
  const exchangeCount = Number(run.rest_status?.exchanges || 0);
  const exchangeDisabled = Boolean(options.exchangeDisabled || run.special_run === "rainbow_rocket" || exchangeCount >= 3);
  const baseCosts: RestState["costs"] = {
    exchange: exchangeDisabled ? null : options.exchangeCost ?? exchangeCost(run, exchangeCount),
    restore_hp: REST_HP_COSTS,
    restore_pp: REST_PP_COSTS,
    restore_status: REST_STATUS_COSTS,
    adjust_stats: ADJUST_STATS_COST,
    randomize_part: RANDOMIZE_PART_COST,
    randomize_all: RANDOMIZE_ALL_COST,
    move_draw: moveDrawCost(run),
    scout_basic: 0,
    scout_one: 0,
    scout_all: 0,
    ...(options.costs || {}),
  };
  const support = run.rest_status?.rainbow_rocket_support;
  const base: RestState = {
    battle_no: Number(run.battle_no ?? Math.max(0, Number(run.next_battle || 1) - 1)),
    battles: Number(run.battles || defaultBattles),
    wins: Number(run.wins || 0),
    battle_points: currentBp(options.save),
    coins: currentCoins(run),
    player_display: run.player_display || [],
    enemy_display: run.enemy_display || [],
    player_state: normalizePlayerState(run),
    bag_items: run.bag_items || {},
    coin_ledger: run.coin_ledger || [],
    talents: run.talents || [],
    rainbow_rocket_support: support ? {
      battle_no: support.battle_no,
      invasion: support.invasion,
      completed: support.completed,
      picks_used: Number(support.picks_used || 0),
      picks_required: Number(support.picks_required || 0),
      max_team_size: Number(support.max_team_size || RAINBOW_ROCKET_TEAM_SIZE),
      factory_display: support.factory_display || [],
      route_display: support.route_display || [],
      route_trainer: support.route_trainer,
    } : undefined,
    taken_enemy_slots: run.rest_status?.taken_enemy_slots || [],
    exchange_count: exchangeCount,
    costs: baseCosts,
  };
  return {...base, ...(options.extra || {}), costs: {...baseCosts, ...(options.extra?.costs || {})}};
}

export const BASIC_REST_EVENT_OPTIONS: RestEventOption[] = [
  {
    id: "sponsor_delivery",
    name: "赞助到账",
    desc: "立刻获得 120 金币。",
    detail: "稳定补一点运营预算，但不直接给回复道具。",
    intro: "一封赞助信被送到你手里。数额不大，但足够让本次休整多一点周转空间。",
    effects: ["立刻获得 120 金币。", "不直接给予回复道具。"],
    tone: "safe",
  },
  {
    id: "clinic_coupon",
    name: "诊所抵用券",
    desc: "本次休整获得 1 次免费商店抽奖。",
    detail: "不会直接恢复队伍，可以优先用在回复商店找续航。",
    intro: "路边诊所送来一张抵用券。它不能直接治疗队伍，但能帮你更便宜地找到补给。",
    effects: ["本次休整获得 1 次免费商店抽奖。", "推荐优先用于回复商店。"],
    tone: "safe",
  },
  {
    id: "blood_donation",
    name: "献血光荣",
    desc: "全队未濒死宝可梦扣除 1/4 当前 HP，获得 200 金币。",
    detail: "至少保留 1 HP，濒死宝可梦不参与。",
    intro: "临时医疗站正在招募志愿者。护士认真递来补给券，旁边的宝可梦们看起来不是很想排队。",
    effects: ["全队未濒死宝可梦当前 HP 减少 25%。", "至少保留 1 HP，濒死宝可梦不参与。", "立刻获得 200 金币。"],
    tone: "trade",
  },
  {
    id: "tutor_granny",
    name: "讲师老奶奶",
    desc: "本次休整可花 100 金币反复学习教授招式。",
    detail: "只显示当前宝可梦合法且未掌握的 tutor 来源招式。",
    intro: "一位背着旧教材的老奶奶坐在休整区角落。她讲课很慢，但讲的全是学校里不教、机器也刻不出来的老招式。",
    effects: ["本次休整解锁讲师老奶奶。", "每次花 100 金币让 1 只宝可梦学习合法教授招式。", "本次休整内可反复使用。"],
    tone: "trade",
  },
  {
    id: "daycare_grandpa",
    name: "培育屋爷爷",
    desc: "本次休整可花 100 金币反复学习遗传招式。",
    detail: "只显示当前宝可梦合法且未掌握的 egg 来源招式。",
    intro: "培育屋爷爷带着一本厚厚的谱系笔记。他说有些招式不是机器教会的，要从血脉、习惯和一点耐心里找回来。",
    effects: ["本次休整解锁培育屋爷爷。", "每次花 100 金币让 1 只宝可梦学习合法遗传招式。", "本次休整内可反复使用。"],
    tone: "trade",
  },
  {
    id: "reluctant_team",
    name: "恋恋不舍",
    desc: "本次休整无法交换宝可梦，获得 4 点可分配等级。",
    detail: "等级分配仍受徽章权限上限限制。",
    intro: "队伍里的宝可梦今天格外黏人。它们不愿意被交换走，也不想看见新同伴顶替自己的位置。",
    effects: ["本次休整无法交换宝可梦。", "立刻获得 4 点可分配等级。"],
    tone: "trade",
  },
  {
    id: "dialga_grace",
    name: "帝牙卢卡的恩典",
    desc: "下一战获得 1 次时间恩典，可代替一回合行动恢复到 3 回合前状态。",
    detail: "战斗内特殊行动；不回退对手、天气、场地、能力变化或战斗进程。",
    intro: "时间的裂缝在休整区短暂张开。帝牙卢卡的恩典并不会让整场战斗倒流，但能把你的队伍从过去的节点里拉回来一次。",
    effects: ["下一战限 1 次，发动后代替本回合行动。", "我方全队 HP、异常、PP、濒死状态恢复为 3 回合前；不足 3 回合则恢复到第 1 回合。", "对手和战场状态不回退。"],
    tone: "safe",
  },
  ...RUN_QUEST_DEFINITIONS.map(quest => ({
    id: `quest:${quest.id}`,
    name: quest.name,
    desc: quest.desc,
    detail: quest.detail,
    intro: quest.intro,
    effects: quest.effects,
    tone: "trade" as const,
  })),
];

export function ensureBasicRestEventOptions(run: CurrentRunData, eventPool: RestEventOption[] = BASIC_REST_EVENT_OPTIONS): void {
  if (run.status !== "awaiting_rest") return;
  if (run.special_run === "rainbow_rocket" || run.rest_status?.event_villain_intrusion_active) {
    run.rest_status = {...(run.rest_status || {}), rest_event_options: [], rest_event_selected_id: null};
    return;
  }
  if (run.rest_status?.rest_event_selected_id || run.rest_status?.rest_event_options?.length) return;
  const seed = `${run.seed || 1}:${run.battle_no || 0}:${run.next_battle || 1}:${run.wins || 0}`;
  const recent = new Set((run.rest_status?.recent_rest_event_ids || []).map(toId).filter(Boolean));
  const availablePool = eventPool.filter(event => event.status !== "pending_implementation" && !(run.active_quest && String(event.id).startsWith("quest:")));
  const freshPool = availablePool.filter(event => !recent.has(toId(event.id)));
  const sourcePool = freshPool.length >= 3 ? freshPool : availablePool;
  const picked = stableRestEventShuffle(sourcePool, seed).slice(0, 3).map(event => ({...event}));
  run.rest_status = {...(run.rest_status || {}), rest_event_options: picked, rest_event_selected_id: null};
}

export function basicRestEventRequired(run: CurrentRunData): boolean {
  return run.status === "awaiting_rest" && Boolean(run.rest_status?.rest_event_options?.length) && !run.rest_status?.rest_event_selected_id;
}

export function applyBasicRestEventChoice(save: LocalSave, run: CurrentRunData, eventId: string, eventPool: RestEventOption[] = BASIC_REST_EVENT_OPTIONS): string {
  void save;
  ensureBasicRestEventOptions(run, eventPool);
  if (!basicRestEventRequired(run)) throw new Error("当前没有待选择的休整奇遇。");
  const rawId = String(eventId || "").trim();
  const normalizedId = toId(rawId);
  const option = run.rest_status?.rest_event_options?.find(event => event.id === rawId || toId(event.id) === normalizedId);
  if (!option) throw new Error("休整奇遇不存在。");
  const id = option.id;
  if (run.active_quest && id.startsWith("quest:")) throw new Error(`已有进行中的任务：${run.active_quest.name}。`);
  const recent = [id, ...(run.rest_status?.recent_rest_event_ids || []).filter(value => toId(value) !== toId(id))].slice(0, RECENT_REST_EVENT_LIMIT);
  run.rest_status = {...(run.rest_status || {}), rest_event_selected_id: id, recent_rest_event_ids: recent};
  if (id === "sponsor_delivery") {
    const gained = addCoins(run, 120, "sponsor-delivery");
    return `赞助到账：获得 ${gained}金币。`;
  }
  if (id === "clinic_coupon") {
    run.rest_status = {...(run.rest_status || {}), free_shop_rolls_remaining: Number(run.rest_status?.free_shop_rolls_remaining || 0) + 1};
    return "诊所抵用券：本次休整获得 1 次免费商店抽奖。";
  }
  if (id === "blood_donation") {
    const count = damagePartyFraction(run, 0.25);
    const gained = addCoins(run, 200, "blood-donation");
    return `献血光荣：${count} 只宝可梦贡献了体力，获得 ${gained}金币。`;
  }
  if (id === "tutor_granny") {
    run.rest_status = {...(run.rest_status || {}), event_tutor_service_available: true};
    return "讲师老奶奶：本次休整解锁教授招式学习服务。";
  }
  if (id === "daycare_grandpa") {
    run.rest_status = {...(run.rest_status || {}), event_egg_service_available: true};
    return "培育屋爷爷：本次休整解锁遗传招式学习服务。";
  }
  if (id === "reluctant_team") {
    run.rest_status = {...(run.rest_status || {}), event_exchange_disabled: true, event_level_points: Number(run.rest_status?.event_level_points || 0) + 4};
    return "恋恋不舍：本次无法交换宝可梦，获得 4 点可分配等级。";
  }
  if (id === "dialga_grace") {
    run.rest_status = {...(run.rest_status || {}), event_dialga_grace_next: true};
    return "帝牙卢卡的恩典：下一战可发动 1 次时间恩典，代替本回合行动恢复我方全队到 3 回合前状态。";
  }
  if (id.startsWith("quest:")) {
    const questId = id.slice("quest:".length);
    return startRunQuest(run, questId as Parameters<typeof startRunQuest>[1]);
  }
  const definition = eventPool.find(event => event.id === id || toId(event.id) === normalizedId);
  return `${definition?.name || option.name || "休整奇遇"}：效果已记录。`;
}

export function applyBpToCoins(save: LocalSave, run: CurrentRunData, bp: number): string {
  if (!hasTalent(run.talents, "economy_bp_exchange")) throw new Error("需要天赋「有借有换」。");
  const amount = Math.max(1, Math.floor(Number(bp || 0)));
  spendBp(save, amount);
  const gained = addCoins(run, amount * 50, "bp-to-coins");
  return `有借有换：消耗 ${amount}BP，获得 ${gained}金币。`;
}

export function applyDoctorTreatment(run: CurrentRunData, branch: "status" | "hp"): string {
  if (!run.rest_status?.event_doctor_pending) throw new Error("当前没有待选择的医生治疗。");
  const states = normalizePlayerState(run);
  if (branch === "status") {
    for (const state of states) {
      state.status = "";
      state.moves = (state.moves || []).map(move => ({...move, pp: Math.max(0, Number(move.maxpp || move.pp || 0))}));
      if (!state.fainted && Number(state.hp || 0) > 0) state.hp = Math.max(1, Math.floor(Number(state.hp || 1) / 2));
      refreshStateCondition(state);
    }
    run.player_state = states;
    run.rest_status = {...(run.rest_status || {}), event_doctor_pending: false};
    return "蹩脚医生哥哥：全队解除异常并恢复 PP，但未濒死宝可梦 HP 减半。";
  }
  for (const state of states) {
    const maxhp = Math.max(1, Number(state.maxhp || 1));
    state.hp = state.fainted || Number(state.hp || 0) <= 0 ? Math.max(1, Math.floor(maxhp / 2)) : maxhp;
    state.status = state.fainted ? "" : state.status;
    refreshStateCondition(state);
  }
  run.player_state = states;
  run.rest_status = {...(run.rest_status || {}), event_doctor_pending: false};
  return "蹩脚医生弟弟：全队恢复 HP，濒死宝可梦复活到半血。";
}

export function applyScoreBetAdjustment(run: CurrentRunData, options: {targetAlive?: RestScoreBetTarget; stake?: number; multiplier?: number}): string {
  const current = run.rest_status?.event_score_bet_next;
  if (!current) throw new Error("当前没有重金下注。");
  const currentStake = Math.max(SCORE_BET_MIN_STAKE, Math.floor(Number(current.stake || SCORE_BET_MIN_STAKE)));
  const maxStake = scoreBetMaxStakeForCoins(currentCoins(run), currentStake);
  const target = options.targetAlive === undefined ? current.target_alive : scoreBetTarget(options.targetAlive, current.target_alive);
  const multiplier = options.multiplier === undefined ? scoreBetMultiplierChoice(current.multiplier, scoreBetMultiplier(target)) : scoreBetMultiplierChoice(options.multiplier, current.multiplier);
  const requestedStake = options.stake === undefined ? currentStake : Math.max(SCORE_BET_MIN_STAKE, Math.min(maxStake, Math.floor(Number(options.stake || SCORE_BET_MIN_STAKE))));
  const diff = requestedStake - currentStake;
  if (diff > 0) spendRunCoins(run, diff, "score-bet-adjust", {alreadyPriced: true});
  if (diff < 0) addCoins(run, -diff, "score-bet-refund");
  const normalized = normalizeScoreBetState({target_alive: target, stake: requestedStake, multiplier}, Math.max(requestedStake, scoreBetMaxStakeForCoins(currentCoins(run), requestedStake)));
  run.rest_status = {...(run.rest_status || {}), event_score_bet_next: normalized};
  const refundText = diff < 0 ? `，退回 ${-diff}金币` : diff > 0 ? `，补下注 ${diff}金币` : "";
  return `重金下注：已调整为精确 ${target}:0，赔率 ${normalized?.multiplier || multiplier}x，下注 ${requestedStake}金币，命中返还 ${normalized?.payout || scoreBetPayout(requestedStake, multiplier)}金币${refundText}。`;
}

export async function applyTrustLevel(save: LocalSave, run: CurrentRunData, slot: number, service: ArrivalLevelCapRuntimeService): Promise<string> {
  if (!hasTalent(run.talents, "exchange_trust")) throw new Error("需要天赋「不负信赖」。");
  if (run.rest_status?.trust_level_used) throw new Error("本次休整已经培养过信赖。");
  const target = Math.floor(Number(slot || 0));
  if (target < 0 || target >= (run.player_team || []).length) throw new Error("队伍编号无效。");
  const rawSet = clone(run.player_team[target]) as PokemonSet;
  const currentLevel = Math.max(1, Math.floor(Number(rawSet.level || run.player_display[target]?.level || 50)));
  const trust = talentLevel(run.talents, "exchange_trust");
  const gainLevel = trust >= 3 ? 4 : trust >= 2 ? 2 : 1;
  const cap = badgeLevelCapForTalents(run.talents) || 50;
  const nextLevel = Math.min(cap, currentLevel + gainLevel);
  const overflow = Math.max(0, currentLevel + gainLevel - cap);
  rawSet.level = nextLevel;
  const [nextDisplay] = await service.describeTeam([rawSet]);
  const stableId = stablePlayerSlotShowdownId(run, target, rawSet.showdown_id, rawSet.pokeball, run.player_state?.[target]?.showdown_id);
  run.player_team[target] = rawSet;
  run.player_display[target] = nextDisplay || {...run.player_display[target], level: nextLevel};
  const states = normalizePlayerState(run);
  states[target] = adjustedStateAfterEdit(states[target], run.player_display[target], target + 1);
  writePlayerSlotShowdownId(run, target, states, stableId);
  run.player_state = states;
  const coinText = overflow ? `，溢出 ${overflow} 级转换为 ${addRunBp(save, run, overflow * TRUST_OVERFLOW_COIN_PER_LEVEL)}金币` : "";
  run.rest_status = {...(run.rest_status || {}), trust_level_used: true};
  return `不负信赖：${run.player_display[target]?.species_zh || run.player_display[target]?.species || "宝可梦"} 提升到 Lv${nextLevel}${coinText}。`;
}

export function adjustRunBagItem(run: CurrentRunData, itemId: string, delta: number): void {
  const id = itemKey(itemId);
  if (!id || !delta) return;
  const nextCount = Math.max(0, Number(run.bag_items?.[id] || 0) + Math.floor(Number(delta || 0)));
  run.bag_items = {...(run.bag_items || {}), [id]: nextCount};
  if (nextCount <= 0) {
    delete run.bag_items[id];
    if (run.bag_item_meta) delete run.bag_item_meta[id];
  }
  if (delta < 0 && run.non_refundable_bag_items?.[id]) {
    const locked = Math.max(0, Number(run.non_refundable_bag_items[id] || 0) + Math.floor(Number(delta || 0)));
    run.non_refundable_bag_items = {...(run.non_refundable_bag_items || {}), [id]: locked};
    if (locked <= 0) delete run.non_refundable_bag_items[id];
  }
}

export async function applyRestConsumableItem(
  run: CurrentRunData,
  itemId: string,
  slot: number,
  moveSlot: number | undefined,
  service: RestItemRuntimeService,
  options: {stat?: StatId; consume?: boolean; dryRun?: boolean} = {},
): Promise<string> {
  const id = itemKey(itemId);
  const target = Math.floor(Number(slot));
  if (!id || Number(run.bag_items?.[id] || 0) <= 0) throw new Error("背包里没有这个道具。");
  if (isTaskRewardItemId(id)) return applyRestShopDiscountCoupon(run, id, Boolean(options.dryRun));
  if (target < 0 || target >= (run.player_display || []).length) throw new Error("队伍编号无效。");
  if (!(await service.hasConsumableItemEffect(id))) throw new Error("这个道具不能作为消耗道具使用。");
  if (id === "rarecandy") {
    const message = await applyRareCandyItem(run, target, service, Boolean(options.dryRun));
    if (options.consume !== false && !options.dryRun) adjustRunBagItem(run, id, -1);
    return message;
  }
  const trainingEffect = service.trainingItemEffect ? await service.trainingItemEffect(id) : null;
  if (trainingEffect) {
    const message = await applyTrainingConsumableItem(run, id, target, trainingEffect, options.stat, service, Boolean(options.dryRun));
    if (options.consume !== false && !options.dryRun) adjustRunBagItem(run, id, -1);
    return message;
  }
  const states = normalizePlayerState(run);
  const message = await service.applyConsumableItemEffectToState(id, states[target], moveSlot);
  if (!options.dryRun) {
    run.player_state = states;
    if (options.consume !== false) adjustRunBagItem(run, id, -1);
  }
  return message || "道具已使用。";
}

async function applyRareCandyItem(
  run: CurrentRunData,
  slot: number,
  service: ArrivalLevelCapRuntimeService,
  dryRun: boolean,
): Promise<string> {
  if (slot < 0 || slot >= (run.player_team || []).length) throw new Error("队伍编号无效。");
  const rawSet = clone(run.player_team[slot]) as PokemonSet;
  const pokemonName = run.player_display?.[slot]?.species_zh || run.player_display?.[slot]?.species || rawSet.species || rawSet.name || "宝可梦";
  const cap = badgeLevelCapForTalents(run.talents) || 100;
  const currentLevel = Math.max(1, Math.floor(Number(rawSet.level || run.player_display?.[slot]?.level || 1)));
  if (currentLevel >= cap) throw new Error(`${pokemonName} 已达到当前徽章等级上限 Lv${cap}。`);
  const nextLevel = Math.min(cap, currentLevel + 1);
  if (dryRun) return `${pokemonName} 可以使用神奇糖果。`;
  rawSet.level = nextLevel;
  const [nextDisplay] = await service.describeTeam([rawSet]);
  const stableId = stablePlayerSlotShowdownId(run, slot, rawSet.showdown_id, rawSet.pokeball, run.player_display?.[slot]?.showdown_id, run.player_state?.[slot]?.showdown_id);
  run.player_team[slot] = rawSet;
  run.player_display[slot] = nextDisplay || {...run.player_display[slot], level: nextLevel};
  const states = normalizePlayerState(run);
  states[slot] = adjustedStateAfterEdit(states[slot], run.player_display[slot], slot + 1);
  writePlayerSlotShowdownId(run, slot, states, stableId);
  run.player_state = states;
  return `${pokemonName} 使用了神奇糖果，提升到 Lv${nextLevel}。`;
}

async function applyTrainingConsumableItem(
  run: CurrentRunData,
  itemId: string,
  slot: number,
  effect: TrainingItemEffect,
  selectedStat: StatId | undefined,
  service: RestItemRuntimeService,
  dryRun: boolean,
): Promise<string> {
  if (slot < 0 || slot >= (run.player_team || []).length) throw new Error("队伍编号无效。");
  const rawSet = clone(run.player_team[slot]) as PokemonSet;
  const stat = effect.scope === "all" ? undefined : effect.stat || selectedStat;
  if ((effect.stat_kind === "ev" || effect.stat_kind === "iv") && effect.scope !== "all" && !isStatId(stat)) throw new Error("请选择能力项。");
  const pokemonName = run.player_display?.[slot]?.species_zh || run.player_display?.[slot]?.species || rawSet.species || rawSet.name || "宝可梦";
  let detail = "";
  if (effect.stat_kind === "ev") {
    const key = stat as StatId;
    const evs = normalizeStatsInput(rawSet.evs, 0);
    const current = Math.max(0, Math.min(255, Number(evs[key] || 0)));
    if (effect.amount < 0) {
      if (current <= 0) throw new Error(`${pokemonName} 的${statZh(key)}努力值已经是 0。`);
      const next = Math.max(0, current + effect.amount);
      evs[key] = next;
      detail = `${statZh(key)}努力值 ${current} -> ${next}`;
    } else {
      const total = STAT_IDS.reduce((sum, statId) => sum + Math.max(0, Math.min(255, Number(evs[statId] || 0))), 0);
      const add = Math.min(effect.amount, 255 - current, 510 - total);
      if (add <= 0) throw new Error(`${pokemonName} 的努力值已经没有可提升空间。`);
      evs[key] = current + add;
      detail = `${statZh(key)}努力值 ${current} -> ${evs[key]}`;
    }
    rawSet.evs = evs;
  } else if (effect.stat_kind === "iv") {
    const ivs = normalizeStatsInput(rawSet.ivs, 31);
    if (effect.scope === "all") {
      const missing = STAT_IDS.filter(statId => Number(ivs[statId] || 0) < 31);
      if (!missing.length) throw new Error(`${pokemonName} 的个体值已经全满。`);
      for (const statId of STAT_IDS) ivs[statId] = 31;
      detail = "全部个体值提升到 31";
    } else {
      const key = stat as StatId;
      if (Number(ivs[key] || 0) >= 31) throw new Error(`${pokemonName} 的${statZh(key)}个体值已经是 31。`);
      const previous = Math.max(0, Math.min(31, Number(ivs[key] || 0)));
      ivs[key] = 31;
      detail = `${statZh(key)}个体值 ${previous} -> 31`;
    }
    rawSet.ivs = ivs;
  } else if (effect.stat_kind === "ability") {
    if (!service.editOptions) throw new Error("当前环境不支持修改特性。");
    const options = await service.editOptions(rawSet);
    const currentId = toId(rawSet.ability || run.player_display?.[slot]?.ability || "");
    const target = effect.amount > 0
      ? options.abilities.find(ability => ability.hidden)
      : options.abilities.filter(ability => !ability.hidden && toId(ability.name || ability.id) !== currentId)[0];
    if (!target) throw new Error(effect.amount > 0 ? `${pokemonName} 没有可切换的隐藏特性。` : `${pokemonName} 没有可切换的普通特性。`);
    if (toId(target.name || target.id) === currentId) throw new Error(`${pokemonName} 已经是 ${target.name_zh || target.name}。`);
    rawSet.ability = target.name || target.id;
    detail = `特性变为 ${target.name_zh || target.name}`;
  } else if (effect.stat_kind === "nature") {
    if (!service.editOptions) throw new Error("当前环境不支持修改性格。");
    const options = await service.editOptions(rawSet);
    const natureId = toId(effect.nature || "");
    const target = options.natures.find(nature => toId(nature.name || nature.id) === natureId);
    if (!target) throw new Error("这个薄荷配置无效。");
    if (toId(rawSet.nature || "Serious") === toId(target.name)) throw new Error(`${pokemonName} 已经是 ${target.name_zh || target.name}性格。`);
    rawSet.nature = target.name;
    detail = `性格变为 ${target.name_zh || target.name}`;
  } else {
    throw new Error("这个训练道具配置无效。");
  }
  if (dryRun) return `${pokemonName} 可以使用 ${itemId}。`;
  const [nextDisplay] = await service.describeTeam([rawSet]);
  const stableId = stablePlayerSlotShowdownId(run, slot, rawSet.showdown_id, rawSet.pokeball, run.player_display?.[slot]?.showdown_id, run.player_state?.[slot]?.showdown_id);
  run.player_team[slot] = rawSet;
  run.player_display[slot] = nextDisplay || run.player_display[slot];
  const states = normalizePlayerState(run);
  states[slot] = adjustedStateAfterEdit(states[slot], run.player_display[slot], slot + 1);
  writePlayerSlotShowdownId(run, slot, states, stableId);
  run.player_state = states;
  return `${pokemonName} 完成训练：${detail}。`;
}

export async function applyHeldItemChange(run: CurrentRunData, itemId: string | null, slot: number, service: ArrivalLevelCapRuntimeService): Promise<string> {
  const target = Math.floor(Number(slot));
  if (target < 0 || target >= (run.player_team || []).length) throw new Error("队伍编号无效。");
  const oldItem = itemKey(run.player_display[target]?.item_id || run.player_team[target]?.item);
  const oldItemName = run.player_display[target]?.item_zh || run.player_display[target]?.item || oldItem;
  if (oldItem) adjustRunBagItem(run, oldItem, 1);
  if (itemId) {
    const id = itemKey(itemId);
    if (!id || Number(run.bag_items?.[id] || 0) <= 0) throw new Error("背包里没有这个道具。");
    if (/^tm:/i.test(id)) throw new Error("技能机器不能装备，只能在休整页使用。");
    adjustRunBagItem(run, id, -1);
    run.player_team[target].item = id;
  } else {
    run.player_team[target].item = "";
  }
  const [nextDisplay] = await service.describeTeam([run.player_team[target]]);
  const stableId = stablePlayerSlotShowdownId(run, target, run.player_team[target]?.showdown_id, run.player_display[target]?.showdown_id, run.player_state?.[target]?.showdown_id);
  run.player_display[target] = nextDisplay || run.player_display[target];
  const states = normalizePlayerState(run);
  states[target] = adjustedStateAfterEdit(states[target], run.player_display[target], target + 1);
  states[target].item = itemKey(run.player_display[target]?.item_id || run.player_team[target]?.item);
  writePlayerSlotShowdownId(run, target, states, stableId);
  run.player_state = states;
  if (itemId) return oldItem ? `已交换道具，${oldItemName} 回到了背包。` : "已装备道具。";
  return oldItem ? `${oldItemName} 回到了背包。` : "当前没有携带道具。";
}

export function sellRunBagItem(save: LocalSave, run: CurrentRunData, itemId: string, item: Pick<ShopItem, "cost" | "name" | "name_zh">): string {
  const id = itemKey(itemId);
  if (!run.rest_status?.recycler_available) throw new Error("当前没有道具回收商，不能出售道具。");
  if (!id || Number(run.bag_items?.[id] || 0) <= 0) throw new Error("背包里没有这个道具。");
  if (isTaskRewardItemId(id)) throw new Error("任务奖励道具不能出售。");
  const price = sellPriceForItem({cost: Math.max(0, Number(item.cost || 0))}, run);
  const gained = addRunBp(save, run, price);
  adjustRunBagItem(run, id, -1);
  run.recycle_receipt_value = Number(run.recycle_receipt_value || 0) + price;
  return `道具回收商回收了 ${item.name_zh || item.name || id}，获得 ${gained}金币。`;
}

export function buyRunShopOffer(run: CurrentRunData, offer: ShopOffer, options: {alreadyPriced?: boolean} = {}): string {
  const itemId = itemKey(offer.id || offer.name);
  if (!itemId) throw new Error("商店商品无效。");
  const spent = spendRunCoins(run, Number(offer.cost || 0), `shop-buy:${itemId}`, {alreadyPriced: options.alreadyPriced ?? true});
  adjustRunBagItem(run, itemId, 1);
  rememberRunBagItemMeta(run, offer);
  run.shop_purchased_offer_id = offer.offer_id;
  run.shop_purchased_offer_counts = {...(run.shop_purchased_offer_counts || {}), [offer.offer_id]: Number(run.shop_purchased_offer_counts?.[offer.offer_id] || 0) + 1};
  run.shop_purchased_item_counts = {...(run.shop_purchased_item_counts || {}), [itemId]: Number(run.shop_purchased_item_counts?.[itemId] || 0) + 1};
  return `已购买 ${offer.name_zh || offer.name}，${spent.message}。`;
}

export function buyRunItem(run: CurrentRunData, item: ShopItem): string {
  const offer: ShopOffer = {...item, offer_id: `direct-${itemKey(item.id || item.name)}`, category: "held"};
  return buyRunShopOffer(run, offer, {alreadyPriced: false});
}

export function barterRunShopOffer(run: CurrentRunData, offer: ShopOffer, materials: Array<{item: ShopItem; count?: number}>): string {
  if (!run.rest_status?.event_barter_active) throw new Error("当前不是以物易物商店。");
  if (!materials.length || materials.length > 3) throw new Error("以物易物需要投入 1-3 个背包道具。");
  const materialCounts = new Map<string, {item: ShopItem; count: number}>();
  for (const material of materials) {
    const id = itemKey(material.item.id || material.item.name);
    if (!id) continue;
    const current = materialCounts.get(id) || {item: material.item, count: 0};
    current.count += Math.max(1, Math.floor(Number(material.count || 1)));
    materialCounts.set(id, current);
  }
  let value = 0;
  for (const [id, material] of materialCounts) {
    if (isTaskRewardItemId(id)) throw new Error("任务奖励道具不能用于以物易物。");
    if (Number(run.bag_items?.[id] || 0) < material.count) throw new Error("以物易物材料数量不足。");
    value += sellPriceForItem({cost: Math.max(0, Number(material.item.cost || 0))}, run) * material.count;
  }
  const required = Math.ceil(Number(offer.cost || 0) * 0.7);
  if (value < required) throw new Error(`投入道具价值不足，需要至少 ${required}。`);
  for (const [id, material] of materialCounts) adjustRunBagItem(run, id, -material.count);
  const itemId = itemKey(offer.id || offer.name);
  adjustRunBagItem(run, itemId, 1);
  rememberRunBagItemMeta(run, offer);
  run.shop_purchased_offer_id = offer.offer_id;
  run.shop_purchased_offer_counts = {...(run.shop_purchased_offer_counts || {}), [offer.offer_id]: Number(run.shop_purchased_offer_counts?.[offer.offer_id] || 0) + 1};
  run.shop_purchased_item_counts = {...(run.shop_purchased_item_counts || {}), [itemId]: Number(run.shop_purchased_item_counts?.[itemId] || 0) + 1};
  return `以物易物：换得 ${offer.name_zh || offer.name}。`;
}

export function forgeRunItems(run: CurrentRunData, materialIds: string[], rewards: ShopItem[]): string {
  const ids = materialIds.map(itemKey).filter(Boolean);
  if (ids.length !== 3) throw new Error("普通熔炉需要投入 3 个道具。");
  for (const id of ids) {
    if (isTaskRewardItemId(id)) throw new Error("任务奖励道具不能用于重铸。");
    if (Number(run.bag_items?.[id] || 0) <= 0) throw new Error("背包材料数量不足。");
  }
  for (const id of ids) adjustRunBagItem(run, id, -1);
  for (const reward of rewards) {
    adjustRunBagItem(run, reward.id, 1);
    rememberRunBagItemMeta(run, reward);
  }
  return `熔炉重铸完成，获得 ${rewards.map(item => item.name_zh || item.name).join("、")}。`;
}

export function forgeRunSpecialItem(run: CurrentRunData, materialId: string, reward: ShopItem, cost: number): string {
  const id = itemKey(materialId);
  if (!id || Number(run.bag_items?.[id] || 0) <= 0) throw new Error("背包里没有这个特殊道具。");
  if (isTaskRewardItemId(id)) throw new Error("任务奖励道具不能用于重铸。");
  const spent = spendRunCoins(run, cost, "forge-special");
  adjustRunBagItem(run, id, -1);
  adjustRunBagItem(run, reward.id, 1);
  rememberRunBagItemMeta(run, reward);
  return `特殊熔炉完成，获得 ${reward.name_zh || reward.name}，${spent.message}。`;
}

export function rerollRunTeraOrb(run: CurrentRunData, nextType: string, nextTypeZh: string, cost: number): string {
  const spent = spendRunCoins(run, cost, "forge-tera-orb");
  run.tera_orb_type = nextType;
  run.tera_orb_type_zh = nextTypeZh || nextType;
  run.player_team = (run.player_team || []).map(set => ({...set, teraType: nextType}));
  run.player_display = (run.player_display || []).map(pokemon => ({...pokemon, tera_type: nextType, tera_type_zh: nextTypeZh || nextType}));
  return `太晶珠重铸完成，变为${nextTypeZh || nextType}属性，${spent.message}。`;
}

export async function applyAllInExchange(save: LocalSave, run: CurrentRunData, ownIndex: number, generated: {raw: PokemonSet; display: RentalPokemon}, service: ArrivalLevelCapRuntimeService): Promise<string> {
  if (!hasTalent(run.talents, "growth_all_in")) throw new Error("需要天赋「孤注一掷」。");
  if (run.rest_status?.event_exchange_disabled) throw new Error("恋恋不舍：本次休整无法交换宝可梦。");
  if (run.all_in_exchange_used) throw new Error("本局已经使用过孤注一掷。");
  const own = Math.floor(Number(ownIndex));
  if (own < 0 || own >= (run.player_team || []).length) throw new Error("队伍编号无效。");
  const oldRaw = clone(run.player_team[own]) as PokemonSet;
  const oldDisplay = clone(run.player_display[own]) as RentalPokemon;
  const oldState = clone(normalizePlayerState(run)[own]) as PlayerPokemonState;
  let nextRaw = clone(generated.raw) as PokemonSet;
  let nextDisplay = clone(generated.display) as RentalPokemon;
  const capped = await applyArrivalLevelCap(run.talents, nextRaw, nextDisplay, service);
  nextRaw = capped.raw;
  nextDisplay = capped.display;
  const oldName = oldDisplay.species_zh || oldDisplay.species || oldRaw.species || `第 ${own + 1} 只`;
  const oldShowdownId = oldRaw.showdown_id || oldDisplay.showdown_id || oldState.showdown_id;
  addRunExchangeBox(run, [oldRaw], [oldDisplay], [oldState]);
  const newShowdownId = takeReplacementRunShowdownId(run, own, oldShowdownId);
  writePokemonShowdownId(nextRaw, nextDisplay, undefined, newShowdownId);
  run.player_team[own] = hasTalent(run.talents, "economy_shiny_collector") ? {...nextRaw, shiny: true} : nextRaw;
  run.player_display[own] = hasTalent(run.talents, "economy_shiny_collector") ? shinyPokemon(nextDisplay) : nextDisplay;
  writePokemonShowdownId(run.player_team[own], run.player_display[own], undefined, newShowdownId);
  const states = normalizePlayerState(run);
  states[own] = fullStateForPokemon(run.player_display[own], own + 1);
  writePlayerSlotShowdownId(run, own, states, newShowdownId);
  for (let index = 0; index < states.length; index += 1) {
    if (index === own) continue;
    const state = states[index];
    state.hp = Math.max(1, Math.floor(Number(state.maxhp || 1) / 2));
    state.status = "slp";
    refreshStateCondition(state);
  }
  run.player_state = states;
  const investments = run.bp_investments || [];
  const moveInvestments = run.move_investments || [];
  investments[own] = 0;
  moveInvestments[own] = [0, 0, 0, 0];
  run.bp_investments = investments;
  run.move_investments = moveInvestments;
  run.all_in_exchange_used = true;
  const newName = run.player_display[own]?.species_zh || run.player_display[own]?.species || "未知宝可梦";
  run.rest_status = {
    ...(run.rest_status || {}),
    all_in_pending_next: true,
    all_in_result: {old_name: oldName, new_name: newName},
  };
  recordRunPokemonUsage(save, run.player_display[own]);
  return `孤注一掷发动：${oldName} 被替换成了 ${newName}${capped.capped ? "，徽章权限已压制到手等级" : ""}。另外的宝可梦已变为半血并陷入睡眠，即将结束休整。`;
}

export async function applyRaidExchange(save: LocalSave, run: CurrentRunData, planned: PlannedBattleData, ownIndex: number, enemyIndex: number, service: ArrivalLevelCapRuntimeService): Promise<string> {
  if (!run.rest_status?.event_raid_exchange_available || run.rest_status?.event_raid_exchange_used) throw new Error("当前没有可用的奇袭交换。");
  if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队路线不能交换敌方宝可梦。");
  const own = Math.floor(Number(ownIndex));
  const enemy = Math.floor(Number(enemyIndex));
  if (own < 0 || own >= (run.player_team || []).length || enemy < 0 || enemy >= (planned.enemy_raw || []).length) throw new Error("交换编号需要在队伍范围内。");
  const states = normalizePlayerState(run);
  const oldRaw = clone(run.player_team[own]) as PokemonSet;
  const oldDisplay = clone(run.player_display[own]) as RentalPokemon;
  const oldState = clone(states[own]) as PlayerPokemonState;
  const oldItem = itemKey(oldRaw.item || oldDisplay.item_id || oldDisplay.item);
  if (oldItem) {
    adjustRunBagItem(run, oldItem, 1);
    oldRaw.item = "";
    oldDisplay.item = "";
    oldDisplay.item_id = "";
    oldDisplay.item_zh = "";
    oldDisplay.item_desc = "";
    oldDisplay.item_desc_zh = "";
  }

  let nextRaw = clone(planned.enemy_raw[enemy]) as PokemonSet;
  let nextDisplay = clone(planned.enemy_display[enemy]) as RentalPokemon;
  const capped = await applyArrivalLevelCap(run.talents, nextRaw, nextDisplay, service);
  nextRaw = capped.raw;
  nextDisplay = capped.display;
  const newShowdownId = takeReplacementRunShowdownId(run, own, oldRaw.showdown_id || oldDisplay.showdown_id || oldState.showdown_id);
  writePokemonShowdownId(nextRaw, nextDisplay, undefined, newShowdownId);
  run.player_team[own] = nextRaw;
  run.player_display[own] = nextDisplay;
  recordRunPokemonUsage(save, nextDisplay);
  const nextStates = normalizePlayerState(run);
  nextStates[own] = fullStateForPokemon(nextDisplay, own + 1);
  writePlayerSlotShowdownId(run, own, nextStates, newShowdownId);
  run.player_state = nextStates;
  addRunExchangeBox(run, [oldRaw], [oldDisplay], [oldState]);

  planned.enemy_raw[enemy] = oldRaw;
  planned.enemy_display[enemy] = oldDisplay;
  assignEnemyShowdownIds(planned.enemy_raw, planned.enemy_display);
  run.planned_battles = [...(run.planned_battles || []).filter(entry => Number(entry.battle_no) !== Number(planned.battle_no)), planned]
    .sort((a, b) => Number(a.battle_no) - Number(b.battle_no));
  const investments = run.bp_investments || [];
  const moveInvestments = run.move_investments || [];
  investments[own] = 0;
  moveInvestments[own] = [0, 0, 0, 0];
  run.bp_investments = investments;
  run.move_investments = moveInvestments;
  run.rest_status = {
    ...(run.rest_status || {}),
    event_raid_exchange_used: true,
    event_rerandomized_locked_battles: Array.from(new Set([...(run.rest_status?.event_rerandomized_locked_battles || []), Number(planned.battle_no)])),
  };
  return `骇人奇袭：换来了 ${nextDisplay.species_zh || nextDisplay.species}${capped.capped ? "，等级已受徽章权限压制" : ""}。`;
}

export function buildRuntimeOpponentPreview(planned: PlannedBattleData): {trainer: TrainerNpcView; enemies: RentalPokemon[]; label: string} {
  const label = planned.special_event === "villain_intrusion"
    ? "反派头目乱入"
    : planned.special_event === "rainbow_rocket"
      ? "彩虹火箭队"
      : planned.route_type === "normal"
        ? "普通 NPC"
        : planned.route_type === "champion"
          ? "冠军"
          : planned.route_type === "elite4"
            ? "四天王"
            : "馆主";
  return {trainer: planned.enemy_trainer, enemies: (planned.enemy_display || []).slice(0, 3), label};
}

export function buildRuntimeNightSkyState(run: CurrentRunData, plannedBattles: PlannedBattleData[]): NightSkyState {
  const previousRows = run.night_sky?.rows || [];
  const rows: NightSkyState["rows"] = [];
  const battles = Math.max(1, Number(run.battles || DEFAULT_BATTLES));
  const currentBattleNo = Math.max(0, Number(run.battle_no || Math.max(0, Number(run.next_battle || 1) - 1) || 0));
  const rumorLevel = talentLevel(run.talents, "intel_rumor");
  for (let battleNo = 1; battleNo <= battles; battleNo += 1) {
    const planned = plannedBattles.find(entry => Number(entry.battle_no) === battleNo);
    if (!planned) continue;
    const previous = previousRows.find(row => Number(row.battle_no) === battleNo);
    const preview = buildRuntimeOpponentPreview(planned);
    const villainIntrusion = planned.special_event === "villain_intrusion";
    const encountered = battleNo <= currentBattleNo;
    const namedVisible = Boolean(planned.route_type === "champion" && run.named_champion_id && preview.trainer.id === run.named_champion_id);
    const trainerVisible = villainIntrusion || encountered || rumorLevel >= 1 || namedVisible;
    const forceUnlocked = Boolean(previous?.unlocked);
    const revealed = villainIntrusion && !encountered ? 0 : encountered || forceUnlocked ? 3 : Math.max(0, Math.min(3, Number(previous?.revealed || 0)));
    const enemiesVisible = encountered || (!villainIntrusion && (trainerVisible || forceUnlocked));
    rows.push({
      battle_no: battleNo,
      label: preview.label,
      trainer: preview.trainer,
      route_type: planned.route_type === "normal" ? "normal" : planned.route_type,
      trainer_visible: trainerVisible,
      encountered,
      named_visible: namedVisible,
      revealed,
      unlocked: Boolean(forceUnlocked || revealed >= 3),
      enemies: preview.enemies.map((enemy, index) => enemiesVisible && index < revealed ? enemy : null),
    });
  }
  run.night_sky = {rows};
  return run.night_sky;
}

export function applyRuntimeScoutNext(run: CurrentRunData, planned: PlannedBattleData, level: ScoutState["level"]): string {
  if (!hasTalent(run.talents, "intel_rumor")) throw new Error("需要天赋「小道消息」。");
  if (planned.special_event === "villain_intrusion") throw new Error("赛程异常，小道消息无法读取反派头目的完整队伍。");
  const normalized = level === "all" ? "all" : level === "basic" ? "basic" : "one";
  if (normalized === "one" && run.rest_status?.free_scout_used) throw new Error("本次休整已经使用过免费侦查。");
  const battleNo = Number(planned.battle_no || run.next_battle || 1);
  const cost = normalized === "all" ? SCOUT_ALL_COST : normalized === "one" ? SCOUT_ONE_COST : 0;
  const spent = spendRunCoins(run, cost, "scout-next");
  const preview = buildRuntimeOpponentPreview(planned);
  const enemies = normalized === "one"
    ? [preview.enemies[simpleRestHash(run.seed || 1, battleNo, "scout-next") % Math.max(1, preview.enemies.length)]].filter(Boolean)
    : preview.enemies;
  run.scout = {
    level: normalized,
    title: `第 ${battleNo}/${run.battles} 场：${preview.label}`,
    summary: `下一场对手是 ${preview.trainer.name_zh}。`,
    enemies,
  };
  if (normalized === "one") run.rest_status = {...(run.rest_status || {}), free_scout_used: true};
  return `已侦查下一场${spent.paid ? `，${spent.message}` : ""}。`;
}

export function applyRuntimeNightSkyScout(run: CurrentRunData, plannedBattles: PlannedBattleData[], battleNo: number, level: "one" | "all"): string {
  const rumorLevel = talentLevel(run.talents, "intel_rumor");
  if (rumorLevel <= 0) throw new Error("需要天赋「小道消息」。");
  const targetBattleNo = Math.max(1, Math.min(Number(run.battles || DEFAULT_BATTLES), Math.floor(Number(battleNo || 1))));
  buildRuntimeNightSkyState(run, plannedBattles);
  const row = run.night_sky?.rows.find(entry => Number(entry.battle_no) === targetBattleNo);
  if (!row) throw new Error("没有找到这场训练师信息。");
  const currentBattleNo = Math.max(0, Number(run.battle_no || Math.max(0, Number(run.next_battle || 1) - 1) || 0));
  if (targetBattleNo <= currentBattleNo) throw new Error("已经挑战过的对手无需侦查。");
  const planned = plannedBattles.find(entry => Number(entry.battle_no) === targetBattleNo);
  if (planned?.special_event === "villain_intrusion") throw new Error("赛程异常，夜观天象无法解锁反派头目的完整队伍。");
  if (level === "one") {
    if (rumorLevel < 2) throw new Error("需要小道消息 Lv2 才能免费查看一只宝可梦。");
    if (Number(row.revealed || 0) >= 1) throw new Error("这一行已经免费查看过。");
    row.revealed = 1;
    row.unlocked = false;
  } else {
    if (rumorLevel < 3) throw new Error("需要小道消息 Lv3 才能解锁完整阵容。");
    if (!row.unlocked) spendRunCoins(run, SCOUT_ALL_COST, `night-sky:${targetBattleNo}`);
    row.revealed = 3;
    row.unlocked = true;
  }
  const preview = planned ? buildRuntimeOpponentPreview(planned) : null;
  row.enemies = (preview?.enemies || []).map((enemy, index) => index < Number(row.revealed || 0) ? enemy : null);
  return level === "one" ? "小道消息：已揭示一只宝可梦。" : "小道消息：已解锁这一场完整阵容。";
}

export function applyRuntimeReroute(run: CurrentRunData, battleNo: number, currentTrainer: TrainerNpcView, nextTrainer: TrainerNpcView, defaultBattles = DEFAULT_BATTLES): string {
  if (!hasTalent(run.talents, "intel_reroute")) throw new Error("需要天赋「公子驾到」。");
  if (Number(run.reroute_used || 0) >= REROUTE_LIMIT) throw new Error("本局改道次数已用尽。");
  const currentBattleNo = Math.max(0, Number(run.battle_no || Math.max(0, Number(run.next_battle || 1) - 1) || 0));
  const targetBattleNo = Math.max(1, Math.min(Number(run.battles || defaultBattles), Math.floor(Number(battleNo || run.next_battle || currentBattleNo + 1 || 1))));
  if (targetBattleNo <= currentBattleNo) throw new Error("已经挑战过的对手不能更换。");
  if (targetBattleNo > Number(run.battles || defaultBattles)) throw new Error("本局已经没有这场对战。");
  run.forced_trainer_ids = {...(run.forced_trainer_ids || {}), [String(targetBattleNo)]: nextTrainer.id};
  const history = Array.from(new Set([...(run.reroute_history?.[String(targetBattleNo)] || []), currentTrainer.id, nextTrainer.id].filter(Boolean)));
  run.reroute_history = {...(run.reroute_history || {}), [String(targetBattleNo)]: history};
  run.reroute_used = Number(run.reroute_used || 0) + 1;
  if (run.scout && Number(run.scout.title.match(/第\s*(\d+)/)?.[1] || 0) === targetBattleNo) delete run.scout;
  return `公子驾到：第 ${targetBattleNo} 场已改为 ${nextTrainer.name_zh}。`;
}

export function applyRuntimeNamedChampion(save: LocalSave, run: CurrentRunData, npcCatalog: TrainerNpcView[], trainerId: string | null): string {
  if (!hasTalent(run.talents, "intel_named_challenge")) throw new Error("需要天赋「指名挑战」。");
  const currentBattleNo = Math.max(0, Number(run.battle_no || Math.max(0, Number(run.next_battle || 1) - 1) || 0));
  if (currentBattleNo > 0 || Number(run.next_battle || 1) > 1) throw new Error("指名挑战只能在第一场对局前使用。");
  if (trainerId && !npcCatalog.some(entry => entry.type === "champion" && entry.id === trainerId)) throw new Error("只能指定冠军作为最终 Boss。");
  run.named_champion_id = trainerId;
  save.named_champion_id = trainerId;
  run.rest_status = {...(run.rest_status || {}), named_challenge_decided: true};
  const championName = trainerId ? npcCatalog.find(entry => entry.id === trainerId)?.name_zh || "指定 Boss" : "随机最终 Boss";
  return trainerId ? `指名挑战：最终 Boss 已指定为 ${championName}。` : "指名挑战：最终 Boss 已恢复随机。";
}

export function badgeLevelCapForTalents(talents: CurrentRunData["talents"] | undefined = []): number | null {
  const level = talentLevel(talents, "badge_level_cap");
  return level >= 2 ? BADGE_LEVEL_CAPS[2] : BADGE_LEVEL_CAPS[1];
}

export async function applyArrivalLevelCap(talents: CurrentRunData["talents"] | undefined, rawSet: PokemonSet, display: RentalPokemon, service: ArrivalLevelCapRuntimeService): Promise<{raw: PokemonSet; display: RentalPokemon; capped: boolean}> {
  const cap = badgeLevelCapForTalents(talents);
  if (!cap || Math.floor(Number(rawSet.level || display.level || 1)) <= cap) return {raw: rawSet, display, capped: false};
  const raw = {...rawSet, level: cap};
  const [described] = await service.describeTeam([raw]);
  return {raw, display: described || {...display, level: cap}, capped: true};
}

export async function applyArrivalLevelCapToTeam(talents: CurrentRunData["talents"] | undefined, team: PokemonSet[], display: RentalPokemon[], service: ArrivalLevelCapRuntimeService): Promise<{team: PokemonSet[]; display: RentalPokemon[]; capped: number}> {
  let capped = 0;
  const nextTeam: PokemonSet[] = [];
  const nextDisplay: RentalPokemon[] = [];
  for (let index = 0; index < team.length; index += 1) {
    const next = await applyArrivalLevelCap(talents, team[index], display[index], service);
    if (next.capped) capped += 1;
    nextTeam.push(next.raw);
    nextDisplay.push(next.display);
  }
  return {team: nextTeam, display: nextDisplay, capped};
}

export function shinyPokemon(pokemon: RentalPokemon): RentalPokemon {
  return {...pokemon, shiny: true};
}

export async function buildRainbowRocketFactorySupport(run: CurrentRunData, battleNo: number, options: RainbowRocketSupportRuntimeOptions): Promise<{team: PokemonSet[]; display: RentalPokemon[]}> {
  const count = Math.max(1, Math.floor(Number(options.factorySupportCount || RAINBOW_ROCKET_FACTORY_SUPPORT_COUNT)));
  const generated = await options.service.generateRentalCandidates(
    options.service.deriveSeed(Number(run.seed || 1), 0x9900 + battleNo),
    "gen9randombattle",
    count,
    {
      profiles: RAINBOW_ROCKET_FACTORY_SUPPORT_PROFILES.slice(0, count),
      purpose: "starter",
      battleSetting: run.battle_setting,
    },
  );
  const team = generated.team.slice(0, count);
  const display = generated.display.slice(0, count);
  ensureTeamRunMemberIds(team, display, options.uuid);
  return {team, display};
}

export function originalRouteSupportForBattle(run: CurrentRunData, battleNo: number): {team: PokemonSet[]; display: RentalPokemon[]; trainer?: TrainerNpcView} {
  const planned = (run.original_planned_battles || []).find(entry => Number(entry.battle_no) === battleNo);
  if (!planned) return {team: [], display: []};
  return {
    team: clone(planned.enemy_raw || []) as PokemonSet[],
    display: clone(planned.enemy_display || []) as RentalPokemon[],
    trainer: planned.enemy_trainer,
  };
}

export async function ensureRainbowRocketSupport(run: CurrentRunData, options: RainbowRocketSupportRuntimeOptions): Promise<boolean> {
  if (run.special_run !== "rainbow_rocket" || run.status !== "awaiting_rest") return false;
  const battleNo = Number(run.next_battle || (Number(run.battle_no || 0) + 1) || 1);
  const existing = run.rest_status?.rainbow_rocket_support;
  if (existing && Number(existing.battle_no) === battleNo) return false;
  const teamSize = Math.max(3, Math.floor(Number(options.teamSize || RAINBOW_ROCKET_TEAM_SIZE)));
  const pickLimit = Math.max(1, Math.floor(Number(options.supportPickLimit || RAINBOW_ROCKET_SUPPORT_PICK_LIMIT)));
  const factory = await buildRainbowRocketFactorySupport(run, battleNo, options);
  const route = originalRouteSupportForBattle(run, battleNo);
  const missing = Math.max(0, teamSize - (run.player_team || []).length);
  const support: RainbowRocketSupportState = {
    battle_no: battleNo,
    invasion: battleNo === 1 && Number(run.wins || 0) <= 0,
    completed: false,
    picks_used: 0,
    picks_required: Math.min(pickLimit, Math.max(1, missing)),
    max_team_size: teamSize,
    factory_team: factory.team,
    factory_display: factory.display,
    route_team: route.team,
    route_display: route.display,
    route_trainer: route.trainer,
  };
  run.rest_status = {...(run.rest_status || {}), rainbow_rocket_support: support};
  return true;
}

export function rainbowRocketSupportRequired(run: CurrentRunData, teamSize = RAINBOW_ROCKET_TEAM_SIZE): boolean {
  const support = run.rest_status?.rainbow_rocket_support;
  if (run.special_run !== "rainbow_rocket" || !support || support.completed) return false;
  if (support.invasion && (run.player_team || []).length < Math.max(3, teamSize)) return true;
  return Number(support.picks_used || 0) < Number(support.picks_required || 1);
}

export function applyRainbowRocketSupportChoice(save: LocalSave, run: CurrentRunData, action: Extract<RestAction, {type: "rainbow_rocket_support"}>, options: {
  uuid(): string;
  recordPokemonUsage?(save: LocalSave, pokemon: RentalPokemon): void;
}): string {
  if (run.special_run !== "rainbow_rocket") throw new Error("当前不是彩虹火箭队路线。");
  const support = run.rest_status?.rainbow_rocket_support;
  if (!support || support.completed) throw new Error("当前没有待处理的彩虹火箭队支援。");
  const rawPool = action.source === "route" ? support.route_team || [] : support.factory_team || [];
  const displayPool = action.source === "route" ? support.route_display || [] : support.factory_display || [];
  const candidateIndex = Math.floor(Number(action.candidateIndex));
  const candidateRaw = rawPool[candidateIndex];
  const candidateDisplay = displayPool[candidateIndex];
  if (!candidateRaw || !candidateDisplay) throw new Error("支援候选不存在。");
  const maxTeamSize = Math.max(3, Number(support.max_team_size || RAINBOW_ROCKET_TEAM_SIZE));
  const targetIndex = action.targetIndex === null || action.targetIndex === undefined ? null : Math.floor(Number(action.targetIndex));
  if (targetIndex !== null && (targetIndex < 0 || targetIndex >= run.player_team.length)) throw new Error("替换目标无效。");
  if (targetIndex === null && run.player_team.length >= maxTeamSize) throw new Error("队伍已满，请选择一名队员替换。");

  const nextRaw = clone(candidateRaw) as PokemonSet;
  const nextDisplay = clone(candidateDisplay) as RentalPokemon;
  const newMemberId = `rpm_${options.uuid()}`;
  nextRaw.run_member_id = newMemberId;
  nextDisplay.run_member_id = newMemberId;
  const slot = targetIndex ?? run.player_team.length;
  const oldShowdownId = targetIndex === null ? null : run.player_team[slot]?.showdown_id || run.player_display[slot]?.showdown_id || run.player_state?.[slot]?.showdown_id;
  const newShowdownId = targetIndex === null ? takeRunShowdownId(run) : takeReplacementRunShowdownId(run, slot, oldShowdownId);
  writePokemonShowdownId(nextRaw, nextDisplay, undefined, newShowdownId);

  run.player_team = [...(run.player_team || [])];
  run.player_display = [...(run.player_display || [])];
  if (targetIndex === null) {
    run.player_team.push(nextRaw);
    run.player_display.push(nextDisplay);
  } else {
    run.player_team[slot] = nextRaw;
    run.player_display[slot] = nextDisplay;
  }
  options.recordPokemonUsage?.(save, nextDisplay);
  run.bp_investments = [...(run.bp_investments || [])];
  run.move_investments = [...(run.move_investments || [])];
  run.bp_investments[slot] = 0;
  run.move_investments[slot] = [0, 0, 0, 0];
  const states = normalizePlayerState(run);
  states[slot] = fullStateForPokemon(nextDisplay, slot + 1);
  writePlayerSlotShowdownId(run, slot, states, newShowdownId);
  run.player_state = states;

  rawPool.splice(candidateIndex, 1);
  displayPool.splice(candidateIndex, 1);
  if (action.source === "route") {
    support.route_team = rawPool;
    support.route_display = displayPool;
  } else {
    support.factory_team = rawPool;
    support.factory_display = displayPool;
  }
  support.picks_used = Number(support.picks_used || 0) + 1;
  run.rest_status = {...(run.rest_status || {}), rainbow_rocket_support: support};
  return `${nextDisplay.species_zh || nextDisplay.species || "支援宝可梦"} 已加入彩虹火箭队反击队伍。`;
}

export function completeRainbowRocketSupport(run: CurrentRunData, teamSize = RAINBOW_ROCKET_TEAM_SIZE): void {
  if (run.special_run !== "rainbow_rocket") throw new Error("当前不是彩虹火箭队路线。");
  const support = run.rest_status?.rainbow_rocket_support;
  if (!support) throw new Error("当前没有待处理的彩虹火箭队支援。");
  if (support.invasion && (run.player_team || []).length < Number(support.max_team_size || teamSize)) throw new Error("彩虹火箭队入侵时必须先把队伍补到 6 只。");
  if (Number(support.picks_used || 0) < Number(support.picks_required || 1)) throw new Error("请先选择本次支援。");
  support.completed = true;
  run.rest_status = {...(run.rest_status || {}), rainbow_rocket_support: support};
}

export function applyRainbowRocketRestore(run: CurrentRunData, slots: number[], teamSize = RAINBOW_ROCKET_TEAM_SIZE): string {
  if (run.special_run !== "rainbow_rocket") throw new Error("当前不是彩虹火箭队路线。");
  const uniqueSlots = Array.from(new Set((slots || []).map(slot => Math.floor(Number(slot))).filter(slot => Number.isFinite(slot))));
  if (!uniqueSlots.length || uniqueSlots.length > 2) throw new Error("每次彩虹火箭队休整只能选择 1-2 只恢复。");
  const used = new Set((run.rest_status?.rainbow_rocket_restore_used || []).map(slot => Math.floor(Number(slot))).filter(slot => Number.isFinite(slot)));
  if (used.size + uniqueSlots.length > 2) throw new Error("本次休整的工厂治疗名额已经用完。");
  const states = normalizePlayerState(run);
  for (const slot of uniqueSlots) {
    if (slot < 0 || slot >= states.length || slot >= teamSize) throw new Error("队伍编号无效。");
    if (used.has(slot)) throw new Error("这只宝可梦本次休整已经恢复过。");
    const full = fullStateForPokemon(run.player_display[slot], slot + 1);
    const stableId = stablePlayerSlotShowdownId(run, slot, run.player_team[slot]?.showdown_id, run.player_display[slot]?.showdown_id, states[slot]?.showdown_id);
    states[slot] = {...full, active: states[slot]?.active || slot === 0};
    writePlayerSlotShowdownId(run, slot, states, stableId);
    used.add(slot);
  }
  run.player_state = states;
  run.rest_status = {...(run.rest_status || {}), rainbow_rocket_restore_used: Array.from(used).sort((a, b) => a - b)};
  return `工厂治疗完成：已恢复 ${uniqueSlots.length} 只宝可梦。`;
}

export function setRunLeadSlot(run: CurrentRunData, slot: number): void {
  const target = Math.floor(Number(slot));
  if (run.rest_status?.lead_change_used) throw new Error("本次休整已经调整过首发。");
  if (target < 0 || target >= (run.player_team || []).length) throw new Error("队伍编号无效。");
  const states = normalizePlayerState(run);
  if (states[target]?.fainted || Number(states[target]?.hp || 0) <= 0) throw new Error("濒死宝可梦不能设为首发。");
  for (const key of ["player_team", "player_display", "player_state", "bp_investments", "move_investments"] as const) {
    const values = [...(((run as unknown as Record<string, unknown[]>)[key]) || [])];
    if (target < values.length) [values[0], values[target]] = [values[target], values[0]];
    (run as unknown as Record<string, unknown[]>)[key] = values;
  }
  run.player_state = normalizePlayerState(run);
  run.rest_status = {...(run.rest_status || {}), lead_change_used: true};
}

export function fullStateForPokemon(pokemon: RentalPokemon, slot: number): PlayerPokemonState {
  const maxhp = Math.max(1, Number(pokemon.stats?.hp || 1));
  const showdownId = candidateShowdownId(pokemon.showdown_id) || SHOWDOWN_ID_POOL[Math.max(0, slot - 1)] || SHOWDOWN_ID_POOL[0];
  return {
    run_member_id: runMemberId(pokemon) || undefined,
    showdown_id: showdownId,
    slot,
    ident: `p1: ${pokemon.species || pokemon.name || slot}`,
    details: pokemon.species || pokemon.name || "",
    species: pokemon.species || pokemon.name || "",
    hp: maxhp,
    maxhp,
    status: "",
    fainted: false,
    active: slot === 1,
    item: toId(pokemon.item_id || pokemon.item),
    condition: `${maxhp}/${maxhp}`,
    moves: (pokemon.moves || []).map((move, index) => {
      const maxpp = Math.max(1, Math.floor(Number(move?.pp || 1) * 8 / 5));
      return {slot: index + 1, id: toId(move.id || move.name), move: move.name || move.id || "", pp: maxpp, maxpp};
    }),
  };
}

export function partialStateForPokemon(pokemon: RentalPokemon, slot: number, ratio: number): PlayerPokemonState {
  const state = fullStateForPokemon(pokemon, slot);
  const normalizedRatio = Math.max(0, Math.min(1, Number(ratio || 0)));
  state.hp = normalizedRatio >= 1 ? state.maxhp : Math.max(1, Math.floor(state.maxhp * normalizedRatio));
  state.moves = state.moves.map(move => ({...move, pp: normalizedRatio >= 1 ? move.maxpp : Math.max(1, Math.floor(move.maxpp * normalizedRatio))}));
  return refreshStateCondition(state);
}

export function stateCondition(state: PlayerPokemonState): string {
  const hp = Math.max(0, Number(state.hp || 0));
  const maxhp = Math.max(1, Number(state.maxhp || 1));
  if (hp <= 0) return "0 fnt";
  return `${hp}/${maxhp}${state.status ? ` ${state.status}` : ""}`;
}

export function refreshStateCondition(state: PlayerPokemonState): PlayerPokemonState {
  state.hp = Math.max(0, Math.min(Number(state.hp || 0), Number(state.maxhp || 1)));
  state.fainted = state.hp <= 0;
  if (state.fainted) state.status = "";
  state.condition = stateCondition(state);
  return state;
}

export function adjustedStateAfterEdit(oldState: PlayerPokemonState, newDisplay: RentalPokemon, slot: number): PlayerPokemonState {
  const next = fullStateForPokemon(newDisplay, slot);
  const oldMax = Math.max(1, Number(oldState.maxhp || next.maxhp || 1));
  const oldHp = Math.max(0, Number(oldState.hp || 0));
  const newMax = Math.max(1, Number(next.maxhp || 1));
  if (oldHp <= 0 || oldState.fainted) next.hp = 0;
  else if (oldHp >= oldMax) next.hp = newMax;
  else next.hp = Math.max(1, Math.min(newMax, Math.round(oldHp * newMax / oldMax)));
  next.status = oldState.status || "";
  const oldPp = new Map((oldState.moves || []).map(move => [toId(move.id || move.move), move]));
  next.moves = next.moves.map(move => {
    const previous = oldPp.get(move.id);
    return previous ? {...move, pp: Math.max(0, Math.min(Number(previous.pp ?? move.pp), move.maxpp))} : move;
  });
  return refreshStateCondition(next);
}

export function normalizeStatsInput(input: Record<string, number> | undefined, defaultValue: number): Record<string, number> {
  return Object.fromEntries(STAT_IDS.map(stat => [stat, Number(input?.[stat] ?? defaultValue)]));
}

function isStatId(value: unknown): value is StatId {
  return (STAT_IDS as readonly string[]).includes(String(value || ""));
}

function statZh(stat: StatId): string {
  return ({hp: "HP", atk: "攻击", def: "防御", spa: "特攻", spd: "特防", spe: "速度"} satisfies Record<StatId, string>)[stat];
}

export function validateStatAdjustments(rawSet: PokemonSet, options: PokemonEditOptions): void {
  const ivs = normalizeStatsInput(rawSet.ivs, 31);
  const evs = normalizeStatsInput(rawSet.evs, 0);
  for (const stat of STAT_IDS) {
    if (ivs[stat] < 0 || ivs[stat] > 31) throw new Error("个体值必须在 0-31 之间。");
    if (evs[stat] < 0 || evs[stat] > 255) throw new Error("努力值单项必须在 0-255 之间。");
  }
  const evTotal = STAT_IDS.reduce((sum, stat) => sum + Number(evs[stat] || 0), 0);
  if (evTotal > 510) throw new Error(`努力值总和 ${evTotal} 超过 510。`);
  const abilityIds = new Set(options.abilities.map(ability => toId(ability.name || ability.id)));
  if (abilityIds.size && !abilityIds.has(toId(rawSet.ability))) throw new Error("特性不是该宝可梦的合法特性。");
  const natureIds = new Set(options.natures.map(nature => toId(nature.name)));
  if (natureIds.size && !natureIds.has(toId(rawSet.nature || "Serious"))) throw new Error("性格不是合法性格。");
}

function ensureTeamRunMemberIds(team: PokemonSet[] = [], display: RentalPokemon[] = [], uuid: () => string): void {
  const length = Math.max(team.length, display.length);
  for (let index = 0; index < length; index += 1) {
    const raw = team[index] as PokemonSet | undefined;
    const shown = display[index] as RentalPokemon | undefined;
    const id = runMemberId(raw) || runMemberId(shown) || `rpm_${uuid()}`;
    if (raw) raw.run_member_id = id;
    if (shown) shown.run_member_id = id;
  }
}

export function normalizePlayerState(run: CurrentRunData): PlayerPokemonState[] {
  const display = run.player_display || [];
  const existing = run.player_state || [];
  return display.map((pokemon, index) => {
    const current = existing[index];
    if (!current) return fullStateForPokemon(pokemon, index + 1);
    return {...fullStateForPokemon(pokemon, index + 1), ...current, slot: index + 1};
  });
}

function rememberRunBagItemMeta(run: CurrentRunData, item: Partial<ShopOffer> | ShopItem): void {
  const id = itemKey(item.id || item.name);
  if (!id) return;
  run.bag_item_meta = {
    ...(run.bag_item_meta || {}),
    [id]: {
      id,
      name: item.name,
      name_zh: item.name_zh,
      desc: item.desc,
      desc_zh: item.desc_zh,
      cost: Math.max(0, Number(item.cost || 0)),
      icon_asset: item.icon_asset,
      category: (item as Partial<ShopOffer>).category,
      move_id: (item as Partial<ShopOffer>).move_id,
      move_name: (item as Partial<ShopOffer>).move_name,
      move_name_zh: (item as Partial<ShopOffer>).move_name_zh,
    },
  };
}

function addRunExchangeBox(run: CurrentRunData, raw: PokemonSet[], display: RentalPokemon[], states?: PlayerPokemonState[]): void {
  run.exchange_box = {
    team: [...(run.exchange_box?.team || []), ...clone(raw)],
    display: [...(run.exchange_box?.display || []), ...clone(display)],
    state: [...(run.exchange_box?.state || []), ...clone(states || [])],
  };
}

function recordRunPokemonUsage(save: LocalSave, pokemon: RentalPokemon): void {
  const key = toId(pokemon.species_id || pokemon.species || pokemon.name);
  if (!key) return;
  save.stats = {...(save.stats || {})};
  save.stats.pokemon_usage_counts = {
    ...(save.stats.pokemon_usage_counts || {}),
    [key]: Number(save.stats.pokemon_usage_counts?.[key] || 0) + 1,
  };
}

function stablePlayerSlotShowdownId(run: CurrentRunData, slot: number, ...fallbacks: unknown[]): string {
  return candidateShowdownId(...fallbacks, run.player_team?.[slot]?.showdown_id, run.player_display?.[slot]?.showdown_id, run.player_state?.[slot]?.showdown_id, run.player_team?.[slot]?.pokeball)
    || takeRunShowdownId(run);
}

function writePlayerSlotShowdownId(run: CurrentRunData, slot: number, states?: PlayerPokemonState[], id?: string): string {
  const stableId = id || stablePlayerSlotShowdownId(run, slot, states?.[slot]?.showdown_id);
  writePokemonShowdownId(run.player_team?.[slot], run.player_display?.[slot], states?.[slot], stableId);
  return stableId;
}

function writePokemonShowdownId(raw: PokemonSet | undefined, display: RentalPokemon | undefined, state: PlayerPokemonState | undefined, id: string): void {
  if (raw) {
    raw.showdown_id = id;
    raw.pokeball = id;
  }
  if (display) display.showdown_id = id;
  if (state) state.showdown_id = id;
}

function assignEnemyShowdownIds(team: PokemonSet[] = [], display: RentalPokemon[] = []): void {
  const used = new Set<string>();
  const queue = [...SHOWDOWN_ID_POOL];
  const length = Math.max(team.length, display.length);
  for (let index = 0; index < length; index += 1) {
    const id = nextPoolId(queue, used);
    used.add(id);
    writePokemonShowdownId(team[index], display[index], undefined, id);
  }
}

function takeRunShowdownId(run: CurrentRunData): string {
  normalizeRunShowdownIdPool(run);
  const used = new Set((run.showdown_id_pool?.used || []).map(candidateShowdownId).filter(Boolean));
  const available = [...(run.showdown_id_pool?.available || [])].map(candidateShowdownId).filter(Boolean);
  const id = nextPoolId(available, used);
  used.add(id);
  run.showdown_id_pool = {used: Array.from(used), available: available.filter(value => value !== id)};
  return id;
}

export function takeReplacementRunShowdownId(run: CurrentRunData, slot: number, oldId: unknown): string {
  normalizeRunShowdownIdPool(run);
  const released = candidateShowdownId(oldId);
  const used = new Set<string>();
  const length = Math.max(run.player_team?.length || 0, run.player_display?.length || 0, run.player_state?.length || 0);
  for (let index = 0; index < length; index += 1) {
    if (index === slot) continue;
    const id = candidateShowdownId(run.player_team?.[index]?.showdown_id, run.player_display?.[index]?.showdown_id, run.player_state?.[index]?.showdown_id, run.player_team?.[index]?.pokeball);
    if (id) used.add(id);
  }
  const available = [...(run.showdown_id_pool?.available || []), ...SHOWDOWN_ID_POOL]
    .map(candidateShowdownId)
    .filter(id => id && !used.has(id) && id !== released);
  const queue = Array.from(new Set(available));
  const id = nextPoolId(queue, used);
  used.add(id);
  const rest = [...queue, ...SHOWDOWN_ID_POOL]
    .map(candidateShowdownId)
    .filter(value => value && !used.has(value) && value !== released);
  const uniqueRest = Array.from(new Set(rest));
  if (released && !used.has(released)) uniqueRest.push(released);
  run.showdown_id_pool = {used: Array.from(used), available: uniqueRest};
  return id;
}

function normalizeRunShowdownIdPool(run: CurrentRunData): void {
  const preferredQueue = [
    ...(run.showdown_id_pool?.available || []),
    ...SHOWDOWN_ID_POOL,
  ].map(candidateShowdownId).filter(Boolean);
  const queue = Array.from(new Set(preferredQueue));
  const used = new Set<string>();
  const length = Math.max(run.player_team?.length || 0, run.player_display?.length || 0, run.player_state?.length || 0);
  for (let index = 0; index < length; index += 1) {
    const raw = run.player_team?.[index];
    const display = run.player_display?.[index];
    const state = run.player_state?.[index];
    let id = candidateShowdownId(raw?.showdown_id, display?.showdown_id, state?.showdown_id, raw?.pokeball);
    if (!id || used.has(id)) id = nextPoolId(queue, used);
    used.add(id);
    writePokemonShowdownId(raw, display, state, id);
  }
  const available = [...queue, ...SHOWDOWN_ID_POOL].map(candidateShowdownId).filter(id => id && !used.has(id));
  run.showdown_id_pool = {used: Array.from(used), available: Array.from(new Set(available))};
}

function nextPoolId(queue: string[], used: Set<string>): string {
  while (queue.length) {
    const id = candidateShowdownId(queue.shift());
    if (id && !used.has(id)) return id;
  }
  const fallback = SHOWDOWN_ID_POOL.find(id => !used.has(id));
  if (!fallback) throw new Error("Showdown ID 池已耗尽。");
  return fallback;
}

function candidateShowdownId(...values: unknown[]): string {
  for (const value of values) {
    const id = String(value || "").trim().toLowerCase();
    if (id && (SHOWDOWN_ID_POOL as readonly string[]).includes(id)) return id;
  }
  return "";
}

function runMemberId(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const id = (value as {run_member_id?: unknown}).run_member_id;
  return typeof id === "string" && id.trim() ? id : "";
}

function damagePartyFraction(run: CurrentRunData, fraction: number): number {
  const states = normalizePlayerState(run);
  let affected = 0;
  for (const state of states) {
    if (state.fainted || Number(state.hp || 0) <= 0) continue;
    const loss = Math.max(1, Math.floor(Number(state.hp || 0) * Math.max(0, Math.min(1, fraction))));
    state.hp = Math.max(1, Number(state.hp || 0) - loss);
    refreshStateCondition(state);
    affected += 1;
  }
  run.player_state = states;
  return affected;
}

function stableRestEventShuffle<T extends {id?: string}>(values: T[], seed: string): T[] {
  return values
    .map((value, index) => ({value, weight: stableRestEventHash(`${seed}:${value.id || index}`)}))
    .sort((a, b) => a.weight - b.weight)
    .map(entry => entry.value);
}

function stableRestEventHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function simpleRestHash(...values: Array<string | number>): number {
  return stableRestEventHash(values.join(":"));
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
