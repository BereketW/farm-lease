FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm turbo

FROM base AS pruner
COPY . .
RUN turbo prune --scope=@farm-lease/web --scope=@farm-lease/server --scope=@farm-lease/db --docker

FROM base AS builder
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter @farm-lease/db db:generate
RUN turbo run build --scope=@farm-lease/web --scope=@farm-lease/server --scope=@farm-lease/db

# Runner Stage: Server
FROM node:20-alpine AS server-runner
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json .
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]

# Runner Stage: Web
FROM node:20-alpine AS web-runner
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/package.json .
COPY --from=builder /app/node_modules ./node_modules
CMD ["pnpm", "start"]
