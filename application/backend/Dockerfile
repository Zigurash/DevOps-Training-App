# Build stage
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Production dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY prisma ./prisma
RUN npx prisma generate

# Runtime
FROM node:22-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache wget \
  && addgroup -S app && adduser -S app -G app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=3000

USER app
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health/live || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
