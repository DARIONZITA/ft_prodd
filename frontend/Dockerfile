# Stage 1: Base
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl

# Stage 2: Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps && npm cache clean --force

# Stage 3: Development Dependencies
FROM base AS dev-deps
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Stage 4: Development
FROM base AS development
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

# Stage 5: Builder
FROM base AS builder
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 6: Production (Serve with nginx)
FROM nginx:alpine AS production
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Default to development
FROM development
