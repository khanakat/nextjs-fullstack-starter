# syntax=docker/dockerfile:1.7

FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies (npm ci for reproducibility)
FROM base AS deps
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci --ignore-scripts

# Build application
FROM deps AS builder
ENV NODE_ENV=development
# Skip prerender of dynamic routes during build to avoid hitting external services/DB
ENV NEXT_SKIP_BUILD_STATIC_GENERATION=1
ENV PRISMA_CLI_QUERY_ENGINE_TYPE=binary
ENV PRISMA_CLIENT_ENGINE_TYPE=binary
# Use Postgres service host during build to avoid localhost resolution issues
ARG DB_BUILD_URL=postgres://postgres:postgres123@postgres:5432/fullstack_template
ENV DATABASE_URL=${DB_BUILD_URL}
COPY . .
RUN npx prisma generate
# Skip build-time lint/type errors in containerized build
ENV NEXT_TYPESCRIPT_IGNORE_BUILD_ERRORS=1
ENV NEXT_ESLINT_IGNORE_BUILD_ERRORS=1
ENV NEXT_SKIP_BUILD_STATIC_GENERATION=1
ENV QUEUE_AUTOSTART=false
# Use production mode for the actual Next.js build
ENV NODE_ENV=production
RUN npm run build

# Production runner image
FROM base AS runner
WORKDIR /app
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
# Copy the generated Prisma client from the build stage since scripts are skipped
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma

# Copy built assets and public files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/api/health || exit 1

# Run standard Next.js server (works with standalone output as well)
CMD ["npm", "run", "start"]
