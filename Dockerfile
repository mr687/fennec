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

ENV NO_COLOR=true
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST="0.0.0.0"

ENV LOG_LEVEL=debug
ENV LOG_PRETTY=false

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./

EXPOSE 3000
CMD ["node", "server.js"]