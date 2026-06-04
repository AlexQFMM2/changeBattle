#!/usr/bin/env python3
"""Create visual contact sheets for auditing Pokemon sprite mappings."""

from __future__ import annotations

import argparse
import csv
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


DEFAULT_ASSET_DIR = Path("assets/pokemon-green/pokemon")
DEFAULT_CSV = Path("data/sprite_index_map.csv")
DEFAULT_OUT = Path("work/sprite-audit")


def font(size: int) -> ImageFont.ImageFont:
    for name in ["DejaVuSans.ttf", "Arial.ttf"]:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


FONT_SMALL = font(11)
FONT_MEDIUM = font(13)


def checker(size: tuple[int, int], block: int = 8) -> Image.Image:
    image = Image.new("RGB", size, "white")
    pixels = image.load()
    for y in range(size[1]):
        for x in range(size[0]):
            shade = 232 if ((x // block) + (y // block)) % 2 == 0 else 255
            pixels[x, y] = (shade, shade, shade)
    return image


def sprite_preview(path: Path, max_size: int = 86) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    if image.height > 96:
        image = image.crop((0, 0, image.width, 96))
    image.thumbnail((max_size, max_size), Image.Resampling.NEAREST)
    bg = checker((max_size, max_size))
    bg.paste(image, ((max_size - image.width) // 2, (max_size - image.height) // 2), image)
    return bg


def draw_wrapped(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, width: int, fill: tuple[int, int, int]) -> None:
    words = text.replace("-", "- ").split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = (current + " " + word).strip()
        if draw.textbbox((0, 0), candidate, font=FONT_SMALL)[2] <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    x, y = xy
    for line in lines[:3]:
        draw.text((x, y), line, font=FONT_SMALL, fill=fill)
        y += 13


def write_sheet(cells: list[dict], out_path: Path, cols: int = 8, title: str = "") -> None:
    cell_w = 134
    cell_h = 142
    title_h = 28 if title else 0
    rows = max(1, math.ceil(len(cells) / cols))
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h + title_h), "white")
    draw = ImageDraw.Draw(sheet)
    if title:
        draw.rectangle((0, 0, sheet.width, title_h), fill=(30, 33, 38))
        draw.text((8, 6), title, font=FONT_MEDIUM, fill=(255, 255, 255))
    for pos, cell in enumerate(cells):
        x = (pos % cols) * cell_w
        y = (pos // cols) * cell_h + title_h
        draw.rectangle((x, y, x + cell_w - 1, y + cell_h - 1), outline=(210, 210, 210))
        path = Path(cell["path"])
        if path.exists():
            preview = sprite_preview(path)
            sheet.paste(preview, (x + (cell_w - preview.width) // 2, y + 4))
        else:
            draw.rectangle((x + 24, y + 10, x + 110, y + 96), fill=(245, 210, 210), outline=(180, 60, 60))
            draw.text((x + 38, y + 42), "missing", font=FONT_SMALL, fill=(160, 30, 30))
        draw.text((x + 6, y + 94), cell["label"], font=FONT_MEDIUM, fill=(0, 0, 0))
        if cell.get("sub"):
            draw_wrapped(draw, (x + 6, y + 111), cell["sub"], cell_w - 12, (55, 55, 55))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)


def available_indices(asset_dir: Path) -> list[int]:
    indices = []
    for path in asset_dir.glob("*/front_normal.png"):
        try:
            indices.append(int(path.parent.name))
        except ValueError:
            pass
    return sorted(indices)


def read_rows(csv_path: Path) -> list[dict[str, str]]:
    with csv_path.open("r", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def index_sheet(asset_dir: Path, out_dir: Path, start: int, end: int) -> None:
    cells = []
    for index in range(start, end + 1):
        path = asset_dir / f"{index:04d}" / "front_normal.png"
        if path.exists():
            cells.append({"path": str(path), "label": f"#{index:04d}", "sub": ""})
    write_sheet(cells, out_dir / f"indices_{start:04d}_{end:04d}.png", title=f"Sprite indices {start:04d}-{end:04d}")


def mapping_sheet(rows: list[dict[str, str]], out_dir: Path, start: int, end: int) -> None:
    cells = []
    for row in rows:
        dex = int(row.get("national_dex") or 0)
        if not (start <= dex <= end):
            continue
        cells.append({
            "path": row.get("image", ""),
            "label": f"{row.get('national_dex')} {row.get('name')}",
            "sub": f"idx {int(row.get('sprite_index') or 0):04d} {row.get('confidence')}",
        })
    write_sheet(cells, out_dir / f"mapping_dex_{start:04d}_{end:04d}.png", title=f"Current mapping dex {start:04d}-{end:04d}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--asset-dir", type=Path, default=DEFAULT_ASSET_DIR)
    parser.add_argument("--csv", type=Path, default=DEFAULT_CSV)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--chunk", type=int, default=80)
    args = parser.parse_args()

    indices = available_indices(args.asset_dir)
    rows = read_rows(args.csv)
    for start in range(min(indices), max(indices) + 1, args.chunk):
        index_sheet(args.asset_dir, args.out_dir / "indices", start, min(start + args.chunk - 1, max(indices)))
    max_dex = max(int(row.get("national_dex") or 0) for row in rows)
    for start in range(1, max_dex + 1, args.chunk):
        mapping_sheet(rows, args.out_dir / "mapping", start, min(start + args.chunk - 1, max_dex))
    print(f"wrote sheets to {args.out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
