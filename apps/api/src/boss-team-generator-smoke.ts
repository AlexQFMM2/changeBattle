import {generateBossTrainerPresetTeamsV4} from "./bossTeamGenerator.js";

const trainer = {
  id: "gym:关都地区:小刚:1",
  nameZh: "小刚",
  trainerType: "gym",
  bossProfile: {
    trainerId: "gym:关都地区:小刚:1",
    battlePreference: "defense",
    aiLevel: "gymLeader",
    powerProfile: "boss",
    teamPreferences: ["sand", "balanced", "setup-offense"],
    originalPreferredSpeciesIds: ["omastar", "kabutops", "golem"],
    preferredSpeciesIds: ["omastar", "kabutops", "golem", "tyranitar", "hippowdon", "garchomp", "excadrill", "gigalith", "lycanroc", "metagross", "aggron", "steelix"],
    diagnostics: {source: "smoke", representativeCount: 3, expandedCount: 12, expansionSources: [], inferredFrom: [], messages: []},
  },
};
const mockDex = {
  searchDex: () => ({rows: [{id: trainer.id}], hasMore: false}),
  getTrainerDetail: () => trainer,
};

const result = await generateBossTrainerPresetTeamsV4(mockDex as any, {
  trainerId: "gym:关都地区:小刚:1",
  archetypeAttempts: 4,
});

if (result.teams.length !== 36) {
  throw new Error(`expected 36 boss preset teams, got ${result.teams.length}`);
}

const summary = result.summaries[0];
if (!summary || summary.generatedCount !== 36 || summary.missingKeys.length) {
  throw new Error(`invalid matrix summary: ${JSON.stringify(summary)}`);
}

for (const team of result.teams) {
  if (team.pokemonSets.length !== 6) throw new Error(`team ${team.seed} does not have 6 pokemon`);
  for (const pokemon of team.pokemonSets) {
    if (!pokemon.species || !pokemon.ability || !pokemon.nature || !pokemon.level || !pokemon.moves.length) {
      throw new Error(`invalid pokemon set in ${team.seed}: ${JSON.stringify(pokemon)}`);
    }
  }
}

const noneTeams = result.teams.filter(team => team.ruleSetPreset === "none");
if (noneTeams.some(team => team.pokemonSets.some(pokemon => pokemon.teraType || pokemon.gigantamax || pokemon.dynamaxLevel))) {
  throw new Error("none preset should clean special system fields");
}

const gen7FallbackTeams = result.teams.filter(team => team.ruleSetPreset === "gen7" && team.mode !== "singles");
if (!gen7FallbackTeams.length || gen7FallbackTeams.some(team => team.diagnostics.fallbackFormatId !== "[Gen 7] Random Battle")) {
  throw new Error("gen7 doubles/coop should use explicit fallback format diagnostics");
}

if (!result.teams.some(team => team.diagnostics.preferredSpeciesHitCount > 0)) {
  throw new Error("expected at least one generated team to include preferred species");
}

console.log("boss team generator smoke passed");
