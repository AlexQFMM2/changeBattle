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
assert.ok(venusaur.sprites.frontUrl?.includes("venusaur"));
assert.ok(venusaur.sprites.backUrl?.includes("venusaur"));
assert.ok(venusaur.sprites.frontShinyUrl?.includes("venusaur"));
assert.ok(venusaur.sprites.backShinyUrl?.includes("venusaur"));
assert.ok(venusaur.cryUrl?.includes("venusaur"));

const level50 = dex.calculatePokemonStats({speciesId: "venusaur", level: 50});
const level100 = dex.calculatePokemonStats({speciesId: "venusaur", level: 100});
assert.ok(level100.stats.hp > level50.stats.hp);
assert.ok(level100.stats.spa > level50.stats.spa);

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
assert.equal(leftovers.kindLabel, "战斗道具");
assert.ok(leftovers.description.length > 0);

const choiceScarf = dex.getItemDetail("choicescarf");
assert.equal(choiceScarf.id, "choicescarf");
assert.ok(choiceScarf.description.length > 0);

const search = dex.searchDex({category: "pokemon", query: "venusaur", limit: 5});
assert.ok(search.rows.some(row => row.id === "venusaur"));

const zhSearch = dex.searchDex({category: "pokemon", query: "妙蛙花", limit: 5});
assert.ok(zhSearch.rows.some(row => row.id === "venusaur"));

const moveZhSearch = dex.searchDex({category: "moves", query: "十万伏特", limit: 5});
assert.ok(moveZhSearch.rows.some(row => row.id === "thunderbolt"));

console.log("showdown-dex-core tests passed");
