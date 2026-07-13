# Admin API

Private, host-gated Express service backing the admin dashboard at `https://admin.rinchen.co`.
It is **never** reachable on `rinchen.co` — nginx only proxies to it from the `admin.rinchen.co`
`server{}` block (see [`../nginx.conf`](../nginx.conf)), and this service double-checks the `Host`
header itself as a second, independent layer (see [`middleware/adminAuth.js`](middleware/adminAuth.js)).

Runs as the `admin` service in [`../docker-compose.yml`](../docker-compose.yml). It has **no host
port** — only reachable on the internal compose network — and talks to Docker only through the
locked-down, read-only [`docker-proxy`](https://github.com/Tecnativa/docker-socket-proxy) service,
never a raw socket mount.

## Local development

```bash
npm install
ADMIN_HOST=localhost ADMIN_PASSWORD_HASH=$(node -e "console.log(require('bcryptjs').hashSync('test',10))") \
  npm start   # listens on http://localhost:4001 (override with PORT)
```

Without a real `docker-proxy` running alongside it, `/api/status` / `/api/containers` /
`/api/containers/:name/logs` will return `502`s — that's expected locally; `/api/login`,
`/api/session`, and `/api/deploys` / `/api/health-history` (both degrade to empty results without
their state mount) work standalone.

## Environment variables

| Variable             | Default                    | Notes                                                            |
|-----------------------|----------------------------|-------------------------------------------------------------------|
| `PORT`                | `4001`                     | HTTP port the API listens on.                                     |
| `ADMIN_HOST`          | `admin.rinchen.co`         | Required `Host`/`X-Forwarded-Host` for every route except `/api/health`. Any other host gets a plain `404`. |
| `ADMIN_PASSWORD_HASH` | *(none — login disabled)*  | bcrypt hash of the admin password. **Must** be set in production. Generate with `node -e "console.log(require('bcryptjs').hashSync('yourpassword',10))"`. |
| `ADMIN_JWT_SECRET`    | `dev-admin-secret-change-me` | Signs the `admin_token` session cookie. **Must** be overridden in production, separate from the social app's `JWT_SECRET`. |
| `DOCKER_PROXY_URL`    | `http://docker-proxy:2375` | Base URL of the `docker-proxy` service. |
| `COMPOSE_PROJECT`     | `personal`                 | Only containers labeled `com.docker.compose.project=<this>` are ever listed/logged. |
| `STATE_DIR`           | `/app/state`                | Read-only mount of `/srv/homelab/state` on the host — populated by `infra/deploy-site.sh` and `infra/monitoring/check-health.sh`. Missing mount/files degrade gracefully to empty results, not errors. |

## API

All routes are mounted under `/api`. Every route except `/login`, `/session`, and `/health`
requires a valid `admin_token` session cookie (`401` otherwise); every route except `/health`
requires the correct `Host` header (`404` otherwise).

| Method | Path                              | Auth | Description                                                          |
|--------|------------------------------------|------|------------------------------------------------------------------------|
| GET    | `/api/health`                      | —    | Plain `ok` — used by Docker's own `HEALTHCHECK`, not host-gated.       |
| POST   | `/api/login`                       | —    | `{ password }`, rate-limited (10/15min per IP) → sets session cookie   |
| POST   | `/api/logout`                      | —    | Clears the session cookie                                              |
| GET    | `/api/session`                     | —    | `{ authenticated: boolean }`                                            |
| GET    | `/api/status`                      | yes  | Process uptime/version + live container list                          |
| GET    | `/api/containers`                  | yes  | Live container list for this compose project (name/state/image/etc.)   |
| GET    | `/api/containers/:name/logs`       | yes  | `?tail=200` (max 1000) — demuxed stdout+stderr log tail, `text/plain`   |
| GET    | `/api/deploys`                     | yes  | Parsed `STATE_DIR/*.json` deploy status written by `infra/deploy-site.sh` |
| GET    | `/api/health-history`              | yes  | Last 200 lines of `STATE_DIR/health.jsonl` written by `infra/monitoring/check-health.sh` |

## Production

Set real secrets via the same `sites/personal/.env` file the social feature already uses (git-ignored):

```bash
echo "ADMIN_JWT_SECRET=$(openssl rand -hex 32)" >> ../.env
echo "ADMIN_PASSWORD_HASH=$(node -e "console.log(require('bcryptjs').hashSync('yourpassword',10))")" >> ../.env
```

See [Server-Dev-chat.md](../../../Server-Dev-chat.md) for the Caddy/Cloudflare/DNS steps needed
once this ships, and [`../../../infra/README.md`](../../../infra/README.md) for how deploy/health
state ends up in `STATE_DIR`.
