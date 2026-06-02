#!/usr/bin/env python3
"""Build natures.jsonl from dumped PokeDex nature tables."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any


DEFAULT_TABLES = Path("/mnt/DEX/pokedex-dump/dump/pokedex-direct/tables")
DEFAULT_OUT = Path("/home/alexqfmm/workPlace/pokemonAbout/data/natures.jsonl")
STAT_MAP = {
    "BS_ATK": "attack",
    "BS_DEF": "defense",
    "BS_SPD": "speed",
    "BS_SPATK": "special_attack",
    "BS_SPDEF": "special_defense",
}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def local_name(row: dict[str, str]) -> dict[str, str | None]:
    return {
        "en": row.get("NT_Name_0") or None,
        "zh_cn": row.get("NT_Name_1") or None,
    }


def modifier_value(delta: str) -> float:
    return 1.0 + float(delta or "0")


def build_natures(tables_dir: Path) -> list[dict[str, Any]]:
    names = {
        int(row["NT_ID"]): row
        for row in read_csv(tables_dir / "ID_NT_Name.csv")
        if row["NT_ID"] != "-1"
    }
    rows = []
    for row in read_csv(tables_dir / "DB_NO_NT.csv"):
        nature_id = int(row["NT_ID"])
        name = local_name(names[nature_id])
        modifiers = {
            stat: modifier_value(row[column])
            for column, stat in STAT_MAP.items()
        }
        increased = next((stat for stat, value in modifiers.items() if value > 1.0), None)
        decreased = next((stat for stat, value in modifiers.items() if value < 1.0), None)
        rows.append(
            {
                "id": nature_id,
                "name": name,
                "modifiers": modifiers,
                "increased_stat": increased,
                "decreased_stat": decreased,
            }
        )
    return rows


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tables-dir", type=Path, default=DEFAULT_TABLES)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    rows = build_natures(args.tables_dir)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8", newline="\n") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")
    print(json.dumps({"out": str(args.out), "natures": len(rows)}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
