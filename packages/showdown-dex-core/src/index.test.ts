import assert from "node:assert/strict";
import {createShowdownDexService} from "./index.js";

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

console.log("showdown-dex-core tests passed");
