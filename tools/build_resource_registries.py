#!/usr/bin/env python3
"""Build ChangeBattle runtime resource registries.

The registries are the runtime source of truth. Large source asset folders can
live outside the project; this script copies only referenced assets into
assets/runtime so releases do not include the full reference libraries.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SHOWDOWN_PATH = Path("/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown")
DEFAULT_REFERENCE_ROOT = Path("/home/alexqfmm/workPlace/pokemon/ui-refrence")
DEFAULT_SPRITE_MAP = Path("data/resource_source_sprite_index_map.json")
DEFAULT_SPRITE_MAP_OUT = Path("data/sprite_index_map.json")
DEFAULT_POKEMON_REGISTRY = Path("data/pokemon_resource_registry.json")
DEFAULT_ITEM_REGISTRY = Path("data/item_resource_registry.json")
DEFAULT_OVERRIDES = Path("data/resource_overrides.json")
POKEMON_RUNTIME_BASE = Path("assets/runtime/pokemon")
ITEM_RUNTIME_BASE = Path("assets/runtime/items")
SPRITE_VARIANTS = [
    "front_normal",
    "back_normal",
    "front_shiny",
    "back_shiny",
    "front_normal_full",
    "front_shiny_full",
]
SOURCE_ASSET_DIRS = {
    "assets/pokemon-showdown",
    "assets/pokemon-pack",
    "assets/pokemon-custom",
    "assets/items-pack",
    "assets/items",
}
ITEM_FALLBACK = "assets/placeholders/item.png"
MOVE_FALLBACK = "assets/placeholders/move.png"
ITEM_ICON_ALIASES = {
    "berry": "oranberry",
    "bitterberry": "persimberry",
    "burntberry": "aspearberry",
    "goldberry": "sitrusberry",
    "iceberry": "aspearberry",
    "mintberry": "chestoberry",
    "miracleberry": "lumberry",
    "mysteryberry": "leppaberry",
    "przcureberry": "cheriberry",
    "psncureberry": "pechaberry",
}
Z_CRYSTAL_ICON_TYPES = {
    "aloraichiumz": "electric",
    "buginiumz": "bug",
    "darkiniumz": "dark",
    "decidiumz": "ghost",
    "dragoniumz": "dragon",
    "eeviumz": "normal",
    "electriumz": "electric",
    "fairiumz": "fairy",
    "fightiniumz": "fighting",
    "firiumz": "fire",
    "flyiniumz": "flying",
    "ghostiumz": "ghost",
    "grassiumz": "grass",
    "groundiumz": "ground",
    "iciumz": "ice",
    "inciniumz": "dark",
    "kommoniumz": "dragon",
    "lunaliumz": "ghost",
    "lycaniumz": "rock",
    "marshadiumz": "ghost",
    "mewniumz": "psychic",
    "mimikiumz": "fairy",
    "normaliumz": "normal",
    "pikaniumz": "electric",
    "pikashuniumz": "electric",
    "poisoniumz": "poison",
    "primariumz": "water",
    "psychiumz": "psychic",
    "rockiumz": "rock",
    "snorliumz": "normal",
    "solganiumz": "steel",
    "steeliumz": "steel",
    "tapuniumz": "fairy",
    "ultranecroziumz": "psychic",
    "wateriumz": "water",
}
ITEM_TYPE_PLATE_ASSETS = {
    "bug": "insectplate",
    "dark": "dreadplate",
    "dragon": "dracoplate",
    "electric": "zapplate",
    "fairy": "pixieplate",
    "fighting": "fistplate",
    "fire": "flameplate",
    "flying": "skyplate",
    "ghost": "spookyplate",
    "grass": "meadowplate",
    "ground": "earthplate",
    "ice": "icicleplate",
    "normal": "blankplate",
    "poison": "toxicplate",
    "psychic": "mindplate",
    "rock": "stoneplate",
    "steel": "ironplate",
    "water": "splashplate",
}


def to_id(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def item_key(value: str | None) -> str:
    raw = str(value or "").strip()
    if raw.lower().startswith("tm:"):
        return "tm:" + to_id(raw[3:])
    return to_id(raw)


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_showdown(showdown_path: Path) -> dict[str, list[dict[str, Any]]]:
    script = """
const {Dex} = require(process.argv[1] + '/dist/sim');
const dex = Dex.mod('gen9');
const species = dex.species.all()
  .filter(s => s.exists && s.num > 0)
  .map(s => ({
    id: s.id, name: s.name, num: s.num, baseSpecies: s.baseSpecies || s.name,
    forme: s.forme || '', spriteid: s.spriteid || s.id, isNonstandard: s.isNonstandard || '',
  }));
const items = dex.items.all()
  .filter(i => i.exists && i.id)
  .map(i => ({
    id: i.id, name: i.name, num: i.num || 0, isNonstandard: i.isNonstandard || '',
    megaStone: i.megaStone || null, zMove: i.zMove || '', zMoveType: i.zMoveType || '',
    forcedForme: i.forcedForme || '', desc: i.desc || i.shortDesc || '',
  }));
console.log(JSON.stringify({species, items}));
"""
    result = subprocess.run(
        ["node", "-e", script, str(showdown_path)],
        check=True,
        text=True,
        capture_output=True,
    )
    return json.loads(result.stdout)


def resolve_source_path(relative_path: str | None, reference_root: Path) -> Path | None:
    if not relative_path or str(relative_path).startswith(("http://", "https://")):
        return None
    normalized = str(relative_path).replace("\\", "/")
    candidates = []
    project_path = PROJECT_ROOT / normalized
    candidates.append(project_path)
    for source_dir in SOURCE_ASSET_DIRS:
        if normalized == source_dir or normalized.startswith(source_dir + "/"):
            suffix = normalized[len(source_dir) + 1 :]
            candidates.append(reference_root / Path(source_dir).name / suffix)
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def runtime_path(base: Path, key: str, variant: str, source: Path) -> str:
    ext = source.suffix.lower() or ".png"
    digest = hashlib.sha1(str(source).encode("utf-8")).hexdigest()[:8]
    safe_key = re.sub(r"[^a-z0-9_.-]+", "-", key.lower()).strip("-") or "asset"
    safe_variant = re.sub(r"[^a-z0-9_.-]+", "-", variant.lower()).strip("-") or "asset"
    return (base / safe_key / f"{safe_variant}-{digest}{ext}").as_posix()


def item_icon_runtime_path(item_id: str, source: Path) -> str:
    ext = source.suffix.lower() or ".png"
    safe_key = re.sub(r"[^a-z0-9_.:-]+", "-", item_id.lower()).strip("-") or "item"
    return (ITEM_RUNTIME_BASE / safe_key / f"icon{ext}").as_posix()


def copy_runtime(source: Path | None, target_relative: str | None) -> str | None:
    if not source or not target_relative:
        return None
    target = PROJECT_ROOT / target_relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists() or source.stat().st_size != target.stat().st_size:
        shutil.copy2(source, target)
    return target_relative


def source_label(path: str | None) -> str:
    normalized = str(path or "").replace("\\", "/")
    for source_dir in SOURCE_ASSET_DIRS:
        if normalized == source_dir or normalized.startswith(source_dir + "/"):
            return Path(source_dir).name
    if normalized.startswith("assets/runtime/"):
        return "runtime"
    if normalized.startswith("assets/placeholders/"):
        return "placeholder"
    return "manual"


def form_kind(entry: dict[str, Any]) -> str:
    forme = str(entry.get("forme") or "")
    species_id = str(entry.get("species_id") or "")
    name = str(entry.get("name") or "")
    if forme.lower().startswith("mega") or "mega" in species_id or "-Mega" in name:
        return "mega"
    if forme.lower() == "gmax" or "gmax" in species_id or "-Gmax" in name:
        return "gmax"
    if forme in {"Alola", "Galar", "Hisui", "Paldea"} or any(token in species_id for token in ["alola", "galar", "hisui", "paldea"]):
        return "regional"
    if forme:
        return "forme"
    return "base"


def build_pokemon_registry(sprite_map: dict[str, Any], overrides: dict[str, Any], reference_root: Path) -> tuple[dict[str, Any], dict[str, Any]]:
    entries = sprite_map.get("entries") or {}
    pokemon_overrides = overrides.get("pokemon") or {}
    registry_entries: dict[str, Any] = {}
    sprite_entries: dict[str, Any] = {}
    missing: list[dict[str, str]] = []
    for species_id, entry in sorted(entries.items()):
        override = pokemon_overrides.get(species_id) or {}
        raw_paths = dict(entry.get("paths") or {})
        raw_paths.update(override.get("sprites") or {})
        runtime_sprites: dict[str, str] = {}
        source_notes: list[str] = []
        for variant in SPRITE_VARIANTS:
            raw_path = raw_paths.get(variant)
            source = resolve_source_path(raw_path, reference_root)
            if not source and variant == "front_normal_full":
                source = resolve_source_path(raw_paths.get("front_normal"), reference_root)
                raw_path = raw_paths.get("front_normal")
            if not source and variant == "front_shiny_full":
                source = resolve_source_path(raw_paths.get("front_shiny") or raw_paths.get("front_normal"), reference_root)
                raw_path = raw_paths.get("front_shiny") or raw_paths.get("front_normal")
            if not source:
                fallback_variant = {
                    "front_shiny": "front_normal",
                    "back_shiny": "back_normal",
                    "back_normal": "front_normal",
                }.get(variant)
                source = resolve_source_path(raw_paths.get(fallback_variant), reference_root) if fallback_variant else None
                raw_path = raw_paths.get(fallback_variant) if fallback_variant else raw_path
            if source:
                target = runtime_path(POKEMON_RUNTIME_BASE, species_id, variant, source)
                runtime_sprites[variant] = copy_runtime(source, target) or target
                source_notes.append(f"{variant}: {source_label(raw_path)}")
            else:
                missing.append({"species_id": species_id, "variant": variant, "source": str(raw_paths.get(variant) or "")})
        icon = None
        icon_source = resolve_source_path(override.get("icon") or entry.get("icon_asset"), reference_root)
        if icon_source:
            icon = copy_runtime(icon_source, runtime_path(POKEMON_RUNTIME_BASE, species_id, "icon", icon_source))
        icon_shiny = None
        icon_shiny_source = resolve_source_path(override.get("icon_shiny") or entry.get("icon_shiny_asset"), reference_root)
        if icon_shiny_source:
            icon_shiny = copy_runtime(icon_shiny_source, runtime_path(POKEMON_RUNTIME_BASE, species_id, "icon_shiny", icon_shiny_source))

        registry_entry = {
            "species_id": species_id,
            "name": entry.get("name") or species_id,
            "name_zh": override.get("name_zh") or "",
            "national_dex": entry.get("national_dex") or 0,
            "base_species": entry.get("base_species") or entry.get("name") or species_id,
            "form_kind": override.get("form_kind") or form_kind(entry),
            "forme": entry.get("forme") or "",
            "asset_key": override.get("asset_key") or species_id,
            "sprites": runtime_sprites,
            "icon": icon,
            "icon_shiny": icon_shiny,
            "cry": entry.get("cry_asset"),
            "source_notes": override.get("source_notes") or "; ".join(sorted(set(source_notes))),
        }
        registry_entries[species_id] = registry_entry
        sprite_entry = dict(entry)
        sprite_entry["source"] = "changebattle-resource-registry"
        sprite_entry["confidence"] = override.get("confidence") or entry.get("confidence") or "registry"
        sprite_entry["paths"] = runtime_sprites
        if icon:
            sprite_entry["icon_asset"] = icon
        if icon_shiny:
            sprite_entry["icon_shiny_asset"] = icon_shiny
        sprite_entry["fallback_paths"] = runtime_sprites
        sprite_entries[species_id] = sprite_entry
    payload = {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "runtime_asset_base": POKEMON_RUNTIME_BASE.as_posix(),
        "reference_root_hint": "external ui-refrence directory; runtime paths are copied under assets/runtime",
        "counts": {"entries": len(registry_entries), "missing_sprites": len(missing)},
        "entries": registry_entries,
        "missing": missing,
    }
    sprite_payload = dict(sprite_map)
    sprite_payload["version"] = max(2, int(sprite_map.get("version") or 1))
    sprite_payload["asset_base"] = POKEMON_RUNTIME_BASE.as_posix()
    sprite_payload["showdown_asset_base"] = POKEMON_RUNTIME_BASE.as_posix()
    sprite_payload["sprite_base_url"] = ""
    sprite_payload["source_registry"] = DEFAULT_POKEMON_REGISTRY.as_posix()
    sprite_payload["strategy"] = {
        "source_of_truth": "data/pokemon_resource_registry.json",
        "runtime_source": "assets/runtime/pokemon",
        "reference_assets": "external ui-refrence directory",
    }
    sprite_payload["entries"] = sprite_entries
    return payload, sprite_payload


def battle_system_for_item(item: dict[str, Any]) -> str:
    item_id = item_key(item.get("id"))
    text = f"{item.get('name') or ''} {item.get('desc') or ''}".lower()
    if item.get("megaStone") or re.search(r"ite(?:x|y|z)?$", item_id):
        return "mega"
    if item.get("zMove") or item.get("zMoveType") or item_id in Z_CRYSTAL_ICON_TYPES or item_id.endswith("iumz"):
        return "zmove"
    if "dynamax" in item_id or "maxmushroom" in item_id or "max honey" in text:
        return "dynamax"
    if "tera" in item_id:
        return "terastal"
    return "none"


def item_category(item: dict[str, Any], battle_system: str) -> str:
    item_id = item_key(item.get("id"))
    if item_id.startswith("tm:"):
        return "tm"
    if battle_system != "none":
        return battle_system
    if "berry" in item_id:
        return "berry"
    if "mint" in item_id or "bottlecap" in item_id or item_id in {"abilitycapsule", "abilitypatch", "rarecandy"}:
        return "training"
    return "item"


def candidate_item_assets(item_id: str, item: dict[str, Any], overrides: dict[str, Any]) -> list[str]:
    candidates: list[str] = []
    override_icon = overrides.get("icon")
    if override_icon:
        candidates.append(override_icon)
    if item_id.startswith("tm:"):
        return candidates
    candidates.extend([
        f"assets/items-pack/{item_id}.png",
        f"assets/items/{item_id}.png",
    ])
    alias = ITEM_ICON_ALIASES.get(item_id)
    if alias:
        candidates.extend([f"assets/items-pack/{alias}.png", f"assets/items/{alias}.png"])
    z_type = Z_CRYSTAL_ICON_TYPES.get(item_id)
    if z_type:
        plate = ITEM_TYPE_PLATE_ASSETS.get(z_type, "zapplate")
        candidates.append(f"assets/items-pack/{plate}.png")
    if item_id.endswith("berry"):
        candidates.extend(["assets/items-pack/oranberry.png", "assets/items/oranberry.png"])
    if item_id.endswith("ite") or "mega" in str(item.get("desc") or "").lower():
        candidates.append("assets/items-pack/medichamite.png")
    if "stone" in item_id:
        candidates.append("assets/items-pack/stoneplate.png")
    return list(dict.fromkeys(candidates))


def local_item_asset_ids(reference_root: Path) -> set[str]:
    ids: set[str] = set()
    for base in ["assets/items-pack", "assets/items"]:
        candidates = [PROJECT_ROOT / base]
        candidates.append(reference_root / Path(base).name)
        for directory in candidates:
            if not directory.exists():
                continue
            for path in directory.iterdir():
                if path.is_file() and path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
                    item_id = item_key(path.stem)
                    if item_id:
                        ids.add(item_id)
    return ids


def build_item_registry(showdown_items: list[dict[str, Any]], overrides: dict[str, Any], reference_root: Path) -> dict[str, Any]:
    item_overrides = overrides.get("items") or {}
    item_by_id = {item_key(item.get("id")): item for item in showdown_items if item_key(item.get("id"))}
    for item_id in sorted(local_item_asset_ids(reference_root)):
        item_by_id.setdefault(item_id, {"id": item_id, "name": item_id, "desc": ""})
    entries: dict[str, Any] = {}
    missing: list[str] = []
    for item_id, item in sorted(item_by_id.items()):
        item_id = item_key(item.get("id"))
        if not item_id:
            continue
        override = item_overrides.get(item_id) or {}
        battle_system = override.get("battle_system") or battle_system_for_item(item)
        category = override.get("category") or item_category(item, battle_system)
        icon = None
        for candidate in candidate_item_assets(item_id, item, override):
            source = resolve_source_path(candidate, reference_root)
            if source:
                icon = copy_runtime(source, item_icon_runtime_path(item_id, source))
                break
        if not icon:
            icon = MOVE_FALLBACK if item_id.startswith("tm:") else ITEM_FALLBACK
            missing.append(item_id)
        entries[item_id] = {
            "item_id": item_id,
            "name": item.get("name") or item_id,
            "name_zh": override.get("name_zh") or "",
            "category": category,
            "battle_system": battle_system,
            "icon": icon,
            "fallback_icon": MOVE_FALLBACK if item_id.startswith("tm:") else ITEM_FALLBACK,
            "source_notes": override.get("source_notes") or ("runtime" if icon.startswith("assets/runtime/") else "placeholder"),
        }
    return {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "runtime_asset_base": ITEM_RUNTIME_BASE.as_posix(),
        "reference_root_hint": "external ui-refrence directory; runtime paths are copied under assets/runtime",
        "counts": {"entries": len(entries), "missing_icons": len(missing)},
        "entries": entries,
        "missing": missing,
    }


def clean_runtime_dirs() -> None:
    for directory in [PROJECT_ROOT / POKEMON_RUNTIME_BASE, PROJECT_ROOT / ITEM_RUNTIME_BASE]:
        if directory.exists():
            shutil.rmtree(directory)
        directory.mkdir(parents=True, exist_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build ChangeBattle resource registries and runtime assets")
    parser.add_argument("--showdown-path", type=Path, default=DEFAULT_SHOWDOWN_PATH)
    parser.add_argument("--reference-root", type=Path, default=DEFAULT_REFERENCE_ROOT)
    parser.add_argument("--sprite-map", type=Path, default=DEFAULT_SPRITE_MAP)
    parser.add_argument("--sprite-map-out", type=Path, default=DEFAULT_SPRITE_MAP_OUT)
    parser.add_argument("--pokemon-out", type=Path, default=DEFAULT_POKEMON_REGISTRY)
    parser.add_argument("--item-out", type=Path, default=DEFAULT_ITEM_REGISTRY)
    parser.add_argument("--overrides", type=Path, default=DEFAULT_OVERRIDES)
    args = parser.parse_args()

    sprite_map = read_json(PROJECT_ROOT / args.sprite_map)
    overrides = read_json(PROJECT_ROOT / args.overrides)
    showdown = load_showdown(args.showdown_path)
    clean_runtime_dirs()
    pokemon_registry, sprite_payload = build_pokemon_registry(sprite_map, overrides, args.reference_root)
    item_registry = build_item_registry(showdown["items"], overrides, args.reference_root)
    write_json(PROJECT_ROOT / args.pokemon_out, pokemon_registry)
    write_json(PROJECT_ROOT / args.item_out, item_registry)
    write_json(PROJECT_ROOT / args.sprite_map_out, sprite_payload)
    print(json.dumps({
        "pokemon": pokemon_registry["counts"],
        "items": item_registry["counts"],
        "runtime_pokemon": str(PROJECT_ROOT / POKEMON_RUNTIME_BASE),
        "runtime_items": str(PROJECT_ROOT / ITEM_RUNTIME_BASE),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
