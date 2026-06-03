#!/usr/bin/env python3
"""Text-mode Battle Factory loop powered by Pokemon Showdown."""

from __future__ import annotations

import argparse
import random
import sys
import unicodedata
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from core.i18n import normalize_id, zh, zh_condition, zh_detail, zh_plain  # noqa: E402
from core.showdown_client import ShowdownClient  # noqa: E402


DEFAULT_BATTLES = 7
STAT_ROWS = [
    ("hp", "HP"),
    ("atk", "攻击"),
    ("def", "防御"),
    ("spa", "特攻"),
    ("spd", "特防"),
    ("spe", "速度"),
]
SIDE_NAMES = {"p1": "玩家", "p2": "对手"}


def seed_for(base: int | None, salt: int) -> int:
    value = 0xC0FFEE if base is None else int(base)
    return (value * 1103515245 + 12345 + salt * 2654435761) & 0xFFFFFFFF


def display_name(pokemon: dict[str, Any]) -> str:
    raw = pokemon.get("species") or pokemon.get("name") or "Unknown"
    return zh("species", raw)


def move_names(pokemon: dict[str, Any]) -> list[str]:
    moves = pokemon.get("moves") or []
    result = []
    for move in moves:
        if isinstance(move, dict):
            raw = move.get("name") or move.get("id") or "?"
        else:
            raw = str(move)
        result.append(zh("moves", raw))
    return result


def print_set(index: int, pokemon: dict[str, Any]) -> None:
    item = zh("items", pokemon.get("item"), fallback="无道具")
    ability = zh("abilities", pokemon.get("ability"), fallback="无特性")
    level = pokemon.get("level") or "?"
    role = f" [{zh_plain('roles', pokemon['role'])}]" if pokemon.get("role") else ""
    moves = " / ".join(move_names(pokemon))
    print(f"{index}. {display_name(pokemon)} Lv{level}{role}")
    print(f"   特性: {ability} | 道具: {item}")
    print(f"   招式: {moves}")


def print_team(title: str, team: list[dict[str, Any]]) -> None:
    print(f"\n{title}")
    for index, pokemon in enumerate(team, start=1):
        print_set(index, pokemon)


def visible_width(text: object) -> int:
    width = 0
    for char in str(text):
        width += 2 if unicodedata.east_asian_width(char) in {"F", "W"} else 1
    return width


def pad_cell(text: object, width: int) -> str:
    raw = str(text)
    return raw + " " * max(0, width - visible_width(raw))


def wrap_cell(text: object, width: int) -> list[str]:
    raw = str(text)
    if not raw:
        return [""]
    lines: list[str] = []
    for paragraph in raw.splitlines():
        current = ""
        for char in paragraph:
            char_width = visible_width(char)
            if current and visible_width(current) + char_width > width:
                lines.append(current)
                current = char
            else:
                current += char
        lines.append(current)
    return lines or [""]


def print_table(
    headers: list[str],
    rows: list[list[object]],
    widths: list[int],
    *,
    compact: bool = False,
    dividers_before: set[int] | None = None,
) -> None:
    dividers_before = dividers_before or set()
    sep = "+" + "+".join("-" * (width + 2) for width in widths) + "+"
    print(sep)
    print("| " + " | ".join(pad_cell(header, widths[index]) for index, header in enumerate(headers)) + " |")
    print(sep)
    for row_index, row in enumerate(rows):
        if compact and row_index in dividers_before:
            print(sep)
        wrapped = [wrap_cell(cell, widths[index]) for index, cell in enumerate(row)]
        height = max(len(cell_lines) for cell_lines in wrapped)
        for line_index in range(height):
            cells = []
            for index, cell_lines in enumerate(wrapped):
                value = cell_lines[line_index] if line_index < len(cell_lines) else ""
                cells.append(pad_cell(value, widths[index]))
            print("| " + " | ".join(cells) + " |")
        if not compact:
            print(sep)
    if compact:
        print(sep)


def clear_screen() -> None:
    if sys.stdout.isatty():
        print("\033[2J\033[H", end="")


def stat_display(pokemon: dict[str, Any], stat: str) -> str:
    stats = pokemon.get("stats") or {}
    ivs = pokemon.get("ivs") or {}
    evs = pokemon.get("evs") or {}
    base = pokemon.get("base_stats") or {}
    nature_plus = pokemon.get("nature_plus")
    nature_minus = pokemon.get("nature_minus")
    marker = " ↑" if nature_plus == stat else " ↓" if nature_minus == stat else ""
    return f"{stats.get(stat, '?')} ({base.get(stat, '?')} | {ivs.get(stat, 31)} | {evs.get(stat, 0)}){marker}"


def nature_text(pokemon: dict[str, Any]) -> str:
    nature = pokemon.get("nature") or "Serious"
    plus = pokemon.get("nature_plus") or ""
    minus = pokemon.get("nature_minus") or ""
    if plus and minus:
        return f"{zh('natures', nature)}：{zh_plain('stats', plus)}↑ / {zh_plain('stats', minus)}↓"
    return f"{zh('natures', nature)}：无修正"


def type_text(types: list[str]) -> str:
    return " / ".join(zh_plain("types", type_name) for type_name in types) if types else "未知"


def move_effect_text(move: dict[str, Any]) -> str:
    name = move.get("name") or move.get("id")
    detail = zh_detail("moves", name)
    return detail.get("description") or move.get("short_desc") or move.get("desc") or "暂无说明"


def move_power_text(move: dict[str, Any]) -> str:
    power = move.get("power")
    return "--" if not power else str(power)


def move_accuracy_text(move: dict[str, Any]) -> str:
    accuracy = move.get("accuracy")
    return "必中" if accuracy in {None, True} else str(accuracy)


def move_summary(move: dict[str, Any]) -> str:
    move_name = zh("moves", move.get("name") or move.get("id"))
    move_type = zh_plain("types", move.get("type")) or move.get("type") or "?"
    category = zh_plain("categories", move.get("category")) or move.get("category") or "?"
    return (
        f"{move_name} "
        f"[{move_type}/{category} 威{move_power_text(move)} 命{move_accuracy_text(move)} PP{move.get('pp') or '?'}]"
    )


def render_candidate_page(candidates: list[dict[str, Any]], current: int, selected: list[int]) -> None:
    clear_screen()
    pokemon = candidates[current]
    selected_text = " / ".join(
        f"{index + 1}.{zh_plain('species', candidates[index].get('species') or candidates[index].get('name'))}"
        for index in selected
    ) or "无"
    mark = "已选中" if current in selected else "未选中"
    print("=" * 128)
    print(f"候选 {current + 1}/{len(candidates)}  |  当前：{mark}  |  已选：{selected_text}")
    print("=" * 128)
    print(f"{display_name(pokemon)}  Lv{pokemon.get('level', '?')}  [{zh_plain('roles', pokemon.get('role')) or '未分类'}]")

    ability = pokemon.get("ability") or "No Ability"
    item = pokemon.get("item") or "No item"
    ability_desc = zh_detail("abilities", ability).get("description") or pokemon.get("ability_short_desc") or pokemon.get("ability_desc") or "暂无说明"
    item_desc = zh_detail("items", item).get("description") or pokemon.get("item_short_desc") or pokemon.get("item_desc") or "暂无说明"

    right_rows = [
        ["属性", type_text(pokemon.get("types") or []), ""],
        ["性格", nature_text(pokemon), "能力格式：最终值 (种族值 | 个体值 | 努力值)，↑/↓ 表示性格修正。"],
        ["特性", zh("abilities", ability), ability_desc],
        ["道具", zh("items", item, fallback="无道具"), item_desc],
    ]
    for index, move in enumerate(pokemon.get("moves") or [], start=1):
        right_rows.append([
            f"招式{index}",
            move_summary(move),
            move_effect_text(move),
        ])

    rows = []
    row_count = max(len(STAT_ROWS), len(right_rows))
    for index in range(row_count):
        if index < len(STAT_ROWS):
            stat, label = STAT_ROWS[index]
            left = [label, stat_display(pokemon, stat)]
        else:
            left = ["", ""]
        right = right_rows[index] if index < len(right_rows) else ["", "", ""]
        rows.append(left + right)

    print_table(
        ["能力", "数值", "项目", "名称/参数", "说明"],
        rows,
        [6, 25, 8, 34, 50],
        compact=True,
        dividers_before={2, 4},
    )
    print("操作：n 下一只 | p 上一只 | t 选中/取消（选满 3 只自动开始） | 1-6 跳转 | q 退出")


def create_battle_tracker() -> dict[str, Any]:
    return {
        "turn": 0,
        "active": {"p1": {}, "p2": {}},
        "boosts": {"p1": {}, "p2": {}},
        "side_conditions": {"p1": [], "p2": []},
        "weather": "无",
        "field": [],
        "pp": {},
    }


def side_from_ident(raw: str) -> str | None:
    if raw.startswith("p1"):
        return "p1"
    if raw.startswith("p2"):
        return "p2"
    return None


def condition_hp(condition: str | None) -> str:
    if not condition:
        return "?"
    return zh_condition(condition)


def boost_text(boosts: dict[str, int]) -> str:
    if not boosts:
        return "无"
    parts = []
    for stat, value in boosts.items():
        if value:
            sign = "+" if value > 0 else ""
            parts.append(f"{zh_plain('stats', stat)}{sign}{value}")
    return " / ".join(parts) if parts else "无"


def side_conditions_text(tracker: dict[str, Any], side: str) -> str:
    values = tracker.get("side_conditions", {}).get(side) or []
    return " / ".join(values) if values else "无"


def field_text(tracker: dict[str, Any]) -> str:
    values = tracker.get("field") or []
    return " / ".join(values) if values else "无"


def effect_name(raw: str) -> str:
    value = raw.replace("[from] ", "").replace("[of] ", "")
    value = value.replace("move: ", "").replace("item: ", "").replace("ability: ", "")
    if value == "drain":
        return "吸取效果"
    for section in ["moves", "items", "abilities", "statuses"]:
        translated = zh_plain(section, value)
        if translated != value:
            return translated
    return value


def event_source(parts: list[str], target_ident: str | None = None) -> str:
    source = ""
    source_owner = ""
    for part in parts[4:]:
        if part.startswith("[from] "):
            raw = part.replace("[from] ", "")
            if raw.startswith("item: "):
                source = f"道具：{zh_plain('items', raw.replace('item: ', ''))}"
            elif raw.startswith("ability: "):
                source = f"特性：{zh_plain('abilities', raw.replace('ability: ', ''))}"
            elif raw.startswith("move: "):
                source = f"招式：{zh_plain('moves', raw.replace('move: ', ''))}"
            elif raw == "drain":
                source = "吸取效果"
            else:
                source = effect_name(raw)
        elif part.startswith("[of] "):
            source_owner = short_ident_zh(part.replace("[of] ", ""))
    target = short_ident_zh(target_ident or "")
    if source and source != "吸取效果" and source_owner and source_owner != target:
        return f"{source_owner} 的{source}"
    return source


def update_pp_memory(tracker: dict[str, Any], request: dict[str, Any] | None) -> None:
    if not request:
        return
    active = ((request.get("side") or {}).get("pokemon") or [{}])[0]
    active_name = short_ident(active.get("ident", ""))
    if not active_name:
        return
    active_moves = (request.get("active") or [{}])[0].get("moves") or []
    if active_moves:
        tracker.setdefault("pp", {})[active_name] = {
            move.get("id") or move.get("move"): {
                "name": move.get("move") or move.get("id"),
                "pp": move.get("pp"),
                "maxpp": move.get("maxpp"),
            }
            for move in active_moves
        }


def select_three(candidates: list[dict[str, Any]], auto: bool) -> list[int]:
    if auto:
        print_team("租赁候选 6 选 3:", candidates)
        print("\n--auto: 自动选择 1 2 3")
        return [0, 1, 2]

    current = 0
    selected: list[int] = []
    while True:
        render_candidate_page(candidates, current, selected)
        raw = input("> ").strip().lower()
        if raw in {"q", "quit", "exit"}:
            raise KeyboardInterrupt
        if raw in {"n", "next", "下一只", "下"}:
            current = (current + 1) % len(candidates)
            continue
        if raw in {"p", "prev", "previous", "上一只", "上"}:
            current = (current - 1) % len(candidates)
            continue
        if raw in {"t", "toggle", "select", "选", "取消"}:
            if current in selected:
                selected.remove(current)
            elif len(selected) >= 3:
                print("已经选满 3 只了。要换人请先取消一个。")
            else:
                selected.append(current)
                if len(selected) == 3:
                    return selected
            continue
        if raw.isdigit():
            index = int(raw) - 1
            if 0 <= index < len(candidates):
                current = index
            else:
                print("编号需要在 1-6 之间。")
            continue
        if raw in {"ok", "start", "go", "确定", "开始"}:
            if len(selected) == 3:
                return selected
            print(f"还需要选择 {3 - len(selected)} 只。")
            continue
        print("请输入 n/p/t/1-6/ok/q。")


def split_log_lines(messages: list[dict[str, Any]]) -> list[str]:
    lines: list[str] = []
    for message in messages:
        if message.get("type") != "update":
            continue
        for line in str(message.get("data", "")).splitlines():
            if line and not line.startswith("|request|"):
                lines.append(line)
    return lines


def short_ident(raw: str) -> str:
    value = raw.split("|")[0].strip()
    if ":" in value:
        value = value.split(":", 1)[1].strip()
    return value


def short_ident_zh(raw: str) -> str:
    return zh("species", short_ident(raw))


def winner_zh(raw: str) -> str:
    if raw == "Player":
        return "玩家"
    if raw == "Enemy":
        return "对手"
    if raw == "tie":
        return "平局"
    return raw


def add_unique(values: list[str], value: str) -> None:
    if value and value not in values:
        values.append(value)


def remove_value(values: list[str], value: str) -> None:
    if value in values:
        values.remove(value)


def condition_from_switch(parts: list[str]) -> str:
    return parts[4] if len(parts) > 4 else "?"


def consume_log(messages: list[dict[str, Any]], tracker: dict[str, Any]) -> list[str]:
    events: list[str] = []
    last_printed = None
    for line in split_log_lines(messages):
        parts = line.split("|")
        tag = parts[1] if len(parts) > 1 else ""
        text = None
        if tag == "turn" and len(parts) > 2:
            tracker["turn"] = int(parts[2])
            text = f"\n--- 第 {parts[2]} 回合 ---"
        elif tag == "switch" and len(parts) > 3:
            side = side_from_ident(parts[2])
            if side:
                tracker["active"][side] = {"name": short_ident(parts[2]), "condition": condition_from_switch(parts), "status": ""}
                tracker["boosts"][side] = {}
            text = f"{short_ident_zh(parts[2])} 上场了。"
        elif tag == "drag" and len(parts) > 3:
            side = side_from_ident(parts[2])
            if side:
                tracker["active"][side] = {"name": short_ident(parts[2]), "condition": condition_from_switch(parts), "status": ""}
                tracker["boosts"][side] = {}
            text = f"{short_ident_zh(parts[2])} 被拖上场。"
        elif tag == "move" and len(parts) > 3:
            text = f"{short_ident_zh(parts[2])} 使用 {zh('moves', parts[3])}。"
        elif tag == "-damage" and len(parts) > 3:
            side = side_from_ident(parts[2])
            if side:
                tracker["active"].setdefault(side, {})["name"] = short_ident(parts[2])
                tracker["active"][side]["condition"] = parts[3]
            source = event_source(parts, parts[2])
            if source:
                text = f"{short_ident_zh(parts[2])} 受到 {source} 的影响，HP: {zh_condition(parts[3])}"
            else:
                text = f"{short_ident_zh(parts[2])} HP: {zh_condition(parts[3])}"
        elif tag == "-heal" and len(parts) > 3:
            side = side_from_ident(parts[2])
            if side:
                tracker["active"].setdefault(side, {})["name"] = short_ident(parts[2])
                tracker["active"][side]["condition"] = parts[3]
            source = event_source(parts, parts[2])
            if source:
                text = f"{short_ident_zh(parts[2])} 触发{source}，回复到 {zh_condition(parts[3])}"
            else:
                text = f"{short_ident_zh(parts[2])} 回复到 {zh_condition(parts[3])}"
        elif tag == "-status" and len(parts) > 3:
            side = side_from_ident(parts[2])
            if side:
                tracker["active"].setdefault(side, {})["status"] = parts[3]
            text = f"{short_ident_zh(parts[2])} 陷入 {zh_plain('statuses', parts[3])}"
        elif tag == "-curestatus" and len(parts) > 3:
            side = side_from_ident(parts[2])
            if side:
                tracker["active"].setdefault(side, {})["status"] = ""
            text = f"{short_ident_zh(parts[2])} 解除 {zh_plain('statuses', parts[3])}"
        elif tag == "-boost" and len(parts) > 4:
            side = side_from_ident(parts[2])
            if side:
                boosts = tracker.setdefault("boosts", {}).setdefault(side, {})
                boosts[parts[3]] = max(-6, min(6, int(boosts.get(parts[3], 0)) + int(parts[4])))
            text = f"{short_ident_zh(parts[2])} {zh_plain('stats', parts[3])} +{parts[4]}"
        elif tag == "-unboost" and len(parts) > 4:
            side = side_from_ident(parts[2])
            if side:
                boosts = tracker.setdefault("boosts", {}).setdefault(side, {})
                boosts[parts[3]] = max(-6, min(6, int(boosts.get(parts[3], 0)) - int(parts[4])))
            text = f"{short_ident_zh(parts[2])} {zh_plain('stats', parts[3])} -{parts[4]}"
        elif tag in {"-clearboost", "-clearallboost"}:
            for side in ["p1", "p2"]:
                tracker["boosts"][side] = {}
            text = "能力变化被清除了。"
        elif tag == "-supereffective":
            text = "效果拔群！"
        elif tag == "-resisted":
            text = "效果不理想。"
        elif tag == "-immune" and len(parts) > 2:
            text = f"{short_ident_zh(parts[2])} 没有效果。"
        elif tag == "-miss" and len(parts) > 2:
            text = f"{short_ident_zh(parts[2])} 没有命中。"
        elif tag == "-crit":
            text = "会心一击！"
        elif tag == "faint" and len(parts) > 2:
            side = side_from_ident(parts[2])
            if side:
                tracker["active"].setdefault(side, {})["condition"] = "0 濒死"
            text = f"{short_ident_zh(parts[2])} 倒下了。"
        elif tag == "-weather" and len(parts) > 2:
            tracker["weather"] = effect_name(parts[2]) if parts[2] != "none" else "无"
            text = f"天气：{tracker['weather']}"
        elif tag == "-fieldstart" and len(parts) > 2:
            add_unique(tracker["field"], effect_name(parts[2]))
            text = f"场地效果开始：{tracker['field'][-1]}"
        elif tag == "-fieldend" and len(parts) > 2:
            value = effect_name(parts[2])
            remove_value(tracker["field"], value)
            text = f"场地效果结束：{value}"
        elif tag == "-sidestart" and len(parts) > 3:
            side = side_from_ident(parts[2])
            if side:
                value = effect_name(parts[3])
                add_unique(tracker["side_conditions"][side], value)
                text = f"{SIDE_NAMES[side]} 场地出现：{value}"
        elif tag == "-sideend" and len(parts) > 3:
            side = side_from_ident(parts[2])
            if side:
                value = effect_name(parts[3])
                remove_value(tracker["side_conditions"][side], value)
                text = f"{SIDE_NAMES[side]} 场地移除：{value}"
        elif tag == "-item" and len(parts) > 3:
            text = f"{short_ident_zh(parts[2])} 的道具显现：{zh('items', parts[3].replace('item: ', ''))}"
        elif tag == "-enditem" and len(parts) > 3:
            text = f"{short_ident_zh(parts[2])} 消耗/失去道具：{zh('items', parts[3].replace('item: ', ''))}"
        elif tag == "-ability" and len(parts) > 3:
            text = f"{short_ident_zh(parts[2])} 的特性发动：{zh('abilities', parts[3].replace('ability: ', ''))}"
        elif tag == "-activate" and len(parts) > 3:
            source = parts[3]
            if source.startswith("item: "):
                text = f"{short_ident_zh(parts[2])} 触发道具：{zh('items', source.replace('item: ', ''))}"
            elif source.startswith("ability: "):
                text = f"{short_ident_zh(parts[2])} 触发特性：{zh('abilities', source.replace('ability: ', ''))}"
            elif source.startswith("move: "):
                text = f"{short_ident_zh(parts[2])} 触发招式效果：{zh('moves', source.replace('move: ', ''))}"
            else:
                text = f"{short_ident_zh(parts[2])} 触发效果：{source}"
        elif tag == "win" and len(parts) > 2:
            text = f"\n胜者: {winner_zh(parts[2])}"
        elif tag == "tie":
            text = "\n平局。"
        if text is not None and text != last_printed:
            events.append(text)
            last_printed = text
    return events


def request_for(response: dict[str, Any], side: str) -> dict[str, Any] | None:
    return (response.get("requests") or {}).get(side)


def condition_text(pokemon: dict[str, Any]) -> str:
    return zh_condition(pokemon.get("condition") or "?")


def is_fainted(pokemon: dict[str, Any]) -> bool:
    return str(pokemon.get("condition", "")).endswith(" fnt")


def can_switch_to(pokemon: dict[str, Any]) -> bool:
    return not pokemon.get("active") and not is_fainted(pokemon)


def print_side(request: dict[str, Any]) -> None:
    side = request.get("side") or {}
    print("\n你的队伍:")
    for index, pokemon in enumerate(side.get("pokemon") or [], start=1):
        marker = "*" if pokemon.get("active") else " "
        item = zh_plain("items", pokemon.get("item")) or "无道具"
        print(f"{marker}{index}. {short_ident_zh(pokemon.get('ident', '?'))} HP {condition_text(pokemon)} 道具 {item}")


def active_summary(tracker: dict[str, Any], side: str) -> str:
    active = tracker.get("active", {}).get(side) or {}
    name = active.get("name")
    if not name:
        return "未知"
    condition = condition_hp(active.get("condition"))
    status = active.get("status")
    status_label = zh_plain("statuses", status) if status else ""
    status_text = f" {status_label}" if status_label and status_label not in condition else ""
    boosts = boost_text(tracker.get("boosts", {}).get(side) or {})
    return f"{zh('species', name)} HP {condition}{status_text} | 能力变化 {boosts}"


def battle_team_rows(request: dict[str, Any]) -> list[list[object]]:
    rows = []
    for index, pokemon in enumerate((request.get("side") or {}).get("pokemon") or [], start=1):
        marker = "*" if pokemon.get("active") else " "
        item = zh_plain("items", pokemon.get("item")) or "无道具"
        rows.append([
            f"{marker}{index}",
            short_ident_zh(pokemon.get("ident", "?")),
            condition_text(pokemon),
            item,
        ])
    return rows


def runtime_species_name(runtime: dict[str, Any] | None) -> str:
    if not runtime:
        return ""
    ident = short_ident(runtime.get("ident", ""))
    if ident:
        return ident
    details = str(runtime.get("details") or "")
    if details:
        return details.split(",", 1)[0].strip()
    return str(runtime.get("species") or runtime.get("name") or "")


def display_species_name(pokemon: dict[str, Any] | None) -> str:
    if not pokemon:
        return ""
    return str(pokemon.get("species") or pokemon.get("name") or pokemon.get("species_id") or "")


def display_for_runtime(
    player_display: list[dict[str, Any]],
    runtime: dict[str, Any] | None,
    fallback_index: int,
) -> dict[str, Any] | None:
    runtime_key = normalize_id(runtime_species_name(runtime))
    if runtime_key:
        for pokemon in player_display:
            if normalize_id(display_species_name(pokemon)) == runtime_key:
                return pokemon
    if 0 <= fallback_index < len(player_display):
        return player_display[fallback_index]
    return None


def move_button_rows(request: dict[str, Any]) -> list[list[object]]:
    active = (request.get("active") or [{}])[0]
    moves = active.get("moves") or []
    labels = []
    for index, move in enumerate(moves, start=1):
        disabled = " [不可用]" if move.get("disabled") else ""
        labels.append(f"{index}. {zh('moves', move.get('move', '?'))} PP {move.get('pp', '?')}/{move.get('maxpp', '?')}{disabled}")
    while len(labels) < 4:
        labels.append("")
    return [[labels[0], labels[1]], [labels[2], labels[3]]]


def render_battle_header(tracker: dict[str, Any]) -> None:
    clear_screen()
    turn = tracker.get("turn") or 1
    print("=" * 112)
    print(f"第 {turn} 回合")
    print("=" * 112)
    print_table(
        ["你的宝可梦", "VS", "对手宝可梦"],
        [[active_summary(tracker, "p1"), "VS", active_summary(tracker, "p2")]],
        [54, 4, 54],
        compact=True,
    )


def render_main_menu(request: dict[str, Any], tracker: dict[str, Any]) -> None:
    render_battle_header(tracker)
    if request.get("forceSwitch"):
        print("当前必须换人。请选择：")
        print("1. 队伍 / 换人")
        print("2. 对局状态")
        print("3. 认输")
        print("q. 退出")
        return
    print("请选择行动：")
    print("1. 技能")
    print("2. 道具（暂未开放）")
    print("3. 队伍 / 换人")
    print("4. 对局状态")
    print("5. 认输")
    print("q. 退出")


def show_move_menu(request: dict[str, Any], tracker: dict[str, Any]) -> str | None:
    while True:
        render_battle_header(tracker)
        print_table(["技能1 / 技能3", "技能2 / 技能4"], move_button_rows(request), [52, 52], compact=True)
        print("选择技能 1/2/3/4，b 返回。")
        raw = input("> ").strip().lower()
        if raw in {"b", "back", "返回"}:
            return None
        if raw in {"q", "quit", "exit"}:
            raise KeyboardInterrupt
        if raw.isdigit():
            move_index = int(raw)
            moves = ((request.get("active") or [{}])[0].get("moves") or [])
            if 1 <= move_index <= len(moves) and not moves[move_index - 1].get("disabled"):
                return f"move {move_index}"
            print("这个招式不可用。")
            input("回车继续。")


def show_team_menu(request: dict[str, Any], player_display: list[dict[str, Any]], tracker: dict[str, Any]) -> str | None:
    while True:
        render_battle_header(tracker)
        print_table(["#", "你的队伍", "HP/状态", "实时道具"], battle_team_rows(request), [4, 34, 22, 22], compact=True)
        print("输入 1/2/3 查看详情，s2/s3 换人，b 返回。")
        raw = input("> ").strip().lower()
        if raw in {"b", "back", "返回"}:
            return None
        if raw in {"q", "quit", "exit"}:
            raise KeyboardInterrupt
        if raw.startswith("s") and raw[1:].isdigit():
            index = int(raw[1:])
            if index in legal_switch_indexes(request):
                return f"switch {index}"
            print("不能换到这个位置。")
            input("回车继续。")
            continue
        if raw.isdigit():
            index = int(raw)
            side_pokemon = (request.get("side") or {}).get("pokemon") or []
            if 1 <= index <= len(side_pokemon):
                runtime = side_pokemon[index - 1]
                base = display_for_runtime(player_display, runtime, index - 1)
                clear_screen()
                if base:
                    render_runtime_detail(base, runtime, tracker)
                else:
                    print("没有找到这只宝可梦的详细模板。")
                input("回车返回队伍。")
            else:
                print("编号需要在 1-3 之间。")
                input("回车继续。")


def show_battle_status_menu(tracker: dict[str, Any], recent_events: list[str]) -> None:
    clear_screen()
    print("=" * 112)
    print("对局状态")
    print("=" * 112)
    print_table(
        ["天气", "全场状态", "我方场地", "对手场地"],
        [[tracker.get("weather") or "无", field_text(tracker), side_conditions_text(tracker, "p1"), side_conditions_text(tracker, "p2")]],
        [18, 30, 30, 30],
        compact=True,
    )
    print_table(
        ["你的宝可梦", "对手宝可梦"],
        [[active_summary(tracker, "p1"), active_summary(tracker, "p2")]],
        [54, 54],
        compact=True,
    )
    print("最近战报:")
    if recent_events:
        for event in recent_events[-12:]:
            if event.strip():
                print(event)
    else:
        print("无")
    input("回车返回。")


def confirm_forfeit() -> bool:
    raw = input("确定认输吗？输入 yes 确认，其它返回 > ").strip().lower()
    return raw in {"yes", "y", "认输", "确定"}


def last_turn_events(recent_events: list[str], limit: int = 6) -> list[str]:
    filtered = []
    for event in recent_events:
        stripped = event.strip()
        if not stripped or stripped.startswith("--- 第"):
            continue
        filtered.append(stripped)
    return filtered[-limit:]


def render_battle_screen(request: dict[str, Any], tracker: dict[str, Any], recent_events: list[str]) -> None:
    render_battle_header(tracker)
    events = last_turn_events(recent_events)
    if events:
        print("\n上一回合：")
        for event in events:
            print(event)
    print()
    if request.get("forceSwitch"):
        print("当前必须换人。请选择：")
        print("1. 队伍 / 换人")
        print("2. 对局状态")
        print("3. 认输")
        print("q. 退出")
        return
    print("请选择行动：")
    print("1. 技能")
    print("2. 道具（暂未开放）")
    print("3. 队伍 / 换人")
    print("4. 对局状态")
    print("5. 认输")
    print("q. 退出")


def legacy_render_battle_screen(request: dict[str, Any], tracker: dict[str, Any], recent_events: list[str]) -> None:
    clear_screen()
    turn = tracker.get("turn") or 1
    print("=" * 112)
    print(f"第 {turn} 回合")
    print("=" * 112)
    print_table(
        ["你的宝可梦", "VS", "对手宝可梦"],
        [[active_summary(tracker, "p1"), "VS", active_summary(tracker, "p2")]],
        [54, 4, 54],
        compact=True,
    )
    print_table(
        ["天气", "全场状态", "我方场地", "对手场地"],
        [[tracker.get("weather") or "无", field_text(tracker), side_conditions_text(tracker, "p1"), side_conditions_text(tracker, "p2")]],
        [18, 30, 30, 30],
        compact=True,
    )
    print_table(["#", "你的队伍", "HP/状态", "实时道具"], battle_team_rows(request), [4, 34, 22, 22], compact=True)

    if request.get("forceSwitch"):
        print("必须换人。输入 s2/s3 选择可用后备。")
        print("输入 team 查看队伍详情，field 查看场地，q 退出。")
        return
    print_table(["技能1 / 技能3", "技能2 / 技能4"], move_button_rows(request), [52, 52], compact=True)
    if recent_events:
        print("最近战报:")
        for event in recent_events[-10:]:
            if event.strip():
                print(event)
    else:
        print("最近战报: 无")
    print("输入 1/2/3/4 使用招式，s2/s3 换人，team 查看队伍详情，field 查看场地，q 退出。")


def request_move_pp(tracker: dict[str, Any], pokemon_name: str, move: dict[str, Any]) -> str:
    move_id = move.get("id") or move.get("name")
    move_name = move.get("name") or move.get("id")
    pp_memory = tracker.get("pp", {}).get(pokemon_name, {})
    memory = pp_memory.get(move_id) or pp_memory.get(move_name)
    if memory:
        return f"{memory.get('pp', '?')}/{memory.get('maxpp', '?')}"
    max_pp = move.get("pp") or "?"
    return f"{max_pp}/{max_pp}"


def render_runtime_detail(base: dict[str, Any], runtime: dict[str, Any] | None, tracker: dict[str, Any]) -> None:
    runtime = runtime or {}
    print("=" * 128)
    print(f"{display_name(base)}  Lv{base.get('level', '?')}  HP {condition_text(runtime) if runtime else '未知'}")
    print(f"实时道具：{zh('items', runtime.get('item'), fallback=zh('items', base.get('item'), fallback='无道具'))}")
    pokemon_name = base.get("species") or base.get("name") or short_ident(runtime.get("ident", ""))
    stat_rows = [[label, stat_display(base, stat)] for stat, label in STAT_ROWS]
    print_table(["能力", "数值"], stat_rows, [8, 30], compact=True)
    move_rows = []
    for index, move in enumerate(base.get("moves") or [], start=1):
        move_rows.append([
            index,
            move_summary(move),
            request_move_pp(tracker, pokemon_name, move),
            move_effect_text(move),
        ])
    print_table(["#", "招式", "实时PP", "效果"], move_rows, [3, 44, 8, 58], compact=True)


def show_team_detail_menu(request: dict[str, Any], player_display: list[dict[str, Any]], tracker: dict[str, Any]) -> None:
    side_pokemon = (request.get("side") or {}).get("pokemon") or []
    print_side(request)
    raw = input("查看哪只的详细信息？输入 1-3，回车返回 > ").strip()
    if not raw:
        return
    if not raw.isdigit():
        print("请输入编号。")
        input("回车继续。")
        return
    index = int(raw) - 1
    if not 0 <= index < len(player_display):
        print("编号需要在 1-3 之间。")
        input("回车继续。")
        return
    runtime = side_pokemon[index] if index < len(side_pokemon) else None
    base = display_for_runtime(player_display, runtime, index)
    clear_screen()
    if base:
        render_runtime_detail(base, runtime, tracker)
    else:
        print("没有找到这只宝可梦的详细模板。")
    input("回车返回对战。")


def show_field_detail(tracker: dict[str, Any]) -> None:
    print_table(
        ["天气", "全场状态", "我方场地", "对手场地"],
        [[tracker.get("weather") or "无", field_text(tracker), side_conditions_text(tracker, "p1"), side_conditions_text(tracker, "p2")]],
        [18, 30, 30, 30],
        compact=True,
    )
    input("回车返回对战。")


def legal_switch_indexes(request: dict[str, Any]) -> list[int]:
    pokemon = (request.get("side") or {}).get("pokemon") or []
    return [index for index, mon in enumerate(pokemon, start=1) if can_switch_to(mon)]


def player_choice(
    request: dict[str, Any],
    auto: bool,
    rng: random.Random,
    player_display: list[dict[str, Any]],
    tracker: dict[str, Any],
    recent_events: list[str],
) -> str:
    if auto:
        return random_choice(request, rng)

    while True:
        raw = input("> ").strip().lower()
        if raw in {"q", "quit", "exit"}:
            raise KeyboardInterrupt
        if request.get("forceSwitch"):
            if raw in {"1", "team", "队伍", "换人"}:
                choice = show_team_menu(request, player_display, tracker)
                render_battle_screen(request, tracker, recent_events)
                if choice:
                    return choice
                continue
            if raw in {"2", "field", "info", "状态", "对局状态"}:
                show_battle_status_menu(tracker, recent_events)
                render_battle_screen(request, tracker, recent_events)
                continue
            if raw in {"3", "ff", "forfeit", "认输"}:
                if confirm_forfeit():
                    return "forfeit"
                render_battle_screen(request, tracker, recent_events)
                continue
            print("现在必须换人。请选择 1 队伍/换人，2 对局状态，3 认输。")
            continue

        if raw in {"1", "move", "moves", "skill", "技能"}:
            choice = show_move_menu(request, tracker)
            render_battle_screen(request, tracker, recent_events)
            if choice:
                return choice
            continue
        if raw in {"2", "item", "items", "道具"}:
            print("道具功能暂未开放。")
            input("回车返回。")
            render_battle_screen(request, tracker, recent_events)
            continue
        if raw in {"3", "team", "队伍", "换人"}:
            choice = show_team_menu(request, player_display, tracker)
            render_battle_screen(request, tracker, recent_events)
            if choice:
                return choice
            continue
        if raw in {"4", "field", "info", "状态", "对局状态"}:
            show_battle_status_menu(tracker, recent_events)
            render_battle_screen(request, tracker, recent_events)
            continue
        if raw in {"5", "ff", "forfeit", "认输"}:
            if confirm_forfeit():
                return "forfeit"
            render_battle_screen(request, tracker, recent_events)
            continue

        print("请选择 1 技能，2 道具，3 队伍，4 对局状态，5 认输。")


def random_choice(request: dict[str, Any] | None, rng: random.Random) -> str:
    if not request:
        return "default"
    if request.get("teamPreview"):
        indexes = list(range(1, len((request.get("side") or {}).get("pokemon") or []) + 1))
        rng.shuffle(indexes)
        return "team " + "".join(str(index) for index in indexes)
    if request.get("forceSwitch"):
        switches = legal_switch_indexes(request)
        return f"switch {rng.choice(switches)}" if switches else "default"
    active = (request.get("active") or [{}])[0]
    moves = [index for index, move in enumerate(active.get("moves") or [], start=1) if not move.get("disabled")]
    if moves:
        return f"move {rng.choice(moves)}"
    switches = legal_switch_indexes(request)
    return f"switch {rng.choice(switches)}" if switches else "default"


def resolve_turn(
    client: ShowdownClient,
    response: dict[str, Any],
    player: str | None,
    enemy: str | None,
    tracker: dict[str, Any],
) -> tuple[dict[str, Any], list[str]]:
    events: list[str] = []
    if player is not None:
        response = client.choose("p1", player)
        events.extend(consume_log(response.get("messages") or [], tracker))
        update_pp_memory(tracker, request_for(response, "p1"))
    if enemy is not None and not response.get("ended"):
        response = client.choose("p2", enemy)
        events.extend(consume_log(response.get("messages") or [], tracker))
        update_pp_memory(tracker, request_for(response, "p1"))
    return response, events


def choose_team_preview(client: ShowdownClient, response: dict[str, Any], rng: random.Random, tracker: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    events: list[str] = []
    p1_request = request_for(response, "p1")
    p2_request = request_for(response, "p2")
    if p1_request and p1_request.get("teamPreview"):
        response = client.choose("p1", "team 123")
        events.extend(consume_log(response.get("messages") or [], tracker))
    if p2_request and p2_request.get("teamPreview"):
        enemy_order = random_choice(p2_request, rng)
        response = client.choose("p2", enemy_order)
        events.extend(consume_log(response.get("messages") or [], tracker))
    update_pp_memory(tracker, request_for(response, "p1"))
    return response, events


def play_battle(
    client: ShowdownClient,
    player_team: list[dict[str, Any]],
    enemy_team: list[dict[str, Any]],
    player_display: list[dict[str, Any]],
    seed: int,
    rng: random.Random,
    auto: bool,
) -> str:
    tracker = create_battle_tracker()
    recent_events: list[str] = []
    response = client.start(player_team, enemy_team, seed)
    recent_events.extend(consume_log(response.get("messages") or [], tracker))
    response, events = choose_team_preview(client, response, rng, tracker)
    recent_events.extend(events)

    while not response.get("ended"):
        p1_request = request_for(response, "p1")
        p2_request = request_for(response, "p2")
        if not p1_request:
            response = client.command({"cmd": "drain"})
            recent_events.extend(consume_log(response.get("messages") or [], tracker))
            continue
        update_pp_memory(tracker, p1_request)
        if p1_request.get("wait"):
            enemy = random_choice(p2_request, rng) if p2_request and not p2_request.get("wait") else None
            response, events = resolve_turn(client, response, None, enemy, tracker)
            recent_events.extend(events)
            continue

        render_battle_screen(p1_request, tracker, recent_events)
        player = player_choice(p1_request, auto, rng, player_display, tracker, recent_events)
        enemy = random_choice(p2_request, rng)
        response, events = resolve_turn(client, response, player, enemy, tracker)
        recent_events.extend(events)
        recent_events = recent_events[-30:]

    return str(response.get("winner") or "")


def exchange_after_win(
    player_team: list[dict[str, Any]],
    player_display: list[dict[str, Any]],
    enemy_raw: list[dict[str, Any]],
    enemy_display: list[dict[str, Any]],
    auto: bool,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    print_team("敌方队伍:", enemy_display)
    if auto:
        print("\n--auto: 跳过交换")
        return player_team, player_display

    while True:
        raw = input("\n交换一只吗？输入 0 跳过，或 玩家编号 敌方编号，例如 2 1 > ").strip()
        if raw in {"", "0", "n", "no"}:
            return player_team, player_display
        parts = raw.replace(",", " ").split()
        if len(parts) != 2 or not all(part.isdigit() for part in parts):
            print("请输入 0，或两个编号。")
            continue
        own, foe = (int(parts[0]), int(parts[1]))
        if 1 <= own <= 3 and 1 <= foe <= 3:
            next_team = list(player_team)
            next_display = list(player_display)
            next_team[own - 1] = enemy_raw[foe - 1]
            next_display[own - 1] = enemy_display[foe - 1]
            print(f"已交换：{display_name(player_team[own - 1])} -> {display_name(enemy_display[foe - 1])}")
            return next_team, next_display
        print("编号需要在 1-3 之间。")


def main() -> int:
    parser = argparse.ArgumentParser(description="Pokemon Battle Factory text prototype powered by Showdown.")
    parser.add_argument("--seed", type=int, default=None, help="固定随机种子，方便复现。")
    parser.add_argument("--battles", type=int, default=DEFAULT_BATTLES, help="连战场数，默认 7。")
    parser.add_argument("--auto", action="store_true", help="自动选择和自动行动，用于烟测。")
    args = parser.parse_args()

    run_seed = args.seed if args.seed is not None else random.SystemRandom().randrange(1, 2**32)
    rng = random.Random(run_seed)
    client = ShowdownClient()
    try:
        print("ChangeBattle - 宝可梦对战工厂文字版")
        print(f"随机种子: {run_seed}")

        generated = client.generate(seed_for(run_seed, 1))
        candidates = generated["display"]
        raw_candidates = generated["team"]
        selected_indexes = select_three(candidates, args.auto)
        player_team = [raw_candidates[index] for index in selected_indexes]
        player_display = [candidates[index] for index in selected_indexes]
        print_team("你的初始队伍:", player_display)

        wins = 0
        for battle_no in range(1, args.battles + 1):
            enemy_generated = client.generate(seed_for(run_seed, 100 + battle_no))
            enemy_raw = enemy_generated["team"][:3]
            enemy_display = enemy_generated["display"][:3]
            print(f"\n========== 第 {battle_no}/{args.battles} 场 ==========")
            print("本场对手：未知。进入对战后只显示已上场信息。")
            winner = play_battle(client, player_team, enemy_raw, player_display, seed_for(run_seed, 200 + battle_no), rng, args.auto)
            if winner != "Player":
                print(f"\n挑战结束。连胜：{wins}")
                return 0
            wins += 1
            print(f"\n本场胜利！当前连胜：{wins}")
            if battle_no < args.battles:
                player_team, player_display = exchange_after_win(player_team, player_display, enemy_raw, enemy_display, args.auto)

        print(f"\n通关！完成 {wins} 连胜。")
        return 0
    except KeyboardInterrupt:
        print("\n已退出。")
        return 130
    finally:
        client.close()


if __name__ == "__main__":
    raise SystemExit(main())
