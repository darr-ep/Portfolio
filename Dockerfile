# Stage 1: Build
FROM node:22-alpine AS builder
RUN npm install -g pnpm@latest
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: Production
FROM node:22-alpine AS runner
RUN npm install -g pnpm@latest
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
EXPOSE 4321
CMD ["node", "dist/server/entry.mjs"]
