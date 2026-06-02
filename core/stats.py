"""Gen 3+ Pokemon stat calculation.

The source data contains species/form templates. These functions turn a
template's base stats plus level, IVs, EVs, and nature into battle-ready stats.
"""

from __future__ import annotations

import math
from typing import Any, Mapping


STAT_KEYS = ("hp", "attack", "defense", "special_attack", "special_defense", "speed")
NON_HP_STAT_KEYS = ("attack", "defense", "special_attack", "special_defense", "speed")
DEFAULT_IV = 31
DEFAULT_EV = 0
DEFAULT_LEVEL = 50
SHEDINJA_NATIONAL_DEX_ID = 292


def default_ivs(value: int = DEFAULT_IV) -> dict[str, int]:
    return {stat: value for stat in STAT_KEYS}


def default_evs(value: int = DEFAULT_EV) -> dict[str, int]:
    return {stat: value for stat in STAT_KEYS}


def normalize_stat_block(
    values: Mapping[str, int] | None,
    *,
    default: int,
    label: str,
) -> dict[str, int]:
    normalized = {stat: int(default) for stat in STAT_KEYS}
    if values:
        for stat, value in values.items():
            if stat not in STAT_KEYS:
                raise ValueError(f"unknown {label} stat: {stat}")
            normalized[stat] = int(value)
    return normalized


def validate_inputs(level: int, ivs: Mapping[str, int], evs: Mapping[str, int]) -> None:
    if not 1 <= level <= 100:
        raise ValueError(f"level must be between 1 and 100, got {level}")
    for stat, value in ivs.items():
        if not 0 <= value <= 31:
            raise ValueError(f"IV {stat} must be between 0 and 31, got {value}")
    for stat, value in evs.items():
        if not 0 <= value <= 252:
            raise ValueError(f"EV {stat} must be between 0 and 252, got {value}")
    total_evs = sum(evs.values())
    if total_evs > 510:
        raise ValueError(f"total EVs must be at most 510, got {total_evs}")


def nature_modifiers(nature: Mapping[str, Any] | None) -> dict[str, float]:
    modifiers = {stat: 1.0 for stat in NON_HP_STAT_KEYS}
    if not nature:
        return modifiers
    raw = nature.get("modifiers", nature)
    for stat in NON_HP_STAT_KEYS:
        if stat in raw:
            modifiers[stat] = float(raw[stat])
    return modifiers


def calculate_hp(base: int, iv: int, ev: int, level: int) -> int:
    return math.floor(((2 * base + iv + math.floor(ev / 4)) * level) / 100) + level + 10


def calculate_non_hp(base: int, iv: int, ev: int, level: int, modifier: float) -> int:
    raw = math.floor(((2 * base + iv + math.floor(ev / 4)) * level) / 100) + 5
    return math.floor(raw * modifier)


def calculate_stats(
    base_stats: Mapping[str, int],
    *,
    level: int = DEFAULT_LEVEL,
    nature: Mapping[str, Any] | None = None,
    ivs: Mapping[str, int] | None = None,
    evs: Mapping[str, int] | None = None,
    national_dex_id: int | None = None,
) -> dict[str, int]:
    """Calculate final stats for a real Pokemon instance.

    `base_stats` should come from a pokemon template's `base_stats`.
    `nature` may be a row from `data/natures.jsonl` or just a modifiers dict.
    Missing IVs default to 31; missing EVs default to 0.
    """

    level = int(level)
    normalized_ivs = normalize_stat_block(ivs, default=DEFAULT_IV, label="IV")
    normalized_evs = normalize_stat_block(evs, default=DEFAULT_EV, label="EV")
    validate_inputs(level, normalized_ivs, normalized_evs)
    modifiers = nature_modifiers(nature)

    hp = calculate_hp(
        int(base_stats["hp"]),
        normalized_ivs["hp"],
        normalized_evs["hp"],
        level,
    )
    if national_dex_id == SHEDINJA_NATIONAL_DEX_ID:
        hp = 1

    return {
        "hp": hp,
        "attack": calculate_non_hp(
            int(base_stats["attack"]),
            normalized_ivs["attack"],
            normalized_evs["attack"],
            level,
            modifiers["attack"],
        ),
        "defense": calculate_non_hp(
            int(base_stats["defense"]),
            normalized_ivs["defense"],
            normalized_evs["defense"],
            level,
            modifiers["defense"],
        ),
        "special_attack": calculate_non_hp(
            int(base_stats["special_attack"]),
            normalized_ivs["special_attack"],
            normalized_evs["special_attack"],
            level,
            modifiers["special_attack"],
        ),
        "special_defense": calculate_non_hp(
            int(base_stats["special_defense"]),
            normalized_ivs["special_defense"],
            normalized_evs["special_defense"],
            level,
            modifiers["special_defense"],
        ),
        "speed": calculate_non_hp(
            int(base_stats["speed"]),
            normalized_ivs["speed"],
            normalized_evs["speed"],
            level,
            modifiers["speed"],
        ),
    }
