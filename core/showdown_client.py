"""Thin subprocess client for the local Showdown adapter."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

from .showdown_config import validate_showdown_path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ADAPTER = PROJECT_ROOT / "showdown-adapter" / "adapter.js"


class ShowdownClient:
    def __init__(self, showdown_path: Path | None = None) -> None:
        self.showdown_path = validate_showdown_path(showdown_path)
        self.process = subprocess.Popen(
            ["node", str(ADAPTER)],
            cwd=str(PROJECT_ROOT),
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            env={**__import__("os").environ, "SHOWDOWN_PATH": str(self.showdown_path)},
        )

    def close(self) -> None:
        if self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                self.process.kill()

    def command(self, payload: dict[str, Any]) -> dict[str, Any]:
        if self.process.stdin is None or self.process.stdout is None:
            raise RuntimeError("Showdown adapter pipes are not available")
        self.process.stdin.write(json.dumps(payload, ensure_ascii=False) + "\n")
        self.process.stdin.flush()
        line = self.process.stdout.readline()
        if not line:
            stderr = self.process.stderr.read() if self.process.stderr else ""
            raise RuntimeError(f"Showdown adapter exited unexpectedly: {stderr}")
        response = json.loads(line)
        if not response.get("ok"):
            raise RuntimeError(response.get("error", "unknown Showdown adapter error"))
        return response["result"]

    def ping(self) -> dict[str, Any]:
        return self.command({"cmd": "ping"})

    def generate(self, seed: int | list[int], format_id: str = "gen7randombattle") -> dict[str, Any]:
        return self.command({"cmd": "generate", "format": format_id, "seed": seed})

    def start(self, p1_team: list[dict[str, Any]], p2_team: list[dict[str, Any]], seed: int | list[int]) -> dict[str, Any]:
        return self.command({
            "cmd": "start",
            "formatid": "gen7customgame",
            "seed": seed,
            "p1Team": p1_team,
            "p2Team": p2_team,
            "p1Name": "Player",
            "p2Name": "Enemy",
        })

    def choose(self, side: str, choice: str) -> dict[str, Any]:
        return self.command({"cmd": "choose", "side": side, "choice": choice})


def main() -> int:
    client = ShowdownClient()
    try:
        print(json.dumps(client.ping(), ensure_ascii=False))
    finally:
        client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
