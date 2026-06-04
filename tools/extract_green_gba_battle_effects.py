#!/usr/bin/env python3
"""Extract first-pass battle effect candidates from green.gba.

This scanner is intentionally conservative: it finds LZ77 4bpp graphics blocks
and LZ77 16-color palette blocks, pairs each graphic with the nearest palette,
and writes contact sheets for human review. It does not attempt to run the GBA
battle animation VM.
"""
from __future__ import annotations

import argparse
import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path

from PIL import Image, ImageDraw

GBA_BASE = 0x08000000
GRAPHIC_DIMS: dict[int, list[tuple[int, int]]] = {
    512: [(32, 32)],
    1024: [(32, 64), (64, 32)],
    2048: [(64, 64)],
    4096: [(64, 128), (128, 64)],
    8192: [(128, 128), (64, 256)],
}

GRAY_PALETTE = [
    (255, 255, 255, 0),
    (28, 28, 28, 255),
    (58, 58, 58, 255),
    (86, 86, 86, 255),
    (112, 112, 112, 255),
    (136, 136, 136, 255),
    (158, 158, 158, 255),
    (178, 178, 178, 255),
    (196, 196, 196, 255),
    (212, 212, 212, 255),
    (224, 224, 224, 255),
    (235, 235, 235, 255),
    (140, 140, 140, 255),
    (100, 100, 100, 255),
    (64, 64, 64, 255),
    (0, 0, 0, 255),
]


@dataclass
class GraphicCandidate:
    offset: int
    offset_hex: str
    compressed_size: int
    decompressed_size: int
    width: int
    height: int
    palette_offset_hex: str | None
    palette_distance: int | None
    role_guess: str
    png: str
    sheet_group: str


@dataclass
class PaletteCandidate:
    offset: int
    offset_hex: str
    compressed_size: int
    color_count: int
    colors_hex: list[str]
    png: str


def u16(data: bytes, offset: int) -> int:
    return int.from_bytes(data[offset : offset + 2], "little")


def gba_header(rom: bytes) -> dict[str, object]:
    return {
        "title": rom[0xA0:0xAC].decode("ascii", errors="replace").rstrip("\0 "),
        "game_code": rom[0xAC:0xB0].decode("ascii", errors="replace").rstrip("\0 "),
        "maker_code": rom[0xB0:0xB2].decode("ascii", errors="replace").rstrip("\0 "),
        "revision": rom[0xBC] if len(rom) > 0xBC else None,
        "size_bytes": len(rom),
    }


def lz77_decompress_at(rom: bytes, offset: int, max_size: int) -> tuple[bytes, int] | None:
    if offset + 4 > len(rom) or rom[offset] != 0x10:
        return None
    size = rom[offset + 1] | (rom[offset + 2] << 8) | (rom[offset + 3] << 16)
    if size <= 0 or size > max_size:
        return None

    src = offset + 4
    out = bytearray()
    try:
        while len(out) < size and src < len(rom):
            flags = rom[src]
            src += 1
            for bit in range(8):
                if len(out) >= size:
                    break
                if flags & (0x80 >> bit):
                    if src + 2 > len(rom):
                        return None
                    b1 = rom[src]
                    b2 = rom[src + 1]
                    src += 2
                    length = (b1 >> 4) + 3
                    disp = ((b1 & 0x0F) << 8) | b2
                    copy_src = len(out) - disp - 1
                    if copy_src < 0:
                        return None
                    for _ in range(length):
                        out.append(out[copy_src])
                        copy_src += 1
                        if len(out) >= size:
                            break
                else:
                    if src >= len(rom):
                        return None
                    out.append(rom[src])
                    src += 1
    except IndexError:
        return None
    return (bytes(out), src - offset) if len(out) == size else None


def bgr555_to_rgba(value: int) -> tuple[int, int, int, int]:
    red = (value & 0x1F) * 255 // 31
    green = ((value >> 5) & 0x1F) * 255 // 31
    blue = ((value >> 10) & 0x1F) * 255 // 31
    return red, green, blue, 255


def decode_palette(data: bytes) -> list[tuple[int, int, int, int]] | None:
    if len(data) < 32:
        return None
    colors = [bgr555_to_rgba(u16(data, i * 2)) for i in range(16)]
    colors[0] = (255, 255, 255, 0)
    return colors


def color_hex(color: tuple[int, int, int, int]) -> str:
    return f"#{color[0]:02X}{color[1]:02X}{color[2]:02X}{color[3]:02X}"


def render_palette(colors: list[tuple[int, int, int, int]], scale: int = 12) -> Image.Image:
    image = Image.new("RGBA", (16 * scale, scale), (255, 255, 255, 0))
    draw = ImageDraw.Draw(image)
    for index, color in enumerate(colors):
        draw.rectangle((index * scale, 0, (index + 1) * scale - 1, scale - 1), fill=color)
    return image


def render_4bpp_tiles(tile_data: bytes, colors: list[tuple[int, int, int, int]], width: int, height: int) -> Image.Image:
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    pixels = image.load()
    tiles_x = width // 8
    max_tiles = min(len(tile_data) // 32, (width // 8) * (height // 8))
    for tile_index in range(max_tiles):
        tile_x = tile_index % tiles_x
        tile_y = tile_index // tiles_x
        base = tile_index * 32
        for y in range(8):
            row = base + y * 4
            for byte_x in range(4):
                value = tile_data[row + byte_x]
                for sub_x, color_index in enumerate((value & 0x0F, value >> 4)):
                    pixels[tile_x * 8 + byte_x * 2 + sub_x, tile_y * 8 + y] = colors[color_index]
    return image


def scan_lz77(rom: bytes, sizes: set[int], max_size: int, start: int, end: int) -> list[tuple[int, bytes, int]]:
    results: list[tuple[int, bytes, int]] = []
    offset = start
    while offset < min(end, len(rom)) - 4:
        if rom[offset] != 0x10:
            offset += 1
            continue
        result = lz77_decompress_at(rom, offset, max_size)
        if result is None:
            offset += 1
            continue
        data, compressed_size = result
        if len(data) in sizes:
            results.append((offset, data, compressed_size))
            offset += max(1, compressed_size)
        else:
            offset += 1
    return results


def nearest_palette(offset: int, palettes: list[tuple[int, list[tuple[int, int, int, int]], int]], max_distance: int) -> tuple[int, list[tuple[int, int, int, int]], int] | None:
    if not palettes:
        return None
    nearest = min(palettes, key=lambda item: abs(item[0] - offset))
    distance = abs(nearest[0] - offset)
    return nearest if distance <= max_distance else None


def role_guess(size: int, offset: int, palette_distance: int | None) -> str:
    if size <= 1024:
        return "small-effect-or-icon"
    if size == 2048:
        return "single-effect-frame"
    if size == 4096:
        return "large-effect-or-2-frame"
    if palette_distance is not None and palette_distance < 0x400:
        return "near-palette-effect"
    return "large-background-or-animation"


def checkerboard(size: tuple[int, int], block: int = 8) -> Image.Image:
    image = Image.new("RGB", size, "white")
    pixels = image.load()
    for y in range(size[1]):
        for x in range(size[0]):
            shade = 235 if ((x // block) + (y // block)) % 2 == 0 else 255
            pixels[x, y] = (shade, shade, shade)
    return image


def flatten_preview(image: Image.Image, scale: int = 2) -> Image.Image:
    bg = checkerboard(image.size)
    bg.paste(image, mask=image.getchannel("A"))
    if scale != 1:
        bg = bg.resize((bg.width * scale, bg.height * scale), Image.Resampling.NEAREST)
    return bg


def write_contact_sheets(entries: list[GraphicCandidate], out_dir: Path, cols: int, items_per_sheet: int) -> list[str]:
    sheet_paths: list[str] = []
    sheets_dir = out_dir / "sheets"
    sheets_dir.mkdir(parents=True, exist_ok=True)
    grouped: dict[str, list[GraphicCandidate]] = {}
    for entry in entries:
        grouped.setdefault(entry.sheet_group, []).append(entry)

    for group, group_entries in sorted(grouped.items()):
        for sheet_index in range(math.ceil(len(group_entries) / items_per_sheet)):
            page = group_entries[sheet_index * items_per_sheet : (sheet_index + 1) * items_per_sheet]
            if not page:
                continue
            max_w = max(item.width for item in page)
            max_h = max(item.height for item in page)
            scale = 2 if max_w <= 64 and max_h <= 64 else 1
            cell_w = max(118, max_w * scale + 28)
            cell_h = max(112, max_h * scale + 34)
            rows = math.ceil(len(page) / cols)
            sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), "white")
            draw = ImageDraw.Draw(sheet)
            for pos, entry in enumerate(page):
                image = Image.open(out_dir / entry.png).convert("RGBA")
                preview = flatten_preview(image, scale)
                cell_x = (pos % cols) * cell_w
                cell_y = (pos // cols) * cell_h
                sheet.paste(preview, (cell_x + (cell_w - preview.width) // 2, cell_y + 4))
                label = f"{entry.offset_hex} {entry.width}x{entry.height}"
                draw.text((cell_x + 4, cell_y + cell_h - 24), label, fill=(0, 0, 0))
                draw.text((cell_x + 4, cell_y + cell_h - 12), entry.role_guess[:22], fill=(0, 0, 0))
            rel = Path("sheets") / f"effects_{group}_{sheet_index:03d}.png"
            sheet.save(out_dir / rel)
            sheet_paths.append(str(rel))
    return sheet_paths


def parse_sizes(raw: str, supported: set[int]) -> set[int]:
    sizes = {int(part.strip(), 0) for part in raw.split(",") if part.strip()}
    unsupported = sorted(sizes - supported)
    if unsupported:
        raise SystemExit(f"Unsupported sizes: {unsupported}")
    return sizes


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract candidate GBA battle effect assets from green.gba")
    parser.add_argument("rom", type=Path)
    parser.add_argument("--out-dir", type=Path, default=Path("dump/green-gba-battle-effects"))
    parser.add_argument("--graphic-sizes", default="512,1024,2048,4096,8192")
    parser.add_argument("--palette-sizes", default="32,64")
    parser.add_argument("--min-offset", type=lambda value: int(value, 0), default=0)
    parser.add_argument("--max-offset", type=lambda value: int(value, 0), default=0)
    parser.add_argument("--palette-window", type=lambda value: int(value, 0), default=0x20000)
    parser.add_argument("--limit-per-size", type=int, default=0)
    parser.add_argument("--sheet-cols", type=int, default=10)
    parser.add_argument("--sheet-items", type=int, default=100)
    args = parser.parse_args()

    rom = args.rom.read_bytes()
    max_offset = args.max_offset or len(rom)
    graphic_sizes = parse_sizes(args.graphic_sizes, set(GRAPHIC_DIMS))
    palette_sizes = parse_sizes(args.palette_sizes, {32, 64})
    out_dir = args.out_dir
    graphics_dir = out_dir / "candidates"
    palettes_dir = out_dir / "palettes"
    graphics_dir.mkdir(parents=True, exist_ok=True)
    palettes_dir.mkdir(parents=True, exist_ok=True)

    palette_blocks = scan_lz77(rom, palette_sizes, max(palette_sizes), args.min_offset, max_offset)
    palettes: list[tuple[int, list[tuple[int, int, int, int]], int]] = []
    palette_entries: list[PaletteCandidate] = []
    for offset, data, compressed_size in palette_blocks:
        colors = decode_palette(data)
        if colors is None:
            continue
        rel = Path("palettes") / f"{offset:08X}_{len(data)}.png"
        render_palette(colors).save(out_dir / rel)
        palettes.append((offset, colors, compressed_size))
        palette_entries.append(
            PaletteCandidate(
                offset=offset,
                offset_hex=f"0x{offset:08X}",
                compressed_size=compressed_size,
                color_count=len(colors),
                colors_hex=[color_hex(color) for color in colors],
                png=str(rel),
            )
        )

    graphic_blocks = scan_lz77(rom, graphic_sizes, max(graphic_sizes), args.min_offset, max_offset)
    counts: dict[int, int] = {size: 0 for size in sorted(graphic_sizes)}
    graphic_entries: list[GraphicCandidate] = []
    for offset, data, compressed_size in graphic_blocks:
        size = len(data)
        if args.limit_per_size and counts[size] >= args.limit_per_size:
            continue
        counts[size] += 1
        width, height = GRAPHIC_DIMS[size][0]
        palette_match = nearest_palette(offset, palettes, args.palette_window)
        palette_offset: int | None = None
        palette_distance: int | None = None
        colors = GRAY_PALETTE
        if palette_match:
            palette_offset, colors, _palette_compressed_size = palette_match
            palette_distance = abs(palette_offset - offset)
        image = render_4bpp_tiles(data, colors, width, height)
        rel = Path("candidates") / f"{offset:08X}_{size}_{width}x{height}.png"
        image.save(out_dir / rel)
        guess = role_guess(size, offset, palette_distance)
        graphic_entries.append(
            GraphicCandidate(
                offset=offset,
                offset_hex=f"0x{offset:08X}",
                compressed_size=compressed_size,
                decompressed_size=size,
                width=width,
                height=height,
                palette_offset_hex=None if palette_offset is None else f"0x{palette_offset:08X}",
                palette_distance=palette_distance,
                role_guess=guess,
                png=str(rel),
                sheet_group=f"{size}_{guess}",
            )
        )

    sheets = write_contact_sheets(graphic_entries, out_dir, args.sheet_cols, args.sheet_items)
    manifest = {
        "rom": str(args.rom),
        "rom_header": gba_header(rom),
        "scan": {
            "min_offset": args.min_offset,
            "max_offset": max_offset,
            "graphic_sizes": sorted(graphic_sizes),
            "palette_sizes": sorted(palette_sizes),
            "palette_window": args.palette_window,
            "limit_per_size": args.limit_per_size,
            "graphic_count": len(graphic_entries),
            "palette_count": len(palette_entries),
            "counts_by_graphic_size": {str(k): v for k, v in sorted(counts.items())},
        },
        "sheets": sheets,
        "palettes": [asdict(entry) for entry in palette_entries],
        "graphics": [asdict(entry) for entry in graphic_entries],
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    summary = [
        "green.gba battle effect candidate extraction",
        f"ROM: {args.rom}",
        f"Output: {out_dir}",
        f"Graphic candidates: {len(graphic_entries)}",
        f"Palette candidates: {len(palette_entries)}",
        "Counts by graphic size:",
        *[f"  {size}: {counts[size]}" for size in sorted(counts)],
        "",
        "Contact sheets:",
        *[f"  {sheet}" for sheet in sheets],
    ]
    (out_dir / "summary.txt").write_text("\n".join(summary) + "\n", encoding="utf-8")
    print(f"Wrote {len(graphic_entries)} graphic candidates and {len(palette_entries)} palettes")
    print(f"Manifest: {out_dir / 'manifest.json'}")
    print(f"Sheets: {out_dir / 'sheets'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
