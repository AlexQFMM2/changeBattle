#!/usr/bin/env python3
"""Smoke tests for stat calculation and Pokemon instancing."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = Path(os.environ.get("POKEMON_DATA_DIR", "/home/alexqfmm/workPlace/pokemonAbout/data"))
sys.path.insert(0, str(ROOT))

from core import create_pokemon_instance  # noqa: E402
from core.data_loader import index_by_id, load_jsonl  # noqa: E402
from core.stats import calculate_stats  # noqa: E402


def assert_equal(actual, expected, label: str) -> None:
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected}, got {actual}")


def main() -> int:
    pokemon = index_by_id(load_jsonl(DATA / "pokemon.jsonl"))
    natures = index_by_id(load_jsonl(DATA / "natures.jsonl"))

    bulbasaur = pokemon[1]
    hardy = natures[1]
    bulbasaur_stats = calculate_stats(bulbasaur["base_stats"], nature=hardy)
    assert_equal(
        bulbasaur_stats,
        {
            "hp": 120,
            "attack": 69,
            "defense": 69,
            "special_attack": 85,
            "special_defense": 85,
            "speed": 65,
        },
        "50级 31IV 0EV 勤奋妙蛙种子",
    )

    charizard = pokemon[6]
    timid = natures[11]
    charizard_stats = calculate_stats(
        charizard["base_stats"],
        nature=timid,
        evs={
            "hp": 0,
            "attack": 0,
            "defense": 0,
            "special_attack": 252,
            "special_defense": 4,
            "speed": 252,
        },
    )
    assert_equal(
        charizard_stats,
        {
            "hp": 153,
            "attack": 93,
            "defense": 98,
            "special_attack": 161,
            "special_defense": 106,
            "speed": 167,
        },
        "50级 31IV 胆小 252特攻252速度喷火龙",
    )

    shedinja = next(row for row in pokemon.values() if row["national_dex_id"] == 292)
    shedinja_instance = create_pokemon_instance(shedinja, nature=hardy)
    assert_equal(shedinja_instance["stats"]["hp"], 1, "脱壳忍者 HP")
    assert_equal(shedinja_instance["level"], 50, "默认等级")
    assert_equal(shedinja_instance["kind"], "pokemon_instance", "实例类型")

    print(json.dumps({"ok": True, "tests": 4}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
