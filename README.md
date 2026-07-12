# Homelab sites (monorepo)

One git repo, many independent Docker Compose projects. Each site lives under `sites/<name>/` with its own `Dockerfile` and `docker-compose.yml`, and is served on its own domain via Caddy + Cloudflare.

| Site | Folder | Port (host) | Domain |
|------|--------|-------------|--------|
| Personal portfolio (React + MUI) | [`sites/personal`](sites/personal) | 3001 | `rinchen.co` |

## Layout

```
sites/
  <name>/
    Dockerfile
    docker-compose.yml
    …app source…
```

## Local development (personal)

```bash
cd sites/personal
npm install
npm start
# http://localhost:3000
```

## Docker (one site)

```bash
cd sites/personal
docker compose up --build
# http://127.0.0.1:3001
```

## Deploy model

The homelab **poller** (~2 min) pulls this repo and runs `docker compose` from `sites/<site-name>/`. Each registered site shares this git URL but has its own name, port, and domain.

Public HTTPS: Cloudflare Proxied + SSL Flexible → origin HTTP :80 → Caddy → `localhost:<port>`.

## Adding a new site

1. Create `sites/<name>/` with app source, `Dockerfile`, and `docker-compose.yml` binding a free host port (e.g. `127.0.0.1:3002:80`).
2. On the server: register the site (same git URL, new name/port/domain), add a Caddy `http://your-domain` → `localhost:<port>` block, reload Caddy.
3. In Cloudflare: A `@` → home public IP, Proxied, SSL Flexible.
4. Push to `main`; poller redeploys.

Coordinate server changes in [Server-Dev-chat.md](Server-Dev-chat.md).
