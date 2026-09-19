# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build

# --- Production stage ---
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# pg_dump is needed for the /export/backup endpoint
# openssl is needed for Prisma's query engine on Alpine
RUN apk add --no-cache postgresql-client openssl

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
COPY openapi.yaml ./openapi.yaml

EXPOSE 4000
CMD ["node", "dist/index.js"]