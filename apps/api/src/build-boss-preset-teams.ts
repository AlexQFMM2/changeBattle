import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {generateBossTrainerPresetTeamsV4, type BossTrainerPresetTeamV4} from "./bossTeamGenerator.js";

type StaticMatrixSummary = {
  trainerId: string;
  trainerNameZh: string;
  trainerType: string;
  expectedCount: number;
  generatedCount: number;
  missingKeys: string[];
  ruleSetCounts: Record<"none" | "gen7" | "gen8" | "gen9", number>;
  modeCounts: Record<"singles" | "doubles" | "coop", number>;
  preferredSpeciesHitTeamCount: number;
  preferredSpeciesTotalHits: number;
  zeroPreferredHitTeamCount: number;
  fallbackTeamCount: number;
  warningCount: number;
  cleanedNoneTeamCount: number;
  teamPreferences: string[];
  aiPreference: string;
  aiLevel: string;
  powerProfile: string;
  originalPreferredSpeciesCount: number;
  expandedPreferredSpeciesCount: number;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const dataFile = path.join(repoRoot, "packages", "showdown-dex-core", "src", "data", "boss-preset-teams.ts");
const fullTeamsFile = path.join(repoRoot, "packages", "showdown-dex-core", "src", "data", "boss-preset-teams.json");
const docsFile = path.join(repoRoot, "docs", "boss-trainer-preset-team-generation.md");
const archetypeAttempts = Math.max(1, Math.min(64, Number(process.env.BOSS_TEAM_ARCHETYPE_ATTEMPTS || 1)));

const dexCore = await import(pathToFileUrl(path.join(repoRoot, "packages", "showdown-dex-core", "dist-test", "index.js")));
const dex = dexCore.createShowdownDexService();
console.log(`building boss preset teams with archetypeAttempts=${archetypeAttempts}`);
const bossTrainerIds = allBossTrainerIds(dex);
const teams: BossTrainerPresetTeamV4[] = [];
for (const [index, trainerId] of bossTrainerIds.entries()) {
  const startedAt = Date.now();
  const result = await generateBossTrainerPresetTeamsV4(dex, {trainerId, archetypeAttempts});
  teams.push(...result.teams);
  const summary = result.summaries[0];
  console.log(`[${index + 1}/${bossTrainerIds.length}] ${summary?.trainerNameZh || trainerId} ${summary?.generatedCount || result.teams.length}/36 ${Date.now() - startedAt}ms`);
}
const summaries = summarizeStaticMatrices(teams);

writeDataFile(teams, summaries);
writeDocsFile(teams, summaries);
console.log(`wrote ${teams.length} teams for ${Object.keys(summaries).length} boss trainers`);
console.log(`data: ${dataFile}`);
console.log(`full teams: ${fullTeamsFile}`);
console.log(`docs: ${docsFile}`);

function summarizeStaticMatrices(teams: BossTrainerPresetTeamV4[]): Record<string, StaticMatrixSummary> {
  const byTrainer = new Map<string, BossTrainerPresetTeamV4[]>();
  for (const team of teams) {
    const list = byTrainer.get(team.trainerId) || [];
    list.push(team);
    byTrainer.set(team.trainerId, list);
  }

  return Object.fromEntries(Array.from(byTrainer.entries()).map(([trainerId, ownTeams]) => {
    const first = ownTeams[0];
    const expectedKeys = ["none", "gen7", "gen8", "gen9"].flatMap(ruleSetPreset =>
      ["singles", "doubles", "coop"].flatMap(mode =>
        [1, 2, 3].map(variantIndex => `${ruleSetPreset}:${mode}:${variantIndex}`)
      )
    );
    const keys = new Set(ownTeams.map(team => `${team.ruleSetPreset}:${team.mode}:${team.variantIndex}`));
    const warningCount = ownTeams.reduce((count, team) => {
      const messages = team.diagnostics.messages.length;
      const invalidSize = team.pokemonSets.length === 6 ? 0 : 1;
      const invalidPokemon = team.pokemonSets.some(pokemon => !pokemon.species || !pokemon.ability || !pokemon.nature || !pokemon.level || !pokemon.moves.length) ? 1 : 0;
      return count + messages + invalidSize + invalidPokemon;
    }, expectedKeys.filter(key => !keys.has(key)).length);
    return [trainerId, {
      trainerId,
      trainerNameZh: first?.trainerNameZh || trainerId,
      trainerType: first?.trainerType || "unknown",
      expectedCount: expectedKeys.length,
      generatedCount: ownTeams.length,
      missingKeys: expectedKeys.filter(key => !keys.has(key)),
      ruleSetCounts: {
        none: ownTeams.filter(team => team.ruleSetPreset === "none").length,
        gen7: ownTeams.filter(team => team.ruleSetPreset === "gen7").length,
        gen8: ownTeams.filter(team => team.ruleSetPreset === "gen8").length,
        gen9: ownTeams.filter(team => team.ruleSetPreset === "gen9").length,
      },
      modeCounts: {
        singles: ownTeams.filter(team => team.mode === "singles").length,
        doubles: ownTeams.filter(team => team.mode === "doubles").length,
        coop: ownTeams.filter(team => team.mode === "coop").length,
      },
      preferredSpeciesHitTeamCount: ownTeams.filter(team => team.diagnostics.preferredSpeciesHitCount > 0).length,
      preferredSpeciesTotalHits: ownTeams.reduce((sum, team) => sum + team.diagnostics.preferredSpeciesHitCount, 0),
      zeroPreferredHitTeamCount: ownTeams.filter(team => team.diagnostics.preferredSpeciesHitCount === 0).length,
      fallbackTeamCount: ownTeams.filter(team => Boolean(team.diagnostics.fallbackFormatId) || team.diagnostics.generationAttempts.includes("unfiltered-fallback")).length,
      warningCount,
      cleanedNoneTeamCount: ownTeams.filter(team => team.diagnostics.cleanedSpecialSystemForNone).length,
      teamPreferences: Array.from(new Set(ownTeams.map(team => team.teamArchetype))),
      aiPreference: first?.aiPreference || "balanced",
      aiLevel: first?.aiLevel || "",
      powerProfile: first?.powerProfile || "",
      originalPreferredSpeciesCount: first?.originalPreferredSpeciesIds.length || 0,
      expandedPreferredSpeciesCount: first?.preferredSpeciesIds.length || 0,
    } satisfies StaticMatrixSummary];
  }));
}

function allBossTrainerIds(dex: {searchDex: (request: {category: "trainers"; query: string; offset: number; limit: number}) => {rows: Array<{id: string}>; hasMore: boolean}}): string[] {
  const ids: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = dex.searchDex({category: "trainers", query: "boss", offset, limit: 100});
    ids.push(...page.rows.map(row => row.id));
    if (!page.hasMore) break;
  }
  return ids;
}

function writeDataFile(teams: BossTrainerPresetTeamV4[], summaries: Record<string, StaticMatrixSummary>) {
  fs.writeFileSync(fullTeamsFile, `${JSON.stringify(teams)}\n`);
  const source = `export type BossTrainerRuleSetPresetData = "none" | "gen7" | "gen8" | "gen9";
export type BossTrainerModeData = "singles" | "doubles" | "coop";

export type BossTrainerPresetPokemonSetData = {
  name: string;
  species: string;
  item?: string;
  ability: string;
  moves: string[];
  nature: string;
  gender?: string;
  evs?: Record<string, number>;
  ivs?: Record<string, number>;
  level: number;
  shiny?: boolean;
  happiness?: number;
  pokeball?: string;
  hpType?: string;
  dynamaxLevel?: number;
  gigantamax?: boolean;
  teraType?: string;
};

export type BossTrainerPresetTeamDiagnosticsData = {
  ok: boolean;
  requestedRuleSet: string;
  resolvedRuleSet: string;
  requestedMode: string;
  formatId: string | null;
  fallbackFormatId?: string;
  seed: number[] | null;
  teamSize: number | null;
  pokemonFilter: {
    requestedSpeciesIds: string[];
    excludedSpeciesIds: string[];
    matchedSpeciesIds: string[];
  } | null;
  archetype: {
    id: string;
    attempts: number;
    bestScore: number;
    matchedPoolSize: number;
  } | null;
  messages: string[];
  elapsedMs: number;
  generationAttempts: string[];
  preferredSpeciesHitCount: number;
  cleanedSpecialSystemForNone: boolean;
  fillToSixCount: number;
};

export type BossTrainerPresetTeamData = {
  trainerId: string;
  trainerNameZh: string;
  trainerType: string;
  ruleSetPreset: BossTrainerRuleSetPresetData;
  mode: BossTrainerModeData;
  variantIndex: number;
  seed: string;
  teamArchetype: string;
  aiPreference: string;
  aiLevel: string;
  powerProfile: string;
  preferredSpeciesIds: string[];
  originalPreferredSpeciesIds: string[];
  pokemonSets: BossTrainerPresetPokemonSetData[];
  packedTeam: string;
  exportedTeam: string;
  diagnostics: BossTrainerPresetTeamDiagnosticsData;
};

export type BossTrainerPresetMatrixSummaryData = {
  trainerId: string;
  trainerNameZh: string;
  trainerType: string;
  expectedCount: number;
  generatedCount: number;
  missingKeys: string[];
  ruleSetCounts: Record<BossTrainerRuleSetPresetData, number>;
  modeCounts: Record<BossTrainerModeData, number>;
  preferredSpeciesHitTeamCount: number;
  preferredSpeciesTotalHits: number;
  zeroPreferredHitTeamCount: number;
  fallbackTeamCount: number;
  warningCount: number;
  cleanedNoneTeamCount: number;
  teamPreferences: string[];
  aiPreference: string;
  aiLevel: string;
  powerProfile: string;
  originalPreferredSpeciesCount: number;
  expandedPreferredSpeciesCount: number;
};

export const BossTrainerPresetTeamCount = ${teams.length};

export const BossTrainerPresetTeamsDataFile = "boss-preset-teams.json";

export const BossTrainerPresetMatrixSummaries = ${JSON.stringify(summaries, null, 2)} as Record<string, BossTrainerPresetMatrixSummaryData>;
`;
  fs.writeFileSync(dataFile, source);
}

function writeDocsFile(teams: BossTrainerPresetTeamV4[], summaries: Record<string, StaticMatrixSummary>) {
  const rows = Object.values(summaries).sort((a, b) => a.trainerType.localeCompare(b.trainerType) || a.trainerNameZh.localeCompare(b.trainerNameZh, "zh-Hans-CN"));
  const incomplete = rows.filter(row => row.generatedCount !== row.expectedCount || row.missingKeys.length);
  const zeroHits = rows.filter(row => row.preferredSpeciesHitTeamCount === 0);
  const fallbackCount = teams.filter(team => team.diagnostics.fallbackFormatId).length;
  const unfilteredFallbackCount = teams.filter(team => team.diagnostics.generationAttempts.includes("unfiltered-fallback")).length;
  const totalPreferredHitTeams = rows.reduce((sum, row) => sum + row.preferredSpeciesHitTeamCount, 0);
  const totalWarnings = rows.reduce((sum, row) => sum + row.warningCount, 0);
  const samples = ["gym:关都地区:小刚:1", "champion:神奥地区:竹兰:1", "villain:彩虹火箭队:坂木:1"]
    .map(id => sampleTrainerSection(id, teams, summaries[id]))
    .filter(Boolean)
    .join("\n\n");

  const source = `# Boss 训练师预制队伍生成审阅

本文件由 \`tools/build-boss-preset-teams.mjs\` 生成，用于审阅 V2 正式游戏 Boss 静态队伍池。

## 总览

- Boss 训练师数量：${rows.length}
- 预制队伍总数：${teams.length}
- 目标矩阵：每个 Boss 36 队，覆盖 \`none / gen7 / gen8 / gen9\` 与 \`singles / doubles / coop\`，每格 3 个变体。
- 每套队伍：完整 6 只宝可梦，正式游戏后续再按 \`6v3 / 6v4 / 6v2\` 选择出战数量。
- 生成参数：\`archetypeAttempts=${archetypeAttempts}\`
- 矩阵缺失：${incomplete.length}
- 偏好宝可梦完全未命中 Boss：${zeroHits.length}
- 命中偏好宝可梦的队伍数：${totalPreferredHitTeams}
- fallback format 队伍数：${fallbackCount}
- 放宽到无过滤 fallback 队伍数：${unfilteredFallbackCount}
- diagnostics warning 总数：${totalWarnings}

## 规则说明

- Boss 队伍以 V1 代表宝可梦扩展出的 \`preferredSpeciesIds\` 为核心，最低补到 12 只候选。
- \`none\` 环境按 Gen9 set 来源生成，但清理 Mega/Z/极巨/太晶相关依赖。
- \`gen7 doubles/coop\` 当前使用 \`[Gen 7] Random Battle\` 作为 fallback set 来源，diagnostics 中会记录 \`fallbackFormatId\`。
- Boss 队伍允许携带 Showdown 生成出的道具；玩家侧正式生成默认不携带道具是后续正式游戏流程规则。

## 样例

${samples || "暂无样例。"}

## 全量矩阵摘要

| 训练师 | 类型 | 队伍 | 偏好命中队伍 | 原始偏好->扩展 | 队伍偏好 | AI/数值 | Fallback | Warning |
| --- | --- | ---: | ---: | ---: | --- | --- | ---: | ---: |
${rows.map(row => `| ${escapeMd(row.trainerNameZh)} | ${row.trainerType} | ${row.generatedCount}/${row.expectedCount} | ${row.preferredSpeciesHitTeamCount} | ${row.originalPreferredSpeciesCount}->${row.expandedPreferredSpeciesCount} | ${escapeMd(row.teamPreferences.join(" / "))} | ${row.aiPreference} / ${row.aiLevel} / ${row.powerProfile} | ${row.fallbackTeamCount} | ${row.warningCount} |`).join("\n")}

## 需要重点复查

${reviewList(incomplete, zeroHits)}
`;
  fs.writeFileSync(docsFile, source);
}

function sampleTrainerSection(trainerId: string, teams: BossTrainerPresetTeamV4[], summary?: StaticMatrixSummary): string {
  if (!summary) return "";
  const sampleTeams = teams.filter(team => team.trainerId === trainerId).slice(0, 3);
  return `### ${summary.trainerNameZh}

- 类型：${summary.trainerType}
- 队伍偏好：${summary.teamPreferences.join(" / ")}
- AI/数值：${summary.aiPreference} / ${summary.aiLevel} / ${summary.powerProfile}
- 矩阵：${summary.generatedCount}/${summary.expectedCount}
- 偏好命中队伍：${summary.preferredSpeciesHitTeamCount}
- 样例队伍：
${sampleTeams.map(team => `  - ${team.ruleSetPreset}/${team.mode}#${team.variantIndex}：${team.pokemonSets.map(pokemon => pokemon.species).join(" / ")}`).join("\n")}`;
}

function reviewList(incomplete: StaticMatrixSummary[], zeroHits: StaticMatrixSummary[]) {
  const lines = [
    ...incomplete.map(row => `- 矩阵缺失：${row.trainerNameZh} ${row.generatedCount}/${row.expectedCount}，缺失 ${row.missingKeys.join(", ")}`),
    ...zeroHits.map(row => `- 偏好未命中：${row.trainerNameZh}，可考虑人工扩充偏好宝可梦池或固定队伍。`),
  ];
  return lines.length ? lines.join("\n") : "- 暂无必须立即处理的缺口。";
}

function escapeMd(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function pathToFileUrl(filePath: string): string {
  const normalized = path.resolve(filePath).replace(/\\/g, "/");
  return `file://${normalized.startsWith("/") ? "" : "/"}${normalized}`;
}
