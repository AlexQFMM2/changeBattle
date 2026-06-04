#!/usr/bin/env python3
"""Fill missing move/item Chinese names from 52poke page titles."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import re
import subprocess
from pathlib import Path
from urllib.parse import quote


DEFAULT_SHOWDOWN_PATH = Path("/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown")
DEFAULT_TRANSLATIONS = Path("data/zh_cn_overrides.json")
DEFAULT_CACHE = Path("work/52poke_title_cache.json")
TITLE_RE = re.compile(r"<title>([^<]+?)（(招式|道具)）")


def normalize_id(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def load_showdown(showdown_path: Path) -> dict[str, list[dict[str, str]]]:
    script = """
const {Dex} = require(process.argv[1] + '/dist/sim');
const moves = Dex.moves.all().filter(m => m.exists && m.id).map(m => ({id: m.id, name: m.name}));
const items = Dex.items.all().filter(i => i.exists && i.id).map(i => ({id: i.id, name: i.name}));
console.log(JSON.stringify({moves, items}));
"""
    result = subprocess.run(["node", "-e", script, str(showdown_path)], check=True, text=True, capture_output=True)
    return json.loads(result.stdout)


def wiki_slug(name: str) -> str:
    return quote(name.replace(" ", "_"), safe="_-()")


def fetch_title(name: str, kind: str) -> tuple[str, str, str | None]:
    url = f"https://wiki.52poke.com/wiki/{wiki_slug(name)}"
    result = subprocess.run(
        ["curl", "-fsSL", "--connect-timeout", "10", "--max-time", "30", url],
        text=True,
        capture_output=True,
    )
    if result.returncode != 0:
        return name, kind, None
    match = TITLE_RE.search(result.stdout)
    if not match or match.group(2) != kind:
        return name, kind, None
    title = match.group(1).strip()
    if not title or re.search(r"[A-Za-z]{3,}", title):
        return name, kind, None
    return name, kind, title


def missing_rows(rows: list[dict[str, str]], translations: dict[str, str]) -> list[dict[str, str]]:
    translated = {normalize_id(key) for key, value in translations.items() if value}
    return [row for row in rows if normalize_id(row["name"]) not in translated]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--showdown-path", type=Path, default=DEFAULT_SHOWDOWN_PATH)
    parser.add_argument("--translations", type=Path, default=DEFAULT_TRANSLATIONS)
    parser.add_argument("--cache", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--jobs", type=int, default=8)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    translations = json.loads(args.translations.read_text(encoding="utf-8"))
    showdown = load_showdown(args.showdown_path)
    cache = json.loads(args.cache.read_text(encoding="utf-8")) if args.cache.exists() else {}
    tasks: list[tuple[str, str]] = []
    for section, kind in [("moves", "招式"), ("items", "道具")]:
        for row in missing_rows(showdown[section], translations.get(section, {})):
            key = f"{section}:{row['name']}"
            if key in cache:
                continue
            tasks.append((row["name"], kind))

    completed = 0
    with ThreadPoolExecutor(max_workers=max(1, args.jobs)) as pool:
        futures = {pool.submit(fetch_title, name, kind): (name, kind) for name, kind in tasks}
        for future in as_completed(futures):
            name, kind, title = future.result()
            section = "moves" if kind == "招式" else "items"
            cache[f"{section}:{name}"] = title or ""
            completed += 1
            if completed % 25 == 0 or completed == len(tasks):
                print(f"{completed}/{len(tasks)}", flush=True)

    added = {"moves": 0, "items": 0}
    for section in ["moves", "items"]:
        mapping = translations.setdefault(section, {})
        translated = {normalize_id(key) for key, value in mapping.items() if value}
        for key, title in cache.items():
            cache_section, name = key.split(":", 1)
            if cache_section != section or not title or normalize_id(name) in translated:
                continue
            mapping[name] = title
            translated.add(normalize_id(name))
            added[section] += 1
        translations[section] = dict(sorted(mapping.items(), key=lambda item: normalize_id(item[0])))

    if not args.dry_run:
        args.translations.write_text(json.dumps(translations, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.cache.parent.mkdir(parents=True, exist_ok=True)
    args.cache.write_text(json.dumps(cache, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"queried": len(tasks), "added": added}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
