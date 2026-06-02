#!/usr/bin/env python3
"""Smoke tests for first-step rental Pokemon generation."""

from __future__ import annotations

import json
import os
import random
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = Path(os.environ.get("POKEMON_DATA_DIR", "/home/alexqfmm/workPlace/pokemonAbout/data"))
sys.path.insert(0, str(ROOT))

from core import generate_pokemon_instance, generate_random_pokemon_instance  # noqa: E402
from core.data_loader import index_by_id, load_jsonl  # noqa: E402
from core.generator import EV_TEMPLATES, evs_for_style, legal_ev_styles  # noqa: E402


STAT_KEYS = ("hp", "attack", "defense", "special_attack", "special_defense", "speed")


def assert_equal(actual, expected, label: str) -> None:
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected}, got {actual}")


def assert_true(value: bool, label: str) -> None:
    if not value:
        raise AssertionError(label)


def assert_valid_instance(instance: dict) -> None:
    assert_equal(instance["kind"], "pokemon_instance", "instance kind")
    assert_equal(instance["level"], 50, "instance level")
    assert_equal(instance["ability"], None, "step 1 ability")
    assert_equal(instance["item"], None, "step 1 item")
    assert_equal(instance["moves"], [], "step 1 moves")
    assert_equal(instance["current_hp"], instance["stats"]["hp"], "current hp")
    assert_equal(set(instance["ivs"]), set(STAT_KEYS), "IV stat keys")
    assert_equal(set(instance["evs"]), set(STAT_KEYS), "EV stat keys")
    assert_true(all(value == 31 for value in instance["ivs"].values()), "all IVs are 31")
    assert_true(all(0 <= value <= 252 for value in instance["evs"].values()), "EV range")
    assert_true(sum(instance["evs"].values()) <= 510, "EV total")
    assert_true(instance["generation"]["ev_style"] in EV_TEMPLATES, "EV style is known")


def main() -> int:
    pokemon = index_by_id(load_jsonl(DATA / "pokemon.jsonl"))
    natures = index_by_id(load_jsonl(DATA / "natures.jsonl"))

    charizard = pokemon[6]
    styles = legal_ev_styles(charizard)
    assert_true("special_fast" in styles, "Charizard can use special fast style")

    fixed_style = generate_pokemon_instance(
        charizard,
        natures,
        rng=random.Random(1),
        ev_style="special_fast",
    )
    assert_valid_instance(fixed_style)
    assert_equal(fixed_style["evs"], evs_for_style("special_fast"), "explicit EV style")

    first = generate_random_pokemon_instance(pokemon, natures, rng=random.Random(20260602))
    second = generate_random_pokemon_instance(pokemon, natures, rng=random.Random(20260602))
    assert_equal(first, second, "same seed reproducible")

    different = generate_random_pokemon_instance(pokemon, natures, rng=random.Random(20260603))
    assert_true(first != different, "different seed usually differs")

    rng = random.Random(42)
    for _ in range(100):
        instance = generate_random_pokemon_instance(pokemon, natures, rng=rng)
        assert_valid_instance(instance)

    print(json.dumps({"ok": True, "tests": 105}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
