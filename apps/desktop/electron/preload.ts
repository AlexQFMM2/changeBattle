import {contextBridge, ipcRenderer} from "electron";
import type {BattleSessionSnapshotV4, CoopPartnerPreferenceV4, DesktopFormalGameBridge, FormalGameModeV4, FormalGameRunV4, FormalSettlementReasonV4, UserProfileV2} from "@changebattle-v2/api";

contextBridge.exposeInMainWorld("changeBattleV2", {
  userProfile: {
    loadUserProfile: (): Promise<UserProfileV2 | null> => ipcRenderer.invoke("userProfile:load"),
    saveUserProfile: (profile: UserProfileV2): Promise<UserProfileV2> => ipcRenderer.invoke("userProfile:save", profile),
    deleteUserProfile: (): Promise<void> => ipcRenderer.invoke("userProfile:delete"),
    getUserProfilePath: (): Promise<string> => ipcRenderer.invoke("userProfile:path"),
  },
  formalGame: {
    createFormalGameWithStarterCandidates: (profile: UserProfileV2, options: {mode: FormalGameModeV4; coopPartnerPreference?: CoopPartnerPreferenceV4; streak?: number; seed?: string}) =>
      ipcRenderer.invoke("formalGame:createWithStarterCandidates", profile, options) as ReturnType<DesktopFormalGameBridge["createFormalGameWithStarterCandidates"]>,
    prepareFormalRoundPlan: (run: FormalGameRunV4) =>
      ipcRenderer.invoke("formalGame:prepareRoundPlan", run) as ReturnType<DesktopFormalGameBridge["prepareFormalRoundPlan"]>,
    prepareFormalBattleSession: (run: FormalGameRunV4) =>
      ipcRenderer.invoke("formalGame:prepareBattleSession", run) as ReturnType<DesktopFormalGameBridge["prepareFormalBattleSession"]>,
    prepareFormalSettlement: (run: FormalGameRunV4, profile: UserProfileV2, reason: FormalSettlementReasonV4) =>
      ipcRenderer.invoke("formalGame:prepareSettlement", run, profile, reason) as ReturnType<DesktopFormalGameBridge["prepareFormalSettlement"]>,
    settleFormalBattleRound: (run: FormalGameRunV4, snapshot: BattleSessionSnapshotV4) =>
      ipcRenderer.invoke("formalGame:settleBattleRound", run, snapshot) as ReturnType<DesktopFormalGameBridge["settleFormalBattleRound"]>,
  },
});
