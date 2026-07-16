import assert from "node:assert/strict";
import {Pokedex} from "../../../../packages/showdown-dex-core/src/data/pokedex.js";
import spriteManifest from "../data/showdownSpriteManifest.json" with {type: "json"};
import {pokemonSpriteResourceUrls, showdownPokemonSpriteId} from "./showdownPokemonSpriteAdapter.js";

const manifestSpeciesIds = new Set(spriteManifest.sprites.map(entry => toId(entry.speciesId)));
const manifestSpriteIds = new Set(spriteManifest.sprites.map(entry => entry.id));

assert.equal(showdownPokemonSpriteId("ogerpontealtera"), "ogerpon-tealtera");
assert.equal(showdownPokemonSpriteId("ogerponwellspringtera"), "ogerpon-wellspringtera");
assert.equal(showdownPokemonSpriteId("ogerponhearthflametera"), "ogerpon-hearthflametera");
assert.equal(showdownPokemonSpriteId("ogerponcornerstonetera"), "ogerpon-cornerstonetera");
assert.equal(showdownPokemonSpriteId("arcaninehisui"), "arcanine-hisui");
assert.equal(showdownPokemonSpriteId("taurospaldeacombat"), "tauros-paldeacombat");
assert.equal(showdownPokemonSpriteId("lucariomegaz"), "lucario-megaz");

let checkedSpecies = 0;

for (const [speciesId, species] of Object.entries(Pokedex)) {
  if (!shouldCheckSpecies(speciesId, species)) continue;
  const spriteId = showdownPokemonSpriteId(speciesId);
  checkedSpecies += 1;
  assert.ok(manifestSpriteIds.has(spriteId), `${speciesId} should map to a manifest sprite id, got ${spriteId}`);
  const urls = pokemonSpriteResourceUrls(speciesId);
  assert.ok(urls.frontSpriteUrl.endsWith(`/showdown/sprites/ani/${spriteId}.gif`), `${speciesId} front url should use adapter sprite id`);
  assert.ok(urls.backSpriteUrl.endsWith(`/showdown/sprites/ani-back/${spriteId}.gif`), `${speciesId} back url should use adapter sprite id`);
  assert.ok(urls.frontShinySpriteUrl.endsWith(`/showdown/sprites/ani-shiny/${spriteId}.gif`), `${speciesId} shiny front url should use adapter sprite id`);
  assert.ok(urls.backShinySpriteUrl.endsWith(`/showdown/sprites/ani-back-shiny/${spriteId}.gif`), `${speciesId} shiny back url should use adapter sprite id`);
}

assert.ok(checkedSpecies > 1300, `expected to check the full dex, got ${checkedSpecies}`);
console.log(`showdown pokemon sprite adapter tests passed (${checkedSpecies} species mapped to CDN sprite URLs)`);

function shouldCheckSpecies(speciesId: string, species: any): boolean {
  if (!manifestSpeciesIds.has(toId(speciesId))) return false;
  if (species?.isNonstandard && species.isNonstandard !== "Past") return false;
  return true;
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
