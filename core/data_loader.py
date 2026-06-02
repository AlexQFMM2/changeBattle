"""Small JSONL helpers shared by CLI and future UI layers."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def load_jsonl(path: str | Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with Path(path).open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def index_by_id(rows: list[dict[str, Any]]) -> dict[int, dict[str, Any]]:
    return {int(row["id"]): row for row in rows}


def load_data_table(data_dir: str | Path, filename: str) -> list[dict[str, Any]]:
    return load_jsonl(Path(data_dir) / filename)


def load_pokemon(data_dir: str | Path) -> dict[int, dict[str, Any]]:
    return index_by_id(load_data_table(data_dir, "pokemon.jsonl"))


def load_natures(data_dir: str | Path) -> dict[int, dict[str, Any]]:
    return index_by_id(load_data_table(data_dir, "natures.jsonl"))
