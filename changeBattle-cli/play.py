#!/usr/bin/env python3
"""Tiny text-mode 3v3 battle prototype."""

from __future__ import annotations

import argparse
import random
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA = PROJECT_ROOT / "data"
sys.path.insert(0, str(PROJECT_ROOT))

from core.battle import (  # noqa: E402
    active_pokemon,
    available_indices,
    choose_random_move,
    create_battle_state,
    execute_turn,
    is_fainted,
    make_move_action,
    make_switch_action,
)
from core.damage import is_regular_damaging_move, load_type_chart  # noqa: E402
from core.data_loader import index_by_id, load_jsonl  # noqa: E402
from core.generator import generate_random_pokemon_instance  # noqa: E402
from core.move_effects import is_supported_status_move  # noqa: E402


def name_of(obj: dict[str, Any]) -> str:
    name = obj.get("name") or {}
    return name.get("zh_cn") or name.get("en") or str(obj.get("id", "?"))


def load_learnsets(path: Path) -> dict[int, list[int]]:
    result: dict[int, list[int]] = {}
    for row in load_jsonl(path):
        result[int(row["pokemon_id"])] = [int(move["move_id"]) for move in row.get("moves", [])]
    return result


def usable_moves_for(instance: dict[str, Any], learnsets: dict[int, list[int]], moves: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[int] = set()
    candidates: list[dict[str, Any]] = []
    for move_id in learnsets.get(int(instance["template_id"]), []):
        if move_id in seen:
            continue
        seen.add(move_id)
        move = moves.get(move_id)
        if move and (is_regular_damaging_move(move) or is_supported_status_move(move)):
            copied = deepcopy(move)
            copied["pp"] = copied.get("pp") or 1
            candidates.append(copied)
    return candidates


def generate_team(
    pokemon_templates: dict[int, dict[str, Any]],
    natures: dict[int, dict[str, Any]],
    learnsets: dict[int, list[int]],
    moves: dict[int, dict[str, Any]],
    rng: random.Random,
) -> list[dict[str, Any]]:
    team: list[dict[str, Any]] = []
    attempts = 0
    while len(team) < 3 and attempts < 300:
        attempts += 1
        instance = generate_random_pokemon_instance(pokemon_templates, natures, rng=rng)
        candidates = usable_moves_for(instance, learnsets, moves)
        if not candidates:
            continue
        selected = rng.sample(candidates, min(4, len(candidates)))
        instance["moves"] = selected
        team.append(instance)
    if len(team) != 3:
        raise RuntimeError("could not generate a team with usable damaging moves")
    return team


def hp_text(pokemon: dict[str, Any]) -> str:
    return f"{pokemon['current_hp']}/{pokemon['stats']['hp']}"


def print_team(team: list[dict[str, Any]], active_index: int) -> None:
    for index, pokemon in enumerate(team):
        marker = "*" if index == active_index else " "
        fainted = " FNT" if is_fainted(pokemon) else ""
        print(f"{marker}{index + 1}. {name_of(pokemon)} Lv{pokemon['level']} HP {hp_text(pokemon)}{fainted}")


def print_battle(state: dict[str, Any]) -> None:
    player = active_pokemon(state, "player")
    enemy = active_pokemon(state, "enemy")
    print("\n" + "=" * 48)
    print(f"你: {name_of(player)} HP {hp_text(player)}")
    print(f"敌: {name_of(enemy)} HP {hp_text(enemy)}")
    print("-" * 48)
    for index, move in enumerate(player.get("moves", []), start=1):
        power = move.get("power") if move.get("power") is not None else "--"
        print(f"{index}. {name_of(move)} PP {move.get('pp', 0)} Pow {power} Pri {move.get('priority', 0)}")
    print("s2/s3: 换到对应宝可梦, team: 查看队伍, q: 退出")


def parse_player_action(raw: str, state: dict[str, Any]) -> dict[str, Any] | None:
    raw = raw.strip().lower()
    if raw in {"q", "quit", "exit"}:
        raise KeyboardInterrupt
    if raw == "team":
        print("\n你的队伍:")
        print_team(state["player_team"], state["active"]["player"])
        return None
    active = active_pokemon(state, "player")
    if raw.isdigit():
        move_index = int(raw) - 1
        if not 0 <= move_index < len(active.get("moves", [])):
            print("没有这个技能。")
            return None
        if int(active["moves"][move_index].get("pp", 0)) <= 0:
            print("这个技能 PP 不够。")
            return None
        return make_move_action(move_index)
    if raw.startswith("s") and raw[1:].isdigit():
        target_index = int(raw[1:]) - 1
        if target_index not in available_indices(state["player_team"]):
            print("不能换到这个位置。")
            return None
        if target_index == state["active"]["player"]:
            print("它已经在场上了。")
            return None
        return make_switch_action(target_index)
    print("输入技能编号，或 s2/s3 换人。")
    return None


def describe_event(event: dict[str, Any]) -> None:
    kind = event.get("event")
    if kind == "switch":
        print(f"{event['side']} 换人: {event['from'] + 1} -> {event['to'] + 1}")
    elif kind == "force_switch":
        print(f"{event['side']} 强制换人: {event['from'] + 1} -> {event['to'] + 1}")
    elif kind == "move":
        move_name = name_of({"name": event.get("move")})
        damage_result = event.get("damage_result", {})
        status_result = event.get("status_result")
        if status_result is not None:
            if not status_result.get("hit", True):
                print(f"{event['side']} 使用 {move_name}, 但是没有命中")
                return
            healing = status_result.get("healing")
            if healing:
                print(f"{event['side']} 使用 {move_name}, 回复了 {healing['amount']} HP")
                return
            stage_changes = status_result.get("stage_changes") or {}
            if stage_changes:
                changed = ", ".join(f"{stat} {info['before']}->{info['after']}" for stat, info in stage_changes.items())
                print(f"{event['side']} 使用 {move_name}, 能力变化: {changed}")
                return
            print(f"{event['side']} 使用 {move_name}")
            return
        if not damage_result.get("hit", True):
            print(f"{event['side']} 使用 {move_name}, 但是没有命中")
            return
        critical = " 会心一击!" if damage_result.get("critical") else ""
        print(f"{event['side']} 使用 {move_name}, 造成 {event['damage']} 伤害{critical}")
    elif kind == "skipped":
        print(f"{event['side']} 行动跳过: {event.get('reason')}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=int, default=None)
    args = parser.parse_args()
    rng = random.Random(args.seed)

    pokemon = index_by_id(load_jsonl(DATA / "pokemon.jsonl"))
    natures = index_by_id(load_jsonl(DATA / "natures.jsonl"))
    moves = index_by_id(load_jsonl(DATA / "moves.jsonl"))
    learnsets = load_learnsets(DATA / "learnsets_usum.jsonl")
    type_chart = load_type_chart(load_jsonl(DATA / "type_chart.jsonl"))

    player_team = generate_team(pokemon, natures, learnsets, moves, rng)
    enemy_team = generate_team(pokemon, natures, learnsets, moves, rng)
    state = create_battle_state(player_team, enemy_team)

    print("Change Battle CLI - 3v3 prototype")
    if args.seed is not None:
        print(f"seed: {args.seed}")
    print("\n你的队伍:")
    print_team(state["player_team"], state["active"]["player"])

    try:
        while not state["winner"]:
            print_battle(state)
            action = None
            while action is None:
                action = parse_player_action(input("> "), state)
            enemy_move = choose_random_move(active_pokemon(state, "enemy"), rng=rng)
            turn = execute_turn(state, action, make_move_action(enemy_move), type_chart, rng=rng)
            for event in turn["events"]:
                describe_event(event)
    except KeyboardInterrupt:
        print("\n已退出。")
        return 130

    print("\n" + "=" * 48)
    print("你赢了。" if state["winner"] == "player" else "你输了。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
