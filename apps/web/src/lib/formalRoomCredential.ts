const FORMAL_ROOM_CREDENTIAL_KEY = "changebattle-v2:formal-room";

export type FormalRoomCredentialV4 = {
  roomId: string;
  roomToken: string;
  matchId?: string;
  savedAt: string;
};

export function saveFormalRoomCredential(roomId: string, roomToken: string, matchId?: string): void {
  try {
    window.localStorage?.setItem(FORMAL_ROOM_CREDENTIAL_KEY, JSON.stringify({
      roomId,
      roomToken,
      matchId,
      savedAt: new Date().toISOString(),
    }));
  } catch {
    // Best-effort cache; the server room remains authoritative.
  }
}

export function loadFormalRoomCredential(): FormalRoomCredentialV4 | null {
  try {
    const raw = window.localStorage?.getItem(FORMAL_ROOM_CREDENTIAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FormalRoomCredentialV4>;
    if (!parsed.roomId || !parsed.roomToken) return null;
    return {
      roomId: String(parsed.roomId),
      roomToken: String(parsed.roomToken),
      matchId: parsed.matchId ? String(parsed.matchId) : undefined,
      savedAt: String(parsed.savedAt || ""),
    };
  } catch {
    return null;
  }
}

export function clearFormalRoomCredential(): void {
  try {
    window.localStorage?.removeItem(FORMAL_ROOM_CREDENTIAL_KEY);
  } catch {
    // Best effort.
  }
}
