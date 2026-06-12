# Install dependencies only when needed
FROM node:25.8.0-alpine3.23 AS deps

ARG npm_token

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN npm config set registry https://inmobiartifactory.jfrog.io/artifactory/api/npm/npm-virtual && npm config set '//inmobiartifactory.jfrog.io/artifactory/api/npm/:_authToken' "${npm_token}"
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


# Rebuild the source code only when needed
FROM node:25.8.0-alpine3.23 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG SENTRY_AUTH_TOKEN

#RUN npm build
RUN SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN} npm run build

# Production image, copy all the files and run next
FROM node:25.8.0-alpine3.23 AS runner
WORKDIR /app
ENV NODE_ENV production
RUN apk upgrade --no-cache
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 lp-svelte
COPY --from=builder /app/package.json .
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
USER lp-svelte
EXPOSE 8080
ENV PORT 8080
HEALTHCHECK --retries=5 --interval=1m --timeout=10s CMD curl -f http://localhost:8080 || exit 1
CMD ["node", "build"]