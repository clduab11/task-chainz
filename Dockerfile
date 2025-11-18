# Multi-stage build for TaskChainz

# Stage 1: Build contracts
FROM node:20-alpine AS contracts-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run compile
RUN npm run build

# Stage 2: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
COPY --from=contracts-builder /app/artifacts ../artifacts
COPY --from=contracts-builder /app/typechain-types ../typechain-types

RUN npm run build

# Stage 3: Production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy built contracts
COPY --from=contracts-builder /app/dist ./dist
COPY --from=contracts-builder /app/artifacts ./artifacts
COPY --from=contracts-builder /app/typechain-types ./typechain-types
COPY --from=contracts-builder /app/contracts ./contracts
COPY --from=contracts-builder /app/package*.json ./

# Copy frontend build
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/

# Install production dependencies only
RUN npm ci --omit=dev
RUN cd frontend && npm ci --omit=dev

# Copy scripts
COPY scripts ./scripts
COPY hardhat.config.ts ./

EXPOSE 3000

CMD ["npm", "run", "frontend:start"]
