# Multi-stage Dockerfile for Notification Service (Context: ./backend)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and manifests
COPY package.json ./
COPY shared/package.json ./shared/
COPY services/notification-service/package.json ./services/notification-service/

# Install dependencies across workspaces
RUN npm install

# Copy source files
COPY shared/ ./shared/
COPY services/notification-service/ ./services/notification-service/

# Build shared library first, then notification-service
RUN npm run build --workspace=shared
RUN npm run build --workspace=@civicguard/notification-service

# Production runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--experimental-websocket"

COPY package.json ./
COPY shared/package.json ./shared/
COPY services/notification-service/package.json ./services/notification-service/

RUN npm install --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist

EXPOSE 4003

CMD ["node", "services/notification-service/dist/index.js"]
