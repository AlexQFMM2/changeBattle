import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import {readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {GameService} from "./index.js";
import type {BattleSetting, BattleState, BattleTimelineEvent, PokemonSet, PlayerPokemonState} from "@changebattle/shared";
import {DEFAULT_BATTLE_SETTING} from "@changebattle/shared";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../../..");
const showdownPath = process.env.SHOWDOWN_PATH || path.resolve(projectRoot, "../pokemonShowdowm/pokemon-showdown");
const nodeRequire = createRequire(import.meta.url);

function createTestService(): GameService {
  return new GameService({
    projectRoot,
    showdownPath,
    dataProvider: {
      readText: relativePath => readFile(path.join(projectRoot, relativePath), "utf8"),
      readTextSync(relativePath) {
        const filePath = path.join(projectRoot, relativePath);
        return existsSync(filePath) ? readFileSync(filePath, "utf8") : null;
      },
      exists(relativePath) {
        return existsSync(path.join(projectRoot, relativePath));
      },
      existsSync(relativePath) {
        return existsSync(path.join(projectRoot, relativePath));
      },
    },
    assetExistsSync: relativePath => existsSync(path.join(projectRoot, relativePath)),
    showdownLoader: () => nodeRequire(path.join(showdownPath, "dist", "sim")),
  });
}

const baseStats = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
const zeroStats = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};
const GEN7_BATTLE_SETTING: BattleSetting = {...DEFAULT_BATTLE_SETTING, battle_rule_preset: "gen7", enabled_battle_systems: ["mega", "zmove"]};
const GEN8_BATTLE_SETTING: BattleSetting = {...DEFAULT_BATTLE_SETTING, battle_rule_preset: "gen8", enabled_battle_systems: ["dynamax"]};
const GEN8_ALL_GENERATIONS_SETTING: BattleSetting = {...GEN8_BATTLE_SETTING, allowed_generations: [1, 2, 3, 4, 5, 6, 7, 8]};
const GEN9_BATTLE_SETTING: BattleSetting = {...DEFAULT_BATTLE_SETTING, battle_rule_preset: "gen9", enabled_battle_systems: ["terastal"], allowed_generations: [1, 2, 3, 4, 5, 6, 7, 8, 9]};

function pokemon(species: string, moves: string[], ability?: string): PokemonSet {
  return {
    name: species,
    species,
    ability: ability || (species === "Bulbasaur" ? "Overgrow" : species === "Charmander" ? "Blaze" : "Static"),
    item: "",
    moves,
    nature: "Serious",
    evs: zeroStats,
    ivs: baseStats,
    level: 50,
  };
}

async function createSession() {
  const service = createTestService();
  const playerTeam = [pokemon("Pikachu", ["Tackle"])];
  const enemyTeam = [pokemon("Bulbasaur", ["Tackle"])];
  const playerDisplay = await service.describeTeam(playerTeam);
  const enemyDisplay = await service.describeTeam(enemyTeam);
  const session = await service.createBattleSession({
    playerTeam,
    enemyTeam,
    playerDisplay,
    enemyDisplay,
    seed: [1, 2, 3, 4],
  });
  return {service, session};
}

function withHp(states: PlayerPokemonState[], hp: number): PlayerPokemonState[] {
  return states.map((state, index) => index === 0 ? {...state, hp, condition: `${hp}/${state.maxhp}`} : state);
}

function battleText(state: BattleState): string {
  return [...state.recent_events, ...state.timeline_events.map(event => event.text)].join("\n");
}

function assertTimelineOrder(state: BattleState, types: string[], label: string): void {
  let cursor = -1;
  for (const type of types) {
    const index = state.timeline_events.findIndex((event, eventIndex) => eventIndex > cursor && event.type === type);
    assert.ok(index > cursor, `${label}: expected ${type} after ${cursor}\n${JSON.stringify(state.timeline_events, null, 2)}`);
    cursor = index;
  }
}

async function createCustomSession(playerTeam: PokemonSet[], enemyTeam: PokemonSet[], seed: number[], enemyAi: Record<string, unknown> = {level: "gym_low", randomness: 0, allowSwitch: false}, battleSetting: BattleSetting = GEN7_BATTLE_SETTING) {
  const service = createTestService();
  const playerDisplay = await service.describeTeam(playerTeam);
  const enemyDisplay = await service.describeTeam(enemyTeam);
  for (let index = 0; index < playerDisplay.length; index += 1) {
    playerDisplay[index].run_member_id = playerTeam[index]?.run_member_id;
    playerDisplay[index].showdown_id = playerTeam[index]?.showdown_id;
  }
  for (let index = 0; index < enemyDisplay.length; index += 1) {
    enemyDisplay[index].run_member_id = enemyTeam[index]?.run_member_id;
    enemyDisplay[index].showdown_id = enemyTeam[index]?.showdown_id;
  }
  return service.createBattleSession({playerTeam, enemyTeam, playerDisplay, enemyDisplay, seed, enemyAi, battleSetting});
}

async function findSeededState(label: string, factory: (seed: number[]) => Promise<BattleState>, predicate: (state: BattleState) => boolean, limit = 120): Promise<BattleState> {
  for (let value = 1; value <= limit; value += 1) {
    const state = await factory([value, value + 1000, value + 2000, value + 3000]);
    if (predicate(state)) return state;
  }
  throw new Error(`${label}: no matching seed found within ${limit}`);
}

function typeCount(events: BattleTimelineEvent[], type: string): number {
  return events.filter(event => event.type === type).length;
}

async function testUnknownMoveRejected(): Promise<void> {
  const {session} = await createSession();
  const before = session.getState();
  const after = await session.choose("move splash");
  assert.equal(after.tracker.turn, before.tracker.turn);
  assert.ok(after.request?.active?.[0]?.moves?.some(move => move.id === "tackle"));
}

async function testTrainerItemActsBeforeEnemyMove(): Promise<void> {
  const {session} = await createSession();
  session.syncPlayerState(withHp(session.getPlayerState(), 50));
  const state = await session.chooseTrainerItem("superpotion", 0);
  const events = state.recent_events.join("\n");
  const useIndex = events.indexOf("使用了 好伤药");
  const healIndex = events.indexOf("HP: 110/110");
  const moveIndex = events.indexOf("妙蛙种子 使用 撞击");
  assert.ok(useIndex >= 0, events);
  assert.ok(healIndex > useIndex, events);
  assert.ok(moveIndex > healIndex, events);
  const current = session.getPlayerState()[0];
  assert.ok(current.hp > 50, `expected healed HP after enemy move, got ${current.hp}`);
  assert.ok(current.hp < current.maxhp, `expected enemy move to happen after heal, got ${current.hp}/${current.maxhp}`);
}

async function testInvalidItemDoesNotAdvanceTurn(): Promise<void> {
  const {session} = await createSession();
  const before = session.getState().tracker.turn;
  await assert.rejects(() => session.chooseTrainerItem("potion", 0), /目标不需要这个道具/);
  assert.equal(session.getState().tracker.turn, before);
}

async function testTrainingItemsAreRestOnlyConsumables(): Promise<void> {
  const {service, session} = await createSession();
  assert.equal(await service.hasConsumableItemEffect("hpup"), true);
  assert.equal(await service.hasBattleConsumableItemEffect("hpup"), false);
  assert.equal(await service.hasConsumableItemEffect("abilitypatch"), true);
  assert.equal(await service.hasBattleConsumableItemEffect("abilitypatch"), false);
  assert.equal(await service.hasConsumableItemEffect("jollymint"), true);
  assert.equal(await service.hasBattleConsumableItemEffect("jollymint"), false);
  assert.deepEqual(await service.trainingItemEffect("hpup"), {stat_kind: "ev", stat: "hp", amount: 100, scope: "one"});
  assert.deepEqual(await service.trainingItemEffect("bottlecap"), {stat_kind: "iv", stat: undefined, amount: 31, scope: "one"});
  assert.deepEqual(await service.trainingItemEffect("goldbottlecap"), {stat_kind: "iv", stat: undefined, amount: 31, scope: "all"});
  assert.deepEqual(await service.trainingItemEffect("abilitypatch"), {stat_kind: "ability", amount: 1, scope: "one"});
  assert.deepEqual(await service.trainingItemEffect("jollymint"), {stat_kind: "nature", nature: "Jolly", amount: 0, scope: "one"});
  const before = session.getState().tracker.turn;
  await assert.rejects(() => session.chooseTrainerItem("hpup", 0), /不能在战斗中主动使用/);
  assert.equal(session.getState().tracker.turn, before);
}

async function testPokemonGenderGeneration(): Promise<void> {
  const service = createTestService();
  const generated = await service.generateRentalCandidates([301, 302, 303, 304], "gen9randombattle", 3, {
    speciesIds: ["Pikachu", "Nidoran-F", "Magnemite"],
    profiles: ["tier1", "tier1", "tier1"],
    battleSetting: GEN9_BATTLE_SETTING,
  });
  const repeated = await service.generateRentalCandidates([301, 302, 303, 304], "gen9randombattle", 3, {
    speciesIds: ["Pikachu", "Nidoran-F", "Magnemite"],
    profiles: ["tier1", "tier1", "tier1"],
    battleSetting: GEN9_BATTLE_SETTING,
  });
  assert.deepEqual(generated.team.map(set => set.gender || ""), repeated.team.map(set => set.gender || ""));
  assert.deepEqual(generated.display.map(pokemon => pokemon.gender || ""), generated.team.map(set => set.gender || ""));
  const genderBySpecies = new Map(generated.display.map(pokemon => [pokemon.species_id, pokemon.gender || ""]));
  const pikachuGender = generated.display.find(pokemon => pokemon.species_id.startsWith("pikachu"))?.gender || "";
  assert.match(pikachuGender, /^[MF]$/);
  assert.equal(genderBySpecies.get("nidoranf"), "F");
  assert.equal(genderBySpecies.get("magnemite"), "");
}

async function testBattleSessionNormalizesMissingGender(): Promise<void> {
  const service = createTestService();
  const playerTeam = [{...pokemon("Pikachu", ["Tackle"]), gender: undefined}];
  const enemyTeam = [{...pokemon("Magnemite", ["Tackle"], "Magnet Pull"), gender: undefined}];
  const session = await service.createBattleSession({
    playerTeam,
    enemyTeam,
    playerDisplay: await service.describeTeam(playerTeam),
    enemyDisplay: await service.describeTeam(enemyTeam),
    seed: [401, 402, 403, 404],
  });
  const state = session.getState();
  assert.match(state.player_team[0].gender || "", /^[MF]$/);
  assert.equal(state.player_display[0].gender, state.player_team[0].gender);
  assert.equal(state.enemy_team[0].gender || "", "");
  assert.equal(state.enemy_display[0].gender || "", "");
}

async function testEnemyAiPrefersEffectiveDamage(): Promise<void> {
  const service = createTestService();
  const playerTeam = [pokemon("Bulbasaur", ["Tackle"])];
  const enemyTeam = [pokemon("Charmander", ["Scratch", "Ember"])];
  const session = await service.createBattleSession({
    playerTeam,
    enemyTeam,
    playerDisplay: await service.describeTeam(playerTeam),
    enemyDisplay: await service.describeTeam(enemyTeam),
    seed: [5, 6, 7, 8],
    enemyAi: {level: "gym_low", randomness: 0},
  });
  const state = await session.choose("move 1");
  const events = state.recent_events.join("\n");
  assert.match(events, /火花|Ember/, events);
  assert.doesNotMatch(events, /抓|Scratch/, events);
}

async function testSoulSickAiPrefersBadMoves(): Promise<void> {
  const session = await createCustomSession(
    [pokemon("Gengar", ["Splash"], "Levitate")],
    [pokemon("Rattata", ["Tackle", "Crunch"], "Run Away")],
    [201, 202, 203, 204],
    {level: "gym_low", personality: "soul_sick", randomness: 0, allowSwitch: true, depth: 2},
  );
  const state = await session.choose("move 1");
  const text = battleText(state);
  assert.match(text, /撞击|Tackle/, text);
  assert.doesNotMatch(text, /咬碎|Crunch/, text);
  assert.match(text, /没有效果|doesn't affect|无效/i, text);
}

async function testSoulSickAiDoesNotPreferBattleSystems(): Promise<void> {
  const session = await createCustomSession(
    [pokemon("Blissey", ["Splash"], "Natural Cure")],
    [{...pokemon("Charmander", ["Ember", "Scratch"], "Blaze"), item: "Firium Z"}],
    [205, 206, 207, 208],
    {level: "gym_low", personality: "soul_sick", randomness: 0},
  );
  const state = await session.choose("move 1");
  const text = battleText(state);
  assert.doesNotMatch(text, /Z 力量|超强极限爆焰弹|Inferno Overdrive/i, text);
}

async function testSoulSickAiDoesNotVoluntarySwitchButCanForceSwitch(): Promise<void> {
  const noSwitchSession = await createCustomSession(
    [pokemon("Garchomp", ["Splash"], "Sand Veil")],
    [pokemon("Magikarp", ["Splash"], "Swift Swim"), pokemon("Charmander", ["Ember"], "Blaze")],
    [209, 210, 211, 212],
    {level: "gym_low", personality: "soul_sick", randomness: 0, allowSwitch: true, switchAwareness: 1},
  );
  const noSwitch = await noSwitchSession.choose("move 1");
  assert.equal(noSwitch.tracker.active[noSwitch.enemy_side || "p2"]?.species_id, "magikarp", JSON.stringify(noSwitch.tracker.active, null, 2));

  const forceSwitchSession = await createCustomSession(
    [{...pokemon("Rampardos", ["Head Smash"], "Mold Breaker"), level: 80}],
    [{...pokemon("Magikarp", ["Splash"], "Swift Swim"), level: 1}, pokemon("Charmander", ["Ember"], "Blaze")],
    [213, 214, 215, 216],
    {level: "gym_low", personality: "soul_sick", randomness: 0, allowSwitch: false},
  );
  const forced = await forceSwitchSession.choose("move 1");
  assert.equal(forced.tracker.active[forced.enemy_side || "p2"]?.species_id, "charmander", JSON.stringify(forced.tracker.active, null, 2));
}

async function testRookieAiPrefersEffectiveDamage(): Promise<void> {
  const session = await createCustomSession(
    [pokemon("Bulbasaur", ["Tackle"], "Overgrow")],
    [pokemon("Charmander", ["Scratch", "Ember"], "Blaze")],
    [217, 218, 219, 220],
    {level: "normal", personality: "rookie", randomness: 0},
  );
  const state = await session.choose("move 1");
  const text = battleText(state);
  assert.match(text, /火花|Ember/, text);
  assert.doesNotMatch(text, /抓|Scratch/, text);
}

async function testRookieAiHasLowerKoPressureThanBalanced(): Promise<void> {
  const balanced = await createCustomSession(
    [pokemon("Bulbasaur", ["Tackle"], "Overgrow")],
    [pokemon("Charmander", ["Scratch"], "Blaze")],
    [221, 222, 223, 224],
    {level: "normal", personality: "balanced", randomness: 0, prediction: 0.15},
  );
  const rookie = await createCustomSession(
    [pokemon("Bulbasaur", ["Tackle"], "Overgrow")],
    [pokemon("Charmander", ["Scratch"], "Blaze")],
    [221, 222, 223, 224],
    {level: "normal", personality: "rookie", randomness: 0, prediction: 0.05},
  );
  const scoreMove = (session: unknown) => (session as {scoreEnemyMove: (move: unknown, attacker: unknown, target: unknown) => number});
  const move = {id: "scratch", move: "Scratch", pp: 35};
  const balancedAttacker = balanced.getState().enemy_display[0];
  const balancedTarget = balanced.getState().player_display[0];
  const rookieAttacker = rookie.getState().enemy_display[0];
  const rookieTarget = rookie.getState().player_display[0];
  const balancedHealthy = scoreMove(balanced).scoreEnemyMove(move, balancedAttacker, balancedTarget);
  const rookieHealthy = scoreMove(rookie).scoreEnemyMove(move, rookieAttacker, rookieTarget);
  balanced.syncPlayerState(withHp(balanced.getPlayerState(), 1));
  rookie.syncPlayerState(withHp(rookie.getPlayerState(), 1));
  const balancedKo = scoreMove(balanced).scoreEnemyMove(move, balancedAttacker, balancedTarget);
  const rookieKo = scoreMove(rookie).scoreEnemyMove(move, rookieAttacker, rookieTarget);
  assert.ok(balancedKo - balancedHealthy > rookieKo - rookieHealthy, `balanced delta ${balancedKo - balancedHealthy}, rookie delta ${rookieKo - rookieHealthy}`);
}

async function testRookieAiDoesNotPreferBattleSystems(): Promise<void> {
  const session = await createCustomSession(
    [pokemon("Bulbasaur", ["Tackle"], "Overgrow")],
    [{...pokemon("Charmander", ["Ember", "Scratch"], "Blaze"), item: "Firium Z"}],
    [225, 226, 227, 228],
    {level: "normal", personality: "rookie", randomness: 0},
  );
  const state = await session.choose("move 1");
  const text = battleText(state);
  assert.match(text, /火花|Ember/, text);
  assert.doesNotMatch(text, /Z 力量|超强极限爆焰弹|Inferno Overdrive/i, text);
}

async function testRegeneratorUsesShowdownIdWithDuplicateIdent(): Promise<void> {
  const service = createTestService();
  const playerTeam = [
    pokemon("Tangela", ["Tackle"], "Regenerator"),
    pokemon("Tangela", ["Tackle"], "Chlorophyll"),
  ];
  const enemyTeam = [pokemon("Magikarp", ["Splash"], "Swift Swim")];
  const session = await service.createBattleSession({
    playerTeam,
    enemyTeam,
    playerDisplay: await service.describeTeam(playerTeam),
    enemyDisplay: await service.describeTeam(enemyTeam),
    seed: [9, 10, 11, 12],
    enemyAi: {level: "gym_low", randomness: 0},
  });
  const initial = session.getPlayerState();
  const activeId = initial[0]?.showdown_id;
  const incomingId = initial[1]?.showdown_id;
  assert.ok(activeId && incomingId && activeId !== incomingId, `expected distinct showdown ids, got ${activeId}/${incomingId}`);
  session.syncPlayerState(initial.map((state, index) => index === 0 ? {...state, hp: 60, condition: `60/${state.maxhp}`} : state));
  const state = await session.choose("switch 2");
  const playerState = session.getPlayerState();
  const healed = playerState.find(pokemonState => pokemonState.showdown_id === activeId);
  const incoming = playerState.find(pokemonState => pokemonState.showdown_id === incomingId);
  assert.ok(healed && incoming, JSON.stringify(playerState, null, 2));
  assert.ok(healed.hp > 60, `expected switched-out Tangela to heal, got ${healed.hp}`);
  assert.equal(incoming.active, true, `expected second Tangela active: ${JSON.stringify(playerState, null, 2)}`);
  const healEvent = state.timeline_events.find(event => event.type === "heal" && event.target_showdown_id === activeId);
  assert.ok(healEvent, JSON.stringify(state.timeline_events, null, 2));
}

async function testShowdownIdsStayWithPokemonObjects(): Promise<void> {
  const service = createTestService();
  const playerTeam = [
    {...pokemon("Exploud", ["Tackle"], "Soundproof"), run_member_id: "member-exploud", showdown_id: "greatball", pokeball: "greatball"},
    {...pokemon("Cacturne", ["Tackle"], "Sand Veil"), run_member_id: "member-cacturne", showdown_id: "pokeball", pokeball: "pokeball"},
  ];
  const enemyTeam = [pokemon("Magikarp", ["Splash"], "Swift Swim")];
  const playerDisplay = await service.describeTeam(playerTeam);
  playerDisplay[0].run_member_id = "member-exploud";
  playerDisplay[0].showdown_id = "greatball";
  playerDisplay[1].run_member_id = "member-cacturne";
  playerDisplay[1].showdown_id = "pokeball";
  const session = await service.createBattleSession({
    playerTeam,
    enemyTeam,
    playerDisplay,
    enemyDisplay: await service.describeTeam(enemyTeam),
    playerState: [
      {run_member_id: "member-exploud", slot: 1, showdown_id: "greatball", ident: "p1: Exploud", details: "Exploud", species: "Exploud", hp: 100, maxhp: 100, status: "", fainted: false, active: true, item: "", condition: "100/100", moves: []},
      {run_member_id: "member-cacturne", slot: 2, showdown_id: "pokeball", ident: "p1: Cacturne", details: "Cacturne", species: "Cacturne", hp: 100, maxhp: 100, status: "", fainted: false, active: false, item: "", condition: "100/100", moves: []},
    ],
    seed: [13, 14, 15, 16],
    enemyAi: {level: "gym_low", randomness: 0},
  });

  const state = session.getState();
  assert.equal(state.player_side, "p1");
  assert.equal(state.enemy_side, "p2");
  assert.deepEqual(state.player_team.map(pokemonSet => pokemonSet.showdown_id), ["greatball", "pokeball"]);
  assert.deepEqual(state.player_team.map(pokemonSet => pokemonSet.pokeball), ["greatball", "pokeball"]);
  assert.deepEqual(state.player_display.map(pokemonView => pokemonView.showdown_id), ["greatball", "pokeball"]);

  const current = session.getPlayerState();
  assert.deepEqual(current.map(pokemonState => pokemonState.showdown_id), ["greatball", "pokeball"]);
  assert.deepEqual(current.map(pokemonState => pokemonState.run_member_id), ["member-exploud", "member-cacturne"]);

  session.syncPlayerState(current.map((pokemonState, index) => index === 0 ? {...pokemonState, status: "psn", condition: `${pokemonState.hp}/${pokemonState.maxhp} psn`} : pokemonState));
  const synced = session.getPlayerState();
  assert.equal(synced[0].run_member_id, "member-exploud");
  assert.equal(synced[0].status, "psn");
  assert.equal(synced[1].run_member_id, "member-cacturne");
  assert.equal(synced[1].status, "");
}

async function testPainSplitSetHpHasFiniteTimeline(): Promise<void> {
  const service = createTestService();
  const playerTeam = [pokemon("Rotom", ["Pain Split"], "Levitate")];
  const enemyTeam = [pokemon("Magikarp", ["Splash"], "Swift Swim")];
  const session = await service.createBattleSession({
    playerTeam,
    enemyTeam,
    playerDisplay: await service.describeTeam(playerTeam),
    enemyDisplay: await service.describeTeam(enemyTeam),
    seed: [17, 18, 19, 20],
    enemyAi: {level: "gym_low", randomness: 0},
  });
  const initial = session.getPlayerState();
  session.syncPlayerState(initial.map((state, index) => index === 0 ? {...state, hp: 20, condition: `20/${state.maxhp}`} : state));
  const state = await session.choose("move 1");
  const text = [...state.recent_events, ...state.timeline_events.map(event => event.text), ...session.getPlayerState().map(pokemonState => pokemonState.condition)].join("\n");
  assert.doesNotMatch(text, /NaN/i, text);
  const setHpEvents = state.timeline_events.filter(event => /HP 变为/.test(event.text));
  assert.ok(setHpEvents.length >= 2, JSON.stringify(state.timeline_events, null, 2));
  assert.ok(setHpEvents.every(event => event.hp && Number.isFinite(event.hp.current) && Number.isFinite(event.hp.max)), JSON.stringify(setHpEvents, null, 2));
}

async function testSkyAttackAnimationProtocolIsHidden(): Promise<void> {
  const service = createTestService();
  const playerTeam = [pokemon("Hawlucha", ["Sky Attack"], "Unburden")];
  const enemyTeam = [pokemon("Magikarp", ["Splash"], "Swift Swim")];
  const session = await service.createBattleSession({
    playerTeam,
    enemyTeam,
    playerDisplay: await service.describeTeam(playerTeam),
    enemyDisplay: await service.describeTeam(enemyTeam),
    seed: [21, 22, 23, 24],
    enemyAi: {level: "gym_low", randomness: 0},
  });
  await session.choose("move 1");
  const state = await session.choose("move 1");
  const text = [...state.recent_events, ...state.timeline_events.map(event => event.text)].join("\n");
  assert.doesNotMatch(text, /Showdown事件|\|-anim\|/, text);
}

async function testBoostAndCantReasonsAreLocalized(): Promise<void> {
  const service = createTestService();
  const boostTeam = [pokemon("Pikachu", ["Double Team"], "Static")];
  const passiveEnemy = [pokemon("Magikarp", ["Splash"], "Swift Swim")];
  const boostSession = await service.createBattleSession({
    playerTeam: boostTeam,
    enemyTeam: passiveEnemy,
    playerDisplay: await service.describeTeam(boostTeam),
    enemyDisplay: await service.describeTeam(passiveEnemy),
    seed: [25, 26, 27, 28],
    enemyAi: {level: "gym_low", randomness: 0},
  });
  const boostState = await boostSession.choose("move 1");
  const boostText = [...boostState.recent_events, ...boostState.timeline_events.map(event => event.text)].join("\n");
  assert.match(boostText, /回避\+1/, boostText);
  assert.doesNotMatch(boostText, /evasion/i, boostText);

  const flinchTeam = [pokemon("Meowth", ["Fake Out"], "Pickup")];
  const attackEnemy = [pokemon("Bulbasaur", ["Tackle"], "Overgrow")];
  const flinchSession = await service.createBattleSession({
    playerTeam: flinchTeam,
    enemyTeam: attackEnemy,
    playerDisplay: await service.describeTeam(flinchTeam),
    enemyDisplay: await service.describeTeam(attackEnemy),
    seed: [29, 30, 31, 32],
    enemyAi: {level: "gym_low", randomness: 0},
  });
  const flinchState = await flinchSession.choose("move 1");
  const flinchText = [...flinchState.recent_events, ...flinchState.timeline_events.map(event => event.text)].join("\n");
  assert.match(flinchText, /畏缩/, flinchText);
  assert.doesNotMatch(flinchText, /flinch/i, flinchText);
}

async function testAdvanceIfWaitingContinuesChargingMove(): Promise<void> {
  const service = createTestService();
  const playerTeam = [pokemon("Charizard", ["Fly"], "Blaze")];
  const enemyTeam = [pokemon("Magikarp", ["Splash"], "Swift Swim")];
  const session = await service.createBattleSession({
    playerTeam,
    enemyTeam,
    playerDisplay: await service.describeTeam(playerTeam),
    enemyDisplay: await service.describeTeam(enemyTeam),
    seed: [33, 34, 35, 36],
    enemyAi: {level: "gym_low", randomness: 0},
  });
  const charging = await session.choose("move 1");
  assert.equal(charging.request?.active?.[0]?.moves?.length, 1, JSON.stringify(charging.request, null, 2));
  const advanced = await session.advanceIfWaiting();
  assert.notEqual(advanced.request?.wait, true, JSON.stringify(advanced.request, null, 2));
  assert.notDeepEqual(advanced.request?.active?.[0]?.moves, charging.request?.active?.[0]?.moves, JSON.stringify(advanced.request, null, 2));
  const text = [...advanced.recent_events, ...advanced.timeline_events.map(event => event.text)].join("\n");
  assert.match(text, /飞翔|Fly/, text);
}

async function testDuplicateSpeciesSwitchKeepsIdentityPairs(): Promise<void> {
  const playerTeam = [
    {...pokemon("Eevee", ["Splash"], "Run Away"), run_member_id: "eevee-a", showdown_id: "greatball", pokeball: "greatball"},
    {...pokemon("Eevee", ["Tackle"], "Run Away"), run_member_id: "eevee-b", showdown_id: "ultraball", pokeball: "ultraball"},
  ];
  const session = await createCustomSession(playerTeam, [pokemon("Magikarp", ["Splash"], "Swift Swim")], [41, 42, 43, 44]);
  assert.deepEqual(session.getPlayerState().map(state => [state.run_member_id, state.showdown_id]), [["eevee-a", "greatball"], ["eevee-b", "ultraball"]]);
  await session.choose("switch 2");
  const switched = session.getPlayerState();
  assert.deepEqual(switched.map(state => [state.run_member_id, state.showdown_id]), [["eevee-a", "greatball"], ["eevee-b", "ultraball"]], JSON.stringify(switched, null, 2));
  assert.equal(switched.find(state => state.showdown_id === "ultraball")?.active, true, JSON.stringify(switched, null, 2));
}

async function testDuplicateSpeciesStatusDoesNotBleedIntoRestState(): Promise<void> {
  const playerTeam = [
    {...pokemon("Eevee", ["Splash"], "Run Away"), item: "Flame Orb", run_member_id: "eevee-a", showdown_id: "greatball", pokeball: "greatball"},
    {...pokemon("Eevee", ["Thunderbolt"], "Run Away"), level: 80, run_member_id: "eevee-b", showdown_id: "ultraball", pokeball: "ultraball"},
  ];
  const enemyTeam = [{...pokemon("Magikarp", ["Splash"], "Swift Swim"), level: 1}];
  const session = await createCustomSession(playerTeam, enemyTeam, [45, 46, 47, 48]);
  const burnedTurn = await session.choose("move 1");
  assert.match(battleText(burnedTurn), /灼伤|burn/i, battleText(burnedTurn));
  let states = session.getPlayerState();
  assert.equal(states.find(state => state.showdown_id === "greatball")?.status, "brn", JSON.stringify(states, null, 2));
  assert.equal(states.find(state => state.showdown_id === "ultraball")?.status, "", JSON.stringify(states, null, 2));

  await session.choose("switch 2");
  states = session.getPlayerState();
  assert.equal(states.find(state => state.showdown_id === "greatball")?.status, "brn", JSON.stringify(states, null, 2));
  assert.equal(states.find(state => state.showdown_id === "ultraball")?.status, "", JSON.stringify(states, null, 2));
  assert.equal(states.find(state => state.showdown_id === "ultraball")?.active, true, JSON.stringify(states, null, 2));

  let state = await session.choose("move 1");
  for (let guard = 0; guard < 6 && !state.ended; guard += 1) state = await session.choose("move 1");
  assert.equal(state.ended, true, JSON.stringify(state.timeline_events, null, 2));
  states = session.getPlayerState();
  assert.equal(states.find(entry => entry.run_member_id === "eevee-a")?.showdown_id, "greatball", JSON.stringify(states, null, 2));
  assert.equal(states.find(entry => entry.run_member_id === "eevee-a")?.status, "brn", JSON.stringify(states, null, 2));
  assert.equal(states.find(entry => entry.run_member_id === "eevee-b")?.showdown_id, "ultraball", JSON.stringify(states, null, 2));
  assert.equal(states.find(entry => entry.run_member_id === "eevee-b")?.status, "", JSON.stringify(states, null, 2));
}

async function testSyncPlayerStateDoesNotApplyStatusToWrongDuplicate(): Promise<void> {
  const playerTeam = [
    {...pokemon("Eevee", ["Tackle"], "Run Away"), run_member_id: "eevee-a", showdown_id: "greatball", pokeball: "greatball"},
    {...pokemon("Eevee", ["Tackle"], "Run Away"), run_member_id: "eevee-b", showdown_id: "ultraball", pokeball: "ultraball"},
  ];
  const session = await createCustomSession(playerTeam, [pokemon("Magikarp", ["Splash"], "Swift Swim")], [49, 50, 51, 52]);
  session.syncPlayerState(session.getPlayerState().map(state => state.showdown_id === "ultraball"
    ? {...state, status: "psn", condition: `${state.hp}/${state.maxhp} psn`}
    : {...state, status: "", condition: `${state.hp}/${state.maxhp}`}));
  const states = session.getPlayerState();
  assert.equal(states.find(state => state.showdown_id === "greatball")?.status, "", JSON.stringify(states, null, 2));
  assert.equal(states.find(state => state.showdown_id === "ultraball")?.status, "psn", JSON.stringify(states, null, 2));
}

async function testEnemyDuplicateSpeciesFaintDoesNotBleedIntoNextActive(): Promise<void> {
  const enemyTeam = [
    {...pokemon("Magikarp", ["Splash"], "Swift Swim"), level: 1, showdown_id: "greatball", pokeball: "greatball"},
    {...pokemon("Magikarp", ["Splash"], "Swift Swim"), level: 50, showdown_id: "ultraball", pokeball: "ultraball"},
  ];
  const session = await createCustomSession([{...pokemon("Rampardos", ["Head Smash"], "Mold Breaker"), level: 80}], enemyTeam, [53, 54, 55, 56]);
  const state = await session.choose("move 1");
  const faint = state.timeline_events.find(event => event.type === "faint" && event.targetSide === state.enemy_side);
  const switched = state.timeline_events.filter(event => event.type === "switch" && event.targetSide === state.enemy_side && event.target_showdown_id).at(-1);
  assert.equal(faint?.target_showdown_id, "greatball", JSON.stringify(state.timeline_events, null, 2));
  assert.equal(switched?.target_showdown_id, "ultraball", JSON.stringify(state.timeline_events, null, 2));
  const enemyActive = state.tracker.active[state.enemy_side || "p2"];
  assert.equal(enemyActive.showdown_id, "ultraball", JSON.stringify(state.tracker.active, null, 2));
  assert.notEqual(enemyActive.condition, "0 fnt", JSON.stringify(state.tracker.active, null, 2));
}

async function testClassicBattleFlowScenarios(): Promise<void> {
  const scene1 = await (await createCustomSession(
    [pokemon("Pikachu", ["Nuzzle"], "Static")],
    [pokemon("Magikarp", ["Double Team"], "Swift Swim")],
    [61, 62, 63, 64],
  )).choose("move 1");
  assertTimelineOrder(scene1, ["move", "damage", "status", "move", "boost"], "scene1 hit/status/boost");
  assert.match(battleText(scene1), /回避\+1/, battleText(scene1));

  const scene2 = await findSeededState("scene2 miss", async seed => {
    const session = await createCustomSession([pokemon("Pikachu", ["Thunder"], "Static")], [pokemon("Magikarp", ["Splash"], "Swift Swim")], seed);
    return session.choose("move 1");
  }, state => typeCount(state.timeline_events, "miss") > 0 || /没有命中|miss/i.test(battleText(state)), 80);
  assert.ok(!scene2.timeline_events.some(event => event.type === "damage" && event.targetSide === scene2.enemy_side), JSON.stringify(scene2.timeline_events, null, 2));

  const scene3Session = await createCustomSession([pokemon("Pikachu", ["Tackle"], "Static")], [pokemon("Bulbasaur", ["Tackle"], "Overgrow")], [65, 66, 67, 68]);
  scene3Session.syncPlayerState(withHp(scene3Session.getPlayerState(), 45));
  const scene3 = await scene3Session.chooseTrainerItem("superpotion", 0);
  const scene3Text = battleText(scene3);
  assert.ok(scene3Text.indexOf("使用了 好伤药") >= 0 && scene3Text.indexOf("HP:") > scene3Text.indexOf("使用了 好伤药") && scene3Text.indexOf("妙蛙种子 使用") > scene3Text.indexOf("HP:"), scene3Text);

  const scene4 = (await createCustomSession([pokemon("Pelipper", ["Splash"], "Drizzle")], [pokemon("Torkoal", ["Splash"], "Drought")], [69, 70, 71, 72])).getState();
  assert.equal(typeCount(scene4.timeline_events, "switch"), 2, JSON.stringify(scene4.timeline_events, null, 2));
  assert.equal(typeCount(scene4.timeline_events, "weather"), 2, JSON.stringify(scene4.timeline_events, null, 2));

  const scene5 = await (await createCustomSession(
    [{...pokemon("Garchomp", ["Earthquake"], "Sand Veil"), level: 100}],
    [{...pokemon("Magikarp", ["Splash"], "Swift Swim"), item: "Focus Sash", level: 1}],
    [73, 74, 75, 76],
  )).choose("move 1");
  assert.match(battleText(scene5), /气势披带|Focus Sash/i, battleText(scene5));

  const scene6 = await (await createCustomSession(
    [{...pokemon("Garchomp", ["Earthquake"], "Sand Veil"), level: 100}],
    [{...pokemon("Aron", ["Splash"], "Sturdy"), level: 1}],
    [77, 78, 79, 80],
  )).choose("move 1");
  assert.match(battleText(scene6), /结实|Sturdy/i, battleText(scene6));

  const scene7 = await (await createCustomSession(
    [pokemon("Cloyster", ["Icicle Spear"], "Skill Link")],
    [pokemon("Chansey", ["Splash"], "Natural Cure")],
    [81, 82, 83, 84],
  )).choose("move 1");
  assert.ok(scene7.timeline_events.filter(event => event.type === "damage" && event.targetSide === scene7.enemy_side).length >= 2, JSON.stringify(scene7.timeline_events, null, 2));
  assert.match(battleText(scene7), /击中|hit/i, battleText(scene7));

  const scene8Session = await createCustomSession(
    [pokemon("Mienshao", ["U-turn"], "Regenerator"), pokemon("Pikachu", ["Tackle"], "Static")],
    [pokemon("Chansey", ["Splash"], "Natural Cure")],
    [85, 86, 87, 88],
  );
  const scene8Initial = scene8Session.getPlayerState();
  scene8Session.syncPlayerState(scene8Initial.map((state, index) => index === 0 ? {...state, hp: Math.max(1, Math.floor(state.maxhp / 2)), condition: `${Math.max(1, Math.floor(state.maxhp / 2))}/${state.maxhp}`} : state));
  const scene8 = await scene8Session.choose("move 1");
  assert.ok(scene8.request?.forceSwitch?.some(Boolean), JSON.stringify(scene8.request, null, 2));
  assert.match(battleText(scene8), /急速折返|U-turn|再生力|Regenerator/i, battleText(scene8));

  const scene9 = await findSeededState("scene9 waterfall flinch", async seed => {
    const session = await createCustomSession([pokemon("Jirachi", ["Waterfall"], "Serene Grace")], [pokemon("Bulbasaur", ["Tackle"], "Overgrow")], seed);
    return session.choose("move 1");
  }, state => /畏缩/.test(battleText(state)), 120);
  assert.match(battleText(scene9), /畏缩/, battleText(scene9));
  assert.doesNotMatch(battleText(scene9), /flinch/i, battleText(scene9));
}

async function testSpeciesTierCanOverrideGenerationProfile(): Promise<void> {
  const service = createTestService();
  const generated = await service.generateRentalCandidates([31, 32, 33, 34], "gen7randombattle", 3, {
    profiles: ["tier1", "tier1", "tier1"],
    speciesTiers: [2, 3, 4],
    purpose: "starter",
  });
  assert.deepEqual(generated.display.map(pokemon => pokemon.generation_profile), ["tier1", "tier1", "tier1"]);
  assert.deepEqual(generated.display.map(pokemon => pokemon.species_tier), [2, 3, 4]);
}

async function testMoveLearnSourcesAreClassified(): Promise<void> {
  const service = createTestService();
  const moves = await service.learnableMoves(pokemon("Pikachu", ["Tackle"], "Static"));
  const thunderbolt = moves.find(move => move.id === "thunderbolt");
  const fakeout = moves.find(move => move.id === "fakeout");
  assert.ok(thunderbolt?.learn_sources?.includes("levelup"), JSON.stringify(thunderbolt, null, 2));
  assert.ok(thunderbolt?.learn_sources?.includes("machine"), JSON.stringify(thunderbolt, null, 2));
  assert.ok(thunderbolt?.learn_source_labels?.includes("自学"), JSON.stringify(thunderbolt, null, 2));
  assert.ok(fakeout?.learn_sources?.includes("egg"), JSON.stringify(fakeout, null, 2));
  const machineMoves = await service.machineMoves();
  assert.ok(machineMoves.some(move => move.id === "thunderbolt"), "global machine move pool should include Thunderbolt");
  assert.ok(machineMoves.every(move => move.learn_sources?.includes("machine")), JSON.stringify(machineMoves.slice(0, 5), null, 2));
}

async function testDexPokemonAbilitiesAndLearnset(): Promise<void> {
  const service = createTestService();
  const result = await service.dexSearch("pokemon", "妙蛙草", 0, 4);
  const ivysaur = result.entries.find(entry => entry.id === "ivysaur");
  assert.ok(ivysaur, JSON.stringify(result.entries, null, 2));
  assert.ok(ivysaur?.abilities?.some(ability => ability.id === "overgrow" && !ability.hidden), JSON.stringify(ivysaur?.abilities, null, 2));
  assert.ok(ivysaur?.abilities?.some(ability => ability.id === "chlorophyll" && ability.hidden), JSON.stringify(ivysaur?.abilities, null, 2));
  assert.ok(ivysaur?.learnset?.some(move => move.learn_sources?.includes("levelup")), "dex pokemon entry should include level-up moves");
  assert.ok(ivysaur?.learnset?.some(move => move.learn_sources?.includes("machine")), "dex pokemon entry should include machine moves");
}

async function testDexIncludesFutureMegaFormsWithSprites(): Promise<void> {
  const service = createTestService();
  const result = await service.dexSearch("pokemon", "超级姆克鹰", 0, 8);
  const megaStaraptor = result.entries.find(entry => entry.id === "staraptormega");
  assert.ok(megaStaraptor, JSON.stringify(result.entries, null, 2));
  assert.equal(megaStaraptor?.name, "Staraptor-Mega");
  assert.deepEqual(megaStaraptor?.types, ["Fighting", "Flying"]);
  assert.equal(megaStaraptor?.base_stats?.atk, 140);
  assert.match(megaStaraptor?.sprite?.paths.front_normal || "", /^assets\/runtime\/pokemon\/staraptormega\/front_normal-/);
  assert.match(megaStaraptor?.sprite?.paths.back_normal || "", /^assets\/runtime\/pokemon\/staraptormega\/back_normal-/);
  assert.match(megaStaraptor?.sprite?.paths.front_shiny || "", /^assets\/runtime\/pokemon\/staraptormega\/front_shiny-/);
  assert.match(megaStaraptor?.sprite?.paths.back_shiny || "", /^assets\/runtime\/pokemon\/staraptormega\/back_shiny-/);

  const itemResult = await service.dexSearch("items", "姆克鹰进化石", 0, 8);
  const staraptite = itemResult.entries.find(entry => entry.id === "staraptite");
  assert.ok(staraptite, JSON.stringify(itemResult.entries, null, 2));
  assert.equal(staraptite?.name, "Staraptite");
}

async function testZMoveBattleFlow(): Promise<void> {
  const zSession = await createCustomSession(
    [{...pokemon("Charmander", ["Ember", "Scratch"], "Blaze"), item: "Firium Z"}],
    [{...pokemon("Blissey", ["Splash"], "Natural Cure"), level: 100}],
    [91, 92, 93, 94],
  );
  const initial = zSession.getState();
  assert.equal(initial.request?.active?.[0]?.canZMove?.[0]?.move, "Inferno Overdrive", JSON.stringify(initial.request?.active?.[0], null, 2));
  assert.equal(initial.request?.active?.[0]?.canZMove?.[1], null, JSON.stringify(initial.request?.active?.[0], null, 2));
  const afterZ = await zSession.choose("move 1 zmove");
  assert.match(battleText(afterZ), /Z 力量|超强极限爆焰弹|Inferno Overdrive/i, battleText(afterZ));
  assert.ok(!afterZ.request?.active?.[0]?.canZMove?.some(Boolean), JSON.stringify(afterZ.request?.active?.[0], null, 2));

  const plainSession = await createCustomSession(
    [pokemon("Charmander", ["Ember"], "Blaze")],
    [pokemon("Blissey", ["Splash"], "Natural Cure")],
    [95, 96, 97, 98],
  );
  assert.ok(!plainSession.getState().request?.active?.[0]?.canZMove?.some(Boolean), JSON.stringify(plainSession.getState().request?.active?.[0], null, 2));

  const specialSession = await createCustomSession(
    [{...pokemon("Snorlax", ["Giga Impact"], "Immunity"), item: "Snorlium Z"}],
    [pokemon("Blissey", ["Splash"], "Natural Cure")],
    [99, 100, 101, 102],
  );
  assert.equal(specialSession.getState().request?.active?.[0]?.canZMove?.[0]?.move, "Pulverizing Pancake", JSON.stringify(specialSession.getState().request?.active?.[0], null, 2));
}

async function testEnemyUsesZMoveWhenAvailable(): Promise<void> {
  const session = await createCustomSession(
    [pokemon("Blissey", ["Splash"], "Natural Cure")],
    [{...pokemon("Charmander", ["Ember"], "Blaze"), item: "Firium Z"}],
    [103, 104, 105, 106],
    {level: "gym_low", randomness: 0, allowSwitch: false},
  );
  const state = await session.choose("move 1");
  assert.match(battleText(state), /Z 力量|超强极限爆焰弹|Inferno Overdrive/i, battleText(state));
}

async function testZMoveInternalProtocolIsHidden(): Promise<void> {
  const session = await createCustomSession(
    [
      {...pokemon("Persian-Alola", ["Parting Shot"], "Fur Coat"), item: "Darkinium Z"},
      pokemon("Blissey", ["Splash"], "Natural Cure"),
    ],
    [pokemon("Magikarp", ["Splash"], "Swift Swim")],
    [131, 132, 133, 134],
    {level: "gym_low", randomness: 0, allowSwitch: false},
  );
  const afterZ = await session.choose("move 1 zmove");
  assert.doesNotMatch(battleText(afterZ), /Z-Sprite|healreplacement/i, battleText(afterZ));
  const afterSwitch = await session.choose("switch 2");
  assert.doesNotMatch(battleText(afterSwitch), /Z-Sprite|healreplacement/i, battleText(afterSwitch));
  assert.match(battleText(afterSwitch), /HP:/, battleText(afterSwitch));
}

async function testZMoveGenerationGuarantee(): Promise<void> {
  const service = createTestService();
  const enabled = await service.generateRentalCandidates([107, 108, 109, 110], "gen9randombattle", 6, {
    profiles: ["tier2", "tier2", "tier2", "tier2", "tier2", "tier2"],
    purpose: "starter",
    battleSetting: GEN7_BATTLE_SETTING,
  });
  assert.ok(enabled.display.some(pokemon => service.battleSystemForItem(pokemon.item_id) === "zmove"), JSON.stringify(enabled.display.map(pokemon => ({species: pokemon.species_id, item: pokemon.item_id, moves: pokemon.moves.map(move => move.id)})), null, 2));

  const disabled = await service.generateRentalCandidates([111, 112, 113, 114], "gen9randombattle", 6, {
    profiles: ["tier2", "tier2", "tier2", "tier2", "tier2", "tier2"],
    purpose: "starter",
    battleSetting: DEFAULT_BATTLE_SETTING,
  });
  assert.ok(disabled.display.every(pokemon => service.battleSystemForItem(pokemon.item_id) !== "zmove"), JSON.stringify(disabled.display.map(pokemon => ({species: pokemon.species_id, item: pokemon.item_id})), null, 2));
}

async function testPikachuGenerationGuaranteesSignatureZMoves(): Promise<void> {
  const service = createTestService();
  const generated = await service.generateRentalCandidates([171, 172, 173, 174], "gen9randombattle", 1, {
    speciesIds: ["pikachu"],
    purpose: "starter",
    battleSetting: GEN7_BATTLE_SETTING,
  });
  const moveIds = generated.display[0].moves.map(move => move.id);
  assert.ok(moveIds.includes("volttackle"), JSON.stringify(generated.display[0], null, 2));
  assert.equal(generated.display[0].item_id, "pikaniumz", JSON.stringify(generated.display[0], null, 2));
  assert.equal(service.battleSystemForItem(generated.display[0].item_id), "zmove", JSON.stringify(generated.display[0], null, 2));

  const session = await service.createBattleSession({
    playerTeam: generated.team,
    enemyTeam: [{...pokemon("Blissey", ["Splash"], "Natural Cure"), level: 100}],
    playerDisplay: generated.display,
    enemyDisplay: await service.describeTeam([{...pokemon("Blissey", ["Splash"], "Natural Cure"), level: 100}]),
    seed: [175, 176, 177, 178],
    enemyAi: {level: "gym_low", randomness: 0, allowSwitch: false},
    battleSetting: GEN7_BATTLE_SETTING,
  });
  assert.ok(session.getState().request?.active?.[0]?.canZMove?.some(Boolean), JSON.stringify(session.getState().request?.active?.[0], null, 2));

  const capGenerated = await service.generateRentalCandidates([179, 180, 181, 182], "gen9randombattle", 1, {
    speciesIds: ["pikachuphd"],
    purpose: "starter",
    battleSetting: GEN7_BATTLE_SETTING,
  });
  const capMoveIds = capGenerated.display[0].moves.map(move => move.id);
  assert.equal(capGenerated.display[0].species_id, "pikachuoriginal", JSON.stringify(capGenerated.display[0], null, 2));
  assert.ok(capMoveIds.includes("thunderbolt"), JSON.stringify(capGenerated.display[0], null, 2));
  assert.equal(capGenerated.display[0].item_id, "pikashuniumz", JSON.stringify(capGenerated.display[0], null, 2));
  assert.equal(service.battleSystemForItem(capGenerated.display[0].item_id), "zmove", JSON.stringify(capGenerated.display[0], null, 2));
  const capSession = await service.createBattleSession({
    playerTeam: capGenerated.team,
    enemyTeam: [{...pokemon("Blissey", ["Splash"], "Natural Cure"), level: 100}],
    playerDisplay: capGenerated.display,
    enemyDisplay: await service.describeTeam([{...pokemon("Blissey", ["Splash"], "Natural Cure"), level: 100}]),
    seed: [183, 184, 185, 186],
    enemyAi: {level: "gym_low", randomness: 0, allowSwitch: false},
    battleSetting: GEN7_BATTLE_SETTING,
  });
  assert.ok(capSession.getState().request?.active?.[0]?.canZMove?.some(Boolean), JSON.stringify(capSession.getState().request?.active?.[0], null, 2));
}

async function testMegaBattleFlow(): Promise<void> {
  const session = await createCustomSession(
    [{...pokemon("Charizard", ["Scratch", "Ember"], "Blaze"), item: "Charizardite X"}],
    [{...pokemon("Blissey", ["Splash"], "Natural Cure"), level: 100}],
    [115, 116, 117, 118],
  );
  const initial = session.getState();
  assert.equal(initial.request?.active?.[0]?.canMegaEvo, true, JSON.stringify(initial.request?.active?.[0], null, 2));
  const afterMega = await session.choose("move 1 mega");
  assert.match(battleText(afterMega), /超级进化|Charizardite X|喷火龙进化石X/i, battleText(afterMega));
  const active = afterMega.tracker.active[afterMega.player_side || "p1"];
  assert.equal(active.species_id, "charizardmegax", JSON.stringify(active, null, 2));
  assert.ok(active.sprite?.paths?.front_normal || active.sprite?.paths?.back_normal, JSON.stringify(active.sprite, null, 2));
  assert.ok(!afterMega.request?.active?.[0]?.canMegaEvo, JSON.stringify(afterMega.request?.active?.[0], null, 2));
}

async function testEnemyUsesMegaWhenAvailable(): Promise<void> {
  const session = await createCustomSession(
    [pokemon("Blissey", ["Splash"], "Natural Cure")],
    [{...pokemon("Charizard", ["Scratch", "Ember"], "Blaze"), item: "Charizardite X"}],
    [119, 120, 121, 122],
    {level: "gym_low", randomness: 0, allowSwitch: false},
  );
  const state = await session.choose("move 1");
  const active = state.tracker.active[state.enemy_side || "p2"];
  assert.match(battleText(state), /超级进化|Charizardite X|喷火龙进化石X/i, battleText(state));
  assert.equal(active.species_id, "charizardmegax", JSON.stringify(active, null, 2));
}

async function testMegaGenerationGuarantee(): Promise<void> {
  const service = createTestService();
  const enabled = await service.generateRentalCandidates([123, 124, 125, 126], "gen9randombattle", 3, {
    speciesIds: ["charizard", "venusaur", "blastoise"],
    purpose: "starter",
    battleSetting: GEN7_BATTLE_SETTING,
  });
  assert.ok(enabled.display.some(pokemon => service.battleSystemForItem(pokemon.item_id) === "mega"), JSON.stringify(enabled.display.map(pokemon => ({species: pokemon.species_id, item: pokemon.item_id})), null, 2));

  const disabled = await service.generateRentalCandidates([127, 128, 129, 130], "gen9randombattle", 3, {
    speciesIds: ["charizard", "venusaur", "blastoise"],
    purpose: "starter",
    battleSetting: DEFAULT_BATTLE_SETTING,
  });
  assert.ok(disabled.display.every(pokemon => service.battleSystemForItem(pokemon.item_id) !== "mega"), JSON.stringify(disabled.display.map(pokemon => ({species: pokemon.species_id, item: pokemon.item_id})), null, 2));
}

function testDedicatedMegaStoneGuarantee(): void {
  const service = createTestService();
  const team = [{...pokemon("Charizard", ["Scratch", "Ember"], "Blaze"), item: "Leftovers"}];
  const megaGuarantee = (service as unknown as {ensureMegaUser: (team: PokemonSet[], options: unknown, rng: () => number) => void}).ensureMegaUser.bind(service);
  megaGuarantee(team, {battleSetting: GEN7_BATTLE_SETTING}, () => 0);
  assert.match(team[0].item, /Charizardite [XY]/, JSON.stringify(team[0], null, 2));
}

function testRayquazaMegaPoolGate(): void {
  const service = createTestService();
  const allowed = (service as unknown as {speciesAllowedByBattleSetting: (speciesId: string, setting: typeof DEFAULT_BATTLE_SETTING, seenSpecies: Set<string>, purpose?: "starter" | "normal" | "boss" | "rescue") => boolean}).speciesAllowedByBattleSetting.bind(service);
  const tierForSpecies = (service as unknown as {tierForSpecies: (speciesId: string) => number | null}).tierForSpecies.bind(service);
  assert.equal(tierForSpecies("ditto"), 6);
  assert.equal(tierForSpecies("smeargle"), 6);
  assert.equal(tierForSpecies("arceus"), 10);
  assert.equal(allowed("dragonite", {...DEFAULT_BATTLE_SETTING, legendary_battle: false}, new Set(), "normal"), true);
  assert.equal(allowed("dragonite", {...DEFAULT_BATTLE_SETTING, legendary_battle: true}, new Set(), "normal"), true);
  assert.equal(allowed("arceus", {...DEFAULT_BATTLE_SETTING, legendary_battle: false}, new Set(), "normal"), false);
  assert.equal(allowed("arceusfire", {...DEFAULT_BATTLE_SETTING, legendary_battle: false}, new Set(), "normal"), false);
  assert.equal(allowed("arceusfire", {...DEFAULT_BATTLE_SETTING, legendary_battle: true}, new Set(), "normal"), true);
  assert.equal(allowed("giratinaorigin", {...DEFAULT_BATTLE_SETTING, legendary_battle: false}, new Set(), "normal"), false);
  assert.equal(allowed("rayquaza", {...DEFAULT_BATTLE_SETTING, legendary_battle: true}, new Set(), "normal"), false);
  assert.equal(allowed("rayquaza", {...GEN7_BATTLE_SETTING, legendary_battle: false}, new Set(), "normal"), false);
  assert.equal(allowed("rayquaza", {...GEN7_BATTLE_SETTING, legendary_battle: true}, new Set(), "normal"), true);
  assert.equal(allowed("dragonite", {...DEFAULT_BATTLE_SETTING, legendary_battle: false}, new Set(), "boss"), true);
  assert.equal(allowed("rayquaza", {...DEFAULT_BATTLE_SETTING, legendary_battle: false}, new Set(), "boss"), true);
}

async function testDynamaxBattleFlow(): Promise<void> {
  const session = await createCustomSession(
    [{...pokemon("Charizard", ["Flamethrower", "Air Slash"], "Blaze"), gigantamax: true, dynamaxLevel: 10}],
    [{...pokemon("Blissey", ["Tackle"], "Natural Cure"), level: 100}],
    [135, 136, 137, 138],
    {level: "gym_low", randomness: 0, allowSwitch: false},
    GEN8_BATTLE_SETTING,
  );
  const initial = session.getState();
  assert.equal(initial.request?.active?.[0]?.canDynamax, true, JSON.stringify(initial.request?.active?.[0], null, 2));
  assert.equal(initial.request?.active?.[0]?.maxMoves?.maxMoves?.[0]?.move, "gmaxwildfire", JSON.stringify(initial.request?.active?.[0], null, 2));
  const afterMax = await session.choose("move 1 max");
  assert.match(battleText(afterMax), /极巨化|超极巨|G-Max Wildfire|超极巨地狱灭焰/i, battleText(afterMax));
  const active = afterMax.tracker.active[afterMax.player_side || "p1"];
  assert.equal(active.dynamaxed, true, JSON.stringify(active, null, 2));
  assert.equal(active.gigantamaxed, true, JSON.stringify(active, null, 2));
  assert.equal(active.species_id, "charizardgmax", JSON.stringify(active, null, 2));
  assert.ok(active.sprite?.paths?.front_normal || active.sprite?.paths?.back_normal, JSON.stringify(active.sprite, null, 2));
  assert.ok(!afterMax.request?.active?.[0]?.canDynamax, JSON.stringify(afterMax.request?.active?.[0], null, 2));
  let later = afterMax;
  for (let index = 0; index < 4 && later.tracker.active[later.player_side || "p1"].dynamaxed && later.request?.active?.[0]?.moves?.length; index += 1) {
    later = await session.choose("move 1");
  }
  const restored = later.tracker.active[later.player_side || "p1"];
  assert.equal(restored.dynamaxed, false, JSON.stringify(restored, null, 2));
  assert.equal(restored.gigantamaxed, false, JSON.stringify(restored, null, 2));
  assert.equal(restored.species_id, "charizard", JSON.stringify(restored, null, 2));
}

async function testDynamaxEndRestoresDisplayFromSparseOriginal(): Promise<void> {
  const session = await createCustomSession(
    [{...pokemon("Meowth", ["Pay Day", "Bite"], "Pickup"), gigantamax: true, dynamaxLevel: 10}],
    [pokemon("Blissey", ["Soft-Boiled"], "Natural Cure")],
    [147, 148, 149, 150],
    {level: "gym_low", randomness: 0, allowSwitch: false},
    GEN8_BATTLE_SETTING,
  );
  const initial = session.getState();
  const playerSide = initial.player_side || "p1";
  initial.tracker.active[playerSide] = {
    name: "Meowth",
    condition: "108/108",
    status: "",
    showdown_id: "pokeball",
  };
  let state = await session.choose("move 1 max");
  assert.equal(state.tracker.active[playerSide].species_id, "meowthgmax", JSON.stringify(state.tracker.active[playerSide], null, 2));
  for (let index = 0; index < 4 && state.tracker.active[playerSide].dynamaxed; index += 1) {
    state = await session.choose("move 1");
  }
  const restored = state.tracker.active[playerSide];
  assert.equal(restored.name, "Meowth", JSON.stringify(restored, null, 2));
  assert.equal(restored.display_name, "喵喵", JSON.stringify(restored, null, 2));
  assert.equal(restored.species_id, "meowth", JSON.stringify(restored, null, 2));
  assert.ok(restored.sprite?.paths?.front_normal && !restored.sprite.paths.front_normal.includes("meowth-gmax"), JSON.stringify(restored.sprite, null, 2));
}

async function testEnemyUsesDynamaxWhenAvailable(): Promise<void> {
  const session = await createCustomSession(
    [pokemon("Blissey", ["Tackle"], "Natural Cure")],
    [{...pokemon("Charizard", ["Flamethrower", "Air Slash"], "Blaze"), gigantamax: true, dynamaxLevel: 10}],
    [139, 140, 141, 142],
    {level: "gym_low", randomness: 0, allowSwitch: false},
    GEN8_BATTLE_SETTING,
  );
  const state = await session.choose("move 1");
  const active = state.tracker.active[state.enemy_side || "p2"];
  assert.match(battleText(state), /极巨化|超极巨|G-Max Wildfire|超极巨地狱灭焰/i, battleText(state));
  assert.equal(active.dynamaxed, true, JSON.stringify(active, null, 2));
  assert.equal(active.gigantamaxed, true, JSON.stringify(active, null, 2));
  assert.equal(active.species_id, "charizardgmax", JSON.stringify(active, null, 2));
}

async function testDynamaxGenerationDoesNotForceGigantamax(): Promise<void> {
  const service = createTestService();
  const enabled = await service.generateRentalCandidates([143, 144, 145, 146], "gen8randombattle", 3, {
    speciesIds: ["charizard", "venusaur", "blastoise"],
    purpose: "starter",
    battleSetting: GEN8_BATTLE_SETTING,
  });
  assert.ok(enabled.team.every(set => set.gigantamax !== true), JSON.stringify(enabled.team, null, 2));
  assert.ok(enabled.team.every(set => Number(set.dynamaxLevel || 0) === 10), JSON.stringify(enabled.team, null, 2));

  const allowed = (service as unknown as {speciesAllowedByBattleSetting: (speciesId: string, setting: BattleSetting, seenSpecies: Set<string>, purpose?: "starter" | "normal" | "boss" | "rescue") => boolean}).speciesAllowedByBattleSetting.bind(service);
  assert.equal(allowed("sprigatito", GEN8_ALL_GENERATIONS_SETTING, new Set(), "normal"), false);
  assert.equal(allowed("grookey", GEN8_ALL_GENERATIONS_SETTING, new Set(), "normal"), true);
  assert.equal(allowed("grookey", {...GEN7_BATTLE_SETTING, allowed_generations: [1, 2, 3, 4, 5, 6, 7, 8]}, new Set(), "normal"), false);
}

async function testTerastalBattleFlow(): Promise<void> {
  const session = await createCustomSession(
    [{...pokemon("Pikachu", ["Tera Blast", "Thunderbolt"], "Static"), teraType: "Ice"}],
    [{...pokemon("Blissey", ["Tackle"], "Natural Cure"), level: 100}],
    [151, 152, 153, 154],
    {level: "gym_low", randomness: 0, allowSwitch: false},
    GEN9_BATTLE_SETTING,
  );
  const initial = session.getState();
  assert.equal(initial.request?.active?.[0]?.canTerastallize, "Ice", JSON.stringify(initial.request?.active?.[0], null, 2));
  const afterTera = await session.choose("move 1 terastallize");
  assert.match(battleText(afterTera), /太晶化成了冰属性/, battleText(afterTera));
  const active = afterTera.tracker.active[afterTera.player_side || "p1"];
  assert.equal(active.terastallized, true, JSON.stringify(active, null, 2));
  assert.equal(active.tera_type, "Ice", JSON.stringify(active, null, 2));
  assert.deepEqual(active.types, ["Ice"], JSON.stringify(active, null, 2));
  assert.ok(!afterTera.request?.active?.[0]?.canTerastallize, JSON.stringify(afterTera.request?.active?.[0], null, 2));
}

async function testEnemyUsesTerastalWhenAvailable(): Promise<void> {
  const session = await createCustomSession(
    [pokemon("Blissey", ["Tackle"], "Natural Cure")],
    [{...pokemon("Pikachu", ["Tera Blast", "Thunderbolt"], "Static"), teraType: "Ice"}],
    [155, 156, 157, 158],
    {level: "gym_low", randomness: 0, allowSwitch: false},
    GEN9_BATTLE_SETTING,
  );
  const state = await session.choose("move 1");
  const active = state.tracker.active[state.enemy_side || "p2"];
  assert.match(battleText(state), /太晶化成了冰属性/, battleText(state));
  assert.equal(active.terastallized, true, JSON.stringify(active, null, 2));
  assert.equal(active.tera_type, "Ice", JSON.stringify(active, null, 2));
}

async function testEnemyDoesNotUseTerastalWhenDisabled(): Promise<void> {
  const session = await createCustomSession(
    [pokemon("Blissey", ["Tackle"], "Natural Cure")],
    [{...pokemon("Pikachu", ["Tera Blast", "Thunderbolt"], "Static"), teraType: "Ice"}],
    [159, 160, 161, 162],
    {level: "gym_low", randomness: 0, allowSwitch: false},
    DEFAULT_BATTLE_SETTING,
  );
  const state = await session.choose("move 1");
  const active = state.tracker.active[state.enemy_side || "p2"];
  assert.ok(!/太晶化成了冰属性/.test(battleText(state)), battleText(state));
  assert.ok(!active.terastallized, JSON.stringify(active, null, 2));
}

async function testTerastalGenerationTeraTypes(): Promise<void> {
  const service = createTestService();
  const team: PokemonSet[] = [
    {...pokemon("Charmander", ["Ember", "Scratch"], "Blaze")},
    {...pokemon("Magikarp", ["Splash"], "Swift Swim")},
  ];
  const ensureTerastalTypes = (service as unknown as {ensureTerastalTypes: (team: PokemonSet[], options: unknown, rng: () => number) => void}).ensureTerastalTypes.bind(service);
  ensureTerastalTypes(team, {battleSetting: GEN9_BATTLE_SETTING}, () => 0);
  assert.equal(team[0].teraType, "Fire", JSON.stringify(team[0], null, 2));
  assert.equal(team[1].teraType, "Water", JSON.stringify(team[1], null, 2));

  const generated = await service.generateRentalCandidates([159, 160, 161, 162], "gen9randombattle", 3, {
    speciesIds: ["pikachu", "charmander", "bulbasaur"],
    purpose: "starter",
    battleSetting: GEN9_BATTLE_SETTING,
  });
  assert.ok(generated.team.every(set => typeof set.teraType === "string" && set.teraType), JSON.stringify(generated.team, null, 2));
  assert.ok(generated.display.every(pokemon => pokemon.tera_type && pokemon.tera_type_zh), JSON.stringify(generated.display.map(pokemon => ({species: pokemon.species_id, tera_type: pokemon.tera_type, tera_type_zh: pokemon.tera_type_zh})), null, 2));
}

function testDedicatedZCrystalPreferredDuringGuarantee(): void {
  const service = createTestService();
  const team = [{...pokemon("Snorlax", ["Giga Impact", "Tackle"], "Immunity"), item: "Normalium Z"}];
  const zGuarantee = (service as unknown as {ensureZMoveUser: (team: PokemonSet[], options: unknown, rng: () => number) => void}).ensureZMoveUser.bind(service);
  zGuarantee(team, {battleSetting: GEN7_BATTLE_SETTING}, () => 0);
  assert.equal(team[0].item, "Snorlium Z", JSON.stringify(team[0], null, 2));

  const missingMoveTeam: PokemonSet[] = [{...pokemon("Snorlax", ["Defense Curl", "Tackle", "Rest", "Bite"], "Immunity"), item: "Leftovers"}];
  zGuarantee(missingMoveTeam, {battleSetting: GEN7_BATTLE_SETTING}, () => 0);
  assert.equal(missingMoveTeam[0].item, "Snorlium Z", JSON.stringify(missingMoveTeam[0], null, 2));
  assert.ok(missingMoveTeam[0].moves.some((move: string) => move === "Giga Impact"), JSON.stringify(missingMoveTeam[0], null, 2));
  assert.equal(missingMoveTeam[0].moves.length, 4, JSON.stringify(missingMoveTeam[0], null, 2));
}

function testBattleSystemItemClassification(): void {
  const service = createTestService();
  assert.equal(service.battleSystemForItem("venusaurite"), "mega");
  assert.equal(service.battleSystemForItem("absolitez"), "mega");
  assert.equal(service.battleSystemForItem("firiumz"), "zmove");
  assert.equal(service.battleSystemForItem("eviolite"), null);
  assert.equal(service.battleSystemForItem("leftovers"), null);
  assert.equal(service.zCrystalItemIds().length, 35);
  assert.equal(service.megaStoneItemIds().length, 92);
  assert.ok(!service.megaStoneItemIds().includes("crucibellite"));
}

async function testItemOptionsIncludeLocalRecoveryItems(): Promise<void> {
  const service = createTestService();
  const items = await service.itemOptions();
  const byId = new Map(items.map(item => [String(item.id), item]));
  for (const id of ["potion", "superpotion", "hyperpotion", "fullrestore", "revivalherb", "ether", "maxether", "elixir", "maxelixir"]) {
    const item = byId.get(id);
    assert.ok(item, `${id} should be available to shop/item detail lookup`);
    assert.ok(item.name_zh && item.name_zh !== id, `${id} should have localized display name`);
    assert.ok(item.icon_asset, `${id} should have an icon asset`);
  }
}

await testUnknownMoveRejected();
await testTrainerItemActsBeforeEnemyMove();
await testInvalidItemDoesNotAdvanceTurn();
await testTrainingItemsAreRestOnlyConsumables();
await testPokemonGenderGeneration();
await testBattleSessionNormalizesMissingGender();
await testEnemyAiPrefersEffectiveDamage();
await testSoulSickAiPrefersBadMoves();
await testSoulSickAiDoesNotPreferBattleSystems();
await testSoulSickAiDoesNotVoluntarySwitchButCanForceSwitch();
await testRookieAiPrefersEffectiveDamage();
await testRookieAiHasLowerKoPressureThanBalanced();
await testRookieAiDoesNotPreferBattleSystems();
await testRegeneratorUsesShowdownIdWithDuplicateIdent();
await testShowdownIdsStayWithPokemonObjects();
await testPainSplitSetHpHasFiniteTimeline();
await testSkyAttackAnimationProtocolIsHidden();
await testBoostAndCantReasonsAreLocalized();
await testAdvanceIfWaitingContinuesChargingMove();
await testDuplicateSpeciesSwitchKeepsIdentityPairs();
await testDuplicateSpeciesStatusDoesNotBleedIntoRestState();
await testSyncPlayerStateDoesNotApplyStatusToWrongDuplicate();
await testEnemyDuplicateSpeciesFaintDoesNotBleedIntoNextActive();
await testClassicBattleFlowScenarios();
await testSpeciesTierCanOverrideGenerationProfile();
await testMoveLearnSourcesAreClassified();
await testDexPokemonAbilitiesAndLearnset();
await testDexIncludesFutureMegaFormsWithSprites();
await testZMoveBattleFlow();
await testEnemyUsesZMoveWhenAvailable();
await testZMoveInternalProtocolIsHidden();
await testZMoveGenerationGuarantee();
await testPikachuGenerationGuaranteesSignatureZMoves();
await testMegaBattleFlow();
await testEnemyUsesMegaWhenAvailable();
await testMegaGenerationGuarantee();
await testDynamaxBattleFlow();
await testDynamaxEndRestoresDisplayFromSparseOriginal();
await testEnemyUsesDynamaxWhenAvailable();
await testDynamaxGenerationDoesNotForceGigantamax();
await testTerastalBattleFlow();
await testEnemyUsesTerastalWhenAvailable();
await testEnemyDoesNotUseTerastalWhenDisabled();
await testTerastalGenerationTeraTypes();
testDedicatedZCrystalPreferredDuringGuarantee();
testDedicatedMegaStoneGuarantee();
testRayquazaMegaPoolGate();
testBattleSystemItemClassification();
await testItemOptionsIncludeLocalRecoveryItems();
console.log("Trainer item battle tests passed.");
