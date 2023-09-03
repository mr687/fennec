FROM node:20-alpine as base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./

FROM base as prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Build stage
FROM base as build
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

# Production state
FROM base as server

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST="0.0.0.0"

ENV LOG_LEVEL=debug
ENV LOG_PRETTY=false

RUN addgroup --system --gid 1001 mr687
RUN adduser --system --uid 1001 fennec
COPY --from=prod-deps --chown=fennec:mr687 /app/node_modules ./node_modules
COPY --from=build --chown=fennec:mr687 /app/dist ./
USER fennec
EXPOSE 3000
CMD ["node", "server.js"]