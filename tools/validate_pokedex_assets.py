#!/usr/bin/env python3
"""Validate the local asset manifest without depending on battle data files."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


DEFAULT_PROJECT = Path(__file__).resolve().parents[1]


def load_manifest(project_dir: Path) -> dict[str, Any]:
    with (project_dir / "data" / "assets.json").open("r", encoding="utf-8") as f:
        return json.load(f)


def collect_assets(manifest: dict[str, Any]) -> list[tuple[str, str, dict[str, Any]]]:
    assets: list[tuple[str, str, dict[str, Any]]] = []
    for kind, asset in manifest.get("placeholders", {}).items():
        assets.append((f"placeholder:{kind}", "placeholder", asset))
    for key, entry in manifest.get("entries", {}).items():
        for variant, asset in entry.get("assets", {}).items():
            assets.append((key, variant, asset))
    return assets


def validate(project_dir: Path) -> dict[str, Any]:
    manifest = load_manifest(project_dir)
    report: dict[str, Any] = {
        "checked_manifest": str(project_dir / "data" / "assets.json"),
        "asset_count": 0,
        "missing_files": [],
        "invalid_entries": [],
    }

    required_asset_fields = {"path", "source", "license_note", "credit"}
    for key, variant, asset in collect_assets(manifest):
        report["asset_count"] += 1
        missing = sorted(required_asset_fields - set(asset))
        if missing:
            report["invalid_entries"].append({"key": key, "variant": variant, "reason": f"asset missing {missing}"})
            continue
        path = project_dir / asset["path"]
        if not path.exists():
            report["missing_files"].append({"key": key, "variant": variant, "path": asset["path"]})

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
