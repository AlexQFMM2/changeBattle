import assert from "node:assert/strict";
import {
  BATTLE_BACKGROUNDS_V4,
  CHAMPION_BATTLE_BACKGROUND_V4,
  FALLBACK_BATTLE_BACKGROUND_V4,
  selectBattleBackgroundV4,
} from "./battleBackground.js";

const fixture = {
  seed: "formal-seed:round-3",
  battleIndex: 3,
  trainerId: "trainer:clair",
  trainerType: "gym" as const,
  teamPoolId: "rain",
  bossRoute: "boss",
};

const first = selectBattleBackgroundV4(fixture);
assert.deepEqual(selectBattleBackgroundV4(fixture), first, "the same formal round must keep the same background");
assert.equal(first.id, "neon-downtown", "the fixed fixture guards the historical stable hash ordering");
assert.equal(first.path, "battle-backgrounds/neon-downtown.png");

for (const trainerType of ["rookie", "normal", "elite", "gym", "elite4", "villain"] as const) {
  assert.notEqual(selectBattleBackgroundV4({...fixture, trainerType}).id, CHAMPION_BATTLE_BACKGROUND_V4.id);
}

assert.deepEqual(selectBattleBackgroundV4({...fixture, trainerType: "champion"}), CHAMPION_BATTLE_BACKGROUND_V4);
assert.equal(BATTLE_BACKGROUNDS_V4.length, 10);
assert.equal(FALLBACK_BATTLE_BACKGROUND_V4.path, "battle-backgrounds/mountain-route.png");

console.log("battleBackground tests passed");
