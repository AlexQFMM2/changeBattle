import type {ChangeBattleV2Api, FormalRoomV1, UserProfileV2} from "@changebattle-v2/api";
import {RoomLobbyPage} from "./RoomLobbyPage";

export function RoomLobbyPagePreview({api}: {api: ChangeBattleV2Api}) {
  const profile = {
    id: "preview-profile",
    name: "测试玩家",
    avatarTrainerId: "red",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    battlePreference: {},
  } as unknown as UserProfileV2;
  const room = {
    roomId: "room-preview-123456",
    roomCustomId: "G102938",
    selfMemberId: "member-host",
    hostMemberId: "member-host",
    members: [
      {memberId: "member-host", roomCustomId: "G102938", name: "测试玩家", avatarAsset: "npc/avatars/red-asset-a73f3e71.webp", role: "host", connectionState: "online", ready: true, joinedAt: new Date().toISOString(), updatedAt: new Date().toISOString()},
      {memberId: "member-2", roomCustomId: "G564738", name: "游客二", avatarAsset: "npc/avatars/dawn-dawnchallenge-9bb8943e.png", role: "guest", connectionState: "online", ready: false, joinedAt: new Date().toISOString(), updatedAt: new Date().toISOString()},
    ],
    matches: [],
    activeMatchId: null,
    formalRun: null,
    revision: 1,
    status: "open",
    connectionState: "online",
    closeReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastHeartbeatAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 600000).toISOString(),
  } as FormalRoomV1;
  return (
    <RoomLobbyPage
      api={api}
      profile={profile}
      room={room}
      roomToken="preview-token"
      onCreateMatch={async () => undefined}
      onReadyChange={async () => undefined}
      onStartMatch={async () => undefined}
      onLeave={() => undefined}
    />
  );
}
