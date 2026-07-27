import {createDefaultUserProfile} from "./index.js";
import {createBattleApiServer} from "./server.js";
import {normalizeBattlePreferenceV4, type TrainingModeV4, type TrainingRuleSetV4} from "./training.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const server = createBattleApiServer({
  host: "127.0.0.1",
  port: 0,
  storageKind: "memory",
  configOverrides: {token: "", corsOrigin: "*", roomCreateMaxConcurrency: 1},
});

try {
  await server.start();
  const health = await requestJson("GET", "/health");
  assert(health.ok === true, "desktop offline API health should be ok");
  assert(health.storage === "memory" && health.redis === "ok", "desktop offline API should use a healthy MemoryRedisLike provider");

  for (const mode of ["singles", "doubles", "coop"] satisfies TrainingModeV4[]) {
    for (const ruleSet of ["standard", "gen7", "gen8", "gen9"] satisfies TrainingRuleSetV4[]) {
      await runOfflineBattleFlow(mode, ruleSet);
    }
  }

  console.info("[desktop-offline-smoke] ok");
} finally {
  await server.close();
}

async function runOfflineBattleFlow(mode: TrainingModeV4, ruleSet: TrainingRuleSetV4): Promise<void> {
  const profile = createDefaultUserProfile({name: `Desk ${mode} ${ruleSet}`});
  profile.battlePreference = normalizeBattlePreferenceV4({...profile.battlePreference, ruleSet});
  const room = await requestJson("POST", "/rooms", {memberName: profile.name, profileSnapshot: profile});
  const roomId = requiredString(room.roomId, "roomId");
  const roomToken = requiredString(room.roomToken, "roomToken");
  const auth = {authorization: `Bearer ${roomToken}`};
  const created = await requestJson("POST", `/rooms/${encodeURIComponent(roomId)}/matches`, {
    clientRequestId: `create-${mode}-${ruleSet}`,
    title: `Desk ${mode} ${ruleSet}`,
    mode,
    profileSnapshot: profile,
    battlePreferenceSnapshot: profile.battlePreference,
    seed: `desktop-offline-smoke:${mode}:${ruleSet}`,
  }, auth);
  const matchId = requiredString(created.match?.matchId, "matchId");
  await requestJson("POST", `/rooms/${encodeURIComponent(roomId)}/matches/${encodeURIComponent(matchId)}/ready`, {}, auth);
  await requestJson("POST", `/rooms/${encodeURIComponent(roomId)}/matches/${encodeURIComponent(matchId)}/start`, {clientRequestId: `start-${mode}-${ruleSet}`}, auth);

  const commandPath = `/rooms/${encodeURIComponent(roomId)}/matches/${encodeURIComponent(matchId)}/commands`;
  await requestJson("POST", `${commandPath}/select-starters`, {
    commandId: `starters-${mode}-${ruleSet}`,
    payload: {selectedIndexes: mode === "doubles" ? [0, 1, 2, 3] : mode === "coop" ? [0, 1] : [0, 1, 2]},
  }, auth);
  const prepared = await requestJson("POST", `${commandPath}/prepare-round`, {
    commandId: `round-${mode}-${ruleSet}`,
    payload: {},
  }, auth);
  const npc = prepared.view?.players?.find((player: any) => player.kind === "npc" && player.alliance === "far");
  assert(npc?.npcProfile?.trainerType === "rookie", `${mode}/${ruleSet} should start with the historical rookie trainer`);
  assert(npc?.npcProfile?.aiProfile?.level === "rookie", `${mode}/${ruleSet} should preserve rookie AI in the rest view`);
  assert(typeof npc?.avatar === "string" && npc.avatar.length > 0, `${mode}/${ruleSet} should expose the formal trainer avatar`);

  const repeated = await requestJson("POST", `${commandPath}/prepare-round`, {
    commandId: `round-${mode}-${ruleSet}`,
    payload: {},
  }, auth);
  assert(repeated.reused === true, `${mode}/${ruleSet} prepare-round should be command-id idempotent`);

  const battle = await requestJson("POST", `${commandPath}/prepare-battle`, {
    commandId: `battle-${mode}-${ruleSet}`,
    payload: {},
  }, auth);
  assert(battle.view?.activeBattle?.status === "running", `${mode}/${ruleSet} should enter a running BattleStream session`);
  assert(battle.view?.battleBackground?.path?.startsWith("battle-backgrounds/"), `${mode}/${ruleSet} should expose a managed battle background`);
  assert(battle.view?.battleBackground?.id !== "champion-stage", `${mode}/${ruleSet} rookie battle should not use the champion stage`);
  assert(battle.view?.participants?.p2?.npcProfile?.trainerType === "rookie", `${mode}/${ruleSet} battle view should preserve the formal NPC profile`);
  const snapshot = await requestJson("GET", `/rooms/${encodeURIComponent(roomId)}/battle/snapshot`, undefined, auth);
  const battleNpc = snapshot.players?.find((player: any) => player.playerId === "p2");
  assert(snapshot.status === "running", `${mode}/${ruleSet} BattleStream snapshot should be running`);
  assert(battleNpc?.aiProfile?.level === "rookie", `${mode}/${ruleSet} should pass formal AI level into BattleStream`);
  if (mode === "coop") {
    const coopAlly = snapshot.players?.find((player: any) => player.playerId === "p3");
    assert(coopAlly?.controller === "script", `coop/${ruleSet} should include the formal script-controlled ally`);
    assert(coopAlly?.aiProfile?.level === "elite", `coop/${ruleSet} should pass the elite ally AI level into BattleStream`);
  }

  await requestJson("DELETE", `/rooms/${encodeURIComponent(roomId)}`, undefined, auth);
}

async function requestJson(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<any> {
  const response = await fetch(`${server.baseUrl}${path}`, {
    method,
    headers: {"content-type": "application/json", ...headers},
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null) as any;
  if (!response.ok) throw new Error(`${method} ${path} failed (${response.status}): ${payload?.message || payload?.error || "unknown error"}`);
  return payload;
}

function requiredString(value: unknown, name: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) throw new Error(`missing ${name}`);
  return normalized;
}
