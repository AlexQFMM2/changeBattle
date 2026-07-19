// REDLINE: dev-only legacy adapter for old room formal routes.
// The official formal room flow must use match-scoped scoped-view + command APIs.
// Do not call this file as a V5 fallback, and do not move V5 command logic here.

export type LegacyFormalRoomRouteKind =
  | "select-starters"
  | "prepare-round"
  | "sync-rest-draft"
  | "rest-action"
  | "prepare-battle"
  | "finalize-battle"
  | "finalize-run";

export type LegacyFormalRoomRouteMatch = {
  kind: LegacyFormalRoomRouteKind;
  roomId: string;
};

const LEGACY_FORMAL_ROOM_ROUTE_PATTERNS: Array<{kind: LegacyFormalRoomRouteKind; pattern: RegExp}> = [
  {kind: "select-starters", pattern: /^\/rooms\/([^/]+)\/formal\/select-starters$/},
  {kind: "prepare-round", pattern: /^\/rooms\/([^/]+)\/formal\/prepare-round$/},
  {kind: "sync-rest-draft", pattern: /^\/rooms\/([^/]+)\/formal\/sync-rest-draft$/},
  {kind: "rest-action", pattern: /^\/rooms\/([^/]+)\/formal\/rest-action$/},
  {kind: "prepare-battle", pattern: /^\/rooms\/([^/]+)\/formal\/prepare-battle$/},
  {kind: "finalize-battle", pattern: /^\/rooms\/([^/]+)\/formal\/finalize-battle$/},
  {kind: "finalize-run", pattern: /^\/rooms\/([^/]+)\/formal\/finalize-run$/},
];

export function matchLegacyFormalRoomRoute(method: string, pathname: string): LegacyFormalRoomRouteMatch | null {
  if (method !== "POST") return null;
  for (const entry of LEGACY_FORMAL_ROOM_ROUTE_PATTERNS) {
    const matched = entry.pattern.exec(pathname);
    if (matched) return {kind: entry.kind, roomId: decodeURIComponent(matched[1]!)};
  }
  return null;
}
