# Battle V4 Diagnostics Notes

`debug/` is for local diagnostic exports. The JSON files are usually not long-term source assets, but the debugging method should stay documented here so future battle freezes can be checked quickly.

## Reproduce AI Choice From Diagnostics

Use this when a release battle is blocked after move submission and the diagnostics show repeated invalid AI choices, for example:

- `snapshotSummary.status` is `blocked`
- `diagnosis` includes `p2-pending-action`
- `inputLogTail` contains `[Invalid choice]` from Showdown
- `lastChoices` shows the AI submitting the same command repeatedly

Most Battle V4 diagnostics exports include the latest request in `allRequests`. You can feed that request into the current V2 battle-core AI to check whether the bug still reproduces on the current branch.

Example for the Z-move target regression:

```bash
node --input-type=module -e '
import fs from "node:fs";
import {
  chooseAiBattleChoiceV4,
  validateShowdownChoiceCommandV4,
} from "./packages/showdown-battle-core/dist/index.js";

const file = "debug/battle-v4-diagnostics-battle-session-mr6ygynq-wxlvfxy3-turn-0-1783205578382 (1).json";
const d = JSON.parse(fs.readFileSync(file, "utf8"));
const request = d.allRequests.p2;
const snapshot = {
  id: "diag-ai-repro",
  runId: "diag",
  nodeId: "diag",
  status: "running",
  mode: "doubles",
  ruleSet: "gen7",
  turn: 1,
  winner: null,
  error: null,
  players: [
    {playerId: "p1", name: "Player", controller: "local", alliance: "near", team: [], draft: null},
    {playerId: "p2", name: "AI", controller: "ai", alliance: "far", team: [], draft: null, allowedSpecialSystems: ["mega", "zmove"]},
  ],
  requests: {p2: request},
  active: [],
  rawLog: [],
  debug: {inputLog: [], lastChoices: [], playerStreams: [], latestSidePokemon: {}, latestRequests: {}, latestMovePpByPokemon: {}, aiDecisions: []},
  createdAt: "2026-07-08T00:00:00.000Z",
  updatedAt: "2026-07-08T00:00:00.000Z",
};

const oldChoice = "move 1 zmove, move 1 mega +1";
const result = chooseAiBattleChoiceV4({
  request,
  snapshot,
  playerId: "p2",
  aiProfile: {level: "gymLeader", preference: "offense"},
  rngSeed: "battle-session-mr6ygynq-wxlvfxy3",
});

console.log(JSON.stringify({
  oldChoice,
  oldValidation: validateShowdownChoiceCommandV4({request, choice: oldChoice}),
  currentChoice: result.choice,
  currentValidation: validateShowdownChoiceCommandV4({request, choice: result.choice}),
  topCandidates: result.debug.topCandidates,
}, null, 2));
'
```

If `packages/showdown-battle-core/dist/index.js` is stale or missing, build it first:

```bash
pnpm --filter @changebattle-v2/showdown-battle-core build
```

For the July 2026 Z-move case, release generated the illegal command:

```text
move 1 zmove, move 1 mega +1
```

Current V2 should generate a target-bearing command instead, such as:

```text
move 1 zmove +2, move 1 mega +2
```

and `validateShowdownChoiceCommandV4` should return `{ok: true}` for the current choice. This means the release package is behind the current battle-core fix rather than the current V2 branch still reproducing the bug.

## Related Probes

The existing probe tools are for playback and scheduler parity rather than AI choice generation:

```bash
node tools/probe-showdown-playback.mjs debug/battle-v4-diagnostics-xxx.json
node tools/probe-battle-scheduler-parity.mjs debug/battle-v4-diagnostics-xxx.json
```

Use those when raw Showdown logs exist but the problem looks like animation order, missing faint/switch playback, or frontend scheduler consumption. Use the AI choice snippet above when the diagnostic says the battle is blocked by an invalid choice.
