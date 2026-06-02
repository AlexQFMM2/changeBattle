#!/usr/bin/env python3
"""Build battle-oriented JSONL assets from the dumped PokeDex SQLite tables."""

from __future__ import annotations

import argparse
import csv
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_INPUT = Path("/mnt/DEX/pokedex-dump/dump/pokedex-direct/tables")
DEFAULT_OUTPUT = Path("/home/alexqfmm/workPlace/pokemonAbout/data")
GAME_ID = 28
GAME_NAME = "Ultra Sun"


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def load_table(tables_dir: Path, name: str) -> list[dict[str, str]]:
    path = tables_dir / f"{name}.csv"
    if not path.exists():
        raise FileNotFoundError(f"missing required table: {path}")
    return read_csv(path)


def to_int(value: str | None) -> int | None:
    if value is None:
        return None
    value = value.strip()
    if not value or value == "-1":
        return None
    return int(value)


def to_number(value: str | None) -> int | float | None:
    if value is None:
        return None
    value = value.strip()
    if not value or value == "-1":
        return None
    try:
        number = float(value)
    except ValueError:
        return None
    if number.is_integer():
        return int(number)
    return number


def to_bool(value: str | None) -> bool | None:
    number = to_int(value)
    if number is None:
        return None
    return bool(number)


def clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    if not value or value == "---":
        return None
    return value


def localized(row: dict[str, str] | None, prefix: str) -> dict[str, str | None]:
    if not row:
        return {"en": None, "zh_cn": None}
    return {
        "en": clean_text(row.get(f"{prefix}_0")),
        "zh_cn": clean_text(row.get(f"{prefix}_1")),
    }


def is_placeholder_name(name: dict[str, str | None]) -> bool:
    return not (name.get("en") or name.get("zh_cn"))


def index_by(rows: list[dict[str, str]], key: str) -> dict[int, dict[str, str]]:
    result: dict[int, dict[str, str]] = {}
    for row in rows:
        row_id = to_int(row.get(key))
        if row_id is not None:
            result[row_id] = row
    return result


def enum_value(
    rows_by_id: dict[int, dict[str, str]],
    value_id: int | None,
    prefix: str,
) -> dict[str, Any] | None:
    if value_id is None:
        return None
    return {"id": value_id, "name": localized(rows_by_id.get(value_id), prefix)}


def write_json(path: Path, data: Any) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_jsonl(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def id_name_map(rows_by_id: dict[int, dict[str, str]], prefix: str) -> dict[str, dict[str, Any]]:
    return {
        str(row_id): {"id": row_id, "name": localized(row, prefix)}
        for row_id, row in sorted(rows_by_id.items())
        if row_id != -1 and not is_placeholder_name(localized(row, prefix))
    }


def build_assets(tables_dir: Path, out_dir: Path) -> dict[str, Any]:
    report: dict[str, Any] = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "warnings": [],
        "counts": {},
        "spot_checks": {},
        "unresolved_references": defaultdict(list),
    }

    pm_basic = load_table(tables_dir, "DB_PM_Basic")
    mv_basic = load_table(tables_dir, "DB_MV_Basic")
    it_basic = load_table(tables_dir, "DB_IT_Basic")
    ab_basic = load_table(tables_dir, "DB_AB_Basic")
    type_chart_raw = load_table(tables_dir, "DB_NO_VS")
    learnset_raw = load_table(tables_dir, "DB_PM_MV28")
    evo_raw = load_table(tables_dir, "DB_PM_Evo")

    pm_names = index_by(load_table(tables_dir, "ID_PM_Name"), "PM_ID_Dex1")
    pm_desc = index_by(load_table(tables_dir, "ID_PM_Des22"), "PM_Des_ID")
    pm_desc_usum = index_by(load_table(tables_dir, "ID_PM_Des28"), "PM_Des_ID")
    pm_forms = index_by(load_table(tables_dir, "ID_PM_Forme"), "PM_Forme_ID")
    pm_egg_groups = index_by(load_table(tables_dir, "ID_PM_EggGroup"), "PM_EggGroup_ID")
    pm_species = index_by(load_table(tables_dir, "ID_PM_Species"), "PM_Species_ID")
    pm_gender_ratios = index_by(load_table(tables_dir, "ID_PM_GenderRatio"), "PM_GenderRatio_ID")
    pm_colors = index_by(load_table(tables_dir, "ID_ID_Color"), "ID_Color_ID")
    pm_evo_types = index_by(load_table(tables_dir, "ID_PM_EvoType"), "PM_EvoType_ID")
    pm_evo_stages = index_by(load_table(tables_dir, "ID_PM_EvoStage"), "PM_EvoStage_ID")

    mv_names = index_by(load_table(tables_dir, "ID_MV_Name"), "MV_ID")
    mv_desc = index_by(load_table(tables_dir, "ID_MV_Des"), "MV_ID")
    mv_categories = index_by(load_table(tables_dir, "ID_MV_Category"), "MV_Category_ID")

    it_names = index_by(load_table(tables_dir, "ID_IT_Name"), "IT_ID")
    it_desc = index_by(load_table(tables_dir, "ID_IT_Des"), "IT_ID")

    ab_names = index_by(load_table(tables_dir, "ID_AB_Name"), "AB_ID")
    ab_desc = index_by(load_table(tables_dir, "ID_AB_Des"), "AB_ID")
    ab_triggers = index_by(load_table(tables_dir, "ID_AB_Trigger"), "AB_Trigger_ID")
    ab_targets = index_by(load_table(tables_dir, "ID_AB_Target"), "AB_Target_ID")
    ab_effect_on = index_by(load_table(tables_dir, "ID_AB_EffectOn"), "AB_EffectOn_ID")

    types_by_id = index_by(load_table(tables_dir, "ID_ID_Type"), "ID_Type_ID")
    games_by_id = index_by(load_table(tables_dir, "ID_ID_Game"), "ID_Game_ID")
    generations = index_by(load_table(tables_dir, "ID_ID_Generation"), "ID_Gen_ID")
    natures = index_by(load_table(tables_dir, "ID_NT_Name"), "NT_ID")
    level_names = index_by(load_table(tables_dir, "ID_LV_Name"), "LV_ID")

    def type_ref(type_id: int | None) -> dict[str, Any] | None:
        return enum_value(types_by_id, type_id, "ID_Type")

    def ability_ref(ability_id: int | None) -> dict[str, Any] | None:
        if ability_id is None:
            return None
        return {"id": ability_id, "name": localized(ab_names.get(ability_id), "AB_Name")}

    def pokemon_ref(pokemon_id: int | None) -> dict[str, Any] | None:
        if pokemon_id is None:
            return None
        row = pokemon_by_id.get(pokemon_id)
        dex_id = to_int(row.get("PM_ID_Dex1")) if row else None
        return {
            "id": pokemon_id,
            "national_dex_id": dex_id,
            "name": localized(pm_names.get(dex_id), "PM_Name"),
        }

    pokemon_by_id = {
        to_int(row.get("PM_ID")): row
        for row in pm_basic
        if to_int(row.get("PM_ID")) is not None
    }

    pokemon_rows: list[dict[str, Any]] = []
    for row in pm_basic:
        pokemon_id = to_int(row.get("PM_ID"))
        if pokemon_id is None:
            continue
        national_id = to_int(row.get("PM_ID_Dex1"))
        name = localized(pm_names.get(national_id), "PM_Name")
        if is_placeholder_name(name):
            continue
        desc_id = to_int(row.get("PM_Des_ID28"))
        description = localized(pm_desc_usum.get(desc_id), "PM_Des")
        if not (description.get("en") or description.get("zh_cn")):
            desc_id = to_int(row.get("PM_Des_ID22"))
            description = localized(pm_desc.get(desc_id), "PM_Des")
        pokemon_rows.append(
            {
                "id": pokemon_id,
                "national_dex_id": national_id,
                "regional_dex_ids": {
                    f"dex{i}": to_int(row.get(f"PM_ID_Dex{i}"))
                    for i in range(2, 15)
                    if to_int(row.get(f"PM_ID_Dex{i}")) is not None
                },
                "name": name,
                "description": description,
                "form": enum_value(pm_forms, to_int(row.get("PM_Forme_ID")), "PM_Forme"),
                "types": [
                    value
                    for value in [
                        type_ref(to_int(row.get("Type1_ID"))),
                        type_ref(to_int(row.get("Type2_ID"))),
                    ]
                    if value is not None
                ],
                "abilities": {
                    "primary": ability_ref(to_int(row.get("Ability1_ID"))),
                    "secondary": ability_ref(to_int(row.get("Ability2_ID"))),
                    "hidden": ability_ref(to_int(row.get("AbilityH_ID"))),
                },
                "egg_groups": [
                    value
                    for value in [
                        enum_value(pm_egg_groups, to_int(row.get("PM_EggGroup1_ID")), "PM_EggGroup"),
                        enum_value(pm_egg_groups, to_int(row.get("PM_EggGroup2_ID")), "PM_EggGroup"),
                    ]
                    if value is not None
                ],
                "gender_ratio": enum_value(pm_gender_ratios, to_int(row.get("PM_GenderRatio_ID")), "PM_GenderRatio"),
                "species": enum_value(pm_species, to_int(row.get("PM_Species_ID")), "PM_Species"),
                "color": enum_value(pm_colors, to_int(row.get("PM_Color_ID")), "ID_Color"),
                "catch_rate": to_int(row.get("PM_CatchRate")),
                "hatch_cycle": to_int(row.get("PM_HatchCycle")),
                "base_tameness": to_int(row.get("PM_BaseTameness")),
                "base_exp": to_int(row.get("PM_Exp")),
                "exp_at_level_100": to_int(row.get("PM_Exp100")),
                "height_m": to_number(row.get("PM_Height_1")),
                "weight_kg": to_number(row.get("PM_Weight_1")),
                "base_stats": {
                    "hp": to_int(row.get("BS_HP")),
                    "attack": to_int(row.get("BS_ATK")),
                    "defense": to_int(row.get("BS_DEF")),
                    "special_attack": to_int(row.get("BS_SPATK")),
                    "special_defense": to_int(row.get("BS_SPDEF")),
                    "speed": to_int(row.get("BS_SPD")),
                    "total": to_int(row.get("BS_TTL")),
                },
                "ev_yield": {
                    "hp": to_int(row.get("EV_HP")),
                    "attack": to_int(row.get("EV_ATK")),
                    "defense": to_int(row.get("EV_DEF")),
                    "special_attack": to_int(row.get("EV_SPATK")),
                    "special_defense": to_int(row.get("EV_SPDEF")),
                    "speed": to_int(row.get("EV_SPD")),
                    "total": to_int(row.get("EV_TTL")),
                },
                "defensive_type_multipliers": {
                    str(i): to_number(row.get(f"PM_VSType{i}"))
                    for i in range(1, 19)
                },
            }
        )

    move_rows: list[dict[str, Any]] = []
    for row in mv_basic:
        move_id = to_int(row.get("MV_ID"))
        if move_id is None:
            continue
        name = localized(mv_names.get(move_id), "MV_Name")
        if is_placeholder_name(name):
            continue
        move_rows.append(
            {
                "id": move_id,
                "name": name,
                "description": localized(mv_desc.get(move_id), "MV_Des"),
                "generation": enum_value(generations, to_int(row.get("Gen_ID")), "ID_Gen"),
                "type": type_ref(to_int(row.get("Type_ID"))),
                "category": enum_value(mv_categories, to_int(row.get("MV_Category_ID")), "MV_Category"),
                "range_id": to_int(row.get("MV_Range_ID")),
                "power": to_int(row.get("MV_Power")),
                "accuracy": to_int(row.get("MV_Accuracy")),
                "pp": to_int(row.get("MV_PP")),
                "priority": to_int(row.get("MV_Priority")),
                "learn_level_reference_ids": {
                    f"gen{i}": to_int(row.get(f"MV_Gen{i}LV_ID"))
                    for i in range(1, 8)
                    if to_int(row.get(f"MV_Gen{i}LV_ID")) is not None
                },
            }
        )

    ability_rows: list[dict[str, Any]] = []
    for row in ab_basic:
        ability_id = to_int(row.get("AB_ID"))
        if ability_id is None:
            continue
        name = localized(ab_names.get(ability_id), "AB_Name")
        if is_placeholder_name(name):
            continue
        ability_rows.append(
            {
                "id": ability_id,
                "name": name,
                "description": localized(ab_desc.get(ability_id), "AB_Des"),
                "generation": enum_value(generations, to_int(row.get("Gen_ID")), "ID_Gen"),
                "trigger": enum_value(ab_triggers, to_int(row.get("AB_Trigger_ID")), "AB_Trigger"),
                "target": enum_value(ab_targets, to_int(row.get("AB_Target_ID")), "AB_Target"),
                "effect_on": enum_value(ab_effect_on, to_int(row.get("AB_EffectOn_ID")), "AB_EffectOn"),
            }
        )

    item_rows: list[dict[str, Any]] = []
    for row in it_basic:
        item_id = to_int(row.get("IT_ID"))
        if item_id is None:
            continue
        name = localized(it_names.get(item_id), "IT_Name")
        if is_placeholder_name(name):
            continue
        item_rows.append(
            {
                "id": item_id,
                "name": name,
                "description": localized(it_desc.get(item_id), "IT_Des"),
                "is_valid": to_bool(row.get("IT_IsValid")),
                "price": to_int(row.get("Price")),
                "bag_id": to_int(row.get("IT_Bag_ID")),
                "available_generations": [
                    generation
                    for generation in range(1, 8)
                    if to_bool(row.get(f"IT_IsInGen{generation}"))
                ],
                "usable_in_battle": to_bool(row.get("IT_IsInBattle")),
                "usable_out_of_battle": to_bool(row.get("IT_IsOutBattle")),
                "one_time_use": to_bool(row.get("IT_IsOneTime")),
                "held_effect": to_bool(row.get("IT_IsHeldEffect")),
                "evolve_related": to_bool(row.get("IT_IsEvolveRelated")),
            }
        )

    type_rows = [
        {"id": type_id, "name": localized(row, "ID_Type")}
        for type_id, row in sorted(types_by_id.items())
        if type_id != -1 and not is_placeholder_name(localized(row, "ID_Type"))
    ]

    type_chart_rows: list[dict[str, Any]] = []
    for row in type_chart_raw:
        attack_type_id = to_int(row.get("VS_ID"))
        if attack_type_id is None:
            continue
        type_chart_rows.append(
            {
                "attack_type": type_ref(attack_type_id),
                "defense_multipliers": {
                    str(i): to_number(row.get(f"Type{i}"))
                    for i in range(1, 19)
                },
            }
        )

    learnsets_by_pm: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for row in learnset_raw:
        pokemon_id = to_int(row.get("PM_ID"))
        move_id = to_int(row.get("MV_ID"))
        if pokemon_id is None or move_id is None:
            continue
        level_id = to_int(row.get("LV_ID"))
        learnsets_by_pm[pokemon_id].append(
            {
                "move_id": move_id,
                "move_name": localized(mv_names.get(move_id), "MV_Name"),
                "level_id": level_id,
                "level_text": clean_text(level_names.get(level_id, {}).get("LV_Name_0")) if level_id is not None else None,
            }
        )
    learnset_rows = [
        {
            "pokemon_id": pokemon_id,
            "pokemon": pokemon_ref(pokemon_id),
            "game_id": GAME_ID,
            "game": enum_value(games_by_id, GAME_ID, "ID_Game"),
            "moves": sorted(moves, key=lambda x: ((x["level_id"] or 9999), x["move_id"])),
        }
        for pokemon_id, moves in sorted(learnsets_by_pm.items())
    ]

    evo_rows: list[dict[str, Any]] = []
    for row in evo_raw:
        pokemon_id = to_int(row.get("PM_ID"))
        if pokemon_id is None:
            continue
        evo_rows.append(
            {
                "pokemon_id": pokemon_id,
                "pokemon": pokemon_ref(pokemon_id),
                "evolution_family": to_int(row.get("PM_EvoFamily")),
                "stage": enum_value(pm_evo_stages, to_int(row.get("PM_EvoStage_ID")), "PM_EvoStage"),
                "max_stage": to_int(row.get("PM_EvoStage_Max")),
                "previous_pokemon": pokemon_ref(to_int(row.get("PM_ID_Pre"))),
                "evolution_type": enum_value(pm_evo_types, to_int(row.get("PM_EvoType_ID")), "PM_EvoType"),
                "evolution_subtype_id": to_int(row.get("PM_EvoSubType_ID")),
            }
        )

    ids = {
        "types": id_name_map(types_by_id, "ID_Type"),
        "move_categories": id_name_map(mv_categories, "MV_Category"),
        "games": id_name_map(games_by_id, "ID_Game"),
        "generations": id_name_map(generations, "ID_Gen"),
        "natures": id_name_map(natures, "NT_Name"),
        "egg_groups": id_name_map(pm_egg_groups, "PM_EggGroup"),
        "evolution_types": id_name_map(pm_evo_types, "PM_EvoType"),
        "evolution_stages": id_name_map(pm_evo_stages, "PM_EvoStage"),
        "ability_triggers": id_name_map(ab_triggers, "AB_Trigger"),
        "ability_targets": id_name_map(ab_targets, "AB_Target"),
        "ability_effect_on": id_name_map(ab_effect_on, "AB_EffectOn"),
    }

    out_dir.mkdir(parents=True, exist_ok=True)
    outputs = {
        "pokemon.jsonl": pokemon_rows,
        "moves.jsonl": move_rows,
        "abilities.jsonl": ability_rows,
        "items.jsonl": item_rows,
        "types.jsonl": type_rows,
        "type_chart.jsonl": type_chart_rows,
        "learnsets_usum.jsonl": learnset_rows,
        "evolutions.jsonl": evo_rows,
    }
    for filename, rows in outputs.items():
        write_jsonl(out_dir / filename, rows)
        report["counts"][filename] = len(rows)

    metadata = {
        "source": {
            "dex": "PokeDex_v1.2Build34",
            "dump_tables": str(tables_dir),
        },
        "rule_version": {
            "generation": 7,
            "game_id": GAME_ID,
            "game": GAME_NAME,
            "learnset_table": "DB_PM_MV28",
        },
        "languages": {
            "en": "*_0",
            "zh_cn": "*_1",
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    write_json(out_dir / "metadata.json", metadata)
    write_json(out_dir / "ids.json", ids)

    valid_type_ids = set(types_by_id)
    report["spot_checks"] = {
        "bulbasaur": next((row for row in pokemon_rows if row["id"] == 1), None),
        "pound": next((row for row in move_rows if row["id"] == 1), None),
        "master_ball": next((row for row in item_rows if row["id"] == 1), None),
        "drizzle": next((row for row in ability_rows if row["id"] == 2), None),
        "type_chart": {
            "normal_vs_ghost": next((row["defense_multipliers"].get("8") for row in type_chart_rows if row["attack_type"]["id"] == 1), None),
            "electric_vs_water": next((row["defense_multipliers"].get("11") for row in type_chart_rows if row["attack_type"]["id"] == 13), None),
            "fire_vs_water": next((row["defense_multipliers"].get("11") for row in type_chart_rows if row["attack_type"]["id"] == 10), None),
        },
    }
    for pokemon in pokemon_rows:
        for typ in pokemon["types"]:
            if typ["id"] not in valid_type_ids:
                report["unresolved_references"]["pokemon.type"].append({"pokemon_id": pokemon["id"], "type_id": typ["id"]})
    for item in item_rows:
        if item["bag_id"] is not None:
            report["unresolved_references"]["item.bag_id_name_missing"].append({"item_id": item["id"], "bag_id": item["bag_id"]})

    report["warnings"].append("IT_Bag_ID has no matching ID_IT_Bag table in the dump; bag_id is preserved as a raw integer.")
    report["unresolved_references"] = dict(report["unresolved_references"])
    write_json(out_dir / "validation_report.json", report)
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tables-dir", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    report = build_assets(args.tables_dir, args.out_dir)
    print(json.dumps({"out_dir": str(args.out_dir), "counts": report["counts"]}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
