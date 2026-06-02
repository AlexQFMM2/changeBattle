"""Minimal 3v3 battle flow."""

from __future__ import annotations

import random
from copy import deepcopy
from typing import Any, Mapping, Sequence

from .damage import calculate_damage, is_regular_damaging_move, modified_stat
from .move_effects import apply_status_move, is_supported_status_move


def _rng(rng: random.Random | None) -> random.Random:
    return rng if rng is not None else random.Random()


def is_fainted(pokemon: Mapping[str, Any]) -> bool:
    return int(pokemon.get("current_hp", 0)) <= 0


def available_indices(team: Sequence[Mapping[str, Any]]) -> list[int]:
    return [index for index, pokemon in enumerate(team) if not is_fainted(pokemon)]


def first_available_index(team: Sequence[Mapping[str, Any]]) -> int | None:
    indices = available_indices(team)
    return indices[0] if indices else None


def team_has_available(team: Sequence[Mapping[str, Any]]) -> bool:
    return bool(available_indices(team))


def choose_random_move(pokemon: Mapping[str, Any], rng: random.Random | None = None) -> int:
    choices = [
        index
        for index, move in enumerate(pokemon.get("moves", []))
        if int(move.get("pp", 0)) > 0 and (is_regular_damaging_move(move) or is_supported_status_move(move))
    ]
    if not choices:
        raise ValueError("pokemon has no usable moves")
    return _rng(rng).choice(choices)


def make_move_action(move_index: int) -> dict[str, Any]:
    return {"type": "move", "move_index": move_index}


def make_switch_action(target_index: int) -> dict[str, Any]:
    return {"type": "switch", "target_index": target_index}


def create_battle_state(player_team: Sequence[Mapping[str, Any]], enemy_team: Sequence[Mapping[str, Any]]) -> dict[str, Any]:
    if len(player_team) != 3 or len(enemy_team) != 3:
        raise ValueError("step 3 battle requires exactly 3 Pokemon per side")
    state = {
        "player_team": [deepcopy(pokemon) for pokemon in player_team],
        "enemy_team": [deepcopy(pokemon) for pokemon in enemy_team],
        "active": {"player": 0, "enemy": 0},
        "winner": None,
        "turn": 0,
        "log": [],
    }
    update_winner(state)
    return state


def active_pokemon(state: Mapping[str, Any], side: str) -> Mapping[str, Any]:
    return state[f"{side}_team"][state["active"][side]]


def active_pokemon_mut(state: dict[str, Any], side: str) -> dict[str, Any]:
    return state[f"{side}_team"][state["active"][side]]


def update_winner(state: dict[str, Any]) -> str | None:
    player_alive = team_has_available(state["player_team"])
    enemy_alive = team_has_available(state["enemy_team"])
    if player_alive and enemy_alive:
        state["winner"] = None
    elif player_alive:
        state["winner"] = "player"
    elif enemy_alive:
        state["winner"] = "enemy"
    else:
        state["winner"] = "draw"
    return state["winner"]


def switch_active(state: dict[str, Any], side: str, target_index: int) -> dict[str, Any]:
    team = state[f"{side}_team"]
    if not 0 <= target_index < len(team):
        raise ValueError(f"invalid switch target: {target_index}")
    if target_index == state["active"][side]:
        raise ValueError("cannot switch to the active Pokemon")
    if is_fainted(team[target_index]):
        raise ValueError("cannot switch to a fainted Pokemon")
    previous = state["active"][side]
    state["active"][side] = target_index
    event = {"event": "switch", "side": side, "from": previous, "to": target_index}
    state["log"].append(event)
    return event


def force_next_active(state: dict[str, Any], side: str) -> dict[str, Any] | None:
    if not is_fainted(active_pokemon(state, side)):
        return None
    next_index = first_available_index(state[f"{side}_team"])
    if next_index is None:
        update_winner(state)
        return None
    previous = state["active"][side]
    state["active"][side] = next_index
    event = {"event": "force_switch", "side": side, "from": previous, "to": next_index}
    state["log"].append(event)
    return event


def action_priority(state: Mapping[str, Any], side: str, action: Mapping[str, Any]) -> int:
    if action["type"] == "switch":
        return 6
    if action["type"] == "move":
        pokemon = active_pokemon(state, side)
        move = pokemon["moves"][int(action["move_index"])]
        return int(move.get("priority", 0))
    raise ValueError(f"unknown action type: {action['type']}")


def side_speed(state: Mapping[str, Any], side: str) -> int:
    return modified_stat(active_pokemon(state, side), "speed")


def action_order(
    state: Mapping[str, Any],
    player_action: Mapping[str, Any],
    enemy_action: Mapping[str, Any],
    rng: random.Random | None = None,
) -> list[str]:
    player_priority = action_priority(state, "player", player_action)
    enemy_priority = action_priority(state, "enemy", enemy_action)
    if player_priority > enemy_priority:
        return ["player", "enemy"]
    if enemy_priority > player_priority:
        return ["enemy", "player"]
    player_speed = side_speed(state, "player")
    enemy_speed = side_speed(state, "enemy")
    if player_speed > enemy_speed:
        return ["player", "enemy"]
    if enemy_speed > player_speed:
        return ["enemy", "player"]
    sides = ["player", "enemy"]
    _rng(rng).shuffle(sides)
    return sides


def decrement_pp(move: dict[str, Any]) -> None:
    move["pp"] = max(0, int(move.get("pp", 0)) - 1)


def apply_damage(target: dict[str, Any], damage: int) -> None:
    target["current_hp"] = max(0, int(target.get("current_hp", 0)) - int(damage))


def execute_move(
    state: dict[str, Any],
    side: str,
    move_index: int,
    type_chart: Mapping[int, Mapping[int, float]],
    rng: random.Random | None = None,
) -> dict[str, Any]:
    if state["winner"]:
        return {"event": "skipped", "side": side, "reason": "battle_over"}
    attacker = active_pokemon_mut(state, side)
    if is_fainted(attacker):
        return {"event": "skipped", "side": side, "reason": "fainted"}
    target_side = "enemy" if side == "player" else "player"
    defender = active_pokemon_mut(state, target_side)
    move = attacker["moves"][move_index]
    if int(move.get("pp", 0)) <= 0:
        raise ValueError("move has no PP")
    decrement_pp(move)
    if is_regular_damaging_move(move):
        damage_result = calculate_damage(attacker, defender, move, type_chart, rng=rng)
        status_result = None
        apply_damage(defender, damage_result["damage"])
        target_hp = defender["current_hp"]
        damage = damage_result["damage"]
    elif is_supported_status_move(move):
        damage_result = None
        status_result = apply_status_move(attacker, defender, move, rng=rng)
        target_hp = defender["current_hp"]
        damage = 0
    else:
        raise ValueError(f"unsupported move: {move.get('id')} {move.get('name')}")
    event = {
        "event": "move",
        "side": side,
        "target_side": target_side,
        "move_index": move_index,
        "move": move.get("name"),
        "damage": damage,
        "target_hp": target_hp,
        "damage_result": damage_result,
        "status_result": status_result,
    }
    state["log"].append(event)
    if is_fainted(defender):
        fainted = {"event": "faint", "side": target_side, "index": state["active"][target_side]}
        state["log"].append(fainted)
        update_winner(state)
        if not state["winner"]:
            force_next_active(state, target_side)
    return event


def execute_action(
    state: dict[str, Any],
    side: str,
    action: Mapping[str, Any],
    type_chart: Mapping[int, Mapping[int, float]],
    rng: random.Random | None = None,
) -> dict[str, Any]:
    if action["type"] == "switch":
        return switch_active(state, side, int(action["target_index"]))
    if action["type"] == "move":
        return execute_move(state, side, int(action["move_index"]), type_chart, rng=rng)
    raise ValueError(f"unknown action type: {action['type']}")


def execute_turn(
    state: dict[str, Any],
    player_action: Mapping[str, Any],
    enemy_action: Mapping[str, Any],
    type_chart: Mapping[int, Mapping[int, float]],
    *,
    rng: random.Random | None = None,
) -> dict[str, Any]:
    local_rng = _rng(rng)
    state["turn"] += 1
    actions = {"player": player_action, "enemy": enemy_action}
    order = action_order(state, player_action, enemy_action, local_rng)
    starting_active = dict(state["active"])
    turn_events: list[dict[str, Any]] = []
    for side in order:
        if state["winner"]:
            break
        if actions[side]["type"] == "move" and state["active"][side] != starting_active[side]:
            event = {"event": "skipped", "side": side, "reason": "active_changed"}
            state["log"].append(event)
            turn_events.append(event)
            continue
        event = execute_action(state, side, actions[side], type_chart, rng=local_rng)
        turn_events.append(event)
    update_winner(state)
    turn = {"event": "turn", "turn": state["turn"], "order": order, "events": turn_events, "winner": state["winner"]}
    state["log"].append(turn)
    return turn
