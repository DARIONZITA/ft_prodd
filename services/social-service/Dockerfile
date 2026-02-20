# Stage 1: Base
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

# Stage 2: Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 3: Development Dependencies
FROM base AS dev-deps
COPY package*.json ./
RUN npm ci

# Stage 4: Development
FROM base AS development
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3003
CMD ["npm", "run", "dev"]

# Stage 5: Builder
FROM base AS builder
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 6: Production
FROM base AS production
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
EXPOSE 3003
CMD ["node", "dist/index.js"]

# Default to development
FROM development
