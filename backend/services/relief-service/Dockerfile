# Multi-stage Dockerfile for Relief Service (Context: ./backend)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and manifests
COPY package.json ./
COPY shared/package.json ./shared/
COPY services/relief-service/package.json ./services/relief-service/

# Install dependencies across workspaces
RUN npm install

# Copy source files
COPY shared/ ./shared/
COPY services/relief-service/ ./services/relief-service/

# Build shared library first, then relief-service
RUN npm run build --workspace=shared
RUN npm run build --workspace=@civicguard/relief-service

# Production runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--experimental-websocket"

COPY package.json ./
COPY shared/package.json ./shared/
COPY services/relief-service/package.json ./services/relief-service/

RUN npm install --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/relief-service/dist ./services/relief-service/dist

EXPOSE 4004

CMD ["node", "services/relief-service/dist/index.js"]
