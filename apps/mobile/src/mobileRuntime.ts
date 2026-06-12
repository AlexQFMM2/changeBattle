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
  badgeLevelCapForTalents,
  battleSpecialRewardCoins,
  barterRunShopOffer,
  completeRainbowRocketSupport,
  currentCoins,
  canExchangeBoss,
  chooseTrainerForRoute,
  decorateDexUsageCounts,
  ensureRainbowRocketSupport,
  ensureBasicRestEventOptions,
  loadRuntimeTeamPools,
  loadTrainerNpcCatalog,
  markStarterOrigin,
  normalizeStatsInput,
  exchangeCost,
  exchangeKeepsItem,
  exchangeStateRatio,
  itemKey,
  itemCategory,
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
  rerouteTrainerForRoute,
  resolveBattleCommandOutcome,
  pricedForRun,
  createTrainerProfileTools,
  buyRunItem,
  buyRunShopOffer,
  forgeRunItems,
  forgeRunSpecialItem,
  moveDrawCost,
  moveDrawCount,
  setRunLeadSlot,
  shopNextRollCost,
  shopOfferCount,
  rerollRunTeraOrb,
  statResetCost,
  spendRunCoins,
  routeForRunBattle,
  sellRunBagItem,
  sellPriceForItem,
  shinyPokemon,
  settleBasicBattleResult,
  starterChoiceState,
  starterProfilesForStreak,
  starterSpeciesTiersForStreak,
  takeReplacementRunShowdownId,
  talentLevel,
  toId,
  trainerDexSearch,
  validateStatAdjustments,
  villainIntrusionRollHits,
} from "@changebattle/game-runtime";
import {DEFAULT_BATTLE_SETTING, normalizeBattleSetting} from "@changebattle/shared";
import type {BagCategoryView, BattleBackgroundView, BattleState, CurrentRunData, DesktopGameState, ItemCategory, LocalSave, MoveSummary, PlannedBattleData, PokemonSet, RestState, ShopItem, ShopOffer, ShopState, TrainerNpcView, TrainerProfile} from "@changebattle/shared";
import {createMobileRuntimeEnvironment} from "./mobileRuntimeEnv";

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
      }));
      activeBattleState = decorateMobileBattleState(activeBattle.getState(), run);
      return gameState({screen: "battleMain", save: next, battle: activeBattleState, battle_bag: await mobileBagCategories(battleService, run), message: prepared.message});
    };
    const finishMobileBattle = async (state: BattleState): Promise<DesktopGameState> => {
      const save = await ensureSave();
      const run = save.current_run as CurrentRunData | null;
      if (!run || !activeBattle) return gameState({screen: "result", save, battle: state, message: "移动端战斗已结束。"});
      const perspective = finishedBattlePerspective(run, state, activeBattle);
      applyFinishedBattlePerspectiveToRun(run, perspective);
      const settled = settleBasicBattleResult(save, run, state, {
        playerState: perspective.playerState,
        defaultBattles: 7,
        rewardCoins: mobileBattleRewardCoins(run),
        lossMessage: "移动端挑战失败。",
        winMessage: wins => `移动端真实战斗胜利，获得 ${mobileBattleRewardCoins(run)} 金币。当前连胜：${wins}`,
        completedMessage: wins => `移动端挑战通关，完成 ${wins} 连胜，获得 ${mobileBattleRewardCoins(run)} 金币。`,
      });
      recordTrainerDexResult(save, run.enemy_trainer?.id, settled.outcome === "loss" ? "loss" : "win", {now: env.now().toISOString()});
      const resultSummary = buildRuntimeResultSummary({
        outcome: settled.outcome === "loss" ? "loss" : "win",
        headline: settled.outcome === "loss" ? "挑战失败" : settled.outcome === "completed" ? "通关" : "战斗胜利",
        subtitle: settled.message,
        wins: settled.outcome === "loss" ? Number(run.wins || 0) : Number(settled.wins || run.wins || 0),
        run,
        battle: state,
        battleReward: settled.outcome === "loss" ? undefined : mobileBattleRewardCoins(run),
        defaultBattles: 7,
      });
      await env.saves.appendBattleRecord(buildRuntimeBattleRecord({
        id: env.uuid.randomUUID(),
        createdAt: env.now().toISOString(),
        run,
        battle: state,
        message: settled.message,
        outcome: settled.outcome === "loss" ? "loss" : "win",
        resultSummary,
        defaultBattles: 7,
      }));
      if (settled.outcome === "loss") {
        const next = await env.saves.save(save);
        activeBattle = null;
        activeBattleState = decorateMobileBattleState(state, run);
        return gameState({screen: "result", save: next, battle: activeBattleState, message: settled.message});
      }
      if (settled.outcome === "completed") {
        const done = await env.saves.save(save);
        activeBattle = null;
        activeBattleState = decorateMobileBattleState(state, run);
        return gameState({screen: "result", save: done, battle: activeBattleState, message: settled.message});
      }
      activeBattle = null;
      activeBattleState = decorateMobileBattleState(state, run);
      return mobileRestGameState(save, settled.message, activeBattleState);
    };
    const mobileRestGameState = async (save: LocalSave, message: string, battle?: BattleState | null): Promise<DesktopGameState> => {
      const run = save.current_run as CurrentRunData | null;
      if (!run) return gameState({screen: "mainMenu", save, message});
      await ensureMobileVillainIntrusion(save, run, await loadGameService(), npcCatalog, await loadBossTeamPools(), await loadRainbowRocketTeamPools(), () => env.uuid.randomUUID());
      await ensureRainbowRocketSupport(run, {service: await loadGameService(), uuid: () => env.uuid.randomUUID()});
      ensureBasicRestEventOptions(run);
      const next = await env.saves.save(save);
      return gameState({screen: "rest", save: next, battle: battle || undefined, rest: mobileRest(next, next.current_run as CurrentRunData), message});
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
            rest: mobileRest(next, next.current_run as CurrentRunData),
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
        continueRun: async () => {
          const save = await ensureSave();
          const run = save.current_run as CurrentRunData | null;
          if (!run) return gameState({screen: "mainMenu", save, message: `欢迎回来，${save.trainer.name}。`});
          if (run.status === "awaiting_rest") return mobileRestGameState(save, "继续移动端休整。");
          if (run.status === "in_battle" && activeBattle) {
            const service = await loadGameService();
            const state = decorateMobileBattleState(activeBattle.getState(), run);
            return gameState({screen: "battleMain", save, battle: state, battle_bag: await mobileBagCategories(service, run), message: "继续移动端战斗。"});
          }
          if (run.status === "in_battle") {
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
        battleChoice: async choice => {
          const save = await ensureSave();
          if (!save.current_run || !activeBattle) throw new Error("当前没有正在进行的对战。");
          const run = save.current_run as CurrentRunData;
          const service = await loadGameService();
          const result = await executeBattleChoice(run, activeBattle, choice, {
            hasConsumableItemEffect: itemId => service.hasConsumableItemEffect(itemId),
            isHpStatusReviveRecoveryItem: itemId => mobileIsHpStatusReviveRecoveryItem(service, itemId),
          });
          const outcome = resolveBattleCommandOutcome(result);
          const {state} = outcome;
          activeBattleState = decorateMobileBattleState(state, run);
          const nextSave = outcome.shouldPersist ? await env.saves.save(save) : save;
          if (outcome.status === "ongoing") return gameState({screen: "battleMain", save: nextSave, battle: activeBattleState, battle_bag: await mobileBagCategories(service, nextSave.current_run as CurrentRunData)});
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
          if (outcome.status === "ongoing") return gameState({screen: "battleMain", save, battle: activeBattleState, battle_bag: await mobileBagCategories(service, run)});
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
          return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message: `已交换获得 ${mobilePokemonName(exchanged.received)}。`});
        },
        restAction: async action => {
          const save = await ensureSave();
          const run = save.current_run as CurrentRunData | null;
          if (!run) return gameState({screen: "mainMenu", save, message: "当前没有进行中的挑战。"});
          if (action.type === "next") {
            if (rainbowRocketSupportRequired(run)) throw new Error("请先处理彩虹火箭队支援。");
            save.current_run = prepareRunForNextBattleAfterRest(run);
            return startMobileNextBattle(save);
          }
          if (action.type === "abort") {
            const resultSummary = buildRuntimeResultSummary({
              outcome: "abort",
              headline: "挑战中断",
              subtitle: "当前移动端挑战已中止",
              wins: Number(run.wins || 0),
              run,
              battle: activeBattleState,
              defaultBattles: 7,
            });
            await env.saves.appendBattleRecord(buildRuntimeRunRecord({
              id: env.uuid.randomUUID(),
              createdAt: env.now().toISOString(),
              run,
              message: "挑战已中止。",
              outcome: "abort",
              resultSummary,
              defaultBattles: 7,
            }));
            save.current_run = null;
            const next = await env.saves.save(save);
            activeBattle = null;
            activeBattleState = null;
            return gameState({screen: "mainMenu", save: next, message: "挑战已中止。"});
          }
          if (action.type === "choose_rest_event") {
            const message = applyBasicRestEventChoice(save, run, action.eventId);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "exchange") {
            const exchanged = await exchangeMobileEnemyPokemon(save, run, action.ownIndex, action.enemyIndex, await loadGameService());
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message: `已交换获得 ${mobilePokemonName(exchanged.received)}。`});
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
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "rainbow_rocket_support_done") {
            completeRainbowRocketSupport(run);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message: "彩虹火箭队支援已确认。"});
          }
          if (action.type === "rainbow_rocket_restore") {
            const message = applyRainbowRocketRestore(run, action.slots || []);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "roll_shop") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队入侵期间普通商店关闭。");
            const shopKind = mobileNormalizeShopKind(action.shopKind);
            const cost = shopNextRollCost(run);
            const spent = spendRunCoins(run, cost, `shop-roll:${shopKind}`);
            if (cost <= 0 && Number(run.rest_status?.free_shop_rolls_remaining || 0) > 0) {
              run.rest_status = {...(run.rest_status || {}), free_shop_rolls_remaining: Math.max(0, Number(run.rest_status?.free_shop_rolls_remaining || 0) - 1)};
            }
            run.shop_kind = shopKind;
            run.shop_roll_count = Number(run.shop_roll_count || 0) + 1;
            run.shop_offers = await mobileRollShopOffers(await loadGameService(), run, shopKind);
            run.shop_purchased_offer_id = null;
            run.shop_last_roll_bonus = null;
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message: `${mobileShopConfig(shopKind).title}：抽奖${spent.message}。`});
          }
          if (action.type === "buy_shop_offer") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队入侵期间普通商店关闭。");
            if (run.rest_status?.event_barter_active) throw new Error("以物易物期间不能使用金币购买，请投入背包道具交换。");
            const offer = (run.shop_offers || []).find(item => item.offer_id === action.offerId);
            if (!offer) throw new Error("商店商品不存在。");
            const message = buyRunShopOffer(run, offer);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "event_barter_buy") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队入侵期间普通商店关闭。");
            const offer = (run.shop_offers || []).find(item => item.offer_id === action.offerId);
            if (!offer) throw new Error("商店商品不存在。");
            const service = await loadGameService();
            const materials = await Promise.all((action.itemIds || []).map(async itemId => ({item: await mobileItemDetails(service, itemId, run.bag_item_meta?.[itemKey(itemId)]), count: 1})));
            const message = barterRunShopOffer(run, offer, materials);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "buy_item") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队入侵期间普通商店关闭。");
            if (run.rest_status?.event_barter_active) throw new Error("以物易物期间不能使用金币购买，请投入背包道具交换。");
            const item = await mobileItemDetails(await loadGameService(), action.itemId, run.bag_item_meta?.[itemKey(action.itemId)]);
            const message = buyRunItem(run, item);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "forge_items") {
            const service = await loadGameService();
            const rewards = await mobileForgeRewards(service, run, action.itemIds || []);
            const message = forgeRunItems(run, action.itemIds || [], rewards);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "forge_special_item") {
            const service = await loadGameService();
            const reward = await mobileSpecialForgeReward(service, run, action.itemId);
            const message = forgeRunSpecialItem(run, action.itemId, reward, 50);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "forge_tera_orb") {
            if (!mobileBattleSettingHasTerastal(run)) throw new Error("本局没有开启太晶化。");
            const current = run.tera_orb_type || "Normal";
            const nextType = mobileStablePick(MOBILE_TERA_TYPES.filter(type => type !== current), `${run.seed || 1}:tera:${run.battle_no || 0}:${current}`, 1)[0] || "Normal";
            const message = rerollRunTeraOrb(run, nextType, MOBILE_TERA_TYPE_ZH[nextType] || nextType, 50);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
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
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "event_raid_exchange") {
            const service = await loadGameService();
            const battleNo = Number(run.rest_status?.event_raid_exchange_battle_no || run.next_battle || 1);
            const planned = await ensureMobilePlannedBattle(save, run, battleNo, service, npcCatalog, await loadBossTeamPools(), () => env.uuid.randomUUID());
            const message = await applyRaidExchange(save, run, planned, action.ownIndex, action.enemyIndex, service);
            if (run.planned_battles?.length) buildRuntimeNightSkyState(run, run.planned_battles);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
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
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message: `${mobilePokemonName(run.player_display[slot])} 提升到 Lv${rawSet.level}。`});
          }
          if (action.type === "event_learn_move") {
            const availableKey = action.service === "egg" ? "event_egg_service_available" : "event_tutor_service_available";
            const usedKey = action.service === "egg" ? "event_egg_service_used" : "event_tutor_service_used";
            if (!run.rest_status?.[availableKey] && run.special_run !== "rainbow_rocket") throw new Error("当前没有对应的事件技能服务。");
            if (run.rest_status?.[usedKey] && run.special_run !== "rainbow_rocket") throw new Error("本次事件技能服务已经使用过。");
            const message = await mobileLearnMove(save, run, action.slot, action.moveSlot, action.moveId, {
              source: action.service,
              cost: run.special_run === "rainbow_rocket" ? 0 : 200,
              label: action.service === "egg" ? "遗传招式" : "教授招式",
            }, await loadGameService());
            if (run.special_run !== "rainbow_rocket") run.rest_status = {...(run.rest_status || {}), [usedKey]: true};
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
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
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "restore_hp" || action.type === "restore_pp" || action.type === "restore_status") {
            throw new Error("休整免费恢复已移除，请使用背包中的恢复道具。");
          }
          if (action.type === "choose_doctor_treatment") {
            const message = applyDoctorTreatment(run, action.branch);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "event_score_bet_adjust") {
            const message = applyScoreBetAdjustment(run, {targetAlive: action.targetAlive, stake: action.stake});
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "bp_to_coins") {
            const message = applyBpToCoins(save, run, action.bp);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "trust_level") {
            const message = await applyTrustLevel(save, run, action.slot, await loadGameService());
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "use_item") {
            const message = await applyRestConsumableItem(run, action.itemId, action.slot, action.moveSlot, await loadGameService());
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "equip_item" || action.type === "unequip_item") {
            const message = await applyHeldItemChange(run, action.type === "equip_item" ? action.itemId : null, action.slot, await loadGameService());
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "sell_item") {
            if (!run.rest_status?.recycler_available) throw new Error("当前没有道具回收商，不能出售道具。");
            const itemId = itemKey(action.itemId);
            const count = Number(run.bag_items?.[itemId] || 0);
            if (!itemId || count <= 0) throw new Error("背包里没有这个道具。");
            const item = await mobileItemDetails(await loadGameService(), itemId, run.bag_item_meta?.[itemId]);
            const message = sellRunBagItem(save, run, itemId, item);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
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
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message: `已抽取 ${draws.length} 个候选技能，${spent.message}。`});
          }
          if (action.type === "apply_drawn_move") {
            const slot = action.slot;
            const moveSlot = action.moveSlot;
            const drawKey = `${slot}:${moveSlot}`;
            const draws = run.move_draws?.[drawKey] || [];
            const selected = draws.find(move => toId(move.id || move.name) === toId(action.moveId));
            if (!selected) throw new Error("请选择已抽取的候选技能。");
            const message = await mobileLearnMove(save, run, slot, moveSlot, selected.id || selected.name, {
              cost: 0,
              label: "抽取技能",
            }, await loadGameService());
            delete run.move_draws?.[drawKey];
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "scout_next") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队路线无法使用普通情报。");
            const service = await loadGameService();
            const battleNo = Number(run.next_battle || (Number(run.battle_no || 0) + 1) || 1);
            const planned = await ensureMobilePlannedBattle(save, run, battleNo, service, npcCatalog, await loadBossTeamPools(), () => env.uuid.randomUUID());
            const message = applyRuntimeScoutNext(run, planned, action.level);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "night_sky_scout") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队路线无法使用普通情报。");
            const service = await loadGameService();
            await ensureMobilePlannedBattles(save, run, service, npcCatalog, await loadBossTeamPools(), () => env.uuid.randomUUID());
            const message = applyRuntimeNightSkyScout(run, run.planned_battles || [], action.battleNo, action.level);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
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
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
          }
          if (action.type === "set_named_champion") {
            if (run.special_run === "rainbow_rocket") throw new Error("彩虹火箭队路线无法使用指名挑战。");
            const service = await loadGameService();
            const message = applyRuntimeNamedChampion(save, run, npcCatalog, action.trainerId);
            await refreshMobilePlannedBattle(save, run, Number(run.battles || 7), service, npcCatalog, await loadBossTeamPools(), () => env.uuid.randomUUID());
            if (run.planned_battles?.length) buildRuntimeNightSkyState(run, run.planned_battles);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message});
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
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message: `已随机重置，${spent.message}。`});
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
            if (refund) addCoins(run, refund);
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
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message: `已学习 ${selected.name_zh || selected.name}，${spent.message}${refund ? `，返还 ${refund}金币` : ""}。`});
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
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message: `已保存能力值调整，${spent.message}。`});
          }
          if (action.type === "set_lead") {
            setRunLeadSlot(run, action.slot);
            const next = await env.saves.save(save);
            return gameState({screen: "rest", save: next, rest: mobileRest(next, next.current_run as CurrentRunData), message: "首发已调整。"});
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

function mobileRest(save: LocalSave, run: CurrentRunData): RestState {
  const shopKind = mobileNormalizeShopKind(run.shop_kind);
  if (run.planned_battles?.length) buildRuntimeNightSkyState(run, run.planned_battles);
  return buildRestState({
    save,
    run,
    defaultBattles: 7,
    costs: {
      exchange: run.special_run === "rainbow_rocket" ? null : undefined,
      move_draw: 0,
      scout_basic: 0,
      scout_one: 0,
      scout_all: 0,
    },
    extra: {
      move_draws: run.move_draws || {},
      move_draw_rolls: run.move_draw_rolls || {},
      scout: run.scout,
      night_sky: run.night_sky,
      exchange_box: run.exchange_box?.display || [],
      all_in_used: Boolean(run.all_in_exchange_used),
      all_in_pending_next: Boolean(run.rest_status?.all_in_pending_next),
      all_in_result: run.rest_status?.all_in_result || null,
      score_bet: run.rest_status?.event_score_bet_next,
      shop: run.special_run === "rainbow_rocket" ? undefined : {
        kind: shopKind,
        title: mobileShopConfig(shopKind).title,
        theme: mobileShopConfig(shopKind).theme,
        roll_count: Number(run.shop_roll_count || 0),
        next_roll_cost: shopNextRollCost(run),
        slot_count: shopKind === "tm" ? 3 : shopOfferCount(run),
        free_rolls_remaining: Number(run.rest_status?.free_shop_rolls_remaining || 0),
        slot_discounts: run.rest_status?.shop_slot_discounts || [],
        offers: run.shop_offers || [],
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
        tutor: run.special_run === "rainbow_rocket" || Boolean(run.rest_status?.event_tutor_service_available && !run.rest_status?.event_tutor_service_used),
        egg: run.special_run === "rainbow_rocket" || Boolean(run.rest_status?.event_egg_service_available && !run.rest_status?.event_egg_service_used),
        raid_exchange: Boolean(run.rest_status?.event_raid_exchange_available && !run.rest_status?.event_raid_exchange_used),
        raid_exchange_battle_no: run.rest_status?.event_raid_exchange_battle_no,
        level_points: Math.max(0, Number(run.rest_status?.event_level_points || 0)),
        score_bet: Boolean(run.rest_status?.event_score_bet_next),
      },
    },
  });
}

function mobileNormalizeShopKind(value: unknown): "recovery" | "held" | "tm" {
  return value === "held" || value === "tm" || value === "recovery" ? value : "recovery";
}

function mobileShopConfig(kind: "recovery" | "held" | "tm"): {title: string; theme: ShopState["theme"]} {
  if (kind === "held") return {title: "道具商店", theme: "blue"};
  if (kind === "tm") return {title: "技能商店", theme: "purple"};
  return {title: "回复商店", theme: "green"};
}

async function mobileRollShopOffers(service: GameService, run: CurrentRunData, kind: "recovery" | "held" | "tm"): Promise<ShopOffer[]> {
  const count = kind === "tm" ? 3 : shopOfferCount(run);
  if (kind === "tm") {
    const seen = new Set<string>();
    const moves: MoveSummary[] = [];
    for (const rawSet of run.player_team || []) {
      for (const move of await service.learnableMoves(rawSet)) {
        if (!(move.learn_sources || []).includes("machine")) continue;
        const id = toId(move.id || move.name);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        moves.push(move);
      }
    }
    return moves
      .sort((a, b) => Number(b.power || 0) - Number(a.power || 0) || String(a.name || a.id || "").localeCompare(String(b.name || b.id || "")))
      .slice(0, count)
      .map((move, index) => mobileTmOffer(move, index));
  }
  const items = await service.itemOptions();
  const filtered: ShopOffer[] = [];
  for (const item of items) {
    const id = itemKey(item.id || item.name);
    if (!id) continue;
    const consumable = await service.hasConsumableItemEffect(id);
    if (kind === "recovery" && !consumable) continue;
    if (kind === "held" && consumable) continue;
    filtered.push({
      ...item,
      id,
      cost: Math.max(0, Number(item.cost || (consumable ? 100 : 300))),
      category: consumable ? "consumable" : "held",
      offer_id: `${Number(run.shop_roll_count || 0)}-${indexForOffer(filtered)}-${id}`,
      source: "shop",
    });
    if (filtered.length >= count) break;
  }
  return filtered;
}

function indexForOffer(values: unknown[]): number {
  return values.length;
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
    icon_asset: "assets/placeholders/move.png",
    offer_id: `${Number(index)}-tm-${moveId}`,
    source: "shop",
    move_id: moveId,
    move_name: move.name || moveId,
    move_name_zh: move.name_zh || move.name || moveId,
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
    },
  };
}

async function mobileItemDetails(service: GameService, itemId: string, meta?: Partial<ShopOffer>): Promise<ShopItem> {
  const id = itemKey(itemId);
  if (/^tm:/i.test(id)) {
    const moveId = id.slice(3);
    return {
      ...(meta || {}),
      id,
      name: meta?.name || `TM ${moveId}`,
      name_zh: meta?.name_zh || `技能机器 ${meta?.move_name_zh || meta?.move_name || moveId}`,
      desc: meta?.desc || `Teaches ${meta?.move_name || moveId}.`,
      desc_zh: meta?.desc_zh || `让宝可梦学会 ${meta?.move_name_zh || meta?.move_name || moveId}。`,
      cost: Math.max(0, Number(meta?.cost || 0)),
      icon_asset: meta?.icon_asset || "assets/placeholders/move.png",
    } as ShopItem;
  }
  const found = (await service.itemOptions()).find(item => itemKey(item.id || item.name) === id);
  return {
    ...(found || {id, name: id, name_zh: id, desc: "", desc_zh: "", cost: 0, category: "held"}),
    ...(meta || {}),
    id,
    cost: Math.max(0, Number(meta?.cost ?? found?.cost ?? 0)),
  } as ShopItem;
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
    if (category === "consumable" && !(await service.hasConsumableItemEffect(id))) category = "held";
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
  if (/^tm:/i.test(String(itemId || "")) || /berry/i.test(id)) return true;
  if (!(await service.hasConsumableItemEffect(id))) return false;
  return !["ether", "maxether", "elixir", "maxelixir"].includes(id);
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
    };
  }
  return {items, meta};
}

function cloneMobile<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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
