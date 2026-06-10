#!/usr/bin/env node
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(desktopRoot, "../..");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const userDataDir = mkdtempSync(path.join(tmpdir(), "changebattle-electron-e2e-"));
const port = String(Number(process.env.CHANGEBATTLE_E2E_REMOTE_DEBUGGING_PORT || 9300) + Math.floor(Math.random() * 1000));
const debugBaseUrl = `http://127.0.0.1:${port}`;
const childLogs = [];
let electronProcess = null;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function rememberLog(chunk) {
  const text = chunk.toString();
  childLogs.push(text);
  if (childLogs.length > 120) childLogs.splice(0, childLogs.length - 120);
  process.stdout.write(text);
}

async function waitFor(label, probe, timeoutMs = 60000) {
  const started = Date.now();
  let lastError = null;
  while (Date.now() - started < timeoutMs) {
    try {
      const value = await probe();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  const logTail = childLogs.join("").split("\n").slice(-80).join("\n");
  throw new Error(`等待 ${label} 超时。${lastError ? `最后错误：${lastError.message}` : ""}\nElectron 日志尾部：\n${logTail}`);
}

function startElectron() {
  const env = {
    ...process.env,
    CHANGEBATTLE_E2E: "1",
    CHANGEBATTLE_E2E_USER_DATA_DIR: userDataDir,
    CHANGEBATTLE_E2E_REMOTE_DEBUGGING_PORT: port,
    CHANGEBATTLE_LOG_DIR: path.join(userDataDir, "logs"),
    CHANGEBATTLE_PROJECT_ROOT: repoRoot,
  };
  delete env.ELECTRON_RUN_AS_NODE;
  delete env.ELECTRON_NO_ATTACH_CONSOLE;

  electronProcess = spawn(pnpm, ["--filter", "@changebattle/desktop", "e2e:electron"], {
    cwd: repoRoot,
    env,
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });
  electronProcess.stdout.on("data", rememberLog);
  electronProcess.stderr.on("data", rememberLog);
  electronProcess.on("exit", (code, signal) => {
    if (code && code !== 0) childLogs.push(`[electron exited code=${code} signal=${signal || ""}]\n`);
  });
}

async function findDebugPage() {
  const response = await fetch(`${debugBaseUrl}/json`);
  if (!response.ok) throw new Error(`remote debugging returned ${response.status}`);
  const pages = await response.json();
  return pages.find(page => page.type === "page" && page.webSocketDebuggerUrl);
}

function browserWebSocketFromLogs() {
  const match = childLogs.join("").match(/DevTools listening on (ws:\/\/[^\s]+)/);
  return match?.[1] || null;
}

class CdpClient {
  constructor(wsUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.socket = new WebSocket(wsUrl);
    this.opened = new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, {once: true});
      this.socket.addEventListener("error", () => reject(new Error("WebSocket 连接失败")), {once: true});
    });
    this.socket.addEventListener("message", event => {
      const raw = typeof event.data === "string" ? event.data : Buffer.from(event.data).toString("utf8");
      const message = JSON.parse(raw);
      if (!message.id) return;
      const callbacks = this.pending.get(message.id);
      if (!callbacks) return;
      this.pending.delete(message.id);
      if (message.error) callbacks.reject(new Error(`${message.error.message || "CDP error"} ${message.error.data || ""}`.trim()));
      else callbacks.resolve(message.result || {});
    });
    this.socket.addEventListener("close", () => {
      for (const callbacks of this.pending.values()) callbacks.reject(new Error("CDP WebSocket 已关闭"));
      this.pending.clear();
    });
  }

  async send(method, params = {}, sessionId = undefined) {
    await this.opened;
    const id = this.nextId++;
    const payload = JSON.stringify({id, method, params, ...(sessionId ? {sessionId} : {})});
    return new Promise((resolve, reject) => {
      this.pending.set(id, {resolve, reject});
      this.socket.send(payload);
    });
  }

  close() {
    try {
      this.socket.close();
    } catch {
      // Best-effort cleanup.
    }
  }
}

async function connectToElectronPage() {
  const target = await waitFor("Electron CDP target", async () => {
    const page = await findDebugPage().catch(() => null);
    if (page?.webSocketDebuggerUrl) return {kind: "page", webSocketDebuggerUrl: page.webSocketDebuggerUrl};
    const browserWebSocketDebuggerUrl = browserWebSocketFromLogs();
    if (browserWebSocketDebuggerUrl) return {kind: "browser", webSocketDebuggerUrl: browserWebSocketDebuggerUrl};
    return null;
  });
  const client = new CdpClient(target.webSocketDebuggerUrl);
  await client.opened;
  if (target.kind === "page") return {client, sessionId: undefined};
  const pageTarget = await waitFor("Electron page target", async () => {
    const targets = await client.send("Target.getTargets");
    return targets.targetInfos?.find(entry => entry.type === "page" && !entry.url.startsWith("devtools://")) || null;
  });
  const attached = await client.send("Target.attachToTarget", {targetId: pageTarget.targetId, flatten: true});
  return {client, sessionId: attached.sessionId};
}

async function evaluate(client, sessionId, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }, sessionId);
  if (result.exceptionDetails) {
    const details = result.exceptionDetails.exception?.description || result.exceptionDetails.text || "页面脚本执行失败";
    throw new Error(details);
  }
  return result.result?.value;
}

async function apiEval(client, sessionId, body) {
  return evaluate(client, sessionId, `(async () => {
    const api = window.changeBattle;
    if (!api) throw new Error("window.changeBattle 尚未注入");
    ${body}
  })()`);
}

function nodeLevel(config, id) {
  return Number(config.star_chart?.nodes?.[id] || 0);
}

function talentLevel(run, id) {
  return Number((run.talents || []).find(talent => talent.id === id)?.level || 0);
}

async function resetSave(client, sessionId, name = "Electron E2E") {
  return apiEval(client, sessionId, `
    await api.deleteSave();
    await api.createNewSave({name: ${JSON.stringify(name)}, gender: "other"});
    await api.enableTestMode();
    await api.cancelPreparation();
    const config = await api.getTalentConfig();
    return {
      catalog: config.catalog.map(node => ({id: node.id, level: node.level || 0, kind: node.kind || "talent"})),
      unlocked: config.unlocked.map(node => ({id: node.id, level: node.level || 0})),
      star_chart: config.star_chart,
      bp: config.save?.stats?.battle_points || 0,
    };
  `);
}

async function unlock(client, sessionId, id, count = 1) {
  return apiEval(client, sessionId, `
    let config = null;
    for (let index = 0; index < ${Number(count)}; index += 1) {
      config = await api.unlockTalent(${JSON.stringify(id)});
    }
    config = config || await api.getTalentConfig();
    return {
      unlocked: config.unlocked.map(node => ({id: node.id, level: node.level || 0})),
      star_chart: config.star_chart,
      bp: config.save?.stats?.battle_points || 0,
    };
  `);
}

async function startRun(client, sessionId, seed = 246810) {
  return apiEval(client, sessionId, `
    await api.prepareCandidates(${Number(seed)});
    const state = await api.beginChallenge([0, 1, 2], ${Number(seed)}, 7);
    const run = state.save?.current_run;
    return {
      screen: state.screen,
      message: state.message || "",
      rest: state.rest ? {
        shop_slot_count: state.rest.shop?.slot_count || null,
        move_draw_counts: Object.fromEntries(Object.entries(state.rest.move_draws || {}).map(([slot, moves]) => [slot, moves.length])),
        trust_level_used: Boolean(state.rest.trust_level_used),
      } : null,
      run: run ? {
        status: run.status,
        coins: run.coins,
        non_convertible_coins: run.non_convertible_coins,
        talents: (run.talents || []).map(talent => ({id: talent.id, level: talent.level || 1})),
      } : null,
    };
  `);
}

async function main() {
  startElectron();
  const {client, sessionId} = await connectToElectronPage();
  await client.send("Runtime.enable", {}, sessionId);
  await waitFor("window.changeBattle", async () => evaluate(client, sessionId, "Boolean(window.changeBattle?.createNewSave)"));

  const initial = await resetSave(client, sessionId);
  assert.equal(initial.bp, 99999, "测试模式应注入 BP");
  assert.deepEqual(initial.unlocked, [{id: "root_trainer_star", level: 1}], "新存档默认只点亮星核");
  assert.equal(initial.catalog.some(node => node.kind === "event_preview"), false, "奇遇预留节点不应进入星图 catalog");

  const fundLv1 = await unlock(client, sessionId, "starter_angel_fund", 1);
  assert.equal(nodeLevel(fundLv1, "starter_angel_fund"), 1, "天使基金 Lv1 应写入星图");
  const fundLv1Run = await startRun(client, sessionId, 1001);
  assert.equal(fundLv1Run.screen, "rest", "开局后应进入休整页");
  assert.equal(talentLevel(fundLv1Run.run, "starter_angel_fund"), 1, "本局 talents 应来自星图 Lv1");
  assert.equal(fundLv1Run.run.coins, 300, "天使基金 Lv1 开局金币应为 300");
  assert.equal(fundLv1Run.run.non_convertible_coins, 300, "天使基金 Lv1 不可折算金币应为 300");

  await resetSave(client, sessionId, "Electron E2E Lv3");
  await unlock(client, sessionId, "starter_angel_fund", 3);
  const fundLv3Run = await startRun(client, sessionId, 1002);
  assert.equal(talentLevel(fundLv3Run.run, "starter_angel_fund"), 3, "本局 talents 应保留星图等级");
  assert.equal(fundLv3Run.run.coins, 1000, "天使基金 Lv3 开局金币应为 1000");
  assert.equal(fundLv3Run.run.non_convertible_coins, 1000, "天使基金 Lv3 不可折算金币应为 1000");

  await resetSave(client, sessionId, "Electron E2E Starter");
  await unlock(client, sessionId, "pokemon_reroll", 1);
  const starterState = await apiEval(client, sessionId, `
    const state = await api.prepareStarterItems(2001);
    return {
      screen: state.screen,
      whole_rerolls_remaining: state.starter?.whole_rerolls_remaining ?? null,
      single_rerolls_remaining: state.starter?.single_rerolls_remaining ?? null,
      inspect_count: state.starter?.inspect_count ?? null,
    };
  `);
  assert.equal(starterState.whole_rerolls_remaining, 1, "星图整体重随 Lv1 应给 1 次整体重随");
  assert.equal(starterState.single_rerolls_remaining, 0, "未点亮单只重随时不应获得次数");
  assert.equal(starterState.inspect_count, 0, "验牌次数应废弃为 0");

  await resetSave(client, sessionId, "Electron E2E Growth");
  await unlock(client, sessionId, "growth_more_choices", 1);
  await unlock(client, sessionId, "exchange_trust", 3);
  await unlock(client, sessionId, "badge_level_cap", 2);
  const growthRun = await startRun(client, sessionId, 1003);
  assert.equal(talentLevel(growthRun.run, "growth_more_choices"), 1, "顺手牵羊应进入本局 talents");
  assert.equal(talentLevel(growthRun.run, "exchange_trust"), 3, "不负信赖 Lv3 应进入本局 talents");
  assert.equal(talentLevel(growthRun.run, "badge_level_cap"), 2, "徽章权限 Lv2 应进入本局 talents");

  await resetSave(client, sessionId, "Electron E2E Legacy");
  const legacy = await apiEval(client, sessionId, `
    await api.e2ePatchSave({
      star_chart: {nodes: {root_trainer_star: 1}},
      talent_unlocks: [],
      talent_equipped: ["starter_angel_fund", "growth_more_choices", "exchange_trust"],
      starter_upgrades: {
        item_quality: {battle: 4, recovery: 4, berry: 4, tm: 4},
        item_quantity: {battle: 4, recovery: 4, berry: 4, tm: 4},
        pokemon_reroll: 4,
        pokemon_single_reroll: 4,
        pokemon_inspect: 6,
      },
    });
    const config = await api.getTalentConfig();
    const starter = await api.prepareStarterItems(3001);
    await api.prepareCandidates(3001);
    const state = await api.beginChallenge([0, 1, 2], 3001, 7);
    const run = state.save?.current_run;
    return {
      unlocked: config.unlocked.map(node => ({id: node.id, level: node.level || 0})),
      starter: {
        whole_rerolls_remaining: starter.starter?.whole_rerolls_remaining ?? null,
        single_rerolls_remaining: starter.starter?.single_rerolls_remaining ?? null,
        inspect_count: starter.starter?.inspect_count ?? null,
      },
      run: run ? {
        coins: run.coins,
        non_convertible_coins: run.non_convertible_coins,
        talents: (run.talents || []).map(talent => ({id: talent.id, level: talent.level || 1})),
      } : null,
    };
  `);
  assert.deepEqual(legacy.unlocked, [{id: "root_trainer_star", level: 1}], "旧 talent_equipped 不应点亮星图");
  assert.equal(talentLevel(legacy.run, "starter_angel_fund"), 0, "旧 talent_equipped 不应进入本局 talents");
  assert.equal(legacy.run.coins, 0, "未点亮天使基金时开局金币应为 0");
  assert.equal(legacy.run.non_convertible_coins, 0, "旧天赋槽不应产生不可折算金币");
  assert.equal(legacy.starter.whole_rerolls_remaining, 0, "显式星图下旧整备整体重随不应生效");
  assert.equal(legacy.starter.single_rerolls_remaining, 0, "显式星图下旧整备单只重随不应生效");
  assert.equal(legacy.starter.inspect_count, 0, "旧 pokemon_inspect 不应恢复验牌");

  client.close();
  console.log("[electron-star-chart-e2e] passed");
}

try {
  await main();
} finally {
  if (electronProcess && !electronProcess.killed) {
    electronProcess.kill("SIGTERM");
    await sleep(1000);
    if (!electronProcess.killed) electronProcess.kill("SIGKILL");
  }
  rmSync(userDataDir, {recursive: true, force: true});
}
