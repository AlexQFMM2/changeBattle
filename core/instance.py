"""Create battle-ready Pokemon instances from species/form templates."""

from __future__ import annotations

from typing import Any, Mapping, Sequence

from .stats import DEFAULT_EV, DEFAULT_IV, DEFAULT_LEVEL, STAT_KEYS, calculate_stats, normalize_stat_block


def create_pokemon_instance(
    template: Mapping[str, Any],
    *,
    level: int = DEFAULT_LEVEL,
    nature: Mapping[str, Any],
    ivs: Mapping[str, int] | None = None,
    evs: Mapping[str, int] | None = None,
    ability: Mapping[str, Any] | None = None,
    item: Mapping[str, Any] | None = None,
    moves: Sequence[Mapping[str, Any]] | None = None,
    nickname: str | None = None,
) -> dict[str, Any]:
    """Create a concrete Pokemon from a template row.

    Templates describe the species/form. Instances describe a real rental
    Pokemon with level, nature, IVs, EVs, calculated stats, current HP, ability,
    item, and moves.
    """

    final_ivs = normalize_stat_block(ivs, default=DEFAULT_IV, label="IV")
    final_evs = normalize_stat_block(evs, default=DEFAULT_EV, label="EV")
    stats = calculate_stats(
        template["base_stats"],
        level=level,
        nature=nature,
        ivs=final_ivs,
        evs=final_evs,
        national_dex_id=template.get("national_dex_id"),
    )

    return {
        "kind": "pokemon_instance",
        "template_id": template["id"],
        "national_dex_id": template.get("national_dex_id"),
        "name": template.get("name"),
        "nickname": nickname,
        "level": int(level),
        "nature": nature,
        "ivs": {stat: final_ivs[stat] for stat in STAT_KEYS},
        "evs": {stat: final_evs[stat] for stat in STAT_KEYS},
        "base_stats": template["base_stats"],
        "stats": stats,
        "current_hp": stats["hp"],
        "types": template.get("types", []),
        "ability": ability,
        "item": item,
        "moves": list(moves or []),
        "source": {
            "template": "data/pokemon.jsonl",
            "nature": "data/natures.jsonl",
        },
    }
