import {Worker} from "node:worker_threads";
import path from "node:path";
import {fileURLToPath} from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const workerPath = path.resolve(scriptDir, "../out/main/formalComputeWorker.js");

const profile = {
  version: 1,
  id: "desktop-formal-worker-smoke-profile",
  name: "Smoke",
  trainerId: "ethan",
  avatarAsset: "npc/avatars/koga-vskoga-523872dc.png",
  frontAsset: "npc/player-front/ethan-hgss-ethan-6eefaecf.png",
  backAsset: "npc/player-back/ethan-hgss-gold-back-46e97197.png",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  battlePreference: {generation: "gen9"},
  battlePoints: 0,
  starChart: {nodes: {root_trainer_star: 1}},
};

const worker = new Worker(workerPath);
const timeout = setTimeout(() => {
  void worker.terminate();
  console.error("[desktop-formal-worker-smoke] timeout");
  process.exit(1);
}, 30_000);

worker.on("message", message => {
  clearTimeout(timeout);
  void worker.terminate();
  if (!message?.ok) {
    console.error(message?.error || "[desktop-formal-worker-smoke] worker failed");
    process.exit(1);
  }
  const run = message.result;
  if (run?.status !== "starterSelecting" || !Array.isArray(run.starterCandidates) || run.starterCandidates.length < 6) {
    console.error("[desktop-formal-worker-smoke] unexpected result", JSON.stringify({
      status: run?.status,
      starterCandidates: run?.starterCandidates?.length,
    }));
    process.exit(1);
  }
  const firstSprite = run.starterCandidates[0]?.pokemon?.spriteUrl || "";
  if (firstSprite.startsWith("/") || /^[a-z]:[\\/]/i.test(firstSprite) || /^file:/i.test(firstSprite)) {
    console.error(`[desktop-formal-worker-smoke] non-portable sprite URL: ${firstSprite}`);
    process.exit(1);
  }
  console.info("[desktop-formal-worker-smoke] ok");
  process.exit(0);
});

worker.on("error", error => {
  clearTimeout(timeout);
  console.error(error);
  process.exit(1);
});

worker.postMessage({
  id: 1,
  method: "createFormalGameWithStarterCandidates",
  args: [profile, {mode: "singles", seed: "desktop-formal-worker-smoke"}],
});
