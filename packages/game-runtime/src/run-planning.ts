import type {BattleSetting, CurrentRunData, DesktopGameState, GeneratedTeam, LocalSave, PlannedBattleData, PokemonSet, RentalPokemon, TalentView, TrainerNpcView} from "@changebattle/shared";
import {DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";
import type {PreparationRuntimeState} from "./preparation.js";
import {
  DEFAULT_BATTLES,
  activeTalentsForSave,
  applyProphetFirstMover,
  candidateCountForTalents,
  currentBp,
  hasTalent,
  itemKey,
  starterCoinsForSeed,
  starterNonConvertibleCoinsForTalents,
} from "./run-rules.js";

export type RunPlanningRuntimeApi = {
  beginChallenge(selectedIndexes: number[], runSeed: number, battles?: number): Promise<DesktopGameState>;
};

export function createRunPlanningRuntime(options: {
  loadSave(): Promise<LocalSave | null>;
  persist(save: LocalSave): Promise<LocalSave>;
  getPreparationState(): PreparationRuntimeState;
  setPreparationState(state: Partial<PreparationRuntimeState>): void;
  generateStarterCandidatesForSave(save: LocalSave, seed: number, talents: TalentView[], count: number, setting?: BattleSetting): Promise<GeneratedTeam>;
  applyStarterMentorEye(team: PokemonSet[], display: RentalPokemon[], seed: number, talents: TalentView[]): Promise<{team: PokemonSet[]; display: RentalPokemon[]; upgraded: number}>;
  applyArrivalLevelCapToTeam(talents: TalentView[] | undefined, team: PokemonSet[], display: RentalPokemon[]): Promise<{team: PokemonSet[]; display: RentalPokemon[]; capped: number}>;
  trainerFromProfile(profile: LocalSave["trainer"]): TrainerNpcView;
  freshRestStatus(talents: TalentView[]): CurrentRunData["rest_status"];
  recordPokemonUsageList(save: LocalSave, pokemon: RentalPokemon[]): void;
  normalizeCurrentRun(run: CurrentRunData): CurrentRunData;
  normalizePlayerState(run: CurrentRunData): unknown;
  buildPlannedBattles(save: LocalSave, run: CurrentRunData): Promise<PlannedBattleData[]>;
  rainbowRocketUnlocked(save: LocalSave): boolean;
  rainbowRocketRollHits(seed: number): boolean;
  buildRainbowRocketPlannedBattles(run: CurrentRunData): Promise<PlannedBattleData[]>;
  restState(save: LocalSave, run: CurrentRunData, message?: string): Promise<DesktopGameState>;
}): RunPlanningRuntimeApi {
  return {
    async beginChallenge(selectedIndexes, runSeed, battles = DEFAULT_BATTLES) {
      const save = await options.loadSave();
      if (!save) throw new Error("请先创建或读取存档。");
      let {pendingStarter, pendingCandidates} = options.getPreparationState();
      const effectiveSeed = pendingStarter?.seed || runSeed;
      const runTalents = pendingStarter?.talents || activeTalentsForSave(save);
      const runBattleSetting = normalizeBattleSetting(pendingStarter?.battleSetting || save.battle_setting || DEFAULT_BATTLE_SETTING);
      if (!pendingCandidates) {
        const count = candidateCountForTalents(runTalents);
        pendingCandidates = await options.generateStarterCandidatesForSave(save, effectiveSeed, runTalents, count, pendingStarter?.battleSetting);
        options.setPreparationState({pendingCandidates});
      }
      if (selectedIndexes.length !== 3) throw new Error("需要选择 3 只宝可梦。");
      const selectedOrigins = selectedIndexes.map(index => (pendingCandidates!.display[index] as RentalPokemon & {starter_origin?: string} | undefined)?.starter_origin || "current");
      if (hasTalent(runTalents, "starter_soulmate")) {
        const memoryCount = selectedOrigins.filter(origin => origin === "memory").length;
        const currentCount = selectedOrigins.length - memoryCount;
        if (memoryCount > 1) throw new Error("灵魂伴侣最多选择 1 只回忆候选。");
        if (memoryCount === 1 && currentCount !== 2) throw new Error("选择回忆候选后，需要再选择 2 只本局候选。");
        if (memoryCount === 0 && currentCount !== 3) throw new Error("未选择回忆候选时，需要选择 3 只本局候选。");
      } else if (selectedOrigins.some(origin => origin === "memory")) {
        throw new Error("需要天赋「灵魂伴侣」才能选择回忆候选。");
      }
      const selectedTeam = selectedIndexes.map(index => pendingCandidates!.team[index]);
      const selectedDisplay = selectedIndexes.map(index => pendingCandidates!.display[index]);
      const mentored = await options.applyStarterMentorEye(selectedTeam, selectedDisplay, effectiveSeed, runTalents);
      const cappedStarter = await options.applyArrivalLevelCapToTeam(runTalents, mentored.team, mentored.display);
      const playerTeam = cappedStarter.team;
      const playerDisplay = cappedStarter.display;
      const starterItemIds = (pendingStarter?.purchased || []).map(item => itemKey(item.id || item.name)).filter(Boolean);
      const starterBagItems = Object.fromEntries(starterItemIds.map(id => [id, starterItemIds.filter(value => value === id).length]));
      const starterBagMeta = Object.fromEntries((pendingStarter?.purchased || []).map(item => [itemKey(item.id || item.name), {
        id: itemKey(item.id || item.name),
        name: item.name,
        name_zh: item.name_zh,
        desc: item.desc,
        desc_zh: item.desc_zh,
        category: item.category,
        move_id: item.move_id,
        move_name: item.move_name,
        move_name_zh: item.move_name_zh,
      }]));
      const temporaryBp = applyProphetFirstMover(save, runTalents);
      save.current_run = {
        status: "awaiting_rest",
        seed: effectiveSeed,
        battles,
        next_battle: 1,
        battle_no: 0,
        wins: 0,
        reroll_count: 0,
        shop_roll_count: 0,
        shop_offers: [],
        starter_item_offers: pendingStarter?.offers || [],
        starter_item_purchased: (pendingStarter?.purchased || []).map(item => item.offer_id),
        non_refundable_bag_items: starterBagItems,
        bag_item_meta: starterBagMeta,
        talents: runTalents,
        battle_setting: runBattleSetting,
        reroute_used: 0,
        forced_trainer_ids: {},
        reroute_history: {},
        named_champion_id: null,
        recycle_receipt_value: 0,
        economy_spend_types: [],
        boss_type: "normal",
        boss_stage: "initial",
        boss_route: "initial",
        player_trainer: options.trainerFromProfile(save.trainer),
        run_start_bp: currentBp(save) - temporaryBp.amount,
        temporary_bp_debt: temporaryBp.amount,
        second_team_roar_used: false,
        all_in_exchange_used: false,
        exchange_box: {team: [], display: [], state: []},
        player_team: playerTeam,
        player_display: playerDisplay,
        player_state: [],
        coins: pendingStarter?.coins ?? starterCoinsForSeed(effectiveSeed, runTalents),
        non_convertible_coins: starterNonConvertibleCoinsForTalents(runTalents),
        coins_earned_this_run: 0,
        bp_earned_this_run: 0,
        bp_investments: [0, 0, 0],
        move_investments: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
        bag_items: starterBagItems,
        rest_status: options.freshRestStatus(runTalents),
      } as CurrentRunData;
      const run = save.current_run as CurrentRunData;
      options.recordPokemonUsageList(save, playerDisplay);
      options.normalizeCurrentRun(run);
      options.normalizePlayerState(run);
      run.planned_battles = await options.buildPlannedBattles(save, run);
      if (options.rainbowRocketUnlocked(save) && options.rainbowRocketRollHits(effectiveSeed)) {
        run.special_run = "rainbow_rocket";
        run.battles = DEFAULT_BATTLES;
        run.original_planned_battles = JSON.parse(JSON.stringify(run.planned_battles)) as PlannedBattleData[];
        run.planned_battles = await options.buildRainbowRocketPlannedBattles(run);
        run.rest_status = {...(run.rest_status || {}), rest_event_options: [], rest_event_selected_id: null};
      }
      options.setPreparationState({pendingStarter: null});
      const next = await options.persist(save);
      const mentorText = mentored.upgraded ? `伯乐本乐发动：${mentored.upgraded} 只宝可梦获得数值升阶。` : "";
      const capText = cappedStarter.capped ? `徽章权限生效：${cappedStarter.capped} 只到手宝可梦等级已压到上限。` : "";
      const rocketText = run.special_run === "rainbow_rocket" ? "WARNING / WARNING：彩虹火箭队入侵，对战表已被劫持。" : "";
      return options.restState(next, next.current_run as CurrentRunData, `${mentorText}${capText}${rocketText || "出发前可以先整理队伍。"}`);
    },
  };
}
