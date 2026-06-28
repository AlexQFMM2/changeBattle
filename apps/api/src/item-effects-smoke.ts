import {strict as assert} from "node:assert";
import type {DexMoveSummary, DexPokemonDetail} from "@changebattle-v2/showdown-dex-core";
import {createBattleCommandDraftV4, normalizeBattleRequestV4, splitBattleTrainerItemChoicesV4, stringifyBattleTrainerItemChoiceV4} from "./battle.js";
import {applyRecoveryItemToPokemonV4, applyTmItemToPokemonV4, applyTrainingItemToPokemonV4, tmUseFailureReasonV4} from "./itemEffects.js";
import type {BagStateV4, LocalPokemonV4, PlayerItemInstanceV4} from "./training.js";

const pokemon = makePokemon();
pokemon.entryHp = 40;
pokemon.moves[0]!.remainingPp = 7;
pokemon.moves[0]!.maxPp = 8;
pokemon.moves[1]!.remainingPp = 12;
pokemon.moves[1]!.maxPp = 32;

const ether = item("ether", "PP 单项小补剂");
const bag: BagStateV4 = {maxSize: 10, items: [ether]};
const ppResult = applyRecoveryItemToPokemonV4({item: ether, pokemon, bag});
assert.equal(ppResult.ok, true);
if (ppResult.ok) {
  assert.equal(ppResult.pokemon.moves[0]!.remainingPp, 7);
  assert.equal(ppResult.pokemon.moves[1]!.remainingPp, 22);
  assert.equal(ppResult.bag.items.length, 0);
}

const potion = item("potion", "回复药");
const hpResult = applyRecoveryItemToPokemonV4({item: potion, pokemon: {...pokemon, entryHp: 10}, bag: {maxSize: 10, items: [potion]}});
assert.equal(hpResult.ok, true);
if (hpResult.ok) {
  assert.equal(hpResult.pokemon.entryHp, 30);
}

const evAddItem = item("ev-hp-plus", "HP提升剂", {type: "training", canBattleUse: false});
const evCappedPokemon = {...makePokemon(), evs: {hp: 250, atk: 252, def: 8, spa: 0, spd: 0, spe: 0}};
const evCappedResult = applyTrainingItemToPokemonV4({item: evAddItem, pokemon: evCappedPokemon, bag: bagWith(evAddItem)});
assert.equal(evCappedResult.ok, false);

const evAddPokemon = {...makePokemon(), evs: {hp: 250, atk: 250, def: 0, spa: 0, spd: 0, spe: 0}};
const evAddResult = applyTrainingItemToPokemonV4({item: evAddItem, pokemon: evAddPokemon, bag: bagWith(evAddItem)});
assert.equal(evAddResult.ok, true);
if (evAddResult.ok) {
  assert.equal(evAddResult.pokemon.evs.hp, 252);
  assert.equal(evAddResult.bag.items.length, 0);
}

const evDownItem = item("ev-atk-down", "攻击降低药", {type: "training", canBattleUse: false});
const evDownResult = applyTrainingItemToPokemonV4({
  item: evDownItem,
  pokemon: {...makePokemon(), evs: {hp: 0, atk: 12, def: 0, spa: 0, spd: 0, spe: 0}},
  bag: bagWith(evDownItem),
});
assert.equal(evDownResult.ok, true);
if (evDownResult.ok) {
  assert.equal(evDownResult.pokemon.evs.atk, 2);
}

const mint = item("adamantmint", "固执薄荷", {type: "training", canBattleUse: false});
const mintResult = applyTrainingItemToPokemonV4({item: mint, pokemon: makePokemon(), bag: bagWith(mint)});
assert.equal(mintResult.ok, true);
if (mintResult.ok) assert.equal(mintResult.pokemon.nature, "Adamant");

const capsule = item("abilitycapsule", "特性胶囊", {type: "training", canBattleUse: false});
const capsuleResult = applyTrainingItemToPokemonV4({item: capsule, pokemon: makePokemon(), bag: bagWith(capsule), pokemonDetail: fakePokemonDetail()});
assert.equal(capsuleResult.ok, true);
if (capsuleResult.ok) assert.equal(capsuleResult.pokemon.abilityId, "lightningrod");

const patch = item("abilitypatch", "特性膏药", {type: "training", canBattleUse: false});
const patchResult = applyTrainingItemToPokemonV4({item: patch, pokemon: makePokemon(), bag: bagWith(patch), pokemonDetail: fakePokemonDetail()});
assert.equal(patchResult.ok, true);
if (patchResult.ok) assert.equal(patchResult.pokemon.abilityId, "surgesurfer");

const candy = item("rarecandy", "神奇糖果", {type: "training", canBattleUse: false});
const candyResult = applyTrainingItemToPokemonV4({
  item: candy,
  pokemon: {...makePokemon(), level: 50, maxHp: 100, entryHp: 40},
  bag: bagWith(candy),
  calculateMaxHp: next => next.level === 51 ? 110 : 100,
});
assert.equal(candyResult.ok, true);
if (candyResult.ok) {
  assert.equal(candyResult.pokemon.level, 51);
  assert.equal(candyResult.pokemon.maxHp, 110);
  assert.equal(candyResult.pokemon.entryHp, 44);
}

const silver = item("bottlecap", "银色王冠", {type: "training", canBattleUse: false});
const silverResult = applyTrainingItemToPokemonV4({
  item: silver,
  pokemon: {...makePokemon(), ivs: {hp: 31, atk: 12, def: 4, spa: 20, spd: 31, spe: 0}},
  bag: bagWith(silver),
});
assert.equal(silverResult.ok, true);
if (silverResult.ok) assert.equal(silverResult.pokemon.ivs.spe, 31);

const gold = item("goldbottlecap", "金色王冠", {type: "training", canBattleUse: false});
const goldResult = applyTrainingItemToPokemonV4({
  item: gold,
  pokemon: {...makePokemon(), ivs: {hp: 31, atk: 12, def: 4, spa: 20, spd: 31, spe: 0}},
  bag: bagWith(gold),
});
assert.equal(goldResult.ok, true);
if (goldResult.ok) assert.deepEqual(goldResult.pokemon.ivs, {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31});

const gray = item("graybottlecap", "灰色王冠", {type: "training", canBattleUse: false});
const grayResult = applyTrainingItemToPokemonV4({
  item: gray,
  pokemon: {...makePokemon(), itemId: "graybottlecap", heldItemInstanceId: gray.id, ivs: {hp: 20, atk: 31, def: 31, spa: 30, spd: 31, spe: 0}},
  bag: bagWith(gray),
});
assert.equal(grayResult.ok, true);
if (grayResult.ok) {
  assert.equal(grayResult.pokemon.ivs.atk, 0);
  assert.equal(grayResult.pokemon.itemId, "");
  assert.equal(grayResult.pokemon.heldItemInstanceId, undefined);
  assert.equal(grayResult.bag.items.length, 0);
}

const tm = item("tm:voltswitch", "技能机器：伏特替换", {type: "tm", canBattleUse: false, canTake: false});
const tmMove = moveSummary("voltswitch", {nameZh: "伏特替换", type: "电", category: "特殊", power: 70, accuracy: 100, pp: 20});
const tmResult = applyTmItemToPokemonV4({
  item: tm,
  detail: {id: "tm:voltswitch", name: "TM Volt Switch", nameZh: "技能机器：伏特替换", kind: "tm", kindLabel: "技能机器", description: "", moveId: "voltswitch"},
  pokemon: makePokemon(),
  bag: bagWith(tm),
  machineMoves: [tmMove],
  moveSlot: 2,
});
assert.equal(tmResult.ok, true);
if (tmResult.ok) {
  assert.equal(tmResult.pokemon.moves[2]!.moveId, "voltswitch");
  assert.equal(tmResult.pokemon.moves[2]!.remainingPp, 20);
  assert.equal(tmResult.bag.items.length, 0);
}

const duplicateTm = item("tm:thunderbolt", "技能机器：十万伏特", {type: "tm", canBattleUse: false, canTake: false});
assert.match(tmUseFailureReasonV4({
  item: duplicateTm,
  detail: {id: "tm:thunderbolt", name: "TM Thunderbolt", nameZh: "技能机器：十万伏特", kind: "tm", kindLabel: "技能机器", description: "", moveId: "thunderbolt"},
  pokemon: makePokemon(),
  machineMoves: [moveSummary("thunderbolt")],
}), /已经学会/);
const illegalTm = item("tm:flamethrower", "技能机器：喷射火焰", {type: "tm", canBattleUse: false, canTake: false});
assert.match(tmUseFailureReasonV4({
  item: illegalTm,
  detail: {id: "tm:flamethrower", name: "TM Flamethrower", nameZh: "技能机器：喷射火焰", kind: "tm", kindLabel: "技能机器", description: "", moveId: "flamethrower"},
  pokemon: makePokemon(),
  machineMoves: [moveSummary("voltswitch")],
}), /无法通过技能机器/);

const request = normalizeBattleRequestV4({
  active: [{moves: [{move: "Tackle", id: "tackle", pp: 35, maxpp: 35}]}],
  side: {id: "p1", name: "P1", pokemon: [{ident: "p1: Pikachu", details: "Pikachu, L50", condition: "40/100", pokeball: "pokeball"}]},
}, "p1", "singles", "standard");
const draft = createBattleCommandDraftV4(request);
draft.choices[0] = stringifyBattleTrainerItemChoiceV4({kind: "traineritem", itemInstanceId: "item-1", targetKey: "pokeball"});
const split = splitBattleTrainerItemChoicesV4({...draft, isDone: true});
assert.equal(split.choice, "pass");
assert.equal(split.trainerItems[0]?.itemInstanceId, "item-1");
assert.equal(split.trainerItems[0]?.targetKey, "pokeball");

console.log("item effects smoke ok");

function item(itemID: string, name: string, options: Partial<PlayerItemInstanceV4> = {}): PlayerItemInstanceV4 {
  return {
    id: `item-${itemID}`,
    itemID,
    name,
    image: "",
    cost: 0,
    canSale: true,
    type: options.type || "medicine",
    canBattleUse: options.canBattleUse ?? true,
    canUse: true,
    canUseToPokemon: true,
    canTake: false,
    effectRound: null,
    getRound: 0,
    maxUseCount: null,
    useCount: 0,
    ...options,
  };
}

function bagWith(...items: PlayerItemInstanceV4[]): BagStateV4 {
  return {maxSize: 10, items};
}

function makePokemon(): LocalPokemonV4 {
  return {
    localPokemonId: "pokemon-1",
    speciesId: "pikachu",
    name: "Pikachu",
    nameZh: "皮卡丘",
    level: 50,
    gender: "N",
    shiny: false,
    itemId: "",
    abilityId: "static",
    abilityName: "Static",
    abilityNameZh: "静电",
    nature: "Serious",
    moves: [
      move("thunderbolt", 8),
      move("quickattack", 32),
      move("irontail", 15),
      move("protect", 10),
    ],
    evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0},
    ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
    entryHp: 100,
    entryStatus: "",
    maxHp: 100,
  };
}

function move(moveId: string, pp: number): LocalPokemonV4["moves"][number] {
  return {moveId, name: moveId, nameZh: moveId, type: "Normal", category: "Physical", power: 40, accuracy: 100, pp, maxPp: pp, remainingPp: pp};
}

function moveSummary(moveId: string, options: Partial<DexMoveSummary> = {}): DexMoveSummary {
  return {
    id: moveId,
    name: options.name || moveId,
    nameZh: options.nameZh || moveId,
    type: options.type || "Normal",
    category: options.category || "Physical",
    power: options.power ?? 40,
    accuracy: options.accuracy ?? 100,
    pp: options.pp ?? 10,
    priority: options.priority ?? 0,
    learnSources: options.learnSources || ["machine"],
  };
}

function fakePokemonDetail(): DexPokemonDetail {
  return {
    id: "pikachu",
    name: "Pikachu",
    nameZh: "皮卡丘",
    num: 25,
    types: ["Electric"],
    baseStats: {hp: 35, atk: 55, def: 40, spa: 50, spd: 50, spe: 90},
    abilities: [
      {id: "static", name: "Static", nameZh: "静电"},
      {id: "lightningrod", name: "Lightning Rod", nameZh: "避雷针"},
      {id: "surgesurfer", name: "Surge Surfer", nameZh: "冲浪之尾", hidden: true},
    ],
    eggGroups: [],
    evolutionChain: [],
    formes: [],
    sprites: {resourcePrefix: ""},
    learnset: [],
    learnsetGroups: {levelup: [], machine: [], tutor: [], egg: [], event: [], transfer: [], other: []},
  };
}
