"""Small whitelist of non-damaging move effects for step 5."""

from __future__ import annotations

import random
from typing import Any, Mapping

from .damage import accuracy_check


STATUS_CATEGORY_ID = 3
STAT_KEYS = ("attack", "defense", "special_attack", "special_defense", "speed")
MIN_STAGE = -6
MAX_STAGE = 6


SUPPORTED_STATUS_MOVES: dict[int, dict[str, Any]] = {
    14: {"target": "self", "stages": {"attack": 2}},  # Swords Dance
    39: {"target": "opponent", "stages": {"defense": -1}},  # Tail Whip
    43: {"target": "opponent", "stages": {"defense": -1}},  # Leer
    45: {"target": "opponent", "stages": {"attack": -1}},  # Growl
    74: {"target": "self", "stages": {"attack": 1, "special_attack": 1}},  # Growth
    97: {"target": "self", "stages": {"speed": 2}},  # Agility
    103: {"target": "opponent", "stages": {"defense": -2}},  # Screech
    105: {"target": "self", "heal_fraction": 0.5},  # Recover
    133: {"target": "self", "stages": {"special_defense": 2}},  # Amnesia
    135: {"target": "self", "heal_fraction": 0.5},  # Soft-Boiled
    208: {"target": "self", "heal_fraction": 0.5},  # Milk Drink
    303: {"target": "self", "heal_fraction": 0.5},  # Slack Off
    334: {"target": "self", "stages": {"defense": 2}},  # Iron Defense
    339: {"target": "self", "stages": {"attack": 1, "defense": 1}},  # Bulk Up
    347: {"target": "self", "stages": {"special_attack": 1, "special_defense": 1}},  # Calm Mind
    349: {"target": "self", "stages": {"attack": 1, "speed": 1}},  # Dragon Dance
    355: {"target": "self", "heal_fraction": 0.5},  # Roost
    417: {"target": "self", "stages": {"special_attack": 2}},  # Nasty Plot
    483: {"target": "self", "stages": {"special_attack": 1, "special_defense": 1, "speed": 1}},  # Quiver Dance
    504: {
        "target": "self",
        "stages": {"attack": 2, "defense": -1, "special_attack": 2, "special_defense": -1, "speed": 2},
    },  # Shell Smash
}


def move_category_id(move: Mapping[str, Any]) -> int | None:
    category = move.get("category")
    if not category:
        return None
    return int(category["id"])


def is_supported_status_move(move: Mapping[str, Any]) -> bool:
    return move_category_id(move) == STATUS_CATEGORY_ID and int(move["id"]) in SUPPORTED_STATUS_MOVES


def default_stat_stages() -> dict[str, int]:
    return {stat: 0 for stat in STAT_KEYS}


def ensure_stat_stages(pokemon: dict[str, Any]) -> None:
    existing = pokemon.get("stat_stages") or {}
    pokemon["stat_stages"] = {stat: int(existing.get(stat, 0)) for stat in STAT_KEYS}


def clamp_stage(value: int) -> int:
    return max(MIN_STAGE, min(MAX_STAGE, int(value)))


def apply_stage_changes(pokemon: dict[str, Any], changes: Mapping[str, int]) -> dict[str, dict[str, int]]:
    ensure_stat_stages(pokemon)
    result: dict[str, dict[str, int]] = {}
    for stat, delta in changes.items():
        if stat not in STAT_KEYS:
            raise ValueError(f"unsupported stat stage: {stat}")
        before = pokemon["stat_stages"][stat]
        after = clamp_stage(before + int(delta))
        pokemon["stat_stages"][stat] = after
        result[stat] = {"before": before, "after": after, "delta": after - before}
    return result


def heal_fraction(pokemon: dict[str, Any], fraction: float) -> dict[str, int]:
    before = int(pokemon["current_hp"])
    max_hp = int(pokemon["stats"]["hp"])
    amount = max(1, int(max_hp * fraction))
    pokemon["current_hp"] = min(max_hp, before + amount)
    return {"before": before, "after": pokemon["current_hp"], "amount": pokemon["current_hp"] - before}


def apply_status_move(
    user: dict[str, Any],
    target: dict[str, Any],
    move: Mapping[str, Any],
    *,
    rng: random.Random | None = None,
) -> dict[str, Any]:
    if not is_supported_status_move(move):
        raise ValueError("unsupported status move")
    effect = SUPPORTED_STATUS_MOVES[int(move["id"])]
    hit = accuracy_check(move, rng)
    result: dict[str, Any] = {
        "move_id": move.get("id"),
        "move_name": move.get("name"),
        "hit": hit,
        "effect": "status",
        "target": effect["target"],
        "stage_changes": {},
        "healing": None,
    }
    if not hit:
        return result

    affected = user if effect["target"] == "self" else target
    if "stages" in effect:
        result["effect"] = "stat_stage"
        result["stage_changes"] = apply_stage_changes(affected, effect["stages"])
    if "heal_fraction" in effect:
        result["effect"] = "heal"
        result["healing"] = heal_fraction(affected, float(effect["heal_fraction"]))
    return result
