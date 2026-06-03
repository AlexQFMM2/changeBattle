"""Small Chinese display layer for the text prototype."""

from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
TRANSLATION_FILE = PROJECT_ROOT / "data" / "zh_cn_overrides.json"
DETAIL_FILE = PROJECT_ROOT / "data" / "zh_cn_details.json"


def normalize_id(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


@lru_cache(maxsize=1)
def load_translations() -> dict[str, Any]:
    if not TRANSLATION_FILE.exists():
        return {}
    with TRANSLATION_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)
    sections = [
        "species",
        "moves",
        "abilities",
        "items",
        "roles",
        "statuses",
        "stats",
        "types",
        "categories",
        "natures",
    ]
    for section in sections:
        mapping = data.get(section, {})
        normalized = {normalize_id(key): value for key, value in mapping.items()}
        data[f"{section}_normalized"] = normalized
    return data


@lru_cache(maxsize=1)
def load_details() -> dict[str, Any]:
    if not DETAIL_FILE.exists():
        return {}
    with DETAIL_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)
    for section in ["moves", "abilities", "items"]:
        mapping = data.get(section, {})
        normalized = {normalize_id(key): value for key, value in mapping.items()}
        data[f"{section}_normalized"] = normalized
    return data


def zh(section: str, value: str | None, *, fallback: str | None = None, show_en: bool = True) -> str:
    if not value:
        return fallback or ""
    data = load_translations()
    text = str(value)
    translated = (data.get(section) or {}).get(text)
    if translated is None:
        translated = (data.get(f"{section}_normalized") or {}).get(normalize_id(text))
    if translated:
        return f"{translated} ({text})" if show_en and translated != text else translated
    return fallback or text


def zh_plain(section: str, value: str | None) -> str:
    return zh(section, value, show_en=False)


def zh_detail(section: str, value: str | None) -> dict[str, Any]:
    if not value:
        return {}
    data = load_details()
    text = str(value)
    detail = (data.get(section) or {}).get(text)
    if detail is None:
        detail = (data.get(f"{section}_normalized") or {}).get(normalize_id(text))
    return detail or {}


def zh_condition(condition: str | None) -> str:
    if not condition:
        return "?"
    parts = str(condition).split()
    if len(parts) <= 1:
        return condition
    status = parts[-1]
    translated = zh_plain("statuses", status)
    if translated == status:
        return condition
    return " ".join(parts[:-1] + [translated])
