#!/usr/bin/env python3
"""Smoke tests for first-pass damage calculation."""

from __future__ import annotations

import json
import os
import random
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = Path(os.environ.get("POKEMON_DATA_DIR", "/home/alexqfmm/workPlace/pokemonAbout/data"))
sys.path.insert(0, str(ROOT))

from core import calculate_damage, generate_pokemon_instance  # noqa: E402
from core.damage import (  # noqa: E402
    accuracy_check,
    critical_check,
    load_type_chart,
    modified_stat,
    stab_multiplier,
    stage_multiplier,
    type_effectiveness,
)
from core.data_loader import index_by_id, load_jsonl  # noqa: E402
from core.move_effects import apply_stage_changes  # noqa: E402


def assert_equal(actual, expected, label: str) -> None:
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected}, got {actual}")


def assert_true(value: bool, label: str) -> None:
    if not value:
        raise AssertionError(label)


def main() -> int:
    pokemon = index_by_id(load_jsonl(DATA / "pokemon.jsonl"))
    natures = index_by_id(load_jsonl(DATA / "natures.jsonl"))
    moves = index_by_id(load_jsonl(DATA / "moves.jsonl"))
    type_chart = load_type_chart(load_jsonl(DATA / "type_chart.jsonl"))
    hardy = natures[1]

    bulbasaur = generate_pokemon_instance(pokemon[1], natures, rng=random.Random(1), ev_style="special_fast")
    charmander = generate_pokemon_instance(pokemon[4], natures, rng=random.Random(2), ev_style="special_fast")
    squirtle = generate_pokemon_instance(pokemon[7], natures, rng=random.Random(3), ev_style="special_fast")
    gastly = generate_pokemon_instance(pokemon[92], natures, rng=random.Random(4), ev_style="special_fast")
    pikachu = generate_pokemon_instance(pokemon[25], natures, rng=random.Random(5), ev_style="special_fast")
    normal_attacker = generate_pokemon_instance(pokemon[133], natures, rng=random.Random(6), ev_style="physical_fast")

    tackle = moves[33]
    ember = moves[52]
    water_gun = moves[55]
    thunderbolt = moves[85]

    assert_equal(type_effectiveness(1, gastly, type_chart), 0, "Normal vs Ghost")
    assert_equal(type_effectiveness(13, squirtle, type_chart), 2, "Electric vs Water")
    assert_equal(type_effectiveness(10, squirtle, type_chart), 0.5, "Fire vs Water")
    assert_equal(stab_multiplier(charmander, 10), 1.5, "Fire STAB")
    assert_equal(stab_multiplier(charmander, 11), 1.0, "No Water STAB")

    immune = calculate_damage(normal_attacker, gastly, tackle, type_chart, rng=random.Random(10))
    assert_equal(immune["damage"], 0, "immune damage")
    assert_equal(immune["effectiveness"], 0, "immune effectiveness")

    electric_hit = calculate_damage(pikachu, squirtle, thunderbolt, type_chart, rng=random.Random(20))
    assert_true(electric_hit["damage"] > 0, "electric hit damage")
    assert_equal(electric_hit["effectiveness"], 2.0, "electric hit effectiveness")
    assert_equal(electric_hit["stab"], 1.5, "electric hit STAB")

    fire_resisted = calculate_damage(charmander, squirtle, ember, type_chart, rng=random.Random(20))
    assert_true(fire_resisted["damage"] > 0, "fire resisted damage")
    assert_equal(fire_resisted["effectiveness"], 0.5, "fire resisted effectiveness")
    assert_equal(fire_resisted["stab"], 1.5, "fire resisted STAB")

    grass_super = calculate_damage(bulbasaur, squirtle, moves[22], type_chart, rng=random.Random(21))
    assert_equal(grass_super["effectiveness"], 2.0, "grass vs water effectiveness")
    assert_equal(grass_super["stab"], 1.5, "grass STAB")

    first = calculate_damage(pikachu, squirtle, thunderbolt, type_chart, rng=random.Random(999))
    second = calculate_damage(pikachu, squirtle, thunderbolt, type_chart, rng=random.Random(999))
    assert_equal(first, second, "fixed seed damage")
    assert_equal(first["hit"], True, "fixed seed hit")

    miss_move = dict(thunderbolt)
    miss_move["accuracy"] = 0
    miss = calculate_damage(pikachu, squirtle, miss_move, type_chart, rng=random.Random(1))
    assert_equal(miss["hit"], False, "accuracy miss")
    assert_equal(miss["damage"], 0, "miss damage")

    sure_hit_move = dict(thunderbolt)
    sure_hit_move["accuracy"] = None
    assert_equal(accuracy_check(sure_hit_move, rng=random.Random(1)), True, "None accuracy sure hit")

    critical = calculate_damage(pikachu, squirtle, thunderbolt, type_chart, rng=random.Random(15))
    assert_equal(critical["critical"], True, "critical hit seed")
    assert_equal(critical["critical_multiplier"], 1.5, "critical multiplier")
    r = random.Random(15)
    r.random()
    assert_equal(critical_check(r), True, "critical check helper")

    # Keep an explicit neutral-nature instance around to prove callers can still pass
    # concrete instances generated elsewhere.
    neutral_bulbasaur = generate_pokemon_instance(pokemon[1], {1: hardy}, rng=random.Random(1), ev_style="balanced")
    neutral_damage = calculate_damage(neutral_bulbasaur, squirtle, moves[22], type_chart, rng=random.Random(1))
    assert_true(neutral_damage["damage"] > 0, "neutral generated attacker damage")

    physical_attacker = generate_pokemon_instance(pokemon[133], natures, rng=random.Random(7), ev_style="physical_fast")
    physical_defender = generate_pokemon_instance(pokemon[7], natures, rng=random.Random(8), ev_style="special_fast")
    before_stage = calculate_damage(physical_attacker, physical_defender, tackle, type_chart, rng=random.Random(100))
    apply_stage_changes(physical_attacker, {"attack": 2})
    after_stage = calculate_damage(physical_attacker, physical_defender, tackle, type_chart, rng=random.Random(100))
    assert_true(after_stage["damage"] > before_stage["damage"], "Swords Dance style attack stage raises damage")
    assert_equal(stage_multiplier(2), 2.0, "stage +2 multiplier")
    assert_equal(stage_multiplier(-1), 2 / 3, "stage -1 multiplier")
    assert_true(modified_stat(physical_attacker, "attack") > physical_attacker["stats"]["attack"], "modified attack")

    apply_stage_changes(physical_defender, {"defense": -1})
    lowered_defense_damage = calculate_damage(physical_attacker, physical_defender, tackle, type_chart, rng=random.Random(100))
    assert_true(lowered_defense_damage["damage"] > after_stage["damage"], "lowered defense raises physical damage")

    print(json.dumps({"ok": True, "tests": 25}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
