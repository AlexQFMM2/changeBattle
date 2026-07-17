ARG BATTLE_API_BASE_IMAGE=node:22-bookworm-slim
FROM ${BATTLE_API_BASE_IMAGE}

USER root

WORKDIR /app

ENV CHANGEBATTLE_BATTLE_SERVICE_HOST=0.0.0.0
ENV CHANGEBATTLE_BATTLE_SERVICE_PORT=5191
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
ENV CI=true

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile \
  && pnpm --filter @changebattle-v2/core build \
  && pnpm --filter @changebattle-v2/showdown-dex-core build \
  && pnpm --filter @changebattle-v2/showdown-battle-core build \
  && pnpm --filter @changebattle-v2/api build

ENV NODE_ENV=production

EXPOSE 5191

CMD ["pnpm", "--filter", "@changebattle-v2/api", "start"]
