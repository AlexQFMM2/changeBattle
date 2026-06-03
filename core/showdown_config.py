"""Configuration helpers for the external Pokemon Showdown checkout."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path


DEFAULT_SHOWDOWN_PATH = Path("/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown")


def showdown_path() -> Path:
    return Path(os.environ.get("SHOWDOWN_PATH", DEFAULT_SHOWDOWN_PATH)).expanduser().resolve()


def validate_showdown_path(path: Path | None = None) -> Path:
    root = path or showdown_path()
    if not root.exists():
        raise RuntimeError(f"Pokemon Showdown path does not exist: {root}")
    if not (root / "pokemon-showdown").exists():
        raise RuntimeError(f"Pokemon Showdown executable not found: {root / 'pokemon-showdown'}")
    if not (root / "dist" / "sim" / "index.js").exists():
        raise RuntimeError(
            "Pokemon Showdown is not built. Run: "
            f"cd {root} && npm ci && node build --force"
        )
    return root


def showdown_commit(path: Path | None = None) -> str:
    root = path or showdown_path()
    try:
        return subprocess.check_output(
            ["git", "-C", str(root), "rev-parse", "--short", "HEAD"],
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except Exception:
        return "unknown"


def main() -> int:
    root = validate_showdown_path()
    print(f"SHOWDOWN_PATH={root}")
    print(f"commit={showdown_commit(root)}")
    print(f"dist_sim={(root / 'dist' / 'sim' / 'index.js').exists()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
