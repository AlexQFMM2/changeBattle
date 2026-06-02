"""Shared rules core for Pokemon Battle Factory Lab."""

from .battle import create_battle_state, execute_turn, make_move_action, make_switch_action
from .data_loader import index_by_id, load_jsonl
from .damage import calculate_damage
from .generator import generate_pokemon_instance, generate_random_pokemon_instance
from .instance import create_pokemon_instance
from .move_effects import is_supported_status_move
from .stats import calculate_stats

__all__ = [
    "calculate_damage",
    "calculate_stats",
    "create_battle_state",
    "create_pokemon_instance",
    "execute_turn",
    "generate_pokemon_instance",
    "generate_random_pokemon_instance",
    "index_by_id",
    "is_supported_status_move",
    "load_jsonl",
    "make_move_action",
    "make_switch_action",
]
