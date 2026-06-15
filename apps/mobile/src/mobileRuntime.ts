import {GameService, type TrainerItemBattleSession} from "@changebattle/game-service";
import type {ChangeBattleRuntimeApi, PreparationRuntimeState, RunPlanningRuntimeApi, RuntimeBossTeamPoolRow, RuntimeDataProvider, RuntimeExchangeResult, RuntimeGenerationProfile, RuntimeSpeciesTier, RuntimeTeamPoolSelection} from "@changebattle/game-runtime";
import {
  adjustedStateAfterEdit,
  ADJUST_STATS_COST,
  addCoins,
  RANDOMIZE_ALL_COST,
  RANDOMIZE_PART_COST,
  applyArrivalLevelCap,
  buildRuntimeBattleRecord,
  buildRuntimeResultSummary,
  buildRuntimeRunRecord,
  buildRuntimeNightSkyState,
  buildRestState,
  buildPlannedBattle,
  buildRainbowRocketPlannedBattles,
  buildStartBattleSessionOptions,
  buildPlannedBattles,
  createChangeBattleRuntime,
  createPreparationRuntime,
  createProfileSettingsRuntime,
  createProgressionRuntime,
  enableTestModeForSave,
  buildVillainIntrusionPlannedBattle,
  executeBattleAutoAdvance,
  executeBattleChoice,
  finishedBattlePerspective,
  fullStateForPokemon,
  generateStarterItemOffers,
  generateStarterCandidatesForSave,
  applyRainbowRocketRestore,
  applyRainbowRocketSupportChoice,
  applyAllInExchange,
  applyBasicRestEventChoice,
  applyBpToCoins,
  applyDoctorTreatment,
  applyFinishedBattlePerspectiveToRun,
  applyHeldItemChange,
  applyRaidExchange,
  applyRestConsumableItem,
  applyRuntimeNamedChampion,
  applyRuntimeNightSkyScout,
  applyRuntimeReroute,
  applyRuntimeScoutNext,
  applyScoreBetAdjustment,
  applyTrustLevel,
  activeTalentsForSave,
  badgeLevelCapForTalents,
  battleSpecialRewardCoins,
  barterRunShopOffer,
  candidateCountForTalents,
  completeRainbowRocketSupport,
  currentBp,
  currentCoins,
  DEFAULT_BATTLES,
  canExchangeBoss,
  chooseTrainerForRoute,
  decorateDexUsageCounts,
  ensureRainbowRocketSupport,
  ensureBasicRestEventOptions,
  loadRuntimeTeamPools,
  loadTrainerNpcCatalog,
  markStarterOrigin,
  normalizeScoreBetState,
  normalizePlayerState,
  normalizeStatsInput,
  exchangeCost,
  exchangeKeepsItem,
  exchangeStateRatio,
  itemKey,
  itemCategory,
  isTrainingShopItemId,
  applyRestShopKindDiscount,
  hasTalent,
  partialStateForPokemon,
  prepareRunForNextBattleAfterRest,
  prepareStartBattleRun,
  pickTeamPoolSelection,
  rainbowRocketRollHits,
  rainbowRocketSupportRequired,
  rainbowRocketUnlocked,
  recordTrainerDexEncounter,
  recordTrainerDexResult,
  rememberRunForSoulmate,
  rerouteTrainerForRoute,
  resolveBattleCommandOutcome,
  runQuestStatus,
  pricedForRun,
  createTrainerProfileTools,
  buyRunItem,
  buyRunShopOffer,
  forgeRunItems,
  forgeRunSpecialItem,
  moveDrawCost,
  moveDrawCount,
  setRunLeadSlot,
  shopOfferCount,
  shopDuplicateBonusForOffers,
  tmIconAssetForMoveType,
  rerollRunTeraOrb,
  statResetCost,
  spendRunCoins,
  routeForRunBattle,
  sellRunBagItem,
  sellPriceForItem,
  shinyPokemon,
  scoreBetMaxStakeForCoins,
  SCOUT_ALL_COST,
  SCOUT_ONE_COST,
  SCORE_BET_MIN_STAKE,
  settleBasicBattleResult,
  settleRuntimeRunEnd,
  starterChoiceState,
  starterProfilesForStreak,
  starterSpeciesTiersForStreak,
  takeReplacementRunShowdownId,
  talentLevel,
  toId,
  TRAINING_SHOP_GROUP_WEIGHTS,
  type TrainingShopGroup,
  trainingShopGroupForItemId,
  trainerDexSearch,
  updateRunQuestAfterBattle,
  updateRunQuestAfterRest,
  validateStatAdjustments,
  villainIntrusionRollHits,
} from "@changebattle/game-runtime";
import {DEFAULT_BATTLE_SETTING, REST_SHOP_DISCOUNT_COUPONS, normalizeBattleSetting} from "@changebattle/shared";
import type {BagCategoryView, BattleBackgroundView, BattleState, CurrentRunData, DesktopGameState, GeneratedTeam, ItemCategory, LocalSave, MoveSummary, PlannedBattleData, PokemonSet, RentalPokemon, RestState, ShopItem, ShopKind, ShopOffer, ShopState, TrainerNpcView, TrainerProfile} from "@changebattle/shared";
import {createMobileRuntimeEnvironment} from "./mobileRuntimeEnv";
import shopPoolCsv from "../../../data/shop_pool.csv?raw";

const RAINBOW_ROCKET_TEST_STREAK = 3;
type MobileShopKind = ShopKind;
type MobileShopPoolBucket = "healing" | "tm" | "held" | "berry" | "pp" | "training";
type MobileShopPoolEntry = {
  id: string;
  kind: "item" | "tm";
  category: ItemCategory;
  cost: number;
  weight: number;
  enabled: boolean;
  notes?: string;
};

function mobileBattleDebugSnapshot(battle: BattleState | null | undefined) {
  const request = battle?.request;
  return {
    turn: battle?.tracker?.turn,
    requestWait: Boolean(request?.wait),
    forceSwitch: request?.forceSwitch || null,
    active: {
      p1: battle?.tracker?.active?.p1,
      p2: battle?.tracker?.active?.p2,
    },
    sidePokemon: (request?.side?.pokemon || []).map((pokemon, index) => ({
      slot: index + 1,
      ident: pokemon.ident,
      pokeball: pokemon.pokeball,
      active: Boolean(pokemon.active),
      condition: pokemon.condition,
    })),
    playerSlots: (battle?.battle_view?.player?.slots || []).map(slot => ({
      slot: slot.slot,
      name: slot.display?.species_zh || slot.display?.name || slot.runtime?.details || slot.key,
      active: Boolean(slot.active),
      condition: slot.condition,
      showdownId: slot.showdown_id,
    })),
    recent: (battle?.recent_events || []).slice(-5),
  };
}

const MOBILE_SHOP_BUCKET_WEIGHTS: Record<MobileShopPoolBucket, number> = {
  healing: 65,
  pp: 15,
  berry: 10,
  tm: 5,
  held: 5,
  training: 1,
};
const MOBILE_SHOP_KIND_CONFIG: Record<MobileShopKind, {title: string; theme: ShopState["theme"]; rollCost: number; buckets: MobileShopPoolBucket[]}> = {
  recovery: {title: "回复商店", theme: "green", rollCost: 50, buckets: ["healing", "berry", "pp"]},
  held: {title: "道具商店", theme: "blue", rollCost: 75, buckets: ["held"]},
  tm: {title: "技能商店", theme: "purple", rollCost: 75, buckets: ["tm"]},
  training: {title: "训练商店", theme: "orange", rollCost: 75, buckets: ["training"]},
  mega: {title: "Mega 商店", theme: "orange", rollCost: 75, buckets: ["held"]},
  zmove: {title: "Z 招式商店", theme: "purple", rollCost: 75, buckets: ["held"]},
};
const MOBILE_GUARANTEED_SHOP_ITEMS: Array<{id: string; cost: number}> = [
  {id: "potion", cost: 20},
  {id: "superpotion", cost: 50},
  {id: "hyperpotion", cost: 120},
  {id: "revive", cost: 120},
  {id: "fullheal", cost: 30},
];
const MOBILE_PREMIUM_RECOVERY_ITEM_IDS = ["revivalherb", "fullrestore"];
const MOBILE_SHOP_POOL = parseMobileShopPool(shopPoolCsv);
const MOBILE_TERA_TYPES = ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"] as const;
const MOBILE_TERA_TYPE_ZH: Record<string, string> = {
  Normal: "一般",
  Fire: "火",
  Water: "水",
  Electric: "电",
  Grass: "草",
  Ice: "冰",
  Fighting: "格斗",
  Poison: "毒",
  Ground: "地面",
  Flying: "飞行",
  Psychic: "超能力",
  Bug: "虫",
  Rock: "岩石",
  Ghost: "幽灵",
  Dragon: "龙",
  Dark: "恶",
  Steel: "钢",
  Fairy: "妖精",
};

export function createMobileRuntime(): ChangeBattleRuntimeApi {
  const env = createMobileRuntimeEnvironment();
  let runtimePromise: Promise<ChangeBattleRuntimeApi> | null = null;
  const runtime = () => {
    runtimePromise ||= createRuntime();
    return runtimePromise;
  };

  async function createRuntime(): Promise<ChangeBattleRuntimeApi> {
    const npcCatalog = await loadTrainerNpcCatalog(env.data).catch(error => {
      env.logger.debug("mobile-runtime", "trainer catalog fallback", error);
      return [];
    });
    const trainerTools = createTrainerProfileTools(npcCatalog);
    const profileSettings = createProfileSettingsRuntime(env, {trainerTools});
    const progression = createProgressionRuntime({
      loadSave: profileSettings.loadSave,
      persist: save => env.saves.save(save),
      npcCatalog,
    });
    let gameServicePromise: Promise<GameService> | null = null;
    const loadGameService = async () => {
      if (!gameServicePromise) {
        gameServicePromise = env.showdown.load().then(showdownModule => new GameService({
          projectRoot: "",
          dataProvider: env.data,
          showdownModule: showdownModule as any,
          assetExistsSync: (relativePath: string) => Boolean(relativePath),
          randomUUID: () => env.uuid.randomUUID(),
        }));
      }
      return gameServicePromise;
    };
    let preparationState: PreparationRuntimeState = {pendingCandidates: null, pendingStarter: null};
    let activeBattle: TrainerItemBattleSession | null = null;
    let activeBattleState: BattleState | null = null;
    const gameState = (partial: Partial<DesktopGameState>): DesktopGameState => ({screen: "mainMenu", save: null, ...partial} as DesktopGameState);
    const decorateMobileBattleState = (state: BattleState, run?: CurrentRunData | null): BattleState => {
      if (!run) return state;
      const playerTalents = run.talents || [];
      const questStatus = runQuestStatus(run, "battle", {timelineEvents: state.timeline_events || [], playerSide: state.player_side || "p1", battleEnded: state.ended});
      return {
        ...state,
        player_trainer: run.player_trainer,
        enemy_trainer: run.enemy_trainer,
        enemy_boss_record: run.enemy_boss_record,
        battle_background: run.battle_background,
        player_talents: playerTalents,
        show_move_effectiveness: hasTalent(playerTalents, "intel_god_eye"),
        battle_setting: normalizeBattleSetting(run.battle_setting || DEFAULT_BATTLE_SETTING),
        music_scene: run.boss_type && run.boss_type !== "normal" ? "boss" : "battle",
        battle_event_statuses: questStatus ? [...(state.battle_event_statuses || []), questStatus] : state.battle_event_statuses,
      };
    };
    let bossTeamPoolsPromise: Promise<RuntimeBossTeamPoolRow[]> | null = null;
    const loadBossTeamPools = () => {
      bossTeamPoolsPromise ||= loadMobileTeamPools(env.data, "data/boss_team_pools.csv", "tier1");
      return bossTeamPoolsPromise;
    };
    let rainbowRocketTeamPoolsPromise: Promise<RuntimeBossTeamPoolRow[]> | null = null;
    const loadRainbowRocketTeamPools = () => {
      rainbowRocketTeamPoolsPromise ||= loadMobileTeamPools(env.data, "data/rainbow_rocket_team_pools.csv", "champion");
      return rainbowRocketTeamPoolsPromise;
    };
    const ensureSave = async (): Promise<LocalSave> => {
      const save = await profileSettings.loadSave();
      if (save) return save;
      return profileSettings.createNewSave({name: "训练师", gender: "other"} as TrainerProfile);
    };
    const preparation = createPreparationRuntime({
      loadSave: profileSettings.loadSave,
      getState: () => preparationState,
      setState: state => {
        preparationState = {...preparationState, ...state};
      },
      setConfiguredTalents: () => undefined,
      gameState,
      randomSeed: () => Math.floor(Math.random() * 0xffffffff),
      generateStarterCandidatesForSave: async (save, seed, talents, count, setting) => generateStarterCandidatesForSave({
        service: await loadGameService(),
        save,
        seed,
        talents,
        count,
        setting,
      }),
      starterItemOffers: async (runSeed, talents, upgrades, battleSetting) => generateStarterItemOffers({
        data: env.data,
        service: await loadGameService(),
        runSeed,
        talents,
        upgrades,
        battleSetting,
      }),
      starterChoiceState,
      starterGroupName: groupId => groupId,
      deriveSeed: (seed, salt) => (Number(seed) * 1103515245 + 12345 + Number(salt) * 2654435761) >>> 0,
      generateSingleStarterCandidate: async input => markStarterOrigin(await (await loadGameService()).generateRentalCandidates(input.seed, "gen9randombattle", 1, {
        profiles: [input.profile as RuntimeGenerationProfile],
        speciesTiers: [input.speciesTier as RuntimeSpeciesTier],
        purpose: "starter",
        battleSetting: input.battleSetting,
      }), "current"),
      starterProfilesForStreak,
      starterSpeciesTiersForStreak,
    });
    const startMobileNextBattle = async (save: LocalSave, service?: GameService): Promise<DesktopGameState> => {
      const battleService = service || await loadGameService();
      const bossTeamPools = await loadBossTeamPools();
      const rainbowRocketTeamPools = await loadRainbowRocketTeamPools();
      const prepared = await prepareStartBattleRun({
        save,
        defaultBattles: 7,
        normalizeCurrentRun: mobileNormalizeCurrentRun,
        buildPlannedBattles: async (nextSave, nextRun) => buildPlannedBattles({
          save: nextSave,
          run: nextRun,
          service: battleService,
          npcCatalog,
          bossTeamPools,
          defaultBattles: 7,
          battleBackgroundForRun: mobileBattleBackgroundForRun,
          uuid: () => env.uuid.randomUUID(),
        }),
        trainerFromProfile: trainerTools.trainerFromProfile,
        battleBackgroundForRun: mobileBattleBackgroundForRun,
        bossTeamForPlanned: (planned, run, battleNo) => mobileBossTeamForPlanned(planned, run, battleNo, bossTeamPools, rainbowRocketTeamPools),
      });
      if (prepared.status === "no_run") return gameState({screen: "mainMenu", save, message: prepared.message});
      if (prepared.status === "completed") {
        rememberRunForSoulmate(save, prepared.run);
        save.current_run = null;
        const done = await env.saves.save(save);
        activeBattle = null;
        activeBattleState = null;
        return gameState({screen: "result", save: done, message: `移动端挑战完成，连胜 ${prepared.run.wins || prepared.totalBattles}。`});
      }
      recordTrainerDexEncounter(save, prepared.enemyTrainer, {
        event: prepared.planned.special_event,
        now: env.now().toISOString(),
        teamPool: prepared.bossTeam as RuntimeTeamPoolSelection | null,
        display: prepared.enemyDisplay,
        poolId: prepared.enemyTrainer.team_pool_id,
      });
      const next = await env.saves.save(save);
      const run = next.current_run as CurrentRunData;
      activeBattle = await battleService.createBattleSession(buildStartBattleSessionOptions(prepared, {
        run,
        seed: battleService.deriveSeed(Number(run.seed), 200 + prepared.battleNo),
        enemyAi: prepared.route.type === "champion" ? "champion" : prepared.route.type === "elite4" ? "elite4" : prepared.route.type === "gym" ? "gym_low" : "normal",
        playerState: normalizePlayerState(run),
      }));
      activeBattleState = decorateMobileBattleState(activeBattle.getState(), run);
      return gameState({screen: "battleMain", save: next, battle: activeBattleState, battle_bag: await mobileBattleBagCategories(battleService, run), message: prepared.message});
    };
    const finishMobileBattle = async (state: BattleState): Promise<DesktopGameState> => {
      const save = await ensureSave();
      const run = save.current_run as CurrentRunData | null;
      if (!run || !activeBattle) return gameState({screen: "result", save, battle: state, message: "移动端战斗已结束。"});
      const perspective = finishedBattlePerspective(run, state, activeBattle);
      applyFinishedBattlePerspectiveToRun(run, perspective);
      const mobilePlayerWon = perspective.playerWonByBattleState;
      const questMessage = updateRunQuestAfterBattle(run, {
        playerWon: mobilePlayerWon,
        playerState: perspective.playerState,
        timelineEvents: state.timeline_events || [],
        playerSide: "p1",
      });
      const itemCosts = mobilePlayerWon ? undefined : await mobileItemCostMap(await loadGameService(), run);
      const settled = settleBasicBattleResult(save, run, state, {
        playerState: perspective.playerState,
        playerWon: mobilePlayerWon,
        defaultBattles: 7,
        rewardCoins: mobileBattleRewardCoins(run),
        itemCosts,
        lossMessage: "移动端挑战失败。",
        winMessage: (wins, coinsEarned) => `移动端真实战斗胜利，获得 ${coinsEarned} 金币。当前连胜：${wins}`,
        completedMessage: (wins, coinsEarned) => `移动端挑战通关，完成 ${wins} 连胜，获得 ${coinsEarned} 金币。`,
      });
      const stalwartMessage = settled.outcome !== "loss" && settled.stalwartRecovered ? "坚毅不倒已恢复队伍" : "";
      const settlementMessage = [settled.message, stalwartMessage, questMessage].filter(Boolean).join(" ");
      recordTrainerDexResult(save, run.enemy_trainer?.id, settled.outcome === "loss" ? "loss" : "win", {now: env.now().toISOString()});
      const resultSummary = buildRuntimeResultSummary({
        outcome: settled.outcome === "loss" ? "loss" : "win",
        headline: settled.outcome === "loss" ? "挑战失败" : settled.outcome === "completed" ? "通关" : "战斗胜利",
        subtitle: settlementMessage,
        wins: settled.outcome === "loss" ? Number(run.wins || 0) : Number(settled.wins || run.wins || 0),
        run,
        battle: state,
        settled: settled.outcome === "loss" ? settled.settled : undefined,
        battleReward: settled.outcome === "loss" ? undefined : settled.coinsEarned,
        defaultBattles: 7,
      });
      await env.saves.appendBattleRecord(buildRuntimeBattleRecord({
        id: env.uuid.randomUUID(),
        createdAt: env.now().toISOString(),
        run,
        battle: state,
        message: settlementMessage,
        outcome: settled.outcome === "loss" ? "loss" : "win",
        resultSummary,
        defaultBattles: 7,
      }));
      activeBattleState = decorateMobileBattleState(state, run);
      if (settled.outcome === "loss") {
        const next = await env.saves.save(save);
        activeBattle = null;
        const transition = gameState({screen: "result", save: next, battle: activeBattleState, message: settlementMessage, result_summary: resultSummary});
        return gameState({screen: "battleMain", save: next, battle: activeBattleState, battle_bag: await mobileBattleBagCategories(await loadGameService(), run), message: settlementMessage, pending_transition: transition});
      }
      if (settled.outcome === "completed") {
        const done = await env.saves.save(save);
        activeBattle = null;
        const transition = gameState({screen: "result", save: done, battle: activeBattleState, message: settlementMessage, result_summary: resultSummary});
        return gameState({screen: "battleMain", save: done, battle: activeBattleState, battle_bag: await mobileBattleBagCategories(await loadGameService(), run), message: settlementMessage, pending_transition: transition});
      }
      activeBattle = null;
      const transition = await mobileRestGameState(save, settlementMessage, activeBattleState);
      const transitionRun = (transition.save?.current_run as CurrentRunData | null) || run;
      return gameState({screen: "battleMain", save: transition.save || save, battle: activeBattleState, battle_bag: await mobileBattleBagCategories(await loadGameService(), transitionRun), message: settlementMessage, pending_transition: transition});
    };
    const mobileRestGameState = async (save: LocalSave, message: string, battle?: BattleState | null): Promise<DesktopGameState> => {
      const run = save.current_run as CurrentRunData | null;
      if (!run) return gameState({screen: "mainMenu", save, message});
      await ensureMobileVillainIntrusion(save, run, await loadGameService(), npcCatalog, await loadBossTeamPools(), await loadRainbowRocketTeamPools(), () => env.uuid.randomUUID());
      await ensureRainbowRocketSupport(run, {service: await loadGameService(), uuid: () => env.uuid.randomUUID()});
      ensureBasicRestEventOptions(run);
      const next = await env.saves.save(save);
      return gameState({screen: "rest", save: next, battle: battle || undefined, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
    };
    const runPlanning: RunPlanningRuntimeApi = {
      beginChallenge: async (selectedIndexes, runSeed = Date.now(), battles = 7) => {
        const save = await ensureSave();
        const service = await loadGameService();
        const candidates = preparationState.pendingCandidates || await service.generateRentalCandidates(Date.now());
        const pendingStarter = preparationState.pendingStarter;
        const effectiveSeed = pendingStarter?.seed || runSeed;
        const selected = selectedIndexes.length ? selectedIndexes : [0, 1, 2];
        const team = selected.map(index => candidates.team[index]).filter(Boolean);
        const display = selected.map(index => candidates.display[index]).filter(Boolean);
        const starterBag = mobileStarterBag(pendingStarter?.purchased || []);
        const run = {
          status: "ready",
          seed: effectiveSeed,
          battles,
          battle_no: 1,
          next_battle: 1,
          wins: 0,
          player_team: team,
          player_display: display,
          starter_item_offers: pendingStarter?.offers || [],
          starter_item_purchased: (pendingStarter?.purchased || []).map(item => item.offer_id),
          non_refundable_bag_items: starterBag.items,
          bag_item_meta: starterBag.meta,
          bag_items: starterBag.items,
          coins: pendingStarter?.coins || 0,
          talents: pendingStarter?.talents || [],
          battle_setting: pendingStarter?.battleSetting || save.battle_setting,
          rest_status: {exchanges: 0, taken_enemy_slots: []},
        } as CurrentRunData;
        run.planned_battles = await buildPlannedBattles({
          save,
          run,
          service,
          npcCatalog,
          bossTeamPools: await loadBossTeamPools(),
          defaultBattles: 7,
          battleBackgroundForRun: mobileBattleBackgroundForRun,
          uuid: () => env.uuid.randomUUID(),
        });
        if (rainbowRocketUnlocked(save, npcCatalog) && rainbowRocketRollHits(effectiveSeed)) {
          run.special_run = "rainbow_rocket";
          run.battles = 7;
          run.original_planned_battles = cloneMobile(run.planned_battles);
          run.planned_battles = await buildRainbowRocketPlannedBattles({
            run,
            service,
            npcCatalog,
            rainbowRocketTeamPools: await loadRainbowRocketTeamPools(),
            battleBackgroundForRun: mobileBattleBackgroundForRun,
            uuid: () => env.uuid.randomUUID(),
          });
          run.rest_status = {...(run.rest_status || {}), rest_event_options: [], rest_event_selected_id: null};
        }
        save.current_run = run;
        preparationState = {pendingCandidates: null, pendingStarter: null};
        if (run.special_run === "rainbow_rocket") {
          run.status = "awaiting_rest";
          run.battle_no = 0;
          run.next_battle = 1;
          await ensureRainbowRocketSupport(run, {service, uuid: () => env.uuid.randomUUID()});
          const next = await env.saves.save(save);
          return gameState({
            screen: "rest",
            save: next,
            rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()),
            message: "WARNING / WARNING：彩虹火箭队入侵，请先处理工厂支援。",
          });
        }
        run.status = "awaiting_rest";
        run.battle_no = 0;
        run.next_battle = 1;
        return mobileRestGameState(save, "出发前可以先整理队伍。");
      },
    };
    return createChangeBattleRuntime(env, {
      profileSettings,
      progression,
      preparation,
      runPlanning,
      handlers: {
        generateCandidates: async seed => (await loadGameService()).generateRentalCandidates(seed || Date.now()),
        enableTestMode: async () => {
          const save = await ensureSave();
          return env.saves.save(enableTestModeForSave(save));
        },
        startRainbowRocketTestRun: async () => {
          const save = await ensureSave();
          const service = await loadGameService();
          const testSave = enableTestModeForSave(save);
          const generationSave: LocalSave = {
            ...testSave,
            stats: {
              ...(testSave.stats || {}),
              set_win_streak: Math.max(RAINBOW_ROCKET_TEST_STREAK, Number(testSave.stats?.set_win_streak || 0)),
              best_set_win_streak: Math.max(RAINBOW_ROCKET_TEST_STREAK, Number(testSave.stats?.best_set_win_streak || 0)),
            },
          };
          const seed = Math.floor(Math.random() * 0xffffffff);
          const talents = activeTalentsForSave(testSave);
          const battleSetting = normalizeBattleSetting(testSave.battle_setting || DEFAULT_BATTLE_SETTING);
          const generated = await generateStarterCandidatesForSave({
            service,
            save: generationSave,
            seed,
            talents,
            count: candidateCountForTalents(talents),
            setting: battleSetting,
          });
          const starterIndexes = pickRainbowRocketTestStarterIndexes(generated);
          const playerTeam = starterIndexes.map(index => generated.team[index]).filter(Boolean);
          const playerDisplay = starterIndexes.map(index => generated.display[index]).filter(Boolean);
          if (playerTeam.length < 3 || playerDisplay.length < 3) throw new Error("彩虹火箭队测试队伍生成失败。");
          testSave.current_run = {
            status: "awaiting_rest",
            seed,
            battles: DEFAULT_BATTLES,
            next_battle: 1,
            battle_no: 0,
            wins: 0,
            player_team: playerTeam,
            player_display: playerDisplay,
            player_state: playerDisplay.map((pokemon, index) => fullStateForPokemon(pokemon, index + 1)),
            enemy_display: [],
            talents,
            battle_setting: battleSetting,
            player_trainer: trainerTools.trainerFromProfile(testSave.trainer),
            run_start_bp: currentBp(testSave),
            coins: 1000,
            non_convertible_coins: 0,
            coins_earned_this_run: 0,
            bp_earned_this_run: 0,
            bp_investments: [0, 0, 0],
            move_investments: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
            bag_items: {},
            rest_status: {exchanges: 0, taken_enemy_slots: [], rest_event_options: [], rest_event_selected_id: null},
            special_run: "rainbow_rocket",
          } as CurrentRunData;
          const run = testSave.current_run as CurrentRunData;
          recordMobilePokemonUsageList(testSave, playerDisplay);
          mobileNormalizeCurrentRun(run);
          run.battle_no = 0;
          run.next_battle = 1;
          run.original_planned_battles = await buildPlannedBattles({
            save: generationSave,
            run,
            service,
            npcCatalog,
            bossTeamPools: await loadBossTeamPools(),
            defaultBattles: DEFAULT_BATTLES,
            battleBackgroundForRun: mobileBattleBackgroundForRun,
            uuid: () => env.uuid.randomUUID(),
          });
          run.planned_battles = await buildRainbowRocketPlannedBattles({
            run,
            service,
            npcCatalog,
            rainbowRocketTeamPools: await loadRainbowRocketTeamPools(),
            battleBackgroundForRun: mobileBattleBackgroundForRun,
            uuid: () => env.uuid.randomUUID(),
          });
          preparationState = {pendingCandidates: null, pendingStarter: null};
          activeBattle = null;
          activeBattleState = null;
          return mobileRestGameState(testSave, "测试：彩虹火箭队入侵已启动。");
        },
        continueRun: async () => {
          const save = await ensureSave();
          const run = save.current_run as CurrentRunData | null;
          if (!run) return gameState({screen: "mainMenu", save, message: `欢迎回来，${save.trainer.name}。`});
          if (run.status === "awaiting_rest") return mobileRestGameState(save, "继续移动端休整。");
          if (run.status === "in_battle" && activeBattle) {
            const service = await loadGameService();
            const state = decorateMobileBattleState(activeBattle.getState(), run);
            return gameState({screen: "battleMain", save, battle: state, battle_bag: await mobileBattleBagCategories(service, run), message: "继续移动端战斗。"});
          }
          if (run.status === "in_battle") {
            rememberRunForSoulmate(save, run);
            save.current_run = null;
            const next = await env.saves.save(save);
            return gameState({screen: "result", save: next, message: "移动端读档发现战斗未完成，已按失败结算。"});
          }
          if (run.status === "ready" && Number(run.wins || 0) <= 0 && !run.enemy_trainer) {
            run.status = "awaiting_rest";
            run.battle_no = 0;
            run.next_battle = 1;
            return mobileRestGameState(save, "出发前可以先整理队伍。");
          }
          return startMobileNextBattle(save);
        },
        battleHint: async () => {
          const save = await ensureSave();
          if (!save.current_run || !activeBattle) throw new Error("当前没有正在进行的对战。");
          return activeBattle.playerAiHint();
        },
        battleChoice: async choice => {
          const save = await ensureSave();
          if (!save.current_run || !activeBattle) throw new Error("当前没有正在进行的对战。");
          const run = save.current_run as CurrentRunData;
          const service = await loadGameService();
          console.info("[changebattle:switch] mobile battleChoice:start", {
            choice,
            before: mobileBattleDebugSnapshot(activeBattleState || activeBattle.getState()),
          });
          const result = await executeBattleChoice(run, activeBattle, choice, {
            hasConsumableItemEffect: itemId => service.hasBattleConsumableItemEffect(itemId),
            isHpStatusReviveRecoveryItem: itemId => mobileIsHpStatusReviveRecoveryItem(service, itemId),
          });
          const outcome = resolveBattleCommandOutcome(result);
          const {state} = outcome;
          activeBattleState = decorateMobileBattleState(state, run);
          console.info("[changebattle:switch] mobile battleChoice:result", {
            choice,
            status: outcome.status,
            shouldPersist: outcome.shouldPersist,
            after: mobileBattleDebugSnapshot(activeBattleState),
          });
          const nextSave = outcome.shouldPersist ? await env.saves.save(save) : save;
          if (outcome.status === "ongoing") return gameState({screen: "battleMain", save: nextSave, battle: activeBattleState, battle_bag: await mobileBattleBagCategories(service, nextSave.current_run as CurrentRunData)});
          return finishMobileBattle(state);
        },
        autoAdvanceBattle: async () => {
          const save = await ensureSave();
          if (!save.current_run || !activeBattle) throw new Error("当前没有正在进行的对战。");
          const run = save.current_run as CurrentRunData;
          const service = await loadGameService();
          const state = await executeBattleAutoAdvance(activeBattle);
          const outcome = resolveBattleCommandOutcome(state);
          activeBattleState = decorateMobileBattleState(state, run);
          if (outcome.status === "ongoing") return gameState({screen: "battleMain", save, battle: activeBattleState, battle_bag: await mobileBattleBagCategories(service, run)});
          return finishMobileBattle(state);
        },
        exchange: async (ownIndex, enemyIndex) => {
          const save = await ensureSave();
          const run = save.current_run as CurrentRunData | null;
          if (!run) return gameState({screen: "mainMenu", save, message: "当前没有进行中的挑战。"});
          if (ownIndex === null || enemyIndex === null) {
            save.current_run = prepareRunForNextBattleAfterRest(run);
            return startMobileNextBattle(save);
          }
          const exchanged = await exchangeMobileEnemyPokemon(save, run, ownIndex, enemyIndex, await loadGameService());
          const next = await env.saves.save(save);
          return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message: `已交换获得 ${mobilePokemonName(exchanged.received)}。`});
        },
        restAction: async action => {
          const save = await ensureSave();
          const run = save.current_run as CurrentRunData | null;
          if (!run) return gameState({screen: "mainMenu", save, message: "当前没有进行中的挑战。"});
          if (action.type === "next") {
            if (rainbowRocketSupportRequired(run)) throw new Error("请先处理彩虹火箭队支援。");
            const questMessage = updateRunQuestAfterRest(run);
            save.current_run = prepareRunForNextBattleAfterRest(run);
            const nextState = await startMobileNextBattle(save);
            return questMessage ? {...nextState, message: [questMessage, nextState.message].filter(Boolean).join(" ")} : nextState;
          }
          if (action.type === "abort") {
            const service = await loadGameService();
            rememberRunForSoulmate(save, run);
            const settled = settleRuntimeRunEnd(save, run, {itemCosts: await mobileItemCostMap(service, run)});
            const message = `挑战已中止。本局 ${settled.convertedCoins}金币折算为 ${settled.convertedBp}BP。`;
            const resultSummary = buildRuntimeResultSummary({
              outcome: "abort",
              headline: "挑战中断",
              subtitle: "当前移动端挑战已中止",
              wins: Number(run.wins || 0),
              run,
              battle: activeBattleState,
              settled,
              defaultBattles: 7,
            });
            await env.saves.appendBattleRecord(buildRuntimeRunRecord({
              id: env.uuid.randomUUID(),
              createdAt: env.now().toISOString(),
              run,
              message,
              outcome: "abort",
              resultSummary,
              defaultBattles: 7,
            }));
            save.current_run = null;
            const next = await env.saves.save(save);
            activeBattle = null;
            activeBattleState = null;
            return gameState({screen: "result", save: next, message, result_summary: resultSummary});
          }
          if (action.type === "choose_rest_event") {
            const message = applyBasicRestEventChoice(save, run, action.eventId);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "exchange") {
            const exchanged = await exchangeMobileEnemyPokemon(save, run, action.ownIndex, action.enemyIndex, await loadGameService());
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message: `已交换获得 ${mobilePokemonName(exchanged.received)}。`});
          }
          if (action.type === "rainbow_rocket_support") {
            const message = applyRainbowRocketSupportChoice(save, run, action, {
              uuid: () => env.uuid.randomUUID(),
              recordPokemonUsage: (_save, pokemon) => {
                const key = toId(pokemon.species_id || pokemon.species || pokemon.name);
                if (!key) return;
                _save.stats = {...(_save.stats || {})};
                _save.stats.pokemon_usage_counts = {
                  ...(_save.stats.pokemon_usage_counts || {}),
                  [key]: Number(_save.stats.pokemon_usage_counts?.[key] || 0) + 1,
                };
              },
            });
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "rainbow_rocket_support_done") {
            completeRainbowRocketSupport(run);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message: "彩虹火箭队支援已确认。"});
          }
          if (action.type === "rainbow_rocket_restore") {
            const message = applyRainbowRocketRestore(run, action.slots || []);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "roll_shop") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队入侵期间普通商店关闭。");
            const shopKind = mobileNormalizeShopKind(action.shopKind);
            mobileAssertShopKindAvailable(run, shopKind);
            const cost = mobileShopNextRollCost(run, shopKind);
            const spent = spendRunCoins(run, cost, `shop-roll:${shopKind}`);
            if (cost <= 0 && Number(run.rest_status?.free_shop_rolls_remaining || 0) > 0) {
              run.rest_status = {...(run.rest_status || {}), free_shop_rolls_remaining: Math.max(0, Number(run.rest_status?.free_shop_rolls_remaining || 0) - 1)};
            }
            run.shop_kind = shopKind;
            run.shop_roll_count = Number(run.shop_roll_count || 0) + 1;
            const offers = await mobileRollShopOffers(await loadGameService(), run, shopKind);
            run.shop_offers_by_kind = {...(run.shop_offers_by_kind || {}), [shopKind]: offers};
            run.shop_offers = offers;
            run.shop_purchased_offer_id = null;
            run.shop_purchased_offer_counts = {};
            run.shop_purchased_item_counts = {};
            run.shop_last_roll_bonus = shopKind === "tm" ? null : shopDuplicateBonusForOffers(offers);
            if (run.shop_last_roll_bonus?.count) {
              const itemId = itemKey(run.shop_last_roll_bonus.item_id);
              run.bag_items = {...(run.bag_items || {}), [itemId]: Number(run.bag_items?.[itemId] || 0) + run.shop_last_roll_bonus.count};
            }
            const next = await env.saves.save(save);
            const bonusText = run.shop_last_roll_bonus?.count ? `抽到 ${run.shop_last_roll_bonus.match_count} 连，免费获得 ${run.shop_last_roll_bonus.count} 个 ${run.shop_last_roll_bonus.name_zh || run.shop_last_roll_bonus.name}！` : "商店抽奖完成。";
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message: `${mobileShopConfig(shopKind).title}：抽奖${spent.message}。${bonusText}`});
          }
          if (action.type === "buy_shop_offer") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队入侵期间普通商店关闭。");
            if (run.rest_status?.event_barter_active) throw new Error("以物易物期间不能使用金币购买，请投入背包道具交换。");
            const found = mobileFindShopOffer(run, action.offerId);
            if (!found) throw new Error("商店商品不存在。");
            const message = buyRunShopOffer(run, mobilePricedShopOffer(run, found.offer, found.shopKind));
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "event_barter_buy") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队入侵期间普通商店关闭。");
            const found = mobileFindShopOffer(run, action.offerId);
            if (!found) throw new Error("商店商品不存在。");
            const offer = found.offer;
            const service = await loadGameService();
            const materials = await Promise.all((action.itemIds || []).map(async itemId => ({item: await mobileItemDetails(service, itemId, run.bag_item_meta?.[itemKey(itemId)]), count: 1})));
            const message = barterRunShopOffer(run, offer, materials);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "buy_item") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队入侵期间普通商店关闭。");
            if (run.rest_status?.event_barter_active) throw new Error("以物易物期间不能使用金币购买，请投入背包道具交换。");
            const item = await mobileItemDetails(await loadGameService(), action.itemId, run.bag_item_meta?.[itemKey(action.itemId)]);
            const message = buyRunItem(run, item);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "forge_items") {
            const service = await loadGameService();
            const rewards = await mobileForgeRewards(service, run, action.itemIds || []);
            const message = forgeRunItems(run, action.itemIds || [], rewards);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "forge_special_item") {
            const service = await loadGameService();
            const reward = await mobileSpecialForgeReward(service, run, action.itemId);
            const message = forgeRunSpecialItem(run, action.itemId, reward, 50);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "forge_tera_orb") {
            if (!mobileBattleSettingHasTerastal(run)) throw new Error("本局没有开启太晶化。");
            const current = run.tera_orb_type || "Normal";
            const nextType = mobileStablePick(MOBILE_TERA_TYPES.filter(type => type !== current), `${run.seed || 1}:tera:${run.battle_no || 0}:${current}`, 1)[0] || "Normal";
            const message = rerollRunTeraOrb(run, nextType, MOBILE_TERA_TYPE_ZH[nextType] || nextType, 50);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "all_in_exchange") {
            const service = await loadGameService();
            const slot = Math.max(0, Math.floor(Number(action.ownIndex || 0)));
            const generated = await service.generateRentalCandidates(service.deriveSeed(Number(run.seed), 0xa111 + Number(run.next_battle || run.battle_no || 1) * 17 + slot), "gen9randombattle", 1, {
              profiles: ["tier4"],
              purpose: "normal",
              battleSetting: run.battle_setting,
            });
            if (!generated.team[0] || !generated.display[0]) throw new Error("孤注一掷生成失败。");
            const message = await applyAllInExchange(save, run, slot, {raw: generated.team[0], display: generated.display[0]}, service);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "event_raid_exchange") {
            const service = await loadGameService();
            const battleNo = Number(run.rest_status?.event_raid_exchange_battle_no || run.next_battle || 1);
            const planned = await ensureMobilePlannedBattle(save, run, battleNo, service, npcCatalog, await loadBossTeamPools(), () => env.uuid.randomUUID());
            const message = await applyRaidExchange(save, run, planned, action.ownIndex, action.enemyIndex, service);
            if (run.planned_battles?.length) buildRuntimeNightSkyState(run, run.planned_battles);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "box_exchange") {
            throw new Error("旧版保险盒天赋已移除。");
          }
          if (action.type === "event_apply_level") {
            const slot = action.slot;
            if (slot < 0 || slot >= run.player_team.length) throw new Error("队伍编号无效。");
            const points = Math.max(0, Math.floor(Number(run.rest_status?.event_level_points || 0)));
            if (points <= 0) throw new Error("没有可分配等级。");
            const cap = badgeLevelCapForTalents(run.talents);
            const rawSet = cloneMobile(run.player_team[slot]) as PokemonSet;
            const currentLevel = Math.max(1, Math.floor(Number(rawSet.level || run.player_display[slot]?.level || 1)));
            if (cap && currentLevel >= cap) throw new Error(`已达到当前徽章等级上限 Lv${cap}。`);
            rawSet.level = Math.min(cap || 100, currentLevel + 1);
            const [nextDisplay] = await (await loadGameService()).describeTeam([rawSet]);
            const stableId = run.player_team[slot]?.showdown_id || run.player_display[slot]?.showdown_id || run.player_state?.[slot]?.showdown_id;
            run.player_team[slot] = rawSet;
            run.player_display[slot] = nextDisplay || {...run.player_display[slot], level: rawSet.level};
            const nextStates = [...(run.player_state || [])];
            nextStates[slot] = adjustedStateAfterEdit(nextStates[slot] || fullStateForPokemon(run.player_display[slot], slot + 1), run.player_display[slot], slot + 1);
            if (stableId) {
              run.player_team[slot].showdown_id = stableId;
              run.player_display[slot].showdown_id = stableId;
              nextStates[slot].showdown_id = stableId;
            }
            run.player_state = nextStates;
            run.rest_status = {...(run.rest_status || {}), event_level_points: points - 1};
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message: `${mobilePokemonName(run.player_display[slot])} 提升到 Lv${rawSet.level}。`});
          }
          if (action.type === "event_learn_move") {
            const availableKey = action.service === "egg" ? "event_egg_service_available" : "event_tutor_service_available";
            if (!run.rest_status?.[availableKey] && run.special_run !== "rainbow_rocket") throw new Error("当前没有对应的事件技能服务。");
            const message = await mobileLearnMove(save, run, action.slot, action.moveSlot, action.moveId, {
              source: action.service,
              cost: run.special_run === "rainbow_rocket" ? 0 : 100,
              label: action.service === "egg" ? "遗传招式" : "教授招式",
            }, await loadGameService());
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "use_tm") {
            const itemId = itemKey(action.itemId);
            const meta = itemId ? run.bag_item_meta?.[itemId] : null;
            const moveId = toId(meta?.move_id || String(action.itemId || "").replace(/^tm:/i, ""));
            if (!itemId || Number(run.bag_items?.[itemId] || 0) <= 0) throw new Error("背包里没有这个技能机器。");
            if (!moveId) throw new Error("技能机器缺少招式信息。");
            const message = await mobileLearnMove(save, run, action.slot, action.moveSlot, moveId, {
              source: "machine",
              cost: 0,
              label: meta?.move_name_zh || meta?.move_name || "技能机器",
            }, await loadGameService());
            run.bag_items = {...(run.bag_items || {}), [itemId]: Math.max(0, Number(run.bag_items?.[itemId] || 0) - 1)};
            if (run.bag_items[itemId] <= 0) delete run.bag_items[itemId];
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "restore_hp" || action.type === "restore_pp" || action.type === "restore_status") {
            throw new Error("休整免费恢复已移除，请使用背包中的恢复道具。");
          }
          if (action.type === "choose_doctor_treatment") {
            const message = applyDoctorTreatment(run, action.branch);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "event_score_bet_adjust") {
            const message = applyScoreBetAdjustment(run, {targetAlive: action.targetAlive, stake: action.stake, multiplier: action.multiplier});
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "bp_to_coins") {
            const message = applyBpToCoins(save, run, action.bp);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "trust_level") {
            const message = await applyTrustLevel(save, run, action.slot, await loadGameService());
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "use_item") {
            const message = await applyRestConsumableItem(run, action.itemId, action.slot, action.moveSlot, await loadGameService(), {stat: action.stat});
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "equip_item" || action.type === "unequip_item") {
            const message = await applyHeldItemChange(run, action.type === "equip_item" ? action.itemId : null, action.slot, await loadGameService());
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "sell_item") {
            if (!run.rest_status?.recycler_available) throw new Error("当前没有道具回收商，不能出售道具。");
            const itemId = itemKey(action.itemId);
            const count = Number(run.bag_items?.[itemId] || 0);
            if (!itemId || count <= 0) throw new Error("背包里没有这个道具。");
            const item = await mobileItemDetails(await loadGameService(), itemId, run.bag_item_meta?.[itemId]);
            const message = sellRunBagItem(save, run, itemId, item);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "draw_moves") {
            const slot = action.slot;
            const moveSlot = action.moveSlot;
            if (slot < 0 || slot >= run.player_team.length) throw new Error("队伍编号无效。");
            const cost = moveDrawCost(run);
            const spent = spendRunCoins(run, cost, "draw-moves");
            const rawSet = run.player_team[slot];
            const currentMoves = new Set((rawSet.moves || []).map((move: unknown) => toId(String(move))));
            const legalMoves = (await (await loadGameService()).learnableMoves(rawSet)).filter(move => {
              const sources = move.learn_sources || [];
              return !currentMoves.has(toId(move.id || move.name)) && (sources.includes("levelup") || sources.includes("egg"));
            });
            const drawKey = `${slot}:${moveSlot}`;
            const drawRoll = Number(run.move_draw_rolls?.[drawKey] || 0) + 1;
            run.move_draw_rolls = {...(run.move_draw_rolls || {}), [drawKey]: drawRoll};
            const draws = mobileStablePick(legalMoves, `${run.seed || 1}:${run.battle_no || 0}:${drawKey}:${drawRoll}`, moveDrawCount(run));
            run.move_draws = {...(run.move_draws || {}), [drawKey]: draws};
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message: `已抽取 ${draws.length} 个候选技能，${spent.message}。`});
          }
          if (action.type === "apply_drawn_move") {
            const slot = action.slot;
            const moveSlot = action.moveSlot;
            const drawMoveSlot = action.drawMoveSlot ?? moveSlot;
            const drawKey = `${slot}:${drawMoveSlot}`;
            const draws = run.move_draws?.[drawKey] || [];
            const selected = draws.find(move => toId(move.id || move.name) === toId(action.moveId));
            if (!selected) throw new Error("请选择已抽取的候选技能。");
            const message = await mobileLearnMove(save, run, slot, moveSlot, selected.id || selected.name, {
              cost: 0,
              label: "抽取技能",
            }, await loadGameService());
            delete run.move_draws?.[drawKey];
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "scout_next") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队路线无法使用普通情报。");
            const service = await loadGameService();
            const battleNo = Number(run.next_battle || (Number(run.battle_no || 0) + 1) || 1);
            const planned = await ensureMobilePlannedBattle(save, run, battleNo, service, npcCatalog, await loadBossTeamPools(), () => env.uuid.randomUUID());
            const message = applyRuntimeScoutNext(run, planned, action.level);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "night_sky_scout") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队路线无法使用普通情报。");
            const service = await loadGameService();
            await ensureMobilePlannedBattles(save, run, service, npcCatalog, await loadBossTeamPools(), () => env.uuid.randomUUID());
            const message = applyRuntimeNightSkyScout(run, run.planned_battles || [], action.battleNo, action.level);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "reroute_next") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队路线无法使用普通改道。");
            const service = await loadGameService();
            const battleNo = Math.max(1, Math.min(Number(run.battles || 7), Math.floor(Number(action.battleNo || run.next_battle || 1))));
            const planned = await ensureMobilePlannedBattle(save, run, battleNo, service, npcCatalog, await loadBossTeamPools(), () => env.uuid.randomUUID());
            if (planned.special_event === "villain_intrusion") throw new Error("赛程异常，公子驾到无法更换反派头目乱入。");
            const route = routeForRunBattle(save, run, battleNo, 7);
            const currentTrainer = chooseTrainerForRoute(npcCatalog, route, run, battleNo);
            const nextTrainer = rerouteTrainerForRoute(npcCatalog, route, run, battleNo);
            const message = applyRuntimeReroute(run, battleNo, currentTrainer, nextTrainer, 7);
            await refreshMobilePlannedBattle(save, run, battleNo, service, npcCatalog, await loadBossTeamPools(), () => env.uuid.randomUUID());
            if (run.planned_battles?.length) buildRuntimeNightSkyState(run, run.planned_battles);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "set_named_champion") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队路线无法使用指名挑战。");
            const service = await loadGameService();
            const message = applyRuntimeNamedChampion(save, run, npcCatalog, action.trainerId);
            await refreshMobilePlannedBattle(save, run, Number(run.battles || 7), service, npcCatalog, await loadBossTeamPools(), () => env.uuid.randomUUID());
            if (run.planned_battles?.length) buildRuntimeNightSkyState(run, run.planned_battles);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message});
          }
          if (action.type === "randomize_stat_part" || action.type === "randomize_all_stats") {
            const slot = action.slot;
            if (slot < 0 || slot >= run.player_team.length) throw new Error("队伍编号无效。");
            const part = action.type === "randomize_all_stats" ? "all" : action.part;
            const baseCost = action.type === "randomize_all_stats" ? RANDOMIZE_ALL_COST : RANDOMIZE_PART_COST;
            const cost = statResetCost(run, baseCost, part, mobileStableUnit(`${run.seed || 1}:${run.battle_no || 0}:${slot}:${part}:${currentCoins(run)}`));
            const spent = spendRunCoins(run, cost, "randomize-stats");
            await mobileRandomizeStats(run, slot, part, await loadGameService());
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message: `已随机重置，${spent.message}。`});
          }
          if (action.type === "adjust_move") {
            const slot = action.slot;
            const moveSlot = action.moveSlot;
            if (slot < 0 || slot >= run.player_team.length) throw new Error("队伍编号无效。");
            const rawSet = cloneMobile(run.player_team[slot]) as PokemonSet;
            const currentMoves = [...(rawSet.moves || [])];
            if (moveSlot < 0 || moveSlot >= currentMoves.length) throw new Error("招式格子无效。");
            const selected = (await (await loadGameService()).learnableMoves(rawSet)).find(move => move.id === toId(action.moveId) || toId(move.name) === toId(action.moveId));
            if (!selected) throw new Error("这不是该宝可梦的合法可学招式。");
            const otherMoves = new Set(currentMoves.map(move => toId(String(move))));
            otherMoves.delete(toId(String(currentMoves[moveSlot] || "")));
            if (otherMoves.has(selected.id)) throw new Error("不能重复学习同一个招式。");
            const moveInvestments = run.move_investments || [];
            const oldInvestment = Number(moveInvestments[slot]?.[moveSlot] || 0);
            const refund = Math.floor(oldInvestment / 2);
            const cost = mobileMoveCost(selected);
            const pricedCost = pricedForRun(run, cost);
            if (currentCoins(run) + refund < pricedCost) throw new Error(`金币不足，需要 ${pricedCost}金币；旧技能可返还 ${refund}金币。`);
            currentMoves[moveSlot] = selected.name || selected.id;
            rawSet.moves = currentMoves;
            const [nextDisplay] = await (await loadGameService()).describeTeam([rawSet]);
            const stableId = run.player_team[slot]?.showdown_id || run.player_display[slot]?.showdown_id || run.player_state?.[slot]?.showdown_id;
            if (refund) addCoins(run, refund, "move-refund");
            const spent = spendRunCoins(run, cost, "adjust-move");
            run.player_team[slot] = rawSet;
            run.player_display[slot] = nextDisplay || run.player_display[slot];
            const oldState = run.player_state?.[slot] || fullStateForPokemon(run.player_display[slot], slot + 1);
            const nextStates = [...(run.player_state || [])];
            nextStates[slot] = adjustedStateAfterEdit(oldState, run.player_display[slot], slot + 1);
            if (stableId) {
              run.player_team[slot].showdown_id = stableId;
              run.player_display[slot].showdown_id = stableId;
              nextStates[slot].showdown_id = stableId;
            }
            run.player_state = nextStates;
            moveInvestments[slot] = moveInvestments[slot] || [0, 0, 0, 0];
            moveInvestments[slot][moveSlot] = spent.paid;
            run.move_investments = moveInvestments;
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message: `已学习 ${selected.name_zh || selected.name}，${spent.message}${refund ? `，返还 ${refund}金币` : ""}。`});
          }
          if (action.type === "adjust_stats") {
            const slot = action.slot;
            if (slot < 0 || slot >= run.player_team.length) throw new Error("队伍编号无效。");
            const rawSet = cloneMobile(run.player_team[slot]) as PokemonSet;
            rawSet.ivs = normalizeStatsInput(action.ivs, 31);
            rawSet.evs = normalizeStatsInput(action.evs, 0);
            rawSet.ability = action.ability || rawSet.ability || run.player_display[slot]?.ability;
            rawSet.nature = action.nature || rawSet.nature || run.player_display[slot]?.nature || "Serious";
            const options = await (await loadGameService()).editOptions(rawSet);
            validateStatAdjustments(rawSet, options);
            const [nextDisplay] = await (await loadGameService()).describeTeam([rawSet]);
            const stableId = run.player_team[slot]?.showdown_id || run.player_display[slot]?.showdown_id || run.player_state?.[slot]?.showdown_id;
            const spent = spendRunCoins(run, ADJUST_STATS_COST, "adjust-stats");
            run.player_team[slot] = rawSet;
            run.player_display[slot] = nextDisplay || run.player_display[slot];
            const oldState = run.player_state?.[slot] || fullStateForPokemon(run.player_display[slot], slot + 1);
            const nextStates = [...(run.player_state || [])];
            nextStates[slot] = adjustedStateAfterEdit(oldState, run.player_display[slot], slot + 1);
            if (stableId) {
              run.player_team[slot].showdown_id = stableId;
              run.player_display[slot].showdown_id = stableId;
              nextStates[slot].showdown_id = stableId;
            }
            run.player_state = nextStates;
            const investments = run.bp_investments || [];
            investments[slot] = Number(investments[slot] || 0) + spent.paid;
            run.bp_investments = investments;
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message: `已保存能力值调整，${spent.message}。`});
          }
          if (action.type === "set_lead") {
            setRunLeadSlot(run, action.slot);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: await mobileRest(next, next.current_run as CurrentRunData, await loadGameService()), message: "首发已调整。"});
          }
          throw new Error(mobileUnsupportedRestActionMessage(action.type));
        },
        shopItems: async query => {
          const needle = String(query || "").trim().toLowerCase();
          return (await (await loadGameService()).itemOptions())
            .filter(item => !needle || [item.id, item.name, item.name_zh, item.desc, item.desc_zh].join(" ").toLowerCase().includes(needle))
            .slice(0, 40);
        },
        learnableMoves: async (slot, query) => {
          const save = await ensureSave();
          const run = save.current_run as CurrentRunData | null;
          if (!run || slot < 0 || slot >= run.player_team.length) return [];
          const needle = String(query || "").trim().toLowerCase();
          return (await (await loadGameService()).learnableMoves(run.player_team[slot]))
            .filter(move => !needle || [move.id, move.name, move.name_zh, move.desc, move.desc_zh, move.type, move.type_zh].join(" ").toLowerCase().includes(needle))
            .slice(0, 60);
        },
        editOptions: async slot => {
          const save = await ensureSave();
          const run = save.current_run as CurrentRunData | null;
          if (!run || slot < 0 || slot >= run.player_team.length) return {abilities: [], natures: []};
          return (await loadGameService()).editOptions(run.player_team[slot]);
        },
        dexSearch: async (category, query = "", offset = 0, limit = 8) => {
          const save = await profileSettings.loadSave();
          if (category === "trainers") return trainerDexSearch({save, npcCatalog, query, offset, limit, includeNormal: false, requireFrontAsset: true});
          return decorateDexUsageCounts(save, await (await loadGameService()).dexSearch(category, query, offset, limit));
        },
        getBattleState: async () => activeBattleState,
      },
    });
  }

  return new Proxy({} as ChangeBattleRuntimeApi, {
    get(_target, property: keyof ChangeBattleRuntimeApi) {
      return async (...args: unknown[]) => {
        const api = await runtime();
        const handler = api[property] as (...values: unknown[]) => Promise<unknown>;
        return handler(...args);
      };
    },
  });
}

async function mobileRest(save: LocalSave, run: CurrentRunData, service: GameService): Promise<RestState> {
  const shopKind = mobileNormalizeAvailableShopKind(run, run.shop_kind);
  const shopOffersByKind = Object.fromEntries(Object.entries(run.shop_offers_by_kind || {}).map(([kind, offers]) => [
    kind,
    (offers || []).map(offer => mobilePricedShopOffer(run, offer, mobileNormalizeShopKind(kind))),
  ])) as Partial<Record<MobileShopKind, ShopOffer[]>>;
  const activeOffers = mobileCurrentShopOffers(run);
  if (run.planned_battles?.length) buildRuntimeNightSkyState(run, run.planned_battles);
  return buildRestState({
    save,
    run,
    defaultBattles: 7,
    costs: {
      exchange: run.special_run === "rainbow_rocket" ? null : undefined,
      move_draw: moveDrawCost(run),
      scout_basic: 0,
      scout_one: SCOUT_ONE_COST,
      scout_all: SCOUT_ALL_COST,
    },
    extra: {
      move_draws: run.move_draws || {},
      move_draw_rolls: run.move_draw_rolls || {},
      scout: run.scout,
      night_sky: run.night_sky,
      bag_categories: await mobileBagCategories(service, run),
      exchange_box: run.exchange_box?.display || [],
      all_in_used: Boolean(run.all_in_exchange_used),
      all_in_pending_next: Boolean(run.rest_status?.all_in_pending_next),
      all_in_result: run.rest_status?.all_in_result || null,
      score_bet: run.rest_status?.event_score_bet_next ? normalizeScoreBetState(run.rest_status.event_score_bet_next, Math.max(Number(run.rest_status.event_score_bet_next.stake || SCORE_BET_MIN_STAKE), scoreBetMaxStakeForCoins(currentCoins(run), Number(run.rest_status.event_score_bet_next.stake || 0)))) : undefined,
      shop: run.special_run === "rainbow_rocket" ? undefined : {
        kind: shopKind,
        title: mobileShopConfig(shopKind).title,
        theme: mobileShopConfig(shopKind).theme,
        available_kinds: mobileAvailableShopKinds(run),
        roll_count: Number(run.shop_roll_count || 0),
        next_roll_cost: mobileShopNextRollCost(run, shopKind),
        slot_count: shopOfferCount(run),
        free_rolls_remaining: Number(run.rest_status?.free_shop_rolls_remaining || 0),
        slot_discounts: run.rest_status?.shop_slot_discounts || [],
        offers: activeOffers,
        offers_by_kind: shopOffersByKind,
        purchased_offer_id: run.shop_purchased_offer_id || null,
        purchased_offer_counts: run.shop_purchased_offer_counts || {},
        purchased_item_counts: run.shop_purchased_item_counts || {},
        last_roll_bonus: run.shop_last_roll_bonus || null,
      },
      rest_event: {
        required: Boolean(run.rest_status?.rest_event_options?.length && !run.rest_status?.rest_event_selected_id),
        selected_id: run.rest_status?.rest_event_selected_id || null,
        options: run.rest_status?.rest_event_options || [],
      },
      event_services: {
        doctor: Boolean(run.rest_status?.event_doctor_pending),
        tutor: run.special_run === "rainbow_rocket" || Boolean(run.rest_status?.event_tutor_service_available),
        egg: run.special_run === "rainbow_rocket" || Boolean(run.rest_status?.event_egg_service_available),
        raid_exchange: Boolean(run.rest_status?.event_raid_exchange_available && !run.rest_status?.event_raid_exchange_used),
        raid_exchange_battle_no: run.rest_status?.event_raid_exchange_battle_no,
        level_points: Math.max(0, Number(run.rest_status?.event_level_points || 0)),
        score_bet: Boolean(run.rest_status?.event_score_bet_next),
      },
      rest_event_statuses: [runQuestStatus(run, "rest")].filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
    },
  });
}

function mobileCurrentShopOffers(run: CurrentRunData): ShopOffer[] {
  const shopKind = mobileNormalizeAvailableShopKind(run, run.shop_kind);
  return (run.shop_offers_by_kind?.[shopKind] || run.shop_offers || []).map(offer => mobilePricedShopOffer(run, offer, shopKind));
}

function mobileFindShopOffer(run: CurrentRunData, offerId: string): {offer: ShopOffer; shopKind: MobileShopKind} | undefined {
  for (const [kind, offers] of Object.entries(run.shop_offers_by_kind || {})) {
    const offer = (offers || []).find(item => item.offer_id === offerId);
    if (offer) return {offer, shopKind: mobileNormalizeShopKind(kind)};
  }
  const offer = (run.shop_offers || []).find(item => item.offer_id === offerId);
  return offer ? {offer, shopKind: mobileNormalizeAvailableShopKind(run, run.shop_kind)} : undefined;
}

function parseMobileShopPool(csv: string): MobileShopPoolEntry[] {
  return String(csv || "").split(/\r?\n/).slice(1).map(line => {
    const [idRaw = "", kindRaw = "", categoryRaw = "", costRaw = "", weightRaw = "", enabledRaw = "", notesRaw = ""] = line.split(",");
    const kind: MobileShopPoolEntry["kind"] = toId(kindRaw) === "tm" ? "tm" : "item";
    const categoryId = toId(categoryRaw);
    const category: ItemCategory = kind === "tm" ? "tm" : categoryId === "consumable" ? "consumable" : "held";
    const id = kind === "tm" && idRaw.trim() === "*" ? "*" : itemKey(idRaw);
    return {
      id,
      kind,
      category,
      cost: Math.max(0, Number(costRaw || 0)),
      weight: Math.max(0, Number(weightRaw || 1)),
      enabled: Boolean(id) && String(enabledRaw || "1").trim() !== "0",
      notes: notesRaw || "",
    };
  }).filter(entry => entry.enabled && entry.weight > 0 && Boolean(entry.id));
}

function mobileNormalizeShopKind(value: unknown): MobileShopKind {
  return value === "held" || value === "tm" || value === "training" || value === "recovery" || value === "mega" || value === "zmove" ? value : "recovery";
}

function mobileGen7SpecialShopEnabled(run: CurrentRunData, system: "mega" | "zmove"): boolean {
  const setting = normalizeBattleSetting(run.battle_setting || DEFAULT_BATTLE_SETTING);
  return setting.battle_rule_preset === "gen7" && setting.enabled_battle_systems.includes(system);
}

function mobileAvailableShopKinds(run: CurrentRunData): MobileShopKind[] {
  const kinds: MobileShopKind[] = ["recovery", "held", "tm", "training"];
  if (mobileGen7SpecialShopEnabled(run, "mega")) kinds.push("mega");
  if (mobileGen7SpecialShopEnabled(run, "zmove")) kinds.push("zmove");
  return kinds;
}

function mobileNormalizeAvailableShopKind(run: CurrentRunData, value: unknown): MobileShopKind {
  const kind = mobileNormalizeShopKind(value);
  return mobileAvailableShopKinds(run).includes(kind) ? kind : "recovery";
}

function mobileAssertShopKindAvailable(run: CurrentRunData, kind: MobileShopKind): void {
  if (mobileAvailableShopKinds(run).includes(kind)) return;
  if (kind === "mega" || kind === "zmove") throw new Error("Mega/Z 商店仅在 Gen7 规则开启时可用。");
  throw new Error("当前商店不可用。");
}

function mobileShopConfig(kind: MobileShopKind): {title: string; theme: ShopState["theme"]} {
  return {title: MOBILE_SHOP_KIND_CONFIG[kind].title, theme: MOBILE_SHOP_KIND_CONFIG[kind].theme};
}

function mobileEventShopPriceMultiplier(run: CurrentRunData): number {
  return Math.max(0.1, Number(run.rest_status?.event_shop_price_multiplier || 1));
}

function mobileShopNextRollCost(run: CurrentRunData, kind: MobileShopKind): number {
  if (Number(run.rest_status?.free_shop_rolls_remaining || 0) > 0) return 0;
  return applyRestShopKindDiscount(run, kind, Math.ceil(MOBILE_SHOP_KIND_CONFIG[kind].rollCost * mobileEventShopPriceMultiplier(run)));
}

function mobilePricedShopOffer(run: CurrentRunData, offer: ShopOffer, kind: MobileShopKind): ShopOffer {
  const eventPriced = Math.ceil(Math.max(0, Math.floor(Number(offer.cost || 0))) * mobileEventShopPriceMultiplier(run));
  return {...offer, cost: applyRestShopKindDiscount(run, kind, eventPriced)};
}

function mobileShopPoolBucketForEntry(entry: MobileShopPoolEntry): MobileShopPoolBucket | null {
  if (entry.kind === "tm") return "tm";
  const id = itemKey(entry.id);
  const text = `${id} ${entry.notes || ""}`.toLowerCase();
  if (isTrainingShopItemId(id)) return "training";
  if (id.endsWith("berry") || text.includes("berry")) return "berry";
  if (/ether|elixir/.test(id) || /\bpp\b/.test(text)) return "pp";
  if (entry.category === "consumable") return "healing";
  if (entry.category === "held") return "held";
  return null;
}

function mobileBattleSettingAllowsItem(service: GameService, itemId: string, run: CurrentRunData): boolean {
  const id = itemKey(itemId);
  if (!id) return false;
  const system = service.battleSystemForItem(id);
  if (!system) return true;
  return normalizeBattleSetting(run.battle_setting || DEFAULT_BATTLE_SETTING).enabled_battle_systems.includes(system);
}

function mobileIsSpecialBattleItem(service: GameService, itemId: string): boolean {
  const id = itemKey(itemId);
  return Boolean(id && service.battleSystemForItem(id));
}

function mobileIsRegularHeldShopItem(service: GameService, entry: MobileShopPoolEntry): boolean {
  return entry.kind === "item" && entry.category === "held" && !mobileIsSpecialBattleItem(service, entry.id);
}

function mobileSeededRng(seed: string): () => number {
  let state = mobileStableHash(seed) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function mobileShuffleByRng<T>(values: T[], rng: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(rng() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function mobileWeightedPick<T extends {weight?: number}>(values: T[], rng: () => number): T | null {
  const total = values.reduce((sum, value) => sum + Math.max(0, Number(value.weight || 1)), 0);
  if (total <= 0) return values[0] || null;
  let cursor = rng() * total;
  for (const value of values) {
    cursor -= Math.max(0, Number(value.weight || 1));
    if (cursor <= 0) return value;
  }
  return values[values.length - 1] || null;
}

function mobileRollTrainingShopOffer(
  buckets: Partial<Record<TrainingShopGroup, Array<ShopOffer & {weight?: number}>>>,
  rng: () => number,
  candidateLimit: number,
): ShopOffer | null {
  const groups = (Object.keys(TRAINING_SHOP_GROUP_WEIGHTS) as TrainingShopGroup[])
    .filter(group => (buckets[group] || []).length > 0)
    .map(group => ({group, weight: TRAINING_SHOP_GROUP_WEIGHTS[group]}));
  const group = mobileWeightedPick(groups, rng)?.group;
  if (!group) return null;
  const candidates = mobileShuffleByRng(buckets[group] || [], rng).slice(0, Math.max(1, candidateLimit));
  const selected = mobileWeightedPick(candidates, rng);
  if (!selected) return null;
  const {weight: _weight, ...offer} = selected as ShopOffer & {weight?: number};
  return offer;
}

async function mobileShopOfferFromPoolEntry(service: GameService, entry: MobileShopPoolEntry, index: number, run: CurrentRunData): Promise<ShopOffer | null> {
  if (!mobileBattleSettingAllowsItem(service, entry.id, run)) return null;
  const item = (await service.itemOptions()).find(option => itemKey(option.id || option.name) === entry.id);
  if (!item) return null;
  const baseCost = Math.max(0, Number(entry.cost || item.cost || 0));
  return {
    ...item,
    id: entry.id,
    cost: baseCost,
    category: entry.category,
    offer_id: `shop-pool-${index}-${entry.id}`,
    source: "shop",
  };
}

async function mobileGuaranteedShopOffer(service: GameService, index: number, run: CurrentRunData, rng: () => number): Promise<ShopOffer | null> {
  const guaranteed = MOBILE_GUARANTEED_SHOP_ITEMS[Math.floor(rng() * MOBILE_GUARANTEED_SHOP_ITEMS.length)] || MOBILE_GUARANTEED_SHOP_ITEMS[0];
  const entry = MOBILE_SHOP_POOL.find(item => itemKey(item.id) === guaranteed.id)
    || {id: guaranteed.id, kind: "item", category: "consumable", cost: guaranteed.cost, weight: 1, enabled: true, notes: "guaranteed recovery"} as MobileShopPoolEntry;
  const offer = await mobileShopOfferFromPoolEntry(service, entry, index, run);
  return offer ? {...offer, offer_id: `${Number(run.shop_roll_count || 0)}-${index}-guaranteed-${guaranteed.id}`} : null;
}

async function mobilePremiumRecoveryShopOffers(service: GameService, run: CurrentRunData, existingOffers: ShopOffer[]): Promise<ShopOffer[]> {
  const guaranteedOffers = (await Promise.all(MOBILE_PREMIUM_RECOVERY_ITEM_IDS.map(async (id, index) => {
    const entry = MOBILE_SHOP_POOL.find(item => itemKey(item.id) === id);
    if (entry) return mobileShopOfferFromPoolEntry(service, entry, index, run);
    const item = (await service.itemOptions()).find(option => itemKey(option.id || option.name) === id);
    return item ? {...item, id, category: "consumable" as const, offer_id: `shop-pool-${index}-${id}`, source: "shop" as const} : null;
  }))).filter((offer): offer is ShopOffer => Boolean(offer));
  const guaranteedIds = new Set(guaranteedOffers.map(offer => itemKey(offer.id || offer.name)));
  const rest = existingOffers.filter(offer => !guaranteedIds.has(itemKey(offer.id || offer.name)));
  const count = Math.max(guaranteedOffers.length, shopOfferCount(run));
  return [...guaranteedOffers, ...rest].slice(0, count);
}

function mobileWithShopSlotPricing(run: CurrentRunData, offer: ShopOffer, index: number): ShopOffer {
  const slotDiscount = Number(run.rest_status?.shop_slot_discounts?.[index] || 0);
  const cost = slotDiscount > 0 ? Math.floor(Number(offer.cost || 0) * slotDiscount) : Number(offer.cost || 0);
  return {...offer, cost, discount: slotDiscount || offer.discount, offer_id: `${Number(run.shop_roll_count || 0)}-${index}-${itemKey(offer.id || offer.name)}`};
}

async function mobileRollShopOffers(service: GameService, run: CurrentRunData, kind: MobileShopKind): Promise<ShopOffer[]> {
  mobileAssertShopKindAvailable(run, kind);
  const count = shopOfferCount(run);
  if (kind === "tm") {
    const rng = mobileSeededRng(`${run.seed || 1}:mobile-tm-shop:${run.shop_roll_count || 0}:${run.battle_no || run.next_battle || 0}`);
    const usableByCurrentTeam = new Map<string, MoveSummary>();
    for (const rawSet of run.player_team || []) {
      for (const move of await service.learnableMoves(rawSet)) {
        if (!(move.learn_sources || []).includes("machine")) continue;
        const id = toId(move.id || move.name);
        if (id && !usableByCurrentTeam.has(id)) usableByCurrentTeam.set(id, move);
      }
    }
    const machineMoves = await service.machineMoves();
    const unusable = machineMoves.filter(move => !usableByCurrentTeam.has(toId(move.id || move.name)));
    const usablePool = mobileShuffleByRng(Array.from(usableByCurrentTeam.values()), rng);
    const unusablePool = mobileShuffleByRng(unusable, rng);
    const preferredUsableCount = Math.min(usablePool.length, Math.max(0, count - 1));
    const picks = [
      ...usablePool.slice(0, preferredUsableCount),
      ...unusablePool.slice(0, count - preferredUsableCount),
      ...usablePool.slice(preferredUsableCount),
    ].slice(0, count);
    return picks.map((move, index) => mobileWithShopSlotPricing(run, mobileTmOffer(move, index), index));
  }
  const itemEntries = MOBILE_SHOP_POOL.filter(entry => {
    if (!mobileBattleSettingAllowsItem(service, entry.id, run)) return false;
    if (kind === "held") return mobileIsRegularHeldShopItem(service, entry);
    if (kind === "training") return entry.kind === "item" && isTrainingShopItemId(entry.id);
    if (kind === "mega") return entry.kind === "item" && entry.category === "held" && service.battleSystemForItem(entry.id) === "mega";
    if (kind === "zmove") return entry.kind === "item" && entry.category === "held" && service.battleSystemForItem(entry.id) === "zmove";
    const bucket = mobileShopPoolBucketForEntry(entry);
    return Boolean(bucket && MOBILE_SHOP_KIND_CONFIG[kind].buckets.includes(bucket));
  });
  const itemOffers = (await Promise.all(itemEntries.map((entry, index) => mobileShopOfferFromPoolEntry(service, entry, index, run))))
    .filter((item): item is ShopOffer => Boolean(item))
    .map((item, index) => {
      const entry = itemEntries.find(poolEntry => poolEntry.id === itemKey(item.id || item.name));
      return {...item, offer_id: `shop-item-${index}-${itemKey(item.id || item.name)}`, weight: entry?.weight || 1};
    });
  const rng = mobileSeededRng(`${run.seed || 1}:mobile-shop:${kind}:${run.shop_roll_count || 0}:${run.battle_no || run.next_battle || 0}`);
  const candidateLimit = Math.max(1, shopOfferCount(run));
  if (kind === "training") {
    const trainingBuckets: Partial<Record<TrainingShopGroup, Array<ShopOffer & {weight?: number}>>> = {};
    for (const offer of itemOffers) {
      const group = trainingShopGroupForItemId(offer.id || offer.name);
      if (!group) continue;
      trainingBuckets[group] = [...(trainingBuckets[group] || []), offer];
    }
    const result: ShopOffer[] = [];
    for (let index = 0; index < count; index += 1) {
      const selected = mobileRollTrainingShopOffer(trainingBuckets, rng, candidateLimit);
      if (!selected) break;
      result.push(selected);
    }
    return result.map((offer, index) => mobileWithShopSlotPricing(run, offer, index));
  }
  const buckets: Partial<Record<MobileShopPoolBucket, Array<ShopOffer & {weight?: number}>>> = {
    healing: [],
    held: [],
    pp: [],
    berry: [],
    tm: [],
    training: [],
  };
  for (const offer of itemOffers) {
    const entry = itemEntries.find(poolEntry => poolEntry.id === itemKey(offer.id || offer.name));
    const bucket = entry ? mobileShopPoolBucketForEntry(entry) : null;
    if (bucket && bucket !== "tm" && MOBILE_SHOP_KIND_CONFIG[kind].buckets.includes(bucket)) buckets[bucket]?.push(offer);
  }
  const result: ShopOffer[] = [];
  for (let index = 0; index < count; index += 1) {
    const allowedBuckets = MOBILE_SHOP_KIND_CONFIG[kind].buckets;
    const bucket = mobileWeightedPick(allowedBuckets.filter(entry => (buckets[entry] || []).length > 0).map(entry => ({bucket: entry, weight: MOBILE_SHOP_BUCKET_WEIGHTS[entry]})), rng)?.bucket;
    const bucketPool = bucket ? mobileShuffleByRng(buckets[bucket] || [], rng).slice(0, candidateLimit) : [];
    const selected = bucket ? mobileWeightedPick(bucketPool, rng) : null;
    if (!selected) break;
    const {weight: _weight, ...offer} = selected as ShopOffer & {weight?: number};
    result.push(offer);
  }
  const hasGuaranteed = result.some(offer => MOBILE_GUARANTEED_SHOP_ITEMS.some(item => item.id === itemKey(offer.id || offer.name)));
  if (kind === "recovery" && !hasGuaranteed) {
    const guaranteed = await mobileGuaranteedShopOffer(service, 0, run, rng);
    if (guaranteed) {
      if (result.length) result[0] = guaranteed;
      else result.push(guaranteed);
    }
  }
  const premiumResult = run.rest_status?.event_premium_shop_goods && kind === "recovery"
    ? await mobilePremiumRecoveryShopOffers(service, run, result)
    : result;
  return premiumResult.map((offer, index) => mobileWithShopSlotPricing(run, offer, index));
}

function mobileTmOffer(move: MoveSummary, index: number): ShopOffer {
  const moveId = toId(move.id || move.name);
  return {
    id: `tm:${moveId}`,
    name: `TM ${move.name || moveId}`,
    name_zh: `技能机器 ${move.name_zh || move.name || moveId}`,
    cost: mobileMoveCost(move),
    desc: `Teaches ${move.name || moveId}.`,
    desc_zh: `让宝可梦学会 ${move.name_zh || move.name || moveId}。`,
    category: "tm",
    icon_asset: tmIconAssetForMoveType(move.type),
    offer_id: `${Number(index)}-tm-${moveId}`,
    source: "shop",
    move_id: moveId,
    move_name: move.name || moveId,
    move_name_zh: move.name_zh || move.name || moveId,
    move_type: move.type,
    move_type_zh: move.type_zh,
  };
}

function mobileRememberBagItemMeta(run: CurrentRunData, offer: ShopOffer): void {
  const id = itemKey(offer.id || offer.name);
  if (!id) return;
  run.bag_item_meta = {
    ...(run.bag_item_meta || {}),
    [id]: {
      id,
      name: offer.name,
      name_zh: offer.name_zh,
      desc: offer.desc,
      desc_zh: offer.desc_zh,
      cost: Math.max(0, Number(offer.cost || 0)),
      icon_asset: offer.icon_asset,
      category: offer.category,
      move_id: offer.move_id,
      move_name: offer.move_name,
      move_name_zh: offer.move_name_zh,
      move_type: offer.move_type,
      move_type_zh: offer.move_type_zh,
    },
  };
}

async function mobileItemDetails(service: GameService, itemId: string, meta?: Partial<ShopOffer>): Promise<ShopItem> {
  const id = itemKey(itemId);
  if (/^tm:/i.test(id)) {
    const moveId = id.slice(3);
    const move = (await service.machineMoves()).find(candidate => toId(candidate.id || candidate.name) === moveId);
    const moveType = meta?.move_type || move?.type;
    return {
      ...(meta || {}),
      id,
      name: meta?.name || `TM ${move?.name || moveId}`,
      name_zh: meta?.name_zh || `技能机器 ${meta?.move_name_zh || move?.name_zh || meta?.move_name || move?.name || moveId}`,
      desc: meta?.desc || `Teaches ${meta?.move_name || move?.name || moveId}.`,
      desc_zh: meta?.desc_zh || `让宝可梦学会 ${meta?.move_name_zh || move?.name_zh || meta?.move_name || move?.name || moveId}。`,
      cost: Math.max(0, Number(meta?.cost || 0)),
      icon_asset: tmIconAssetForMoveType(moveType),
      move_type: moveType,
      move_type_zh: meta?.move_type_zh || move?.type_zh,
    } as ShopItem;
  }
  const found = (await service.itemOptions()).find(item => itemKey(item.id || item.name) === id);
  const coupon = REST_SHOP_DISCOUNT_COUPONS[id];
  return {
    ...(found || (coupon ? {id, name: coupon.name, name_zh: coupon.name_zh, desc: coupon.desc, desc_zh: coupon.desc_zh, cost: 0, icon_asset: coupon.icon_asset, category: "consumable"} : {id, name: id, name_zh: id, desc: "", desc_zh: "", cost: 0, category: "held"})),
    ...(meta || {}),
    id,
    cost: Math.max(0, Number(meta?.cost ?? found?.cost ?? 0)),
  } as ShopItem;
}

async function mobileItemCostMap(service: GameService, run: CurrentRunData): Promise<Record<string, number>> {
  const costs: Record<string, number> = {};
  await Promise.all(Object.entries(run.bag_items || {}).map(async ([rawId, rawCount]) => {
    if (Math.max(0, Number(rawCount || 0)) <= 0) return;
    const id = itemKey(rawId);
    const item = await mobileItemDetails(service, id, run.bag_item_meta?.[id]);
    costs[id] = Math.max(0, Number(item.cost || 0));
  }));
  return costs;
}

async function mobileBagCategories(service: GameService, run: CurrentRunData): Promise<BagCategoryView> {
  const result: BagCategoryView = {consumable: [], held: [], tm: []};
  for (const [rawId, rawCount] of Object.entries(run.bag_items || {})) {
    const count = Math.max(0, Math.floor(Number(rawCount || 0)));
    if (count <= 0) continue;
    const id = itemKey(rawId);
    const meta = run.bag_item_meta?.[id];
    const item = await mobileItemDetails(service, id, meta);
    let category = (meta?.category as ItemCategory | undefined) || itemCategory(item);
    if (category === "consumable" && !isTrainingShopItemId(id) && !(await service.hasConsumableItemEffect(id))) category = "held";
    const moveId = /^tm:/i.test(id) ? id.slice(3) : undefined;
    result[category].push({
      ...item,
      id,
      count,
      category,
      item_battle_system: service.battleSystemForItem(id) || undefined,
      sell_price: sellPriceForItem({cost: Math.max(0, Number(item.cost || 0))}, run),
      move_id: meta?.move_id || moveId,
      move_name: meta?.move_name || moveId,
      move_name_zh: meta?.move_name_zh || (moveId ? String(item.name_zh || item.name || moveId).replace(/^技能机器\s*/, "") : undefined),
      move_type: (item as ShopItem & {move_type?: string}).move_type || meta?.move_type,
      move_type_zh: (item as ShopItem & {move_type_zh?: string}).move_type_zh || meta?.move_type_zh,
    });
  }
  if (mobileBattleSettingHasTerastal(run) && run.tera_orb_type) {
    const type = run.tera_orb_type;
    const typeZh = run.tera_orb_type_zh || MOBILE_TERA_TYPE_ZH[type as keyof typeof MOBILE_TERA_TYPE_ZH] || type;
    result.held.push({
      id: `tera-orb:${String(type).toLowerCase()}`,
      name: `${type} Tera Orb`,
      name_zh: `${typeZh}太晶珠`,
      count: 1,
      category: "held",
      item_battle_system: "terastal",
      icon_asset: "assets/placeholders/item.png",
      locked: true,
      lock_reason: "太晶珠会在技能菜单中使用。",
    });
  }
  return result;
}

async function mobileBattleBagCategories(service: GameService, run: CurrentRunData): Promise<BagCategoryView> {
  const categories = await mobileBagCategories(service, run);
  const consumable = [];
  for (const item of categories.consumable) {
    if (await service.hasBattleConsumableItemEffect(item.id)) consumable.push(item);
  }
  return {...categories, consumable};
}

async function mobileForgeRewards(service: GameService, run: CurrentRunData, materialIds: string[]): Promise<ShopItem[]> {
  const items = await service.itemOptions();
  const materialSet = new Set(materialIds.map(itemKey).filter(Boolean));
  const candidates = items
    .filter(item => {
      const id = itemKey(item.id || item.name);
      return id && !materialSet.has(id) && !/^tm:/i.test(id);
    })
    .sort((a, b) => Number(b.cost || 0) - Number(a.cost || 0) || String(a.name || a.id || "").localeCompare(String(b.name || b.id || "")));
  const picked = mobileStablePick(candidates, `${run.seed || 1}:forge:${run.battle_no || 0}:${materialIds.join(",")}`, 1);
  return picked.length ? picked.map(item => ({...item, id: itemKey(item.id || item.name), cost: Math.max(0, Number(item.cost || 0))} as ShopItem)) : [await mobileItemDetails(service, materialIds[0] || "potion")];
}

async function mobileSpecialForgeReward(service: GameService, run: CurrentRunData, materialId: string): Promise<ShopItem> {
  const items = await service.itemOptions();
  const material = itemKey(materialId);
  const candidates = items
    .filter(item => {
      const id = itemKey(item.id || item.name);
      return id && id !== material && !/^tm:/i.test(id) && Number(item.cost || 0) >= 300;
    })
    .sort((a, b) => Number(b.cost || 0) - Number(a.cost || 0) || String(a.name || a.id || "").localeCompare(String(b.name || b.id || "")));
  const picked = mobileStablePick(candidates, `${run.seed || 1}:special-forge:${run.battle_no || 0}:${material}`, 1)[0];
  return picked ? ({...picked, id: itemKey(picked.id || picked.name), cost: Math.max(0, Number(picked.cost || 0))} as ShopItem) : mobileItemDetails(service, materialId);
}

function mobileBattleSettingHasTerastal(run: CurrentRunData): boolean {
  const setting = run.battle_setting;
  return setting?.battle_rule_preset === "gen9" && (setting.enabled_battle_systems || []).includes("terastal");
}

async function mobileRandomizeStats(run: CurrentRunData, slot: number, part: string, service: GameService): Promise<void> {
  const rawSet = cloneMobile(run.player_team[slot]) as PokemonSet;
  const seed = `${run.seed || 1}:${run.battle_no || 0}:${slot}:${part}:${JSON.stringify(rawSet)}`;
  const optionState = service.editOptions(rawSet);
  if (part === "all" || part === "ivs") {
    rawSet.ivs = Object.fromEntries(["hp", "atk", "def", "spa", "spd", "spe"].map(stat => [stat, Math.floor(mobileStableUnit(`${seed}:iv:${stat}`) * 32)]));
  }
  if (part === "all" || part === "evs") {
    let remaining = 510;
    const evs: Record<string, number> = {};
    for (const stat of ["hp", "atk", "def", "spa", "spd", "spe"]) {
      const value = Math.min(252, remaining, Math.floor(mobileStableUnit(`${seed}:ev:${stat}`) * 253));
      evs[stat] = value;
      remaining -= value;
    }
    rawSet.evs = evs;
  }
  const options = await optionState;
  if ((part === "all" || part === "ability") && options.abilities.length) {
    const picked = mobileStablePick(options.abilities, `${seed}:ability`, 1)[0];
    rawSet.ability = picked?.name || picked?.id || rawSet.ability;
  }
  if ((part === "all" || part === "nature") && options.natures.length) {
    rawSet.nature = mobileStablePick(options.natures, `${seed}:nature`, 1)[0]?.name || rawSet.nature || "Serious";
  }
  validateStatAdjustments(rawSet, await service.editOptions(rawSet));
  const [nextDisplay] = await service.describeTeam([rawSet]);
  const stableId = run.player_team[slot]?.showdown_id || run.player_display[slot]?.showdown_id || run.player_state?.[slot]?.showdown_id;
  run.player_team[slot] = rawSet;
  run.player_display[slot] = nextDisplay || run.player_display[slot];
  const nextStates = [...(run.player_state || [])];
  nextStates[slot] = adjustedStateAfterEdit(nextStates[slot] || fullStateForPokemon(run.player_display[slot], slot + 1), run.player_display[slot], slot + 1);
  if (stableId) {
    run.player_team[slot].showdown_id = stableId;
    run.player_display[slot].showdown_id = stableId;
    nextStates[slot].showdown_id = stableId;
  }
  run.player_state = nextStates;
}

function mobileStablePick<T>(values: T[], seed: string, count: number): T[] {
  return values
    .map((value, index) => ({value, weight: mobileStableHash(`${seed}:${index}:${JSON.stringify(value)}`)}))
    .sort((a, b) => a.weight - b.weight)
    .slice(0, Math.max(0, count))
    .map(entry => entry.value);
}

function mobileStableUnit(seed: string): number {
  return mobileStableHash(seed) / 0xffffffff;
}

function mobileStableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mobilePokemonName(pokemon: {name?: string; species?: string; species_zh?: string}): string {
  return pokemon.species_zh || pokemon.name || pokemon.species || "宝可梦";
}

function mobileBattleRewardCoins(run: CurrentRunData): number {
  return 500 + battleSpecialRewardCoins(run);
}

function mobileMoveCost(move: MoveSummary): number {
  if (Number.isFinite(Number((move as MoveSummary & {cost?: number}).cost))) return Math.max(0, Math.floor(Number((move as MoveSummary & {cost?: number}).cost)));
  const power = Number(move.power || 0);
  if (power >= 120) return 800;
  if (power > 90) return 650;
  if (power > 60) return 500;
  if (power > 30) return 400;
  return 300;
}

function mobileUnsupportedRestActionMessage(type: string): string {
  const labels: Record<string, string> = {
    event_barter_buy: "以物易物购买",
    event_raid_exchange: "骇人奇袭交换",
    forge_items: "熔炉重铸",
    forge_special_item: "特殊熔炉",
    forge_tera_orb: "太晶珠重铸",
    box_exchange: "保险盒交换",
    all_in_exchange: "孤注一掷",
    buy_item: "旧版直接购买",
    scout_next: "小道消息",
    night_sky_scout: "夜观天象",
    reroute_next: "公子驾到",
    set_named_champion: "指名挑战",
  };
  const label = labels[type] || type;
  return `Android 版暂未开放「${label}」。当前可用普通休整、商店、背包、技能、能力调整、首发、交换、普通奇遇和彩虹火箭支援。`;
}

async function mobileLearnMove(
  save: LocalSave,
  run: CurrentRunData,
  slot: number,
  moveSlot: number,
  moveId: string,
  options: {source?: "tutor" | "egg" | "machine"; cost: number; label: string},
  service: GameService,
): Promise<string> {
  void save;
  if (slot < 0 || slot >= run.player_team.length) throw new Error("队伍编号无效。");
  const rawSet = cloneMobile(run.player_team[slot]) as PokemonSet;
  const currentMoves = [...(rawSet.moves || [])];
  if (moveSlot < 0 || moveSlot >= Math.max(1, currentMoves.length)) throw new Error("招式格子无效。");
  const selected = (await service.learnableMoves(rawSet)).find(move => {
    if (toId(move.id || move.name) !== toId(moveId)) return false;
    return !options.source || (move.learn_sources || []).includes(options.source);
  });
  if (!selected) throw new Error(`这不是该宝可梦可学习的${options.label}。`);
  const selectedId = toId(selected.id || selected.name);
  const otherMoves = new Set(currentMoves.map(move => toId(String(move))));
  otherMoves.delete(toId(String(currentMoves[moveSlot] || "")));
  if (otherMoves.has(selectedId)) throw new Error("不能重复学习同一个招式。");
  if (options.cost > 0) spendRunCoins(run, options.cost, `event-learn-${options.source || "move"}`);
  currentMoves[moveSlot] = selected.name || selected.id;
  rawSet.moves = currentMoves;
  const [nextDisplay] = await service.describeTeam([rawSet]);
  const stableId = run.player_team[slot]?.showdown_id || run.player_display[slot]?.showdown_id || run.player_state?.[slot]?.showdown_id;
  run.player_team[slot] = rawSet;
  run.player_display[slot] = nextDisplay || run.player_display[slot];
  const nextStates = [...(run.player_state || [])];
  nextStates[slot] = adjustedStateAfterEdit(nextStates[slot] || fullStateForPokemon(run.player_display[slot], slot + 1), run.player_display[slot], slot + 1);
  if (stableId) {
    run.player_team[slot].showdown_id = stableId;
    run.player_display[slot].showdown_id = stableId;
    nextStates[slot].showdown_id = stableId;
  }
  run.player_state = nextStates;
  const moveInvestments = run.move_investments || [];
  moveInvestments[slot] = moveInvestments[slot] || [0, 0, 0, 0];
  moveInvestments[slot][moveSlot] = Number(moveInvestments[slot][moveSlot] || 0) + Math.max(0, Number(options.cost || 0));
  run.move_investments = moveInvestments;
  return `${mobilePokemonName(run.player_display[slot])} 学会了 ${selected.name_zh || selected.name || selected.id}。`;
}

async function exchangeMobileEnemyPokemon(save: LocalSave, run: CurrentRunData, ownIndex: number, enemyIndex: number, service: GameService): Promise<RuntimeExchangeResult> {
  if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队路线不能交换敌方宝可梦。");
  if (!run.enemy_raw || !run.enemy_display) throw new Error("没有可交换的敌方队伍。");
  if (run.rest_status?.event_exchange_disabled) throw new Error("恋恋不舍：本次休整无法交换宝可梦。");
  const own = Math.floor(Number(ownIndex));
  const foe = Math.floor(Number(enemyIndex));
  if (own < 0 || own >= Math.min(3, run.player_team.length)) throw new Error("队伍编号无效。");
  if (foe < 0 || foe >= Math.min(3, run.enemy_raw.length, run.enemy_display.length)) throw new Error("敌方宝可梦编号无效。");
  const foeSlot = foe + 1;
  const restStatus = run.rest_status || {exchanges: 0, taken_enemy_slots: []};
  const exchanges = Number(restStatus.exchanges || 0);
  if (!canExchangeBoss(run, exchanges)) throw new Error(run.boss_type === "champion" ? "冠军的宝可梦暂时不能交换。" : "馆主/四天王宝可梦默认只能交换 1 只；携带馆主认可后可继续交换。");
  if (exchanges >= 3) throw new Error("本次休整最多交换 3 只。");
  if ((restStatus.taken_enemy_slots || []).includes(foeSlot)) throw new Error("这只敌方宝可梦已经被交换过了。");
  const cost = exchangeCost(run, exchanges);
  const spent = spendRunCoins(run, cost, "exchange");
  const oldItem = itemKey(run.player_display[own]?.item_id || run.player_team[own]?.item);
  if (oldItem) run.bag_items = {...(run.bag_items || {}), [oldItem]: Number(run.bag_items?.[oldItem] || 0) + 1};
  const keepItem = exchangeKeepsItem(run);
  let nextRaw = cloneMobile(run.enemy_raw[foe]) as PokemonSet;
  let nextDisplay = cloneMobile(run.enemy_display[foe]);
  if (!keepItem) {
    nextRaw.item = "";
    nextDisplay.item = "";
    nextDisplay.item_id = "";
    nextDisplay.item_zh = "";
    nextDisplay.item_desc = "";
    nextDisplay.item_desc_zh = "";
  }
  if (hasTalent(run.talents, "exchange_elite_training")) {
    const currentTier = Math.max(1, Math.min(4, Number(nextDisplay.stage_tier || nextRaw.stage_tier || 1)));
    const profile = `tier${Math.min(4, currentTier + 1)}` as RuntimeGenerationProfile;
    const speciesId = nextDisplay.species_id || nextRaw.species;
    const upgraded = await service.generateRentalCandidates(service.deriveSeed(Number(run.seed), 0xe300 + (own + 1) * 41 + (foe + 1) * 97 + exchanges), "gen9randombattle", 1, {
      profiles: [profile],
      speciesIds: speciesId ? [speciesId] : undefined,
      purpose: "normal",
      battleSetting: run.battle_setting,
    });
    const template = upgraded.team[0];
    if (template) {
      nextRaw = {
        ...nextRaw,
        level: template.level,
        ivs: template.ivs,
        evs: template.evs,
        nature: template.nature,
        stage_tier: template.stage_tier,
        species_tier: template.species_tier,
        generation_profile: template.generation_profile,
      };
      const [described] = await service.describeTeam([nextRaw]);
      nextDisplay = described || nextDisplay;
      if (!keepItem) nextDisplay = {...nextDisplay, item: "", item_id: "", item_zh: "", item_desc: "", item_desc_zh: ""};
    }
  }
  const cappedArrival = await applyArrivalLevelCap(run.talents, nextRaw, nextDisplay, service);
  nextRaw = cappedArrival.raw;
  nextDisplay = cappedArrival.display;
  if (!keepItem) nextDisplay = {...nextDisplay, item: "", item_id: "", item_zh: "", item_desc: "", item_desc_zh: ""};
  if (hasTalent(run.talents, "economy_shiny_collector")) {
    nextRaw = {...nextRaw, shiny: true};
    nextDisplay = shinyPokemon(nextDisplay);
  }
  const oldShowdownId = run.player_team[own]?.showdown_id || run.player_display[own]?.showdown_id || run.player_state?.[own]?.showdown_id;
  const stableId = takeReplacementRunShowdownId(run, own, oldShowdownId);
  if (stableId) {
    nextRaw.showdown_id = stableId;
    nextRaw.pokeball = stableId;
    nextDisplay.showdown_id = stableId;
  }
  run.player_team = [...(run.player_team || [])];
  run.player_display = [...(run.player_display || [])];
  run.player_team[own] = nextRaw;
  run.player_display[own] = nextDisplay;
  const nextStates = [...(run.player_state || [])];
  nextStates[own] = partialStateForPokemon(nextDisplay, own + 1, exchangeStateRatio(run));
  if (stableId) nextStates[own].showdown_id = stableId;
  run.player_state = nextStates;
  const investments = run.bp_investments || [];
  const moveInvestments = run.move_investments || [];
  investments[own] = 0;
  moveInvestments[own] = [0, 0, 0, 0];
  run.bp_investments = investments;
  run.move_investments = moveInvestments;
  const key = toId(nextDisplay.species_id || nextDisplay.species || nextDisplay.name);
  if (key) {
    save.stats = {...(save.stats || {})};
    save.stats.pokemon_usage_counts = {
      ...(save.stats.pokemon_usage_counts || {}),
      [key]: Number(save.stats.pokemon_usage_counts?.[key] || 0) + 1,
    };
  }
  run.rest_status = {...restStatus, exchanges: exchanges + 1, taken_enemy_slots: [...(restStatus.taken_enemy_slots || []), foeSlot]};
  void spent;
  return {run, ownIndex: own, enemyIndex: foe, received: nextDisplay};
}

async function mobileIsHpStatusReviveRecoveryItem(service: GameService, itemId: string): Promise<boolean> {
  const id = toId(itemId);
  if (isTrainingConsumableItemId(id)) return false;
  if (/^tm:/i.test(String(itemId || "")) || /berry/i.test(id)) return true;
  if (!(await service.hasConsumableItemEffect(id))) return false;
  return !["ether", "maxether", "elixir", "maxelixir"].includes(id);
}

function isTrainingConsumableItemId(itemId: string): boolean {
  return isTrainingShopItemId(itemId);
}

function mobileStarterBag(purchased: ShopOffer[]): {items: Record<string, number>; meta: Record<string, Partial<ShopOffer>>} {
  const items: Record<string, number> = {};
  const meta: Record<string, Partial<ShopOffer>> = {};
  for (const offer of purchased) {
    const id = itemKey(offer.id || offer.name);
    if (!id) continue;
    items[id] = Number(items[id] || 0) + 1;
    meta[id] = {
      id,
      name: offer.name,
      name_zh: offer.name_zh,
      desc: offer.desc,
      desc_zh: offer.desc_zh,
      cost: offer.cost,
      category: offer.category,
      icon_asset: offer.icon_asset,
      move_id: offer.move_id,
      move_name: offer.move_name,
      move_name_zh: offer.move_name_zh,
      move_type: offer.move_type,
      move_type_zh: offer.move_type_zh,
    };
  }
  return {items, meta};
}

function cloneMobile<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function rainbowRocketTestCandidateScore(raw: PokemonSet | undefined, display: RentalPokemon | undefined, index: number): number {
  const profileRank: Record<string, number> = {tier1: 1, tier2: 2, tier3: 3, tier4: 4, champion: 5};
  const profile = String(raw?.generation_profile || display?.generation_profile || "");
  const speciesTier = Number(raw?.species_tier || display?.species_tier || 0);
  const stageTier = Number(raw?.stage_tier || display?.stage_tier || 0);
  const level = Number(raw?.level || display?.level || 0);
  return (profileRank[profile] || 0) * 100000 + speciesTier * 1000 + stageTier * 100 + level - index / 100;
}

function pickRainbowRocketTestStarterIndexes(generated: GeneratedTeam): number[] {
  return generated.display
    .map((display, index) => ({index, score: rainbowRocketTestCandidateScore(generated.team[index], display, index)}))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(entry => entry.index);
}

function recordMobilePokemonUsageList(save: LocalSave, pokemonList: Array<Partial<RentalPokemon> | PokemonSet | null | undefined>): void {
  for (const pokemon of pokemonList) {
    const key = toId(String(pokemon?.species_id || pokemon?.species || pokemon?.name || ""));
    if (!key) continue;
    save.stats = {...(save.stats || {})};
    save.stats.pokemon_usage_counts = {
      ...(save.stats.pokemon_usage_counts || {}),
      [key]: Number(save.stats.pokemon_usage_counts?.[key] || 0) + 1,
    };
  }
}

function mobileNormalizeCurrentRun(run: CurrentRunData): CurrentRunData {
  if (run.status === "awaiting_exchange") run.status = "awaiting_rest";
  run.wins = Number(run.wins || 0);
  run.battle_no = Math.max(1, Number(run.battle_no || run.next_battle || 1));
  run.next_battle = Math.max(1, Number(run.next_battle || run.battle_no || 1));
  run.battles = Math.max(1, Number(run.battles || 7));
  run.player_team = run.player_team || [];
  run.player_display = run.player_display || [];
  run.bp_earned_this_run = Number(run.bp_earned_this_run || 0);
  run.coins_earned_this_run = Number(run.coins_earned_this_run || 0);
  run.shop_kind = mobileNormalizeAvailableShopKind(run, run.shop_kind);
  if (!run.shop_offers_by_kind && run.shop_offers?.length) run.shop_offers_by_kind = {[run.shop_kind]: run.shop_offers};
  if (run.shop_offers_by_kind?.[run.shop_kind]) run.shop_offers = run.shop_offers_by_kind[run.shop_kind];
  return run;
}

async function ensureMobileVillainIntrusion(
  save: LocalSave,
  run: CurrentRunData,
  service: GameService,
  npcCatalog: TrainerNpcView[],
  bossTeamPools: RuntimeBossTeamPoolRow[],
  rainbowRocketTeamPools: RuntimeBossTeamPoolRow[],
  uuid: () => string,
): Promise<boolean> {
  if (run.status !== "awaiting_rest") return false;
  if (run.special_run === "rainbow_rocket") return false;
  const battleNo = Number(run.next_battle || (Number(run.battle_no || 0) + 1) || 1);
  if (battleNo > Number(run.battles || 7)) return false;
  if (Number(run.rest_status?.event_villain_intrusion_checked_battle_no || 0) === battleNo) return false;
  const restStatus = {...(run.rest_status || {}), event_villain_intrusion_checked_battle_no: battleNo};
  run.rest_status = restStatus;
  if (Number(run.wins || 0) < 2) return true;
  if (!mobileHasChampionWin(save, npcCatalog)) return true;
  if (!run.planned_battles?.length) {
    run.planned_battles = await buildPlannedBattles({
      save,
      run,
      service,
      npcCatalog,
      bossTeamPools,
      defaultBattles: 7,
      battleBackgroundForRun: mobileBattleBackgroundForRun,
      uuid,
    });
  }
  const planned = run.planned_battles.find(entry => Number(entry.battle_no) === battleNo);
  if (!planned || planned.route_type !== "normal" || planned.special_event === "villain_intrusion") return true;
  if (!villainIntrusionRollHits(run, battleNo)) return true;
  const replacement = await buildVillainIntrusionPlannedBattle({
    run,
    battleNo,
    service,
    npcCatalog,
    rainbowRocketTeamPools,
    battleBackgroundForRun: mobileBattleBackgroundForRun,
    uuid,
  });
  run.planned_battles = [...(run.planned_battles || []).filter(entry => Number(entry.battle_no) !== battleNo), replacement]
    .sort((a, b) => Number(a.battle_no) - Number(b.battle_no));
  run.rest_status = {
    ...restStatus,
    event_villain_intrusion_active: true,
    event_villain_intrusion_battle_no: battleNo,
    event_villain_intrusion_trainer_id: replacement.enemy_trainer.id,
    rest_event_options: [],
    rest_event_selected_id: null,
  };
  delete (run as {scout?: unknown}).scout;
  delete (run as {night_sky?: unknown}).night_sky;
  return true;
}

async function ensureMobilePlannedBattle(
  save: LocalSave,
  run: CurrentRunData,
  battleNo: number,
  service: GameService,
  npcCatalog: TrainerNpcView[],
  bossTeamPools: RuntimeBossTeamPoolRow[],
  uuid: () => string,
): Promise<PlannedBattleData> {
  const existing = (run.planned_battles || []).find(entry => Number(entry.battle_no) === battleNo);
  if (existing) return existing;
  const planned = await buildPlannedBattle({
    save,
    run,
    battleNo,
    service,
    npcCatalog,
    bossTeamPools,
    defaultBattles: 7,
    battleBackgroundForRun: mobileBattleBackgroundForRun,
    uuid,
  });
  run.planned_battles = [...(run.planned_battles || []), planned].sort((a, b) => Number(a.battle_no) - Number(b.battle_no));
  return planned;
}

async function refreshMobilePlannedBattle(
  save: LocalSave,
  run: CurrentRunData,
  battleNo: number,
  service: GameService,
  npcCatalog: TrainerNpcView[],
  bossTeamPools: RuntimeBossTeamPoolRow[],
  uuid: () => string,
): Promise<PlannedBattleData> {
  const planned = await buildPlannedBattle({
    save,
    run,
    battleNo,
    service,
    npcCatalog,
    bossTeamPools,
    defaultBattles: 7,
    battleBackgroundForRun: mobileBattleBackgroundForRun,
    uuid,
  });
  run.planned_battles = [...(run.planned_battles || []).filter(entry => Number(entry.battle_no) !== battleNo), planned]
    .sort((a, b) => Number(a.battle_no) - Number(b.battle_no));
  return planned;
}

async function ensureMobilePlannedBattles(
  save: LocalSave,
  run: CurrentRunData,
  service: GameService,
  npcCatalog: TrainerNpcView[],
  bossTeamPools: RuntimeBossTeamPoolRow[],
  uuid: () => string,
): Promise<PlannedBattleData[]> {
  const battles = Math.max(1, Number(run.battles || 7));
  for (let battleNo = 1; battleNo <= battles; battleNo += 1) {
    await ensureMobilePlannedBattle(save, run, battleNo, service, npcCatalog, bossTeamPools, uuid);
  }
  return run.planned_battles || [];
}

function mobileHasChampionWin(save: LocalSave, npcCatalog: TrainerNpcView[]): boolean {
  if (Number(save.stats?.set_win_streak || 0) > 0) return true;
  const bossDex = save.boss_dex || {};
  return npcCatalog.some(trainer => trainer.type === "champion" && Number(bossDex[trainer.id]?.wins || 0) > 0);
}

function mobileBossTeamForPlanned(
  planned: PlannedBattleData,
  run: CurrentRunData,
  battleNo: number,
  bossTeamPools: RuntimeBossTeamPoolRow[],
  rainbowRocketTeamPools: RuntimeBossTeamPoolRow[],
): RuntimeTeamPoolSelection | null {
  if (planned.special_event === "rainbow_rocket") return pickTeamPoolSelection(rainbowRocketTeamPools, planned.enemy_trainer, run, battleNo, "rainbow_rocket", 4);
  if (planned.special_event === "villain_intrusion") return pickTeamPoolSelection(rainbowRocketTeamPools, planned.enemy_trainer, run, battleNo, "villain_intrusion", 3);
  if (planned.route_type === "normal") return null;
  return pickTeamPoolSelection(bossTeamPools, planned.enemy_trainer, run, battleNo, "boss", 3);
}

async function loadMobileTeamPools(data: RuntimeDataProvider, runtimePath: string, defaultProfile: RuntimeGenerationProfile): Promise<RuntimeBossTeamPoolRow[]> {
  return loadRuntimeTeamPools(data, runtimePath, defaultProfile);
}

function mobileBattleBackgroundForRun(_run: CurrentRunData, trainer: {type?: string}, _battleNo: number): BattleBackgroundView {
  return trainer.type === "champion"
    ? {id: "champion-stage", name: "冠军舞台", src: "assets/battle-backgrounds/champion-stage.png"}
    : {id: "mountain-route", name: "山地", src: "assets/battle-backgrounds/mountain-route.png"};
}
