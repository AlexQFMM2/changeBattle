import {useMemo, useState} from "react";
import type {ChangeBattleV2Api} from "@changebattle-v2/api";
import type {RentalPokemon} from "../formalRentalTypes";
import {RentalSelectPage} from "./RentalSelectPage";
import "./RentalSelectPage.preview.css";

export function RentalSelectPagePreview({api}: {api: ChangeBattleV2Api}) {
  const candidates = useMemo(() => createPreviewCandidates(api), [api]);
  const [selected, setSelected] = useState<number[]>([0, 6]);
  const [focusIndex, setFocusIndex] = useState(6);
  return (
    <section className="rental-select-page-preview-canvas" aria-label="选人页组件预览">
      <RentalSelectPage
        api={api}
        candidates={candidates}
        selected={selected}
        focusIndex={focusIndex}
        setFocusIndex={setFocusIndex}
        onToggle={index => setSelected(current => current.includes(index) ? current.filter(value => value !== index) : [...current.slice(-2), index])}
        onStart={() => undefined}
        requiredCount={3}
        revealTraining
        onRandomSelect={() => setSelected([0, 2, 6])}
        onClearSelected={() => setSelected([])}
        showScoutControls={false}
        soulmateSlotCount={2}
      />
    </section>
  );
}

function createPreviewCandidates(api: ChangeBattleV2Api): RentalPokemon[] {
  const species = ["pikachu", "charizard", "lapras", "gardevoir", "lucario", "greninja"];
  const regular = species.map((speciesId, index) => candidateFromSpecies(api, speciesId, index));
  return [
    ...regular,
    {
      ...candidateFromSpecies(api, "starmie", 6),
      name: "很长很长的小海星昵称",
      species_zh: "很长很长的小海星昵称",
      starter_source_kind: "soulmate-vault",
      source_player_pokemon_id: "preview-vault-starmie",
      item_id: "leftovers",
      item: "Leftovers",
      item_zh: "吃剩的东西",
    },
    {
      ...candidateFromSpecies(api, "pikachu", 7),
      name: "小电",
      species_zh: "小电",
      starter_source_kind: "soulmate-vault",
      source_player_pokemon_id: "preview-vault-pikachu",
    },
  ];
}

function candidateFromSpecies(api: ChangeBattleV2Api, speciesId: string, index: number): RentalPokemon {
  const detail = api.getPokemonDetail(speciesId);
  const stats = api.dex.calculatePokemonStats({
    speciesId: detail.id,
    level: 50 + index,
    nature: "Serious",
    evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0},
    ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
  }).stats;
  return {
    run_member_id: `preview-${index}-${detail.id}`,
    showdown_id: detail.id,
    name: detail.nameZh || detail.name,
    species: detail.name,
    species_zh: detail.nameZh || detail.name,
    species_id: detail.id,
    level: 50 + index,
    gender: "N",
    types: detail.types,
    types_zh: detail.types.map(type => api.translateDexLabel("types", type)),
    ability: detail.abilities[0]?.name || "",
    ability_zh: detail.abilities[0]?.nameZh || detail.abilities[0]?.name || "",
    ability_id: detail.abilities[0]?.id || "",
    ability_desc: "",
    ability_desc_zh: "",
    item: "",
    item_zh: "无",
    item_id: "",
    item_desc: "",
    item_desc_zh: "",
    moves: [],
    base_stats: detail.baseStats,
    stats,
    evs: {hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0},
    ivs: {hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31},
    nature: "Serious",
    nature_zh: "认真",
    nature_plus: "",
    nature_minus: "",
    role: "balanced",
    role_zh: "均衡",
    shiny: index === 6,
    sprite: {
      national_dex: detail.num,
      front_default: detail.sprites.frontUrl || detail.sprites.fallbackFrontUrl || detail.sprites.iconUrl,
      front_shiny: detail.sprites.frontShinyUrl || detail.sprites.fallbackFrontShinyUrl || detail.sprites.frontUrl,
      icon: detail.sprites.iconUrl,
      icon_style: detail.sprites.iconStyle,
    },
  };
}
