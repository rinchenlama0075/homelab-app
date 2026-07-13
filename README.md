# Homelab sites (monorepo)

One git repo, many independent Docker Compose projects. Each site lives under `sites/<name>/` with its own `Dockerfile` and `docker-compose.yml`, and is served on its own domain via Caddy + Cloudflare.

| Site | Folder | Port (host) | Domain |
|------|--------|-------------|--------|
| Personal portfolio (React + MUI) + minimal social app | [`sites/personal`](sites/personal) | 3001 | `rinchen.co` |

`sites/personal` is four Docker services sharing one compose project: `web` (the CRA build, served
by nginx, the only one bound to a host port), `api` (Node/Express + SQLite powering the `/social`
feature — accounts, photo posts, likes, comments), `admin` (a private, host-gated dashboard for
deployment status/logs — see below), and `docker-proxy` (a locked-down, read-only view of the
Docker API that only `admin` can reach). nginx proxies `/api/*` to `api` over the internal Docker
network, so the social feature ships on the same domain with no extra Caddy/Cloudflare setup.
See [`sites/personal/server/README.md`](sites/personal/server/README.md) for API details.

### Admin dashboard (private — never on `rinchen.co`)

A password-protected dashboard at `https://admin.rinchen.co` for checking deployment status and
tailing container logs from anywhere, including a phone. It's a **separate nginx `server{}` block**
(matched by `Host`) from the public site — there is no path on `rinchen.co` that reaches it. See
[`sites/personal/admin/README.md`](sites/personal/admin/README.md) for the API/env vars and
[`infra/README.md`](infra/README.md) for how deploy/health status gets there.

## Layout

```
sites/
  <name>/
    Dockerfile
    docker-compose.yml
    …app source…
infra/
  poller.sh, deploy-site.sh, register-site.sh, sites.json, monitoring/, caddy/, scripts/
  # the deployment pipeline itself — see infra/README.md
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

The homelab **poller** (~2 min) pulls this repo and runs [`infra/deploy-site.sh`](infra/deploy-site.sh)
for every site in [`infra/sites.json`](infra/sites.json), which runs `docker compose` from
`sites/<site-name>/`. Each registered site shares this git URL but has its own name, port, and
domain. The poller, deploy script, site registry, and Caddy config all live in-repo under
[`infra/`](infra) — see [`infra/README.md`](infra/README.md), including how a tiny outside-repo
bootstrap stub keeps the pipeline able to update itself safely.

Public HTTPS: Cloudflare Proxied + SSL Flexible → origin HTTP :80 → Caddy → `localhost:<port>`.

## Adding a new site

1. Create `sites/<name>/` with app source, `Dockerfile`, and `docker-compose.yml` binding a free host port (e.g. `127.0.0.1:3002:80`).
2. Register it: `bash infra/register-site.sh <name> <domain> <port>` (adds it to `infra/sites.json` and prints the Caddy block to add to `infra/caddy/Caddyfile`).
3. On the server: reload Caddy (`bash infra/scripts/reload-caddy.sh`).
4. In Cloudflare: A `@` → home public IP, Proxied, SSL Flexible.
5. Push to `main`; poller redeploys.

Coordinate server changes in [Server-Dev-chat.md](Server-Dev-chat.md).
