import assert from "node:assert/strict";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {GameService} from "./index.js";
import type {PokemonSet, PlayerPokemonState} from "@changebattle/shared";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "../../..");
const showdownPath = process.env.SHOWDOWN_PATH || path.resolve(projectRoot, "../pokemonShowdowm/pokemon-showdown");

const baseStats = {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31};
const zeroStats = {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0};

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
  const service = new GameService({projectRoot, showdownPath});
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

async function testEnemyAiPrefersEffectiveDamage(): Promise<void> {
  const service = new GameService({projectRoot, showdownPath});
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

async function testRegeneratorUsesShowdownIdWithDuplicateIdent(): Promise<void> {
  const service = new GameService({projectRoot, showdownPath});
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

await testUnknownMoveRejected();
await testTrainerItemActsBeforeEnemyMove();
await testInvalidItemDoesNotAdvanceTurn();
await testEnemyAiPrefersEffectiveDamage();
await testRegeneratorUsesShowdownIdWithDuplicateIdent();
console.log("Trainer item battle tests passed.");
