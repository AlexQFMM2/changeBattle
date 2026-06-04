#!/usr/bin/env python3
"""Build a Showdown species -> green.gba sprite index map.

The editable source of truth is data/sprite_index_map.csv.  The JSON file is a
runtime manifest generated from that CSV, so bad sprite matches can be fixed by
editing one visible row instead of changing code.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_SHOWDOWN_PATH = Path('/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown')
DEFAULT_ASSET_BASE = 'assets/pokemon-green/pokemon'
DEFAULT_CSV = Path('data/sprite_index_map.csv')


def load_showdown_species(showdown_path: Path) -> list[dict]:
    script = """
const {Dex} = require(process.argv[1] + '/dist/sim');
const out = [];
for (const [id, species] of Object.entries(Dex.data.Pokedex)) {
  if (!species || species.exists === false || !species.name || !species.num || species.num <= 0) continue;
  out.push({
    id,
    name: species.name,
    num: species.num,
    baseSpecies: species.baseSpecies || '',
    forme: species.forme || '',
    types: species.types || [],
  });
}
out.sort((a, b) => (a.num - b.num) || a.id.localeCompare(b.id));
console.log(JSON.stringify(out));
"""
    result = subprocess.run(
        ['node', '-e', script, str(showdown_path)],
        check=True,
        text=True,
        capture_output=True,
    )
    return json.loads(result.stdout)


def sprite_paths(asset_base: str, sprite_index: int) -> dict[str, str]:
    folder = f'{asset_base}/{sprite_index:04d}'
    return {
        'front_normal': f'{folder}/front_normal.png',
        'back_normal': f'{folder}/back_normal.png',
        'front_shiny': f'{folder}/front_shiny.png',
        'back_shiny': f'{folder}/back_shiny.png',
        'front_normal_full': f'{folder}/front_normal_full.png',
        'front_shiny_full': f'{folder}/front_shiny_full.png',
    }


def default_sprite_index(national_dex: int) -> int:
    """Best-known Emerald hack species index before manual CSV correction.

    Vanilla Gen III internal order keeps Kanto/Johto at 1-251, has 25 gap slots
    before Hoenn, and this ROM stores Unown forms before Gen IV+, giving a +53
    offset for later generations.
    """
    if national_dex <= 251:
        return national_dex
    if national_dex <= 386:
        return national_dex + 25
    return national_dex + 53


def image_for_index(asset_base: str, sprite_index: int) -> str:
    return f'{asset_base}/{sprite_index:04d}/front_normal.png'


def parse_index_from_image(image: str) -> int | None:
    match = re.search(r'/pokemon/(\d{4})/', image.replace('\\', '/'))
    return int(match.group(1)) if match else None


def sprite_paths_from_image(asset_base: str, sprite_index: int, image: str | None) -> dict[str, str]:
    if image:
        folder = str(Path(image).parent).replace('\\', '/')
    else:
        folder = f'{asset_base}/{sprite_index:04d}'
    return {
        'front_normal': f'{folder}/front_normal.png',
        'back_normal': f'{folder}/back_normal.png',
        'front_shiny': f'{folder}/front_shiny.png',
        'back_shiny': f'{folder}/back_shiny.png',
        'front_normal_full': f'{folder}/front_normal_full.png',
        'front_shiny_full': f'{folder}/front_shiny_full.png',
    }


def csv_row_for_species(species: dict, asset_base: str) -> dict[str, str]:
    num = int(species['num'])
    sprite_index = default_sprite_index(num)
    is_forme = bool(species.get('forme')) or bool(species.get('baseSpecies'))
    confidence = 'base-species-fallback' if is_forme else 'emerald-internal-index'
    return {
        'species_id': species['id'],
        'name': species['name'],
        'national_dex': str(num),
        'sprite_index': str(sprite_index),
        'image': image_for_index(asset_base, sprite_index),
        'confidence': confidence,
        'note': 'edit this row if the sprite is wrong',
    }


def write_csv_template(csv_path: Path, species_rows: list[dict], asset_base: str) -> None:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = ['species_id', 'name', 'national_dex', 'sprite_index', 'image', 'confidence', 'note']
    with csv_path.open('w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for species in species_rows:
            writer.writerow(csv_row_for_species(species, asset_base))


def read_csv_map(csv_path: Path) -> dict[str, dict[str, str]]:
    if not csv_path.exists():
        return {}
    with csv_path.open('r', newline='', encoding='utf-8') as f:
        return {row['species_id']: row for row in csv.DictReader(f) if row.get('species_id')}


def main() -> int:
    parser = argparse.ArgumentParser(description='Build sprite_index_map.json from Showdown species data')
    parser.add_argument('--showdown-path', type=Path, default=DEFAULT_SHOWDOWN_PATH)
    parser.add_argument('--out', type=Path, default=Path('data/sprite_index_map.json'))
    parser.add_argument('--csv', type=Path, default=DEFAULT_CSV)
    parser.add_argument('--write-csv', action='store_true', help='rewrite the editable CSV mapping from current heuristics')
    parser.add_argument('--asset-base', default=DEFAULT_ASSET_BASE)
    parser.add_argument('--max-index', type=int, default=1199)
    args = parser.parse_args()

    species_rows = load_showdown_species(args.showdown_path)
    if args.write_csv or not args.csv.exists():
        write_csv_template(args.csv, species_rows, args.asset_base)
        print(f'wrote {args.csv}')
    csv_map = read_csv_map(args.csv)
    entries: dict[str, dict] = {}
    csv_count = 0
    fallback_count = 0
    skipped: list[dict] = []

    for species in species_rows:
        num = int(species['num'])
        row = csv_map.get(species['id']) or csv_row_for_species(species, args.asset_base)
        image = (row.get('image') or '').strip()
        sprite_index = int(row.get('sprite_index') or parse_index_from_image(image) or default_sprite_index(num))
        if not image:
            image = image_for_index(args.asset_base, sprite_index)
        if not (1 <= sprite_index <= args.max_index):
            skipped.append({
                'species_id': species['id'],
                'name': species['name'],
                'national_dex': num,
                'sprite_index': sprite_index,
                'reason': 'sprite index outside extracted sprite range',
            })
            continue
        is_forme = bool(species.get('forme')) or bool(species.get('baseSpecies'))
        confidence = row.get('confidence') or ('base-species-fallback' if is_forme else 'emerald-internal-index')
        if is_forme:
            fallback_count += 1
        else:
            csv_count += 1
        entries[species['id']] = {
            'species_id': species['id'],
            'name': species['name'],
            'national_dex': num,
            'sprite_index': sprite_index,
            'base_species': species.get('baseSpecies') or species['name'],
            'forme': species.get('forme') or '',
            'confidence': confidence,
            'source': f'{args.csv}',
            'note': row.get('note') or '',
            'paths': sprite_paths_from_image(args.asset_base, sprite_index, image),
        }

    payload = {
        'version': 1,
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'showdown_path': str(args.showdown_path),
        'asset_base': args.asset_base,
        'csv': str(args.csv),
        'strategy': {
            'source_of_truth': 'data/sprite_index_map.csv maps Showdown species_id to explicit image path',
            'default_index': '1-251 direct, 252-386 national dex + 25, 387+ national dex + 53 before CSV edits',
            'forme': 'alternate formes can be given explicit CSV rows; otherwise they use the generated fallback row',
            'index_zero': 'green.gba index 0000 is an unknown/question placeholder and is not assigned to a Showdown species',
        },
        'counts': {
            'entries': len(entries),
            'csv_or_generated_base': csv_count,
            'base_species_fallback': fallback_count,
            'skipped': len(skipped),
        },
        'entries': entries,
        'skipped': skipped,
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'wrote {args.out}')
    print(payload['counts'])
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
