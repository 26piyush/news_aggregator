FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN npm install

COPY apps/api/ ./apps/api/

RUN cd apps/api && npx prisma generate && npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json ./
COPY apps/api/package.json ./apps/api/

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

EXPOSE 5000

CMD ["node", "apps/api/dist/server.js"]
