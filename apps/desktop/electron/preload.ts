import {contextBridge, ipcRenderer} from "electron";
import type {BattleSessionCreateInputV4, BattleTrainerItemSubmitV4, CoopPartnerPreferenceV4, DesktopAppBridge, DesktopBattleServiceBridge, DesktopFormalGameBridge, DesktopFormalGameRunBridge, DesktopPlayerVaultBridge, DesktopTrainingRunBridge, FormalBattleResultFinalizeReasonV4, FormalGameModeV4, FormalGameRunV4, FormalMedicalInsuranceChoiceV4, FormalSettlementReasonV4, PlayerVaultV4, ShowdownPlayerIdV4, TrainingRunGameV4, UserProfileV2} from "@changebattle-v2/api";

contextBridge.exposeInMainWorld("changeBattleV2", {
  app: {
    checkForUpdates: () =>
      ipcRenderer.invoke("desktopApp:checkForUpdates") as ReturnType<DesktopAppBridge["checkForUpdates"]>,
    openOfficialSite: () =>
      ipcRenderer.invoke("desktopApp:openOfficialSite") as ReturnType<DesktopAppBridge["openOfficialSite"]>,
    getUpdateStatus: () =>
      ipcRenderer.invoke("desktopApp:getUpdateStatus") as ReturnType<DesktopAppBridge["getUpdateStatus"]>,
    cancelUpdate: () =>
      ipcRenderer.invoke("desktopApp:cancelUpdate") as ReturnType<DesktopAppBridge["cancelUpdate"]>,
    onUpdateStatus: (listener: Parameters<DesktopAppBridge["onUpdateStatus"]>[0]) => {
      const wrapped = (_event: unknown, status: Parameters<typeof listener>[0]) => listener(status);
      ipcRenderer.on("desktopApp:updateStatus", wrapped);
      return () => ipcRenderer.off("desktopApp:updateStatus", wrapped);
    },
  },
  userProfile: {
    loadUserProfile: (): Promise<UserProfileV2 | null> => ipcRenderer.invoke("userProfile:load"),
    saveUserProfile: (profile: UserProfileV2): Promise<UserProfileV2> => ipcRenderer.invoke("userProfile:save", profile),
    deleteUserProfile: (): Promise<void> => ipcRenderer.invoke("userProfile:delete"),
    getUserProfilePath: (): Promise<string> => ipcRenderer.invoke("userProfile:path"),
  },
  playerVault: {
    loadPlayerVault: () =>
      ipcRenderer.invoke("playerVault:load") as ReturnType<DesktopPlayerVaultBridge["loadPlayerVault"]>,
    savePlayerVault: (vault: PlayerVaultV4) =>
      ipcRenderer.invoke("playerVault:save", vault) as ReturnType<DesktopPlayerVaultBridge["savePlayerVault"]>,
    deletePlayerVault: () =>
      ipcRenderer.invoke("playerVault:delete") as ReturnType<DesktopPlayerVaultBridge["deletePlayerVault"]>,
  },
  trainingRun: {
    loadTrainingRun: () =>
      ipcRenderer.invoke("trainingRun:load") as ReturnType<DesktopTrainingRunBridge["loadTrainingRun"]>,
    saveTrainingRun: (run: TrainingRunGameV4) =>
      ipcRenderer.invoke("trainingRun:save", run) as ReturnType<DesktopTrainingRunBridge["saveTrainingRun"]>,
    deleteTrainingRun: () =>
      ipcRenderer.invoke("trainingRun:delete") as ReturnType<DesktopTrainingRunBridge["deleteTrainingRun"]>,
  },
  formalRun: {
    loadFormalGameRun: () =>
      ipcRenderer.invoke("formalRun:load") as ReturnType<DesktopFormalGameRunBridge["loadFormalGameRun"]>,
    saveFormalGameRun: (run: FormalGameRunV4) =>
      ipcRenderer.invoke("formalRun:save", run) as ReturnType<DesktopFormalGameRunBridge["saveFormalGameRun"]>,
    deleteFormalGameRun: () =>
      ipcRenderer.invoke("formalRun:delete") as ReturnType<DesktopFormalGameRunBridge["deleteFormalGameRun"]>,
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
    healFormalRestTeam: (run: FormalGameRunV4) =>
      ipcRenderer.invoke("formalGame:healRestTeam", run) as ReturnType<DesktopFormalGameBridge["healFormalRestTeam"]>,
    getFormalTrainingGroundLessons: (run: FormalGameRunV4) =>
      ipcRenderer.invoke("formalGame:getTrainingGroundLessons", run) as ReturnType<DesktopFormalGameBridge["getFormalTrainingGroundLessons"]>,
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
    getPlaybackTimeline: (sessionId: string, previousIndex?: number) =>
      ipcRenderer.invoke("battleService:getPlaybackTimeline", sessionId, previousIndex) as ReturnType<DesktopBattleServiceBridge["getPlaybackTimeline"]>,
    closeSession: (sessionId: string) =>
      ipcRenderer.invoke("battleService:closeSession", sessionId) as ReturnType<DesktopBattleServiceBridge["closeSession"]>,
  },
});
