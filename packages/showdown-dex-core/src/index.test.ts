import assert from "node:assert/strict";
import fs from "node:fs";
import {BossTrainerPresetMatrixSummaries, BossTrainerPresetTeamCount, createShowdownDexService, type BossTrainerPresetTeamData} from "./index.js";

const dex = createShowdownDexService();

const venusaur = dex.getPokemonDetail("venusaur");
assert.equal(venusaur.id, "venusaur");
assert.equal(venusaur.nameZh, "妙蛙花");
assert.deepEqual(venusaur.types, ["Grass", "Poison"]);
assert.equal(venusaur.baseStats.hp, 80);
assert.ok(venusaur.evolutionChain.some(entry => entry.id === "bulbasaur"));
assert.ok(venusaur.evolutionChain.some(entry => entry.id === "venusaur"));
assert.ok(venusaur.learnset.length > 20);
assert.ok(venusaur.learnsetGroups.levelup.length > 0);
assert.deepEqual(dex.getPokemonSelfLearnSkills("venusaur"), venusaur.learnsetGroups.levelup);
assert.deepEqual(dex.getPokemonTutorSkills("venusaur"), venusaur.learnsetGroups.tutor);
assert.deepEqual(dex.getPokemonEggSkills("venusaur"), venusaur.learnsetGroups.egg);
assert.deepEqual(dex.getPokemonMachineSkills("venusaur"), venusaur.learnsetGroups.machine);
assert.ok(dex.getPokemonSkillsBySource("venusaur", "levelup").every(move => move.learnSources?.includes("levelup")));
assert.ok(venusaur.sprites.frontUrl?.includes("venusaur"));
assert.ok(venusaur.sprites.backUrl?.includes("venusaur"));
assert.ok(venusaur.sprites.frontShinyUrl?.includes("venusaur"));
assert.ok(venusaur.sprites.backShinyUrl?.includes("venusaur"));
assert.ok(venusaur.cryUrl?.includes("venusaur"));
const lucarioMegaZ = dex.resolvePokemonSprites({speciesId: "lucariomegaz"});
assert.ok(lucarioMegaZ.frontUrl?.includes("lucario-megaz.gif"));
assert.ok(lucarioMegaZ.backUrl?.includes("lucario-megaz.gif"));
const taurosPaldeaCombat = dex.resolvePokemonSprites({speciesId: "taurospaldeacombat"});
assert.ok(taurosPaldeaCombat.frontUrl?.includes("tauros-paldeacombat.gif"));
assert.ok(taurosPaldeaCombat.backUrl?.includes("tauros-paldeacombat.gif"));
const taurosPaldeaBlaze = dex.resolvePokemonSprites({speciesId: "taurospaldeablaze"});
assert.ok(taurosPaldeaBlaze.frontUrl?.includes("tauros-paldeablaze.gif"));
assert.ok(taurosPaldeaBlaze.backUrl?.includes("tauros-paldeablaze.gif"));
const taurosPaldeaAqua = dex.resolvePokemonSprites({speciesId: "taurospaldeaaqua"});
assert.ok(taurosPaldeaAqua.frontUrl?.includes("tauros-paldeaaqua.gif"));
assert.ok(taurosPaldeaAqua.backUrl?.includes("tauros-paldeaaqua.gif"));
const arcanineHisui = dex.resolvePokemonSprites({speciesId: "arcaninehisui"});
assert.ok(arcanineHisui.frontUrl?.includes("arcanine-hisui.gif"));
assert.ok(arcanineHisui.backUrl?.includes("arcanine-hisui.gif"));
const raichuAlola = dex.resolvePokemonSprites({speciesId: "raichualola"});
assert.ok(raichuAlola.frontUrl?.includes("raichu-alola.gif"));
assert.ok(raichuAlola.backUrl?.includes("raichu-alola.gif"));
const slowkingGalar = dex.resolvePokemonSprites({speciesId: "slowkinggalar"});
assert.ok(slowkingGalar.frontUrl?.includes("slowking-galar.gif"));
assert.ok(slowkingGalar.backUrl?.includes("slowking-galar.gif"));
const zarudeDada = dex.resolvePokemonSprites({speciesId: "zarudedada"});
assert.ok(zarudeDada.frontUrl?.includes("zarude-dada.gif"));
assert.ok(zarudeDada.backUrl?.includes("zarude-dada.gif"));
const ogerponTealTera = dex.resolvePokemonSprites({speciesId: "ogerpontealtera"});
assert.ok(ogerponTealTera.frontUrl?.includes("ogerpon-tealtera.gif"));
assert.ok(ogerponTealTera.backUrl?.includes("ogerpon-tealtera.gif"));
const ogerponWellspringTera = dex.resolvePokemonSprites({speciesId: "ogerponwellspringtera"});
assert.ok(ogerponWellspringTera.frontUrl?.includes("ogerpon-wellspringtera.gif"));
assert.ok(ogerponWellspringTera.backUrl?.includes("ogerpon-wellspringtera.gif"));
const ogerponHearthflameTera = dex.resolvePokemonSprites({speciesId: "ogerponhearthflametera"});
assert.ok(ogerponHearthflameTera.frontUrl?.includes("ogerpon-hearthflametera.gif"));
assert.ok(ogerponHearthflameTera.backUrl?.includes("ogerpon-hearthflametera.gif"));
const ogerponCornerstoneTera = dex.resolvePokemonSprites({speciesId: "ogerponcornerstonetera"});
assert.ok(ogerponCornerstoneTera.frontUrl?.includes("ogerpon-cornerstonetera.gif"));
assert.ok(ogerponCornerstoneTera.backUrl?.includes("ogerpon-cornerstonetera.gif"));

const level50 = dex.calculatePokemonStats({speciesId: "venusaur", level: 50});
const level100 = dex.calculatePokemonStats({speciesId: "venusaur", level: 100});
assert.ok(level100.stats.hp > level50.stats.hp);
assert.ok(level100.stats.spa > level50.stats.spa);
const venusaurMax50 = dex.getPokemonMaxStats({speciesId: "venusaur", level: 50});
assert.equal(venusaurMax50.stats.hp, dex.calculatePokemonStats({speciesId: "venusaur", level: 50, ivs: {hp: 31}, evs: {hp: 255}}).stats.hp);
assert.equal(venusaurMax50.stats.atk, dex.calculatePokemonStats({speciesId: "venusaur", level: 50, nature: "Lonely", ivs: {atk: 31}, evs: {atk: 255}}).stats.atk);
assert.ok(venusaurMax50.stats.atk > dex.calculatePokemonStats({speciesId: "venusaur", level: 50, nature: "Serious", ivs: {atk: 31}, evs: {atk: 255}}).stats.atk);

const megahorn = dex.getMoveDetail("megahorn");
assert.equal(megahorn.id, "megahorn");
assert.equal(megahorn.nameZh, "超级角击");
assert.equal(megahorn.typeId, "Bug");
assert.equal(megahorn.type, "虫");
assert.ok(megahorn.description?.includes("角"));
assert.ok(megahorn.learners.length > 0);

const megaLauncher = dex.getAbilityDetail("megalauncher");
assert.equal(megaLauncher.id, "megalauncher");
assert.equal(megaLauncher.nameZh, "超级发射器");
assert.ok(megaLauncher.description.includes("波动") || megaLauncher.description.includes("波导"));
assert.ok(megaLauncher.holders.some(entry => entry.pokemon.id.includes("blastoise") || entry.pokemon.id.includes("clauncher")));

const leftovers = dex.getItemDetail("leftovers");
assert.equal(leftovers.id, "leftovers");
assert.equal(leftovers.nameZh, "吃剩的东西");
assert.ok(["携带道具", "战斗道具"].includes(leftovers.kindLabel));
assert.ok(leftovers.description.length > 0);

const choiceScarf = dex.getItemDetail("choicescarf");
assert.equal(choiceScarf.id, "choicescarf");
assert.ok(choiceScarf.description.length > 0);

const oranBerry = dex.getItemDetail("oranberry");
assert.equal(oranBerry.kindLabel, "树果");

const potion = dex.getItemDetail("potion");
assert.equal(potion.nameZh, "回复药");
assert.equal(potion.kindLabel, "恢复道具");
assert.equal(potion.sourceLabel, "V1 游戏道具");
assert.equal(potion.canUseToPokemon, true);

const revivalHerb = dex.getItemDetail("revivalherb");
assert.equal(revivalHerb.nameZh, "复活草");
assert.equal(revivalHerb.kindLabel, "复活道具");

const thunderboltTm = dex.getItemDetail("tm:thunderbolt");
assert.equal(thunderboltTm.kindLabel, "技能机器");
assert.equal(thunderboltTm.moveId, "thunderbolt");
assert.ok(thunderboltTm.nameZh.includes("十万伏特"));
assert.equal(dex.getTmItemDetail("thunderbolt").id, "tm:thunderbolt");
assert.equal(dex.getTmItemDetail("tm:thunderbolt").moveId, "thunderbolt");
assert.ok(dex.getPokemonMachineSkills("pikachu").some(move => move.id === "thunderbolt"));

const dynamaxBand = dex.getItemDetail("system-dynamax-band");
assert.equal(dynamaxBand.kindLabel, "系统战斗道具");
assert.equal(dynamaxBand.canTake, false);

const charizardMegaOptions = dex.getSystemBattleReforgeOptions("system-mega-stone", {speciesId: "charizard", moves: []});
assert.ok(charizardMegaOptions.some(option => option.mappedItemId === "charizarditex"));
assert.ok(charizardMegaOptions.some(option => option.mappedItemId === "charizarditey"));
assert.equal(dex.getSystemBattleReforgeOptions("system-mega-stone", {speciesId: "pikachu", moves: []}).length, 0);
const fireZOptions = dex.getSystemBattleReforgeOptions("system-z-crystal", {speciesId: "charizard", moves: [{moveId: "flamethrower", type: "火"}]});
assert.ok(fireZOptions.some(option => option.mappedItemId === "firiumz"));
const snorlaxZOptions = dex.getSystemBattleReforgeOptions("system-z-crystal", {speciesId: "snorlax", moves: [{moveId: "gigaimpact"}]});
assert.ok(snorlaxZOptions.some(option => option.mappedItemId === "snorliumz"));
const teraOptions = dex.getSystemBattleReforgeOptions("system-tera-orb", {speciesId: "pikachu", moves: []});
assert.ok(teraOptions.some(option => option.mappedTeraType === "Fairy"));

const search = dex.searchDex({category: "pokemon", query: "venusaur", limit: 5});
assert.ok(search.rows.some(row => row.id === "venusaur"));

const zhSearch = dex.searchDex({category: "pokemon", query: "妙蛙花", limit: 5});
assert.ok(zhSearch.rows.some(row => row.id === "venusaur"));

const moveZhSearch = dex.searchDex({category: "moves", query: "十万伏特", limit: 5});
assert.ok(moveZhSearch.rows.some(row => row.id === "thunderbolt"));

const berrySearch = dex.searchDex({category: "items", query: "树果", limit: 100});
assert.ok(berrySearch.rows.some(row => row.id === "oranberry"));

const potionSearch = dex.searchDex({category: "items", query: "回复药", limit: 20});
assert.ok(potionSearch.rows.some(row => row.id === "potion"));

const tmSearch = dex.searchDex({category: "items", query: "技能机器 十万伏特", limit: 20});
assert.ok(tmSearch.rows.some(row => row.id === "tm:thunderbolt"));

const systemItemSearch = dex.searchDex({category: "items", query: "极巨化", limit: 20});
assert.ok(systemItemSearch.rows.some(row => row.id === "system-dynamax-band"));

const trainerSearch = dex.searchDex({category: "trainers", limit: 20});
assert.ok(trainerSearch.rows.length > 0);
assert.ok(trainerSearch.rows.every(row => row.category === "trainers"));

const gymTrainerSearch = dex.searchDex({category: "trainers", query: "type:gym", limit: 100});
assert.ok(gymTrainerSearch.rows.some(row => row.id === "gym:关都地区:小刚:1"));
assert.ok(gymTrainerSearch.rows.every(row => row.tags.includes("type:gym")));

const elite4TrainerSearch = dex.searchDex({category: "trainers", query: "type:elite4", limit: 100});
assert.ok(elite4TrainerSearch.rows.length > 0);
assert.ok(elite4TrainerSearch.rows.every(row => row.tags.includes("type:elite4")));

const championTrainerSearch = dex.searchDex({category: "trainers", query: "type:champion", limit: 100});
assert.ok(championTrainerSearch.rows.length > 0);
assert.ok(championTrainerSearch.rows.every(row => row.tags.includes("type:champion")));

const villainTrainerSearch = dex.searchDex({category: "trainers", query: "type:villain", limit: 100});
assert.ok(villainTrainerSearch.rows.some(row => row.id === "villain:彩虹火箭队:坂木:1"));
assert.ok(villainTrainerSearch.rows.every(row => row.tags.includes("type:villain")));

const specialTrainerSearch = dex.searchDex({category: "trainers", query: "event:special", limit: 100});
assert.ok(specialTrainerSearch.rows.some(row => row.id === "villain:彩虹火箭队:坂木:1"));

const allTrainerSearch = dex.searchDex({category: "all", query: "小刚", limit: 20});
assert.ok(allTrainerSearch.rows.some(row => row.category === "trainers" && row.id === "gym:关都地区:小刚:1"));

const brock = dex.getTrainerDetail("gym:关都地区:小刚:1");
assert.equal(brock.nameZh, "小刚");
assert.equal(brock.trainerType, "gym");
assert.equal(brock.isBoss, true);
assertPortableNpcAsset(brock.frontAsset);
assertPortableNpcAsset(brock.avatarAsset);
assert.ok(Object.keys(brock.dialogues).length > 0);
assert.ok(brock.representativePokemon.length > 0);
assert.ok(brock.teamPools.length > 0);
assert.equal(brock.bossProfile?.aiLevel, "gymLeader");
assert.ok(brock.bossProfile?.teamPreferences.length);
assert.ok((brock.bossProfile?.preferredSpeciesIds.length || 0) >= 12);
assert.ok((brock.bossProfile?.originalPreferredSpeciesIds.length || 0) > 0);
assert.equal(brock.presetTeamPreviews.length, 36);
assert.ok(brock.presetTeamPreviews.every(team => team.pokemon.length === 6));
assert.ok(brock.presetTeamPreviews.some(team => team.mode === "singles" && team.ruleSetPreset === "gen9"));
assert.ok(brock.presetTeamPreviews.flatMap(team => team.pokemon).every(pokemon => pokemon.sprite?.iconStyle));

const giovanni = dex.getTrainerDetail("villain:彩虹火箭队:坂木:1");
assert.equal(giovanni.trainerType, "villain");
assert.equal(giovanni.isBoss, true);
assert.ok(Object.keys(giovanni.dialogues).length > 0);
assert.ok(giovanni.teamPools.length > 0);
assert.equal(giovanni.bossProfile?.aiLevel, "champion");
assert.equal(giovanni.bossProfile?.powerProfile, "champion");
assert.ok((giovanni.bossProfile?.preferredSpeciesIds.length || 0) >= 12);

const BossTrainerPresetTeams = JSON.parse(fs.readFileSync(new URL("../src/data/boss-preset-teams.json", import.meta.url), "utf8")) as BossTrainerPresetTeamData[];
assert.ok(BossTrainerPresetTeams.length > 0);
assert.equal(BossTrainerPresetTeamCount, BossTrainerPresetTeams.length);
const bossTrainerIds = dex.searchDex({category: "trainers", query: "boss", limit: 100}).rows
  .filter(row => row.tags.some(tag => ["type:gym", "type:elite4", "type:champion", "type:villain"].includes(tag)))
  .map(row => row.id);
for (const trainerId of bossTrainerIds) {
  const summary = BossTrainerPresetMatrixSummaries[trainerId];
  assert.ok(summary, `missing boss preset summary for ${trainerId}`);
  assert.equal(summary.expectedCount, 36);
  assert.equal(summary.generatedCount, 36);
  assert.deepEqual(summary.missingKeys, []);
  assert.equal(summary.ruleSetCounts.none, 9);
  assert.equal(summary.ruleSetCounts.gen7, 9);
  assert.equal(summary.ruleSetCounts.gen8, 9);
  assert.equal(summary.ruleSetCounts.gen9, 9);
  assert.equal(summary.modeCounts.singles, 12);
  assert.equal(summary.modeCounts.doubles, 12);
  assert.equal(summary.modeCounts.coop, 12);
}
for (const team of BossTrainerPresetTeams) {
  assert.equal(team.pokemonSets.length, 6, `team ${team.seed} does not have 6 pokemon`);
  for (const pokemon of team.pokemonSets) {
    assert.ok(pokemon.species, `missing species in ${team.seed}`);
    assert.ok(pokemon.ability, `missing ability in ${team.seed}`);
    assert.ok(pokemon.moves.length, `missing moves in ${team.seed}`);
    assert.ok(pokemon.nature, `missing nature in ${team.seed}`);
    assert.ok(pokemon.level, `missing level in ${team.seed}`);
  }
  if (team.ruleSetPreset === "none") {
    assert.ok(team.diagnostics.cleanedSpecialSystemForNone);
    assert.ok(team.pokemonSets.every(pokemon => !pokemon.teraType && !pokemon.gigantamax && !pokemon.dynamaxLevel), `none preset keeps special fields in ${team.seed}`);
  }
  if (team.ruleSetPreset === "gen7" && team.mode !== "singles") {
    assert.equal(team.diagnostics.fallbackFormatId, "[Gen 7] Random Battle");
  }
}
const teamsByTrainer = new Map<string, typeof BossTrainerPresetTeams>();
for (const team of BossTrainerPresetTeams) {
  const list = teamsByTrainer.get(team.trainerId) || [];
  list.push(team);
  teamsByTrainer.set(team.trainerId, list);
}
for (const [trainerId, teams] of teamsByTrainer) {
  assert.ok(teams.some(team => team.diagnostics.preferredSpeciesHitCount > 0), `no preferred species hit for ${trainerId}`);
}
assert.equal(dex.getTrainerDetail("gym:关都地区:小刚:1").bossPresetMatrix?.generatedCount, 36);

console.log("showdown-dex-core tests passed");

function assertPortableNpcAsset(asset: string) {
  assert.ok(asset.includes("npc/"));
  assert.equal(asset.includes("file:///"), false);
  assert.equal(/^[A-Z]:[\\/]/i.test(asset), false);
}
