#!/usr/bin/env python3
"""Cache Pokemon Showdown sprite PNGs referenced by sprite_index_map.json."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path


DEFAULT_MAP = Path("data/sprite_index_map.json")
DEFAULT_REMOTE_BASE = "https://play.pokemonshowdown.com/sprites"
USER_AGENT = "ChangeBattle sprite cache/1.0"
SPRITE_VARIANTS = [
    "front_normal",
    "back_normal",
    "front_shiny",
    "back_shiny",
    "front_normal_full",
    "front_shiny_full",
]


def read_manifest(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def remote_url(local_path: str, local_base: str, remote_base: str) -> str:
    normalized_path = local_path.replace("\\", "/")
    normalized_base = local_base.strip("/").replace("\\", "/")
    if not normalized_path.startswith(f"{normalized_base}/"):
        raise ValueError(f"{local_path} is not under {local_base}")
    suffix = normalized_path[len(normalized_base) + 1:]
    return f"{remote_base.rstrip('/')}/{suffix}"


def download(url: str, out_path: Path, retries: int = 2) -> tuple[bool, str]:
    if out_path.exists() and out_path.stat().st_size > 0:
        return True, "cached"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    last_error = ""
    for attempt in range(retries + 1):
        result = subprocess.run(
            [
                "curl",
                "-fsSL",
                "--connect-timeout",
                "10",
                "--max-time",
                "30",
                "-A",
                USER_AGENT,
                url,
                "-o",
                str(out_path),
            ],
            text=True,
            capture_output=True,
        )
        if result.returncode == 0 and out_path.exists() and out_path.stat().st_size > 0:
            return True, "downloaded"
        out_path.unlink(missing_ok=True)
        last_error = (result.stderr or result.stdout or f"curl exited {result.returncode}").strip()
        if "The requested URL returned error: 404" in last_error:
            return False, "HTTP 404"
        if attempt < retries:
            time.sleep(0.5 + attempt)
    return False, last_error or "download failed"


def fallback_variant(variant: str) -> str | None:
    return {
        "front_normal_full": "front_normal",
        "front_shiny_full": "front_shiny",
        "front_shiny": "front_normal",
        "back_shiny": "back_normal",
        "back_normal": "front_normal",
    }.get(variant)


def normalize_id(value: str) -> str:
    return "".join(char for char in str(value or "").lower() if char.isalnum())


def fallback_paths(entries: dict, species_id: str, variant: str) -> list[Path]:
    entry = entries.get(species_id) or {}
    paths = entry.get("paths") or {}
    candidates: list[Path] = []
    variant_fallback = fallback_variant(variant)
    if variant_fallback and paths.get(variant_fallback):
        candidates.append(Path(paths[variant_fallback]))
    base_id = normalize_id(entry.get("base_species") or "")
    base_paths = (entries.get(base_id) or {}).get("paths") or {}
    for key in [variant, variant_fallback, "front_normal"]:
        if key and base_paths.get(key):
            candidates.append(Path(base_paths[key]))
    seen: set[str] = set()
    unique: list[Path] = []
    for path in candidates:
        normalized = str(path)
        if normalized not in seen:
            seen.add(normalized)
            unique.append(path)
    return unique


def main() -> int:
    parser = argparse.ArgumentParser(description="Download Showdown sprites referenced by the local manifest")
    parser.add_argument("--map", type=Path, default=DEFAULT_MAP)
    parser.add_argument("--remote-base", default=DEFAULT_REMOTE_BASE)
    parser.add_argument("--local-base", default=None)
    parser.add_argument("--variants", nargs="*", default=SPRITE_VARIANTS, choices=SPRITE_VARIANTS)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--jobs", type=int, default=12)
    parser.add_argument("--fail-list", type=Path, default=Path("work/showdown_sprite_download_failures.txt"))
    args = parser.parse_args()

    manifest = read_manifest(args.map)
    local_base = args.local_base or manifest.get("showdown_asset_base") or "assets/pokemon-showdown"
    entries = manifest.get("entries") or {}
    tasks: list[tuple[str, str, Path, str]] = []
    queued_paths: set[str] = set()
    for species_id, entry in entries.items():
        paths = entry.get("paths") or {}
        for variant in args.variants:
            path = paths.get(variant)
            if not path or path.startswith(("http://", "https://")):
                continue
            normalized_path = path.replace("\\", "/")
            if normalized_path in queued_paths:
                continue
            queued_paths.add(normalized_path)
            tasks.append((species_id, variant, Path(path), remote_url(path, local_base, args.remote_base)))
            if args.limit and len(tasks) >= args.limit:
                break
        if args.limit and len(tasks) >= args.limit:
            break

    downloaded = 0
    cached = 0
    raw_failures: list[tuple[str, str, Path, str, str]] = []
    completed = 0
    with ThreadPoolExecutor(max_workers=max(1, args.jobs)) as pool:
        futures = {
            pool.submit(download, url, out_path): (species_id, variant, out_path, url)
            for species_id, variant, out_path, url in tasks
        }
        for future in as_completed(futures):
            species_id, variant, out_path, url = futures[future]
            ok, status = future.result()
            completed += 1
            if ok:
                if status == "cached":
                    cached += 1
                else:
                    downloaded += 1
            else:
                raw_failures.append((species_id, variant, out_path, url, status))
            if completed % 50 == 0 or completed == len(tasks):
                print(f"{completed}/{len(tasks)} cached={cached} downloaded={downloaded} failed={len(raw_failures)}", flush=True)

    copied_fallbacks = 0
    failures: list[str] = []
    for species_id, variant, out_path, url, status in raw_failures:
        for fallback_path in fallback_paths(entries, species_id, variant):
            if fallback_path.exists() and fallback_path.stat().st_size > 0:
                out_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(fallback_path, out_path)
                copied_fallbacks += 1
                break
        else:
            failures.append(f"{species_id}\t{variant}\t{url}\t{status}")

    if failures:
        args.fail_list.parent.mkdir(parents=True, exist_ok=True)
        args.fail_list.write_text("\n".join(failures) + "\n", encoding="utf-8")
        print(f"wrote failures: {args.fail_list}", file=sys.stderr)
    print({"tasks": len(tasks), "cached": cached, "downloaded": downloaded, "fallback_copied": copied_fallbacks, "failed": len(failures)})
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
