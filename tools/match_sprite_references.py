#!/usr/bin/env python3
"""Download Showdown reference sprites and rank local sprite-index candidates."""

from __future__ import annotations

import argparse
import csv
import math
import subprocess
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont


BASE_URL = "https://play.pokemonshowdown.com/sprites/gen5"
DEFAULT_CSV = Path("data/sprite_index_map.csv")
DEFAULT_ASSET_DIR = Path("assets/pokemon-green/pokemon")
DEFAULT_OUT = Path("work/sprite-audit/reference-match")


def ps_sprite_slug(species_id: str, name: str) -> str:
    slug = name.lower()
    slug = slug.replace("'", "")
    slug = slug.replace(".", "")
    slug = slug.replace(":", "")
    slug = slug.replace(" ", "")
    slug = slug.replace("-mega-x", "-megax").replace("-mega-y", "-megay")
    slug = slug.replace("-totem", "-totem")
    return slug


def download(url: str, out: Path) -> bool:
    if out.exists() and out.stat().st_size > 0:
        return True
    out.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(["curl", "-fsSL", url, "-o", str(out)], text=True, capture_output=True)
    if result.returncode != 0:
        out.unlink(missing_ok=True)
        return False
    return True


def bbox_image(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)
    return image


def normalized(path: Path, size: int = 64) -> Image.Image:
    image = bbox_image(path)
    image.thumbnail((size, size), Image.Resampling.BICUBIC)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(image, ((size - image.width) // 2, (size - image.height) // 2), image)
    bg = Image.new("RGB", (size, size), (255, 255, 255))
    bg.paste(canvas, mask=canvas.getchannel("A"))
    return bg.convert("L")


def mse(a: Image.Image, b: Image.Image) -> float:
    diff = ImageChops.difference(a, b)
    hist = diff.histogram()
    return sum(value * ((index % 256) ** 2) for index, value in enumerate(hist)) / (a.width * a.height)


def available_sprites(asset_dir: Path) -> list[tuple[int, Path]]:
    out: list[tuple[int, Path]] = []
    for path in asset_dir.glob("*/front_normal.png"):
        try:
            out.append((int(path.parent.name), path))
        except ValueError:
            pass
    return sorted(out)


def read_rows(csv_path: Path, dex_start: int, dex_end: int, include_fallback_forms: bool) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    with csv_path.open("r", newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            dex = int(row.get("national_dex") or 0)
            if dex_start <= dex <= dex_end or (include_fallback_forms and row.get("confidence") == "base-species-fallback"):
                rows.append(row)
    return rows


def font(size: int) -> ImageFont.ImageFont:
    for name in ["DejaVuSans.ttf", "Arial.ttf"]:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


FONT = font(11)


def preview(path: Path, box: int = 70) -> Image.Image:
    image = bbox_image(path)
    image.thumbnail((box, box), Image.Resampling.NEAREST)
    canvas = Image.new("RGBA", (box, box), (255, 255, 255, 0))
    canvas.paste(image, ((box - image.width) // 2, (box - image.height) // 2), image)
    bg = Image.new("RGB", (box, box), (248, 248, 248))
    bg.paste(canvas, mask=canvas.getchannel("A"))
    return bg


def write_candidate_sheet(matches: list[dict], out_path: Path) -> None:
    cols = 2
    cell_w = 520
    cell_h = 126
    rows = math.ceil(len(matches) / cols)
    sheet = Image.new("RGB", (cols * cell_w, max(1, rows) * cell_h), "white")
    draw = ImageDraw.Draw(sheet)
    for pos, match in enumerate(matches):
        x = (pos % cols) * cell_w
        y = (pos // cols) * cell_h
        draw.rectangle((x, y, x + cell_w - 1, y + cell_h - 1), outline=(210, 210, 210))
        draw.text((x + 6, y + 4), f"{match['name']} ({match['species_id']})", font=FONT, fill=(0, 0, 0))
        sheet.paste(preview(Path(match["reference"])), (x + 6, y + 24))
        draw.text((x + 6, y + 96), "ref", font=FONT, fill=(80, 80, 80))
        cx = x + 88
        for candidate in match["candidates"][:5]:
            sheet.paste(preview(Path(candidate["path"])), (cx, y + 24))
            draw.text((cx, y + 96), f"#{candidate['index']:04d}", font=FONT, fill=(0, 0, 0))
            draw.text((cx, y + 109), f"{candidate['score']:.0f}", font=FONT, fill=(80, 80, 80))
            cx += 84
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--asset-dir", type=Path, default=DEFAULT_ASSET_DIR)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--dex-start", type=int, default=906)
    parser.add_argument("--dex-end", type=int, default=1025)
    parser.add_argument("--include-fallback-forms", action="store_true")
    parser.add_argument("--candidate-start", type=int, default=240)
    parser.add_argument("--candidate-end", type=int, default=1198)
    args = parser.parse_args()

    rows = read_rows(args.csv, args.dex_start, args.dex_end, args.include_fallback_forms)
    sprites = [(index, path) for index, path in available_sprites(args.asset_dir) if args.candidate_start <= index <= args.candidate_end]
    normalized_sprites = [(index, path, normalized(path)) for index, path in sprites]
    matches = []
    for row in rows:
        slug = ps_sprite_slug(row["species_id"], row["name"])
        ref = args.out_dir / "reference" / f"{slug}.png"
        if not download(f"{BASE_URL}/{slug}.png", ref):
            continue
        ref_norm = normalized(ref)
        candidates = sorted(
            ({"index": index, "path": str(path), "score": mse(ref_norm, image)} for index, path, image in normalized_sprites),
            key=lambda item: item["score"],
        )[:8]
        matches.append({
            "species_id": row["species_id"],
            "name": row["name"],
            "reference": str(ref),
            "candidates": candidates,
        })
    write_candidate_sheet(matches, args.out_dir / f"candidates_dex_{args.dex_start}_{args.dex_end}.png")
    with (args.out_dir / f"candidates_dex_{args.dex_start}_{args.dex_end}.csv").open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["species_id", "name", "rank", "index", "score", "path"])
        for match in matches:
            for rank, candidate in enumerate(match["candidates"], start=1):
                writer.writerow([match["species_id"], match["name"], rank, candidate["index"], f"{candidate['score']:.4f}", candidate["path"]])
    print(f"matched {len(matches)} reference sprites")
    print(f"wrote {args.out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
