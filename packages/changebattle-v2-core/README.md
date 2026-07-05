# ChangeBattle V2 Core

`@changebattle-v2/core` stores shared static rules and catalogs for ChangeBattle V2.

Keep pure rules here when they can be reused by Web, Desktop, API, tests, or tools. Keep Dex queries, save IO, run orchestration, and Pokemon instance mutation in the app/API layer.

## Formal Game Rules

- `formalGameCatalog.ts`: formal run constants, NPC trainer types, fallback species and moves, starter roles, and base labels.
- `formalSpeciesRanks.ts`: curated species rank table.
- `formalSpeciesRules.ts`: species rank lookup, starter rank allowance, Ultra Beast legendary handling, and random form filtering.
- `formalPowerProfileRules.ts`: numeric power profiles, IV/EV/level ranges, profile normalization, advancement, and seeded helpers.
- `formalTeamGenerationRules.ts`: player starter power profile deck, NPC tier mapping, dynamic level bonus, team preference, and role mapping.
- `formalMoveGenerationRules.ts`: player/NPC move quality requirements and role move preferences.
- `formalPlayerProfileRules.ts`: player team and move-usage profile shapes, profile merging, and targeting intensity.
- `formalTrainingGroundRules.ts`: training ground lesson table, lesson rotation, self-study weights, self-study gains, and tuning hooks.

## Shared Catalogs

- `starChartCatalog.ts`: star chart nodes, costs, prerequisites, UI copy, and runtime effect declarations.
- `formalShopCatalog.ts`: formal shop item pools, pricing limits, product categories, and restock weights.
- `restCenterCatalog.ts`: rest center service catalog.
- `playerHonorCatalog.ts`: reserved player honor catalog/types.

## Maintenance Notes

- Put data and deterministic rule decisions in this package.
- Keep runtime execution explicit in API/UI code; do not add hidden effect executors here.
- When adding a new formal-game tuning point, prefer a named rule helper and a smoke assertion over inline constants in `apps/api`.
