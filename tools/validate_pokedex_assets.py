#!/usr/bin/env python3
"""Validate and exercise the PokeDex asset manifest lookup rules."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


DEFAULT_PROJECT = Path("/home/alexqfmm/workPlace/pokemonAbout")
DEFAULT_VARIANT = "icon"


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def load_manifest(project_dir: Path) -> dict[str, Any]:
    with (project_dir / "data" / "assets.json").open("r", encoding="utf-8") as f:
        return json.load(f)


def resolve_asset(
    manifest: dict[str, Any],
    kind: str,
    item_id: int,
    variant: str = DEFAULT_VARIANT,
    national_dex_id: int | None = None,
) -> dict[str, Any]:
    entries = manifest.get("entries", {})
    keys = [f"{kind}:{item_id}"]
    if kind == "pokemon" and national_dex_id is not None:
        keys.append(f"pokemon_dex:{national_dex_id}")
    for key in keys:
        entry = entries.get(key)
        if not entry:
            continue
        assets = entry.get("assets", {})
        if variant in assets:
            return {"key": key, "variant": variant, "asset": assets[variant], "fallback": False}
        if DEFAULT_VARIANT in assets:
            return {"key": key, "variant": DEFAULT_VARIANT, "asset": assets[DEFAULT_VARIANT], "fallback": False}
    placeholder = manifest.get("placeholders", {}).get(kind)
    if placeholder:
        return {"key": f"placeholder:{kind}", "variant": "placeholder", "asset": placeholder, "fallback": True}
    raise KeyError(f"no asset and no placeholder for {kind}:{item_id}")


def validate(project_dir: Path) -> dict[str, Any]:
    manifest = load_manifest(project_dir)
    data_dir = project_dir / "data"
    report: dict[str, Any] = {
        "checked_manifest": str(data_dir / "assets.json"),
        "missing_files": [],
        "invalid_entries": [],
        "resolution_samples": [],
        "resolution_counts": {},
    }

    required_asset_fields = {"path", "source", "license_note", "credit"}
    asset_objects: list[tuple[str, str, dict[str, Any]]] = []
    for kind, asset in manifest.get("placeholders", {}).items():
        asset_objects.append((f"placeholder:{kind}", "placeholder", asset))
    for key, entry in manifest.get("entries", {}).items():
        for variant, asset in entry.get("assets", {}).items():
            if not {"kind", "id", "assets"}.issubset(entry):
                report["invalid_entries"].append({"key": key, "reason": "entry missing kind/id/assets"})
            asset_objects.append((key, variant, asset))

    for key, variant, asset in asset_objects:
        missing = sorted(required_asset_fields - set(asset))
        if missing:
            report["invalid_entries"].append({"key": key, "variant": variant, "reason": f"asset missing {missing}"})
            continue
        path = project_dir / asset["path"]
        if not path.exists():
            report["missing_files"].append({"key": key, "variant": variant, "path": asset["path"]})

    samples = {
        "pokemon": read_jsonl(data_dir / "pokemon.jsonl")[:12],
        "item": read_jsonl(data_dir / "items.jsonl")[:12],
        "type": read_jsonl(data_dir / "types.jsonl"),
        "move": read_jsonl(data_dir / "moves.jsonl")[:12],
        "ability": read_jsonl(data_dir / "abilities.jsonl")[:12],
    }
    for kind, rows in samples.items():
        fallback_count = 0
        for row in rows:
            national_id = row.get("national_dex_id") if kind == "pokemon" else None
            resolved = resolve_asset(manifest, kind, int(row["id"]), DEFAULT_VARIANT, national_id)
            if resolved["fallback"]:
                fallback_count += 1
            path = project_dir / resolved["asset"]["path"]
            if not path.exists():
                report["missing_files"].append({"key": resolved["key"], "variant": resolved["variant"], "path": resolved["asset"]["path"]})
            report["resolution_samples"].append(
                {
                    "kind": kind,
                    "id": row["id"],
                    "name": row.get("name"),
                    "resolved_key": resolved["key"],
                    "variant": resolved["variant"],
                    "path": resolved["asset"]["path"],
                    "fallback": resolved["fallback"],
                }
            )
        report["resolution_counts"][kind] = {"sampled": len(rows), "fallback": fallback_count}

    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project-dir", type=Path, default=DEFAULT_PROJECT)
    parser.add_argument("--write-report", action="store_true")
    args = parser.parse_args()
    report = validate(args.project_dir)
    if args.write_report:
        out = args.project_dir / "data" / "assets_validation_report.json"
        out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if report["missing_files"] or report["invalid_entries"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
