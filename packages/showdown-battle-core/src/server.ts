import http from "node:http";
import {createInMemoryBattleService} from "./index.js";

const service = createInMemoryBattleService();
const port = Number(process.env.CHANGEBATTLE_BATTLE_SERVICE_PORT || process.env.PORT || 5191);
const host = process.env.CHANGEBATTLE_BATTLE_SERVICE_HOST || "127.0.0.1";

const server = http.createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "content-type");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, {ok: true, service: "changebattle-v2-battle-service"});
      return;
    }
    if (request.method === "POST" && url.pathname === "/sessions") {
      const input = await readJson(request);
      sendJson(response, 200, await service.createBattleSession(input));
      return;
    }
    const sessionMatch = /^\/sessions\/([^/]+)$/.exec(url.pathname);
    const choiceMatch = /^\/sessions\/([^/]+)\/choice$/.exec(url.pathname);
    const trainerItemMatch = /^\/sessions\/([^/]+)\/trainer-item$/.exec(url.pathname);
    if (request.method === "GET" && sessionMatch) {
      sendJson(response, 200, await service.getSnapshot(decodeURIComponent(sessionMatch[1]!)));
      return;
    }
    if (request.method === "DELETE" && sessionMatch) {
      await service.closeSession(decodeURIComponent(sessionMatch[1]!));
      sendJson(response, 200, {ok: true});
      return;
    }
    if (request.method === "POST" && choiceMatch) {
      const body = await readJson(request);
      sendJson(response, 200, await service.submitChoice({
        sessionId: decodeURIComponent(choiceMatch[1]!),
        playerId: body.playerId,
        choice: body.choice,
      }));
      return;
    }
    if (request.method === "POST" && trainerItemMatch) {
      const body = await readJson(request);
      sendJson(response, 200, await service.submitTrainerItem({
        sessionId: decodeURIComponent(trainerItemMatch[1]!),
        playerId: body.playerId,
        choice: body.choice,
        trainerItems: body.trainerItems || [],
      }));
      return;
    }
    sendJson(response, 404, {error: "not_found"});
  } catch (error) {
    sendJson(response, 500, {error: error instanceof Error ? error.message : String(error)});
  }
});

server.listen(port, host, () => {
  console.log(`Battle service listening at http://${host}:${port}`);
});

function sendJson(response: http.ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, {"content-type": "application/json; charset=utf-8"});
  response.end(JSON.stringify(value));
}

async function readJson(request: http.IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}
