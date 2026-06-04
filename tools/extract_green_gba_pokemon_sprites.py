#!/usr/bin/env python3
"""Extract correctly-colored Pokemon sprites from an Emerald-based GBA ROM.

The hack stores the Pokemon graphics table pointers in the ROM header area:
- 0x128: front sprite table
- 0x12C: back sprite table
- 0x130: normal palette table
- 0x134: shiny palette table

Each graphics entry is 8 bytes: pointer, uncompressed size, tag/species id.
Each palette entry is 8 bytes: pointer, tag/species id, unused.
"""
from __future__ import annotations

import argparse
import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path

from PIL import Image, ImageDraw

GBA_BASE = 0x08000000
HEADER_FRONT_TABLE = 0x128
HEADER_BACK_TABLE = 0x12C
HEADER_NORMAL_PALETTE_TABLE = 0x130
HEADER_SHINY_PALETTE_TABLE = 0x134
ENTRY_SIZE = 8


@dataclass
class SpriteEntry:
    index: int
    front_tag: int
    back_tag: int
    palette_tag: int
    shiny_palette_tag: int
    front_offset: str | None
    back_offset: str | None
    normal_palette_offset: str | None
    shiny_palette_offset: str | None
    front_size: int | None
    back_size: int | None
    paths: dict[str, str]


def u16(data: bytes, offset: int) -> int:
    return int.from_bytes(data[offset : offset + 2], "little")


def u32(data: bytes, offset: int) -> int:
    return int.from_bytes(data[offset : offset + 4], "little")


def ptr_to_offset(ptr: int, rom_len: int) -> int | None:
    offset = ptr - GBA_BASE
    if 0 <= offset < rom_len:
        return offset
    return None


def hex_offset(offset: int | None) -> str | None:
    return None if offset is None else f"0x{offset:08X}"


def lz77_decompress(data: bytes, offset: int | None, max_size: int = 0x40000) -> bytes | None:
    if offset is None or offset + 4 > len(data) or data[offset] != 0x10:
        return None
    size = data[offset + 1] | (data[offset + 2] << 8) | (data[offset + 3] << 16)
    if size <= 0 or size > max_size:
        return None
    src = offset + 4
    out = bytearray()
    try:
        while len(out) < size and src < len(data):
            flags = data[src]
            src += 1
            for bit in range(8):
                if len(out) >= size:
                    break
                if flags & (0x80 >> bit):
                    if src + 2 > len(data):
                        return None
                    b1 = data[src]
                    b2 = data[src + 1]
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
                    if src >= len(data):
                        return None
                    out.append(data[src])
                    src += 1
    except IndexError:
        return None
    return bytes(out) if len(out) == size else None


def bgr555_to_rgba(value: int) -> tuple[int, int, int, int]:
    red = (value & 0x1F) * 255 // 31
    green = ((value >> 5) & 0x1F) * 255 // 31
    blue = ((value >> 10) & 0x1F) * 255 // 31
    return red, green, blue, 255


def decode_palette(palette_data: bytes | None) -> list[tuple[int, int, int, int]] | None:
    if palette_data is None or len(palette_data) < 32:
        return None
    colors = [bgr555_to_rgba(u16(palette_data, i * 2)) for i in range(16)]
    colors[0] = (255, 255, 255, 0)
    return colors


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


def sprite_dimensions(byte_count: int | None) -> tuple[int, int] | None:
    if byte_count == 2048:
        return 64, 64
    if byte_count == 4096:
        # Emerald front sprites usually contain two 64x64 animation frames stacked vertically.
        return 64, 128
    if byte_count and byte_count % 32 == 0:
        return 64, max(8, (byte_count // 32 // 8) * 8)
    return None


def transparent_to_checker(image: Image.Image, block: int = 8) -> Image.Image:
    bg = Image.new("RGB", image.size, "white")
    pixels = bg.load()
    for y in range(image.height):
        for x in range(image.width):
            shade = 235 if ((x // block) + (y // block)) % 2 == 0 else 255
            pixels[x, y] = (shade, shade, shade)
    bg.paste(image, mask=image.getchannel("A"))
    return bg


def table_ptr(rom: bytes, header_offset: int) -> int:
    ptr = u32(rom, header_offset)
    offset = ptr_to_offset(ptr, len(rom))
    if offset is None:
        raise ValueError(f"Header pointer at 0x{header_offset:X} is not a valid GBA ROM pointer: 0x{ptr:08X}")
    return offset


def infer_entry_count(front_table: int, back_table: int, normal_palette_table: int, shiny_palette_table: int) -> int:
    candidates = [
        (back_table - front_table) // ENTRY_SIZE,
        (normal_palette_table - back_table) // ENTRY_SIZE,
        (shiny_palette_table - normal_palette_table) // ENTRY_SIZE,
    ]
    positive = [count for count in candidates if count > 0]
    if not positive:
        return 0
    return min(positive)


def read_graphic_entry(rom: bytes, table: int, index: int) -> tuple[int | None, int, int]:
    entry = table + index * ENTRY_SIZE
    offset = ptr_to_offset(u32(rom, entry), len(rom))
    size = u16(rom, entry + 4)
    tag = u16(rom, entry + 6)
    return offset, size, tag


def read_palette_entry(rom: bytes, table: int, index: int) -> tuple[int | None, int, int]:
    entry = table + index * ENTRY_SIZE
    offset = ptr_to_offset(u32(rom, entry), len(rom))
    tag = u16(rom, entry + 4)
    extra = u16(rom, entry + 6)
    return offset, tag, extra


def save_sprite(path: Path, image: Image.Image | None) -> str | None:
    if image is None:
        return None
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)
    return str(path)


def write_contact_sheet(images: list[tuple[int, Path]], out_path: Path, label_prefix: str, cols: int = 10) -> None:
    if not images:
        return
    cell_w = 112
    cell_h = 160
    rows = math.ceil(len(images) / cols)
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), "white")
    draw = ImageDraw.Draw(sheet)
    for pos, (index, path) in enumerate(images):
        image = Image.open(path).convert("RGBA")
        preview = transparent_to_checker(image)
        if preview.height > 96:
            preview = preview.crop((0, 0, preview.width, 96))
        cx = (pos % cols) * cell_w
        cy = (pos // cols) * cell_h
        sheet.paste(preview, (cx + (cell_w - preview.width) // 2, cy + 4))
        draw.text((cx + 4, cy + 108), f"{label_prefix} {index:04d}", fill=(0, 0, 0))
    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract colored Pokemon front/back sprites from green.gba header tables")
    parser.add_argument("rom", type=Path)
    parser.add_argument("--out-dir", type=Path, default=Path("dump/green-gba-pokemon"))
    parser.add_argument("--limit", type=int, default=0, help="0 means all inferred entries")
    args = parser.parse_args()

    rom = args.rom.read_bytes()
    front_table = table_ptr(rom, HEADER_FRONT_TABLE)
    back_table = table_ptr(rom, HEADER_BACK_TABLE)
    normal_palette_table = table_ptr(rom, HEADER_NORMAL_PALETTE_TABLE)
    shiny_palette_table = table_ptr(rom, HEADER_SHINY_PALETTE_TABLE)
    inferred_count = infer_entry_count(front_table, back_table, normal_palette_table, shiny_palette_table)
    count = min(args.limit, inferred_count) if args.limit else inferred_count

    out_dir = args.out_dir
    entries: list[SpriteEntry] = []
    sheet_front_paths: list[tuple[int, Path]] = []
    sheet_back_paths: list[tuple[int, Path]] = []

    for index in range(count):
        front_offset, front_declared_size, front_tag = read_graphic_entry(rom, front_table, index)
        back_offset, back_declared_size, back_tag = read_graphic_entry(rom, back_table, index)
        normal_palette_offset, normal_palette_tag, _ = read_palette_entry(rom, normal_palette_table, index)
        shiny_palette_offset, shiny_palette_tag, _ = read_palette_entry(rom, shiny_palette_table, index)

        front_data = lz77_decompress(rom, front_offset)
        back_data = lz77_decompress(rom, back_offset)
        normal_colors = decode_palette(lz77_decompress(rom, normal_palette_offset, max_size=32))
        shiny_colors = decode_palette(lz77_decompress(rom, shiny_palette_offset, max_size=32))

        paths: dict[str, str] = {}
        for variant, colors in (("normal", normal_colors), ("shiny", shiny_colors)):
            if colors is None:
                continue
            if front_data is not None:
                dims = sprite_dimensions(len(front_data))
                if dims:
                    front_image = render_4bpp_tiles(front_data, colors, *dims)
                    full_rel = Path("pokemon") / f"{index:04d}" / f"front_{variant}_full.png"
                    frame0_rel = Path("pokemon") / f"{index:04d}" / f"front_{variant}.png"
                    save_sprite(out_dir / full_rel, front_image)
                    save_sprite(out_dir / frame0_rel, front_image.crop((0, 0, min(64, front_image.width), min(64, front_image.height))))
                    paths[f"front_{variant}_full"] = str(full_rel)
                    paths[f"front_{variant}"] = str(frame0_rel)
                    if variant == "normal":
                        sheet_front_paths.append((index, out_dir / frame0_rel))
            if back_data is not None:
                dims = sprite_dimensions(len(back_data))
                if dims:
                    back_image = render_4bpp_tiles(back_data, colors, *dims)
                    back_rel = Path("pokemon") / f"{index:04d}" / f"back_{variant}.png"
                    save_sprite(out_dir / back_rel, back_image.crop((0, 0, min(64, back_image.width), min(64, back_image.height))))
                    paths[f"back_{variant}"] = str(back_rel)
                    if variant == "normal":
                        sheet_back_paths.append((index, out_dir / back_rel))

        entries.append(
            SpriteEntry(
                index=index,
                front_tag=front_tag,
                back_tag=back_tag,
                palette_tag=normal_palette_tag,
                shiny_palette_tag=shiny_palette_tag,
                front_offset=hex_offset(front_offset),
                back_offset=hex_offset(back_offset),
                normal_palette_offset=hex_offset(normal_palette_offset),
                shiny_palette_offset=hex_offset(shiny_palette_offset),
                front_size=len(front_data) if front_data is not None else None,
                back_size=len(back_data) if back_data is not None else None,
                paths=paths,
            )
        )

    sheets_dir = out_dir / "sheets"
    for page_start in range(0, len(sheet_front_paths), 100):
        write_contact_sheet(sheet_front_paths[page_start : page_start + 100], sheets_dir / f"front_normal_{page_start // 100:03d}.png", "front")
    for page_start in range(0, len(sheet_back_paths), 100):
        write_contact_sheet(sheet_back_paths[page_start : page_start + 100], sheets_dir / f"back_normal_{page_start // 100:03d}.png", "back")

    manifest = {
        "rom": str(args.rom),
        "tables": {
            "front": f"0x{front_table:08X}",
            "back": f"0x{back_table:08X}",
            "normal_palette": f"0x{normal_palette_table:08X}",
            "shiny_palette": f"0x{shiny_palette_table:08X}",
            "inferred_count": inferred_count,
            "exported_count": count,
        },
        "entries": [asdict(entry) for entry in entries],
    }
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "pokemon_sprites_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    (out_dir / "summary.txt").write_text(
        "green.gba Pokemon sprite table extraction\n"
        f"ROM: {args.rom}\n"
        f"Output: {out_dir}\n"
        f"Front table: 0x{front_table:08X}\n"
        f"Back table: 0x{back_table:08X}\n"
        f"Normal palette table: 0x{normal_palette_table:08X}\n"
        f"Shiny palette table: 0x{shiny_palette_table:08X}\n"
        f"Entries: {count}\n",
        encoding="utf-8",
    )
    print(f"Exported {count} Pokemon sprite entries")
    print(f"Output: {out_dir}")
    print(f"Manifest: {out_dir / 'pokemon_sprites_manifest.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
