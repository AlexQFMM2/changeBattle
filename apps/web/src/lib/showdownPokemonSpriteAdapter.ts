import type {LocalPokemonV4} from "@changebattle-v2/api";
import spriteManifest from "../../public/showdown/sprites/manifest.json" with {type: "json"};
import {assetUrl} from "./assetUrl.js";

export type PokemonSpriteResourceUrls = {
  spriteId: string;
  frontSpriteUrl: string;
  backSpriteUrl: string;
  frontShinySpriteUrl: string;
  backShinySpriteUrl: string;
};

export type PokemonSpriteFacing = "front" | "back";

const SHOWDOWN_SPRITE_ID_OVERRIDES: Record<string, string> = {
  taurospaldeaaqua: "tauros-paldeaaqua",
  taurospaldeablaze: "tauros-paldeablaze",
  taurospaldeacombat: "tauros-paldeacombat",
  zarudedada: "zarude-dada",
};

const SPRITE_ID_BY_SPECIES_ID: Record<string, string> = Object.fromEntries(
  (spriteManifest.sprites || []).map(entry => [toId(entry.speciesId), entry.id]),
);

const SHOWDOWN_FORME_SUFFIXES = [
  "bustedtotem",
  "paldeacombat",
  "paldeablaze",
  "paldeaaqua",
  "sunshine",
  "complete",
  "unbound",
  "origin",
  "school",
  "meteor",
  "busted",
  "totem",
  "blade",
  "shield",
  "sunny",
  "rainy",
  "snowy",
  "zen",
  "hero",
  "alola",
  "galar",
  "hisui",
  "paldea",
  "dada",
];

export function showdownPokemonSpriteId(speciesId: string): string {
  const id = toId(speciesId);
  if (!id) return "";
  const manifestId = SPRITE_ID_BY_SPECIES_ID[id];
  if (manifestId) return manifestId;
  const override = SHOWDOWN_SPRITE_ID_OVERRIDES[id];
  if (override) return override;
  const megaZMatch = /^(.+?)megaz$/.exec(id);
  if (megaZMatch) return `${megaZMatch[1]}-megaz`;
  const megaMatch = /^(.+?)mega([xy])?$/.exec(id);
  if (megaMatch) return `${megaMatch[1]}-mega${megaMatch[2] || ""}`;
  const gmaxMatch = /^(.+?)gmax$/.exec(id);
  if (gmaxMatch) return `${gmaxMatch[1]}-gmax`;
  const primalMatch = /^(.+?)primal$/.exec(id);
  if (primalMatch) return `${primalMatch[1]}-primal`;
  const ultraMatch = /^(.+?)ultra$/.exec(id);
  if (ultraMatch) return `${ultraMatch[1]}-ultra`;
  for (const suffix of SHOWDOWN_FORME_SUFFIXES) {
    if (id.endsWith(suffix) && id.length > suffix.length) {
      return `${id.slice(0, -suffix.length)}-${suffix}`;
    }
  }
  return id;
}

export function pokemonSpriteResourceUrls(speciesId: string): PokemonSpriteResourceUrls {
  const spriteId = showdownPokemonSpriteId(speciesId);
  return {
    spriteId,
    frontSpriteUrl: assetUrl(`showdown/sprites/ani/${spriteId}.gif`) || "",
    backSpriteUrl: assetUrl(`showdown/sprites/ani-back/${spriteId}.gif`) || "",
    frontShinySpriteUrl: assetUrl(`showdown/sprites/ani-shiny/${spriteId}.gif`) || "",
    backShinySpriteUrl: assetUrl(`showdown/sprites/ani-back-shiny/${spriteId}.gif`) || "",
  };
}

export function pokemonSpriteUrl(input: {speciesId: string; facing?: PokemonSpriteFacing; shiny?: boolean}): string {
  const urls = pokemonSpriteResourceUrls(input.speciesId);
  const facing = input.facing || "front";
  if (input.shiny) return facing === "back" ? urls.backShinySpriteUrl : urls.frontShinySpriteUrl;
  return facing === "back" ? urls.backSpriteUrl : urls.frontSpriteUrl;
}

export function localPokemonSpriteUrls(pokemon: Pick<
  LocalPokemonV4,
  "speciesId" | "shiny"
>, side: "near" | "far" | "front" = "front"): PokemonSpriteResourceUrls & {spriteUrl: string} {
  const resources = pokemonSpriteResourceUrls(pokemon.speciesId);
  const frontSpriteUrl = pokemonSpriteUrl({speciesId: pokemon.speciesId, facing: "front"});
  const backSpriteUrl = pokemonSpriteUrl({speciesId: pokemon.speciesId, facing: "back"});
  const frontShinySpriteUrl = pokemonSpriteUrl({speciesId: pokemon.speciesId, facing: "front", shiny: true});
  const backShinySpriteUrl = pokemonSpriteUrl({speciesId: pokemon.speciesId, facing: "back", shiny: true});
  const showBack = side === "near";
  const spriteUrl = pokemon.shiny
    ? showBack ? backShinySpriteUrl : frontShinySpriteUrl
    : showBack ? backSpriteUrl : frontSpriteUrl;
  return {
    spriteId: resources.spriteId,
    spriteUrl,
    frontSpriteUrl,
    backSpriteUrl,
    frontShinySpriteUrl,
    backShinySpriteUrl,
  };
}

export function localPokemonFrontSpriteUrl(pokemon: Pick<
  LocalPokemonV4,
  "speciesId" | "shiny"
>): string {
  return localPokemonSpriteUrls(pokemon, "front").spriteUrl;
}

function toId(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
