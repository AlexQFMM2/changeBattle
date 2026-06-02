"""First-pass damage calculation for regular damaging moves."""

from __future__ import annotations

import math
import random
from typing import Any, Mapping


PHYSICAL_CATEGORY_ID = 1
SPECIAL_CATEGORY_ID = 2
STAB_MULTIPLIER = 1.5
MIN_DAMAGE_ROLL = 0.85
MAX_DAMAGE_ROLL = 1.0
CRITICAL_CHANCE = 1 / 24
CRITICAL_MULTIPLIER = 1.5


def _rng(rng: random.Random | None) -> random.Random:
    return rng if rng is not None else random.Random()


def _type_id(entry: Mapping[str, Any] | None) -> int | None:
    if not entry:
        return None
    return int(entry["id"])


def _pokemon_type_ids(pokemon: Mapping[str, Any]) -> set[int]:
    return {
        int(entry["id"])
        for entry in pokemon.get("types", [])
        if entry and entry.get("id") is not None
    }


def _move_category_id(move: Mapping[str, Any]) -> int | None:
    category = move.get("category")
    if not category:
        return None
    return int(category["id"])


def is_regular_damaging_move(move: Mapping[str, Any]) -> bool:
    return _move_category_id(move) in {PHYSICAL_CATEGORY_ID, SPECIAL_CATEGORY_ID} and move.get("power") is not None


def accuracy_check(move: Mapping[str, Any], rng: random.Random | None = None) -> bool:
    accuracy = move.get("accuracy")
    if accuracy is None:
        return True
    return _rng(rng).random() < (float(accuracy) / 100)


def critical_check(rng: random.Random | None = None) -> bool:
    return _rng(rng).random() < CRITICAL_CHANCE


def load_type_chart(rows: list[dict[str, Any]]) -> dict[int, dict[int, float]]:
    chart: dict[int, dict[int, float]] = {}
    for row in rows:
        attack_type = _type_id(row.get("attack_type"))
        if attack_type is None:
            continue
        chart[attack_type] = {
            int(defense_type): float(multiplier)
            for defense_type, multiplier in row.get("defense_multipliers", {}).items()
        }
    return chart


def type_effectiveness(move_type_id: int, defender: Mapping[str, Any], type_chart: Mapping[int, Mapping[int, float]]) -> float:
    multiplier = 1.0
    for defense_type_id in _pokemon_type_ids(defender):
        multiplier *= float(type_chart.get(move_type_id, {}).get(defense_type_id, 1.0))
    return multiplier


def stab_multiplier(attacker: Mapping[str, Any], move_type_id: int) -> float:
    return STAB_MULTIPLIER if move_type_id in _pokemon_type_ids(attacker) else 1.0


def stage_multiplier(stage: int) -> float:
    stage = max(-6, min(6, int(stage)))
    if stage >= 0:
        return (2 + stage) / 2
    return 2 / (2 - stage)


def modified_stat(pokemon: Mapping[str, Any], stat: str) -> int:
    base = int(pokemon["stats"][stat])
    stage = int((pokemon.get("stat_stages") or {}).get(stat, 0))
    return max(1, int(base * stage_multiplier(stage)))


def attacking_stat(attacker: Mapping[str, Any], move: Mapping[str, Any]) -> int:
    category_id = _move_category_id(move)
    if category_id == PHYSICAL_CATEGORY_ID:
        return modified_stat(attacker, "attack")
    if category_id == SPECIAL_CATEGORY_ID:
        return modified_stat(attacker, "special_attack")
    raise ValueError("move is not a physical or special damaging move")


def defending_stat(defender: Mapping[str, Any], move: Mapping[str, Any]) -> int:
    category_id = _move_category_id(move)
    if category_id == PHYSICAL_CATEGORY_ID:
        return modified_stat(defender, "defense")
    if category_id == SPECIAL_CATEGORY_ID:
        return modified_stat(defender, "special_defense")
    raise ValueError("move is not a physical or special damaging move")


def calculate_damage(
    attacker: Mapping[str, Any],
    defender: Mapping[str, Any],
    move: Mapping[str, Any],
    type_chart: Mapping[int, Mapping[int, float]],
    *,
    rng: random.Random | None = None,
) -> dict[str, Any]:
    """Calculate damage for a regular physical/special move.

    This is step 5: accuracy, critical hits, and stat stages are included.
    Still no abilities, items, weather, field, or major status conditions.
    """

    if not is_regular_damaging_move(move):
        raise ValueError("damage only supports physical/special moves with power")

    move_type_id = _type_id(move.get("type"))
    if move_type_id is None:
        raise ValueError("move type is required")
    local_rng = _rng(rng)

    hit = accuracy_check(move, local_rng)
    if not hit:
        return {
            "damage": 0,
            "hit": False,
            "critical": False,
            "effectiveness": None,
            "stab": stab_multiplier(attacker, move_type_id),
            "random_multiplier": 1.0,
            "critical_multiplier": 1.0,
            "base_damage": 0,
            "move_id": move.get("id"),
            "move_name": move.get("name"),
        }

    effectiveness = type_effectiveness(move_type_id, defender, type_chart)
    if effectiveness == 0:
        return {
            "damage": 0,
            "hit": True,
            "critical": False,
            "effectiveness": 0,
            "stab": stab_multiplier(attacker, move_type_id),
            "random_multiplier": 1.0,
            "critical_multiplier": 1.0,
            "base_damage": 0,
            "move_id": move.get("id"),
            "move_name": move.get("name"),
        }

    level = int(attacker["level"])
    power = int(move["power"])
    attack = attacking_stat(attacker, move)
    defense = max(1, defending_stat(defender, move))
    base_damage = math.floor(math.floor(math.floor((2 * level) / 5 + 2) * power * attack / defense) / 50) + 2
    stab = stab_multiplier(attacker, move_type_id)
    critical = critical_check(local_rng)
    critical_multiplier = CRITICAL_MULTIPLIER if critical else 1.0
    random_multiplier = local_rng.uniform(MIN_DAMAGE_ROLL, MAX_DAMAGE_ROLL)
    final_damage = math.floor(base_damage * stab * effectiveness * critical_multiplier * random_multiplier)
    if final_damage < 1:
        final_damage = 1

    return {
        "damage": final_damage,
        "hit": True,
        "critical": critical,
        "effectiveness": effectiveness,
        "stab": stab,
        "random_multiplier": random_multiplier,
        "critical_multiplier": critical_multiplier,
        "base_damage": base_damage,
        "move_id": move.get("id"),
        "move_name": move.get("name"),
    }
