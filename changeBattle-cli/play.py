#!/usr/bin/env python3
"""Text-mode Battle Factory loop powered by Pokemon Showdown."""

from __future__ import annotations

import argparse
import csv
from datetime import datetime
import json
import random
import sys
import time
import unicodedata
from pathlib import Path
from typing import Any


BUNDLE_ROOT = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parents[1])).resolve()
APP_ROOT = Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else BUNDLE_ROOT
PROJECT_ROOT = BUNDLE_ROOT
sys.path.insert(0, str(PROJECT_ROOT))

from core.i18n import normalize_id, zh, zh_condition, zh_detail, zh_plain  # noqa: E402
from core.showdown_client import ShowdownClient  # noqa: E402


class ShowdownDebugLogger:
    def __init__(self) -> None:
        DEBUG_DIR.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        self.path = DEBUG_DIR / f"showdown-{timestamp}.jsonl"
        self.seq = 0

    def write(
        self,
        *,
        action: str,
        response: dict[str, Any],
        tracker: dict[str, Any],
        events: list[str],
        choice: str | None = None,
    ) -> None:
        self.seq += 1
        messages = response.get("messages") or []
        raw_lines = raw_log_lines(messages)
        player_lines = split_log_lines(messages)
        record = {
            "seq": self.seq,
            "action": action,
            "choice": choice,
            "ended": response.get("ended"),
            "winner": response.get("winner"),
            "raw_messages": messages,
            "raw_lines": raw_lines,
            "player_view_lines": player_lines,
            "parsed_events": events,
            "request_summary": request_summary(response),
            "tracker": tracker,
        }
        with self.path.open("a", encoding="utf-8") as f:
            json.dump(record, f, ensure_ascii=False)
            f.write("\n")


DEFAULT_BATTLES = 7
SAVE_VERSION = 1
BP_SCALE = 100
MAX_BP = 9999 * BP_SCALE
SAVE_DIR = APP_ROOT / "saves"
SAVE_FILE = SAVE_DIR / "save.json"
DEBUG_DIR = APP_ROOT / "debug"
GOODS_FILE = PROJECT_ROOT / "data" / "goods.csv"
BOSS_TEAM_POOL_FILE = PROJECT_ROOT / "data" / "boss_team_pools.csv"
DEBUG_LOGGER: ShowdownDebugLogger | None = None
GOODS_CACHE: dict[tuple[str, str], dict[str, Any]] | None = None
EVENT_DELAY = 0.85
WIN_BP_REWARD = 5 * BP_SCALE
SHOP_OFFER_COUNT = 3
SHOP_ROLL_COST = 150
SHOP_ROLL_COST_GAMBLER_PAID = 195
MOVE_DRAW_COST = 2 * BP_SCALE
MOVE_DRAW_COUNT = 2
RANDOMIZE_PART_COST = 1 * BP_SCALE
RANDOMIZE_ALL_COST = 2 * BP_SCALE
REST_EXCHANGE_COSTS = [0, 1 * BP_SCALE, 2 * BP_SCALE]
BOSS_EXCHANGE_COST = 2 * BP_SCALE
REST_HP_COSTS = {1: 0, 2: 0, 3: 0}
REST_PP_COSTS = {1: 0, 2: 0, 3: 0}
REST_STATUS_COSTS = {1: 0, 2: 0, 3: 0}
ADJUST_STATS_COST = 10 * BP_SCALE
STAT_ROWS = [
    ("hp", "HP"),
    ("atk", "攻击"),
    ("def", "防御"),
    ("spa", "特攻"),
    ("spd", "特防"),
    ("spe", "速度"),
]
SIDE_NAMES = {"p1": "玩家", "p2": "对手"}
TALENTS = [
    {"id": "exchange_lossless", "name": "爱护有加", "category": "交换", "cost": 2 * BP_SCALE, "desc": "交换获得的宝可梦会恢复到 3/4 HP 和 3/4 PP。"},
    {"id": "exchange_pickpocket", "name": "顺手牵羊", "category": "交换", "cost": 3 * BP_SCALE, "desc": "交换时如果目标携带道具，会一并拿过来。"},
    {"id": "exchange_gym_recognition", "name": "馆主认可", "category": "交换", "cost": 15 * BP_SCALE, "desc": "馆主和四天王宝可梦不再受默认只能交换 1 只的限制。"},
    {"id": "exchange_factory_freedom", "name": "工厂自由", "category": "交换", "cost": 30 * BP_SCALE, "desc": "所有交换免费。"},
    {"id": "exchange_second_team_roar", "name": "二队的怒吼", "category": "交换", "cost": 50 * BP_SCALE, "desc": "三只宝可梦都阵亡后，可选择损失 1000BP 重新 6 选 3 并重打当前场次；每局一次。"},
    {"id": "exchange_safe_box", "name": "无损交易", "category": "交换", "cost": 50 * BP_SCALE, "desc": "拥有一个特殊宝可梦盒子，本局遇到的宝可梦会寄存在其中，后续可再次交换回来。"},
    {"id": "gambler_move_draw_4", "name": "灵感爆棚", "category": "赌徒", "cost": 5 * BP_SCALE, "desc": "技能随机时候选数量从 2 个提升到 3 个。"},
    {"id": "gambler_shop_offer_5", "name": "大手一挥", "category": "赌徒", "cost": 5 * BP_SCALE, "desc": "商店老虎机格子数量从 3 个提升到 4 个。"},
    {"id": "gambler_free_stat_reset", "name": "时也命也", "category": "赌徒", "cost": 10 * BP_SCALE, "desc": "重置数值时 60% 概率免费、30% 概率双倍消耗、10% 概率正常消耗。"},
    {"id": "gambler_random_cost_1", "name": "座上贵宾", "category": "赌徒", "cost": 20 * BP_SCALE, "desc": "每次休整获得一次免费商店抽奖；本次休整后续商店抽奖消耗为基础费用的 1.3 倍，免费次数不结转。"},
    {"id": "gambler_streak_bp_risk", "name": "压上杠杆", "category": "赌徒", "cost": 50 * BP_SCALE, "desc": "每场胜利有概率把本场基础 BP 变为 1.4/1.6/1.8/2.0/2.5 倍；失败时 BP 回到本局开始前。"},
    {"id": "gambler_all_in_exchange", "name": "孤注一掷", "category": "赌徒", "cost": 50 * BP_SCALE, "desc": "每局限一次，指定生成一只宝可梦用于交换；交换后另外两只宝可梦半血并陷入睡眠，且立即结束本次休整。"},
    {"id": "prophet_first_mover", "name": "上帝只眼", "category": "先知", "cost": 5 * BP_SCALE, "desc": "对战时可以看到哪些技能克制当前对手。"},
    {"id": "prophet_next_scout", "name": "未卜先知", "category": "先知", "cost": 10 * BP_SCALE, "desc": "每次休整可免费查看下一场随机 1 只对手宝可梦的图片和名字；花费 300BP 可查看全部。"},
    {"id": "prophet_history_review", "name": "温故知新", "category": "先知", "cost": 15 * BP_SCALE, "desc": "休整页允许查看上一轮对手的宝可梦详情。"},
    {"id": "prophet_direct_move", "name": "运筹帷幄", "category": "先知", "cost": 20 * BP_SCALE, "desc": "调整技能时不再随机，可直接从可学习技能池选择一个技能替换，每次 300BP。"},
    {"id": "prophet_candidate_12", "name": "慧眼识珠", "category": "先知", "cost": 50 * BP_SCALE, "desc": "开局从 12 只候选宝可梦中选择，而不是 6 只。"},
    {"id": "prophet_future_boss", "name": "预知未来", "category": "先知", "cost": 50 * BP_SCALE, "desc": "可以直接看到本局关底训练师的详细阵容。"},
    {"id": "business_starter_3", "name": "有备无患", "category": "经营", "cost": 5 * BP_SCALE, "desc": "开局可以选择 3 个起始道具。"},
    {"id": "business_discount_70", "name": "贵客专享", "category": "经营", "cost": 15 * BP_SCALE, "desc": "购买道具时享受 70% 价格，向下取整。"},
    {"id": "business_refund_70", "name": "精打细算", "category": "经营", "cost": 20 * BP_SCALE, "desc": "背包返还时返还 70%，而不是 50%。"},
    {"id": "business_sell_full", "name": "奇货可居", "category": "经营", "cost": 30 * BP_SCALE, "desc": "卖出道具时能原价出售。"},
    {"id": "business_amulet_coin", "name": "护符金币", "category": "经营", "cost": 50 * BP_SCALE, "desc": "所有 BP 正向结算按 1.5 倍结算。"},
    {"id": "business_shiny_collector", "name": "闪光收藏家", "category": "经营", "cost": 50 * BP_SCALE, "desc": "任意交换获得的宝可梦均为闪光，且闪光带来的 BP 加成变为 1.3 倍。"},
]


def load_goods() -> dict[tuple[str, str], dict[str, Any]]:
    global GOODS_CACHE
    if GOODS_CACHE is not None:
        return GOODS_CACHE
    goods: dict[tuple[str, str], dict[str, Any]] = {}
    if GOODS_FILE.exists():
        with GOODS_FILE.open("r", encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f):
                item_type = normalize_id(row.get("item_type") or "")
                item_id = normalize_id(row.get("item_id") or "")
                if not item_type or not item_id:
                    continue
                try:
                    cost = int(row.get("item_cost") or 0)
                except ValueError:
                    cost = 0
                goods[(item_type, item_id)] = {
                    "item_id": item_id,
                    "item_type": item_type,
                    "item_name": row.get("item_name") or item_id,
                    "item_cost": max(0, cost),
                }
    GOODS_CACHE = goods
    return goods


def goods_entry(item_type: str, item_id: str) -> dict[str, Any] | None:
    return load_goods().get((normalize_id(item_type), normalize_id(item_id)))


def default_move_cost(power: int | None) -> int:
    value = int(power or 0)
    if value >= 120:
        return 5 * BP_SCALE
    if value > 90:
        return 4 * BP_SCALE
    if value > 60:
        return 3 * BP_SCALE
    if value > 30:
        return 2 * BP_SCALE
    return 1 * BP_SCALE


def goods_cost(item_type: str, item_id: str, default: int = 0) -> int:
    entry = goods_entry(item_type, item_id)
    if entry:
        return int(entry.get("item_cost") or 0)
    return max(0, int(default or 0))


def service_cost(item_id: str, default: int = 0) -> int:
    return goods_cost("service", item_id, default)


def move_goods_cost(move: dict[str, Any]) -> int:
    move_id = str(move.get("id") or move.get("name") or "")
    return goods_cost("skill", move_id, default_move_cost(move.get("power")))


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


def default_stats() -> dict[str, Any]:
    return {
        "battle_points": 0,
        "battles": 0,
        "wins": 0,
        "losses": 0,
        "win_rate": 0.0,
        "set_win_streak": 0,
        "best_set_win_streak": 0,
        "rank_status": "未开放",
    }


def scale_bp_value(value: Any, factor: int) -> int:
    return max(0, int(int(value or 0) * factor))


def scale_bp_rows(rows: Any, factor: int) -> list[list[int]]:
    if not isinstance(rows, list):
        return []
    return [[scale_bp_value(value, factor) for value in row] for row in rows if isinstance(row, list)]


def migrate_run_bp_scale(run: dict[str, Any], factor: int) -> None:
    run["bp_earned_this_run"] = scale_bp_value(run.get("bp_earned_this_run"), factor)
    run["run_start_bp"] = scale_bp_value(run.get("run_start_bp"), factor)
    run["temporary_bp_debt"] = scale_bp_value(run.get("temporary_bp_debt"), factor)
    if isinstance(run.get("bp_investments"), list):
        run["bp_investments"] = [scale_bp_value(value, factor) for value in run.get("bp_investments") or []]
    run["move_investments"] = scale_bp_rows(run.get("move_investments"), factor)


def migrate_save_bp_scale(save: dict[str, Any]) -> None:
    previous_scale = int(save.get("bp_scale") or 1)
    if previous_scale == BP_SCALE:
        return
    factor = BP_SCALE // max(1, previous_scale)
    save.setdefault("stats", default_stats())
    save["stats"]["battle_points"] = scale_bp_value(save["stats"].get("battle_points"), factor)
    if save.get("current_run"):
        migrate_run_bp_scale(save["current_run"], factor)
    save["bp_scale"] = BP_SCALE


def refresh_stats(stats: dict[str, Any]) -> None:
    battles = int(stats.get("battles") or 0)
    wins = int(stats.get("wins") or 0)
    stats["battle_points"] = max(0, min(MAX_BP, int(stats.get("battle_points") or 0)))
    stats["battles"] = battles
    stats["wins"] = wins
    stats["losses"] = int(stats.get("losses") or 0)
    stats["win_rate"] = round((wins / battles) * 100, 1) if battles else 0.0
    stats["set_win_streak"] = int(stats.get("set_win_streak") or 0)
    stats["best_set_win_streak"] = max(
        int(stats.get("best_set_win_streak") or 0),
        stats["set_win_streak"],
    )
    stats["rank_status"] = stats.get("rank_status") or "未开放"


def create_save(name: str, gender: str) -> dict[str, Any]:
    stats = default_stats()
    stats["battle_points"] = 1000
    save = {
        "version": SAVE_VERSION,
        "bp_scale": BP_SCALE,
        "trainer": {"name": name, "gender": gender},
        "stats": stats,
        "current_run": None,
    }
    refresh_stats(save["stats"])
    return save


def normalize_save(save: dict[str, Any]) -> dict[str, Any]:
    save.setdefault("version", SAVE_VERSION)
    migrate_save_bp_scale(save)
    save.setdefault("trainer", {})
    save["trainer"].setdefault("name", "训练师")
    save["trainer"].setdefault("gender", "未设置")
    save.setdefault("stats", default_stats())
    save.setdefault("current_run", None)
    refresh_stats(save["stats"])
    if save.get("current_run"):
        normalize_current_run(save["current_run"])
    return save


def load_save() -> dict[str, Any] | None:
    if not SAVE_FILE.exists():
        return None
    with SAVE_FILE.open("r", encoding="utf-8") as f:
        return normalize_save(json.load(f))


def write_save(save: dict[str, Any]) -> None:
    normalize_save(save)
    SAVE_DIR.mkdir(parents=True, exist_ok=True)
    with SAVE_FILE.open("w", encoding="utf-8") as f:
        json.dump(save, f, ensure_ascii=False, indent=2)
        f.write("\n")


def prompt_trainer_name(default: str | None = None) -> str:
    while True:
        suffix = f"（当前：{default}）" if default else ""
        name = input(f"请输入训练师姓名{suffix} > ").strip()
        if name:
            return name
        if default:
            return default
        print("姓名不能为空。")


def prompt_gender(default: str | None = None) -> str:
    mapping = {
        "1": "男",
        "m": "男",
        "male": "男",
        "男": "男",
        "2": "女",
        "f": "女",
        "female": "女",
        "女": "女",
        "3": "其他",
        "x": "其他",
        "other": "其他",
        "其他": "其他",
    }
    while True:
        suffix = f"（当前：{default}）" if default else ""
        raw = input(f"请选择性别{suffix}：1 男 / 2 女 / 3 其他 > ").strip().lower()
        if not raw and default:
            return default
        if raw in mapping:
            return mapping[raw]
        print("请输入 1、2 或 3。")


def edit_trainer(save: dict[str, Any]) -> None:
    trainer = save.setdefault("trainer", {})
    trainer["name"] = prompt_trainer_name(trainer.get("name"))
    trainer["gender"] = prompt_gender(trainer.get("gender"))
    write_save(save)
    print("训练师信息已保存。")


def show_user_info(save: dict[str, Any]) -> None:
    while True:
        clear_screen()
        trainer = save.get("trainer") or {}
        stats = save.get("stats") or {}
        refresh_stats(stats)
        print("=" * 72)
        print("用户信息")
        print("=" * 72)
        print(f"训练师：{trainer.get('name', '训练师')}")
        print(f"性别：{trainer.get('gender', '未设置')}")
        print(f"Rank：{stats.get('rank_status', '未开放')}")
        print(f"对战点数：{stats.get('battle_points', 0)}")
        print(f"总对局数：{stats.get('battles', 0)}")
        print(f"胜场：{stats.get('wins', 0)}")
        print(f"败场：{stats.get('losses', 0)}")
        print(f"胜率：{stats.get('win_rate', 0.0):.1f}%")
        print(f"当前连胜局数：{stats.get('set_win_streak', 0)}")
        print(f"最高连胜局数：{stats.get('best_set_win_streak', 0)}")
        raw = input("\ne 编辑训练师信息，回车返回 > ").strip().lower()
        if not raw:
            return
        if raw in {"e", "edit", "编辑"}:
            edit_trainer(save)
            input("回车继续。")
            continue
        print("请输入 e 或直接回车。")


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


def normalized_move_id(move: dict[str, Any]) -> str:
    return normalize_id(str(move.get("id") or move.get("name") or ""))


def display_move_max_pp(move: dict[str, Any]) -> int:
    pp = int(move.get("pp") or 1)
    return max(1, int(pp * 8 / 5))


def state_condition(state: dict[str, Any]) -> str:
    hp = int(state.get("hp") or 0)
    maxhp = int(state.get("maxhp") or 0)
    if hp <= 0:
        return "0 fnt"
    status = str(state.get("status") or "")
    return f"{hp}/{maxhp}{' ' + status if status else ''}"


def refresh_state_condition(state: dict[str, Any]) -> dict[str, Any]:
    state["hp"] = max(0, min(int(state.get("hp") or 0), int(state.get("maxhp") or 0)))
    state["fainted"] = int(state.get("hp") or 0) <= 0
    if state["fainted"]:
        state["status"] = ""
    state["condition"] = state_condition(state)
    return state


def full_state_for_pokemon(pokemon: dict[str, Any], slot: int) -> dict[str, Any]:
    maxhp = int((pokemon.get("stats") or {}).get("hp") or 1)
    moves = []
    for index, move in enumerate(pokemon.get("moves") or [], start=1):
        maxpp = display_move_max_pp(move)
        moves.append({
            "slot": index,
            "id": normalized_move_id(move),
            "move": move.get("name") or move.get("id") or "",
            "pp": maxpp,
            "maxpp": maxpp,
        })
    return {
        "slot": slot,
        "ident": f"p1: {pokemon.get('species') or pokemon.get('name') or slot}",
        "details": pokemon.get("species") or pokemon.get("name") or "",
        "species": pokemon.get("species") or pokemon.get("name") or "",
        "hp": maxhp,
        "maxhp": maxhp,
        "status": "",
        "fainted": False,
        "active": slot == 1,
        "item": normalize_id(str(pokemon.get("item") or "")),
        "moves": moves,
        "condition": f"{maxhp}/{maxhp}",
    }


def half_state_for_pokemon(pokemon: dict[str, Any], slot: int) -> dict[str, Any]:
    state = full_state_for_pokemon(pokemon, slot)
    state["hp"] = max(1, int(state.get("maxhp") or 1) // 2)
    for move in state.get("moves") or []:
        move["pp"] = max(1, int(move.get("maxpp") or 1) // 2)
    return refresh_state_condition(state)


def partial_state_for_pokemon(pokemon: dict[str, Any], slot: int, ratio: float) -> dict[str, Any]:
    state = full_state_for_pokemon(pokemon, slot)
    normalized_ratio = max(0.0, min(1.0, float(ratio or 0)))
    state["hp"] = int(state.get("maxhp") or 1) if normalized_ratio >= 1 else max(1, int(int(state.get("maxhp") or 1) * normalized_ratio))
    for move in state.get("moves") or []:
        move["pp"] = int(move.get("maxpp") or 1) if normalized_ratio >= 1 else max(1, int(int(move.get("maxpp") or 1) * normalized_ratio))
    return refresh_state_condition(state)


def normalize_player_state(run: dict[str, Any]) -> list[dict[str, Any]]:
    display = run.get("player_display") or []
    existing = list(run.get("player_state") or [])
    states: list[dict[str, Any]] = []
    for index, pokemon in enumerate(display, start=1):
        state = dict(existing[index - 1]) if index - 1 < len(existing) and isinstance(existing[index - 1], dict) else full_state_for_pokemon(pokemon, index)
        full = full_state_for_pokemon(pokemon, index)
        state.setdefault("slot", index)
        state["slot"] = index
        state.setdefault("ident", full["ident"])
        state.setdefault("details", full["details"])
        state.setdefault("species", full["species"])
        state.setdefault("maxhp", full["maxhp"])
        state.setdefault("hp", full["hp"])
        state.setdefault("status", "")
        state.setdefault("item", full.get("item", ""))
        state_moves = {normalize_id(move.get("id") or move.get("move")): dict(move) for move in state.get("moves") or []}
        moves = []
        for move in full["moves"]:
            current = state_moves.get(move["id"], {})
            moves.append({
                **move,
                "pp": max(0, min(int(current.get("pp", move["pp"])), int(move["maxpp"]))),
            })
        state["moves"] = moves
        states.append(refresh_state_condition(state))
    run["player_state"] = states
    return states


def state_is_fainted(state: dict[str, Any]) -> bool:
    return bool(state.get("fainted")) or int(state.get("hp") or 0) <= 0 or str(state.get("condition") or "").endswith(" fnt")


def usable_state_indexes(states: list[dict[str, Any]]) -> list[int]:
    return [index for index, state in enumerate(states) if not state_is_fainted(state)]


def rotate_first_usable(run: dict[str, Any]) -> bool:
    states = normalize_player_state(run)
    usable = usable_state_indexes(states)
    if not usable:
        return False
    first = usable[0]
    if first == 0:
        return True
    for key in ["player_team", "player_display", "player_state", "bp_investments", "move_investments"]:
        values = list(run.get(key) or [])
        if first < len(values):
            values[0], values[first] = values[first], values[0]
            run[key] = values
    normalize_player_state(run)
    return True


def restore_state_hp(state: dict[str, Any]) -> None:
    state["hp"] = int(state.get("maxhp") or 1)
    state["fainted"] = False
    refresh_state_condition(state)


def restore_state_pp(state: dict[str, Any]) -> None:
    for move in state.get("moves") or []:
        move["pp"] = int(move.get("maxpp") or move.get("pp") or 0)


def restore_state_status(state: dict[str, Any]) -> None:
    state["status"] = ""
    refresh_state_condition(state)


def spend_bp(save: dict[str, Any], cost: int) -> bool:
    stats = save.setdefault("stats", default_stats())
    current = int(stats.get("battle_points") or 0)
    if current < cost:
        return False
    stats["battle_points"] = current - cost
    refresh_stats(stats)
    return True


def add_bp(save: dict[str, Any], amount: int) -> None:
    stats = save.setdefault("stats", default_stats())
    stats["battle_points"] = min(MAX_BP, int(stats.get("battle_points") or 0) + max(0, amount))
    refresh_stats(stats)


def reset_set_win_streak(save: dict[str, Any]) -> None:
    stats = save.setdefault("stats", default_stats())
    stats["set_win_streak"] = 0
    refresh_stats(stats)


def abort_current_run(save: dict[str, Any]) -> None:
    reset_set_win_streak(save)
    save["current_run"] = None


def default_rest_status() -> dict[str, Any]:
    return {
        "exchanges": 0,
        "taken_enemy_slots": [],
        "restore_hp_used": False,
        "restore_pp_used": False,
        "restore_status_used": False,
    }


def normalize_bag_items(run: dict[str, Any]) -> dict[str, int]:
    bag: dict[str, int] = {}
    raw_bag = run.get("bag_items") or {}
    if isinstance(raw_bag, dict):
        iterator = raw_bag.items()
    else:
        iterator = []
    for item_id, count in iterator:
        normalized = normalize_id(str(item_id))
        amount = int(count or 0)
        if normalized and amount > 0:
            bag[normalized] = bag.get(normalized, 0) + amount
    run["bag_items"] = bag
    return bag


def add_bag_item(run: dict[str, Any], item_id: str, count: int = 1) -> None:
    normalized = normalize_id(item_id)
    if not normalized or count <= 0:
        return
    bag = normalize_bag_items(run)
    bag[normalized] = int(bag.get(normalized) or 0) + count
    run["bag_items"] = bag


def remove_bag_item(run: dict[str, Any], item_id: str, count: int = 1) -> bool:
    normalized = normalize_id(item_id)
    bag = normalize_bag_items(run)
    current = int(bag.get(normalized) or 0)
    if not normalized or current < count:
        return False
    next_count = current - count
    if next_count:
        bag[normalized] = next_count
    else:
        bag.pop(normalized, None)
    run["bag_items"] = bag
    return True


def held_item_id(raw_set: dict[str, Any] | None, display: dict[str, Any] | None = None) -> str:
    raw_value = ""
    if display:
        raw_value = str(display.get("item_id") or display.get("item") or "")
    if not raw_value and raw_set:
        raw_value = str(raw_set.get("item") or "")
    return normalize_id(raw_value)


def held_item_name(raw_set: dict[str, Any] | None, display: dict[str, Any] | None = None) -> str:
    if display and (display.get("item") or display.get("item_id")):
        return str(display.get("item") or display.get("item_id"))
    if raw_set and raw_set.get("item"):
        return str(raw_set.get("item"))
    return ""


def unequip_slot_to_bag(run: dict[str, Any], slot: int) -> str:
    index = slot - 1
    team = run.get("player_team") or []
    display = run.get("player_display") or []
    raw_set = team[index] if index < len(team) else {}
    shown = display[index] if index < len(display) else {}
    item_id = held_item_id(raw_set, shown)
    if item_id:
        add_bag_item(run, item_id, 1)
    if index < len(team):
        team[index]["item"] = ""
    if index < len(display):
        display[index]["item"] = ""
        display[index]["item_id"] = ""
        display[index]["item_desc"] = ""
        display[index]["item_short_desc"] = ""
    states = list(run.get("player_state") or [])
    if index < len(states):
        states[index]["item"] = ""
        run["player_state"] = states
    return item_id


def normalize_move_investments(run: dict[str, Any]) -> list[list[int]]:
    target_len = len(run.get("player_display") or run.get("player_team") or [0, 0, 0])
    raw_rows = list(run.get("move_investments") or [])
    normalized: list[list[int]] = []
    for index in range(target_len):
        row = raw_rows[index] if index < len(raw_rows) and isinstance(raw_rows[index], list) else []
        values = [int(value or 0) for value in row[:4]]
        while len(values) < 4:
            values.append(0)
        normalized.append(values)
    run["move_investments"] = normalized
    return normalized


def normalize_current_run(run: dict[str, Any]) -> dict[str, Any]:
    run.setdefault("bp_earned_this_run", 0)
    run.setdefault("rest_status", default_rest_status())
    run.setdefault("bp_investments", [0, 0, 0])
    run.setdefault("bag_items", {})
    run.setdefault("move_investments", [])
    run.setdefault("talents", [])
    run["second_team_roar_used"] = bool(run.get("second_team_roar_used"))
    if not isinstance(run.get("rest_status"), dict):
        run["rest_status"] = default_rest_status()
    run["rest_status"].setdefault("exchanges", 0)
    run["rest_status"].setdefault("taken_enemy_slots", [])
    run["rest_status"].setdefault("restore_hp_used", False)
    run["rest_status"].setdefault("restore_pp_used", False)
    run["rest_status"].setdefault("restore_status_used", False)
    investments = [int(value or 0) for value in list(run.get("bp_investments") or [])]
    target_len = len(run.get("player_display") or investments or [0, 0, 0])
    while len(investments) < target_len:
        investments.append(0)
    run["bp_investments"] = investments[:target_len]
    normalize_bag_items(run)
    normalize_move_investments(run)
    if run.get("status") == "awaiting_exchange":
        run["status"] = "awaiting_rest"
    if run.get("player_display"):
        normalize_player_state(run)
    return run


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
        "volatiles": {"p1": [], "p2": []},
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


def source_label(raw: str) -> str:
    if raw.startswith("item: "):
        return f"道具：{zh_plain('items', raw.replace('item: ', ''))}"
    if raw.startswith("ability: "):
        return f"特性：{zh_plain('abilities', raw.replace('ability: ', ''))}"
    if raw.startswith("move: "):
        return f"招式：{zh_plain('moves', raw.replace('move: ', ''))}"
    if raw == "drain":
        return "吸取效果"
    return effect_name(raw)


def cant_reason_text(raw: str) -> str:
    value = raw.replace("[from] ", "")
    normalized = normalize_id(value)
    if normalized == "flinch":
        return "畏缩"
    if normalized in {"slp", "sleep"}:
        return "睡眠"
    if normalized in {"frz", "freeze"}:
        return "冰冻"
    if normalized in {"par", "paralysis"}:
        return "麻痹"
    if normalized == "recharge":
        return "正在充能/硬直"
    if value.startswith("move: "):
        return f"招式：{zh_plain('moves', value.replace('move: ', ''))}"
    if value.startswith("ability: "):
        return f"特性：{zh_plain('abilities', value.replace('ability: ', ''))}"
    if value.startswith("item: "):
        return f"道具：{zh_plain('items', value.replace('item: ', ''))}"
    return effect_name(value)


def side_condition_text(raw: str) -> str:
    value = effect_name(raw)
    aliases = {
        "Stealth Rock": "隐形岩",
        "Spikes": "撒菱",
        "Toxic Spikes": "毒菱",
        "Sticky Web": "黏黏网",
        "Reflect": "反射壁",
        "Light Screen": "光墙",
        "Aurora Veil": "极光幕",
        "Tailwind": "顺风",
    }
    return aliases.get(value, value)


def source_from_parts(parts: list[str]) -> tuple[str, str]:
    source = ""
    owner = ""
    for part in parts:
        if part.startswith("[from] "):
            source = source_label(part.replace("[from] ", ""))
        elif part.startswith("[of] "):
            owner = short_ident_zh(part.replace("[of] ", ""))
    return source, owner


def event_source(parts: list[str], target_ident: str | None = None) -> str:
    source = ""
    source_owner = ""
    for part in parts[4:]:
        if part.startswith("[from] "):
            source = source_label(part.replace("[from] ", ""))
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


def apply_player_state_to_tracker(tracker: dict[str, Any], states: list[dict[str, Any]]) -> None:
    if not states:
        return
    active = next((state for state in states if state.get("active")), states[0])
    tracker["active"]["p1"] = {
        "name": short_ident(active.get("ident", "")) or active.get("species") or active.get("details") or "",
        "condition": active.get("condition") or state_condition(active),
        "status": active.get("status") or "",
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


def raw_log_lines(messages: list[dict[str, Any]]) -> list[str]:
    lines: list[str] = []
    for message in messages:
        if message.get("type") != "update":
            continue
        for line in str(message.get("data", "")).splitlines():
            if line and not line.startswith("|request|"):
                lines.append(line)
    return lines


def split_log_lines(messages: list[dict[str, Any]]) -> list[str]:
    lines: list[str] = []
    for message in messages:
        if message.get("type") != "update":
            continue
        raw_lines = str(message.get("data", "")).splitlines()
        index = 0
        while index < len(raw_lines):
            line = raw_lines[index]
            if not line or line.startswith("|request|"):
                index += 1
                continue
            if line.startswith("|split|"):
                side = line.split("|")[2] if len(line.split("|")) > 2 else ""
                secret = raw_lines[index + 1] if index + 1 < len(raw_lines) else ""
                public = raw_lines[index + 2] if index + 2 < len(raw_lines) else ""
                selected = secret if side == "p1" else public
                if selected and not selected.startswith("|request|"):
                    lines.append(selected)
                index += 3
                continue
            lines.append(line)
            index += 1
    return lines


def request_summary(response: dict[str, Any]) -> dict[str, Any]:
    summary: dict[str, Any] = {}
    for side, request in (response.get("requests") or {}).items():
        side_pokemon = (request.get("side") or {}).get("pokemon") or []
        active = request.get("active") or []
        summary[side] = {
            "wait": request.get("wait"),
            "forceSwitch": request.get("forceSwitch"),
            "teamPreview": request.get("teamPreview"),
            "active": [pokemon.get("ident") for pokemon in side_pokemon if pokemon.get("active")],
            "team_conditions": [
                {
                    "ident": pokemon.get("ident"),
                    "condition": pokemon.get("condition"),
                    "active": pokemon.get("active"),
                    "item": pokemon.get("item"),
                }
                for pokemon in side_pokemon
            ],
            "moves": [
                {
                    "id": move.get("id"),
                    "move": move.get("move"),
                    "pp": move.get("pp"),
                    "maxpp": move.get("maxpp"),
                    "disabled": move.get("disabled"),
                }
                for move in (active[0].get("moves") if active else []) or []
            ],
        }
    return summary


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
                tracker["volatiles"][side] = []
            text = f"{short_ident_zh(parts[2])} 上场了。"
        elif tag == "drag" and len(parts) > 3:
            side = side_from_ident(parts[2])
            if side:
                tracker["active"][side] = {"name": short_ident(parts[2]), "condition": condition_from_switch(parts), "status": ""}
                tracker["boosts"][side] = {}
                tracker["volatiles"][side] = []
            text = f"{short_ident_zh(parts[2])} 被拖上场。"
        elif tag == "move" and len(parts) > 3:
            text = f"{short_ident_zh(parts[2])} 使用 {zh('moves', parts[3])}。"
        elif tag == "cant" and len(parts) > 3:
            reason = cant_reason_text(parts[3])
            if normalize_id(parts[3]) == "flinch":
                text = f"{short_ident_zh(parts[2])} 畏缩了，无法行动。"
            else:
                text = f"{short_ident_zh(parts[2])} 因 {reason} 无法行动。"
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
            source, source_owner = source_from_parts(parts[4:])
            status_text = zh_plain("statuses", parts[3])
            target = short_ident_zh(parts[2])
            if source:
                owner = source_owner or target
                text = f"{owner} 的{source}发动，{target} 陷入 {status_text}"
            else:
                text = f"{target} 陷入 {status_text}"
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
        elif tag == "-start" and len(parts) > 3:
            side = side_from_ident(parts[2])
            effect = effect_name(parts[3])
            if side and parts[3] == "Substitute":
                add_unique(tracker.setdefault("volatiles", {}).setdefault(side, []), "替身")
                text = f"{short_ident_zh(parts[2])} 制造了替身。"
            elif side:
                add_unique(tracker.setdefault("volatiles", {}).setdefault(side, []), effect)
                text = f"{short_ident_zh(parts[2])} 获得状态：{effect}"
        elif tag == "-end" and len(parts) > 3:
            side = side_from_ident(parts[2])
            effect = effect_name(parts[3])
            if side and parts[3] == "Substitute":
                remove_value(tracker.setdefault("volatiles", {}).setdefault(side, []), "替身")
                text = f"{short_ident_zh(parts[2])} 的替身消失了。"
            elif side:
                remove_value(tracker.setdefault("volatiles", {}).setdefault(side, []), effect)
                text = f"{short_ident_zh(parts[2])} 失去状态：{effect}"
        elif tag == "-supereffective":
            text = "效果拔群！"
        elif tag == "-resisted":
            text = "效果不理想。"
        elif tag == "-immune" and len(parts) > 2:
            text = f"{short_ident_zh(parts[2])} 没有效果。"
        elif tag == "-miss" and len(parts) > 2:
            text = f"{short_ident_zh(parts[2])} 没有命中。"
        elif tag == "-fail" and len(parts) > 2:
            reason = f"：{effect_name(parts[3])}" if len(parts) > 3 else ""
            text = f"{short_ident_zh(parts[2])} 行动失败{reason}。"
        elif tag == "-block" and len(parts) > 2:
            source = f" 被 {source_label(parts[3])} 阻止" if len(parts) > 3 else " 被阻止"
            text = f"{short_ident_zh(parts[2])}{source}。"
        elif tag == "-notarget":
            text = "没有目标。"
        elif tag == "-crit":
            text = "会心一击！"
        elif tag == "faint" and len(parts) > 2:
            side = side_from_ident(parts[2])
            if side:
                tracker["active"].setdefault(side, {})["condition"] = "0 濒死"
            text = f"{short_ident_zh(parts[2])} 倒下了。"
        elif tag == "-weather" and len(parts) > 2:
            tracker["weather"] = effect_name(parts[2]) if parts[2] != "none" else "无"
            source, source_owner = source_from_parts(parts[3:])
            if parts[2] == "none":
                text = "天气恢复正常。"
            elif source:
                owner = f"{source_owner} 的" if source_owner else ""
                text = f"{owner}{source}发动，天气变为{tracker['weather']}。"
            else:
                text = f"天气：{tracker['weather']}"
        elif tag == "-transform" and len(parts) > 3:
            source, _source_owner = source_from_parts(parts[4:])
            actor = short_ident_zh(parts[2])
            target = short_ident_zh(parts[3])
            if source:
                text = f"{actor} 的{source}发动，变身成 {target}。"
            else:
                text = f"{actor} 变身成 {target}。"
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
                value = side_condition_text(parts[3])
                add_unique(tracker["side_conditions"][side], value)
                if value == "隐形岩":
                    text = f"{SIDE_NAMES[side]} 场地周围布满了隐形岩。"
                elif value == "撒菱":
                    text = f"{SIDE_NAMES[side]} 场地撒下了撒菱。"
                elif value == "毒菱":
                    text = f"{SIDE_NAMES[side]} 场地撒下了毒菱。"
                elif value == "黏黏网":
                    text = f"{SIDE_NAMES[side]} 场地张开了黏黏网。"
                else:
                    text = f"{SIDE_NAMES[side]} 场地出现：{value}"
        elif tag == "-sideend" and len(parts) > 3:
            side = side_from_ident(parts[2])
            if side:
                value = side_condition_text(parts[3])
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
        if text is not None:
            events.append(text)
    return events


def consume_response(response: dict[str, Any], tracker: dict[str, Any], action: str, choice: str | None = None) -> list[str]:
    events = consume_log(response.get("messages") or [], tracker)
    if DEBUG_LOGGER:
        DEBUG_LOGGER.write(action=action, response=response, tracker=tracker, events=events, choice=choice)
    return events


def play_event_queue(events: list[str], *, auto: bool) -> None:
    if auto or not events:
        return
    visible_events = [event.strip() for event in events if event.strip() and not event.strip().startswith("--- 第")]
    if not visible_events:
        return
    print("\n战斗事件：")
    for event in visible_events:
        print(f"▶ {event}")
        time.sleep(max(0.0, EVENT_DELAY))
    print()


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
    volatiles = tracker.get("volatiles", {}).get(side) or []
    volatile_text = f" [{' / '.join(volatiles)}]" if volatiles else ""
    boosts = boost_text(tracker.get("boosts", {}).get(side) or {})
    return f"{zh('species', name)}{volatile_text} HP {condition}{status_text} | 能力变化 {boosts}"


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
    print("2. 道具")
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


def last_turn_events(recent_events: list[str], limit: int = 12) -> list[str]:
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
    print("2. 道具")
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
            print("战斗内道具菜单正在迁移到新背包规则；请先在休整页使用消耗道具。")
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
        response = client.forfeit("p1") if player == "forfeit" else client.choose("p1", player)
        step_events = consume_response(response, tracker, "choose:p1", player)
        events.extend(step_events)
        update_pp_memory(tracker, request_for(response, "p1"))
    if enemy is not None and not response.get("ended"):
        response = client.choose("p2", enemy)
        step_events = consume_response(response, tracker, "choose:p2", enemy)
        events.extend(step_events)
        update_pp_memory(tracker, request_for(response, "p1"))
    return response, events


def choose_team_preview(client: ShowdownClient, response: dict[str, Any], rng: random.Random, tracker: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    events: list[str] = []
    p1_request = request_for(response, "p1")
    p2_request = request_for(response, "p2")
    if p1_request and p1_request.get("teamPreview"):
        response = client.choose("p1", "team 123")
        events.extend(consume_response(response, tracker, "team-preview:p1", "team 123"))
    if p2_request and p2_request.get("teamPreview"):
        enemy_order = random_choice(p2_request, rng)
        response = client.choose("p2", enemy_order)
        events.extend(consume_response(response, tracker, "team-preview:p2", enemy_order))
    update_pp_memory(tracker, request_for(response, "p1"))
    return response, events


def play_battle(
    client: ShowdownClient,
    player_team: list[dict[str, Any]],
    enemy_team: list[dict[str, Any]],
    player_display: list[dict[str, Any]],
    player_state: list[dict[str, Any]] | None,
    seed: int,
    rng: random.Random,
    auto: bool,
) -> tuple[str, list[dict[str, Any]]]:
    tracker = create_battle_tracker()
    recent_events: list[str] = []
    response = client.start(player_team, enemy_team, seed)
    start_events = consume_response(response, tracker, "start")
    recent_events.extend(start_events)
    play_event_queue(start_events, auto=auto)
    response, events = choose_team_preview(client, response, rng, tracker)
    recent_events.extend(events)
    play_event_queue(events, auto=auto)
    if player_state:
        response = client.sync_state("p1", player_state)
        sync_events = consume_response(response, tracker, "sync-state:p1")
        recent_events.extend(sync_events)
        update_pp_memory(tracker, request_for(response, "p1"))
        synced_state = response.get("state") or player_state
        apply_player_state_to_tracker(tracker, synced_state)

    while not response.get("ended"):
        p1_request = request_for(response, "p1")
        p2_request = request_for(response, "p2")
        if not p1_request:
            response = client.command({"cmd": "drain"})
            events = consume_response(response, tracker, "drain")
            recent_events.extend(events)
            play_event_queue(events, auto=auto)
            continue
        update_pp_memory(tracker, p1_request)
        if p1_request.get("wait"):
            enemy = random_choice(p2_request, rng) if p2_request and not p2_request.get("wait") else None
            response, events = resolve_turn(client, response, None, enemy, tracker)
            recent_events.extend(events)
            play_event_queue(events, auto=auto)
            continue

        render_battle_screen(p1_request, tracker, recent_events)
        player = player_choice(p1_request, auto, rng, player_display, tracker, recent_events)
        enemy = random_choice(p2_request, rng)
        response, events = resolve_turn(client, response, player, enemy, tracker)
        recent_events.extend(events)
        play_event_queue(events, auto=auto)
        recent_events = recent_events[-30:]

    final_state = client.state().get("p1") or player_state or []
    return str(response.get("winner") or ""), final_state


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
        if raw.lower() in {"q", "quit", "exit", "退出"}:
            raise KeyboardInterrupt
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


def state_pp_text(state: dict[str, Any]) -> str:
    moves = []
    for move in state.get("moves") or []:
        moves.append(f"{zh('moves', move.get('move') or move.get('id'))} {move.get('pp', '?')}/{move.get('maxpp', '?')}")
    return " / ".join(moves) if moves else "无"


def rest_team_rows(run: dict[str, Any]) -> list[list[object]]:
    states = normalize_player_state(run)
    rows = []
    for index, pokemon in enumerate(run.get("player_display") or [], start=1):
        state = states[index - 1]
        rows.append([
            index,
            display_name(pokemon),
            zh_condition(state.get("condition") or state_condition(state)),
            zh("items", pokemon.get("item"), fallback="无道具"),
            state_pp_text(state),
        ])
    return rows


def print_rest_header(save: dict[str, Any], run: dict[str, Any]) -> None:
    clear_screen()
    normalize_current_run(run)
    stats = save.get("stats") or {}
    battle_no = int(run.get("battle_no") or max(1, int(run.get("next_battle") or 1) - 1))
    battles = int(run.get("battles") or DEFAULT_BATTLES)
    print("=" * 128)
    print(f"休整菜单  |  第 {battle_no}/{battles} 小场胜利后  |  当前小场连胜 {run.get('wins', 0)}  |  BP {stats.get('battle_points', 0)}")
    print("=" * 128)
    talents = run.get("talents") or []
    print("本局天赋：" + (" / ".join(f"{talent.get('name')}（{talent.get('category')}）" for talent in talents) if talents else "当前无天赋"))
    print_table(["#", "你的队伍", "HP/状态", "道具", "PP"], rest_team_rows(run), [3, 28, 18, 18, 52], compact=True)
    bag = normalize_bag_items(run)
    if bag:
        print("本局背包：" + "，".join(f"{zh('items', item_id)}x{count}" for item_id, count in sorted(bag.items())))


def bp_cost_text(cost: int) -> str:
    return "免费" if int(cost or 0) <= 0 else f"{int(cost)}BP"


def spend_text(cost: int) -> str:
    return "免费" if int(cost or 0) <= 0 else f"花费 {int(cost)}BP"


def has_talent(run: dict[str, Any] | None, talent_id: str) -> bool:
    return any(talent.get("id") == talent_id for talent in (run or {}).get("talents") or [])


def candidate_count_for_talents(talents: list[dict[str, Any]] | None) -> int:
    return 12 if any(talent.get("id") == "prophet_candidate_12" for talent in talents or []) else 6


def ensure_starter_shiny(generated: dict[str, Any], run_seed: int) -> dict[str, Any]:
    display = generated.get("display") or []
    team = generated.get("team") or []
    if not display or any(pokemon.get("shiny") for pokemon in display):
        return generated
    index = random.Random(seed_for(run_seed, 0x51F1E)).randrange(len(display))
    display[index]["shiny"] = True
    if index < len(team):
        team[index]["shiny"] = True
    return generated


def apply_prophet_first_mover(save: dict[str, Any], talents: list[dict[str, Any]] | None) -> int:
    if not any(talent.get("id") == "prophet_first_mover" for talent in talents or []):
        return 0
    if current_bp(save) < 10 * BP_SCALE:
        return 0
    add_bp(save, 10 * BP_SCALE)
    return 10 * BP_SCALE


def settle_prophet_first_mover(save: dict[str, Any], run: dict[str, Any] | None) -> int:
    amount = max(0, int((run or {}).get("temporary_bp_debt") or 0))
    if amount <= 0:
        return 0
    cost = min(amount, current_bp(save))
    if cost:
        spend_bp(save, cost)
    return amount


def gained_bp(run: dict[str, Any] | None, amount: int) -> int:
    total = float(max(0, int(amount or 0)))
    shiny_count = sum(1 for pokemon in (run or {}).get("player_display") or [] if pokemon.get("shiny"))
    if shiny_count:
        total *= (1.3 if has_talent(run, "business_shiny_collector") else 1.1) ** shiny_count
    if has_talent(run, "business_amulet_coin"):
        total *= 1.5
    return int(total)


def add_run_bp(save: dict[str, Any], run: dict[str, Any] | None, amount: int) -> int:
    gained = gained_bp(run, amount)
    add_bp(save, gained)
    return gained


def gambler_streak_roll(run: dict[str, Any], battle_no: int) -> tuple[float, int] | None:
    if not has_talent(run, "gambler_streak_bp_risk"):
        return None
    rng = random.Random(seed_for(int(run.get("seed") or 1), 0xA117 + battle_no * 131 + int(run.get("wins") or 0) * 17))
    roll = rng.random()
    if roll < 0.6:
        multiplier = 1.4
    elif roll < 0.9:
        multiplier = 1.6
    elif roll < 0.95:
        multiplier = 1.8
    elif roll < 0.98:
        multiplier = 2.0
    else:
        multiplier = 2.5
    return multiplier, int(WIN_BP_REWARD * (multiplier - 1))


def exchange_cost_for(run: dict[str, Any], exchanges: int) -> int:
    if has_talent(run, "exchange_factory_freedom"):
        return 0
    boss_type = run.get("boss_type") or "normal"
    if boss_type in {"gym", "elite4"} and not has_talent(run, "exchange_gym_recognition"):
        return service_cost("boss_exchange", BOSS_EXCHANGE_COST)
    return service_cost(f"exchange_{exchanges + 1}", REST_EXCHANGE_COSTS[exchanges] if exchanges < len(REST_EXCHANGE_COSTS) else REST_EXCHANGE_COSTS[-1])


def can_exchange_boss(run: dict[str, Any], exchanges: int) -> bool:
    boss_type = run.get("boss_type") or "normal"
    if boss_type == "normal":
        return True
    if boss_type == "champion":
        return False
    if boss_type in {"gym", "elite4"}:
        return has_talent(run, "exchange_gym_recognition") or exchanges == 0
    return False


def exchange_keeps_item(run: dict[str, Any]) -> bool:
    return has_talent(run, "exchange_pickpocket")


def exchange_full_state(run: dict[str, Any]) -> bool:
    return False


def exchange_state_ratio(run: dict[str, Any]) -> float:
    if exchange_full_state(run):
        return 1.0
    return 0.75 if has_talent(run, "exchange_lossless") else 0.5


def route_boss_for_battle(set_streak: int, battle_no: int) -> tuple[str, str]:
    if battle_no == 3:
        if set_streak <= 0:
            return "gym", "tier1"
        if set_streak == 1:
            return "gym", "tier2"
        return "mixed", "tier3"
    if battle_no == 7:
        if set_streak <= 0:
            return "gym", "tier2"
        if set_streak == 1:
            return "mixed", "tier3"
        return "champion", "champion"
    return "normal", "normal"


def starter_profiles_for_streak(set_streak: int, count: int) -> list[str]:
    if set_streak <= 0:
        base = ["tier1", "tier1", "tier1", "tier1", "tier2", "tier2"]
    elif set_streak == 1:
        base = ["tier1", "tier1", "tier1", "tier2", "tier2", "tier3"]
    else:
        base = ["tier1", "tier2", "tier2", "tier3", "tier3", "tier3"]
    return [base[index % len(base)] for index in range(max(1, count))]


def profiles_for_route(boss_type: str, boss_stage: str) -> list[str]:
    if boss_type == "champion":
        return ["champion", "champion", "champion"]
    if boss_type == "elite4" or boss_stage == "tier3":
        return ["tier3", "tier4", "tier4"]
    if boss_stage == "tier2":
        return ["tier2", "tier3", "tier3"]
    if boss_stage == "tier1":
        return ["tier1", "tier2", "tier2"]
    return ["tier1", "tier1", "tier2"]


def normal_enemy_profiles_for_battle(set_streak: int, battle_no: int) -> list[str]:
    next_boss_type, next_boss_stage = route_boss_for_battle(set_streak, 3 if battle_no < 3 else 7)
    if next_boss_type == "champion" or next_boss_stage == "tier3":
        return ["tier3", "tier3", "tier4"]
    if next_boss_stage == "tier2":
        return ["tier2", "tier2", "tier3"]
    return ["tier1", "tier1", "tier2"]


def boss_team_pool_for_route(boss_type: str, boss_stage: str, run_seed: int, battle_no: int) -> tuple[list[str], list[str]] | None:
    if not BOSS_TEAM_POOL_FILE.exists():
        return None
    if boss_type == "champion":
        prefix = "champion:champion:"
    elif boss_type == "elite4":
        prefix = "elite4:elite4:"
    elif boss_stage in {"tier1", "tier2", "tier3"}:
        prefix = f"gym:{boss_stage}:"
    else:
        return None
    rows: list[dict[str, Any]] = []
    with BOSS_TEAM_POOL_FILE.open("r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if (row.get("pool_id") or "").startswith(prefix):
                rows.append(row)
    if not rows:
        return None
    pool_ids = sorted({row.get("pool_id") or "" for row in rows})
    pool_id = pool_ids[random.Random(seed_for(run_seed, 6500 + battle_no)).randrange(len(pool_ids))]
    rows = [row for row in rows if row.get("pool_id") == pool_id]
    team_indexes = sorted({int(row.get("team_index") or 0) for row in rows if row.get("team_index")})
    if not team_indexes:
        return None
    team_index = team_indexes[random.Random(seed_for(run_seed, 7000 + battle_no + len(pool_id))).randrange(len(team_indexes))]
    selected = sorted([row for row in rows if int(row.get("team_index") or 0) == team_index], key=lambda row: int(row.get("slot") or 0))[:3]
    if len(selected) < 3:
        return None
    return [row["species_id"] for row in selected], [row.get("generation_profile") or "tier1" for row in selected]


def random_ivs() -> dict[str, int]:
    return {stat: random.randint(0, 31) for stat, _label in STAT_ROWS}


def random_evs() -> dict[str, int]:
    evs = {stat: 0 for stat, _label in STAT_ROWS}
    remaining = 510
    stats = [stat for stat, _label in STAT_ROWS]
    random.shuffle(stats)
    for stat in stats:
        value = random.randint(0, min(255, remaining))
        evs[stat] = value
        remaining -= value
    return evs


def stat_reset_cost(run: dict[str, Any], base_cost: int) -> int:
    if has_talent(run, "gambler_free_stat_reset"):
        roll = random.random()
        if roll < 0.6:
            return 0
        if roll < 0.9:
            return base_cost * 2
    return base_cost


def state_needs_hp_restore(state: dict[str, Any]) -> bool:
    return int(state.get("hp") or 0) < int(state.get("maxhp") or 0)


def state_needs_pp_restore(state: dict[str, Any]) -> bool:
    return any(int(move.get("pp") or 0) < int(move.get("maxpp") or 0) for move in state.get("moves") or [])


def state_needs_status_restore(state: dict[str, Any]) -> bool:
    return bool(state.get("status"))


def current_restore_cost_text(run: dict[str, Any], prefix: str, defaults: dict[int, int]) -> str:
    rest_status = run.setdefault("rest_status", default_rest_status())
    used_key = f"{prefix}_used"
    if rest_status.get(used_key):
        return "已使用"
    states = normalize_player_state(run)
    if prefix == "restore_hp":
        count = sum(1 for state in states if state_needs_hp_restore(state))
    elif prefix == "restore_pp":
        count = sum(1 for state in states if state_needs_pp_restore(state))
    else:
        count = sum(1 for state in states if state_needs_status_restore(state))
    if count <= 0:
        return "无需恢复"
    return "免费"


def parse_rest_slots(raw: str, max_slots: int = 3) -> list[int]:
    parts = raw.replace(",", " ").split()
    slots: list[int] = []
    for part in parts:
        if not part.isdigit():
            return []
        slot = int(part)
        if not 1 <= slot <= max_slots or slot in slots:
            return []
        slots.append(slot)
    return slots


def rest_restore_hp(save: dict[str, Any], run: dict[str, Any]) -> None:
    states = normalize_player_state(run)
    rest_status = run.setdefault("rest_status", default_rest_status())
    if rest_status.get("restore_hp_used"):
        print("本次休整已经使用过恢复 HP。")
        input("回车继续。")
        return
    raw = input("恢复哪只宝可梦 HP？输入编号 1-3，回车返回 > ").strip()
    if not raw:
        return
    slots = parse_rest_slots(raw)
    if len(slots) != 1:
        print("请输入 1-3 的编号。")
        input("回车继续。")
        return
    state = states[slots[0] - 1]
    if not state_needs_hp_restore(state):
        print("这只宝可梦不需要恢复 HP。")
        input("回车继续。")
        return
    restore_state_hp(state)
    rest_status["restore_hp_used"] = True
    run["player_state"] = states
    print("已恢复满 HP，本次休整的免费恢复 HP 已使用。")
    input("回车继续。")


def rest_restore_pp(save: dict[str, Any], run: dict[str, Any]) -> None:
    states = normalize_player_state(run)
    rest_status = run.setdefault("rest_status", default_rest_status())
    if rest_status.get("restore_pp_used"):
        print("本次休整已经使用过恢复 PP。")
        input("回车继续。")
        return
    raw = input("恢复哪只宝可梦的单个技能 PP？输入编号 1-3，回车返回 > ").strip()
    if not raw:
        return
    slots = parse_rest_slots(raw)
    if len(slots) != 1:
        print("请输入 1-3 的编号。")
        input("回车继续。")
        return
    state = states[slots[0] - 1]
    moves = state.get("moves") or []
    if not any(int(move.get("pp") or 0) < int(move.get("maxpp") or 0) for move in moves):
        print("这只宝可梦不需要恢复 PP。")
        input("回车继续。")
        return
    for move in moves:
        print(f"{move.get('slot')}. {zh('moves', move.get('move') or move.get('id'))} PP {move.get('pp')}/{move.get('maxpp')}")
    move_raw = input("选择要恢复的技能编号，回车自动选择第一个缺 PP 技能 > ").strip()
    move = None
    if move_raw:
        move = next((entry for entry in moves if int(entry.get("slot") or 0) == int(move_raw or 0)), None) if move_raw.isdigit() else None
    if move is None:
        move = next((entry for entry in moves if int(entry.get("pp") or 0) < int(entry.get("maxpp") or 0)), None)
    if not move or int(move.get("pp") or 0) >= int(move.get("maxpp") or 0):
        print("这个技能不需要恢复 PP。")
        input("回车继续。")
        return
    move["pp"] = min(int(move.get("maxpp") or 0), int(move.get("pp") or 0) + 10)
    rest_status["restore_pp_used"] = True
    refresh_state_condition(state)
    run["player_state"] = states
    print("已恢复单个技能 10 点 PP，本次休整的免费恢复 PP 已使用。")
    input("回车继续。")


def rest_restore_status(save: dict[str, Any], run: dict[str, Any]) -> None:
    states = normalize_player_state(run)
    rest_status = run.setdefault("rest_status", default_rest_status())
    if rest_status.get("restore_status_used"):
        print("本次休整已经使用过恢复异常。")
        input("回车继续。")
        return
    raw = input("恢复哪只宝可梦异常状态？输入编号 1-3，回车返回 > ").strip()
    if not raw:
        return
    slots = parse_rest_slots(raw)
    if len(slots) != 1:
        print("请输入 1-3 的编号。")
        input("回车继续。")
        return
    state = states[slots[0] - 1]
    if not state_needs_status_restore(state):
        print("这只宝可梦没有异常状态。")
        input("回车继续。")
        return
    restore_state_status(state)
    rest_status["restore_status_used"] = True
    run["player_state"] = states
    print("已解除异常状态，本次休整的免费恢复异常已使用。")
    input("回车继续。")


def rest_exchange(save: dict[str, Any], run: dict[str, Any]) -> None:
    normalize_current_run(run)
    rest_status = run.setdefault("rest_status", default_rest_status())
    exchanges = int(rest_status.get("exchanges") or 0)
    if not can_exchange_boss(run, exchanges):
        if (run.get("boss_type") or "normal") == "champion":
            print("冠军的宝可梦暂时不能交换。")
        else:
            print("馆主/四天王宝可梦默认只能交换 1 只；携带馆主认可后可继续交换。")
        input("回车继续。")
        return
    if exchanges >= 3:
        print("本次休整最多交换 3 只。")
        input("回车继续。")
        return
    print_team("敌方队伍:", run.get("enemy_display") or [])
    cost = exchange_cost_for(run, exchanges)
    raw = input(f"\n交换费用：{bp_cost_text(cost)}。输入 玩家编号 敌方编号，例如 2 1；回车返回 > ").strip()
    if not raw:
        return
    parts = raw.replace(",", " ").split()
    if len(parts) != 2 or not all(part.isdigit() for part in parts):
        print("请输入两个编号。")
        input("回车继续。")
        return
    own, foe = int(parts[0]), int(parts[1])
    taken = set(int(value) for value in rest_status.get("taken_enemy_slots") or [])
    if not (1 <= own <= 3 and 1 <= foe <= 3):
        print("编号需要在 1-3 之间。")
        input("回车继续。")
        return
    if foe in taken:
        print("这只敌方宝可梦已经被交换过了。")
        input("回车继续。")
        return
    if not spend_bp(save, cost):
        print(f"BP 不足，需要 {cost}BP。")
        input("回车继续。")
        return
    investments = list(run.get("bp_investments") or [0, 0, 0])
    move_investments = normalize_move_investments(run)
    held_before = unequip_slot_to_bag(run, own)
    keep_item = exchange_keeps_item(run)
    run["player_team"][own - 1] = json.loads(json.dumps(run["enemy_raw"][foe - 1]))
    run["player_display"][own - 1] = json.loads(json.dumps(run["enemy_display"][foe - 1]))
    if has_talent(run, "business_shiny_collector"):
        run["player_team"][own - 1]["shiny"] = True
        run["player_display"][own - 1]["shiny"] = True
    if not keep_item:
        run["player_team"][own - 1]["item"] = ""
        run["player_display"][own - 1]["item"] = ""
        run["player_display"][own - 1]["item_id"] = ""
        run["player_display"][own - 1]["item_desc"] = ""
        run["player_display"][own - 1]["item_short_desc"] = ""
    states = normalize_player_state(run)
    ratio = exchange_state_ratio(run)
    states[own - 1] = partial_state_for_pokemon(run["player_display"][own - 1], own, ratio)
    run["player_state"] = states
    while len(investments) < len(run["player_display"]):
        investments.append(0)
    investments[own - 1] = 0
    run["bp_investments"] = investments
    move_investments = normalize_move_investments(run)
    move_investments[own - 1] = [0, 0, 0, 0]
    run["move_investments"] = move_investments
    rest_status["exchanges"] = exchanges + 1
    rest_status.setdefault("taken_enemy_slots", []).append(foe)
    item_text = f"，原道具 {zh('items', held_before)} 已放入背包" if held_before else ""
    state_text = "满 HP/满 PP" if ratio >= 1 else "3/4 HP/3/4 PP" if ratio >= 0.75 else "半 HP/半 PP"
    target_item_text = "保留目标携带道具" if keep_item else "不携带道具"
    print(f"已交换：位置 {own} -> {display_name(run['player_display'][own - 1])}，{spend_text(cost)}{item_text}，新宝可梦以{state_text}加入，且{target_item_text}。")
    input("回车继续。")


def current_bp(save: dict[str, Any]) -> int:
    return int((save.get("stats") or {}).get("battle_points") or 0)


def option_matches(option: dict[str, Any], keyword: str, kind: str) -> bool:
    if not keyword:
        return True
    needle = keyword.lower()
    raw_name = str(option.get("name") or option.get("id") or "")
    haystack = " ".join([
        raw_name,
        str(option.get("id") or ""),
        zh(kind, raw_name),
        zh_detail(kind, raw_name).get("description") or "",
        str(option.get("short_desc") or ""),
        str(option.get("desc") or ""),
    ]).lower()
    return needle in haystack


def item_rows(items: list[dict[str, Any]]) -> list[list[object]]:
    rows = []
    for index, item in enumerate(items, start=1):
        item_id = item.get("id") or item.get("name") or ""
        name = item.get("name") or item_id
        desc = zh_detail("items", name).get("description") or item.get("short_desc") or item.get("desc") or ""
        rows.append([
            index,
            zh("items", name),
            name,
            bp_cost_text(goods_cost("item", item_id, 5)),
            desc,
        ])
    return rows


def bag_rows(run: dict[str, Any]) -> list[list[object]]:
    rows = []
    for index, (item_id, count) in enumerate(sorted(normalize_bag_items(run).items()), start=1):
        rows.append([index, zh("items", item_id), item_id, count])
    return rows


def refresh_slot_after_item_change(run: dict[str, Any], slot: int, client: ShowdownClient) -> None:
    raw_set = run["player_team"][slot - 1]
    described = client.describe(raw_set)
    next_raw = described.get("set") or raw_set
    next_display = described.get("display") or run["player_display"][slot - 1]
    states = normalize_player_state(run)
    states[slot - 1] = adjusted_state_after_edit(states[slot - 1], next_display, slot)
    run["player_team"][slot - 1] = next_raw
    run["player_display"][slot - 1] = next_display
    run["player_state"] = states


def equip_bag_item(save: dict[str, Any], run: dict[str, Any], client: ShowdownClient, item_options: dict[str, dict[str, Any]]) -> None:
    normalize_current_run(run)
    bag = normalize_bag_items(run)
    if not bag:
        print("背包是空的。")
        input("回车继续。")
        return
    while True:
        clear_screen()
        print("=" * 86)
        print("本局背包 / 装备道具")
        print("=" * 86)
        print_table(["#", "道具", "ID", "数量"], bag_rows(run), [4, 28, 24, 8], compact=True)
        print("\n当前队伍：")
        print_table(["#", "宝可梦", "当前道具"], [
            [
                index,
                display_name(pokemon),
                zh("items", held_item_name(run["player_team"][index - 1], pokemon), fallback="无道具"),
            ]
            for index, pokemon in enumerate(run.get("player_display") or [], start=1)
        ], [4, 28, 24], compact=True)
        raw = input("输入 道具编号 宝可梦编号；输入 0 宝可梦编号 卸下；b 返回 > ").strip().lower()
        if raw in {"b", "back", "返回", ""}:
            return
        parts = raw.replace(",", " ").split()
        if len(parts) != 2 or not all(part.isdigit() for part in parts):
            print("请输入两个编号。")
            input("回车继续。")
            continue
        item_index, slot = int(parts[0]), int(parts[1])
        if not 1 <= slot <= len(run.get("player_team") or []):
            print("宝可梦编号需要在 1-3 之间。")
            input("回车继续。")
            continue
        if item_index == 0:
            removed = unequip_slot_to_bag(run, slot)
            refresh_slot_after_item_change(run, slot, client)
            text = f"已卸下 {zh('items', removed)} 并放入背包。" if removed else "这只宝可梦没有携带道具。"
            print(text)
            input("回车继续。")
            return
        bag_items = sorted(normalize_bag_items(run).items())
        if not 1 <= item_index <= len(bag_items):
            print("没有这个道具编号。")
            input("回车继续。")
            continue
        item_id = bag_items[item_index - 1][0]
        item = item_options.get(item_id) or {"id": item_id, "name": item_id}
        old_item = unequip_slot_to_bag(run, slot)
        if not remove_bag_item(run, item_id, 1):
            if old_item:
                remove_bag_item(run, old_item, 1)
            print("背包数量不足。")
            input("回车继续。")
            continue
        run["player_team"][slot - 1]["item"] = item.get("name") or item_id
        refresh_slot_after_item_change(run, slot, client)
        extra = f"，原道具 {zh('items', old_item)} 已回到背包" if old_item else ""
        print(f"已让 {display_name(run['player_display'][slot - 1])} 携带 {zh('items', item.get('name') or item_id)}{extra}。")
        input("回车继续。")
        return


def rest_buy_items(save: dict[str, Any], run: dict[str, Any], client: ShowdownClient) -> None:
    normalize_current_run(run)
    options = client.item_options().get("items") or []
    item_options = {normalize_id(item.get("id") or item.get("name") or ""): item for item in options}
    while True:
        clear_screen()
        print("=" * 96)
        print(f"购买/装备道具  |  当前 BP {current_bp(save)}")
        print("=" * 96)
        bag = normalize_bag_items(run)
        bag_text = "，".join(f"{zh('items', item_id)}x{count}" for item_id, count in sorted(bag.items())) if bag else "空"
        print(f"本局背包：{bag_text}")
        print("1. 购买道具")
        print("2. 装备/卸下道具")
        print("b. 返回")
        choice = input("> ").strip().lower()
        if choice in {"b", "back", "返回", ""}:
            return
        if choice in {"2", "equip", "装备", "卸下"}:
            equip_bag_item(save, run, client, item_options)
            continue
        if choice not in {"1", "buy", "购买"}:
            print("请选择 1、2 或 b。")
            input("回车继续。")
            continue
        keyword = input("搜索道具中文/英文/ID，回车显示前 30 个 > ").strip()
        matches = [item for item in options if option_matches(item, keyword, "items")]
        matches = matches[:30]
        if not matches:
            print("没有匹配的道具。")
            input("回车继续。")
            continue
        print_table(["#", "道具", "英文", "费用", "说明"], item_rows(matches), [4, 24, 24, 8, 56], compact=True)
        raw = input("输入编号购买 1 个，b 返回 > ").strip().lower()
        if raw in {"b", "back", "返回", ""}:
            continue
        if not raw.isdigit() or not 1 <= int(raw) <= len(matches):
            print("请输入有效编号。")
            input("回车继续。")
            continue
        item = matches[int(raw) - 1]
        item_id = normalize_id(item.get("id") or item.get("name") or "")
        cost = goods_cost("item", item_id, 5)
        if not spend_bp(save, cost):
            print(f"BP 不足，需要 {cost}BP。")
            input("回车继续。")
            continue
        add_bag_item(run, item_id, 1)
        print(f"已购买 {zh('items', item.get('name') or item_id)}，{spend_text(cost)}，已放入本局背包。")
        input("回车继续。")


def move_rows(moves: list[dict[str, Any]]) -> list[list[object]]:
    rows = []
    for index, move in enumerate(moves, start=1):
        name = move.get("name") or move.get("id") or ""
        desc = zh_detail("moves", name).get("description") or move.get("short_desc") or move.get("desc") or ""
        rows.append([
            index,
            zh("moves", name),
            name,
            zh_plain("types", move.get("type")) or move.get("type") or "?",
            move_power_text(move),
            move.get("pp") or "?",
            bp_cost_text(move_goods_cost(move)),
            desc,
        ])
    return rows


def print_move_adjust_overview(run: dict[str, Any], slot: int, save: dict[str, Any]) -> None:
    pokemon = run["player_display"][slot - 1]
    investments = normalize_move_investments(run)[slot - 1]
    clear_screen()
    print("=" * 110)
    print(f"调整技能  |  {display_name(pokemon)}  |  当前 BP {current_bp(save)}")
    print("=" * 110)
    rows = []
    for index, move in enumerate(pokemon.get("moves") or [], start=1):
        rows.append([
            index,
            move_summary(move),
            int(investments[index - 1] or 0),
        ])
    print_table(["#", "当前招式", "已投入BP"], rows, [4, 82, 10], compact=True)


def rest_adjust_moves(save: dict[str, Any], run: dict[str, Any], client: ShowdownClient) -> None:
    normalize_current_run(run)
    raw = input("调整哪只宝可梦的技能？输入 1-3，回车返回 > ").strip()
    if not raw:
        return
    if not raw.isdigit() or not 1 <= int(raw) <= len(run.get("player_team") or []):
        print("请输入 1-3 的编号。")
        input("回车继续。")
        return
    slot = int(raw)
    raw_set = json.loads(json.dumps(run["player_team"][slot - 1]))
    legal_moves = client.learnable_moves(raw_set).get("moves") or []
    if not legal_moves:
        print("没有找到该宝可梦的合法可学招式。")
        input("回车继续。")
        return

    while True:
        print_move_adjust_overview(run, slot, save)
        move_slot_raw = input("选择要替换的招式格子 1-4，b 返回 > ").strip().lower()
        if move_slot_raw in {"b", "back", "返回", ""}:
            return
        if not move_slot_raw.isdigit() or not 1 <= int(move_slot_raw) <= len(raw_set.get("moves") or []):
            print("请输入有效招式格子。")
            input("回车继续。")
            continue
        move_slot = int(move_slot_raw)
        current_moves = [normalize_id(move) for move in raw_set.get("moves") or []]
        other_moves = {move_id for index, move_id in enumerate(current_moves, start=1) if index != move_slot}
        keyword = input("搜索新技能中文/英文/ID，回车按威力显示前 40 个 > ").strip()
        candidates = [
            move for move in legal_moves
            if normalize_id(move.get("id") or move.get("name") or "") not in other_moves
            and normalize_id(move.get("id") or move.get("name") or "") != current_moves[move_slot - 1]
            and option_matches(move, keyword, "moves")
        ]
        candidates.sort(key=lambda move: (int(move.get("power") or 0), move.get("name") or ""), reverse=True)
        candidates = candidates[:40]
        if not candidates:
            print("没有匹配的合法技能。")
            input("回车继续。")
            continue
        clear_screen()
        print("=" * 132)
        print(f"给 {display_name(run['player_display'][slot - 1])} 替换第 {move_slot} 格：{zh('moves', raw_set['moves'][move_slot - 1])}")
        print("=" * 132)
        print_table(["#", "技能", "英文", "属性", "威力", "PP", "费用", "说明"], move_rows(candidates), [4, 22, 22, 8, 6, 6, 6, 54], compact=True)
        selected_raw = input("输入编号学习，b 返回 > ").strip().lower()
        if selected_raw in {"b", "back", "返回", ""}:
            continue
        if not selected_raw.isdigit() or not 1 <= int(selected_raw) <= len(candidates):
            print("请输入有效编号。")
            input("回车继续。")
            continue
        selected = candidates[int(selected_raw) - 1]
        cost = move_goods_cost(selected)
        move_investments = normalize_move_investments(run)
        old_investment = int(move_investments[slot - 1][move_slot - 1] or 0)
        refund = old_investment // 2
        if current_bp(save) + refund < cost:
            print(f"BP 不足，需要 {cost}BP；旧技能可返还 {refund}BP，当前只有 {current_bp(save)}BP。")
            input("回车继续。")
            continue
        next_raw = json.loads(json.dumps(raw_set))
        next_raw["moves"][move_slot - 1] = selected.get("name") or selected.get("id")
        described = client.describe(next_raw)
        next_raw = described.get("set") or next_raw
        next_display = described.get("display") or run["player_display"][slot - 1]
        if refund:
            add_bp(save, refund)
        if not spend_bp(save, cost):
            print(f"BP 不足，需要 {cost}BP。")
            input("回车继续。")
            continue
        states = normalize_player_state(run)
        states[slot - 1] = adjusted_state_after_edit(states[slot - 1], next_display, slot)
        run["player_team"][slot - 1] = next_raw
        run["player_display"][slot - 1] = next_display
        run["player_state"] = states
        move_investments = normalize_move_investments(run)
        move_investments[slot - 1][move_slot - 1] = cost
        run["move_investments"] = move_investments
        refund_text = f"，旧技能返还 {refund}BP" if refund else ""
        print(f"已学习 {zh('moves', selected.get('name') or selected.get('id'))}，{spend_text(cost)}{refund_text}。")
        input("回车继续。")
        return


def stat_key_from_input(raw: str) -> str | None:
    value = raw.strip().lower()
    aliases = {
        "1": "hp",
        "hp": "hp",
        "h": "hp",
        "生命": "hp",
        "2": "atk",
        "atk": "atk",
        "attack": "atk",
        "攻击": "atk",
        "物攻": "atk",
        "3": "def",
        "def": "def",
        "defense": "def",
        "防御": "def",
        "物防": "def",
        "4": "spa",
        "spa": "spa",
        "spatk": "spa",
        "specialattack": "spa",
        "特攻": "spa",
        "5": "spd",
        "spd": "spd",
        "spdef": "spd",
        "specialdefense": "spd",
        "特防": "spd",
        "6": "spe",
        "spe": "spe",
        "speed": "spe",
        "速度": "spe",
    }
    return aliases.get(value)


def stat_values_rows(values: dict[str, Any]) -> list[list[object]]:
    return [
        [index, label, int(values.get(stat) or 0)]
        for index, (stat, label) in enumerate(STAT_ROWS, start=1)
    ]


def edit_stat_values(values: dict[str, Any], title: str, *, min_value: int, max_value: int, total_limit: int | None = None) -> None:
    while True:
        clear_screen()
        print("=" * 72)
        print(title)
        print("=" * 72)
        print_table(["#", "能力", "当前值"], stat_values_rows(values), [4, 12, 10], compact=True)
        if total_limit is not None:
            total = sum(int(values.get(stat) or 0) for stat, _label in STAT_ROWS)
            status = "OK" if total <= total_limit else "超出"
            print(f"合计：{total}/{total_limit}（{status}）")
        print(f"输入：编号/能力 值，例如 `2 {max_value}` 或 `atk {max_value}`；`all {max_value}` 全部设置；b 返回。")
        raw = input("> ").strip()
        if not raw:
            continue
        if raw.lower() in {"b", "back", "返回"}:
            return
        parts = raw.replace(",", " ").split()
        if len(parts) != 2:
            print("请输入两个参数。")
            input("回车继续。")
            continue
        target, value_text = parts[0], parts[1]
        if not value_text.lstrip("-").isdigit():
            print("数值必须是整数。")
            input("回车继续。")
            continue
        value = int(value_text)
        if not min_value <= value <= max_value:
            print(f"数值范围必须是 {min_value}-{max_value}。")
            input("回车继续。")
            continue
        if target.lower() == "all":
            for stat, _label in STAT_ROWS:
                values[stat] = value
            continue
        stat = stat_key_from_input(target)
        if not stat:
            print("没有这个能力编号。")
            input("回车继续。")
            continue
        values[stat] = value


def ability_rows(abilities: list[dict[str, Any]]) -> list[list[object]]:
    rows = []
    for index, ability in enumerate(abilities, start=1):
        name = ability.get("name") or ability.get("id") or "?"
        desc = zh_detail("abilities", name).get("description") or ability.get("short_desc") or ability.get("desc") or ""
        rows.append([index, zh("abilities", name), desc])
    return rows


def choose_ability(raw_set: dict[str, Any], options: dict[str, Any]) -> None:
    abilities = list(options.get("abilities") or [])
    if not abilities:
        print("没有找到可选特性。")
        input("回车继续。")
        return
    while True:
        clear_screen()
        print("=" * 96)
        print(f"选择特性：当前 {zh('abilities', raw_set.get('ability'), fallback='无特性')}")
        print("=" * 96)
        print_table(["#", "特性", "说明"], ability_rows(abilities), [4, 28, 60], compact=True)
        raw = input("输入编号，b 返回 > ").strip().lower()
        if raw in {"b", "back", "返回"}:
            return
        if raw.isdigit() and 1 <= int(raw) <= len(abilities):
            raw_set["ability"] = abilities[int(raw) - 1].get("name") or abilities[int(raw) - 1].get("id")
            return
        print("请输入有效编号。")
        input("回车继续。")


def nature_rows(natures: list[dict[str, Any]]) -> list[list[object]]:
    rows = []
    for index, nature in enumerate(natures, start=1):
        name = nature.get("name") or "Serious"
        plus = nature.get("plus") or ""
        minus = nature.get("minus") or ""
        effect = f"{zh_plain('stats', plus)}↑ / {zh_plain('stats', minus)}↓" if plus and minus else "无修正"
        rows.append([index, zh_plain("natures", name), name, effect])
    return rows


def choose_nature(raw_set: dict[str, Any], options: dict[str, Any]) -> None:
    natures = list(options.get("natures") or [])
    if not natures:
        print("没有找到可选性格。")
        input("回车继续。")
        return
    while True:
        clear_screen()
        print("=" * 86)
        print(f"选择性格：当前 {zh('natures', raw_set.get('nature') or 'Serious')}")
        print("=" * 86)
        print_table(["#", "中文", "英文", "修正"], nature_rows(natures), [4, 12, 16, 24], compact=True)
        raw = input("输入编号，b 返回 > ").strip().lower()
        if raw in {"b", "back", "返回"}:
            return
        if raw.isdigit() and 1 <= int(raw) <= len(natures):
            raw_set["nature"] = natures[int(raw) - 1].get("name") or "Serious"
            return
        print("请输入有效编号。")
        input("回车继续。")


def validate_adjusted_set(raw_set: dict[str, Any], options: dict[str, Any]) -> list[str]:
    errors = []
    ivs = raw_set.get("ivs") or {}
    evs = raw_set.get("evs") or {}
    for stat, label in STAT_ROWS:
        iv = int(ivs.get(stat, 31))
        ev = int(evs.get(stat, 0))
        if not 0 <= iv <= 31:
            errors.append(f"{label} 个体值 {iv} 不在 0-31。")
        if not 0 <= ev <= 255:
            errors.append(f"{label} 努力值 {ev} 不在 0-255。")
    ev_total = sum(int(evs.get(stat, 0)) for stat, _label in STAT_ROWS)
    if ev_total > 510:
        errors.append(f"努力值总和 {ev_total} 超过 510。")

    ability_ids = {normalize_id(ability.get("name") or ability.get("id") or "") for ability in options.get("abilities") or []}
    if ability_ids and normalize_id(str(raw_set.get("ability") or "")) not in ability_ids:
        errors.append("特性不是该宝可梦的合法特性。")

    nature_ids = {normalize_id(nature.get("name") or "") for nature in options.get("natures") or []}
    if nature_ids and normalize_id(str(raw_set.get("nature") or "Serious")) not in nature_ids:
        errors.append("性格不是合法性格。")
    return errors


def adjusted_state_after_edit(old_state: dict[str, Any], new_display: dict[str, Any], slot: int) -> dict[str, Any]:
    new_state = full_state_for_pokemon(new_display, slot)
    old_max = max(1, int(old_state.get("maxhp") or new_state.get("maxhp") or 1))
    old_hp = max(0, int(old_state.get("hp") or 0))
    new_max = max(1, int(new_state.get("maxhp") or 1))
    if old_hp <= 0 or old_state.get("fainted"):
        new_state["hp"] = 0
    elif old_hp >= old_max:
        new_state["hp"] = new_max
    else:
        new_state["hp"] = max(1, min(new_max, round(old_hp * new_max / old_max)))
    new_state["status"] = old_state.get("status") or ""
    old_pp = {normalize_id(move.get("id") or move.get("move")): move for move in old_state.get("moves") or []}
    for move in new_state.get("moves") or []:
        previous = old_pp.get(normalize_id(move.get("id") or move.get("move")))
        if previous:
            move["pp"] = max(0, min(int(previous.get("pp", move["pp"])), int(move.get("maxpp") or move["pp"])))
    return refresh_state_condition(new_state)


def describe_candidate(client: ShowdownClient, raw_set: dict[str, Any], fallback: dict[str, Any]) -> dict[str, Any]:
    try:
        return client.describe(raw_set).get("display") or fallback
    except Exception:
        return fallback


def print_adjust_preview(display: dict[str, Any], raw_set: dict[str, Any], save: dict[str, Any], cost: int) -> None:
    clear_screen()
    print("=" * 112)
    print(f"调整能力值  |  费用 {bp_cost_text(cost)}  |  当前 BP {current_bp(save)}")
    print("=" * 112)
    print(f"{display_name(display)}  Lv{display.get('level', 50)}")
    print(f"特性：{zh('abilities', raw_set.get('ability') or display.get('ability'), fallback='无特性')}")
    print(f"性格：{nature_text(display)}")
    print_table(
        ["能力", "最终值", "种族", "个体", "努力"],
        [
            [
                label,
                (display.get("stats") or {}).get(stat, "?"),
                (display.get("base_stats") or {}).get(stat, "?"),
                (raw_set.get("ivs") or {}).get(stat, 31),
                (raw_set.get("evs") or {}).get(stat, 0),
            ]
            for stat, label in STAT_ROWS
        ],
        [8, 10, 10, 10, 10],
        compact=True,
    )
    ev_total = sum(int((raw_set.get("evs") or {}).get(stat, 0)) for stat, _label in STAT_ROWS)
    print(f"努力值合计：{ev_total}/510")


def rest_adjust_stats(save: dict[str, Any], run: dict[str, Any], client: ShowdownClient) -> None:
    normalize_current_run(run)
    cost = service_cost("adjust_stats", ADJUST_STATS_COST)
    raw = input("调整哪只宝可梦？输入 1-3，回车返回 > ").strip()
    if not raw:
        return
    if not raw.isdigit() or not 1 <= int(raw) <= len(run.get("player_team") or []):
        print("请输入 1-3 的编号。")
        input("回车继续。")
        return
    slot = int(raw)
    raw_set = json.loads(json.dumps(run["player_team"][slot - 1]))
    display = json.loads(json.dumps(run["player_display"][slot - 1]))
    raw_set["ivs"] = {stat: int((raw_set.get("ivs") or {}).get(stat, 31)) for stat, _label in STAT_ROWS}
    raw_set["evs"] = {stat: int((raw_set.get("evs") or {}).get(stat, 0)) for stat, _label in STAT_ROWS}
    raw_set["nature"] = raw_set.get("nature") or display.get("nature") or "Serious"
    raw_set["ability"] = raw_set.get("ability") or display.get("ability") or ""
    options = client.options(raw_set)

    while True:
        display = describe_candidate(client, raw_set, display)
        print_adjust_preview(display, raw_set, save, cost)
        print("1. 个体值")
        print("2. 特性")
        print("3. 性格")
        print("4. 努力值")
        print(f"5. 保存并扣除 {bp_cost_text(cost)}")
        print("b. 放弃返回")
        choice = input("> ").strip().lower()
        if choice in {"b", "back", "返回"}:
            return
        if choice in {"1", "iv", "ivs", "个体", "个体值"}:
            edit_stat_values(raw_set["ivs"], "调整个体值（0-31）", min_value=0, max_value=31)
        elif choice in {"2", "ability", "特性"}:
            choose_ability(raw_set, options)
        elif choice in {"3", "nature", "性格"}:
            choose_nature(raw_set, options)
        elif choice in {"4", "ev", "evs", "努力", "努力值"}:
            edit_stat_values(raw_set["evs"], "调整努力值（单项 0-255，总和不超过 510）", min_value=0, max_value=255, total_limit=510)
        elif choice in {"5", "save", "保存"}:
            errors = validate_adjusted_set(raw_set, options)
            if errors:
                print("无法保存：")
                for error in errors:
                    print(f"- {error}")
                input("回车继续。")
                continue
            if not spend_bp(save, cost):
                print(f"BP 不足，需要 {cost}BP。")
                input("回车继续。")
                continue
            described = client.describe(raw_set)
            next_raw = described.get("set") or raw_set
            next_display = described.get("display") or display
            states = normalize_player_state(run)
            states[slot - 1] = adjusted_state_after_edit(states[slot - 1], next_display, slot)
            run["player_team"][slot - 1] = next_raw
            run["player_display"][slot - 1] = next_display
            run["player_state"] = states
            investments = list(run.get("bp_investments") or [0, 0, 0])
            while len(investments) < len(run["player_display"]):
                investments.append(0)
            investments[slot - 1] = int(investments[slot - 1] or 0) + cost
            run["bp_investments"] = investments
            print(f"已保存调整，{spend_text(cost)}。")
            input("回车继续。")
            return
        else:
            print("请选择 1-5 或 b。")
            input("回车继续。")


def rest_randomize_stats(save: dict[str, Any], run: dict[str, Any], client: ShowdownClient) -> None:
    normalize_current_run(run)
    raw = input("重置哪只宝可梦？输入 1-3，回车返回 > ").strip()
    if not raw:
        return
    if not raw.isdigit() or not 1 <= int(raw) <= len(run.get("player_team") or []):
        print("请输入 1-3 的编号。")
        input("回车继续。")
        return
    slot = int(raw)
    print(f"1. 随机特性（{bp_cost_text(RANDOMIZE_PART_COST)}）")
    print(f"2. 随机性格（{bp_cost_text(RANDOMIZE_PART_COST)}）")
    print(f"3. 随机个体值（{bp_cost_text(RANDOMIZE_PART_COST)}）")
    print(f"4. 随机努力值（{bp_cost_text(RANDOMIZE_PART_COST)}）")
    print(f"5. 整体重置（{bp_cost_text(RANDOMIZE_ALL_COST)}）")
    choice = input("> ").strip().lower()
    mapping = {"1": "ability", "2": "nature", "3": "ivs", "4": "evs", "5": "all"}
    part = mapping.get(choice)
    if not part:
        return
    base_cost = RANDOMIZE_ALL_COST if part == "all" else RANDOMIZE_PART_COST
    cost = stat_reset_cost(run, base_cost)
    if not spend_bp(save, cost):
        print(f"BP 不足，需要 {cost}BP。")
        input("回车继续。")
        return
    raw_set = json.loads(json.dumps(run["player_team"][slot - 1]))
    options = client.options(raw_set)
    if part in {"ability", "all"} and options.get("abilities"):
        ability = random.choice(options["abilities"])
        raw_set["ability"] = ability.get("name") or ability.get("id")
    if part in {"nature", "all"} and options.get("natures"):
        nature = random.choice(options["natures"])
        raw_set["nature"] = nature.get("name") or "Serious"
    if part in {"ivs", "all"}:
        raw_set["ivs"] = random_ivs()
    if part in {"evs", "all"}:
        raw_set["evs"] = random_evs()
    described = client.describe(raw_set)
    next_raw = described.get("set") or raw_set
    next_display = described.get("display") or run["player_display"][slot - 1]
    states = normalize_player_state(run)
    states[slot - 1] = adjusted_state_after_edit(states[slot - 1], next_display, slot)
    run["player_team"][slot - 1] = next_raw
    run["player_display"][slot - 1] = next_display
    run["player_state"] = states
    print(f"已随机重置，{spend_text(cost)}。")
    input("回车继续。")


def finish_rest_for_next_battle(run: dict[str, Any]) -> bool:
    if not rotate_first_usable(run):
        print("队伍没有可出战宝可梦，请先恢复 HP。")
        input("回车继续。")
        return False
    battle_no = int(run["battle_no"]) if "battle_no" in run else 1
    run.update({
        "status": "ready",
        "next_battle": battle_no + 1,
        "rest_status": default_rest_status(),
    })
    for key in ["battle_no", "enemy_raw", "enemy_display"]:
        run.pop(key, None)
    return True


def rest_menu(save: dict[str, Any], auto: bool, persistent: bool, client: ShowdownClient) -> None:
    run = save.get("current_run")
    if not run:
        return
    normalize_current_run(run)
    if auto:
        finish_rest_for_next_battle(run)
        save_if_needed(save, persistent)
        return

    while save.get("current_run") and run.get("status") == "awaiting_rest":
        print_rest_header(save, run)
        print("1. 下一场")
        print("2. 保存")
        print("3. 交换宝可梦")
        print(f"4. 恢复HP（{current_restore_cost_text(run, 'restore_hp', REST_HP_COSTS)}）")
        print(f"5. 恢复PP（{current_restore_cost_text(run, 'restore_pp', REST_PP_COSTS)}）")
        print(f"6. 恢复异常状态（{current_restore_cost_text(run, 'restore_status', REST_STATUS_COSTS)}）")
        print("7. 购买/装备道具")
        print("8. 调整技能")
        print(f"9. 重置数值（单项 {bp_cost_text(RANDOMIZE_PART_COST)} / 整体 {bp_cost_text(RANDOMIZE_ALL_COST)}）")
        print("0. 中断挑战")
        print("q. 返回主界面")
        raw = input("> ").strip().lower()
        if raw in {"1", "next", "下一场"}:
            if finish_rest_for_next_battle(run):
                save_if_needed(save, persistent)
                return
        elif raw in {"2", "save", "保存"}:
            save_if_needed(save, persistent)
            print("已保存。")
            input("回车继续。")
        elif raw in {"3", "exchange", "交换"}:
            rest_exchange(save, run)
            save_if_needed(save, persistent)
        elif raw in {"4", "hp", "恢复hp"}:
            rest_restore_hp(save, run)
            save_if_needed(save, persistent)
        elif raw in {"5", "pp", "恢复pp"}:
            rest_restore_pp(save, run)
            save_if_needed(save, persistent)
        elif raw in {"6", "status", "异常", "恢复异常"}:
            rest_restore_status(save, run)
            save_if_needed(save, persistent)
        elif raw in {"7", "buy", "item", "道具", "购买道具", "装备道具"}:
            rest_buy_items(save, run, client)
            save_if_needed(save, persistent)
        elif raw in {"8", "move", "skill", "技能", "调整技能"}:
            rest_adjust_moves(save, run, client)
            save_if_needed(save, persistent)
        elif raw in {"9", "adjust", "能力", "调整能力", "调整能力值", "重置", "重置数值"}:
            rest_randomize_stats(save, run, client)
            save_if_needed(save, persistent)
        elif raw in {"0", "abort", "中断", "中断挑战"}:
            confirm = input("确认中断本局挑战？当前连胜将归零，历史最高连胜保留。输入“中断”确认 > ").strip()
            if confirm == "中断":
                abort_current_run(save)
                save_if_needed(save, persistent)
                print("本局挑战已中断，当前连胜已归零。")
                input("回车继续。")
                return
            print("已取消中断。")
            input("回车继续。")
        elif raw in {"q", "back", "返回"}:
            save_if_needed(save, persistent)
            return
        else:
            print("请选择 0-9 或 q。")
            input("回车继续。")


def save_if_needed(save: dict[str, Any], persistent: bool) -> None:
    if persistent:
        write_save(save)


def record_battle_result(save: dict[str, Any], winner: str, run: dict[str, Any] | None = None) -> int:
    stats = save.setdefault("stats", default_stats())
    stats["battles"] = int(stats.get("battles") or 0) + 1
    gained = 0
    if winner == "Player":
        stats["wins"] = int(stats.get("wins") or 0) + 1
        gained = add_run_bp(save, run, WIN_BP_REWARD)
    else:
        stats["losses"] = int(stats.get("losses") or 0) + 1
        stats["set_win_streak"] = 0
    refresh_stats(stats)
    return gained


def add_clear_bonus(save: dict[str, Any], run: dict[str, Any] | None = None) -> tuple[int, int]:
    stats = save.setdefault("stats", default_stats())
    set_streak = int(stats.get("set_win_streak") or 0) + 1
    stats["set_win_streak"] = set_streak
    stats["best_set_win_streak"] = max(int(stats.get("best_set_win_streak") or 0), set_streak)
    bonus = gained_bp(run, (set_streak * 2 + 7) * BP_SCALE)
    add_bp(save, bonus)
    return set_streak, bonus


def current_run_label(save: dict[str, Any]) -> str:
    run = save.get("current_run")
    if not run:
        return "无"
    normalize_current_run(run)
    status = run.get("status")
    battle_no = run.get("next_battle") or run.get("battle_no") or "?"
    battles = run.get("battles") or DEFAULT_BATTLES
    wins = run.get("wins") or 0
    if status == "awaiting_rest":
        return f"第 {run.get('battle_no', '?')}/{battles} 小场胜利后，等待休整（当前小场连胜 {wins}）"
    return f"准备第 {battle_no}/{battles} 小场（当前小场连胜 {wins}）"


def create_ready_run(
    client: ShowdownClient,
    save: dict[str, Any],
    run_seed: int,
    battles: int,
    auto: bool,
) -> None:
    print(f"随机种子: {run_seed}")
    talents: list[dict[str, Any]] = []
    candidate_count = candidate_count_for_talents(talents)
    profiles = starter_profiles_for_streak(int((save.get("stats") or {}).get("set_win_streak") or 0), candidate_count)
    generated = ensure_starter_shiny(client.generate(seed_for(run_seed, 1), count=candidate_count, profiles=profiles), run_seed)
    candidates = generated["display"]
    raw_candidates = generated["team"]
    selected_indexes = select_three(candidates, auto)
    player_team = [raw_candidates[index] for index in selected_indexes]
    player_display = [candidates[index] for index in selected_indexes]
    print_team("你的初始队伍:", player_display)
    temporary_bp = apply_prophet_first_mover(save, talents)
    save["current_run"] = {
        "status": "awaiting_rest",
        "seed": run_seed,
        "battles": battles,
        "next_battle": 1,
        "battle_no": 0,
        "wins": 0,
        "talents": talents,
        "run_start_bp": current_bp(save) - temporary_bp,
        "temporary_bp_debt": temporary_bp,
        "second_team_roar_used": False,
        "player_team": player_team,
        "player_display": player_display,
        "player_state": [full_state_for_pokemon(pokemon, index) for index, pokemon in enumerate(player_display, start=1)],
        "bp_earned_this_run": 0,
        "bp_investments": [0 for _pokemon in player_display],
        "move_investments": [[0, 0, 0, 0] for _pokemon in player_display],
        "bag_items": {},
        "rest_status": default_rest_status(),
    }


def run_current_challenge(
    client: ShowdownClient,
    save: dict[str, Any],
    rng: random.Random,
    auto: bool,
    persistent: bool,
) -> None:
    while save.get("current_run"):
        run = save["current_run"]
        status = run.get("status", "ready")
        battles = int(run.get("battles") or DEFAULT_BATTLES)
        run_seed = int(run.get("seed") or random.SystemRandom().randrange(1, 2**32))

        if status in {"awaiting_rest", "awaiting_exchange"}:
            run["status"] = "awaiting_rest"
            rest_menu(save, auto, persistent, client)
            save_if_needed(save, persistent)
            if not auto:
                return
            continue

        battle_no = int(run.get("next_battle") or 1)
        if battle_no > battles:
            set_streak, bonus = add_clear_bonus(save, run)
            save["current_run"] = None
            save_if_needed(save, persistent)
            print(f"\n通关！完成 {run.get('wins', battles)} 小场，当前连胜 {set_streak} 局，额外获得 {bonus}BP。")
            return

        boss_type, boss_stage = route_boss_for_battle(int((save.get("stats") or {}).get("set_win_streak") or 0), battle_no)
        if boss_type == "mixed":
            boss_type = "elite4" if random.Random(seed_for(run_seed, 6100 + battle_no)).random() < 0.5 else "gym"
        route_salt = 100 if boss_type == "normal" else 700 if boss_type == "champion" else 603 if boss_stage == "tier3" else 602 if boss_stage == "tier2" else 601
        if boss_type == "normal":
            profiles = normal_enemy_profiles_for_battle(int((save.get("stats") or {}).get("set_win_streak") or 0), battle_no)
            enemy_generated = client.generate(seed_for(run_seed, route_salt + battle_no), count=len(profiles), profiles=profiles)
        else:
            pooled = boss_team_pool_for_route(boss_type, boss_stage, run_seed, battle_no)
            if pooled:
                species_ids, profiles = pooled
                enemy_generated = client.generate(seed_for(run_seed, route_salt + battle_no), count=len(profiles), profiles=profiles, species_ids=species_ids)
            else:
                profiles = profiles_for_route(boss_type, boss_stage)
                enemy_generated = client.generate(seed_for(run_seed, route_salt + battle_no), count=len(profiles), profiles=profiles)
        enemy_raw = enemy_generated["team"][:3]
        enemy_display = enemy_generated["display"][:3]
        print(f"\n========== 第 {battle_no}/{battles} 场 ==========")
        print("本场对手：未知。进入对战后只显示已上场信息。")
        normalize_current_run(run)
        run["boss_type"] = boss_type
        run["boss_stage"] = boss_stage
        if not rotate_first_usable(run):
            reset_set_win_streak(save)
            save["current_run"] = None
            save_if_needed(save, persistent)
            print("\n挑战结束。队伍没有可出战宝可梦。")
            return
        winner, player_state = play_battle(
            client,
            run["player_team"],
            enemy_raw,
            run["player_display"],
            run.get("player_state"),
            seed_for(run_seed, 200 + battle_no),
            rng,
            auto,
        )
        run["player_state"] = player_state
        if winner != "Player" and has_talent(run, "exchange_second_team_roar") and not run.get("second_team_roar_used"):
            candidate_count = candidate_count_for_talents(run.get("talents") or [])
            profiles = starter_profiles_for_streak(int((save.get("stats") or {}).get("set_win_streak") or 0), candidate_count)
            generated = client.generate(seed_for(run_seed, 8800 + battle_no), count=candidate_count, profiles=profiles)
            indexes = select_three(generated["display"], auto)
            player_team = [generated["team"][index] for index in indexes]
            player_display = [generated["display"][index] for index in indexes]
            run.update({
                "status": "ready",
                "next_battle": battle_no,
                "player_team": player_team,
                "player_display": player_display,
                "player_state": [full_state_for_pokemon(pokemon, index) for index, pokemon in enumerate(player_display, start=1)],
                "second_team_roar_used": True,
            })
            save_if_needed(save, persistent)
            print("\n二队的怒吼触发！重新选择 3 只宝可梦，重打当前场次。")
            continue
        win_bp = record_battle_result(save, winner, run)
        if winner != "Player":
            wins = int(run.get("wins") or 0)
            if has_talent(run, "gambler_streak_bp_risk"):
                save.setdefault("stats", default_stats())["battle_points"] = max(0, int(run.get("run_start_bp") or 0))
                refresh_stats(save["stats"])
            else:
                settle_prophet_first_mover(save, run)
            save["current_run"] = None
            save_if_needed(save, persistent)
            print(f"\n挑战结束。小场连胜：{wins}，大局连胜已归零。")
            return

        wins = int(run.get("wins") or 0) + 1
        gambler_roll = gambler_streak_roll(run, battle_no)
        streak_bonus = gambler_roll[1] if gambler_roll else 0
        gained_streak_bonus = add_run_bp(save, run, streak_bonus) if streak_bonus else 0
        gambler_text = f"，压上杠杆 {gambler_roll[0]:.1f}倍，额外 {gained_streak_bonus}BP" if gambler_roll and gained_streak_bonus else ""
        print(f"\n本小场胜利！获得 {win_bp}BP{gambler_text}。当前小场连胜：{wins}")
        if battle_no >= battles:
            run["wins"] = wins
            paid_back = settle_prophet_first_mover(save, run)
            set_streak, bonus = add_clear_bonus(save, run)
            save["current_run"] = None
            save_if_needed(save, persistent)
            print(f"\n通关！完成 {wins} 小场，当前连胜 {set_streak} 局，额外获得 {bonus}BP{f'，临时BP扣回 {paid_back}BP' if paid_back else ''}。")
            return

        save["current_run"] = {
            **run,
            "status": "awaiting_rest",
            "battle_no": battle_no,
            "wins": wins,
            "enemy_raw": enemy_raw,
            "enemy_display": enemy_display,
            "player_state": player_state,
            "rest_status": default_rest_status(),
            "bp_earned_this_run": int(run.get("bp_earned_this_run") or 0) + win_bp + gained_streak_bonus,
        }
        save_if_needed(save, persistent)
        rest_menu(save, auto, persistent, client)
        if not auto:
            return


def start_new_challenge(
    client: ShowdownClient,
    save: dict[str, Any],
    args: argparse.Namespace,
    auto: bool,
    persistent: bool,
) -> None:
    run_seed = args.seed if args.seed is not None else random.SystemRandom().randrange(1, 2**32)
    rng = random.Random(run_seed)
    create_ready_run(client, save, run_seed, args.battles, auto)
    save_if_needed(save, persistent)
    run_current_challenge(client, save, rng, auto, persistent)


def continue_challenge(
    client: ShowdownClient,
    save: dict[str, Any],
    auto: bool,
    persistent: bool,
) -> None:
    run = save.get("current_run") or {}
    run_seed = int(run.get("seed") or random.SystemRandom().randrange(1, 2**32))
    rng = random.Random(run_seed)
    run_current_challenge(client, save, rng, auto, persistent)


def title_menu() -> tuple[dict[str, Any], bool]:
    while True:
        clear_screen()
        print("=" * 72)
        print("ChangeBattle - 宝可梦对战工厂文字版")
        print("=" * 72)
        print("1. 读取存档")
        print("2. 新游戏")
        print("q. 退出")
        raw = input("> ").strip().lower()
        if raw in {"q", "quit", "exit", "退出"}:
            raise KeyboardInterrupt
        if raw == "1":
            save = load_save()
            if not save:
                print("没有找到存档。")
                input("回车返回。")
                continue
            print(f"已读取存档：{save['trainer']['name']}")
            return save, bool(save.get("current_run"))
        if raw == "2":
            if SAVE_FILE.exists():
                confirm = input("已有存档，新游戏会覆盖。输入 yes 确认 > ").strip().lower()
                if confirm not in {"yes", "y", "确认"}:
                    continue
            name = prompt_trainer_name()
            gender = prompt_gender()
            save = create_save(name, gender)
            write_save(save)
            return save, False
        print("请选择 1、2 或 q。")


def game_main_menu(
    client: ShowdownClient,
    save: dict[str, Any],
    args: argparse.Namespace,
) -> int:
    while True:
        clear_screen()
        trainer = save.get("trainer") or {}
        print("=" * 72)
        print(f"ChangeBattle - {trainer.get('name', '训练师')}")
        print("=" * 72)
        print(f"当前挑战：{current_run_label(save)}")
        print("1. 开始对局")
        print("2. 用户信息")
        print("3. 退出游戏")
        raw = input("> ").strip().lower()
        if raw == "1":
            if save.get("current_run"):
                continue_challenge(client, save, False, True)
            else:
                start_new_challenge(client, save, args, False, True)
            input("\n回车返回主界面。")
            continue
        if raw == "2":
            show_user_info(save)
            continue
        if raw == "3":
            write_save(save)
            print("游戏已保存。")
            return 0
        print("请选择 1、2 或 3。")


def main() -> int:
    global DEBUG_LOGGER, EVENT_DELAY
    parser = argparse.ArgumentParser(description="Pokemon Battle Factory text prototype powered by Showdown.")
    parser.add_argument("--seed", type=int, default=None, help="固定随机种子，方便复现。")
    parser.add_argument("--battles", type=int, default=DEFAULT_BATTLES, help="连战场数，默认 7。")
    parser.add_argument("--auto", action="store_true", help="自动选择和自动行动，用于烟测。")
    parser.add_argument("--debug", action="store_true", help="记录 Showdown 原始消息、玩家视角日志和 CLI 解读结果。")
    parser.add_argument("--event-delay", type=float, default=EVENT_DELAY, help="手动模式每条战斗事件展示停顿秒数，默认 0.85。")
    args = parser.parse_args()
    EVENT_DELAY = max(0.0, float(args.event_delay))
    if args.debug:
        DEBUG_LOGGER = ShowdownDebugLogger()
        print(f"Showdown debug log: {DEBUG_LOGGER.path}")

    client = ShowdownClient()
    try:
        if args.auto:
            print("ChangeBattle - 宝可梦对战工厂文字版")
            auto_save = create_save("AUTO", "其他")
            start_new_challenge(client, auto_save, args, True, False)
            return 0

        save, resume_now = title_menu()
        if resume_now:
            continue_challenge(client, save, False, True)
            input("\n回车进入主界面。")
        return game_main_menu(client, save, args)
    except KeyboardInterrupt:
        print("\n已退出。")
        return 130
    finally:
        client.close()


if __name__ == "__main__":
    raise SystemExit(main())
