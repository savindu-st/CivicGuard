# Multi-stage Dockerfile for Incident Service (Context: ./backend)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace and package manifests
COPY package.json ./
COPY shared/package.json ./shared/
COPY services/incident-service/package.json ./services/incident-service/

# Install dependencies across workspaces
RUN npm install

# Copy source files
COPY shared/ ./shared/
COPY services/incident-service/ ./services/incident-service/

# Build shared library first, then incident-service
RUN npm run build --workspace=shared
RUN npm run build --workspace=@civicguard/incident-service

# Production runner
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY shared/package.json ./shared/
COPY services/incident-service/package.json ./services/incident-service/

RUN npm install --omit=dev

COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/services/incident-service/dist ./services/incident-service/dist

EXPOSE 4001

CMD ["node", "services/incident-service/dist/index.js"]
