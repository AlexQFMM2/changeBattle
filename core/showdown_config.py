"""Configuration helpers for the external Pokemon Showdown checkout."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SHOWDOWN_PATH = Path("/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown")
VENDORED_SHOWDOWN_PATH = PROJECT_ROOT / "vendor" / "pokemon-showdown"


def showdown_path() -> Path:
    env_path = os.environ.get("SHOWDOWN_PATH")
    if env_path:
        return Path(env_path).expanduser().resolve()
    if (VENDORED_SHOWDOWN_PATH / "dist" / "sim" / "index.js").exists():
        return VENDORED_SHOWDOWN_PATH.resolve()
    return DEFAULT_SHOWDOWN_PATH.resolve()


def validate_showdown_path(path: Path | None = None) -> Path:
    root = path or showdown_path()
    if not root.exists():
        raise RuntimeError(f"Pokemon Showdown path does not exist: {root}")
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
