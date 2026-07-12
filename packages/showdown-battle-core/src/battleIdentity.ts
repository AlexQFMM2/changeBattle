import type {ShowdownPlayerIdV4} from "./types.js";

export function canonicalBattleKeyV4(playerId: ShowdownPlayerIdV4, pokeball: unknown): string {
  const token = normalizeIdentityTokenForBattleKey(pokeball);
  return token ? `${playerId}:${token}` : "";
}

export function isProtocolBattleKeyV4(key: string): boolean {
  return /^protocol:p[1-4]:\d+$/i.test(key);
}

export function battleKeyFromRosterIdentityV4(playerId: ShowdownPlayerIdV4, identity: {pokeball?: unknown; pokeballId?: unknown; showdownIdentityToken?: unknown; showdownId?: unknown}): string {
  return canonicalBattleKeyV4(playerId, identity.pokeball || identity.pokeballId || identity.showdownIdentityToken || identity.showdownId);
}

function normalizeIdentityTokenForBattleKey(value: unknown): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
