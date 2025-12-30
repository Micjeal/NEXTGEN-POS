# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
`34
# Enable corepack and install pnpm
RUN corepack enable
RUN corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies - first try with frozen lockfile, if that fails, update the lockfile
RUN pnpm install --frozen-lockfile --prod=false || \
    (echo "Lockfile is outdated, updating..." && pnpm install --prod=false)

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy built assets and dependencies from builder
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Install production dependencies only
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    (pnpm install --frozen-lockfile --prod || pnpm install --prod) && \
    rm -rf /root/.cache /root/.npm /tmp/*

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Start the application
CMD ["node", "server.js"]