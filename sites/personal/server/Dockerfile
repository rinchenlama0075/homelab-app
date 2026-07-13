FROM node:22-alpine

WORKDIR /app

# better-sqlite3 ships prebuilt binaries for common platforms, but falls back to
# compiling from source if none match — keep the toolchain around just in case.
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV DATA_DIR=/app/data
EXPOSE 4000

CMD ["node", "index.js"]
