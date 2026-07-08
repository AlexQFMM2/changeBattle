import {readdirSync, readFileSync, statSync} from "node:fs";
import {join, relative} from "node:path";

const ROOT = process.cwd();
const TARGETS = [
  "apps/api/src",
  "apps/web/src/components",
];

const FORBIDDEN_PATTERNS = [
  ["FORMAL_ROUND_STAGE_LABELS", /\bFORMAL_ROUND_STAGE_LABELS\b/],
  ["courseDetail(", /\bcourseDetail\s*\(/],
  ["courseTitle(", /\bcourseTitle\s*\(/],
  ["courseTeacherLabel(", /\bcourseTeacherLabel\s*\(/],
  ["courseDialogueText(", /\bcourseDialogueText\s*\(/],
  ["insuranceTierLabel(", /\binsuranceTierLabel\s*\(/],
  ["settlementReasonLabel(", /\bsettlementReasonLabel\s*\(/],
  ["starterRoleLabel(", /\bstarterRoleLabel\s*\(/],
  ["teamPreferenceLabel(", /\bteamPreferenceLabel\s*\(/],
  ["function modeLabel(", /\bfunction\s+modeLabel\s*\(/],
  ["const BATTLE_SYSTEM_LABELS", /\bconst\s+BATTLE_SYSTEM_LABELS\b/],
  ["outcomeLabel(", /\boutcomeLabel\s*\(/],
  ["direct evoItem display", /使用\s+\$\{(?![^}]*translateDexLabel\s*\(\s*["']items["'])[^}]*\bevoItem\b[^}]*\}/],
  ["direct evoMove display", /学会\s+\$\{(?![^}]*translateDexLabel\s*\(\s*["']moves["'])[^}]*\bevoMove\b[^}]*\}/],
];

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const findings = [];

for (const target of TARGETS) {
  walk(join(ROOT, target));
}

if (findings.length) {
  console.error("Shared labels and Dex factual values must use their centralized helpers, not local API/Web display strings.");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line}: ${finding.name}`);
  }
  process.exit(1);
}

console.log("Shared ChangeBattle gameplay copy audit passed.");

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (entry === "node_modules" || entry.startsWith("dist")) continue;
      walk(fullPath);
      continue;
    }
    if (!isSourceFile(fullPath)) continue;
    scanFile(fullPath);
  }
}

function isSourceFile(file) {
  return SOURCE_EXTENSIONS.has(file.slice(file.lastIndexOf(".")));
}

function scanFile(file) {
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((lineText, index) => {
    for (const [name, pattern] of FORBIDDEN_PATTERNS) {
      if (pattern.test(lineText)) {
        findings.push({
          file: relative(ROOT, file),
          line: index + 1,
          name,
        });
      }
    }
  });
}
