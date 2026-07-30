# ChangeBattle V2 Development Rules

This file is mandatory reading before any code change. If a plan, old document, or existing implementation conflicts with this file, follow this file first and update the old document/code instead of extending the conflict.

## Core Principles

- Keep it simple and stupid. Prefer one clear backend rule function over compatibility bridges, fallback chains, and dual data shapes.
- Do not make migration residue permanent. Temporary adapters must be named as legacy/dev/test and kept out of the formal room main path.
- Formal room V5 is server-authoritative. The client submits player intent; the server validates, calculates, commits, and returns a scoped view.
- A feature that is easy in the game domain should stay easy in code. For example, shop generation is `getShopList(context) + stable random`, not a multi-path compatibility pipeline.
- Do not fix dirty data or bad architecture in generic helper functions. Fix the writer, validator, or user-facing repair flow at the root.
- Do not call something done because it compiles or the happy path appears once. Run the focused smoke and ChromeAutomation checks that match the changed surface.

## Formal Room V5 Red Lines

- The formal room main path must not use `FormalGameRunV4`, `TrainingRunGameV4`, `formalRun`, `restRunSnapshot`, `formalRunDraft`, `syncDraft`, or old `/rooms/:id/formal/*` as authority, transport, storage, or fallback.
- Legacy V4 code may remain only for training/local/dev-only/test adapters. It must be physically or semantically isolated and clearly named.
- Do not add a second official path for the same formal room operation. If two paths exist because of migration, collapse them or put the legacy one behind a dev-only adapter.
- `commandId` is only for idempotency. It must not affect gameplay randomness, shop generation, training gains, stat reroll, exchange candidates, battle result, or settlement.
- Room command responses must be small: `{revision, phase, scope, view, result?, reused?}` or equivalent scoped response.
- Forbidden in formal room responses and command logs: full `formalRun`, full `restRunSnapshot`, full `runGameV5`, full `playersById`, full `pokemonById`, full `bagsById`, full `itemInstancesById`, full `commandLog`, full historical timelines.
- Page-scoped data is allowed when the page needs it. Current shop products, current team, current bag, current node, current training lesson, active battle summary, and settlement summary are not "big data" by themselves.
- A current shop list of about 15 products belongs in `RestViewV5`. It is not a reason to reintroduce `formalRun` or client-side generation.

## Backend Gameplay Rules

- Gameplay rules live on the server or in shared pure rule modules called by the server.
- Frontend may pre-check obvious UX errors, but the backend must repeat the real validation atomically.
- Shop flow:
  - `prepareRound` creates the current node shop by calling one clear V5 shop generator from small context.
  - `GET rest view` returns only the current scoped shop data needed by the UI.
  - `shop.buy-cart` validates slot ids, stock, money, bag capacity, duplicates, and then commits all-or-nothing.
  - Purchased slots become sold out unless a later explicit rule says otherwise.
  - `shop.refresh` costs 50 coins, increments a server roll counter, and regenerates the whole current shop.
  - The frontend must not generate, restock, price, or mutate shop products locally.
- Training flow:
  - `training.apply` calculates gains on the server.
  - Batch self-study is a single server command with `rounds`; the server clamps, loops, deducts total cost, increments roll counters, and returns a small result.
  - The frontend must not calculate IV/EV/stat results.
- Reroll flow:
  - The frontend sends `pokemonId`, stat part, and locks.
  - The server uses stable seed + node/pokemon/roll state, preserves the intended totals/caps, recalculates HP ratio, and commits only the target PokemonInstance plus cost/ledger.
- Battle/result/settlement:
  - Formal room battle prep builds from V5 entities and current node slots.
  - Finalize paths write back only entities and small records.
  - Acknowledging final result clears complete run data from long-lived room state and leaves lightweight ended summary.

## Client / C/S Rules

- The client stores only what it needs to show the current page: credential, match id, revision/phase, current scoped view snapshot, pending UI state, and idempotency keys.
- Do not save formal room run/view large caches in `localStorage`.
- After a command succeeds, update the displayed state only from the returned scoped view/result. Failure or timeout must not mutate authoritative UI state.
- Web/Desktop/Android formal room flows must call match-scoped V5 commands, not legacy draft APIs.
- Web is a development/ChromeAutomation surface. Player release surfaces are Desktop and Android, but they must share the same formal room C/S contract.

## UI Product Rules

- This is a finished game UI, not a CLI. Data-source migration must preserve the designed interaction, layout, character dialogue, animations, and visual hierarchy.
- When changing data contracts, keep the original UI shell and replace only the data adapter/callbacks unless the task explicitly asks for redesign.
- Before touching a UI, inspect the existing component, CSS, and screenshots/reference. Do not replace a rich scene with a flat debug panel just because it is easier.
- Rest room NPC interactions must use the established character dialogue pattern, especially `TrainingRestShopDialogue`, when the interaction is an in-world service such as shop, training, or treatment.
- `TrainingRestConfirmDialog` is for system confirmations, not a substitute for NPC dialogue.
- Buttons, panels, and overlays must not overlap incoherently. Test the real click flow, including closing modals normally, not only DOM-forced clicks.
- Keep the `640 x 320` game viewport assumptions and existing V1/V2 visual language unless a plan says otherwise.
- Use stable dimensions for boards, toolbars, cards, item grids, Pokemon panels, and modal content. Text must fit on desktop and mobile targets.
- Do not remove background art, NPC portraits, game frames, item cards, course cards, battle scenery, or animation layers as a side effect of data refactors.

## Asset And Data Rules

- Stored profile/trainer/member asset fields must be canonical relative asset paths, for example `npc/avatars/6-asset-a73f3e71.webp`.
- Do not store resolved URLs such as `https://...`, `changebattle-asset://...`, `file:`, `capacitor:`, `data:`, `blob:`, query strings, hash fragments, or `..` paths.
- `assetUrl()` and similar helpers are calculators. They must not repair dirty stored data.
- Runtime images/audio/sprites should resolve through the asset system/CDN/cache. Do not hardcode local absolute paths or reintroduce large public assets into release packages.
- Shared translation/display data belongs in the relevant core/API catalog/helper, not scattered component dictionaries.

## Simplicity Checklist Before Coding

Ask these questions before editing:

- Can this be one backend rule helper with a small input DTO?
- Am I adding a second path instead of deleting or isolating the old one?
- Am I using V4 shape because the UI needs it, or because I did not make a V5 display model?
- Is this page asking for a small scoped view, or am I dragging a full run through the client?
- Is this generic helper being asked to "fix" bad caller data?
- Will this preserve the existing game UI?
- What is the smallest smoke that proves the actual user interaction works?

If the answer exposes architecture residue, clean the residue or write an explicit follow-up checklist before adding more behavior on top.

## Verification Rules

- For backend gameplay changes, run the relevant package typecheck and formal smoke. Add/update smoke assertions for the changed rule.
- For formal room changes, scan responses/logs for forbidden large objects and legacy API names.
- For UI changes, use ChromeAutomation to click the actual user path. Include success paths; if natural state has no money/items, use test mode or a test seed instead of only testing failure.
- ChromeAutomation should use the current workspace server, not an old long-running service. Verify the local API base URL before claiming a browser smoke passed.
- Screenshots are evidence, not a substitute for checking console/network/localStorage when the change touches C/S boundaries.

## Release Safety

- Do not mix feature implementation with release packaging unless the user explicitly asks.
- Before pushing release-related branches, inspect workflow triggers and confirm whether a push will start GitHub Actions.
- Beta/debug releases use GitHub Release for full Desktop/APK assets. The online beta server should carry only update metadata, manifests, objects, and download pages unless a plan says otherwise.
- Do not overwrite an existing version tag or online version in place. Bump version for a new debug release.
