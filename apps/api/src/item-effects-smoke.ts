import {strict as assert} from "node:assert";
import type {DexMoveSummary, DexPokemonDetail} from "@changebattle-v2/showdown-dex-core";
import {createBattleCommandDraftV4, normalizeBattleRequestV4, splitBattleTrainerItemChoicesV4, stringifyBattleTrainerItemChoiceV4} from "./battle.js";
import {applyPlayerVaultFriendshipItemV4, applyPlayerVaultHeldItemV4, applyPlayerVaultMoveTeachingItemV4, applyPlayerVaultNumericItemV4, applyRecoveryItemToPokemonV4, applyTmItemToPokemonV4, applyTrainingItemToPokemonV4, getPlayerVaultMoveTeachingViewV4, previewPlayerVaultNumericItemUseV4, tmUseFailureReasonV4, unequipPlayerVaultHeldItemV4} from "./itemEffects.js";
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

const vaultDex = fakeVaultDex();
const vault = {
  version: 1 as const,
  items: [
    {itemId: "heartscale", quantity: 1, boxKind: "storage" as const, storagePageIndex: 0, slotIndex: 0},
    {itemId: "standardtextbook", quantity: 1, boxKind: "storage" as const, storagePageIndex: 0, slotIndex: 1},
    {itemId: "redthread", quantity: 1, boxKind: "storage" as const, storagePageIndex: 0, slotIndex: 2},
    {itemId: "lostmanual", quantity: 1, boxKind: "storage" as const, storagePageIndex: 0, slotIndex: 3},
    {itemId: "forbiddenmanual", quantity: 2, boxKind: "storage" as const, storagePageIndex: 0, slotIndex: 4},
    {itemId: "soothebell", quantity: 1, boxKind: "storage" as const, storagePageIndex: 0, slotIndex: 5},
    {itemId: "adamantmint", quantity: 1, boxKind: "storage" as const, storagePageIndex: 0, slotIndex: 6},
    {itemId: "tm:surf", quantity: 1, boxKind: "storage" as const, storagePageIndex: 0, slotIndex: 7},
    {itemId: "leftovers", quantity: 1, boxKind: "storage" as const, storagePageIndex: 0, slotIndex: 8},
    {itemId: "choicescarf", quantity: 1, boxKind: "storage" as const, storagePageIndex: 0, slotIndex: 9},
    {itemId: "tm:earthquake", quantity: 1, boxKind: "storage" as const, storagePageIndex: 0, slotIndex: 10},
  ],
  pokemon: [{
    playerPokemonId: "vault-pokemon-1",
    speciesId: "pikachu",
    level: 50,
    gender: "N" as const,
    nature: "Serious",
    abilityId: "static",
    evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0},
    ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
    moves: [{moveId: "thunderbolt"}, {moveId: "quickattack"}, {moveId: "irontail"}, {moveId: "protect"}],
    friendship: 70,
    shiny: false,
    metAt: "2026-01-01T00:00:00.000Z",
    honors: [],
  }],
  itemStoragePageCount: 2,
  pokemonStoragePageCount: 2,
};
const friendshipPreview = previewPlayerVaultNumericItemUseV4(vaultDex as any, {vault, itemKey: "storage:0:5:soothebell", pokemonId: "vault-pokemon-1"});
assert.equal(friendshipPreview.ok, true);
if (friendshipPreview.ok) assert.deepEqual(friendshipPreview.changes, [{label: "亲密度", before: "70", after: "120"}]);
const mintPreview = previewPlayerVaultNumericItemUseV4(vaultDex as any, {vault, itemKey: "storage:0:6:adamantmint", pokemonId: "vault-pokemon-1"});
assert.equal(mintPreview.ok, true);
if (mintPreview.ok) assert.deepEqual(mintPreview.changes, [{label: "性格", before: "认真", after: "固执"}]);
const mintApply = applyPlayerVaultNumericItemV4(vaultDex as any, {vault, itemKey: "storage:0:6:adamantmint", pokemonId: "vault-pokemon-1"});
assert.equal(mintApply.ok, true);
if (mintApply.ok) {
  assert.equal(mintApply.pokemon.nature, "Adamant");
  assert.equal(mintApply.vault.items.some(entry => entry.itemId === "adamantmint"), false);
}
const heartView = getPlayerVaultMoveTeachingViewV4(vaultDex as any, vault, "storage:0:0:heartscale", "vault-pokemon-1");
assert.equal(heartView.ok, true);
if (heartView.ok) assert.deepEqual(heartView.moves.map(move => move.id), ["electroball"]);
const textbookView = getPlayerVaultMoveTeachingViewV4(vaultDex as any, vault, "storage:0:1:standardtextbook", "vault-pokemon-1");
assert.equal(textbookView.ok, true);
if (textbookView.ok) assert.deepEqual(textbookView.moves.map(move => move.id), ["signalbeam"]);
const redThreadView = getPlayerVaultMoveTeachingViewV4(vaultDex as any, vault, "storage:0:2:redthread", "vault-pokemon-1");
assert.equal(redThreadView.ok, true);
if (redThreadView.ok) assert.deepEqual(redThreadView.moves.map(move => move.id), ["wish"]);
const lostManualView = getPlayerVaultMoveTeachingViewV4(vaultDex as any, vault, "storage:0:3:lostmanual", "vault-pokemon-1");
assert.equal(lostManualView.ok, true);
if (lostManualView.ok) assert.deepEqual(lostManualView.moves.map(move => move.id), ["celebrate", "refresh", "holdhands"]);
const tmVaultView = getPlayerVaultMoveTeachingViewV4(vaultDex as any, vault, "storage:0:7:tm:surf", "vault-pokemon-1");
assert.equal(tmVaultView.ok, true);
if (tmVaultView.ok) {
  assert.deepEqual(tmVaultView.moves.map(move => move.id), ["surf"]);
  assert.equal(tmVaultView.unavailableReason, undefined);
}
const illegalTmVaultView = getPlayerVaultMoveTeachingViewV4(vaultDex as any, vault, "storage:0:10:tm:earthquake", "vault-pokemon-1");
assert.equal(illegalTmVaultView.ok, true);
if (illegalTmVaultView.ok) {
  assert.deepEqual(illegalTmVaultView.moves, []);
  assert.match(illegalTmVaultView.unavailableReason || "", /无法通过技能机器/);
}
const illegalTmVaultResult = applyPlayerVaultMoveTeachingItemV4(vaultDex as any, {vault, itemKey: "storage:0:10:tm:earthquake", pokemonId: "vault-pokemon-1", moveId: "earthquake", moveSlot: 0});
assert.equal(illegalTmVaultResult.ok, false);
assert.match(illegalTmVaultResult.ok ? "" : illegalTmVaultResult.reason, /无法通过技能机器/);
const tmVaultResult = applyPlayerVaultMoveTeachingItemV4(vaultDex as any, {vault, itemKey: "storage:0:7:tm:surf", pokemonId: "vault-pokemon-1", moveId: "surf", moveSlot: 3});
assert.equal(tmVaultResult.ok, true);
if (tmVaultResult.ok) {
  assert.equal(tmVaultResult.pokemon.moves[3]!.moveId, "surf");
  assert.equal(tmVaultResult.vault.items.some(entry => entry.itemId === "tm:surf"), false);
}
const forbiddenResult = applyPlayerVaultMoveTeachingItemV4(vaultDex as any, {vault, itemKey: "storage:0:4:forbiddenmanual", pokemonId: "vault-pokemon-1", moveId: "flamethrower", moveSlot: 1});
assert.equal(forbiddenResult.ok, true);
if (forbiddenResult.ok) {
  assert.equal(forbiddenResult.pokemon.moves[1]!.moveId, "flamethrower");
  assert.equal(forbiddenResult.pokemon.growthFlags?.forbiddenManualUsedAt?.startsWith("20"), true);
  assert.equal(forbiddenResult.vault.items.find(entry => entry.itemId === "forbiddenmanual")?.quantity, 1);
  const secondForbidden = applyPlayerVaultMoveTeachingItemV4(vaultDex as any, {vault: forbiddenResult.vault, itemKey: "storage:0:4:forbiddenmanual", pokemonId: "vault-pokemon-1", moveId: "surf", moveSlot: 2});
  assert.equal(secondForbidden.ok, false);
  assert.match(secondForbidden.ok ? "" : secondForbidden.reason, /已经使用过/);
}
const friendshipResult = applyPlayerVaultFriendshipItemV4(vaultDex as any, {vault, itemKey: "storage:0:5:soothebell", pokemonId: "vault-pokemon-1"});
assert.equal(friendshipResult.ok, true);
if (friendshipResult.ok) {
  assert.equal(friendshipResult.pokemon.friendship, 120);
  assert.equal(friendshipResult.friendshipDelta, 50);
  assert.equal(friendshipResult.vault.items.some(entry => entry.itemId === "soothebell"), false);
}
const heldResult = applyPlayerVaultHeldItemV4(vaultDex as any, {vault, itemKey: "storage:0:8:leftovers", pokemonId: "vault-pokemon-1"});
assert.equal(heldResult.ok, true);
if (heldResult.ok) {
  assert.equal(heldResult.pokemon.heldItemId, "leftovers");
  assert.equal(heldResult.vault.items.some(entry => entry.itemId === "leftovers"), false);
  const swapResult = applyPlayerVaultHeldItemV4(vaultDex as any, {vault: heldResult.vault, itemKey: "storage:0:9:choicescarf", pokemonId: "vault-pokemon-1"});
  assert.equal(swapResult.ok, true);
  if (swapResult.ok) {
    assert.equal(swapResult.pokemon.heldItemId, "choicescarf");
    assert.equal(swapResult.replacedItemId, "leftovers");
    assert.equal(swapResult.vault.items.some(entry => entry.itemId === "choicescarf"), false);
    assert.equal(swapResult.vault.items.find(entry => entry.itemId === "leftovers")?.quantity, 1);
    const unequipResult = unequipPlayerVaultHeldItemV4(vaultDex as any, {vault: swapResult.vault, pokemonId: "vault-pokemon-1"});
    assert.equal(unequipResult.ok, true);
    if (unequipResult.ok) {
      assert.equal(unequipResult.pokemon.heldItemId, undefined);
      assert.equal(unequipResult.unequippedItemId, "choicescarf");
      assert.equal(unequipResult.vault.items.find(entry => entry.itemId === "choicescarf")?.quantity, 1);
    }
  }
}
const unequipEmptyResult = unequipPlayerVaultHeldItemV4(vaultDex as any, {vault, pokemonId: "vault-pokemon-1"});
assert.equal(unequipEmptyResult.ok, false);
assert.match(unequipEmptyResult.ok ? "" : unequipEmptyResult.reason, /没有携带道具/);
const maxFriendshipResult = applyPlayerVaultFriendshipItemV4(vaultDex as any, {
  vault: {...vault, items: [{itemId: "soothebell", quantity: 1, boxKind: "storage" as const, storagePageIndex: 0, slotIndex: 5}], pokemon: [{...vault.pokemon[0]!, friendship: 255}]},
  itemKey: "storage:0:5:soothebell",
  pokemonId: "vault-pokemon-1",
});
assert.equal(maxFriendshipResult.ok, false);
assert.match(maxFriendshipResult.ok ? "" : maxFriendshipResult.reason, /上限/);

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
    evolutionEdges: [],
    formes: [],
    sprites: {resourcePrefix: ""},
    learnset: [],
    learnsetGroups: {levelup: [], machine: [], tutor: [], egg: [], event: [], transfer: [], other: []},
  };
}

function fakeVaultDex() {
  const moveById = new Map([
    ["electroball", moveSummary("electroball", {nameZh: "电球", learnSources: ["levelup"]})],
    ["signalbeam", moveSummary("signalbeam", {nameZh: "信号光束", learnSources: ["tutor"]})],
    ["wish", moveSummary("wish", {nameZh: "祈愿", learnSources: ["egg"]})],
    ["celebrate", moveSummary("celebrate", {nameZh: "庆祝", learnSources: ["event"]})],
    ["refresh", moveSummary("refresh", {nameZh: "焕然一新", learnSources: ["transfer"]})],
    ["holdhands", moveSummary("holdhands", {nameZh: "牵手", learnSources: ["other"]})],
    ["flamethrower", moveSummary("flamethrower", {nameZh: "喷射火焰"})],
    ["surf", moveSummary("surf", {nameZh: "冲浪"})],
    ["earthquake", moveSummary("earthquake", {nameZh: "地震"})],
  ]);
  const itemEffects = new Map([
    ["heartscale", {kind: "learn-source", sources: ["levelup"]}],
    ["standardtextbook", {kind: "learn-source", sources: ["tutor"]}],
    ["redthread", {kind: "learn-source", sources: ["egg"]}],
    ["lostmanual", {kind: "learn-source", sources: ["event", "transfer", "other"]}],
    ["forbiddenmanual", {kind: "any", oncePerPokemon: true}],
  ]);
  const friendshipEffects = new Map([
    ["soothebell", {amount: 50, max: 255}],
  ]);
  const trainingEffects = new Map([
    ["adamantmint", {kind: "nature", nature: "Adamant"}],
  ]);
  return {
    toDexId: (value: string) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, ""),
    getItemDetail: (id: string) => ({
      id,
      name: id,
      nameZh: id,
      kind: id.startsWith("tm:") ? "tm" : id === "leftovers" || id === "choicescarf" ? "battle" : trainingEffects.has(id) ? "training" : "parenting",
      kindLabel: id.startsWith("tm:") ? "技能机器" : id === "leftovers" || id === "choicescarf" ? "战斗道具" : trainingEffects.has(id) ? "训练道具" : "养育道具",
      description: "",
      moveId: id === "tm:surf" ? "surf" : id === "tm:earthquake" ? "earthquake" : undefined,
      moveTeachingEffect: itemEffects.get(id),
      friendshipEffect: friendshipEffects.get(id),
      trainingEffect: trainingEffects.get(id),
    }),
    getPokemonDetail: (id: string) => fakePokemonDetail(),
    translateDexLabel: (table: "stats" | "natures", value: string) => {
      const labels: Record<string, string> = {Serious: "认真", Adamant: "固执", hp: "HP", atk: "攻击", def: "防御", spa: "特攻", spd: "特防", spe: "速度"};
      return labels[value] || value;
    },
    getPokemonSkillsBySource: (_speciesId: string, source: string) => Array.from(moveById.values()).filter(move => move.learnSources?.includes(source as any)),
    getPokemonMachineSkills: (_speciesId: string) => [moveById.get("surf")!],
    searchDex: ({query = "", limit = 40}: {query?: string; limit?: number}) => ({
      rows: Array.from(moveById.values())
        .filter(move => !query || [move.id, move.nameZh].some(value => String(value).includes(query)))
        .slice(0, limit)
        .map(move => ({id: move.id})),
    }),
    getMoveDetail: (id: string) => moveById.get(id),
    calculatePokemonStats: () => ({stats: {hp: 100, atk: 100, def: 100, spa: 100, spd: 100, spe: 100}}),
  };
}
