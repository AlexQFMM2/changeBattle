#!/usr/bin/env python3
"""Inspect battle animation scripts in an Emerald-based GBA ROM.

This is a read-only helper for green.gba reverse-engineering. It decodes the
Gen III battle animation bytecode enough to show which resources, sprite
templates, visual tasks, delays, jumps, and calls a move animation uses.
"""
from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path

GBA_BASE = 0x08000000

# Located in this green.gba by scanning for a long table of animation-script
# pointers. It matches the shape of pokeemerald's gBattleAnims_Moves table.
DEFAULT_MOVE_ANIMS_TABLE = 0x002C8D6C

COMMAND_NAMES = {
    0x00: "loadspritegfx",
    0x01: "unloadspritegfx",
    0x02: "createsprite",
    0x03: "createvisualtask",
    0x04: "delay",
    0x05: "waitforvisualfinish",
    0x06: "nop",
    0x07: "nop2",
    0x08: "end",
    0x09: "playse",
    0x0A: "monbg",
    0x0B: "clearmonbg",
    0x0C: "setalpha",
    0x0D: "blendoff",
    0x0E: "call",
    0x0F: "return",
    0x10: "setarg",
    0x11: "choosetwoturnanim",
    0x12: "jumpifmoveturn",
    0x13: "goto",
    0x14: "fadetobg",
    0x15: "restorebg",
    0x16: "waitbgfadeout",
    0x17: "waitbgfadein",
    0x18: "changebg",
    0x19: "playsewithpan",
    0x1A: "setpan",
    0x1B: "panse",
    0x1C: "loopsewithpan",
    0x1D: "waitplaysewithpan",
    0x1E: "setbldcnt",
    0x1F: "createsoundtask",
    0x20: "waitsound",
    0x21: "jumpargeq",
    0x22: "monbg_static",
    0x23: "clearmonbg_static",
    0x24: "jumpifcontest",
    0x25: "fadetobgfromset",
    0x26: "panse_adjustnone",
    0x27: "panse_adjustall",
    0x28: "splitbgprio",
    0x29: "splitbgprio_all",
    0x2A: "splitbgprio_foes",
    0x2B: "invisible",
    0x2C: "visible",
    0x2D: "teamattack_moveback",
    0x2E: "teamattack_movefwd",
    0x2F: "stopsound",
}


@dataclass
class AnimCommand:
    offset: str
    opcode: str
    name: str
    args: dict[str, object]


def u8(rom: bytes, offset: int) -> int:
    return rom[offset]


def u16(rom: bytes, offset: int) -> int:
    return int.from_bytes(rom[offset : offset + 2], "little")


def s16(rom: bytes, offset: int) -> int:
    value = u16(rom, offset)
    return value - 0x10000 if value & 0x8000 else value


def u32(rom: bytes, offset: int) -> int:
    return int.from_bytes(rom[offset : offset + 4], "little")


def ptr_to_offset(ptr: int, rom_len: int) -> int | None:
    offset = ptr - GBA_BASE
    return offset if 0 <= offset < rom_len else None


def fmt_offset(offset: int) -> str:
    return f"0x{offset:08X}"


def fmt_ptr(ptr: int, rom_len: int) -> dict[str, object]:
    offset = ptr_to_offset(ptr, rom_len)
    return {
        "ptr": f"0x{ptr:08X}",
        "offset": None if offset is None else fmt_offset(offset),
    }


def decode_script(rom: bytes, start_offset: int, max_commands: int) -> list[AnimCommand]:
    commands: list[AnimCommand] = []
    offset = start_offset
    for _ in range(max_commands):
        command_offset = offset
        opcode = u8(rom, offset)
        offset += 1
        name = COMMAND_NAMES.get(opcode, "unknown")
        args: dict[str, object] = {}

        if opcode in (0x00, 0x01):
            args["tag"] = f"0x{u16(rom, offset):04X}"
            offset += 2
        elif opcode == 0x02:
            ptr = u32(rom, offset)
            offset += 4
            anim_battler = u8(rom, offset)
            offset += 1
            argc = u8(rom, offset)
            offset += 1
            argv = [s16(rom, offset + i * 2) for i in range(argc)]
            offset += argc * 2
            args = {
                "template": fmt_ptr(ptr, len(rom)),
                "anim_battler": anim_battler,
                "argc": argc,
                "argv": argv,
            }
        elif opcode == 0x03:
            ptr = u32(rom, offset)
            offset += 4
            priority = u8(rom, offset)
            offset += 1
            argc = u8(rom, offset)
            offset += 1
            argv = [s16(rom, offset + i * 2) for i in range(argc)]
            offset += argc * 2
            args = {
                "task": fmt_ptr(ptr, len(rom)),
                "priority": priority,
                "argc": argc,
                "argv": argv,
            }
        elif opcode == 0x04:
            args["frames"] = u8(rom, offset)
            offset += 1
        elif opcode in (0x05, 0x06, 0x07, 0x08, 0x0D, 0x0F, 0x15, 0x16, 0x17, 0x20, 0x29, 0x2F):
            pass
        elif opcode == 0x09:
            args["se"] = f"0x{u16(rom, offset):04X}"
            offset += 2
        elif opcode in (0x0A, 0x0B, 0x14, 0x18, 0x1A, 0x22, 0x23, 0x28, 0x2A, 0x2B, 0x2C, 0x2D, 0x2E):
            args["value"] = u8(rom, offset)
            offset += 1
        elif opcode == 0x0C:
            value = u16(rom, offset)
            offset += 2
            args = {"eva": value & 0xFF, "evb": value >> 8}
        elif opcode in (0x0E, 0x13, 0x24):
            ptr = u32(rom, offset)
            offset += 4
            args["target"] = fmt_ptr(ptr, len(rom))
        elif opcode == 0x10:
            args["arg_id"] = u8(rom, offset)
            args["value"] = s16(rom, offset + 1)
            offset += 3
        elif opcode == 0x11:
            args["ptr1"] = fmt_ptr(u32(rom, offset), len(rom))
            args["ptr2"] = fmt_ptr(u32(rom, offset + 4), len(rom))
            offset += 8
        elif opcode == 0x12:
            args["value"] = u8(rom, offset)
            args["target"] = fmt_ptr(u32(rom, offset + 1), len(rom))
            offset += 5
        elif opcode in (0x19, 0x1D):
            args["se"] = f"0x{u16(rom, offset):04X}"
            args["pan"] = s16(bytes([rom[offset + 2], 0]), 0)
            if opcode == 0x1D:
                args["wait"] = u8(rom, offset + 3)
                offset += 4
            else:
                offset += 3
        elif opcode in (0x1B, 0x1C, 0x26, 0x27):
            args = {
                "se": f"0x{u16(rom, offset):04X}",
                "current_pan": u8(rom, offset + 2),
                "target_pan": u8(rom, offset + 3),
                "increment_pan": u8(rom, offset + 4),
                "delay": u8(rom, offset + 5),
            }
            if opcode == 0x1C:
                args["times"] = args.pop("delay")
                args["wait"] = args.pop("increment_pan")
            offset += 6
        elif opcode == 0x1E:
            args["bldcnt"] = f"0x{u16(rom, offset):04X}"
            offset += 2
        elif opcode == 0x1F:
            ptr = u32(rom, offset)
            offset += 4
            argc = u8(rom, offset)
            offset += 1
            argv = [s16(rom, offset + i * 2) for i in range(argc)]
            offset += argc * 2
            args = {"task": fmt_ptr(ptr, len(rom)), "argc": argc, "argv": argv}
        elif opcode == 0x21:
            args["arg_id"] = u8(rom, offset)
            args["value"] = s16(rom, offset + 1)
            args["target"] = fmt_ptr(u32(rom, offset + 3), len(rom))
            offset += 7
        elif opcode == 0x25:
            args = {"bg_opponent": u8(rom, offset), "bg_player": u8(rom, offset + 1), "bg_contest": u8(rom, offset + 2)}
            offset += 3
        else:
            args["note"] = "unknown opcode; decoding stopped"
            commands.append(AnimCommand(fmt_offset(command_offset), f"0x{opcode:02X}", name, args))
            break

        commands.append(AnimCommand(fmt_offset(command_offset), f"0x{opcode:02X}", name, args))
        if opcode in (0x08, 0x0F, 0x13):
            break
    return commands


def read_move_script_offset(rom: bytes, table_offset: int, move_id: int) -> int:
    ptr = u32(rom, table_offset + move_id * 4)
    offset = ptr_to_offset(ptr, len(rom))
    if offset is None:
        raise ValueError(f"Move {move_id} points outside the ROM: 0x{ptr:08X}")
    return offset


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect green.gba battle animation scripts")
    parser.add_argument("rom", type=Path)
    parser.add_argument("--move-id", type=int, default=1, help="Move id to inspect; 1 is Pound in Gen III")
    parser.add_argument("--table-offset", type=lambda raw: int(raw, 0), default=DEFAULT_MOVE_ANIMS_TABLE)
    parser.add_argument("--script-offset", type=lambda raw: int(raw, 0), default=None, help="Decode a script directly")
    parser.add_argument("--max-commands", type=int, default=80)
    parser.add_argument("--json", action="store_true", help="Write machine-readable JSON")
    args = parser.parse_args()

    rom = args.rom.read_bytes()
    if args.script_offset is None:
        script_offset = read_move_script_offset(rom, args.table_offset, args.move_id)
        subject = {"kind": "move", "move_id": args.move_id, "table_offset": fmt_offset(args.table_offset)}
    else:
        script_offset = args.script_offset
        subject = {"kind": "script"}

    commands = decode_script(rom, script_offset, args.max_commands)
    result = {
        "rom": str(args.rom),
        "subject": subject,
        "script_offset": fmt_offset(script_offset),
        "commands": [asdict(command) for command in commands],
    }

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(f"Script: {fmt_offset(script_offset)}")
        for command in commands:
            print(f"{command.offset}  {command.opcode} {command.name} {json.dumps(command.args, ensure_ascii=False)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
