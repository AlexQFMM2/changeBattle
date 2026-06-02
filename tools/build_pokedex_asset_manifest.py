#!/usr/bin/env python3
"""Create the first-pass asset manifest and placeholder images."""

from __future__ import annotations

import argparse
import json
import struct
import zlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


DEFAULT_PROJECT = Path("/home/alexqfmm/workPlace/pokemonAbout")

TYPE_COLORS = {
    1: (168, 168, 120),
    2: (192, 48, 40),
    3: (168, 144, 240),
    4: (160, 64, 160),
    5: (224, 192, 104),
    6: (184, 160, 56),
    7: (168, 184, 32),
    8: (112, 88, 152),
    9: (184, 184, 208),
    10: (240, 128, 48),
    11: (104, 144, 240),
    12: (120, 200, 80),
    13: (248, 208, 48),
    14: (248, 88, 136),
    15: (152, 216, 216),
    16: (112, 88, 72),
    17: (112, 88, 152),
    18: (238, 153, 172),
}

PLACEHOLDER_COLORS = {
    "pokemon": (92, 124, 168),
    "item": (184, 144, 72),
    "type": (104, 116, 128),
    "move": (128, 112, 176),
    "ability": (80, 152, 136),
}


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def write_png(path: Path, color: tuple[int, int, int], size: int = 96) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    r, g, b = color
    rows = []
    border = tuple(max(0, value - 45) for value in color)
    highlight = tuple(min(255, value + 36) for value in color)
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            if x < 3 or y < 3 or x >= size - 3 or y >= size - 3:
                px = border
            elif abs(x - y) <= 1 or abs((size - 1 - x) - y) <= 1:
                px = highlight
            else:
                px = (r, g, b)
            row.extend(px)
        rows.append(bytes(row))
    raw = b"".join(rows)
    data = (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
        + png_chunk(b"IDAT", zlib.compress(raw, 9))
        + png_chunk(b"IEND", b"")
    )
    path.write_bytes(data)


def asset(path: str, source: str, license_note: str, credit: str = "") -> dict[str, str]:
    return {
        "path": path,
        "source": source,
        "license_note": license_note,
        "credit": credit,
    }


def build_manifest(project_dir: Path) -> dict[str, Any]:
    data_dir = project_dir / "data"
    assets_dir = project_dir / "assets"
    type_rows = read_jsonl(data_dir / "types.jsonl")

    for kind, color in PLACEHOLDER_COLORS.items():
        write_png(assets_dir / "placeholders" / f"{kind}.png", color)
    for row in type_rows:
        type_id = int(row["id"])
        write_png(assets_dir / "types" / f"{type_id}.png", TYPE_COLORS.get(type_id, PLACEHOLDER_COLORS["type"]))
    (assets_dir / "pokemon").mkdir(parents=True, exist_ok=True)
    (assets_dir / "items").mkdir(parents=True, exist_ok=True)
    (assets_dir / "ui").mkdir(parents=True, exist_ok=True)

    entries: dict[str, dict[str, Any]] = {}
    for row in type_rows:
        type_id = int(row["id"])
        entries[f"type:{type_id}"] = {
            "kind": "type",
            "id": type_id,
            "name": row.get("name"),
            "assets": {
                "icon": asset(
                    f"assets/types/{type_id}.png",
                    "generated",
                    "Generated solid-color type badge placeholder; safe to replace.",
                    "local-generator",
                )
            },
        }

    placeholders = {
        kind: asset(
            f"assets/placeholders/{kind}.png",
            "generated",
            "Generated placeholder image; safe to replace.",
            "local-generator",
        )
        for kind in ["pokemon", "item", "type", "move", "ability"]
    }

    return {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "base_path": ".",
        "lookup": {
            "key_format": "kind:id",
            "pokemon_primary": "pokemon:{pokemon_id}",
            "pokemon_fallback": "pokemon_dex:{national_dex_id}",
            "default_variant": "icon",
            "supported_kinds": ["pokemon", "item", "type", "move", "ability"],
            "supported_variants": ["icon", "sprite_front", "sprite_back", "card", "placeholder"],
        },
        "placeholders": placeholders,
        "entries": entries,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-dir", type=Path, default=DEFAULT_PROJECT)
    args = parser.parse_args()
    manifest = build_manifest(args.project_dir)
    out = args.project_dir / "data" / "assets.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"manifest": str(out), "entries": len(manifest["entries"])}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
