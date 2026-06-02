#!/usr/bin/env python3
"""Smoke tests for minimal 3v3 battle flow."""

from __future__ import annotations

import json
import os
import random
import sys
from copy import deepcopy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = Path(os.environ.get("POKEMON_DATA_DIR", "/home/alexqfmm/workPlace/pokemonAbout/data"))
sys.path.insert(0, str(ROOT))

from core.battle import (  # noqa: E402
    action_order,
    active_pokemon,
    choose_random_move,
    create_battle_state,
    execute_turn,
    is_fainted,
    make_move_action,
    make_switch_action,
)
from core.damage import load_type_chart  # noqa: E402
from core.data_loader import index_by_id, load_jsonl  # noqa: E402
from core.generator import generate_pokemon_instance  # noqa: E402


def assert_equal(actual, expected, label: str) -> None:
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected}, got {actual}")


def assert_true(value: bool, label: str) -> None:
    if not value:
        raise AssertionError(label)


def with_moves(instance: dict, *moves: dict) -> dict:
    pokemon = deepcopy(instance)
    pokemon["moves"] = []
    for move in moves:
        copied = deepcopy(move)
        copied["pp"] = copied.get("pp") or 1
        pokemon["moves"].append(copied)
    return pokemon


def make_instance(pokemon_rows, natures, pokemon_id: int, ev_style: str, seed: int) -> dict:
    return generate_pokemon_instance(pokemon_rows[pokemon_id], natures, rng=random.Random(seed), ev_style=ev_style)


def main() -> int:
    pokemon_rows = index_by_id(load_jsonl(DATA / "pokemon.jsonl"))
    natures = index_by_id(load_jsonl(DATA / "natures.jsonl"))
    moves = index_by_id(load_jsonl(DATA / "moves.jsonl"))
    type_chart = load_type_chart(load_jsonl(DATA / "type_chart.jsonl"))

    pikachu = with_moves(make_instance(pokemon_rows, natures, 25, "special_fast", 1), moves[85])
    squirtle = with_moves(make_instance(pokemon_rows, natures, 7, "special_fast", 2), moves[55])
    bulbasaur = with_moves(make_instance(pokemon_rows, natures, 1, "special_fast", 3), moves[22])
    charmander = with_moves(make_instance(pokemon_rows, natures, 4, "special_fast", 4), moves[52])
    gastly = with_moves(make_instance(pokemon_rows, natures, 92, "special_fast", 5), moves[247])
    eevee = with_moves(make_instance(pokemon_rows, natures, 133, "physical_fast", 6), moves[33])

    state = create_battle_state([pikachu, bulbasaur, charmander], [squirtle, gastly, eevee])
    assert_equal(action_order(state, make_move_action(0), make_move_action(0)), ["player", "enemy"], "speed order")

    quick_attack = deepcopy(moves[98])
    quick_attack["pp"] = quick_attack.get("pp") or 30
    slow_priority_user = with_moves(make_instance(pokemon_rows, natures, 7, "special_bulk", 7), quick_attack)
    fast_normal_user = with_moves(make_instance(pokemon_rows, natures, 25, "special_fast", 8), moves[33])
    priority_state = create_battle_state([fast_normal_user, bulbasaur, charmander], [slow_priority_user, gastly, eevee])
    assert_equal(action_order(priority_state, make_move_action(0), make_move_action(0)), ["enemy", "player"], "priority order")

    switch_state = create_battle_state([pikachu, bulbasaur, charmander], [squirtle, gastly, eevee])
    old_hp = switch_state["player_team"][0]["current_hp"]
    switched_hp = switch_state["player_team"][1]["current_hp"]
    execute_turn(switch_state, make_switch_action(1), make_move_action(0), type_chart, rng=random.Random(10))
    assert_equal(switch_state["active"]["player"], 1, "switch active")
    assert_equal(switch_state["player_team"][0]["current_hp"], old_hp, "old active avoided damage")
    assert_true(switch_state["player_team"][1]["current_hp"] < switched_hp, "new active took damage")

    faint_state = create_battle_state([pikachu, bulbasaur, charmander], [squirtle, gastly, eevee])
    faint_state["enemy_team"][0]["current_hp"] = 1
    turn = execute_turn(faint_state, make_move_action(0), make_move_action(0), type_chart, rng=random.Random(11))
    assert_true(is_fainted(faint_state["enemy_team"][0]), "enemy active fainted")
    assert_equal(faint_state["active"]["enemy"], 1, "enemy forced next active")
    assert_true(any(event.get("reason") == "active_changed" for event in turn["events"]), "fainted side skipped action")

    winner_state = create_battle_state([pikachu, bulbasaur, charmander], [squirtle, gastly, eevee])
    for enemy in winner_state["enemy_team"]:
        enemy["current_hp"] = 0
    winner_state["enemy_team"][0]["current_hp"] = 1
    execute_turn(winner_state, make_move_action(0), make_move_action(0), type_chart, rng=random.Random(12))
    assert_equal(winner_state["winner"], "player", "all enemy fainted winner")

    random_move_index = choose_random_move(pikachu, rng=random.Random(1))
    assert_equal(random_move_index, 0, "random usable move")

    miss_move = deepcopy(moves[85])
    miss_move["accuracy"] = 0
    miss_move["pp"] = 15
    miss_attacker = with_moves(make_instance(pokemon_rows, natures, 25, "special_fast", 9), miss_move)
    miss_state = create_battle_state([miss_attacker, bulbasaur, charmander], [squirtle, gastly, eevee])
    hp_before = miss_state["enemy_team"][0]["current_hp"]
    execute_turn(miss_state, make_move_action(0), make_switch_action(1), type_chart, rng=random.Random(1))
    assert_equal(miss_state["enemy_team"][0]["current_hp"], hp_before, "miss did not damage")
    assert_equal(miss_state["player_team"][0]["moves"][0]["pp"], 14, "miss consumed PP")

    swords_dance = deepcopy(moves[14])
    swords_dance["pp"] = 20
    setup_attacker = with_moves(make_instance(pokemon_rows, natures, 133, "physical_fast", 20), swords_dance, moves[33])
    setup_state = create_battle_state([setup_attacker, bulbasaur, charmander], [squirtle, gastly, eevee])
    execute_turn(setup_state, make_move_action(0), make_switch_action(1), type_chart, rng=random.Random(20))
    assert_equal(setup_state["player_team"][0]["stat_stages"]["attack"], 2, "Swords Dance attack stage")
    assert_equal(setup_state["player_team"][0]["moves"][0]["pp"], 19, "status move consumed PP")

    tail_whip = deepcopy(moves[39])
    tail_whip["pp"] = 30
    tail_whip_user = with_moves(make_instance(pokemon_rows, natures, 133, "physical_fast", 21), tail_whip)
    tail_whip_state = create_battle_state([tail_whip_user, bulbasaur, charmander], [squirtle, gastly, eevee])
    execute_turn(tail_whip_state, make_move_action(0), make_switch_action(1), type_chart, rng=random.Random(21))
    assert_equal(active_pokemon(tail_whip_state, "enemy")["stat_stages"]["defense"], -1, "Tail Whip target defense stage")

    recover = deepcopy(moves[105])
    recover["pp"] = 10
    healer = with_moves(make_instance(pokemon_rows, natures, 120, "special_bulk", 22), recover)
    heal_state = create_battle_state([healer, bulbasaur, charmander], [squirtle, gastly, eevee])
    heal_state["player_team"][0]["current_hp"] = 1
    heal_turn = execute_turn(heal_state, make_move_action(0), make_switch_action(1), type_chart, rng=random.Random(22))
    heal_event = next(event for event in heal_turn["events"] if event.get("event") == "move")
    assert_true(heal_state["player_team"][0]["current_hp"] > 1, "Recover healed")
    assert_true(heal_state["player_team"][0]["current_hp"] <= heal_state["player_team"][0]["stats"]["hp"], "Recover capped at max")
    assert_true(heal_event["status_result"]["healing"]["amount"] > 0, "Recover event healing")

    agility = deepcopy(moves[97])
    agility["pp"] = 30
    slow_setup = with_moves(make_instance(pokemon_rows, natures, 7, "special_bulk", 23), agility, moves[55])
    fast_foe = with_moves(make_instance(pokemon_rows, natures, 133, "physical_fast", 24), moves[33])
    agility_state = create_battle_state([slow_setup, bulbasaur, charmander], [fast_foe, gastly, eevee])
    assert_equal(action_order(agility_state, make_move_action(1), make_move_action(0)), ["enemy", "player"], "before Agility speed order")
    execute_turn(agility_state, make_move_action(0), make_move_action(0), type_chart, rng=random.Random(23))
    assert_equal(agility_state["player_team"][0]["stat_stages"]["speed"], 2, "Agility speed stage")
    assert_equal(action_order(agility_state, make_move_action(1), make_move_action(0)), ["player", "enemy"], "after Agility speed order")

    missed_tail_whip = deepcopy(moves[39])
    missed_tail_whip["accuracy"] = 0
    missed_tail_whip["pp"] = 30
    missed_status_user = with_moves(make_instance(pokemon_rows, natures, 133, "physical_fast", 25), missed_tail_whip)
    missed_status_state = create_battle_state([missed_status_user, bulbasaur, charmander], [squirtle, gastly, eevee])
    execute_turn(missed_status_state, make_move_action(0), make_switch_action(1), type_chart, rng=random.Random(25))
    assert_equal(missed_status_state["enemy_team"][0].get("stat_stages"), None, "missed status did not apply stage")
    assert_equal(missed_status_state["player_team"][0]["moves"][0]["pp"], 29, "missed status consumed PP")

    clamp_user = with_moves(make_instance(pokemon_rows, natures, 133, "physical_fast", 26), swords_dance)
    clamp_state = create_battle_state([clamp_user, bulbasaur, charmander], [squirtle, gastly, eevee])
    for _ in range(4):
        clamp_state["player_team"][0]["moves"][0]["pp"] = 20
        enemy_target = 1 if clamp_state["active"]["enemy"] == 0 else 0
        execute_turn(clamp_state, make_move_action(0), make_switch_action(enemy_target), type_chart, rng=random.Random(26))
    assert_equal(clamp_state["player_team"][0]["stat_stages"]["attack"], 6, "stage clamps at +6")

    print(json.dumps({"ok": True, "tests": 25}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
