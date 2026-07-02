import {contextBridge, ipcRenderer} from "electron";
import type {BattleSessionCreateInputV4, BattleTrainerItemSubmitV4, CoopPartnerPreferenceV4, DesktopBattleServiceBridge, DesktopFormalGameBridge, FormalBattleResultFinalizeReasonV4, FormalGameModeV4, FormalGameRunV4, FormalMedicalInsuranceChoiceV4, FormalSettlementReasonV4, ShowdownPlayerIdV4, UserProfileV2} from "@changebattle-v2/api";

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
    getFormalMedicalInsuranceOffer: (run: FormalGameRunV4) =>
      ipcRenderer.invoke("formalGame:getMedicalInsuranceOffer", run) as ReturnType<DesktopFormalGameBridge["getFormalMedicalInsuranceOffer"]>,
    chooseFormalMedicalInsurance: (run: FormalGameRunV4, choice: FormalMedicalInsuranceChoiceV4) =>
      ipcRenderer.invoke("formalGame:chooseMedicalInsurance", run, choice) as ReturnType<DesktopFormalGameBridge["chooseFormalMedicalInsurance"]>,
    formalMedicalInsuranceEffectsForRun: (run: FormalGameRunV4) =>
      ipcRenderer.invoke("formalGame:medicalInsuranceEffectsForRun", run) as ReturnType<DesktopFormalGameBridge["formalMedicalInsuranceEffectsForRun"]>,
    prepareFormalSettlement: (run: FormalGameRunV4, profile: UserProfileV2, reason: FormalSettlementReasonV4) =>
      ipcRenderer.invoke("formalGame:prepareSettlement", run, profile, reason) as ReturnType<DesktopFormalGameBridge["prepareFormalSettlement"]>,
    settleFormalBattleRound: (run: FormalGameRunV4) =>
      ipcRenderer.invoke("formalGame:settleBattleRound", run) as ReturnType<DesktopFormalGameBridge["settleFormalBattleRound"]>,
    finalizeFormalBattleResult: (run: FormalGameRunV4, sessionId: string, reason?: FormalBattleResultFinalizeReasonV4) =>
      ipcRenderer.invoke("formalGame:finalizeBattleResult", run, sessionId, reason) as ReturnType<DesktopFormalGameBridge["finalizeFormalBattleResult"]>,
  },
  battleService: {
    createBattleSession: (input: BattleSessionCreateInputV4) =>
      ipcRenderer.invoke("battleService:createSession", input) as ReturnType<DesktopBattleServiceBridge["createBattleSession"]>,
    submitChoice: (sessionId: string, playerId: ShowdownPlayerIdV4, choice: string) =>
      ipcRenderer.invoke("battleService:submitChoice", sessionId, playerId, choice) as ReturnType<DesktopBattleServiceBridge["submitChoice"]>,
    submitTrainerItem: (input: BattleTrainerItemSubmitV4) =>
      ipcRenderer.invoke("battleService:submitTrainerItem", input) as ReturnType<DesktopBattleServiceBridge["submitTrainerItem"]>,
    getSnapshot: (sessionId: string) =>
      ipcRenderer.invoke("battleService:getSnapshot", sessionId) as ReturnType<DesktopBattleServiceBridge["getSnapshot"]>,
    closeSession: (sessionId: string) =>
      ipcRenderer.invoke("battleService:closeSession", sessionId) as ReturnType<DesktopBattleServiceBridge["closeSession"]>,
  },
});
