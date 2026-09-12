# Multi-stage Dockerfile for Ticket Service (Context: ./backend)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and manifests
COPY package.json ./
COPY shared/package.json ./shared/
COPY services/ticket-service/package.json ./services/ticket-service/

# Install dependencies across workspaces
RUN npm install

# Copy source files
COPY shared/ ./shared/
COPY services/ticket-service/ ./services/ticket-service/

# Build shared library first, then ticket-service
RUN npm run build --workspace=shared
RUN npm run build --workspace=@civicguard/ticket-service

# Production runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--experimental-websocket"

COPY package.json ./
COPY shared/package.json ./shared/
COPY services/ticket-service/package.json ./services/ticket-service/

RUN npm install --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/ticket-service/dist ./services/ticket-service/dist

EXPOSE 4002

CMD ["node", "services/ticket-service/dist/index.js"]
