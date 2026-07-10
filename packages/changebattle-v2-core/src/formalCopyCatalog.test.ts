import assert from "node:assert/strict";
import {
  formalBattleSystemLabelV4,
  formalGameModeLabelV4,
  formalMedicalInsuranceTierLabelV4,
  formalNpcTeamPreferenceLabelV4,
  formalRoundStageLabelV4,
  formalSettlementOutcomeLabelV4,
  formalSettlementReasonLabelV4,
  formalStarterRoleLabelV4,
  formalShopGenerationRuleV4,
  formalShopItemPoolForCategoryV4,
  FORMAL_PENDING_SETTLEMENT_SHOP_SLOTS_PER_CATEGORY,
  FORMAL_SHOP_SLOTS_PER_CATEGORY,
  CHAMPION_FUND_NODE_ID,
  ELITE_FUND_NODE_ID,
  MAX_BP_V4,
  FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL,
  FORMAL_SHOP_PARENTING_ITEM_POOL,
  FORMAL_SHOP_EVOLUTION_ITEM_POOL,
  FORMAL_SHOP_ITEM_POOL,
  FORMAL_SHOP_SPECIAL_MEDICINE_ITEM_POOL,
  TRAVEL_FUND_NODE_ID,
  clearStarChartUnlocksForProfileV4,
  formalTrainingGroundLessonTableV4,
  soulmateEvolutionFriendshipRequirementV4,
  soulmateEvolutionFriendshipRequirementForChainV4,
  createPlayerVaultEggPokemonRecordV4,
  evaluateFormalSoulmateBattleEvolutionV4,
  calculateFormalSoulmateFriendshipSettlementV4,
  applyPlayerVaultEvolutionV4,
  previewPlayerVaultEvolutionCandidatesV4,
  type PlayerPokemonRecordV4,
  type PlayerVaultV4,
} from "./index.js";

assert.equal(formalRoundStageLabelV4(0), "小组赛揭幕战");
assert.equal(formalRoundStageLabelV4(6), "决赛");
assert.equal(formalRoundStageLabelV4(8), "第 9 场");
assert.equal(formalGameModeLabelV4("doubles"), "双打-AI");
assert.equal(formalBattleSystemLabelV4("terastal"), "太晶化");
assert.equal(formalMedicalInsuranceTierLabelV4("premium"), "冠军医疗保险");
assert.equal(formalSettlementReasonLabelV4("surrender"), "玩家投降");
assert.equal(formalSettlementOutcomeLabelV4("abandoned"), "中途放弃");
assert.equal(formalNpcTeamPreferenceLabelV4("rain"), "雨天队");
assert.equal(formalStarterRoleLabelV4("speed-control"), "速度控制");
assert.equal(soulmateEvolutionFriendshipRequirementV4(0), 100);
assert.equal(soulmateEvolutionFriendshipRequirementV4(1), 200);
assert.equal(soulmateEvolutionFriendshipRequirementV4(2), null);
assert.equal(soulmateEvolutionFriendshipRequirementForChainV4(0, 1), 150);
assert.equal(soulmateEvolutionFriendshipRequirementForChainV4(0, 2), 100);
assert.equal(soulmateEvolutionFriendshipRequirementForChainV4(1, 2), 200);

const clearedStarProfile = clearStarChartUnlocksForProfileV4({
  battlePoints: 10,
  starChart: {nodes: {root_trainer_star: 1, [TRAVEL_FUND_NODE_ID]: 1, [ELITE_FUND_NODE_ID]: 1, [CHAMPION_FUND_NODE_ID]: 1}},
  updatedAt: "2026-01-01T00:00:00.000Z",
}, new Date("2026-01-02T00:00:00.000Z"));
assert.equal(clearedStarProfile.battlePoints, 19);
assert.equal(clearedStarProfile.starChart.nodes.root_trainer_star, 1);
assert.equal(clearedStarProfile.starChart.nodes[TRAVEL_FUND_NODE_ID], 0);
assert.equal(clearedStarProfile.starChart.nodes[ELITE_FUND_NODE_ID], 0);
assert.equal(clearedStarProfile.starChart.nodes[CHAMPION_FUND_NODE_ID], 0);
assert.equal(clearedStarProfile.updatedAt, "2026-01-02T00:00:00.000Z");
const cappedClearProfile = clearStarChartUnlocksForProfileV4({battlePoints: MAX_BP_V4, starChart: {nodes: {root_trainer_star: 1, [TRAVEL_FUND_NODE_ID]: 1}}});
assert.equal(cappedClearProfile.battlePoints, MAX_BP_V4);

const evolutionEdges = [
  {fromSpeciesId: "charmander", toSpeciesId: "charmeleon", evoType: "levelExtra"},
  {fromSpeciesId: "charmeleon", toSpeciesId: "charizard", evoType: "levelExtra"},
  {fromSpeciesId: "eevee", toSpeciesId: "flareon", evoType: "useItem", evoItemId: "firestone"},
  {fromSpeciesId: "kadabra", toSpeciesId: "alakazam", evoType: "trade"},
];
const vaultPokemon: PlayerPokemonRecordV4 = {
  playerPokemonId: "vault-charmander",
  speciesId: "charmander",
  nickname: "小火",
  level: 50,
  originKind: "soulmate",
  rootSpeciesId: "charmander",
  gender: "M",
  nature: "Adamant",
  abilityId: "blaze",
  heldItemId: "leftovers",
  evs: {hp: 1, atk: 2, def: 3, spa: 4, spd: 5, spe: 6},
  ivs: {hp: 31, atk: 30, def: 29, spa: 28, spd: 27, spe: 26},
  moves: [{moveId: "scratch", remainingPp: 35, maxPp: 35}],
  friendship: 99,
  shiny: true,
  metAt: "2026-01-01T00:00:00.000Z",
  honors: ["灵魂伴侣"],
  battleMarked: true,
};
const evolutionVault: PlayerVaultV4 = {
  version: 1,
  items: [{itemId: "universal-evolution-stone", quantity: 2, boxKind: "storage", storagePageIndex: 0, slotIndex: 0}],
  pokemon: [vaultPokemon],
  itemStoragePageCount: 3,
  pokemonStoragePageCount: 2,
};
const tooEarlyEvolution = previewPlayerVaultEvolutionCandidatesV4({vault: evolutionVault, itemKey: "storage:0:0:universal-evolution-stone", pokemonId: "vault-charmander", evolutionEdges, evolutionStageCount: 2});
assert.equal(tooEarlyEvolution.ok, false);
assert.match(tooEarlyEvolution.ok ? "" : tooEarlyEvolution.reason, /亲密度不足/);
const evolvedCharmander = applyPlayerVaultEvolutionV4({
  vault: {...evolutionVault, pokemon: [{...vaultPokemon, friendship: 100}]},
  itemKey: "storage:0:0:universal-evolution-stone",
  pokemonId: "vault-charmander",
  toSpeciesId: "charmeleon",
  evolutionEdges,
  evolutionStageCount: 2,
});
assert.equal(evolvedCharmander.ok, true);
if (evolvedCharmander.ok) {
  assert.equal(evolvedCharmander.pokemon.speciesId, "charmeleon");
  assert.equal(evolvedCharmander.pokemon.nickname, "小火");
  assert.equal(evolvedCharmander.pokemon.nature, "Adamant");
  assert.deepEqual(evolvedCharmander.pokemon.ivs, vaultPokemon.ivs);
  assert.deepEqual(evolvedCharmander.pokemon.evs, vaultPokemon.evs);
  assert.deepEqual(evolvedCharmander.pokemon.moves, vaultPokemon.moves);
  assert.equal(evolvedCharmander.pokemon.heldItemId, "leftovers");
  assert.equal(evolvedCharmander.pokemon.battleMarked, true);
  assert.equal(evolvedCharmander.vault.items.find(item => item.itemId === "universal-evolution-stone")?.quantity, 1);
}
const tooEarlyCharmeleon = previewPlayerVaultEvolutionCandidatesV4({
  vault: {...evolutionVault, pokemon: [{...vaultPokemon, speciesId: "charmeleon", friendship: 199}]},
  itemKey: "storage:0:0:universal-evolution-stone",
  pokemonId: "vault-charmander",
  evolutionEdges,
  evolutionStageCount: 2,
});
assert.equal(tooEarlyCharmeleon.ok, false);
assert.match(tooEarlyCharmeleon.ok ? "" : tooEarlyCharmeleon.reason, /200/);
const evolvedCharmeleon = applyPlayerVaultEvolutionV4({
  vault: {...evolutionVault, pokemon: [{...vaultPokemon, speciesId: "charmeleon", friendship: 200}]},
  itemKey: "storage:0:0:universal-evolution-stone",
  pokemonId: "vault-charmander",
  toSpeciesId: "charizard",
  evolutionEdges,
  evolutionStageCount: 2,
});
assert.equal(evolvedCharmeleon.ok, true);
assert.equal(evolvedCharmeleon.ok ? evolvedCharmeleon.pokemon.speciesId : "", "charizard");
const tooEarlySingleStage = previewPlayerVaultEvolutionCandidatesV4({
  vault: {...evolutionVault, items: [{itemId: "firestone", quantity: 1, boxKind: "storage", storagePageIndex: 0, slotIndex: 1}], pokemon: [{...vaultPokemon, playerPokemonId: "vault-eevee", speciesId: "eevee", friendship: 149}]},
  itemKey: "storage:0:1:firestone",
  pokemonId: "vault-eevee",
  evolutionEdges,
  evolutionStageCount: 1,
});
assert.equal(tooEarlySingleStage.ok, false);
assert.match(tooEarlySingleStage.ok ? "" : tooEarlySingleStage.reason, /150/);
const fireStonePreview = previewPlayerVaultEvolutionCandidatesV4({
  vault: {...evolutionVault, items: [{itemId: "firestone", quantity: 1, boxKind: "storage", storagePageIndex: 0, slotIndex: 1}], pokemon: [{...vaultPokemon, playerPokemonId: "vault-eevee", speciesId: "eevee", friendship: 150}]},
  itemKey: "storage:0:1:firestone",
  pokemonId: "vault-eevee",
  evolutionEdges,
  evolutionStageCount: 1,
});
assert.equal(fireStonePreview.ok, true);
assert.deepEqual(fireStonePreview.ok ? fireStonePreview.candidates.map(candidate => candidate.toSpeciesId) : [], ["flareon"]);
const wrongStonePreview = previewPlayerVaultEvolutionCandidatesV4({
  vault: {...evolutionVault, items: [{itemId: "universal-evolution-stone", quantity: 1, boxKind: "storage", storagePageIndex: 0, slotIndex: 1}], pokemon: [{...vaultPokemon, playerPokemonId: "vault-eevee", speciesId: "eevee", friendship: 150}]},
  itemKey: "storage:0:1:universal-evolution-stone",
  pokemonId: "vault-eevee",
  evolutionEdges,
  evolutionStageCount: 1,
});
assert.equal(wrongStonePreview.ok, false);
assert.match(wrongStonePreview.ok ? "" : wrongStonePreview.reason, /不能让/);
const linkingCordResult = applyPlayerVaultEvolutionV4({
  vault: {...evolutionVault, items: [{itemId: "linking-cord", quantity: 1, boxKind: "storage", storagePageIndex: 0, slotIndex: 2}], pokemon: [{...vaultPokemon, playerPokemonId: "vault-kadabra", speciesId: "kadabra", friendship: 150}]},
  itemKey: "storage:0:2:linking-cord",
  pokemonId: "vault-kadabra",
  toSpeciesId: "alakazam",
  evolutionEdges,
  evolutionStageCount: 1,
});
assert.equal(linkingCordResult.ok, true);
assert.equal(linkingCordResult.ok ? linkingCordResult.vault.items.length : -1, 0);

const battleEvolution = evaluateFormalSoulmateBattleEvolutionV4({
  localPokemon: localPokemonForBattleEvolutionTest({
    localPokemonId: "local-charmander",
    speciesId: "charmander",
    formalSourceKind: "soulmate-vault",
    sourcePlayerPokemonId: "vault-charmander",
  }),
  vault: {...evolutionVault, pokemon: [{...vaultPokemon, friendship: 100}]},
  evolutionEdges,
  evolutionStageCount: 2,
  seed: "battle-evolution-force",
  chance: 1,
});
assert.equal(battleEvolution.ok, true);
assert.equal(battleEvolution.ok ? battleEvolution.candidate.toSpeciesId : "", "charmeleon");
assert.equal(battleEvolution.ok ? battleEvolution.candidate.friendshipRequirement : 0, 100);
const battleEvolutionMultiTarget = evaluateFormalSoulmateBattleEvolutionV4({
  localPokemon: localPokemonForBattleEvolutionTest({
    localPokemonId: "local-eevee",
    speciesId: "eevee",
    formalSourceKind: "soulmate-vault",
    sourcePlayerPokemonId: "vault-eevee",
  }),
  vault: {...evolutionVault, pokemon: [{...vaultPokemon, playerPokemonId: "vault-eevee", speciesId: "eevee", friendship: 150}]},
  evolutionEdges: [...evolutionEdges, {fromSpeciesId: "eevee", toSpeciesId: "vaporeon", evoType: "useItem", evoItem: "Water Stone"}],
  evolutionStageCount: 1,
  seed: "battle-evolution-force",
  chance: 1,
});
assert.equal(battleEvolutionMultiTarget.ok, false);
assert.equal(battleEvolutionMultiTarget.ok ? "" : battleEvolutionMultiTarget.reason, "multi-target");

const soulmateFriendshipSettlement = calculateFormalSoulmateFriendshipSettlementV4({
  nodeId: "node-1",
  won: true,
  createdAt: "2026-01-02T00:00:00.000Z",
  team: [
    {...localPokemonForBattleEvolutionTest({
      localPokemonId: "formal-p1-1-charmander",
      formalSourceKind: "soulmate-vault",
      sourcePlayerPokemonId: "vault-charmander",
      speciesId: "charmander",
    }), friendship: 120},
  ],
  battleLog: [
    {
      id: "soulmate-damage",
      key: "soulmate-damage",
      at: "2026-01-02T00:00:00.000Z",
      sessionId: "session-1",
      nodeId: "node-1",
      turn: 1,
      rawLogIndex: 1,
      eventType: "damage",
      sourcePlayerId: "p1",
      sourcePokemonKey: "p1a: 小火",
      sourcePokemonName: "小火",
      targetPlayerId: "p2",
      targetPokemonKey: "p2a: target",
      targetPokemonName: "target",
      damage: 20,
      directness: "direct",
      rawLine: "",
    },
    {
      id: "soulmate-faint",
      key: "soulmate-faint",
      at: "2026-01-02T00:00:00.000Z",
      sessionId: "session-1",
      nodeId: "node-1",
      turn: 2,
      rawLogIndex: 2,
      eventType: "faint",
      targetPlayerId: "p1",
      targetPokemonKey: "p1a: 小火",
      targetPokemonName: "小火",
      rawLine: "",
    },
  ],
  resolvePokemonKey: (_entry, role) => role === "source" || role === "target" ? "formal-p1-1-charmander" : undefined,
});
assert.equal(soulmateFriendshipSettlement.nodeId, "node-1");
assert.equal(soulmateFriendshipSettlement.deltas[0]?.before, 120);
assert.equal(soulmateFriendshipSettlement.deltas[0]?.after, 132);
assert.equal(soulmateFriendshipSettlement.deltas[0]?.delta, 12);
assert.equal(soulmateFriendshipSettlement.deltas[0]?.participated, true);
assert.equal(soulmateFriendshipSettlement.deltas[0]?.fainted, true);

assert.deepEqual(FORMAL_PENDING_SETTLEMENT_SHOP_SLOTS_PER_CATEGORY, {
  recovery: 0,
  berry: 0,
  battle: 1,
  training: 2,
  parenting: 0,
  evolution: 2,
  tm: 2,
});
assert.deepEqual(FORMAL_SHOP_SLOTS_PER_CATEGORY, {
  recovery: 3,
  berry: 3,
  battle: 3,
  training: 3,
  parenting: 0,
  evolution: 0,
  tm: 3,
});
assert.ok(FORMAL_SHOP_PARENTING_ITEM_POOL.includes("heartscale"));
assert.ok(FORMAL_SHOP_PARENTING_ITEM_POOL.includes("forbiddenmanual"));
assert.ok(FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL.includes("heartscale"));
assert.ok(FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL.includes("forbiddenmanual"));
assert.ok(FORMAL_SHOP_EVOLUTION_ITEM_POOL.includes("universal-evolution-stone"));
assert.ok(FORMAL_SHOP_EVOLUTION_ITEM_POOL.includes("linking-cord"));
assert.ok(!FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL.some(itemID => ["rarecandy", "ppup", "ppmax"].includes(itemID)));
assert.ok(FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL.includes("abilitycapsule"));
assert.ok(FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL.includes("abilitypatch"));
assert.deepEqual(FORMAL_SHOP_ITEM_POOL.training, FORMAL_SHOP_SPECIAL_MEDICINE_ITEM_POOL);
assert.equal(FORMAL_SHOP_ITEM_POOL.training.some(itemID => FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL.includes(itemID)), false);
assert.deepEqual(FORMAL_SHOP_ITEM_POOL.parenting, []);
assert.deepEqual(FORMAL_SHOP_ITEM_POOL.evolution, []);
assert.ok(FORMAL_SHOP_ITEM_POOL.recovery.length > 0);
assert.equal(formalShopGenerationRuleV4(false).id, "standard");
assert.equal(formalShopGenerationRuleV4(true).id, "pendingSettlement");
assert.deepEqual(formalShopItemPoolForCategoryV4("recovery", true), []);
assert.deepEqual(formalShopItemPoolForCategoryV4("berry", true), []);
assert.deepEqual(formalShopItemPoolForCategoryV4("parenting", true), []);
assert.deepEqual(formalShopItemPoolForCategoryV4("evolution", false), []);
assert.equal(formalShopItemPoolForCategoryV4("training", true), FORMAL_SHOP_PENDING_TRAINING_ITEM_POOL);
assert.equal(formalShopItemPoolForCategoryV4("training", false), FORMAL_SHOP_ITEM_POOL.training);

const eggPokemon = createPlayerVaultEggPokemonRecordV4({
  dex: {
    getPokemonDetail: id => ({id, abilities: [{id: "blaze"}]}),
    getPokemonEvolutionRoot: id => id === "charizard" ? {id: "charmander"} : {id},
    getPokemonSelfLearnSkills: id => id === "charmander" ? [{id: "scratch", pp: 35}, {id: "growl", pp: 40}] : [],
    getMoveDetail: id => ({id, pp: id === "scratch" ? 35 : 40}),
  },
  speciesId: "charizard",
  originKind: "debug-custom",
  seed: "debug-charizard",
});
assert.equal(eggPokemon?.speciesId, "charmander");
assert.equal(eggPokemon?.originKind, "debug-custom");
assert.equal(eggPokemon?.level, 50);
assert.equal(eggPokemon?.nature, "Hardy");
assert.equal(eggPokemon?.gender, "N");
assert.equal(eggPokemon?.abilityId, "blaze");
assert.deepEqual(eggPokemon?.evs, {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0});
assert.ok(Object.values(eggPokemon?.ivs || {}).every(value => value >= 0 && value <= 31));
assert.notDeepEqual(eggPokemon?.ivs, {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31});
assert.deepEqual(eggPokemon?.moves.map(move => move.moveId), ["scratch", "growl"]);
const eggPokemonAgain = createPlayerVaultEggPokemonRecordV4({
  dex: {
    getPokemonDetail: id => ({id, abilities: [{id: "blaze"}]}),
    getPokemonEvolutionRoot: id => id === "charizard" ? {id: "charmander"} : {id},
    getPokemonSelfLearnSkills: id => id === "charmander" ? [{id: "scratch", pp: 35}, {id: "growl", pp: 40}] : [],
    getMoveDetail: id => ({id, pp: id === "scratch" ? 35 : 40}),
  },
  speciesId: "charizard",
  originKind: "debug-custom",
  seed: "debug-charizard",
});
assert.deepEqual(eggPokemonAgain?.ivs, eggPokemon?.ivs);

const fallbackEggPokemon = createPlayerVaultEggPokemonRecordV4({
  dex: {
    getPokemonDetail: id => ({id, abilities: [{id: "torrent"}]}),
    getPokemonSelfLearnSkills: () => [],
    getMoveDetail: id => ({id, pp: 10}),
  },
  speciesId: "squirtle",
  originKind: "soulmate",
  seed: "fallback-squirtle",
  inherited: {
    gender: "F",
    nature: "Modest",
    fallbackMoveIds: ["watergun"],
  },
});
assert.equal(fallbackEggPokemon?.originKind, "soulmate");
assert.equal(fallbackEggPokemon?.gender, "F");
assert.equal(fallbackEggPokemon?.nature, "Modest");
assert.deepEqual(fallbackEggPokemon?.moves.map(move => move.moveId), ["watergun"]);

const lessons = formalTrainingGroundLessonTableV4();
assert.equal(lessons.length, 4);
for (const lesson of lessons) {
  assert.ok(lesson.title);
  assert.ok(lesson.teacherLabel);
  assert.ok(lesson.summary);
  assert.ok(lesson.dialogue);
}

assert.equal(lessons.find(lesson => lesson.kind === "egg")?.title, "遗传学");
assert.equal(lessons.find(lesson => lesson.kind === "self-study")?.summary, "由宝可梦自主学习，根据课堂状态调整个体值和努力值。");

function localPokemonForBattleEvolutionTest(input: {
  localPokemonId: string;
  speciesId: string;
  formalSourceKind: "soulmate-vault";
  sourcePlayerPokemonId: string;
}) {
  return {
    localPokemonId: input.localPokemonId,
    formalSourceKind: input.formalSourceKind,
    sourcePlayerPokemonId: input.sourcePlayerPokemonId,
    speciesId: input.speciesId,
    name: input.speciesId,
    nameZh: input.speciesId,
    nickname: "小火",
    level: 50,
    gender: "M" as const,
    shiny: false,
    itemId: "",
    abilityId: "blaze",
    abilityName: "Blaze",
    abilityNameZh: "猛火",
    nature: "Adamant",
    moves: vaultPokemon.moves.map(move => ({
      moveId: move.moveId,
      name: move.moveId,
      nameZh: move.moveId,
      type: "normal",
      category: "physical",
      power: 40,
      accuracy: 100,
      pp: move.maxPp ?? 35,
      maxPp: move.maxPp ?? 35,
      remainingPp: move.remainingPp ?? move.maxPp ?? 35,
    })),
    evs: vaultPokemon.evs,
    ivs: vaultPokemon.ivs,
    entryHp: 100,
    entryStatus: "" as const,
    maxHp: 100,
  };
}
