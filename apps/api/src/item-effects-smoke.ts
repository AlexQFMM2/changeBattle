import {strict as assert} from "node:assert";
import {createBattleCommandDraftV4, normalizeBattleRequestV4, splitBattleTrainerItemChoicesV4, stringifyBattleTrainerItemChoiceV4} from "./battle.js";
import {applyRecoveryItemToPokemonV4} from "./itemEffects.js";
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

function item(itemID: string, name: string): PlayerItemInstanceV4 {
  return {
    id: `item-${itemID}`,
    itemID,
    name,
    image: "",
    cost: 0,
    canSale: true,
    type: "medicine",
    canBattleUse: true,
    canUse: true,
    canUseToPokemon: true,
    canTake: false,
    effectRound: null,
    getRound: 0,
    maxUseCount: null,
    useCount: 0,
  };
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
