#!/usr/bin/env python3
"""Generate the default BP goods table from the local Showdown data."""

from __future__ import annotations

import csv
import sys
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from core.showdown_client import ShowdownClient  # noqa: E402


GOODS_FILE = PROJECT_ROOT / "data" / "goods.csv"
FIELDS = ["item_id", "item_type", "item_name", "item_cost"]


def main() -> int:
    GOODS_FILE.parent.mkdir(parents=True, exist_ok=True)
    client = ShowdownClient()
    try:
        rows = client.goods_defaults().get("rows") or []
    finally:
        client.close()

    cleaned = []
    seen: set[tuple[str, str]] = set()
    for row in rows:
        item_id = str(row.get("item_id") or "").strip()
        item_type = str(row.get("item_type") or "").strip()
        if not item_id or not item_type:
            continue
        key = (item_type, item_id)
        if key in seen:
            continue
        seen.add(key)
        cleaned.append({
            "item_id": item_id,
            "item_type": item_type,
            "item_name": str(row.get("item_name") or item_id),
            "item_cost": int(row.get("item_cost") or 0),
        })

    cleaned.sort(key=lambda row: (row["item_type"], row["item_id"]))
    with GOODS_FILE.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(cleaned)

    counts: dict[str, int] = {}
    for row in cleaned:
        counts[row["item_type"]] = counts.get(row["item_type"], 0) + 1
    print(f"wrote {GOODS_FILE}")
    for item_type, count in sorted(counts.items()):
        print(f"{item_type}: {count}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
