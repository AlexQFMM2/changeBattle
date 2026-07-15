import fs from "node:fs";
import path from "node:path";

const outRoot = path.resolve(process.cwd(), "out");

const requiredSnippets = [
  {
    file: "main/main.js",
    snippets: [
      'ipcMain.handle("formalGame:createWithStarterCandidates"',
      'ipcMain.handle("desktopApp:checkForUpdates"',
      'ipcMain.handle("desktopApp:openOfficialSite"',
      'ipcMain.handle("desktopApp:getUpdateStatus"',
      'ipcMain.handle("desktopApp:cancelUpdate"',
      "desktopApp:updateStatus",
      'callFormalComputeWorker("createFormalGameWithStarterCandidates"',
      'ipcMain.handle("battleService:createSession"',
      'ipcMain.handle("battleService:submitChoice"',
      'ipcMain.handle("trainingRun:load"',
      'ipcMain.handle("formalRun:load"',
      "profile.dat",
      "training_run.dat",
      "formal_run.dat",
      "formalComputeWorker.js",
      "desktopUpdaterCli.js",
    ],
  },
  {
    file: "preload/preload.cjs",
    snippets: [
      "createFormalGameWithStarterCandidates",
      "checkForUpdates",
      'ipcRenderer.invoke("desktopApp:checkForUpdates"',
      "openOfficialSite",
      "getUpdateStatus",
      "cancelUpdate",
      "onUpdateStatus",
      'ipcRenderer.invoke("desktopApp:openOfficialSite"',
      'ipcRenderer.invoke("desktopApp:getUpdateStatus"',
      'ipcRenderer.invoke("desktopApp:cancelUpdate"',
      "desktopApp:updateStatus",
      'ipcRenderer.invoke("formalGame:createWithStarterCandidates"',
      'ipcRenderer.invoke("trainingRun:load"',
      'ipcRenderer.invoke("formalRun:load"',
      "createBattleSession",
      'ipcRenderer.invoke("battleService:createSession"',
    ],
  },
  {
    file: "main/formalComputeWorker.js",
    includeSiblingChunks: true,
    snippets: [
      'request.method === "createFormalGameWithStarterCandidates"',
      "STAR_CHART_NODES_V4",
      "rest_opponent_rumor",
    ],
  },
  {
    file: "main/desktopUpdaterCli.js",
    includeSiblingChunks: true,
    snippets: [
      "scan local managed files and calculate sha256",
      ".update-staging",
      ".update-backup",
      "desktopUpdateObjectUrlForFileV4",
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
  const text = readBundleText(filePath, Boolean(entry.includeSiblingChunks));
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

function readBundleText(filePath, includeSiblingChunks) {
  const textParts = [fs.readFileSync(filePath, "utf8")];
  if (!includeSiblingChunks) return textParts.join("\n");
  const chunksDir = path.join(path.dirname(filePath), "chunks");
  if (!fs.existsSync(chunksDir)) return textParts.join("\n");
  for (const entry of fs.readdirSync(chunksDir)) {
    if (entry.endsWith(".js")) textParts.push(fs.readFileSync(path.join(chunksDir, entry), "utf8"));
  }
  return textParts.join("\n");
}
