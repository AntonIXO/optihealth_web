# Use the official Bun image
# Pin a version for reproducibility (adjust as needed)
FROM oven/bun:1.1.34 AS base
WORKDIR /usr/src/app

# Install dependencies into temp directories to leverage caching
FROM base AS install
RUN mkdir -p /temp/dev
COPY next.config.ts postcss.config.mjs tsconfig.json package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Production-only dependencies
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Build
FROM base AS prerelease
# Pass Supabase env to the build stage
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
COPY --from=install /temp/dev/node_modules node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

# Runtime image
FROM base AS release
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Production deps only
COPY --from=install /temp/prod/node_modules node_modules

# Only what the server needs at runtime
COPY --from=prerelease --chown=bun:bun /usr/src/app/.next ./.next
COPY --from=prerelease --chown=bun:bun /usr/src/app/public ./public
COPY --from=prerelease --chown=bun:bun /usr/src/app/package.json ./package.json

USER bun
EXPOSE 3000
# Use the script to start; equivalent to `next start`
CMD ["bun", "run", "start"]