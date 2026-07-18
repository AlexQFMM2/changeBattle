# ChangeBattle Battle API Self Hosting

This package runs the ChangeBattle V2 Battle API and Redis room store with Docker Compose. It is intended for players who want to host their own battle server for Desktop or Android clients.

## Requirements

- Docker
- Docker Compose v2
- A machine that can reach the clients over the network

For local testing on the same computer, the default compose file listens on `127.0.0.1:5191`. For another device on the LAN or the public internet, expose the service through your firewall or a reverse proxy.

## Quick Start

```bash
cd docker/battle-api
cp .env.example .env
docker compose up -d changebattle-redis changebattle-battle-api
```

Check health:

```bash
curl -sS http://127.0.0.1:5191/changebattle/battle/health
```

A healthy server returns JSON with `ok:true` and `redis:"ok"`.

The client base URL is:

```text
http://127.0.0.1:5191/changebattle/battle
```

If the server is on another machine, replace `127.0.0.1` with that machine's LAN IP or domain.

## Configuration

Copy `.env.example` to `.env` and edit it before starting the containers.

Important defaults:

```text
CHANGEBATTLE_BATTLE_SERVICE_PORT=5191
CHANGEBATTLE_BATTLE_SERVICE_BASE_PATH=/changebattle/battle
CHANGEBATTLE_BATTLE_SERVICE_PUBLIC_BASE_URL=https://api.65h26i.top/changebattle/battle
CHANGEBATTLE_BATTLE_SERVICE_TOKEN=
CHANGEBATTLE_REDIS_URL=redis://changebattle-redis:6379
```

For public clients, keep `CHANGEBATTLE_BATTLE_SERVICE_TOKEN` empty. ChangeBattle room access is protected by per-room tokens; a global service token is only suitable for private deployments where every client can safely store the secret.

If you expose this server through a domain, set `CHANGEBATTLE_BATTLE_SERVICE_PUBLIC_BASE_URL` to the public base URL, for example:

```text
CHANGEBATTLE_BATTLE_SERVICE_PUBLIC_BASE_URL=https://example.com/changebattle/battle
```

## Desktop and Android Client Setup

In Desktop, open `Network and Offline` settings, choose `Custom server`, and enter:

```text
protocol: http
host: 127.0.0.1
port: 5191
base path: /changebattle/battle
```

For Android on the same LAN, use the server machine's LAN IP instead of `127.0.0.1`. Android cannot use the Desktop embedded offline service.

## Public HTTPS / Nginx

If you publish the server through Nginx, proxy the full `/changebattle/battle/` path without rewriting it. WebSocket upgrade headers are required for room notifications.

```nginx
location /changebattle/battle/ {
    proxy_pass http://127.0.0.1:5191;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
    client_max_body_size 1m;
}
```

After reloading Nginx, verify:

```bash
curl -sS https://example.com/changebattle/battle/health
```

## Operations

View logs:

```bash
docker logs -f changebattle-v2-battle-api
```

Restart:

```bash
docker compose restart changebattle-battle-api
```

Stop:

```bash
docker compose down
```

Optional Loki/Promtail logs:

```bash
docker compose --profile observability up -d changebattle-loki changebattle-promtail
```

## Notes

- Redis is only exposed inside the compose network.
- The default room store is short-lived and optimized for live matches, not long-term cloud saves.
- The Dockerfile builds the API from the repository source. No prebuilt image tar is required for this release package.
