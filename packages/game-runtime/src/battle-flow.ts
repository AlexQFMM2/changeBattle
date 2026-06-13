import type {BattleBackgroundView, BattleRecordEntry, BattleRequestView, BattleSetting, BattleState, BossDexRecord, CurrentRunData, LocalSave, PlannedBattleData, PlayerPokemonState, PokemonSet, RentalPokemon, ResultPokemonStatEvent, ResultPokemonSummary, ResultSummaryState, TrainerNpcType, TrainerNpcView, TrainerProfile} from "@changebattle/shared";
import {DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";
import {WIN_BP_REWARD, addBattleRewardCoins, addCoins, emptyStats, hasTalent, itemKey, refreshStats, toId} from "./run-rules.js";
import {fullStateForPokemon, refreshStateCondition} from "./rest-flow.js";

export const VILLAIN_INTRUSION_BONUS_COINS = 500;
export const RAINBOW_ROCKET_REWARD_COINS = 2000;

export type RuntimeBattleRoute = {
  type: PlannedBattleData["route_type"];
  stage: string;
  route: string;
  pool: Array<{type: TrainerNpcType; tier?: string}>;
};

export type PreparedBattleStart<TBossTeam = unknown> =
  | {status: "no_run"; message: string}
  | {status: "completed"; run: CurrentRunData; battleNo: number; totalBattles: number}
  | {
      status: "battle";
      run: CurrentRunData;
      battleNo: number;
      totalBattles: number;
      planned: PlannedBattleData;
      enemyTrainer: TrainerNpcView;
      enemyTeam: PokemonSet[];
      enemyDisplay: RentalPokemon[];
      route: RuntimeBattleRoute;
      bossTeam: TBossTeam | null;
      label: string;
      message: string;
    };

export type RuntimeBattleSessionOptions<TEnemyAi = unknown> = {
  playerTeam: PokemonSet[];
  enemyTeam: PokemonSet[];
  playerDisplay: RentalPokemon[];
  enemyDisplay: RentalPokemon[];
  playerState?: PlayerPokemonState[];
  seed: number | number[];
  battleSetting?: BattleSetting;
  enemyAi?: TEnemyAi;
};

export type RunRestStatusCarry = NonNullable<CurrentRunData["rest_status"]>;

export type BasicBattleSettlement =
  | {outcome: "loss"; run: CurrentRunData; message: string}
  | {outcome: "completed"; run: CurrentRunData; wins: number; message: string; coinsEarned: number; stalwartRecovered: boolean}
  | {outcome: "rest"; run: CurrentRunData; wins: number; message: string; coinsEarned: number; stalwartRecovered: boolean};

export type RuntimeExchangeResult = {
  run: CurrentRunData;
  ownIndex: number;
  enemyIndex: number;
  received: RentalPokemon;
};

export type RuntimeBossDexTeamRow = {
  pool_id?: string;
  battle_rule_preset?: string;
  team_index: number;
  slot: number;
  species_id: string;
};

export type RuntimeBossDexTeamSelection = {
  rows: RuntimeBossDexTeamRow[];
};

export type RuntimeTrainerItemChoice = {
  itemId: string;
  slot: number;
  moveSlot?: number;
};

export type RuntimeTrainerItemUse = RuntimeTrainerItemChoice & {
  recoveryMultiplier: number;
};

export type RuntimeBattleSessionLike = {
  getState(): BattleState;
  getPlayerState(): PlayerPokemonState[];
  getEnemyState(): PlayerPokemonState[];
  choose(choice: string): Promise<BattleState>;
  forfeit(): BattleState;
  chooseTrainerItem(itemId: string, slot: number, moveSlot?: number, recoveryMultiplier?: number): Promise<BattleState>;
  advanceIfWaiting(): Promise<BattleState>;
};

export type RuntimeBattleChoiceResult = {
  state: BattleState;
  shouldPersist: boolean;
};

export type RuntimeBattleCommandOutcome =
  | {status: "ongoing"; state: BattleState; shouldPersist: boolean}
  | {status: "finished"; state: BattleState; shouldPersist: boolean};

export type RuntimeFinishedBattlePerspective = {
  soulSwapActive: boolean;
  playerState: PlayerPokemonState[];
  enemyState: PlayerPokemonState[];
  playerWonByBattleState: boolean;
  enemyTeam: PokemonSet[];
  enemyDisplay: RentalPokemon[];
  exchangeTeam: PokemonSet[];
  exchangeDisplay: RentalPokemon[];
};

export type RuntimeBattleWinRestTransitionOptions = {
  battleNo?: number;
  wins?: number;
  enemyTeam?: PokemonSet[];
  enemyDisplay?: RentalPokemon[];
  coinsEarned?: number;
  bpEarned?: number;
  restStatus?: CurrentRunData["rest_status"];
};

export async function prepareStartBattleRun<TBossTeam = unknown>(options: {
  save: LocalSave;
  defaultBattles: number;
  normalizeCurrentRun(run: CurrentRunData): CurrentRunData;
  buildPlannedBattles(save: LocalSave, run: CurrentRunData): Promise<PlannedBattleData[]>;
  trainerFromProfile(profile: TrainerProfile): TrainerNpcView;
  battleBackgroundForRun(run: CurrentRunData, trainer: TrainerNpcView, battleNo: number): BattleBackgroundView;
  bossTeamForPlanned?(planned: PlannedBattleData, run: CurrentRunData, battleNo: number): TBossTeam | null;
}): Promise<PreparedBattleStart<TBossTeam>> {
  const run = options.save.current_run as CurrentRunData | null;
  if (!run) return {status: "no_run", message: "当前没有进行中的挑战。"};
  options.normalizeCurrentRun(run);
  const battleNo = Number(run.next_battle || 1);
  const totalBattles = Number(run.battles || options.defaultBattles);
  if (battleNo > totalBattles) return {status: "completed", run, battleNo, totalBattles};
  if (!run.planned_battles?.length) run.planned_battles = await options.buildPlannedBattles(options.save, run);
  const planned = run.planned_battles.find(entry => Number(entry.battle_no) === battleNo);
  if (!planned) throw new Error(`缺少第 ${battleNo} 场预生成 NPC 数据。`);

  const enemyTrainer = planned.enemy_trainer;
  const enemyTeam = clone(planned.enemy_raw || []) as PokemonSet[];
  const enemyDisplay = clone(planned.enemy_display || []) as RentalPokemon[];
  const route: RuntimeBattleRoute = {type: planned.route_type, stage: planned.route_stage, route: planned.route_route, pool: []};
  const bossTeam = options.bossTeamForPlanned?.(planned, run, battleNo) ?? null;

  run.boss_type = planned.route_type;
  run.special_event = planned.special_event;
  run.boss_stage = planned.route_stage;
  run.boss_route = planned.route_route;
  run.enemy_team_pool_id = planned.enemy_team_pool_id;
  run.generation_stage = planned.generation_stage;
  run.player_trainer = options.trainerFromProfile(options.save.trainer);
  run.enemy_trainer = enemyTrainer;
  run.battle_background = planned.battle_background || options.battleBackgroundForRun(run, enemyTrainer, battleNo);
  run.status = "in_battle";
  run.battle_no = battleNo;
  run.next_battle = battleNo;
  activatePendingRestEvents(run);
  delete run.enemy_boss_record;
  run.enemy_raw = enemyTeam;
  run.enemy_display = enemyDisplay;

  const label = battleLabel(planned, run);
  return {
    status: "battle",
    run,
    battleNo,
    totalBattles,
    planned,
    enemyTrainer,
    enemyTeam,
    enemyDisplay,
    route,
    bossTeam,
    label,
    message: `第 ${battleNo}/${totalBattles} 场：${label} ${enemyTrainer.name_zh}`,
  };
}

export function buildStartBattleSessionOptions<TEnemyAi>(prepared: Extract<PreparedBattleStart, {status: "battle"}>, options: {
  run?: CurrentRunData;
  soulSwapActive?: boolean;
  playerState?: PlayerPokemonState[];
  seed: number | number[];
  enemyAi?: TEnemyAi;
}): RuntimeBattleSessionOptions<TEnemyAi> {
  const run = options.run || prepared.run;
  const soulSwapActive = Boolean(options.soulSwapActive);
  return {
    playerTeam: soulSwapActive ? prepared.enemyTeam : run.player_team,
    enemyTeam: soulSwapActive ? run.player_team : prepared.enemyTeam,
    playerDisplay: soulSwapActive ? prepared.enemyDisplay : run.player_display,
    enemyDisplay: soulSwapActive ? run.player_display : prepared.enemyDisplay,
    playerState: soulSwapActive ? undefined : options.playerState,
    seed: options.seed,
    battleSetting: run.battle_setting,
    enemyAi: options.enemyAi,
  };
}

export function assertBattleChoiceAllowed(choice: string, run: CurrentRunData, state: Pick<BattleState, "request"> | BattleRequestView | null | undefined): void {
  const request = isBattleRequestView(state) ? state : state?.request;
  if (battleRequestRequiresForcedSwitch(request)) {
    if (!/^switch\s+\d+/i.test(choice) && !/^default$/i.test(choice)) throw new Error("当前必须换人，不能使用招式或道具。");
    return;
  }
  const setting = normalizeBattleSetting(run.battle_setting || DEFAULT_BATTLE_SETTING);
  const zMoveMatch = choice.match(/^move\s+(\d+)\s+zmove$/i);
  if (zMoveMatch) {
    if (!setting.enabled_battle_systems.includes("zmove")) throw new Error("本局未开启 Z 招式系统。");
    const moveSlot = Math.max(1, Math.floor(Number(zMoveMatch[1] || 0)));
    const canZMove = request?.active?.[0]?.canZMove || [];
    if (!canZMove.some(Boolean)) throw new Error("当前没有可用的 Z 招式。");
    if (!canZMove[moveSlot - 1]) throw new Error("这个技能不能升级为 Z 招式。");
  }
  const megaMatch = choice.match(/^move\s+(\d+)\s+mega$/i);
  if (megaMatch) {
    if (!setting.enabled_battle_systems.includes("mega")) throw new Error("本局未开启 Mega 系统。");
    const moveSlot = Math.max(1, Math.floor(Number(megaMatch[1] || 0)));
    const active = request?.active?.[0];
    const move = active?.moves?.[moveSlot - 1];
    if (!active?.canMegaEvo) throw new Error("当前没有可用的 Mega 进化。");
    if (!move || move.disabled) throw new Error("这个技能不能用于 Mega 进化回合。");
  }
  const maxMatch = choice.match(/^move\s+(\d+)\s+max$/i);
  if (maxMatch) {
    if (setting.battle_rule_preset !== "gen8" || !setting.enabled_battle_systems.includes("dynamax")) throw new Error("本局未开启极巨化系统。");
    const moveSlot = Math.max(1, Math.floor(Number(maxMatch[1] || 0)));
    const active = request?.active?.[0];
    const move = active?.moves?.[moveSlot - 1];
    if (!active?.canDynamax) throw new Error("当前不能进行极巨化。");
    if (!move || move.disabled) throw new Error("这个技能不能用于极巨化回合。");
  }
  const teraMatch = choice.match(/^move\s+(\d+)\s+terastallize$/i);
  if (teraMatch) {
    if (setting.battle_rule_preset !== "gen9" || !setting.enabled_battle_systems.includes("terastal")) throw new Error("本局未开启太晶化系统。");
    const moveSlot = Math.max(1, Math.floor(Number(teraMatch[1] || 0)));
    const active = request?.active?.[0];
    const move = active?.moves?.[moveSlot - 1];
    if (!active?.canTerastallize) throw new Error("当前不能进行太晶化。");
    if (!move || move.disabled) throw new Error("这个技能不能用于太晶化回合。");
  }
}

export function battleRequestRequiresForcedSwitch(request: BattleRequestView | null | undefined): boolean {
  return Boolean(request?.forceSwitch?.some(Boolean));
}

export function parseTrainerItemChoice(choice: string): RuntimeTrainerItemChoice | null {
  if (!choice.startsWith("item ")) return null;
  const [, itemId, slotRaw, moveSlotRaw] = choice.split(/\s+/);
  const normalizedItem = itemKey(itemId);
  if (!normalizedItem) throw new Error("道具编号无效。");
  return {
    itemId: normalizedItem,
    slot: Math.max(0, Number(slotRaw || 1) - 1),
    moveSlot: moveSlotRaw ? Number(moveSlotRaw) : undefined,
  };
}

export async function prepareTrainerItemUse(run: CurrentRunData, choice: string, options: {
  playerStateLength: number;
  hasConsumableItemEffect(itemId: string): Promise<boolean> | boolean;
  isHpStatusReviveRecoveryItem?(itemId: string): Promise<boolean> | boolean;
}): Promise<RuntimeTrainerItemUse | null> {
  const parsed = parseTrainerItemChoice(choice);
  if (!parsed) return null;
  if (parsed.slot < 0 || parsed.slot >= options.playerStateLength) throw new Error("队伍编号无效。");
  const count = Number(run.bag_items?.[parsed.itemId] || 0);
  if (count <= 0) throw new Error("背包里没有这个道具。");
  if (!(await options.hasConsumableItemEffect(parsed.itemId))) throw new Error("这个道具不能在战斗中主动使用。");
  if (
    run.rest_status?.event_next_battle_healing_blocked
    && options.isHpStatusReviveRecoveryItem
    && await options.isHpStatusReviveRecoveryItem(parsed.itemId)
  ) {
    throw new Error("恢复道具受到诅咒，下一场战斗中不能使用。");
  }
  run.bag_items = {...(run.bag_items || {}), [parsed.itemId]: count - 1};
  if (!run.bag_items[parsed.itemId]) {
    delete run.bag_items[parsed.itemId];
    if (run.bag_item_meta) delete run.bag_item_meta[parsed.itemId];
  }
  const locked = Number(run.non_refundable_bag_items?.[parsed.itemId] || 0);
  if (locked > 0) {
    run.non_refundable_bag_items = {...(run.non_refundable_bag_items || {}), [parsed.itemId]: locked - 1};
    if (!run.non_refundable_bag_items[parsed.itemId]) delete run.non_refundable_bag_items[parsed.itemId];
  }
  return {
    ...parsed,
    recoveryMultiplier: Math.max(0, Number(run.rest_status?.event_recovery_multiplier || 1)),
  };
}

export async function executeBattleChoice(run: CurrentRunData, session: RuntimeBattleSessionLike, choice: string, options: {
  hasConsumableItemEffect(itemId: string): Promise<boolean> | boolean;
  isHpStatusReviveRecoveryItem?(itemId: string): Promise<boolean> | boolean;
}): Promise<RuntimeBattleChoiceResult> {
  assertBattleChoiceAllowed(choice, run, session.getState());
  if (choice.startsWith("item ")) {
    const itemUse = await prepareTrainerItemUse(run, choice, {
      playerStateLength: session.getPlayerState().length,
      hasConsumableItemEffect: options.hasConsumableItemEffect,
      isHpStatusReviveRecoveryItem: options.isHpStatusReviveRecoveryItem,
    });
    if (!itemUse) throw new Error("战斗道具指令无效。");
    const state = await session.chooseTrainerItem(itemUse.itemId, itemUse.slot, itemUse.moveSlot, itemUse.recoveryMultiplier);
    run.rest_status = {
      ...(run.rest_status || {}),
      battle_item_uses_current: Math.max(0, Math.floor(Number(run.rest_status?.battle_item_uses_current || 0))) + 1,
    };
    run.player_state = session.getPlayerState();
    return {state, shouldPersist: true};
  }
  return {
    state: choice === "forfeit" ? session.forfeit() : await session.choose(choice),
    shouldPersist: false,
  };
}

export async function executeBattleAutoAdvance(session: RuntimeBattleSessionLike): Promise<BattleState> {
  return session.advanceIfWaiting();
}

export function resolveBattleCommandOutcome(result: RuntimeBattleChoiceResult | BattleState, shouldPersist = false): RuntimeBattleCommandOutcome {
  const state = "state" in result ? result.state : result;
  const persist = "shouldPersist" in result ? result.shouldPersist : shouldPersist;
  return state.ended ? {status: "finished", state, shouldPersist: persist} : {status: "ongoing", state, shouldPersist: persist};
}

export function finishedBattlePerspective(run: CurrentRunData, state: BattleState, session: Pick<RuntimeBattleSessionLike, "getPlayerState" | "getEnemyState">): RuntimeFinishedBattlePerspective {
  const soulSwapActive = Boolean(run.rest_status?.event_soul_swap_active);
  const playerState = soulSwapActive ? session.getEnemyState() : session.getPlayerState();
  const enemyState = soulSwapActive ? session.getPlayerState() : session.getEnemyState();
  const enemyTeam = soulSwapActive ? (state.player_team || run.enemy_raw || []) : (state.enemy_team || run.enemy_raw || []);
  const enemyDisplay = soulSwapActive ? (state.player_display || run.enemy_display || []) : (state.enemy_display || run.enemy_display || []);
  return {
    soulSwapActive,
    playerState,
    enemyState,
    playerWonByBattleState: soulSwapActive ? state.winner !== "Player" : state.winner === "Player",
    enemyTeam,
    enemyDisplay,
    exchangeTeam: enemyTeam,
    exchangeDisplay: enemyDisplay,
  };
}

export function applyFinishedBattlePerspectiveToRun(run: CurrentRunData, perspective: RuntimeFinishedBattlePerspective): CurrentRunData {
  run.player_state = perspective.playerState;
  run.enemy_raw = perspective.enemyTeam;
  run.enemy_display = perspective.enemyDisplay;
  return run;
}

export function rememberRunForSoulmate(save: LocalSave, run: CurrentRunData): void {
  save.run_memory = {
    player_species_ids: Array.from(new Set((run.player_team || []).map(pokemon => toId(pokemon.species || pokemon.name)).filter(Boolean))).slice(0, 6),
    enemy_species_ids: Array.from(new Set((run.enemy_raw || []).map(pokemon => toId(pokemon.species || pokemon.name)).filter(Boolean))).slice(0, 6),
  };
}

function normalizedRunPlayerState(run: CurrentRunData): PlayerPokemonState[] {
  const existing = run.player_state || [];
  const display = run.player_display || [];
  if (!display.length) return existing;
  return display.map((pokemon, index) => ({...fullStateForPokemon(pokemon, index + 1), ...(existing[index] || {}), slot: index + 1}));
}

export function applyStalwartRecovery(run: CurrentRunData): boolean {
  if (!hasTalent(run.talents, "exchange_stalwart")) return false;
  const states = normalizedRunPlayerState(run);
  let changed = false;
  for (const state of states) {
    const maxhp = Math.max(1, Number(state.maxhp || 1));
    const hp = Math.max(0, Number(state.hp || 0));
    const targetHp = hp > 0 && !state.fainted
      ? Math.max(hp, Math.ceil(maxhp / 2))
      : Math.max(1, Math.ceil(maxhp / 4));
    if (targetHp !== hp || state.fainted) {
      state.hp = Math.min(maxhp, targetHp);
      state.fainted = false;
      changed = true;
    }
    refreshStateCondition(state);
  }
  run.player_state = states;
  return changed;
}

export function applyBattleWinRestTransition(run: CurrentRunData, options: RuntimeBattleWinRestTransitionOptions = {}): CurrentRunData {
  const battleNo = Math.max(1, Math.floor(Number(options.battleNo ?? run.battle_no ?? 1)));
  const wins = Math.max(0, Math.floor(Number(options.wins ?? Number(run.wins || 0) + 1)));
  run.status = "awaiting_rest";
  run.battle_no = battleNo;
  run.next_battle = battleNo + 1;
  run.wins = wins;
  run.special_event = undefined;
  run.enemy_raw = options.enemyTeam || run.enemy_raw || [];
  run.enemy_display = options.enemyDisplay || run.enemy_display || [];
  run.coins_earned_this_run = Number(run.coins_earned_this_run || 0) + Math.max(0, Math.floor(Number(options.coinsEarned || 0)));
  run.bp_earned_this_run = Number(run.bp_earned_this_run || 0) + Math.max(0, Math.floor(Number(options.bpEarned || 0)));
  if (options.restStatus) run.rest_status = options.restStatus;
  if (run.rest_status) delete run.rest_status.battle_item_uses_current;
  return run;
}

export function prepareRunForNextBattleAfterRest(run: CurrentRunData, options: {
  carryRestStatus?: Partial<RunRestStatusCarry>;
  battleNo?: number;
} = {}): CurrentRunData {
  const battleNo = Number(options.battleNo ?? run.battle_no ?? 0);
  const nextRun: CurrentRunData = {
    ...run,
    status: "ready",
    next_battle: battleNo + 1,
    rest_status: {exchanges: 0, taken_enemy_slots: [], ...(options.carryRestStatus || {})},
  };
  clearBattleScopedRunFields(nextRun);
  delete nextRun.rest_status?.rainbow_rocket_support;
  delete nextRun.rest_status?.rainbow_rocket_restore_used;
  return nextRun;
}

export function clearBattleScopedRunFields(run: CurrentRunData): CurrentRunData {
  delete run.battle_no;
  delete run.enemy_raw;
  delete run.enemy_display;
  delete run.enemy_trainer;
  delete run.enemy_boss_record;
  delete run.battle_background;
  delete run.boss_type;
  delete run.special_event;
  delete run.boss_stage;
  delete run.boss_route;
  delete run.enemy_team_pool_id;
  delete run.generation_stage;
  return run;
}

export function settleBasicBattleResult(save: LocalSave, run: CurrentRunData, state: BattleState, options: {
  playerState?: PlayerPokemonState[];
  playerWon?: boolean;
  defaultBattles: number;
  rewardCoins?: number;
  winMessage?: (wins: number, coinsEarned: number) => string;
  lossMessage?: string;
  completedMessage?: (wins: number, coinsEarned: number) => string;
}): BasicBattleSettlement {
  if (options.playerState) run.player_state = options.playerState;
  const playerWon = options.playerWon ?? state.winner === "Player";
  const rewardCoins = Math.max(0, Math.floor(Number(options.rewardCoins ?? WIN_BP_REWARD)));
  const gainedBattleCoins = recordBattleOutcomeStats(save, playerWon ? "Player" : state.winner === "tie" ? "tie" : "Enemy", run, {recordTrainerDex: false, winReward: rewardCoins});
  if (!playerWon) {
    rememberRunForSoulmate(save, run);
    save.current_run = null;
    return {outcome: "loss", run, message: options.lossMessage || "挑战失败。"};
  }
  const battleNo = Number(run.battle_no || 1);
  const wins = Number(run.wins || 0) + 1;
  const stalwartRecovered = applyStalwartRecovery(run);
  run.wins = wins;
  run.enemy_raw = state.enemy_team || run.enemy_raw;
  run.enemy_display = state.enemy_display || run.enemy_display;
  if (battleNo >= Number(run.battles || options.defaultBattles)) {
    rememberRunForSoulmate(save, run);
    save.current_run = null;
    return {outcome: "completed", run, wins, coinsEarned: gainedBattleCoins, stalwartRecovered, message: options.completedMessage?.(wins, gainedBattleCoins) || `挑战通关，完成 ${wins} 连胜。`};
  }
  save.current_run = applyBattleWinRestTransition(run, {
    battleNo,
    wins,
    enemyTeam: state.enemy_team || run.enemy_raw,
    enemyDisplay: state.enemy_display || run.enemy_display,
    coinsEarned: gainedBattleCoins,
  });
  return {outcome: "rest", run, wins, coinsEarned: gainedBattleCoins, stalwartRecovered, message: options.winMessage?.(wins, gainedBattleCoins) || `对局胜利。当前连胜：${wins}`};
}

export function recordBattleOutcomeStats(save: LocalSave, winner: string | null, run?: CurrentRunData, options: {
  winReward?: number;
  recordTrainerDex?: boolean;
  now?: string;
} = {}): number {
  const stats = {...emptyStats(), ...(save.stats || {})};
  stats.battles = Number(stats.battles || 0) + 1;
  let gained = 0;
  if (winner === "Player") {
    stats.wins = Number(stats.wins || 0) + 1;
    save.stats = stats;
    void save;
    gained = addBattleRewardCoins(run, options.winReward ?? WIN_BP_REWARD);
    refreshStats(save);
  } else {
    stats.losses = Number(stats.losses || 0) + 1;
    if (run?.special_run !== "rainbow_rocket") stats.set_win_streak = 0;
    save.stats = stats;
    refreshStats(save);
  }
  if (run && options.recordTrainerDex !== false) {
    const record = recordTrainerDexResult(save, run.enemy_trainer, winner === "Player" ? "win" : "loss", {now: options.now});
    if (record) run.enemy_boss_record = record;
  }
  return gained;
}

export function battleSpecialRewardCoins(run: CurrentRunData): number {
  return (run.special_event === "villain_intrusion" ? VILLAIN_INTRUSION_BONUS_COINS : 0)
    + (run.special_run === "rainbow_rocket" || run.special_event === "rainbow_rocket" ? RAINBOW_ROCKET_REWARD_COINS : 0);
}

export function applyBattleSpecialRewardCoins(run: CurrentRunData): {villainIntrusionBonus: number; rainbowRocketBonus: number; total: number} {
  const villainIntrusionBonus = run.special_event === "villain_intrusion" ? addCoins(run, VILLAIN_INTRUSION_BONUS_COINS, "villain-intrusion-bonus") : 0;
  const rainbowRocketBonus = run.special_run === "rainbow_rocket" || run.special_event === "rainbow_rocket" ? addCoins(run, RAINBOW_ROCKET_REWARD_COINS, "rainbow-rocket-bonus") : 0;
  return {villainIntrusionBonus, rainbowRocketBonus, total: villainIntrusionBonus + rainbowRocketBonus};
}

export function exchangeEnemyPokemonIntoRun(run: CurrentRunData, ownIndex: number, enemyIndex: number): RuntimeExchangeResult {
  const own = Math.floor(Number(ownIndex));
  const foe = Math.floor(Number(enemyIndex));
  if (own < 0 || own >= (run.player_team || []).length) throw new Error("队伍编号无效。");
  if (foe < 0 || foe >= (run.enemy_raw || []).length || foe >= (run.enemy_display || []).length) throw new Error("敌方宝可梦编号无效。");
  const restStatus = run.rest_status || {exchanges: 0, taken_enemy_slots: []};
  if ((restStatus.taken_enemy_slots || []).includes(foe)) throw new Error("这只敌方宝可梦已经被交换过了。");
  const nextRaw = clone(run.enemy_raw![foe]) as PokemonSet;
  const nextDisplay = clone(run.enemy_display![foe]) as RentalPokemon;
  run.player_team = [...(run.player_team || [])];
  run.player_display = [...(run.player_display || [])];
  run.player_team[own] = nextRaw;
  run.player_display[own] = nextDisplay;
  if (run.player_state?.length) {
    const nextState = [...run.player_state];
    nextState.splice(own, 1);
    run.player_state = nextState;
  }
  run.rest_status = {
    ...restStatus,
    exchanges: Number(restStatus.exchanges || 0) + 1,
    taken_enemy_slots: [...(restStatus.taken_enemy_slots || []), foe],
  };
  return {run, ownIndex: own, enemyIndex: foe, received: nextDisplay};
}

export function recordTrainerDexEncounter(save: LocalSave, trainer: TrainerNpcView, options: {
  event?: PlannedBattleData["special_event"];
  now?: string;
  teamPool?: RuntimeBossDexTeamSelection | null;
  display?: RentalPokemon[];
  poolId?: string;
} = {}): BossDexRecord | undefined {
  if (!isTrainerDexRecordable(trainer)) return undefined;
  const now = options.now || new Date().toISOString();
  const current = save.boss_dex?.[trainer.id];
  const eventTags = new Set(current?.event_tags || []);
  if (options.event === "villain_intrusion") {
    eventTags.add("普通乱入");
    eventTags.add("特殊事件");
  } else if (options.event === "rainbow_rocket") {
    eventTags.add("彩虹火箭队");
    eventTags.add("特殊事件");
  }
  const seenPoolSlots = new Set(current?.seen_pool_slots || []);
  const seenPokemon = {...(current?.seen_pokemon || {})};
  const poolId = options.poolId || trainer.team_pool_id || trainer.team_pool_ids?.[0];
  for (const row of options.teamPool?.rows || []) {
    const key = bossPoolSlotKey(poolId, row.battle_rule_preset, row.team_index, row.slot, row.species_id);
    const pokemon = options.display?.[row.slot - 1];
    seenPoolSlots.add(key);
    if (pokemon) {
      seenPokemon[key] = {
        key,
        team_index: row.team_index,
        slot: row.slot,
        species_id: row.species_id,
        pokemon,
      };
    }
  }
  const record: BossDexRecord = {
    encounters: Number(current?.encounters || 0) + 1,
    completed: Number(current?.completed || 0),
    wins: Number(current?.wins || 0),
    losses: Number(current?.losses || 0),
    event_tags: Array.from(eventTags),
    last_result: current?.last_result ?? null,
    first_seen_at: current?.first_seen_at || now,
    last_seen_at: now,
    last_battled_at: current?.last_battled_at,
    seen_pool_slots: Array.from(seenPoolSlots),
    seen_pokemon: seenPokemon,
  };
  save.boss_dex = {...(save.boss_dex || {}), [trainer.id]: record};
  return record;
}

export function recordTrainerDexResult(save: LocalSave, trainerOrId: TrainerNpcView | string | undefined, result: "win" | "loss", options: {
  now?: string;
} = {}): BossDexRecord | undefined {
  const trainerId = typeof trainerOrId === "string" ? trainerOrId : trainerOrId?.id;
  if (typeof trainerOrId !== "string" && trainerOrId && !isTrainerDexRecordable(trainerOrId)) return undefined;
  if (!trainerId) return undefined;
  const now = options.now || new Date().toISOString();
  const current = save.boss_dex?.[trainerId] || (typeof trainerOrId === "string" ? undefined : {
    encounters: 0,
    completed: 0,
    wins: 0,
    losses: 0,
    event_tags: [],
    last_result: null,
    seen_pool_slots: [],
    seen_pokemon: {},
  });
  if (!current) return undefined;
  const record: BossDexRecord = {
    ...current,
    completed: Number(current.completed || 0) + 1,
    wins: Number(current.wins || 0) + (result === "win" ? 1 : 0),
    losses: Number(current.losses || 0) + (result === "loss" ? 1 : 0),
    last_result: result,
    last_battled_at: now,
    last_seen_at: now,
  };
  save.boss_dex = {...(save.boss_dex || {}), [trainerId]: record};
  return record;
}

export function buildBasicBattleRecord(options: {
  id: string;
  createdAt: string;
  run: CurrentRunData;
  battle?: BattleState | null;
  message: string;
  outcome: BattleRecordEntry["outcome"];
  defaultBattles: number;
}): BattleRecordEntry {
  const battle = options.battle;
  const run = options.run;
  return {
    id: options.id,
    created_at: options.createdAt,
    run_seed: Number(run.seed || 0),
    battle_no: Math.max(1, Number(run.battle_no || run.next_battle || 1)),
    total_battles: Math.max(1, Number(run.battles || options.defaultBattles)),
    outcome: options.outcome,
    winner: battle?.winner ?? (options.outcome === "win" ? "Player" : options.outcome),
    message: options.message,
    enemy_trainer: run.enemy_trainer,
    player_team: battle?.player_display || run.player_display || [],
    enemy_team: battle?.enemy_display || run.enemy_display || [],
  };
}

export type RuntimeSettledRunEnd = {
  paidBack: number;
  refundBase: number;
  refundGained: number;
  receiptBonus: number;
  portfolioBonus: number;
  portfolioTypes: string[];
  convertedCoins: number;
  excludedCoins: number;
  convertedBp: number;
};

export function emptyRuntimeSettlement(): RuntimeSettledRunEnd {
  return {
    paidBack: 0,
    refundBase: 0,
    refundGained: 0,
    receiptBonus: 0,
    portfolioBonus: 0,
    portfolioTypes: [],
    convertedCoins: 0,
    excludedCoins: 0,
    convertedBp: 0,
  };
}

export function buildRuntimeBattleRecord(options: {
  id: string;
  createdAt: string;
  run: CurrentRunData;
  battle: BattleState;
  message: string;
  outcome: BattleRecordEntry["outcome"];
  statEvents?: ResultPokemonStatEvent[];
  resultSummary?: ResultSummaryState;
  defaultBattles: number;
  activeBattleNo?: number;
}): BattleRecordEntry {
  const run = options.run;
  const battle = options.battle;
  return {
    id: options.id,
    created_at: options.createdAt,
    run_seed: Number(run.seed || 0),
    battle_no: Math.max(1, Number(run.battle_no || options.activeBattleNo || run.next_battle || 1)),
    total_battles: Math.max(1, Number(run.battles || options.defaultBattles)),
    outcome: options.outcome,
    winner: battle.winner,
    message: options.message,
    enemy_trainer: run.enemy_trainer,
    player_team: battle.player_display || run.player_display || [],
    enemy_team: battle.enemy_display || run.enemy_display || [],
    player_pokemon: battlePokemonSummaries(run, battle, options.statEvents || []),
    result_summary: options.resultSummary,
  };
}

export function buildRuntimeRunRecord(options: {
  id: string;
  createdAt: string;
  run: CurrentRunData;
  message: string;
  outcome: BattleRecordEntry["outcome"];
  resultSummary?: ResultSummaryState;
  defaultBattles: number;
}): BattleRecordEntry {
  const run = options.run;
  return {
    id: options.id,
    created_at: options.createdAt,
    run_seed: Number(run.seed || 0),
    battle_no: Math.max(1, Number(run.battle_no || run.next_battle || 1)),
    total_battles: Math.max(1, Number(run.battles || options.defaultBattles)),
    outcome: options.outcome,
    winner: options.outcome === "win" ? "Player" : options.outcome,
    message: options.message,
    enemy_trainer: run.enemy_trainer,
    player_team: run.player_display || [],
    enemy_team: run.enemy_display || [],
    player_pokemon: resultUsedPokemon(run, run.player_display || []),
    result_summary: options.resultSummary,
  };
}

export function buildRuntimeResultSummary(options: {
  outcome: ResultSummaryState["outcome"];
  headline: string;
  subtitle?: string;
  wins: number;
  settled?: RuntimeSettledRunEnd;
  battle?: BattleState | null;
  run?: CurrentRunData | null;
  battleReward?: number;
  clearBonus?: number;
  allInBonus?: number;
  defaultBattles: number;
}): ResultSummaryState {
  const settled = options.settled || emptyRuntimeSettlement();
  const coinRows: ResultSummaryState["coin_rows"] = [];
  if (options.battleReward !== undefined) coinRows.push({label: "本场胜利奖励", value: `${options.battleReward}金币`, detail: "击败本场训练师获得"});
  if (options.clearBonus !== undefined) coinRows.push({label: "连续通关奖励", value: `${options.clearBonus}金币`, detail: "完成整轮挑战获得"});
  if (options.allInBonus) coinRows.push({label: "孤注一掷翻倍", value: `${options.allInBonus}金币`, detail: "获胜后按当前金币翻倍"});
  coinRows.push(
    {label: "道具卖出总计", value: `${settled.refundGained}金币`, detail: "结算时按当前背包返还比例折算"},
    {label: "回收票据", value: `${settled.receiptBonus}金币`, detail: "按本局回收流水追加"},
    {label: "投资组合", value: `${settled.portfolioBonus}金币`, detail: settled.portfolioTypes.length ? settled.portfolioTypes.join(" / ") : "本局未触发"},
    {label: "天使基金不折算", value: `${settled.excludedCoins}金币`, detail: "开局基金剩余部分不进入 BP 折算"},
  );
  const bpRows: ResultSummaryState["bp_rows"] = [
    {label: "金币折算 BP", value: `${settled.convertedCoins}金币 -> ${settled.convertedBp}BP`, detail: "结算时向下取整"},
  ];
  if (settled.paidBack) bpRows.push({label: "临时 BP 扣回", value: `${settled.paidBack}BP`, detail: "临时 BP 在结算时扣回"});
  const rows: ResultSummaryState["rows"] = [
    {label: "结果", value: options.outcome === "win" ? "WIN" : options.outcome === "loss" ? "LOST" : "ABORT", detail: options.headline},
    {label: "连胜", value: `${options.wins}`},
    ...coinRows,
    ...bpRows,
  ];
  const playerTeam = options.battle?.player_display || options.run?.player_display || [];
  return {
    outcome: options.outcome,
    headline: options.headline,
    subtitle: options.subtitle,
    rows,
    coin_rows: coinRows,
    bp_rows: bpRows,
    talents: options.battle?.player_talents?.length ? options.battle.player_talents : options.run?.talents || [],
    used_pokemon: resultUsedPokemon(options.run, playerTeam),
    progress: resultProgressRows({run: options.run, wins: options.wins, outcome: options.outcome, battle: options.battle, defaultBattles: options.defaultBattles}),
    player_team: playerTeam,
    enemy_team: options.battle?.enemy_display || options.run?.enemy_display || [],
    enemy_trainer: options.battle?.enemy_trainer || options.run?.enemy_trainer,
  };
}

function resultUsedPokemon(run: CurrentRunData | null | undefined, fallbackTeam: RentalPokemon[]): ResultPokemonSummary[] {
  const seen = new Map<string, RentalPokemon>();
  for (const pokemon of [...(run?.used_pokemon_display || []), ...(run?.player_display || []), ...(run?.exchange_box?.display || []), ...fallbackTeam]) {
    seen.set(resultPokemonKey(pokemon), pokemon);
  }
  const eventStats = aggregatePokemonStatEvents(run?.used_pokemon_stat_events);
  return Array.from(seen.entries()).map(([key, pokemon]) => ({
    pokemon,
    ...mergeResultPokemonStats(run?.used_pokemon_stats?.[key] || emptyResultPokemonStats(), eventStats[key] || emptyResultPokemonStats()),
  }));
}

function battlePokemonSummaries(run: CurrentRunData, battle: BattleState, events: ResultPokemonStatEvent[]): ResultPokemonSummary[] {
  const eventStats = aggregatePokemonStatEvents(events);
  return (battle.player_display || []).map(pokemon => {
    const key = resultPokemonKey(pokemon);
    return {
      pokemon,
      ...mergeResultPokemonStats(run.used_pokemon_stats?.[key] || emptyResultPokemonStats(), eventStats[key] || emptyResultPokemonStats()),
    };
  });
}

function resultProgressRows(options: {run?: CurrentRunData | null; wins: number; outcome: ResultSummaryState["outcome"]; battle?: BattleState | null; defaultBattles: number}): ResultSummaryState["progress"] {
  const run = options.run;
  const rows = run?.night_sky?.rows || [];
  const total = Math.max(options.defaultBattles, Number(run?.battles || rows.length || options.defaultBattles));
  if (rows.length) {
    return rows.map(row => ({
      battle_no: row.battle_no,
      label: row.label,
      trainer: row.trainer,
      trainer_visible: Boolean(row.trainer_visible || row.encountered),
      outcome: row.battle_no <= options.wins ? "win" : row.battle_no === options.wins + 1 ? options.outcome : "pending",
    }));
  }
  return Array.from({length: total}, (_value, index) => {
    const battleNo = index + 1;
    return {
      battle_no: battleNo,
      label: battleNo === total ? "最终战" : battleNo === 3 ? "馆主战" : "挑战",
      trainer: battleNo === options.wins + 1 ? options.battle?.enemy_trainer || run?.enemy_trainer : undefined,
      trainer_visible: battleNo <= options.wins + 1,
      outcome: battleNo <= options.wins ? "win" : battleNo === options.wins + 1 ? options.outcome : "pending",
    };
  });
}

function resultPokemonKey(pokemon: RentalPokemon | undefined): string {
  if (!pokemon) return "unknown";
  return String(pokemon.run_member_id || pokemon.showdown_id || pokemon.species_id || pokemon.species || pokemon.name || "unknown").toLowerCase();
}

function emptyResultPokemonStats(): Omit<ResultPokemonSummary, "pokemon"> {
  return {kills: 0, deaths: 0, assists: 0, damage_dealt: 0, damage_taken: 0};
}

function mergeResultPokemonStats(...stats: Array<Omit<ResultPokemonSummary, "pokemon">>): Omit<ResultPokemonSummary, "pokemon"> {
  return stats.reduce((merged, stat) => ({
    kills: Number(merged.kills || 0) + Number(stat.kills || 0),
    deaths: Number(merged.deaths || 0) + Number(stat.deaths || 0),
    assists: Number(merged.assists || 0) + Number(stat.assists || 0),
    damage_dealt: Number(merged.damage_dealt || 0) + Number(stat.damage_dealt || 0),
    damage_taken: Number(merged.damage_taken || 0) + Number(stat.damage_taken || 0),
  }), emptyResultPokemonStats());
}

function aggregatePokemonStatEvents(events: ResultPokemonStatEvent[] | undefined): Record<string, Omit<ResultPokemonSummary, "pokemon">> {
  const result: Record<string, Omit<ResultPokemonSummary, "pokemon">> = {};
  for (const event of events || []) {
    const key = String(event.pokemon_key || "").toLowerCase();
    if (!key) continue;
    const current = result[key] || emptyResultPokemonStats();
    if (event.kind === "kill") current.kills += Number(event.value || 0);
    else if (event.kind === "death") current.deaths += Number(event.value || 0);
    else if (event.kind === "assist") current.assists += Number(event.value || 0);
    else if (event.kind === "damage_dealt") current.damage_dealt += Number(event.value || 0);
    else if (event.kind === "damage_taken") current.damage_taken += Number(event.value || 0);
    result[key] = current;
  }
  return result;
}

function activatePendingRestEvents(run: CurrentRunData): void {
  if (run.rest_status?.event_contest_next) {
    run.rest_status = {...run.rest_status, event_contest_active: run.rest_status.event_contest_next};
    delete run.rest_status.event_contest_next;
  }
  if (run.rest_status?.event_soul_swap_next) {
    run.rest_status = {...run.rest_status, event_soul_swap_active: true};
    delete run.rest_status.event_soul_swap_next;
  }
  if (run.rest_status?.event_score_bet_next) {
    run.rest_status = {...run.rest_status, event_score_bet_active: run.rest_status.event_score_bet_next};
    delete run.rest_status.event_score_bet_next;
  }
}

function battleLabel(planned: PlannedBattleData, run: CurrentRunData): string {
  if (planned.special_event === "rainbow_rocket") return "彩虹火箭队";
  if (planned.special_event === "villain_intrusion") return "反派头目乱入";
  if (run.boss_type === "normal") return "普通 NPC";
  if (run.boss_type === "champion") return "冠军";
  if (run.boss_type === "elite4") return "四天王";
  return "馆主";
}

function bossPoolSlotKey(poolId: string | undefined, preset: string | undefined, teamIndex: number, slot: number, speciesId: string): string {
  return `${poolId || "pool"}:${preset || "none"}:${teamIndex}:${slot}:${speciesId}`;
}

function isBattleRequestView(value: unknown): value is BattleRequestView {
  return Boolean(value && typeof value === "object" && "side" in value);
}

function isTrainerDexRecordable(trainer?: TrainerNpcView): boolean {
  return Boolean(trainer && ["gym", "elite4", "champion", "villain"].includes(trainer.type));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
