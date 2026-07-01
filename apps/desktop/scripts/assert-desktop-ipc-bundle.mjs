import fs from "node:fs";
import path from "node:path";

const outRoot = path.resolve(process.cwd(), "out");

const requiredSnippets = [
  {
    file: "main/main.js",
    snippets: [
      'ipcMain.handle("formalGame:createWithStarterCandidates"',
      'callFormalComputeWorker("createFormalGameWithStarterCandidates"',
      'ipcMain.handle("battleService:createSession"',
      'ipcMain.handle("battleService:submitChoice"',
      "formalComputeWorker.js",
    ],
  },
  {
    file: "preload/preload.cjs",
    snippets: [
      "createFormalGameWithStarterCandidates",
      'ipcRenderer.invoke("formalGame:createWithStarterCandidates"',
      "createBattleSession",
      'ipcRenderer.invoke("battleService:createSession"',
    ],
  },
  {
    file: "main/formalComputeWorker.js",
    snippets: [
      'request.method === "createFormalGameWithStarterCandidates"',
      "STAR_CHART_NODES_V4",
      "rest_opponent_rumor",
    ],
  },
];

const forbiddenSnippets = [
  'from "@changebattle-v2/',
  'require("@changebattle-v2/',
  'from "react"',
  'import "react"',
  'require("react")',
  "file:///D:/",
];

const failures = [];

for (const entry of requiredSnippets) {
  const filePath = path.join(outRoot, entry.file);
  if (!fs.existsSync(filePath)) {
    failures.push(`${entry.file}: missing output file`);
    continue;
  }
  const text = fs.readFileSync(filePath, "utf8");
  for (const snippet of entry.snippets) {
    if (!text.includes(snippet)) failures.push(`${entry.file}: missing ${snippet}`);
  }
  for (const snippet of forbiddenSnippets) {
    if (text.includes(snippet)) failures.push(`${entry.file}: forbidden ${snippet}`);
  }
}

if (failures.length) {
  console.error("[assert-desktop-ipc-bundle] failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.info("[assert-desktop-ipc-bundle] ok");
