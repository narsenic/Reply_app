FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package files
COPY client/package.json client/
COPY server/package.json server/

# Install all dependencies
RUN npm ci

# Copy source code
COPY client/ client/
COPY server/ server/

# Build client (Vite outputs to server/public/)
RUN npm run build --workspace=client

# Build server (TypeScript to server/dist/)
RUN npm run build --workspace=server

# Generate Prisma client
RUN npx prisma generate --schema=server/prisma/schema.prisma

# --- Production stage ---
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/

RUN npm ci --omit=dev

# Copy Prisma schema and migrations
COPY server/prisma/ server/prisma/

# Generate Prisma client in production
RUN npx prisma generate --schema=server/prisma/schema.prisma

# Copy built assets from builder
COPY --from=builder /app/server/dist/ server/dist/
COPY --from=builder /app/server/public/ server/public/

EXPOSE 3001

ENV PORT=3001
ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy --schema=server/prisma/schema.prisma && node server/dist/index.js"]
