# Pokemon Showdown Integration

ChangeBattle uses Pokemon Showdown as the authoritative Pokemon data and battle rules engine.

Local default path:

```bash
/home/alexqfmm/workPlace/pokemon/pokemonShowdowm/pokemon-showdown
```

Override it with:

```bash
export SHOWDOWN_PATH=/path/to/pokemon-showdown
```

Build Showdown:

```bash
cd "$SHOWDOWN_PATH"
npm ci
node build --force
```

Verify the simulator:

```bash
printf '%s\n' \
  '>start {"formatid":"gen7randombattle"}' \
  '>player p1 {"name":"Alice"}' \
  '>player p2 {"name":"Bob"}' \
| ./pokemon-showdown simulate-battle --skip-build
```

Notes:

- Do not commit Pokemon Showdown itself into this repository.
- Use `--skip-build` or require `dist/sim` after building, so runtime does not rebuild.
- The current local Showdown checkout is external infrastructure, like a local engine dependency.
