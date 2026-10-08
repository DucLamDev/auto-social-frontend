# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.10.1 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS builder
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_APP_NAME="Social Publisher"
ARG NEXT_PUBLIC_POLL_INTERVAL_MS=10000
ARG NEXT_PUBLIC_DEFAULT_DISCOURSE_URL=""
ARG NEXT_PUBLIC_DEFAULT_DISCOURSE_USERNAME=""
ARG NEXT_PUBLIC_DEFAULT_DISCOURSE_CATEGORY_ID=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_POLL_INTERVAL_MS=$NEXT_PUBLIC_POLL_INTERVAL_MS
ENV NEXT_PUBLIC_DEFAULT_DISCOURSE_URL=$NEXT_PUBLIC_DEFAULT_DISCOURSE_URL
ENV NEXT_PUBLIC_DEFAULT_DISCOURSE_USERNAME=$NEXT_PUBLIC_DEFAULT_DISCOURSE_USERNAME
ENV NEXT_PUBLIC_DEFAULT_DISCOURSE_CATEGORY_ID=$NEXT_PUBLIC_DEFAULT_DISCOURSE_CATEGORY_ID
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "server.js"]
