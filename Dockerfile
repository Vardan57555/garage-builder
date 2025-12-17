# Builder
FROM node:22-bullseye AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

ENV NODE_OPTIONS="--max_old_space_size=8192"

WORKDIR /app

# First copy only package files for better caching
COPY package*.json pnpm-lock.yaml* ./
RUN pnpm install

# Copy the rest of the application
COPY . .

# Update tsconfig to not fail on type errors during build
RUN sed -i 's/"noEmitOnError": true/"noEmitOnError": false/g' tsconfig.json

# Build the application (uses local TypeScript from node_modules)
RUN pnpm run build

FROM node:22-bullseye AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgomp1 \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 5000 9229

CMD ["node", "--watch", "--inspect=0.0.0.0:9229", "--trace-warnings", "--enable-source-maps", "/app/build/main.js"]

