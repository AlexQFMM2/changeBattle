"""Rental Pokemon generation for the first playable core step."""

from __future__ import annotations

import random
from typing import Any, Mapping, Sequence

from .instance import create_pokemon_instance
from .stats import DEFAULT_IV, DEFAULT_LEVEL, STAT_KEYS, default_ivs


EV_TEMPLATES: dict[str, dict[str, int]] = {
    "physical_fast": {
        "hp": 4,
        "attack": 252,
        "defense": 0,
        "special_attack": 0,
        "special_defense": 0,
        "speed": 252,
    },
    "special_fast": {
        "hp": 4,
        "attack": 0,
        "defense": 0,
        "special_attack": 252,
        "special_defense": 0,
        "speed": 252,
    },
    "physical_bulk": {
        "hp": 252,
        "attack": 0,
        "defense": 252,
        "special_attack": 0,
        "special_defense": 4,
        "speed": 0,
    },
    "special_bulk": {
        "hp": 252,
        "attack": 0,
        "defense": 4,
        "special_attack": 0,
        "special_defense": 252,
        "speed": 0,
    },
    "balanced": {
        "hp": 252,
        "attack": 84,
        "defense": 84,
        "special_attack": 84,
        "special_defense": 4,
        "speed": 0,
    },
}


def _as_list(rows: Mapping[int, Mapping[str, Any]] | Sequence[Mapping[str, Any]]) -> list[Mapping[str, Any]]:
    if isinstance(rows, Mapping):
        return list(rows.values())
    return list(rows)


def _rng(rng: random.Random | None) -> random.Random:
    return rng if rng is not None else random.Random()


def legal_ev_styles(template: Mapping[str, Any]) -> list[str]:
    base_stats = template["base_stats"]
    attack = int(base_stats["attack"])
    special_attack = int(base_stats["special_attack"])
    styles: list[str]
    if attack > special_attack:
        styles = ["physical_fast", "physical_bulk"]
    elif special_attack > attack:
        styles = ["special_fast", "special_bulk"]
    else:
        styles = ["physical_fast", "special_fast", "balanced"]

    if abs(attack - special_attack) <= 10 and "balanced" not in styles:
        styles.append("balanced")
    return styles


def choose_ev_style(template: Mapping[str, Any], rng: random.Random | None = None) -> str:
    return _rng(rng).choice(legal_ev_styles(template))


def choose_nature(
    natures: Mapping[int, Mapping[str, Any]] | Sequence[Mapping[str, Any]],
    rng: random.Random | None = None,
) -> Mapping[str, Any]:
    choices = _as_list(natures)
    if not choices:
        raise ValueError("natures must not be empty")
    return _rng(rng).choice(choices)


def validate_ev_template(evs: Mapping[str, int]) -> None:
    missing = [stat for stat in STAT_KEYS if stat not in evs]
    if missing:
        raise ValueError(f"EV template missing stats: {missing}")
    for stat, value in evs.items():
        if stat not in STAT_KEYS:
            raise ValueError(f"unknown EV stat: {stat}")
        if not 0 <= int(value) <= 252:
            raise ValueError(f"EV {stat} must be between 0 and 252, got {value}")
    total = sum(int(value) for value in evs.values())
    if total > 510:
        raise ValueError(f"EV total must be at most 510, got {total}")


def evs_for_style(style: str) -> dict[str, int]:
    if style not in EV_TEMPLATES:
        raise ValueError(f"unknown EV style: {style}")
    evs = dict(EV_TEMPLATES[style])
    validate_ev_template(evs)
    return evs


def generate_pokemon_instance(
    template: Mapping[str, Any],
    natures: Mapping[int, Mapping[str, Any]] | Sequence[Mapping[str, Any]],
    *,
    rng: random.Random | None = None,
    ev_style: str | None = None,
) -> dict[str, Any]:
    """Generate a level-50 rental Pokemon instance from one template."""

    local_rng = _rng(rng)
    selected_nature = choose_nature(natures, local_rng)
    selected_ev_style = ev_style or choose_ev_style(template, local_rng)
    evs = evs_for_style(selected_ev_style)
    instance = create_pokemon_instance(
        template,
        level=DEFAULT_LEVEL,
        nature=selected_nature,
        ivs=default_ivs(DEFAULT_IV),
        evs=evs,
        ability=None,
        item=None,
        moves=[],
    )
    instance["generation"] = {
        "ev_style": selected_ev_style,
        "iv_style": "perfect_31",
        "stage": "step_1_pokemon_instance_only",
    }
    return instance


def generate_random_pokemon_instance(
    pokemon_templates: Mapping[int, Mapping[str, Any]] | Sequence[Mapping[str, Any]],
    natures: Mapping[int, Mapping[str, Any]] | Sequence[Mapping[str, Any]],
    *,
    rng: random.Random | None = None,
) -> dict[str, Any]:
    """Choose a random template and generate one level-50 rental Pokemon."""

    local_rng = _rng(rng)
    templates = _as_list(pokemon_templates)
    if not templates:
        raise ValueError("pokemon_templates must not be empty")
    return generate_pokemon_instance(local_rng.choice(templates), natures, rng=local_rng)
