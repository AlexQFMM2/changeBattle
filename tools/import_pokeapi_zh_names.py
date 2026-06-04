#!/usr/bin/env python3
"""Import missing zh-Hans names from PokeAPI CSV data.

Existing project translations are treated as authoritative and are not
overwritten. Showdown-only formes get generated Chinese display names from
their translated base species plus a translated forme label.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
from pathlib import Path


DEFAULT_SHOWDOWN_PATH = Path("/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown")
DEFAULT_TRANSLATIONS = Path("data/zh_cn_overrides.json")
DEFAULT_CACHE = Path("work/pokeapi-csv")
DEFAULT_REPORT = Path("work/i18n_coverage.json")
POKEAPI_BASE = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv"
POKEAPI_MIRRORS = [
    "https://cdn.jsdelivr.net/gh/PokeAPI/pokeapi@master/data/v2/csv",
    POKEAPI_BASE,
]
ZH_HANS_LANGUAGE_ID = "12"

CSV_FILES = [
    "pokemon_species.csv",
    "pokemon_species_names.csv",
    "moves.csv",
    "move_names.csv",
    "items.csv",
    "item_names.csv",
]

FORM_LABELS = {
    "Mega": "超级",
    "Mega-X": "超级X",
    "Mega-Y": "超级Y",
    "Gmax": "超极巨化",
    "Alola": "阿罗拉的样子",
    "Galar": "伽勒尔的样子",
    "Hisui": "洗翠的样子",
    "Paldea": "帕底亚的样子",
    "Primal": "原始回归",
    "Origin": "起源形态",
    "Altered": "别种形态",
    "Therian": "灵兽形态",
    "Incarnate": "化身形态",
    "Sky": "天空形态",
    "Land": "陆上形态",
    "Blade": "刀剑形态",
    "Shield": "盾牌形态",
    "Attack": "攻击形态",
    "Defense": "防御形态",
    "Speed": "速度形态",
    "Normal": "普通形态",
    "Zen": "达摩模式",
    "Crowned": "王者之剑/盾",
    "Complete": "完全体",
    "10%": "10%形态",
    "50%": "50%形态",
    "White": "焰白形态",
    "Black": "暗黑形态",
    "Dusk-Mane": "黄昏之鬃",
    "Dawn-Wings": "拂晓之翼",
    "Ultra": "究极形态",
    "Wash": "清洗洛托姆",
    "Heat": "加热洛托姆",
    "Frost": "结冰洛托姆",
    "Fan": "旋转洛托姆",
    "Mow": "切割洛托姆",
    "Low-Key": "低调的样子",
    "Amped": "高调的样子",
    "Single-Strike": "一击流",
    "Rapid-Strike": "连击流",
    "Hero": "全能形态",
    "Zero": "平凡形态",
    "Bloodmoon": "赫月",
    "Wellspring": "水井面具",
    "Hearthflame": "火灶面具",
    "Cornerstone": "础石面具",
    "Teal": "碧草面具",
    "Tera": "太晶形态",
    "Terastal": "太晶形态",
    "Stellar": "星晶形态",
    "Family-of-Three": "三只家庭",
    "Family-of-Four": "四只家庭",
    "Three-Segment": "三节形态",
    "Two-Segment": "二节形态",
    "Four": "四只家庭",
    "Antique": "真品",
    "Artisan": "杰作",
    "Masterpiece": "杰作",
    "Small": "小尺寸",
    "Large": "大尺寸",
    "Super": "特大尺寸",
    "Average": "普通尺寸",
    "Noice": "结冻头",
    "Ice": "结冻头",
    "Hangry": "空腹花纹",
    "Full-Belly": "满腹花纹",
    "Blue-Striped": "蓝条纹",
    "White-Striped": "白条纹",
    "Red-Striped": "红条纹",
    "East": "东海",
    "West": "西海",
    "Pom-Pom": "啪滋啪滋风格",
    "Baile": "热辣热辣风格",
    "Pau": "呼拉呼拉风格",
    "Sensu": "轻盈轻盈风格",
    "Midday": "白昼的样子",
    "Midnight": "黑夜的样子",
    "Dusk": "黄昏的样子",
    "School": "鱼群形态",
    "Solo": "单独形态",
    "Disguised": "化形的样子",
    "Busted": "现形的样子",
    "Totem": "霸主",
}


def normalize_id(value: str | None) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(value or "").lower())


def download_csv(cache_dir: Path, filename: str) -> Path:
    out = cache_dir / filename
    if out.exists() and out.stat().st_size > 0 and out.read_bytes().endswith(b"\n"):
        return out
    out.unlink(missing_ok=True)
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(out.suffix + ".tmp")
    errors: list[str] = []
    for base_url in POKEAPI_MIRRORS:
        tmp.unlink(missing_ok=True)
        url = f"{base_url}/{filename}"
        result = subprocess.run(
            [
                "curl",
                "-fsSL",
                "--retry",
                "3",
                "--retry-delay",
                "1",
                "--connect-timeout",
                "15",
                "--max-time",
                "120",
                url,
                "-o",
                str(tmp),
            ],
            text=True,
            capture_output=True,
        )
        if result.returncode == 0 and tmp.exists() and tmp.stat().st_size > 0 and tmp.read_bytes().endswith(b"\n"):
            tmp.replace(out)
            return out
        errors.append((result.stderr or result.stdout or f"curl exited {result.returncode}").strip())
    tmp.unlink(missing_ok=True)
    raise RuntimeError(f"failed to download {filename}: {' | '.join(errors)}")
    return out


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def load_pokeapi_names(cache_dir: Path, entity_file: str, names_file: str, foreign_key: str) -> dict[str, str]:
    entities = {row["id"]: row["identifier"] for row in read_csv(cache_dir / entity_file)}
    out: dict[str, str] = {}
    for row in read_csv(cache_dir / names_file):
        if row.get("local_language_id") != ZH_HANS_LANGUAGE_ID:
            continue
        identifier = entities.get(row.get(foreign_key) or "")
        name = (row.get("name") or "").strip()
        if identifier and name:
            out[normalize_id(identifier)] = name
    return out


def load_showdown(showdown_path: Path) -> dict[str, list[dict[str, str]]]:
    script = """
const {Dex} = require(process.argv[1] + '/dist/sim');
const species = [];
for (const [id, raw] of Object.entries(Dex.data.Pokedex)) {
  if (!raw || raw.exists === false || !raw.name || !raw.num || raw.num <= 0) continue;
  const s = Dex.species.get(id || raw.name);
  species.push({id: s.id, name: s.name, num: s.num, baseSpecies: s.baseSpecies || '', forme: s.forme || ''});
}
const moves = Dex.moves.all()
  .filter(m => m.exists && m.id)
  .map(m => ({id: m.id, name: m.name}));
const items = Dex.items.all()
  .filter(i => i.exists && i.id)
  .map(i => ({id: i.id, name: i.name}));
console.log(JSON.stringify({species, moves, items}));
"""
    result = subprocess.run(
        ["node", "-e", script, str(showdown_path)],
        check=True,
        text=True,
        capture_output=True,
    )
    return json.loads(result.stdout)


def translated_form_name(base_zh: str, forme: str) -> str:
    label = FORM_LABELS.get(forme)
    if not label:
        parts = re.split(r"[- ]+", forme)
        label = "".join(FORM_LABELS.get(part, part) for part in parts if part)
    if forme == "Mega":
        return f"超级{base_zh}"
    if forme == "Mega-X":
        return f"超级{base_zh}X"
    if forme == "Mega-Y":
        return f"超级{base_zh}Y"
    if forme == "Gmax":
        return f"超极巨{base_zh}"
    if forme == "Totem":
        return f"霸主{base_zh}"
    if forme == "Primal":
        return f"原始{base_zh}"
    return f"{base_zh}（{label}）" if label else base_zh


def missing_names(showdown_rows: list[dict[str, str]], translations: dict[str, str]) -> list[str]:
    normalized = {normalize_id(key) for key, value in translations.items() if value}
    return [row["name"] for row in showdown_rows if normalize_id(row["name"]) not in normalized]


def main() -> int:
    parser = argparse.ArgumentParser(description="Import missing official zh-Hans names from PokeAPI")
    parser.add_argument("--showdown-path", type=Path, default=DEFAULT_SHOWDOWN_PATH)
    parser.add_argument("--translations", type=Path, default=DEFAULT_TRANSLATIONS)
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--no-download", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.no_download:
        for filename in CSV_FILES:
            download_csv(args.cache_dir, filename)

    pokeapi_species = load_pokeapi_names(args.cache_dir, "pokemon_species.csv", "pokemon_species_names.csv", "pokemon_species_id")
    pokeapi_moves = load_pokeapi_names(args.cache_dir, "moves.csv", "move_names.csv", "move_id")
    pokeapi_items = load_pokeapi_names(args.cache_dir, "items.csv", "item_names.csv", "item_id")
    showdown = load_showdown(args.showdown_path)
    translations = json.loads(args.translations.read_text(encoding="utf-8"))

    added = {"species": 0, "moves": 0, "items": 0}
    species_map = translations.setdefault("species", {})
    moves_map = translations.setdefault("moves", {})
    items_map = translations.setdefault("items", {})

    species_by_id = {normalize_id(row["name"]): row for row in showdown["species"]}
    existing_species = {normalize_id(key): value for key, value in species_map.items()}
    for row in showdown["species"]:
        normalized_name = normalize_id(row["name"])
        if existing_species.get(normalized_name):
            continue
        zh_name = pokeapi_species.get(normalized_name)
        if not zh_name and row.get("forme"):
            base_id = normalize_id(row.get("baseSpecies") or "")
            base_row = species_by_id.get(base_id)
            base_zh = (
                existing_species.get(base_id)
                or species_map.get(base_row["name"] if base_row else "")
                or pokeapi_species.get(base_id)
            )
            if base_zh:
                zh_name = translated_form_name(base_zh, row["forme"])
        if zh_name:
            species_map[row["name"]] = zh_name
            existing_species[normalized_name] = zh_name
            added["species"] += 1

    existing_moves = {normalize_id(key): value for key, value in moves_map.items()}
    for row in showdown["moves"]:
        if existing_moves.get(normalize_id(row["name"])):
            continue
        zh_name = pokeapi_moves.get(normalize_id(row["id"])) or pokeapi_moves.get(normalize_id(row["name"]))
        if zh_name:
            moves_map[row["name"]] = zh_name
            existing_moves[normalize_id(row["name"])] = zh_name
            added["moves"] += 1

    existing_items = {normalize_id(key): value for key, value in items_map.items()}
    for row in showdown["items"]:
        if existing_items.get(normalize_id(row["name"])):
            continue
        zh_name = pokeapi_items.get(normalize_id(row["id"])) or pokeapi_items.get(normalize_id(row["name"]))
        if zh_name:
            items_map[row["name"]] = zh_name
            existing_items[normalize_id(row["name"])] = zh_name
            added["items"] += 1

    for section in ["species", "moves", "items"]:
        translations[section] = dict(sorted(translations.get(section, {}).items(), key=lambda item: normalize_id(item[0])))

    report = {
        "added": added,
        "counts": {section: len(translations.get(section, {})) for section in ["species", "moves", "items"]},
        "missing": {
            "species": missing_names(showdown["species"], translations.get("species", {})),
            "moves": missing_names(showdown["moves"], translations.get("moves", {})),
            "items": missing_names(showdown["items"], translations.get("items", {})),
        },
    }
    report["missing_counts"] = {key: len(value) for key, value in report["missing"].items()}

    if not args.dry_run:
        args.translations.write_text(json.dumps(translations, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"added": added, "missing_counts": report["missing_counts"]}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
