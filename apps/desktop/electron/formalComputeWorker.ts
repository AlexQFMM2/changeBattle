import {parentPort} from "node:worker_threads";
import {createChangeBattleV2Api} from "@changebattle-v2/api";
import type {BattleSessionSnapshotV4, CoopPartnerPreferenceV4, FormalBattleResultFinalizeReasonV4, FormalGameModeV4, FormalGameRunV4, FormalMedicalInsuranceChoiceV4, FormalSettlementReasonV4, UserProfileV2} from "@changebattle-v2/api";

type FormalComputeRequest =
  | {id: number; method: "createFormalGameWithStarterCandidates"; args: [UserProfileV2, {mode: FormalGameModeV4; coopPartnerPreference?: CoopPartnerPreferenceV4; streak?: number; seed?: string}]}
  | {id: number; method: "prepareFormalRoundPlan"; args: [FormalGameRunV4]}
  | {id: number; method: "prepareFormalBattleSession"; args: [FormalGameRunV4]}
  | {id: number; method: "getFormalMedicalInsuranceOffer"; args: [FormalGameRunV4]}
  | {id: number; method: "chooseFormalMedicalInsurance"; args: [FormalGameRunV4, FormalMedicalInsuranceChoiceV4]}
  | {id: number; method: "formalMedicalInsuranceEffectsForRun"; args: [FormalGameRunV4]}
  | {id: number; method: "healFormalRestTeam"; args: [FormalGameRunV4]}
  | {id: number; method: "getFormalTrainingGroundLessons"; args: [FormalGameRunV4]}
  | {id: number; method: "prepareFormalSettlement"; args: [FormalGameRunV4, UserProfileV2, FormalSettlementReasonV4]}
  | {id: number; method: "settleFormalBattleRound"; args: [FormalGameRunV4]}
  | {id: number; method: "finalizeFormalBattleResult"; args: [FormalGameRunV4, BattleSessionSnapshotV4, FormalBattleResultFinalizeReasonV4 | undefined]};

type FormalComputeResponse = {
  id: number;
  ok: boolean;
  result?: unknown;
  error?: string;
};

const api = createChangeBattleV2Api({resourcePrefix: "./showdown/"});

parentPort?.on("message", async (request: FormalComputeRequest) => {
  const response = await handleRequest(request)
    .then(result => ({id: request.id, ok: true, result}) satisfies FormalComputeResponse)
    .catch(error => ({
      id: request.id,
      ok: false,
      error: formatFormalComputeError(request.method, error),
    }) satisfies FormalComputeResponse);
  parentPort?.postMessage(response);
});

async function handleRequest(request: FormalComputeRequest): Promise<unknown> {
  if (request.method === "createFormalGameWithStarterCandidates") {
    const [profile, options] = request.args;
    const run = api.createFormalGameRun(profile, options);
    return api.prepareFormalStarterCandidates(run);
  }
  if (request.method === "prepareFormalRoundPlan") {
    return api.prepareFormalRoundPlan(request.args[0]);
  }
  if (request.method === "prepareFormalBattleSession") {
    return api.prepareFormalBattleSession(request.args[0]);
  }
  if (request.method === "getFormalMedicalInsuranceOffer") {
    return api.getFormalMedicalInsuranceOffer(request.args[0]);
  }
  if (request.method === "chooseFormalMedicalInsurance") {
    const [run, choice] = request.args;
    return api.chooseFormalMedicalInsurance(run, choice);
  }
  if (request.method === "formalMedicalInsuranceEffectsForRun") {
    return api.formalMedicalInsuranceEffectsForRun(request.args[0]);
  }
  if (request.method === "healFormalRestTeam") {
    return api.healFormalRestTeam(request.args[0]);
  }
  if (request.method === "getFormalTrainingGroundLessons") {
    return api.getFormalTrainingGroundLessons(request.args[0]);
  }
  if (request.method === "prepareFormalSettlement") {
    const [run, profile, reason] = request.args;
    const prepared = api.prepareFormalSettlement(run, reason);
    const nextProfile = prepared.settlement && !prepared.settlement.claimedAt
      ? await api.claimFormalSettlementBp(profile, prepared.settlement)
      : profile;
    const nextRun = prepared.settlement && !prepared.settlement.claimedAt
      ? {
        ...prepared,
        settlement: {...prepared.settlement, claimedAt: new Date().toISOString()},
        updatedAt: new Date().toISOString(),
      }
      : prepared;
    return {run: nextRun, profile: nextProfile};
  }
  if (request.method === "settleFormalBattleRound") {
    const [run] = request.args;
    return api.settleFormalBattleRoundV4(run);
  }
  if (request.method === "finalizeFormalBattleResult") {
    const [run, snapshot, reason] = request.args;
    return api.finalizeFormalBattleResultV4(run, snapshot, reason);
  }
  throw new Error(`未知正式流程计算方法：${(request as {method?: string}).method || ""}`);
}

function formatFormalComputeError(method: FormalComputeRequest["method"], error: unknown): string {
  if (error instanceof Error) {
    const stack = error.stack && error.stack !== error.message ? `\n${error.stack}` : "";
    return `[${method}] ${error.message}${stack}`;
  }
  return `[${method}] 正式流程计算失败。`;
}
