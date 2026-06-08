#!/usr/bin/env python3
"""Import visual assets from ui-refrence/pokemon.zip.

This keeps Pokemon Showdown as the rules/data source, but builds a local visual
asset overlay that can be merged into data/sprite_index_map.json.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


DEFAULT_ZIP = Path("/home/alexqfmm/workPlace/pokemon/ui-refrence/pokemon.zip")
DEFAULT_SPRITE_MAP = Path("data/sprite_index_map.json")
DEFAULT_OUT = Path("data/pokemon_pack_manifest.json")
DEFAULT_POKEMON_ASSET_BASE = "assets/pokemon-pack"
DEFAULT_ITEM_ASSET_BASE = "assets/items-pack"
DEFAULT_BALL_ASSET_BASE = "assets/pokeballs-pack"
DEFAULT_AUDIO_ASSET_BASE = "assets/audio/pokemon-cries"
DEFAULT_BACKGROUND_ASSET_BASE = "assets/battle-backgrounds"
DEFAULT_EFFECT_ASSET_BASE = "assets/battle-effects-pack"

POKEMON_VARIANT_DIRS = {
    "正面": ("front_normal", "front"),
    "背面": ("back_normal", "back"),
    "正面（闪光）": ("front_shiny", "front-shiny"),
    "背面（闪光）": ("back_shiny", "back-shiny"),
    "精灵小图标": ("icon", "icons"),
    "精灵小图标（闪光）": ("icon_shiny", "icons-shiny"),
}

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
AUDIO_EXTS = {".wav", ".mp3", ".ogg", ".m4a"}


def normalize_key(value: str) -> str:
    return "".join(char for char in str(value or "").lower() if char.isalnum())


def safe_stem(name: str) -> str:
    stem = Path(name).stem
    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", stem).strip("-").lower()
    return normalized or normalize_key(stem) or "asset"


def unique_path(path: Path) -> Path:
    if not path.exists():
        return path
    stem = path.stem
    suffix = path.suffix
    for index in range(2, 10_000):
        candidate = path.with_name(f"{stem}-{index}{suffix}")
        if not candidate.exists():
            return candidate
    raise RuntimeError(f"could not find unique path for {path}")


def copy_zip_member(zip_file: zipfile.ZipFile, member: zipfile.ZipInfo, out_path: Path) -> None:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with zip_file.open(member) as source, out_path.open("wb") as target:
        shutil.copyfileobj(source, target)


def read_sprite_entries(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    return payload.get("entries") or {}


def species_match_keys(entry: dict) -> list[str]:
    raw_values = [
        entry.get("species_id"),
        entry.get("sprite_id"),
        entry.get("name"),
        entry.get("base_species") if not entry.get("forme") else "",
    ]
    keys: list[str] = []
    for value in raw_values:
        key = normalize_key(value or "")
        if key and key not in keys:
            keys.append(key)
    return keys


def match_species(entries: dict[str, dict], variant_maps: dict[str, dict[str, str]]) -> tuple[dict[str, dict], dict[str, int]]:
    matched: dict[str, dict] = {}
    variant_counts = defaultdict(int)
    for species_id, entry in entries.items():
        keys = species_match_keys(entry)
        paths: dict[str, str] = {}
        matched_keys: dict[str, str] = {}
        for variant, assets in variant_maps.items():
            for key in keys:
                if key in assets:
                    paths[variant] = assets[key]
                    matched_keys[variant] = key
                    variant_counts[variant] += 1
                    break
        if paths:
            matched[species_id] = {
                "species_id": species_id,
                "name": entry.get("name") or species_id,
                "sprite_id": entry.get("sprite_id") or species_id,
                "paths": paths,
                "matched_keys": matched_keys,
                "confidence": "exact-normalized-name",
            }
    return matched, dict(variant_counts)


def unmatched_variant_assets(variant_maps: dict[str, dict[str, str]], matched_species: dict[str, dict]) -> dict[str, dict[str, str]]:
    matched_keys: dict[str, set[str]] = defaultdict(set)
    for match in matched_species.values():
        for variant, key in (match.get("matched_keys") or {}).items():
            matched_keys[variant].add(key)
    unmatched: dict[str, dict[str, str]] = {}
    for variant, assets in variant_maps.items():
        remaining = {key: path for key, path in sorted(assets.items()) if key not in matched_keys[variant]}
        if remaining:
            unmatched[variant] = remaining
    return unmatched


def classify_member(parts: list[str]) -> tuple[str, str | None, str | None]:
    if len(parts) < 2:
        return ("other", None, None)
    section = parts[1]
    subsection = parts[2] if len(parts) >= 3 else None
    if section == "1-9代精灵素材" and subsection in POKEMON_VARIANT_DIRS:
        variant, folder = POKEMON_VARIANT_DIRS[subsection]
        return ("pokemon", variant, folder)
    if section == "物品道具":
        return ("item", None, None)
    if section == "精灵球":
        return ("pokeball", None, None)
    if section == "精灵叫声":
        return ("cry", None, None)
    if section == "地图贴图":
        return ("background", None, None)
    if section == "自定义招式":
        return ("effect", None, None)
    return ("other", None, None)


def main() -> int:
    parser = argparse.ArgumentParser(description="Import pokemon.zip visual assets into stable ChangeBattle asset paths")
    parser.add_argument("--zip", type=Path, default=DEFAULT_ZIP)
    parser.add_argument("--sprite-map", type=Path, default=DEFAULT_SPRITE_MAP)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--pokemon-asset-base", default=DEFAULT_POKEMON_ASSET_BASE)
    parser.add_argument("--item-asset-base", default=DEFAULT_ITEM_ASSET_BASE)
    parser.add_argument("--ball-asset-base", default=DEFAULT_BALL_ASSET_BASE)
    parser.add_argument("--audio-asset-base", default=DEFAULT_AUDIO_ASSET_BASE)
    parser.add_argument("--background-asset-base", default=DEFAULT_BACKGROUND_ASSET_BASE)
    parser.add_argument("--effect-asset-base", default=DEFAULT_EFFECT_ASSET_BASE)
    args = parser.parse_args()

    sprite_entries = read_sprite_entries(args.sprite_map)
    variant_maps: dict[str, dict[str, str]] = defaultdict(dict)
    item_assets: dict[str, str] = {}
    ball_assets: dict[str, str] = {}
    cry_assets: dict[str, str] = {}
    background_assets: dict[str, str] = {}
    effect_assets: dict[str, str] = {}
    copied_counts = defaultdict(int)

    for generated_base in [
        args.pokemon_asset_base,
        args.item_asset_base,
        args.ball_asset_base,
        args.audio_asset_base,
        args.background_asset_base,
        args.effect_asset_base,
    ]:
        base_path = Path(generated_base)
        if base_path.exists():
            shutil.rmtree(base_path)

    with zipfile.ZipFile(args.zip) as zip_file:
        for member in zip_file.infolist():
            if member.is_dir():
                continue
            name = member.filename
            parts = name.split("/")
            ext = Path(name).suffix.lower()
            kind, variant, folder = classify_member(parts)
            stem = safe_stem(name)
            key = normalize_key(Path(name).stem)

            if kind == "pokemon" and ext in IMAGE_EXTS and variant and folder:
                out_path = unique_path(Path(args.pokemon_asset_base) / folder / f"{stem}{ext}")
                copy_zip_member(zip_file, member, out_path)
                variant_maps[variant][key] = out_path.as_posix()
                copied_counts[f"pokemon:{variant}"] += 1
            elif kind == "item" and ext in IMAGE_EXTS:
                out_path = unique_path(Path(args.item_asset_base) / f"{key or stem}{ext}")
                copy_zip_member(zip_file, member, out_path)
                item_assets[key] = out_path.as_posix()
                copied_counts["items"] += 1
            elif kind == "pokeball" and ext in IMAGE_EXTS:
                out_path = unique_path(Path(args.ball_asset_base) / f"{key or stem}{ext}")
                copy_zip_member(zip_file, member, out_path)
                ball_assets[key] = out_path.as_posix()
                copied_counts["pokeballs"] += 1
                if stem.startswith("icon-ball-"):
                    item_key = normalize_key(stem.replace("icon-ball-", ""))
                    if item_key and item_key not in item_assets:
                        item_copy = Path(args.item_asset_base) / f"{item_key}{ext}"
                        copy_zip_member(zip_file, member, item_copy)
                        item_assets[item_key] = item_copy.as_posix()
            elif kind == "cry" and ext in AUDIO_EXTS:
                out_path = unique_path(Path(args.audio_asset_base) / f"{key or stem}{ext}")
                copy_zip_member(zip_file, member, out_path)
                cry_assets[key] = out_path.as_posix()
                copied_counts["cries"] += 1
            elif kind == "background" and ext in IMAGE_EXTS:
                out_path = unique_path(Path(args.background_asset_base) / f"{stem}{ext}")
                copy_zip_member(zip_file, member, out_path)
                background_assets[key] = out_path.as_posix()
                copied_counts["backgrounds"] += 1
            elif kind == "effect" and ext in IMAGE_EXTS:
                out_path = unique_path(Path(args.effect_asset_base) / f"{stem}{ext}")
                copy_zip_member(zip_file, member, out_path)
                effect_assets[key] = out_path.as_posix()
                copied_counts["effects"] += 1

    matched_species, matched_variant_counts = match_species(sprite_entries, variant_maps)
    unmatched_assets = unmatched_variant_assets(variant_maps, matched_species)
    for species_id, match in matched_species.items():
        cry = cry_assets.get(normalize_key(match.get("name") or "")) or cry_assets.get(normalize_key(species_id))
        if cry:
            match["cry_asset"] = cry

    payload = {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_zip": str(args.zip),
        "strategy": {
            "rules_source": "Pokemon Showdown remains the battle/data source of truth",
            "visual_priority": "pokemon.zip exact normalized filename matches override Showdown sprite paths; unmatched forms fall back to Showdown",
            "matching": "high-confidence exact normalized species/sprite/name only; numbered form suffixes are imported but not auto-bound",
        },
        "asset_bases": {
            "pokemon": args.pokemon_asset_base,
            "items": args.item_asset_base,
            "pokeballs": args.ball_asset_base,
            "cries": args.audio_asset_base,
            "backgrounds": args.background_asset_base,
            "effects": args.effect_asset_base,
        },
        "counts": {
            "copied": dict(copied_counts),
            "sprite_entries": len(sprite_entries),
            "matched_species": len(matched_species),
            "matched_variants": matched_variant_counts,
            "unmatched_variant_counts": {variant: len(assets) for variant, assets in unmatched_assets.items()},
            "items": len(item_assets),
            "pokeballs": len(ball_assets),
            "cries": len(cry_assets),
            "backgrounds": len(background_assets),
            "effects": len(effect_assets),
        },
        "species": matched_species,
        "unmatched_variant_assets": unmatched_assets,
        "items": item_assets,
        "pokeballs": ball_assets,
        "cries": cry_assets,
        "backgrounds": background_assets,
        "effects": effect_assets,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {args.out}")
    print(json.dumps(payload["counts"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
