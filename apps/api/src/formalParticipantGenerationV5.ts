import {
  NPC_BATTLE_PREFERENCES,
  ROUND_DISTRIBUTIONS,
  formalCreateRngV4,
  formalNpcGenerationTierForTypeV4,
  formalNpcLevelBonusForTypeV4,
  formalNpcPowerProfileForTypeV4,
  formalTeamPreferenceForNpcV4,
  type FormalNpcBattlePreferenceV4,
  type FormalNpcTeamPreferenceV4,
  type FormalNpcTypeV4,
  type PokemonPowerProfileV4,
} from "@changebattle-v2/core";
import type {
  RandomBattleTeamPreviewInputV4,
  RandomBattleTeamPreviewResultV4,
} from "./teamGenerator.js";
import type {
  BattlePreferenceV4,
  FormalCompetitionModeV4,
  LocalTeamV4,
  PlayerItemInstanceV4,
  ShowdownPlayerIdV4,
  TrainingAiProfileV4,
  TrainingAllianceV4,
  TrainingRuleSetV4,
} from "./training.js";
import type {FormalGameModeV4} from "./formalGame.js";

export type GeneratedParticipantSourceKindV5 = "npc" | "player" | "ai-ally";

export type GeneratedParticipantV5 = {
  slot: ShowdownPlayerIdV4;
  sourceKind: GeneratedParticipantSourceKindV5;
  name: string;
  avatar: string;
  backImage?: string;
  controller: "local" | "ai" | "script";
  alliance: TrainingAllianceV4;
  localTeam: LocalTeamV4;
  bag: {
    maxSize: number;
    battleBagEnabled?: boolean;
    items: PlayerItemInstanceV4[];
  };
  npcProfile?: {
    trainerId: string;
    trainerType: FormalNpcTypeV4;
    battlePreference: FormalNpcBattlePreferenceV4;
    teamPreference: FormalNpcTeamPreferenceV4;
    powerProfile: PokemonPowerProfileV4;
    aiProfile: TrainingAiProfileV4;
    isBoss: boolean;
    sourceKind: GeneratedParticipantSourceKindV5;
  };
  diagnostics: string[];
};

export type GeneratedRoundParticipantsV5 = {
  nodeId: string;
  index: number;
  mode: FormalGameModeV4;
  ruleSet: TrainingRuleSetV4;
  difficulty: FormalNpcTypeV4;
  seed: string;
  participants: GeneratedParticipantV5[];
  diagnostics: string[];
};

export type FormalParticipantSourceCandidateV5 = {
  sourceKind: "player" | "ai-ally";
  slot: ShowdownPlayerIdV4;
  name: string;
  avatar: string;
  backImage?: string;
  controller?: "local" | "ai" | "script";
  alliance?: TrainingAllianceV4;
  localTeam: LocalTeamV4;
  bag?: {
    maxSize?: number;
    battleBagEnabled?: boolean;
    items?: PlayerItemInstanceV4[];
  };
};

export type FormalRoundParticipantGenerationInputV5 = {
  matchId: string;
  seed: string;
  streak: number;
  mode: FormalGameModeV4;
  competitionMode: FormalCompetitionModeV4;
  ruleSet: TrainingRuleSetV4;
  battlePreference: BattlePreferenceV4;
  allowedSpeciesIds?: string[];
  sourceCandidates?: FormalParticipantSourceCandidateV5[];
  generateRandomBattleTeam: (input: RandomBattleTeamPreviewInputV4) => Promise<RandomBattleTeamPreviewResultV4>;
};

export async function generateFormalRoundParticipantsV5(input: FormalRoundParticipantGenerationInputV5): Promise<GeneratedRoundParticipantsV5[]> {
  const distribution = roundDistributionV5(input.streak);
  const usedSpecies = new Set<string>();
  const rounds: GeneratedRoundParticipantsV5[] = [];
  for (let index = 0; index < distribution.length; index += 1) {
    const difficulty = distribution[index] || "normal";
    const nodeId = `round:${input.matchId}:${index + 1}`;
    const seed = `${input.seed}:round:${index + 1}`;
    const enemySlots: ShowdownPlayerIdV4[] = input.mode === "coop" ? ["p2", "p4"] : ["p2"];
    const participants: GeneratedParticipantV5[] = [];
    for (const slot of enemySlots) {
      participants.push(await generateFormalParticipantV5({
        ...input,
        nodeId,
        nodeIndex: index,
        nodeSeed: seed,
        slot,
        sourceKind: "npc",
        trainerType: difficulty,
        usedSpecies,
      }));
    }
    rounds.push({
      nodeId,
      index,
      mode: input.mode,
      ruleSet: input.ruleSet,
      difficulty,
      seed,
      participants,
      diagnostics: ["v5-native-round-participants", ...participants.flatMap(participant => participant.diagnostics)],
    });
  }
  return rounds;
}

export async function generateFormalCoopAllyParticipantV5(input: FormalRoundParticipantGenerationInputV5 & {
  nodeId: string;
  nodeIndex: number;
  nodeSeed: string;
  usedSpecies?: Set<string>;
}): Promise<GeneratedParticipantV5> {
  return generateFormalParticipantV5({
    ...input,
    slot: "p3",
    sourceKind: "ai-ally",
    trainerType: "elite",
    usedSpecies: input.usedSpecies || new Set<string>(),
  });
}

async function generateFormalParticipantV5(input: FormalRoundParticipantGenerationInputV5 & {
  nodeId: string;
  nodeIndex: number;
  nodeSeed: string;
  slot: ShowdownPlayerIdV4;
  sourceKind: GeneratedParticipantSourceKindV5;
  trainerType: FormalNpcTypeV4;
  usedSpecies: Set<string>;
}): Promise<GeneratedParticipantV5> {
  const candidate = input.sourceCandidates?.find(entry => entry.slot === input.slot && entry.sourceKind === input.sourceKind);
  if (candidate) return participantFromCandidateV5(candidate);

  const rng = formalCreateRngV4(`${input.nodeSeed}:${input.slot}:${input.sourceKind}`);
  const battlePreference = pickOneV5(NPC_BATTLE_PREFERENCES, rng) || "balanced";
  const teamPreference = formalTeamPreferenceForNpcV4(input.trainerType, battlePreference, values => pickOneV5(values, rng));
  const powerProfile = formalNpcPowerProfileForTypeV4(input.trainerType, input.streak, input.nodeIndex, input.sourceKind === "ai-ally");
  const aiProfile = aiProfileForParticipantV5(input.trainerType, battlePreference, powerProfile);
  const teamSize = selectedCountForFormalModeV5(input.mode);
  const generated = await input.generateRandomBattleTeam({
    ruleSet: input.ruleSet,
    mode: input.mode,
    seed: `${input.nodeSeed}:${input.slot}:${teamPreference}`,
    teamSize,
    playerId: input.slot,
    localTeamName: `${input.slot.toUpperCase()} ${teamPreference}`,
    pokemonFilter: {speciesIds: input.allowedSpeciesIds || [], excludedSpeciesIds: [...input.usedSpecies]},
    teamArchetype: teamPreference,
    archetypeAttempts: generationQualityForNpcV5(input.trainerType, powerProfile) === "strict" ? 64 : 32,
    aiLevel: aiProfile.level,
    purpose: input.sourceKind === "ai-ally" ? "npc-battle" : "npc-battle",
    quality: generationQualityForNpcV5(input.trainerType, powerProfile),
  });
  if (!generated.localTeam?.pokemon.length) {
    throw new Error(`V5 participant generation failed: ${input.slot} has no local team.`);
  }
  const localTeam = normalizeGeneratedTeamV5(generated.localTeam, {
    slot: input.slot,
    teamSize,
    level: clampIntV5(50 + formalNpcLevelBonusForTypeV4(input.trainerType), 1, 100),
    powerProfile,
  });
  localTeam.pokemon.forEach(pokemon => input.usedSpecies.add(baseSpeciesIdV5(pokemon.speciesId)));
  const visual = generatedNpcVisualV5(input.trainerType, input.sourceKind, rng);
  return {
    slot: input.slot,
    sourceKind: input.sourceKind,
    name: visual.name,
    avatar: visual.asset,
    controller: input.sourceKind === "ai-ally" ? "script" : "ai",
    alliance: input.sourceKind === "ai-ally" ? "near" : "far",
    localTeam,
    bag: {
      maxSize: 50,
      battleBagEnabled: true,
      items: systemItemsForRuleSetV5(input.ruleSet, `${input.nodeId}:${input.slot}:system`),
    },
    npcProfile: {
      trainerId: `generated:${input.sourceKind}:${input.nodeId}:${input.slot}`,
      trainerType: input.trainerType,
      battlePreference,
      teamPreference,
      powerProfile,
      aiProfile,
      isBoss: formalNpcGenerationTierForTypeV4(input.trainerType) === "boss" || formalNpcGenerationTierForTypeV4(input.trainerType) === "champion",
      sourceKind: input.sourceKind,
    },
    diagnostics: [
      `generated-participant:${input.sourceKind}:${input.slot}`,
      `trainer-type:${input.trainerType}`,
      `team-preference:${teamPreference}`,
      `power-profile:${powerProfile}`,
      ...(generated.diagnostics.messages || []).slice(0, 5).map(message => `showdown:${message}`),
      ...(generated.adapterDiagnostics.messages || []).slice(0, 5).map(message => `adapter:${message}`),
    ],
  };
}

function participantFromCandidateV5(candidate: FormalParticipantSourceCandidateV5): GeneratedParticipantV5 {
  return {
    slot: candidate.slot,
    sourceKind: candidate.sourceKind,
    name: candidate.name,
    avatar: candidate.avatar,
    backImage: candidate.backImage,
    controller: candidate.controller || (candidate.sourceKind === "player" ? "local" : "ai"),
    alliance: candidate.alliance || (candidate.sourceKind === "player" || candidate.sourceKind === "ai-ally" ? "near" : "far"),
    localTeam: candidate.localTeam,
    bag: {
      maxSize: candidate.bag?.maxSize || 50,
      battleBagEnabled: candidate.bag?.battleBagEnabled ?? true,
      items: candidate.bag?.items || [],
    },
    diagnostics: [`generated-participant:candidate:${candidate.sourceKind}:${candidate.slot}`],
  };
}

function selectedCountForFormalModeV5(mode: FormalGameModeV4): number {
  if (mode === "doubles") return 4;
  if (mode === "coop") return 2;
  return 3;
}

function roundDistributionV5(streak: number): FormalNpcTypeV4[] {
  const key = String(Math.max(0, Math.min(3, Math.floor(Number(streak || 0))))) as keyof typeof ROUND_DISTRIBUTIONS;
  return ROUND_DISTRIBUTIONS[key] || ROUND_DISTRIBUTIONS["0"];
}

function aiProfileForParticipantV5(trainerType: FormalNpcTypeV4, preference: FormalNpcBattlePreferenceV4, powerProfile: PokemonPowerProfileV4): TrainingAiProfileV4 {
  if (trainerType === "champion" || trainerType === "villain" || powerProfile === "champion") return {level: "champion", preference};
  if (trainerType === "elite4" || powerProfile === "boss") return {level: "eliteFour", preference};
  if (trainerType === "gym") return {level: "gymLeader", preference};
  if (trainerType === "elite" || powerProfile === "elite") return {level: "elite", preference};
  if (trainerType === "normal" || powerProfile === "normal") return {level: "normal", preference};
  return {level: "rookie", preference};
}

function generationQualityForNpcV5(trainerType: FormalNpcTypeV4, powerProfile: PokemonPowerProfileV4): NonNullable<RandomBattleTeamPreviewInputV4["quality"]> {
  if (trainerType === "gym" || trainerType === "elite4" || trainerType === "champion" || trainerType === "villain" || powerProfile === "boss" || powerProfile === "champion") return "strict";
  if (trainerType === "rookie" || powerProfile === "rookie") return "loose";
  return "structured";
}

function normalizeGeneratedTeamV5(team: LocalTeamV4, input: {slot: ShowdownPlayerIdV4; teamSize: number; level: number; powerProfile: PokemonPowerProfileV4}): LocalTeamV4 {
  return {
    ...team,
    id: `formal-v5-team-${input.slot}`,
    pokemon: team.pokemon.slice(0, input.teamSize).map((pokemon, index) => ({
      ...pokemon,
      localPokemonId: `${input.slot}-generated-${index + 1}-${pokemon.speciesId}`,
      level: input.level,
      powerProfile: input.powerProfile,
      heldItemInstanceId: undefined,
      entryStatus: "",
      entryHp: Math.max(1, Math.floor(Number(pokemon.maxHp || pokemon.entryHp || 1))),
    })),
  };
}

type GeneratedNpcVisualV5 = {
  name: string;
  asset: string;
};

const ROOKIE_NPC_VISUALS_V5: readonly GeneratedNpcVisualV5[] = [
  {name: "捕虫少年", asset: "npc/normal/dp-bug-catcher-6-dp-bug-catcher-1f3bdad7.png"},
  {name: "捕虫少年", asset: "npc/normal/hgss-bug-catcher-72-hgss-bug-catcher-4257b985.png"},
  {name: "短裤少年", asset: "npc/normal/spr-bw-youngster-167-spr-bw-youngster-8905c2a1.png"},
  {name: "迷你裙", asset: "npc/normal/hgss-lass-82-hgss-lass-7bb7c751.png"},
  {name: "露营少年", asset: "npc/normal/dp-camper-7-dp-camper-9ad9686c.png"},
  {name: "学生", asset: "npc/normal/spr-bw-school-kid-m-152-spr-bw-school-kid-m-5b0e9d83.png"},
  {name: "学生", asset: "npc/normal/spr-bw-school-kid-f-151-spr-bw-school-kid-f-6db508a8.png"},
];

const NORMAL_NPC_VISUALS_V5: readonly GeneratedNpcVisualV5[] = [
  {name: "精英训练家", asset: "npc/normal/spr-bw-ace-trainer-m-101-spr-bw-ace-trainer-m-99261c96.png"},
  {name: "宝可梦巡护员", asset: "npc/normal/spr-bw-pokemon-ranger-m-145-spr-bw-pokemon-ranger-m-94d5b25d.png"},
  {name: "背包客", asset: "npc/normal/spr-bw-backpacker-m-104-spr-bw-backpacker-m-713f3ea0.png"},
  {name: "空手道王", asset: "npc/normal/spr-bw-black-belt-111-spr-bw-black-belt-f6e8e256.png"},
  {name: "大姐姐", asset: "npc/normal/dp-lady-20-dp-lady-e5db30ec.png"},
  {name: "工人", asset: "npc/normal/spr-bw-worker-165-spr-bw-worker-72a9cc8a.png"},
  {name: "医生", asset: "npc/normal/spr-bw-doctor-120-spr-bw-doctor-7101e65a.png"},
];

const ELITE_NPC_VISUALS_V5: readonly GeneratedNpcVisualV5[] = [
  {name: "王牌训练家", asset: "npc/normal/spr-bw-ace-trainer-f-100-spr-bw-ace-trainer-f-cd201da5.png"},
  {name: "王牌训练家", asset: "npc/normal/spr-bw-ace-trainer-m-101-spr-bw-ace-trainer-m-99261c96.png"},
  {name: "资深训练家", asset: "npc/normal/spr-bw-veteran-f-162-spr-bw-veteran-f-60064197.png"},
  {name: "战术教练", asset: "npc/normal/hgss-cool-trainer-m-75-hgss-cool-trainer-m-f1f64d99.png"},
  {name: "对战女郎", asset: "npc/normal/spr-bw-battle-girl-109-spr-bw-battle-girl-a44c5a21.png"},
  {name: "道馆助教", asset: "npc/normal/spr-bw-pokemon-ranger-f-144-spr-bw-pokemon-ranger-f-b2b4fa80.png"},
];

const ALLY_NPC_VISUALS_V5: readonly GeneratedNpcVisualV5[] = [
  {name: "精英队友", asset: "npc/normal/spr-bw-ace-trainer-m-101-spr-bw-ace-trainer-m-99261c96.png"},
  {name: "战术搭档", asset: "npc/normal/spr-bw-ace-trainer-f-100-spr-bw-ace-trainer-f-cd201da5.png"},
  {name: "支援训练家", asset: "npc/normal/spr-bw-pokemon-ranger-f-144-spr-bw-pokemon-ranger-f-b2b4fa80.png"},
  {name: "合作专家", asset: "npc/normal/hgss-cool-trainer-f-74-hgss-cool-trainer-f-18462f93.png"},
  {name: "双打拍档", asset: "npc/normal/spr-bw-pokemon-ranger-m-145-spr-bw-pokemon-ranger-m-94d5b25d.png"},
];

const BOSS_NPC_VISUALS_V5: readonly GeneratedNpcVisualV5[] = [
  {name: "馆主", asset: "npc/boss/bugsy-bugsyhgss-9e2af540.gif"},
  {name: "馆主", asset: "npc/boss/brock-brockhgss-c30d5c14.gif"},
  {name: "四天王", asset: "npc/boss/aaron-aaronplatinum-99e1e21c.gif"},
  {name: "冠军", asset: "npc/boss/lance-lancehgss-9b33137f.gif"},
  {name: "强敌", asset: "npc/boss/red-red-c813612f.gif"},
];

function generatedNpcVisualV5(type: FormalNpcTypeV4, sourceKind: GeneratedParticipantSourceKindV5, rng: () => number): GeneratedNpcVisualV5 {
  if (sourceKind === "ai-ally") return pickOneV5(ALLY_NPC_VISUALS_V5, rng) || ALLY_NPC_VISUALS_V5[0]!;
  if (type === "rookie") return pickOneV5(ROOKIE_NPC_VISUALS_V5, rng) || ROOKIE_NPC_VISUALS_V5[0]!;
  if (type === "normal") return pickOneV5(NORMAL_NPC_VISUALS_V5, rng) || NORMAL_NPC_VISUALS_V5[0]!;
  if (type === "gym" || type === "elite4" || type === "champion" || type === "villain") return pickOneV5(BOSS_NPC_VISUALS_V5, rng) || BOSS_NPC_VISUALS_V5[0]!;
  return pickOneV5(ELITE_NPC_VISUALS_V5, rng) || ELITE_NPC_VISUALS_V5[0]!;
}

function systemItemsForRuleSetV5(ruleSet: TrainingRuleSetV4, idPrefix: string): PlayerItemInstanceV4[] {
  const itemIdsByRuleSet: Record<TrainingRuleSetV4, string[]> = {
    standard: [],
    gen7: ["system-mega-stone", "system-z-crystal"],
    gen8: ["system-dynamax-band"],
    gen9: ["system-tera-orb"],
  };
  return (itemIdsByRuleSet[ruleSet] || []).map((itemID, index) => ({
    id: `${idPrefix}:${index + 1}`,
    itemID,
    name: systemItemNameV5(itemID),
    image: "",
    cost: 0,
    canSale: false,
    type: "system",
    canBattleUse: false,
    canUse: false,
    canUseToPokemon: false,
    canTake: false,
    effectRound: null,
    getRound: 0,
    maxUseCount: null,
    useCount: 0,
    systemReforgeKind: itemID === "system-mega-stone" ? "mega" : itemID === "system-z-crystal" ? "z-crystal" : itemID === "system-tera-orb" ? "tera" : undefined,
  }));
}

function systemItemNameV5(itemID: string): string {
  if (itemID === "system-mega-stone") return "Mega系统";
  if (itemID === "system-z-crystal") return "Z招式系统";
  if (itemID === "system-dynamax-band") return "极巨化系统";
  if (itemID === "system-tera-orb") return "太晶系统";
  return itemID;
}

function pickOneV5<T>(values: readonly T[], rng: () => number): T | undefined {
  if (!values.length) return undefined;
  return values[Math.floor(rng() * values.length) % values.length];
}

function baseSpeciesIdV5(speciesId: string): string {
  return String(speciesId || "").toLowerCase().replace(/[^a-z0-9].*$/, "");
}

function clampIntV5(value: unknown, min: number, max: number): number {
  const next = Math.floor(Number(value));
  if (!Number.isFinite(next)) return min;
  return Math.max(min, Math.min(max, next));
}
