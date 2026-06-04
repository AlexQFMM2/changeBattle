#!/usr/bin/env python3
"""Extract rough visual assets from a Pokemon Emerald-based GBA ROM.

This is intentionally a broad, read-only scanner. It does not try to modify the
ROM or require known pointer tables. It finds valid GBA LZ77 blocks whose
uncompressed sizes look like common 4bpp tiled graphics, renders grayscale PNG
previews, and writes contact sheets plus a manifest for later manual mapping.
"""
from __future__ import annotations

import argparse
import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

try:
    from PIL import Image, ImageDraw
except Exception as exc:  # pragma: no cover - user-facing dependency check
    raise SystemExit("Pillow is required: python3 -m pip install pillow") from exc

TARGET_DIMS: dict[int, list[tuple[int, int]]] = {
    512: [(32, 32)],
    1024: [(32, 64), (64, 32)],
    2048: [(64, 64)],
    4096: [(64, 128), (128, 64)],
    8192: [(128, 128), (64, 256)],
}

PALETTE_GRAY = [
    (255, 255, 255),
    (28, 28, 28),
    (58, 58, 58),
    (86, 86, 86),
    (112, 112, 112),
    (136, 136, 136),
    (158, 158, 158),
    (178, 178, 178),
    (196, 196, 196),
    (212, 212, 212),
    (224, 224, 224),
    (235, 235, 235),
    (140, 140, 140),
    (100, 100, 100),
    (64, 64, 64),
    (0, 0, 0),
]


@dataclass
class AssetEntry:
    offset: int
    offset_hex: str
    compressed_size: int
    decompressed_size: int
    width: int
    height: int
    variant_dimensions: list[list[int]]
    png: str


def gba_header(rom: bytes) -> dict[str, object]:
    title = rom[0xA0:0xAC].decode("ascii", errors="replace").rstrip("\0 ")
    game_code = rom[0xAC:0xB0].decode("ascii", errors="replace").rstrip("\0 ")
    maker = rom[0xB0:0xB2].decode("ascii", errors="replace").rstrip("\0 ")
    revision = rom[0xBC] if len(rom) > 0xBC else None
    return {
        "title": title,
        "game_code": game_code,
        "maker_code": maker,
        "revision": revision,
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

    if len(out) != size:
        return None
    return bytes(out), src - offset


def scan_lz77_blocks(rom: bytes, target_sizes: set[int], max_size: int) -> Iterable[tuple[int, bytes, int]]:
    offset = 0
    while offset < len(rom) - 4:
        if rom[offset] != 0x10:
            offset += 1
            continue
        result = lz77_decompress_at(rom, offset, max_size=max_size)
        if result is None:
            offset += 1
            continue
        data, compressed_size = result
        if len(data) in target_sizes:
            yield offset, data, compressed_size
            offset += max(1, compressed_size)
        else:
            offset += 1


def render_tile4bpp(data: bytes, width: int, height: int) -> Image.Image:
    img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    pixels = img.load()
    tiles_x = width // 8
    tiles_y = height // 8
    max_tiles = min(len(data) // 32, tiles_x * tiles_y)

    for tile_index in range(max_tiles):
        tile_x = tile_index % tiles_x
        tile_y = tile_index // tiles_x
        base = tile_index * 32
        for y in range(8):
            row = base + y * 4
            for xb in range(4):
                value = data[row + xb]
                color_indexes = (value & 0x0F, value >> 4)
                for sub_x, color_index in enumerate(color_indexes):
                    x = tile_x * 8 + xb * 2 + sub_x
                    px_y = tile_y * 8 + y
                    if color_index == 0:
                        pixels[x, px_y] = (255, 255, 255, 0)
                    else:
                        r, g, b = PALETTE_GRAY[color_index]
                        pixels[x, px_y] = (r, g, b, 255)
    return img


def checkerboard(size: tuple[int, int], block: int = 8) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size, "white")
    pixels = img.load()
    for y in range(h):
        for x in range(w):
            shade = 235 if ((x // block) + (y // block)) % 2 == 0 else 255
            pixels[x, y] = (shade, shade, shade)
    return img


def flatten_preview(img: Image.Image, scale: int = 2) -> Image.Image:
    bg = checkerboard(img.size)
    bg.paste(img, mask=img.getchannel("A"))
    if scale != 1:
        bg = bg.resize((bg.width * scale, bg.height * scale), Image.Resampling.NEAREST)
    return bg


def write_contact_sheets(entries: list[AssetEntry], out_dir: Path, cols: int, items_per_sheet: int) -> list[str]:
    sheet_paths: list[str] = []
    sheets_dir = out_dir / "sheets"
    sheets_dir.mkdir(parents=True, exist_ok=True)
    grouped: dict[int, list[AssetEntry]] = {}
    for entry in entries:
        grouped.setdefault(entry.decompressed_size, []).append(entry)

    for size, size_entries in sorted(grouped.items()):
        for sheet_index in range(math.ceil(len(size_entries) / items_per_sheet)):
            page_entries = size_entries[sheet_index * items_per_sheet : (sheet_index + 1) * items_per_sheet]
            if not page_entries:
                continue
            max_w = max(e.width for e in page_entries)
            max_h = max(e.height for e in page_entries)
            scale = 2 if max_w <= 32 else 1
            cell_w = max(96, max_w * scale + 20)
            cell_h = max(96, max_h * scale + 28)
            rows = math.ceil(len(page_entries) / cols)
            sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), "white")
            draw = ImageDraw.Draw(sheet)
            for idx, entry in enumerate(page_entries):
                png_path = out_dir / entry.png
                image = Image.open(png_path).convert("RGBA")
                preview = flatten_preview(image, scale=scale)
                cell_x = (idx % cols) * cell_w
                cell_y = (idx // cols) * cell_h
                x = cell_x + (cell_w - preview.width) // 2
                y = cell_y + 4
                sheet.paste(preview, (x, y))
                label = f"{entry.offset_hex} {entry.width}x{entry.height}"
                draw.text((cell_x + 3, cell_y + cell_h - 18), label, fill=(0, 0, 0))
            rel = Path("sheets") / f"lz77_{size}_{sheet_index:03d}.png"
            sheet.save(out_dir / rel)
            sheet_paths.append(str(rel))
    return sheet_paths


def parse_sizes(raw: str) -> set[int]:
    sizes = {int(part.strip(), 0) for part in raw.split(",") if part.strip()}
    unsupported = sorted(size for size in sizes if size not in TARGET_DIMS)
    if unsupported:
        raise SystemExit(f"Unsupported sizes for renderer: {unsupported}")
    return sizes


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract rough GBA LZ77 4bpp asset previews from green.gba")
    parser.add_argument("rom", type=Path, help="Path to .gba ROM")
    parser.add_argument("--out-dir", type=Path, default=Path("dump/green-gba-assets"), help="Output directory")
    parser.add_argument("--sizes", default="512,1024,2048,4096,8192", help="Comma-separated uncompressed byte sizes")
    parser.add_argument("--min-offset", type=lambda s: int(s, 0), default=0, help="Start scanning at this ROM offset")
    parser.add_argument("--limit-per-size", type=int, default=0, help="0 means unlimited")
    parser.add_argument("--sheet-cols", type=int, default=10)
    parser.add_argument("--sheet-items", type=int, default=100)
    args = parser.parse_args()

    rom = args.rom.read_bytes()
    target_sizes = parse_sizes(args.sizes)
    max_size = max(target_sizes)
    out_dir = args.out_dir
    candidates_dir = out_dir / "candidates"
    candidates_dir.mkdir(parents=True, exist_ok=True)

    entries: list[AssetEntry] = []
    counts: dict[int, int] = {size: 0 for size in sorted(target_sizes)}

    scan_rom = rom[args.min_offset :] if args.min_offset else rom
    offset_base = args.min_offset
    for rel_offset, data, compressed_size in scan_lz77_blocks(scan_rom, target_sizes, max_size=max_size):
        offset = offset_base + rel_offset
        size = len(data)
        if args.limit_per_size and counts[size] >= args.limit_per_size:
            continue
        counts[size] += 1
        primary_width, primary_height = TARGET_DIMS[size][0]
        image = render_tile4bpp(data, primary_width, primary_height)
        rel_png = Path("candidates") / f"{offset:08X}_{size}_{primary_width}x{primary_height}.png"
        image.save(out_dir / rel_png)
        entries.append(
            AssetEntry(
                offset=offset,
                offset_hex=f"0x{offset:08X}",
                compressed_size=compressed_size,
                decompressed_size=size,
                width=primary_width,
                height=primary_height,
                variant_dimensions=[[w, h] for w, h in TARGET_DIMS[size]],
                png=str(rel_png),
            )
        )

    sheets = write_contact_sheets(entries, out_dir, cols=args.sheet_cols, items_per_sheet=args.sheet_items)
    manifest = {
        "rom": str(args.rom),
        "rom_header": gba_header(rom),
        "scan": {
            "min_offset": args.min_offset,
            "target_sizes": sorted(target_sizes),
            "limit_per_size": args.limit_per_size,
            "entry_count": len(entries),
            "counts_by_size": {str(k): v for k, v in sorted(counts.items())},
        },
        "sheets": sheets,
        "entries": [asdict(entry) for entry in entries],
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    summary_lines = [
        "green.gba rough asset extraction",
        f"ROM: {args.rom}",
        f"Output: {out_dir}",
        f"Entries: {len(entries)}",
        "Counts by decompressed size:",
    ]
    summary_lines.extend(f"  {size}: {counts[size]}" for size in sorted(counts))
    summary_lines.append("")
    summary_lines.append("Contact sheets:")
    summary_lines.extend(f"  {sheet}" for sheet in sheets)
    (out_dir / "summary.txt").write_text("\n".join(summary_lines) + "\n", encoding="utf-8")

    print(f"Wrote {len(entries)} candidate PNGs")
    for size in sorted(counts):
        print(f"  {size}: {counts[size]}")
    print(f"Manifest: {out_dir / 'manifest.json'}")
    print(f"Sheets: {out_dir / 'sheets'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
